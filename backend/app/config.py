from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional


class Settings(BaseSettings):
    aws_s3_bucket_name: str
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_default_region: str
    assemblyai_api_key: str = ""
    jwt_secret: str = "qa-dashboard-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 12
    # Explicit tenant list — preferred over S3 discovery when set
    schema_list: Optional[str] = None
    database_url: str = "./qa_reviews.db"
    presigned_url_expiry: int = 3600
    cors_origins: str = "http://localhost:5173"

    @property
    def explicit_schemas(self) -> List[str]:
        if not self.schema_list:
            return []
        return [s.strip() for s in self.schema_list.split(",") if s.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [s.strip() for s in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
