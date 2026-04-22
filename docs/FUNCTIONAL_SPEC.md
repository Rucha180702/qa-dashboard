# QA Center — Functional Specification

**Module:** 2 — Quality Assurance Dashboard  
**Status:** MVP Complete (Hackathon Build)  
**Stack:** React 18 + TypeScript · FastAPI (Python 3.9) · SQLite · AWS S3 · AssemblyAI · Recharts

---

## 1. Overview

The QA Center lets quality analysts and supervisors review recorded customer calls, rate agent performance, transcribe audio on-demand, and track call-level and agent-level analytics.

The system connects to real AWS S3 (`ad2-production`, `ap-south-1`) for audio files. Transcription is powered by AssemblyAI with automatic language detection and English translation via MyMemory. All review data is persisted in a local SQLite database.

---

## 2. User Roles & Auth

| Role | Credentials (demo) | Access |
|---|---|---|
| QA Analyst | `analyst / analyst123` | Full QA review workflow |
| Supervisor | `supervisor / supervisor123` | Same + **Flagged calls pinned at top of list** |

- JWT-based auth (HS256, 12h expiry)
- Token stored in `localStorage` via Zustand persist
- All API requests carry `Authorization: Bearer <token>`
- Sessions survive page refresh; logout clears the token

---

## 3. Tabs

### 3.1 QA Review _(main workflow)_

Three-panel layout:

| Panel | Width | Content |
|---|---|---|
| Left | 340 px | Call list with filters |
| Center | flex-1 | Waveform audio player + Transcript |
| Right | 320 px | Rating / rubric panel |

---

#### QA-01 — Call List

- Paginated list of calls fetched from S3 (cached in SQLite, 30-min TTL)
- Each card shows: UUID (full, copy button), phone number, language chip, use-case chip, date, duration, 1–5 star score, QA status badge
- **Filters:** search (UUID / phone), date range, QA status, language, use case
- **Stats bar:** total · pending · flagged counts
- **Bulk Sample:** load N random unreviewed calls for batch review

**Supervisor view:** flagged calls appear in a collapsible red-bordered "Flagged for Review" section pinned above the main list.

---

#### QA-02 — Waveform Audio Player

- WaveSurfer.js v7 waveform rendered from S3 presigned URL (1 hr expiry)
- Controls: play/pause · ±10 s skip · 5 speed options (0.75× → 2×)
- **Skip Silence:** detects silence regions via RMS analysis (threshold 0.015, min 0.6 s), shows yellow overlay markers, auto-skips during playback when enabled

---

#### QA-03 — Transcript (auto-scroll + seek)

- Utterances auto-scroll to the active line as audio plays
- Click any utterance to seek the audio to that timestamp
- Seek bridge: `TranscriptPanel` dispatches `qa:seek` custom event → `App.tsx` listener calls `wsRef.seekTo()`

---

#### QA-04 — Language Translation Toggle

- Header button appears once translation data is available
- Toggles between original language text and English translation
- Original text shown as italic secondary line when translation is active

---

#### QA-05 — Entity Extraction

_Excluded from this module. Handled by teammate via Maxim integration._

---

#### QA-06 — Rating & Rubric

- 1–5 star overall score with visual star selector
- Rubric dimensions (5 criteria, each scored 1–5):
  - Opening & Greeting
  - Problem Understanding
  - Solution Provided
  - Communication Clarity
  - Compliance & Process
- Review upserted on every change (debounced save)

---

#### QA-07 — Timestamped Comments

- Free-text comments anchored to the current playback timestamp
- Comments listed chronologically with timestamp badge
- Delete button per comment

---

#### QA-08 — Flag for Review

- Toggle flag on any call (sets `qa_status = 'flagged'`)
- Visible to supervisors as priority item in the flagged section
- Unflagging restores previous status

---

#### QA-09 — Bulk Review Mode

- "Bulk Sample" button loads N random unreviewed calls into a session
- Banner shows progress (e.g., "Bulk mode — 2/5")
- Next / Prev navigation within the session
- Exit clears the session

---

### 3.2 Call Analysis

Filter bar (date range + language) → all charts re-derive from filters.

