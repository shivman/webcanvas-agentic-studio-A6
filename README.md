# WebCanvas Agentic Studio

A Chrome extension + FastAPI backend project for drawing on any webpage and getting structured, preference-aware AI feedback.

The system uses a cognitive pipeline with four layers:
- Perception
- Memory
- Decision
- Action

It supports three user-facing AI actions:
- Analyze Drawing
- Get Suggestions
- Generate Drawing Prompt

## Project Purpose

This project demonstrates how to combine browser interaction (canvas drawing) with an agentic backend architecture that reasons in modular steps and returns schema-validated outputs.

Instead of raw model responses, users receive structured reasoning and actionable results tailored to their preferences (style, topics, skill level).

## Architecture

### Frontend (Chrome Extension)
- `content.js`: canvas engine, toolbar, drawing capture, message handling
- `popup.js`: UI controls for activate/analyze/suggest/prompt
- `settings.js` + `settings.html`: user preference management
- `ai-service.js`: sends tasks and drawing data to backend

### Backend (FastAPI)
- `backend/main.py`: API entry point (`/api/agent`)
- `backend/perception.py`: image understanding
- `backend/memory.py`: short-term context + preferences
- `backend/decision.py`: task routing and context injection
- `backend/action.py`: final structured generation
- `backend/models.py`: Pydantic request/response schemas

## Data Flow

1. User draws on `<canvas id="web-canvas">`
2. Extension converts drawing to Base64 PNG
3. Extension sends payload to `http://localhost:8000/api/agent`
4. Backend runs Perception -> Memory -> Decision -> Action
5. Extension renders structured output in popup

## Model Routing

- `analyze` / `suggest` (vision tasks): OpenRouter (`google/gemini-2.5-flash`)
- `prompt` (text-only task): Cerebras (`llama3.1-8b`)

## Setup

### 1) Install frontend dependencies
```bash
cd assignment6
npm install
```

### 2) Configure environment variables
Create/update root `.env` (in `asi5/`) with:
- `OPENROUTER_API_KEY`
- `CEREBRAS_API_KEY`

### 3) Run backend
```bash
cd assignment6
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4) Build extension
```bash
cd assignment6
npm run build
```

### 5) Load extension in Chrome
- Open `chrome://extensions`
- Enable Developer mode
- Load unpacked -> select `assignment6`

## Usage

1. Open extension popup
2. Set preferences in Agent Settings
3. Activate drawing and sketch on a webpage
4. Use:
   - Analyze Drawing
   - Get Suggestions
   - Generate Drawing Prompt

## Notes

- Frontend/UI changes require `npm run build` to refresh `dist/`.
- API keys must never be committed to Git.
- Pydantic models enforce rigid output structure for stable UI rendering.
