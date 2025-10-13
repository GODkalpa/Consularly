// Body language scoring utilities
// Computes posture, hand gestures and facial expression metrics and aggregates to a confidence score

export type HandGesture = 'open' | 'fist' | 'unknown'

export interface PostureMetrics {
  torsoAngleDeg: number
  headTiltDeg: number
  slouchDetected: boolean
  score: number // 0-100
}

// Helpers for TFJS runtime where keypoints include names
function getGroupCenter(face: any, nameIncludes: string): Vec2 | null {
  const kps = face?.keypoints as Array<any> | undefined
  if (!kps?.length) return null
  const group = kps.filter((p) => typeof p.name === 'string' && p.name.includes(nameIncludes))
  if (!group.length) return null
  const cx = group.reduce((s, p) => s + (p.x ?? p[0]), 0) / group.length
  const cy = group.reduce((s, p) => s + (p.y ?? p[1]), 0) / group.length
  return { x: cx, y: cy }
}

function getGroupExtremeX(face: any, nameIncludes: string, which: 'min' | 'max'): Vec2 | null {
  const kps = face?.keypoints as Array<any> | undefined
  if (!kps?.length) return null
  const group = kps.filter((p) => typeof p.name === 'string' && p.name.includes(nameIncludes))
  if (!group.length) return null
  let best = group[0]
  for (const p of group) {
    if (which === 'min') {
      if ((p.x ?? p[0]) < (best.x ?? best[0])) best = p
    } else {
      if ((p.x ?? p[0]) > (best.x ?? best[0])) best = p
    }
  }
  const x = best.x ?? best[0]
  const y = best.y ?? best[1]
  return { x, y }
}

