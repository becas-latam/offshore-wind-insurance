# Offshore Wind — Marine Insurance & Liability: LLM Reference

> **Purpose**: This document is the authoritative reference for analysing marine insurance and related liability structures during the construction phase of offshore wind farm projects. It covers Hull & Machinery, P&I, port liability, vessel operations, and the interaction between marine insurance and construction contract liability regimes. It is designed to be used alongside the Construction Phase Insurance & Risk Analysis reference document.

---

## 0. Structural Premise: Multi-Contractor, Multi-Work-Package Projects

### 0.1 How Offshore Wind Projects Are Contracted

**Offshore wind projects are NOT built by a single EPCI contractor.** Unlike oil & gas (where a single EPCI contractor typically delivers the entire facility), offshore wind projects are split into **multiple work packages**, each awarded to a different contractor or combination of contractors. The Employer (project owner) holds separate bilateral contracts with each work-package contractor.

Typical work packages and contract structures include:

| Work Package | Typical Contract Split | Example Contractors |
|---|---|---|
| WTG (Wind Turbine Generators) | Design & Supply (OEM) + separate T&I contractor, or combined supply & install | Vestas, Siemens Gamesa, GE + T&I by specialist installer |
| Foundations (monopiles, jackets, GBS) | EPCI or Design & Supply + T&I | Sif, EEW, Smulders (fabrication) + Boskalis, DEME, Heerema (T&I) |
| Inter-array cables (IAC) | Supply + Installation (often separate) | Nexans, Prysmian (supply) + Boskalis, Jan De Nul (install) |
| Export cable (EXC) | Supply + Installation (often separate) | Nexans, NKT, Prysmian + cable-lay vessel operators |
| Offshore substation (OSS) | EPCI or Design & Supply + T&I | Dragados, Chantiers de l'Atlantique, Heerema |
| Onshore substation | EPC | ABB, Siemens Energy, GE Grid |
| Scour protection | Supply + Installation | Van Oord, Boskalis |
| UXO survey & clearance | Specialist contractor | Ordtek, Boskalis |

### 0.2 Why This Matters for Marine Insurance

The multi-contractor structure creates a fundamentally different risk and insurance landscape from single-EPCI oil & gas:

