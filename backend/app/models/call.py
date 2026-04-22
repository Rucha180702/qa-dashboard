from pydantic import BaseModel, ConfigDict
from typing import Optional


class CallSummary(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    call_id: str
    schema: str
    call_date: str
    customer_phone: str
    duration_seconds: int
    audio_key: str
    language: str = "Unknown"        # placeholder until DB integration
    use_case: str = "Unknown"        # placeholder until DB integration
    qa_status: str = "unreviewed"
    overall_score: Optional[int] = None


class CallDetail(CallSummary):
    pass


class BulkSampleResponse(BaseModel):
    calls: list[CallSummary]
    total_unreviewed: int
