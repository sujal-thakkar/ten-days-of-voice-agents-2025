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
from datetime import datetime, timedelta
import os
from todoist_api_python.api import TodoistAPI
from notion_client import Client

logger = logging.getLogger("agent")

class NotionWellnessStore:
    def __init__(self, api_key: str, database_id: str):
        self.client = Client(auth=api_key)
        self.database_id = database_id

    def save_entry(self, entry: dict):
        try:
            self.client.pages.create(
                parent={"database_id": self.database_id},
                properties={
                    "Name": {"title": [{"text": {"content": f"Check-in {entry['date']}"}}]},
                    "Date": {"date": {"start": entry["date"]}},
                    "Mood": {"rich_text": [{"text": {"content": entry["mood"]}}]},
                    "Objectives": {"rich_text": [{"text": {"content": ", ".join(entry["objectives"])}}]},
                    "Summary": {"rich_text": [{"text": {"content": entry["summary"]}}]},
                }
            )
            return True
        except Exception as e:
            logger.error(f"Notion save_entry error: {e}")
            return False

class WellnessStore:
    def __init__(self, file_path: str = "KMS/logs/wellness_log.json"):
        self.file_path = Path(file_path)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]")

    def load_history(self):
        try:
            return json.loads(self.file_path.read_text())
        except json.JSONDecodeError:
            return []

    def save_entry(self, entry: dict):
        history = self.load_history()
        history.append(entry)
        self.file_path.write_text(json.dumps(history, indent=2))

    def get_next_date(self):
        history = self.load_history()
        if not history:
            return datetime.now().strftime("%Y-%m-%d")
        
        last_date_str = history[-1].get("date")
        try:
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
            next_date = last_date + timedelta(days=1)
            return next_date.strftime("%Y-%m-%d")
        except (ValueError, TypeError):
             return datetime.now().strftime("%Y-%m-%d")

    def get_weekly_stats(self):
        history = self.load_history()
        if not history:
            return "No history available."
        
        # In this mock scenario, we treat the last 7 entries as "this week"
        recent_entries = history[-7:]
        
        return {
            "days_tracked": len(recent_entries),
            "entries": recent_entries
        }

