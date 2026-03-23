from pydantic import BaseModel, Field
from typing import Optional, List, Any

# --------------------------
# Global System Models
# --------------------------
class UserPreference(BaseModel):
    art_style: str = Field(default="", description="The user's preferred art style")
    favorite_topics: str = Field(default="", description="The user's favorite topics or themes")
    skill_level: str = Field(default="beginner", description="The user's self-reported skill level")

class AgentRequest(BaseModel):
    task_type: str = Field(..., description="The type of task: 'analyze', 'suggest', or 'prompt'")
    image_base64: Optional[str] = Field(None, description="The base64 encoded image data if applicable")
    preferences: UserPreference = Field(default_factory=UserPreference, description="User's preferences collected before flow starts")

# --------------------------
# Cognitive Layer 1: Perception
# --------------------------
class PerceptionOutput(BaseModel):
    raw_content_description: str = Field(..., description="Objective description of what is visible in the image")
    detected_colors: List[str] = Field(default_factory=list, description="Colors primarily used in the image")
    structural_flaws: List[str] = Field(default_factory=list, description="Any obvious structural or proportional flaws")

# --------------------------
# Cognitive Layer 2: Memory
# --------------------------
# The Memory module will track and format preferences and past actions
class MemoryState(BaseModel):
    current_preferences: UserPreference
    short_term_context: List[str] = Field(default_factory=list, description="Log of recent agentic steps executed in this session")

# --------------------------
# Cognitive Layer 3: Decision
# --------------------------
class DecisionOutput(BaseModel):
    next_action_node: str = Field(..., description="Which specific endpoint/prompting logic should be triggered next")
    context_to_inject: str = Field(..., description="The rationale or specific instructions to pass to the Action layer based on Memory")
    confidence: float = Field(..., description="Confidence from 0.0 to 1.0 on this decision")

# --------------------------
# Cognitive Layer 4: Action (Final Output Payloads)
# --------------------------
class ActionReasoning(BaseModel):
    observe: str
    hypothesize: str
    self_check: str
    reasoning_type: str
    fallback: str

class FinalAnalyzeResult(BaseModel):
    content: str
    style: str
    meaning: str

class ActionOutputAnalyze(BaseModel):
    reasoning: ActionReasoning
    final_result: FinalAnalyzeResult

class FinalSuggestResult(BaseModel):
    improvements: str
    techniques: str

class ActionOutputSuggest(BaseModel):
    reasoning: ActionReasoning
    final_result: FinalSuggestResult

class FinalPromptResult(BaseModel):
    prompt: str
    tips: str

class ActionOutputPrompt(BaseModel):
    reasoning: ActionReasoning
    final_result: FinalPromptResult
