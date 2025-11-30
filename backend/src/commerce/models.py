"""
ACP-Aligned Data Models - E-commerce Voice Agent

Pydantic models following the Agentic Commerce Protocol (ACP) specification.
Based on: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol

Key ACP concepts implemented:
- All monetary amounts are integers in minor units (e.g., 499 INR = ₹4.99)
- Line items with base_amount, discount, subtotal, tax, total
- Checkout session with status lifecycle
- Order with permalink_url
- Buyer information
- Fulfillment options
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class CheckoutStatus(str, Enum):
    """Checkout session status following ACP specification."""
    NOT_READY_FOR_PAYMENT = "not_ready_for_payment"
    READY_FOR_PAYMENT = "ready_for_payment"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"


class OrderStatus(str, Enum):
    """Order fulfillment status."""
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class TotalType(str, Enum):
    """Types of totals in a checkout session."""
    ITEMS_BASE_AMOUNT = "items_base_amount"
    ITEMS_DISCOUNT = "items_discount"
    SUBTOTAL = "subtotal"
    DISCOUNT = "discount"
    FULFILLMENT = "fulfillment"
    TAX = "tax"
    FEE = "fee"
    TOTAL = "total"


class FulfillmentType(str, Enum):
    """Types of fulfillment options."""
    SHIPPING = "shipping"
    DIGITAL = "digital"
    PICKUP = "pickup"


class MessageType(str, Enum):
    """Types of messages in checkout response."""
    INFO = "info"
    ERROR = "error"


class ErrorCode(str, Enum):
    """Error codes following ACP specification."""
    MISSING = "missing"
    INVALID = "invalid"
    OUT_OF_STOCK = "out_of_stock"
    PAYMENT_DECLINED = "payment_declined"
    REQUIRES_SIGN_IN = "requires_sign_in"
    REQUIRES_3DS = "requires_3ds"


# ============================================================================
# Product Models
# ============================================================================

class Product(BaseModel):
    """Product in the catalog."""
    id: str = Field(..., description="Unique product identifier")
    name: str = Field(..., description="Product display name")
    description: str = Field("", description="Product description")
    price: int = Field(..., description="Price in minor units (e.g., 499 = ₹4.99)")
    currency: str = Field("INR", description="ISO 4217 currency code")
    category: str = Field(..., description="Product category")
    color: Optional[str] = Field(None, description="Product color")
    material: Optional[str] = Field(None, description="Material composition")
    sizes: Optional[list[str]] = Field(None, description="Available sizes for clothing")
    capacity: Optional[str] = Field(None, description="Capacity for containers")
    in_stock: bool = Field(True, description="Stock availability")
    image_url: Optional[str] = Field(None, description="Product image URL")


class ProductListResponse(BaseModel):
    """Response for product listing."""
    products: list[Product]
    total: int = Field(..., description="Total number of products matching filters")
    limit: int = Field(20, description="Maximum products returned")
    offset: int = Field(0, description="Pagination offset")


# ============================================================================
# Cart / Line Item Models (ACP-aligned)
# ============================================================================

class Item(BaseModel):
    """Item reference in a checkout session - per ACP spec."""
    id: str = Field(..., description="Product ID")
    quantity: int = Field(..., ge=1, description="Quantity (must be >= 1)")


class LineItem(BaseModel):
    """
    Line item in checkout session - per ACP spec.
    All amounts are integers in minor units.
    """
    id: str = Field(..., description="Line item ID")
    item: Item = Field(..., description="Reference to the product")
    base_amount: int = Field(..., description="Base price × quantity (minor units)")
    discount: int = Field(0, description="Discount amount (minor units)")
    subtotal: int = Field(..., description="base_amount - discount (minor units)")
    tax: int = Field(0, description="Tax amount (minor units)")
    total: int = Field(..., description="subtotal + tax (minor units)")
    # Extended fields (not in base ACP)
    product_name: Optional[str] = Field(None, description="Product name for display")
    size: Optional[str] = Field(None, description="Selected size for clothing")
    unit_price: Optional[int] = Field(None, description="Unit price (minor units)")


class CartItem(BaseModel):
    """Shopping cart item - simplified for cart operations."""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(1, ge=1, description="Quantity")
    size: Optional[str] = Field(None, description="Size for clothing items")


class Cart(BaseModel):
    """Shopping cart state."""
    id: str = Field(..., description="Cart/Session ID")
    items: list[CartItem] = Field(default_factory=list, description="Cart items")
    created_at: datetime = Field(default_factory=datetime.now, description="Cart creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")


# ============================================================================
# Address Models (ACP-aligned)
# ============================================================================

class Address(BaseModel):
    """Address following ACP specification."""
    name: str = Field(..., max_length=256, description="Recipient name")
    line_one: str = Field(..., max_length=60, description="Address line 1")
    line_two: Optional[str] = Field("", max_length=60, description="Address line 2")
    city: str = Field(..., max_length=60, description="City")
    state: str = Field(..., description="State/Province (ISO-3166-2 where applicable)")
    country: str = Field(..., min_length=2, max_length=2, description="Country (ISO-3166-1 alpha-2)")
    postal_code: str = Field(..., max_length=20, description="Postal/ZIP code")


# ============================================================================
# Buyer Models (ACP-aligned)
# ============================================================================

class Buyer(BaseModel):
    """Buyer information following ACP specification."""
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    email: Optional[str] = Field(None, description="Email address")
    phone_number: Optional[str] = Field(None, description="Phone number")


# ============================================================================
# Totals & Fulfillment (ACP-aligned)
# ============================================================================

class Total(BaseModel):
    """Total line item following ACP specification."""
    type: TotalType = Field(..., description="Type of total")
    display_text: str = Field(..., description="Human-readable label")
    amount: int = Field(..., description="Amount in minor units")


class FulfillmentOption(BaseModel):
    """Fulfillment option following ACP specification."""
    type: FulfillmentType = Field(..., description="Type of fulfillment")
    id: str = Field(..., description="Unique identifier")
    title: str = Field(..., description="Display title")
    subtitle: Optional[str] = Field(None, description="Additional info")
    carrier: Optional[str] = Field(None, description="Shipping carrier")
    earliest_delivery_time: Optional[datetime] = Field(None, description="Earliest delivery")
    latest_delivery_time: Optional[datetime] = Field(None, description="Latest delivery")
    subtotal: int = Field(0, description="Shipping subtotal (minor units)")
    tax: int = Field(0, description="Shipping tax (minor units)")
    total: int = Field(0, description="Total shipping cost (minor units)")


# ============================================================================
# Message Models (ACP-aligned)
# ============================================================================

class Message(BaseModel):
    """Message in checkout response following ACP specification."""
    type: MessageType = Field(..., description="Message type (info/error)")
    content_type: str = Field("plain", description="Content type (plain/markdown)")
    content: str = Field(..., description="Message content")
    code: Optional[ErrorCode] = Field(None, description="Error code (for error messages)")
    param: Optional[str] = Field(None, description="JSONPath to related field")


# ============================================================================
# Link Models (ACP-aligned)
# ============================================================================

class Link(BaseModel):
    """Link following ACP specification."""
    type: str = Field(..., description="Link type (terms_of_use, privacy_policy, etc.)")
    url: str = Field(..., description="URL")


# ============================================================================
# Payment Models (ACP-aligned)
# ============================================================================

class PaymentProvider(BaseModel):
    """Payment provider info following ACP specification."""
    provider: str = Field("internal", description="Provider name (stripe, internal, etc.)")
    supported_payment_methods: list[str] = Field(
        default_factory=lambda: ["card"], 
        description="Supported payment methods"
    )


class PaymentData(BaseModel):
    """Payment data following ACP specification."""
    token: Optional[str] = Field(None, description="Payment token")
    provider: str = Field("internal", description="Payment provider")
    billing_address: Optional[Address] = Field(None, description="Billing address")


# ============================================================================
# Order Models (ACP-aligned)
# ============================================================================

class Order(BaseModel):
    """Order following ACP specification."""
    id: str = Field(..., description="Order ID")
    checkout_session_id: str = Field(..., description="Associated checkout session")
    permalink_url: str = Field(..., description="URL to view order")


class OrderDetail(BaseModel):
    """Detailed order information."""
    id: str = Field(..., description="Order ID")
    items: list[LineItem] = Field(..., description="Ordered items")
    item_count: int = Field(..., description="Total item count")
    subtotal: int = Field(..., description="Subtotal in minor units")
    tax: int = Field(0, description="Tax in minor units")
    total: int = Field(..., description="Total in minor units")
    currency: str = Field("INR", description="Currency code")
    status: OrderStatus = Field(..., description="Order status")
    buyer: Optional[Buyer] = Field(None, description="Buyer information")
    fulfillment_address: Optional[Address] = Field(None, description="Shipping address")
    session_id: Optional[str] = Field(None, description="Session ID")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation time")
    checkout_session_id: Optional[str] = Field(None, description="Checkout session ID")
    permalink_url: Optional[str] = Field(None, description="Order permalink")


# ============================================================================
# Checkout Session Models (ACP-aligned)
# ============================================================================

class CheckoutSession(BaseModel):
    """
    Checkout session following ACP specification.
    This is the central data structure for the checkout flow.
    """
    id: str = Field(..., description="Checkout session ID")
    payment_provider: PaymentProvider = Field(
        default_factory=PaymentProvider, 
        description="Payment provider info"
    )
    status: CheckoutStatus = Field(
        CheckoutStatus.NOT_READY_FOR_PAYMENT, 
        description="Session status"
    )
    currency: str = Field("INR", description="Currency code (lowercase ISO 4217)")
    line_items: list[LineItem] = Field(default_factory=list, description="Line items")
    buyer: Optional[Buyer] = Field(None, description="Buyer information")
    fulfillment_address: Optional[Address] = Field(None, description="Shipping address")
    fulfillment_option_id: Optional[str] = Field(None, description="Selected fulfillment")
    fulfillment_options: list[FulfillmentOption] = Field(
        default_factory=list, 
        description="Available fulfillment options"
    )
    totals: list[Total] = Field(default_factory=list, description="Totals breakdown")
    messages: list[Message] = Field(default_factory=list, description="Info/error messages")
    links: list[Link] = Field(default_factory=list, description="Policy links")
    order: Optional[Order] = Field(None, description="Created order (after completion)")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")


# ============================================================================
# API Request/Response Models
# ============================================================================

class CreateCheckoutRequest(BaseModel):
    """Request to create a checkout session - per ACP spec."""
    items: list[Item] = Field(..., description="Items to checkout")
    buyer: Optional[Buyer] = Field(None, description="Buyer info")
    fulfillment_address: Optional[Address] = Field(None, description="Shipping address")


class UpdateCheckoutRequest(BaseModel):
    """Request to update a checkout session - per ACP spec."""
    items: Optional[list[Item]] = Field(None, description="Updated items")
    fulfillment_address: Optional[Address] = Field(None, description="Shipping address")
    fulfillment_option_id: Optional[str] = Field(None, description="Selected fulfillment")


class CompleteCheckoutRequest(BaseModel):
    """Request to complete checkout - per ACP spec."""
    buyer: Optional[Buyer] = Field(None, description="Buyer info")
    payment_data: Optional[PaymentData] = Field(None, description="Payment data")


class AddToCartRequest(BaseModel):
    """Request to add item to cart."""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(1, ge=1, description="Quantity")
    size: Optional[str] = Field(None, description="Size for clothing")


class UpdateCartItemRequest(BaseModel):
    """Request to update cart item."""
    quantity: int = Field(..., ge=0, description="New quantity (0 to remove)")


class OrderAnalyticsQuery(BaseModel):
    """Query parameters for order analytics."""
    start_date: Optional[datetime] = Field(None, description="Start date filter")
    end_date: Optional[datetime] = Field(None, description="End date filter")
    status: Optional[OrderStatus] = Field(None, description="Status filter")
    session_id: Optional[str] = Field(None, description="Session filter")
    limit: int = Field(50, ge=1, le=1000, description="Max results")


class OrderAnalytics(BaseModel):
    """Order analytics response."""
    total_orders: int = Field(..., description="Total order count")
    total_revenue: int = Field(..., description="Total revenue (minor units)")
    average_order_value: int = Field(..., description="Average order value (minor units)")
    currency: str = Field("INR", description="Currency")
    orders_by_status: dict[str, int] = Field(
        default_factory=dict, 
        description="Order count by status"
    )
    top_products: list[dict] = Field(default_factory=list, description="Top selling products")


# ============================================================================
# Error Response (ACP-aligned)
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response following ACP specification - flat object."""
    type: str = Field(..., description="Error type")
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    param: Optional[str] = Field(None, description="JSONPath to related field")


# ============================================================================
# Text Stream Messages (for LiveKit integration)
# ============================================================================

class CartUpdateMessage(BaseModel):
    """Message sent via text stream when cart is updated."""
    type: str = Field("cart_update", description="Message type")
    cart_id: str = Field(..., description="Cart ID")
    action: str = Field(..., description="Action performed (add, remove, update, clear)")
    product_id: Optional[str] = Field(None, description="Affected product ID")
    item_count: int = Field(..., description="Total items in cart")
    total: int = Field(..., description="Cart total (minor units)")


class OrderCreatedMessage(BaseModel):
    """Message sent via text stream when order is created."""
    type: str = Field("order_created", description="Message type")
    order_id: str = Field(..., description="Order ID")
    total: int = Field(..., description="Order total (minor units)")
    item_count: int = Field(..., description="Number of items")
    status: str = Field(..., description="Order status")
