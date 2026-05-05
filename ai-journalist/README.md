# AI Journalist Copilot

A real-time, human-in-the-loop AI system designed to assist journalists and interviewers in extracting tacit knowledge from experts.

## 🚀 Architecture

- **Backend**: Python + [LangGraph](https://github.com/langchain-ai/langgraph) + FastAPI
  - Orchestrates a 5-node cognitive processing graph.
  - Performs real-time transcript analysis, cognitive state evaluation, and multi-strategy prompt generation.
- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
  - Real-time STT via Deepgram.
  - High-contrast "Teleprompter" UI for live interviewer assistance.
  - Live extraction sidebar for frameworks and insights.

## 🛠️ Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API Key
- Deepgram API Key

### Backend Setup
1. Copy `.env.example` to `.env` and add your `OPENAI_API_KEY`.
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn langgraph langchain-openai python-dotenv
   ```
3. Start the server:
   ```bash
   python -m uvicorn backend.server:app --reload --port 8001
   ```

### Frontend Setup
1. Navigate to `copilot-ui`.
2. Copy `.env.example` to `.env` and add your `VITE_DEEPGRAM_API_KEY`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🧠 Cognitive Graph Nodes

1. **STT Ingestion**: Receives transcript chunks from the frontend.
2. **Dynamics Evaluation**: Analyzes flow states, energy, and depth.
3. **Knowledge Retrieval**: (Optional) Pulls context from a vector database.
4. **Prompt Generation**: Suggests the next best question using specific interviewer archetypes (Fridman, Patel, etc.).
5. **Router**: Manages state transitions and feedback loops.

## 📄 License
MIT
