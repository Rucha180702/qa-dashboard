from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
import json

_NO_NS = ConfigDict(protected_namespaces=())


class RubricDimension(BaseModel):
    id: str
    label: str
    score: int = Field(0, ge=0, le=5)


class ReviewUpsert(BaseModel):
    overall_score: int = Field(..., ge=1, le=5)
    rubric: list[RubricDimension] = []
    reviewed_by: str = "QA Analyst"


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    timestamp_anchor: Optional[float] = None
    author: str = "QA Analyst"


class CommentOut(BaseModel):
    model_config = _NO_NS

    id: int
    call_id: str
    schema: str
    text: str
    timestamp_anchor: Optional[float]
    author: str
    created_at: str


class ReviewOut(BaseModel):
    model_config = _NO_NS

    call_id: str
    schema: str
    overall_score: Optional[int]
    rubric: list[RubricDimension]
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]
    qa_status: str
    comments: list[CommentOut] = []

    @classmethod
    def from_row(cls, row, comments: list) -> "ReviewOut":
        rubric_raw = row["rubric_json"] or "{}"
        try:
            rubric_data = json.loads(rubric_raw)
        except Exception:
            rubric_data = []
        if isinstance(rubric_data, list):
            rubric = [RubricDimension(**r) for r in rubric_data]
        else:
            rubric = []
        return cls(
            call_id=row["call_id"],
            schema=row["schema"],
            overall_score=row["overall_score"],
            rubric=rubric,
            reviewed_by=row["reviewed_by"],
            reviewed_at=row["reviewed_at"],
            qa_status=row["qa_status"],
            comments=comments,
        )


DEFAULT_RUBRIC = [
    RubricDimension(id="accuracy",   label="Accuracy",   score=0),
    RubricDimension(id="tone",       label="Tone",        score=0),
    RubricDimension(id="resolution", label="Resolution",  score=0),
    RubricDimension(id="compliance", label="Compliance",  score=0),
]