1. **The Employer sits at the hub** of a wheel of bilateral contracts. Contractors have **no direct contractual relationship with each other**. If WTG installer vessel A damages foundation contractor B's completed monopile, the liability path runs: A → Employer (under A's contract) → Employer → B (under B's contract). The Employer is the intermediary.

2. **Multiple contractors operate simultaneously** on the same offshore site, often with different vessel fleets, subcontractors, and insurance arrangements. Cross-contractor incidents are a primary risk.

3. **Each contractor has their own H&M and P&I insurance** for their own vessels. Without cross-co-insurance, each contractor's marine insurer may subrogate against other contractors on the same project.

4. **The Employer's CAR policy is the unifying insurance mechanism** — all contractors are co-insured under the CAR for physical damage to the works. But CAR does not cover vessel damage or vessel third-party liability — those sit with each contractor's own H&M and P&I.

5. **Liability regime consistency is harder to achieve** because each work-package contract is negotiated separately, potentially at different times, with different counterparties who have different market norms.

### 0.3 Required User Input — Project Structure

The app must collect the project's contract structure before analysing marine insurance:

| Input | Options / Format | Required |
|---|---|---|
| Number of work packages with marine/offshore scope | Number | Yes |
| For each work package: contract type | EPCI / Design & Supply + T&I / Supply + Install / T&I only / Other | Yes |
| For each work package: liability regime | Negligence / K4K / Hybrid | Yes |
| For each work package: does contractor provide own vessels or charter via Employer? | Contractor provides / Employer provides / Mixed | Yes |

---

## 1. First Principle: Liability Regime Consistency Across All Work Packages

### 1.1 The Rule

**All work-package contractors working on the same offshore wind project should operate under the same liability regime.** If the foundations contract is negligence-based, the WTG installation contract, the cable installation contract, and the vessel charters should also be negligence-based (or at minimum, the interfaces between regimes must be explicitly addressed in each contract).

**If the model detects different liability regimes across work-package contracts on the same project, it must flag this as a material risk.**

### 1.2 Why This Matters — The Multi-Contractor Problem

In a single-EPCI project, liability regime consistency is an internal contractor management issue. In offshore wind's multi-contractor model, it is an **Employer problem** because the Employer holds all the bilateral contracts.

**Cross-contractor damage scenario — the core problem**:

Foundation installation contractor's jack-up vessel damages a cable installed by the cable contractor. Who pays?

- Under **consistent negligence across all contracts**: Cable contractor claims against Employer under their contract. Employer claims against foundation contractor for negligence under their contract. Foundation contractor's P&I (with contractual liability extension) funds the payment. Clean chain.

- Under **consistent K4K across all contracts**: Each party bears its own losses. Cable contractor bears cable repair cost (insured under CAR for the cable). Foundation contractor bears vessel damage (insured under H&M). No cross-claims. Clean separation.

- Under **mixed regimes** (foundation contract = negligence, cable contract = K4K): Cable contractor bears own loss under K4K and cannot claim against Employer for the cable damage. But the foundation contractor is liable to the Employer under negligence for damage to the works. The Employer may recover from the foundation contractor but has no obligation to pass this through to the cable contractor (who waived claims under K4K). Result: confused liability, potential windfall to Employer, disputed obligation to the cable contractor, and P&I coverage questions.

- Under **mixed regimes** (foundation contract = K4K, cable contract = negligence): Foundation contractor is protected from Employer claims under K4K. Cable contractor claims against Employer for negligence-caused cable damage under their contract. Employer cannot pass this through to foundation contractor (K4K). **Employer bears the cable damage cost with no recovery path.** This is the worst outcome.

### 1.3 Common Sources of Inconsistency

| Contract | Typical Default Regime | Risk of Mismatch |
|---|---|---|
| WTG supply contract | Negotiated (often supply-focused, not marine) | May not address vessel liability at all |
| WTG T&I contract | Negotiated (negligence or K4K) | Sets marine baseline for WTG scope |
| Foundation EPCI / T&I | Negotiated (negligence or K4K) | May differ from WTG T&I |
| Cable installation contract | Negotiated (negligence or K4K) | May differ from foundation/WTG |
| BIMCO vessel charters (SUPPLYTIME, TOWCON, HEAVYCON) | K4K (standard BIMCO terms) | Mismatch if work-package contract is negligence |
| Port/harbour agreement | Almost always negligence | Mismatch if work-package contracts are K4K |
| CTV/SOV charter | Varies | Must be checked per vessel |
| UXO clearance contract | Varies | Often separate regime from main packages |
| Scour protection contract | Varies | Often simpler terms, may not match |

### 1.4 Required User Input
- For each work-package contract with marine scope: liability regime **Negligence / K4K / Hybrid**
- For vessel charters: liability regime **Negligence / K4K / BIMCO standard / Unknown**
- Are all work-package regimes aligned: **Yes / No / Unknown**
- If No or Unknown: **flag for review and identify specific mismatches**

---

## 2. Hull & Machinery (H&M) Insurance

### 2.1 What H&M Covers
H&M insurance covers **physical damage to the insured vessel** — the contractor's vessel used for T&I, cable-lay, heavy-lift, crew transfer, or survey operations. Standard cover includes:
- Damage to hull, machinery, and equipment of the vessel.
- Salvage and salvage charges.
- General average contributions.
- Collision liability (Running Down Clause — see Section 2.4).

### 2.2 Employer and Cross-Contractor Co-Insurance on H&M

**This is one of the most important marine insurance requirements in multi-contractor offshore wind projects.**

Because multiple contractors operate simultaneously on the same site with no direct contractual relationship between them, each contractor's H&M insurer can — and will — subrogate against other contractors (or the Employer) for damage caused during construction. Co-insurance prevents this.

**When work-package contracts are negligence-based**, the Employer **and all other project contractors** should be added as co-insured on each contractor's H&M policy. This means:

- **Cross-contractor protection**: If foundation contractor's vessel damages cable contractor's installed cable, the foundation contractor's H&M insurer cannot subrogate against the cable contractor (who is co-insured on that H&M policy). Without co-insurance, the H&M insurer pays for the vessel damage and subrogates against the cable contractor — who has no direct contract with the foundation contractor and no agreed liability framework. This creates unmanageable disputes.

- **Employer protection**: If any contractor's vessel damages the Employer's property (completed works, project infrastructure), the H&M insurer cannot subrogate against the Employer if the Employer is co-insured.

- **Practical mechanism**: Because each work-package contractor has their own H&M policy, achieving full cross-co-insurance requires each contractor's H&M policy to name the Employer and all other project contractors as co-insured. The Employer must coordinate this across all work packages — it cannot be left to individual contractors.

**Under K4K**, co-insurance on H&M is less critical because each party bears its own loss regardless of fault and subrogation should be contractually waived. However, a waiver of subrogation endorsed on the H&M policy itself provides belt-and-braces protection — contractual waivers can be disputed, but a policy endorsement is binding on the insurer.

**The model must check**: For each work-package contractor:
- Is the Employer co-insured on that contractor's H&M?
- Are the Employer's other project contractors co-insured on that contractor's H&M?
- Is there a waiver of subrogation on the H&M in favour of Employer and other co-insured parties?

If any of these are missing under a negligence regime, flag as a gap. Under K4K, check at minimum for waiver of subrogation.

### 2.3 UXO (Unexploded Ordnance) Cover

Offshore wind construction in the North Sea and Baltic Sea frequently encounters UXO from World War I and II. UXO detonation can cause catastrophic damage to vessels and equipment.

**Each contractor's H&M policy must include cover for UXO risk.** Standard H&M policies may exclude war risks or ordnance; a specific UXO extension or war risks cover is needed.

Note: UXO risk may be separately addressed through a dedicated UXO survey and clearance contractor, but this does not eliminate the H&M requirement — residual UXO can remain after clearance, and detonation during construction is a known risk.

**UXO and Employer co-insurance on H&M — the subrogation link**: UXO illustrates precisely why Employer co-insurance on the contractor's H&M is essential under negligence-based contracts. When a UXO detonation damages a contractor's vessel, the H&M insurer pays for the vessel repair. The H&M insurer will then seek to subrogate against whoever is responsible for the UXO being present — and the Employer, as site owner who selected the construction site and is typically responsible for site conditions, is the natural target. If the Employer is co-insured on the contractor's H&M, subrogation against the Employer is blocked. If the Employer is NOT co-insured, the H&M insurer can pursue the Employer for the full vessel repair cost. Under K4K, this subrogation risk does not arise because each party bears its own losses regardless of fault — the contractor (and their H&M insurer) absorbs the vessel damage without recourse against the Employer.

**The model must check**: For each contractor with vessels on site, does their H&M include UXO cover? If the project is in a known UXO-risk area (North Sea, Baltic, English Channel), UXO cover absence on any contractor's H&M is a high-severity gap. Additionally, under negligence-based contracts, confirm that the Employer is co-insured on the H&M — otherwise UXO events create direct subrogation exposure for the Employer as site owner.

### 2.4 Collision Liability — Running Down Clause (RDC)

H&M policies include a **Running Down Clause** covering the insured vessel's liability for collision damage to other vessels or fixed/floating objects. RDC can be:

- **4/4 RDC**: H&M covers 100% of collision liability. Most modern policies.
- **3/4 RDC**: H&M covers 75% of collision liability. The remaining 25% falls to P&I.

**Why this matters in multi-contractor context**: With multiple vessel fleets operating on the same site, vessel-to-vessel collision risk is elevated. A foundation contractor's jack-up and a cable-lay vessel may operate in close proximity. The RDC level on each contractor's H&M determines how collision liability is funded.

### 2.5 Specialist Operations Risk

Vessels used in offshore wind construction perform **specialist operations** that create unique risk profiles beyond standard marine navigation:

- **Jack-up vessels**: Leg punch-through, preload failure, leg extraction issues, overturning in soft seabed.
- **Cable-lay vessels**: Anchor damage to existing subsea cables/pipelines, cable burial equipment failure, route deviation damage.
- **Heavy-lift crane vessels**: Crane structural failure during lifts, dynamic load exceedance in swell, dropped objects.
- **Dredging/scour protection vessels**: Seabed disturbance, pipeline/cable strike.

**The model must check**: For each contractor, does the H&M policy cover damage arising from specialist operations, or are there exclusions for operational activities (as opposed to navigation)? Some H&M policies exclude damage occurring during lifting, jacking, or cable-lay operations — this must be covered either under H&M or under a separate Contractors' Equipment / Operational policy.

### 2.6 Required User Input — H&M (Per Work-Package Contractor)
| Input | Options / Format | Required |
|---|---|---|
| Contractor H&M in place | yes / no | Yes |
| Employer co-insured on H&M | yes / no | Yes |
| Other project contractors co-insured on H&M | yes / no / unknown | Yes (if negligence regime) |
| Waiver of subrogation on H&M (Employer + other contractors) | yes / no | Yes |
| UXO cover included | yes / no / unknown | Yes |
| RDC level | 3/4 / 4/4 / unknown | Recommended |
| Specialist operations covered under H&M | yes / no / unknown | Recommended |

---

## 3. P&I (Protection & Indemnity) Insurance

### 3.1 What P&I Covers
P&I insurance covers the **vessel owner's/operator's third-party liabilities** arising from the operation of the vessel. Standard P&I cover includes:
- Third-party personal injury and death (crew and non-crew).
- Third-party property damage (other than collision — collision is H&M/RDC or the 1/4 P&I top-up).
- Pollution liability.
- Wreck removal (statutory obligation).
- Cargo liability.
- Fines.

### 3.2 Protective Co-Insurance — Misdirected Arrow Basis

**The Employer and main project contractors should be co-insured under each contractor's P&I on a protective co-insurance / misdirected arrow basis.**

What this means:
- **Misdirected arrow**: If a third party (e.g., an injured crew member, a port authority, another vessel owner) brings a claim against the **Employer** or against **another project contractor** instead of the vessel operator, the P&I club will respond to defend and indemnify the wrongly-targeted party — because the claim was "misdirected" to the wrong party.
- **Protective co-insurance**: The Employer/other contractors are not full co-insured (which would make them principal insured with full rights). They are protected only against claims that should properly have been directed at the vessel operator.
- This is standard P&I club practice and is available from all International Group clubs.

**Why this is especially important in multi-contractor offshore wind**: Because contractors have no direct contractual relationship with each other, an injured worker from contractor A who sues the Employer (as site owner) or contractor B (who happened to be nearby) needs to be redirected back to contractor A's P&I. Without protective co-insurance, the Employer or contractor B must defend the claim at their own cost and seek recovery — a slow and uncertain process across separate contractual relationships.

### 3.3 P&I Under Different Liability Regimes — Critical Distinction

This is one of the most important and commonly misunderstood areas in offshore wind marine insurance.

#### 3.3.1 P&I Under K4K Contracts

Under K4K, each party bears its own losses regardless of fault. P&I clubs are comfortable with K4K because it aligns with the mutual insurance model — the club insures the member's own liabilities, and the K4K waiver means no cross-claims.

**Standard P&I cover is sufficient under K4K.** No special extensions are needed for the contractual relationship between Employer and contractor.

#### 3.3.2 P&I Under Negligence-Based Contracts — Extensions Required

Under negligence-based work-package contracts, the contractor may be liable to the Employer for damage caused by the contractor's vessels to the Employer's property (the works, cables, foundations, etc.) or to another contractor's completed works. This is a **contractual liability** — it arises from the construction contract, not from maritime law or tort.

**Standard P&I does NOT cover contractual liabilities.** P&I clubs cover liabilities arising by operation of law (tort, statute, maritime law). Liabilities assumed voluntarily under a contract are excluded unless specifically endorsed.

**Two extensions are required when the work-package contract is negligence-based:**

1. **Contractual Liability Extension**: Extends P&I cover to include liabilities the contractor has assumed under the construction contract towards the Employer. Without this, if a contractor's vessel damages another contractor's installed cable and the first contractor is liable to the Employer under the negligence-based contract, the P&I club will decline cover because the liability is contractual, not tortious.

2. **Specialist Operations Extension**: Standard P&I covers liabilities arising from the **navigation and operation of the vessel as a vessel**. Offshore wind construction activities (lifting, jacking, cable-laying, pile-driving) are **specialist operations** that go beyond normal vessel operation. Without a specialist operations extension, the P&I club may decline cover for liabilities arising during these activities, arguing they are construction operations rather than vessel operations.

**The model must check for each work-package contractor**: If the work-package contract is negligence-based, does the contractor's P&I include both the contractual liability extension and the specialist operations extension? If either is missing, flag as a high-severity gap — the P&I will not respond to the most likely claims scenarios.

#### 3.3.3 P&I Under K4K with Exclusion for Damage to Employer's Property

Some contracts use K4K but **carve out damage to the Employer's property** — i.e., each party bears its own personnel injury and vessel damage under K4K, but the contractor remains liable for damage to the Employer's works/property. This hybrid is common in offshore wind.

In this case, the same P&I extensions (contractual liability + specialist operations) are required for the carved-out liability, because the contractor's liability for damage to the Employer's property is contractual.

**The model must treat this hybrid as equivalent to negligence-based for P&I extension purposes.**

### 3.4 Wreck Removal

P&I covers the **statutory wreck removal obligation** of the vessel owner — i.e., if a contractor's vessel sinks, the P&I club pays for wreck removal as required by the relevant maritime authority.

However, P&I does NOT cover:
- The Employer's consequential losses from the wreck (site blockage, construction delay, re-routing of other work packages).
- Environmental clean-up beyond the vessel owner's statutory obligation (if Employer is held liable as site operator).
- Removal of non-vessel wreckage (e.g., a dropped WTG component on the seabed is not a "wreck" under maritime law — it's debris under the CAR policy).

In multi-contractor projects, a sunken vessel from one contractor's fleet can block operations for all other contractors on the same site. The delay and disruption costs to other work packages are not covered by the vessel owner's P&I. These are DSU / contractual LD territory.

### 3.5 Required User Input — P&I (Per Work-Package Contractor)
| Input | Options / Format | Required |
|---|---|---|
| Contractor P&I in place | yes / no | Yes |
| Employer protective co-insurance (misdirected arrow) | yes / no | Yes |
| Other project contractors protective co-insurance | yes / no | Recommended |
| P&I contractual liability extension | yes / no / not applicable | Yes (if negligence-based contract) |
| P&I specialist operations extension | yes / no / not applicable | Yes (if negligence-based or hybrid contract) |
| P&I club name / International Group member | Name / yes / no / unknown | Recommended |

---

## 4. CAR Third-Party Liability (CAR-TPL)

### 4.1 What CAR-TPL Covers
The CAR policy typically includes a **Third-Party Liability section** covering all co-insured parties' liability for bodily injury or property damage to third parties arising from the construction works.

In the multi-contractor model, CAR-TPL provides a useful unifying layer because all work-package contractors are co-insured under the same CAR policy and therefore under the same CAR-TPL section.

### 4.2 Vessel Damage Exclusion — Default and Buy-Back

**By default, CAR-TPL excludes damage caused by or to vessels.** This is standard because vessel liabilities are intended to be covered under each contractor's H&M and P&I — not under the construction policy.

However, in some projects, the Employer may negotiate a **vessel damage inclusion / watercraft buy-back** under the CAR-TPL. If included, the CAR-TPL would respond to third-party property damage claims arising from vessel operations during construction — providing an additional layer beyond each contractor's individual H&M/P&I.

**The model should**:
- Default assumption: CAR-TPL excludes vessel-caused damage to third parties.
- Ask whether watercraft buy-back / vessel damage inclusion is in place.
- If yes: note the additional protection and assess whether it overlaps or complements individual contractor H&M/P&I.
- If no: confirm that each contractor's H&M (RDC) + P&I adequately cover third-party vessel damage liability without relying on CAR-TPL.

### 4.3 Port/Harbour Damage Under CAR-TPL

If a contractor's vessel damages port infrastructure (quay walls, fenders, cranes, navigational aids), the claim may come under:
- H&M (RDC) — if classified as collision with a fixed object.
- P&I — if classified as third-party property damage from vessel operation.
- CAR-TPL — only if port damage is within the CAR-TPL scope and not subject to the vessel exclusion.

**The model should not assume CAR-TPL covers port damage from vessel operations.** Default is exclusion; only if watercraft buy-back is confirmed should the model include CAR-TPL in the port damage recovery chain.

### 4.4 Required User Input — CAR-TPL
| Input | Options / Format | Required |
|---|---|---|
| CAR-TPL section in place | yes / no | Yes |
| Watercraft / vessel damage buy-back | yes / no / unknown | Yes |
| CAR-TPL limit | Amount | Recommended |

---

## 5. Port Liability

### 5.1 The Problem

Port and harbour authorities **always require a negligence-based liability regime** from parties using the port. The port will not accept K4K — the port wants the right to claim against whoever negligently damages port infrastructure.

In multi-contractor offshore wind, this creates a compounded problem because **multiple contractors use the same port** (foundations are loaded out, WTG components are marshalled, cables are spooled, CTVs operate daily). Each contractor may use the port under different arrangements.

### 5.2 Two Contract Structures

**Structure A — Employer holds the port contract (contractors use port under Employer's agreement)**:
The Employer has a contract with the port that covers all project users. The Employer is liable to the port for damage caused by any work-package contractor using the port under the project.

- If all work-package contracts are negligence-based: alignment is clean. Employer claims against the responsible contractor under the relevant work-package contract. That contractor's P&I (with contractual liability extension) responds.
- If any work-package contract is K4K: **liability gap for that contractor**. Employer is liable to port (negligence-based) but cannot pass liability to the K4K contractor. Employer bears port damage liability for that contractor's operations.
- If work-package contracts have different regimes: Employer can recover from negligence-based contractors but not from K4K contractors. **Mixed exposure.**

**Structure B — No Employer port contract (each contractor arranges own port access)**:
Each work-package contractor arranges their own port agreement directly. Each contractor is liable to the port on a negligence basis for their own operations.

- Simpler from Employer's perspective — port liability sits with each contractor individually.
- Risk: coordination failures (e.g., one contractor's operations damage another contractor's staged components in the port), port authority may still target the Employer as project owner.
- Practical complication: multiple contractors sharing the same port area may dispute who caused specific damage.

### 5.3 Employer Options Under Structure A

When the Employer holds the port contract and wants to manage the liability:

1. **Back-to-back pass-through in each work-package contract**: Include a clause in each work-package contract requiring the contractor to indemnify the Employer for any port damage liability arising from that contractor's (or their subcontractors') negligence. This passes the port's negligence-based liability through to each contractor, even if the work-package contract is otherwise K4K.

2. **Require each contractor to carry port-specific TPL / P&I cover**: Each contractor's P&I (with contractual liability extension) covers their liability to indemnify the Employer for port damage. Alternatively, a separate port risks TPL policy per contractor.

3. **Carve port damage out of K4K**: If any work-package contracts are K4K, explicitly carve out port/harbour damage from the K4K waiver, making each contractor liable on a negligence basis specifically for port infrastructure damage. This maintains K4K for offshore operations but applies negligence for port operations.

4. **Employer self-insures port damage risk**: Accept the liability and cover it under the Employer's own TPL or a project-specific port risks policy. This is the least desirable option as it puts the cost on the Employer without recovery from the party who caused the damage.

5. **Joint port agreement**: Employer and all work-package contractors with port usage are signatories to the port contract, with several (not joint) liability. Each party is liable to the port for damage caused by their own operations. This requires port agreement and coordination across multiple contractors — achievable but administratively complex.

### 5.4 Required User Input — Port Liability
| Input | Options / Format | Required |
|---|---|---|
| Port contract structure | Employer holds contract / Each contractor arranges own / Joint / Mixed | Yes |
| Port liability regime | Negligence (default) / Other | Yes |
| For each work-package contractor: indemnity for port damage in contract | yes / no | Yes (if Employer holds port contract) |
| For each work-package contractor: P&I covers port damage indemnity | yes / no / unknown | Recommended |

---

## 6. Towage and Vessel Charter Contracts

### 6.1 BIMCO Standard Forms
Most vessel charters in offshore wind use BIMCO standard forms:
- **SUPPLYTIME 2017**: Time charter for offshore support vessels. K4K liability regime (Clause 14 — mutual indemnity; Clause 15 — K4K).
- **TOWCON 2008**: Towage contract. Modified K4K with specific towage liability provisions.
- **HEAVYCON**: Heavy-lift charter. K4K.
- **BARGEHIRE**: Barge charter. K4K.
- **WINDTIME** (if adopted): Specific to offshore wind, K4K basis.

### 6.2 Regime Mismatch Risk — Multi-Contractor Context

In multi-contractor offshore wind, vessel charters sit at a **third level of the contractual chain**: Employer → work-package contractor → vessel owner (charter). If the Employer's work-package contract is negligence-based but the contractor's vessel charter is K4K (BIMCO default), the work-package contractor is in a liability sandwich:

- Liable to the Employer under negligence for damage caused by vessels to the works or other contractors' property.
- Cannot recover from the vessel owner under K4K charter.
- The work-package contractor bears the net liability.

This is primarily a contractor risk, but it affects the Employer because:
- It increases the contractor's total risk exposure, potentially affecting pricing and solvency.
- The contractor may resist liability claims more aggressively when they cannot pass them through.
- In extreme cases, unrecoverable vessel-caused losses may exceed the contractor's liability cap or financial capacity.

**The model should flag the mismatch and note the implications for contractor capacity and recovery certainty**, but should not treat it as a direct Employer coverage gap.

### 6.3 Employer-Chartered Vessels

In some offshore wind projects, the **Employer directly charters** certain vessels (e.g., a heavy-lift vessel for WTG installation, or SOVs for multi-contractor use). In this case:
- The Employer is the charterer and directly responsible under the charter.
- The H&M and P&I are the vessel owner's, but the Employer needs to ensure co-insurance or indemnity protection.
- The Employer takes on vessel operation risk directly — this changes the liability dynamics significantly.
- The Employer must ensure their own TPL or the CAR-TPL covers liabilities arising from their chartered vessel's operations, or arrange separate cover.

**The model must check**: Does the Employer charter any vessels directly? If yes, assess the Employer's direct marine liability exposure separately from contractor vessel exposures.

---

## 7. Aviation Liability

### 7.1 Separate Exposure
If helicopters are used for crew transfer, survey, or inspection during construction, there is a separate aviation liability exposure that is **not covered by**:
- CAR-TPL (aviation exclusion is standard).
- H&M (covers vessels, not aircraft).
- P&I (covers vessel operations, not aviation).

### 7.2 Required Cover
An **aviation liability policy** must be arranged, either by the helicopter operator (standard) or by the Employer if chartering directly. The Employer should be named as additional insured / co-insured on the operator's aviation liability policy.

### 7.3 Required User Input
| Input | Options / Format | Required |
|---|---|---|
| Helicopter operations planned | yes / no | Yes |
| Aviation liability policy in place | yes / no | If helicopters = yes |
| Employer co-insured on aviation liability | yes / no | If helicopters = yes |

---

## 8. Interaction Map — Marine Insurance and Liability (Multi-Contractor Scenarios)

The model must understand how different policies and contractual mechanisms interact for common loss scenarios in the multi-contractor offshore wind environment:

### 8.1 Scenario: Foundation contractor's vessel damages cable contractor's installed subsea cable

```
STEP 1: What is the damage?
  → Physical damage to insured works (cable is part of the project, insured under CAR).
  → Two different work-package contractors involved, no direct contract between them.

STEP 2: CAR policy
  → Both contractors are co-insured under the Employer's CAR.
  → CAR covers cable repair as physical damage to the works.
  → Deductible: check which contractor bears deductible — since foundation contractor caused the damage,
     their contract with the Employer should allocate the deductible to them.
  → Cross-liability clause within CAR allows cable contractor's interest to claim
     against the policy despite foundation contractor also being co-insured.

STEP 3: Liability chain (Employer in the middle)
  → Cable contractor may claim against Employer for damage to their completed work scope
     (depending on contract terms and whether title has passed to Employer at this stage).
  → Employer claims against foundation contractor under their work-package contract for negligence.
  → If both contracts are negligence-based: clean chain.
  → If foundation contract is K4K: Employer cannot recover from foundation contractor. Employer bears loss.

STEP 4: Foundation contractor's P&I
  → If negligence-based: P&I covers foundation contractor's contractual liability to Employer
     IF contractual liability extension + specialist operations extension are in place.
  → If extensions missing: P&I declines. Foundation contractor must self-fund.

STEP 5: Foundation contractor's H&M
  → Covers damage to the vessel itself (if any). Not relevant for cable damage.
  → If cable contractor is co-insured on foundation contractor's H&M:
     H&M insurer cannot subrogate against cable contractor.

STEP 6: Practical recovery
  → CAR pays for cable repair (primary recovery path).
  → Foundation contractor bears deductible.
  → If cable repair exceeds CAR limits or involves delay: foundation contractor's P&I
     and contractual liability provide additional recovery.

RESULT: With consistent negligence regime, cross-co-insurance, and P&I extensions, loss is manageable.
Without regime consistency or P&I extensions, recovery chain breaks down.
```

### 8.2 Scenario: Contractor vessel damages port quay wall (Employer holds port contract)

```
STEP 1: What is the damage?
  → Physical damage to third-party property (port infrastructure).
  → Multiple contractors use same port under Employer's port agreement.

STEP 2: Port claims against Employer
  → Employer is liable to port under port agreement (negligence-based).
  → Employer must identify which contractor's vessel caused the damage.

STEP 3: Employer recovery from contractor
  → Employer claims against responsible contractor under work-package contract.
  → If work-package contract includes port damage indemnity: contractor indemnifies Employer.
  → If work-package contract is K4K without port damage carve-out:
     Employer CANNOT recover. Employer bears port damage cost.

STEP 4: CAR-TPL
  → Default: vessel-caused damage excluded from CAR-TPL.
  → If watercraft buy-back in place: CAR-TPL may respond to Employer's port liability.

STEP 5: Contractor's H&M (RDC) + P&I
  → RDC covers vessel's collision liability for port damage (4/4 or 3/4 split).
  → P&I covers third-party property damage from vessel operations.
  → These cover the contractor's liability to the port (if contractor is directly liable)
     or the contractor's indemnity obligation to the Employer.

STEP 6: Complication — unidentified damage
  → If port damage cannot be attributed to a specific contractor
     (e.g., fender damage discovered after multiple vessels used the berth):
     Employer may bear the loss under port contract with no recovery path.

RESULT: Ensure (a) each work-package contract includes port damage indemnity, (b) each contractor's 
P&I covers port indemnity obligation, (c) attribution mechanisms are in place for shared port use.
```

### 8.3 Scenario: UXO detonation damages jack-up vessel during foundation installation

```
STEP 1: What is the damage?
  → Damage to foundation contractor's vessel + potential damage to foundation/works
  → Potential damage to adjacent work by other contractors (e.g., installed cables nearby)
  → Potential crew injury.

STEP 2: H&M
  → Vessel damage covered IF UXO / war risks extension is in place on foundation contractor's H&M.
  → If UXO excluded: vessel damage uninsured. Major gap.

STEP 3: CAR
  → Damage to the works (foundation, adjacent cables, other installed components) covered under CAR
     as insured peril (explosion/accidental damage).
  → Deductible: check policy — UXO may trigger special deductible or natural catastrophe deductible.
  → All work-package contractors are co-insured, so damage to any contractor's completed work
     within the project is covered under the single CAR policy.

STEP 4: P&I
  → Crew injury covered under foundation contractor's P&I (standard).
  → Pollution from vessel damage covered under P&I.

STEP 5: Liability and cross-contractor impact
  → UXO is typically not any party's "fault" — it is a site condition risk.
  → Contract should allocate UXO risk explicitly (often Employer risk as site owner, or shared).
  → If UXO detonation delays cable contractor or WTG installer: those contractors'
     delay costs are a separate work-package issue — not covered by foundation contractor's P&I
     or H&M. DSU or contractual LDs apply.

RESULT: H&M UXO cover is essential for each contractor with vessels on site. CAR covers all works 
damage across work packages. Cross-contractor delay is DSU/LD territory. Contractual UXO risk 
allocation determines who bears residual costs.
```

---

## 9. Risk Assessment Decision Logic — Marine (Multi-Contractor)

For each marine-related risk event, the model must follow this sequence:

```
STEP 1: VERIFY LIABILITY REGIME CONSISTENCY ACROSS ALL WORK PACKAGES
  → For each work-package contractor with marine scope: what is the liability regime?
  → Are all regimes aligned?
  → If mixed: FLAG as material risk. Identify specific mismatches and the cross-contractor
     scenarios they affect.

STEP 2: IDENTIFY THE LOSS AND WHICH CONTRACTORS ARE INVOLVED
  → Vessel damage? Damage to works? Whose works? Third-party property? Personnel injury?
  → Is this a single-contractor event or a cross-contractor event?
  → If cross-contractor: trace the liability chain through the Employer (hub-and-spoke).

STEP 3: DETERMINE PRIMARY INSURANCE RESPONSE
  → Vessel damage → responsible contractor's H&M (check UXO, specialist ops coverage)
  → Damage to works (any work package) → CAR (unified policy, all co-insured)
  → Third-party property → responsible contractor's H&M/RDC + P&I + CAR-TPL (check watercraft buy-back)
  → Personnel injury → responsible contractor's P&I
  → Pollution → responsible contractor's P&I
  → Delay to other work packages → DSU (if in place) / contractual LDs per work-package contract

STEP 4: CHECK REQUIRED EXTENSIONS (for each negligence-based or hybrid work-package contract)
  → P&I contractual liability extension: in place?
  → P&I specialist operations extension: in place?
  → If missing: FLAG — P&I will not respond to that contractor's contractual liabilities

STEP 5: CHECK CO-INSURANCE AND WAIVERS (for each work-package contractor)
  → Employer co-insured on that contractor's H&M? Waiver of subrogation?
  → Other project contractors co-insured on that contractor's H&M?
  → Employer protective co-insured on that contractor's P&I (misdirected arrow)?
  → Other project contractors protective co-insured on that contractor's P&I?
  → If missing: FLAG — subrogation risk and misdirected claims risk

STEP 6: CHECK PORT LIABILITY PATH
  → Who holds port contract? Employer or each contractor separately?
  → If Employer: is there back-to-back port damage indemnity in each work-package contract?
  → Does each contractor's P&I cover their port damage indemnity obligation?
  → If multiple contractors share same port: is there an attribution mechanism?

STEP 7: ASSESS RESIDUAL EMPLOYER RISK
  → Only after tracing through: CAR → each contractor's H&M/P&I → contractual liability chain
  → Cross-contractor gaps are the primary source of Employer residual risk in multi-contractor projects
  → Flag only genuine gaps, not theoretical risks that are covered by the insurance/contractual chain
```

---

## 10. Common Errors to Avoid — Marine Insurance (Multi-Contractor Context)

The model must NOT:

1. **Assume a single EPCI contractor.** Offshore wind projects have multiple work-package contractors. Every marine insurance assessment must consider the multi-contractor structure and cross-contractor interfaces.

2. **Assume P&I covers contractual liabilities without checking for the contractual liability extension.** Standard P&I covers tort/statutory liabilities only. For each work-package contractor under a negligence-based contract, the extension is essential.

3. **Assume P&I covers specialist operations without checking for the extension.** Lifting, jacking, cable-laying, and pile-driving are not standard vessel operations. For each contractor performing these activities, the specialist operations extension must be confirmed.

4. **Ignore liability regime mismatches across work-package contracts.** Different contractors on the same project may be on different regimes. The model must compare regimes across all work packages and flag inconsistencies.

5. **Ignore liability regime mismatches between work-package contracts and vessel charters.** BIMCO standard forms default to K4K. If the work-package contract is negligence-based, this mismatch sits within the contractor's risk — but affects Employer recovery certainty.

6. **Assume CAR-TPL covers vessel-caused damage to third parties.** Default CAR-TPL excludes vessel damage. Only if watercraft buy-back is confirmed should this be included in the recovery chain.

7. **Treat port liability as automatically covered.** In multi-contractor projects, port liability is especially complex — multiple contractors sharing the same port, attribution challenges, and mixed liability regimes all compound the issue. Each link in the chain must be verified per contractor.

8. **Forget UXO cover in North Sea/Baltic projects.** UXO cover must be checked for each work-package contractor with vessels on site, not just the foundation contractor.

9. **Conflate wreck removal (P&I) with project delay costs.** P&I covers the statutory obligation to remove the wreck. It does not cover the Employer's delay, re-routing, or consequential losses — which in multi-contractor projects cascade across multiple work packages.

10. **Assume aviation risks are covered by marine or construction policies.** Helicopter operations require separate aviation liability cover. CAR-TPL, H&M, and P&I all exclude aviation.

11. **Treat K4K as eliminating all marine liability issues.** Even under K4K, port contracts are negligence-based, misdirected claims can occur, and subrogation waivers must be endorsed on each contractor's policies individually.

12. **Ignore the 3/4 vs 4/4 RDC distinction.** If any contractor's H&M has only 3/4 RDC, the remaining 25% of collision liability falls to their P&I. Confirm both H&M and P&I limits are sufficient for each contractor.

13. **Forget that the Employer is the hub.** Cross-contractor claims always route through the Employer. The model must assess whether the Employer's bilateral contracts with each contractor create a consistent and closed liability chain, or whether gaps exist where the Employer is left as residual risk bearer.

14. **Treat cross-contractor delay as a marine insurance issue.** If one contractor's vessel incident delays another contractor's work, the delay cost is a contractual/DSU issue, not a marine P&I issue. P&I does not cover consequential delay to third-party work packages.
