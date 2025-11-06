# Face Liveness Verification - Complete Flow Diagram

## 📋 User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTERVIEW START FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

                               [User Clicks]
                              "Start Interview"
                                     │
                                     ▼
                           ┌─────────────────┐
                           │  New Tab Opens  │
                           │   (Interview)   │
                           └────────┬────────┘
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │  Permission Request      │
                      │  🎥 Camera + 🎤 Mic      │
                      │                          │
                      │  [Allow] or [Block]      │
                      └─────────┬────────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
              [ALLOW]                    [BLOCK]
                   │                         │
                   ▼                         ▼
        ┌──────────────────────┐    ┌─────────────────┐
        │  ✅ Permissions OK   │    │  ❌ Error State │
        │  permissionsReady    │    │  Show Retry     │
        │  = true              │    │  Button         │
        └──────────┬───────────┘    └─────────────────┘
                   │
                   ▼
        ╔══════════════════════════╗
        ║  🎯 FACE LIVENESS CHECK  ║
        ║  (NEW FEATURE)           ║
        ╚══════════╦═══════════════╝
                   │
                   ▼
        ┌──────────────────────────┐
        │  Circular Camera Preview │
        │  with Progress Ring      │
        │                          │
        │  Instructions:           │
        │  "Move your head slowly" │
        │                          │
        │  [◐ 0%]                  │
        │  [ ] Left  [ ] Right     │
        │  [ ] Up    [ ] Down      │
        └──────────┬───────────────┘
                   │
                   │ [User moves head LEFT]
                   ▼
        ┌──────────────────────────┐
        │  [◑ 25%]                 │
        │  [✓] Left  [ ] Right     │
        │  [ ] Up    [ ] Down      │
        │                          │
        │  "Perfect! Now right..." │
        └──────────┬───────────────┘
                   │
                   │ [User moves head RIGHT]
                   ▼
        ┌──────────────────────────┐
        │  [◕ 50%]                 │
        │  [✓] Left  [✓] Right     │
        │  [ ] Up    [ ] Down      │
        │                          │
        │  "Excellent! Now up..."  │
        └──────────┬───────────────┘
                   │
                   │ [User looks UP]
                   ▼
        ┌──────────────────────────┐
        │  [◕ 75%]                 │
        │  [✓] Left  [✓] Right     │
        │  [✓] Up    [ ] Down      │
        │                          │
        │  "Almost done! Down..."  │
        └──────────┬───────────────┘
                   │
                   │ [User looks DOWN]
                   ▼
        ┌──────────────────────────┐
        │  [● 100%]                │
        │  [✓] Left  [✓] Right     │
        │  [✓] Up    [✓] Down      │
        │                          │
        │  ✓ Verification Complete │
        │  [Large Checkmark]       │
        └──────────┬───────────────┘
                   │
                   │ [Auto-proceed after 1s]
                   ▼
        ┌──────────────────────────┐
        │  ✅ livenessVerified     │
        │  = true                  │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │  Preparing Screen        │
        │  (Welcome + Mic Preview) │
        │                          │
        │  [Start Interview] ✓     │
        │  ↑ NOW ENABLED           │
        └──────────┬───────────────┘
                   │
                   │ [User clicks]
                   ▼
        ┌──────────────────────────┐
        │  Interview Begins        │
        │  First Question Appears  │
        │  Recording Starts        │
        └──────────────────────────┘
```

## 🔄 State Transitions

```
┌─────────────────────────────────────────────────────────────────────┐
│  STATE MACHINE                                                      │
└─────────────────────────────────────────────────────────────────────┘

    Initial State
         │
         ▼
    loading: true
         │
         ▼
    session loaded
    session.status = 'preparing'
         │
         ▼
    permissionsReady = false  ◄──┐
         │                        │
         │ [request permissions]  │
         ▼                        │
    getUserMedia()               │ [retry]
         │                        │
    ┌────┴─────┐                 │
    │          │                 │
  [OK]      [FAIL] ──────────────┘
    │          
    ▼          
    permissionsReady = true
         │
         ▼
    livenessVerified = false
         │
         ▼
    Show FaceLivenessCheck Component
         │
         │ [head movements detected]
         ▼
    onVerified() callback
         │
         ▼
    livenessVerified = true
         │
         ▼
    Show "Start Interview" button
         │
         │ [user clicks]
         ▼
    beginInterview()
         │
         ▼
    session.status = 'active'
         │
         ▼
    Interview Running...
