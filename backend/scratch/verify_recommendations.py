import asyncio
import httpx
import json

async def test_recommendations():
    base_url = "http://localhost:8000"
    
    queries = [
        "cricket",         # Should trigger Level 2 (Keyword)
        "python",          # Should trigger Level 2 (Keyword)
        "Explain machine learning?", # Should trigger Level 1 (DB) since it was in our previous check
        "quantum physics", # Should trigger Level 1 (DB) as it matches 'quantum'
        "Ancient Rome"     # Should trigger Level 3 (LLM)
    ]
    
    async with httpx.AsyncClient() as client:
        for q in queries:
            print(f"\nTesting recommendations for: {q}")
            try:
                response = await client.get(f"{base_url}/recommendations?q={q}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"Result: {json.dumps(data, indent=2)}")
                else:
                    print(f"Error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    # Note: This assumes the server is running. 
    # If not running, we could test the engine directly.
    from services.recommendation_engine import recommendation_engine
    
    async def test_engine_directly():
        queries = ["cricket", "python", "Explain machine learning", "quantum physics", "Ancient Rome"]
        for q in queries:
            print(f"\nTesting ENGINE for: {q}")
            res = await recommendation_engine.get_recommendations(q)
            print(f"Result: {res}")

    asyncio.run(test_engine_directly())
