import asyncio
import logging
import textwrap
from typing import Any

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
    metrics,
    tokenize,
    function_tool,
    RunContext,
    ToolError,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from fraud_db import FraudCase, FraudCaseNotFoundError, FraudCaseRepository

logger = logging.getLogger("agent")

load_dotenv(".env.local")

_fraud_repo: FraudCaseRepository | None = None


def get_fraud_repo() -> FraudCaseRepository:
    global _fraud_repo
    if _fraud_repo is None:
        repo = FraudCaseRepository()
        repo.initialize()
        logger.info("Fraud database ready at %s", repo.db_path)
        _fraud_repo = repo
    return _fraud_repo

SESSION_CASE_KEY = "fraud_case"
SESSION_VERIFIED_KEY = "fraud_case_verified"
SESSION_ATTEMPTS_KEY = "fraud_case_attempts"


def _store_case(context: RunContext, case: FraudCase) -> None:
    context.userdata[SESSION_CASE_KEY] = case


def _get_case(context: RunContext, user_name: str | None = None) -> FraudCase | None:
    stored: FraudCase | None = context.userdata.get(SESSION_CASE_KEY)
    if stored and (user_name is None or stored.user_name == user_name.strip().lower()):
        return stored
    return None


def _set_verification(context: RunContext, value: bool) -> None:
    context.userdata[SESSION_VERIFIED_KEY] = value


def _get_verification(context: RunContext) -> bool:
    return bool(context.userdata.get(SESSION_VERIFIED_KEY))


def _bump_attempts(context: RunContext) -> int:
    attempts = int(context.userdata.get(SESSION_ATTEMPTS_KEY, 0)) + 1
    context.userdata[SESSION_ATTEMPTS_KEY] = attempts
    return attempts


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=textwrap.dedent(
                """
                # Identity
                You are Natalie, a calm and professional fraud-detection specialist for Bank of Baroda.
                Bank of Baroda, established in 1908, is India's International Bank—trusted by millions.
                You speak with cardholders about suspicious activity that our advanced fraud monitoring system has flagged.

                # Goals
                1. Load the correct fraud case for the caller using their first name or alias.
                2. Verify their identity with the stored security question before disclosing transaction details.
                3. Describe the flagged transaction (merchant, amount, masked card ending, location, time, category) in plain speech.
                4. Ask whether the user recognizes the charge and capture a yes/no answer.
                5. Mark the case outcome with the provided tools before ending the call.

                # Conversational flow
                - Greet the user as Bank of Baroda's Fraud Protection Desk and explain the reason for the call.
                - Collect the name on the account, then call `lookup_fraud_case`. If no case exists, apologize, offer to check another name, or end gracefully.
                - Ask the stored security question verbatim. Do not reveal or guess the answer.
                - Run `verify_security_answer` with the caller's reply. Only continue with transaction details if the tool reports verification success.
                - Walk through the suspicious transaction once. Keep language concise and empathetic.
                - Ask if the caller made the purchase. Accept “yes”, “no”, or clear statements like “that was me”. Clarify if ambiguous.
                - Use `update_case_resolution` with:
                  • `confirmed_safe` when the caller recognizes it.
                  • `confirmed_fraud` when they deny it.
                  • `verification_failed` if you cannot confirm their identity after two attempts.
                - Close by summarizing what will happen next (monitoring, dispute opened, card blocked) and remind them not to share sensitive data.

                # Guardrails
                - Never request full card numbers, PINs, passwords, or any data beyond the stored question.
                - Only cite facts returned by the database tools.
                - Keep responses to one or two sentences and avoid markdown, lists, or emojis.
                - If verification fails twice, politely stop and advise the user to call Bank of Baroda's 24x7 helpline or visit the nearest branch.
                - Thank them for being a valued Bank of Baroda customer.

                # Tool guidance
                - `lookup_fraud_case(user_name)` → run after the caller states their name; it returns the case summary plus the security question.
                - `verify_security_answer(user_name, provided_answer)` → call immediately after asking the security question to confirm identity.
                - `update_case_resolution(user_name, status, note)` → log the final status with a short note such as “Customer confirmed ABC Industrial purchase.”

                # Tone
                Warm, professional, and reassuring—reflecting Bank of Baroda's commitment to customer trust and safety.
                Focused on resolving the fraud alert quickly while reinforcing security best practices.
                """
            ).strip(),
        )

    async def _load_case(self, user_name: str) -> FraudCase:
        normalized = user_name.strip().lower()
        repo = get_fraud_repo()
        case = await asyncio.to_thread(repo.get_case_by_username, normalized)
        return case

    @function_tool()
    async def lookup_fraud_case(self, context: RunContext, user_name: str) -> dict[str, Any]:
        """Retrieve the active fraud case for the given username."""

        try:
            case = await self._load_case(user_name)
        except FraudCaseNotFoundError as exc:
            logger.warning("Lookup failed: %s", exc)
            return {"found": False, "message": str(exc)}

        _store_case(context, case)
        _set_verification(context, False)
        context.userdata[SESSION_ATTEMPTS_KEY] = 0

        public_record = case.public_dict()
        public_record.update({"found": True})
        return public_record

    @function_tool()
    async def verify_security_answer(
        self,
        context: RunContext,
        user_name: str,
        provided_answer: str,
    ) -> dict[str, Any]:
        """Check the caller's answer against the stored security question."""

        case = _get_case(context, user_name)
        if case is None:
            try:
                case = await self._load_case(user_name)
            except FraudCaseNotFoundError as exc:
                raise ToolError(str(exc)) from exc
            _store_case(context, case)

        normalized = provided_answer.strip().lower()
        is_match = normalized == case.security_answer.strip().lower()
        attempts = _bump_attempts(context)
        _set_verification(context, is_match)

        status = "verified" if is_match else "failed"
        detail = (
            "Security question answered correctly."
            if is_match
            else "Security answer did not match what we have on file."
        )
        return {
            "verified": is_match,
            "status": status,
            "attempts": attempts,
            "message": detail,
        }

    @function_tool()
    async def update_case_resolution(
        self,
        context: RunContext,
        user_name: str,
        status: str,
        note: str | None = None,
    ) -> dict[str, Any]:
        """Persist the final fraud decision for the case."""

        if status not in {"confirmed_safe", "confirmed_fraud", "verification_failed"}:
            raise ToolError("Status must be confirmed_safe, confirmed_fraud, or verification_failed.")

        if status != "verification_failed" and not _get_verification(context):
            raise ToolError("Verify the caller before updating the fraud decision.")

        if status == "verification_failed":
            _set_verification(context, False)

        try:
            repo = get_fraud_repo()
            updated_case = await asyncio.to_thread(
                repo.update_case_status,
                user_name,
                status,
                note,
            )
        except FraudCaseNotFoundError as exc:
            raise ToolError(str(exc)) from exc

        logger.info(
            "Case %s marked as %s (%s)",
            updated_case.user_name,
            status,
            note or "no note provided",
        )

        return {
            "status": updated_case.status,
            "note": updated_case.outcome_note,
            "cardEnding": updated_case.masked_card(),
            "merchant": updated_case.merchant_name,
            "transactionAmount": updated_case.transaction_amount,
        }

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


def prewarm(proc: JobProcess):
    get_fraud_repo()
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Google Gemini, Murf Falcon, and Deepgram STT
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
                voice="en-US-alicia", 
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

    # Ensure per-call state storage exists for tool helpers (fraud cases, verification flags, etc.).
    session.userdata = {}

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
