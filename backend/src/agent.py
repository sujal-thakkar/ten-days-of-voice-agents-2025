"""
E-commerce Voice Agent - Day 9 Challenge

A voice-driven shopping assistant following ACP (Agentic Commerce Protocol) principles.
This agent allows users to:
- Browse and search the product catalog
- Place orders via voice
- View order history and details
"""

import logging
from typing import Annotated

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
    metrics,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Import commerce modules
from pydantic import Field

from commerce.catalog import (
    get_available_categories,
    get_available_colors,
    get_product_by_id,
    list_products,
    search_products,
)
from commerce.orders import (
    cancel_order,
    create_order,
    get_all_orders,
    get_last_order,
    get_order,
    get_order_summary,
)

logger = logging.getLogger("ecommerce-agent")

load_dotenv(".env.local")


class ShoppingAssistant(Agent):
    """
    ACP-inspired Shopping Assistant Agent
    
    This agent acts as a voice-driven shopping assistant that:
    1. Helps users explore the product catalog
    2. Assists with product selection
    3. Creates and manages orders
    """
    
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a friendly and helpful voice shopping assistant for an online store. 
            
You help customers:
- Browse and discover products from our catalog (mugs, t-shirts, hoodies, water bottles, and bags)
- Find products by category, price range, color, or size
- Place orders for products they want to buy
- Check their order status and history

IMPORTANT GUIDELINES:
1. Always use the available tools to get product information - don't make up products or prices
2. When showing products, mention the name, price (in INR), and key features
3. When a user wants to order, confirm the product details before creating the order
4. Keep responses concise and conversational - this is a voice interaction
5. Use rupees symbol or say "rupees" for prices (our catalog is in INR)
6. If a user refers to "the first one" or "the second hoodie", use context from your recent responses
7. When creating orders for clothing, ask for size if not specified

Available product categories: mugs, t-shirts, hoodies, water bottles, and bags.