| Widget | Type | Description |
|---|---|---|
| Total Calls | KPI card | Count in period, % Δ vs prior |
| Pickup Rate | KPI card | % answered, pp Δ vs prior |
| Avg Duration | KPI card | Seconds per answered call |
| Avg Turns | KPI card | Conversation turn count |
| Rescheduled | KPI card | Rescheduled call count |
| Daily Call Volume | Line chart | Per-language lines over date range |
| Language Distribution | Donut chart | Share of calls by language |
| Entity Conversion Funnel | Horizontal bar | Available → Answered Q1 → Consent → Q2 |
| Pickup Rate by Language | Horizontal bar | Per-language pickup % |
| Duration & Turns Trend | Dual-axis area | Avg duration (left axis) + avg turns (right) |

> **Data source:** Deterministic dummy data seeded from date range. Replace `analyticsData.ts` functions with ClickHouse queries to go live.

---

### 3.3 Agent Analysis

Placeholder — per-agent performance metrics (calls handled, avg score, avg duration, flagged %) planned for next iteration.

---

## 4. On-Demand Transcription (AssemblyAI)

**Trigger:** selecting a call auto-fires `POST /api/calls/{id}/transcribe`

**Flow:**
1. Backend generates S3 presigned URL → submits to AssemblyAI with `speaker_labels: true`, `language_detection: true`, `speech_models: ["universal-2"]`
2. Frontend polls `GET /api/calls/{id}/transcript` every 5 s while `status ∈ {pending, in_progress}`
3. On completion: utterances parsed, translated via MyMemory (non-English), stored in SQLite
4. UI shows animated "Transcribing audio…" state → switches to utterance list when done

**Speaker mapping:** first speaker in call = Agent, second = Customer

**States:** `not_started → pending → in_progress → completed | failed`

---

## 5. Data Sources

| Data | Source | Notes |
|---|---|---|
| Audio files | AWS S3 (`ad2-production`) | Presigned URLs, 1 hr expiry |
| Call metadata (UUID, phone, date, duration) | S3 file listing | Cached in SQLite 30 min |
| Language, Use Case | **Dummy (deterministic hash)** | ← Replace with ClickHouse |
| QA reviews, comments, flags | SQLite (`qa_reviews.db`) | Local, persistent |
| Transcriptions | AssemblyAI + SQLite cache | Paid API |
| Analytics metrics | **Dummy (seeded RNG)** | ← Replace with ClickHouse |

---

## 6. API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns JWT + user info |
| GET | `/api/auth/me` | Current user from token |

### Calls
| Method | Path | Description |
|---|---|---|
| GET | `/api/calls` | List calls with filters |
| GET | `/api/calls/schemas` | Available tenants |
| GET | `/api/calls/bulk-sample` | Random unreviewed sample |
| GET | `/api/calls/{id}/audio` | Presigned audio URL |
| POST | `/api/calls/{id}/transcribe` | Submit transcription job |
| GET | `/api/calls/{id}/transcript` | Transcript status + utterances |

### Reviews
| Method | Path | Description |
|---|---|---|
| GET | `/api/reviews/{id}` | Fetch review for a call |
| PUT | `/api/reviews/{id}` | Upsert overall score + rubric |
| POST | `/api/reviews/{id}/flag` | Flag call for supervisor |
| DELETE | `/api/reviews/{id}/flag` | Remove flag |
| POST | `/api/reviews/{id}/comments` | Add timestamped comment |
| DELETE | `/api/reviews/{id}/comments/{cid}` | Delete comment |

---

## 7. S3 File Path Convention

```
media/{schema}/freeswitch/{year}/{month}/{day}/{uuid}/
  complete_call_recording_{phone}_{uuid}.wav
```

- Duration estimated from WAV size: `(filesize − 44) / 16000` bytes/s  
- Schema = tenant identifier (e.g., `ad_5c9238`)

---

## 8. Environment Variables

```env
AWS_S3_BUCKET_NAME=ad2-production
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-south-1
SCHEMA_LIST=ad_5c9238          # comma-separated; falls back to S3 discovery
ASSEMBLYAI_API_KEY=...
DATABASE_URL=./qa_reviews.db
PRESIGNED_URL_EXPIRY=3600
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=...                 # change in production
```

---

## 9. Known Limitations / TODO

| Item | Priority |
|---|---|
| Language & use-case still dummy (hash-based) | High — needs ClickHouse |
| Analytics metrics are seeded dummy data | High — needs ClickHouse |
| Agent Analysis tab is a placeholder | Medium |
| No pagination on call list (all dates loaded in memory) | Medium |
| SQLite not suitable for multi-user production | Low (use Postgres) |
| JWT secret hardcoded default | Low (set via env in prod) |
| MyMemory translation has 5k word/day free limit | Low (switch to DeepL/Google) |
