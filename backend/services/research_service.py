import requests
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from models.request_models import ResearchPaper
from services.db_service import supabase
from utils.logger import logger
from datetime import datetime
import xml.etree.ElementTree as ET

# Initialize the embedding model globally so it's loaded once
try:
    embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
except Exception as e:
    logger.error(f"Failed to load sentence-transformers model: {e}")
    embedding_model = None

class ResearchService:
    def __init__(self):
        self.api_url = "https://api.semanticscholar.org/graph/v1/paper/search"
    
    def fetch_research_papers(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch papers from Semantic Scholar, fallback to arXiv on failure."""
        params = {
            "query": query,
            "limit": limit,
            "fields": "title,abstract,url,authors,year,citationCount"
        }
        try:
            response = requests.get(self.api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            papers = data.get("data", [])
            if papers:
                return papers
        except Exception as e:
            logger.warning(f"Semantic Scholar failed for query '{query}': {e}. Falling back to arXiv.")
            
        # Fallback to arXiv
        return self._fetch_arxiv_fallback(query, limit)

    def _fetch_arxiv_fallback(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback to arXiv API."""
        arxiv_url = "http://export.arxiv.org/api/query"
        # simple clean of query
        safe_query = query.replace(" ", "+")
        params = {
            "search_query": f"all:{safe_query}",
            "start": 0,
            "max_results": limit
        }
        try:
            response = requests.get(arxiv_url, params=params, timeout=10)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            papers = []
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            for entry in root.findall('atom:entry', ns):
                title = entry.find('atom:title', ns)
                abstract = entry.find('atom:summary', ns)
                published = entry.find('atom:published', ns)
                id_url = entry.find('atom:id', ns)
                
                authors = []
                for author in entry.findall('atom:author', ns):
                    name = author.find('atom:name', ns)
                    if name is not None:
                        authors.append({"name": name.text})
                
                year = datetime.now().year
                if published is not None and published.text:
                    try:
                        year = int(published.text[:4])
                    except:
                        pass
                
                papers.append({
                    "title": title.text.replace('\n', ' ').strip() if title is not None else "Unknown Title",
                    "abstract": abstract.text.replace('\n', ' ').strip() if abstract is not None else "",
                    "url": id_url.text if id_url is not None else "",
                    "authors": authors,
                    "year": year,
                    "citationCount": 0 # arXiv doesn't provide this directly
                })
            return papers
        except Exception as e:
            logger.error(f"arXiv fallback failed: {e}")
            return []

    def generate_embedding(self, text: str) -> List[float]:
        """Convert text to vector."""
        if embedding_model is None:
            return []
        if not text:
            return []
        try:
            embedding = embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return []

    def compute_similarity(self, query_emb: List[float], paper_emb: List[float]) -> float:
        """Compute cosine similarity between two embeddings."""
        if not query_emb or not paper_emb:
            return 0.0
        try:
            return float(cosine_similarity([query_emb], [paper_emb])[0][0])
        except Exception as e:
            logger.error(f"Failed to compute similarity: {e}")
            return 0.0

    def calculate_rating(self, citation_count: int, year: int, similarity: float) -> float:
        """
        Calculate rating (0-5) based on:
        - citation_count -> 50%
        - recency -> 30%
        - similarity -> 20%
        """
        # Normalize citation_count (assume 1000 is max for normalization)
        cit_score = min(citation_count / 1000.0, 1.0)
        
        # Normalize recency (last 10 years)
        current_year = datetime.now().year
        year_diff = max(0, current_year - (year or current_year))
        recency_score = max(0.0, 1.0 - (year_diff / 10.0))
        
        # Normalize similarity (already 0-1 if cosine similarity is positive, bounded to 0-1)
        sim_score = max(0.0, min(similarity, 1.0))
        
        # Weighted formula
        raw_score = (cit_score * 0.5) + (recency_score * 0.3) + (sim_score * 0.2)
        
        # Convert to 0-5
        return round(raw_score * 5.0, 2)

    def generate_citation(self, paper: Dict[str, Any]) -> str:
        """Format: Authors. Title. Source. Year."""
        authors_list = paper.get("authors", [])
        if authors_list:
            author_names = [a.get("name", "") for a in authors_list[:3]]
            authors_str = ", ".join(author_names)
            if len(authors_list) > 3:
                authors_str += " et al."
        else:
            authors_str = "Unknown Authors"
            
        title = paper.get("title", "Unknown Title")
        year = paper.get("year", "n.d.")
        
        return f"{authors_str}. {title}. Semantic Scholar. {year}."

    def store_paper_in_supabase(self, paper_data: Dict[str, Any]):
        """Store paper in supabase if it doesn't exist by title."""
        title = paper_data.get("title")
        if not title:
            return
            
        try:
            # Check if exists
            existing = supabase.table("research_papers").select("id").eq("title", title).limit(1).execute()
            if existing.data:
                # Already exists, skip insertion
                return
            
            # Insert
            supabase.table("research_papers").insert(paper_data).execute()
        except Exception as e:
            logger.error(f"Failed to store paper in supabase: {e}")

    def get_relevant_papers(self, query: str) -> List[ResearchPaper]:
        """Main orchestrator function."""
        raw_papers = self.fetch_research_papers(query)
        if not raw_papers:
            return []
            
        query_emb = self.generate_embedding(query)
        
        processed_papers = []
        for p in raw_papers:
            # We need an abstract for meaningful embedding and display
            abstract = p.get("abstract")
            if not abstract:
                continue
                
            paper_emb = self.generate_embedding(abstract)
            similarity = self.compute_similarity(query_emb, paper_emb)
            
            citation_count = p.get("citationCount", 0)
            year = p.get("year", datetime.now().year)
            
            rating = self.calculate_rating(citation_count, year, similarity)
            citation = self.generate_citation(p)
            
            # Build database object
            db_paper = {
                "title": p.get("title", ""),
                "abstract": abstract,
                "embedding": paper_emb,
                "rating": rating,
                "citation": citation,
                "url": p.get("url", "")
            }
            
            # Store asynchronously or synchronously
            self.store_paper_in_supabase(db_paper)
            
            # Add to results
            authors_list = p.get("authors", [])
            authors_str = ", ".join([a.get("name", "") for a in authors_list]) if authors_list else "Unknown"
            
            processed_papers.append({
                "title": p.get("title", ""),
                "abstract": abstract,
                "url": p.get("url", ""),
                "authors": authors_str,
                "year": year if year else 0,
                "source": "Semantic Scholar",
                "score": rating, # Keep score for sorting
                "rating": rating,
                "citation": citation
            })
            
        # Sort by score descending
        processed_papers.sort(key=lambda x: x["score"], reverse=True)
        
        # Return top 3-5 as ResearchPaper models
        top_papers = []
        for p in processed_papers[:5]:
            try:
                # Ensure we have the required fields for the new model
                if not p.get("citation") or p.get("rating") is None:
                    continue
                    
                top_papers.append(ResearchPaper(
                    title=p["title"],
                    url=p["url"],
                    citation=p["citation"],
                    rating=float(p["rating"]),
                    abstract=p.get("abstract"),
                    authors=p.get("authors"),
                    year=p.get("year"),
                    source=p.get("source")
                ))
            except Exception as e:
                logger.error(f"Error mapping to ResearchPaper model: {e}")
                
        return top_papers

research_service = ResearchService()
