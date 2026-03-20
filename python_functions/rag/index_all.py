"""
Index all text transcript files into Qdrant.
Run: C:\Python311\python.exe python_functions/rag/index_all.py
"""

import sys
import time
import json
from pathlib import Path

# Force unbuffered output so you see progress immediately
sys.stdout.reconfigure(line_buffering=True)

sys.path.insert(0, str(Path(__file__).parent))
from chunker import chunk_transcript, Chunk
from embedder import embed_and_index_chunks, get_openai_client
from vector_store import get_client, create_collection, get_collection_info

CORPUS_DIRS = [
    Path(r"C:\Users\User\Dropbox\Know\Protokollen ABU\Protokollen"),
    Path(r"C:\Users\User\Dropbox\Know\in Progress\2024"),
]

PROGRESS_FILE = Path(__file__).parent.parent.parent / "indexing_progress.json"


def load_progress() -> set:
    if PROGRESS_FILE.exists():
        data = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        return set(data.get("indexed_files", []))
    return set()


def save_progress(indexed: set):
    PROGRESS_FILE.write_text(
        json.dumps({"indexed_files": sorted(indexed)}, indent=2),
        encoding="utf-8",
    )


def main():
    # Collect ONLY actual files, not directories
    files = []
    for d in CORPUS_DIRS:
        for ext in ("*.txt", "*.srt"):
            for f in d.rglob(ext):
                if f.is_file():
                    files.append(f)

    print(f"Found {len(files)} files to index")

    indexed = load_progress()
    remaining = [f for f in files if str(f) not in indexed]
    print(f"Already indexed: {len(indexed)}")
    print(f"Remaining: {len(remaining)}")

    if not remaining:
        print("All files already indexed!")
        return

    openai_client = get_openai_client()
    qdrant_client = get_client()
    create_collection(qdrant_client)

    total_chunks = 0
    errors = []
    start_time = time.time()

    # Process ONE file at a time for reliable progress output
    for i, f in enumerate(remaining):
        file_start = time.time()

        try:
            print(f"[{i+1}/{len(remaining)}] Parsing {f.name}...", end=" ")
            chunks = chunk_transcript(str(f))
            print(f"{len(chunks)} chunks.", end=" ")

            if chunks:
                print("Embedding...", end=" ")
                n = embed_and_index_chunks(chunks, openai_client, qdrant_client)
                total_chunks += n
                print(f"Done.", end=" ")

            indexed.add(str(f))
            save_progress(indexed)

            elapsed = time.time() - start_time
            file_time = time.time() - file_start
            files_done = i + 1
            rate = files_done / elapsed * 60 if elapsed > 0 else 0
            eta = (len(remaining) - files_done) / (files_done / elapsed) / 60 if elapsed > 0 else 0
            print(f"({file_time:.1f}s | {rate:.0f} files/min | ETA: {eta:.0f}min)")

        except Exception as e:
            errors.append((str(f), f"{type(e).__name__}: {e}"))
            indexed.add(str(f))  # Skip next time
            save_progress(indexed)
            print(f"ERROR: {type(e).__name__}: {e}")

    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Done in {elapsed/60:.1f} minutes")
    print(f"Total chunks indexed: {total_chunks}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for path, err in errors[:20]:
            print(f"  {Path(path).name}: {err}")

    info = get_collection_info(qdrant_client)
    print(f"\nQdrant: {info}")


if __name__ == "__main__":
    main()
