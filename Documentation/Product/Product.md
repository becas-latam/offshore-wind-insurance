# Offshore Wind Insurance RAG System — Project Summary

> **Last updated:** March 2026  
> **Status:** Phase 0 complete · Frontend shell live · Phase 1 (RAG Foundation) next

---

## 1. Purpose & Vision

This project builds a **production-grade RAG (Retrieval-Augmented Generation) system** and **professional workspace** for offshore wind insurance practitioners.

The corpus consists of **hundreds of hours of audio recordings** that have been transcribed into `.txt` files — some organized by wind park, others unorganized. The system serves four core use cases:

1. **Expert Q&A** — semantic search and expert-level answers across the full corpus, filtered by wind park, insurance line, and project phase
2. **Contract Analysis** — upload insurance contracts (PDF/Word), get clause-by-clause analysis, risk identification, coverage gap detection, and regulatory compliance checks
3. **Clause Drafting** — generate insurance clauses and policy language based on best practices from the corpus and German legal requirements
4. **Book Writing Pipeline** — leveraging the corpus as primary source material for a practitioner-focused publication on offshore wind insurance

---

## 2. Domain Coverage

The corpus spans highly specialized terminology across three dimensions:

### Insurance Lines of Business
| Line | Description |
|---|---|
| **CAR** | Construction All Risks |
| **OAR** | Operational All Risks |
| **H&M** | Hull & Machinery |
| **P&I** | Protection & Indemnity |
| **WECI** | Weather Extension Cover for Indemnities |
| **Environmental Liability** | Pollution and environmental damage coverage |
| **Cyber / SCADA** | Cyber coverage for offshore control systems |

### German Legal & Regulatory Frameworks
- **VVG** — Versicherungsvertragsgesetz (Insurance Contract Act)
- **BGB / HGB** — Civil and Commercial Code provisions
- **WindSeeG** — Offshore Wind Energy Act
- **EU Solvency II** — Capital and risk framework

### Technical Engineering Domain
- Offshore wind infrastructure lifecycle
- Monopile foundations and installation risks
- Project phases: construction → operation → decommissioning

---

## 3. Technical Architecture

### Core Stack

| Component | Technology | Role |
|---|---|---|
| **Frontend** | React + TypeScript + Vite + Tailwind + shadcn/ui | User interface and workspace |
| **Hosting & Auth** | Firebase (Hosting, Auth, Firestore, Storage) | Infrastructure and user management |
| **Backend** | Python Cloud Functions (Firebase/Google Cloud) | AI/RAG processing pipeline |
| **RAG Framework** | LlamaIndex | Ingestion, indexing, query orchestration |
| **Vector Database** | Qdrant | Semantic storage and metadata-filtered retrieval |
| **Embeddings** | See §4 | Vectorization of transcript chunks |
| **Document Parsing** | PDF/Word extraction pipeline | Contract analysis input processing |
| **LLM Generation** | OpenAI GPT-4 / Claude | Answer synthesis, contract analysis, clause drafting, book writing |

### Why Qdrant over ChromaDB

ChromaDB is used for prototyping. Qdrant was selected for production because:
- Strong **payload filtering** capabilities — essential for filtering by wind park, insurance line, project phase
- Production-grade performance at scale
- LlamaIndex native integration

---

## 4. Embedding Model Strategy

### Primary Candidate: Gemini Embedding 2

| Property | Value |
|---|---|
| Model ID | `gemini-embedding-2-preview` |
| Context window | 8,192 tokens |
| Default dimensions | 3,072 (MRL-supported, reducible) |
| Recommended for prototyping | **768 dimensions (MRL)** |
| Multimodal | Native audio, image, and text support |
| Pricing | $0.20 / 1M tokens |
| Status | **Preview** — production readiness unverified |

### A/B Evaluation Benchmark

Given Gemini Embedding 2's preview status and unproven performance on niche offshore insurance terminology, a comparative evaluation against **OpenAI `text-embedding-3-large`** is planned before full commitment.

### Optional Future Path: Embedding Fine-Tuning with Unsloth

