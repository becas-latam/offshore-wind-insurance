"""
Simple indexing script — no complex imports, no batching.
Run from project root: C:\Python311\python.exe index_now.py
"""
import sys
import os
import time
import json
import re
from pathlib import Path
from uuid import uuid4

# Force immediate output
sys.stdout.reconfigure(line_buffering=True)
os.environ["PYTHONUNBUFFERED"] = "1"

from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

print("Connecting to OpenAI...", flush=True)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

print("Connecting to Qdrant...", flush=True)
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

COLLECTION = "transcripts"
PROGRESS_FILE = Path("indexing_progress.json")

CORPUS_DIRS = [
    Path(r"C:\Users\User\Dropbox\Know\Protokollen ABU\Protokollen"),
    Path(r"C:\Users\User\Dropbox\Know\in Progress\2024"),
]

# --- Simple parser ---
TIMESTAMP_RE = re.compile(r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})")
SPEAKER_ID_RE = re.compile(r"^\[?(SPEAKER_\d+)\]?:\s*(.*)$")
NAMED_SPEAKER_RE = re.compile(r"^([A-ZÄÖÜa-zäöüß][A-Za-zÄÖÜäöüß\-\s]{0,30}):\s+(.+)$")
DATE_RE = re.compile(r"^(\d{2})(\d{2})(\d{4})")

WIND_FARM_MAP = {"b1 und b2": ["Baltic 1", "Baltic 2"], "alb und hs": ["Albatros", "Hohe See"],
    "b1": ["Baltic 1"], "b2": ["Baltic 2"], "hs": ["Hohe See"], "alb": ["Albatros"],
    "eos": ["EOS"], "uk": ["UK Offshore"], "dkt": ["DKT"], "cps": ["CPS"]}

def parse_and_chunk(filepath):
    """Parse file and return list of text chunks with metadata."""
    fp = Path(filepath)
    content = None
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            content = fp.read_text(encoding=enc)
            break
        except (UnicodeDecodeError, UnicodeError):
            continue
    if not content:
        return []

    # Split into paragraphs
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    # Remove timestamp lines and SRT indices, keep text
    clean_lines = []
    for para in paragraphs:
        lines = para.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if re.match(r"^\d+$", line):
                continue
            if TIMESTAMP_RE.match(line):
                continue
            # Extract speaker
            m = SPEAKER_ID_RE.match(line)
            if m:
                clean_lines.append(f"{m.group(1)}: {m.group(2)}")
                continue
            m = NAMED_SPEAKER_RE.match(line)
            if m:
                clean_lines.append(f"{m.group(1)}: {m.group(2)}")
                continue
            clean_lines.append(line)

    if not clean_lines:
        return []

    # Chunk by ~25 lines with overlap
    chunks = []
    step = 22
    for i in range(0, len(clean_lines), step):
        chunk_text = "\n".join(clean_lines[i:i+25])
        if len(chunk_text) < 80:
            continue
        chunks.append(chunk_text)

    # Extract metadata from path
    folder = fp.parent.name.lower()
    fname = fp.stem.lower()
    search = f"{folder} {fname}"

    wind_farms = []
    for key, farms in WIND_FARM_MAP.items():
        if key in search:
            wind_farms.extend(farms)
    wind_farms = list(set(wind_farms))

    lang = "en" if fname.endswith(" en") or " en " in fname else "de"

    date_str = None
    dm = DATE_RE.match(fp.stem)
    if dm:
        try:
            from datetime import date
            date_str = date(int(dm.group(3)), int(dm.group(2)), int(dm.group(1))).isoformat()
        except ValueError:
            pass

    return [{"id": str(uuid4()), "text": t, "source_file": str(fp), "wind_farms": wind_farms,
             "language": lang, "date": date_str, "chunk_index": idx, "total_chunks": len(chunks)}
            for idx, t in enumerate(chunks)]


def embed_chunks(chunks):
    """Embed and upsert chunks."""
    if not chunks:
        return 0
    texts = [c["text"] for c in chunks]
    # Embed in batches of 50
    all_vectors = []
    for i in range(0, len(texts), 50):
        batch = texts[i:i+50]
        resp = openai_client.embeddings.create(model="text-embedding-3-large", input=batch)
        all_vectors.extend([item.embedding for item in resp.data])

    points = [PointStruct(id=c["id"], vector=v, payload=c) for c, v in zip(chunks, all_vectors)]
    # Upsert in batches of 100
    for i in range(0, len(points), 100):
        qdrant_client.upsert(collection_name=COLLECTION, points=points[i:i+100])
    return len(chunks)


def load_progress():
    if PROGRESS_FILE.exists():
        return set(json.loads(PROGRESS_FILE.read_text(encoding="utf-8")).get("indexed_files", []))
    return set()

def save_progress(indexed):
    PROGRESS_FILE.write_text(json.dumps({"indexed_files": sorted(indexed)}, indent=2), encoding="utf-8")


def main():
    files = []
    for d in CORPUS_DIRS:
        for ext in ("*.txt", "*.srt"):
            for f in d.rglob(ext):
                if f.is_file():
                    files.append(f)

    indexed = load_progress()
    remaining = [f for f in files if str(f) not in indexed]
    print(f"Files: {len(files)} total, {len(indexed)} done, {len(remaining)} remaining", flush=True)

    total_chunks = 0
    errors = 0
    start = time.time()

    for i, f in enumerate(remaining):
        try:
            t0 = time.time()
            chunks = parse_and_chunk(f)
            n = embed_chunks(chunks) if chunks else 0
            total_chunks += n
            indexed.add(str(f))
            save_progress(indexed)

            elapsed = time.time() - start
            rate = (i + 1) / elapsed * 60
            eta = (len(remaining) - i - 1) / rate if rate > 0 else 0
            print(f"[{i+1}/{len(remaining)}] {f.name} -> {n} chunks ({time.time()-t0:.1f}s) | {rate:.0f}/min | ETA {eta:.0f}min", flush=True)

        except Exception as e:
            errors += 1
            indexed.add(str(f))
            save_progress(indexed)
            print(f"[{i+1}/{len(remaining)}] ERROR {f.name}: {type(e).__name__}: {e}", flush=True)

    print(f"\nDone in {(time.time()-start)/60:.1f} min | {total_chunks} chunks | {errors} errors", flush=True)


if __name__ == "__main__":
    main()
