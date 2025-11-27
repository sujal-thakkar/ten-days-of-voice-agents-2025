from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Sequence

DEFAULT_CASES: Sequence[dict[str, Any]] = (
    {
        "user_name": "john",
        "customer_name": "John Rivera",
        "security_identifier": "MB-12345",
        "card_last4": "4242",
        "card_brand": "Murf Platinum",
        "transaction_amount": 129.87,
        "currency": "USD",
        "merchant_name": "ABC Industrial Supply",
        "location": "San Francisco, CA",
        "transaction_time": "2025-05-29T14:45:00-07:00",
        "transaction_category": "e-commerce",
        "transaction_source": "alibaba.com",
        "security_question": "What city did you honeymoon in?",
        "security_answer": "Lisbon",
        "status": "pending_review",
        "outcome_note": None,
    },
    {
        "user_name": "maya",
        "customer_name": "Maya Patel",
        "security_identifier": "MB-67890",
        "card_last4": "8834",
        "card_brand": "Murf Everyday Rewards",
        "transaction_amount": 802.14,
        "currency": "USD",
        "merchant_name": "Global Freight Logistics",
        "location": "Chicago, IL",
        "transaction_time": "2025-05-30T09:12:00-05:00",
        "transaction_category": "b2b services",
        "transaction_source": "purchase.globalfreight.io",
        "security_question": "What was the nickname of your first pet?",
        "security_answer": "Comet",
        "status": "pending_review",
        "outcome_note": None,
    },
    {
        "user_name": "lee",
        "customer_name": "Lee Chen",
        "security_identifier": "MB-24680",
        "card_last4": "0911",
        "card_brand": "Murf Travel Elite",
        "transaction_amount": 2130.0,
        "currency": "USD",
        "merchant_name": "Nimbus Air",
        "location": "Singapore (Online)",
        "transaction_time": "2025-05-31T22:05:00+08:00",
        "transaction_category": "travel",
        "transaction_source": "nimbusair.com",
        "security_question": "What is your favorite hiking trail?",
        "security_answer": "Sunset Ridge",
        "status": "pending_review",
        "outcome_note": None,
    },
)

ALLOWED_STATUSES = {
    "pending_review",
    "confirmed_safe",
    "confirmed_fraud",
    "verification_failed",
}


@dataclass(slots=True)
class FraudCase:
    id: int | None
    user_name: str
    customer_name: str
    security_identifier: str
    card_last4: str
    card_brand: str
    transaction_amount: float
    currency: str
    merchant_name: str
    location: str
    transaction_time: str
    transaction_category: str
    transaction_source: str
    security_question: str
    security_answer: str
    status: str
    outcome_note: str | None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "FraudCase":
        return cls(
            id=row["id"],
            user_name=row["user_name"],
            customer_name=row["customer_name"],
            security_identifier=row["security_identifier"],
            card_last4=row["card_last4"],
            card_brand=row["card_brand"],
            transaction_amount=row["transaction_amount"],
            currency=row["currency"],
            merchant_name=row["merchant_name"],
            location=row["location"],
            transaction_time=row["transaction_time"],
            transaction_category=row["transaction_category"],
            transaction_source=row["transaction_source"],
            security_question=row["security_question"],
            security_answer=row["security_answer"],
            status=row["status"],
            outcome_note=row["outcome_note"],
        )

    def masked_card(self) -> str:
        return f"**** {self.card_last4}"

    def public_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "userName": self.user_name,
            "customerName": self.customer_name,
            "securityIdentifier": self.security_identifier,
            "cardEnding": self.masked_card(),
            "cardBrand": self.card_brand,
            "transactionAmount": self.transaction_amount,
            "currency": self.currency,
            "merchantName": self.merchant_name,
            "location": self.location,
            "transactionTime": self.transaction_time,
            "transactionCategory": self.transaction_category,
            "transactionSource": self.transaction_source,
            "securityQuestion": self.security_question,
            "status": self.status,
            "outcomeNote": self.outcome_note,
        }

    def to_record(self) -> dict[str, Any]:
        record = asdict(self)
        return record


