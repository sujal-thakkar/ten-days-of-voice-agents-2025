"""
ACP-Style HTTP API - E-commerce Voice Agent

FastAPI HTTP endpoints following the Agentic Commerce Protocol (ACP) specification.
This provides REST API access to the commerce functionality alongside the voice agent.

Endpoints:
- GET /acp/catalog - List products
- GET /acp/catalog/{product_id} - Get product details
- POST /acp/cart/items - Add to cart
- GET /acp/cart - Get cart
- DELETE /acp/cart/items/{product_id} - Remove from cart
- POST /acp/checkout_sessions - Create checkout session
- GET /acp/checkout_sessions/{id} - Get checkout session
- POST /acp/checkout_sessions/{id} - Update checkout session
- POST /acp/checkout_sessions/{id}/complete - Complete checkout
- GET /acp/orders - List orders
- GET /acp/orders/analytics - Order analytics
"""

import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from commerce.catalog import (
    PRODUCTS,
    get_product_by_id,
    list_products,
    search_products,
    get_available_categories,
)
from commerce.cart import (
    get_cart,
    add_to_cart,
    update_cart_item,
    remove_from_cart,
    clear_cart,
    get_cart_total,
    create_checkout_session,
    get_checkout_session,
    update_checkout_session,
)
from commerce.orders import (
    create_order,
    get_order,
    get_all_orders,
    get_order_summary,
    ORDERS,
)
from commerce.models import (
    Product,
    ProductListResponse,
    AddToCartRequest,
    UpdateCartItemRequest,
    CreateCheckoutRequest,
    UpdateCheckoutRequest,
    CompleteCheckoutRequest,
    CheckoutSession,
    CheckoutStatus,
    Order,
    OrderDetail,
    OrderStatus,
    OrderAnalytics,
    ErrorResponse,
    Buyer,
)

logger = logging.getLogger("acp-api")

# Create FastAPI app
app = FastAPI(
    title="ACP E-commerce API",
    description="Agentic Commerce Protocol (ACP) inspired REST API for voice-driven shopping",
    version="2025-01-01",
    docs_url="/acp/docs",
    redoc_url="/acp/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Helper functions
# ============================================================================

def get_session_id(request: Request, x_session_id: Optional[str] = Header(None)) -> str:
    """Extract or generate session ID from request."""
    if x_session_id:
        return x_session_id
    # Could also check cookies, auth tokens, etc.
    return f"session_{uuid.uuid4().hex[:8]}"


def create_error_response(
    status_code: int,
    error_type: str,
    code: str,
    message: str,
    param: Optional[str] = None,
) -> JSONResponse:
    """Create ACP-style flat error response."""
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            type=error_type,
            code=code,
            message=message,
            param=param,
        ).model_dump(),
    )


# ============================================================================
# Catalog Endpoints
# ============================================================================

