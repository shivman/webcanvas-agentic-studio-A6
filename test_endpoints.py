import requests

def test_api(task_type, img=None):
    print(f"--- TESTING '{task_type}' ENDPOINT ---")
    payload = {
        "task_type": task_type,
        "image_base64": img,
        "preferences": {
            "art_style": "Surrealism",
            "favorite_topics": "Dreams, Space",
            "skill_level": "intermediate"
        }
    }
    
    try:
        req = requests.post("http://localhost:8000/api/agent", json=payload, timeout=60)
        req.raise_for_status()
        print("SUCCESS! Output:")
        print(req.json())
        print()
    except Exception as e:
        print(f"FAILED {task_type}! Error:")
        print(e)
        if 'req' in locals() and hasattr(req, "text"):
            print(req.text)
        print()

if __name__ == "__main__":
    # Test Cerebras text-only
    test_api("prompt", img=None)
    
    # Test OpenRouter vision (using a tiny 1x1 black png pixel)
    px = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    test_api("analyze", img=px)
    test_api("suggest", img=px)
