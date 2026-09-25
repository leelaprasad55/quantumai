import asyncio
import pytest
from app.services.contest_service import contest_status, ops_to_qiskit, score_submission, store
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


def test_demo_contest_is_live_without_relying_on_its_end_timestamp():
    contest = {**store.sample_contest, "end_time": "2000-01-01T00:00:00+00:00"}
    assert contest_status(contest) == "live"


def test_demo_contest_contains_circuit_and_coding_challenges():
    assert {problem["contest_type"] for problem in store.sample_problems} == {"circuit_building", "coding"}
