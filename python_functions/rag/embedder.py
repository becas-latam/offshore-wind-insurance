"""
Embedding Pipeline
==================
Generates embeddings for transcript chunks using OpenAI text-embedding-3-large.

Usage:
  python embedder.py                    # Embed full corpus
  python embedder.py --test             # Embed a single test file
  python embedder.py --file <path>      # Embed a specific file
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent.parent / ".env")

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "parsers"))

from chunker import chunk_transcript, chunk_corpus, Chunk
from vector_store import get_client, create_collection, upsert_chunks, get_collection_info

EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIM = 3072
BATCH_SIZE = 50  # OpenAI allows up to 2048 inputs per request


def get_openai_client() -> OpenAI:
    """Get OpenAI client."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set in .env")
    return OpenAI(api_key=api_key)


def embed_texts(texts: list[str], openai_client: OpenAI | None = None) -> list[list[float]]:
    """Generate embeddings for a list of texts."""
    if openai_client is None:
        openai_client = get_openai_client()

    all_embeddings = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        response = openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

        if i + BATCH_SIZE < len(texts):
            time.sleep(0.1)  # Rate limit courtesy

    return all_embeddings


def embed_and_index_chunks(
    chunks: list[Chunk],
    openai_client: OpenAI | None = None,
    qdrant_client=None,
) -> int:
    """Embed chunks and upsert into Qdrant. Returns number indexed."""
    if not chunks:
        return 0

    if openai_client is None:
        openai_client = get_openai_client()

    texts = [c.text for c in chunks]
    payloads = [c.to_dict() for c in chunks]

    # Embed in batches
    print(f"  Embedding {len(texts)} chunks...")
    vectors = embed_texts(texts, openai_client)

    # Upsert to Qdrant
    print(f"  Upserting to Qdrant...")
    upsert_chunks(payloads, vectors, qdrant_client)

    return len(chunks)


def embed_single_file(file_path: str) -> int:
    """Embed and index a single transcript file."""
    print(f"Processing: {file_path}")
    chunks = chunk_transcript(file_path)
    print(f"  {len(chunks)} chunks created")

    if not chunks:
        return 0

    return embed_and_index_chunks(chunks)


def embed_corpus(corpus_dirs: list[str]) -> int:
    """Embed and index the entire corpus."""
    openai_client = get_openai_client()
    qdrant_client = get_client()
    create_collection(qdrant_client)

    total_indexed = 0
    total_files = 0
    errors = []

    for corpus_dir in corpus_dirs:
        corpus_path = Path(corpus_dir)
        files = []
        for ext in ("*.txt", "*.srt"):
            files.extend(corpus_path.rglob(ext))

        print(f"\nProcessing {len(files)} files from {corpus_dir}")

        for i, f in enumerate(files):
            try:
                chunks = chunk_transcript(str(f))
                if chunks:
                    indexed = embed_and_index_chunks(
                        chunks, openai_client, qdrant_client
                    )
                    total_indexed += indexed
                    total_files += 1

                if (i + 1) % 10 == 0:
                    print(f"  Progress: {i + 1}/{len(files)} files, {total_indexed} chunks indexed")

            except Exception as e:
                errors.append((str(f), str(e)))
                print(f"  ERROR: {f}: {e}")

    print(f"\nDone! {total_files} files, {total_indexed} chunks indexed")
    if errors:
        print(f"Errors: {len(errors)}")

    info = get_collection_info(qdrant_client)
    print(f"Collection: {info}")

    return total_indexed


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Embed transcript chunks")
    parser.add_argument("--test", action="store_true", help="Test with a single file")
    parser.add_argument("--file", type=str, help="Embed a specific file")
    args = parser.parse_args()

    CORPUS_DIRS = [
        r"C:\Users\User\Dropbox\Know\Protokollen ABU",
        r"C:\Users\User\Dropbox\Know\in Progress",
    ]

    if args.file:
        embed_single_file(args.file)
    elif args.test:
        test_file = r"C:\Users\User\Dropbox\Know\Protokollen ABU\Protokollen\claims\05072024 Claims JF.txt"
        embed_single_file(test_file)
    else:
        embed_corpus(CORPUS_DIRS)
