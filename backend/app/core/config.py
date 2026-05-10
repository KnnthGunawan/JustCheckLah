from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str
    FRONTEND_URL: Optional[str] = None
    LOCAL_CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = list(self.LOCAL_CORS_ORIGINS)
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL.rstrip("/"))
        return list(dict.fromkeys(origins))

    class Config:
        env_file = BACKEND_DIR / ".env"
        env_file_encoding = "utf-8"


settings = Settings()
