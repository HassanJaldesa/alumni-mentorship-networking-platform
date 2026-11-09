"""Application settings, loaded from environment variables or the .env file."""
import os

from pydantic_settings import BaseSettings, SettingsConfigDict

# Silence a harmless Hugging Face warning about symlinks on Windows.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    sbert_model: str = "all-MiniLM-L6-v2"
    service_token: str


settings = Settings()