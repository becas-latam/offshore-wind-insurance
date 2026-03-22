"""
Knowledge Loader
=================
Loads markdown files from the knowledge folders and returns them
as context for AI prompts.
"""

from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).parent


def load_knowledge(*folders: str) -> str:
    """
    Load all .md files from the specified subfolders (e.g., 'construction', 'general').
    Returns concatenated content with file headers.
    Skips README.md.
    """
    sections = []

    for folder in folders:
        folder_path = KNOWLEDGE_DIR / folder
        if not folder_path.exists():
            continue

        files = sorted(folder_path.glob("*.md"))
        for f in files:
            if f.name.lower() == "readme.md":
                continue
            content = f.read_text(encoding="utf-8").strip()
            if content:
                sections.append(f"### {f.stem}\n\n{content}")

    if not sections:
        return ""

    return "## Domain Knowledge\n\n" + "\n\n---\n\n".join(sections)
