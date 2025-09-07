
# PRD — USA Visa Interview Mock (Nepal Consultancies)

## 1) Executive Summary
A web app that simulates a U.S. F-1 visa interview with randomized questions, per-answer audio capture, instant AI feedback, and consultancy dashboards. Privacy-first design: on-device webcam coaching (aggregates only), short retention, and clear consent.

Stack: Next.js (Vercel), Firebase Auth + Firestore, Cloudinary (audio, authenticated), Python faster-whisper on Cloud Run, Gemini for scoring.

---

## 2) Goals & Success Metrics
Goals (12 weeks)
- Deliver realistic practice with actionable tips that students can use immediately.
- Reduce counselor time while improving outcomes across branches.

Success Metrics
- Completion rate >= 80% per attempt.
- Per-answer feedback p95 <= 4s.
- >= 70% students rate feedback "helpful/very helpful" in pilot.
- Counselors report >= 50% time saved per student (pilot).

---

## 3) Target Users
- Students (Nepal, F-1 aspirants) — mobile/desktop; mixed EN/NE; variable bandwidth.
- Counselors — view reports, spot weak areas, export summaries.
- Org Admins — manage branches, retention, question bank imports.

---

## 4) Scope
In Scope (MVP)
- Interview flow (10-12 Qs), per-answer audio capture (<= 60s), local webcam cues.
- STT (Whisper worker on Cloud Run) + Gemini scoring with rubric.
- Delivery metrics: eye-contact heuristic, pace, fillers, pauses.
- Final report (HTML/PDF), cohort dashboard, CSV export.
- Consent, retention (30 days), deletion requests.

Out of Scope (MVP)
- Emotion-based grading; accent identification; live human interviewer.

---

## 5) Assumptions & Constraints
- Low-end devices common; bandwidth constrained (target 3G).
- Must run on free/low-cost tiers initially.
- Ethical constraints: transparency, opt-out for camera, bias safeguards.
- Per-answer clips kept <= 60s for fast STT + responsive UX.

---

## 6) User Stories (MoSCoW)
Must
- As a student, I can join via link, test devices, and start an interview.
- As a student, I get instant feedback after each answer.
- As a counselor, I can open a report and see strengths/weaknesses and tips.
- As an admin, I can configure data retention and delete attempts.

Should
- As a student, I can switch UI language (EN/NE) and answer in either.
- As an admin, I can import/export questions (CSV) with buckets and tags.

Could
- As a counselor, I can add notes and assign homework.
- As a student, I can compare progress across attempts.

Will not (MVP)
- Real-time moderation; avatar interviewer; emotion-based scoring that affects grades.

---

## 7) Detailed Requirements
7.1 Interview Player
- One question at a time, 60s countdown, progress bar, mic button.
- Retry allowed only on technical failure (network/device).
- Local webcam cues: "Look at camera", "Speak up", never uploaded.

7.2 Question Bank
- Buckets: Identity, Academics, Financials, Plans/Ties, DS-160 consistency, Delivery.
- Weighted randomization; keyword-based follow-ups (2-3 per set).
- Import via CSV; fields: text, lang, bucket, difficulty, tags.

7.3 STT & Scoring
- STT: Cloud Run Whisper worker (FastAPI + faster-whisper base/int8).
- LLM: Gemini with strict JSON schema; temperature <= 0.3; few-shot calibration.
- Delivery metrics: from client (face_present%, offscreen streak) and STT (wpm, fillers, pauses, intelligibility).
- Combine into final score: Content 70%, Delivery 30%.

7.4 Reports & Dashboard
- Report: overall score, bucket bars, issues/flags, top tips; export PDF.
- Dashboard: filter by campus/batch/date; CSV export.

7.5 Privacy & Consent
- Consent modal before recording; policy link.
- Retention: default 30 days; per-org override; deletion on request.
- Store only audio and aggregate webcam metrics (no continuous video).

7.6 Accessibility & Localization
- WCAG AA; keyboard accessible; focus styles; reduced-motion support.
- EN/NE UI copy; Nepali filler dictionary for delivery metrics.

---

## 8) Non-Functional Requirements
- Performance: per-answer feedback p95 <= 4s; UI TTI <= 2s on 3G.
- Reliability: 99.5% monthly uptime; exponential backoff on uploads.
- Security: Firebase Auth; Firestore rules (org scoping); signed Cloudinary URLs; HMAC API to worker; rate limiting.
- Compatibility: Chrome/Edge (desktop), Chrome (Android), Safari iOS (audio-only UI OK).

---

## 9) Acceptance Criteria (Samples)
- Given a valid attempt, when a student submits an answer, then a feedback card with subscores and two concrete tips appears within 4s (p95) using test fixtures.
- Given a counselor view, when filtering by campus, the table updates with correct aggregates and CSV export matches Firestore rows.
- Given a deletion request, media and DB records are removed within 60s and links become invalid (signed URL expiry).

---

## 10) Analytics & KPIs
- Funnel: invite -> device grant -> Q1 -> Q12 -> report view.
- Timings: STT latency, LLM latency, total feedback latency.
- Coaching effect: delta between Attempt 1 and 2 by student.

---

## 11) Risks & Mitigations
- Latency spikes -> cap at 60s audio, regional Cloud Run, parallel STT+LLM, retries.
- Bias concerns -> content 70%; delivery <=30%; intelligibility not accent; human override.
- Privacy worries -> no raw video upload; aggregates only; clear consent & retention.
- Device issues -> robust device test; fallbacks (audio-only).

---

## 12) Dependencies
- Firebase Auth & Firestore, Cloudinary, Vercel, Cloud Run (Whisper), Gemini API.

---

## 13) Go/No-Go Checklist (MVP)
- [ ] Students complete a full attempt on mobile/desktop.
- [ ] Per-answer feedback <= 4s p95 (test set).
- [ ] Reports export to PDF; dashboard exports CSV.
- [ ] Consent + deletion flows verified end-to-end.
- [ ] Security rules validated; signed URLs & HMAC tested.

---

## 14) Appendices
Sample consent copy:
"By continuing, you consent to audio/video access for practice and feedback. Only audio and aggregate delivery metrics are stored. Recordings are retained 30 days (default) and may be deleted anytime. AI scores are advisory and can be adjusted by your counselor."
