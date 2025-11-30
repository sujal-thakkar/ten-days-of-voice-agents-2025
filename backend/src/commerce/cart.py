"""
Shopping Cart Module - ACP-inspired E-commerce Agent

This module handles shopping cart management with session-based carts.
Following ACP principles, carts are associated with checkout sessions.
"""

import uuid
from datetime import datetime
from typing import Optional

from .catalog import get_product_by_id
from .models import (
    Cart,
    CartItem,
    LineItem,
    Item,
    Total,
    TotalType,
    CheckoutSession,
    CheckoutStatus,
    FulfillmentOption,
    FulfillmentType,
)

# In-memory cart storage (keyed by session_id)
CARTS: dict[str, Cart] = {}

# In-memory checkout session storage
CHECKOUT_SESSIONS: dict[str, CheckoutSession] = {}


def get_or_create_cart(session_id: str) -> Cart:
    """
    Get existing cart or create a new one for the session.
    
    Args:
        session_id: The session identifier
    
    Returns:
        Cart instance
    """
    if session_id not in CARTS:
        CARTS[session_id] = Cart(
            id=session_id,
            items=[],
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    return CARTS[session_id]


def add_to_cart(
    session_id: str,
    product_id: str,
    quantity: int = 1,
    size: Optional[str] = None,
) -> Cart:
    """
    Add an item to the cart.
    
    Args:
        session_id: The session identifier
        product_id: The product to add
        quantity: Number of items to add
        size: Size for clothing items
    
    Returns:
        Updated cart
    
    Raises:
        ValueError: If product not found or invalid
    """
    product = get_product_by_id(product_id)
    if not product:
        raise ValueError(f"Product not found: {product_id}")
    
    if not product.get("in_stock", True):
        raise ValueError(f"Product out of stock: {product_id}")
    
    # Validate size for clothing
    if "sizes" in product and size:
        if size.upper() not in product["sizes"]:
            raise ValueError(
                f"Size {size} not available. Available: {', '.join(product['sizes'])}"
            )
    
    cart = get_or_create_cart(session_id)
    
    # Check if item already in cart (same product and size)
    for item in cart.items:
        if item.product_id == product_id and item.size == (size.upper() if size else None):
            item.quantity += quantity
            cart.updated_at = datetime.now()
            return cart
    
    # Add new item
    cart.items.append(CartItem(
        product_id=product_id,
        quantity=quantity,
        size=size.upper() if size else None,
    ))
    cart.updated_at = datetime.now()
    
    return cart


def update_cart_item(
    session_id: str,
    product_id: str,
    quantity: int,
    size: Optional[str] = None,
) -> Cart:
    """
    Update quantity of an item in the cart.
    
    Args:
        session_id: The session identifier
        product_id: The product to update
        quantity: New quantity (0 to remove)
        size: Size to match for clothing items
    
    Returns:
        Updated cart
    """
    cart = get_or_create_cart(session_id)
    size_upper = size.upper() if size else None
    
    if quantity == 0:
        # Remove item
        cart.items = [
            item for item in cart.items 
            if not (item.product_id == product_id and item.size == size_upper)
        ]
    else:
        # Update quantity
        for item in cart.items:
            if item.product_id == product_id and item.size == size_upper:
                item.quantity = quantity
                break
    
    cart.updated_at = datetime.now()
    return cart


def remove_from_cart(
    session_id: str,
    product_id: str,
    size: Optional[str] = None,
) -> Cart:
    """
    Remove an item from the cart.
    
    Args:
        session_id: The session identifier
        product_id: The product to remove
        size: Size to match for clothing items
    
    Returns:
        Updated cart
    """
    return update_cart_item(session_id, product_id, 0, size)


def clear_cart(session_id: str) -> Cart:
    """
    Clear all items from the cart.
    
    Args:
        session_id: The session identifier
    
    Returns:
        Empty cart
    """
    cart = get_or_create_cart(session_id)
    cart.items = []
    cart.updated_at = datetime.now()
    return cart


def get_cart(session_id: str) -> Cart:
    """
    Get the cart for a session.
    
    Args:
        session_id: The session identifier
    
    Returns:
        Cart instance (empty if none exists)
    """
    return get_or_create_cart(session_id)


def get_cart_total(session_id: str) -> dict:
    """
    Calculate cart totals.
    
    Args:
        session_id: The session identifier
    
    Returns:
        Dict with item_count, subtotal, tax, total, currency
    """
    cart = get_or_create_cart(session_id)
    
    subtotal = 0
    item_count = 0
    currency = "INR"
    
    for cart_item in cart.items:
        product = get_product_by_id(cart_item.product_id)
        if product:
            item_count += cart_item.quantity
            subtotal += product["price"] * cart_item.quantity
            currency = product.get("currency", currency)
    
    # Simple tax calculation (10%)
    tax = int(subtotal * 0.10)
    total = subtotal + tax
    
    return {
        "item_count": item_count,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "currency": currency,
    }


def cart_to_line_items(session_id: str) -> list[LineItem]:
    """
    Convert cart items to ACP-style line items.
    
    Args:
        session_id: The session identifier
    
    Returns:
        List of LineItem objects
    """
    cart = get_or_create_cart(session_id)
    line_items = []
    
    for i, cart_item in enumerate(cart.items):
        product = get_product_by_id(cart_item.product_id)
        if not product:
            continue
        
        base_amount = product["price"] * cart_item.quantity
        discount = 0
        subtotal = base_amount - discount
        tax = int(subtotal * 0.10)  # 10% tax
        total = subtotal + tax
        
        line_items.append(LineItem(
            id=f"li_{session_id}_{i}",
            item=Item(id=cart_item.product_id, quantity=cart_item.quantity),
            base_amount=base_amount,
            discount=discount,
            subtotal=subtotal,
            tax=tax,
            total=total,
            product_name=product["name"],
            size=cart_item.size,
            unit_price=product["price"],
        ))
    
    return line_items


def create_checkout_session(session_id: str) -> CheckoutSession:
    """
    Create an ACP-style checkout session from the cart.
    
    Args:
        session_id: The session identifier
    
    Returns:
        CheckoutSession object
    """
    cart = get_or_create_cart(session_id)
    line_items = cart_to_line_items(session_id)
    cart_totals = get_cart_total(session_id)
    
    # Create totals breakdown
    totals = [
        Total(
            type=TotalType.ITEMS_BASE_AMOUNT,
            display_text="Item(s) total",
            amount=sum(li.base_amount for li in line_items),
        ),
        Total(
            type=TotalType.SUBTOTAL,
            display_text="Subtotal",
            amount=cart_totals["subtotal"],
        ),
        Total(
            type=TotalType.TAX,
            display_text="Tax (10%)",
            amount=cart_totals["tax"],
        ),
        Total(
            type=TotalType.TOTAL,
            display_text="Total",
            amount=cart_totals["total"],
        ),
    ]
    
    # Create fulfillment options
    fulfillment_options = [
        FulfillmentOption(
            type=FulfillmentType.SHIPPING,
            id="fulfillment_standard",
            title="Standard Shipping",
            subtitle="Arrives in 5-7 business days",
            carrier="India Post",
            subtotal=50,  # ₹0.50
            tax=5,
            total=55,
        ),
        FulfillmentOption(
            type=FulfillmentType.SHIPPING,
            id="fulfillment_express",
            title="Express Shipping",
            subtitle="Arrives in 2-3 business days",
            carrier="BlueDart",
            subtotal=150,  # ₹1.50
            tax=15,
            total=165,
        ),
    ]
    
    # Determine status
    status = (
        CheckoutStatus.READY_FOR_PAYMENT 
        if line_items 
        else CheckoutStatus.NOT_READY_FOR_PAYMENT
    )
    
    checkout_session = CheckoutSession(
        id=f"cs_{session_id}_{uuid.uuid4().hex[:8]}",
        status=status,
        currency=cart_totals["currency"].lower(),
        line_items=line_items,
        totals=totals,
        fulfillment_options=fulfillment_options,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    # Store session
    CHECKOUT_SESSIONS[checkout_session.id] = checkout_session
    
    return checkout_session


def get_checkout_session(checkout_session_id: str) -> Optional[CheckoutSession]:
    """
    Get a checkout session by ID.
    
    Args:
        checkout_session_id: The checkout session identifier
    
    Returns:
        CheckoutSession if found, None otherwise
    """
    return CHECKOUT_SESSIONS.get(checkout_session_id)


def update_checkout_session(
    checkout_session_id: str,
    fulfillment_option_id: Optional[str] = None,
    fulfillment_address: Optional[dict] = None,
) -> Optional[CheckoutSession]:
    """
    Update a checkout session.
    
    Args:
        checkout_session_id: The checkout session identifier
        fulfillment_option_id: Selected fulfillment option
        fulfillment_address: Shipping address
    
    Returns:
        Updated CheckoutSession if found, None otherwise
    """
    session = CHECKOUT_SESSIONS.get(checkout_session_id)
    if not session:
        return None
    
    if fulfillment_option_id:
        session.fulfillment_option_id = fulfillment_option_id
        # Add fulfillment cost to totals
        for option in session.fulfillment_options:
            if option.id == fulfillment_option_id:
                # Update totals to include shipping
                session.totals = [t for t in session.totals if t.type != TotalType.FULFILLMENT]
                session.totals.insert(-1, Total(
                    type=TotalType.FULFILLMENT,
                    display_text="Shipping",
                    amount=option.total,
                ))
                # Update total
                for total in session.totals:
                    if total.type == TotalType.TOTAL:
                        subtotal = next(
                            (t.amount for t in session.totals if t.type == TotalType.SUBTOTAL), 
                            0
                        )
                        tax = next(
                            (t.amount for t in session.totals if t.type == TotalType.TAX), 
                            0
                        )
                        total.amount = subtotal + tax + option.total
                break
    
    if fulfillment_address:
        from .models import Address
        session.fulfillment_address = Address(**fulfillment_address)
    
    session.updated_at = datetime.now()
    return session
