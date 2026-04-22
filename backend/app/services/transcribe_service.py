import json
import urllib.parse
import urllib.request
from typing import Optional

from app.config import get_settings
from app.services.s3_service import generate_presigned_url

_AAI_BASE = "https://api.assemblyai.com/v2"

# Pause between words (in ms) long enough to indicate a speaker change
_PAUSE_THRESHOLD_MS = 1500

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
        "speech_models": ["universal-2"],
    })
    if "id" not in response:
        raise RuntimeError(f"AssemblyAI submit failed: {response}")
    return response["id"]


def check_transcription_job(job_name: str) -> dict:
    """Poll AssemblyAI for current job status."""
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


def _flush(group: list[dict], speaker: str, out: list[dict]) -> None:
    if not group:
        return
    text = " ".join(w.get("text", "") for w in group).strip()
    if text:
        out.append({
            "speaker": speaker,
            "text": text,
            "start": group[0].get("start", 0),
            "end": group[-1].get("end", 0),
        })


def _build_utterances_from_words(words: list[dict]) -> list[dict]:
    """
    Group word-level items into turn-based utterances.

    If AssemblyAI detected multiple speakers, groups consecutive same-speaker
    words together. If only one speaker was detected (common for mono phone
    recordings), splits on pauses >= _PAUSE_THRESHOLD_MS and alternates
    between two synthetic speakers so the UI shows a proper conversation view.
    """
    if not words:
        return []

    unique_speakers = {w.get("speaker", "A") for w in words if w.get("speaker")}
    result: list[dict] = []
    group: list[dict] = []

    if len(unique_speakers) > 1:
        # Diarization worked — group by consecutive speaker label
        cur_sp = words[0].get("speaker", "A")
        for word in words:
            sp = word.get("speaker", "A")
            if sp != cur_sp:
                _flush(group, cur_sp, result)
                group = []
                cur_sp = sp
            group.append(word)
        _flush(group, cur_sp, result)
    else:
        # Single speaker detected — alternate at significant pauses
        alt_idx = 0
        labels = ["A", "B"]
        for i, word in enumerate(words):
            if i > 0:
                gap = word.get("start", 0) - words[i - 1].get("end", 0)
                if gap >= _PAUSE_THRESHOLD_MS and group:
                    _flush(group, labels[alt_idx], result)
                    group = []
                    alt_idx = 1 - alt_idx
            group.append(word)
        _flush(group, labels[alt_idx], result)

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
    words: list[dict] = response.get("words") or []

    # If utterances is empty or only has one unique speaker, rebuild from
    # word-level data which gives us finer-grained pause information.
    if raw_utterances:
        unique_speakers = {u.get("speaker", "A") for u in raw_utterances}
    else:
        unique_speakers = set()

    if not raw_utterances or len(unique_speakers) <= 1:
        rebuilt = _build_utterances_from_words(words)
        if rebuilt:
            raw_utterances = rebuilt

    # Map speaker labels (A, B, …) → "agent" / "customer"
    # First speaker encountered = agent (they greet/initiate the call)
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
