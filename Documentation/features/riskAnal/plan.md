# Risk Analyzer — Feature Plan

## Overview

A multi-step wizard that guides the user through contract/liability analysis for offshore wind service contracts. Collects structured inputs, uses OpenAI to identify stakeholders and generate a comprehensive risk assessment.

---

## User Flow (Step by Step)

### Step 1 — Contract Partners
- Input: Names of the contracting parties (free text, two fields: Party A / Party B)

### Step 2 — Your Role
- Selection: "Offshore Wind Farm Owner" or "Maintenance/Service Company"
- This determines the perspective of the risk analysis

### Step 3 — Scope of Work
- Input: Free text description (e.g., "Exchange of gearbox at Windpark Alpha")

### Step 4 — Contract Type
- Confirm: "Is this a Service Contract?" (Yes / No)
- Sub-question: "Does the contract include a vessel or charter of a vessel?" (Yes — Vessel / Yes — Charter / No)

### Step 5 — Liability Type
- Selection: "Negligence-based" or "Knock for Knock"

### Step 6 — Liability Exclusions
- Input: Free text — what is excluded from liability under the contract

### Step 7 — Consequential / Financial Losses
- Input: Free text — how the contract treats consequential and financial losses

### Step 8 — AI Stakeholder Identification
- Backend call to OpenAI
- Input: All data from Steps 1–7
- Output: List of possible third-party stakeholders (e.g., harbor authority, other vessels, subcontractors, grid operator, cable layer, crew, port facility, classification society)
- User sees the AI-suggested stakeholders as selectable options

### Step 9 — Select Relevant Stakeholders
- User picks which stakeholders apply to this contract (checkboxes)

### Step 10 — Liability per Stakeholder
- For each selected stakeholder, user describes the liability arrangement
- Input: Free text per stakeholder (e.g., "Harbor — limited liability, indemnity clause in place")

### Step 11 — AI Risk Analysis
- Backend call to OpenAI with ALL collected data
- AI produces a structured risk report:
  - **Risk Rating**: Overall risk level (High / Medium / Low) from the user's perspective
  - **Liability Exposure**: Where the user's client is most exposed given the liability regime
  - **Coverage Gaps**: What the exclusions and consequential loss clauses leave unprotected
  - **Stakeholder Risks**: For each selected stakeholder — what could go wrong and who bears the cost
  - **Recommendations**: Insurance coverage to consider, clauses to negotiate, red flags
- The AI prompt is crafted for offshore wind insurance domain expertise (K4K vs negligence regimes, vessel involvement, typical service contract exposures)

### Step 12 — Review & Save
- User reviews the full risk analysis
- Options: Save to Firestore, export (future), refine/re-run analysis

---

## Technical Architecture

### Frontend

- **Route**: `/risk-analyzer`
- **Page**: `src/pages/RiskAnalyzerPage.tsx`
- **Components**: `src/components/risk-analyzer/`
  - `RiskWizard.tsx` — Main stepper/wizard container, manages state across steps
  - `StepContractPartners.tsx` — Step 1
  - `StepRole.tsx` — Step 2
  - `StepScopeOfWork.tsx` — Step 3
  - `StepContractType.tsx` — Step 4
  - `StepLiabilityType.tsx` — Step 5
  - `StepExclusions.tsx` — Step 6
  - `StepConsequentialLosses.tsx` — Step 7
  - `StepStakeholderIdentification.tsx` — Step 8 (AI call + display results)
  - `StepSelectStakeholders.tsx` — Step 9
  - `StepStakeholderLiability.tsx` — Step 10
  - `StepRiskAnalysis.tsx` — Step 11 (AI call + display report)
  - `StepReview.tsx` — Step 12
- **Service**: `src/services/riskAnalyzerService.ts` — API calls to Python backend
- **UI**: shadcn stepper/progress indicator, cards, form inputs, checkboxes, markdown rendering for AI output

### Backend (Python API)

New endpoints in `python_functions/api.py`:

#### `POST /api/risk/stakeholders`
- Input: Contract data from Steps 1–7
- Calls OpenAI to identify possible stakeholders
- Returns: List of stakeholder names with brief descriptions

