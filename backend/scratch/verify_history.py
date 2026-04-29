import os
from services.db_service import get_interaction_history
from dotenv import load_dotenv

load_dotenv()

def test_history_mapping():
    user_id = "test_user"
    print(f"Fetching history for {user_id}...")
    history = get_interaction_history(user_id)
    
    print(f"Retrieved {len(history)} records.")
    
    # Simulate the mapping logic from app.py
    formatted_history = []
    for chat in history:
        formatted_history.append({
            "id": chat.get("chat_id") or chat.get("id"),
            "chat_id": chat.get("chat_id") or chat.get("id"),
            "query": chat.get("query"),
            "response_type": chat.get("response_type"),
            "created_at": chat.get("created_at")
        })
    
    if formatted_history:
        first = formatted_history[0]
        print("First record mapping:")
        print(f"  id: {first.get('id')}")
        print(f"  chat_id: {first.get('chat_id')}")
        print(f"  query: {first.get('query')}")
        
        if first.get('id') is None:
            print("FAILURE: 'id' is None")
        else:
            print("SUCCESS: 'id' is present")
    else:
        print("No history records found to test.")

if __name__ == "__main__":
    test_history_mapping()
