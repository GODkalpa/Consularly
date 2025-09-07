
# MVP Implementation Plan — USA Visa Interview Mock

## 0) Overview
Delivery plan to ship a production-ready MVP in ~5 weeks on free/low-cost tiers. Tracks workstreams, milestones, issue backlog, QA, rollout, budget, and Definition of Done.

Stack: Next.js (Vercel), Firebase Auth + Firestore, Cloudinary (audio), Python faster-whisper on Cloud Run, Gemini.

---

## 1) Timeline (5 Weeks)
Week 1 - Foundations
- Repo scaffold; Vercel + Firebase Admin SDK; env/secrets.
- Firestore collections and security rules (org scoping); consent flow.
- Question bank schema + CSV seed tool; seed 120 EN/NE items.

Week 2 - Capture & Upload
- Device Test page (mic/cam); permission UX.
- Interview Player: per-question audio (<=60s), countdown, progress, retry on tech failure.
- Cloudinary signed upload (authenticated assets); offline retry queue.
- On-device webcam heuristics (FaceLandmarker @ 10-15 fps); aggregate metrics only.

Week 3 - STT & Scoring
- Cloud Run Whisper worker (FastAPI + faster-whisper base/int8).
- /api/score-answer: signed Cloudinary download URL -> HMAC -> worker -> transcript.
- Delivery metrics from STT (wpm, pauses, fillers); Gemini prompt (strict JSON).
- Per-answer feedback card in UI.

Week 4 - Reports & Dashboard
- Attempt report (HTML/PDF): overall + bucket bars + issues + tips.
- Org dashboard: filters (campus/batch/date), CSV export.
- Delete/export flows; events audit log.

Week 5 - Polish & Pilot
- Error states, loading skeletons, EN/NE i18n, A11y passes.
- PostHog: funnel and timing metrics.
- Pilot (15-25 students); counselor ratings; tune weights and few-shots.

---

## 2) Workstreams & Owners (suggested)
- Frontend: Interview Player, Device Test, Reports, Dashboard.
- Backend: Auth verification, signed uploads, scoring orchestration, deletion.
- AI: Whisper worker, Gemini prompt and schema, calibration.
- DevOps: Vercel, Cloud Run, Cloudinary config, env/secrets.
- Content/Ops: Question seeding, Nepali fillers list, consent/policy copy.

---

## 3) Milestone Exit Criteria
- M1 (End W1): Auth + org scoping works; sampler returns 12 items; consent live.
- M2 (End W2): Audio upload reliable on throttled 3G; aggregates computed; basic UI complete.
- M3 (End W3): STT + scoring pipeline returns JSON; feedback visible in UI.
- M4 (End W4): Report PDF export; dashboard CSV export; delete/export flows.
- M5 (End W5): Pilot feedback collected; rubric tuned; bug bash complete.

---

## 4) Issue Backlog (issue-ready)
- FE-01 Interview Player (countdown, progress, mic UI)
- FE-02 useInterviewRecorder hook (<=60s, webm/opus)
- FE-03 Face/gaze hook (MediaPipe); aggregates store
- FE-04 Device Test page (levels, preview)
- BE-01 /api/start-attempt + sampler
- BE-02 /api/cloudinary/sign (signed upload)
- BE-03 /api/score-answer orchestration (Cloudinary -> Cloud Run -> Gemini -> Firestore)
- BE-04 /api/report/:id (HTML/JSON/PDF)
- AI-01 Whisper worker (Cloud Run; HMAC auth; concurrency=1)
- AI-02 Gemini prompt + JSON schema + few-shot set
- AI-03 Delivery metrics from STT (wpm, pauses, fillers)
- OPS-01 Firestore rules (org scoping)
- OPS-02 Cloudinary foldering + access_mode=authenticated + CORS
- OPS-03 Env/secrets (Vercel, Cloud Run, Cloudinary, Gemini)
- AN-01 PostHog events (funnel + timings)
- QA-01 Latency harness + fixtures

---

## 5) Environments & Config
Vercel / Next.js
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- CLD_CLOUD, CLD_KEY, CLD_SECRET
- GEMINI_API_KEY
- STT_URL, STT_SIGNING_SECRET
- RETENTION_DAYS=30, MAX_ANSWER_SECS=60

Cloud Run / Worker
- WHISPER_MODEL=base
- STT_SIGNING_SECRET
- (Optional) Cloudinary creds if generating signed URLs inside worker

---

## 6) Test Plan
Device Matrix: Windows Chrome/Edge, Android Chrome, macOS Chrome, iOS Safari (audio-only).
Network: throttle 256 kbps; simulate upload errors; offline retry queue.
Functional: fixtures for transcripts and scores; golden set correlation (>= 0.8).
Performance: p50/p95 for STT, LLM, total feedback; budget <= 4s p95.
Security: Firestore rule tests; signed URL expiry; HMAC verification; rate limiting.

---

## 7) Rollout & Pilot
- Pilot with 3 campuses (Dharan, Dharan City, Biratnagar), 5-8 students each.
- Collect: counselor ratings, student CSAT, error logs, latency stats.
- Adjust: rubric weights, few-shots, delivery thresholds (wpm band, offscreen streak).

---

## 8) Budget (MVP)
- Cloud Run + faster-whisper (CPU): near $0 under free tier (~3k-3.7k mins/mo). Beyond: ~$0.0013-0.0017 per audio minute.
- Cloudinary: authenticated storage + CDN ops; small webm/opus files keep costs low.
- Vercel: Hobby free tier; upgrade if needed for concurrency/logs.

---

## 9) Definition of Done
- Students complete full interview; per-answer feedback <= 4s p95; PDF report.
- Dashboard filters/export work; deletion and retention honored.
- Bias notice shown; delivery weight <= 30%; rationale present in report.

---

## 10) Post-MVP Roadmap (v1.1+)
- Real-time captions with on-screen live coaching.
- Organization-specific question banks and white-labeling.
- Attempt comparison and personalized practice plans.
- Teleprompter/plagiarism heuristic (optional).
