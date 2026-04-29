from utils.logger import logger
from models.request_models import FeedbackRequest
from typing import Dict, Any, List, Optional
from services.db_service import supabase

class BehaviorEngine:
    def process_feedback(self, feedback: FeedbackRequest) -> Dict[str, Any]:
        """
        Feedback is stored directly in Supabase by the API handler.
        This method returns current scores and weights by fetching from DB.
        """
        logger.info(f"--- REINFORCEMENT LEARNING: FEEDBACK RECEIVED ---")
        logger.info(f"User: {feedback.user_id} | Type: {feedback.type} | Liked: {feedback.liked}")
        
        return self.get_full_preferences(feedback.user_id)

    def get_user_scores(self, user_id: str) -> Optional[Dict[str, int]]:
        """
        Fetches interaction history from Supabase and computes current raw scores.
        If liked: +1, If disliked: -1.
        Returns None if no interactions exist.
        """
        try:
            data = supabase.table("interactions").select("*").eq("user_id", user_id).execute()
            records = data.data

            if not records:
                return None

            scores = {
                "code": 0,
                "short": 0,
                "explanation": 0
            }

            for row in records:
                # Map response_type to internal keys
                resp_type = row["response_type"]
                if resp_type == "code-heavy" or resp_type == "code":
                    key = "code"
                elif resp_type == "short":
                    key = "short"
                else:
                    key = "explanation"

                if row["liked"] is True:
                    scores[key] += 1
                elif row["liked"] is False:
                    scores[key] -= 1
            
            return scores
        except Exception as e:
            logger.error(f"Error fetching scores from Supabase: {str(e)}")
            return None

    def normalize_scores(self, scores: Dict[str, int]) -> Dict[str, int]:
        """
        Normalizes scores (currently just returns them as weights as per requirement).
        Can be upgraded to softmax or other weighting schemes in the future.
        """
        # For now, weights = raw scores as per user example
        return scores

    def get_full_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Derives the final preference object: { "dominant": "...", "weights": {...} }
        Returns None if no history exists.
        """
        scores = self.get_user_scores(user_id)
        if scores is None:
            return None

        weights = self.normalize_scores(scores)
        
        # Determine dominant (highest score)
        dominant = max(scores, key=scores.get)
        
        # Fallback to explanation if scores are tied at 0
        if all(s == 0 for s in scores.values()):
            dominant = "explanation"

        preference_obj = {
            "dominant": dominant,
            "weights": weights
        }

        # Detailed Logging as requested
        logger.info(f"--- REINFORCEMENT LEARNING LOG FOR {user_id} ---")
        logger.info(f"Computed Scores: {scores}")
        logger.info(f"Final Weights:   {weights}")
        logger.info(f"Dominant Style:  {dominant}")
        logger.info(f"-----------------------------------------------")
        
        return preference_obj

    def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Legacy method name, now returns the full preference object.
        """
        return self.get_full_preferences(user_id)

behavior_engine = BehaviorEngine()
