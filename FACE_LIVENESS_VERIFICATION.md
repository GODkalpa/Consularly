# Face Liveness Verification System

## Overview
Added a Face ID-style liveness verification system that ensures the camera is working properly before interview starts. The system requires users to move their head in different directions (left, right, up, down) to complete verification.

## Features

### 1. Circular Camera Preview
- Professional circular frame with progress ring (similar to Face ID)
- Mirror-flipped video for natural user experience
- Real-time visual feedback with animations

### 2. Head Movement Detection
- Uses face-api.js with TinyFaceDetector and 68-point face landmarks
- Detects 4 movements: **Left**, **Right**, **Up**, **Down**
- Threshold-based movement detection (15-degree rotation)
- Sequential instruction system guides user through each movement

### 3. Progress Tracking
- Animated progress ring around camera preview
- Individual badges for each completed movement
- Color-coded completion states (green = completed, gray = pending)
- Real-time instruction updates

### 4. Face Detection Feedback
- Overlay when no face detected ("Position your face in the frame")
- Success overlay with animated checkmark on completion
- Auto-proceeds to interview after 1-second confirmation

## Technical Implementation

### Components
**File**: `src/components/interview/FaceLivenessCheck.tsx`

**Dependencies**:
- `face-api.js` - Face detection and landmark tracking
- `motion/react` (Framer Motion) - Animations
- shadcn/ui components - Card, Button, Badge

**Models** (Downloaded to `public/models/`):
- `tiny_face_detector_model` - Fast face detection
- `face_landmark_68_tiny_model` - 68-point facial landmarks

### Integration
**File**: `src/components/interview/InterviewRunner.tsx`

**Flow**:
1. User opens interview tab
2. Permission request for camera/microphone
3. **[NEW]** Face liveness verification appears
4. User completes head movements (left → right → up → down)
5. Verification succeeds, "Start Interview" button becomes available
6. Interview begins normally

### State Management
```typescript
const [livenessVerified, setLivenessVerified] = useState<boolean>(false)
```

The liveness check is shown when:
- `session.status === 'preparing'` (before interview starts)
- `permissionsReady === true` (camera/mic access granted)
- `livenessVerified === false` (not yet verified)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install face-api.js
```

### 2. Download Face Detection Models
```bash
node scripts/download-face-models.js
```

This downloads the required models to `public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_tiny_model-weights_manifest.json`
- `face_landmark_68_tiny_model-shard1`

### 3. Verify Models Directory
Ensure `public/models/` contains all 4 model files before running the app.

## User Experience

### Visual Design
- **Dark gradient background** with professional card layout
- **Circular camera preview** (320x320px) with decorative progress ring
- **Smooth animations** for all state transitions
- **Accessibility**: Clear instructions and visual feedback at each step

### Instructions Flow
1. "Move your head slowly" (initial state)
2. "Great! Now slowly move your head left"
3. "Perfect! Now move your head right"
4. "Excellent! Now look up slightly"
5. "Almost done! Now look down slightly"
6. "Verification complete! ✓" (auto-proceeds after 1s)

### Error Handling
- **Camera access denied**: Shows error message with "Skip Verification" button
- **No face detected**: Overlay prompt to position face in frame
- **Model loading failure**: Graceful fallback with skip option

## Security & Privacy

### Data Processing
- All face detection runs **client-side only** (face-api.js in browser)
- No facial data or images are uploaded to servers
- Camera stream is local and temporary
- Verification only confirms camera is working, not identity

### Skip Option
- Users can skip verification if they have technical issues
- "Skip Verification (Not Recommended)" button available on errors
- Skip is also available in the interface for accessibility

## Performance

### Bundle Size
- face-api.js: ~500KB (lazy loaded)
- Models: ~4MB total (cached after first load)
- Detection runs at ~10-15 FPS (sufficient for head movement tracking)

### Optimization
- Uses TinyFaceDetector (fastest model)
- Minimal landmark detection (68-point lite model)
- RequestAnimationFrame for smooth detection loop
- Cleanup on component unmount to prevent memory leaks

## Testing Checklist

- [ ] Camera permission request appears
- [ ] Circular camera preview shows mirrored video
- [ ] Progress ring animates as movements complete
- [ ] All 4 movements detect correctly (left, right, up, down)
- [ ] Face detection overlay shows when face not visible
- [ ] Success animation plays on completion
- [ ] Auto-proceeds to interview after verification
- [ ] "Start Interview" button only enabled after verification
- [ ] Skip button works on errors
- [ ] Works in different lighting conditions
- [ ] Works with glasses/accessories

## Browser Compatibility

**Supported**:
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14.1+ ✅
- Edge 90+ ✅

**Requirements**:
- WebRTC getUserMedia support
- ES6+ JavaScript
- WebGL for face-api.js

## Future Enhancements

### Potential Improvements
1. **Adaptive Thresholds**: Adjust movement sensitivity based on user's camera distance
2. **3D Head Pose**: Use full 3D rotation (pitch, yaw, roll) for more accurate detection
3. **Anti-Spoofing**: Add blink detection to prevent photo spoofing
4. **Accessibility**: Voice guidance for visually impaired users
5. **Multi-language**: Localized instructions
6. **Analytics**: Track verification success rates and common failure points

### Alternative Approaches Considered
- **MediaPipe FaceMesh**: More accurate but heavier (1.5MB models)
- **TensorFlow.js BlazeFace**: Faster but no landmarks for movement detection
- **Simple motion detection**: No face-specific logic, less secure

## Troubleshooting

### Models Not Loading
```
Error: Failed to load face detection models
```
**Solution**: Run `node scripts/download-face-models.js` to download models

### Face Not Detected
- Ensure adequate lighting
- Position face directly in front of camera
- Remove obstructions (hands, objects)
- Check if browser has camera permission

### Slow Performance
- Close other apps using camera
- Use Chrome/Edge (better WebGL performance)
- Ensure camera drivers are updated

## Related Files
- `src/components/interview/FaceLivenessCheck.tsx` - Main component
- `src/components/interview/InterviewRunner.tsx` - Integration
- `scripts/download-face-models.js` - Model downloader
- `public/models/` - Face detection models

## References
- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [Face Landmark Detection](https://github.com/google/mediapipe/blob/master/docs/solutions/face_mesh.md)
- [WebRTC getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