Generic embedding models may not capture domain-specific similarity (e.g., `CAR deductible clause` ↔ `Bauherren-Haftpflicht`). **Unsloth** enables fine-tuning of embedding models 1.8–3.3× faster with 20% less memory, on free Colab GPUs.

Candidate base models for fine-tuning: `BAAI/bge-m3`, `Snowflake Arctic`, `ModernBERT`

**Workflow:**
1. Generate domain-specific QA pairs from transcripts (using GPT-4 or Claude)
2. Fine-tune a base embedding model via Unsloth QLoRA
3. Compare retrieval quality against Gemini / OpenAI baselines

---

## 5. Expert Persona System Prompt

A **200+ line system prompt** has been developed targeting a high-capability model (GPT-4 class), structured around:

- Full coverage of insurance lines of business (CAR, OAR, H&M, P&I, WECI, Cyber, Environmental)
- German legal framework expertise (VVG, BGB, WindSeeG, Solvency II)
- Analytical frameworks for:
  - Systematic risk assessment across project lifecycle
  - Contractual chain mapping (EPC → insurer → reinsurer)
  - Clause-by-clause liability analysis
- Appropriate caveats for formal legal advice under German law

---

## 6. Key Design Decisions

### Chunk-Level Metadata Beats File-Level Organization

Since expert conversations frequently span multiple topics within a single file, **automatic metadata tagging per chunk** is more powerful than folder structures. Each chunk will be tagged with:

- Wind park name(s)
- Insurance lines referenced
- Project phase (construction / operational / decommissioning)
- Regulatory references
- Topic categories

This enables multi-dimensional Qdrant payload filtering without any manual reorganization of the corpus.

### Mixed Model Strategy

| Task | Model Tier | Rationale |
|---|---|---|
| Embedding | Open-source or Gemini/OpenAI | Cost-efficient vectorization |
| Bulk metadata tagging | Cheap model (GPT-4o-mini) | High volume, structured output |
| Contract parsing & analysis | GPT-4 / Claude Opus-class | Clause extraction, risk detection |
| Clause drafting | GPT-4 / Claude Opus-class | Generate policy language from precedents |
| Final answer generation | GPT-4 / Claude Opus-class | Nuanced domain reasoning |
| Book writing | GPT-4 / Claude Opus-class | Long-form coherent output |

---

## 7. Work Remaining

### Phase 0: Project Setup ✅ COMPLETED
- [x] GitHub repository created
- [x] React + TypeScript + Vite project initialized
- [x] Tailwind CSS + shadcn/ui configured (corporate maritime theme)
- [x] Firebase project connected (Auth, Firestore)
- [x] Google sign-in enabled (popup on localhost, redirect in production)
- [x] User profile persistence in Firestore (users collection)
- [x] Firestore security rules deployed
- [x] Full routing with protected routes
- [x] Landing page, login/signup, dashboard, and placeholder pages for all modules
- [x] Navbar with navigation and user dropdown
- [x] Python Cloud Functions folder structure prepared

### Phase 1: RAG Foundation ✅ COMPLETED
- [x] Transcript parsers for 4 formats (SRT+speaker IDs, SRT+named, plain named, plain raw)
- [x] Tested on all 1,162 files — zero errors, 295,803 segments
- [x] Metadata extraction from file paths (date, wind farm, insurance line, phase, language)
- [x] Chunking pipeline (time-based 3min windows + segment-based fallback)
- [x] Qdrant Cloud collection with payload indexes (wind_farms, insurance_lines, project_phase, language, topics, speakers, date)
- [x] OpenAI text-embedding-3-large embedding pipeline
- [x] Expert persona system prompt (200+ lines covering all insurance lines, legal frameworks, engineering domain)
- [x] RAG query engine with source citations
- [x] 231 chunks indexed from 10 test files — pipeline validated end-to-end
- [x] Full corpus indexed: 804 files, 10,165 chunks, zero errors (11 minutes)
- [ ] Benchmark Gemini Embedding 2 vs. OpenAI (future)

