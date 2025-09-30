# F‑1 Visa Mock Interview — MVP & Flow (Doc‑Free)

> **Purpose:** Ship a realistic, low‑friction MVP that mirrors the U.S. F‑1 window interview without requiring I‑20/DS‑160 uploads. Lean on **session self‑consistency**, tight timing, and targeted follow‑ups to deliver actionable feedback.

---

## 1) Product Goals

- **Mirror the real counter**: short, direct, interruptible Q&A (2–5 minutes total).
- **Actionable feedback**: concise, prioritized fixes tied to Study Plan, Finances, Intent.
- **No document uploads**: use **self‑declared facts** within the session for consistency checks.
- **Low friction**: works on low bandwidth; audio‑only option; clear start/finish states.

---

## 2) MVP Scope (Features)

1. **Embassy Window Mode**
   - Token → greeting → oath prompt → rapid Q&A → immediate outcome.
   - Audio‑first; optional video/body analysis (can be disabled).

2. **Adaptive Interview (Doc‑Free)**
   - Capture **self‑declared facts** (e.g., total cost, sponsor, scholarship/loan, post‑study role).
   - Trigger follow‑ups when answers are vague, number‑free, or contradict earlier statements.

3. **Speech Capture & Metrics**
   - Live STT transcript; words per minute (WPM), filler rate, pauses, sentence length band.

4. **Lightweight Body‑Language (Optional)**
   - Posture/expressions/gestures, capped to 10–15% of per‑answer score.
   - **Audio‑only toggle** sets body weight to 0 *without penalty*.

5. **Scoring & Feedback**
   - Per‑answer scoring with clear weights.
   - Session roll‑up + outcome threshold (Green/Amber/Red).
   - Auto‑generated “fix” suggestions + 1–2 sentence exemplar rewrites.

6. **Realism Enhancers**
   - Soft **40s timer** (warn at 30s), **officer interrupt** at ~25–30s.
   - “Repeat question” hotkey; queue/ambient optional.

7. **Reliability & Privacy**
   - Offline queue for answers during network hiccups; session resume.
   - Store transcript + derived metrics by default; audio/video opt‑in.

---

## 3) Eight‑Question US F‑1 Flow (Window‑Style, Doc‑Free)

Each core question targets a consular dimension. Use **40s soft cap**; auto‑advance on STT finalize; allow **interrupt**.

1. **Why this university and program?** *(Study Plan)*  
   _Follow‑up if vague:_ “Name **2 specific** features (course, lab, professor, track).”

2. **What’s your total first‑year cost?** *(Finances)* → `memory.total_cost`  
   _Follow‑up if no number:_ “An estimate is fine—tuition + living.”

3. **How will you pay for it?** *(Finances)* → `memory.sponsor`, `scholarship_amount`, `loan_amount`  
   _Follow‑up if no split:_ “Approximate split—sponsor %, scholarship %, loan %.”

4. **What does your sponsor do?** *(Finances credibility)* → `memory.sponsor_occupation`  
   _Follow‑up if unclear:_ “Is that salary, business, or savings?”

5. **How does this program fit your background?** *(Study Plan coherence)*  
   _Follow‑up:_ “Give **one** past course/project that leads into this.”

6. **What will you do after graduation?** *(Intent)* → `memory.post_study_role`, `target_country`  
   _Follow‑up if US‑centric:_ “Name a role and sector **in Nepal** you’ll target.”

7. **Do you have relatives in the U.S.?** *(Disclosure/clarity)* → `memory.relatives_us`  
   _Follow‑up if yes:_ “Who, and what status?” *(no score penalty; clarity only)*

8. **Anything else I should know?** *(Composure/conciseness)*

> **Dynamic Follow‑ups:** May replace or append; cap total questions at **≤10** including follow‑ups.

---

## 4) State Machine (YAML Pseudocode)

```yaml
states:
  QUEUE: { on: { token_called: WINDOW_GREETING } }
  WINDOW_GREETING: { on: { oath_ack: OATH } }
  OATH: { on: { oath_confirmed: ID_VERIFY } }
  ID_VERIFY: { on: { id_ok: CORE_QA } }   # simulate FP verify prompt
  CORE_QA:
    meta: { time_cap_sec: 240, min_nodes: 5, max_nodes: 10 }
    on:
      answer_submitted: evaluate_answer
      time_up: escalate_followup
      session_time_cap_reached: DECISION_SIM
  DECISION_SIM: { on: { continue: FEEDBACK_SUMMARY } }
  FEEDBACK_SUMMARY: { on: { start_drills: DRILLS, done: DASHBOARD } }
  DRILLS: { on: { complete: DASHBOARD } }
  DASHBOARD: {}

actions:
  evaluate_answer:
    - update_session_memory
    - score_answer: [Content, Speech, Body]
    - check_self_consistency
    - if contradiction_or_vague: route_followup
    - else: next_node
```

---

## 5) Scoring (Doc‑Free, Drop‑In)

