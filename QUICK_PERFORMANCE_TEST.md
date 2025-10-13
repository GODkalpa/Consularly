# Quick Performance Test Guide

## 🚀 Fast 5-Minute Verification

### Test 1: Timer Stability (2 minutes)
```bash
1. npm run dev
2. Navigate to interview page
3. Start any interview (USA F1, UK, or France)
4. Watch timer for 1 full minute
```

**✅ PASS if:**
- Timer counts down smoothly (1, 2, 3...)
- No pauses or jumps
- No stuttering

**❌ FAIL if:**
- Timer freezes for 1+ seconds
- Numbers skip (e.g., 10 → 8)
- Visible interruptions

---

### Test 2: UI Responsiveness (2 minutes)
```bash
1. During interview, speak continuously
2. Move around (test camera tracking)
3. Watch live transcript appear
```

**✅ PASS if:**
- Transcript updates smoothly every ~300ms
- No lag when speaking
- Camera feed is smooth
- Body language badge updates regularly

**❌ FAIL if:**
- UI freezes for 1+ seconds
- Transcript stops updating
- Camera stutters
- Overall "laggy" feel

---

### Test 3: Chrome DevTools Quick Check (1 minute)
```bash
1. F12 → Performance tab
2. Record for 30 seconds during interview
3. Stop and check FPS
```

**✅ PASS if:**
- FPS stays above 30 (shown in top-right corner)
- Few/no red blocks (long tasks)
- Mostly green/white in timeline

**❌ FAIL if:**
- FPS drops below 20
- Many red blocks
- Timeline is mostly purple/yellow

---

## 📊 Expected Performance Gains

| Metric | Before Fix | After Fix | Test Method |
|--------|-----------|-----------|-------------|
| Timer Stability | Frequent pauses | Smooth | Watch timer |
| UI Responsiveness | Laggy | Smooth | Use during interview |
| Frame Rate | 10-20 FPS | 30-60 FPS | DevTools Performance |
| State Updates | 23/sec | 7/sec | Console logs (dev mode) |

---

## 🔧 Quick Verification Commands

### In Browser Console (during interview):
```javascript
// Check if optimizations are active:

// 1. Check frame skipping (should log every ~333ms, not every frame)
// Look for "🎬 Starting body language analysis..." in console

// 2. Check memory cleanup (end interview and look for):
// "🧹 Starting detector disposal..."
// "✅ Disposed WebGL backend"
// "📊 Memory after cleanup: ..."

// 3. Check timer stability (should update exactly every 1000ms)
// Watch secondsRemaining in React DevTools
```

---

## 🎯 One-Line Success Test

**Just do this:** Start interview → speak for 2 minutes → watch timer

**If timer never pauses and UI feels smooth = SUCCESS ✅**

---

## 🚨 If Tests Fail

1. **Clear browser cache:** Ctrl+Shift+Delete → Clear cached files
2. **Hard refresh:** Ctrl+Shift+R
3. **Restart dev server:** Stop npm, then `npm run dev`
4. **Check console:** Look for errors (red messages)
5. **Try different browser:** Test in Chrome/Edge

---

## 📝 Quick Issue Reporting

If performance is still bad, note:

```
Browser: [Chrome/Edge/Firefox]
Version: [Check in browser settings]
Computer: [Laptop/Desktop]
Issue: [Timer freezes / Lag / Other]
When: [During speech / Always / Random]
```

Share this in feedback with:
- Chrome DevTools Performance recording (if possible)
- Console screenshots showing errors

---

## ✅ Success Criteria Summary

**BEFORE optimizations:**
- Timer interrupted every 5-10 seconds ❌
- Very laggy UI during interview ❌
- FPS dropped to 10-15 during speaking ❌
- Memory kept growing ❌

**AFTER optimizations:**
- Timer smooth and continuous ✅
- Responsive, smooth UI ✅
- FPS stays 30-60 consistently ✅
- Memory stays stable ✅

---

**Expected Testing Time:** 5 minutes  
**Confidence Level:** High (if all 3 tests pass)  
**Next Step:** Use normally, monitor over longer sessions

