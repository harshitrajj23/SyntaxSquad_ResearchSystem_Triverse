import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(url, key)

def create_chat(user_id: str, title: str):
    """Creates a new chat session."""
    data = {"user_id": user_id, "title": title}
    response = supabase.table("chats").insert(data).execute()
    return response.data[0]

def save_message(chat_id: str, role: str, content: str):
    """Saves a message to a specific chat."""
    data = {"chat_id": chat_id, "role": role, "content": content}
    response = supabase.table("messages").insert(data).execute()
    return response.data[0]

def get_user_chats(user_id: str):
    """Fetches all chats for a user."""
    response = supabase.table("chats")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return response.data

def get_chat_messages(chat_id: str):
    """Fetches all messages for a chat."""
    response = supabase.table("messages")\
        .select("*")\
        .eq("chat_id", chat_id)\
        .order("created_at", desc=False)\
        .execute()
    return response.data

def get_user_profile(user_id: str):
    """Fetches user profile (including interests) from Supabase."""
    response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
    if response.data:
        return response.data[0]
    return None

def update_user_interests(user_id: str, interests: dict):
    """Upserts user interests in Supabase."""
    data = {
        "user_id": user_id,
        "interests": interests
    }
    # Using upsert to handle both creation and update
    response = supabase.table("user_profiles").upsert(data, on_conflict="user_id").execute()
    return response.data[0]

def get_chat_sessions_with_previews(user_id: str):
    """Fetches all chat sessions for a user with the latest message as a preview."""
    # 1. Fetch all chats for the user
    chats_response = supabase.table("chats")\
        .select("id, created_at, title")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    
    chats = chats_response.data
    sessions = []
    
    for chat in chats:
        chat_id = chat["id"]
        # 2. Fetch the latest message for this chat
        msg_response = supabase.table("messages")\
            .select("content")\
            .eq("chat_id", chat_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        preview = "No messages yet"
        if msg_response.data:
            preview = msg_response.data[0]["content"]
            # Truncate preview if too long
            if len(preview) > 100:
                preview = preview[:97] + "..."
        
        sessions.append({
            "id": chat_id,
            "created_at": chat["created_at"],
            "preview": preview,
            "title": chat.get("title", "Untitled Chat")
        })
    
    return sessions

def get_interaction_history(user_id: str):
    """Fetches interaction history for a user from the interactions table."""
    try:
        # Try to select everything including chat_id
        response = supabase.table("interactions")\
            .select("id, chat_id, query, response_type, created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return response.data
    except Exception as e:
        # Fallback if chat_id column doesn't exist yet
        if "chat_id" in str(e):
            response = supabase.table("interactions")\
                .select("id, query, response_type, created_at")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
            return response.data
        raise e
