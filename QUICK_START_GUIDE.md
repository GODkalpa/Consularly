# 🚀 Quick Start Guide - Interview Modes in Your Dashboard

## ✅ What Changed

Interview mode and difficulty selection is now **directly integrated** into your existing dashboards:
- **Individual Users**: `/dashboard` → UserInterviewSimulation component
- **Organizations**: `/org` → OrgInterviewSimulation component

---

## 🎯 For Individual Users

### How to Access
1. Log in as a student
2. Go to your dashboard (`/dashboard`)
3. Navigate to "Start Interview" section

### What You'll See

#### Step 1: Candidate Information
```
┌─────────────────────────────────┐
│ Start New Interview Session    │
├─────────────────────────────────┤
│ Candidate: John Doe             │
│ Interview Type: USA (F1)        │
└─────────────────────────────────┘
```

#### Step 2: Select Interview Mode (NEW!)
```
┌─────────────────────────────────┐
│ 🎯 Interview Mode               │
├─────────────────────────────────┤
│ ○ Practice                      │
│   8 questions • 10 min          │
│                                 │
│ ● Standard ← SELECTED           │
│   12 questions • 15 min         │
│                                 │
│ ○ Comprehensive                 │
│   16 questions • 20 min         │
│                                 │
│ ○ Stress Test                   │
│   20 questions • 25 min         │
└─────────────────────────────────┘
```

#### Step 3: Select Difficulty (NEW!)
```
┌─────────────────────────────────┐
│ 📈 Difficulty Level             │
├─────────────────────────────────┤
│ ○ Easy                          │
│   60s/Q • Friendly              │
│                                 │
│ ● Medium ← SELECTED             │
│   45s/Q • Professional          │
│                                 │
│ ○ Hard                          │
│   30s/Q • Skeptical             │
│                                 │
│ ○ Expert                        │
│   25s/Q • Strict                │
└─────────────────────────────────┘
```

#### Step 4: See Summary
```
┌─────────────────────────────────┐
│ 📋 Your Configuration           │
├─────────────────────────────────┤
│ Mode:       Standard            │
│ Questions:  12                  │
│ Duration:   ~15 minutes         │
│ Difficulty: Medium              │
└─────────────────────────────────┘

    [Start Interview]
```

---

## 🏢 For Organizations

### How to Access
1. Log in as organization admin
2. Go to organization dashboard (`/org`)
3. Navigate to "Interviews" section

### What You'll See

#### Step 1: Select Student
```
┌─────────────────────────────────┐
│ Select Student                  │
├─────────────────────────────────┤
│ Student:                        │
│ [Alice Johnson          ▼]     │
│                                 │
│ Country:                        │
│ [USA (F1 Student)       ▼]     │
└─────────────────────────────────┘
```

#### Step 2: Select Interview Mode (NEW!)
```
┌─────────────────────────────────┐
│ 🎯 Interview Mode               │
├─────────────────────────────────┤
│ ○ Practice                      │
│   8 questions • 10 min          │
│                                 │
│ ● Standard ← SELECTED           │
│   12 questions • 15 min         │
│                                 │
│ ○ Comprehensive                 │
│   16 questions • 20 min         │
│                                 │
│ ○ Stress Test                   │
│   20 questions • 25 min         │
└─────────────────────────────────┘
```

#### Step 3: Select Difficulty (NEW!)
```
┌─────────────────────────────────┐
│ 📈 Difficulty Level             │
├─────────────────────────────────┤
│ ○ Easy                          │
│   60s/Q • Friendly              │
│                                 │
│ ○ Medium                        │
│   45s/Q • Professional          │
│                                 │
│ ● Hard ← SELECTED               │
│   30s/Q • Skeptical             │
│                                 │
│ ○ Expert                        │
│   25s/Q • Strict                │
└─────────────────────────────────┘
```

#### Step 4: See Summary & Start
```
┌─────────────────────────────────┐
│ 📋 Your Configuration           │
├─────────────────────────────────┤
│ Mode:       Standard            │
│ Questions:  12                  │
│ Duration:   ~15 minutes         │
│ Difficulty: Hard                │
└─────────────────────────────────┘

    [Start Interview Session]
```

---

## 🎨 Advanced Options (Optional)

Click "Show Advanced Options" to see:

