"""
Local API Server
================
Flask API that serves the RAG query engine to the React frontend.

Run: python api.py
Serves on: http://localhost:5050
"""

import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent / ".env")

sys.path.insert(0, str(Path(__file__).parent / "rag"))
from query_engine import ask
from vector_store import get_client, get_collection_info

app = Flask(__name__)
CORS(app)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.route("/api/health", methods=["GET"])
def health():
    """Health check."""
    try:
        client = get_client()
        info = get_collection_info(client)
        return jsonify({"status": "ok", "collection": info})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/ask", methods=["POST"])
def ask_question():
    """Ask a question to the RAG system."""
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Missing 'question' field"}), 400

    question = data["question"]
    wind_farms = data.get("wind_farms")
    insurance_lines = data.get("insurance_lines")
    project_phase = data.get("project_phase")
    language = data.get("language")
    top_k = data.get("top_k", 8)
    conversation_history = data.get("conversation_history")
    topic_context = data.get("topic_context")
    model = data.get("model")

    try:
        kwargs = dict(
            question=question,
            top_k=top_k,
            wind_farms=wind_farms,
            insurance_lines=insurance_lines,
            project_phase=project_phase,
            language=language,
            conversation_history=conversation_history,
            topic_context=topic_context,
        )
        if model:
            kwargs["model"] = model

        result = ask(**kwargs)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/topics/context-update", methods=["POST"])
def update_topic_context():
    """Extract key facts from a Q&A exchange and return updated context."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing request body"}), 400

    question = data.get("question", "")
    answer = data.get("answer", "")
    current_context = data.get("current_context", "")

    try:
        prompt = f"""You are maintaining a running context summary for a research topic about offshore wind insurance.

Current context:
{current_context if current_context else "(empty - this is the first exchange)"}

Latest Q&A exchange:
Q: {question}
A: {answer[:1500]}

Extract 1-3 key facts from this exchange that are important to remember for future questions in this topic. Append them to the current context. Keep the total context concise (under 2000 characters). If the context is getting long, summarize older facts.

Return ONLY the updated context text, nothing else."""

        response = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=500,
        )

        updated_context = response.choices[0].message.content.strip()
        return jsonify({"updated_context": updated_context})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/research", methods=["POST"])
def web_research():
    """Research a question using OpenAI web search."""
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Missing 'question' field"}), 400

    question = data["question"]
    topic_context = data.get("topic_context")
    language = data.get("language", "auto")

    try:
        from web_researcher import research_web
        result = research_web(
            question=question,
            topic_context=topic_context,
            language=language,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-research", methods=["POST"])
def save_research_to_kb():
    """Save web research findings to Qdrant knowledge base."""
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    question = data.get("question", "")
    sources = data.get("sources", [])

    try:
        from embedder import embed_texts, get_openai_client
        from vector_store import get_client as get_qdrant, upsert_chunks
        from uuid import uuid4

        # Create a chunk from the research
        chunk_id = str(uuid4())
        source_urls = ", ".join(s.get("url", "") for s in sources[:5])
        payload = {
            "id": chunk_id,
            "text": text[:3000],
            "source_file": f"web_research: {question[:100]}",
            "source_type": "web_research",
            "source_urls": source_urls,
            "wind_farms": [],
            "insurance_lines": [],
            "project_phase": None,
            "language": "en",
            "date": None,
            "chunk_index": 0,
            "total_chunks": 1,
        }

        oc = get_openai_client()
        vectors = embed_texts([text[:3000]], oc)
        upsert_chunks([payload], vectors, get_qdrant())

        return jsonify({"status": "saved", "chunk_id": chunk_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting RAG API server on http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=True)
