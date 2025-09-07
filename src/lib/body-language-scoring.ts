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
  if (!face) return 0
  // Use eyes and nose alignment to infer rough frontal gaze
  // Prefer annotations or named keypoints, fallback to numeric indices for FaceMesh
  let leftEye = getFacePoint(face, 'leftEyeUpper0') || getFacePoint(face, 'leftEyeLower0')
  let rightEye = getFacePoint(face, 'rightEyeUpper0') || getFacePoint(face, 'rightEyeLower0')
  const nose = getFacePoint(face, 'noseTip') || getFacePoint(face, 1) // 1 ≈ nose tip

  // Numeric fallback: eye center as midpoint between outer and inner corners
  if (!leftEye) {
    const leOuter = getFacePoint(face, 33)
    const leInner = getFacePoint(face, 133)
    if (leOuter && leInner) leftEye = mid(leOuter, leInner)
  }
  if (!rightEye) {
    const reOuter = getFacePoint(face, 362)
    const reInner = getFacePoint(face, 263)
    if (reOuter && reInner) rightEye = mid(reOuter, reInner)
  }

  if (!leftEye || !rightEye || !nose) return 0

  // If face is frontal, nose sits near the midpoint between eyes horizontally
  const eyeMid = mid(leftEye, rightEye)
  const eyeDist = dist(leftEye, rightEye)
  if (!eyeDist || eyeDist < 1e-3) return 0
  const horizOffset = Math.abs(nose.x - eyeMid.x) / eyeDist // 0 (centered) .. higher (turned)
  // If offset <= 0.1: strong eye contact; 0.25 moderate; >0.4 poor
  const score = 100 * clamp(1 - (horizOffset - 0.05) / 0.35, 0, 1)
  return Math.round(score)
}

function estimateSmile(face: any): number {
  if (!face) return 0
  // Use mouth width / vertical lip opening ratio as proxy for smile
  // Corners: 61 (left) and 291 (right) in FaceMesh; upper lip 13, lower lip 14
  const leftCorner = getFacePoint(face, 61) || getGroupExtremeX(face, 'lips', 'min')
  const rightCorner = getFacePoint(face, 291) || getGroupExtremeX(face, 'lips', 'max')
  const upperLip = getFacePoint(face, 13) || getGroupCenter(face, 'lipsUpperInner') || getGroupCenter(face, 'lipsUpperOuter')
  const lowerLip = getFacePoint(face, 14) || getGroupCenter(face, 'lipsLowerInner') || getGroupCenter(face, 'lipsLowerOuter')
  if (!leftCorner || !rightCorner || !upperLip || !lowerLip) return 0

  const mouthWidth = dist(leftCorner, rightCorner)
  const lipOpen = dist(upperLip, lowerLip)
  if (mouthWidth <= 0) return 0
  const ratio = mouthWidth / (lipOpen + 1e-3)
  // Smiles increase width more than vertical opening; ratio > 6 likely smiling, 3-6 neutral, <3 mouth open
  const normalized = clamp((ratio - 3) / 3, 0, 1)
  return Math.round(normalized * 100)
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
    return { torsoAngleDeg: 0, headTiltDeg: 0, slouchDetected: false, score: 0 }
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

  const slouchDetected = torsoAngleDeg > 12 || headTiltDeg > 15
  // Score: 100 when torsoAngle ~0 and head level
  const torsoScore = 100 * clamp(1 - torsoAngleDeg / 25, 0, 1)
  const headScore = 100 * clamp(1 - headTiltDeg / 25, 0, 1)
  const score = Math.round(0.7 * torsoScore + 0.3 * headScore)
  return { torsoAngleDeg, headTiltDeg, slouchDetected, score }
}

export function evaluateBodyLanguage(args: {
  pose?: any // from @tensorflow-models/pose-detection (MoveNet)
  hands?: any[] // from @tensorflow-models/hand-pose-detection (MediaPipeHands)
  face?: any // from @tensorflow-models/face-landmarks-detection (FaceMesh)
}): BodyLanguageScore {
  const posture = postureFromPose(args.pose)

  const leftHand = args.hands?.find((h) => h.handedness?.toLowerCase?.() === 'left') || args.hands?.[0]
  const rightHand = args.hands?.find((h) => h.handedness?.toLowerCase?.() === 'right') || args.hands?.[1]
  const leftGesture = estimateHandGesture(leftHand)
  const rightGesture = estimateHandGesture(rightHand)

  const gestureConfidence = ((leftGesture === 'unknown' ? 0 : 0.5) + (rightGesture === 'unknown' ? 0 : 0.5))
  const gestureScore = Math.round(
    100 * (
      (leftGesture === 'open' ? 0.5 : leftGesture === 'fist' ? 0.35 : 0.2) +
      (rightGesture === 'open' ? 0.5 : rightGesture === 'fist' ? 0.35 : 0.2)
    )
  )

  const eyeContact = estimateEyeContact(args.face)
  const smile = estimateSmile(args.face)
  const expressionsScore = Math.round(0.6 * eyeContact + 0.4 * smile)
  const expressionConfidence = (args.face ? 0.9 : 0.2)

  // Aggregate overall score with weights: posture 45%, expressions 35%, gestures 20%
  const overall = Math.round(0.45 * posture.score + 0.35 * expressionsScore + 0.2 * gestureScore)

  const feedback: string[] = []
  if (posture.slouchDetected) feedback.push('Sit upright; reduce torso lean and keep your head level.')
  if (eyeContact < 60) feedback.push('Improve eye contact by facing the camera more directly.')
  if (smile < 50) feedback.push('A light smile can convey confidence and warmth.')
  if (leftGesture === 'fist' || rightGesture === 'fist') feedback.push('Relax clenched fists; rest hands naturally or use open gestures.')

  return {
    posture,
    gestures: { left: leftGesture, right: rightGesture, confidence: gestureConfidence, score: gestureScore },
    expressions: { eyeContactScore: eyeContact, smileScore: smile, confidence: expressionConfidence, score: expressionsScore },
    overallScore: overall,
    feedback,
  }
}
