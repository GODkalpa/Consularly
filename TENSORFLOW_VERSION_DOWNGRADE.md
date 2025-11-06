# TensorFlow.js Version Downgrade Fix

## Root Cause

**face-api.js 0.22.2 is incompatible with TensorFlow.js 4.x**

The error `t.toFloat is not a function` occurs because:
- face-api.js was built for TensorFlow.js 3.x API
- TensorFlow.js 4.x changed internal tensor APIs
- face-api.js's NetInput class expects old API methods

## Solution

Downgrade TensorFlow.js from 4.22.0 to 3.21.0

### Commands to Run

```bash
npm uninstall @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl @tensorflow/tfjs-converter

npm install @tensorflow/tfjs-core@3.21.0 @tensorflow/tfjs-backend-webgl@3.21.0 @tensorflow/tfjs-converter@3.21.0 @tensorflow/tfjs-backend-cpu@3.21.0
```

## Why This Works

TensorFlow.js 3.x has:
- ✅ `toFloat()` method on tensors
- ✅ Compatible tensor API with face-api.js
- ✅ All features face-api.js needs

TensorFlow.js 4.x:
- ❌ Removed/renamed some tensor methods
- ❌ Changed internal APIs
- ❌ face-api.js wasn't updated for these changes

## After Downgrade

1. **Restart dev server**: `npm run dev`
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Test face detection**: Should work without errors

## Expected Result

```
[FaceLiveness] TensorFlow.js WebGL backend ready
[FaceLiveness] Models loaded successfully
[FaceLiveness] ✅ Face detected!
```

No more `t.toFloat is not a function` errors!