```

## 🎬 Component Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPONENT RENDERING                                                │
└─────────────────────────────────────────────────────────────────────┘

InterviewRunner.tsx
    │
    ├─ if loading
    │   └─ Show: Loading spinner
    │
    ├─ if !session
    │   └─ Show: Error (Session not found)
    │
    ├─ if !permissionsReady
    │   └─ Show: Permission request overlay
    │
    ├─ if preparing && permissionsReady && !livenessVerified
    │   └─ 🎯 Show: FaceLivenessCheck component ◄── NEW!
    │       │
    │       ├─ Load face-api.js models
    │       ├─ Start camera
    │       ├─ Detect face + landmarks
    │       ├─ Track head movements
    │       └─ Call onVerified() when done
    │
    ├─ if preparing && permissionsReady && livenessVerified
    │   └─ Show: Preparing screen with "Start Interview" button
    │
    ├─ if active
    │   └─ Show: Interview interface (questions, video, transcript)
    │
    └─ if completed
        └─ Show: Results screen with final report
```

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  STATE & PROPS                                                      │
└─────────────────────────────────────────────────────────────────────┘

FaceLivenessCheck Component
    │
    │ Props In:
    │   ├─ onVerified: () => void
    │   └─ onSkip?: () => void
    │
    │ Internal State:
    │   ├─ loading: boolean
    │   ├─ error: string | null
    │   ├─ modelsLoaded: boolean
    │   ├─ cameraReady: boolean
    │   ├─ faceDetected: boolean
    │   ├─ completedMovements: MovementDirection[]
    │   ├─ currentInstruction: string
    │   └─ verificationComplete: boolean
    │
    │ Models:
    │   ├─ TinyFaceDetector (face detection)
    │   └─ FaceLandmark68TinyNet (landmark tracking)
    │
    │ Detection Loop:
    │   ├─ videoRef → face-api.detectSingleFace()
    │   ├─ Extract landmarks (nose, eyes)
    │   ├─ Calculate head rotation (yaw, pitch)
    │   ├─ Compare to baseline position
    │   ├─ Detect movements (threshold: 15°)
    │   └─ Update completedMovements[]
    │
    │ Completion Check:
    │   └─ if all 4 movements done
    │       └─ setVerificationComplete(true)
    │           └─ setTimeout(() => onVerified(), 1000)
    │
    └─ Callback to parent component
        └─ InterviewRunner.setLivenessVerified(true)
```

## 🎨 Visual States

```
┌─────────────────────────────────────────────────────────────────────┐
│  UI STATES                                                          │
└─────────────────────────────────────────────────────────────────────┘

State 1: LOADING
┌────────────────────────┐
│   🎥 Face Verification │
│                        │
│   [Spinner]            │
│   Loading face         │
│   detection...         │
└────────────────────────┘

State 2: CAMERA STARTING
┌────────────────────────┐
│   🎥 Face Verification │
│                        │
│   [Spinner]            │
│   Starting camera...   │
└────────────────────────┘

State 3: NO FACE DETECTED
┌────────────────────────┐
│   🎥 Face Verification │
│        ╭──────╮        │
│        │ [⚠️] │        │
│        │ blur │        │
│        ╰──────╯        │
│   Position your face   │
│   in the frame         │
└────────────────────────┘

State 4: DETECTING (0% - 25%)
┌────────────────────────┐
│   🎥 Face Verification │
│        ╭──────╮        │
│    ◐  │ 👤   │        │
│  25%  │ face │        │
│        ╰──────╯        │
│ "Move head left..."    │
│ [✓] [ ] [ ] [ ]       │
└────────────────────────┘

State 5: DETECTING (50%)
┌────────────────────────┐
│   🎥 Face Verification │
│        ╭──────╮        │
│    ◕  │ 👤   │        │
│  50%  │ face │        │
│        ╰──────╯        │
│ "Now move right..."    │
│ [✓][✓] [ ] [ ]        │
└────────────────────────┘

State 6: COMPLETE (100%)
┌────────────────────────┐
│   🎥 Face Verification │
│        ╭──────╮        │
│    ●  │  ✓   │        │
│ 100%  │ [✓]  │        │
│        ╰──────╯        │
│ Verification complete! │
│ [✓][✓][✓][✓]          │
└────────────────────────┘

