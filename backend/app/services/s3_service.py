import re
import asyncio
from datetime import datetime, timedelta, date
from typing import Optional

import boto3
from botocore.client import Config

from app.config import get_settings

_COMPLETE_RE = re.compile(
    r"complete_call_recording_(\d+)_([0-9a-fA-F-]{36})\.wav$"
)
_USER_RE = re.compile(r"user_recorded_(\w+)_\d+\.wav$")

# 8 kHz, 16-bit, mono telephony WAV
_BYTES_PER_SEC = 16_000
_WAV_HEADER = 44


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


def _date_prefix(schema: str, d: date) -> str:
    return (
        f"media/{schema}/freeswitch/"
        f"{d.year}/{str(d.month).zfill(2)}/{str(d.day).zfill(2)}/"
    )


def list_calls_from_s3(schema: str, target_date: date) -> list[dict]:
    """Return list of call dicts for a given schema + date."""
    s3 = _get_s3_client()
    prefix = _date_prefix(schema, target_date)
    paginator = s3.get_paginator("list_objects_v2")

    calls: dict[str, dict] = {}

    for page in paginator.paginate(Bucket=get_settings().aws_s3_bucket_name, Prefix=prefix):
        for obj in page.get("Contents", []):
            key: str = obj["Key"]
            size: int = obj["Size"]

            # Match the complete call recording
            m = _COMPLETE_RE.search(key)
            if m:
                phone, uuid = m.group(1), m.group(2)
                if uuid not in calls:
                    calls[uuid] = {
                        "call_id": uuid,
                        "schema": schema,
                        "call_date": target_date.isoformat(),
                        "customer_phone": phone,
                        "agent_id": "",
                        "audio_key": key,
                        "file_size": size,
                        "duration_seconds": _estimate_duration(size),
                    }
                continue

            # Extract agent_id from user recordings (take first occurrence)
            um = _USER_RE.search(key)
            if um:
                agent_id = um.group(1)
                # find call uuid from path segment
                parts = key.split("/")
                if len(parts) >= 2:
                    folder_uuid = parts[-2]
                    if folder_uuid in calls and not calls[folder_uuid]["agent_id"]:
                        calls[folder_uuid]["agent_id"] = agent_id

    return list(calls.values())


def discover_schemas() -> list[str]:
    """List tenant schemas by reading media/ common prefixes from S3."""
    s3 = _get_s3_client()
    cfg = get_settings()
    response = s3.list_objects_v2(
        Bucket=cfg.aws_s3_bucket_name,
        Prefix="media/",
        Delimiter="/",
    )
    schemas = []
    for prefix in response.get("CommonPrefixes", []):
        # prefix looks like "media/ad_5c9238/"
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
