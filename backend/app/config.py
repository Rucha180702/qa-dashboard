from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    aws_s3_bucket_name: str
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_default_region: str
    database_url: str = "./qa_reviews.db"
    presigned_url_expiry: int = 3600
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [s.strip() for s in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