Remember: You're having a voice conversation, so keep responses natural and not too long.""",
        )
        # Track recently shown products for reference
        self._recent_products: list[dict] = []
        self._session_id: str | None = None
    
    def set_session_id(self, session_id: str) -> None:
        """Set the session ID for order tracking."""
        self._session_id = session_id
    
    @function_tool
    async def browse_catalog(
        self,
        context: RunContext,
        category: Annotated[
            str | None,
            Field(
                default=None,
                description="Product category to filter by (mug, tshirt, hoodie, bottle, bag). Leave empty or null for all categories.",
            ),
        ] = None,
        max_price: Annotated[
            int | None,
            Field(default=None, description="Maximum price in INR. Leave empty or null for no limit."),
        ] = None,
        min_price: Annotated[
            int | None,
            Field(default=None, description="Minimum price in INR. Leave empty or null for no minimum."),
        ] = None,
        color: Annotated[
            str | None,
            Field(
                default=None,
                description="Filter by color (white, black, blue, grey, navy, olive, etc.). Leave empty or null for all colors.",
            ),
        ] = None,
        size: Annotated[
            str | None,
            Field(
                default=None,
                description="Filter by size for clothing (S, M, L, XL, XXL). Leave empty or null for all sizes.",
            ),
        ] = None,
    ) -> str:
        """
        Browse products in the catalog with optional filters.
        Use this tool when a user wants to see products or explore the catalog.
        """
        logger.info(
            f"Browsing catalog: category={category}, max_price={max_price}, "
            f"min_price={min_price}, color={color}, size={size}"
        )
        
        # Pass parameters directly (None values are handled by the catalog)
        products = list_products(
            category=category,
            max_price=max_price,
            min_price=min_price,
            color=color,
            size=size,
        )
        
        if not products:
            return "No products found matching your criteria. Try adjusting your filters or browse all products."
        
        # Store for reference
        self._recent_products = products[:5]  # Keep top 5 for reference
        
        # Format response
        result_lines = [f"Found {len(products)} product(s):"]
        for i, product in enumerate(products[:5], 1):
            size_info = ""
            if "sizes" in product:
                size_info = f" | Sizes: {', '.join(product['sizes'])}"
            
            result_lines.append(
                f"{i}. {product['name']} - {product['currency']} {product['price']} "
                f"({product['color']} {product['category']}){size_info}"
            )
        
        if len(products) > 5:
            result_lines.append(f"...and {len(products) - 5} more. Ask me to narrow down your search!")
        
        return "\n".join(result_lines)
    
    @function_tool
    async def search_product_catalog(
        self,
        context: RunContext,
        query: Annotated[str, "Search query (e.g., cozy hoodie, travel mug, cotton shirt)"],
    ) -> str:
        """
        Search for products by name, description, or keywords.
        Use this when a user describes what they're looking for in general terms.
        """
        logger.info(f"Searching catalog for: {query}")
        
        products = search_products(query)
        
        if not products:
            return f"No products found matching '{query}'. Try different keywords or browse by category."
        
        # Store for reference
        self._recent_products = products[:5]
        
        # Format response
        result_lines = [f"Found {len(products)} product(s) matching '{query}':"]
        for i, product in enumerate(products[:5], 1):
            result_lines.append(
                f"{i}. {product['name']} - {product['currency']} {product['price']} "
                f"- {product.get('description', '')[:50]}..."
            )
        
        return "\n".join(result_lines)
    
    @function_tool
    async def get_product_details(
        self,
        context: RunContext,
        product_id: Annotated[str, "The product ID (e.g., mug-001, hoodie-002)"],
    ) -> str:
        """
        Get detailed information about a specific product.
        Use this when a user wants more details about a specific product.
        """
        logger.info(f"Getting details for product: {product_id}")
        
        product = get_product_by_id(product_id)
        
        if not product:
            return f"Product not found with ID: {product_id}"
        
        details = [
            f"Product: {product['name']}",
            f"Price: {product['currency']} {product['price']}",
            f"Description: {product.get('description', 'No description available')}",
            f"Color: {product.get('color', 'N/A')}",
            f"Material: {product.get('material', 'N/A')}",
        ]
        
        if "sizes" in product:
            details.append(f"Available Sizes: {', '.join(product['sizes'])}")
        
        if "capacity" in product:
            details.append(f"Capacity: {product['capacity']}")
        
        details.append(f"In Stock: {'Yes' if product.get('in_stock', True) else 'No'}")
        
        return "\n".join(details)
    
    @function_tool
    async def get_product_by_position(
        self,
        context: RunContext,
        position: Annotated[int, "Position number (1-5) from the recently shown products"],
    ) -> str:
        """
        Get product details from the recently shown products by position.
        Use this when a user refers to a product by number (e.g., the first one, number 2).
        """
        logger.info(f"Getting product at position: {position}")
        
        if not self._recent_products:
            return "I haven't shown you any products yet. Let me help you browse the catalog first."
        
        if position < 1 or position > len(self._recent_products):
            return f"Please choose a number between 1 and {len(self._recent_products)}."
        
        product = self._recent_products[position - 1]
        
        details = [
            f"Product #{position}: {product['name']}",
            f"ID: {product['id']}",
            f"Price: {product['currency']} {product['price']}",
            f"Color: {product.get('color', 'N/A')}",
        ]
        
        if "sizes" in product:
            details.append(f"Available Sizes: {', '.join(product['sizes'])}")
        
        return "\n".join(details)
    
    @function_tool
    async def place_order(
        self,
        context: RunContext,
        product_id: Annotated[str, "The product ID to order (e.g., hoodie-001, mug-002)"],
        quantity: Annotated[int | None, "Number of items to order. Defaults to 1 if not specified."] = None,
        size: Annotated[
            str | None, "Size for clothing items (S, M, L, XL, XXL). Leave empty or null if not applicable."
        ] = None,
    ) -> str:
        """
        Place an order for a product.
        Use this when a user confirms they want to buy a product.
        """
        # Default quantity to 1 if not specified
        qty = quantity if quantity is not None else 1
        logger.info(f"Creating order: product_id={product_id}, quantity={qty}, size={size}")
        
        try:
            line_items = [
                {
                    "product_id": product_id,
                    "quantity": qty,
                    "size": size,
                }
            ]
            
            order = create_order(
                line_items=line_items,
                session_id=self._session_id,
            )
            
            # Format confirmation
            item = order["items"][0]
            size_str = f" in size {item['size']}" if item.get("size") else ""
            
            confirmation = (
                f"Order confirmed! Order ID: {order['id']}. "
                f"You ordered {item['quantity']}x {item['product_name']}{size_str} "
                f"for {order['currency']} {order['total']}. "
                f"Thank you for your purchase!"
            )
            
            return confirmation
            
        except ValueError as e:
            return f"Could not create order: {str(e)}"
    
    @function_tool
    async def place_order_by_position(
        self,
        context: RunContext,
        position: Annotated[int, "Position number (1-5) from the recently shown products"],
        quantity: Annotated[int | None, "Number of items to order. Defaults to 1 if not specified."] = None,
        size: Annotated[
            str | None, "Size for clothing items (S, M, L, XL, XXL). Leave empty or null if not specified."
        ] = None,
    ) -> str:
        """
        Place an order for a product from the recently shown list by position.
        Use this when a user wants to order 'the second one' or 'number 3'.
        """
        # Default quantity to 1 if not specified
        qty = quantity if quantity is not None else 1
        logger.info(f"Ordering product at position {position}, quantity={qty}, size={size}")
        
        if not self._recent_products:
            return "I haven't shown you any products yet. Let me help you browse first."
        
        if position < 1 or position > len(self._recent_products):
            return f"Please choose a number between 1 and {len(self._recent_products)}."
        
        product = self._recent_products[position - 1]
        
        # Check if size is needed but not provided
        if "sizes" in product and not size:
            return (
                f"Great choice! The {product['name']} comes in sizes: {', '.join(product['sizes'])}. "
                f"Which size would you like?"
            )
        
        return await self.place_order(context, product["id"], qty, size)
    
    @function_tool
    async def get_my_last_order(
        self,
        context: RunContext,
    ) -> str:
        """
        Get details of the most recent order.
        Use this when a user asks 'what did I just buy?' or 'show my last order'.
        """
        logger.info("Getting last order")
        
        order = get_last_order(session_id=self._session_id)
        
        if not order:
            return "You haven't placed any orders yet. Would you like to browse our catalog?"
        
        return get_order_summary(order)
    
    @function_tool
    async def get_my_orders(
        self,
        context: RunContext,
        limit: Annotated[int, "Maximum number of orders to show"] = 5,
    ) -> str:
        """
        Get order history.
        Use this when a user asks to see their orders or purchase history.
        """
        logger.info(f"Getting order history, limit={limit}")
        
        orders = get_all_orders(session_id=self._session_id, limit=limit)
        
        if not orders:
            return "You haven't placed any orders yet. Would you like to browse our catalog?"
        
        result_lines = [f"Your recent orders ({len(orders)}):"]
        for order in orders:
            items_str = ", ".join(
                f"{item['quantity']}x {item['product_name']}" 
                for item in order["items"]
            )
            result_lines.append(
                f"- {order['id']}: {items_str} | Total: {order['currency']} {order['total']} | Status: {order['status']}"
            )
        
        return "\n".join(result_lines)
    
    @function_tool
    async def get_available_product_categories(
        self,
        context: RunContext,
    ) -> str:
        """
        Get list of all available product categories.
        Use this when a user asks what types of products are available.
        """
        categories = get_available_categories()
        category_names = {
            "mug": "Coffee Mugs",
            "tshirt": "T-Shirts",
            "hoodie": "Hoodies",
            "bottle": "Water Bottles",
            "bag": "Bags & Backpacks",
        }
        
        formatted = [category_names.get(c, c.title()) for c in categories]
        return f"We have products in these categories: {', '.join(formatted)}"
    
    @function_tool
    async def check_product_availability(
        self,
        context: RunContext,
        product_id: Annotated[str, "The product ID to check"],
        color: Annotated[str, "Color to check for. Use empty string to skip color check."] = "",
        size: Annotated[str, "Size to check for (S, M, L, XL, XXL). Use empty string to skip size check."] = "",
    ) -> str:
        """
        Check if a product is available in specific color or size.
        Use this when a user asks 'does this come in blue?' or 'is size L available?'
        """
        logger.info(f"Checking availability: {product_id}, color={color}, size={size}")
        
        product = get_product_by_id(product_id)
        
        if not product:
            return f"Product not found: {product_id}"
        
        result = [f"Checking availability for {product['name']}:"]
        
        if color:
            if product.get("color", "").lower() == color.lower():
                result.append(f"✓ Available in {color}")
            else:
                # Check if same product exists in different color
                similar = search_products(product["category"])
                other_colors = [p for p in similar if p.get("color", "").lower() == color.lower()]
                if other_colors:
                    alt = other_colors[0]
                    result.append(
                        f"✗ This product is only in {product['color']}. "
                        f"But we have {alt['name']} in {color} (ID: {alt['id']})"
                    )
                else:
                    result.append(f"✗ Not available in {color}. Available in: {product['color']}")
        
        if size and "sizes" in product:
            if size.upper() in product["sizes"]:
                result.append(f"✓ Size {size.upper()} is available")
            else:
                result.append(f"✗ Size {size} not available. Available sizes: {', '.join(product['sizes'])}")
        
        result.append(f"In stock: {'Yes' if product.get('in_stock', True) else 'No'}")
        
        return "\n".join(result)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Create the shopping assistant
    assistant = ShoppingAssistant()
    
    # Set session ID for order tracking (using room name as session)
    assistant.set_session_id(ctx.room.name)

    # Set up voice AI pipeline
    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    # Metrics collection
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Start the session
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Connect to the room
    await ctx.connect()

    # Initial greeting
    await session.generate_reply(
        instructions="Greet the user warmly and let them know you're their shopping assistant. "
        "Briefly mention they can browse products, search for items, and place orders. "
        "Keep it short and friendly."
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
