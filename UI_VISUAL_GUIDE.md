# 🎨 Visual Guide: Interview Mode Selector UI

## 📍 How to Access

1. **From Dashboard:** Click "Start New Interview" button
2. **Navigate to:** `http://localhost:3000/interview/configure`
3. **You'll see:** The complete interview configuration page

---

## 🖼️ Page Layout Preview

### Desktop View (1920x1080)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Back    Configure Interview                                            │
│            Customize your practice session settings                       │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  📋 Candidate Information                                                  │
│      Your interview will be tailored to this profile                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Name:           Dhiren Pradhan          Program:   Master of CS          │
│  Interview Type: USA (F1 Student)        University: Stanford University  │
│  Degree Level:   Graduate                Sponsor:    Family               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  🎯 Interview Mode                                                         │
│      Choose your practice format                                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ○  Practice Mode                                         [Beginner Friendly]│
│      Quick warmup session for daily practice                              │
│      ⏱ 10 min  •  8 questions  •  60s per question                        │
│                                                                            │
│  ●  Standard Mode                                         [SELECTED]       │
│      Realistic simulation matching actual interview length                │
│      ⏱ 15 min  •  12 questions  •  50s per question                       │
│                                                                            │
│  ○  Comprehensive Mode                                                     │
│      In-depth practice covering all categories thoroughly                 │
│      ⏱ 20 min  •  16 questions  •  45s per question                       │
│                                                                            │
│  ○  Stress Test Mode                                      [Challenging]    │
│      High-pressure rapid-fire questioning                                 │
│      ⏱ 25 min  •  20 questions  •  35s per question                       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  📈 Difficulty Level                                                       │
│      Select officer attitude and question complexity                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ○  Beginner                                  [Recommended for beginners]  │
│      Patient and encouraging officer, basic questions                     │
│      60s per question  •  Pressure: 1/5  •  Follow-ups: 20%               │
│                                                                            │
│  ●  Intermediate                                          [SELECTED]       │
│      Professional officer, balanced questioning                           │
│      45s per question  •  Pressure: 2/5  •  Follow-ups: 40%               │
│                                                                            │
│  ○  Advanced                                                               │
│      Skeptical officer probing for inconsistencies                        │
│      30s per question  •  Pressure: 4/5  •  Follow-ups: 60%               │
│                                                                            │
│  ○  Master                                                [Expert]         │
│      Unpredictable strict officer, complex scenarios                      │
│      25s per question  •  Pressure: 5/5  •  Follow-ups: 80%               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

   ℹ️  Show Advanced Options (Officer Persona & Topic Focus)
      ↓

┌────────────────────────────────────────────────────────────────────────────┐
│  👤 Officer Persona (Optional)                                             │
│      Choose interviewer personality. Leave unselected for automatic.      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ●  Auto-Select                                           [SELECTED]       │
│      Randomly select based on real interview statistics                   │
│                                                                            │
│  ○  Professional Officer                               [40% of real interviews]│
│      Neutral, efficient, and formal demeanor                              │
│                                                                            │
│  ○  Skeptical Officer                                  [30% of real interviews]│
│      Probing questions, challenging responses                             │
│                                                                            │
│  ○  Friendly Officer                                   [20% of real interviews]│
│      Warm, encouraging, and patient                                       │
│                                                                            │
│  ○  Strict Officer                                     [10% of real interviews]│
│      Rigid, uncompromising, intimidating                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  🎯 Targeted Topic Practice (Optional - Practice mode only)                │
│      Focus on specific areas. Leave unselected for balanced practice.     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ●  Balanced Practice                                    [SELECTED]       │
│      Cover all categories evenly                                          │
│                                                                            │
│  ○  Financial Deep Dive                                                    │
│      10 questions on funding, sponsors, expenses                          │
│      Focus: Sponsor type, Tuition costs, Living expenses                  │
│                                                                            │
│  ○  Academic Excellence                                                    │
│      10 questions on study plans and university choice                    │
│      Focus: Program details, University selection, Research plans         │
│                                                                            │
│  ○  Return Intent Mastery                                                  │
│      10 questions demonstrating home country ties                         │
│      Focus: Career plans, Family obligations, Property ownership          │
│                                                                            │
│  ○  Weak Areas Focus                                     [🤖 AI Powered]   │
│      AI-recommended based on your past interview scores                   │
│      Focus: Determined by your performance analytics                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  📋 Your Interview Configuration                                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Mode:         Standard Mode                                              │
│  Questions:    12                                                         │
│  Duration:     ~15 minutes                                                │
│  Difficulty:   Intermediate                                               │
│  Officer:      Auto-Select                                                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌───────────────────────────────────────────┐
│     [Cancel]             │  │  ▶ Start Interview                        │
└──────────────────────────┘  └───────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  ℹ️  Interview Tips                                                        │
│                                                                            │
│  • Choose Practice Mode if you're new to visa interviews                  │
│  • Select Standard Mode for realistic preparation                         │
│  • Try Comprehensive Mode before your actual interview date               │
│  • Use Stress Test Mode to build confidence under pressure                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View (375x812 - iPhone X)

