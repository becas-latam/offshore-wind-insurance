# Q&A Topics System — Specification

> **Last updated:** March 2026

---

## Overview

The Q&A module is organized around **Topics** — focused research threads that maintain context across multiple questions. Each topic acts as a workspace for a specific area of investigation.

---

## User Flow

### 1. Create a Topic
- User clicks "+ New Topic"
- Enters a **name** (e.g., "Baltic 2 OAR Renewal 2024")
- Enters an optional **initial context** (e.g., "Focus on the OAR renewal for Baltic 2 in 2024, particularly serial loss clause and deductible structures")
- Topic is created and becomes the active workspace

### 2. Ask Questions Within a Topic
- User types a question in the chat
- The system uses the **topic context + conversation history** to improve retrieval
- Answer is displayed with source citations
- The topic context is **automatically updated** with key information from the answer

### 3. Switch Between Topics
- Sidebar shows all topics (most recent first)
- Click a topic to switch — full conversation history is loaded
- Each topic maintains its own independent context and messages

### 4. Manage Topics
- Rename a topic
- Delete a topic
- View topic context (what the system "knows" about this thread)

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Expert Q&A                                [Model Selector] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  + New Topic │  Topic: Baltic 2 OAR Renewal                │
│              │  Context: OAR renewal 2024, serial loss...   │
│  ───────────-│  ──────────────────────────────────────────  │
│              │                                              │
│  ● Baltic 2  │      What was discussed about the           │
│    OAR       │      deductible structure?          [user]   │
│              │                                              │
│  ○ HS Claims │  [assistant]                                 │
│              │  Based on the sources, the deductible...     │
│  ○ UK CAR    │  Sources: [file1] [file2]                    │
│              │                                              │
│  ○ General   │      Who were the involved insurers?         │
│    Questions │                                     [user]   │
│              │                                              │
│              │  [assistant]                                 │
│              │  The insurer panel included...               │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  [Ask a question...]                              [Send]    │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar
- "+ New Topic" button at top
- List of topics sorted by last activity
- Active topic highlighted
- Each topic shows: name + last message preview + timestamp
- Right-click or menu: rename, delete

### Chat Area
- Topic name and context summary at the top
- Messages displayed in chat format (same as current)
- Source citations with file name, wind farm, date
- Model badge on each answer

---

## Data Model (Firestore)

```
users/{userId}/topics/{topicId}
  ├── name: string                    // "Baltic 2 OAR Renewal"
  ├── context: string                 // Growing context summary
  ├── initialContext: string          // What the user provided at creation
  ├── model: string                   // Last used model
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── messages: [                     // Array of messages (or subcollection)
        {
          role: "user" | "assistant"
          content: string
          sources: [{file, wind_farms, date, score}]
          model: string
          timestamp: timestamp
        }
      ]
```

### Why store messages in Firestore?
- Topics persist across sessions and devices
- No data loss if browser is closed
- Can be used for analytics later (most asked topics, etc.)

---

## Context Management

### How context grows

Each time the assistant answers a question, the system extracts key facts and appends them to the topic context. This is done by the LLM itself:

```
After generating the answer:
  → Ask the LLM: "Given this Q&A exchange, extract 1-3 key facts
    to add to the topic context"
  → Append to topic.context
  → Save to Firestore
```

### How context is used

The topic context is included in every query to improve retrieval:

1. **Search query enrichment** — topic context is combined with the user's question when searching Qdrant
2. **LLM prompt** — topic context is included in the system message so the LLM understands the research thread

### Context size limit
- Maximum ~2000 characters per topic context
- When limit is reached, the LLM summarizes/compresses the context

---

## API Changes

### New endpoints

```
POST /api/topics/context-update
  Body: { answer: string, question: string, current_context: string }
  Returns: { updated_context: string }
```

### Updated /api/ask endpoint

```
POST /api/ask
  Body: {
    question: string,
    topic_context: string,        // NEW: the topic's accumulated context
    conversation_history: [...],
    model: string,
    wind_farms: [...],
    ...
  }
```

The topic_context is used to:
1. Enrich the Qdrant search query
2. Add context to the LLM prompt

---

## Implementation Plan

### Step 1: Firestore integration
- Create Firestore service for topics CRUD
- Create/read/update/delete topics
- Save and load messages

### Step 2: Topics sidebar
- New sidebar component with topic list
- Create topic dialog (name + initial context)
- Switch between topics
- Delete/rename topics

### Step 3: Update Q&A chat
- Load messages from selected topic
- Save new messages to Firestore
- Display topic name and context at top

### Step 4: Context management
- Add context-update API endpoint
- After each answer, extract key facts and update context
- Include topic context in retrieval and LLM prompt

### Step 5: Polish
- Topic search/filter
- Last message preview in sidebar
- Responsive layout (mobile: toggle sidebar)

---

## Example Workflow

1. User creates topic: **"Hohe See Schaden OSS"**
   - Context: "Investigation of the OSS damage at Hohe See wind farm, conversations with Timo"

2. User asks: "What happened with the OSS damage?"
   - System searches Qdrant with: "Hohe See OSS damage" + topic context
   - Answer references specific conversations about transformer damage, affected WTGs
   - Context auto-updates: "OSS damage at Hohe See involves defective switchgear AH60, affecting 23 WTGs that must reduce to 4.4MW"

3. User asks: "What is the insurance impact?"
   - System now knows from context that this is about Hohe See OSS damage
   - Retrieves insurance-related chunks about Hohe See
   - Answer covers OAR coverage, deductibles, claims process

4. User asks: "Who should we contact?"
   - Context carries full understanding of the topic
   - System can provide relevant contacts mentioned in the transcripts
