# Offshore Wind — Construction Phase Insurance & Risk Analysis: LLM Reference

> **Purpose**: This document is the authoritative reference for analysing insurance and liability risk during the construction phase of offshore wind farm projects. It corrects known errors in prior analyses and provides decision logic, definitions, and constraints the model must follow.

---

## 1. Foundational Concepts

### 1.1 CAR Policy Structure in Offshore Wind

The **Employer** (project owner) procures the Construction All Risk (CAR) insurance policy for the project. The CAR policy covers physical loss or damage to the insured property (the works) during the construction period.

**Co-insurance**: Contractors and subcontractors are added as co-insured parties under the Employer's CAR policy. Co-insurance means:
- Claims for loss or damage within the construction scope are handled under the single CAR policy.
- Cross-liability between co-insured parties is managed within the policy (no party sues another's insurer — all are under one policy).
- Co-insurance status lasts until **Take Over** of the relevant scope, unless extended by a maintenance or defects notification period.

**What CAR covers**: Physical loss or damage to the insured works from insured perils (fire, storm, accidental damage, contractor error/negligence during execution, etc.).

**What CAR does not cover** (standard exclusions):
- Defects in design, material, or workmanship — **the defective item itself** is excluded (the scope of exclusion depends on the LEG clause; see Section 2).
- Consequential losses / loss of revenue (these require DSU; see Section 3).
- Wear and tear, gradual deterioration, inherent vice.
- War, nuclear, sanctions (standard market exclusions).

### 1.2 The Relationship Between Insurance and Contractual Liability

This is a critical distinction. **Insurance determines what the insurer pays. The contract determines what the contractor pays.** These are separate and must not be conflated.

- The CAR insurer's obligations are defined by the policy wording (including LEG clauses, exclusions, deductibles, limits).
- The contractor's obligations are defined by the construction contract (including warranties, liability caps, indemnities, LDs).
- The Manufacturer's Warranty (OEM warranty) is a contractual obligation — it is not insurance.

**When the CAR policy excludes something (e.g., the defective item under LEG2), this does NOT mean the Employer pays.** It means the CAR insurer does not pay. The cost falls to whoever is contractually liable — typically the contractor or OEM under warranty.

The model must always trace the risk through this chain:
1. Is it covered by insurance? → If yes, insurer pays (subject to deductible).
2. If not covered by insurance, is the contractor/OEM contractually liable? → If yes, contractor/OEM pays.
3. Only if neither insurance nor contractual liability covers the loss → Employer bears the residual risk.

---

## 2. LEG Clauses — Defects Exclusion Regime

LEG (London Engineering Group) clauses define **how the CAR policy treats loss or damage caused by defects in design, material, or workmanship**. They do NOT eliminate coverage for resulting damage — they define the boundary of what the insurer excludes.

### 2.1 LEG Clause Definitions

**LEG 1 (Outright Exclusion)**:
Excludes all loss or damage arising from defects in design, material, or workmanship. Both the defective item AND resulting damage are excluded. This is the most restrictive — rarely used for major components in modern offshore wind CAR policies.

**LEG 2 (Defective Part Exclusion)**:
Excludes the **cost of replacing or repairing the defective item itself**, but covers **resulting damage** to other parts of the insured works. Example: If a defective gearbox causes damage to the nacelle structure, the CAR insurer pays for the nacelle repair but NOT for the replacement gearbox.

**LEG 3 (Improvement/Betterment Exclusion)**:
Excludes only the **additional cost of improvement or betterment** beyond the original specification. The cost to replace/repair the defective item to its original specification IS covered. Only the incremental cost of redesign/improvement is excluded. This is the most favourable for the insured.

### 2.2 Critical Rule: LEG Exclusions ≠ Employer Exposure

**The model must NEVER state that LEG2 exclusion of the defective item means the Employer bears the replacement cost, without first checking:**
1. Does the **Manufacturer's Warranty clause** require the OEM to replace the defective item? (Usually yes — see Section 4.)
2. Does the **contractor's contractual liability** require them to make good defective work? (Usually yes during construction.)
3. Is there a **supplier/OEM product warranty** that covers the component?

Only if ALL of these are absent or inadequate should the model flag LEG2 component replacement as an Employer exposure.

### 2.3 Defective Workmanship vs. Contractor Error/Negligence

This distinction is critical for coverage analysis:

- **Defective workmanship** (LEG clause territory): Work that creates a **latent defect** — an intermediate state where the work is defective but not yet damaged. The defect exists silently until it manifests as damage. LEG clauses govern how the insurer treats this.
- **Contractor error/negligence** (NOT defective workmanship): Immediate physical damage from poor execution. There is no intermediate "defective but undamaged" state — the work goes directly from installation to damage. This IS covered under CAR/OAR/FLEXA policies as a standard insured peril. LEG clauses do not apply.

**Example**: A crane operator drops a blade during installation → contractor negligence → full CAR coverage (subject to deductible). A blade is manufactured with an internal lamination flaw that causes cracking 12 months later → defective workmanship → LEG clause applies.

---

## 3. DSU (Delay in Start-Up)

### 3.1 What DSU Covers
DSU covers **financial losses from delay to commercial operation** caused by insured physical damage. It is the revenue-protection counterpart to CAR's property-damage protection. DSU has:
- A **waiting period** (time deductible — e.g., 60 days — before indemnity begins).
- An **indemnity period** (maximum duration of cover — e.g., 12 or 24 months).
- A **basis of recovery** (how lost revenue is calculated — e.g., projected generation revenue minus saved costs).

### 3.2 DSU Absence — Balanced Assessment
Many offshore wind projects **deliberately do not purchase DSU**. This is not automatically a catastrophic gap. The model must consider:
- **Contractual Liquidated Damages (LDs)**: If the contract includes LDs for delay, these provide a contractual (non-insurance) recovery path for delay costs. LD rates, caps, and triggers must be assessed.
- **Project stage**: DSU exposure depends on how close the project is to revenue generation. Early construction has lower DSU exposure than late commissioning.
- **Cost vs. benefit**: DSU premiums for offshore wind are high and the waiting period means short delays are uninsured anyway.

**The model should flag DSU absence as a risk factor, but must also assess the adequacy of contractual LDs and the project timeline before characterising it as "the single largest exposure."** DSU absence combined with weak or capped LDs and late-stage construction = high risk. DSU absence with robust LDs and early-stage construction = moderate/manageable risk.

---

## 4. Manufacturer's Warranty Clause

### 4.1 What It Is
The Manufacturer's Warranty clause is a **contractual obligation** (not insurance) under which the OEM/manufacturer is required to repair or replace defective components at their own cost. In offshore wind, this typically applies to WTG components (turbines, blades, gearboxes, generators, transformers, converters) and may also apply to cables, foundations, and substations depending on contract structure.

### 4.2 Why It Matters for Risk Analysis
The Manufacturer's Warranty is the **primary commercial mechanism that covers the gap created by LEG2**. Where LEG2 excludes the cost of the defective item itself from CAR coverage, the Manufacturer's Warranty requires the OEM to replace that item at OEM cost.

**The model must always ask whether a Manufacturer's Warranty clause exists before assessing LEG2 exposure.** If it does:
- The defective item replacement cost is the OEM's obligation, not the Employer's.
- The remaining question is the **scope** of the warranty: does it cover only the component, or also T&I (transport and installation) costs for the replacement? Does it cover consequential delay?

### 4.3 Scope Variations
- **Narrow warranty**: OEM replaces the defective component ex-works. Employer/contractor bears T&I costs to remove the old and install the new component.
- **Broad warranty**: OEM replaces the component AND covers T&I and potentially standby/delay costs.
- **With recall/serial defect obligation**: OEM must proactively inspect and replace all affected units if a serial defect is identified.

### 4.4 Required User Input
The app **must** require the user to specify:
- Manufacturer's Warranty clause: **yes / no**
- If yes: scope — **replacement only / replacement + T&I / replacement + T&I + delay costs**
- Serial defect / recall obligation: **yes / no**
- Warranty duration (years from Take Over)

---

## 5. Deductible Allocation

### 5.1 The Rule

**CRITICAL — MOST COMMON ERROR IN PRIOR ANALYSES**

The CAR policy deductible defines the amount that must be paid before the insurer indemnifies. **Who pays the deductible is determined by the construction contract, NOT by the insurance policy.**

In the standard offshore wind EPCI/construction contract:
- **The contractor bears the deductible** for CAR claims arising from loss or damage within their scope of work during the construction period.
- The Employer bears the deductible only for claims arising from Employer-caused events or for claims during the operational/maintenance period after Take Over.

**The model must NEVER assume the Employer bears the CAR deductible for contractor-scope claims unless the user explicitly confirms this is the contractual allocation.**

### 5.2 Default Assumption
If the user does not specify deductible allocation:
- **Default**: Contractor bears the deductible for claims arising from their scope.
- The model should flag this as an assumption and recommend the user confirm.

### 5.3 Required User Input
- Who bears the CAR deductible for contractor-scope claims: **Contractor / Employer / Shared (specify split)**
- If shared: mechanism (e.g., first €X to contractor, remainder to Employer up to deductible; or 50/50; etc.)

---

## 6. Liability Regime

### 6.1 Negligence-Based Liability
Under a negligence regime, the Employer must **prove the contractor was at fault** (failed to exercise reasonable care) to recover losses not covered by insurance. This is standard in many offshore wind EPCI contracts. It is NOT inherently problematic — it is a deliberate contractual design choice.

**Advantages**: Employer retains right to claim against contractor for fault-based damage. Incentivises careful performance.
**Disadvantages**: Evidentiary burden on Employer. Slower recovery. May require dispute resolution.

### 6.2 Knock-for-Knock (K4K)
Under K4K, each party bears responsibility for loss/damage to their own property and injury to their own personnel, **regardless of fault**. K4K is more common in multi-contractor marine operations (e.g., vessel charters, T&I campaigns with multiple contractors working simultaneously).

**Advantages**: No fault disputes. Clean risk separation. Faster resolution. Each party insures own risk.
**Disadvantages**: Employer cannot recover from contractor even if contractor was clearly at fault (unless carve-outs for gross negligence/wilful misconduct exist).

### 6.3 Hybrid
Some contracts use K4K for certain risk categories (e.g., vessel damage, personnel injury) and negligence-based liability for others (e.g., damage to the works, delay). This is common and the model should allow for it.

### 6.4 Assessment Guidance
The model should NOT characterise negligence-based liability as a "risk" or "gap" in itself. Instead, it should assess:
- Is the regime **appropriate for the contract type**? (Negligence is normal for EPCI; K4K is normal for marine charters.)
- Are the **evidentiary provisions adequate**? (Documentation obligations, inspection rights, audit rights.)
- Are there **carve-outs** from K4K for gross negligence and wilful misconduct?
- Does the regime align with the **insurance structure**? (K4K works with each party insuring own risk; negligence works with co-insurance under a single CAR policy.)

---

## 7. Serial Loss / Serial Defect

### 7.1 Serial Loss Clause in CAR
Most CAR policies include a **serial loss clause** that aggregates multiple losses arising from the same defect, design flaw, or common cause into a **single occurrence**. This means:
- One deductible applies to the aggregated loss, not one per unit.
- The policy limit applies once to the aggregated loss.
- The aggregation period is defined in the policy (typically 72 hours for weather events; for serial defects, the entire series may be treated as one occurrence).

### 7.2 Impact on Analysis
The model must NOT treat serial defects as if each affected unit triggers a separate deductible. If a serial loss clause exists, the deductible applies once to the entire series.

### 7.3 Required User Input
- Serial loss clause: **yes / no**
- If yes: aggregation mechanism (single occurrence / 72-hour clause / other)

---

## 8. Marine Protections

### 8.1 Employer Co-Insurance on H&M and P&I
During construction, the contractor uses vessels for T&I (transport and installation). The contractor's vessels are insured under their own H&M (Hull & Machinery) and P&I (Protection & Indemnity) policies.

**Best practice**: The Employer is added as **co-insured** on the contractor's H&M and P&I policies, with **waivers of subrogation** in favour of the Employer. This means:
- If a contractor vessel causes damage to the works, the vessel insurer cannot subrogate against the Employer.
- The CAR policy responds for damage to the works; the H&M/P&I respond for vessel damage/liability; no cross-claims between insurers.

### 8.2 Required User Input
- Employer co-insured on contractor's H&M: **yes / no**
- Employer co-insured on contractor's P&I: **yes / no**
- Waiver of subrogation on H&M: **yes / no**
- Waiver of subrogation on P&I: **yes / no**

---

## 9. Extended Maintenance / Defects Notification Period

### 9.1 What It Covers
After Take Over, the CAR policy may continue to provide limited cover during an **Extended Maintenance Period** (EMP) or **Defects Notification Period** (DNP). This cover is limited to:
- Loss or damage that **originated during the construction period** (i.e., the root cause is in construction, even if the damage manifests later).
- Damage caused by the contractor returning to site to remedy defects (e.g., contractor damages adjacent equipment while repairing a punch-list item).

**It does NOT cover**: Operational risks, new damage from operational perils, or defects in design/material/workmanship that are subject to LEG exclusions (unless LEG3 applies and the damage is within scope).

### 9.2 Interaction with Manufacturer's Warranty
The EMP/DNP and the Manufacturer's Warranty often run in parallel:
- EMP/DNP provides insurance cover for construction-origin damage discovered post-Take Over.
- Manufacturer's Warranty provides contractual OEM obligation to replace defective components.
- They complement each other: EMP/DNP covers resulting damage to other property; Manufacturer's Warranty covers the defective item itself.

### 9.3 Required User Input
- Extended Maintenance / Defects Notification Period: **yes / no**
- Duration (months/years from Take Over)
- Scope limitations (if any)

---

## 10. Required User Inputs — Complete Checklist

The app must collect the following before generating a construction-phase risk analysis:

### Insurance Inputs
| Input | Options / Format | Required |
|---|---|---|
| CAR policy in place | yes / no | Yes |
| CAR deductible — standard | Amount (EUR/USD/GBP) | Yes |
| CAR deductible — natural catastrophe | Amount | If applicable |
| CAR deductible — cable-specific | Amount | If applicable |
| CAR policy limit | Amount | Yes |
| **Deductible borne by** | **Contractor / Employer / Shared** | **Yes — critical** |
| DSU in place | yes / no | Yes |
| DSU waiting period | Days | If DSU = yes |
| DSU indemnity period | Months | If DSU = yes |
| LEG clause per component category | LEG1 / LEG2 / LEG3 | Yes |
| LEG sublimits | Amount per component category | If known |
| Serial loss clause | yes / no | Yes |
| Serial loss aggregation mechanism | Single occurrence / 72h / other | If serial loss = yes |

### Contractual Inputs
| Input | Options / Format | Required |
|---|---|---|
| **Manufacturer's Warranty clause** | **yes / no** | **Yes — critical** |
| Warranty scope | Replacement only / + T&I / + T&I + delay | If MW = yes |
| Serial defect / recall obligation | yes / no | If MW = yes |
| Warranty duration | Years from Take Over | If MW = yes |
| Liability regime | Negligence / K4K / Hybrid | Yes |
| Contractor liability cap | Amount or % of contract value | Yes |
| Liability cap carve-outs | Gross negligence, wilful misconduct, etc. | If cap specified |
| Contractual LDs for delay | yes / no | Yes |
| LD daily rate | Amount | If LDs = yes |
| LD cap | Amount or % of contract value | If LDs = yes |
| Performance security (bonds, PCGs) | yes / no, amounts | Recommended |

### Marine Inputs
| Input | Options / Format | Required |
|---|---|---|
| Employer co-insured on H&M | yes / no | Yes |
| Employer co-insured on P&I | yes / no | Yes |
| Waiver of subrogation — H&M | yes / no | Yes |
| Waiver of subrogation — P&I | yes / no | Yes |

### Post-Take Over Inputs
| Input | Options / Format | Required |
|---|---|---|
| Extended Maintenance / DNP | yes / no | Yes |
| EMP/DNP duration | Months/years | If yes |
| EMP/DNP scope limitations | Free text | If known |

---

## 11. Risk Assessment Decision Logic

For each identified risk event during construction, the model must follow this sequence:

```
STEP 1: IDENTIFY THE EVENT
  → Physical damage? Defect? Delay? Third-party liability?

STEP 2: IS IT INSURED UNDER CAR?
  → Check: Is it an insured peril? Is it excluded?
  → If physical damage from contractor error/negligence → YES, CAR covers (not a LEG issue)
  → If defective workmanship (latent defect) → CAR covers RESULTING DAMAGE, but check LEG clause for the defective item itself

STEP 3: IF LEG EXCLUDES THE DEFECTIVE ITEM (LEG1 or LEG2):
  → Does Manufacturer's Warranty cover replacement? 
    → YES → OEM pays for defective item. Flag only if warranty scope is narrow (e.g., no T&I coverage)
    → NO → Is contractor contractually liable to make good?
      → YES → Contractor pays
      → NO → EMPLOYER EXPOSURE — flag this

STEP 4: WHO BEARS THE DEDUCTIBLE?
  → Check contractual allocation (NOT the policy — the contract)
  → Default: Contractor bears deductible for claims from their scope
  → Only flag as Employer exposure if contract allocates deductible to Employer

STEP 5: IS DELAY COVERED?
  → DSU in place? → If yes, check waiting period and indemnity period adequacy
  → If no DSU: Are contractual LDs adequate? 
    → YES → Delay cost mitigated contractually
    → NO → EMPLOYER EXPOSURE for delay costs — flag this

STEP 6: WHAT IS THE LIABILITY RECOVERY PATH?
  → Insurance (CAR, H&M, P&I) → Contractual (warranty, indemnity, LDs) → Residual Employer risk
  → Only the residual after both insurance AND contractual recovery is the true Employer exposure

STEP 7: RATE THE RESIDUAL RISK
  → Considering: probability, financial magnitude of uninsured/unrecoverable portion, 
     adequacy of contractor's financial capacity (bonds, PCGs, solvency)
```

---

## 12. Common Errors to Avoid

The model must NOT:

1. **Assume the Employer bears the CAR deductible** for contractor-scope claims. The contractor bears it unless the contract says otherwise.
2. **Equate LEG2 exclusion with Employer exposure** without checking Manufacturer's Warranty and contractor liability obligations first.
3. **Treat DSU absence as automatically catastrophic** without assessing contractual LDs and project timeline.
4. **Treat negligence-based liability as a "gap" or "problem"** — it is a standard regime. Assess its adequacy, don't flag its existence.
5. **Treat each unit in a serial defect as a separate claim** when a serial loss clause aggregates them into one occurrence.
6. **Ignore the Manufacturer's Warranty clause** — it is the primary mechanism covering the LEG2 gap for defective components.
7. **Conflate insurance obligations with contractual liability** — they are separate systems. Insurance determines what the insurer pays; the contract determines what the contractor pays.
8. **Flag missing information as a contractual gap** — if the user hasn't provided a liability cap, that's a data input gap, not necessarily a contract deficiency. Ask for the information before assuming it's absent.
9. **Overstate risk by ignoring the contractual chain** — always trace: insurer → contractor/OEM → Employer. Only the residual is Employer risk.
10. **Assume the Employer is exposed to vessel damage** without checking marine co-insurance and waiver of subrogation status.
