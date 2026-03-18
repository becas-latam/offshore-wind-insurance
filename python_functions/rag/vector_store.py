"""
Vector Store (Qdrant)
=====================
Manages the Qdrant vector database for the RAG pipeline.

Supports:
  - Local Docker: QDRANT_URL=http://localhost:6333
  - Qdrant Cloud: QDRANT_URL=https://xxx.cloud.qdrant.io + QDRANT_API_KEY
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
    PayloadSchemaType,
)

load_dotenv(Path(__file__).parent.parent.parent / ".env")

COLLECTION_NAME = "transcripts"
EMBEDDING_DIM = 3072  # OpenAI text-embedding-3-large


def get_client() -> QdrantClient:
    """Get Qdrant client based on environment."""
    url = os.getenv("QDRANT_URL", "http://localhost:6333")
    api_key = os.getenv("QDRANT_API_KEY")

    if api_key:
        return QdrantClient(url=url, api_key=api_key)
    return QdrantClient(url=url)


def create_collection(client: QdrantClient | None = None) -> None:
    """Create the transcripts collection with payload indexes."""
    if client is None:
        client = get_client()

    # Check if collection exists
    collections = client.get_collections().collections
    if any(c.name == COLLECTION_NAME for c in collections):
        print(f"Collection '{COLLECTION_NAME}' already exists.")
        return

    # Create collection
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=EMBEDDING_DIM,
            distance=Distance.COSINE,
        ),
    )

    # Create payload indexes for filtered search
    index_fields = {
        "wind_farms": PayloadSchemaType.KEYWORD,
        "insurance_lines": PayloadSchemaType.KEYWORD,
        "project_phase": PayloadSchemaType.KEYWORD,
        "language": PayloadSchemaType.KEYWORD,
        "topics": PayloadSchemaType.KEYWORD,
        "speakers": PayloadSchemaType.KEYWORD,
        "date": PayloadSchemaType.KEYWORD,
        "source_file": PayloadSchemaType.KEYWORD,
    }

    for field_name, schema_type in index_fields.items():
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name=field_name,
            field_schema=schema_type,
        )

    print(f"Collection '{COLLECTION_NAME}' created with indexes.")


def upsert_chunks(
    chunks: list[dict],
    vectors: list[list[float]],
    client: QdrantClient | None = None,
    batch_size: int = 100,
) -> None:
    """Upsert chunks with their embeddings into Qdrant."""
    if client is None:
        client = get_client()

    points = []
    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
        point = PointStruct(
            id=chunk["id"],
            vector=vector,
            payload=chunk,
        )
        points.append(point)

        # Batch upsert
        if len(points) >= batch_size:
            client.upsert(collection_name=COLLECTION_NAME, points=points)
            points = []

    # Final batch
    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points)


def search(
    query_vector: list[float],
    limit: int = 5,
    wind_farms: list[str] | None = None,
    insurance_lines: list[str] | None = None,
    project_phase: str | None = None,
    language: str | None = None,
    client: QdrantClient | None = None,
) -> list[dict]:
    """Search for similar chunks with optional metadata filters."""
    if client is None:
        client = get_client()

    # Build filter conditions
    conditions = []
    if wind_farms:
        conditions.append(
            FieldCondition(key="wind_farms", match=MatchAny(any=wind_farms))
        )
    if insurance_lines:
        conditions.append(
            FieldCondition(key="insurance_lines", match=MatchAny(any=insurance_lines))
        )
    if project_phase:
        conditions.append(
            FieldCondition(key="project_phase", match=MatchValue(value=project_phase))
        )
    if language:
        conditions.append(
            FieldCondition(key="language", match=MatchValue(value=language))
        )

    query_filter = Filter(must=conditions) if conditions else None

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=limit,
        with_payload=True,
    )

    return [
        {
            "score": point.score,
            "text": point.payload.get("text", ""),
            "source_file": point.payload.get("source_file", ""),
            "wind_farms": point.payload.get("wind_farms", []),
            "insurance_lines": point.payload.get("insurance_lines", []),
            "project_phase": point.payload.get("project_phase"),
            "date": point.payload.get("date"),
            "speakers": point.payload.get("speakers", []),
            "chunk_index": point.payload.get("chunk_index"),
        }
        for point in results.points
    ]


def get_collection_info(client: QdrantClient | None = None) -> dict:
    """Get collection stats."""
    if client is None:
        client = get_client()

    info = client.get_collection(COLLECTION_NAME)
    return {
        "points_count": info.points_count,
        "status": info.status.value,
    }


if __name__ == "__main__":
    client = get_client()
    print(f"Connected to Qdrant")
    create_collection(client)
    info = get_collection_info(client)
    print(f"Collection info: {info}")
