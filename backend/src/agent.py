from __future__ import annotations

import logging
from textwrap import dedent
from typing import Annotated, Dict, List, Optional

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    RunContext,
    ToolError,
    WorkerOptions,
    cli,
    function_tool,
    get_job_context,
    metrics,
    tokenize,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic import Field

from data.store import (
    CartLine,
    CatalogItem,
    CatalogRepository,
    OrderStore,
    RecipeBook,
    RecipeDefinition,
)

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        self.catalog = CatalogRepository()
        self.recipe_book = RecipeBook()
        self.order_store = OrderStore()
        instructions = self._build_instructions()
        super().__init__(instructions=instructions)

    def _build_instructions(self) -> str:
        catalog_snapshot = self._catalog_snapshot()
        recipe_snapshot = self._recipe_snapshot()
        return dedent(
            f"""
            # Identity
            You are Mira, the always-on Zomato voice concierge for food, snacks, and quick grocery refills.
            Greet warmly, stay upbeat, and explain you can manage carts, suggest combos, and place orders.

            # Output rules
            - Respond in short, natural sentences suitable for TTS.
            - Speak in plain text only; avoid markdown, lists, or emojis in replies.
            - Mention important prices or quantities conversationally (for example, "one loaf for fifty five rupees").
            - Ask clarifying questions when the request is vague (brand, size, quantity, veg vs non-veg, etc.).

            # How to work
            1. Understand what the user wants (single items, replacements, cart edits, or a recipe kit).
            2. Use the provided tools for every cart mutation, order placement, or status lookup.
            3. Confirm each change verbally so the user always knows what changed.
            4. Offer quick upsells when it makes sense (for example, "want the masala chai kit to go with that milk?").
            5. When the user is done, summarize the cart with totals, call the order tool, and confirm the order number.

            # Catalog reference
            {catalog_snapshot}

            # Recipe kits the agent can auto-pack
            {recipe_snapshot}

            # Guardrails
            - Keep the scope to Zomato ordering, groceries, food safety basics, or order tracking.
            - Never invent unavailable items; if something is missing, propose the closest substitute from the catalog above.
            - Decline harmful, illegal, or off-brand requests.
            - Defer personal data collection unless strictly needed for delivery notes.
            """
        ).strip()

    def _catalog_snapshot(self) -> str:
        categories: Dict[str, List[CatalogItem]] = {}
        for item in self.catalog.all_items():
            categories.setdefault(item.category, []).append(item)
        lines: List[str] = []
        for category in sorted(categories.keys()):
            snippets = ", ".join(
                f"{itm.name} [{itm.id}] ₹{itm.price_inr}"
                for itm in sorted(categories[category], key=lambda c: c.name)
            )
            lines.append(f"{category.title()}: {snippets}")
        return "\n".join(lines)

    def _recipe_snapshot(self) -> str:
        recipes: List[RecipeDefinition] = list(self.recipe_book.all_recipes())
        lines = []
        for recipe in recipes:
            item_names = ", ".join(
                f"{component.catalog_id} x{component.quantity}" for component in recipe.items
            )
            lines.append(f"{recipe.display_name} [{recipe.key}]: {recipe.description} | {item_names}")
        return "\n".join(lines)

    def _session_id(self, context: RunContext) -> str:
        session = getattr(context, "session", None)
        candidates: List[Optional[str]] = []
        if session is not None:
            for attr in ("session_id", "id", "room_name"):
                value = getattr(session, attr, None)
                if value:
                    candidates.append(str(value))
        job_ctx: Optional[JobContext] = None
        try:
            job_ctx = get_job_context()
        except RuntimeError:  # job context not always available in tests
            job_ctx = None
        if job_ctx:
            room = getattr(job_ctx, "room", None)
            if room is not None:
                candidates.extend([getattr(room, "id", None), getattr(room, "name", None)])
            candidates.append(getattr(job_ctx, "job_id", None))
        for candidate in candidates:
            if candidate:
                return str(candidate)
        raise RuntimeError("Session is missing an identifier")

    def _cart_lines_to_dict(self, lines: List[CartLine]) -> List[dict]:
        return [
            {
                "catalog_id": line.catalog_id,
                "item_name": line.item_name,
                "quantity": line.quantity,
                "unit_price_inr": line.unit_price_inr,
                "line_total_inr": line.line_total,
                "notes": line.notes,
            }
            for line in lines
        ]

    @function_tool()
    async def add_item_to_cart(
        self,
        context: RunContext,
        catalog_id: str,
        quantity: int = 1,
        notes: Optional[str] = None,
    ) -> dict:
        """Add an individual catalog item to the active cart."""

        item = self.catalog.get(catalog_id)
        if item is None:
            raise ToolError(f"Item {catalog_id} is not in today's catalog")
        session_id = self._session_id(context)
        safe_quantity = max(1, quantity)
        self.order_store.add_item_to_cart(session_id, item, safe_quantity, notes)
        cart = self.order_store.get_cart(session_id)
        return {"items": self._cart_lines_to_dict(cart), "total_inr": self.order_store.cart_total(session_id)}

    @function_tool()
    async def add_recipe_to_cart(
        self,
        context: RunContext,
        recipe_key: Annotated[
            Optional[str],
            Field(description="Exact recipe identifier like peanut_butter_sandwich.", default=None),
        ] = None,
        keyword: Annotated[
            Optional[str],
            Field(description="Loose keyword to match recipe titles.", default=None),
        ] = None,
        servings_multiplier: Annotated[
            Optional[int],
            Field(description="Multiplier applied to each ingredient quantity", ge=1, default=None),
        ] = None,
    ) -> dict:
        """Add every ingredient from a supported recipe/kit into the cart."""

        recipe = None
        if recipe_key:
            recipe = self.recipe_book.get(recipe_key)
        if recipe is None and keyword:
            recipe = self.recipe_book.match_keyword(keyword)
        if recipe is None:
            raise ToolError("No matching recipe kit found")
        multiplier = max(1, servings_multiplier or 1)
        session_id = self._session_id(context)
        for component in recipe.items:
            catalog_item = self.catalog.get(component.catalog_id)
            if catalog_item is None:
                continue
            qty = component.quantity * multiplier
            self.order_store.add_item_to_cart(session_id, catalog_item, qty, component.notes)
        cart = self.order_store.get_cart(session_id)
        return {
            "recipe": recipe.display_name,
            "items": self._cart_lines_to_dict(cart),
            "total_inr": self.order_store.cart_total(session_id),
        }

    @function_tool()
    async def update_item_quantity(
        self,
        context: RunContext,
        catalog_id: str,
        quantity: int,
    ) -> dict:
        """Set the quantity of an item already in the cart (use zero to remove)."""

        session_id = self._session_id(context)
        if quantity < 0:
            raise ToolError("Quantity cannot be negative")
        try:
            self.order_store.set_item_quantity(session_id, catalog_id, quantity)
        except KeyError as exc:  # pragma: no cover - defensive
            raise ToolError(str(exc)) from exc
        cart = self.order_store.get_cart(session_id)
        return {"items": self._cart_lines_to_dict(cart), "total_inr": self.order_store.cart_total(session_id)}

    @function_tool()
    async def remove_item_from_cart(
        self,
        context: RunContext,
        catalog_id: str,
    ) -> dict:
        """Remove an item from the cart."""

        session_id = self._session_id(context)
        self.order_store.remove_item(session_id, catalog_id)
        cart = self.order_store.get_cart(session_id)
        return {"items": self._cart_lines_to_dict(cart), "total_inr": self.order_store.cart_total(session_id)}

    @function_tool()
    async def list_cart(self, context: RunContext) -> dict:
        """Return the current cart with totals."""

        session_id = self._session_id(context)
        cart = self.order_store.get_cart(session_id)
        return {"items": self._cart_lines_to_dict(cart), "total_inr": self.order_store.cart_total(session_id)}

    @function_tool()
    async def place_order(
        self,
        context: RunContext,
        customer_name: Optional[str] = None,
        contact_info: Optional[str] = None,
        delivery_notes: Optional[str] = None,
    ) -> dict:
        """Persist the current cart as a placed order."""

        session_id = self._session_id(context)
        metadata = {"delivery_notes": delivery_notes} if delivery_notes else None
        order_id = self.order_store.place_order(
            session_id,
            customer_name=customer_name,
            contact_info=contact_info,
            metadata=metadata,
        )
        if order_id is None:
            raise ToolError("Cart is empty, nothing to place")
        summary = self.order_store.order_summary(order_id)
        return summary or {"order_id": order_id}

    @function_tool()
    async def track_latest_order(self, context: RunContext) -> dict:
        """Retrieve the most recent order and its status timeline."""

        session_id = self._session_id(context)
        summary = self.order_store.latest_order_for_session(session_id)
        if summary is None:
            raise ToolError("No past orders found for this session")
        return summary


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-2.5-flash",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
                voice="en-US-natalie", 
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
