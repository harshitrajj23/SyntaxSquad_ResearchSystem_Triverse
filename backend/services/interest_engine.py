import json
from utils.logger import logger
from services.db_service import get_user_profile, update_user_interests

class InterestEngine:
    TOPIC_KEYWORDS = {
        "coding": ["python", "code", "api", "javascript", "js", "react", "backend", "frontend", "async", "function", "database", "server", "rest", "graphql"],
        "sports": ["cricket", "football", "sports", "ipl", "batsman", "bowler", "match"],
        "machine_learning": ["ml", "ai", "model", "neural", "training", "dataset", "regression", "classification"],
    }

    # Signals that imply a technical context (fallback to coding)
    TECHNICAL_SIGNALS = [
        "debug", "error", "build", "deploy", "git", "repo", "terminal", "log", 
        "syntax", "array", "object", "variable", "null", "undefined", "stack", 
        "overflow", "loop", "exception", "compiling", "runtime", "package", "library"
    ]

    DOMINANT_INTEREST_MAPPING = {
        "coding": "software development and programming",
        "sports": "sports and athletic activities",
        "machine_learning": "artificial intelligence and data science",
        "web_dev": "web development and design",
        "general": "a wide range of general topics"
    }

    def detect_topic(self, query: str) -> str:
        """Enhanced topic detection with keyword matching and smart fallback."""
        if not query:
            return "general"
        
        # Normalize query: lower case and pad with spaces for better matching
        query_clean = f" {query.lower().strip()} "
        # Remove common punctuation for cleaner matching
        for char in ".,!?;:()[]{}":
            query_clean = query_clean.replace(char, " ")
        
        # 1. Primary Check: Exact Topic Keywords
        for topic, keywords in self.TOPIC_KEYWORDS.items():
            for keyword in keywords:
                if f" {keyword} " in query_clean:
                    return topic
        
        # 2. Smart Fallback: Technical signals -> Coding
        for signal in self.TECHNICAL_SIGNALS:
            if f" {signal} " in query_clean:
                return "coding"
        
        # 3. Default: Only if no strong signal found
        return "general"

    def update_interests(self, user_id: str, query: str):
        """Detects topic, updates user interests JSONB in DB, and returns top interests."""
        try:
            # 1. Detect topic
            topic = self.detect_topic(query)
            
            # 2. Fetch existing profile
            profile = get_user_profile(user_id)
            interests = {}
            
            if profile and profile.get("interests"):
                interests = profile["interests"]
            
            # 3. Update JSON: Increment score or add new topic
            interests[topic] = interests.get(topic, 0) + 1
            
            # 4. Save back to DB
            update_user_interests(user_id, interests)
            
            # 5. Sort by value descending and pick top 3
            sorted_interests = sorted(interests.items(), key=lambda x: x[1], reverse=True)
            top_interests_dict = dict(sorted_interests[:3])
            
            # 6. Determine dominant interest
            dominant_topic = sorted_interests[0][0] if sorted_interests else "general"
            dominant_interest = self.DOMINANT_INTEREST_MAPPING.get(dominant_topic, "curious explorer")
            
            # 7. Logging
            logger.info(f"--- LONG-TERM MEMORY UPDATED FOR {user_id} ---")
            logger.info(f"Detected Topic: {topic}")
            logger.info(f"Updated Interests: {json.dumps(interests)}")
            logger.info(f"Top 3: {json.dumps(top_interests_dict)}")
            logger.info(f"Dominant Interest: {dominant_interest}")
            logger.info(f"---------------------------------------------")
            
            return {
                "topic": topic,
                "interests": top_interests_dict,
                "dominant_interest": dominant_interest
            }
            
        except Exception as e:
            logger.error(f"Error in InterestEngine: {str(e)}")
            return None

interest_engine = InterestEngine()
