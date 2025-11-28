from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Dict, Iterable, List, Optional

ROOT_DIR = Path(__file__).resolve().parent
CATALOG_PATH = ROOT_DIR / "catalog.json"
RECIPES_PATH = ROOT_DIR / "recipes.json"
DB_PATH = ROOT_DIR / "orders.db"


@dataclass(frozen=True)
class CatalogItem:
    id: str
    name: str
    category: str
    price_inr: int
    unit: str
    brand: str
    description: str
    tags: List[str]


@dataclass(frozen=True)
class RecipeComponent:
    catalog_id: str
    quantity: int
    notes: Optional[str] = None


@dataclass(frozen=True)
class RecipeDefinition:
    key: str
    display_name: str
    description: str
    items: List[RecipeComponent]


@dataclass
class CartLine:
    catalog_id: str
    item_name: str
    quantity: int
    unit_price_inr: int
    notes: Optional[str] = None

    @property
    def line_total(self) -> int:
        return self.quantity * self.unit_price_inr


class CatalogRepository:
    def __init__(self, path: Path = CATALOG_PATH) -> None:
        self.path = path
        self._items = self._load()

    def _load(self) -> Dict[str, CatalogItem]:
        with self.path.open("r", encoding="utf-8") as handle:
            raw_items = json.load(handle)
        items: Dict[str, CatalogItem] = {}
        for raw in raw_items:
            items[raw["id"]] = CatalogItem(
                id=raw["id"],
                name=raw["name"],
                category=raw["category"],
                price_inr=int(raw["price_inr"]),
                unit=raw["unit"],
                brand=raw["brand"],
                description=raw["description"],
                tags=list(raw.get("tags", [])),
            )
        return items

    def all_items(self) -> Iterable[CatalogItem]:
        return self._items.values()

    def get(self, item_id: str) -> Optional[CatalogItem]:
        return self._items.get(item_id)


class RecipeBook:
    def __init__(self, path: Path = RECIPES_PATH) -> None:
        self.path = path
        self._recipes = self._load()

    def _load(self) -> Dict[str, RecipeDefinition]:
        with self.path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        recipes: Dict[str, RecipeDefinition] = {}
        for key, raw in payload.items():
            items = [
                RecipeComponent(
                    catalog_id=item["catalog_id"],
                    quantity=int(item.get("quantity", 1)),
                    notes=item.get("notes"),
                )
                for item in raw["items"]
            ]
            recipes[key] = RecipeDefinition(
                key=key,
                display_name=raw["display_name"],
                description=raw.get("description", ""),
                items=items,
            )
        return recipes

    def get(self, recipe_key: str) -> Optional[RecipeDefinition]:
        return self._recipes.get(recipe_key)

    def match_keyword(self, keyword: str) -> Optional[RecipeDefinition]:
        keyword = keyword.lower().strip()
        for recipe in self._recipes.values():
            key_hit = keyword in recipe.key.lower()
            name_hit = keyword in recipe.display_name.lower()
            if key_hit or name_hit:
                return recipe
        return None

    def all_recipes(self) -> Iterable[RecipeDefinition]:
        return self._recipes.values()