### Officer Persona Selection
```
┌─────────────────────────────────┐
│ 👤 Officer Persona (Optional)   │
├─────────────────────────────────┤
│ ● Auto-Select (recommended)     │
│ ○ Professional (40%)            │
│ ○ Skeptical (30%)               │
│ ○ Friendly (20%)                │
│ ○ Strict (10%)                  │
└─────────────────────────────────┘
```

### Topic Drill (Practice Mode Only)
```
┌─────────────────────────────────┐
│ 🎯 Targeted Topic (Optional)    │
├─────────────────────────────────┤
│ ● Balanced (all topics)         │
│ ○ Financial Deep Dive           │
│ ○ Academic Excellence           │
│ ○ Return Intent Mastery         │
│ ○ Weak Areas Focus (AI)         │
└─────────────────────────────────┘
```

---

## 📋 Quick Reference

### Interview Modes
| Mode | Questions | Duration | Best For |
|------|-----------|----------|----------|
| **Practice** | 8 | 10 min | Daily warmup, beginners |
| **Standard** | 12 | 15 min | Realistic preparation (recommended) |
| **Comprehensive** | 16 | 20 min | Before real interview |
| **Stress Test** | 20 | 25 min | Building confidence under pressure |

### Difficulty Levels
| Level | Time/Q | Officer Type | Best For |
|-------|--------|--------------|----------|
| **Easy** | 60s | Friendly | First-time users, building confidence |
| **Medium** | 45s | Professional | Most users, realistic practice |
| **Hard** | 30s | Skeptical | Advanced users, pressure practice |
| **Expert** | 25s | Strict | Pre-interview, maximum challenge |

---

## ✅ Testing Checklist

### Individual Users
- [ ] Log in as a student
- [ ] Go to dashboard
- [ ] See interview mode selector
- [ ] See difficulty selector
- [ ] Select mode (e.g., Standard)
- [ ] Select difficulty (e.g., Medium)
- [ ] See configuration summary update
- [ ] Click "Start Interview"
- [ ] Verify interview starts with correct settings

### Organizations
- [ ] Log in as organization admin
- [ ] Go to organization dashboard
- [ ] Click "Interviews" tab
- [ ] Select a student
- [ ] Select country
- [ ] See interview mode selector
- [ ] See difficulty selector
- [ ] Select mode (e.g., Comprehensive)
- [ ] Select difficulty (e.g., Hard)
- [ ] See configuration summary update
- [ ] Click "Start Interview Session"
- [ ] Verify interview starts for student with correct settings

---

## 🐛 Troubleshooting

### Issue: Don't see mode selector in dashboard
**Solution:** 
- Make sure you're on the "Start Interview" or "Interviews" section
- The selector only appears before starting an interview
- Once an interview is started, it disappears

### Issue: Mode selector shows but clicking doesn't work
**Solution:**
- Check browser console for errors
- Ensure `@radix-ui/react-radio-group` is installed: `npm install @radix-ui/react-radio-group`
- Refresh the page

### Issue: Interview starts but doesn't use selected mode
**Solution:**
- Check that your API route at `/api/interview/session` accepts the new parameters
- See `INTEGRATED_DASHBOARD_SOLUTION.md` for API integration details

---

## 💡 Tips

### For Individual Users
- **First interview:** Start with Practice Mode + Easy difficulty
- **Regular practice:** Use Standard Mode + Medium difficulty
- **Before real interview:** Try Comprehensive Mode + Hard difficulty
- **Build confidence:** Use Stress Test Mode + Expert difficulty

### For Organizations
- **New students:** Assign Practice Mode + Easy difficulty
- **Regular training:** Use Standard Mode + Medium difficulty
- **Pre-interview prep:** Use Comprehensive Mode + Hard difficulty
- **Assessment:** Use Stress Test Mode to evaluate readiness

---

## 🎉 You're Ready!

**The interview mode and difficulty selection is now fully integrated into your existing dashboards.**

No navigation changes needed. No new pages. Just enhanced functionality in the places you already use!

**Next Steps:**
1. Run `npm run dev`
2. Go to your dashboard (`/dashboard` or `/org`)
3. See the new mode selector
4. Start an interview with custom settings!

🚀 **Enjoy your industry-leading interview preparation system!**

