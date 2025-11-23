from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_ORDER_DIR = Path(__file__).resolve().parents[1] / "KMS" / "logs" / "orders"
DEFAULT_ORDER_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class OrderState:
    """Represents the in-progress order collected by the barista agent."""

    drink_type: str | None = None
    size: str | None = None
    milk: str | None = None
    extras: list[str] | None = None
    name: str | None = None

    def mark_no_extras(self) -> None:
        self.extras = []

    def apply_updates(
        self,
        *,
        drink_type: str | None = None,
        size: str | None = None,
        milk: str | None = None,
        extras: list[str] | None = None,
        name: str | None = None,
    ) -> list[str]:
        """Update known fields and return a list of changed field names."""

        changed: list[str] = []
        if drink_type is not None and drink_type != self.drink_type:
            self.drink_type = drink_type
            changed.append("drinkType")
        if size is not None and size != self.size:
            self.size = size
            changed.append("size")
        if milk is not None and milk != self.milk:
            self.milk = milk
            changed.append("milk")
        if extras is not None:
            normalized = [item.strip() for item in extras if item.strip()]
            if normalized != self.extras:
                self.extras = normalized
                changed.append("extras")
        if name is not None and name != self.name:
            self.name = name
            changed.append("name")
        return changed

    def missing_fields(self) -> list[str]:
        missing: list[str] = []
        if not self.drink_type:
            missing.append("drinkType")
        if not self.size:
            missing.append("size")
        if not self.milk:
            missing.append("milk")
        if self.extras is None:
            missing.append("extras")
        if not self.name:
            missing.append("name")
        return missing

    def is_complete(self) -> bool:
        return len(self.missing_fields()) == 0

    def reset(self) -> None:
        self.drink_type = None
        self.size = None
        self.milk = None
        self.extras = None
        self.name = None

    def as_payload(self) -> dict[str, Any]:
        return {
            "drinkType": self.drink_type,
            "size": self.size,
            "milk": self.milk,
            "extras": self.extras if self.extras is not None else [],
            "name": self.name,
        }

    def summary(self) -> str:
        extras = ", ".join(self.extras or ["no extras"])
        return (
            f"{self.size or '?'} {self.drink_type or 'drink'} with {self.milk or '?'} milk, "
            f"extras: {extras}, for {self.name or 'guest'}."
        )


def _slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "guest"


@dataclass
class OrderStore:
    base_dir: Path = field(default_factory=lambda: DEFAULT_ORDER_DIR)

    def save(self, order: OrderState) -> Path:
        """Persist an order (complete or incomplete) to disk."""

        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        slug = _slugify(order.name or "guest")
        file_path = self.base_dir / f"order-{ts}-{slug}.json"
        
        payload = {
            "order": order.as_payload(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "summary": order.summary(),
        }
        
        if order.is_complete():
             payload["completedAt"] = datetime.now(timezone.utc).isoformat()

        file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return file_path