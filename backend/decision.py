from .models import DecisionOutput, MemoryState, PerceptionOutput

def decide(task_type: str, perception: PerceptionOutput, memory: MemoryState) -> DecisionOutput:
    """
    The Decision Layer uses the current Memory and Perception to decide
    the prompt strategy and next steps for the Action Layer.
    """
    
    context =  "--- DECISION CONTEXT ---\n"
    context += f"Task to Execute: {task_type}\n"
    
    prefs = memory.current_preferences
    context += f"User Preferences: Art Style: '{prefs.art_style}', Favorite Topics: '{prefs.favorite_topics}', Skill Level: '{prefs.skill_level}'.\n"
    
    context += f"Perception Fact Sheet: {perception.model_dump_json()}\n"
    
    context += "INSTRUCTION FOR ACTION LAYER: You MUST incorporate the User Preferences prominently into your output. For example, if they like Cyberpunk, give Cyberpunk-themed suggestions or critiques."
    
    # In a more advanced agent, this layer would use an LLM to decide routing.
    # Here, we statically map strings to nodes.
    return DecisionOutput(
        next_action_node=task_type,
        context_to_inject=context,
        confidence=1.0
    )
