from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator

Framework = Literal["qiskit", "pennylane", "cirq"]
Algorithm = Literal["bell", "deutsch_jozsa", "bernstein_vazirani", "grover", "qft", "phase_estimation", "shor"]


class CircuitRequest(BaseModel):
    framework: Framework
    code: str = Field(min_length=1, max_length=12000)
    shots: int = Field(default=1024, ge=1, le=4096)

    @field_validator("code")
    @classmethod
    def reject_dangerous_source(cls, value: str) -> str:
        blocked = ("__import__", "open(", "eval(", "exec(", "os.", "subprocess", "socket", "requests", "urllib", "pathlib", "globals(", "locals(")
        if any(token in value.lower() for token in blocked):
            raise ValueError("The submitted program contains an operation not allowed in the quantum sandbox.")
        return value


class AlgorithmRequest(BaseModel):
    algorithm: Algorithm
    framework: Framework = "qiskit"
    parameters: dict[str, Any] = Field(default_factory=dict)
    shots: int = Field(default=1024, ge=1, le=4096)


class IBMRunRequest(BaseModel):
    backend: str | None = Field(default=None, max_length=128)
    shots: int = Field(default=1024, ge=100, le=4096)
    code: str | None = Field(default=None, max_length=12000)

    @field_validator("code")
    @classmethod
    def reject_dangerous_source(cls, value: str | None) -> str | None:
        if value is None:
            return value
        blocked = ("__import__", "open(", "eval(", "exec(", "os.", "subprocess", "socket", "requests", "urllib", "pathlib", "globals(", "locals(")
        if any(token in value.lower() for token in blocked):
            raise ValueError("The submitted program contains an operation not allowed in the quantum sandbox.")
        return value


class ContestSubmissionRequest(BaseModel):
    submission_type: Literal["code", "ops"]
    framework: Framework | None = None
    code: str | None = Field(default=None, max_length=12000)
    ops: list[dict[str, Any]] | None = Field(default=None, max_length=200)

    @field_validator("code")
    @classmethod
    def reject_contest_dangerous_source(cls, value: str | None) -> str | None:
        if value is None:
            return value
        blocked = ("__import__", "open(", "eval(", "exec(", "os.", "subprocess", "socket", "requests", "urllib", "pathlib", "globals(", "locals(")
        if any(token in value.lower() for token in blocked):
            raise ValueError("The submitted program contains an operation not allowed in the quantum sandbox.")
        return value
