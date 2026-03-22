"""
Risk Analyzer Module
====================
Uses OpenAI to identify stakeholders and produce risk analysis
for offshore wind service contracts.
"""

import json
import os
from openai import OpenAI
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "prompts"))
sys.path.insert(0, str(Path(__file__).parent.parent / "knowledge"))
from risk_prompts import STAKEHOLDER_IDENTIFICATION_PROMPT, RISK_ANALYSIS_PROMPT, CONSTRUCTION_RISK_PROMPT
from loader import load_knowledge


def _get_client():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _parse_json_response(text: str):
    """Parse JSON from OpenAI response, handling markdown code blocks."""
    if not text:
        raise ValueError("Empty response from OpenAI")

    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return json.loads(text)


def _build_contract_summary(data: dict) -> str:
    """Build a human-readable summary of contract data for the AI prompt."""
    vessel = data.get("vesselInvolvement", "none")
    vessel_text = {
        "vessel": "Yes — contract includes a vessel",
        "charter": "Yes — contract includes charter of a vessel",
        "none": "No vessel involvement",
    }.get(vessel, vessel)

    return f"""Contract Details:
- Party A: {data.get("partyA", "N/A")}
- Party B: {data.get("partyB", "N/A")}
- Analyst's role/perspective: {data.get("role", "N/A")}
- Scope of work: {data.get("scopeOfWork", "N/A")}
- Contract type: {"Service Contract" if data.get("isServiceContract") else "Other"}
- Vessel involvement: {vessel_text}
- Liability type: {data.get("liabilityType", "N/A")}
- Liability exclusions: {data.get("exclusions", "None specified")}
- Consequential/financial losses: {data.get("consequentialLosses", "None specified")}"""


def identify_stakeholders(contract_data: dict) -> list[dict]:
    """
    Given contract details, use OpenAI to identify relevant third-party stakeholders.

    Returns a list of {"name": str, "description": str} objects.
    """
    client = _get_client()
    summary = _build_contract_summary(contract_data)

    knowledge = load_knowledge("general")
    system_prompt = STAKEHOLDER_IDENTIFICATION_PROMPT
    if knowledge:
        system_prompt += f"\n\n{knowledge}"

    print(f"[Risk Analyzer] Identifying stakeholders for: {summary[:100]}...")

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": summary},
        ],
        max_completion_tokens=4000,
        response_format={"type": "json_object"},
    )

    choice = response.choices[0]
    text = choice.message.content or ""
    print(f"[Risk Analyzer] finish_reason: {choice.finish_reason}")
    print(f"[Risk Analyzer] refusal: {getattr(choice.message, 'refusal', None)}")
    print(f"[Risk Analyzer] Stakeholder response ({len(text)} chars): {text[:300]}")

    parsed = _parse_json_response(text)

    # Handle various formats
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        # Find the first list value in the dict
        for value in parsed.values():
            if isinstance(value, list):
                return value
        # Single stakeholder object — wrap it
        if "name" in parsed and "description" in parsed:
            return [parsed]

    raise ValueError(f"Unexpected response format: {text[:300]}")


def analyze_risk(full_data: dict) -> dict:
    """
    Given all contract data + stakeholder info, produce a full risk analysis.

    full_data should contain all contract fields plus:
    - stakeholders: list of {"name": str, "liability": str}

    Returns structured risk report dict.
    """
    client = _get_client()
    summary = _build_contract_summary(full_data)

    # Add stakeholder details
    stakeholders = full_data.get("stakeholders", [])
    if stakeholders:
        summary += "\n\nSelected Stakeholders and Liability Arrangements:"
        for s in stakeholders:
            summary += f"\n- {s['name']}: {s.get('liability', 'No arrangement specified')}"

    knowledge = load_knowledge("general")
    system_prompt = RISK_ANALYSIS_PROMPT
    if knowledge:
        system_prompt += f"\n\n{knowledge}"

    print(f"[Risk Analyzer] Running risk analysis...")

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": summary},
        ],
        max_completion_tokens=8000,
        response_format={"type": "json_object"},
    )

    choice = response.choices[0]
    text = choice.message.content or ""
    print(f"[Risk Analyzer] finish_reason: {choice.finish_reason}")
    print(f"[Risk Analyzer] refusal: {getattr(choice.message, 'refusal', None)}")
    print(f"[Risk Analyzer] Analysis response ({len(text)} chars): {text[:300]}")

    return _parse_json_response(text)


