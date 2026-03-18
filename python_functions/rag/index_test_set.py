"""Index a test set of transcript files."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from embedder import embed_single_file

corpus_dir = Path(r"C:\Users\User\Dropbox\Know\Protokollen ABU\Protokollen")

files = [
    corpus_dir / "Betrieb b1 b2 hs" / "B1 und B2" / "01092023 WKP Kabel nicht Mitversicherung.txt",
    corpus_dir / "Betrieb b1 b2 hs" / "OAR" / "OAR 23" / "10112023 Baltic 1 Beteiligte und Claims.srt",
    corpus_dir / "Betrieb b1 b2 hs" / "B1 und B2" / "01072024 B2 Ala en.srt",
    corpus_dir / "Betrieb b1 b2 hs" / "ALB und HS" / "14062024 ALB Serial loss clause.srt",
    corpus_dir / "Betrieb b1 b2 hs" / "OAR" / "OAR 23" / "09102023 VV Sideletter AGCS.srt",
    corpus_dir / "claims" / "14022024 VV Reim.txt",
    corpus_dir / "Betrieb b1 b2 hs" / "ALB und HS" / "25112024 HS Terrordeckung CPS update mit GF.srt",
]

total = 0
for f in files:
    if not f.exists():
        print(f"SKIP (not found): {f.name}")
        continue
    try:
        n = embed_single_file(str(f))
        total += n
        print(f"  -> {n} chunks")
    except Exception as e:
        print(f"  ERROR: {e}")

print(f"\nTotal: {total} new chunks indexed")
