# RAG Pipeline — How It Works

> **Last updated:** March 2026

---

## Overview

The RAG (Retrieval-Augmented Generation) pipeline transforms raw transcript files into a searchable knowledge base that powers the Expert Q&A module.

```
Transcript files (.txt, .srt)
        ↓
   1. Parse → extract text + speakers
        ↓
   2. Chunk → split into 3-min segments
        ↓
   3. Extract metadata → wind farm, insurance line, date, language
        ↓
   4. Embed → OpenAI text-embedding-3-large (3072 dimensions)
        ↓
   5. Index → Qdrant Cloud (vector database)
        ↓
   Ready for Q&A queries
```

---

## Step 1: Parsing

**Script:** `python_functions/parsers/transcript_parser.py`

Handles 4 transcript formats automatically:

| Format | Example | Detection |
|--------|---------|-----------|
| **SRT + Speaker IDs** | `[SPEAKER_00]: text` with timestamps | Most `.txt` files |
| **SRT + Named Speakers** | `Reimers: text` with timestamps | Some `.txt` files |
| **Plain + Named Speakers** | `SSH: text` without timestamps | Most `.srt` files |
| **Plain Raw** | No speakers, no timestamps | Informal notes |

The parser auto-detects the format and outputs a unified list of segments.

---

## Step 2: Chunking

**Script:** `python_functions/rag/chunker.py`

Two strategies depending on file type:

- **Files with timestamps:** 3-minute time windows with 30-second overlap
- **Files without timestamps:** Groups of 25 segments with 3-segment overlap

Minimum chunk size: 80 characters (tiny chunks are skipped).

---

## Step 3: Metadata Extraction

**Script:** `python_functions/parsers/metadata_extractor.py`

Metadata is extracted from the **file path and filename**:

| Field | Source | Example |
|-------|--------|---------|
| **Date** | Filename prefix (DDMMYYYY) | `03092024` → 2024-09-03 |
| **Wind farm** | Immediate folder name | `ALB und HS` → Albatros, Hohe See |
| **Insurance line** | Folder name | `OAR` → OAR |
| **Project phase** | Parent folder | `Betrieb` → Operation |
| **Language** | Filename suffix | `en` suffix → English, otherwise German |

### Wind Farm Mapping

| Folder | Wind Farm |
|--------|-----------|
| B1, Baltic 1 | Baltic 1 |
| B2, Baltic 2 | Baltic 2 |
| HS, Hohe See | Hohe See |
| ALB, Albatros | Albatros |
| EOS | EOS |
| UK | UK Offshore |
| DKT | DKT |
| CPS | CPS |

---

## Step 4: Embedding

**Model:** OpenAI `text-embedding-3-large` (3072 dimensions)
**Cost:** ~$0.13 per 1M tokens (~$2-5 for full corpus)

Each chunk's text is sent to OpenAI's embedding API and converted into a 3072-dimensional vector.

### Future: Gemini Embedding 2
Planned A/B test against OpenAI. Gemini also supports native audio embedding for future use.

---

## Step 5: Indexing (Qdrant)

**Service:** Qdrant Cloud (free tier)
**Collection:** `transcripts`

Each chunk is stored as a point in Qdrant with:
- **Vector:** 3072-dim embedding
- **Payload:** text + all metadata fields

### Payload Indexes (for filtered search)
- `wind_farms` (keyword)
- `insurance_lines` (keyword)
- `project_phase` (keyword)
- `language` (keyword)
- `topics` (keyword)
- `speakers` (keyword)
- `date` (keyword)
- `source_file` (keyword)

---

## How to Run

### Index all text files (first time or after adding new files)
```bash
C:\Python311\python.exe index_now.py
```
- Skips already-indexed files (progress saved in `indexing_progress.json`)
- Can be stopped (Ctrl+C) and resumed
- Shows per-file progress with ETA

### Index a single new file
```bash
C:\Python311\python.exe python_functions/rag/embedder.py --file "path/to/file.txt"
```

### Check collection status
```bash
C:\Python311\python.exe python_functions/rag/vector_store.py
```

---

## Corpus Sources

| Location | Content | Files |
|----------|---------|-------|
| `Dropbox\Know\Protokollen ABU\Protokollen` | Organized by wind farm, insurance line, topic | ~750 .txt/.srt |
| `Dropbox\Know\in Progress\2024` | 2024 transcripts | ~55 .txt/.srt |

**Total:** ~804 text files, ~295,000 segments, estimated ~15,000-20,000 chunks

---

## Query Flow

When a user asks a question in the Q&A module:

```
User question
      ↓
1. Combine with conversation history (last 6 messages)
      ↓
2. Embed the question with OpenAI
      ↓
3. Search Qdrant for top 8 similar chunks
   (with optional metadata filters: wind farm, insurance line, phase)
      ↓
4. Load abbreviations/definitions reference document
      ↓
5. Send to GPT-5 Mini with:
   - Expert persona system prompt
   - Topic context (auto-growing)
   - Abbreviations reference
   - Retrieved source chunks
   - Conversation history (includes both KB and web research messages)
      ↓
6. Return answer with source citations
      ↓
7. Auto-update topic context with key facts (background, non-blocking)
```

### Web Research Flow (when user clicks "Research Online")

```
User clicks "Research Online" on a KB answer
      ↓
1. Call OpenAI Responses API with web_search_preview tool
   (same OPENAI_API_KEY, no extra service needed)
      ↓
2. OpenAI searches the web, reads pages, synthesizes
      ↓
3. Return research report with source URLs
      ↓
4. Display in distinct blue web research card
      ↓
5. User can:
   - "Save to KB" → embed in Qdrant (source_type: web_research)
   - "Save to Topic" → add key findings to topic context
   - Dismiss → not saved
      ↓
6. Web research content is included in conversation history
   so follow-up questions work naturally
```

**API Server:** `python_functions/api.py` (Flask, port 5050)
**Frontend:** React Q&A page at `/qa` with topic sidebar

**API Endpoints:**
- `POST /api/ask` — KB search + LLM answer
- `POST /api/research` — web research via OpenAI web search
- `POST /api/save-research` — save web findings to Qdrant
- `POST /api/topics/context-update` — auto-grow topic context

---

## Adding New Files in the Future

1. Get new transcript `.txt` or `.srt` files
2. Place them in the appropriate Dropbox folder (or any local folder)
3. Run: `C:\Python311\python.exe index_now.py` or `embedder.py --file <path>`
4. New chunks are added to Qdrant without affecting existing data
5. Immediately available for Q&A queries

### Audio files (2025+)
For files that only exist as audio (no transcription yet):
- **Option A:** Transcribe with Whisper/Gemini first, then index as text
- **Option B:** Embed audio directly with Gemini Embedding 2 (future)
