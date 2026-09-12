from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"

    ibm_quantum_api_key: str | None = None
    ibm_quantum_instance: str | None = None
    qbraid_api_key: str | None = None
    groq_api_key: str | None = None
    supabase_url: str | None = None
    supabase_anon_key: str | None = None

    cors_origins: str = "http://localhost:5173"

    max_shots: int = 4096
    max_qubits: int = 20
    max_code_length: int = 12000
    execution_timeout: int = 10
    rate_limit_per_minute: int = 30

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
