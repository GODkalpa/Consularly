# Installation Instructions for Interview Mode UI

## 📦 Missing Package

The new Interview Mode Selector UI requires one additional package that's not currently installed:

```bash
npm install @radix-ui/react-radio-group
```

## ⚡ Quick Installation

Run this command in your project root:

```bash
npm install @radix-ui/react-radio-group
```

Or if you're using yarn:

```bash
yarn add @radix-ui/react-radio-group
```

## ✅ Verification

After installation, your `package.json` should include:

```json
{
  "dependencies": {
    "@radix-ui/react-radio-group": "^1.2.2",
    // ... other dependencies
  }
}
```

## 🚀 Then You Can Use

### Option 1: Visit the Configuration Page
Navigate to `/interview/configure` to see the full interview mode selector UI.

### Option 2: Use the Component Directly
```typescript
import InterviewModeSelector from '@/components/interview/InterviewModeSelector';

// Use in your component
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
```

## 📁 Files Created

### UI Components
- ✅ `src/components/interview/InterviewModeSelector.tsx` - Main selector component
- ✅ `src/components/ui/radio-group.tsx` - Radio button UI primitive
- ✅ `src/app/interview/configure/page.tsx` - Full configuration page example

### Documentation
- ✅ `INTERVIEW_MODE_UI_INTEGRATION_GUIDE.md` - Comprehensive integration guide
- ✅ `FEATURE_COMPLETE_SUMMARY.md` - Complete feature overview
- ✅ `INSTALLATION_INSTRUCTIONS.md` - This file

## 🎨 How It Looks

The Interview Mode Selector provides:
- **4 Interview Modes:** Practice, Standard, Comprehensive, Stress Test
- **4 Difficulty Levels:** Easy, Medium, Hard, Expert
- **4 Officer Personas:** Professional, Skeptical, Friendly, Strict
- **4 Topic Drills:** Financial, Academic, Return Intent, Weak Areas
- **Real-time Summary:** Shows your selected configuration

## 🔍 Where to See It

After installing the package:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:**
   ```
   http://localhost:3000/interview/configure
   ```

3. **You should see:**
   - Candidate information card
   - Interview mode selector (4 options)
   - Difficulty level selector (4 options)
   - "Show Advanced Options" button
   - Configuration summary card
   - Start Interview button

## 🐛 Troubleshooting

### Issue: "Module not found: @radix-ui/react-radio-group"
**Solution:** Run `npm install @radix-ui/react-radio-group`

### Issue: TypeScript errors
**Solution:** Run `npm run type-check` to see specific errors

### Issue: Page doesn't exist
**Solution:** Make sure all files are in the correct locations:
- `src/components/interview/InterviewModeSelector.tsx`
- `src/app/interview/configure/page.tsx`

### Issue: Styling looks broken
**Solution:** Ensure Tailwind CSS is properly configured and running

## 📝 Next Steps

After installation:

1. ✅ Install the missing package
2. ✅ Test the configuration page
3. ✅ Integrate into your existing interview flow
4. ✅ Update your "Start Interview" button to link to `/interview/configure`
5. ✅ Test all mode/difficulty combinations
6. ✅ Ensure the backend API handles the new parameters

## 🎯 Integration Checklist

- [ ] Install `@radix-ui/react-radio-group`
- [ ] Visit `/interview/configure` to test UI
- [ ] Update "Start Interview" links to go to `/interview/configure`
- [ ] Ensure API route at `/api/interview/start` accepts new parameters:
  - `mode` (practice | standard | comprehensive | stress_test)
  - `difficulty` (easy | medium | hard | expert)
  - `officerPersona` (professional | skeptical | friendly | strict | undefined)
  - `targetTopic` (financial | academic | intent | weak_areas | undefined)
- [ ] Test interview session starts with correct configuration
- [ ] Verify question count matches selected mode
- [ ] Verify timing matches selected difficulty
- [ ] Test on mobile devices

---

**That's it!** After running `npm install @radix-ui/react-radio-group`, you'll have full access to the interview mode selection UI.

