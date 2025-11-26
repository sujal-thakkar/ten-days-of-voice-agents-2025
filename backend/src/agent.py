import logging
import json
import os
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Annotated

from tavily import TavilyClient # Added import

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
)
from livekit.agents.llm import ChatContext, ChatRole
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")


@dataclass
class HoslaSharedState:
    company_data: dict
    calendar_data: dict
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    lead_data: dict = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.lead_data:
            self.lead_data = {"session_id": self.session_id}
        else:
            self.lead_data.setdefault("session_id", self.session_id)

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    
    # Preload Company Data
    try:
        with open("company_data.json", "r") as f:
            proc.userdata["company_data"] = json.load(f)
            logger.info("Company data preloaded successfully.")
    except FileNotFoundError:
        logger.error("company_data.json not found!")
        proc.userdata["company_data"] = {"faq": [], "products": []}

    # Preload Calendar Data
    try:
        if os.path.exists("calendar_data.json"):
            with open("calendar_data.json", "r") as f:
                proc.userdata["calendar_data"] = json.load(f)
        else:
            proc.userdata["calendar_data"] = {"available_slots": [], "bookings": []}
    except Exception as e:
        logger.error(f"Error loading calendar: {e}")
        proc.userdata["calendar_data"] = {"available_slots": [], "bookings": []}

FOLLOW_UP_EMAIL_FILE = "follow_up_emails.json"


class HoslaAgent(Agent):
    def __init__(self, *, state: HoslaSharedState, instructions: str, **kwargs) -> None:
        super().__init__(instructions=instructions, **kwargs)
        self.state = state

    @property
    def lead_data(self) -> dict:
        return self.state.lead_data

    @property
    def company_data(self) -> dict:
        return self.state.company_data

    @property
    def calendar_data(self) -> dict:
        return self.state.calendar_data

    @property
    def session_id(self) -> str:
        return self.state.session_id

    @function_tool
    async def perform_web_search(self, query: Annotated[str, "The name or company to search for"]) -> str:
        """
        Search the web for information about a prospect or company to understand their role and interests.
        """
        logger.info(f"Performing web search for: {query}")
        
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            logger.warning("TAVILY_API_KEY not found. Web search is disabled.")
            return "Web search is currently unavailable. Please proceed with general questions."

        try:
            client = TavilyClient(api_key=api_key)
            # Search for the person/company with a focus on professional background
            response = client.search(query, search_depth="basic", max_results=3)
            
            results = []
            for result in response.get("results", []):
                results.append(f"Title: {result['title']}\nContent: {result['content']}\nURL: {result['url']}")
            
            if not results:
                return f"No specific public profile found for '{query}'. Assume they are a general professional."
                
            return "\n\n".join(results)
            
        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return "Web search failed due to an error. Please proceed with general questions."

    @function_tool
    async def check_availability(self) -> str:
        """
        Check for available meeting slots. Returns next few available slots for immediate booking, 
        but notes that future times are also open.
        """
        now = datetime.now()
        # Generate next 3 slots (e.g. start of next hour)
        next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        slots = []
        for i in range(3):
            slot = next_hour + timedelta(hours=i)
            # Simple logic: just list the next 3 hours as available
            slots.append(slot.strftime("%A, %B %d at %I:%M %p"))
            
        return (
            f"I have immediate openings at: {', '.join(slots)}. "
            "Or if you prefer a specific date and time in the future, just let me know and I can book that for you."
        )

    @function_tool
    async def book_meeting(self, slot_time: Annotated[str, "The chosen time slot in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)"]) -> str:
        """
        Book a meeting. Accepts any valid future time.
        """
        try:
            # Try parsing ISO format
            dt = datetime.fromisoformat(slot_time)
        except ValueError:
            return "I couldn't understand that date format. Please provide the date and time clearly."
            
        if dt < datetime.now():
            return "I can't book a meeting in the past. Please choose a future time."
            
        # Check if already booked (simple check)
        for booking in self.calendar_data.get("bookings", []):
            booked_slot = booking.get("slot")
            if booked_slot == slot_time:
                 return "That slot is already booked. Please choose another time."

        booking = {
            "slot": slot_time,
            "lead_id": self.session_id,
            "lead_name": self.lead_data.get("name", "Unknown"),
            "booked_at": datetime.now().isoformat()
        }
        self.calendar_data["bookings"].append(booking)
        
        # Persist back to file
        with open("calendar_data.json", "w") as f:
            json.dump(self.calendar_data, f, indent=2)
        
        return f"Confirmed. I have scheduled your consultation for {dt.strftime('%A, %B %d at %I:%M %p')}."

    @function_tool
    async def lookup_faq(self, query: Annotated[str, "The user's question or keywords to search for in the FAQ"]) -> str:

        """
        Search the company FAQ and service details to answer user questions.
        """
        logger.info(f"Searching FAQ for: {query}")
        query = query.lower()
        
        results = []
        
        # Search in FAQ
        for item in self.company_data.get("faq", []):
            if query in item["question"].lower() or query in item["answer"].lower():
                results.append(f"Q: {item['question']}\nA: {item['answer']}")
        
        # Search in Products
        for item in self.company_data.get("products", []):
            if query in item["name"].lower() or query in item["description"].lower():
                results.append(f"Product: {item['name']}\nDescription: {item['description']}\nPricing: {item['pricing']}")

        if not results:
            return "I don't have the specific details right now, but I can arrange for a care coordinator to explain this to you personally."
        
        return "\n\n".join(results[:3]) # Return top 3 matches

    @function_tool
    async def save_lead_info(
        self, 
        name: Annotated[str, "Lead's name"] = None,
        location: Annotated[str, "Lead's location"] = None,
        phone: Annotated[str, "Lead's phone number"] = None,
        service_required: Annotated[str, "Type of service required"] = None,
        patient_details: Annotated[str, "Details about the patient (age, condition)"] = None,
        timeline: Annotated[str, "When they need the service"] = None
    ) -> str:
        """
        Save or update the lead's information. Call this whenever the user provides new details.
        """
        filename = "leads.json"
        
        # Update local state
        if name: self.lead_data["name"] = name
        if location: self.lead_data["location"] = location
        if phone: self.lead_data["phone"] = phone
        if service_required: self.lead_data["service_required"] = service_required
        if patient_details: self.lead_data["patient_details"] = patient_details
        if timeline: self.lead_data["timeline"] = timeline
        
        self.lead_data["last_updated"] = datetime.now().isoformat()

        # Read existing leads
        leads = []
        if os.path.exists(filename):
            try:
                with open(filename, "r") as f:
                    leads = json.load(f)
            except json.JSONDecodeError:
                pass
        
        # Update or append
        found = False
        for i, lead in enumerate(leads):
            if lead.get("session_id") == self.session_id:
                leads[i] = self.lead_data
                found = True
                break
        
        if not found:
            leads.append(self.lead_data)
            
        with open(filename, "w") as f:
            json.dump(leads, f, indent=2)
        
        return "Information updated successfully."


