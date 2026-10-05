from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"

    ibm_quantum_api_key: str | None = None
    ibm_quantum_instance: str | None = None
    qbraid_api_key: str | None = None
    groq_api_key: str | None = None
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None

    cors_origins: str = "http://localhost:5173"

    max_shots: int = Field(default=4096, ge=1, le=4096)
    max_qubits: int = Field(default=20, ge=1, le=20)
    max_code_length: int = Field(default=12000, ge=1, le=12000)
    execution_timeout: int = 10
    rate_limit_per_minute: int = Field(default=30, ge=1, le=10000)
    result_cache_ttl_seconds: int = Field(default=900, ge=1, le=86400)
    max_cached_results: int = Field(default=1000, ge=1, le=100000)

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_list(self):
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()