class FraudCaseNotFoundError(LookupError):
    pass


class FraudCaseRepository:
    def __init__(
        self,
        db_path: str | Path | None = None,
        seed_cases: Sequence[dict[str, Any]] | None = None,
    ) -> None:
        default_path = (
            Path(os.getenv("FRAUD_DB_PATH"))
            if os.getenv("FRAUD_DB_PATH")
            else Path(__file__).resolve().parent / "data" / "fraud_cases.db"
        )
        self.db_path = Path(db_path) if db_path else default_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._seed_cases = seed_cases or DEFAULT_CASES

    def initialize(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS fraud_cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_name TEXT UNIQUE NOT NULL,
                    customer_name TEXT NOT NULL,
                    security_identifier TEXT NOT NULL,
                    card_last4 TEXT NOT NULL,
                    card_brand TEXT NOT NULL,
                    transaction_amount REAL NOT NULL,
                    currency TEXT NOT NULL,
                    merchant_name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    transaction_time TEXT NOT NULL,
                    transaction_category TEXT NOT NULL,
                    transaction_source TEXT NOT NULL,
                    security_question TEXT NOT NULL,
                    security_answer TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending_review',
                    outcome_note TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_fraud_cases_username
                ON fraud_cases (user_name)
                """
            )
            count = conn.execute("SELECT COUNT(*) FROM fraud_cases").fetchone()[0]
            if count == 0:
                conn.executemany(
                    """
                    INSERT INTO fraud_cases (
                        user_name,
                        customer_name,
                        security_identifier,
                        card_last4,
                        card_brand,
                        transaction_amount,
                        currency,
                        merchant_name,
                        location,
                        transaction_time,
                        transaction_category,
                        transaction_source,
                        security_question,
                        security_answer,
                        status,
                        outcome_note
                    ) VALUES (
                        :user_name,
                        :customer_name,
                        :security_identifier,
                        :card_last4,
                        :card_brand,
                        :transaction_amount,
                        :currency,
                        :merchant_name,
                        :location,
                        :transaction_time,
                        :transaction_category,
                        :transaction_source,
                        :security_question,
                        :security_answer,
                        :status,
                        :outcome_note
                    )
                    """,
                    self._seed_cases,
                )
            conn.commit()

    def list_cases(self) -> list[FraudCase]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM fraud_cases ORDER BY id ASC").fetchall()
        return [FraudCase.from_row(row) for row in rows]

    def get_case_by_username(self, user_name: str) -> FraudCase:
        normalized = user_name.strip().lower()
        if not normalized:
            raise FraudCaseNotFoundError("A username is required to load a fraud case.")
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM fraud_cases WHERE lower(user_name) = ?",
                (normalized,),
            ).fetchone()
        if row is None:
            raise FraudCaseNotFoundError(f"No fraud case found for '{user_name}'.")
        return FraudCase.from_row(row)

    def update_case_status(self, user_name: str, status: str, note: str | None) -> FraudCase:
        if status not in ALLOWED_STATUSES:
            raise ValueError(f"Unsupported status '{status}'.")
        normalized = user_name.strip().lower()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id FROM fraud_cases WHERE lower(user_name) = ?",
                (normalized,),
            ).fetchone()
            if row is None:
                raise FraudCaseNotFoundError(f"No fraud case found for '{user_name}'.")
            conn.execute(
                "UPDATE fraud_cases SET status = ?, outcome_note = ? WHERE id = ?",
                (status, note, row["id"]),
            )
            conn.commit()
        return self.get_case_by_username(normalized)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn


def initialize_default_database() -> Path:
    repo = FraudCaseRepository()
    repo.initialize()
    return repo.db_path


if __name__ == "__main__":
    db_path = initialize_default_database()
    print(f"Fraud database ready at {db_path}")

