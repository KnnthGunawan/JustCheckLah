from pathlib import Path
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str

    FRONTEND_URL: Optional[str] = None

    EXTRA_CORS_ORIGINS: List[str] = Field(default_factory=list)

    LOCAL_CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = [
            *self.LOCAL_CORS_ORIGINS,
            "https://justchecklah.com",
            "https://www.justchecklah.com",
        ]

        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)

        origins.extend(self.EXTRA_CORS_ORIGINS)

        cleaned_origins = [
            origin.rstrip("/")
            for origin in origins
            if origin and origin.strip()
        ]

        return list(dict.fromkeys(cleaned_origins))

    class Config:
        env_file = BACKEND_DIR / ".env"
        env_file_encoding = "utf-8"


settings = Settings()