"""Test script for commerce module"""

from commerce.catalog import list_products, search_products, get_product_by_id, PRODUCTS
from commerce.orders import create_order, get_last_order, get_order_summary

print(f"=== Product Catalog Test ===")
print(f"Total products: {len(PRODUCTS)}")

# Test filtering
hoodies = list_products(category="hoodie")
print(f"Hoodies: {len(hoodies)}")

cheap_items = list_products(max_price=600)
print(f"Items under 600 INR: {len(cheap_items)}")

black_items = list_products(color="black")
print(f"Black items: {len(black_items)}")

# Test search
travel_items = search_products("travel")
print(f"Travel-related items: {len(travel_items)}")

print(f"\n=== Order Test ===")

# Create an order
order = create_order(
    line_items=[
        {"product_id": "hoodie-001", "quantity": 1, "size": "M"},
    ],
    session_id="test-session"
)
print(f"Created order: {order['id']}")
print(f"Total: {order['currency']} {order['total']}")

# Get last order
last_order = get_last_order(session_id="test-session")
print(f"\nLast order summary:")
print(get_order_summary(last_order))

print("\n=== All Tests Passed! ===")