class DiscoveryAgent(HoslaAgent):
    def __init__(self, *, state: HoslaSharedState, chat_ctx: ChatContext | None = None) -> None:
        super().__init__(
            state=state,
            chat_ctx=chat_ctx,
            instructions="""You are a compassionate and professional representative for Hosla, "Your Extended Family".

Your goals are:
1. Warmly greet the visitor and ask how you can support them or their loved ones today.
2. Answer questions about Hosla's caregiving services (Elderly Care, Patient Care, Companionship) using the available tools.
3. **Persona Discovery & Adaptation:**
    - Early in the conversation, ask for the user's name if not provided.
    - Use the `perform_web_search` tool with their name to find their professional background.
    - Infer their persona (Developer, Product Manager, Founder, Marketer, or General).
    - **Adapt your pitch based on their persona:**
      - **Developer/Engineer:** Highlight our tech-enabled monitoring, real-time app updates, and reliable data tracking for peace of mind. Use terms like "real-time alerts", "dashboard", "seamless integration".
      - **Product Manager:** Focus on the user experience (UX) for the family, the ease of scheduling via our app, and our high service quality metrics.
      - **Founder/Executive:** Emphasize "peace of mind" so they can focus on their business. Mention reliability, vetting processes, and premium support.
      - **Marketer:** Talk about our community trust, glowing testimonials, and our "extended family" brand promise.
      - **General:** Focus on compassion, care, and safety.

4. Naturally collect the following lead information during the conversation:
    - Name
    - Location (City/Area)
    - Phone Number
    - Service Required (e.g., Elder Care, Patient Care)
    - Patient Details (Age, Condition)
    - Timeline (Immediate, Future)

5. If the user expresses interest in a consultation or detailed discussion, offer to schedule a meeting with a Care Coordinator.
    - Use `check_availability` to find slots.
    - Use `book_meeting` to confirm the appointment.

6. If the user indicates they are done, provide a reassuring summary of their request and next steps.

Tone:
- Empathetic, warm, and reassuring (like a family member).
- Professional and trustworthy.
- Clear and concise.
- **Adaptive:** Shift your vocabulary slightly to match the user's professional persona (e.g., more analytical for a dev, more emotional for a marketer).

Important:
- Use the `lookup_faq` tool to find answers.
- Use the `save_lead_info` tool to save details.
- Use `perform_web_search` to learn about the user.
- If you don't know an answer, assure them you will have a care coordinator reach out.
""",
    )

    @function_tool
    async def handoff_to_scheduling(self) -> Agent:
        """Transfer the conversation to the scheduling specialist when the user wants to book, reschedule, or confirm an appointment."""
        await self.session.generate_reply(
            instructions="I'll bring in our scheduling specialist to help lock in the exact time that works for you."
        )
        return SchedulingAgent(state=self.state, chat_ctx=self.session.chat_ctx)

    @function_tool
    async def handoff_to_billing(self) -> Agent:
        """Transfer to the pricing and billing specialist for cost, insurance, or payment plan questions."""
        await self.session.generate_reply(
            instructions="Let me connect you with our care plan specialist who can go deeper on pricing and coverage."
        )
        return BillingAgent(state=self.state, chat_ctx=self.session.chat_ctx)


