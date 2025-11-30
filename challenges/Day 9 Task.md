# Day 9 – E-commerce Agent (ACP-Inspired)

## Challenge Overview

Build a voice-driven shopping assistant following the Agentic Commerce Protocol (ACP) principles. The agent allows users to browse products, place orders, and view their order history through natural voice conversations.

## What Was Built

### 1. Commerce Layer (`backend/src/commerce/`)

Following ACP principles, we created a clear separation between conversation (LLM + voice) and commerce logic:

#### Product Catalog (`catalog.py`)
- **16 products** across 5 categories: mugs, t-shirts, hoodies, water bottles, and bags
- **Structured product data** with: id, name, description, price, currency, category, color, material, sizes, etc.
- **Filtering functions**: Filter by category, price range, color, size
- **Search function**: Full-text search across product attributes

#### Order Management (`orders.py`)
- **Order creation** with validation and automatic pricing
- **Order persistence** to `orders.json` file
- **Order retrieval**: Get by ID, get last order, get all orders
- **Order summary generation** for human-readable output

### 2. Voice Agent (`backend/src/agent.py`)

The `ShoppingAssistant` agent with the following tools:

| Tool | Description |
|------|-------------|
| `browse_catalog` | Browse products with optional filters (category, price, color, size) |
| `search_product_catalog` | Search products by keywords |
| `get_product_details` | Get detailed info about a specific product |
| `get_product_by_position` | Get product from recently shown list by number |
| `place_order` | Place an order for a product by ID |
| `place_order_by_position` | Order a product from recent list by position |
| `get_my_last_order` | View the most recent order |
| `get_my_orders` | View order history |
| `get_available_product_categories` | List all product categories |
| `check_product_availability` | Check color/size availability |

## Data Models

### Product Schema
```python
{
    "id": "hoodie-001",
    "name": "Classic Pullover Hoodie",
    "description": "Warm and cozy pullover hoodie with kangaroo pocket",
    "price": 1499,
    "currency": "INR",
    "category": "hoodie",
    "color": "black",
    "material": "cotton-fleece",
    "sizes": ["S", "M", "L", "XL"],
    "in_stock": True
}
```

### Order Schema
```python
{
    "id": "ORD-A1B2C3D4",
    "items": [
        {
            "product_id": "hoodie-001",
            "product_name": "Classic Pullover Hoodie",
            "quantity": 1,
            "size": "M",
            "unit_price": 1499,
            "item_total": 1499,
            "currency": "INR"
        }
    ],
    "item_count": 1,
    "subtotal": 1499,
    "total": 1499,
    "currency": "INR",
    "status": "confirmed",
    "session_id": "room-xyz",
    "created_at": "2025-11-30T10:30:00"
}
```

## Example Conversations

### Browsing Products
**User**: "Show me all coffee mugs"
**Agent**: *Calls `browse_catalog(category="mug")`*
"I found 4 coffee mugs! 1. Stoneware Coffee Mug - 499 rupees in white. 2. Ceramic Travel Mug - 799 rupees in black..."

### Filtering by Price
**User**: "Do you have any t-shirts under 800 rupees?"
**Agent**: *Calls `browse_catalog(category="tshirt", max_price=800)`*
"Yes! Here are t-shirts under 800 rupees..."

### Searching
**User**: "I'm looking for something for travel"
**Agent**: *Calls `search_product_catalog(query="travel")`*
"Found 2 products matching 'travel': 1. Ceramic Travel Mug - 799 rupees..."

### Placing an Order
**User**: "I'll buy the second hoodie you mentioned, in size M"
**Agent**: *Calls `place_order_by_position(position=2, size="M")`*
"Order confirmed! Order ID: ORD-A1B2C3D4. You ordered 1x Zip-Up Sports Hoodie in size M for 1299 rupees."

### Checking Order
**User**: "What did I just buy?"
**Agent**: *Calls `get_my_last_order()`*
"Your last order - Order ID: ORD-A1B2C3D4, Status: confirmed. 1x Zip-Up Sports Hoodie (Size M) - 1299 rupees."

## ACP Principles Applied

1. **Separation of Concerns**: Clear separation between voice/conversation layer and commerce logic
2. **Structured Data**: Products and orders use well-defined schemas
3. **Tool-Based Commerce**: LLM calls functions for all commerce operations (no inline logic)
4. **Session Tracking**: Orders are tracked per session for personalized experience
5. **Persistence**: Orders are saved to JSON file for durability

## Running the Agent

1. Start the backend:
```bash
cd backend
python -m src.agent dev
```

2. Start the frontend:
```bash
cd frontend
pnpm dev
```

3. Open http://localhost:3000 and start shopping with voice!

## File Structure
```
backend/src/
├── agent.py                 # Main agent with ShoppingAssistant
└── commerce/
    ├── __init__.py          # Module exports
    ├── catalog.py           # Product catalog and filtering
    ├── orders.py            # Order management
    └── orders.json          # Persisted orders (created at runtime)
```

## Future Enhancements (Advanced Tasks)
- [ ] Add cart functionality (multi-item orders)
- [ ] Implement order cancellation via voice
- [ ] Add product recommendations
- [ ] Support multiple currencies
- [ ] Add shipping address collection
- [ ] Implement inventory management
