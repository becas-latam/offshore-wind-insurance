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

**Period of Insurance — Different for Each Contractor**:
The CAR policy has an overall project period, but **each work-package contractor has their own period of cover** within the policy. A contractor's co-insured status runs from when their scope begins (e.g., arrival of components at the insured site, start of installation) until Take Over of their scope. Because offshore wind projects use multiple contractors working on different timelines, these periods overlap but are not identical:

- Foundation contractor may be co-insured from Month 1 (first monopile arrives at marshalling port) to Month 18 (last foundation Take Over).
- Cable contractor may be co-insured from Month 6 (cable delivery to port) to Month 22 (cable Take Over after burial and testing).
- WTG contractor may be co-insured from Month 12 (first WTG components arrive) to Month 30 (last WTG commissioning and Take Over).

The model must understand that **each contractor's period of cover determines what is insured and when**. A defect in a foundation that manifests after the foundation contractor's Take Over is handled differently from a defect discovered while the foundation contractor is still co-insured (see Section 4 — timing logic, and Section 9 — maintenance period).

**Insured Sites / Locations**:
The CAR policy specifies **insured sites** — the physical locations where cover applies. In offshore wind, the policy wording typically defines multiple insured sites, for example:

- **Site 1**: Manufacturer's facilities (e.g., blade factory, nacelle assembly plant, monopile fabrication yard) — cover for components during manufacture and storage at the OEM's premises.
- **Site 2**: Marshalling harbour / installation port (e.g., Cuxhaven, Esbjerg, Eemshaven) — cover for components during storage, pre-assembly, and loadout at the port.
- **Site 3**: Offshore construction site — cover for all works during offshore installation.
- **Site 4**: Onshore substation / cable route — cover for onshore construction elements.
- Additional sites as needed (e.g., secondary storage, transit locations).

**Why insured sites matter**: Cover only applies at the specified sites and during transit between them. If components are stored at a location not listed as an insured site, they may be uninsured. The model must know which sites are insured to assess whether all stages of the construction logistics chain are covered.

**The model must check**: Are all relevant locations (manufacturer facilities, marshalling port, offshore site, onshore works) listed as insured sites? If a contractor stores components at a location not covered, flag as a gap.

**Required User Input — Period of Insurance and Sites**:
| Input | Options / Format | Required |
|---|---|---|
| Overall CAR policy period | Start date — End date | Yes |
| Per work-package contractor: period of cover | Start date — Take Over date (or expected) | Yes |
| Insured sites listed in policy | List of named sites (manufacturer, port, offshore, onshore, etc.) | Yes |
| Any storage or staging locations NOT listed as insured sites | yes / no / unknown | Recommended |

**What CAR covers**: Physical loss or damage to the insured works from insured perils (fire, storm, accidental damage, contractor error/negligence during execution, etc.).

**What CAR does not cover** (standard exclusions):
- Defects in design, material, or workmanship — the **base CAR policy excludes** loss or damage caused by defects. However, this exclusion can be **partially bought back** through LEG clause extensions (LEG 2 or LEG 3), which are negotiated with insurers and typically included with sublimits. The scope of what remains excluded depends on which LEG clause is in place (see Section 2). Without any LEG buy-back, the exclusion is broad (equivalent to LEG 1 — both the defective item and resulting damage excluded). With LEG 2, resulting damage is covered but the defective item itself is excluded. With LEG 3, nearly everything is covered except betterment costs. The model must ask which LEG extensions are in place — not assume defects are simply excluded.
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

## 4. Manufacturer's Warranty Clause and Defect Rectification — Timing Logic

### 4.1 What It Is
The Manufacturer's Warranty clause is a **contractual obligation** (not insurance) under which the OEM/manufacturer is required to repair or replace defective components at their own cost. In offshore wind, this typically applies to WTG components (turbines, blades, gearboxes, generators, transformers, converters) and may also apply to cables, foundations, and substations depending on contract structure.

### 4.2 Before Take Over (Contractor Is Co-Insured Under CAR)

While the contractor is co-insured under the Employer's CAR policy, loss or damage from a defect is handled through the **insurance + warranty chain together**:

- **CAR responds based on the LEG clause in place**:
  - LEG 2: CAR insurer pays for **resulting damage** to other parts of the works. The **defective item itself** is excluded from CAR — this cost falls to the contractor/OEM under the Manufacturer's Warranty.
  - LEG 3: CAR insurer pays for **everything except betterment/improvement costs**. The defective item replacement to original specification is covered by CAR. Only the cost of redesign/improvement is excluded — this falls to the contractor/OEM.
  - No LEG buy-back (LEG 1 equivalent): CAR excludes both the defective item and resulting damage. All costs fall to the contractor/OEM under warranty and contractual defect rectification obligations.

- **The Manufacturer's Warranty covers what LEG excludes**: Under LEG 2, the warranty covers the defective item replacement. Under LEG 3, the warranty covers betterment. Under LEG 1, the warranty covers everything.

- **Deductible**: Borne by the contractor (see Section 5) for the insured portion of the claim.

**The model must assess**: Before Take Over, the combination of CAR (with LEG extension) + Manufacturer's Warranty should cover the full loss. Flag a gap only if the Manufacturer's Warranty is absent or its scope doesn't cover the LEG-excluded costs.

### 4.3 After Take Over (Contractor No Longer Co-Insured — Extended Maintenance / DNP Period)

Once Take Over occurs, the contractor is no longer co-insured under the CAR policy (unless the Extended Maintenance Period provides limited continued cover). For defects with a root cause during the construction period that manifest after Take Over:

- **The contractor bears the full cost of rectification** — not the CAR insurer. The contractor's obligation arises from the construction contract's defect rectification provisions and the Manufacturer's Warranty.
- The CAR Extended Maintenance cover is **limited**: it typically covers only damage caused by the contractor returning to site to remedy defects (e.g., contractor accidentally damages adjacent equipment during a repair visit), not the defect itself or its replacement cost.
- **The Manufacturer's Warranty becomes the primary and potentially sole mechanism** for recovering defective component replacement costs from the OEM/contractor.

**The model must assess**: After Take Over, the key question is the adequacy of the Manufacturer's Warranty and the contractor's contractual defect rectification obligation — not CAR coverage (which is largely unavailable for the defective item). Flag as Employer exposure if the warranty has expired, is narrow in scope, or the contractor's financial capacity to honour the obligation is doubtful.

### 4.4 Scope Variations
- **Narrow warranty**: OEM replaces the defective component ex-works. Employer/contractor bears T&I costs to remove the old and install the new component.
- **Broad warranty**: OEM replaces the component AND covers T&I and potentially standby/delay costs.
- **With recall/serial defect obligation**: OEM must proactively inspect and replace all affected units if a serial defect is identified (see Section 7.3 — serial defect clause).

### 4.5 Required User Input
The app **must** require the user to specify:
- Manufacturer's Warranty clause: **yes / no**
- If yes: scope — **replacement only / replacement + T&I / replacement + T&I + delay costs**
- Warranty duration (years from Take Over)
- Serial defect clause in contract: **yes / no** (see Section 7.3 for detailed inputs)

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

### 7.1 Serial Loss Clause in CAR (Insurance Mechanism)

The serial loss clause is an **insurance policy mechanism** that defines how multiple losses arising from the same defect, design flaw, or common cause are treated for deductible and coverage purposes.

**Aggregation basis — two market approaches**:

- **Per root cause (traditional)**: All losses arising from the same underlying defect or design flaw are aggregated into a **single occurrence**. One deductible applies to the entire series. Example: 15 blades with the same lamination defect → one occurrence → one deductible. This was the traditional market approach.
- **Per individual loss (current market trend)**: Each individual loss event triggers its own deductible, even if the root cause is the same across all events. Example: 15 blades with the same defect → 15 separate losses → 15 separate deductibles. **Insurers are increasingly pushing for per-loss aggregation.** This materially increases the total deductible exposure for serial issues.

**The model must ask the user which aggregation basis applies.** The financial impact is significant — per-root-cause aggregation with a €750k deductible means €750k total; per-loss aggregation means €750k × number of affected units.

### 7.2 Declining Coverage Scale (e.g., 3-3-3, 5-5-5)

Modern CAR policies for offshore wind increasingly include a **declining coverage scale** for serial losses. This limits the insurer's total exposure to serial defect replacement by reducing coverage after a certain number of losses from the same component type.

