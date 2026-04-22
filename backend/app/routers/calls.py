import asyncio
import json
import random
from datetime import date, timedelta, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite

from app.database import get_db
from app.config import get_settings
from app.models.call import CallSummary, BulkSampleResponse
from app.services.s3_service import list_calls_from_s3, generate_presigned_url, discover_schemas

router = APIRouter(prefix="/calls", tags=["calls"])


def _daterange(date_from: date, date_to: date):
    cur = date_from
    while cur <= date_to:
        yield cur
        cur += timedelta(days=1)


async def _get_or_cache_calls(
    db: aiosqlite.Connection,
    schema: str,
    target_date: date,
) -> list[dict]:
    """Return call rows from cache, populating from S3 if stale (>30 min)."""
    cache_age_limit = datetime.utcnow() - timedelta(minutes=30)

    # Check cache freshness
    async with db.execute(
        """SELECT call_id FROM call_metadata_cache
           WHERE schema = ? AND call_date = ?
             AND cached_at > ?
           LIMIT 1""",
        (schema, target_date.isoformat(), cache_age_limit.isoformat()),
    ) as cur:
        fresh = await cur.fetchone()

    if not fresh:
        # Refresh from S3 in a thread (boto3 is sync)
        calls = await asyncio.get_event_loop().run_in_executor(
            None, list_calls_from_s3, schema, target_date
        )
        # Upsert into cache
        for c in calls:
            await db.execute(
                """INSERT INTO call_metadata_cache
                   (call_id, schema, call_date, customer_phone, agent_id, audio_key, file_size, cached_at)
                   VALUES (?,?,?,?,?,?,?,datetime('now'))
                   ON CONFLICT(call_id, schema) DO UPDATE SET
                     customer_phone=excluded.customer_phone,
                     agent_id=excluded.agent_id,
                     audio_key=excluded.audio_key,
                     file_size=excluded.file_size,
                     cached_at=excluded.cached_at""",
                (
                    c["call_id"], c["schema"], c["call_date"],
                    c["customer_phone"], c["agent_id"],
                    c["audio_key"], c["file_size"],
                ),
            )
        await db.commit()

    # Fetch from cache
    async with db.execute(
        """SELECT m.call_id, m.schema, m.call_date, m.customer_phone,
                  m.agent_id, m.audio_key, m.file_size,
                  COALESCE(r.qa_status, 'unreviewed') as qa_status,
                  r.overall_score
           FROM call_metadata_cache m
           LEFT JOIN qa_reviews r ON r.call_id = m.call_id AND r.schema = m.schema
           WHERE m.schema = ? AND m.call_date = ?
           ORDER BY m.call_id""",
        (schema, target_date.isoformat()),
    ) as cur:
        rows = await cur.fetchall()

    result = []
    for row in rows:
        size = row["file_size"] or 0
        duration = max(0, (size - 44) // 16_000)
        result.append({
            "call_id": row["call_id"],
            "schema": row["schema"],
            "call_date": row["call_date"],
            "customer_phone": row["customer_phone"] or "",
            "agent_id": row["agent_id"] or "",
            "duration_seconds": duration,
            "audio_key": row["audio_key"] or "",
            "qa_status": row["qa_status"],
            "overall_score": row["overall_score"],
        })
    return result


@router.get("", response_model=list[CallSummary])
async def list_calls(
    schema: str = Query(..., description="Schema name"),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=7)),
    date_to: date = Query(default_factory=date.today),
    qa_status: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: aiosqlite.Connection = Depends(get_db),
):
    if (date_to - date_from).days > 30:
        raise HTTPException(400, "Date range cannot exceed 30 days")

    all_calls: list[dict] = []
    for d in _daterange(date_from, date_to):
        day_calls = await _get_or_cache_calls(db, schema, d)
        all_calls.extend(day_calls)

    # Apply filters
    if qa_status:
        all_calls = [c for c in all_calls if c["qa_status"] == qa_status]
    if agent_id:
        all_calls = [c for c in all_calls if c["agent_id"] == agent_id]
    if search:
        q = search.lower()
        all_calls = [
            c for c in all_calls
            if q in c["customer_phone"].lower()
            or q in c["call_id"].lower()
            or q in c["agent_id"].lower()
        ]

    return [CallSummary(**c) for c in all_calls]


@router.get("/schemas")
async def list_schemas():
    """Discover tenant schemas dynamically from S3 media/ prefix."""
    schemas = await asyncio.get_event_loop().run_in_executor(None, discover_schemas)
    return schemas


@router.get("/bulk-sample", response_model=BulkSampleResponse)
async def bulk_sample(
    schema: str = Query(...),
    n: int = Query(5, ge=1, le=20),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=7)),
    date_to: date = Query(default_factory=date.today),
    db: aiosqlite.Connection = Depends(get_db),
):
    all_calls: list[dict] = []
    for d in _daterange(date_from, date_to):
        day_calls = await _get_or_cache_calls(db, schema, d)
        all_calls.extend(day_calls)

    unreviewed = [c for c in all_calls if c["qa_status"] == "unreviewed"]
    sample = random.sample(unreviewed, min(n, len(unreviewed)))
    return BulkSampleResponse(
        calls=[CallSummary(**c) for c in sample],
        total_unreviewed=len(unreviewed),
    )


@router.get("/{call_id}/audio")
async def get_audio_url(
    call_id: str,
    schema: str = Query(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT audio_key FROM call_metadata_cache WHERE call_id = ? AND schema = ?",
        (call_id, schema),
    ) as cur:
        row = await cur.fetchone()

    if not row or not row["audio_key"]:
        raise HTTPException(404, "Call not found")

    url = await asyncio.get_event_loop().run_in_executor(
        None, generate_presigned_url, row["audio_key"]
    )
    return {"url": url, "expires_in": get_settings().presigned_url_expiry}


@router.get("/{call_id}/transcript")
async def get_transcript(call_id: str, schema: str = Query(...)):
    # Placeholder — teammate will wire Maxim integration here
    return {
        "call_id": call_id,
        "schema": schema,
        "utterances": [],
        "available": False,
        "message": "Transcript integration pending (Maxim)",
    }
