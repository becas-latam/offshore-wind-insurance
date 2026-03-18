"""
Transcript Parser
=================
Parses offshore wind insurance transcripts from multiple formats into a unified structure.

Supported formats:
  A) SRT with timestamps + speaker IDs:    [SPEAKER_00]: text
  B) Plain text with named speakers:        Name: text (no timestamps)
  C) SRT with timestamps + named speakers:  timestamps + Name: text
  D) Plain text without any markers:         raw conversation text
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class Segment:
    """A single segment of a transcript."""
    index: Optional[int]
    start_time: Optional[str]  # "HH:MM:SS,mmm" or None
    end_time: Optional[str]
    speaker: Optional[str]
    text: str

    @property
    def start_seconds(self) -> Optional[float]:
        if not self.start_time:
            return None
        return _time_to_seconds(self.start_time)

    @property
    def end_seconds(self) -> Optional[float]:
        if not self.end_time:
            return None
        return _time_to_seconds(self.end_time)


@dataclass
class ParsedTranscript:
    """Parsed transcript with metadata."""
    source_file: str
    format_detected: str  # "srt_speaker_id", "srt_named", "plain_named", "plain_raw"
    segments: list[Segment] = field(default_factory=list)
    has_timestamps: bool = False
    has_speakers: bool = False
    language_hint: Optional[str] = None  # from filename

    @property
    def full_text(self) -> str:
        """Reconstruct full text from segments."""
        parts = []
        for seg in self.segments:
            if seg.speaker:
                parts.append(f"{seg.speaker}: {seg.text}")
            else:
                parts.append(seg.text)
        return "\n".join(parts)

    @property
    def duration_seconds(self) -> Optional[float]:
        """Total duration if timestamps available."""
        if not self.has_timestamps or not self.segments:
            return None
        last = self.segments[-1]
        return last.end_seconds or last.start_seconds


# Regex patterns
TIMESTAMP_PATTERN = re.compile(
    r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})"
)
SRT_INDEX_PATTERN = re.compile(r"^\d+$")
SPEAKER_ID_PATTERN = re.compile(r"^\[?(SPEAKER_\d+)\]?:\s*(.*)$")
NAMED_SPEAKER_PATTERN = re.compile(r"^([A-ZÄÖÜa-zäöüß][A-Za-zÄÖÜäöüß\-\s]{0,30}):\s+(.+)$")


def _time_to_seconds(time_str: str) -> float:
    """Convert SRT timestamp to seconds."""
    h, m, rest = time_str.split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def detect_format(lines: list[str]) -> str:
    """Detect which transcript format the file uses."""
    has_timestamps = False
    has_speaker_ids = False
    has_named_speakers = False
    has_srt_indices = False

    sample = lines[:100]  # Check first 100 lines

    for line in sample:
        line = line.strip()
        if not line:
            continue
        if TIMESTAMP_PATTERN.search(line):
            has_timestamps = True
        if SRT_INDEX_PATTERN.match(line):
            has_srt_indices = True
        if SPEAKER_ID_PATTERN.match(line):
            has_speaker_ids = True
        if NAMED_SPEAKER_PATTERN.match(line):
            has_named_speakers = True

    if has_timestamps and has_speaker_ids:
        return "srt_speaker_id"  # Format A
    if has_timestamps and has_named_speakers:
        return "srt_named"  # Format C
    if has_timestamps and has_srt_indices:
        return "srt_speaker_id"  # Format A without clear speakers
    if has_named_speakers:
        return "plain_named"  # Format B
    return "plain_raw"  # Format D


def parse_srt_with_speakers(lines: list[str]) -> list[Segment]:
    """Parse Format A & C: SRT blocks with timestamps and speakers."""
    segments = []
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Skip empty lines
        if not line:
            i += 1
            continue

        # Try to find SRT index
        index = None
        if SRT_INDEX_PATTERN.match(line):
            index = int(line)
            i += 1
            if i >= len(lines):
                break
            line = lines[i].strip()

        # Try to find timestamp
        start_time = None
        end_time = None
        ts_match = TIMESTAMP_PATTERN.search(line)
        if ts_match:
            start_time = ts_match.group(1)
            end_time = ts_match.group(2)
            i += 1
            if i >= len(lines):
                break
            line = lines[i].strip()

        # Collect text lines until next empty line or next SRT index
        text_lines = []
        while i < len(lines) and lines[i].strip():
            text_lines.append(lines[i].strip())
            i += 1

        if not text_lines and line:
            text_lines = [line]

        full_text = " ".join(text_lines)

        # Extract speaker
        speaker = None
        text = full_text

        sp_match = SPEAKER_ID_PATTERN.match(full_text)
        if sp_match:
            speaker = sp_match.group(1)
            text = sp_match.group(2)
        else:
            nm_match = NAMED_SPEAKER_PATTERN.match(full_text)
            if nm_match:
                speaker = nm_match.group(1)
                text = nm_match.group(2)

        if text.strip():
            segments.append(Segment(
                index=index,
                start_time=start_time,
                end_time=end_time,
                speaker=speaker,
                text=text.strip(),
            ))

        i += 1

    return segments


def parse_plain_named(lines: list[str]) -> list[Segment]:
    """Parse Format B: Plain text with named speakers, no timestamps."""
    segments = []
    current_speaker = None
    current_lines = []
    idx = 0

    for line in lines:
        line = line.strip()
        if not line:
            if current_lines:
                text = " ".join(current_lines)
                segments.append(Segment(
                    index=idx,
                    start_time=None,
                    end_time=None,
                    speaker=current_speaker,
                    text=text,
                ))
                idx += 1
                current_lines = []
            continue

        nm_match = NAMED_SPEAKER_PATTERN.match(line)
        if nm_match:
            # Save previous segment
            if current_lines:
                text = " ".join(current_lines)
                segments.append(Segment(
                    index=idx,
                    start_time=None,
                    end_time=None,
                    speaker=current_speaker,
                    text=text,
                ))
                idx += 1
                current_lines = []
            current_speaker = nm_match.group(1)
            current_lines.append(nm_match.group(2))
        else:
            current_lines.append(line)

    # Final segment
    if current_lines:
        text = " ".join(current_lines)
        segments.append(Segment(
            index=idx,
            start_time=None,
            end_time=None,
            speaker=current_speaker,
            text=text,
        ))

    return segments


def parse_plain_raw(lines: list[str]) -> list[Segment]:
    """Parse Format D: Plain text without any markers."""
    segments = []
    current_lines = []
    idx = 0

    for line in lines:
        line = line.strip()
        if not line:
            if current_lines:
                text = " ".join(current_lines)
                segments.append(Segment(
                    index=idx,
                    start_time=None,
                    end_time=None,
                    speaker=None,
                    text=text,
                ))
                idx += 1
                current_lines = []
            continue
        current_lines.append(line)

    if current_lines:
        text = " ".join(current_lines)
        segments.append(Segment(
            index=idx,
            start_time=None,
            end_time=None,
            speaker=None,
            text=text,
        ))

    return segments


def parse_file(file_path: str | Path) -> ParsedTranscript:
    """Parse a transcript file and return unified structure."""
    file_path = Path(file_path)

    # Read file with fallback encodings
    content = None
    for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            content = file_path.read_text(encoding=encoding)
            break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if content is None:
        raise ValueError(f"Could not decode file: {file_path}")

    lines = content.splitlines()

    # Detect language hint from filename
    language_hint = "de"  # Default German
    fname_lower = file_path.stem.lower()
    if fname_lower.endswith(" en") or " en " in fname_lower or fname_lower.endswith("_en"):
        language_hint = "en"

    # Detect format and parse
    fmt = detect_format(lines)

    if fmt in ("srt_speaker_id", "srt_named"):
        segments = parse_srt_with_speakers(lines)
    elif fmt == "plain_named":
        segments = parse_plain_named(lines)
    else:
        segments = parse_plain_raw(lines)

    has_timestamps = any(s.start_time is not None for s in segments)
    has_speakers = any(s.speaker is not None for s in segments)

    return ParsedTranscript(
        source_file=str(file_path),
        format_detected=fmt,
        segments=segments,
        has_timestamps=has_timestamps,
        has_speakers=has_speakers,
        language_hint=language_hint,
    )


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python transcript_parser.py <file_path>")
        sys.exit(1)

    result = parse_file(sys.argv[1])
    print(f"File: {result.source_file}")
    print(f"Format: {result.format_detected}")
    print(f"Segments: {len(result.segments)}")
    print(f"Has timestamps: {result.has_timestamps}")
    print(f"Has speakers: {result.has_speakers}")
    print(f"Language: {result.language_hint}")
    if result.duration_seconds:
        mins = result.duration_seconds / 60
        print(f"Duration: {mins:.1f} minutes")
    print(f"\nFirst 3 segments:")
    for seg in result.segments[:3]:
        print(f"  [{seg.speaker or 'unknown'}] {seg.text[:100]}")