### Per‑Answer (0–100)
```
Content = 25*Relevance + 25*Specificity + 25*SelfConsistency + 25*Plausibility
Speech  = 0.5*Fluency + 0.3*Clarity + 0.2*Tone
Body    = 0.45*Posture + 0.35*Expressions + 0.20*Gestures  (only if enabled)
AnswerScore = 0.7*Content + 0.2*Speech + 0.1*Body
```

**Content sub‑metrics (0–1):**  
- **Relevance:** answers the asked question (penalize off‑topic).  
- **Specificity:** numbers and proper nouns present. Heuristics: +0.3 if ≥1 number; +0.2 if ≥2 domain entities; +0.5 if 1–2 sentences (cap at 1).  
- **SelfConsistency:** compares to **session memory** (not uploads). `1.0` none set; `0.8` minor mismatch; `0.5` major.  
- **Plausibility:** expected pairs appear (e.g., cost **and** funding split; past **and** future). Start 0.5, +0.25 per present (cap 1).

**Speech details:**  
- **Fluency:** WPM target 90–140 → score = `100 − min(|WPM−115|*1.5, 40)`; fillers ≤3% OK, −1pt per +0.5% (max −20).  
- **Clarity:** `0.6*ASR_confidence + 0.4*SentenceLengthBand` (best 10–20 words).  
- **Tone:** light penalty for over‑hedging/monotone (up to −15).

**Body (optional):** cap weight to **10–15%**. **Audio‑only** sets Body weight to 0 without penalty.

### Session Roll‑Up (0–100)
```
Overall = average(AnswerScore over core 8)
Bonuses/Penalties (±5 total):
  +3 if avg answers are 1–2 sentences and ≤35s
  +2 if finance answers include both total and numeric split
  −5 if ≥2 major contradictions vs session memory
```

### Outcome Thresholds
- **Green (≥80):** strong & consistent → show strengths + 1–2 polish tips.  
- **Amber (65–79):** list 2–3 concrete fixes (e.g., “State total cost numerically”, “Name a Nepal role”).  
- **Red (<65):** show red flags + 2 targeted drills.

---

## 6) Session Memory & Follow‑Ups (Doc‑Free)

### Memory Keys
```
{ total_cost, sponsor, scholarship_amount, loan_amount,
  post_study_role, target_country, relatives_us }
```

### Update Memory (TS‑like Pseudocode)
```ts
function updateMemory(mem, answer) {
  const nums = extractCurrencyNumbers(answer);   // $, NPR, “k”
  const role = extractRole(answer);
  if (/(total|year|tuition)/i.test(answer) && nums[0]) mem.total_cost ??= nums[0];
  if (/scholar/i.test(answer) && nums[0]) mem.scholarship_amount ??= nums[0];
  if (/loan/i.test(answer) && nums[0]) mem.loan_amount ??= nums[0];
  if (/father|mother|self|sponsor/i.test(answer)) mem.sponsor ??= extractSponsor(answer);
  if (/(after|graduate|post[- ]study)/i.test(answer)) {
    mem.post_study_role ??= role;
    mem.target_country ??= extractCountry(answer);
  }
  if (/relative|uncle|aunt|cousin/i.test(answer) && /U\.?S\.?/i.test(answer)) mem.relatives_us = true;
  return mem;
}
```

### Consistency Check
```ts
function checkContradiction(mem, answer) {
  const n = extractCurrencyNumbers(answer)[0];
  if (mem.total_cost && n) {
    const delta = Math.abs(n - mem.total_cost) / mem.total_cost;
    if (delta > 0.2) return 'major';
    if (delta > 0.1) return 'minor';
  }
  return 'none';
}
```

### Follow‑Up Router
```ts
const needsNumber = (qType==='finance' && !hasNumber(answer));
const contradiction = checkContradiction(mem, answer);
if (contradiction!=='none') routeTo('clarify_cost_followup');
else if (needsNumber) routeTo('finance_split_followup');
else nextQuestion();
```

---

## 7) UX Details

- **Preflight:** request mic/cam; show live mic bar & video preview (no ML) until Start.
- **During Q&A:** visible 40s timer; soft warning at 30s; **Interrupt** button (cuts to follow‑up/next).
- **ASR Robustness:** show live transcript for self‑correction. If `ASR_confidence < 0.75`, allow quick restate or text‑submit.
- **Accessibility/Low‑Bandwidth:** audio‑only mode; skip body tracking; minimal UI.
- **Resilience:** queue scoring calls; debounce STT final events; resume session at QN on refresh.

---

## 8) Config (Single Source of Truth)

```ts
export const SCORING = {
  weights: { content: 0.7, speech: 0.2, body: 0.1 },  // per-answer
  bodyEnabledDefault: true,                            // toggle per session
  bodyWeightWhenDisabled: 0,
  session: {
    bonuses: { brevity: 3, financeNumbers: 2 },
    penalties: { majorContradictions: 5 },
  },
  thresholds: { green: 80, amber: 65 }
};
```

---

## 9) Why This MVP Is Enough

- Matches how officers interview: brief, number‑focused, interruptible.
- Produces concrete, **trainable** fixes without demanding document uploads.
- Minimal code changes: add **session memory + follow‑up router + unified config**.
