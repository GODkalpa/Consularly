"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// IMPORTANT: Avoid top-level TensorFlow imports to keep the interview route light.
// We will lazy-load TFJS and the WebGL backend inside loadDetectors() when needed.
// This prevents the heavy TFJS packages from being bundled into the initial page chunk.
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
  /** True when only camera preview is active (no ML analysis) */
  previewing?: boolean
}

export function useBodyLanguageTracker(config?: TrackerConfig) {
  const cfg = useMemo<Required<TrackerConfig>>(() => ({
    width: config?.width ?? 640,
    height: config?.height ?? 480,
    enablePose: config?.enablePose ?? true,
    enableHands: config?.enableHands ?? false, // posture-only by default
    enableFace: config?.enableFace ?? false, // posture-only by default
    maxFPS: config?.maxFPS ?? 30,
    deviceId: config?.deviceId ?? '',
  }), [config])

  const [state, setState] = useState<TrackerState>({ running: false, backend: null, errors: [], previewing: false })
  const SMOOTH = 0.25 // exponential smoothing factor for scores to reduce jitter

  const rafRef = useRef<number | null>(null)
  const detectorsRef = useRef<{
    pose?: poseDetection.PoseDetector
    hands?: handPoseDetection.HandDetector
    face?: faceLandmarksDetection.FaceLandmarksDetector
  }>({})
  const lastTimesRef = useRef<{ pose: number; hands: number; face: number }>({ pose: 0, hands: 0, face: 0 })
  // PERFORMANCE FIX: Frame skipping for UI updates (update every 4th frame = 3 FPS instead of 12 FPS)
  const frameCountRef = useRef<number>(0)
  const lastStateUpdateRef = useRef<number>(0)

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
      // Only stop existing stream if we're setting up a new one
      // Check if there's already an active stream to avoid cutting off running cameras
      const existingStream = videoRef.current.srcObject as MediaStream | null
      const hasActiveStream = existingStream && existingStream.getTracks().some(t => t.readyState === 'live')
      
      // If we already have an active stream, don't restart unless explicitly switching cameras
      if (hasActiveStream) {
        console.log('📹 Camera already active, skipping setup')
        return
      }
      
      // Stop any previously attached stream to avoid multiple camera captures
      try { stopStream() } catch {}
      // Try with ideal constraints and front camera
      const constraints1: MediaStreamConstraints = selectedDeviceIdRef.current
        ? {
            video: {
              deviceId: { exact: selectedDeviceIdRef.current },
              width: { ideal: cfg.width },
              height: { ideal: cfg.height },
              frameRate: { max: 24 },
            },
            audio: false,
          }
        : {
            video: {
              width: { ideal: cfg.width },
              height: { ideal: cfg.height },
              facingMode: 'user',
              frameRate: { max: 24 },
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
        // Use willReadFrequently option to optimize for frequent drawing operations
        // Try different context configurations in order of preference for compatibility
        try {
          // First try with desynchronized flag (best performance)
          drawCtxRef.current = canvasRef.current.getContext('2d', { 
            willReadFrequently: false,
            desynchronized: true
          })
        } catch (ctxErr1) {
          console.warn('Canvas context with desynchronized failed, trying without it:', ctxErr1)
          try {
            // Fallback without desynchronized
            drawCtxRef.current = canvasRef.current.getContext('2d', { 
              willReadFrequently: false
            })
          } catch (ctxErr2) {
            console.warn('Canvas context with willReadFrequently:false failed, using defaults:', ctxErr2)
            // Final fallback to completely default context
            drawCtxRef.current = canvasRef.current.getContext('2d')
          }
        }
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
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const vids = devices.filter((d) => d.kind === 'videoinput')
          setCameras(vids)
        } catch {}
      }
      setState((s) => {
        const next = [...s.errors, `${name}: ${e?.message || e}. ${hint}`]
        return { ...s, errors: next.length > 20 ? next.slice(next.length - 20) : next }
      })
      // Don't rethrow; allow UI to present the error and user to retry or switch camera
    }
  }, [cfg.height, cfg.width, stopStream])

  const loadDetectors = useCallback(async () => {
    const errors: string[] = []
    // Lazy-load TFJS core and backends only when we actually start analysis
    let tfMod: any = null
    let backendName = 'webgl'
    
    try {
      tfMod = await import('@tensorflow/tfjs-core')
      await import('@tensorflow/tfjs-converter')

      // Try WebGL first (best performance), then CPU fallback. Avoid WebGPU to prevent missing dependency builds.
      try {
        await import('@tensorflow/tfjs-backend-webgl')
        await tfMod.setBackend('webgl')
        await tfMod.ready()
        backendName = 'webgl'
        console.log('✅ TensorFlow.js WebGL backend initialized')
      } catch (webglError: any) {
        console.warn('⚠️ WebGL backend failed, falling back to CPU:', webglError?.message || webglError)
        try {
          await import('@tensorflow/tfjs-backend-cpu')
          await tfMod.setBackend('cpu')
          await tfMod.ready()
          backendName = 'cpu'
          console.log('✅ TensorFlow.js CPU backend initialized (fallback)')
        } catch (cpuError: any) {
          errors.push('Failed to initialize TensorFlow.js (WebGL and CPU backends failed). WebGL error: ' + (webglError?.message || webglError) + '. CPU error: ' + (cpuError?.message || cpuError))
          throw new Error('No TensorFlow.js backend available')
        }
      }
    } catch (e: any) {
      errors.push('Failed to initialize TensorFlow.js: ' + (e?.message || e))
    }

    try {
      const backend = tfMod?.getBackend ? tfMod.getBackend() : null
      setState((s) => ({ ...s, backend }))
    } catch {}

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
      // Hands and face disabled in posture-only mode unless explicitly enabled via config
      if (cfg.enableHands) {
        tasks.push((async () => {
          const handMod = await import('@tensorflow-models/hand-pose-detection')
          const detector = await handMod.createDetector(handMod.SupportedModels.MediaPipeHands, {
            runtime: 'tfjs',
            modelType: 'lite',
          })
          detectorsRef.current.hands = detector
        })())
      }
      if (cfg.enableFace) {
        tasks.push((async () => {
          const faceMod = await import('@tensorflow-models/face-landmarks-detection')
          let detector: faceLandmarksDetection.FaceLandmarksDetector | undefined
          try {
            detector = await faceMod.createDetector(faceMod.SupportedModels.MediaPipeFaceMesh, {
              runtime: 'mediapipe',
              refineLandmarks: false,
              solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            } as any)
          } catch (e) {
            detector = await faceMod.createDetector(faceMod.SupportedModels.MediaPipeFaceMesh, {
              runtime: 'tfjs',
              refineLandmarks: false,
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
    const canvas = canvasRef.current
    // Guard: skip drawing if context or canvas is not available
    if (!ctx || !canvas || canvas.width === 0 || canvas.height === 0) return
    
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    } catch (clearErr) {
      // Silently handle canvas context errors (e.g., context lost)
      console.warn('Canvas clear failed:', clearErr)
      return
    }

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

    // PERFORMANCE FIX: Dramatically reduced detection frequency and staggered execution
    // Pose: 3 FPS, Hands: 2 FPS, Face: 2 FPS (reduces blocking by 50-70%)
    const poseDue = now - lastTimesRef.current.pose > 333 // 3 FPS (was 83ms = 12 FPS)
    const handsDue = now - lastTimesRef.current.hands > 500 // 2 FPS (was 166ms = 6 FPS)
    const faceDue = now - lastTimesRef.current.face > 500 // 2 FPS (was 166ms = 6 FPS)

    try {
      const v = videoRef.current
      // Guard: wait until video has valid dimensions and data
      if (!v?.srcObject || v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      // PERFORMANCE FIX: Use local variables instead of reading from state to avoid re-creating callback
      let pose: any = null
      let hands: any[] = []
      let face: any = null
      let detectionRan = false

      // PERFORMANCE FIX: Stagger model executions to prevent blocking spikes
      // Don't run all three in the same frame
      if (cfg.enablePose && detectorsRef.current.pose && poseDue) {
        pose = (await detectorsRef.current.pose!.estimatePoses(videoRef.current))[0]
        lastTimesRef.current.pose = now
        detectionRan = true
        
        // Debug pose detection
        if (pose?.keypoints?.length) {
          const confidence = pose.keypoints.reduce((sum: number, kp: any) => sum + (kp.score || 0), 0) / pose.keypoints.length
          if (Math.random() < 0.1) { // Log 10% of frames to avoid spam
            console.log('🏃 [Pose Detection]:', {
              keypoints: pose.keypoints.length,
              avgConfidence: confidence.toFixed(2)
            })
          }
        }
      } else if (cfg.enableHands && detectorsRef.current.hands && handsDue) {
        hands = await detectorsRef.current.hands!.estimateHands(videoRef.current)
        lastTimesRef.current.hands = now
        detectionRan = true
      } else if (cfg.enableFace && detectorsRef.current.face && faceDue) {
        const faces = await detectorsRef.current.face!.estimateFaces(videoRef.current!)
        face = faces[0]
        lastTimesRef.current.face = now
        detectionRan = true
        
        // Debug face detection - log structure to help diagnose landmark extraction issues
        if (face) {
          if (Math.random() < 0.1) { // Log 10% of frames to avoid spam
            console.log('👤 [Face Detection]:', {
              hasKeypoints: !!face.keypoints,
              keypointsCount: face.keypoints?.length || 0,
              hasScaledMesh: !!face.scaledMesh,
              scaledMeshCount: face.scaledMesh?.length || 0,
              hasAnnotations: !!face.annotations,
              annotationKeys: face.annotations ? Object.keys(face.annotations).slice(0, 5) : [],
              sampleKeypoint: face.keypoints?.[0] ? {
                hasName: 'name' in face.keypoints[0],
                hasX: 'x' in face.keypoints[0],
                hasY: 'y' in face.keypoints[0]
              } : 'none'
            })
          }
        } else {
          if (Math.random() < 0.05) { // Log 5% when no face detected
            console.log('⚠️ [Face Detection]: No face detected in frame')
          }
        }
      }

      // If no detector ran this frame, skip to next frame
      if (!detectionRan) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      // PERFORMANCE FIX: Skip drawing overlay during interview to reduce canvas operations
      // drawOverlay(pose, hands, face) // Disabled - canvas drawing is expensive

      const raw = evaluateBodyLanguage({ pose, hands, face })
      const blend = (prev: number | undefined, curr: number) => (typeof prev === 'number' ? (prev * (1 - SMOOTH) + curr * SMOOTH) : curr)
      
      // PERFORMANCE FIX: Frame skipping for UI updates - only update state every 4th frame (3 FPS UI updates)
      frameCountRef.current++
      const shouldUpdateUI = frameCountRef.current % 4 === 0 || (now - lastStateUpdateRef.current > 500)
      
      if (shouldUpdateUI) {
        lastStateUpdateRef.current = now
        // PERFORMANCE FIX: Use batch state update to reduce re-renders
        setState((s) => {
          const prev = s.score
          const smoothed = prev ? {
            ...raw,
            posture: { ...raw.posture, score: blend(prev.posture?.score, raw.posture.score) },
            gestures: { ...raw.gestures, score: blend(prev.gestures?.score, raw.gestures.score) },
            expressions: {
              ...raw.expressions,
              eyeContactScore: 0,
              smileScore: 0,
              score: 0,
            },
            overallScore: blend(prev.overallScore, raw.overallScore),
          } as typeof raw : raw
          return { ...s, pose, hands, face, score: smoothed }
        })
      }
    } catch (e) {
      const msg = (e as any)?.message || String(e)
      const nowTs = performance.now()
      // Deduplicate same error spam within 2s window
      if (msg !== lastErrorRef.current || nowTs - lastErrorAtRef.current > 2000) {
        lastErrorRef.current = msg
        lastErrorAtRef.current = nowTs
        setState((s) => {
          const next = [...s.errors, msg]
          return { ...s, errors: next.length > 20 ? next.slice(next.length - 20) : next }
        })
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }, [cfg.enableFace, cfg.enableHands, cfg.enablePose]) // PERFORMANCE FIX: Removed state dependencies

  const start = useCallback(async () => {
    if (state.running) return
    console.log('🎬 Starting body language analysis...')
    // Clear transient error spam from previous attempts
    lastErrorRef.current = ''
    lastErrorAtRef.current = 0
    // If we're not already previewing (no stream), set up the camera.
    const existingStream = videoRef.current?.srcObject as MediaStream | null
    const hasActiveStream = existingStream && existingStream.getTracks().some(t => t.readyState === 'live')
    
    if (!hasActiveStream) {
      console.log('📹 No active stream, setting up camera...')
      await setupCamera()
    } else {
      console.log('📹 Using existing camera stream')
    }
    
    const v = videoRef.current
    if (!v?.srcObject || v.videoWidth === 0 || v.videoHeight === 0) {
      setState((s) => {
        const next = [...s.errors, 'Camera not ready. Check permissions and camera selection, then click Start again.']
        return { ...s, errors: next.length > 20 ? next.slice(next.length - 20) : next }
      })
      return
    }
    await loadDetectors()
    // Update camera list after permission was granted
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const vids = devices.filter((d) => d.kind === 'videoinput')
      setCameras(vids)
    } catch {}
    setState((s) => ({ ...s, running: true, previewing: false }))
    rafRef.current = requestAnimationFrame(step)
  }, [loadDetectors, setupCamera, state.running, step])

  const disposeDetectors = useCallback(async () => {
    console.log('🧹 Starting detector disposal...')
    
    // Dispose detectors first
    try { 
      await detectorsRef.current.pose?.dispose?.() 
      console.log('✅ Pose detector disposed')
    } catch (e) { 
      console.warn('Pose disposal error:', e) 
    }
    try { 
      await detectorsRef.current.hands?.dispose?.() 
      console.log('✅ Hands detector disposed')
    } catch (e) { 
      console.warn('Hands disposal error:', e) 
    }
    try { 
      await detectorsRef.current.face?.dispose?.() 
      console.log('✅ Face detector disposed')
    } catch (e) { 
      console.warn('Face disposal error:', e) 
    }
    detectorsRef.current = {}
    
    // FIXED: Robust TensorFlow backend cleanup with proper error handling
    try {
      const tfMod = await import('@tensorflow/tfjs-core')
      
      // Check if TensorFlow is actually initialized before trying cleanup
      let currentBackend: string | null = null
      try {
        currentBackend = tfMod.getBackend()
      } catch (e) {
        console.log('⚠️ No TensorFlow backend registered (not initialized or already disposed)')
        return // Exit early if backend not found
      }
      
      if (!currentBackend) {
        console.log('⚠️ TensorFlow backend is null, skipping cleanup')
        return
      }
      
      console.log(`🧹 Current backend: ${currentBackend}`)
      
      // Dispose all tensors being tracked
      try {
        const numTensors = tfMod.memory().numTensors
        console.log(`🧹 Disposing ${numTensors} tensors...`)
        tfMod.disposeVariables()
      } catch (e) {
        console.warn('Failed to dispose TensorFlow variables:', e)
      }
      
      // Backend-specific cleanup (only if backend is WebGL)
      if (currentBackend === 'webgl') {
        try {
          const webglBackend = tfMod.backend() as any
          if (webglBackend && typeof webglBackend.dispose === 'function') {
            // Note: We don't call dispose() because it removes the backend from registry
            // causing "No backend found in registry" errors on next use
            // Instead, just log the status
            if (webglBackend?.numDataIds) {
              console.log(`🧹 WebGL data IDs: ${webglBackend.numDataIds()}`)
            }
            console.log('✅ WebGL backend cleanup completed (kept in registry for reuse)')
          }
        } catch (e) {
          console.warn('WebGL backend cleanup warning (non-critical):', e)
        }
      }
      
      // Log final memory state
      try {
        const memoryAfter = tfMod.memory()
        console.log('📊 Memory after cleanup:', {
          numTensors: memoryAfter.numTensors,
          numDataBuffers: memoryAfter.numDataBuffers,
          numBytes: memoryAfter.numBytes,
        })
      } catch (e) {
        console.warn('Could not read memory stats:', e)
      }
    } catch (e) {
      console.warn('TensorFlow cleanup warning (non-critical):', e)
    }
  }, [])

  const stop = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    // Stop camera
    stopStream()
    try { await disposeDetectors() } catch {}
    setState((s) => ({ ...s, running: false, previewing: false }))
  }, [stopStream, disposeDetectors])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stopStream()
      // Fire-and-forget async cleanup on unmount
      disposeDetectors().catch(() => {})
    }
  }, [stopStream, disposeDetectors])

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
          setState((s) => {
            const next = [...s.errors, 'Camera permission is required to list devices. Click Start or Allow camera access, then Refresh Cameras.']
            return { ...s, errors: next.length > 20 ? next.slice(next.length - 20) : next }
          })
        }
      }
      setCameras(vids)
    } catch (e) {
      setState((s) => {
        const next = [...s.errors, 'Failed to enumerate cameras. Grant camera permission first.']
        return { ...s, errors: next.length > 20 ? next.slice(next.length - 20) : next }
      })
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
    console.log('🔄 Switching camera to:', deviceId)
    selectedDeviceIdRef.current = deviceId
    // Force stop the current stream before switching
    stopStream()
    // Force setupCamera to run by temporarily clearing srcObject
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    await setupCamera()
  }, [setupCamera, stopStream])

  // Preview-only controls: show camera without starting ML analysis
  const startPreview = useCallback(async () => {
    if (state.previewing || state.running) return
    console.log('👁️ Starting camera preview...')
    try {
      const existingStream = videoRef.current?.srcObject as MediaStream | null
      const hasActiveStream = existingStream && existingStream.getTracks().some(t => t.readyState === 'live')
      
      if (!hasActiveStream) {
        await setupCamera()
      }
      // Update camera list after permission was granted
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const vids = devices.filter((d) => d.kind === 'videoinput')
        setCameras(vids)
      } catch {}
      setState((s) => ({ ...s, previewing: true }))
    } catch {}
  }, [setupCamera, state.previewing, state.running])

  const stopPreview = useCallback(() => {
    if (!state.previewing || state.running) return
    stopStream()
    setState((s) => ({ ...s, previewing: false }))
  }, [state.previewing, state.running, stopStream])

  // Capture current score on-demand (for accurate moment-of-answer capture)
  const captureScore = useCallback((): BodyLanguageScore | null => {
    if (!state.running || !state.score) {
      console.warn('⚠️ Body language tracker not running or no score available', {
        running: state.running,
        hasScore: !!state.score,
        previewing: state.previewing
      })
      return null
    }
    
    // Validate the score has meaningful data (not just defaults)
    // RELAXED: Accept any score data if pose detection is working (even with low confidence)
    const hasValidData = state.score.expressions.confidence > 0.1 || 
                         state.score.gestures.confidence > 0.1 ||
                         (state.pose && state.pose.keypoints?.length > 0)
    
    if (!hasValidData) {
      console.warn('⚠️ Body language score confidence too low - data may be invalid', {
        expressionConf: state.score.expressions.confidence,
        gestureConf: state.score.gestures.confidence,
        poseKeypoints: state.pose?.keypoints?.length || 0
      })
      return null
    }
    
    // Log successful capture even if confidence is low
    if (state.score.expressions.confidence < 0.3 && state.score.gestures.confidence < 0.3) {
      console.warn('⚠️ Body language confidence is low but accepting score:', {
        expressionConf: state.score.expressions.confidence,
        gestureConf: state.score.gestures.confidence,
      })
    }
    
    console.log('✅ Captured body language score:', {
      overall: Math.round(state.score.overallScore),
      posture: Math.round(state.score.posture.score),
      gestures: Math.round(state.score.gestures.score),
      expressions: Math.round(state.score.expressions.score),
    })
    
    return state.score
  }, [state.running, state.score, state.pose, state.previewing])

  return { state, start, stop, startPreview, stopPreview, captureScore, videoRef, canvasRef, cameras, switchCamera, refreshCameras }
}