### Phase 1.5: Living Glossary & Knowledge Memory
- [x] Abbreviations document converted from Word to markdown (English + German terms)
- [x] Book draft and citations converted from Word to markdown
- [x] Abbreviations injected as reference context in every RAG query
- [ ] **Auto-enrichment**: After each Q&A, system identifies new terms/definitions found in retrieved conversation chunks that are not yet in the glossary
- [ ] **Propose additions**: New terms are surfaced to the user for review and approval before adding to the glossary
- [ ] **Auto-categorize**: New terms are tagged by domain (insurance, legal, engineering, wind farm specific)
- [ ] **Version history**: Track how the glossary grows over time
- [ ] **Glossary search**: Dedicated UI page to browse, search, and edit definitions
- [ ] **Cross-language sync**: When a German term is added, propose the English equivalent and vice versa

### Phase 2: Expert Q&A Module — IN PROGRESS
- [x] Q&A chat interface with markdown rendering (ReactMarkdown)
- [x] Source citations with file name, wind farm, and date
- [x] Conversation history (last 6 messages sent for context)
- [x] Follow-up question support (conversation memory + enriched retrieval)
- [x] Local Flask API server bridging React frontend to Python RAG backend
- [x] Topic-based Q&A with Firestore persistence (create, switch, rename, delete topics)
- [x] Auto-growing topic context (LLM extracts key facts after each answer)
- [x] Model selector: GPT-5 Mini (default, fast) / GPT-5.2 (best reasoning)
- [x] Model badge shown on each answer
- [x] **Web research**: "Research Online" button on every KB answer
  - Uses OpenAI Responses API with built-in web search (no extra API key)
  - Distinct blue-bordered card with globe icon for web results
  - Clickable source URLs
  - "Save to KB" — embeds research in Qdrant with `source_type: web_research`
  - "Save to Topic" — adds key findings to topic context
  - Web research content included in conversation history for follow-ups
- [ ] Metadata filter sidebar (wind park, insurance line, project phase)
- [ ] Saved queries and conversation export
- [ ] Streaming responses (real-time token display)

### Phase 3: Contract Analysis Module
- [ ] Document upload pipeline (PDF/Word parsing and clause extraction)
- [ ] Clause-by-clause analysis against the knowledge base
- [ ] Risk identification and coverage gap detection
- [ ] Regulatory compliance checks (VVG, WindSeeG, Solvency II)
- [ ] Analysis report generation and export

### Phase 4: Clause Drafting Module
- [ ] Clause generation by insurance line (CAR, OAR, H&M, P&I, WECI)
- [ ] Precedent retrieval from the corpus
- [ ] Customization for specific wind farm projects and risk profiles
- [ ] Version comparison between drafted and existing clauses
- [ ] Export to Word/PDF

### Phase 5: Book Writing Pipeline
- [ ] Topic discovery via data mining across full corpus
- [ ] Deep extraction by proposed chapter themes
- [ ] AI-assisted drafting with rich text editor
- [ ] Review, editing, and structured writing workflow
- [ ] Export to formatted PDF/Word

### Phase 6: Embedding Optimization (Optional)
- [ ] Evaluate Unsloth fine-tuned embedding model vs. off-the-shelf baselines
- [ ] Audio embedding pipeline using Gemini Embedding 2's native audio support
  *(Original recordings may capture tonal nuance lost in transcription — optionality preserved)*

---

## 8. Guiding Principles

1. **Metadata at chunk level** — more powerful than folder organization for multi-topic conversations
2. **Mixed model strategy** — right model for each task tier, cost-efficiency without quality compromise
3. **Preview model risk management** — always A/B evaluate before full commitment on unproven models
4. **Audio-first transcription preserves optionality** — text pipeline is the immediate priority, audio embeddings are a future path
5. **Domain adaptation** — generic embeddings may underperform; fine-tuning on domain QA pairs is a clear upgrade path
6. **Living knowledge** — the system gets smarter over time through a growing glossary of terms and definitions extracted from conversations, reviewed by the user, and fed back into future queries

---

*This document summarizes design decisions, architecture choices, and outstanding work as of March 2026.*