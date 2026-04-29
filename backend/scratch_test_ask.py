from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_ask():
    response = client.post("/ask", json={
        "query": "transformers architecture",
        "user_id": "test_user_123",
        "user_profile": {
            "preferences": {"dominant": "code", "weights": {}},
            "level": "beginner"
        }
    })
    print(response.status_code)
    data = response.json()
    print("Keys:", data.keys())
    if "papers" in data:
        print("Papers:", len(data["papers"]))
        for p in data["papers"]:
            print(p.get("title"))

if __name__ == "__main__":
    test_ask()
