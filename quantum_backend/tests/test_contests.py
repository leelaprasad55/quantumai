import asyncio
import pytest
from app.services.contest_service import ops_to_qiskit, score_submission, store
from app.schemas import ContestSubmissionRequest


def test_circuit_submission_uses_existing_qiskit_compiler_and_scores_bell_pair():
    problem = store.sample_problem
    request = ContestSubmissionRequest(submission_type="ops", ops=[
        {"gate": "H", "target": 0, "col": 0},
        {"gate": "CNOT", "control": 0, "target": 1, "col": 1},
    ])
    submission = asyncio.run(score_submission(problem, "local-user", request))
    # Scores are sampled from the existing simulator, so a Bell distribution
    # is expected to be near-perfect rather than bit-for-bit deterministic.
    assert submission["correctness_score"] >= .95
    assert submission["efficiency_score"] == pytest.approx(1)
    assert submission["total_score"] >= .74


def test_ops_converter_rejects_unknown_gate_before_compilation():
    with pytest.raises(ValueError, match="Unsupported contest gate"):
        ops_to_qiskit([{"gate": "evil", "target": 0, "col": 0}], 1)
