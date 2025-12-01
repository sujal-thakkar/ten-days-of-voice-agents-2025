"""
Day 10 - Improv Battle: Voice Improv Game Show
A single-player improv host where the AI plays the role of a game show host.
"""

import json
import logging
import random
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field

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
    ChatContext,
    ChatMessage,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("improv-battle")

load_dotenv(".env.local")

# Topic for sending game state updates to the frontend
GAME_STATE_TOPIC = "improv-game-state"


@dataclass
class RoundResult:
    """Result of a single improv round."""
    round_number: int
    scenario_title: str
    reaction_summary: str
    player_highlight: str
    tags: list  # e.g., ["Bold", "Creative", "Quick-witted"]
    score: int  # 1-5 stars


@dataclass
class ImprovState:
    """Game state for tracking the improv battle session."""
    player_name: Optional[str] = None
    current_round: int = 0
    max_rounds: int = 3
    rounds: list = field(default_factory=list)  # List of RoundResult dicts
    phase: str = "intro"  # "intro" | "awaiting_improv" | "reacting" | "done"
    current_scenario: Optional[dict] = None
    user_turn_count: int = 0  # Track turns within a scene
    total_score: int = 0


def load_scenarios() -> list:
    """Load improv scenarios from JSON file."""
    scenarios_path = Path(__file__).parent / "data" / "improv_scenarios.json"
    try:
        with open(scenarios_path, "r") as f:
            data = json.load(f)
            return data.get("scenarios", [])
    except FileNotFoundError:
        logger.warning("Scenarios file not found, using default scenarios")
        return [
            {
                "id": 1,
                "title": "Time-Travelling Tour Guide",
                "description": "You are a time-travelling tour guide explaining modern smartphones to someone from the 1800s.",
                "tension": "The person from the past keeps asking increasingly difficult questions about this magical rectangle"
            },
            {
                "id": 2,
                "title": "Escaped Order",
                "description": "You are a restaurant waiter who must calmly tell a customer that their order has escaped the kitchen.",
                "tension": "The customer is getting impatient"
            },
            {
                "id": 3,
                "title": "Cursed Return",
                "description": "You are a customer trying to return an obviously cursed object to a very skeptical shop owner.",
                "tension": "The curse keeps manifesting while you try to explain"
            }
        ]


