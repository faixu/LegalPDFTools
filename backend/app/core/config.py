from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "LegalPDFTools"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://legalbates.vercel.app",
    ]

    # File upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_MIME_TYPES: List[str] = ["application/pdf"]

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW: int = 60  # seconds

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-production")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()