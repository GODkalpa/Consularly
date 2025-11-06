# Interview Mode & Difficulty UI Integration Guide

## Overview
This guide shows how to integrate the new interview mode selection UI into your existing Start Interview page.

---

## 📸 **Visual Design**

### Current State (Missing Features)
```
┌─────────────────────────────────────┐
│ Start New Interview Session         │
├─────────────────────────────────────┤
│ Candidate: Dhiren Pradhan           │
│ Interview Type: USA (F1 Student)    │
│                                     │
│ [Start Interview Button]            │
└─────────────────────────────────────┘
```

### Enhanced State (With All Features)
```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Interview Mode                                            │
├──────────────────────────────────────────────────────────────┤
│ ○ Practice Mode (Beginner Friendly)                         │
│   Quick 8-question practice - 10 min | 8 questions | 60s    │
│                                                              │
│ ● Standard Mode                                             │
│   Realistic 12-question interview - 15 min | 12Q | 50s      │
│                                                              │
│ ○ Comprehensive Mode                                        │
│   In-depth 16-question interview - 20 min | 16Q | 45s       │
│                                                              │
│ ○ Stress Test Mode (Challenging)                            │
│   20 rapid-fire questions - 25 min | 20Q | 35s              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 📈 Difficulty Level                                          │
├──────────────────────────────────────────────────────────────┤
│ ○ Beginner (Recommended for beginners)                      │
│   Patient officer - 60s/Q | Pressure: 1/5 | Follow-ups: 20% │
│                                                              │
│ ● Intermediate                                              │
│   Professional officer - 45s/Q | Pressure: 2/5 | Follow: 40%│
│                                                              │
│ ○ Advanced                                                   │
│   Skeptical officer - 30s/Q | Pressure: 4/5 | Follow-ups: 60%│
│                                                              │
│ ○ Master (Expert)                                           │
│   Unpredictable officer - 25s/Q | Pressure: 5/5 | Follow: 80%│
└──────────────────────────────────────────────────────────────┘

┌─ Show Advanced Options ──────────────────────────────────────┐
│                                                              │
│ 👤 Officer Persona (Optional)                               │
│ ○ Auto-Select (Randomly based on statistics)                │
│ ○ Professional Officer (40% of real interviews)             │
│ ○ Skeptical Officer (30% of real interviews)                │
│ ○ Friendly Officer (20% of real interviews)                 │
│ ○ Strict Officer (10% of real interviews)                   │
│                                                              │
│ 🎯 Targeted Topic Practice (Optional - Practice mode only)  │
│ ○ Balanced Practice                                         │
│ ○ Financial Deep Dive - 10 questions on funding             │
│ ○ Academic Excellence - Study plans and university choice   │
│ ○ Return Intent Mastery - Demonstrate home country ties     │
│ ○ Weak Areas Focus - AI-recommended based on past scores    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 📋 Your Interview Configuration                             │
├──────────────────────────────────────────────────────────────┤
│ Mode:         Standard Mode                                 │
│ Questions:    12                                            │
│ Duration:     ~15 minutes                                   │
│ Difficulty:   Intermediate                                  │
│ Officer:      Auto-Select                                   │
└──────────────────────────────────────────────────────────────┘

                    [Start Interview]
```

---

## 🔧 **Integration Code Example**

### Update Your Start Interview Page

```tsx
// app/interview/start/page.tsx or wherever your start interview page is

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InterviewModeSelector from '@/components/interview/InterviewModeSelector';
import PreInterviewBriefing from '@/components/interview/PreInterviewBriefing';
import type { InterviewMode, DifficultyLevel, OfficerPersona, PracticeTopic } from '@/lib/interview-modes';

export default function StartInterviewPage() {
  const router = useRouter();
  const [showBriefing, setShowBriefing] = useState(false);
  
  // Interview configuration state
  const [mode, setMode] = useState<InterviewMode>('standard');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [persona, setPersona] = useState<OfficerPersona | undefined>(undefined);
  const [topic, setTopic] = useState<PracticeTopic | undefined>(undefined);
  
  // User profile (from your auth context or props)
  const studentProfile = {
    name: 'Dhiren Pradhan',
    country: 'Nepal',
    degreeLevel: 'graduate',
    programName: 'Master of Computer Science',
    universityName: 'University of Example',
    // ... other profile fields
  };

  const handleStartClick = () => {
    // Show pre-interview briefing modal
    setShowBriefing(true);
  };

  const handleStartInterview = async () => {
    // Start interview with selected configuration
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          difficulty,
          officerPersona: persona,
          targetTopic: topic,
          studentProfile,
        }),
      });
      
      const { sessionId } = await response.json();
      router.push(`/interview/${sessionId}`);
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Start New Interview Session</h1>
        <p className="text-muted-foreground">
          Configure your practice interview settings below
        </p>
      </div>

      {/* Candidate Info */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Candidate:</span>
            <span className="font-medium">{studentProfile.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Interview Type:</span>
            <span className="font-medium">USA (F1 Student)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Degree Level:</span>
            <span className="font-medium capitalize">{studentProfile.degreeLevel}</span>
          </div>
        </div>
      </div>

      {/* Mode Selector Component */}
      <InterviewModeSelector
        selectedMode={mode}
        selectedDifficulty={difficulty}
        selectedPersona={persona}
        selectedTopic={topic}
        onModeChange={setMode}
        onDifficultyChange={setDifficulty}
        onPersonaChange={setPersona}
        onTopicChange={setTopic}
      />

      {/* Start Button */}
      <button
        onClick={handleStartClick}
        className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Interview
      </button>

      {/* Pre-Interview Briefing Modal */}
      <PreInterviewBriefing
        open={showBriefing}
        onOpenChange={setShowBriefing}
        profile={studentProfile}
        interviewMode={mode}
        difficulty={difficulty}
        onStart={handleStartInterview}
      />
    </div>
  );
}
```

