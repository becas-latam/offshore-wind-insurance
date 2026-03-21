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
from risk_prompts import STAKEHOLDER_IDENTIFICATION_PROMPT, RISK_ANALYSIS_PROMPT


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

    print(f"[Risk Analyzer] Identifying stakeholders for: {summary[:100]}...")

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": STAKEHOLDER_IDENTIFICATION_PROMPT},
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

    print(f"[Risk Analyzer] Running risk analysis...")

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": RISK_ANALYSIS_PROMPT},
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
