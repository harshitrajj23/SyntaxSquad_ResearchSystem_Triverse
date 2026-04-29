import random
from typing import List
from services.db_service import supabase
from services.llm_service import LLMService
from utils.logger import logger

class RecommendationEngine:
    def __init__(self):
        self.llm_service = LLMService()
        self.keyword_mapping = {
            "cricket": ["Virat Kohli", "Rohit Sharma", "MS Dhoni", "IPL 2024", "Cricket World Cup"],
            "python": ["Django", "Flask", "FastAPI", "Pandas", "NumPy", "Asyncio"],
            "machine learning": ["Neural Networks", "Scikit-Learn", "TensorFlow", "PyTorch", "LLMs"],
            "web development": ["React", "Next.js", "Tailwind CSS", "Node.js", "TypeScript"],
            "ai": ["OpenAI", "Mistral AI", "Prompt Engineering", "RAG", "Stable Diffusion"]
        }

    async def get_recommendations(self, query: str) -> List[str]:
        """
        Main entry point for recommendations with 3-level logic.
        """
        if not query:
            return []

        logger.info(f"Generating recommendations for: {query}")

        # Level 1: Database Logic
        recommendations = self._get_db_recommendations(query)
        if recommendations:
            logger.info(f"Level 1 (DB) found {len(recommendations)} recommendations")
            return recommendations

        # Level 2: Keyword Mapping
        recommendations = self._get_keyword_recommendations(query)
        if recommendations:
            logger.info(f"Level 2 (Keyword) found {len(recommendations)} recommendations")
            return recommendations

        # Level 3: LLM Fallback
        logger.info("Falling back to Level 3 (LLM) for recommendations")
        return await self._get_llm_recommendations(query)

    def _get_db_recommendations(self, query: str) -> List[str]:
        """
        Level 1: Search past queries in database for similar terms.
        """
        try:
            # Simple ilike search for related queries
            # We look for queries that contain any word from the current query
            words = [w for w in query.lower().split() if len(w) > 3]
            if not words:
                words = [query.lower()]

            # Try matching any of the words
            # In a real app, we might use full-text search or vector search
            # For now, let's try a simple search on the first word or the whole query
            search_term = f"%{words[0]}%"
            
            response = supabase.table("interactions")\
                .select("query")\
                .ilike("query", search_term)\
                .limit(20)\
                .execute()
            
            if not response.data:
                return []

            # Extract unique queries, excluding the current one
            past_queries = [item["query"] for item in response.data if item["query"].lower() != query.lower()]
            
            # Count frequencies and return top 3-5 unique ones
            from collections import Counter
            counts = Counter(past_queries)
            
            # Return most common 3 related queries
            related = [q for q, count in counts.most_common(5)]
            return related[:5]

        except Exception as e:
            logger.error(f"Error in Level 1 recommendations: {str(e)}")
            return []

    def _get_keyword_recommendations(self, query: str) -> List[str]:
        """
        Level 2: Simple keyword mapping fallback.
        """
        query_lower = query.lower()
        for key, suggestions in self.keyword_mapping.items():
            if key in query_lower:
                # Return a shuffled subset of 3-5
                sample_size = min(len(suggestions), 5)
                return random.sample(suggestions, sample_size)
        return []

    async def _get_llm_recommendations(self, query: str) -> List[str]:
        """
        Level 3: LLM fallback for related topics.
        """
        prompt = f"Give 5 related topics for: {query}. Return a clean list of strings only, one per line. No numbering, no introduction, just the topics."
        try:
            response = self.llm_service.generate_response(
                system_prompt="You are a recommendation engine. Your task is to provide 5 related search terms or topics for any given query. Return ONLY the topics, one per line.",
                user_query=query
            )
            # Clean and parse the response
            lines = [line.strip("- ").strip("12345. ").strip() for line in response.split("\n") if line.strip()]
            return lines[:5]
        except Exception as e:
            logger.error(f"Error in Level 3 recommendations: {str(e)}")
            return ["Machine Learning", "Artificial Intelligence", "Data Science", "Python Programming", "Deep Learning"]

recommendation_engine = RecommendationEngine()
