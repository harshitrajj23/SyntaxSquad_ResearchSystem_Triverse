from utils.logger import logger
from typing import Optional, List, Dict

class IntentEngine:
    def __init__(self):
        self.mode_keywords = {
            "learning": ["explain", "what is", "simple", "basics"],
            "building": ["build", "create", "implement", "project", "code"],
            "exploring": ["compare", "trends", "related", "explore", "roadmap"],
            "academic": ["research", "paper", "study", "theory", "analysis"]
        }

    def detect_mode(self, query: str) -> str:
        """
        Detects the user's intent mode based on keywords in the query.
        Returns one of: learning, building, exploring, academic.
        Default: learning
        """
        if not query:
            return "learning"
            
        query_lower = query.lower()
        
        # Check each mode's keywords
        # We check in order of priority if multiple match, or just return the first hit
        # Building and Academic might be more specific than Learning
        
        # Priority check: building, academic, exploring, learning
        for mode in ["building", "academic", "exploring", "learning"]:
            keywords = self.mode_keywords[mode]
            if any(kw in query_lower for kw in keywords):
                logger.info(f"Detected intent mode: {mode} (query: '{query[:50]}...')")
                return mode
                
        # Default fallback
        logger.info(f"Using default intent mode: learning")
        return "learning"

intent_engine = IntentEngine()
