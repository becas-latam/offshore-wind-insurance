# Feature: Deep Internet Research

> **Status:** Planning
> **Last updated:** March 2026

---

## Problem

There is very little published material about offshore wind insurance. When the local knowledge base (transcripts) doesn't cover a topic, the user needs the system to **research the internet deeply** — not just a single Google search, but an autonomous agent that explores multiple sources, follows leads, and synthesizes findings into a comprehensive answer.

---

## Chosen Approach: GPT-Researcher + Tavily

**GPT-Researcher** is an autonomous research agent (20k+ GitHub stars) that:

1. Takes a question and generates **multiple sub-questions** to explore
2. Searches the web for each sub-question using **Tavily API**
3. Reads and extracts relevant content from many pages
4. Filters, aggregates, and cross-references findings
5. Generates a **detailed research report with citations**

This is critical for offshore wind insurance because:
- Information is scattered across industry reports, legal databases, broker publications, regulatory documents
- A single search returns very little — the agent needs to follow multiple threads
- German legal framework content (VVG, WindSeeG) is niche and spread across different sources
- Insurance market reports (Swiss Re, Allianz, Munich Re) need to be found and synthesized

---

## User Flow

```
User asks a question in Q&A
        ↓
RAG searches local knowledge base
        ↓
┌─ Good results ──→ Show answer from knowledge base (current flow)
│
└─ Empty/weak results ──→ Show prompt:
                            "Limited information in knowledge base.
                             Would you like to research this topic online?"
                                    ↓
                            [Deep Research]  [Skip]
                                    ↓
                          GPT-Researcher runs (30-60 seconds)
                          - Generates sub-questions
                          - Searches web via Tavily
                          - Reads multiple sources
                          - Aggregates findings
                                    ↓
                          Show research report with:
                          - Structured findings
                          - Clickable source URLs
                          - Confidence indicators
                                    ↓
                          Optionally: save key findings to topic context
```

### Manual trigger
User can also click a "Research Online" button anytime, even when KB has results — to complement local knowledge with web sources.

---

## How GPT-Researcher Works

```
User query: "What are typical WECI coverage terms for North Sea wind farms?"
                    ↓
            ┌── Planner Agent ──┐
            │                   │
            │  Generates:       │
            │  1. "WECI insurance offshore wind"
            │  2. "weather extension cover North Sea"
            │  3. "WECI policy terms conditions"
            │  4. "offshore wind delay coverage"
            └───────────────────┘
                    ↓
            ┌── Research Agents (parallel) ──┐
            │  Agent 1: searches query 1     │
            │  Agent 2: searches query 2     │
            │  Agent 3: searches query 3     │
            │  Agent 4: searches query 4     │
            │                                │
            │  Each reads top results,       │
            │  extracts relevant content     │
            └────────────────────────────────┘
                    ↓
            ┌── Aggregator ──┐
            │  Filters noise  │
            │  Cross-refs     │
            │  Writes report  │
            │  Adds citations │
            └─────────────────┘
                    ↓
            Research report with sources
```

---

## Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Research agent | [GPT-Researcher](https://github.com/assafelovic/gpt-researcher) | Autonomous research orchestration |
| Web search | [Tavily API](https://tavily.com) | Search backend (free 1k/month) |
| LLM | GPT-5 Mini | Sub-question generation + report writing |
| Integration | Python API endpoint | Called from React frontend |

### API Keys needed
- `TAVILY_API_KEY` — free tier: 1,000 credits/month
- `OPENAI_API_KEY` — already have this

---

## Implementation Plan

### Step 1: Install and configure
- `pip install gpt-researcher tavily-python`
- Add `TAVILY_API_KEY` to `.env`
- Test GPT-Researcher standalone with an offshore wind insurance query

### Step 2: Create research service
- `python_functions/rag/web_researcher.py`
- Wrapper around GPT-Researcher
- Configure: Tavily as retriever, GPT-5 Mini as LLM
- Function: `research(question, topic_context) → { report, sources }`

### Step 3: API endpoint
- `POST /api/research` in `api.py`
- Accepts: `{ question, topic_context }`
- Returns: `{ report, sources: [{title, url}], research_time }`
- Longer timeout (60-90 seconds) since research takes time

### Step 4: Frontend — research trigger
- Detect empty/weak RAG results → show "Research Online" prompt
- Add "Research Online" button in Q&A toolbar (manual trigger)
- Show loading state with progress: "Researching... Searching 4 sub-topics..."
- Display research report in a distinct card (different from KB answers)
- Show source URLs as clickable links

### Step 5: Combine KB + Web
- Option to run both in parallel
- Answer merges local knowledge + web research
- Sources clearly labeled: "Knowledge Base" vs "Web Research"

### Step 6: Save research findings
- Option to save key findings to topic context
- Option to save web content as new chunks in Qdrant ("web_research" tag)
- Builds the knowledge base over time from web research

---

## UI Design

### Research result card (distinct from KB answers)

```
┌─────────────────────────────────────────────────┐
│ 🌐 Web Research Report                          │
│ Researched in 45 seconds · 12 sources found     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ## WECI Coverage for North Sea Wind Farms       │
│                                                 │
│ Weather Extension Cover for Indemnities (WECI)  │
│ is typically structured as...                   │
│                                                 │
│ ### Key findings:                               │
│ - Coverage periods range from...                │
│ - Standard deductibles...                       │
│ - Major insurers offering WECI...               │
│                                                 │
├─────────────────────────────────────────────────┤
│ Web Sources:                                    │
│ 🔗 Swiss Re: Offshore Wind Risk Report          │
│ 🔗 Allianz: Renewable Energy Insurance          │
│ 🔗 Marsh: WECI Coverage Guide                   │
│ 🔗 WindSeeG Regulatory Framework                │
├─────────────────────────────────────────────────┤
│ [Save to topic context]  [Add to knowledge base]│
└─────────────────────────────────────────────────┘
```

---

## Cost Estimate

| Scenario | Tavily credits | OpenAI cost | Total |
|----------|---------------|-------------|-------|
| 1 research query | ~5-20 credits | ~$0.02-0.05 | ~$0.05 |
| 10 queries/day | ~100-200 credits | ~$0.50 | ~$0.70/day |
| Light use (5/day) | ~50-100 credits | ~$0.25 | Free tier covers it |

---

## Future: Stanford STORM for Book Writing

For the Book Writing module (Phase 5), **Stanford STORM** could generate full chapter-length research articles from web sources. This is a separate feature but uses similar infrastructure (Tavily + LLM).

---

## Design Decisions (Confirmed)

### 1. Research depth: User chooses
- **Fast mode** (15-20 seconds) — fewer sub-questions, top 3-5 sources
- **Deep mode** (60+ seconds) — more sub-questions, 10-15 sources, comprehensive report
- UI: toggle or dropdown next to the "Research Online" button

### 2. Saving to knowledge base: User prompted, never automatic
- After research report is shown, display buttons:
  - **"Save to Knowledge Base"** — embeds the report in Qdrant with `source_type: "web_research"` tag
  - **"Save to Topic Context"** — adds key findings to the topic's growing context
  - **"Dismiss"** — research is shown but not saved
- User controls what gets into the knowledge base — web info is not auto-trusted

### 3. Language: English and German
- User can select search language: English, German, or Both
- Default: Both (searches in English first, then German, merges results)
- German is essential for legal framework (VVG, WindSeeG, BGB)
- English gives broader insurance market coverage (Lloyd's, Swiss Re, etc.)

### 4. KB and web results shown separately
- Knowledge base answer and web research are **displayed as separate cards**
- KB card: current design (sources as file badges)
- Web research card: distinct design with globe icon, clickable URL links, research time
- User can compare both and decide which information to trust
- Future: option to merge into a single combined answer

---

## Sources

- [GPT-Researcher](https://github.com/assafelovic/gpt-researcher) — Autonomous research agent (20k+ stars)
- [Tavily API](https://www.tavily.com/) — AI search API, free 1k credits/month
- [Perplexica](https://github.com/ItzCrazyKns/Perplexica) — Self-hosted alternative (free with SearXNG)
- [Stanford STORM](https://github.com/stanford-oval/storm) — Long-form article generation
