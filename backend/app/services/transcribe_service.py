import json
import urllib.parse
import urllib.request
from typing import Optional

from app.config import get_settings
from app.services.s3_service import generate_presigned_url

_AAI_BASE = "https://api.assemblyai.com/v2"

# AssemblyAI detected language codes → ISO 639-1 for MyMemory translation
_LANG_TO_ISO: dict[str, str] = {
    "hi": "hi", "ta": "ta", "te": "te", "mr": "mr",
    "gu": "gu", "bn": "bn", "ur": "ur",
    "en": "en", "en_us": "en", "en_au": "en", "en_uk": "en", "en_in": "en",
}


def _headers() -> dict:
    return {
        "authorization": get_settings().assemblyai_api_key,
        "content-type": "application/json",
    }


def _aai_post(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        _AAI_BASE + path,
        data=json.dumps(body).encode(),
        headers=_headers(),
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def _aai_get(path: str) -> dict:
    req = urllib.request.Request(_AAI_BASE + path, headers=_headers())
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def submit_transcription_job(call_id: str, schema: str, audio_key: str) -> str:
    """Submit AssemblyAI job. Returns transcript ID used as job_name in DB."""
    audio_url = generate_presigned_url(audio_key, expiry=3600)
    response = _aai_post("/transcript", {
        "audio_url": audio_url,
        "speaker_labels": True,
        "language_detection": True,
        "speech_models": ["universal-2"],  # required for language detection
    })
    if "id" not in response:
        raise RuntimeError(f"AssemblyAI submit failed: {response}")
    return response["id"]


def check_transcription_job(job_name: str) -> dict:
    """Poll AssemblyAI for current job status. Returns dict with 'status'."""
    response = _aai_get(f"/transcript/{job_name}")
    aai_status = response.get("status", "queued")

    status_map = {
        "queued":     "pending",
        "processing": "in_progress",
        "completed":  "completed",
        "error":      "failed",
    }
    result: dict = {"status": status_map.get(aai_status, "pending")}

    if aai_status == "completed":
        result["language_code"] = response.get("language_code", "unknown")
    elif aai_status == "error":
        result["failure_reason"] = response.get("error", "Transcription failed")

    return result


def _translate_text(text: str, source_lang: str) -> Optional[str]:
    """Free translation via MyMemory API — no API key required."""
    if not text:
        return None
    try:
        encoded = urllib.parse.quote(text[:500])
        url = (
            f"https://api.mymemory.translated.net/get"
            f"?q={encoded}&langpair={source_lang}|en"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "QA-Dashboard/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        translated = data.get("responseData", {}).get("translatedText", "")
        if translated and not translated.upper().startswith("MYMEMORY WARNING"):
            return translated
    except Exception:
        pass
    return None


def download_and_process_transcript(job_name: str) -> tuple[str, list[dict]]:
    """
    Fetch completed AssemblyAI result, build utterances, translate non-English.
    Returns (language_code, utterances_list).
    """
    response = _aai_get(f"/transcript/{job_name}")
    language_code: str = response.get("language_code", "unknown")
    raw_utterances: list[dict] = response.get("utterances") or []

    # Map AssemblyAI speaker labels (A, B, …) → agent / customer
    # First speaker in the call = agent (they greet/initiate)
    speaker_map: dict[str, str] = {}
    for utt in raw_utterances:
        sp = utt.get("speaker", "A")
        if sp not in speaker_map:
            speaker_map[sp] = "agent" if len(speaker_map) == 0 else "customer"

    lang_base = _LANG_TO_ISO.get(language_code.lower(), language_code.split("_")[0].lower())
    need_translation = lang_base != "en"

    utterances: list[dict] = []
    for i, utt in enumerate(raw_utterances):
        text = (utt.get("text") or "").strip()
        translated_text = None
        if need_translation and text:
            translated_text = _translate_text(text, lang_base)

        utterances.append({
            "id": f"utt-{i}",
            "speaker": speaker_map.get(utt.get("speaker", "A"), "customer"),
            "startTime": round((utt.get("start") or 0) / 1000, 2),
            "endTime":   round((utt.get("end")   or 0) / 1000, 2),
            "text": text,
            "translatedText": translated_text,
        })

    return language_code, utterances