**How it works**: The scale defines tiers of coverage, applied **per component type** (e.g., blades tracked separately from gearboxes, separately from main bearings). Each tier specifies the number of losses covered and the coverage percentage. The deductible reduces in the same proportion as the coverage.

**Example — 3-3-3 scale for blades**:
- Losses 1–3: **100% coverage**, **100% deductible** (full deductible applies, full indemnity above deductible)
- Losses 4–6: **75% coverage**, **75% deductible** (reduced deductible, but insurer only pays 75% of the loss above deductible)
- Losses 7–9: **50% coverage**, **50% deductible** (further reduced deductible, insurer pays 50%)
- Loss 10+: **no coverage** (insurer's serial loss exposure for this component type is exhausted)

**The tiers are configurable** — common structures include 3-3-3, 5-5-5, 4-5-4, 7-7-7, or other combinations depending on negotiation. The model must not assume a fixed structure.

**Key points for analysis**:
- The declining scale applies to the **physical damage (CAR) section only**. Business Interruption / DSU is **not affected** by the declining scale — DSU coverage does not reduce with the serial loss tiers.
- After the scale is exhausted (e.g., after loss 9 in a 3-3-3), the remaining serial losses are **uninsured under CAR**. Recovery falls to the contractor/OEM under contractual warranty and the serial defect clause (see Section 7.3).
- The scale applies per component type: blade serial losses do not count against gearbox serial losses.
- The combination of per-loss aggregation + declining scale is the most restrictive scenario — each loss has its own deductible AND coverage reduces after the first tier.

### 7.3 Serial Defect Clause in the Contract (Contractual Mechanism)

**The serial defect clause is a contractual mechanism — completely separate from the serial loss clause in the insurance policy.** The model must not conflate them.

The serial defect clause in the construction/supply contract defines when a **pattern of defects** triggers a blanket contractor obligation. Typically:

- Once a defined number of the same component type exhibit the same defect (e.g., 3 blades with the same failure mode), **all components of that type are deemed defective** — even those not yet showing symptoms.
- The contractor/OEM is then obligated to **inspect and replace/repair all components of that type**, not just the ones that have failed.
- This is the contractor's obligation regardless of insurance coverage — it is a contractual warranty/rectification duty.

**Why this matters for risk analysis**: The serial defect clause is the **primary recovery mechanism once the CAR serial loss scale is exhausted**. After the insurer's declining scale runs out (e.g., after loss 9 in a 3-3-3), the contractor's serial defect obligation covers the remaining replacements. The model must check whether a serial defect clause exists and what triggers it.

### 7.4 Required User Input

**Insurance (serial loss clause)**:
| Input | Options / Format | Required |
|---|---|---|
| Serial loss clause in CAR | yes / no | Yes |
| Aggregation basis | Per root cause / Per individual loss | Yes |
| Declining coverage scale | yes / no | Yes |
| If declining scale: tier structure per component type | e.g., 3-3-3, 5-5-5, 7-7-7 (number of losses per tier) | If declining scale = yes |
| If declining scale: coverage percentages per tier | e.g., 100%-75%-50% | If declining scale = yes |
| Declining scale applies to DSU/BI | yes / no (default: no) | Yes |

**Contract (serial defect clause)**:
| Input | Options / Format | Required |
|---|---|---|
| Serial defect clause in contract | yes / no | Yes |
| Trigger threshold (number of same-type failures) | Number | If serial defect clause = yes |
| Contractor obligation when triggered | Inspect all / Inspect + replace all / Other | If serial defect clause = yes |

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

## 9. Third-Party Liability (TPL)

### 9.1 CAR-TPL — Parallel Cover

The CAR policy includes a **Third-Party Liability (TPL) section** that runs parallel to the physical damage (Section I) cover. CAR-TPL covers the insured parties' liability for bodily injury or property damage caused to third parties arising from the construction works.

**Key characteristics**:
- CAR-TPL is a **separate section** of the CAR policy, not part of the physical damage cover. It has its own limit, deductible, and scope.
- All co-insured parties (Employer + all contractors) are covered under the same CAR-TPL section.
- CAR-TPL covers liabilities arising from construction activities — e.g., a pile-driving operation causes vibration damage to a nearby pipeline, or construction debris injures a passing vessel's crew.

### 9.2 Contractor's Own Insurance Before CAR Inception

**Contractors must have their own insurance in place before the CAR policy starts.** This is important because:
- The CAR policy may not incept until financial close or construction commencement, but contractors may begin mobilisation, pre-fabrication, or component manufacturing earlier.
- During this pre-CAR period, the contractor's own policies (Contractors' All Risk, Professional Indemnity, Public Liability, Employers' Liability, H&M, P&I) are the only protection.
- The construction contract should require contractors to maintain specified minimum insurance cover from contract signature or mobilisation, not just from CAR inception.

**The model must check**: Is there a gap between when contractors begin work/mobilisation and when the CAR policy incepts? If yes, are contractors' own policies adequate to cover this gap period?

### 9.3 Standard CAR-TPL Exclusions

CAR-TPL typically excludes:
- Damage caused by or to **vessels** (watercraft exclusion — see marine insurance reference for watercraft buy-back option).
- Damage caused by or to **aircraft** (aviation exclusion).
- Damage to the insured works themselves (this is Section I — physical damage, not TPL).
- Professional liability / design errors (these require separate Professional Indemnity insurance).

### 11.4 Required User Input — TPL
| Input | Options / Format | Required |
|---|---|---|
| CAR-TPL section in place | yes / no | Yes |
| CAR-TPL limit | Amount | Yes |
| CAR-TPL deductible | Amount | Recommended |
| Watercraft buy-back (vessel damage included in TPL) | yes / no / unknown | Yes |
| Gap between contractor mobilisation and CAR inception | yes / no / unknown | Recommended |
| Contractor's own insurance requirements specified in contract | yes / no | Recommended |

---

## 10. Construction Timeline and Risk Profile by Phase

### 10.1 Why the Timeline Matters for Risk Analysis

The risk profile of an offshore wind project changes significantly across construction phases. Different work packages are active at different times, different vessel types are on site, and the value at risk (installed works exposed to damage) increases progressively. The model should assess risk in the context of which construction phase the project is in or approaching.

### 10.2 Typical Offshore Wind Construction Sequence

A typical 1 GW offshore wind farm has a construction period of **2–3 years** from start of offshore works to full commissioning. The sequence below shows the typical order, with overlaps where possible:

**Phase 1 — Seabed Preparation and UXO Clearance** (Months 1–6)
- Activities: Geotechnical surveys, UXO survey and clearance, seabed levelling, scour protection pre-installation.
- Key vessels: Survey vessels, UXO clearance vessels, dredgers, rock-dumping vessels.
- Key risks: UXO detonation, vessel damage, seabed condition surprises.
- Value at risk: Low (no permanent works installed yet). Vessel damage is the primary exposure.
- Insurance: CAR covers survey/preparation works. H&M covers vessels. UXO cover on H&M is critical.

**Phase 2 — Foundation Installation** (Months 4–14, overlapping with Phase 1)
- Activities: Monopile or jacket installation, transition piece installation, grouting.
- Key vessels: Jack-up installation vessels (WTIV), heavy-lift crane vessels, transport barges, anchor-handling tugs.
- Key risks: Pile-driving damage, jack-up leg punch-through, dropped objects, crane failure, storm damage to partially installed foundations.
- Value at risk: Increasing rapidly — each installed foundation adds €5–15M+ to the value at risk.
- Insurance: CAR covers foundations. High deductible exposure per incident. Jack-up H&M specialist operations cover essential.

**Phase 3 — Cable Installation** (Months 8–20, overlapping with Phase 2)
- Activities: Export cable lay and burial, inter-array cable lay and burial, cable pull-in to foundations and substation, cable jointing.
- Key vessels: Cable-lay vessels, cable burial (ploughing/jetting) vessels, support vessels.
- Key risks: Cable damage during lay/burial, anchor strike on already-installed cables, cable joint failure, interaction with other contractors' works (foundation vessels damaging cables or vice versa).
- Value at risk: High and increasing — cable replacement is expensive and slow (cable-lay vessel availability is a bottleneck). Cable-specific deductibles are typically higher than standard deductibles.
- Insurance: CAR covers cables (note higher cable deductible). Cross-contractor damage risk is elevated in this phase. Cable-lay vessel H&M specialist operations cover essential.

**Phase 4 — Offshore Substation Installation** (Months 10–16)
- Activities: Substation jacket installation, topside lift and installation, commissioning.
- Key vessels: Heavy-lift crane vessel (major lift — topside can weigh 3,000–8,000+ tonnes), transport barge.
- Key risks: Single-lift failure (topside drop is a catastrophic loss scenario), weather window dependency, commissioning failures.
- Value at risk: Very high — the substation is a single point of failure for the entire wind farm. If the substation is damaged or delayed, no turbine can export power.
- Insurance: CAR covers substation. DSU exposure is acute — substation delay = entire project delay. EML scenario often centres on substation topside lift.

**Phase 5 — WTG Installation** (Months 14–26, overlapping with Phases 3–4)
- Activities: WTG component transport to site, tower/nacelle/blade installation on foundations, mechanical completion.
- Key vessels: WTG installation vessel (WTIV/jack-up), feeder barges, CTVs, SOV.
- Key risks: Dropped components during lift, blade damage during transport/installation, crane failure, weather delay (installation is weather-sensitive — typical lift windows require <10m/s wind and <1.5m Hs).
- Value at risk: Very high — each installed WTG adds €15–30M+ to value at risk. Multiple WTGs in various stages of installation simultaneously.
- Insurance: CAR covers WTGs. LEG clause allocation is most critical here (blades, gearboxes, main bearings). Manufacturer's Warranty is essential for component defects. Serial defect risk becomes relevant as more units are installed.

**Phase 6 — Commissioning and Grid Connection** (Months 20–30, overlapping with Phase 5)
- Activities: Individual WTG commissioning, inter-array energisation, export cable energisation, grid compliance testing, reliability runs.
- Key vessels: CTVs, SOV, walk-to-work vessels.
- Key risks: Commissioning failures, electrical faults, grid connection issues, discovery of latent defects during reliability testing, serial defect identification.
- Value at risk: Maximum — all works are installed and exposed. DSU exposure is at peak (project is closest to revenue generation).
- Insurance: CAR covers commissioning damage. DSU (if in place) is most valuable in this phase. Serial loss clause becomes critical. Take Over timing determines when each contractor's co-insurance ends.

### 10.3 Required User Input — Project Timeline
| Input | Options / Format | Required |
|---|---|---|
| Current construction phase | Phase 1–6 or description | Recommended |
| Expected commissioning / COD date | Date | Recommended |
| Per work-package contractor: expected Take Over date | Date per contractor | Recommended |

---

## 11. Maintenance Period Cover — Visits, Extended, and Warranty (Guarantee) Maintenance

### 11.1 Overview — Three Levels of Post-Take Over CAR Cover

After Take Over, the CAR policy may continue to provide cover during a **Maintenance Period**. There are three distinct levels of maintenance cover, each progressively broader. The level in place fundamentally affects what defects are insured post-Take Over:

**Visits Maintenance** (narrowest):
Covers only loss or damage caused by the contractor **while visiting the site to remedy defects** or perform post-handover contractual obligations. It does NOT cover the defect itself or damage that originated during construction — it only covers new damage the contractor causes during their remedial visit (e.g., contractor accidentally damages adjacent equipment while repairing a punch-list item).

**Extended Maintenance** (standard in offshore wind):
Covers Visits Maintenance PLUS loss or damage from **on-site defects introduced during the construction period** — specifically defective workmanship and materials. The root cause must lie in the construction period; the damage simply manifests during the maintenance period. Extended Maintenance is generally understood as dovetailing with LEG 2: resulting damage from defects is covered, but the defective part itself is not. Importantly, **Extended Maintenance covers only defects originating while the contractor was co-insured under the CAR** — i.e., defects introduced on-site during construction. It does NOT cover defects in design or manufacture that originated before the contractor was co-insured (e.g., a design flaw made at the OEM's factory before components arrived on site).

**Warranty Maintenance / Guarantee Maintenance** (broadest — alternative to Extended Maintenance):
Covers both of the above, AND **off-site defects from causes that may predate the inception of the CAR policy**. This is the critical difference: Warranty/Guarantee Maintenance extends cover to defects in **design, plan, and specification** that were introduced before the contractor became co-insured — including defects originating at the manufacturer's facility, in the design office, or during pre-construction component ordering. This means:
- A design flaw made by the OEM at their factory before components were shipped to the construction site → **covered under Warranty Maintenance** (not covered under Extended Maintenance).
- A manufacturing defect in a blade produced before CAR inception → **covered under Warranty Maintenance** (not covered under Extended Maintenance).
- Warranty Maintenance is effectively a form of **post-handover LEG 3 coverage** — it acts as a backstop to the manufacturer's warranty by insuring the consequences of design and manufacturing defects even if they predate the insurance policy.

### 11.2 Market Context

In offshore wind, **Extended Maintenance combined with Visits Maintenance** is currently the norm. Typical maintenance periods are 12 or 24 months, though longer periods are sometimes available.

**Warranty/Guarantee Maintenance** was available during the soft insurance market, particularly in offshore wind where comprehensive OEM warranties gave underwriters comfort. However, the willingness of (re)insurers to offer Guarantee Maintenance has reduced significantly in recent years due to increased claim activity from defective components, supply chain issues, and large warranty-style claims. Some underwriters argue that Guarantee Maintenance became the first port of call for suppliers unwilling or unable to honour their contractual warranty obligations, rather than serving as a backstop.

The model should note: if Warranty/Guarantee Maintenance is in place, the project has significantly broader post-Take Over insurance protection. If only Extended Maintenance is in place, defects originating in design or off-site manufacturing are NOT insured during the maintenance period — the Manufacturer's Warranty is the sole recovery path for these.

### 11.3 Interaction with Manufacturer's Warranty

The maintenance cover level and the Manufacturer's Warranty interact differently depending on which maintenance type is in place:

**With Extended Maintenance only**:
- Insurance covers on-site construction defects (resulting damage under LEG 2).
- Manufacturer's Warranty covers the defective item itself (LEG 2 gap) AND all design/manufacturing defects that originated off-site or before CAR inception.
- The Manufacturer's Warranty is the **sole mechanism** for design and off-site manufacturing defects.

**With Warranty/Guarantee Maintenance**:
- Insurance covers both on-site AND off-site defects, including design and manufacturing defects predating the policy.
- Manufacturer's Warranty still covers the defective item itself (if LEG 2 applies), but the insurer covers resulting damage even for pre-construction defects.
- The Manufacturer's Warranty and insurance **overlap** — the insurer provides a backstop if the manufacturer fails to honour their warranty.

### 11.4 Required User Input
| Input | Options / Format | Required |
|---|---|---|
| Maintenance cover type | Visits only / Extended (+ Visits) / Warranty/Guarantee (+ Extended + Visits) | Yes |
| Maintenance period duration | Months/years from Take Over | Yes |
| Scope limitations (if any) | Free text | If known |
| Does maintenance cover include design defects? | yes / no | If Extended Maintenance selected (to distinguish narrow vs broad Extended) |

---

## 12. Required User Inputs — Complete Checklist

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
| LEG clause per component category | LEG1 / LEG2 / LEG3 / No LEG buy-back | Yes |
| LEG sublimits | Amount per component category | If known |
| Serial loss clause | yes / no | Yes |
| Serial loss aggregation basis | Per root cause / Per individual loss | If serial loss = yes |
| Declining coverage scale | yes / no | If serial loss = yes |
| Declining scale tier structure | e.g., 3-3-3, 5-5-5, 7-7-7 per component type | If declining scale = yes |
| Declining scale coverage percentages | e.g., 100%-75%-50% | If declining scale = yes |
| Declining scale applies to DSU/BI | yes / no (default: no) | If declining scale = yes |

### Contractual Inputs
| Input | Options / Format | Required |
|---|---|---|
| **Manufacturer's Warranty clause** | **yes / no** | **Yes — critical** |
| Warranty scope | Replacement only / + T&I / + T&I + delay | If MW = yes |
| Warranty duration | Years from Take Over | If MW = yes |
| **Serial defect clause in contract** | **yes / no** | **Yes — critical** |
| Serial defect trigger threshold | Number of same-type failures | If serial defect = yes |
| Contractor obligation when triggered | Inspect all / Inspect + replace all / Other | If serial defect = yes |
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
| Maintenance cover type | Visits only / Extended (+ Visits) / Warranty/Guarantee (+ Extended + Visits) | Yes |
| Maintenance period duration | Months/years from Take Over | Yes |
| Does maintenance cover include design defects? | yes / no | If Extended selected |
| Scope limitations | Free text | If known |

### Period of Insurance and Sites
| Input | Options / Format | Required |
|---|---|---|
| Overall CAR policy period | Start date — End date | Yes |
| Per work-package contractor: period of cover | Start date — Take Over date | Yes |
| Insured sites listed in policy | List of named sites | Yes |
| Storage/staging locations NOT listed as insured sites | yes / no / unknown | Recommended |

### TPL Inputs
| Input | Options / Format | Required |
|---|---|---|
| CAR-TPL section in place | yes / no | Yes |
| CAR-TPL limit | Amount | Yes |
| Watercraft buy-back | yes / no / unknown | Yes |
| Gap between contractor mobilisation and CAR inception | yes / no / unknown | Recommended |
| Contractor's own insurance requirements in contract | yes / no | Recommended |

### Project Timeline
| Input | Options / Format | Required |
|---|---|---|
| Current construction phase | Description or Phase 1–6 | Recommended |
| Expected commissioning / COD date | Date | Recommended |
| Per work-package contractor: expected Take Over date | Date | Recommended |

---

## 13. Risk Assessment Decision Logic

For each identified risk event during construction, the model must follow this sequence:

```
STEP 1: IDENTIFY THE EVENT
  → Physical damage? Defect? Delay? Third-party liability?

STEP 2: IS IT INSURED UNDER CAR?
  → Check: Is it an insured peril? Is it excluded?
  → If physical damage from contractor error/negligence → YES, CAR covers (not a LEG issue)
  → If defective workmanship (latent defect) → CAR covers RESULTING DAMAGE, but check LEG clause for the defective item itself

STEP 3: IF LEG EXCLUDES THE DEFECTIVE ITEM (LEG1 or LEG2):
  → CHECK TIMING: Before or after Take Over?
  → BEFORE TAKE OVER (contractor co-insured):
    → CAR responds for insured portion (resulting damage under LEG2, nearly all under LEG3)
    → Defective item cost excluded by LEG → falls to contractor/OEM under Manufacturer's Warranty
    → Flag only if Manufacturer's Warranty is absent or scope is narrow (e.g., no T&I coverage)
  → AFTER TAKE OVER (root cause during construction, damage manifests later):
    → Contractor bears full rectification cost under contractual defect obligations and Manufacturer's Warranty
    → CAR Extended Maintenance covers only collateral damage from contractor's return-to-site remediation
    → Flag as Employer exposure only if warranty has expired or contractor cannot honour obligation
  → CHECK SERIAL LOSS: If multiple units affected by same defect:
    → What is the aggregation basis? Per root cause (one deductible) or per loss (multiple deductibles)?
    → Is there a declining coverage scale? After which tier is CAR coverage exhausted?
    → Once CAR serial loss scale is exhausted → recovery falls to contractor under serial defect clause
    → Flag as Employer exposure if both CAR coverage exhausted AND no serial defect clause in contract

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

## 14. Common Errors to Avoid

The model must NOT:

1. **Assume the Employer bears the CAR deductible** for contractor-scope claims. The contractor bears it unless the contract says otherwise.
2. **Equate LEG2 exclusion with Employer exposure** without checking Manufacturer's Warranty and contractor liability obligations first.
3. **Treat DSU absence as automatically catastrophic** without assessing contractual LDs and project timeline.
4. **Treat negligence-based liability as a "gap" or "problem"** — it is a standard regime. Assess its adequacy, don't flag its existence.
5. **Assume serial losses always aggregate into one deductible.** The market is moving towards per-individual-loss aggregation, where each loss triggers its own deductible even if the root cause is the same. The model must check the aggregation basis before assessing deductible exposure. Also check for declining coverage scales (e.g., 3-3-3) which reduce insurer coverage after a certain number of losses per component type.
6. **Ignore the Manufacturer's Warranty clause** — it is the primary mechanism covering the LEG2 gap for defective components.
7. **Conflate insurance obligations with contractual liability** — they are separate systems. Insurance determines what the insurer pays; the contract determines what the contractor pays.
8. **Flag missing information as a contractual gap** — if the user hasn't provided a liability cap, that's a data input gap, not necessarily a contract deficiency. Ask for the information before assuming it's absent.
9. **Overstate risk by ignoring the contractual chain** — always trace: insurer → contractor/OEM → Employer. Only the residual is Employer risk.
10. **Assume the Employer is exposed to vessel damage** without checking marine co-insurance and waiver of subrogation status.