```
┌──────────────────────────┐
│  ← Back                  │
│                          │
│  Configure Interview     │
│  Customize settings      │
└──────────────────────────┘

┌──────────────────────────┐
│  📋 Candidate Info       │
├──────────────────────────┤
│  Name:                   │
│    Dhiren Pradhan        │
│  Type:                   │
│    USA (F1 Student)      │
│  Degree:                 │
│    Graduate              │
│  Program:                │
│    Master of CS          │
│  University:             │
│    Stanford University   │
│  Sponsor:                │
│    Family                │
└──────────────────────────┘

┌──────────────────────────┐
│  🎯 Interview Mode       │
├──────────────────────────┤
│                          │
│  ○  Practice Mode        │
│      [Beginner Friendly] │
│      Daily practice      │
│      ⏱ 10min • 8Q • 60s │
│                          │
│  ●  Standard Mode        │
│      [SELECTED]          │
│      Realistic sim       │
│      ⏱ 15min • 12Q • 50s│
│                          │
│  ○  Comprehensive        │
│      In-depth practice   │
│      ⏱ 20min • 16Q • 45s│
│                          │
│  ○  Stress Test          │
│      [Challenging]       │
│      High pressure       │
│      ⏱ 25min • 20Q • 35s│
│                          │
└──────────────────────────┘

┌──────────────────────────┐
│  📈 Difficulty           │
├──────────────────────────┤
│                          │
│  ○  Beginner             │
│      [For beginners]     │
│      60s • Pressure: 1/5 │
│                          │
│  ●  Intermediate         │
│      [SELECTED]          │
│      45s • Pressure: 2/5 │
│                          │
│  ○  Advanced             │
│      30s • Pressure: 4/5 │
│                          │
│  ○  Master [Expert]      │
│      25s • Pressure: 5/5 │
│                          │
└──────────────────────────┘

  ℹ️ Show Advanced Options
      ↓

┌──────────────────────────┐
│  👤 Officer Persona      │
│      (Optional)          │
├──────────────────────────┤
│  ● Auto-Select           │
│  ○ Professional (40%)    │
│  ○ Skeptical (30%)       │
│  ○ Friendly (20%)        │
│  ○ Strict (10%)          │
└──────────────────────────┘

┌──────────────────────────┐
│  🎯 Topic Practice       │
│      (Optional)          │
├──────────────────────────┤
│  ● Balanced              │
│  ○ Financial             │
│  ○ Academic              │
│  ○ Return Intent         │
│  ○ Weak Areas (AI)       │
└──────────────────────────┘

┌──────────────────────────┐
│  📋 Summary              │
├──────────────────────────┤
│  Mode: Standard          │
│  Questions: 12           │
│  Duration: ~15 min       │
│  Difficulty: Intermediate│
│  Officer: Auto-Select    │
└──────────────────────────┘

┌──────────────────────────┐
│      [Cancel]            │
│  ▶ Start Interview       │
└──────────────────────────┘

┌──────────────────────────┐
│  ℹ️  Interview Tips      │
├──────────────────────────┤
│  • Practice Mode for     │
│    beginners             │
│  • Standard for realistic│
│    prep                  │
│  • Comprehensive before  │
│    real interview        │
│  • Stress Test for       │
│    confidence            │
└──────────────────────────┘
```

---

## 🎨 Color Scheme

### Mode Selection
- **Active (Selected):** Purple background (`bg-primary`), white text
- **Inactive:** White/gray background, black text
- **Hover:** Light purple tint

### Badges
- **Beginner Friendly:** Light blue background
- **Challenging:** Red/orange background
- **Expert:** Dark red background
- **Selected:** Purple outline

### Summary Card
- **Background:** Light gray (`bg-muted/50`)
- **Text:** Dark gray for labels, black for values
- **Border:** Subtle border

---

## 🔄 Interactive States

### 1. **Default Load**
```
Mode: Standard (pre-selected)
Difficulty: Medium (pre-selected)
Persona: Auto-Select (pre-selected)
Topic: Balanced (pre-selected)
Advanced Options: Collapsed
```

