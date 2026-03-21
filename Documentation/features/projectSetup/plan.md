# Project Setup / Onboarding — Feature Plan

## Overview

A guided onboarding workflow where the user sets up an offshore wind farm project. The setup captures the wind farm identity, project phase (construction or operation), insurance structure, contractor/subcontractor details, and insurance conditions per contractor. This data forms the foundation for all downstream analysis (risk analyzer, contract review, etc.).

---

## User Flow

### Step 1 — Wind Farm Identity
- Input: Wind farm name (free text) or choose anonymous label ("Offshore Wind Farm 1", "Offshore Wind Farm 2", etc.)
- Privacy-first: user is not required to disclose the real name

### Step 2 — Project Phase
- Selection: **Construction** or **Operation**
- This determines the entire downstream flow

---

## Operation Phase Flow

### Step 3O — Year Start of Operations
- Input: Year (e.g., 2023)

### Step 4O — Insurance Coverage
- Property Damage: Yes / No
- Business Interruption (BI): Yes / No

### Step 5O — Deductible
Property Damage
- Input: Deductible amount (free text or number, e.g., "€500,000" or "500000")

Business Interruption
- In days.

### Step 6O — Warranty
- Default assumption: 5-year warranty
- User confirms or overrides
- If override: user fills a table of contractors with non-standard warranty periods:
  | Contractor | Component | Warranty Duration | Notes |
  |---|---|---|---|
  | (user adds rows) | | | |

### Step 7O — WTG Service Contract
- Selection:
  - **Full Service Contract** — service company handles everything
  - **Break-Fix** — service company exchanges components, employer pays for parts

---

## Construction Phase Flow

### Step 3C — Insurance Coverage
- Property Damage (CAR): Yes / No
- Delay in Start-Up (DSU): Yes / No
- Assumption displayed: Contractors and subcontractors are co-insured under the CAR policy

### Step 4C — CAR Deductible
Property Damage
- Input: Deductible amount. User can add more than one deductible. 

DSU:
- Input: Deductible amount, normally days.

### Step 5C — Contracts & Contractors Table
The core of the construction setup. User builds a table of all major contracts. Each row represents a contractor.

**Table columns:**

| Column | Type | Notes |
|---|---|---|
| Contractor Name | Text | e.g., "Siemens Gamesa", "Jan De Nul" |
| Scope | Multi-select | WTG, Foundations, IAC, Transition Piece, Other |
| Contract Type | Select | EPCI / Supply / T&I |
| Extended Maintenance | Yes/No + Duration | Duration in months, starts after Take Over of Works |
| Warranty Maintenance | Yes/No + Duration | Duration in months |
| Take Over of Works Date | Date (optional) | Insurance clause reference point — extended maintenance starts here |

**Notes on scope:**
- Foundations: if monopile, user gets an additional prompt asking if there is a separate Transition Piece contract (optional — sometimes integrated)
- Traditional model: EPCI (single contract covers everything)
- Modern model: separate Supply and T&I contracts per scope (e.g., "WTG Supply" + "WTG T&I" = two rows)
- User can add as many rows as needed

### Step 6C — LEG Clauses
For each contractor in the table, user specifies:

| Column | Type | Notes |
|---|---|---|
| LEG Clause | Select | LEG 1 / LEG 2 / LEG 3 |
| LEG 2 Sublimit | Number (optional) | Only if LEG 2 selected |

**For WTG contractors specifically**, the user fills a component-level breakdown:

| WTG Component | LEG Clause | Sublimit |
|---|---|---|
| Gearbox | LEG 2 / LEG 3 | (if LEG 2) |
| Blades | LEG 2 / LEG 3 | |
| Generator | LEG 2 / LEG 3 | |
| Transformer | LEG 2 / LEG 3 | |
| (user can add more) | | |

### Step 7C — Insurance Conditions per Contractor
For each contractor, user specifies the agreed insurance conditions:

| Column | Type | Notes |
|---|---|---|
| Employer Co-insured | Yes / No | Employer (wind farm owner) named as co-insured on contractor's policy |
| Waiver of Subrogation (H&M) | Yes / No | Contractor's H&M insurer waives subrogation rights against employer |
| Waiver of Subrogation (P&I) | Yes / No | Contractor's P&I insurer waives subrogation rights against employer |
| Liability Type | Select | Negligence-based / Knock for Knock |
| Liability Exclusions | Text | Free text description |
| Maximum Liability | Text/Number | Cap on contractor's liability |

### Step 8C — Warranty Overview
- Default assumption: 5-year warranty displayed
- User confirms or overrides per contractor:
  | Contractor | Component | Warranty Duration | Notes |
  |---|---|---|---|
  | (user adds rows for non-standard warranties) | | | |

---

## Skip & Missing Data

- User can **skip any step** at any time
- Skipped fields are marked as "Missing" in the project overview
- A summary view shows what information is complete vs. missing
- User can return to any step to fill in data later

---

## Technical Architecture

### Frontend

- **Route**: `/project-setup` (new project) and `/project/:id` (edit existing)
- **Page**: `src/pages/ProjectSetupPage.tsx`
- **Components**: `src/components/project-setup/`
  - `SetupWizard.tsx` — Main stepper container with phase branching
  - `StepWindFarm.tsx` — Step 1
  - `StepPhase.tsx` — Step 2
  - **Operation steps:**
    - `StepOperationYear.tsx`
    - `StepOperationInsurance.tsx`
    - `StepOperationDeductible.tsx`
    - `StepOperationWarranty.tsx`
    - `StepOperationServiceContract.tsx`
  - **Construction steps:**
    - `StepConstructionInsurance.tsx`
    - `StepConstructionDeductible.tsx`
    - `StepContractorTable.tsx` — Editable table with add/remove rows
    - `StepLEGClauses.tsx` — LEG per contractor + WTG component breakdown
    - `StepInsuranceConditions.tsx` — Insurance conditions per contractor
    - `StepConstructionWarranty.tsx`
  - **Shared:**
    - `EditableTable.tsx` — Reusable editable table component (add rows, remove rows, inline editing)
    - `ProjectSummary.tsx` — Overview showing complete vs. missing data

