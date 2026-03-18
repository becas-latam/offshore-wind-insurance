"""
Transcript Chunker
==================
Chunks parsed transcripts into segments suitable for embedding and retrieval.

Strategy:
  - For files WITH timestamps: chunk by time windows (default 3 minutes)
  - For files WITHOUT timestamps: chunk by segment count with overlap
  - Each chunk includes surrounding context for coherence
  - Metadata is attached from the metadata extractor
"""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent / "parsers"))
from transcript_parser import ParsedTranscript, Segment, parse_file
from metadata_extractor import FileMetadata, extract_metadata


@dataclass
class Chunk:
    """A chunk ready for embedding."""
    id: str
    text: str
    source_file: str
    chunk_index: int
    total_chunks: int

    # Time info (if available)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None

    # Metadata from file path
    date: Optional[str] = None
    wind_farms: list[str] = field(default_factory=list)
    insurance_lines: list[str] = field(default_factory=list)
    project_phase: Optional[str] = None
    topics: list[str] = field(default_factory=list)
    language: str = "de"

    # Content metadata
    speakers: list[str] = field(default_factory=list)
    format_detected: str = ""
    segment_count: int = 0

    def to_dict(self) -> dict:
        """Convert to dict for Qdrant payload."""
        return {
            "id": self.id,
            "text": self.text,
            "source_file": self.source_file,
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "start_seconds": self.start_seconds,
            "end_seconds": self.end_seconds,
            "date": self.date,
            "wind_farms": self.wind_farms,
            "insurance_lines": self.insurance_lines,
            "project_phase": self.project_phase,
            "topics": self.topics,
            "language": self.language,
            "speakers": self.speakers,
            "format_detected": self.format_detected,
            "segment_count": self.segment_count,
        }


def _segments_to_text(segments: list[Segment]) -> str:
    """Convert segments to readable text."""
    lines = []
    for seg in segments:
        if seg.speaker:
            lines.append(f"{seg.speaker}: {seg.text}")
        else:
            lines.append(seg.text)
    return "\n".join(lines)


def _get_speakers(segments: list[Segment]) -> list[str]:
    """Extract unique speakers from segments."""
    speakers = set()
    for seg in segments:
        if seg.speaker:
            speakers.add(seg.speaker)
    return sorted(speakers)


def chunk_by_time(
    transcript: ParsedTranscript,
    window_seconds: float = 180,  # 3 minutes
    overlap_seconds: float = 30,  # 30 second overlap
) -> list[list[Segment]]:
    """Chunk transcript by time windows."""
    if not transcript.segments:
        return []

    chunks = []
    current_start = 0.0
    segments = transcript.segments

    while current_start < (transcript.duration_seconds or 0):
        window_end = current_start + window_seconds
        chunk_segments = [
            s for s in segments
            if s.start_seconds is not None
            and s.start_seconds >= current_start - overlap_seconds
            and s.start_seconds < window_end
        ]
        if chunk_segments:
            chunks.append(chunk_segments)
        current_start = window_end - overlap_seconds

    # If no time-based chunks worked, fall back to segment-based
    if not chunks:
        return chunk_by_segments(transcript)

    return chunks


def chunk_by_segments(
    transcript: ParsedTranscript,
    max_segments: int = 25,
    overlap_segments: int = 3,
) -> list[list[Segment]]:
    """Chunk transcript by segment count."""
    if not transcript.segments:
        return []

    chunks = []
    segments = transcript.segments
    i = 0

    while i < len(segments):
        end = min(i + max_segments, len(segments))
        chunks.append(segments[i:end])
        i = end - overlap_segments
        if i <= chunks[-1][0].index if chunks[-1][0].index else 0:
            i = end  # Prevent infinite loop

    return chunks


def chunk_transcript(
    file_path: str | Path,
    time_window_seconds: float = 180,
    max_segments_per_chunk: int = 25,
    min_chunk_chars: int = 100,
) -> list[Chunk]:
    """Parse, chunk, and attach metadata to a transcript file."""
    file_path = Path(file_path)

    # Parse
    transcript = parse_file(file_path)
    metadata = extract_metadata(file_path)

    if not transcript.segments:
        return []

    # Choose chunking strategy
    if transcript.has_timestamps:
        segment_groups = chunk_by_time(transcript, time_window_seconds)
    else:
        segment_groups = chunk_by_segments(transcript, max_segments_per_chunk)

    # Build chunks
    chunks = []
    total = len(segment_groups)

    for i, seg_group in enumerate(segment_groups):
        text = _segments_to_text(seg_group)

        # Skip tiny chunks
        if len(text) < min_chunk_chars:
            continue

        chunk = Chunk(
            id=str(uuid4()),
            text=text,
            source_file=str(file_path),
            chunk_index=i,
            total_chunks=total,
            start_time=seg_group[0].start_time,
            end_time=seg_group[-1].end_time,
            start_seconds=seg_group[0].start_seconds,
            end_seconds=seg_group[-1].end_seconds,
            date=metadata.date.isoformat() if metadata.date else None,
            wind_farms=metadata.wind_farms,
            insurance_lines=metadata.insurance_lines,
            project_phase=metadata.project_phase,
            topics=metadata.topics,
            language=metadata.language,
            speakers=_get_speakers(seg_group),
            format_detected=transcript.format_detected,
            segment_count=len(seg_group),
        )
        chunks.append(chunk)

    return chunks


def chunk_corpus(
    corpus_dirs: list[str | Path],
    time_window_seconds: float = 180,
    max_segments_per_chunk: int = 25,
) -> list[Chunk]:
    """Chunk all transcript files in the corpus directories."""
    all_chunks = []
    errors = []

    for corpus_dir in corpus_dirs:
        corpus_dir = Path(corpus_dir)
        for ext in ("*.txt", "*.srt"):
            for f in corpus_dir.rglob(ext):
                try:
                    chunks = chunk_transcript(
                        f,
                        time_window_seconds=time_window_seconds,
                        max_segments_per_chunk=max_segments_per_chunk,
                    )
                    all_chunks.extend(chunks)
                except Exception as e:
                    errors.append((str(f), str(e)))

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for path, err in errors[:10]:
            print(f"  {path}: {err}")

    return all_chunks


if __name__ == "__main__":
    CORPUS_DIRS = [
        r"C:\Users\User\Dropbox\Know\Protokollen ABU",
        r"C:\Users\User\Dropbox\Know\in Progress",
    ]

    print("Chunking entire corpus...")
    chunks = chunk_corpus(CORPUS_DIRS)

    print(f"\nTotal chunks: {len(chunks)}")

    # Stats
    languages = {}
    wind_farms = {}
    phases = {}
    for c in chunks:
        languages[c.language] = languages.get(c.language, 0) + 1
        for wf in c.wind_farms:
            wind_farms[wf] = wind_farms.get(wf, 0) + 1
        if c.project_phase:
            phases[c.project_phase] = phases.get(c.project_phase, 0) + 1

    print(f"\nBy language: {languages}")
    print(f"By wind farm: {wind_farms}")
    print(f"By phase: {phases}")

    # Sample
    if chunks:
        c = chunks[0]
        print(f"\nSample chunk:")
        print(f"  File: {c.source_file}")
        print(f"  Wind farms: {c.wind_farms}")
        print(f"  Insurance: {c.insurance_lines}")
        print(f"  Phase: {c.project_phase}")
        print(f"  Language: {c.language}")
        print(f"  Speakers: {c.speakers}")
        print(f"  Text preview: {c.text[:200]}...")
