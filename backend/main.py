import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import AgentRequest
from .perception import perceive
from .memory import initialize_memory, add_log
from .decision import decide
from .action import execute_action

# Load environment keys (OpenRouter API Key, Cerebras API Key, etc.)
# .env lives in the repo root (asi5/.env).
# This file is at assignment6/backend/main.py, so we need to go up two levels.
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path)

app = FastAPI(title="Cognitive Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/agent")
def agent_pipeline(req: AgentRequest):
    try:
        # Step 1: Memory init
        mem = initialize_memory(req.preferences)
        mem = add_log(mem, f"Received incoming request. Task type: {req.task_type}")
        
        # Step 2: Perception
        perc = perceive(req.image_base64)
        mem = add_log(mem, f"Perception completed. Observed: {perc.raw_content_description}")
        
        # Step 3: Decision
        dec = decide(req.task_type, perc, mem)
        mem = add_log(mem, f"Decision formulated. Next node: {dec.next_action_node}")
        
        # Step 4: Action
        final_output = execute_action(dec, req.image_base64)
        mem = add_log(mem, "Action executed and validated via Pydantic schema successfully.")
        
        # Return structured json output
        return final_output.model_dump()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
