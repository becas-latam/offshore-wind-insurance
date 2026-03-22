# Risk Analysis Knowledge Base

## Overview

The risk analysis features (both the general Risk Analyzer and the construction-phase analysis) use a file-based knowledge system to improve AI output quality. Domain-specific knowledge is stored as markdown files and injected into the AI prompt alongside the system instructions.

---

## Folder Structure

```
python_functions/knowledge/
├── README.md                        ← Instructions for adding knowledge
├── loader.py                        ← Loads files into prompts (do not edit)
├── construction/                    ← Construction-phase specific knowledge
│   ├── 01-leg-analysis.md
│   ├── 02-marine-insurance.md
│   └── (add more files here)
└── general/                         ← Knowledge for ALL risk analyses
    ├── 01-liability-regimes.md
    └── (add more files here)
```

## Which Files Are Loaded Where

| Analysis Type | Folders Loaded |
|---|---|
| Construction Risk (per contractor) | `construction/` + `general/` |
| General Risk Analyzer (Step 11) | `general/` |
| Stakeholder Identification (Step 8) | `general/` |

## How It Works

1. When a risk analysis runs, the `loader.py` module reads all `.md` files from the relevant folders
2. Files are loaded in **alphabetical order** — use numeric prefixes (`01-`, `02-`) to control the order
3. File contents are concatenated and appended to the AI system prompt as "Domain Knowledge"
4. The AI model reads this knowledge before producing its analysis
5. `README.md` files in each folder are skipped automatically

## How to Add Knowledge

Create a new `.md` file in the appropriate folder:

- **`construction/`** — For knowledge specific to construction phase (CAR, DSU, LEG clauses, contractor relationships, take over of works, etc.)
- **`general/`** — For knowledge that applies to all analyses (liability regimes, insurance principles, deductible analysis, etc.)

### File Format

Use standard markdown. Structure your knowledge clearly:

```markdown
# Topic Name

## Key Principles
- Point 1
- Point 2

## Red Flags
- What to look out for

## Rules of Thumb
- How to assess specific scenarios
```

### What to Include

- **Workflows** — Step-by-step processes for checking contracts or insurance conditions
- **Checklists** — Items that must be verified for each analysis
- **Red flags** — Conditions that should trigger a HIGH risk rating
- **Rules of thumb** — Thresholds and benchmarks (e.g., "sublimit < 20% of component value = inadequate")
- **Common pitfalls** — Mistakes or gaps the AI tends to overlook
- **Industry standards** — What is considered market practice
- **Specific scenarios** — Example situations and how they should be assessed
- **Corrections** — If the AI is getting something wrong, write the correct approach

### Example Topics for Construction

- LEG clause analysis and sublimit adequacy
- Marine insurance conditions (co-insurance, waiver of subrogation)
- Serial defect exposure for WTG components
- Take over of works — what changes in the risk profile
- Extended maintenance vs warranty maintenance
- CAR deductible analysis (per-peril deductibles)
- DSU waiting period adequacy
- Contractor liability cap benchmarks
- EPCI vs split contract risk differences

### Example Topics for General

- Liability regime comparison (K4K vs negligence)
- Maximum liability cap analysis
- Consequential loss exclusion impact
- Vessel involvement and maritime law implications
- Insurance coverage gap identification
- Third-party liability exposure

## Tips

- Keep files **focused on one topic** — easier to maintain and update
- Be **specific** — "sublimit < 20% is inadequate" is better than "check if sublimit is adequate"
- Include **why** — explain the reasoning so the AI can apply it to edge cases
- **Update regularly** — if the AI output improves but still misses something, add more detail
- Files take effect immediately after saving — just restart the Python server

## Current Knowledge Files

### `construction/01-leg-analysis.md`
Guidelines for analyzing LEG 1/2/3 clauses, sublimit adequacy, and serial defect exposure.

### `construction/02-marine-insurance.md`
Rules for assessing H&M/P&I co-insurance and waiver of subrogation conditions, with risk ratings per scenario.

### `general/01-liability-regimes.md`
Analysis framework for Knock for Knock vs negligence-based liability, and maximum liability cap assessment.