def analyze_construction_risk(data: dict) -> dict:
    """
    Analyze construction-phase risk between Employer and a specific Contractor.

    data should contain:
    - windfarm: wind farm details (name, phase, insurance, deductibles)
    - contractor: full contractor object
    - defaultWarrantyYears: default warranty period
    """
    client = _get_client()

    wf = data.get("windfarm", {})
    contractor = data.get("contractor", {})
    default_warranty = data.get("defaultWarrantyYears", 5)

    # Build WTG components summary
    wtg_summary = ""
    if contractor.get("wtgComponents"):
        wtg_lines = []
        for comp in contractor["wtgComponents"]:
            line = f"  - {comp.get('component', 'Unknown')}: {comp.get('legClause', 'N/A')}"
            if comp.get("sublimit"):
                line += f" (sublimit: {comp['sublimit']})"
            wtg_lines.append(line)
        wtg_summary = "\nWTG Component LEG Breakdown:\n" + "\n".join(wtg_lines)

    # Build deductibles summary
    deductibles_summary = ""
    car_deductibles = wf.get("carDeductibles", [])
    if car_deductibles:
        ded_lines = [f"  - {d.get('label', 'Standard')}: {d.get('amount', 'N/A')}" for d in car_deductibles]
        deductibles_summary = "CAR Deductibles:\n" + "\n".join(ded_lines)
    if wf.get("dsuDeductibleDays"):
        deductibles_summary += f"\nDSU Deductible: {wf['dsuDeductibleDays']} days"

    summary = f"""CONSTRUCTION PHASE RISK ANALYSIS
Employer / Wind Farm: {wf.get("name", "N/A")}

CAR Insurance: {"Yes" if wf.get("insuranceCAR") else "No"}
DSU Insurance: {"Yes" if wf.get("insuranceDSU") else "No"}
{deductibles_summary}

CONTRACTOR: {contractor.get("name", "N/A")}
Contract Type: {contractor.get("contractType", "N/A")}
Scope: {", ".join(contractor.get("scope", []))}

LEG Clause: {contractor.get("legClause", "Not specified")}
LEG Sublimit: {contractor.get("leg2Sublimit") or "N/A"}
{wtg_summary}

Extended Maintenance: {"Yes — " + str(contractor.get("extendedMaintenanceDuration", "")) + " months" if contractor.get("extendedMaintenance") else "No"}
Warranty Maintenance: {"Yes — " + str(contractor.get("warrantyMaintenanceDuration", "")) + " months" if contractor.get("warrantyMaintenance") else "No"}
Take Over of Works: {contractor.get("takeOverDate") or "Not yet"}
Default Warranty: {default_warranty} years

Employer Co-insured on Contractor's H&M: {"Yes" if contractor.get("employerCoInsuredHM") else "No" if contractor.get("employerCoInsuredHM") is False else "Unknown"}
Employer Co-insured on Contractor's P&I: {"Yes" if contractor.get("employerCoInsuredPI") else "No" if contractor.get("employerCoInsuredPI") is False else "Unknown"}
Waiver of Subrogation (H&M): {"Yes" if contractor.get("waiverSubrogationHM") else "No" if contractor.get("waiverSubrogationHM") is False else "Unknown"}
Waiver of Subrogation (P&I): {"Yes" if contractor.get("waiverSubrogationPI") else "No" if contractor.get("waiverSubrogationPI") is False else "Unknown"}

Liability Type: {contractor.get("liabilityType", "Not specified")}
Liability Exclusions: {contractor.get("liabilityExclusions") or "None specified"}
Maximum Liability: {contractor.get("maximumLiability") or "Not specified"}"""

    knowledge = load_knowledge("construction", "general")
    system_prompt = CONSTRUCTION_RISK_PROMPT
    if knowledge:
        system_prompt += f"\n\n{knowledge}"

    print(f"[Risk Analyzer] Running construction risk analysis for {contractor.get('name', 'Unknown')}...")
    print(f"[Risk Analyzer] Knowledge loaded: {len(knowledge)} chars")

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": summary},
        ],
        max_completion_tokens=8000,
        response_format={"type": "json_object"},
    )

    choice = response.choices[0]
    text = choice.message.content or ""
    print(f"[Risk Analyzer] finish_reason: {choice.finish_reason}")
    print(f"[Risk Analyzer] Construction analysis response ({len(text)} chars): {text[:300]}")

    return _parse_json_response(text)