class SchedulingAgent(HoslaAgent):
    def __init__(self, *, state: HoslaSharedState, chat_ctx: ChatContext | None = None) -> None:
        super().__init__(
            state=state,
            chat_ctx=chat_ctx,
            instructions="""You are Hosla's Scheduling Specialist.

Focus only on locking in a consultation slot and confirming any logistical information.
- Ask for the user's preferred date/time and confirm the caregiver need.
- Use `check_availability` to present options and `book_meeting` once the user agrees.
- Keep explanations crisp and repeat back the confirmed time at the end.
- If the user shifts back to general service or pricing questions, route them to the appropriate teammate using the available handoff tools.
""",
        )

    @function_tool
    async def return_to_care_host(self) -> Agent:
        """Bring the general care advisor back when the user has broader service questions."""
        await self.session.generate_reply(
            instructions="Sure, I'll loop our care advisor back in so they can cover the rest."
        )
        return DiscoveryAgent(state=self.state, chat_ctx=self.session.chat_ctx)

    @function_tool
    async def loop_in_billing(self) -> Agent:
        """Introduce the billing specialist for pricing or payment specific follow-ups."""
        await self.session.generate_reply(
            instructions="I'll add our billing specialist so you can review pricing before we finalize anything."
        )
        return BillingAgent(state=self.state, chat_ctx=self.session.chat_ctx)


class BillingAgent(HoslaAgent):
    def __init__(self, *, state: HoslaSharedState, chat_ctx: ChatContext | None = None) -> None:
        super().__init__(
            state=state,
            chat_ctx=chat_ctx,
            instructions="""You are Hosla's Care Plan & Billing Specialist.

Goals:
- Explain pricing tiers, payment schedules, and any discounts with empathy and clarity.
- Reference verified details from `lookup_faq` and the shared lead profile whenever possible.
- Capture any budget constraints or approval requirements via `save_lead_info`.
- Hand back to Scheduling if the user is ready to pick a time, or to the Care Host if the conversation broadens again.
""",
        )

    @function_tool
    async def return_to_care_host(self) -> Agent:
        """Bring the general care advisor back for holistic conversations."""
        await self.session.generate_reply(
            instructions="I'll hand you back to our care advisor so they can continue guiding next steps."
        )
        return DiscoveryAgent(state=self.state, chat_ctx=self.session.chat_ctx)

    @function_tool
    async def route_to_scheduling(self) -> Agent:
        """Escalate to scheduling once pricing questions are resolved and the user is ready to meet."""
        await self.session.generate_reply(
            instructions="Sounds great. I'll bring in our scheduling specialist to reserve a time right away."
        )
        return SchedulingAgent(state=self.state, chat_ctx=self.session.chat_ctx)

def _safe_json_load(path: str) -> list:
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        logger.warning(f"Failed to read JSON from {path}. Starting with empty list.")
        return []


