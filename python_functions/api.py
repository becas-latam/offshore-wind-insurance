"""
Local API Server
================
Flask API that serves the RAG query engine to the React frontend.

Run: python api.py
Serves on: http://localhost:5050
"""

import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.insert(0, str(Path(__file__).parent / "rag"))
from query_engine import ask
from vector_store import get_client, get_collection_info

app = Flask(__name__)
CORS(app)


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

    try:
        result = ask(
            question=question,
            top_k=top_k,
            wind_farms=wind_farms,
            insurance_lines=insurance_lines,
            project_phase=project_phase,
            language=language,
            conversation_history=conversation_history,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting RAG API server on http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=True)
