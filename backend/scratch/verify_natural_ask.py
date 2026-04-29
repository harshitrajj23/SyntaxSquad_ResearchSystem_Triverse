import requests
import json

def test_ask_interests():
    url = "http://localhost:8001/ask"
    payload = {
        "user_id": "test_user_natural",
        "query": "What are my interests?",
        "user_profile": {
            "level": "expert",
            "preferences": {"weights": {"code": 5}}
        }
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print("\n--- AI RESPONSE ---")
        print(data["answer"])
        print("-------------------\n")
        
        answer = data["answer"].lower()
        # Check for natural wording and lack of leakage
        if "score" in answer or "dominant" in answer or "weight" in answer:
            print("FAILURE: Technical leakage detected in response!")
        else:
            print("SUCCESS: Response seems natural and clean of technical terms.")
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Note: This requires the server to be running.
    # If the server isn't running, we might need to start it or just rely on the prompt test.
    test_ask_interests()
