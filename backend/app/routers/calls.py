import asyncio
import hashlib
import json
import random
from datetime import date, timedelta, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite

from app.database import get_db
from app.config import get_settings
from app.models.call import CallSummary, BulkSampleResponse
from app.services.s3_service import (
    list_calls_from_s3, generate_presigned_url, discover_schemas,
    _DUMMY_LANGUAGES, _DUMMY_USE_CASES,
)
from app.services.transcribe_service import (
    submit_transcription_job,
    check_transcription_job,
    download_and_process_transcript,
)

router = APIRouter(prefix="/calls", tags=["calls"])

_BYTES_PER_SEC = 16_000


def _daterange(date_from: date, date_to: date):
    cur = date_from
    while cur <= date_to:
        yield cur
        cur += timedelta(days=1)


def _dummy_field(uuid: str, choices: list, salt: str) -> str:
    h = int(hashlib.md5(f"{uuid}{salt}".encode()).hexdigest(), 16)
    return choices[h % len(choices)]


async def _get_or_cache_calls(
    db: aiosqlite.Connection,
    schema: str,
    target_date: date,
) -> list[dict]:
    cache_age_limit = datetime.utcnow() - timedelta(minutes=30)

    async with db.execute(
        """SELECT call_id FROM call_metadata_cache
           WHERE schema = ? AND call_date = ? AND cached_at > ? LIMIT 1""",
        (schema, target_date.isoformat(), cache_age_limit.isoformat()),
    ) as cur:
        fresh = await cur.fetchone()

    if not fresh:
        calls = await asyncio.get_event_loop().run_in_executor(
            None, list_calls_from_s3, schema, target_date
        )
        for c in calls:
            await db.execute(
                """INSERT INTO call_metadata_cache
                   (call_id, schema, call_date, customer_phone, agent_id, audio_key, file_size, cached_at)
                   VALUES (?,?,?,?,?,?,?,datetime('now'))
                   ON CONFLICT(call_id, schema) DO UPDATE SET
                     customer_phone=excluded.customer_phone,
                     audio_key=excluded.audio_key,
                     file_size=excluded.file_size,
                     cached_at=excluded.cached_at""",
                (c["call_id"], c["schema"], c["call_date"],
                 c["customer_phone"], "", c["audio_key"], c["file_size"]),
            )
        await db.commit()

    async with db.execute(
        """SELECT m.call_id, m.schema, m.call_date, m.customer_phone,
                  m.audio_key, m.file_size,
                  COALESCE(r.qa_status, 'unreviewed') as qa_status,
                  r.overall_score,
                  COALESCE(r.good_to_share, 0) as good_to_share
           FROM call_metadata_cache m
           LEFT JOIN qa_reviews r ON r.call_id = m.call_id AND r.schema = m.schema
           WHERE m.schema = ? AND m.call_date = ?
           ORDER BY m.call_date DESC, m.call_id""",
        (schema, target_date.isoformat()),
    ) as cur:
        rows = await cur.fetchall()

    result = []
    for row in rows:
        uuid = row["call_id"]
        size = row["file_size"] or 0
        result.append({
            "call_id": uuid,
            "schema": row["schema"],
            "call_date": row["call_date"],
            "customer_phone": row["customer_phone"] or "",
            "duration_seconds": max(0, (size - 44) // _BYTES_PER_SEC),
            "audio_key": row["audio_key"] or "",
            "qa_status": row["qa_status"],
            "overall_score": row["overall_score"],
            "good_to_share": bool(row["good_to_share"]),
            # TODO: replace with DB lookup (ClickHouse)
            "language": _dummy_field(uuid, _DUMMY_LANGUAGES, "lang"),
            "use_case": _dummy_field(uuid, _DUMMY_USE_CASES, "uc"),
        })
    return result


@router.get("", response_model=list[CallSummary])
async def list_calls(
    schema: str = Query(...),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=7)),
    date_to: date = Query(default_factory=date.today),
    qa_status: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    use_case: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    good_to_share: Optional[bool] = Query(None),
    db: aiosqlite.Connection = Depends(get_db),
):
    if (date_to - date_from).days > 30:
        raise HTTPException(400, "Date range cannot exceed 30 days")

    all_calls: list[dict] = []
    for d in _daterange(date_from, date_to):
        all_calls.extend(await _get_or_cache_calls(db, schema, d))

    if qa_status:
        all_calls = [c for c in all_calls if c["qa_status"] == qa_status]
    if language:
        all_calls = [c for c in all_calls if c["language"].lower() == language.lower()]
    if use_case:
        all_calls = [c for c in all_calls if c["use_case"].lower() == use_case.lower()]
    if search:
        q = search.lower()
        all_calls = [
            c for c in all_calls
            if q in c["customer_phone"].lower() or q in c["call_id"].lower()
        ]
    if good_to_share is not None:
        all_calls = [c for c in all_calls if c["good_to_share"] == good_to_share]

    return [CallSummary(**c) for c in all_calls]


