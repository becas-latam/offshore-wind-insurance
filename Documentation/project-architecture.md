---
name: project-architecture
description: Offshore wind insurance RAG system architecture decisions - Firebase + React frontend, Python backend for AI/RAG pipeline
type: project
---

Architecture combines the familiar Firebase/React stack with a Python AI backend:

- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui (same as german-learning-game)
- **Backend:** Python Cloud Functions on Firebase/Google Cloud for RAG pipeline
- **Database:** Firestore for user data, app state, metadata
- **Vector DB:** Qdrant for semantic search over transcript chunks
- **AI:** LlamaIndex for orchestration, Gemini/OpenAI embeddings, GPT-4/Claude for generation
- **Storage:** Firebase Storage for transcript files

**Why:** User wants to keep Firebase as the foundation since it's familiar from german-learning-game. Python functions handle the AI/RAG heavy lifting.
