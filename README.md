# Coursera Learning Coach - Active Recall Companion

Welcome to the **Coursera Learning Coach**! This project emulates a structured online course mentor that guides you through concepts with modular progression, formative recall, and gentle accountability.

## About the Project

This is an **Active Recall Coach** designed to help students master concepts through dialogue. It uses the **Model Context Protocol (MCP)** and **Agentic AI** principles to create a dynamic learning experience.

**Key Features:**
- **Persona**: Coursera-style structured mentor tone; encourages deliberate practice, module sequencing, and spaced recall.
- **Active Recall**: Three modes of learning:
    - **Learn**: The AI explains concepts (Variables, Loops, Agentic AI, MCP).
    - **Quiz**: The AI tests your knowledge.
    - **Teach-Back**: You teach the AI to prove your understanding.
- **Powered by**: LiveKit Agents, Murf Falcon TTS (fastest voice synthesis), and Gemini LLM.

## Repository Structure

This is a **monorepo** containing:

```
falcon-tdova-nov25-livekit/
├── backend/          # LiveKit Agents backend (Python) with Coursera Coach persona
├── frontend/         # Next.js frontend with Dark Academic Coursera Blue theme
├── start_app.sh      # Script to start all services
└── README.md         # This file
```

### Backend
Based on LiveKit's agent framework.
- **Agent**: `ActiveRecallCoach` with custom instructions for the Coursera learning coach persona.
- **Content**: `day4_tutor_content.json` contains the curriculum (Variables, Loops, Agentic AI, MCP).

### Frontend
Modern Next.js application.
- **Theme**: Dark academic palette with Coursera blues (#0056D2 primary, #00A5E8 accent) for accessible contrast.
- **UI**: Interactive session view with real-time transcription and controls.

[→ Frontend Documentation](./frontend/README.md)

## Quick Start

### Prerequisites

Make sure you have the following installed:

- Python 3.9+ with [uv](https://docs.astral.sh/uv/) package manager
- Node.js 18+ with pnpm
- [LiveKit CLI](https://docs.livekit.io/home/cli/cli-setup) (optional but recommended)
- [LiveKit Server](https://docs.livekit.io/home/self-hosting/local/) for local development

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd falcon-tdova-nov25-livekit
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Copy environment file and configure
cp .env.example .env.local

# Edit .env.local with your credentials:
# - LIVEKIT_URL
# - LIVEKIT_API_KEY
# - LIVEKIT_API_SECRET
# - MURF_API_KEY (for Falcon TTS)
# - GOOGLE_API_KEY (for Gemini LLM)
# - DEEPGRAM_API_KEY (for Deepgram STT)

# Download required models
uv run python src/agent.py download-files
```

For LiveKit Cloud users, you can automatically populate credentials:

```bash
lk cloud auth
lk app env -w -d .env.local
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env.local

# Edit .env.local with the same LiveKit credentials
```

### 4. Run the Application

#### Install livekit server

```bash
brew install livekit
```

You have two options:

#### Option A: Use the convenience script (runs everything)

```bash
# From the root directory
chmod +x start_app.sh
./start_app.sh
```

This will start:

- LiveKit Server (in dev mode)
- Backend agent (listening for connections)
- Frontend app (at http://localhost:3000)

#### Option B: Run services individually

```bash
# Terminal 1 - LiveKit Server
livekit-server --dev

# Terminal 2 - Backend Agent
cd backend
uv run python src/agent.py dev

# Terminal 3 - Frontend
cd frontend
pnpm dev
```

Then open http://localhost:3000 in your browser!

## Daily Challenge Tasks

Each day, you'll receive a new task that builds upon your voice agent. The tasks will help you:

- Implement different personas and conversation styles
- Add custom tools and capabilities
- Integrate with external APIs
- Build domain-specific agents (customer service, tutoring, etc.)
- Optimize performance and user experience

**Stay tuned for daily task announcements!**

## Documentation & Resources

- [Murf Falcon TTS Documentation](https://murf.ai/api/docs/text-to-speech/streaming)
- [LiveKit Agents Documentation](https://docs.livekit.io/agents)
- [Original Backend Template](https://github.com/livekit-examples/agent-starter-python)
- [Original Frontend Template](https://github.com/livekit-examples/agent-starter-react)

## Testing

The backend includes a comprehensive test suite:

```bash
cd backend
uv run pytest
```

Learn more about testing voice agents in the [LiveKit testing documentation](https://docs.livekit.io/agents/build/testing/).

## Contributing & Community

This is a challenge repository, but we encourage collaboration and knowledge sharing!

- Share your solutions and learnings on GitHub
- Post about your progress on LinkedIn
- Join the [LiveKit Community Slack](https://livekit.io/join-slack)
- Connect with other challenge participants

## License

This project is based on MIT-licensed templates from LiveKit and includes integration with Murf Falcon. See individual LICENSE files in backend and frontend directories for details.

## Have Fun!

Remember, the goal is to learn, experiment, and build amazing voice AI agents. Don't hesitate to be creative and push the boundaries of what's possible with Murf Falcon and LiveKit!

Good luck with the challenge!

---
Disclaimer: "Coursera" is a registered trademark of Coursera, Inc. This project is an educational demo persona and is not affiliated with or endorsed by Coursera.

---

Built for the AI Voice Agents Challenge by murf.ai