#### `POST /api/risk/analyze`
- Input: All contract data (Steps 1–7) + selected stakeholders + liability per stakeholder (Steps 9–10)
- Calls OpenAI with a domain-specific prompt for offshore wind insurance risk analysis
- Returns: Structured risk report (rating, exposure, gaps, stakeholder risks, recommendations)

New module: `python_functions/risk/analyzer.py`
- `identify_stakeholders(contract_data)` — Builds prompt, calls OpenAI, parses stakeholder list
- `analyze_risk(full_data)` — Builds prompt, calls OpenAI, returns structured report
- Contains the expert system prompts for offshore wind insurance context

New prompts: `python_functions/prompts/risk_prompts.py`
- `STAKEHOLDER_IDENTIFICATION_PROMPT` — System prompt for Step 8
- `RISK_ANALYSIS_PROMPT` — System prompt for Step 11

### Data Storage (Firestore)

```
users/{userId}/riskAnalyses/{analysisId}
  ├── contractPartners: { partyA: string, partyB: string }
  ├── role: "owner" | "maintenance"
  ├── scopeOfWork: string
  ├── contractType: { isServiceContract: boolean, vesselInvolvement: "vessel" | "charter" | "none" }
  ├── liabilityType: "negligence" | "knock_for_knock"
  ├── exclusions: string
  ├── consequentialLosses: string
  ├── stakeholders: [{ name: string, liability: string }]
  ├── aiAnalysis: { rating: string, exposure: string, gaps: string, stakeholderRisks: [...], recommendations: string }
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

---

## Build Order

### Phase 1 — Wizard UI (Steps 1–7)
1. Create `RiskAnalyzerPage.tsx` and add route
2. Build `RiskWizard.tsx` with stepper navigation and state management
3. Build Step 1–7 components (form inputs)
4. Add link from Dashboard to Risk Analyzer
5. Test navigation and data collection through the wizard

### Phase 2 — Stakeholder Identification (Step 8–9)
6. Create `python_functions/risk/analyzer.py` with `identify_stakeholders()`
7. Create `python_functions/prompts/risk_prompts.py` with stakeholder prompt
8. Add `POST /api/risk/stakeholders` endpoint to `api.py`
9. Build `StepStakeholderIdentification.tsx` and `StepSelectStakeholders.tsx`
10. Create `src/services/riskAnalyzerService.ts`
11. Test end-to-end: form data → API → OpenAI → stakeholder list displayed

### Phase 3 — Liability Input + Risk Analysis (Steps 10–11)
12. Build `StepStakeholderLiability.tsx`
13. Add `analyze_risk()` to `analyzer.py` with risk analysis prompt
14. Add `POST /api/risk/analyze` endpoint to `api.py`
15. Build `StepRiskAnalysis.tsx` with markdown rendering of the report
16. Test end-to-end: full flow → AI risk report

### Phase 4 — Save & Review (Step 12)
17. Create Firestore service for saving/loading analyses
18. Build `StepReview.tsx` with save functionality
19. Add saved analyses list to the Risk Analyzer page
20. Update Firestore security rules for `riskAnalyses` subcollection

---

## OpenAI Prompts (Draft Direction)

### Stakeholder Identification Prompt
The system prompt should instruct the model to act as an offshore wind insurance expert. Given the contract details (parties, scope, liability type, vessel involvement), it identifies all possible third-party stakeholders that could be affected or involved in liability scenarios. Output: JSON array of stakeholder objects with name and description.

### Risk Analysis Prompt
The system prompt should instruct the model to act as a senior offshore wind insurance risk analyst. It should understand:
- The difference between Knock for Knock and negligence-based liability
- How vessel involvement changes the risk profile (maritime law implications)
- Typical exposure patterns in offshore wind service contracts
- Common coverage gaps in the offshore energy insurance market
- How exclusions and consequential loss clauses interact with liability regimes

Output: Structured JSON with rating, exposure analysis, coverage gaps, per-stakeholder risk breakdown, and actionable recommendations.
