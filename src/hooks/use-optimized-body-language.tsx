"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// CRITICAL: Absolutely NO direct TensorFlow imports at module level
// This keeps the hook lightweight and allows TF.js to load only when actually needed

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
  score?: any // Keep generic to avoid importing heavy types
  pose?: any
  hands?: any[]
  face?: any
  running: boolean
  backend: string | null
  errors: string[]
  previewing?: boolean
}

let isLoading = false
let loadPromise: Promise<any> | null = null

// Lazy loader for ML models - only loads when startTracking is called
async function loadMLDependencies() {
  if (loadPromise) return loadPromise

  if (isLoading) {
    // Wait for existing load
    return new Promise(resolve => {
      const check = () => {
        if (!isLoading) resolve(null)
        else setTimeout(check, 100)
      }
      check()
    })
  }

  isLoading = true
  console.log('[BodyLanguage] 🔄 Loading ML dependencies...')
  
  loadPromise = (async () => {
    try {
      // Dynamic imports - loaded only when needed
      const [
        tf,
        poseDetection,
        handPoseDetection, 
        faceLandmarksDetection,
        { evaluateBodyLanguage }
      ] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/pose-detection'),
        import('@tensorflow-models/hand-pose-detection'),
        import('@tensorflow-models/face-landmarks-detection'),
        import('@/lib/body-language-scoring')
      ])

      // Initialize backends
      await Promise.all([
        import('@tensorflow/tfjs-backend-webgl').then(webgl => tf.setBackend('webgl')),
        import('@tensorflow/tfjs-backend-cpu') // Fallback
      ])

      console.log('[BodyLanguage] ✅ Dependencies loaded, backend:', tf.getBackend())

      return {
        tf,
        poseDetection,
        handPoseDetection,
        faceLandmarksDetection,
        evaluateBodyLanguage
      }
    } catch (error) {
      console.error('[BodyLanguage] ❌ Failed to load dependencies:', error)
      throw error
    } finally {
      isLoading = false
    }
  })()

  return loadPromise
}

export function useOptimizedBodyLanguageTracker(config?: TrackerConfig) {
  const cfg = useMemo<Required<TrackerConfig>>(() => ({
    width: config?.width ?? 640,
    height: config?.height ?? 480,
    enablePose: config?.enablePose ?? true,
    enableHands: config?.enableHands ?? false,
    enableFace: config?.enableFace ?? false,
    maxFPS: config?.maxFPS ?? 30,
    deviceId: config?.deviceId ?? '',
  }), [config])

  const [state, setState] = useState<TrackerState>({ 
    running: false, 
    backend: null, 
    errors: [], 
    previewing: false 
  })

  const rafRef = useRef<number | null>(null)
  const detectorsRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mlDepsRef = useRef<any>(null)

  // Optimized start function - loads ML only when needed
  const startTracking = useCallback(async (
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement
  ) => {
    try {
      setState(prev => ({ ...prev, running: true, errors: [] }))
      
      videoRef.current = video
      canvasRef.current = canvas

      // Load ML dependencies only now
      if (!mlDepsRef.current) {
        console.log('[BodyLanguage] 🚀 First time - loading ML models...')
        mlDepsRef.current = await loadMLDependencies()
      }

      const { tf, poseDetection, evaluateBodyLanguage } = mlDepsRef.current

      // Initialize detectors
      if (!detectorsRef.current?.pose && cfg.enablePose) {
        console.log('[BodyLanguage] 📐 Creating pose detector...')
        detectorsRef.current = {
          ...detectorsRef.current,
          pose: await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
          )
        }
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      // Optimized detection loop
      const detect = async () => {
        if (!videoRef.current || !canvasRef.current || !detectorsRef.current) return

        try {
          const poses = cfg.enablePose ? 
            await detectorsRef.current.pose.estimatePoses(videoRef.current) : []
          
          // Simple scoring without heavy computation
          const score = poses.length > 0 ? 
            evaluateBodyLanguage(poses[0], [], []) : 
            { overall: 0.5, posture: 0.5, engagement: 0.5, confidence: 0.5 }

          setState(prev => ({ 
            ...prev, 
            score, 
            pose: poses[0] || null,
            backend: tf.getBackend()
          }))

          // Continue loop at configured FPS
          if (rafRef.current) {
            setTimeout(() => {
              rafRef.current = requestAnimationFrame(detect)
            }, 1000 / cfg.maxFPS)
          }
        } catch (error) {
          console.error('[BodyLanguage] Detection error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Detection failed'
          setState(prev => ({ 
            ...prev, 
            errors: [...prev.errors.slice(-2), errorMessage]
          }))
        }
      }

      rafRef.current = requestAnimationFrame(detect)
      
    } catch (error) {
      console.error('[BodyLanguage] Start error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Start failed'
      setState(prev => ({ 
        ...prev, 
        running: false, 
        errors: [...prev.errors, errorMessage] 
      }))
    }
  }, [cfg])

  const stopTracking = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setState(prev => ({ ...prev, running: false, previewing: false }))
  }, [])

  const startPreview = useCallback(async (
    video: HTMLVideoElement, 
    deviceId?: string
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: cfg.width,
          height: cfg.height,
          frameRate: { ideal: cfg.maxFPS }
        },
        audio: false
      })

      video.srcObject = stream
      streamRef.current = stream
      
      setState(prev => ({ ...prev, previewing: true, errors: [] }))
      
      return new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })
    } catch (error) {
      console.error('[BodyLanguage] Preview error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Preview failed'
      setState(prev => ({ 
        ...prev, 
        errors: [...prev.errors, errorMessage] 
      }))
      throw error
    }
  }, [cfg])

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setState(prev => ({ ...prev, previewing: false }))
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking()
      stopPreview()
    }
  }, [stopTracking, stopPreview])

  return {
    state,
    startTracking,
    stopTracking,
    startPreview,
    stopPreview,
    isMLLoaded: !!mlDepsRef.current,
  }
}