@app.get("/acp/catalog", response_model=ProductListResponse, tags=["Catalog"])
async def list_catalog(
    category: Optional[str] = Query(None, description="Filter by category"),
    max_price: Optional[int] = Query(None, description="Maximum price (minor units)"),
    min_price: Optional[int] = Query(None, description="Minimum price (minor units)"),
    color: Optional[str] = Query(None, description="Filter by color"),
    size: Optional[str] = Query(None, description="Filter by size (clothing)"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Max products to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    List products from the catalog with optional filtering.
    
    Following ACP principles, all prices are in minor units (e.g., 499 = ₹4.99).
    """
    if search:
        products = search_products(search)
    else:
        products = list_products(
            category=category,
            max_price=max_price,
            min_price=min_price,
            color=color,
            size=size,
        )
    
    total = len(products)
    products = products[offset:offset + limit]
    
    return ProductListResponse(
        products=[Product(**p) for p in products],
        total=total,
        limit=limit,
        offset=offset,
    )


@app.get("/acp/catalog/{product_id}", response_model=Product, tags=["Catalog"])
async def get_product(product_id: str):
    """Get details for a specific product."""
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
    return Product(**product)


@app.get("/acp/catalog/categories", tags=["Catalog"])
async def list_categories():
    """Get all available product categories."""
    categories = get_available_categories()
    return {
        "categories": categories,
        "display_names": {
            "mug": "Coffee Mugs",
            "tshirt": "T-Shirts",
            "hoodie": "Hoodies",
            "bottle": "Water Bottles",
            "bag": "Bags & Backpacks",
        }
    }


# ============================================================================
# Cart Endpoints
# ============================================================================

@app.get("/acp/cart", tags=["Cart"])
async def get_shopping_cart(
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """Get the current shopping cart."""
    session_id = get_session_id(request, x_session_id)
    cart = get_cart(session_id)
    totals = get_cart_total(session_id)
    
    # Enrich cart items with product details
    enriched_items = []
    for item in cart.items:
        product = get_product_by_id(item.product_id)
        if product:
            enriched_items.append({
                "product_id": item.product_id,
                "product_name": product["name"],
                "quantity": item.quantity,
                "size": item.size,
                "unit_price": product["price"],
                "total_price": product["price"] * item.quantity,
                "currency": product.get("currency", "INR"),
                "image_url": product.get("image_url"),
            })
    
    return {
        "id": cart.id,
        "items": enriched_items,
        "item_count": totals["item_count"],
        "subtotal": totals["subtotal"],
        "tax": totals["tax"],
        "total": totals["total"],
        "currency": totals["currency"],
        "updated_at": cart.updated_at.isoformat(),
    }


@app.post("/acp/cart/items", tags=["Cart"])
async def add_item_to_cart(
    request: Request,
    body: AddToCartRequest,
    x_session_id: Optional[str] = Header(None),
):
    """Add an item to the shopping cart."""
    session_id = get_session_id(request, x_session_id)
    
    try:
        cart = add_to_cart(
            session_id=session_id,
            product_id=body.product_id,
            quantity=body.quantity,
            size=body.size,
        )
        totals = get_cart_total(session_id)
        
        return {
            "success": True,
            "message": f"Added {body.quantity}x {body.product_id} to cart",
            "cart_id": cart.id,
            "item_count": totals["item_count"],
            "total": totals["total"],
            "currency": totals["currency"],
        }
    except ValueError as e:
        return create_error_response(
            status_code=400,
            error_type="invalid_request",
            code="invalid",
            message=str(e),
            param="$.product_id",
        )


@app.put("/acp/cart/items/{product_id}", tags=["Cart"])
async def update_item_in_cart(
    product_id: str,
    body: UpdateCartItemRequest,
    request: Request,
    x_session_id: Optional[str] = Header(None),
    size: Optional[str] = Query(None, description="Size for clothing items"),
):
    """Update quantity of an item in the cart."""
    session_id = get_session_id(request, x_session_id)
    
    cart = update_cart_item(
        session_id=session_id,
        product_id=product_id,
        quantity=body.quantity,
        size=size,
    )
    totals = get_cart_total(session_id)
    
    return {
        "success": True,
        "message": f"Updated {product_id} quantity to {body.quantity}",
        "item_count": totals["item_count"],
        "total": totals["total"],
    }


@app.delete("/acp/cart/items/{product_id}", tags=["Cart"])
async def remove_item_from_cart(
    product_id: str,
    request: Request,
    x_session_id: Optional[str] = Header(None),
    size: Optional[str] = Query(None, description="Size for clothing items"),
):
    """Remove an item from the cart."""
    session_id = get_session_id(request, x_session_id)
    
    cart = remove_from_cart(session_id, product_id, size)
    totals = get_cart_total(session_id)
    
    return {
        "success": True,
        "message": f"Removed {product_id} from cart",
        "item_count": totals["item_count"],
        "total": totals["total"],
    }


@app.delete("/acp/cart", tags=["Cart"])
async def clear_shopping_cart(
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """Clear all items from the cart."""
    session_id = get_session_id(request, x_session_id)
    clear_cart(session_id)
    
    return {
        "success": True,
        "message": "Cart cleared",
        "item_count": 0,
        "total": 0,
    }


# ============================================================================
# Checkout Session Endpoints (ACP-style)
# ============================================================================

@app.post("/acp/checkout_sessions", response_model=CheckoutSession, tags=["Checkout"])
async def create_checkout(
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """
    Create a checkout session from the current cart.
    
    Following ACP specification:
    - Returns full authoritative cart state
    - All amounts are integers in minor units
    - Status lifecycle: not_ready_for_payment → ready_for_payment → completed
    """
    session_id = get_session_id(request, x_session_id)
    
    checkout = create_checkout_session(session_id)
    return checkout


@app.get("/acp/checkout_sessions/{checkout_session_id}", response_model=CheckoutSession, tags=["Checkout"])
async def get_checkout(checkout_session_id: str):
    """
    Retrieve a checkout session by ID.
    
    Returns the full authoritative session state.
    """
    session = get_checkout_session(checkout_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    return session


@app.post("/acp/checkout_sessions/{checkout_session_id}", response_model=CheckoutSession, tags=["Checkout"])
async def update_checkout(
    checkout_session_id: str,
    body: UpdateCheckoutRequest,
):
    """
    Update a checkout session.
    
    Can update fulfillment option, address, etc.
    Returns full authoritative state after update.
    """
    session = update_checkout_session(
        checkout_session_id=checkout_session_id,
        fulfillment_option_id=body.fulfillment_option_id,
        fulfillment_address=body.fulfillment_address.model_dump() if body.fulfillment_address else None,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    return session


@app.post("/acp/checkout_sessions/{checkout_session_id}/complete", tags=["Checkout"])
async def complete_checkout(
    checkout_session_id: str,
    body: CompleteCheckoutRequest,
    request: Request,
    x_session_id: Optional[str] = Header(None),
):
    """
    Complete a checkout session and create an order.
    
    Following ACP specification:
    - Status changes to 'completed'
    - Order is created with id, checkout_session_id, and permalink_url
    """
    session = get_checkout_session(checkout_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    
    if session.status == CheckoutStatus.COMPLETED:
        return create_error_response(
            status_code=400,
            error_type="invalid_request",
            code="already_completed",
            message="This checkout session has already been completed",
        )
    
    if session.status == CheckoutStatus.CANCELED:
        return create_error_response(
            status_code=400,
            error_type="invalid_request",
            code="session_canceled",
            message="This checkout session has been canceled",
        )
    
    # Create order from checkout session
    line_items = [
        {
            "product_id": li.item.id,
            "quantity": li.item.quantity,
            "size": li.size,
        }
        for li in session.line_items
    ]
    
    cart_session_id = get_session_id(request, x_session_id)
    
    try:
        order = create_order(
            line_items=line_items,
            session_id=cart_session_id,
        )
        
        # Update checkout session
        session.status = CheckoutStatus.COMPLETED
        session.order = Order(
            id=order["id"],
            checkout_session_id=checkout_session_id,
            permalink_url=f"/orders/{order['id']}",
        )
        if body.buyer:
            session.buyer = body.buyer
        
        # Clear cart after successful order
        clear_cart(cart_session_id)
        
        return session
        
    except ValueError as e:
        return create_error_response(
            status_code=400,
            error_type="processing_error",
            code="order_failed",
            message=str(e),
        )


@app.post("/acp/checkout_sessions/{checkout_session_id}/cancel", tags=["Checkout"])
async def cancel_checkout(checkout_session_id: str):
    """
    Cancel a checkout session.
    
    Returns 200 if canceled successfully, 405 if already completed/canceled.
    """
    session = get_checkout_session(checkout_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    
    if session.status in [CheckoutStatus.COMPLETED, CheckoutStatus.CANCELED]:
        raise HTTPException(
            status_code=405, 
            detail=f"Cannot cancel session with status: {session.status.value}"
        )
    
    session.status = CheckoutStatus.CANCELED
    return session


# ============================================================================
# Orders Endpoints
# ============================================================================

@app.get("/acp/orders", tags=["Orders"])
async def list_orders(
    request: Request,
    x_session_id: Optional[str] = Header(None),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """List orders for the current session."""
    session_id = get_session_id(request, x_session_id)
    orders = get_all_orders(session_id=session_id, limit=limit)
    
    if status:
        orders = [o for o in orders if o.get("status") == status]
    
    return {
        "orders": orders,
        "total": len(orders),
    }


@app.get("/acp/orders/{order_id}", tags=["Orders"])
async def get_order_details(order_id: str):
    """Get details for a specific order."""
    order = get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order not found: {order_id}")
    return order


@app.get("/acp/orders/analytics/summary", response_model=OrderAnalytics, tags=["Orders"])
async def get_order_analytics(
    request: Request,
    x_session_id: Optional[str] = Header(None),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
):
    """
    Get order analytics and summary.
    
    Returns total orders, revenue, average order value, etc.
    """
    session_id = get_session_id(request, x_session_id)
    
    # Filter orders
    orders = ORDERS.copy()
    
    if start_date:
        start = datetime.fromisoformat(start_date)
        orders = [
            o for o in orders 
            if datetime.fromisoformat(o["created_at"]) >= start
        ]
    
    if end_date:
        end = datetime.fromisoformat(end_date)
        orders = [
            o for o in orders 
            if datetime.fromisoformat(o["created_at"]) <= end
        ]
    
    if not orders:
        return OrderAnalytics(
            total_orders=0,
            total_revenue=0,
            average_order_value=0,
            currency="INR",
            orders_by_status={},
            top_products=[],
        )
    
    # Calculate analytics
    total_revenue = sum(o["total"] for o in orders)
    avg_order_value = total_revenue // len(orders) if orders else 0
    
    # Count by status
    orders_by_status = {}
    for order in orders:
        status = order.get("status", "unknown")
        orders_by_status[status] = orders_by_status.get(status, 0) + 1
    
    # Top products
    product_counts = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id", "unknown")
            product_counts[pid] = product_counts.get(pid, 0) + item.get("quantity", 1)
    
    top_products = [
        {"product_id": pid, "quantity_sold": qty}
        for pid, qty in sorted(
            product_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
    ]
    
    return OrderAnalytics(
        total_orders=len(orders),
        total_revenue=total_revenue,
        average_order_value=avg_order_value,
        currency="INR",
        orders_by_status=orders_by_status,
        top_products=top_products,
    )


# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/acp/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2025-01-01",
    }


@app.get("/acp/info", tags=["System"])
async def api_info():
    """API information and capabilities."""
    return {
        "name": "ACP E-commerce API",
        "version": "2025-01-01",
        "protocol": "Agentic Commerce Protocol (ACP)",
        "capabilities": {
            "catalog": True,
            "cart": True,
            "checkout": True,
            "orders": True,
            "analytics": True,
        },
        "payment_provider": {
            "provider": "internal",
            "supported_payment_methods": ["card"],
        },
        "currency": "INR",
        "links": {
            "documentation": "/acp/docs",
            "specification": "https://agenticcommerce.dev",
        },
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError exceptions."""
    return create_error_response(
        status_code=400,
        error_type="invalid_request",
        code="invalid",
        message=str(exc),
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return create_error_response(
        status_code=500,
        error_type="service_unavailable",
        code="internal_error",
        message="An unexpected error occurred",
    )


# ============================================================================
# Run configuration
# ============================================================================

def create_app() -> FastAPI:
    """Factory function to create the FastAPI app."""
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
