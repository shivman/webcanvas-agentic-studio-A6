import os
import json
from openai import OpenAI
from .models import DecisionOutput, ActionOutputAnalyze, ActionOutputSuggest, ActionOutputPrompt

def execute_action(decision: DecisionOutput, image_base64: str):
    """
    The Action layer routes:
    - Vision tasks (`analyze`, `suggest`) -> OpenRouter (Gemini-2.5-Flash)
    - Text-only tasks (`prompt`) -> Cerebras (Llama-3.1-8b)
    """
    if decision.next_action_node == 'analyze':
        schema = ActionOutputAnalyze.model_json_schema()
    elif decision.next_action_node == 'suggest':
        schema = ActionOutputSuggest.model_json_schema()
    elif decision.next_action_node == 'prompt':
        schema = ActionOutputPrompt.model_json_schema()
    else:
        raise ValueError(f"Unknown action node: {decision.next_action_node}")
        
    prompt = f"""
    You are the final Action Layer of an Agentic System.
    Review the context handed down by the Decision module containing Perception facts and Memory (User Preferences):
    
    {decision.context_to_inject}
    
    You must execute the requested task perfectly fulfilling the user preferences. 
    You MUST respond with a perfectly formatted, rigid JSON object containing the actual generated values. 
    Do NOT output the raw schema definition. You must populate a real JSON object matching this exact JSON Schema format:
    {json.dumps(schema)}
    
    Do not output any markdown formatting (no ```json). Output raw, unescaped JSON.
    """
    
    # Route based on the node type.
    node = decision.next_action_node
    if node in ("analyze", "suggest"):
        # Vision -> OpenRouter + Gemini
        print(f"[ACTION LAYER]: Utilizing OpenRouter API for '{node}'")
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.environ.get("OPENROUTER_API_KEY"),
        )
        model_name = "google/gemini-2.5-flash"

        contents = [{"type": "text", "text": prompt}]
        if image_base64:
            contents.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_base64}"
                }
            })

        messages = [{"role": "user", "content": contents}]
    elif node == "prompt":
        # Text-only -> Cerebras + Llama
        print("[ACTION LAYER]: Utilizing Cerebras API for 'prompt'")
        client = OpenAI(
            base_url="https://api.cerebras.ai/v1",
            api_key=os.environ.get("CEREBRAS_API_KEY"),
        )
        model_name = "llama3.1-8b"
        messages = [{"role": "user", "content": prompt}]
    else:
        raise ValueError(f"Unknown action node: {node}")

    response = client.chat.completions.create(
        model=model_name,
        max_tokens=1500,
        messages=messages,
    )
    
    text = response.choices[0].message.content.strip()
    
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
        
    try:
        data = json.loads(text)
        if decision.next_action_node == 'analyze':
            return ActionOutputAnalyze(**data)
        elif decision.next_action_node == 'suggest':
            return ActionOutputSuggest(**data)
        elif decision.next_action_node == 'prompt':
            return ActionOutputPrompt(**data)
    except Exception as e:
        print(f"Action parse error: {e}\nRaw text: {text}")
        raise
