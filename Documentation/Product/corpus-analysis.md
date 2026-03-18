# Corpus Analysis

> **Last updated:** March 2026

---

## Source Locations

| Folder | Path |
|--------|------|
| **Protokollen ABU** | `C:\Users\User\Dropbox\Know\Protokollen ABU` |
| **in Progress** | `C:\Users\User\Dropbox\Know\in Progress` |

---

## File Counts

| Type | Protokollen ABU | in Progress | Total |
|------|----------------|-------------|-------|
| Text (.txt) | 262 | 14 | 276 |
| Subtitles (.srt) | 552 | 334 | 886 |
| Audio (.m4a/.mp3/.wav) | 226 | 37 | 263 |
| **Text-based total** | **814** | **348** | **1,162** |

---

## File Formats

### Format A: SRT with timestamps and speaker IDs
Found in `.txt` files. Contains numbered segments with timestamps and speaker labels.
```
1
00:00:02,295 --> 00:00:06,938
[SPEAKER_00]: Ja, hallo Gusto.

2
00:00:07,018 --> 00:00:10,860
[SPEAKER_00]: Alles gut.
```

### Format B: SRT with named speakers, no timestamps
Found in `.srt` files. Plain text with speaker names as prefixes.
```
SSH: Okay, dann machen wir, dann lohnt sich das vielleicht auch gar nicht so durch die Folien durchzugehen.

SSH: Sondern dann lass mich da mal irgendwie zwei Punkte vielleicht nochmal hervorheben...
```

### Format C: SRT with named speakers and timestamps
Found in some `.txt` files. Mix of timestamps and real names.
```
3
00:01:37,858 --> 00:01:50,304
Reimers: Hallo zusammen, hallo Herr Schulz, hallo Bustermantel.
```

---

## Folder Structure (Protokollen ABU)

Organized by wind farm / project / topic — this provides **implicit metadata**:

```
Protokollen ABU/
├── Audios/                          ← Raw audio files
├── Protokollen/
│   ├── Betrieb b1 b2 hs/           ← Operations: Baltic 1, Baltic 2, Hohe See
│   │   ├── ALB und HS/             ← ALB and Hohe See specific
│   │   │   └── HS/                 ← Hohe See sub-folder
│   │   ├── B1 und B2/              ← Baltic 1 and Baltic 2
│   │   ├── EOS/                    ← EOS related
│   │   ├── OAR/                    ← Operational All Risks
│   │   │   └── OAR 23/             ← OAR 2023 renewal
│   │   └── Risk Survey/            ← Risk survey discussions
│   ├── claims/                      ← Insurance claims
│   ├── CPS/                         ← Construction phase
│   │   ├── BV/
│   │   └── Kerstin Documentation/
│   ├── DKT/                         ← DKT project
│   │   └── Certification/
│   ├── UK/                          ← UK offshore wind project
│   │   ├── broker/
│   │   ├── export cable/
│   │   ├── FOU/                     ← Foundations
│   │   ├── GBS/                     ← Gravity-based structures
│   │   ├── IAG/
│   │   ├── JF/
│   │   ├── on and offshore substations/
│   │   ├── onshore works/
│   │   ├── RM/                      ← Risk management
│   │   └── WTG/                     ← Wind turbine generators
│   └── VV/                          ← Contract negotiations (Vertragsverhandlung)
│       └── TPL/                     ← Third-party liability
└── Protokollen Mult/
    └── Transition 2/                ← Project transition discussions
        ├── 082023 - 122023/         ← Monthly folders
        └── 012024 - 032024/
```

---

## Metadata Extractable from File Paths

| Metadata Field | Source | Examples |
|---------------|--------|---------|
| **Date** | Filename prefix (DDMMYYYY) | `03092024` → 2024-09-03 |
| **Wind farm** | Folder name | Baltic 1, Baltic 2, Hohe See, UK project |
| **Insurance line** | Folder name | OAR, Claims, CPS (CAR), ALB |
| **Project phase** | Folder name | Betrieb (operations), CPS (construction), Transition |
| **Topic** | Folder + filename | Risk Survey, Certification, WTG, export cable |
| **Language** | Filename suffix or content | `en` suffix = English, otherwise German |
| **Participants** | Filename or speaker labels | Named speakers in content |

---

## Chunking Strategy Considerations

1. **Timestamps are available** — can be used to create time-based chunks (e.g., 2-5 minute segments)
2. **Speaker turns** — natural breakpoints for chunking
3. **Mixed languages** — mostly German, some English (marked with `en` in filename)
4. **Conversation style** — informal expert discussions, not structured documents
5. **Multi-topic within single file** — as noted in Product.md, conversations often span multiple topics
6. **Two parsing pipelines needed** — one for Format A (timestamps + IDs), one for Format B (plain text + names)