class ImprovBattleHost(Agent):
    """The AI host for the Improv Battle game show."""

    def __init__(self, player_name: Optional[str] = None, room=None) -> None:
        self.improv_state = ImprovState(player_name=player_name)
        self.scenarios = load_scenarios()
        self.used_scenario_ids: set = set()
        self._room = room  # Store reference to the room for sending game state

        super().__init__(
            instructions=self._build_instructions(),
        )

    def _build_instructions(self) -> str:
        """Build the system prompt for the improv host."""
        player_display = self.improv_state.player_name or "our contestant"
        
        return f"""You are the charismatic and witty host of "Improv Battle," a hit TV improv game show!

# Your Identity
- Your name is Max Sterling, legendary improv host known for sharp wit and genuine reactions.
- You are high-energy, theatrical, and love good improv comedy.
- You have a warm but honest personality. You are not always supportive; you give real reactions.

# Current Game State
- Player name: {player_display}
- Current round: {self.improv_state.current_round} of {self.improv_state.max_rounds}
- Phase: {self.improv_state.phase}

# Your Behavior Rules
1. NEVER use emojis, asterisks, markdown, or any special formatting in your responses.
2. Keep responses conversational and natural for voice.
3. Be theatrical but not over the top. Think late-night talk show host energy.
4. Your reactions should be VARIED and REALISTIC:
   - Sometimes you are amused and laugh along
   - Sometimes you are pleasantly surprised by clever choices
   - Sometimes you are mildly critical but constructive: "That felt a bit rushed"
   - Sometimes you tease the player playfully
   - You can be underwhelmed: "I expected a bit more there"
   - You can be genuinely impressed: "That was brilliant!"
5. Stay respectful and never be mean-spirited or abusive.
6. Listen carefully to what the player improvises and react to SPECIFIC things they said.

# Game Flow
- In the INTRO phase: Welcome the player, explain the show briefly, and get them hyped.
- In AWAITING_IMPROV phase: Present a scenario and tell the player to start improvising.
- After they perform: React honestly, comment on specific moments, then move to next round.
- After all rounds: Give a closing summary of what kind of improviser they are.

# Scene End Detection
- The player finishes their improv when they say things like:
  - "End scene" or "Scene"
  - "Done" or "I'm done"
  - "That's it" or "Okay"
  - Or when they clearly wrap up their character's dialogue
- When they finish, you react and move on.

# Important Commands
- If the player says "stop game", "end show", "quit", or "I want to stop": Gracefully end the session.
- Use the available tools to manage game state and progress through rounds.

# Output Rules
- Respond in plain text only.
- Keep responses concise but engaging.
- One thought at a time, no lists.
- Spell out any numbers.
"""

    def _get_random_scenario(self) -> dict:
        """Get a random scenario that hasn't been used yet."""
        available = [s for s in self.scenarios if s["id"] not in self.used_scenario_ids]
        if not available:
            # Reset if we've used all
            self.used_scenario_ids.clear()
            available = self.scenarios
        
        scenario = random.choice(available)
        self.used_scenario_ids.add(scenario["id"])
        return scenario

    def _update_instructions(self):
        """Update the instructions with current game state."""
        self._instructions = self._build_instructions()

    async def _send_game_state(self):
        """Send the current game state to the frontend via text stream."""
        if not self._room:
            logger.warning("No room reference available to send game state")
            return
        
        state_data = {
            "type": "game_state",
            "player_name": self.improv_state.player_name,
            "current_round": self.improv_state.current_round,
            "max_rounds": self.improv_state.max_rounds,
            "phase": self.improv_state.phase,
            "total_score": self.improv_state.total_score,
            "current_scenario": self.improv_state.current_scenario,
            "rounds": self.improv_state.rounds,
        }
        
        try:
            await self._room.local_participant.send_text(
                json.dumps(state_data),
                topic=GAME_STATE_TOPIC
            )
            logger.info(f"Sent game state update: phase={self.improv_state.phase}, round={self.improv_state.current_round}")
        except Exception as e:
            logger.error(f"Failed to send game state: {e}")

    @function_tool
    async def start_next_round(self, context: RunContext) -> str:
        """Start the next improv round. Call this to present a new scenario to the player.

        Returns:
            The scenario description to present to the player.
        """
        if self.improv_state.current_round >= self.improv_state.max_rounds:
            self.improv_state.phase = "done"
            self._update_instructions()
            await self._send_game_state()
            return "All rounds completed. Time for the closing summary."

        self.improv_state.current_round += 1
        self.improv_state.current_scenario = self._get_random_scenario()
        self.improv_state.phase = "awaiting_improv"
        self.improv_state.user_turn_count = 0
        self._update_instructions()
        await self._send_game_state()

        scenario = self.improv_state.current_scenario
        return f"Round {self.improv_state.current_round}: {scenario['title']}. Scenario: {scenario['description']}. The tension: {scenario['tension']}"

    @function_tool
    async def record_round_reaction(
        self,
        context: RunContext,
        reaction_summary: str,
        player_highlight: str,
        performance_tags: str,
        score: int
    ) -> str:
        """Record the host's reaction after the player finishes their improv.

        Args:
            reaction_summary: A brief summary of how the player performed (good, okay, needs work, etc.)
            player_highlight: A specific moment or line from the player's performance to remember
            performance_tags: Comma-separated tags describing the performance style (e.g., "Bold,Creative,Quick-witted")
            score: Performance score from 1 to 5 (1=needs work, 3=good, 5=brilliant)

        Returns:
            Confirmation that the round was recorded.
        """
        # Clamp score between 1-5
        score = max(1, min(5, score))
        tags = [tag.strip() for tag in performance_tags.split(",") if tag.strip()]
        
        if self.improv_state.current_scenario:
            round_result = {
                "round_number": self.improv_state.current_round,
                "scenario_title": self.improv_state.current_scenario["title"],
                "reaction_summary": reaction_summary,
                "player_highlight": player_highlight,
                "tags": tags,
                "score": score
            }
            self.improv_state.rounds.append(round_result)
            self.improv_state.total_score += score
        
        self.improv_state.phase = "reacting"
        self._update_instructions()
        await self._send_game_state()
        
        remaining = self.improv_state.max_rounds - self.improv_state.current_round
        if remaining > 0:
            return f"Round {self.improv_state.current_round} recorded with score {score}/5. {remaining} rounds remaining."
        else:
            return "Final round recorded. Time for the closing summary."

    @function_tool
    async def get_game_summary(self, context: RunContext) -> str:
        """Get a summary of all rounds for the closing remarks.

        Returns:
            A summary of how the player did across all rounds.
        """
        if not self.improv_state.rounds:
            return "No rounds were played."

        summary_parts = []
        all_tags = []
        for round_data in self.improv_state.rounds:
            summary_parts.append(
                f"Round {round_data['round_number']} ({round_data['scenario_title']}): "
                f"{round_data['reaction_summary']} - Score: {round_data['score']}/5. "
                f"Memorable moment: {round_data['player_highlight']}"
            )
            all_tags.extend(round_data.get('tags', []))
        
        self.improv_state.phase = "done"
        self._update_instructions()
        await self._send_game_state()
        
        # Calculate average and get unique tags
        avg_score = self.improv_state.total_score / len(self.improv_state.rounds)
        unique_tags = list(set(all_tags))[:5]  # Top 5 unique tags
        
        return f"Total score: {self.improv_state.total_score}/{len(self.improv_state.rounds) * 5} (avg: {avg_score:.1f}/5). Top traits: {', '.join(unique_tags)}. Rounds: " + " | ".join(summary_parts)

    @function_tool
    async def set_player_name(self, context: RunContext, name: str) -> str:
        """Set the player's name if they introduce themselves.

        Args:
            name: The player's name or nickname they want to use.

        Returns:
            Confirmation of the name being set.
        """
        self.improv_state.player_name = name
        self._update_instructions()
        await self._send_game_state()
        return f"Player name set to {name}"

    @function_tool
    async def end_game_early(self, context: RunContext) -> str:
        """End the game early when the player wants to stop.

        Returns:
            A message indicating the game is ending.
        """
        self.improv_state.phase = "done"
        self._update_instructions()
        await self._send_game_state()
        
        rounds_played = len(self.improv_state.rounds)
        if rounds_played > 0:
            return f"Game ended early after {rounds_played} rounds. Provide a brief, gracious farewell."
        return "Game ended before any rounds were played. Thank them for stopping by."

    async def on_enter(self):
        """Called when the agent becomes active. Start the show!"""
        # Send initial game state to frontend
        await self._send_game_state()
        
        player_name = self.improv_state.player_name
        
        if player_name:
            greeting = f"""Welcome, welcome, WELCOME to Improv Battle! 
            I'm your host, Max Sterling, and today we have {player_name} joining us! 
            Here's how this works: I give you a wild scenario, you improvise your way through it, 
            and I'll react honestly to your performance. We're doing {self.improv_state.max_rounds} rounds today. 
            When you're done with a scene, just say 'scene' or 'done' and I'll give you my thoughts. 
            Are you ready to show us what you've got, {player_name}?"""
        else:
            greeting = """Welcome, welcome, WELCOME to Improv Battle! 
            I'm your host, Max Sterling! 
            Before we dive in, what should I call you? Give me a name or nickname!"""
        
        await self.session.generate_reply(instructions=greeting)

    async def on_user_turn_completed(
        self, turn_ctx: ChatContext, new_message: ChatMessage
    ) -> None:
        """Track user turns and inject game state context."""
        self.improv_state.user_turn_count += 1
        
        # Get the user's message text
        user_text = new_message.text_content or ""
        user_text_lower = user_text.lower().strip()
        
        # Check for early exit commands
        exit_phrases = ["stop game", "end show", "quit", "i want to stop", "stop the game", "end the game"]
        if any(phrase in user_text_lower for phrase in exit_phrases):
            turn_ctx.add_message(
                role="system",
                content="[GAME CONTROL] The player wants to end the game early. Use the end_game_early tool and give a graceful farewell."
            )
            return
        
        # Check for scene end indicators
        scene_end_phrases = ["end scene", "scene", "done", "i'm done", "that's it", "okay done", "and scene"]
        is_scene_end = any(phrase in user_text_lower for phrase in scene_end_phrases)
        
        # Add context based on current phase
        if self.improv_state.phase == "intro":
            if not self.improv_state.player_name:
                # They might be giving their name
                turn_ctx.add_message(
                    role="system",
                    content=f"[GAME CONTROL] The player said: '{user_text}'. If this sounds like a name, use set_player_name tool. Then get them hyped and use start_next_round to begin!"
                )
            else:
                # Ready to start
                turn_ctx.add_message(
                    role="system",
                    content="[GAME CONTROL] Player is ready. Use start_next_round tool to present the first scenario."
                )
                
        elif self.improv_state.phase == "awaiting_improv":
            if is_scene_end or self.improv_state.user_turn_count >= 3:
                # Scene is ending
                turn_ctx.add_message(
                    role="system",
                    content=f"""[GAME CONTROL] The player has finished their improv for round {self.improv_state.current_round}. 
                    React to their specific performance. Pick a random tone: amused, impressed, mildly critical, pleasantly surprised, or playfully teasing.
                    Use record_round_reaction to save your reaction with:
                    - reaction_summary: brief assessment
                    - player_highlight: memorable moment from their performance
                    - performance_tags: 2-3 style tags like "Bold", "Creative", "Quick-witted", "Character-focused", "Story-driven", "Physical", "Absurdist", "Emotional"
                    - score: 1-5 (1=needs work, 2=okay, 3=good, 4=great, 5=brilliant)
                    Then either start_next_round for more, or get_game_summary if this was the last round."""
                )
            else:
                # They're still improvising - stay in character and react
                turn_ctx.add_message(
                    role="system",
                    content="[GAME CONTROL] The player is improvising. React briefly in character if appropriate, or wait for them to indicate they're done."
                )
                
        elif self.improv_state.phase == "reacting":
            # Ready for next round
            if self.improv_state.current_round < self.improv_state.max_rounds:
                turn_ctx.add_message(
                    role="system",
                    content="[GAME CONTROL] Use start_next_round to present the next scenario."
                )
            else:
                turn_ctx.add_message(
                    role="system",
                    content="[GAME CONTROL] All rounds complete. Use get_game_summary and give closing remarks."
                )


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Connect first to ensure room metadata is available
    await ctx.connect()

    # Extract player name from room metadata if provided
    player_name = None
    if ctx.room.metadata:
        try:
            metadata = json.loads(ctx.room.metadata)
            player_name = metadata.get("player_name")
            logger.info(f"Player name from metadata: {player_name}")
        except json.JSONDecodeError:
            logger.warning("Failed to parse room metadata")

    # Set up the voice AI pipeline
    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True
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

    # Start the session with the Improv Battle Host
    await session.start(
        agent=ImprovBattleHost(player_name=player_name, room=ctx.room),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