### Data Storage (Firestore)

```
users/{userId}/projects/{projectId}
  ├── name: string                          // Wind farm name or "Offshore Wind Farm 1"
  ├── phase: "construction" | "operation"
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  │
  ├── // Operation fields
  ├── operationStartYear: number | null
  ├── insurancePropertyDamage: boolean | null
  ├── insuranceBI: boolean | null            // Business Interruption
  ├── deductible: string | null
  ├── warrantyYears: number                  // default 5
  ├── warrantyOverrides: [{ contractor, component, duration, notes }]
  ├── serviceContractType: "full_service" | "break_fix" | null
  │
  ├── // Construction fields
  ├── insuranceCAR: boolean | null           // Property Damage (CAR)
  ├── insuranceDSU: boolean | null           // Delay in Start-Up
  ├── carDeductible: string | null
  ├── contractors: [{
  │     id: string
  │     name: string
  │     scope: string[]                      // ["WTG", "Foundations", "IAC", "TransitionPiece", "Other"]
  │     contractType: "EPCI" | "Supply" | "T&I"
  │     extendedMaintenance: boolean | null
  │     extendedMaintenanceDuration: number | null  // months
  │     warrantyMaintenance: boolean | null
  │     warrantyMaintenanceDuration: number | null  // months
  │     takeOverDate: string | null          // ISO date
  │     legClause: "LEG1" | "LEG2" | "LEG3" | null
  │     leg2Sublimit: string | null
  │     wtgComponents: [{                    // only for WTG scope
  │       component: string
  │       legClause: "LEG2" | "LEG3"
  │       sublimit: string | null
  │     }]
  │     // Insurance conditions
  │     employerCoInsured: boolean | null
  │     waiverSubrogationHM: boolean | null
  │     waiverSubrogationPI: boolean | null
  │     liabilityType: "negligence" | "knock_for_knock" | null
  │     liabilityExclusions: string | null
  │     maximumLiability: string | null
  │   }]
  ├── constructionWarrantyYears: number      // default 5
  ├── constructionWarrantyOverrides: [{ contractor, component, duration, notes }]
```

### Firestore Rules

Add to existing rules:
```
match /projects/{projectId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Build Order

### Phase 1 — Common Steps + Routing
1. Create `ProjectSetupPage.tsx` with wizard container
2. Build Step 1 (Wind Farm name) and Step 2 (Phase selection)
3. Add route `/project-setup` and `/project/:id`
4. Add to Dashboard and Navbar
5. Create Firestore service `src/services/projectStore.ts`
6. Update Firestore rules

### Phase 2 — Operation Flow
7. Build operation steps (year, insurance, deductible, warranty, service contract)
8. Wire up Firestore persistence (auto-save per step)
9. Test end-to-end operation flow

### Phase 3 — Construction Flow (Core)
10. Build `EditableTable.tsx` reusable component
11. Build construction insurance + deductible steps
12. Build contractor table step (add/remove rows, scope, contract type, maintenance, take over date)
13. Wire up Firestore persistence

### Phase 4 — Construction Flow (LEG & Insurance)
14. Build LEG clauses step (per contractor + WTG component breakdown)
15. Build insurance conditions per contractor step
16. Build construction warranty step
17. Test full construction flow

### Phase 5 — Summary & Polish
18. Build `ProjectSummary.tsx` showing complete vs. missing fields
19. Add sidebar with saved projects (similar to Risk Analyzer)
20. Allow editing any step from summary view
21. Skip functionality — mark fields as missing, show indicators

---

## Domain Notes

### LEG Clauses (London Engineering Group)
- **LEG 1** (DE1): Broadest defect exclusion — excludes all damage arising from defective design, materials, or workmanship, including consequential damage
- **LEG 2** (DE2): Excludes cost of replacing the defective part itself, but covers resulting damage to other parts of the insured property. Often has a sublimit.
- **LEG 3** (DE3): Narrowest exclusion — only excludes the cost of improving the original defective design/material/workmanship. Most favorable for the insured.

### Contract Structure Evolution
- **Traditional**: EPCI — one contractor handles Engineering, Procurement, Construction & Installation
- **Modern trend**: Split contracts — separate Supply and T&I contracts per scope area
- Example for a wind farm with monopiles:
  - Foundations Supply (monopiles + transition pieces OR separate TP contract)
  - Foundations T&I
  - WTG Supply
  - WTG T&I
  - IAC Supply
  - IAC T&I
  - Export Cable (may be separate)
  - Offshore Substation (may be EPCI or split)

### Insurance Chain in Construction
- **Employer (wind farm owner)** takes out CAR +/- DSU policy
- Contractors and subcontractors are typically **co-insured** under the CAR
- Each contractor has their own **H&M** (for vessels) and **P&I** policies
- Key insurance conditions negotiated per contractor:
  - Is employer named as co-insured on contractor's H&M/P&I?
  - Does contractor's insurer waive subrogation rights against employer?
- These conditions determine whether the employer is protected if a contractor's vessel causes damage

### Take Over of Works
- Contractual milestone when the employer formally accepts the completed works
- Triggers the start of extended maintenance / warranty maintenance periods
- Referenced in insurance policy wording — coverage terms may change after take over
