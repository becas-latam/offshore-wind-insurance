# Knowledge Base for Risk Analysis

Add markdown (.md) files to these folders to improve AI risk analysis quality.
The model reads ALL files in the relevant folder before producing its analysis.

## Folders

- `construction/` — Knowledge specific to construction phase analysis (CAR, DSU, LEG clauses, contractor risks, etc.)
- `general/` — Knowledge applicable to all risk analyses (liability regimes, insurance principles, etc.)

## How it works

- When a **construction risk analysis** runs, the model receives all files from `construction/` + `general/`
- When a **general risk analysis** runs (Risk Analyzer), the model receives all files from `general/`
- Files are loaded in alphabetical order
- Keep files focused on one topic each for clarity

## What to include

- Specific workflows for checking contracts
- Checklists for insurance conditions
- Rules of thumb for LEG clause analysis
- Common pitfalls and red flags
- Industry standards and best practices
- Specific scenarios and how they should be assessed
- Anything the AI is getting wrong — write the correct approach here

## Example file

```markdown
# LEG 2 Sublimit Analysis

When analyzing LEG 2 sublimits, always check:
1. Is the sublimit per occurrence or aggregate?
2. Compare the sublimit to the total insured value of the component
3. If sublimit < 10% of component value, flag as HIGH risk
4. Serial defect scenarios can exhaust the sublimit quickly — flag this
```