@router.get("/schemas")
async def list_schemas():
    explicit = get_settings().explicit_schemas
    if explicit:
        return explicit
    return await asyncio.get_event_loop().run_in_executor(None, discover_schemas)


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
        all_calls.extend(await _get_or_cache_calls(db, schema, d))

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


@router.post("/{call_id}/transcribe")
async def transcribe_call(
    call_id: str,
    schema: str = Query(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Submit an AWS Transcribe job for this call. Idempotent."""
    async with db.execute(
        "SELECT audio_key FROM call_metadata_cache WHERE call_id = ? AND schema = ?",
        (call_id, schema),
    ) as cur:
        row = await cur.fetchone()

    if not row or not row["audio_key"]:
        raise HTTPException(404, "Call not found in cache — load the call list first")

    # Don't resubmit if already pending / completed
    async with db.execute(
        "SELECT status FROM transcriptions WHERE call_id = ? AND schema = ?",
        (call_id, schema),
    ) as cur:
        existing = await cur.fetchone()

    if existing and existing["status"] in ("pending", "in_progress", "completed"):
        return {"status": existing["status"], "message": "Already in progress or completed"}

    job_name = await asyncio.get_event_loop().run_in_executor(
        None, submit_transcription_job, call_id, schema, row["audio_key"]
    )

    await db.execute(
        """INSERT INTO transcriptions (call_id, schema, job_name, status, created_at, updated_at)
           VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))
           ON CONFLICT(call_id, schema) DO UPDATE SET
             job_name=excluded.job_name,
             status='pending',
             error_message=NULL,
             updated_at=datetime('now')""",
        (call_id, schema, job_name),
    )
    await db.commit()
    return {"status": "pending", "job_name": job_name}


@router.get("/{call_id}/transcript")
async def get_transcript(
    call_id: str,
    schema: str = Query(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT * FROM transcriptions WHERE call_id = ? AND schema = ?",
        (call_id, schema),
    ) as cur:
        row = await cur.fetchone()

    if not row:
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": [],
            "available": False,
            "status": "not_started",
        }

    status = row["status"]

    if status == "completed":
        utterances = json.loads(row["utterances_json"] or "[]")
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": utterances,
            "available": True,
            "status": "completed",
            "language_code": row["language_code"],
        }

    if status == "failed":
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": [],
            "available": False,
            "status": "failed",
            "message": row["error_message"] or "Transcription failed",
        }

    # pending / in_progress — check AWS for latest status
    job_name = row["job_name"]
    try:
        job_info = await asyncio.get_event_loop().run_in_executor(
            None, check_transcription_job, job_name
        )
    except Exception:
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": [],
            "available": False,
            "status": "pending",
            "message": "Checking transcription status…",
        }

    aws_status = job_info["status"]

    if aws_status == "completed":
        language_code, utterances = await asyncio.get_event_loop().run_in_executor(
            None, download_and_process_transcript, job_name
        )
        await db.execute(
            """UPDATE transcriptions
               SET status='completed', language_code=?, utterances_json=?, updated_at=datetime('now')
               WHERE call_id=? AND schema=?""",
            (language_code, json.dumps(utterances), call_id, schema),
        )
        await db.commit()
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": utterances,
            "available": True,
            "status": "completed",
            "language_code": language_code,
        }

    if aws_status == "failed":
        reason = job_info.get("failure_reason", "Transcription failed")
        await db.execute(
            """UPDATE transcriptions
               SET status='failed', error_message=?, updated_at=datetime('now')
               WHERE call_id=? AND schema=?""",
            (reason, call_id, schema),
        )
        await db.commit()
        return {
            "call_id": call_id,
            "schema": schema,
            "utterances": [],
            "available": False,
            "status": "failed",
            "message": reason,
        }

    # Still queued / in_progress
    new_status = "in_progress" if aws_status == "in_progress" else "pending"
    if new_status != status:
        await db.execute(
            "UPDATE transcriptions SET status=?, updated_at=datetime('now') WHERE call_id=? AND schema=?",
            (new_status, call_id, schema),
        )
        await db.commit()
    return {
        "call_id": call_id,
        "schema": schema,
        "utterances": [],
        "available": False,
        "status": new_status,
        "message": "Transcribing audio… this takes 1–3 minutes",
    }
