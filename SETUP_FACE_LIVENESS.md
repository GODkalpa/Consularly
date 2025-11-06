# Face Liveness Verification - Setup Guide

## Quick Start

### 1. Install Dependencies
The `face-api.js` package is already included in `package.json`. If you're setting up fresh:

```bash
npm install
```

### 2. Download Face Detection Models
Run the model downloader script:

```bash
npm run face:models
```

This will download 4 required model files (~4MB total) to `public/models/`:
- ✓ `tiny_face_detector_model-weights_manifest.json`
- ✓ `tiny_face_detector_model-shard1`
- ✓ `face_landmark_68_tiny_model-weights_manifest.json`
- ✓ `face_landmark_68_tiny_model-shard1`

### 3. Verify Setup
Check that the models directory exists:

```bash
# Windows
dir public\models

# macOS/Linux
ls -la public/models
```

You should see all 4 model files listed.

### 4. Start Development Server
```bash
npm run dev
```

## How It Works

### Interview Flow
1. User selects a student and starts an interview
2. New tab opens with interview session
3. **Camera/microphone permission request**
4. **[NEW] Face liveness verification screen**
   - User sees circular camera preview
   - System asks to move head (left, right, up, down)
   - Progress ring fills as movements complete
5. After verification, "Start Interview" button appears
6. Interview begins normally

### What the User Sees

#### Liveness Verification Screen
```
┌─────────────────────────────────────────┐
│         🎥 Face Verification            │
│  Complete the verification to ensure    │
│  your camera is working properly        │
│                                         │
│    ╭────────────────────────╮          │
│    │                        │          │
│    │   [Circular Camera]    │  ◐ 50%  │
│    │   [Live Preview]       │          │
│    │                        │          │
│    ╰────────────────────────╯          │
│                                         │
│  Move your head slowly to complete      │
│  the circle.                            │
│                                         │
│  [✓ Left] [✓ Right] [ Up ] [ Down ]    │
│  2 of 4 movements completed             │
└─────────────────────────────────────────┘
```

## Testing

### Test the Complete Flow
1. Go to `/org` (Organization Dashboard)
2. Click "New Interview"
3. Select a student and interview type
4. Click "Start Interview"
5. New tab opens
6. Allow camera and microphone access
7. **Face liveness screen appears**
8. Move your head in each direction as instructed:
   - Look left slowly
   - Look right slowly  
   - Look up slightly
   - Look down slightly
9. Green checkmark appears
10. Returns to preparing screen
11. "Start Interview" button is now available

### Expected Behavior
- ✅ Camera preview is mirrored (like a mirror)
- ✅ Progress ring animates from 0% to 100%
- ✅ Each movement badge turns green when detected
- ✅ Instructions update: "Great!", "Perfect!", "Excellent!"
- ✅ Success animation plays on completion
- ✅ Auto-returns to interview after 1 second

### Troubleshooting

#### Models Not Found
**Error**: `Failed to load face detection models`

**Solution**:
```bash
npm run face:models
```

#### Camera Permission Denied
**Error**: `Camera access denied`

**Solution**:
- Check browser settings to allow camera access
- Click the camera icon in address bar
- Refresh the page
- Or click "Skip Verification" button

#### Face Not Detected
**Issue**: Overlay says "Position your face in the frame"

**Solution**:
- Ensure adequate lighting
- Move closer to camera
- Look directly at camera
- Remove obstructions (hands, objects)

#### Slow Performance
**Issue**: Face detection is laggy

**Solution**:
- Close other applications using camera
- Use Chrome or Edge (better WebGL performance)
- Ensure good internet connection for model loading

## Configuration

### Skip Verification (For Testing)
If you want to temporarily bypass liveness check during development:

1. Open `src/components/interview/InterviewRunner.tsx`
2. Find the line:
   ```typescript
   const [livenessVerified, setLivenessVerified] = useState<boolean>(false)
   ```
3. Change to:
   ```typescript
   const [livenessVerified, setLivenessVerified] = useState<boolean>(true)
   ```

**Note**: This is for development only. Revert before production.

### Adjust Movement Sensitivity
In `src/components/interview/FaceLivenessCheck.tsx`:

```typescript
const movementThreshold = 15 // degrees of rotation
```

- **Lower value** (e.g., 10): More sensitive, easier to trigger
- **Higher value** (e.g., 20): Less sensitive, requires more head movement

## Production Checklist

Before deploying to production:

- [ ] `npm run face:models` has been run
- [ ] `public/models/` directory contains all 4 model files
- [ ] Models are committed to git (or served from CDN)
- [ ] Face detection works in production build (`npm run build && npm start`)
- [ ] Tested in Chrome, Firefox, Safari, and Edge
- [ ] Skip button available for accessibility
- [ ] Error messages are user-friendly
- [ ] HTTPS enabled (required for getUserMedia)

## Browser Requirements

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ✅ Edge 90+

### Required Features
- WebRTC (getUserMedia) support
- WebGL support (for face-api.js)
- ES6+ JavaScript
- LocalStorage (for interview session data)

## File Structure

```
visa-mockup/
├── src/
│   └── components/
│       └── interview/
│           ├── FaceLivenessCheck.tsx       # Main component
│           └── InterviewRunner.tsx         # Integration
├── public/
│   └── models/                             # Face detection models
│       ├── tiny_face_detector_model-weights_manifest.json
│       ├── tiny_face_detector_model-shard1
│       ├── face_landmark_68_tiny_model-weights_manifest.json
│       └── face_landmark_68_tiny_model-shard1
├── scripts/
│   └── download-face-models.js             # Model downloader
└── package.json                            # face:models script
```

## Security & Privacy

### Data Handling
- ✅ **All processing is client-side** (face-api.js runs in browser)
- ✅ **No facial data uploaded** to servers
- ✅ **No photos saved** or stored anywhere
- ✅ **Camera stream is temporary** (cleared after verification)
- ✅ **No identity verification** (only checks camera is working)

### HTTPS Requirement
- Browser security requires HTTPS for getUserMedia
- localhost is exempt (works on http://localhost during development)
- Production deployment MUST use HTTPS

## Performance

### Bundle Size Impact
- face-api.js: ~500KB (lazy loaded)
- Models: ~4MB total (cached after first download)
- Minimal impact on initial page load

### Runtime Performance
- Detection runs at 10-15 FPS
- Uses TinyFaceDetector (fastest model)
- Minimal CPU usage
- Typically completes in 5-10 seconds

## Support

### Common Questions

**Q: Can users skip the verification?**  
A: Yes, a "Skip Verification" button appears if there are errors (camera access denied, models not loading, etc.)

**Q: Does it work with glasses/hats/beards?**  
A: Yes, facial accessories typically don't affect detection.

**Q: What if lighting is poor?**  
A: Face detection may struggle. User can skip verification or improve lighting.

**Q: Does it verify identity?**  
A: No, it only verifies the camera is working. It's not a biometric authentication system.

**Q: Is it accessible?**  
A: The skip option ensures users with disabilities or technical issues can proceed.

## Related Documentation
- [FACE_LIVENESS_VERIFICATION.md](./FACE_LIVENESS_VERIFICATION.md) - Complete technical details
- [FACE_LIVENESS_IMPLEMENTATION_SUMMARY.md](./FACE_LIVENESS_IMPLEMENTATION_SUMMARY.md) - Implementation overview
- [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js) - Library documentation

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify models are downloaded: `npm run face:models`
3. Check browser console for error messages
4. Ensure HTTPS is enabled (production only)
5. Try a different browser (Chrome recommended)
