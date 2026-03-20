"""
Web Researcher
==============
Uses OpenAI's built-in web search (Responses API) to research topics online.
No extra API keys needed — uses the same OPENAI_API_KEY.

Usage:
  from web_researcher import research_web
  result = research_web("What are typical WECI terms for North Sea wind farms?")
"""

import os
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent.parent / ".env")

RESEARCH_MODEL = "gpt-5-mini"


def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


def research_web(
    question: str,
    topic_context: str | None = None,
    language: str = "auto",
    country: str = "DE",
) -> dict:
    """Research a question using OpenAI web search.

    Args:
        question: The research question
        topic_context: Optional topic context for better search
        language: "en", "de", or "auto" (detect from question)
        country: Country for location-aware search (default DE)

    Returns:
        {
            "report": str,           # The research findings
            "sources": [{            # Web sources
                "title": str,
                "url": str,
            }],
            "search_time": float,    # Seconds taken
        }
    """
    client = get_client()

    # Build the research prompt
    context_block = ""
    if topic_context:
        context_block = f"\n\nResearch context: {topic_context[:500]}"

    prompt = f"""Research the following question thoroughly using web search. Find information from multiple sources and provide a comprehensive answer with specific details, data, and examples where available.

Question: {question}{context_block}

Provide a well-structured answer with:
- Key findings organized under clear headings
- Specific data, numbers, and facts where available
- References to the sources you found
- Note if information is limited or conflicting across sources"""

    # Configure web search tool
    tools = [{
        "type": "web_search_preview",
        "user_location": {
            "type": "approximate",
            "country": country,
        },
    }]

    start_time = time.time()

    response = client.responses.create(
        model=RESEARCH_MODEL,
        tools=tools,
        input=prompt,
    )

    search_time = time.time() - start_time

    # Extract the answer text
    report = response.output_text or ""

    # Extract source URLs from annotations
    sources = []
    seen_urls = set()

    if hasattr(response, 'output') and response.output:
        for block in response.output:
            if hasattr(block, 'content') and block.content:
                for content_item in block.content:
                    if hasattr(content_item, 'annotations') and content_item.annotations:
                        for annotation in content_item.annotations:
                            if hasattr(annotation, 'url') and annotation.url:
                                url = annotation.url
                                if url not in seen_urls:
                                    seen_urls.add(url)
                                    title = getattr(annotation, 'title', '') or url
                                    sources.append({
                                        "title": title,
                                        "url": url,
                                    })

    return {
        "report": report,
        "sources": sources,
        "search_time": round(search_time, 1),
    }


if __name__ == "__main__":
    import sys

    question = sys.argv[1] if len(sys.argv) > 1 else "What are typical OAR insurance terms for offshore wind farms in the North Sea?"

    print(f"Researching: {question}\n")
    result = research_web(question)

    print(f"Report ({result['search_time']}s):")
    print(result["report"])
    print(f"\nSources ({len(result['sources'])}):")
    for s in result["sources"]:
        print(f"  - {s['title']}: {s['url']}")
