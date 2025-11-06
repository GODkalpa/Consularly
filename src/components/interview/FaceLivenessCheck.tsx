"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Camera, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

// Use dynamic import to avoid SSR issues with face-api.js
// Using @vladmandic/face-api - compatible with TensorFlow.js 4.x
let faceapi: any = null

interface FaceLivenessCheckProps {
  onVerified: () => void
  onSkip?: () => void
}

type MovementDirection = 'center' | 'left' | 'right' | 'up' | 'down'

export function FaceLivenessCheck({ onVerified, onSkip }: FaceLivenessCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  
  // Movement tracking
  const [requiredMovements] = useState<MovementDirection[]>(['left', 'right', 'up', 'down'])
  const [completedMovements, setCompletedMovements] = useState<MovementDirection[]>([])
  const [currentInstruction, setCurrentInstruction] = useState<string>('Position your face in the center')
  const [faceDetected, setFaceDetected] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  
  // Track head position for movement detection
  const baselinePositionRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const movementThreshold = 20 // Increased threshold for more deliberate movements
  const detectionInterval = useRef<number>(0) // Skip frames for better performance
  const completedMovementsRef = useRef<Set<MovementDirection>>(new Set()) // Track completed movements immediately

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('[FaceLiveness] Loading @vladmandic/face-api library...')
        // Dynamic import of @vladmandic/face-api (TensorFlow.js 4.x compatible)
        const faceapiModule = await import('@vladmandic/face-api')
        faceapi = faceapiModule
        console.log('[FaceLiveness] @vladmandic/face-api loaded')
        
        // Import and set TensorFlow.js backend
        console.log('[FaceLiveness] Loading TensorFlow.js backend...')
        const tf = await import('@tensorflow/tfjs-core')
        const tfBackend = await import('@tensorflow/tfjs-backend-webgl')
        
        // Set WebGL backend
        await tf.setBackend('webgl')
        await tf.ready()
        console.log('[FaceLiveness] TensorFlow.js WebGL backend ready')
        
        console.log('[FaceLiveness] Loading face detection models...')
        const MODEL_URL = '/models' // Models should be in public/models directory
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ])
        
        console.log('[FaceLiveness] Models loaded successfully')
        console.log('[FaceLiveness] Using improved detection settings')
        setModelsLoaded(true)
      } catch (e) {
        console.error('[FaceLiveness] Failed to load models:', e)
        setError(`Failed to load face detection: ${e}`)
        setLoading(false)
      }
    }
    
    loadModels()
  }, [])

  // Start camera
  useEffect(() => {
    if (!modelsLoaded) return
    
    const startCamera = async () => {
      try {
        console.log('[FaceLiveness] Starting camera...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        })
        
        streamRef.current = stream
        console.log('[FaceLiveness] Camera stream obtained')
        
        if (videoRef.current) {
          const video = videoRef.current
          video.srcObject = stream
          console.log('[FaceLiveness] Stream assigned to hidden video element')
          console.log('[FaceLiveness] Video element exists:', !!video)
          console.log('[FaceLiveness] Video readyState:', video.readyState)
          
          // Also assign to display video
          const displayVideo = document.getElementById('face-liveness-display') as HTMLVideoElement
          if (displayVideo) {
            displayVideo.srcObject = stream
            console.log('[FaceLiveness] Stream also assigned to display video')
          }
          
          // Try to play immediately (sometimes works without waiting for metadata)
          const tryPlay = () => {
            console.log('[FaceLiveness] Attempting to play video...')
            video.play()
              .then(() => {
                console.log('[FaceLiveness] ✅ Video playing successfully')
                
                // Also play the display video
                const displayVideo = document.getElementById('face-liveness-display') as HTMLVideoElement
                if (displayVideo && displayVideo.srcObject) {
                  displayVideo.play().catch(e => console.warn('[FaceLiveness] Display video play error:', e))
                }
                
                setCameraReady(true)
                setLoading(false)
              })
              .catch((playError) => {
                console.warn('[FaceLiveness] Play error (will retry):', playError.name, playError.message)
              })
          }
          
          // Wait for video metadata to load
          video.onloadedmetadata = () => {
            console.log('[FaceLiveness] Video metadata loaded, readyState:', video.readyState)
            tryPlay()
          }
          
          // Fallback 1: Try after 500ms regardless
          setTimeout(() => {
            if (!cameraReady) {
              console.log('[FaceLiveness] Fallback 1: Trying to play after 500ms')
              tryPlay()
            }
          }, 500)
          
          // Fallback 2: Force camera ready after 1.5 seconds
          setTimeout(() => {
            if (!cameraReady) {
              console.log('[FaceLiveness] Fallback 2: Forcing camera ready after 1.5s')
              setCameraReady(true)
              setLoading(false)
            }
          }, 1500)
        } else {
          console.error('[FaceLiveness] Video element is null!')
          setError('Video element not found')
          setLoading(false)
        }
      } catch (e: any) {
        console.error('[FaceLiveness] Camera error:', e)
        setError(`Camera access denied: ${e.message}`)
        setLoading(false)
      }
    }
    
    startCamera()
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [modelsLoaded])

  // Start display video when camera becomes ready and UI renders
  useEffect(() => {
    if (!cameraReady || loading) return
    
    // Wait a moment for the display video to render
    const timer = setTimeout(() => {
      const displayVideo = document.getElementById('face-liveness-display') as HTMLVideoElement
      if (displayVideo && streamRef.current) {
        console.log('[FaceLiveness] Starting display video playback...')
        displayVideo.srcObject = streamRef.current
        displayVideo.play()
          .then(() => console.log('[FaceLiveness] ✅ Display video playing'))
          .catch(e => console.error('[FaceLiveness] Display video play error:', e))
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [cameraReady, loading])

  // Face detection and movement tracking
  const detectFaceAndMovement = useCallback(async () => {
    if (!canvasRef.current || !faceapi || !cameraReady || verificationComplete) {
      return
    }

    // Use the DISPLAY video element - it's actually rendering frames
    // Hidden videos don't decode frames even with MediaStream
    const displayVideo = document.getElementById('face-liveness-display') as HTMLVideoElement
    if (!displayVideo) {
      // Continue loop even if video not found yet
      animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
      return
    }
    
    // CRITICAL: Check if video has actual frames (readyState >= 2 means HAVE_CURRENT_DATA)
    if (displayVideo.readyState < 2) {
      // Continue loop and retry when video is ready
      animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
      return
    }
    
    // Check if video has dimensions (confirms frames are available)
    if (displayVideo.videoWidth === 0 || displayVideo.videoHeight === 0) {
      // Continue loop and retry when video has dimensions
      animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
      return
    }
    
    // Verify video is actually playing (not paused or stalled)
    if (displayVideo.paused || displayVideo.ended) {
      animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
      return
    }

    try {
      // First detection attempt - log once
      if (!baselinePositionRef.current && !faceDetected) {
        console.log('[FaceLiveness] ✅ Running face detection via canvas bridge...')
        console.log('[FaceLiveness] Video dimensions:', displayVideo.videoWidth, 'x', displayVideo.videoHeight)
        console.log('[FaceLiveness] Video readyState:', displayVideo.readyState)
        console.log('[FaceLiveness] Video paused:', displayVideo.paused, 'ended:', displayVideo.ended)
        console.log('[FaceLiveness] faceapi loaded:', !!faceapi)
        console.log('[FaceLiveness] TinyFaceDetector available:', !!faceapi?.nets?.tinyFaceDetector)
        console.log('[FaceLiveness] Drawing from DISPLAY video to canvas')
      }
      
      // Use canvas as a bridge - capture video frame to canvas first
      // This ensures TensorFlow.js can access the pixel data
      const canvas = canvasRef.current
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
        return
      }
      
      canvas.width = displayVideo.videoWidth
      canvas.height = displayVideo.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
        return
      }
      
      // Draw current DISPLAY video frame to canvas
      // Display video is visible and has decoded frames
      ctx.drawImage(displayVideo, 0, 0, canvas.width, canvas.height)
      
      // Verify canvas has image data (first time only)
      if (!baselinePositionRef.current && !faceDetected) {
        const imageData = ctx.getImageData(0, 0, 1, 1)
        console.log('[FaceLiveness] Canvas has pixel data:', imageData.data[0] !== undefined)
        
        // Test if TensorFlow.js can read the canvas
        try {
          const tf = await import('@tensorflow/tfjs-core')
          const testTensor = tf.browser.fromPixels(canvas)
          console.log('[FaceLiveness] TensorFlow.js CAN read canvas, tensor shape:', testTensor.shape)
          testTensor.dispose()
        } catch (err) {
          console.error('[FaceLiveness] TensorFlow.js CANNOT read canvas:', err)
        }
      }
      
      // CRITICAL: Ensure TensorFlow.js backend is ready before EVERY detection
      // face-api.js 0.22.2 needs this for TensorFlow.js 4.x compatibility
      const tf = await import('@tensorflow/tfjs-core')
      await tf.ready()
      
      if (!baselinePositionRef.current && !faceDetected) {
        console.log('[FaceLiveness] TF backend ready, attempting detection...')
        console.log('[FaceLiveness] Using display video for detection')
      }
      
      // Improved detection options for better accuracy
      const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416, // Higher resolution for better detection (default: 416)
        scoreThreshold: 0.5 // Lower threshold for easier detection (default: 0.5)
      })
      
      const detections = await faceapi
        .detectSingleFace(displayVideo, detectionOptions)
        .withFaceLandmarks(true)

      if (detections) {
        if (!faceDetected) {
          console.log('[FaceLiveness] ✅ Face detected!')
        }
        setFaceDetected(true)
        
        // Calculate head pose from landmarks
        const landmarks = detections.landmarks
        const positions = landmarks.positions
        
        // Get key facial points for head pose estimation
        const nose = positions[30] // Nose tip
        const leftEye = positions[36] // Left eye outer corner
        const rightEye = positions[45] // Right eye outer corner
        const chin = positions[8] // Chin point
        
        // Calculate head rotation angles
        const eyeCenter = {
          x: (leftEye.x + rightEye.x) / 2,
          y: (leftEye.y + rightEye.y) / 2
        }
        
        // FIXED: Camera is mirrored (scale-x-[-1]), so invert yaw
        // When user turns head right, nose moves left in mirrored view
        const rawYaw = nose.x - eyeCenter.x
        const yaw = -rawYaw // Invert for correct direction
        
        // Vertical rotation (pitch) - up/down
        // Use chin for better up/down detection
        const pitch = nose.y - eyeCenter.y
        
        // Initialize baseline on first detection
        if (!baselinePositionRef.current) {
          baselinePositionRef.current = { x: yaw, y: pitch, z: 0 }
          console.log('[FaceLiveness] ✅ Baseline position set:', {
            yaw: yaw.toFixed(2),
            pitch: pitch.toFixed(2)
          })
          setCurrentInstruction('Great! Now slowly turn your head LEFT')
          return
        }
        
        // Check for movements relative to baseline
        const deltaYaw = yaw - baselinePositionRef.current.x
        const deltaPitch = pitch - baselinePositionRef.current.y
        
        // Debug logging for movement detection (every 30 frames)
        detectionInterval.current++
        if (detectionInterval.current % 30 === 0) {
          console.log('[FaceLiveness] Movement deltas:', {
            yaw: deltaYaw.toFixed(2),
            pitch: deltaPitch.toFixed(2),
            threshold: movementThreshold,
            downThreshold: (movementThreshold * 0.8).toFixed(2)
          })
        }
        
        // Detect movements with corrected directions (using ref to prevent duplicates)
        // After inverting yaw: positive = right, negative = left
        if (!completedMovementsRef.current.has('left') && deltaYaw < -movementThreshold) {
          console.log('[FaceLiveness] ✅ LEFT movement detected (deltaYaw:', deltaYaw.toFixed(2), ')')
          completedMovementsRef.current.add('left')
          setCompletedMovements(prev => [...prev, 'left'])
          setCurrentInstruction('Perfect! Now turn your head RIGHT')
        } else if (!completedMovementsRef.current.has('right') && deltaYaw > movementThreshold) {
          console.log('[FaceLiveness] ✅ RIGHT movement detected (deltaYaw:', deltaYaw.toFixed(2), ')')
          completedMovementsRef.current.add('right')
          setCompletedMovements(prev => [...prev, 'right'])
          setCurrentInstruction('Excellent! Now tilt your head UP')
        } else if (!completedMovementsRef.current.has('up') && deltaPitch < -movementThreshold) {
          console.log('[FaceLiveness] ✅ UP movement detected (deltaPitch:', deltaPitch.toFixed(2), ')')
          completedMovementsRef.current.add('up')
          setCompletedMovements(prev => [...prev, 'up'])
          setCurrentInstruction('Almost done! Now tilt your head DOWN')
        } else if (!completedMovementsRef.current.has('down') && deltaPitch > (movementThreshold * 0.8)) {
          console.log('[FaceLiveness] ✅ DOWN movement detected (deltaPitch:', deltaPitch.toFixed(2), ')')
          completedMovementsRef.current.add('down')
          setCompletedMovements(prev => [...prev, 'down'])
          setCurrentInstruction('Verification complete! ✓')
        }
      } else {
        if (faceDetected) {
          console.log('[FaceLiveness] Face lost - position in frame')
        }
        setFaceDetected(false)
        if (baselinePositionRef.current) {
          setCurrentInstruction('Please keep your face in the frame')
        }
      }
    } catch (e) {
      console.error('[FaceLiveness] ❌ Detection error:', e)
      console.error('[FaceLiveness] Error details:', {
        message: (e as Error).message,
        stack: (e as Error).stack
      })
    }
    
    // Continue detection loop
    animationFrameRef.current = requestAnimationFrame(detectFaceAndMovement)
  }, [cameraReady, completedMovements, verificationComplete, faceDetected])

  // Start detection loop when camera is ready
  useEffect(() => {
    if (cameraReady && !verificationComplete) {
      console.log('[FaceLiveness] Starting face detection loop...')
      detectFaceAndMovement()
    }
    
    return () => {
      if (animationFrameRef.current) {
        console.log('[FaceLiveness] Stopping detection loop')
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [cameraReady, detectFaceAndMovement, verificationComplete])

  // Check if verification is complete
  useEffect(() => {
    if (requiredMovements.every(m => completedMovements.includes(m))) {
      console.log('[FaceLiveness] All movements completed!')
      setVerificationComplete(true)
      
      // Auto-proceed after 1 second
      setTimeout(() => {
        onVerified()
      }, 1000)
    }
  }, [completedMovements, requiredMovements, onVerified])

  // Calculate progress
  const progress = (completedMovements.length / requiredMovements.length) * 100
  const circumference = 2 * Math.PI * 140

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-muted/40 p-6">
      <Card className="max-w-2xl w-full border-2 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10 border-2 border-primary/20"
          >
            <Camera className="h-8 w-8 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl font-bold">Face Verification</CardTitle>
          <p className="text-muted-foreground">
            Complete the verification to ensure your camera is working properly
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Hidden video element - must exist from start for camera access */}
          <video
            ref={videoRef}
            className="hidden"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">{error}</p>
                {onSkip && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSkip}
                    className="mt-2"
                  >
                    Skip Verification
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {!modelsLoaded ? 'Loading face detection...' : 'Starting camera...'}
              </p>
            </div>
          )}

          {/* Camera Preview with Circular Frame */}
          {!loading && !error && (
            <div className="relative">
              {/* Instruction Text */}
              <motion.div
                key={currentInstruction}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <p className="text-lg font-semibold text-foreground">{currentInstruction}</p>
              </motion.div>

              {/* Circular Camera Preview Container */}
              <div className="relative flex items-center justify-center py-8">
                {/* Circular Video Display */}
                <div className="relative w-80 h-80">
                  {/* Progress Ring SVG */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg">
                    {/* Background Circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r="140"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                      strokeDasharray="20 10"
                    />
                    
                    {/* Progress Circle */}
                    <motion.circle
                      cx="160"
                      cy="160"
                      r="140"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className={verificationComplete ? "text-green-500" : "text-primary"}
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (progress / 100) * circumference}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </svg>
                  
                  {/* Video Display in Circle - Create duplicate element for display */}
                  <div className="absolute inset-4 rounded-full overflow-hidden bg-black border-4 border-card shadow-2xl">
                    <video
                      id="face-liveness-display"
                      className="w-full h-full object-cover"
                      style={{ 
                        objectPosition: '100% 55%',  // 62% from left (shifted right), 55% from top
                        transform: 'scale(-1.5, 1.5)'   // Flip + zoom to 150% for closer view
                      }}
                      autoPlay
                      muted
                      playsInline
                    />
                    
                    {/* Face Detection Indicator */}
                    <AnimatePresence>
                      {!faceDetected && cameraReady && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        >
                          <div className="text-center space-y-2">
                            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                            <p className="text-white font-medium">Position your face in the frame</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Success Overlay */}
                    <AnimatePresence>
                      {verificationComplete && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                          >
                            <CheckCircle2 className="h-24 w-24 text-green-500 drop-shadow-lg" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Movement Progress Indicators */}
              <div className="flex items-center justify-center gap-3 mt-6">
                {requiredMovements.map((movement) => (
                  <motion.div
                    key={movement}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Badge
                      variant={completedMovements.includes(movement) ? "default" : "outline"}
                      className={`px-3 py-1 ${
                        completedMovements.includes(movement)
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-muted"
                      }`}
                    >
                      {completedMovements.includes(movement) && (
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                      )}
                      {movement.charAt(0).toUpperCase() + movement.slice(1)}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              {/* Progress Text */}
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {completedMovements.length} of {requiredMovements.length} movements completed
                </p>
              </div>
            </div>
          )}

          {/* Skip Button (Optional) */}
          {onSkip && !verificationComplete && !loading && (
            <div className="text-center pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Verification (Not Recommended)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
