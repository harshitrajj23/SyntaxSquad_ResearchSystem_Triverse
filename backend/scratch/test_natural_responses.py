import sys
import os
from unittest.mock import MagicMock

# Add current directory to path
sys.path.append(os.getcwd())

from services.llm_service import LLMService
from models.request_models import UserProfile

def test_prompt_construction():
    print("Testing prompt construction...")
    llm = LLMService()
    
    profile = UserProfile(
        level="expert",
        preferences={"weights": {"code": 5, "short": -2}}
    )
    
    user_interests = {"coding": 5, "sports": 2}
    dominant_interest = "software development and programming"
    
    style_config = {"type": "explanation"}
    
    prompt, active_style = llm._generate_dynamic_system_prompt(
        profile,
        style_config,
        user_interests=user_interests,
        dominant_interest=dominant_interest
    )
    
    print("\n--- GENERATED PROMPT ---")
    print(prompt)
    print("------------------------\n")
    
    # Assertions
    assert "INTERNAL SYSTEM PROFILE" in prompt
    assert "CORE DIRECTIVES" in prompt
    assert "software development and programming" in prompt
    assert "coding, sports" in prompt
    
    # Negative assertions (internal leaks)
    assert "Interest scores:" not in prompt
    assert "Dominant interest:" not in prompt
    assert "tech user" not in prompt
    
    print("Prompt construction test PASSED!")

if __name__ == "__main__":
    test_prompt_construction()