// Enhanced face point extraction with comprehensive fallback strategies
function extractFacePoint(face: any, strategy: string): Vec2 | null {
  if (!face) return null
  
  // Strategy-based extraction for reliable landmark detection
  switch (strategy) {
    case 'leftEye': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints (TFJS with names)
      if (kps?.length) {
        const leftEyePoints = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          (p.name.includes('leftEye') || p.name.includes('left_eye'))
        )
        if (leftEyePoints.length > 0) {
          const cx = leftEyePoints.reduce((s, p) => s + p.x, 0) / leftEyePoints.length
          const cy = leftEyePoints.reduce((s, p) => s + p.y, 0) / leftEyePoints.length
          return { x: cx, y: cy }
        }
      }
      
      // Approach 2: Use scaledMesh (MediaPipe runtime with mesh array)
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 159) {
        const p = face.scaledMesh[159]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access (TFJS without names)
      // Left eye center is at indices 159, 145, 386 in FaceMesh
      // Use average of multiple eye landmarks for robustness
      if (Array.isArray(kps) && kps.length >= 468) {
        const leftEyeIndices = [159, 145, 133] // Left eye center and corners
        const validPoints = leftEyeIndices
          .filter(idx => kps[idx] && typeof kps[idx].x === 'number' && typeof kps[idx].y === 'number')
          .map(idx => kps[idx])
        
        if (validPoints.length > 0) {
          const cx = validPoints.reduce((s, p) => s + p.x, 0) / validPoints.length
          const cy = validPoints.reduce((s, p) => s + p.y, 0) / validPoints.length
          return { x: cx, y: cy }
        }
      }
      
      return null
    }
    
    case 'rightEye': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const rightEyePoints = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          (p.name.includes('rightEye') || p.name.includes('right_eye'))
        )
        if (rightEyePoints.length > 0) {
          const cx = rightEyePoints.reduce((s, p) => s + p.x, 0) / rightEyePoints.length
          const cy = rightEyePoints.reduce((s, p) => s + p.y, 0) / rightEyePoints.length
          return { x: cx, y: cy }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 386) {
        const p = face.scaledMesh[386]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      if (Array.isArray(kps) && kps.length >= 468) {
        const rightEyeIndices = [386, 374, 362] // Right eye center and corners
        const validPoints = rightEyeIndices
          .filter(idx => kps[idx] && typeof kps[idx].x === 'number' && typeof kps[idx].y === 'number')
          .map(idx => kps[idx])
        
        if (validPoints.length > 0) {
          const cx = validPoints.reduce((s, p) => s + p.x, 0) / validPoints.length
          const cy = validPoints.reduce((s, p) => s + p.y, 0) / validPoints.length
          return { x: cx, y: cy }
        }
      }
      
      return null
    }
    
    case 'noseTip': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const nosePoints = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          (p.name.includes('nose') || p.name.includes('Nose'))
        )
        if (nosePoints.length > 0) {
          const p = nosePoints[Math.floor(nosePoints.length / 2)]
          return { x: p.x, y: p.y }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 1) {
        const p = face.scaledMesh[1]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      // Nose tip is at index 1 (or use 4 for nose bottom)
      if (Array.isArray(kps) && kps.length >= 468) {
        const noseTipIdx = 1 // Primary nose tip landmark
        if (kps[noseTipIdx] && typeof kps[noseTipIdx].x === 'number' && typeof kps[noseTipIdx].y === 'number') {
          return { x: kps[noseTipIdx].x, y: kps[noseTipIdx].y }
        }
      }
      
      return null
    }
    
    case 'mouthLeft': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const mouthLeft = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          p.name.includes('lips') && 
          (p.name.includes('Left') || p.name.includes('left'))
        )
        if (mouthLeft.length > 0) {
          const leftmost = mouthLeft.reduce((min, p) => p.x < min.x ? p : min, mouthLeft[0])
          return { x: leftmost.x, y: leftmost.y }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 61) {
        const p = face.scaledMesh[61]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      if (Array.isArray(kps) && kps.length >= 468) {
        const mouthLeftIdx = 61 // Left mouth corner
        if (kps[mouthLeftIdx] && typeof kps[mouthLeftIdx].x === 'number' && typeof kps[mouthLeftIdx].y === 'number') {
          return { x: kps[mouthLeftIdx].x, y: kps[mouthLeftIdx].y }
        }
      }
      
      return null
    }
    
    case 'mouthRight': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const mouthRight = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          p.name.includes('lips') && 
          (p.name.includes('Right') || p.name.includes('right'))
        )
        if (mouthRight.length > 0) {
          const rightmost = mouthRight.reduce((max, p) => p.x > max.x ? p : max, mouthRight[0])
          return { x: rightmost.x, y: rightmost.y }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 291) {
        const p = face.scaledMesh[291]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      if (Array.isArray(kps) && kps.length >= 468) {
        const mouthRightIdx = 291 // Right mouth corner
        if (kps[mouthRightIdx] && typeof kps[mouthRightIdx].x === 'number' && typeof kps[mouthRightIdx].y === 'number') {
          return { x: kps[mouthRightIdx].x, y: kps[mouthRightIdx].y }
        }
      }
      
      return null
    }
    
    case 'upperLip': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const upperLipPoints = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          (p.name.includes('lipsUpperOuter') || p.name.includes('upperLip'))
        )
        if (upperLipPoints.length > 0) {
          const cx = upperLipPoints.reduce((s, p) => s + p.x, 0) / upperLipPoints.length
          const cy = upperLipPoints.reduce((s, p) => s + p.y, 0) / upperLipPoints.length
          return { x: cx, y: cy }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 13) {
        const p = face.scaledMesh[13]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      if (Array.isArray(kps) && kps.length >= 468) {
        const upperLipIdx = 13 // Upper lip center
        if (kps[upperLipIdx] && typeof kps[upperLipIdx].x === 'number' && typeof kps[upperLipIdx].y === 'number') {
          return { x: kps[upperLipIdx].x, y: kps[upperLipIdx].y }
        }
      }
      
      return null
    }
    
    case 'lowerLip': {
      const kps = face?.keypoints as Array<any> | undefined
      
      // Approach 1: Try named keypoints
      if (kps?.length) {
        const lowerLipPoints = kps.filter((p: any) => 
          typeof p.name === 'string' && 
          (p.name.includes('lipsLowerOuter') || p.name.includes('lowerLip'))
        )
        if (lowerLipPoints.length > 0) {
          const cx = lowerLipPoints.reduce((s, p) => s + p.x, 0) / lowerLipPoints.length
          const cy = lowerLipPoints.reduce((s, p) => s + p.y, 0) / lowerLipPoints.length
          return { x: cx, y: cy }
        }
      }
      
      // Approach 2: Use scaledMesh
      if (Array.isArray(face?.scaledMesh) && face.scaledMesh.length > 14) {
        const p = face.scaledMesh[14]
        if (p && p.length >= 2) return { x: p[0], y: p[1] }
      }
      
      // Approach 3: Direct keypoints array access
      if (Array.isArray(kps) && kps.length >= 468) {
        const lowerLipIdx = 14 // Lower lip center
        if (kps[lowerLipIdx] && typeof kps[lowerLipIdx].x === 'number' && typeof kps[lowerLipIdx].y === 'number') {
          return { x: kps[lowerLipIdx].x, y: kps[lowerLipIdx].y }
        }
      }
      
      return null
    }
    
    default:
      return null
  }
}

