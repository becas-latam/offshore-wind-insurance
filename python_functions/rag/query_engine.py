"""
RAG Query Engine
================
Retrieves relevant chunks from Qdrant and generates expert answers using an LLM.

Usage:
  python query_engine.py "What are the typical CAR deductible structures?"
  python query_engine.py --wind-farm "Baltic 1" "What claims occurred?"
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent.parent / ".env")

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "prompts"))

from vector_store import get_client, search
from embedder import embed_texts, get_openai_client
from expert_persona import EXPERT_SYSTEM_PROMPT

ANSWER_MODEL = "gpt-4o"  # Can be swapped to Claude


def retrieve(
    question: str,
    top_k: int = 8,
    wind_farms: list[str] | None = None,
    insurance_lines: list[str] | None = None,
    project_phase: str | None = None,
    language: str | None = None,
) -> list[dict]:
    """Retrieve relevant chunks for a question."""
    openai_client = get_openai_client()
    qdrant_client = get_client()

    # Embed the question
    query_vector = embed_texts([question], openai_client)[0]

    # Search Qdrant
    results = search(
        query_vector=query_vector,
        limit=top_k,
        wind_farms=wind_farms,
        insurance_lines=insurance_lines,
        project_phase=project_phase,
        language=language,
        client=qdrant_client,
    )

    return results


def format_context(results: list[dict]) -> str:
    """Format retrieved chunks into context for the LLM."""
    context_parts = []
    for i, r in enumerate(results, 1):
        source = Path(r["source_file"]).stem
        wind_farms = ", ".join(r.get("wind_farms", [])) or "Unknown"
        date = r.get("date", "Unknown")
        speakers = ", ".join(r.get("speakers", [])) or "Unknown"

        header = f"[Source {i}] File: {source} | Wind Farm: {wind_farms} | Date: {date} | Speakers: {speakers}"
        context_parts.append(f"{header}\n{r['text']}")

    return "\n\n---\n\n".join(context_parts)


def ask(
    question: str,
    top_k: int = 8,
    wind_farms: list[str] | None = None,
    insurance_lines: list[str] | None = None,
    project_phase: str | None = None,
    language: str | None = None,
    model: str = ANSWER_MODEL,
) -> dict:
    """Ask a question and get an expert answer backed by sources."""
    # Retrieve
    results = retrieve(
        question=question,
        top_k=top_k,
        wind_farms=wind_farms,
        insurance_lines=insurance_lines,
        project_phase=project_phase,
        language=language,
    )

    if not results:
        return {
            "answer": "No relevant information found in the knowledge base for this question.",
            "sources": [],
        }

    # Build context
    context = format_context(results)

    # Generate answer
    openai_client = get_openai_client()

    user_prompt = f"""Based on the following source material from offshore wind insurance expert conversations, answer this question:

**Question:** {question}

---

{context}

---

Provide a thorough, expert-level answer based on the sources above. Cite specific sources using [Source N] references."""

    response = openai_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": EXPERT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    answer = response.choices[0].message.content

    # Return answer with source metadata
    sources = [
        {
            "file": Path(r["source_file"]).stem,
            "wind_farms": r.get("wind_farms", []),
            "date": r.get("date"),
            "score": round(r.get("score", 0), 3),
        }
        for r in results
    ]

    return {
        "answer": answer,
        "sources": sources,
        "model": model,
        "chunks_retrieved": len(results),
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Query the offshore wind insurance knowledge base")
    parser.add_argument("question", type=str, help="Question to ask")
    parser.add_argument("--wind-farm", type=str, nargs="+", help="Filter by wind farm")
    parser.add_argument("--insurance-line", type=str, nargs="+", help="Filter by insurance line")
    parser.add_argument("--phase", type=str, help="Filter by project phase")
    parser.add_argument("--top-k", type=int, default=8, help="Number of chunks to retrieve")
    parser.add_argument("--model", type=str, default=ANSWER_MODEL, help="LLM model to use")
    args = parser.parse_args()

    result = ask(
        question=args.question,
        top_k=args.top_k,
        wind_farms=args.wind_farm,
        insurance_lines=args.insurance_line,
        project_phase=args.phase,
        model=args.model,
    )

    print(f"\n{'='*80}")
    print(f"Question: {args.question}")
    print(f"{'='*80}")
    print(f"\n{result['answer']}")
    print(f"\n{'='*80}")
    print(f"Sources ({result['chunks_retrieved']} chunks):")
    for s in result["sources"]:
        print(f"  - {s['file']} | {', '.join(s['wind_farms'])} | {s['date']} | score: {s['score']}")
