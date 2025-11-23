import json
from pathlib import Path

import pytest

from order_state import OrderState, OrderStore


def test_order_state_tracks_missing_fields():
    order = OrderState()
    assert set(order.missing_fields()) == {"drinkType", "size", "milk", "extras", "name"}

    order.apply_updates(drink_type="latte", size="medium", milk="oat", name="Rae")
    assert "drinkType" not in order.missing_fields()
    assert "extras" in order.missing_fields()

    order.apply_updates(extras=["cinnamon", "honey drizzle"])
    assert order.is_complete()
    assert not order.missing_fields()


def test_order_store_writes_json(tmp_path: Path):
    store = OrderStore(base_dir=tmp_path)
    order = OrderState()
    order.apply_updates(
        drink_type="cold brew",
        size="large",
        milk="none",
        extras=["light ice"],
        name="Eli",
    )

    saved_path = store.save(order)
    assert saved_path.parent == tmp_path
    payload = json.loads(saved_path.read_text(encoding="utf-8"))
    assert payload["order"]["drinkType"] == "cold brew"
    assert payload["order"]["extras"] == ["light ice"]
    assert "completedAt" in payload
    assert "summary" in payload

    with pytest.raises(ValueError):
        incomplete = OrderState()
        store.save(incomplete)