export interface GestureMetrics {
  left: HandGesture
  right: HandGesture
  confidence: number // 0-1
  score: number // 0-100
}

export interface ExpressionMetrics {
  eyeContactScore: number // 0-100
  smileScore: number // 0-100
  confidence: number // 0-1
  score: number // 0-100
}

export interface BodyLanguageScore {
  posture: PostureMetrics
  gestures: GestureMetrics
  expressions: ExpressionMetrics
  overallScore: number // 0-100
  feedback: string[]
}

// Minimal vector utilities
interface Vec2 { x: number; y: number }
const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y)
const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function angleToVerticalDeg(a: Vec2, b: Vec2): number {
  // Angle of vector a->b to vertical axis (downwards). 0 = upright
  const vx = b.x - a.x
  const vy = b.y - a.y
  // vertical reference vector (0, 1)
  const dot = vy // (vx*0 + vy*1)
  const len = Math.hypot(vx, vy)
  if (len === 0) return 0
  const cos = clamp(dot / len, -1, 1)
  const angleRad = Math.acos(cos)
  return (angleRad * 180) / Math.PI
}

// Pose helpers expecting MoveNet keypoints with .name/.x/.y
function getPointByName(
  keypoints: Array<{ name?: string; x: number; y: number; score?: number }>,
  name: string
): Vec2 | null {
  const kp = keypoints.find((k) => k.name === name)
  return kp ? { x: kp.x, y: kp.y } : null
}

// Face helpers: support TFJS runtime (keypoints) and MediaPipe runtime (annotations/scaledMesh)
function getFacePoint(face: any, key: keyof any | number): Vec2 | null {
  if (!face) return null

  // 1) MediaPipe annotations (when runtime: 'mediapipe')
  if (typeof key === 'string') {
    const ann = face?.annotations?.[key as any]
    if (ann && ann.length) {
      const p = ann[Math.floor(ann.length / 2)]
      return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y }
    }
  }

  // 2) TFJS runtime keypoints (with optional names)
  const kps = face?.keypoints as Array<any> | undefined
  if (kps && kps.length) {
    if (typeof key === 'string') {
      // Try exact name match
      let kp = kps.find((p: any) => p.name === key)
      if (kp) return { x: kp.x, y: kp.y }
      // Try fuzzy group center for eyes if exact not present
      const name = String(key)
      if (name.startsWith('leftEye')) {
        const group = kps.filter((p: any) => typeof p.name === 'string' && p.name.includes('leftEye'))
        if (group.length) {
          const cx = group.reduce((s, p) => s + p.x, 0) / group.length
          const cy = group.reduce((s, p) => s + p.y, 0) / group.length
          return { x: cx, y: cy }
        }
      }
      if (name.startsWith('rightEye')) {
        const group = kps.filter((p: any) => typeof p.name === 'string' && p.name.includes('rightEye'))
        if (group.length) {
          const cx = group.reduce((s, p) => s + p.x, 0) / group.length
          const cy = group.reduce((s, p) => s + p.y, 0) / group.length
          return { x: cx, y: cy }
        }
      }
      if (name.includes('nose')) {
        const group = kps.filter((p: any) => typeof p.name === 'string' && p.name.includes('nose'))
        if (group.length) {
          const p = group[Math.floor(group.length / 2)]
          return { x: p.x, y: p.y }
        }
      }
    } else if (typeof key === 'number') {
      const p = kps[key]
      if (p) return { x: p.x ?? p[0], y: p.y ?? p[1] }
    }
  }

  // 3) Fallback to scaledMesh indices array (mediapipe runtime)
  if (typeof key === 'number' && Array.isArray(face?.scaledMesh)) {
    const p = face.scaledMesh[key]
    if (p) return { x: p[0], y: p[1] }
  }
  return null
}

