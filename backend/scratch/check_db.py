import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

try:
    response = supabase.table("interactions").select("*").limit(1).execute()
    print("Interactions sample:", response.data)
    
    response = supabase.table("chats").select("*").limit(1).execute()
    print("Chats sample:", response.data)
except Exception as e:
    print("Error:", e)
