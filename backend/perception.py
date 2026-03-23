import os
import json
from openai import OpenAI
from .models import PerceptionOutput

def perceive(image_base64: str) -> PerceptionOutput:
    if not image_base64:
        return PerceptionOutput(raw_content_description="No image provided", detected_colors=[], structural_flaws=[])
        
    # OpenRouter fully supports the OpenAI Client library paradigm!
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
    )
    
    prompt = """
    You are the Perception Layer of an AI Agent.
    Your job is to act as the 'eyes'. Look at the provided image and extract pure, objective facts.
    Respond ONLY with a valid JSON matching this schema:
    {
        "raw_content_description": "Objective description of what is visible",
        "detected_colors": ["color1", "color2"],
        "structural_flaws": ["any obvious issues with proportion, lines, etc"]
    }
    
    Return the raw JSON string without any ```json block wrapping.
    """
    
    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        data = json.loads(text)
        return PerceptionOutput(**data)
    except Exception as e:
        print(f"Perception error: {e}")
        return PerceptionOutput(raw_content_description="Error analyzing image", detected_colors=[], structural_flaws=[])
