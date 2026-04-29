from services.interest_engine import InterestEngine

def test_classification():
    engine = InterestEngine()
    
    test_cases = [
        ("How to use async/await in JS", "coding"),
        ("Who won the IPL match yesterday?", "sports"),
        ("Explain neural networks and regression", "machine_learning"),
        ("What is the weather like in New York?", "general"),
        ("I have a null pointer exception in my code", "coding"),  # Technical signal fallback
        ("How to build and deploy a react app?", "coding"),
        ("The batsman hit a six", "sports"),
        ("dataset training for ai models", "machine_learning"),
        ("just saying hello", "general"),
        ("debugging a runtime error", "coding"), # Technical signal
        ("git commit -m 'fixed bug'", "coding")  # Technical signal
    ]
    
    print("\n--- TOPIC CLASSIFICATION TEST ---")
    passed = 0
    for query, expected in test_cases:
        actual = engine.detect_topic(query)
        status = "✅" if actual == expected else "❌"
        if actual == expected:
            passed += 1
        print(f"{status} Query: '{query}'")
        print(f"   Expected: {expected}, Actual: {actual}")
    
    print(f"\nResult: {passed}/{len(test_cases)} passed")

if __name__ == "__main__":
    test_classification()