class TaskStore:
    def __init__(self, file_path: str = "KMS/logs/tasks.json"):
        self.file_path = Path(file_path)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]")

    def load_tasks(self):
        try:
            return json.loads(self.file_path.read_text())
        except json.JSONDecodeError:
            return []

    def add_task(self, description: str, due_date: str | None = None):
        tasks = self.load_tasks()
        task = {
            "id": len(tasks) + 1,
            "description": description,
            "due_date": due_date,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        tasks.append(task)
        self.file_path.write_text(json.dumps(tasks, indent=2))
        return task

    def list_tasks(self, status: str | None = None):
        tasks = self.load_tasks()
        if status:
            return [t for t in tasks if t.get("status") == status]
        return tasks

    def update_task_status(self, task_id: int, status: str):
        tasks = self.load_tasks()
        for task in tasks:
            if task.get("id") == task_id:
                task["status"] = status
                self.file_path.write_text(json.dumps(tasks, indent=2))
                return task
        return None

class TodoistTaskManager:
    def __init__(self, api_key: str):
        self.api = TodoistAPI(api_key)

    def add_task(self, description: str, due_date: str | None = None):
        try:
            task = self.api.add_task(content=description, due_string=due_date)
            return {"id": task.id, "description": task.content, "due_date": task.due.string if task.due else None, "status": "pending"}
        except Exception as e:
            logger.error(f"Todoist add_task error: {e}")
            return {"error": str(e)}

    def list_tasks(self, status: str | None = None):
        try:
            tasks = self.api.get_tasks()
            # Todoist API returns all active tasks by default
            return [{"id": t.id, "description": t.content, "due_date": t.due.string if t.due else None, "status": "pending"} for t in tasks]
        except Exception as e:
            logger.error(f"Todoist list_tasks error: {e}")
            return []

    def update_task_status(self, task_id: str, status: str):
        try:
            if status == "completed":
                self.api.close_task(task_id=task_id)
                return {"id": task_id, "status": "completed"}
            return None
        except Exception as e:
            logger.error(f"Todoist update_task_status error: {e}")
            return None

load_dotenv(".env.local")


@dataclass
class Userdata:
    pass


class Assistant(Agent):
    def __init__(self) -> None:
        store = WellnessStore()
        history = store.load_history()
        history_context = "No previous history."
        current_date = store.get_next_date()
        
        if history:
            last_entry = history[-1]
            history_context = f"Previous check-in on {last_entry.get('date')}: Mood was '{last_entry.get('mood')}', Objectives were {last_entry.get('objectives')}."

        super().__init__(
            instructions=self._build_instructions() + f"\n\nCurrent Date: {current_date}\nContext from previous sessions:\n{history_context}",
            tools=[
                self._build_log_checkin_tool(),
                self._build_weekly_summary_tool(),
                self._build_task_tool(),
            ],
        )

    def _build_instructions(self) -> str:
        return """
    You are a supportive, realistic, and grounded health and wellness voice companion.
    Your goal is to check in with the user about their mood and goals, have a short conversation, and help them reflect.

    Behavior Requirements:
    1. Ask about mood and energy:
       - "How are you feeling today?"
       - "What's your energy like?"
       - "Anything stressing you out right now?"
       - Avoid diagnosis or medical claims. You are a companion, not a clinician.

    2. Ask about intentions / objectives for the day:
       - "What are 1–3 things you'd like to get done today?"
       - "Is there anything you want to do for yourself (rest, exercise, hobbies)?"

    3. Offer simple, realistic advice or reflections:
       - Suggestions should be small, actionable, and grounded.
       - Non-medical, non-diagnostic.
       - Examples: Break large goals into smaller steps, encourage short breaks, offer simple grounding ideas.

    4. Close the check-in with a brief recap:
       - Repeat back today's mood summary and main objectives.
       - Confirm: "Does this sound right?"
    
    5. Log the check-in:
       - Once the user confirms the recap, use the `log_checkin` tool to save the session data.
       - After logging, wish them a good day and end the conversation.

    6. Use past data to inform the conversation:
       - Refer to previous check-ins provided in the context (e.g., "Last time you mentioned...").
       - If the user asks about their week or trends, use the `get_weekly_summary` tool.

    7. Task Management:
       - If the user wants to turn their objectives into tasks, use the `manage_tasks` tool.
       - You can add tasks, list them, or mark them as done.
       - Always confirm with the user before creating tasks.
    """

    def _build_log_checkin_tool(self):
        @function_tool
        async def log_checkin(
            ctx: RunContext[Userdata],
            mood: Annotated[str, Field(description="Self-reported mood (text or scale).")],
            objectives: Annotated[list[str], Field(description="List of stated objectives/intentions for the day.")],
            summary: Annotated[str, Field(description="Short agent-generated summary sentence.")]
        ) -> str:
            """Log the daily check-in data."""
            store = WellnessStore()
            date = store.get_next_date()
            entry = {
                "date": date,
                "mood": mood,
                "objectives": objectives,
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            }
            store.save_entry(entry)
            
            # Try logging to Notion if configured
            notion_key = os.getenv("NOTION_API_KEY")
            notion_db = os.getenv("NOTION_DATABASE_ID")
            notion_msg = ""
            if notion_key and notion_db:
                notion_store = NotionWellnessStore(notion_key, notion_db)
                success = await asyncio.to_thread(notion_store.save_entry, entry)
                if success:
                    notion_msg = " and synced to Notion"
                else:
                    notion_msg = " (Notion sync failed)"

            return f"Check-in logged for {date}{notion_msg}."
        return log_checkin

    def _build_weekly_summary_tool(self):
        @function_tool
        async def get_weekly_summary(ctx: RunContext[Userdata]) -> str:
            """Get a summary of the user's mood and objectives over the last week."""
            store = WellnessStore()
            stats = store.get_weekly_stats()
            return json.dumps(stats)
        return get_weekly_summary

    def _build_task_tool(self):
        @function_tool
        async def manage_tasks(
            ctx: RunContext[Userdata],
            action: Annotated[str, Field(description="Action to perform: 'add', 'list', 'complete'.")],
            description: Annotated[str, Field(description="Task description (for 'add').")] = "",
            due_date: Annotated[str, Field(description="Due date/time in natural language (e.g., 'tomorrow at 6pm') for 'add'.")] = "",
            task_id: Annotated[str, Field(description="Task ID (for 'complete').")] = "",
        ) -> str:
            """Manage the user's tasks (add, list, complete). Uses Todoist if configured, otherwise local storage."""
            
            todoist_key = os.getenv("TODOIST_API_TOKEN")
            if todoist_key:
                store = TodoistTaskManager(todoist_key)
                store_type = "Todoist"
            else:
                store = TaskStore()
                store_type = "Local"

            if action == "add":
                if not description:
                    return "Description is required to add a task."
                
                # Handle different signatures
                d_date = due_date if due_date else None
                
                if store_type == "Todoist":
                    task = await asyncio.to_thread(store.add_task, description, d_date)
                else:
                    task = store.add_task(description, d_date)
                
                if "error" in task:
                    return f"Error adding task to {store_type}: {task['error']}"
                
                return f"Task added to {store_type}: #{task['id']} {task['description']} (Due: {task.get('due_date') or 'None'})"

            elif action == "list":
                if store_type == "Todoist":
                    tasks = await asyncio.to_thread(store.list_tasks)
                else:
                    tasks = store.list_tasks(status="pending")
                
                if not tasks:
                    return f"No pending tasks in {store_type}."
                return f"Pending tasks in {store_type}:\n" + "\n".join([f"#{t['id']} {t['description']} (Due: {t.get('due_date') or 'None'})" for t in tasks])

            elif action == "complete":
                if not task_id:
                    return "Task ID is required to complete a task."
                
                # Local store uses int IDs, Todoist uses string IDs
                if store_type == "Local":
                    try:
                        t_id = int(task_id)
                    except ValueError:
                        return "Local task IDs must be integers."
                    task = store.update_task_status(t_id, "completed")
                else:
                    task = await asyncio.to_thread(store.update_task_status, task_id, "completed")

                if task:
                    return f"Task #{task_id} marked as completed in {store_type}."
                return f"Task #{task_id} not found or error occurred."
            else:
                return f"Unknown action: {action}"
        return manage_tasks


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

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