function estimateEyeContact(face: any): number {
  if (!face) {
    console.log('⚠️ [Eye Contact] No face data provided')
    return 55 // Baseline fallback when no face detected
  }
  
  // Use enhanced extraction with multiple fallback strategies
  const leftEye = extractFacePoint(face, 'leftEye')
  const rightEye = extractFacePoint(face, 'rightEye')
  const nose = extractFacePoint(face, 'noseTip')

  if (!leftEye || !rightEye || !nose) {
    console.log('⚠️ [Eye Contact] Missing landmarks:', { 
      leftEye: !!leftEye, 
      rightEye: !!rightEye, 
      nose: !!nose,
      faceKeypoints: face?.keypoints?.length || 0,
      faceScaledMesh: face?.scaledMesh?.length || 0
    })
    return 55 // Baseline fallback - assume reasonable eye contact
  }

  // Validate extracted points have reasonable coordinates
  if (!isFinite(leftEye.x) || !isFinite(leftEye.y) || 
      !isFinite(rightEye.x) || !isFinite(rightEye.y) ||
      !isFinite(nose.x) || !isFinite(nose.y)) {
    console.log('⚠️ [Eye Contact] Invalid coordinates detected')
    return 55
  }

  // If face is frontal, nose sits near the midpoint between eyes horizontally
  const eyeMid = mid(leftEye, rightEye)
  const eyeDist = dist(leftEye, rightEye)
  
  if (!eyeDist || eyeDist < 5) { // Minimum realistic eye distance in pixels
    console.log('⚠️ [Eye Contact] Eye distance too small:', eyeDist)
    return 55 // Fallback - likely detection error
  }
  
  const horizOffset = Math.abs(nose.x - eyeMid.x) / eyeDist // 0 (centered) .. higher (turned)
  
  // VERY LENIENT THRESHOLDS for real-world professional interviews:
  // Professional frontal gaze (with glasses, slight angles) should score 75-85
  // horizOffset <= 0.35 = excellent (85-100)
  // horizOffset 0.35-0.6 = good (70-85)
  // horizOffset 0.6-0.8 = acceptable (55-70)
  // horizOffset > 0.8 = poor but not failing (40-55)
  
  let score: number
  if (horizOffset <= 0.35) {
    // Excellent - very frontal gaze
    score = 100 - (horizOffset / 0.35) * 15 // 100 down to 85
  } else if (horizOffset <= 0.6) {
    // Good - professional angle
    score = 85 - ((horizOffset - 0.35) / 0.25) * 15 // 85 down to 70
  } else if (horizOffset <= 0.8) {
    // Acceptable - noticeable angle but okay
    score = 70 - ((horizOffset - 0.6) / 0.2) * 15 // 70 down to 55
  } else {
    // Poor but not zero - clearly turned away
    score = Math.max(40, 55 - ((horizOffset - 0.8) / 0.3) * 15) // 55 down to 40
  }
  
  // Debug logging - only log when debugging or score is unexpectedly low
  if (horizOffset > 0.5 || score < 60) {
    console.log('👁️ [Eye Contact]:', {
      horizOffset: horizOffset.toFixed(3),
      score: Math.round(score),
      eyeDist: Math.round(eyeDist),
      leftEye: { x: Math.round(leftEye.x), y: Math.round(leftEye.y) },
      rightEye: { x: Math.round(rightEye.x), y: Math.round(rightEye.y) },
      nose: { x: Math.round(nose.x), y: Math.round(nose.y) },
      eyeMid: { x: Math.round(eyeMid.x), y: Math.round(eyeMid.y) }
    })
  }
  
  return Math.round(score)
}

