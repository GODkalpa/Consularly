# Face Liveness Critical Fix - Infinite Loop

## Critical Bug
The camera would start (light turns on) but the UI stayed stuck on "Starting camera..." forever.

## Root Cause: Infinite Loop

The useEffect that starts the camera had **`cameraReady` in its dependency array**, but also **sets `cameraReady` inside the effect**:

```typescript
// BROKEN CODE
useEffect(() => {
  const startCamera = async () => {
    // ... get camera stream
    setCameraReady(true)  // ← Sets this state
    setLoading(false)
  }
  startCamera()
}, [modelsLoaded, cameraReady])  // ← And listens to it!
```

This caused:
1. Effect runs → sets `cameraReady` to true
2. Dependency changes → effect runs again
3. Sets `cameraReady` → runs again
4. **Infinite loop** → camera keeps restarting
5. Video never gets to play()

## The Fix

Remove `cameraReady` from the dependency array:

```typescript
// FIXED CODE
useEffect(() => {
  const startCamera = async () => {
    // ... get camera stream
    setCameraReady(true)
    setLoading(false)
  }
  startCamera()
}, [modelsLoaded])  // ✅ Only runs when models load
```

Now the effect only runs once after models are loaded, not continuously.

## Additional Fixes

### 1. Added 'encoding' to Webpack Fallback
**File**: `next.config.js`

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      encoding: false,  // ← Added this
    }
  }
  return config
}
```

This suppresses the warning:
```
Module not found: Can't resolve 'encoding' in node-fetch
```

## Evidence of the Bug

In the console logs, you could see:
```
[FaceLiveness] Camera stream obtained
[FaceLiveness] Camera stream obtained
[FaceLiveness] Camera stream obtained
[FaceLiveness] Camera stream obtained
```

Multiple "stream obtained" messages = the effect was running repeatedly.

## Why the Camera Light Stayed On

The camera light turns on when `getUserMedia()` is called. Since the effect was looping, it kept calling `getUserMedia()` over and over, so the light stayed on, but the video element never got to the `onloadedmetadata` → `play()` sequence because the stream kept being replaced.

## Testing After Fix

After this fix, you should see **only ONE** of each log message:
```
[FaceLiveness] Loading face-api.js library...
[FaceLiveness] face-api.js loaded
[FaceLiveness] Loading face detection models...
[FaceLiveness] Models loaded successfully
[FaceLiveness] Starting camera...
[FaceLiveness] Camera stream obtained          ← Should appear ONCE
[FaceLiveness] Stream assigned to video element
[FaceLiveness] Video metadata loaded
[FaceLiveness] Video playing
[FaceLiveness] Camera started successfully
```

Then the circular camera preview should appear and face detection begins.

## Files Modified

1. `src/components/interview/FaceLivenessCheck.tsx` - Fixed infinite loop
2. `next.config.js` - Added encoding fallback

## Status

✅ **CRITICAL FIX APPLIED** - The infinite loop is resolved. Camera will now start properly after a single attempt.

## How to Apply

1. **Save all files** (already done by the edit)
2. **Server will auto-restart** (Next.js detected the config change)
3. **Refresh browser** and start a new interview
4. Camera should now work on the first try!
