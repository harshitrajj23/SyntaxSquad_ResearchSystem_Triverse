import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Try to query the table. If it errors, it might not exist.
try:
    res = supabase.table("research_papers").select("id").limit(1).execute()
    print("Table already exists")
except Exception as e:
    print(f"Table query error: {e}")
