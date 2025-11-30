"""
Order Management Module - ACP-inspired E-commerce Agent

This module handles order creation, storage, and retrieval.
Following ACP principles, orders have structured data with clear attributes.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Optional

from .catalog import get_product_by_id

# In-memory order storage (also persisted to JSON file)
ORDERS: list[dict] = []

# Path for JSON persistence
ORDERS_FILE = os.path.join(os.path.dirname(__file__), "orders.json")


def _load_orders_from_file() -> None:
    """Load orders from JSON file if it exists."""
    global ORDERS
    if os.path.exists(ORDERS_FILE):
        try:
            with open(ORDERS_FILE, "r") as f:
                ORDERS = json.load(f)
        except (json.JSONDecodeError, IOError):
            ORDERS = []


def _save_orders_to_file() -> None:
    """Persist orders to JSON file."""
    try:
        with open(ORDERS_FILE, "w") as f:
            json.dump(ORDERS, f, indent=2, default=str)
    except IOError as e:
        print(f"Warning: Could not save orders to file: {e}")


# Load existing orders on module import
_load_orders_from_file()


def create_order(
    line_items: list[dict],
    session_id: Optional[str] = None,
    customer_notes: Optional[str] = None,
) -> dict:
    """
    Create a new order from line items.
    
    Args:
        line_items: List of items to order, each with:
            - product_id: The product identifier
            - quantity: Number of items (default: 1)
            - size: Optional size for clothing items
        session_id: Optional session identifier for tracking
        customer_notes: Optional notes from the customer
    
    Returns:
        Created order dict with order details
    
    Raises:
        ValueError: If product not found or invalid line items
    """
    if not line_items:
        raise ValueError("Order must contain at least one item")
    
    # Process line items and calculate totals
    processed_items = []
    total = 0
    currency = "INR"  # Default currency
    
    for item in line_items:
        product_id = item.get("product_id")
        quantity = item.get("quantity", 1)
        size = item.get("size")
        
        if not product_id:
            raise ValueError("Each line item must have a product_id")
        
        if quantity < 1:
            raise ValueError("Quantity must be at least 1")
        
        product = get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product not found: {product_id}")
        
        # Validate size for clothing items
        if "sizes" in product and size:
            if size.upper() not in product["sizes"]:
                available_sizes = ", ".join(product["sizes"])
                raise ValueError(
                    f"Size {size} not available for {product['name']}. "
                    f"Available sizes: {available_sizes}"
                )
        
        item_total = product["price"] * quantity
        total += item_total
        currency = product.get("currency", currency)
        
        processed_items.append({
            "product_id": product_id,
            "product_name": product["name"],
            "quantity": quantity,
            "size": size.upper() if size else None,
            "unit_price": product["price"],
            "item_total": item_total,
            "currency": currency,
        })
    
    # Generate order
    order = {
        "id": f"ORD-{uuid.uuid4().hex[:8].upper()}",
        "items": processed_items,
        "item_count": sum(item["quantity"] for item in processed_items),
        "subtotal": total,
        "total": total,  # Could add tax/shipping here
        "currency": currency,
        "status": "confirmed",
        "session_id": session_id,
        "customer_notes": customer_notes,
        "created_at": datetime.now().isoformat(),
    }
    
    # Store order
    ORDERS.append(order)
    _save_orders_to_file()
    
    return order


def get_order(order_id: str) -> Optional[dict]:
    """
    Get an order by its ID.
    
    Args:
        order_id: The order identifier
    
    Returns:
        Order dict if found, None otherwise
    """
    for order in ORDERS:
        if order["id"] == order_id:
            return order
    return None


def get_last_order(session_id: Optional[str] = None) -> Optional[dict]:
    """
    Get the most recent order, optionally filtered by session.
    
    Args:
        session_id: Optional session filter
    
    Returns:
        Most recent order dict, or None if no orders exist
    """
    if not ORDERS:
        return None
    
    if session_id:
        session_orders = [o for o in ORDERS if o.get("session_id") == session_id]
        return session_orders[-1] if session_orders else None
    
    return ORDERS[-1]


def get_all_orders(session_id: Optional[str] = None, limit: int = 10) -> list[dict]:
    """
    Get all orders, optionally filtered by session.
    
    Args:
        session_id: Optional session filter
        limit: Maximum number of orders to return (default: 10)
    
    Returns:
        List of orders, most recent first
    """
    orders = ORDERS.copy()
    
    if session_id:
        orders = [o for o in orders if o.get("session_id") == session_id]
    
    # Return most recent first
    orders = list(reversed(orders))
    
    return orders[:limit]


def get_order_summary(order: dict) -> str:
    """
    Generate a human-readable summary of an order.
    
    Args:
        order: The order dict
    
    Returns:
        Formatted order summary string
    """
    items_summary = []
    for item in order["items"]:
        size_str = f" (Size: {item['size']})" if item.get("size") else ""
        items_summary.append(
            f"- {item['quantity']}x {item['product_name']}{size_str}: "
            f"{item['currency']} {item['item_total']}"
        )
    
    summary = f"""Order ID: {order['id']}
Status: {order['status']}
Items:
{chr(10).join(items_summary)}
Total: {order['currency']} {order['total']}
Placed at: {order['created_at']}"""
    
    return summary


def cancel_order(order_id: str) -> Optional[dict]:
    """
    Cancel an order by its ID.
    
    Args:
        order_id: The order identifier
    
    Returns:
        Updated order dict if found, None otherwise
    """
    for order in ORDERS:
        if order["id"] == order_id:
            if order["status"] == "confirmed":
                order["status"] = "cancelled"
                order["cancelled_at"] = datetime.now().isoformat()
                _save_orders_to_file()
                return order
            else:
                raise ValueError(f"Cannot cancel order with status: {order['status']}")
    return None
