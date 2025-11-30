"""
Product Catalog Module - ACP-inspired E-commerce Agent

This module manages the product catalog with filtering and search capabilities.
Following ACP principles, products have structured data with clear attributes.
"""

from typing import Optional

# Product Catalog - Structured product data following ACP principles
PRODUCTS = [
    # Coffee Mugs
    {
        "id": "mug-001",
        "name": "Stoneware Coffee Mug",
        "description": "Classic stoneware mug, perfect for your morning coffee",
        "price": 499,
        "currency": "INR",
        "category": "mug",
        "color": "white",
        "material": "stoneware",
        "capacity": "350ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
        "stock_quantity": 25,
    },
    {
        "id": "mug-002",
        "name": "Ceramic Travel Mug",
        "description": "Double-walled ceramic mug with silicone lid for travel",
        "price": 799,
        "currency": "INR",
        "category": "mug",
        "color": "black",
        "material": "ceramic",
        "capacity": "400ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&h=400&fit=crop",
        "stock_quantity": 18,
    },
    {
        "id": "mug-003",
        "name": "Artisan Hand-painted Mug",
        "description": "Beautiful hand-painted mug with floral design",
        "price": 650,
        "currency": "INR",
        "category": "mug",
        "color": "blue",
        "material": "ceramic",
        "capacity": "300ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
        "stock_quantity": 12,
    },
    {
        "id": "mug-004",
        "name": "Minimalist Espresso Cup",
        "description": "Sleek espresso cup with matching saucer",
        "price": 350,
        "currency": "INR",
        "category": "mug",
        "color": "grey",
        "material": "porcelain",
        "capacity": "100ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&h=400&fit=crop",
        "stock_quantity": 30,
    },
    # T-Shirts
    {
        "id": "tshirt-001",
        "name": "Classic Cotton T-Shirt",
        "description": "Soft 100% cotton t-shirt, comfortable for everyday wear",
        "price": 599,
        "currency": "INR",
        "category": "tshirt",
        "color": "white",
        "material": "cotton",
        "sizes": ["S", "M", "L", "XL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        "stock_quantity": 50,
    },
    {
        "id": "tshirt-002",
        "name": "Premium V-Neck T-Shirt",
        "description": "Premium quality v-neck with a modern fit",
        "price": 899,
        "currency": "INR",
        "category": "tshirt",
        "color": "black",
        "material": "cotton-blend",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
        "stock_quantity": 35,
    },
    {
        "id": "tshirt-003",
        "name": "Graphic Print T-Shirt",
        "description": "Trendy graphic print tee with unique design",
        "price": 749,
        "currency": "INR",
        "category": "tshirt",
        "color": "navy",
        "material": "cotton",
        "sizes": ["S", "M", "L", "XL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop",
        "stock_quantity": 20,
    },
    {
        "id": "tshirt-004",
        "name": "Vintage Wash T-Shirt",
        "description": "Soft vintage washed tee with a retro feel",
        "price": 850,
        "currency": "INR",
        "category": "tshirt",
        "color": "grey",
        "material": "cotton",
        "sizes": ["M", "L", "XL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
        "stock_quantity": 15,
    },
    # Hoodies
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
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
        "stock_quantity": 22,
    },
    {
        "id": "hoodie-002",
        "name": "Zip-Up Sports Hoodie",
        "description": "Lightweight zip-up hoodie perfect for workouts",
        "price": 1299,
        "currency": "INR",
        "category": "hoodie",
        "color": "grey",
        "material": "polyester-blend",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&h=400&fit=crop",
        "stock_quantity": 28,
    },
    {
        "id": "hoodie-003",
        "name": "Oversized Streetwear Hoodie",
        "description": "Trendy oversized hoodie with dropped shoulders",
        "price": 1799,
        "currency": "INR",
        "category": "hoodie",
        "color": "olive",
        "material": "cotton-fleece",
        "sizes": ["M", "L", "XL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
        "stock_quantity": 10,
    },
    {
        "id": "hoodie-004",
        "name": "Tech Fleece Hoodie",
        "description": "Modern tech fleece hoodie with sleek design",
        "price": 2199,
        "currency": "INR",
        "category": "hoodie",
        "color": "navy",
        "material": "tech-fleece",
        "sizes": ["S", "M", "L", "XL"],
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1542406775-ade58c52d2e4?w=400&h=400&fit=crop",
        "stock_quantity": 16,
    },
    # Water Bottles
    {
        "id": "bottle-001",
        "name": "Stainless Steel Water Bottle",
        "description": "Double-walled insulated bottle keeps drinks cold for 24hrs",
        "price": 899,
        "currency": "INR",
        "category": "bottle",
        "color": "silver",
        "material": "stainless-steel",
        "capacity": "750ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
        "stock_quantity": 40,
    },
    {
        "id": "bottle-002",
        "name": "Glass Water Bottle",
        "description": "Eco-friendly glass bottle with silicone sleeve",
        "price": 599,
        "currency": "INR",
        "category": "bottle",
        "color": "blue",
        "material": "glass",
        "capacity": "500ml",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop",
        "stock_quantity": 33,
    },
    # Bags
    {
        "id": "bag-001",
        "name": "Canvas Tote Bag",
        "description": "Durable canvas tote bag for everyday use",
        "price": 449,
        "currency": "INR",
        "category": "bag",
        "color": "beige",
        "material": "canvas",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop",
        "stock_quantity": 45,
    },
    {
        "id": "bag-002",
        "name": "Laptop Backpack",
        "description": "Spacious backpack with padded laptop compartment",
        "price": 1999,
        "currency": "INR",
        "category": "bag",
        "color": "black",
        "material": "nylon",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
        "stock_quantity": 19,
    },
]


def list_products(
    category: Optional[str] = None,
    max_price: Optional[int] = None,
    min_price: Optional[int] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    in_stock_only: bool = True,
) -> list[dict]:
    """
    List products from the catalog with optional filtering.
    
    Args:
        category: Filter by product category (mug, tshirt, hoodie, bottle, bag)
        max_price: Maximum price filter (in INR)
        min_price: Minimum price filter (in INR)
        color: Filter by color
        size: Filter by size (for clothing items)
        in_stock_only: Only return in-stock items (default: True)
    
    Returns:
        List of products matching the filters
    """
    results = PRODUCTS.copy()
    
    if in_stock_only:
        results = [p for p in results if p.get("in_stock", True)]
    
    if category:
        category_lower = category.lower()
        # Handle common variations
        category_map = {
            "mugs": "mug",
            "mug": "mug",
            "coffee mug": "mug",
            "coffee mugs": "mug",
            "tshirt": "tshirt",
            "tshirts": "tshirt",
            "t-shirt": "tshirt",
            "t-shirts": "tshirt",
            "shirt": "tshirt",
            "shirts": "tshirt",
            "hoodie": "hoodie",
            "hoodies": "hoodie",
            "bottle": "bottle",
            "bottles": "bottle",
            "water bottle": "bottle",
            "water bottles": "bottle",
            "bag": "bag",
            "bags": "bag",
            "backpack": "bag",
            "backpacks": "bag",
            "tote": "bag",
        }
        normalized_category = category_map.get(category_lower, category_lower)
        results = [p for p in results if p.get("category") == normalized_category]
    
    if max_price is not None:
        results = [p for p in results if p.get("price", 0) <= max_price]
    
    if min_price is not None:
        results = [p for p in results if p.get("price", 0) >= min_price]
    
    if color:
        color_lower = color.lower()
        results = [p for p in results if p.get("color", "").lower() == color_lower]
    
    if size:
        size_upper = size.upper()
        results = [p for p in results if size_upper in p.get("sizes", [])]
    
    return results


def get_product_by_id(product_id: str) -> Optional[dict]:
    """
    Get a specific product by its ID.
    
    Args:
        product_id: The unique product identifier
    
    Returns:
        Product dict if found, None otherwise
    """
    for product in PRODUCTS:
        if product["id"] == product_id:
            return product
    return None


def search_products(query: str) -> list[dict]:
    """
    Search products by name, description, or category.
    Performs a case-insensitive search across multiple fields.
    
    Args:
        query: Search query string
    
    Returns:
        List of matching products
    """
    query_lower = query.lower()
    results = []
    
    for product in PRODUCTS:
        # Search in name, description, category, and color
        searchable_text = " ".join([
            product.get("name", ""),
            product.get("description", ""),
            product.get("category", ""),
            product.get("color", ""),
            product.get("material", ""),
        ]).lower()
        
        if query_lower in searchable_text:
            results.append(product)
    
    return results


def get_available_categories() -> list[str]:
    """
    Get a list of all available product categories.
    
    Returns:
        List of unique category names
    """
    categories = set()
    for product in PRODUCTS:
        if "category" in product:
            categories.add(product["category"])
    return sorted(list(categories))


def get_available_colors(category: Optional[str] = None) -> list[str]:
    """
    Get a list of all available colors, optionally filtered by category.
    
    Args:
        category: Optional category filter
    
    Returns:
        List of unique color names
    """
    products = list_products(category=category) if category else PRODUCTS
    colors = set()
    for product in products:
        if "color" in product:
            colors.add(product["color"])
    return sorted(list(colors))