### 2. **After Selecting Practice Mode**
```
Mode: Practice
Difficulty: Easy (recommended)
Persona: Friendly (recommended)
Topic: Balanced or Financial/Academic/Return Intent (now visible)
Advanced Options: Topic drill options appear
```

### 3. **After Selecting Expert Difficulty**
```
Mode: (any)
Difficulty: Expert
Persona: Strict (recommended)
Topic: (any)
Summary updates: "25s per question"
```

### 4. **After Clicking "Show Advanced Options"**
```
Advanced Options: Expanded
Officer Persona section: Visible
Topic Practice section: Visible (if Practice mode)
```

### 5. **Loading State (After Clicking Start)**
```
Button text: "Starting..."
Button shows spinner
Button disabled
Cancel still enabled
```

---

## 🎬 Animation & Transitions

### Smooth Transitions
- Radio button selection: 200ms ease
- Card hover: 150ms ease
- Advanced options expand: 300ms ease-in-out
- Button hover: 150ms ease
- Summary card update: Instant (no animation)

### Visual Feedback
- **Radio button:** Circle fills from center outward
- **Hover on option:** Subtle scale (1.02x) and shadow
- **Click on option:** Brief flash/highlight
- **Start button:** Pulse animation on hover

---

## 🧪 Real Example Configurations

### Configuration 1: First-Time User
```yaml
Mode: Practice Mode
Difficulty: Beginner
Persona: Auto-Select → Friendly
Topic: Balanced
Duration: 10 minutes
Questions: 8
Time per Q: 60 seconds
```

### Configuration 2: Preparing for Real Interview
```yaml
Mode: Comprehensive Mode
Difficulty: Intermediate
Persona: Auto-Select → Professional
Topic: Balanced
Duration: 20 minutes
Questions: 16
Time per Q: 45 seconds
```

### Configuration 3: Expert Challenge
```yaml
Mode: Stress Test Mode
Difficulty: Master
Persona: Strict
Topic: N/A (not available in Stress Test)
Duration: 25 minutes
Questions: 20
Time per Q: 25 seconds
```

### Configuration 4: Focused Practice
```yaml
Mode: Practice Mode
Difficulty: Intermediate
Persona: Auto-Select
Topic: Financial Deep Dive
Duration: 10 minutes
Questions: 10 (all financial)
Time per Q: 45 seconds
```

---

## 📊 Before vs After Comparison

### BEFORE (Missing UI)
```
┌──────────────────────────┐
│  Start Interview         │
│                          │
│  Dhiren Pradhan          │
│  USA (F1 Student)        │
│                          │
│  [Start Interview]       │
│                          │
└──────────────────────────┘

❌ No mode selection
❌ No difficulty options
❌ No persona choice
❌ No customization
❌ Same experience every time
```

### AFTER (With New UI)
```
┌──────────────────────────┐
│  Configure Interview     │
│                          │
│  [Candidate Card]        │
│  [Mode Selection]        │
│  [Difficulty Selection]  │
│  [Advanced Options]      │
│  [Summary Card]          │
│  [Start Interview]       │
│                          │
└──────────────────────────┘

✅ 4 interview modes
✅ 4 difficulty levels
✅ 4 officer personas
✅ 4 topic drills
✅ Full customization
✅ Personalized experience
```

---

## 🎯 Key User Benefits

1. **Visibility:** Users can now SEE all available options
2. **Control:** Users can CHOOSE their experience level
3. **Progression:** Users can ADVANCE from Easy → Expert
4. **Focus:** Users can TARGET weak areas
5. **Realism:** Users can SIMULATE different officer types
6. **Confidence:** Users can BUILD skills progressively

---

## 🚀 What Happens After Clicking "Start Interview"

```
1. User clicks "Start Interview" button
   ↓
2. Button shows loading state ("Starting...")
   ↓
3. API call to /api/interview/start with:
   - mode: "standard"
   - difficulty: "medium"
   - officerPersona: undefined (auto-select)
   - targetTopic: undefined (balanced)
   - studentProfile: { ... }
   ↓
4. Backend starts interview session with configuration
   ↓
5. Returns sessionId
   ↓
6. Frontend navigates to /interview/{sessionId}
   ↓
7. Interview begins with:
   - 12 questions (Standard mode)
   - 45s per question (Medium difficulty)
   - Professional/Skeptical officer (auto-selected)
   ↓
8. User completes interview
   ↓
9. Detailed Review page shows:
   - 12-dimension scores
   - Model answer comparisons
   - Personalized action plan
```

---

## 🎉 Result

**Users now have complete control over their practice interview experience, with a beautiful, intuitive UI that makes all the advanced features accessible and easy to use!**

---

**Live Preview:** `http://localhost:3000/interview/configure`

