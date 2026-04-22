import re
import hashlib
from datetime import date
from typing import Optional

import boto3
from botocore.client import Config

from app.config import get_settings

_COMPLETE_RE = re.compile(
    r"complete_call_recording_(\d+)_([0-9a-fA-F-]{36})\.wav$"
)
_USER_RE = re.compile(r"user_recorded_(\w+)_\d+\.wav$")

_BYTES_PER_SEC = 16_000
_WAV_HEADER = 44

# TODO: Replace with DB lookup once ClickHouse integration is live
_DUMMY_LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati"]
_DUMMY_USE_CASES = ["Loan Inquiry", "Collection", "Support", "Onboarding", "Complaint", "EMI Inquiry"]


def _get_s3_client():
    cfg = get_settings()
    return boto3.client(
        "s3",
        aws_access_key_id=cfg.aws_access_key_id,
        region_name=cfg.aws_default_region,
        aws_secret_access_key=cfg.aws_secret_access_key,
        config=Config(signature_version="s3v4"),
    )


def _estimate_duration(file_size: int) -> int:
    return max(0, (file_size - _WAV_HEADER) // _BYTES_PER_SEC)


def _dummy_field(uuid: str, choices: list[str], salt: str) -> str:
    """Deterministic dummy value derived from UUID — stable across reloads."""
    h = int(hashlib.md5(f"{uuid}{salt}".encode()).hexdigest(), 16)
    return choices[h % len(choices)]


def _date_prefix(schema: str, d: date) -> str:
    return (
        f"media/{schema}/freeswitch/"
        f"{d.year}/{str(d.month).zfill(2)}/{str(d.day).zfill(2)}/"
    )


def list_calls_from_s3(schema: str, target_date: date) -> list[dict]:
    s3 = _get_s3_client()
    prefix = _date_prefix(schema, target_date)
    paginator = s3.get_paginator("list_objects_v2")
    calls: dict[str, dict] = {}

    for page in paginator.paginate(Bucket=get_settings().aws_s3_bucket_name, Prefix=prefix):
        for obj in page.get("Contents", []):
            key: str = obj["Key"]
            size: int = obj["Size"]

            m = _COMPLETE_RE.search(key)
            if m:
                phone, uuid = m.group(1), m.group(2)
                if uuid not in calls:
                    calls[uuid] = {
                        "call_id": uuid,
                        "schema": schema,
                        "call_date": target_date.isoformat(),
                        "customer_phone": phone,
                        "audio_key": key,
                        "file_size": size,
                        "duration_seconds": _estimate_duration(size),
                        # Dummy until DB integration
                        "language": _dummy_field(uuid, _DUMMY_LANGUAGES, "lang"),
                        "use_case": _dummy_field(uuid, _DUMMY_USE_CASES, "uc"),
                    }

    return list(calls.values())


def discover_schemas() -> list[str]:
    s3 = _get_s3_client()
    cfg = get_settings()
    response = s3.list_objects_v2(
        Bucket=cfg.aws_s3_bucket_name,
        Prefix="media/",
        Delimiter="/",
    )
    schemas = []
    for prefix in response.get("CommonPrefixes", []):
        part = prefix["Prefix"].rstrip("/").split("/")[-1]
        if part:
            schemas.append(part)
    return sorted(schemas)


def generate_presigned_url(audio_key: str, expiry: Optional[int] = None) -> str:
    s3 = _get_s3_client()
    cfg = get_settings()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": cfg.aws_s3_bucket_name, "Key": audio_key},
        ExpiresIn=expiry or cfg.presigned_url_expiry,
    )