function estimateSmile(face: any): number {
  if (!face) {
    console.log('⚠️ [Smile] No face data provided')
    return 65 // Baseline fallback - assume neutral professional expression
  }
  
  // Use enhanced extraction with multiple fallback strategies
  const leftCorner = extractFacePoint(face, 'mouthLeft')
  const rightCorner = extractFacePoint(face, 'mouthRight')
  const upperLip = extractFacePoint(face, 'upperLip')
  const lowerLip = extractFacePoint(face, 'lowerLip')
  
  if (!leftCorner || !rightCorner || !upperLip || !lowerLip) {
    console.log('⚠️ [Smile] Missing mouth landmarks:', {
      leftCorner: !!leftCorner,
      rightCorner: !!rightCorner,
      upperLip: !!upperLip,
      lowerLip: !!lowerLip,
      faceKeypoints: face?.keypoints?.length || 0,
      faceScaledMesh: face?.scaledMesh?.length || 0
    })
    return 65 // Baseline fallback - assume neutral professional expression
  }

  // Validate coordinates
  if (!isFinite(leftCorner.x) || !isFinite(rightCorner.x) || 
      !isFinite(upperLip.x) || !isFinite(lowerLip.x)) {
    console.log('⚠️ [Smile] Invalid mouth coordinates')
    return 65
  }

  const mouthWidth = dist(leftCorner, rightCorner)
  const lipOpen = dist(upperLip, lowerLip)
  
  if (mouthWidth <= 5) { // Minimum realistic mouth width
    console.log('⚠️ [Smile] Mouth width too small:', mouthWidth)
    return 65
  }
  
  const ratio = mouthWidth / (lipOpen + 1e-3)
  
  // VERY LENIENT EXPRESSION SCORING for professional interviews:
  // Neutral professional expression should score 65-70 (baseline)
  // Light smile should score 75-85
  // Wide smile scores 85-95
  // Only penalize obvious frowning or tension
  
  let score: number
  if (ratio >= 8) {
    // Wide smile - excellent
    score = Math.min(95, 85 + (ratio - 8) * 2)
  } else if (ratio >= 5.5) {
    // Light smile - good professional warmth
    score = 70 + ((ratio - 5.5) / 2.5) * 15 // 70 to 85
  } else if (ratio >= 3.5) {
    // Neutral professional expression - acceptable baseline
    score = 60 + ((ratio - 3.5) / 2) * 10 // 60 to 70
  } else if (ratio >= 2) {
    // Slightly tense or closed mouth - mild penalty
    score = 50 + ((ratio - 2) / 1.5) * 10 // 50 to 60
  } else {
    // Very tense or unusual mouth position
    score = Math.max(40, 50 - (2 - ratio) * 5)
  }
  
  // Debug logging - only when score is low or debugging
  if (score < 60 || ratio < 3) {
    console.log('😊 [Smile]:', {
      ratio: ratio.toFixed(2),
      score: Math.round(score),
      mouthWidth: Math.round(mouthWidth),
      lipOpen: Math.round(lipOpen),
      leftCorner: { x: Math.round(leftCorner.x), y: Math.round(leftCorner.y) },
      rightCorner: { x: Math.round(rightCorner.x), y: Math.round(rightCorner.y) }
    })
  }
  
  return Math.round(score)
}

function estimateHandGesture(hand: any): HandGesture {
  if (!hand) return 'unknown'
  const kps: Array<any> = hand.keypoints || hand.landmarks || []
  if (!kps.length) return 'unknown'
  // Names expected from MediaPipeHands via TFJS wrapper
  const byName = (name: string) => kps.find((p) => p.name === name) || null
  const wrist = byName('wrist')
  const tips = [
    byName('thumb_tip'),
    byName('index_finger_tip'),
    byName('middle_finger_tip'),
    byName('ring_finger_tip'),
    byName('pinky_tip'),
  ].filter(Boolean) as Array<Vec2>

  if (!wrist || tips.length < 3) return 'unknown'

  // Open hand: average tip distance from wrist large; fist: small
  const avgTipDist = tips.reduce((s, t) => s + Math.hypot((t as any).x - (wrist as any).x, (t as any).y - (wrist as any).y), 0) / tips.length
  // Use hand size proxy: distance wrist->index_mcp if available
  const idxMcp = byName('index_finger_mcp')
  const ref = idxMcp ? Math.hypot((idxMcp as any).x - (wrist as any).x, (idxMcp as any).y - (wrist as any).y) : 1
  const scaled = avgTipDist / (ref || 1)

  if (scaled > 3.2) return 'open'
  if (scaled < 2.2) return 'fist'
  return 'unknown'
}

