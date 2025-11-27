import pytest

from fraud_db import FraudCaseNotFoundError, FraudCaseRepository


def test_repository_initializes_with_sample_data(tmp_path) -> None:
    db_path = tmp_path / "fraud_cases.db"
    repo = FraudCaseRepository(db_path)
    repo.initialize()

    cases = repo.list_cases()

    assert len(cases) >= 1
    assert cases[0].status == "pending_review"


def test_update_status_and_persistence(tmp_path) -> None:
    db_path = tmp_path / "fraud_cases.db"
    repo = FraudCaseRepository(db_path)
    repo.initialize()

    case = repo.get_case_by_username("john")
    assert case.status == "pending_review"

    updated = repo.update_case_status("john", "confirmed_safe", "Customer confirmed purchase.")
    assert updated.status == "confirmed_safe"
    assert updated.outcome_note == "Customer confirmed purchase."

    reread = repo.get_case_by_username("john")
    assert reread.status == "confirmed_safe"


def test_missing_case_raises(tmp_path) -> None:
    db_path = tmp_path / "fraud_cases.db"
    repo = FraudCaseRepository(db_path)
    repo.initialize()

    with pytest.raises(FraudCaseNotFoundError):
        repo.get_case_by_username("unknown-user")
