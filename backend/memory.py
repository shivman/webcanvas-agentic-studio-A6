from .models import MemoryState, UserPreference

def initialize_memory(preferences: UserPreference) -> MemoryState:
    """Initializes the memory state with the user's base preferences."""
    return MemoryState(
        current_preferences=preferences,
        short_term_context=[]
    )

def add_log(memory: MemoryState, log: str) -> MemoryState:
    """Appends an event to the agent's short-term session memory."""
    memory.short_term_context.append(log)
    print(f"[MEMORY LOG]: {log}")
    return memory
