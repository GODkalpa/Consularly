
# USA Visa Interview Mock — Technical Blueprint (Next.js + Firebase + Cloudinary + Cloud Run + Vercel)

## 1) Purpose & Principles
Build a realistic, privacy-first mock U.S. visa interview app for Nepali consultancies that runs well on modest devices and free/low-cost tiers.

Principles
- Audio-first; webcam used only for on-device coaching cues.
- Immediate feedback per answer (<= 4s p95).
- No continuous video storage; store aggregate metrics only.
- Clear consent and retention controls (30-day default).
- Modular so STT can be swapped (Google STT <-> Whisper worker) without UI changes.

---

## 2) Architecture (Chosen Stack)
Frontend: Next.js (App Router), Tailwind, shadcn/ui, PWA.
Auth & DB: Firebase Authentication + Firestore.
Storage: Cloudinary (audio as video resource type, access_mode=authenticated).
AI scoring: Gemini (strict JSON schema).
STT: Python faster-whisper worker on Cloud Run (CPU), called by Next.js API.
Hosting: Next.js on Vercel (serverless API routes).

Sequence (per answer)
1. Browser records <= 60s audio/webm (opus).
2. Client requests signed upload params -> uploads directly to Cloudinary.
3. Client calls POST /api/score-answer with { publicId, deliveryClient }.
4. Next.js API:
   - Verifies Firebase ID token -> resolves orgId.
   - Generates short-lived signed Cloudinary URL for download.
   - Sends HMAC-signed request to Cloud Run /transcribe with the signed URL.
   - Receives { transcript, durationSec, wpm } -> computes delivery metrics.
   - Calls Gemini with rubric -> stores results in Firestore -> returns JSON to UI.

Textual Component Diagram
[Browser]
  - getUserMedia (mic+cam)
  - MediaRecorder (audio/webm;opus)
  - Face/Gaze heuristic (on-device, 10-15 fps)
  - POST /api/score-answer { publicId, deliveryClient }

[Vercel API (Next.js)]
  - Firebase Admin verify token
  - Cloudinary signed download URL (authenticated + expiring)
  - POST -> Cloud Run /transcribe (HMAC)
  - Gemini rubric scoring (JSON-mode)
  - Firestore writes (answers, attempts, events)

[Cloudinary]  private/authenticated audio assets (CDN)
[Firestore]   attempts, answers, questionBank, orgUsers, events
[Cloud Run]   FastAPI + faster-whisper (CPU)  -> transcript + wpm

---

## 3) Firestore Data Model (Flat, Multi-tenant)
organizations/{orgId}       -> { name, plan, createdAt }
orgUsers/{uid}              -> { orgId, role: 'admin'|'counselor'|'student' }
questionBank/{qid}          -> { text, bucket, difficulty, lang, tags }
rubrics/{version}           -> { weights, notes, createdAt }
attempts/{attemptId}        -> { orgId, uid, startedAt, finishedAt, overallScore }
answers/{answerId}          -> { attemptId, orgId, qid, audio:{publicId}, transcript, lang, scores, feedback, status, createdAt }
events/{eventId}            -> { attemptId, type, payload, createdAt }

Security Rules (essentials)
- Only users belonging to an org can read/write that org's attempts/answers/events.
- questionBank is read-only to signed-in users; write via admin tooling.

---

## 4) Public API Contracts
- POST /api/start-attempt -> { attemptId, questions[] }
- POST /api/cloudinary/sign -> signed upload params (folder/public_id/signature)
- POST /api/score-answer -> In: { attemptId, qid, publicId, deliveryClient } -> Out: { scoreJson }
- GET /api/report/:attemptId -> HTML/JSON, ?pdf=1
- DELETE /api/attempt/:id -> purge media + rows

score-answer Orchestration
1) Build signed Cloudinary download URL (type: authenticated, expiring).
2) HMAC body and call Cloud Run /transcribe.
3) Compute server delivery metrics from STT: wpm, filler_per_min, pauses.
4) Call Gemini with rubric (strict JSON).
5) Persist { transcript, scores, feedback } to Firestore.

---

## 5) Question Bank & Sampler
Buckets & weights: Identity(10), Academics(25), Financials(25), Plans/Ties(25), DS-160 consistency(10), Delivery(5).

Pseudo sampler:
function sample(bank, weights, n=12) {
  // weighted bucket pick and simple diversity by tags
}

---

## 6) On-device Webcam Metrics (Browser Only)
- Face presence: percent of frames with detectable face (MediaPipe FaceLandmarker).
- Gaze: head-pose yaw via eye/nose landmarks; on-screen if |yaw| < 25 deg.
- Off-screen streak: longest consecutive frames off-screen.
- Optional Blink rate: display tip only; not scored.
Never upload continuous frames; store only aggregates per answer.

---

## 7) Audio Delivery Metrics (Server)
From STT word timings (if available) or duration:
- WPM = words / speaking minutes (target band 105-140).
- Pauses: mid-sentence gaps > 1.5s (count/total).
- Fillers: regex on transcript (uh|um|ani|ra|tesari|jasto); filler_per_min = fillers / minutes.
- Intelligibility: use ASR confidence if available (else omit).

---

## 8) Rubric, Schema & Prompt
Weights: Content 70%, Delivery 30%.
Content (0-5 each): relevance, specifics, consistency, clarity.
Delivery: eye contact, pace, fillers, pauses.

Score JSON v1 (shape)
{
  "question_id": "string",
  "transcript": "string",
  "language": "en|ne|mix",
  "analysis": {
    "relevance": 0,
    "specifics": 0,
    "consistency": 0,
    "clarity": 0,
    "delivery": 0,
    "issues": ["string"],
    "flags": ["string"]
  },
  "feedback": "string",
  "score": 0
}

Gemini Prompt Skeleton
System: You are a strict, fair U.S. visa interview coach. Output JSON only (schema v1).
User: {question_text}
Context: DS-160 facts: {facts}; Prior answers summary: {summary}
Transcript: {transcript}
Delivery: {wpm, filler_per_min, face_present_pct, offscreen_max_s, intelligibility}

---

## 9) Deployment & Regions
- Vercel: Next.js app + APIs.
- Cloud Run: FastAPI + faster-whisper (CPU). Concurrency=1, 1 vCPU/2-4GB.
- Firestore: asia-south1 (Mumbai) or asia-southeast1 (Singapore).
- Cloudinary: authenticated assets + signed URLs.
- Keep Cloud Run and Firestore in same region for low latency.

---

## 10) Observability
- PostHog events (funnel + durations).
- Structured logs: API latency, STT latency, LLM latency.
- Error budgets: p95 feedback <= 4s.

---

## 11) i18n & A11y
- UI copy EN/NE; answers in either language.
- Keyboard-first controls; clear focus styles.
- Captions for feedback summaries.

---

## 12) Cost Envelope (MVP)
- Cloud Run + faster-whisper (CPU): often near $0 under free tier (~3k-3.7k minutes/month). Beyond: ~ $0.0013 - $0.0017 per audio minute.
- Cloudinary: storage + ops (use authenticated delivery; small webm/opus files).
- Vercel: Hobby free for MVP; consider Pro for higher limits.

---

## 13) Open Questions
- Allow per-org custom question banks (post-MVP)?
- Audio-only mode scoring when camera is disabled?
