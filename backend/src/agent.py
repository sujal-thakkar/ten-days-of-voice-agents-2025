import asyncio
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    function_tool,
    metrics,
    RunContext,
    tokenize,
    ToolError,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from pydantic import Field

from order_state import OrderState, OrderStore

logger = logging.getLogger("agent")

load_dotenv(".env.local")


@dataclass
class Userdata:
    order: OrderState = field(default_factory=OrderState)
    order_store: OrderStore = field(default_factory=OrderStore)
    last_saved_path: Path | None = None
    customer_name: str | None = None


class Assistant(Agent):
    def __init__(self, brand_name: str = "Blue Tokai Coffee Roasters") -> None:
        self.brand_name = brand_name
        super().__init__(
            instructions=self._build_instructions(),
            tools=[
                self._build_update_order_tool(),
                self._build_snapshot_tool(),
                self._build_finalize_tool(),
            ],
        )

    def _build_instructions(self) -> str:
        return f"""
    You are a knowledgeable and friendly barista at {self.brand_name}, India's finest specialty coffee roasters.
    - Start the conversation with a warm, professional greeting welcoming the guest to Blue Tokai.
    - Your goal is to craft the perfect coffee experience, taking one drink order at a time.
    - Schema: {{"drinkType": str, "size": str, "milk": str, "extras": [str], "name": str}}.
    - If the customer has ordered before in this session, you can reuse their name for the next order without asking, unless they specify otherwise.
    - Ask clarifying questions for any missing details (size, milk choice, extras).
    - If the guest wants no extras, explicitly record it as an empty list.
    - Before finalizing, summarize the order clearly to ensure perfection.
    - After finalizing, let them know their coffee is being brewed with care and ask if they'd like to order another beverage.
    - Maintain a polite, artisanal, and coffee-passionate tone.
    """

    def _build_update_order_tool(self):
        @function_tool
        async def update_order_details(
            ctx: RunContext[Userdata],
            drinkType: Annotated[
                str | None,
                Field(description="Full name of the requested beverage, e.g., 'Pour Over', 'Cappuccino', 'Cold Brew'."),
            ] = None,
            size: Annotated[
                str | None,
                Field(description="Size: Regular, Large, or specific ounces."),
            ] = None,
            milk: Annotated[
                str | None,
                Field(description="Milk choice: Whole, Skim, Oat, Almond, Soy."),
            ] = None,
            extras: Annotated[
                list[str] | None,
                Field(
                    description=(
                        "Add-ons like 'whipped cream', 'hazelnut syrup', 'extra shot', or 'none'."
                    )
                ),
            ] = None,
            name: Annotated[
                str | None,
                Field(description="Customer name for the order."),
            ] = None,
        ) -> str:
            """Update the running order when the guest supplies new information."""

            if extras and any(item.lower() == "none" for item in extras):
                extras = []

            # Auto-fill name if available in session and not provided
            if name is None and ctx.userdata.customer_name and not ctx.userdata.order.name:
                name = ctx.userdata.customer_name
            
            if name:
                ctx.userdata.customer_name = name

            order = ctx.userdata.order
            changed = order.apply_updates(
                drink_type=drinkType,
                size=size,
                milk=milk,
                extras=extras,
                name=name,
            )

            if not changed:
                return "No order fields changed."

            # Save progress for real-time visualization
            await asyncio.to_thread(ctx.userdata.order_store.save, order)

            missing = order.missing_fields()
            if not missing:
                return f"Order filled: {order.summary()}"

            return (
                "Updated fields: "
                + ", ".join(changed)
                + ". Still need: "
                + ", ".join(missing)
            )

        return update_order_details

    def _build_snapshot_tool(self):
        @function_tool
        async def describe_order_progress(ctx: RunContext[Userdata]) -> str:
            """Returns the current order payload along with missing fields."""

            order = ctx.userdata.order
            snapshot = {
                "order": order.as_payload(),
                "missing": order.missing_fields(),
                "summary": order.summary(),
                "isComplete": order.is_complete(),
            }
            return json.dumps(snapshot)

        return describe_order_progress

    def _build_finalize_tool(self):
        @function_tool
        async def finalize_order(ctx: RunContext[Userdata]) -> str:
            """Persists the completed order and resets the in-progress state."""

            order = ctx.userdata.order
            if not order.is_complete():
                raise ToolError(
                    "Cannot finalize until all fields are collected: "
                    + ", ".join(order.missing_fields())
                )

            save_path = await asyncio.to_thread(ctx.userdata.order_store.save, order)
            ctx.userdata.last_saved_path = save_path
            summary = order.summary()
            
            # Keep the name for the next order
            current_name = order.name
            order.reset()
            if current_name:
                order.name = current_name
                ctx.userdata.customer_name = current_name

            return f"Saved order to {save_path.name}. Summary: {summary}. Ready for next order (name retained: {current_name})."

        return finalize_order


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
                voice="en-US-matthew", 
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
        userdata=Userdata(),
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

    # Initialize empty order on disk so frontend clears the old one
    initial_order = session.userdata.order
    await asyncio.to_thread(session.userdata.order_store.save, initial_order)

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