def save_follow_up_email(session_id: str, lead_details: dict, email_data: dict, transcript: str) -> None:
    """Persist the generated follow-up email in a copy-friendly format."""
    emails = _safe_json_load(FOLLOW_UP_EMAIL_FILE)

    subject = (email_data.get("subject") or "").strip()
    body = (email_data.get("body") or "").strip()
    call_to_action = (email_data.get("call_to_action") or "").strip()

    copy_ready_text = f"Subject: {subject}\n\n{body}\n\nCall to action: {call_to_action}".strip()

    entry = {
        "session_id": session_id,
        "created_at": datetime.now().isoformat(),
        "lead": lead_details or {},
        "subject": subject,
        "body": body,
        "call_to_action": call_to_action,
        "copy_ready_text": copy_ready_text,
        "transcript_excerpt": transcript[-2000:] if transcript else "",
    }

    emails.append(entry)

    with open(FOLLOW_UP_EMAIL_FILE, "w") as f:
        json.dump(emails, f, indent=2)

    logger.info("Follow-up email draft saved for session %s", session_id)


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Retrieve prewarmed data
    company_data = ctx.proc.userdata.get("company_data", {"faq": [], "products": []})
    calendar_data = ctx.proc.userdata.get("calendar_data", {"available_slots": [], "bookings": []})
    shared_state = HoslaSharedState(company_data=company_data, calendar_data=calendar_data)

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession[HoslaSharedState](
        userdata=shared_state,
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

    async def analyze_call():
        # Get transcript
        transcript = ""
        # session.chat_ctx.messages contains the history
        for msg in session.chat_ctx.messages:
            # Skip system messages if desired, but they might contain context. 
            # Usually we want User and Assistant messages.
            if msg.role == ChatRole.SYSTEM:
                continue
                
            role = msg.role.value if hasattr(msg.role, "value") else str(msg.role)
            content = msg.content
            
            # Content can be a string or a list of content items (text, image, etc.)
            text_content = ""
            if isinstance(content, str):
                text_content = content
            elif isinstance(content, list):
                # Filter for text content
                text_content = " ".join([str(c) for c in content if isinstance(c, str)])
            
            if text_content:
                transcript += f"{role}: {text_content}\n"
        
        if not transcript.strip():
            logger.info("No transcript to analyze.")
            return

        logger.info("Analyzing call transcript...")
        
        analysis_prompt = """Analyze the following sales call transcript and extract structured CRM notes.
        
        Return a valid JSON object with the following fields:
        - pain_points: list of strings
        - budget_mentioned: boolean
        - role: "decision_maker", "influencer", or "unknown"
        - urgency: "high", "medium", or "low"
        - timeline: "now", "soon", "later", or "unknown"
        - fit_score: integer (0-100)
        - summary: string (concise summary)
        
        Transcript:
        {transcript}
        """

        # Use a separate LLM instance for analysis to avoid interfering with the session state if it were still active
        llm = google.LLM(model="gemini-2.5-flash")

        async def run_structured_llm_call(system_prompt: str, user_prompt: str) -> dict | None:
            chat_ctx = ChatContext().append(
                role=ChatRole.SYSTEM,
                text=system_prompt
            ).append(
                role=ChatRole.USER,
                text=user_prompt
            )

            try:
                stream = await llm.chat(chat_ctx=chat_ctx)
            except Exception as llm_error:
                logger.error("LLM call failed: %s", llm_error)
                return None

            response_text = ""
            async for chunk in stream:
                response_text += chunk.choices[0].delta.content or ""

            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if not json_match:
                logger.error("Structured LLM response missing JSON: %s", response_text)
                return None

            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError as decode_error:
                logger.error("Failed to decode LLM JSON: %s", decode_error)
                return None

        crm_data = await run_structured_llm_call(
            system_prompt="You are a CRM data extraction assistant. Output only valid JSON.",
            user_prompt=analysis_prompt.format(transcript=transcript),
        )

        if crm_data:
            crm_file = "crm_notes.json"
            notes = []
            if os.path.exists(crm_file):
                try:
                    with open(crm_file, "r") as f:
                        notes = json.load(f)
                except Exception:
                    logger.warning("Failed to read existing CRM notes; starting new file.")

            if hasattr(session.agent, "session_id"):
                crm_data["session_id"] = session.agent.session_id
            crm_data["timestamp"] = datetime.now().isoformat()

            notes.append(crm_data)

            with open(crm_file, "w") as f:
                json.dump(notes, f, indent=2)

            logger.info("CRM notes saved successfully.")

        state = session.userdata if hasattr(session, "userdata") else None
        lead_details = state.lead_data.copy() if state and state.lead_data else {}

        email_prompt = f"""Draft a compassionate follow-up email for a Hosla caregiving lead.
        Use the transcript and lead profile to personalize the tone.
        Requirements:
        - Provide JSON with keys: subject, body, call_to_action.
        - Body must be 2 to 3 short paragraphs separated by a blank line.
        - Reference the exact service details or pain points mentioned when possible.
        - The call_to_action should be one concise sentence with a clear next step (e.g., reply to book a time).
        - Keep the tone warm, trustworthy, and confident.

        Transcript:
        {transcript}

        Lead details:
        {json.dumps(lead_details, indent=2) if lead_details else "Not provided"}
        """

        email_data = await run_structured_llm_call(
            system_prompt="You craft succinct follow-up emails for Hosla prospects. Respond only with valid JSON matching the requested schema.",
            user_prompt=email_prompt,
        )

        if email_data and state:
            save_follow_up_email(state.session_id, lead_details, email_data, transcript)
        elif email_data:
            save_follow_up_email(str(uuid.uuid4()), lead_details, email_data, transcript)

    ctx.add_shutdown_callback(analyze_call)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=DiscoveryAgent(state=shared_state),
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