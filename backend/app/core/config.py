# backend/app/core/config.py
"""Configuración centralizada con Pydantic Settings v2."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # JWT
    SECRET_KEY: str = "change-me-in-production-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # DB
    DATABASE_URL: str = "sqlite:///./escrituras.db"

    # File storage
    UPLOADS_DIR: str = "uploads"
    GENERATED_DIR: str = "generated"
    MAX_UPLOAD_SIZE: int = 10_485_760  # 10 MB

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Bootstrap admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@example.local"
    ADMIN_PASSWORD: str = "Admin123!"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
