from services.research_service import research_service
import json

def test():
    papers = research_service.get_relevant_papers("attention is all you need transformers")
    for p in papers:
        print(f"[{p.score if hasattr(p, 'score') else 'N/A'}] {p.title} - {p.authors}")
        print(f"Citation: {research_service.generate_citation(p.model_dump())}")
        print("-" * 50)

if __name__ == "__main__":
    test()
