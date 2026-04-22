import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite

from app.database import get_db
from app.auth import get_current_user, require_internal
from app.models.review import (
    ReviewUpsert, ReviewOut, CommentCreate, CommentOut,
    DEFAULT_RUBRIC
)

router = APIRouter(prefix="/calls", tags=["reviews"])


async def _get_review_row(db: aiosqlite.Connection, call_id: str, schema: str):
    async with db.execute(
        "SELECT * FROM qa_reviews WHERE call_id = ? AND schema = ?",
        (call_id, schema),
    ) as cur:
        return await cur.fetchone()


async def _get_comments(db: aiosqlite.Connection, call_id: str, schema: str) -> list[CommentOut]:
    async with db.execute(
        """SELECT id, call_id, schema, text, timestamp_anchor, author, created_at
           FROM qa_comments WHERE call_id = ? AND schema = ?
           ORDER BY created_at""",
        (call_id, schema),
    ) as cur:
        rows = await cur.fetchall()
    return [CommentOut(**dict(r)) for r in rows]


@router.get("/{call_id}/review", response_model=ReviewOut)
async def get_review(
    call_id: str,
    schema: str = Query(...),
    _user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    row = await _get_review_row(db, call_id, schema)
    comments = await _get_comments(db, call_id, schema)

    if row is None:
        return ReviewOut(
            call_id=call_id,
            schema=schema,
            overall_score=None,
            rubric=DEFAULT_RUBRIC,
            reviewed_by=None,
            reviewed_at=None,
            qa_status="unreviewed",
            comments=comments,
        )
    return ReviewOut.from_row(row, comments)


@router.put("/{call_id}/review", response_model=ReviewOut)
async def upsert_review(
    call_id: str,
    payload: ReviewUpsert,
    schema: str = Query(...),
    _user: dict = Depends(require_internal),
    db: aiosqlite.Connection = Depends(get_db),
):
    rubric_json = json.dumps([r.model_dump() for r in payload.rubric])
    now = datetime.utcnow().isoformat()

    await db.execute(
        """INSERT INTO qa_reviews
           (call_id, schema, overall_score, rubric_json, reviewed_by, reviewed_at, qa_status, updated_at)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(call_id, schema) DO UPDATE SET
             overall_score=excluded.overall_score,
             rubric_json=excluded.rubric_json,
             reviewed_by=excluded.reviewed_by,
             reviewed_at=excluded.reviewed_at,
             qa_status='reviewed',
             updated_at=excluded.updated_at""",
        (call_id, schema, payload.overall_score, rubric_json,
         payload.reviewed_by, now, "reviewed", now),
    )
    await db.commit()

    row = await _get_review_row(db, call_id, schema)
    comments = await _get_comments(db, call_id, schema)
    return ReviewOut.from_row(row, comments)


@router.put("/{call_id}/flag")
async def flag_call(
    call_id: str,
    schema: str = Query(...),
    flagged_by: str = Query("QA Analyst"),
    _user: dict = Depends(require_internal),
    db: aiosqlite.Connection = Depends(get_db),
):
    now = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT INTO qa_reviews (call_id, schema, qa_status, reviewed_by, updated_at)
           VALUES (?,?,'flagged',?,?)
           ON CONFLICT(call_id, schema) DO UPDATE SET
             qa_status='flagged',
             reviewed_by=excluded.reviewed_by,
             updated_at=excluded.updated_at""",
        (call_id, schema, flagged_by, now),
    )
    await db.commit()
    return {"status": "flagged", "flagged_by": flagged_by}


@router.delete("/{call_id}/flag")
async def unflag_call(
    call_id: str,
    schema: str = Query(...),
    _user: dict = Depends(require_internal),
    db: aiosqlite.Connection = Depends(get_db),
):
    await db.execute(
        """UPDATE qa_reviews SET qa_status='unreviewed', updated_at=datetime('now')
           WHERE call_id = ? AND schema = ?""",
        (call_id, schema),
    )
    await db.commit()
    return {"status": "unreviewed"}


@router.put("/{call_id}/good-to-share")
async def toggle_good_to_share(
    call_id: str,
    schema: str = Query(...),
    value: bool = Query(...),
    _user: dict = Depends(require_internal),
    db: aiosqlite.Connection = Depends(get_db),
):
    now = datetime.utcnow().isoformat()
    await db.execute(
        """INSERT INTO qa_reviews (call_id, schema, good_to_share, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(call_id, schema) DO UPDATE SET
             good_to_share=excluded.good_to_share,
             updated_at=excluded.updated_at""",
        (call_id, schema, int(value), now),
    )
    await db.commit()
    return {"good_to_share": value}


@router.post("/{call_id}/comments", response_model=CommentOut)
async def add_comment(
    call_id: str,
    payload: CommentCreate,
    schema: str = Query(...),
    user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    # Use the current user's display_name as the author
    author = user.get("display_name", "Unknown")
    
    async with db.execute(
        """INSERT INTO qa_comments (call_id, schema, text, timestamp_anchor, author)
           VALUES (?,?,?,?,?)""",
        (call_id, schema, payload.text, payload.timestamp_anchor, author),
    ) as cur:
        comment_id = cur.lastrowid
    await db.commit()

    async with db.execute(
        "SELECT * FROM qa_comments WHERE id = ?", (comment_id,)
    ) as cur:
        row = await cur.fetchone()

    return CommentOut(**dict(row))


@router.delete("/{call_id}/comments/{comment_id}")
async def delete_comment(
    call_id: str,
    comment_id: int,
    schema: str = Query(...),
    user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id, author FROM qa_comments WHERE id = ? AND call_id = ? AND schema = ?",
        (comment_id, call_id, schema),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Comment not found")
    
    # Internal users (qa_analyst, supervisor) can delete any comment
    # Clients can only delete their own comments
    is_internal = user.get("role") != "client"
    is_author = row["author"] == user.get("display_name", "")
    
    if not (is_internal or is_author):
        raise HTTPException(403, "You can only delete your own comments")

    await db.execute("DELETE FROM qa_comments WHERE id = ?", (comment_id,))
    await db.commit()
    return {"deleted": True}
