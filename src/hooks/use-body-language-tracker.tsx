"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-converter'
import type * as poseDetection from '@tensorflow-models/pose-detection'
import type * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import type * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { evaluateBodyLanguage, BodyLanguageScore } from '@/lib/body-language-scoring'

export interface TrackerConfig {
  width?: number
  height?: number
  enablePose?: boolean
  enableHands?: boolean
  enableFace?: boolean
  maxFPS?: number
  deviceId?: string
}

export interface TrackerState {
  score?: BodyLanguageScore
  pose?: any
  hands?: any[]
  face?: any
  running: boolean
  backend: string | null
  errors: string[]
}

export function useBodyLanguageTracker(config?: TrackerConfig) {
  const cfg = useMemo<Required<TrackerConfig>>(() => ({
    width: config?.width ?? 640,
    height: config?.height ?? 480,
    enablePose: config?.enablePose ?? true,
    enableHands: config?.enableHands ?? true,
    enableFace: config?.enableFace ?? true,
    maxFPS: config?.maxFPS ?? 30,
    deviceId: config?.deviceId ?? '',
  }), [config])

  const [state, setState] = useState<TrackerState>({ running: false, backend: null, errors: [] })

  const rafRef = useRef<number | null>(null)
  const detectorsRef = useRef<{
    pose?: poseDetection.PoseDetector
    hands?: handPoseDetection.HandDetector
    face?: faceLandmarksDetection.FaceLandmarksDetector
  }>({})
  const lastTimesRef = useRef<{ pose: number; hands: number; face: number }>({ pose: 0, hands: 0, face: 0 })

  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const selectedDeviceIdRef = useRef<string | undefined>(config?.deviceId)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const lastErrorRef = useRef<string>('')
  const lastErrorAtRef = useRef<number>(0)

  const stopStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
    }
  }, [])

  const setupCamera = useCallback(async () => {
    if (!videoRef.current) return
    try {
      // Try with ideal constraints and front camera
      const constraints1: MediaStreamConstraints = selectedDeviceIdRef.current
        ? {
            video: {
              deviceId: { exact: selectedDeviceIdRef.current },
              width: { ideal: cfg.width },
              height: { ideal: cfg.height },
            },
            audio: false,
          }
        : {
            video: {
              width: { ideal: cfg.width },
              height: { ideal: cfg.height },
              facingMode: 'user',
            },
            audio: false,
          }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints1)
      } catch (err1: any) {
        // Fallback to generic default camera if the first attempt fails
        const constraints2: MediaStreamConstraints = { video: true, audio: false }
        stream = await navigator.mediaDevices.getUserMedia(constraints2)
      }

      // Prepare video element
      videoRef.current.setAttribute('playsinline', 'true')
      videoRef.current.muted = true
      ;(videoRef.current as any).autoplay = true
      videoRef.current.srcObject = stream
      await new Promise<void>((resolve) => {
        const v = videoRef.current!
        if (v.readyState >= 1) return resolve()
        v.onloadedmetadata = () => resolve()
      })
      try {
        await videoRef.current.play()
      } catch (playErr) {
        // Some browsers require a user gesture; show hint and cleanup
        setState((s) => ({ ...s, errors: [...s.errors, 'Autoplay blocked. Click Start again or interact with the page to allow video playback.'] }))
        stopStream()
        return
      }
      videoRef.current.width = cfg.width
      videoRef.current.height = cfg.height

      if (canvasRef.current) {
        canvasRef.current.width = cfg.width
        canvasRef.current.height = cfg.height
        drawCtxRef.current = canvasRef.current.getContext('2d')
      }
    } catch (e: any) {
      const name = e?.name || 'Error'
      let hint = ''
      if (name === 'NotAllowedError') {
        hint = 'Camera permission was denied. Please allow camera access in your browser.'
      } else if (name === 'NotReadableError') {
        hint = 'Camera could not start. It may be in use by another app or blocked by OS privacy settings. Close other apps using the camera (Zoom/Teams/etc.) and check Windows Camera privacy settings.'
        // Attempt one silent retry with generic constraints after brief delay
        try {
          stopStream()
          await new Promise((r) => setTimeout(r, 200))
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          videoRef.current!.srcObject = stream
          await videoRef.current!.play()
        } catch {}
      } else if (name === 'OverconstrainedError') {
        hint = 'The requested camera constraints are not supported. Try a different camera or resolution.'
      } else if (name === 'NotFoundError') {
        hint = 'Requested camera device not found. Select a different camera from the dropdown and try again.'
        try { await refreshCameras() } catch {}
      }
      setState((s) => ({ ...s, errors: [...s.errors, `${name}: ${e?.message || e}. ${hint}`] }))
      // Don't rethrow; allow UI to present the error and user to retry or switch camera
    }
  }, [cfg.height, cfg.width])

  const loadDetectors = useCallback(async () => {
    const errors: string[] = []
    try {
      await tf.setBackend('webgl')
      await tf.ready()
    } catch (e: any) {
      errors.push('Failed to initialize TensorFlow.js backend: ' + (e?.message || e))
    }

    setState((s) => ({ ...s, backend: tf.getBackend() }))

    // Load models lazily in parallel
    try {
      const tasks: Promise<any>[] = []
      if (cfg.enablePose) {
        tasks.push((async () => {
          const poseDetectionMod = await import('@tensorflow-models/pose-detection')
          const detector = await poseDetectionMod.createDetector(poseDetectionMod.SupportedModels.MoveNet, {
            modelType: poseDetectionMod.movenet.modelType.SINGLEPOSE_LIGHTNING,
          })
          detectorsRef.current.pose = detector
        })())
      }
      if (cfg.enableHands) {
        tasks.push((async () => {
          const handMod = await import('@tensorflow-models/hand-pose-detection')
          const detector = await handMod.createDetector(handMod.SupportedModels.MediaPipeHands, {
            runtime: 'tfjs',
            modelType: 'full',
          })
          detectorsRef.current.hands = detector
        })())
      }
      if (cfg.enableFace) {
        tasks.push((async () => {
          const faceMod = await import('@tensorflow-models/face-landmarks-detection')
          let detector: faceLandmarksDetection.FaceLandmarksDetector | undefined
          // Try mediapipe runtime first to get annotations for easier scoring
          try {
            detector = await faceMod.createDetector(faceMod.SupportedModels.MediaPipeFaceMesh, {
              runtime: 'mediapipe',
              refineLandmarks: true,
              solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            } as any)
          } catch (e) {
            // Fallback to tfjs runtime
            detector = await faceMod.createDetector(faceMod.SupportedModels.MediaPipeFaceMesh, {
              runtime: 'tfjs',
              refineLandmarks: true,
            } as any)
          }
          detectorsRef.current.face = detector
        })())
      }
      await Promise.all(tasks)
    } catch (e: any) {
      errors.push('Failed to load one or more models: ' + (e?.message || e))
    }

    if (errors.length) setState((s) => ({ ...s, errors }))
  }, [cfg.enableFace, cfg.enableHands, cfg.enablePose])

  const drawOverlay = useCallback((pose: any, hands: any[], face: any) => {
    const ctx = drawCtxRef.current
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Pose keypoints and lines
    if (pose?.keypoints?.length) {
      const kps = pose.keypoints as Array<any>
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 3
      const byName = (n: string) => kps.find((k) => k.name === n)
      const lines: Array<[string, string]> = [
        ['left_shoulder', 'right_shoulder'],
        ['left_hip', 'right_hip'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
      ]
      ctx.beginPath()
      for (const [a, b] of lines) {
        const pa: any = byName(a)
        const pb: any = byName(b)
        if (pa && pb) {
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
        }
      }
      ctx.stroke()

      // Draw keypoints
      for (const p of kps) {
        if (p.score && p.score < 0.2) continue
        ctx.fillStyle = '#16a34a'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Hands keypoints
    if (hands?.length) {
      ctx.fillStyle = '#2563eb'
      for (const h of hands) {
        const kps = h.keypoints || []
        for (const p of kps) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Face landmarks (just a few points for performance)
    if (face) {
      const keypoints = face.keypoints || face.scaledMesh || []
      ctx.fillStyle = '#ef4444'
      for (const p of keypoints.slice(0, 100)) { // sample subset to reduce draw cost
        const x = p.x ?? p[0]
        const y = p.y ?? p[1]
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [])

  const step = useCallback(async () => {
    if (!videoRef.current) {
      rafRef.current = requestAnimationFrame(step)
      return
    }
    const now = performance.now()

    // Throttle detectors to balance performance
    const poseDue = now - lastTimesRef.current.pose > 1000 / cfg.maxFPS
    const handsDue = now - lastTimesRef.current.hands > 1000 / Math.min(15, cfg.maxFPS)
    const faceDue = now - lastTimesRef.current.face > 1000 / Math.min(15, cfg.maxFPS)

    try {
      const v = videoRef.current
      // Guard: wait until video has valid dimensions and data
      if (!v?.srcObject || v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      let pose: any = state.pose
      let hands: any[] = state.hands || []
      let face: any = state.face

      if (cfg.enablePose && detectorsRef.current.pose && poseDue) {
        pose = (await detectorsRef.current.pose!.estimatePoses(videoRef.current))[0]
        lastTimesRef.current.pose = now
      }
      if (cfg.enableHands && detectorsRef.current.hands && handsDue) {
        hands = await detectorsRef.current.hands!.estimateHands(videoRef.current)
        lastTimesRef.current.hands = now
      }
      if (cfg.enableFace && detectorsRef.current.face && faceDue) {
        const faces = await detectorsRef.current.face!.estimateFaces(videoRef.current!)
        face = faces[0]
        lastTimesRef.current.face = now
      }

      drawOverlay(pose, hands, face)

      const score = evaluateBodyLanguage({ pose, hands, face })
      setState((s) => ({ ...s, pose, hands, face, score }))
    } catch (e) {
      const msg = (e as any)?.message || String(e)
      const nowTs = performance.now()
      // Deduplicate same error spam within 2s window
      if (msg !== lastErrorRef.current || nowTs - lastErrorAtRef.current > 2000) {
        lastErrorRef.current = msg
        lastErrorAtRef.current = nowTs
        setState((s) => ({ ...s, errors: [...s.errors, msg] }))
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }, [cfg.enableFace, cfg.enableHands, cfg.enablePose, cfg.maxFPS, drawOverlay, state.face, state.hands, state.pose])

  const start = useCallback(async () => {
    if (state.running) return
    // Clear transient error spam from previous attempts
    lastErrorRef.current = ''
    lastErrorAtRef.current = 0
    await setupCamera()
    const v = videoRef.current
    if (!v?.srcObject || v.videoWidth === 0 || v.videoHeight === 0) {
      setState((s) => ({ ...s, errors: [...s.errors, 'Camera not ready. Check permissions and camera selection, then click Start again.'] }))
      return
    }
    await loadDetectors()
    // Update camera list after permission was granted
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const vids = devices.filter((d) => d.kind === 'videoinput')
      setCameras(vids)
    } catch {}
    setState((s) => ({ ...s, running: true }))
    rafRef.current = requestAnimationFrame(step)
  }, [loadDetectors, setupCamera, state.running, step])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    // Stop camera
    stopStream()
    setState((s) => ({ ...s, running: false }))
  }, [stopStream])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stopStream()
    }
  }, [stopStream])

  const refreshCameras = useCallback(async () => {
    try {
      let devices = await navigator.mediaDevices.enumerateDevices()
      let vids = devices.filter((d) => d.kind === 'videoinput')
      // If none found or labels are empty, try to prompt permission then re-enumerate
      const labelsMissing = vids.length > 0 && vids.every((v) => !v.label)
      if (vids.length === 0 || labelsMissing) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          // Immediately stop; we only needed permission
          s.getTracks().forEach((t) => t.stop())
          devices = await navigator.mediaDevices.enumerateDevices()
          vids = devices.filter((d) => d.kind === 'videoinput')
        } catch (permErr) {
          setState((s) => ({ ...s, errors: [...s.errors, 'Camera permission is required to list devices. Click Start or Allow camera access, then Refresh Cameras.'] }))
        }
      }
      setCameras(vids)
    } catch (e) {
      setState((s) => ({ ...s, errors: [...s.errors, 'Failed to enumerate cameras. Grant camera permission first.'] }))
    }
  }, [])

  useEffect(() => {
    refreshCameras()
  }, [refreshCameras])

  useEffect(() => {
    const handler = () => { refreshCameras() }
    try {
      navigator.mediaDevices.addEventListener('devicechange', handler)
    } catch {}
    return () => {
      try { navigator.mediaDevices.removeEventListener('devicechange', handler) } catch {}
    }
  }, [refreshCameras])

  const switchCamera = useCallback(async (deviceId: string) => {
    selectedDeviceIdRef.current = deviceId
    stopStream()
    await setupCamera()
  }, [setupCamera, stopStream])

  return { state, start, stop, videoRef, canvasRef, cameras, switchCamera, refreshCameras }
}
