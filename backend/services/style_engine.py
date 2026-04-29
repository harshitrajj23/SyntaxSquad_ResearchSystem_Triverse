from typing import Dict, Any, Union, List

def get_style_config(preferences: Union[Dict[str, Any], List[str]], level: str) -> Dict[str, Any]:
    """
    Returns strict configuration for both prompt engineering and output enforcement.
    Now handles both the legacy list format and the new RL-powered preference object.
    """
    # Extract dominant preference
    dominant = "explanation" # Default
    
    if isinstance(preferences, dict) and "dominant" in preferences:
        dominant = preferences["dominant"]
    elif isinstance(preferences, list) and len(preferences) > 0:
        # Legacy support: just take the first preference
        dominant = preferences[0]
    
    # Map dominant preference to config
    if dominant == "code":
        return {
            "type": "code-heavy",
            "require_code_first": True,
            "max_lines": 12,
            "simple_language": True if level == "beginner" else False
        }

    if dominant == "short":
        return {
            "type": "short",
            "require_code_first": False,
            "max_lines": 5
        }

    return {
        "type": "explanation",
        "require_code_first": False
    }

def get_response_style(preferences: Union[Dict[str, Any], List[str]], level: str) -> str:
    config = get_style_config(preferences, level)
    return config["type"]
