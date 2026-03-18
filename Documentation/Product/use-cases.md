# Use Cases & Modules

> **Last updated:** March 2026

---

## Overview

The system serves as a **professional workspace for offshore wind insurance**, not just a search tool. It combines the RAG knowledge base with specialized tools for daily insurance work.

---

## Module 1: Expert Q&A

**Purpose:** Ask questions about offshore wind insurance and get expert-level answers backed by the transcript corpus.

**Examples:**
- "What are the typical CAR deductible structures for North Sea wind farms?"
- "What risks were discussed for Windpark Alpha during the construction phase?"
- "How does WECI coverage interact with delay-in-start-up clauses?"

**How it works:**
1. User types a question
2. System retrieves relevant transcript chunks from Qdrant (filtered by wind park, insurance line, phase)
3. LLM generates an answer citing specific sources
4. User can drill into the original transcript passages

---

## Module 2: Book Writing Pipeline

**Purpose:** Use the corpus as primary source material to write a practitioner-focused book on offshore wind insurance.

**Workflow:**
1. **Topic Discovery** — AI mines the corpus to identify recurring themes and potential chapters
2. **Deep Extraction** — For each chapter, extract all relevant passages across the full corpus
3. **AI-Assisted Drafting** — Generate structured drafts from extracted material
4. **Review & Edit** — Human review with inline editing tools
5. **Export** — Generate formatted output (PDF, Word)

---

## Module 3: Contract Analysis

**Purpose:** Upload insurance contracts (PDF/Word) and get AI-powered analysis.

**Features:**
- Clause-by-clause breakdown and explanation
- Risk identification and coverage gaps
- Comparison against best practices from the corpus
- Regulatory compliance checks (VVG, WindSeeG, Solvency II)
- Highlight unusual or problematic terms

**How it works:**
1. User uploads a contract document
2. System parses and extracts clauses
3. Each clause is analyzed against the knowledge base
4. Report generated with findings, risks, and recommendations

---

## Module 4: Clause Drafting

**Purpose:** Generate insurance clauses and policy language based on best practices from the corpus and industry standards.

**Features:**
- Draft clauses for specific insurance lines (CAR, OAR, H&M, P&I, WECI)
- Customize for specific wind farm projects or risk profiles
- Reference precedents from the corpus
- Support German legal framework requirements (VVG, BGB)
- Version comparison — compare drafted clauses against existing ones

**How it works:**
1. User selects insurance line, project type, and requirements
2. System retrieves relevant precedents from the knowledge base
3. LLM drafts clause language incorporating best practices
4. User edits, refines, and exports

---

## Shared Foundation

All four modules share the same backend:
- **Transcript corpus** in Qdrant (chunked, embedded, metadata-tagged)
- **Document processing** for uploaded contracts (PDF/Word parsing)
- **LLM generation** with the expert persona system prompt
- **Firebase** for auth, user data, saved analyses, and file storage

---

## Architecture Impact

| Capability | Required For |
|-----------|-------------|
| RAG retrieval (Qdrant + LlamaIndex) | All modules |
| Document upload & parsing (PDF/Word) | Contract Analysis, Book Writing |
| Streaming LLM responses | Expert Q&A, Clause Drafting |
| Rich text editor | Book Writing, Clause Drafting |
| Export (PDF/Word) | Book Writing, Contract Analysis, Clause Drafting |
| Metadata filtering (wind park, insurance line, phase) | Expert Q&A, Book Writing |
| File storage (Firebase Storage) | Contract Analysis, Book Writing |
| Conversation history | Expert Q&A |
