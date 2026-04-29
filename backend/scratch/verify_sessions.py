import os
from services.db_service import get_chat_sessions_with_previews
from dotenv import load_dotenv

load_dotenv()

def test_session_history():
    user_id = "test_user"
    print(f"Fetching chat sessions for {user_id}...")
    sessions = get_chat_sessions_with_previews(user_id)
    
    print(f"Retrieved {len(sessions)} sessions.")
    
    if sessions:
        first = sessions[0]
        print("First session record:")
        print(f"  id: {first.get('id')}")
        print(f"  preview: {first.get('preview')}")
        print(f"  created_at: {first.get('created_at')}")
        
        if first.get('id') is None:
            print("FAILURE: 'id' is None")
        elif first.get('preview') is None:
            print("FAILURE: 'preview' is None")
        else:
            print("SUCCESS: Session data is correct")
    else:
        print("No sessions found to test.")

if __name__ == "__main__":
    test_session_history()
