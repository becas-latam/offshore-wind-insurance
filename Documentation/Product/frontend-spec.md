# Frontend Specification

> **Last updated:** March 2026

---

## Overview

Professional, corporate-style web application for offshore wind insurance practitioners. Built with React + TypeScript + Tailwind + shadcn/ui, hosted on Firebase.

---

## Style & Design Direction

- **Look & feel:** Professional, corporate, clean — think law firm or consulting tool, not startup
- **Color palette:** Dark blues, grays, whites — maritime/offshore industry feel
- **Typography:** Clean, readable, professional serif or sans-serif
- **Tone:** Authoritative, precise, trustworthy
- **No playful elements** — this is a serious industry tool

---

## Authentication

- Firebase Auth (email/password to start, expandable later)
- Auth-gated: everything behind login except the Landing Page
- Role-based access possible for future multi-user support

---

## Page Structure

### 1. Landing Page (public)
- **Purpose:** First impression, explain what the tool does
- **Content:**
  - Hero section with headline and value proposition
  - Brief description of the 4 modules (Q&A, Contract Analysis, Clause Drafting, Book Writing)
  - Call-to-action: Login / Sign Up
- **Not behind auth**

### 2. Dashboard (authenticated)
- **Purpose:** Home base after login, quick access to all modules
- **Content:**
  - 4 module cards with icons and descriptions leading to each tool
  - Recent activity / recent queries (once usage data exists)
  - Corpus status overview (how many transcripts, chunks indexed)

### 3. Expert Q&A
- **Purpose:** Ask questions, get expert answers from the corpus
- **Layout:** Chat-style interface
- **Key components:**
  - Question input with send button
  - Streaming answer display with source citations
  - Metadata filters sidebar (wind park, insurance line, project phase)
  - Conversation history panel
  - Click-through to original transcript passages

### 4. Contract Analysis
- **Purpose:** Upload contracts, get AI-powered analysis
- **Layout:** Upload area + results panel
- **Key components:**
  - Drag-and-drop file upload (PDF/Word)
  - Processing status indicator
  - Clause-by-clause breakdown view
  - Risk flags and coverage gap highlights
  - Regulatory compliance checklist
  - Export analysis report (PDF)

### 5. Clause Drafting
- **Purpose:** Generate insurance clauses from corpus best practices
- **Layout:** Configuration panel + editor
- **Key components:**
  - Insurance line selector (CAR, OAR, H&M, P&I, WECI)
  - Project type and risk profile inputs
  - Generated clause display with rich text editor
  - Referenced precedents from corpus
  - Version comparison view
  - Export to Word/PDF

### 6. Book Writing
- **Purpose:** Write the offshore wind insurance book using corpus material
- **Layout:** Chapter management + writing workspace
- **Key components:**
  - Chapter list / outline sidebar
  - Topic discovery results
  - Extracted passage viewer
  - Rich text editor for drafting (TinyMCE)
  - Export to formatted PDF/Word

### 7. Corpus Management
- **Purpose:** Upload and manage transcript files, monitor processing
- **Layout:** File manager + status dashboard
- **Key components:**
  - File upload (drag-and-drop, bulk)
  - Processing pipeline status (uploaded → chunked → embedded → indexed)
  - Metadata browser (browse by wind park, insurance line, phase)
  - Chunk preview and metadata viewer

### 8. Settings
- **Purpose:** User preferences and configuration
- **Content:**
  - Profile management
  - API key configuration (if needed)
  - Preferences

---

## Navigation

- **Top navbar:** Logo + app name, main navigation links, user avatar/menu
- **Navigation items:** Dashboard, Q&A, Contracts, Clauses, Book, Corpus, Settings
- **Mobile:** Responsive hamburger menu (lower priority, desktop-first)

---

## Build Order (aligned with product phases)

1. Landing Page + Auth + Dashboard (shell)
2. Corpus Management (needed to feed data into the system)
3. Expert Q&A (first usable module)
4. Contract Analysis
5. Clause Drafting
6. Book Writing