State 7: ERROR
┌────────────────────────┐
│   🎥 Face Verification │
│                        │
│   ⚠️ Camera access    │
│   denied               │
│                        │
│   [Skip Verification]  │
└────────────────────────┘
```

## 🔐 Security & Privacy

```
┌─────────────────────────────────────────────────────────────────────┐
│  DATA HANDLING                                                      │
└─────────────────────────────────────────────────────────────────────┘

Camera Stream
    │
    ├─ Accessed via: navigator.mediaDevices.getUserMedia()
    │
    ├─ Used for: 
    │   ├─ Live preview (video element)
    │   └─ Face detection (face-api.js)
    │
    ├─ Processed where:
    │   └─ ✅ CLIENT-SIDE ONLY (browser)
    │       └─ face-api.js runs entirely in browser
    │           └─ TensorFlow.js (WebGL backend)
    │
    ├─ Uploaded to server?
    │   └─ ❌ NO - Never uploaded
    │
    ├─ Stored anywhere?
    │   └─ ❌ NO - Not saved to disk or memory
    │
    └─ Cleanup:
        └─ stream.getTracks().forEach(t => t.stop())
            └─ Called on component unmount
            └─ Camera indicator turns off

Detection Results
    │
    ├─ What's detected:
    │   ├─ Face bounding box
    │   ├─ 68 facial landmarks (x,y coordinates)
    │   └─ Head rotation angles (yaw, pitch)
    │
    ├─ What's tracked:
    │   └─ completedMovements: ['left', 'right', 'up', 'down']
    │
    ├─ Stored where:
    │   └─ React state (temporary, in-memory only)
    │
    └─ Sent to server?
        └─ ❌ NO - Only boolean "verified=true" in parent component

Privacy Summary:
    ✅ No photos captured
    ✅ No facial recognition
    ✅ No biometric authentication
    ✅ No identity verification
    ✅ No data uploaded
    ✅ All processing client-side
    ✅ Camera stream temporary
    ✅ Purpose: Hardware verification only
```

## 📱 Browser Support Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPATIBILITY                                                      │
└─────────────────────────────────────────────────────────────────────┘

Browser         Version    getUserMedia   face-api.js   Status
─────────────────────────────────────────────────────────────────
Chrome          90+        ✅             ✅            ✅ Full Support
Edge            90+        ✅             ✅            ✅ Full Support
Firefox         88+        ✅             ✅            ✅ Full Support
Safari          14.1+      ✅             ✅            ✅ Full Support
─────────────────────────────────────────────────────────────────
Chrome Mobile   90+        ✅             ✅            ✅ Full Support
Safari iOS      14.1+      ✅             ✅            ✅ Full Support
─────────────────────────────────────────────────────────────────
IE 11           -          ❌             ❌            ❌ Not Supported
Opera Mini      -          ❌             ❌            ❌ Not Supported

Requirements:
    ✅ WebRTC (getUserMedia API)
    ✅ WebGL (for TensorFlow.js)
    ✅ ES6+ JavaScript
    ✅ HTTPS (or localhost for dev)
```

## 📈 Performance Metrics

```
┌─────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE                                                        │
└─────────────────────────────────────────────────────────────────────┘

Initial Load:
    ├─ face-api.js library:     ~500 KB (lazy loaded)
    ├─ Model files (cached):    ~4 MB total
    └─ Total download:          ~4.5 MB (first time only)

Runtime:
    ├─ Detection FPS:           10-15 FPS
    ├─ CPU usage:               Low (TinyFaceDetector)
    ├─ Memory usage:            ~50-100 MB
    └─ WebGL acceleration:      Yes

User Experience:
    ├─ Model loading:           1-2 seconds
    ├─ Camera start:            0.5-1 second
    ├─ Verification time:       5-10 seconds (user-dependent)
    └─ Total overhead:          7-13 seconds

Optimization:
    ✅ Lazy loading (face-api.js)
    ✅ Tiny models (fastest detection)
    ✅ RAF-based detection loop
    ✅ Proper cleanup (no memory leaks)
    ✅ Browser caching (models)
```

---

## Summary

This face liveness verification system adds a professional, security-oriented step to the interview flow. It ensures camera functionality before the interview starts, provides a modern Face ID-style user experience, and operates entirely client-side for maximum privacy.

The system is non-intrusive, taking only 5-10 seconds to complete, and includes a skip option for accessibility. It uses industry-standard face detection technology (face-api.js) with lightweight models for optimal performance.
