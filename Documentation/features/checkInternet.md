# Feature: Deep Internet Research

> **Status:** Planning — ready to build
> **Last updated:** March 2026

---

## Problem

There is very little published material about offshore wind insurance. When the local knowledge base (transcripts) doesn't cover a topic, the user needs the system to **research the internet deeply** — not just a single Google search, but an intelligent search that explores multiple sources and synthesizes findings.

---

## Chosen Approach: Two Modes

### Fast Mode — OpenAI Built-in Web Search (Primary)

OpenAI now has **web search built into the API** via the Responses API. No extra service or API key needed.

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5-mini",
    tools=[{"type": "web_search_preview"}],
    input="What are typical WECI coverage terms for North Sea wind farms?"
)
print(response.output_text)  # Answer with web citations
```

**One API call. Same OpenAI key. No extra setup.**

| Feature | Details |
|---------|---------|
| **Cost** | ~$0.01-0.03 per simple query, ~$0.20 for deep queries |
| **Speed** | 5-15 seconds |
| **Setup** | None — uses existing `OPENAI_API_KEY` |
| **Best for** | Quick lookups, fact-checking, general insurance questions |

### Deep Mode — GPT-Researcher + Tavily (Future, if needed)

If OpenAI's built-in search isn't deep enough for niche offshore wind topics, we can add GPT-Researcher as a second option.

| Feature | Details |
|---------|---------|
| **Repo** | [github.com/assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) |
| **How** | Autonomous agent: generates sub-questions, searches each one, aggregates |
| **Cost** | ~$0.05 per query + Tavily credits |
| **Speed** | 30-60 seconds |
| **Setup** | Tavily API key + pip install |
| **Best for** | Comprehensive multi-source research on niche topics |

**We start with Fast Mode only. Add Deep Mode later if needed.**

---

## Design Decisions (Confirmed)

### 1. Research depth: User chooses
- **Fast mode**: OpenAI web search (5-15 seconds)
- **Deep mode**: GPT-Researcher (30-60 seconds) — future addition
- UI: toggle next to "Research Online" button

### 2. Saving to knowledge base: User prompted, never automatic
- After research report is shown, display buttons:
  - **"Save to Knowledge Base"** — embeds the report in Qdrant with `source_type: "web_research"` tag
  - **"Save to Topic Context"** — adds key findings to the topic's growing context
  - **"Dismiss"** — research is shown but not saved
- User controls what enters the knowledge base — web info is not auto-trusted

### 3. Language: English and German
- User can select search language
- Default: searches in the language of the question
- Can customize via `user_location` parameter for German-specific results:
  ```python
  tools=[{
      "type": "web_search_preview",
      "user_location": {
          "type": "approximate",
          "country": "DE",
      }
  }]
  ```

### 4. KB and web results shown separately
- Knowledge base answer and web research are **displayed as separate cards**
- KB card: current design (source file badges)
- Web research card: distinct design with globe icon, clickable URL links
- User can compare both and decide which information to trust
- Future: option to merge into a single combined answer

---

## User Flow

```
User asks a question in Q&A
        ↓
RAG searches local knowledge base
        ↓
┌─ Good results ──→ Show KB answer
│                   + "Research Online" button available
│
└─ Empty/weak results ──→ Show prompt:
                            "Limited information in knowledge base.
                             Would you like to research this online?"
                                    ↓
                            [Research Online]  [Skip]
                                    ↓
                          OpenAI web search runs (5-15 seconds)
                                    ↓
                          Show research card with:
                          - Findings from web
                          - Clickable source URLs
                                    ↓
                          [Save to KB]  [Save to Topic]  [Dismiss]
```

### Manual trigger
User can always click "Research Online" button — even when KB has good results — to supplement with web information.

---

## Implementation Plan

### Step 1: Web research service
- Create `python_functions/rag/web_researcher.py`
- Uses OpenAI Responses API with `web_search_preview` tool
- Function: `research_web(question, language) → { report, sources }`
- Extract URLs from response annotations

### Step 2: API endpoint
- Add `POST /api/research` to `api.py`
- Accepts: `{ question, topic_context, language }`
- Returns: `{ report, sources: [{title, url}], search_time }`

### Step 3: Frontend — research trigger
- Detect empty/weak RAG results → show "Research Online" prompt
- Add "Research Online" button in Q&A toolbar (always available)
- Show loading state: "Researching online..."
- Display research report in distinct card (globe icon, URL links)

### Step 4: Save controls
- "Save to Knowledge Base" button → embed report in Qdrant with `source_type: "web_research"`
- "Save to Topic Context" button → append key findings to topic context
- "Dismiss" → no save

### Step 5 (Future): Deep mode with GPT-Researcher
- Only if Fast Mode proves insufficient for niche topics
- Add Tavily API key
- Install GPT-Researcher
- Add "Deep Research" option alongside "Fast Research"

---

## UI Design

### Web research card (separate from KB answer)

```
┌─────────────────────────────────────────────────┐
│ 🌐 Web Research                    5.2 seconds  │
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
├─────────────────────────────────────────────────┤
│ [Save to KB]  [Save to Topic]  [Dismiss]        │
└─────────────────────────────────────────────────┘
```

---

## Cost Estimate

| Usage | Approx cost/month |
|-------|-------------------|
| Light (5 web searches/day) | ~$3-5 |
| Medium (15/day) | ~$10-15 |
| Heavy (50/day) | ~$30-50 |

All on the existing OpenAI bill — no extra service.

---

## Future Enhancements

- **Deep mode**: GPT-Researcher + Tavily for comprehensive multi-source research
- **Stanford STORM**: For Book Writing module — generates full chapter-length articles from web
- **Combined mode**: Search KB + web in parallel, merge into single answer
- **Auto-detect language**: Detect question language and search in the same language

---

## Sources

- [OpenAI Web Search Docs](https://platform.openai.com/docs/guides/tools-web-search)
- [OpenAI Responses API Cookbook](https://cookbook.openai.com/examples/responses_api/responses_example)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [GPT-Researcher](https://github.com/assafelovic/gpt-researcher) — Future deep mode option
- [Tavily API](https://www.tavily.com/) — Future deep mode search backend
