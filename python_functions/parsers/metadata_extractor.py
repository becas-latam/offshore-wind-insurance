"""
Metadata Extractor
==================
Extracts metadata from file paths and folder structure of the corpus.

Metadata extracted:
  - date: Recording date from filename (DDMMYYYY format)
  - wind_farm: Wind farm name from folder structure
  - insurance_line: Insurance line from folder name
  - project_phase: Construction / Operation / Transition / Decommissioning
  - topic: Topic category from folder name
  - language: Language hint from filename
  - participants: Speaker names if available
"""

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Optional


# Mapping folder names to wind farm identifiers
WIND_FARM_MAP = {
    "b1": "Baltic 1",
    "b2": "Baltic 2",
    "baltic1": "Baltic 1",
    "baltic2": "Baltic 2",
    "baltic 1": "Baltic 1",
    "baltic 2": "Baltic 2",
    "hs": "Hohe See",
    "hohe see": "Hohe See",
    "alb": "Albatros",
    "albatros": "Albatros",
    "eos": "EOS",
    "uk": "UK Offshore",
    "dkt": "DKT",
    "cps": "CPS",
}

# Mapping folder names to insurance lines
INSURANCE_LINE_MAP = {
    "oar": "OAR",
    "car": "CAR",
    "cps": "CAR",  # Construction phase = CAR
    "claims": "Claims",
    "h&m": "H&M",
    "hm": "H&M",
    "p&i": "P&I",
    "pi": "P&I",
    "weci": "WECI",
    "tpl": "TPL",
    "vv": "Contract Negotiation",
}

# Mapping folder names to project phases
PROJECT_PHASE_MAP = {
    "betrieb": "Operation",
    "operation": "Operation",
    "cps": "Construction",
    "construction": "Construction",
    "transition": "Transition",
    "decommissioning": "Decommissioning",
}

# Topic mapping from folder names
TOPIC_MAP = {
    "claims": "Claims",
    "risk survey": "Risk Survey",
    "certification": "Certification",
    "broker": "Broker Relations",
    "export cable": "Export Cable",
    "fou": "Foundations",
    "gbs": "Gravity-Based Structures",
    "iag": "IAG",
    "wtg": "Wind Turbine Generators",
    "on and offshore substations": "Substations",
    "onshore works": "Onshore Works",
    "rm": "Risk Management",
    "bv": "BV",
}

# Date pattern in filenames: DDMMYYYY
DATE_PATTERN = re.compile(r"^(\d{2})(\d{2})(\d{4})")


@dataclass
class FileMetadata:
    """Metadata extracted from file path."""
    source_file: str
    date: Optional[date]
    wind_farms: list[str]
    insurance_lines: list[str]
    project_phase: Optional[str]
    topics: list[str]
    language: str
    folder_path: str


def extract_date(filename: str) -> Optional[date]:
    """Extract date from filename in DDMMYYYY format."""
    match = DATE_PATTERN.match(filename)
    if match:
        day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        try:
            return date(year, month, day)
        except ValueError:
            return None
    return None


def extract_metadata(file_path: str | Path) -> FileMetadata:
    """Extract all metadata from a file's path and name."""
    file_path = Path(file_path)
    filename = file_path.stem
    parts = [p.lower() for p in file_path.parts]
    folder_path = str(file_path.parent)

    # Date
    file_date = extract_date(filename)

    # Language
    language = "de"
    fname_lower = filename.lower()
    if fname_lower.endswith(" en") or " en " in fname_lower or fname_lower.endswith("_en"):
        language = "en"

    # Wind farms - use immediate parent folder + filename only
    # The grandparent "Betrieb b1 b2 hs" is a category, not a specific wind farm
    wind_farms = set()
    immediate_folder = file_path.parent.name.lower()
    search_text = f"{immediate_folder} {fname_lower}"

    # Special handling for combined folders first
    if "b1 und b2" in immediate_folder or "b1 und b2" in fname_lower:
        wind_farms.update(["Baltic 1", "Baltic 2"])
    elif "alb und hs" in immediate_folder or "alb und hs" in fname_lower:
        wind_farms.update(["Albatros", "Hohe See"])
    else:
        for key, farm in WIND_FARM_MAP.items():
            if key in search_text:
                wind_farms.add(farm)

    # Insurance lines
    insurance_lines = set()
    for key, line in INSURANCE_LINE_MAP.items():
        if key in parts or key in fname_lower.split():
            insurance_lines.add(line)

    # Project phase - check full path for this since phase is a broader category
    full_path_text = " ".join(parts)
    project_phase = None
    for key, phase in PROJECT_PHASE_MAP.items():
        if key in full_path_text:
            project_phase = phase
            break

    # Topics
    topics = set()
    for key, topic in TOPIC_MAP.items():
        if key in search_text:
            topics.add(topic)

    return FileMetadata(
        source_file=str(file_path),
        date=file_date,
        wind_farms=sorted(wind_farms),
        insurance_lines=sorted(insurance_lines),
        project_phase=project_phase,
        topics=sorted(topics),
        language=language,
        folder_path=folder_path,
    )


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python metadata_extractor.py <file_path>")
        sys.exit(1)

    meta = extract_metadata(sys.argv[1])
    print(f"File: {meta.source_file}")
    print(f"Date: {meta.date}")
    print(f"Wind farms: {meta.wind_farms}")
    print(f"Insurance lines: {meta.insurance_lines}")
    print(f"Phase: {meta.project_phase}")
    print(f"Topics: {meta.topics}")
    print(f"Language: {meta.language}")
