"""Test the parser against all transcript files in the corpus."""

from pathlib import Path
from collections import Counter
from transcript_parser import parse_file

CORPUS_DIRS = [
    Path(r"C:\Users\User\Dropbox\Know\Protokollen ABU"),
    Path(r"C:\Users\User\Dropbox\Know\in Progress"),
]

def main():
    formats = Counter()
    languages = Counter()
    errors = []
    total_segments = 0
    total_files = 0

    for corpus_dir in CORPUS_DIRS:
        for ext in ("*.txt", "*.srt"):
            for f in corpus_dir.rglob(ext):
                try:
                    result = parse_file(f)
                    formats[result.format_detected] += 1
                    languages[result.language_hint] += 1
                    total_segments += len(result.segments)
                    total_files += 1
                except Exception as e:
                    errors.append((str(f), str(e)))

    print(f"Total files parsed: {total_files}")
    print(f"Total segments: {total_segments}")
    print(f"\nFormats detected:")
    for fmt, count in formats.most_common():
        print(f"  {fmt}: {count}")
    print(f"\nLanguages:")
    for lang, count in languages.most_common():
        print(f"  {lang}: {count}")
    print(f"\nErrors: {len(errors)}")
    for path, err in errors[:10]:
        print(f"  {path}: {err}")

if __name__ == "__main__":
    main()