---

## 🎨 **Styling Notes**

The components use Tailwind CSS and shadcn/ui design system. Key classes:
- `bg-primary` - Purple background from your theme
- `text-primary-foreground` - White text on purple
- `bg-muted` - Light gray background
- `border-primary` - Purple border
- Radio buttons use `@radix-ui/react-radio-group` for accessibility

---

## 🔄 **Backend Integration**

### Update Interview Start API

```typescript
// app/api/interview/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { InterviewSimulationService } from '@/lib/interview-simulation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, difficulty, officerPersona, targetTopic, studentProfile, userId } = body;
    
    const service = new InterviewSimulationService();
    
    // Start interview with configuration
    const { session, firstQuestion } = await service.startInterview(
      userId,
      'F1',
      studentProfile,
      'usa_f1',
      {
        mode,
        difficulty,
        officerPersona,
        targetTopic,
      }
    );
    
    // Save to database
    await saveInterviewSession(session);
    
    return NextResponse.json({
      sessionId: session.id,
      firstQuestion: firstQuestion.question,
      configuration: {
        mode,
        difficulty,
        persona: session.officerPersona,
        totalQuestions: session.totalQuestions,
        timePerQuestion: session.timePerQuestion,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start interview' }, { status: 500 });
  }
}
```

---

## 📱 **Mobile Responsive Design**

The component automatically stacks on mobile:
- Grid layout switches to single column below `md:` breakpoint
- Radio buttons maintain spacing
- Summary card shows condensed view
- Advanced options toggle helps reduce initial screen height

---

## 🎯 **User Flow**

1. **User clicks "Start Interview"** from dashboard
2. **Mode Selection Page loads** with all options
3. **User selects:**
   - Interview Mode (Practice/Standard/Comprehensive/Stress Test)
   - Difficulty Level (Easy/Medium/Hard/Expert)
   - Optionally: Officer Persona
   - Optionally: Topic Focus (if Practice mode)
4. **Summary card updates** in real-time showing configuration
5. **User clicks "Start Interview"**
6. **Pre-Interview Briefing Modal appears** with:
   - Document checklist
   - Quick tips
   - Red flag warnings
7. **User acknowledges requirements** and clicks final "Start Interview"
8. **Interview begins** with configured settings

---

## 🧪 **Testing Checklist**

- [ ] All 4 modes selectable and display correctly
- [ ] All 4 difficulty levels work
- [ ] Officer persona selection optional (auto-select works)
- [ ] Topic drills only show for Practice mode
- [ ] Summary card updates in real-time
- [ ] Mobile responsive layout works
- [ ] Pre-interview briefing modal appears
- [ ] Backend receives correct configuration
- [ ] Interview starts with correct settings (question count, timing, etc.)

---

## 🎓 **Feature Highlights for Users**

### Practice Mode
- **Best for:** Daily warmup, building confidence
- **Experience:** 8 quick questions, friendly environment
- **Time:** 10 minutes

### Standard Mode (Default)
- **Best for:** Realistic preparation
- **Experience:** 12 balanced questions, professional officer
- **Time:** 15 minutes

### Comprehensive Mode
- **Best for:** Thorough preparation before real interview
- **Experience:** 16 questions covering all aspects
- **Time:** 20 minutes

### Stress Test Mode
- **Best for:** Testing composure under maximum pressure
- **Experience:** 20 rapid-fire questions, skeptical officer
- **Time:** 25 minutes

---

## 📊 **Analytics Integration**

Track mode selections to understand user behavior:

```typescript
// Track which modes are most popular
analytics.track('interview_started', {
  mode,
  difficulty,
  persona: persona || 'auto',
  topic: topic || 'balanced',
  user_level: calculateUserLevel(pastInterviews),
});
```

---

## 🚀 **Quick Start**

1. Copy `InterviewModeSelector.tsx` to `src/components/interview/`
2. Update your Start Interview page with the integration code
3. Ensure API route handles new parameters
4. Test all mode combinations
5. Deploy!

---

## 📝 **Default Recommendations**

For new users (0-2 interviews completed):
- **Mode:** Practice
- **Difficulty:** Easy
- **Persona:** Auto-select (likely Friendly)

For intermediate users (3-10 interviews):
- **Mode:** Standard
- **Difficulty:** Medium
- **Persona:** Auto-select

For advanced users (10+ interviews, avg score >75):
- **Mode:** Comprehensive or Stress Test
- **Difficulty:** Hard or Expert
- **Persona:** Skeptical or Strict

These can be auto-selected based on user history!

---

## 🎉 **Result**

Users can now:
✅ Choose their practice intensity
✅ Select difficulty matching their skill level
✅ Experience different officer personalities
✅ Focus on specific weak areas
✅ See exactly what to expect before starting
✅ Get a realistic, personalized interview experience

This transforms the basic "Start Interview" into a **comprehensive, configurable practice system** that adapts to each user's needs!