function postureFromPose(pose: any): PostureMetrics {
  const kps = pose?.keypoints || []
  const ls = getPointByName(kps, 'left_shoulder')
  const rs = getPointByName(kps, 'right_shoulder')
  const lh = getPointByName(kps, 'left_hip')
  const rh = getPointByName(kps, 'right_hip')
  const le = getPointByName(kps, 'left_ear')
  const re = getPointByName(kps, 'right_ear')

  if (!ls || !rs) {
    console.log('⚠️ [Posture] Missing shoulder landmarks')
    return { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 70 } // Baseline fallback
  }

  const shoulderMid = mid(ls, rs)
  let torsoAngleDeg = 0
  if (lh && rh) {
    const hipMid = mid(lh, rh)
    torsoAngleDeg = angleToVerticalDeg(shoulderMid, hipMid)
  } else {
    // Fallback: use shoulder line relative to vertical as proxy
    // If shoulders slope heavily, assume lean; otherwise neutral
    const shoulderSlope = Math.abs(angleToVerticalDeg(ls, rs) - 90)
    torsoAngleDeg = shoulderSlope * 0.5 // softer influence
  }

  let headTiltDeg = 0
  if (le && re) {
    headTiltDeg = Math.abs(angleToVerticalDeg(le, re) - 90) // horizontal line vs vertical -> 90 when level
  }

  // LENIENT THRESHOLDS for realistic sitting posture:
  // Natural sitting posture often has 5-15° torso angle - this is NORMAL
  // Only flag as slouch if angle is extreme (> 25°)
  const slouchDetected = torsoAngleDeg > 25 || headTiltDeg > 20
  
  // LENIENT SCORING: Natural professional sitting should score 70-85
  // Perfect upright (0-5°) = 90-100
  // Good posture (5-15°) = 75-90
  // Acceptable (15-25°) = 60-75
  // Slouching (25-35°) = 45-60
  // Poor (>35°) = 40-45
  
  let torsoScore: number
  if (torsoAngleDeg <= 5) {
    torsoScore = 100 - torsoAngleDeg // 100 to 95
  } else if (torsoAngleDeg <= 15) {
    torsoScore = 95 - ((torsoAngleDeg - 5) / 10) * 20 // 95 to 75
  } else if (torsoAngleDeg <= 25) {
    torsoScore = 75 - ((torsoAngleDeg - 15) / 10) * 15 // 75 to 60
  } else if (torsoAngleDeg <= 35) {
    torsoScore = 60 - ((torsoAngleDeg - 25) / 10) * 15 // 60 to 45
  } else {
    torsoScore = Math.max(40, 45 - (torsoAngleDeg - 35) * 0.5)
  }
  
  let headScore: number
  if (headTiltDeg <= 5) {
    headScore = 100 - headTiltDeg // 100 to 95
  } else if (headTiltDeg <= 15) {
    headScore = 95 - ((headTiltDeg - 5) / 10) * 20 // 95 to 75
  } else if (headTiltDeg <= 25) {
    headScore = 75 - ((headTiltDeg - 15) / 10) * 20 // 75 to 55
  } else {
    headScore = Math.max(40, 55 - (headTiltDeg - 25) * 0.5)
  }
  
  const score = Math.round(0.7 * torsoScore + 0.3 * headScore)
  
  // Debug logging when posture is flagged as poor
  if (slouchDetected || score < 60) {
    console.log('🪑 [Posture]:', {
      torsoAngle: torsoAngleDeg.toFixed(1) + '°',
      headTilt: headTiltDeg.toFixed(1) + '°',
      torsoScore: Math.round(torsoScore),
      headScore: Math.round(headScore),
      overall: score,
      slouch: slouchDetected
    })
  }
  
  return { torsoAngleDeg, headTiltDeg, slouchDetected, score }
}

export function evaluateBodyLanguage(args: {
  pose?: any // from @tensorflow-models/pose-detection (MoveNet)
  hands?: any[] // from @tensorflow-models/hand-pose-detection (MediaPipeHands) - DEPRECATED, no longer used
  face?: any // from @tensorflow-models/face-landmarks-detection (FaceMesh)
}): BodyLanguageScore {
  const posture = postureFromPose(args.pose)

  // Posture-only scoring: expressions removed per requirement
  const eyeContact = 0
  const smile = 0
  const expressionsScore = 0
  const expressionConfidence = 0

  // Overall equals posture only
  const overall = posture.score

  const feedback: string[] = []
  if (posture.slouchDetected && posture.score < 55) {
    feedback.push('Try sitting more upright with shoulders back.')
  }

  // Debug (light): log posture-only score occasionally
  if (Math.random() < 0.2) {
    console.log('📊 [Body Language Overall]:', {
      posture: posture.score,
      overall,
      weights: { posture: '100%' },
      hasPose: !!args.pose
    })
  }

  return {
    posture,
    gestures: { left: 'unknown', right: 'unknown', confidence: 0, score: 0 }, // Kept for backward compatibility but unused
    expressions: { eyeContactScore: eyeContact, smileScore: smile, confidence: expressionConfidence, score: expressionsScore },
    overallScore: overall,
    feedback,
  }
}
