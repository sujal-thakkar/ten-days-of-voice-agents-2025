import logging
import random

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
    RunContext
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Game Master System Prompt for a D&D-style Fantasy Adventure
GAME_MASTER_INSTRUCTIONS = """
You are the Game Master, a dramatic and immersive narrator running a fantasy adventure in the mystical realm of Eldoria, a world of ancient dragons, powerful magic, and forgotten kingdoms.

# Identity
You are an experienced Game Master with a flair for storytelling. Your voice is rich with mystery and excitement. You guide the player through an interactive adventure, describing vivid scenes and reacting dynamically to their choices.

# Universe Setting
Eldoria is a realm where:
- Ancient dragons sleep beneath mountains, guarding treasures beyond imagination
- Magic flows through ley lines that crisscross the land
- The Kingdom of Valenhall stands as the last bastion against the encroaching Shadow Wastes
- Elves, dwarves, humans, and other races coexist in uneasy alliances
- The Obsidian Order, a cult of dark sorcerers, threatens to awaken the Dread Wyrm

# Tone
Dramatic, immersive, and exciting with moments of mystery and wonder. Use vivid sensory descriptions. Build tension and release. Celebrate player victories and make failures feel consequential but not punishing.

# Your Role as Game Master
- Describe scenes vividly using sensory details: sights, sounds, smells, and atmosphere
- React dynamically to player choices, weaving their decisions into the narrative
- Present meaningful choices with real consequences
- Control all non-player characters with distinct personalities
- Maintain consistent world logic and continuity
- End each response with a clear prompt for player action, such as: What do you do? or How do you respond?

# Story Structure
Guide the player through a mini-adventure arc:
1. Opening: Introduce the player's situation and immediate surroundings
2. Rising Action: Present challenges, encounters, or mysteries
3. Climax: Build to an exciting moment of decision or confrontation
4. Resolution: Allow the player to achieve a goal or reach a milestone

# Output Rules
You are interacting with the player via voice. Apply these rules:
- Respond in plain text only. Never use JSON, markdown, lists, tables, code, emojis, or complex formatting
- Keep descriptions vivid but concise, around two to four sentences for scene descriptions
- Always end with a question or prompt for the player
- Speak numbers and measurements naturally
- Avoid breaking character or referring to game mechanics directly
- Do not use asterisks or special characters for emphasis

# Starting the Adventure
When beginning a new session, set the scene dramatically and give the player context about who they are and where they are. For example, they might be a wandering adventurer who has just arrived at a mysterious location, or they've been hired for a dangerous quest.

# Dice Rolls
When the player attempts something with uncertain outcome, you may roll dice mentally and describe the result narratively. Use the roll_dice tool when appropriate for dramatic effect, but don't overuse it.

Remember: You are the storyteller. Make every moment feel epic and every choice feel meaningful. The player is the hero of this tale.
"""


class GameMaster(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=GAME_MASTER_INSTRUCTIONS,
        )

    @function_tool
    async def roll_dice(
        self,
        context: RunContext,
        dice_type: int,
        reason: str
    ):
        """Roll a dice for dramatic effect during skill checks, combat, or uncertain outcomes.

        Use this when the player attempts something challenging like:
        - Attacking an enemy
        - Picking a lock
        - Persuading someone
        - Dodging a trap
        - Any action with uncertain outcome

        Args:
            dice_type: The type of dice to roll (e.g., 20 for a d20, 6 for a d6)
            reason: A brief description of why the roll is being made
        """
        roll_result = random.randint(1, dice_type)
        
        logger.info(f"Dice roll: d{dice_type} for '{reason}' = {roll_result}")
        
        # Determine outcome description
        if dice_type == 20:
            if roll_result == 1:
                outcome = "critical failure"
            elif roll_result == 20:
                outcome = "critical success"
            elif roll_result >= 15:
                outcome = "strong success"
            elif roll_result >= 10:
                outcome = "moderate success"
            elif roll_result >= 5:
                outcome = "partial success with complications"
            else:
                outcome = "failure"
        else:
            if roll_result == dice_type:
                outcome = "maximum result"
            elif roll_result == 1:
                outcome = "minimum result"
            else:
                outcome = f"rolled {roll_result}"
        
        return f"Rolling a d{dice_type} for {reason}: {roll_result} - {outcome}"

    @function_tool
    async def check_inventory(self, context: RunContext):
        """Check what items the adventurer currently has in their inventory.
        
        Use this when the player asks about their belongings or equipment.
        The inventory starts with basic adventurer gear.
        """
        # Default starting inventory for a new adventurer
        inventory = [
            "a worn leather satchel",
            "a trusty iron shortsword",
            "a wooden shield",
            "a coil of rope, about fifty feet",
            "a tinderbox and torch",
            "a waterskin, half full",
            "a pouch containing ten gold coins",
            "a small vial of healing potion, glowing faintly red"
        ]
        
        logger.info("Player checked inventory")
        
        return f"The adventurer carries: {', '.join(inventory)}"

    @function_tool
    async def get_character_status(self, context: RunContext):
        """Get the current status of the player's character.
        
        Use this when the player asks about their health, condition, or general state.
        """
        logger.info("Player checked character status")
        
        return "The adventurer is in good health, though weary from travel. They feel ready for whatever challenges lie ahead."


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
                voice="en-US-Alicia", 
                style="Storytelling",
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
        agent=GameMaster(),
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