class OrderStore:
    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = RLock()
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        schema_statements = [
            """
            CREATE TABLE IF NOT EXISTS carts (
                session_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                catalog_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                unit_price_inr INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                notes TEXT,
                UNIQUE(session_id, catalog_id),
                FOREIGN KEY(session_id) REFERENCES carts(session_id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                customer_name TEXT,
                contact_info TEXT,
                metadata_json TEXT,
                total_inr INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'INR',
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                catalog_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                unit_price_inr INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                notes TEXT,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS order_status_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
            """,
        ]
        with self._conn:
            for statement in schema_statements:
                self._conn.execute(statement)

    def close(self) -> None:
        with self._lock:
            self._conn.close()

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _ensure_cart(self, session_id: str) -> None:
        timestamp = self._now()
        with self._conn:
            self._conn.execute(
                "INSERT OR IGNORE INTO carts(session_id, created_at, updated_at) VALUES (?, ?, ?)",
                (session_id, timestamp, timestamp),
            )

    def _touch_cart(self, session_id: str) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE carts SET updated_at = ? WHERE session_id = ?",
                (self._now(), session_id),
            )

    def add_item_to_cart(
        self,
        session_id: str,
        catalog: CatalogItem,
        quantity: int = 1,
        notes: Optional[str] = None,
    ) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive when adding to cart")
        with self._lock:
            self._ensure_cart(session_id)
            with self._conn:
                existing = self._conn.execute(
                    "SELECT id, quantity FROM cart_items WHERE session_id = ? AND catalog_id = ?",
                    (session_id, catalog.id),
                ).fetchone()
                if existing:
                    new_qty = existing["quantity"] + quantity
                    self._conn.execute(
                        "UPDATE cart_items SET quantity = ?, notes = COALESCE(?, notes) WHERE id = ?",
                        (new_qty, notes, existing["id"]),
                    )
                else:
                    self._conn.execute(
                        """
                        INSERT INTO cart_items (session_id, catalog_id, item_name, unit_price_inr, quantity, notes)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            session_id,
                            catalog.id,
                            catalog.name,
                            catalog.price_inr,
                            quantity,
                            notes,
                        ),
                    )
            self._touch_cart(session_id)

    def set_item_quantity(
        self,
        session_id: str,
        catalog_id: str,
        quantity: int,
    ) -> None:
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        with self._lock:
            with self._conn:
                if quantity == 0:
                    self._conn.execute(
                        "DELETE FROM cart_items WHERE session_id = ? AND catalog_id = ?",
                        (session_id, catalog_id),
                    )
                else:
                    updated = self._conn.execute(
                        """
                        UPDATE cart_items SET quantity = ? WHERE session_id = ? AND catalog_id = ?
                        """,
                        (quantity, session_id, catalog_id),
                    )
                    if updated.rowcount == 0:
                        raise KeyError(f"Item {catalog_id} not found in cart")
            self._touch_cart(session_id)

    def remove_item(self, session_id: str, catalog_id: str) -> None:
        with self._lock:
            with self._conn:
                self._conn.execute(
                    "DELETE FROM cart_items WHERE session_id = ? AND catalog_id = ?",
                    (session_id, catalog_id),
                )
            self._touch_cart(session_id)

    def clear_cart(self, session_id: str) -> None:
        with self._lock:
            with self._conn:
                self._conn.execute(
                    "DELETE FROM cart_items WHERE session_id = ?",
                    (session_id,),
                )
            self._touch_cart(session_id)

    def get_cart(self, session_id: str) -> List[CartLine]:
        rows = self._conn.execute(
            """
            SELECT catalog_id, item_name, quantity, unit_price_inr, notes
            FROM cart_items
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,),
        ).fetchall()
        return [
            CartLine(
                catalog_id=row["catalog_id"],
                item_name=row["item_name"],
                quantity=row["quantity"],
                unit_price_inr=row["unit_price_inr"],
                notes=row["notes"],
            )
            for row in rows
        ]

    def cart_total(self, session_id: str) -> int:
        rows = self._conn.execute(
            "SELECT SUM(quantity * unit_price_inr) as total FROM cart_items WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        return int(rows["total"] or 0)

    def place_order(
        self,
        session_id: str,
        customer_name: Optional[str] = None,
        contact_info: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[int]:
        with self._lock:
            cart_lines = self.get_cart(session_id)
            if not cart_lines:
                return None
            total = sum(line.line_total for line in cart_lines)
            metadata_json = json.dumps(metadata) if metadata else None
            timestamp = self._now()
            with self._conn:
                cur = self._conn.execute(
                    """
                    INSERT INTO orders (session_id, customer_name, contact_info, metadata_json, total_inr, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (session_id, customer_name, contact_info, metadata_json, total, timestamp),
                )
                order_id = cur.lastrowid
                self._conn.executemany(
                    """
                    INSERT INTO order_items (order_id, catalog_id, item_name, unit_price_inr, quantity, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    [
                        (
                            order_id,
                            line.catalog_id,
                            line.item_name,
                            line.unit_price_inr,
                            line.quantity,
                            line.notes,
                        )
                        for line in cart_lines
                    ],
                )
                self._conn.execute(
                    """
                    INSERT INTO order_status_events (order_id, status, description, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (order_id, "PLACED", "Order received via voice agent", timestamp),
                )
                self._conn.execute(
                    "DELETE FROM cart_items WHERE session_id = ?",
                    (session_id,),
                )
            return order_id

    def append_status(self, order_id: int, status: str, description: Optional[str] = None) -> None:
        with self._conn:
            self._conn.execute(
                """
                INSERT INTO order_status_events (order_id, status, description, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (order_id, status, description, self._now()),
            )

    def order_summary(self, order_id: int) -> Optional[dict]:
        order_row = self._conn.execute(
            "SELECT * FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        if not order_row:
            return None
        items = self._conn.execute(
            """
            SELECT catalog_id, item_name, quantity, unit_price_inr, notes
            FROM order_items
            WHERE order_id = ?
            ORDER BY id ASC
            """,
            (order_id,),
        ).fetchall()
        statuses = self._conn.execute(
            "SELECT status, description, created_at FROM order_status_events WHERE order_id = ? ORDER BY id ASC",
            (order_id,),
        ).fetchall()
        return {
            "id": order_row["id"],
            "total_inr": order_row["total_inr"],
            "currency": order_row["currency"],
            "created_at": order_row["created_at"],
            "customer_name": order_row["customer_name"],
            "contact_info": order_row["contact_info"],
            "items": [dict(row) for row in items],
            "status_history": [dict(row) for row in statuses],
            "metadata": json.loads(order_row["metadata_json"]) if order_row["metadata_json"] else None,
        }

    def latest_order_for_session(self, session_id: str) -> Optional[dict]:
        row = self._conn.execute(
            "SELECT id FROM orders WHERE session_id = ? ORDER BY id DESC LIMIT 1",
            (session_id,),
        ).fetchone()
        if not row:
            return None
        return self.order_summary(row["id"])


__all__ = [
    "CatalogItem",
    "CatalogRepository",
    "RecipeBook",
    "RecipeDefinition",
    "RecipeComponent",
    "OrderStore",
    "CartLine",
    "CATALOG_PATH",
    "RECIPES_PATH",
    "DB_PATH",
]
