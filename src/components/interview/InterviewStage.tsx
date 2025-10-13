"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBodyLanguageTracker } from '@/hooks/use-body-language-tracker'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { Play, Pause, ChevronRight, Maximize2, Minimize2, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface InterviewStageProps {
  running: boolean
  /** When true, show camera preview without running analysis */
  preview?: boolean
  questionCategory: string
  questionText: string
  currentTranscript?: string
  width?: number
  height?: number
  onScore?: (score: BodyLanguageScore) => void
  onTogglePause?: () => void
  onNext?: () => void
  onStartAnswer?: () => void
  onStopAndNext?: () => void
  statusBadge?: string
  startedAt?: Date
  candidateName?: string
  questionIndex?: number
  questionTotal?: number
  phase?: 'prep' | 'answer'
  secondsRemaining?: number
  /** Hide the live captions overlay during the interview */
  showCaptions?: boolean
  /** Hide the inline question overlay (useful when rendering question in a side panel) */
  showQuestionOverlay?: boolean
  /** Hide the live body language score badge */
  showBodyBadge?: boolean
  captureScoreRef?: React.MutableRefObject<(() => BodyLanguageScore | null) | null>
}

// PERFORMANCE FIX: Memoized component to prevent unnecessary re-renders
const InterviewStageComponent: React.FC<InterviewStageProps> = ({
  running,
  preview = false,
  questionCategory,
  questionText,
  currentTranscript,
  width = 640,
  height = 360,
  onScore,
  onTogglePause,
  onNext,
  onStartAnswer,
  onStopAndNext,
  statusBadge = 'Live',
  startedAt,
  candidateName,
  questionIndex,
  questionTotal,
  phase,
  secondsRemaining,
  showCaptions = true,
  showQuestionOverlay = true,
  showBodyBadge = true,
  captureScoreRef
}) => {
  // PERFORMANCE FIX: Reduce body language tracking FPS to 6 to minimize lag (staggered execution means effective rate is lower)
  const { state, start, stop, startPreview, stopPreview, captureScore, videoRef, canvasRef } = useBodyLanguageTracker({
    width,
    height,
    enableFace: false, // posture-only
    enableHands: false, // posture-only
    enablePose: true,
    maxFPS: 6, // Reduced from 12 to 6 FPS for main loop (actual detection rates are lower due to staggering)
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  useEffect(() => {
    if (captureScoreRef) {
      captureScoreRef.current = captureScore
    }
  }, [captureScore, captureScoreRef])

  // Parent-driven start/stop
  useEffect(() => {
    const control = async () => {
      try {
        console.log('📹 [InterviewStage] Camera control check:', { 
          running, 
          preview, 
          stateRunning: state.running, 
          statePreviewing: state.previewing,
          hasVideoStream: !!videoRef.current?.srcObject,
          hasScore: !!state.score,
          errors: state.errors.length
        })
        
        if (running && !state.running) {
          console.log('🎥 [InterviewStage] Starting interview recording...')
          await start()
          console.log('✅ [InterviewStage] Camera start completed. State:', { 
            running: state.running, 
            backend: state.backend, 
            errors: state.errors 
          })
        } else if (running && state.running) {
          console.log('✅ [InterviewStage] Already running, skipping start')
        } else if (!running && preview && !state.previewing && !state.running) {
          // Preview only - only start if not already in any active state
          console.log('👁️ [InterviewStage] Starting camera preview')
          await startPreview()
        } else if (!running && !preview) {
          // Neither running nor previewing - cleanup
          if (state.running) {
            console.log('🛑 [InterviewStage] Stopping interview recording')
            await stop()
          } else if (state.previewing) {
            console.log('🛑 [InterviewStage] Stopping camera preview')
            await stopPreview()
          }
        }
      } catch (err) {
        console.error('❌ [InterviewStage] Camera control error:', err)
      }
    }
    control()
    // Only depend on parent props (running, preview), not internal state to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, preview])

  // Continuously update parent with latest score for live display (throttled)
  const lastScoreSentRef = useRef<number>(0)
  useEffect(() => {
    if (!state.score || !onScore) return
    const now = performance.now()
    // Throttle to ~4 FPS (every 250ms)
    if (now - lastScoreSentRef.current < 250) return
    lastScoreSentRef.current = now
    onScore(state.score)
  }, [state.score, onScore])

  // Log model loading status for debugging
  useEffect(() => {
    if (state.running && state.backend) {
      console.log('✅ TensorFlow backend active:', state.backend)
    }
    if (state.errors.length > 0) {
      console.error('❌ Body language tracker errors:', state.errors)
    }
  }, [state.running, state.backend, state.errors])

  // Debug: Log video stream status
  useEffect(() => {
    if (videoRef.current?.srcObject) {
      console.log('✅ Video stream attached', { previewing: state.previewing, running: state.running })
    }
  }, [state.previewing, state.running, videoRef])

  const elapsed = useMemo(() => {
    if (!startedAt) return '0m'
    const ms = Date.now() - startedAt.getTime()
    const m = Math.max(0, Math.floor(ms / 60000))
    return `${m}m`
  }, [startedAt])

  const body = state.score?.overallScore ?? 0

  const progressPct = useMemo(() => {
    // BUGFIX: handle questionIndex === 0 correctly; treat only null/undefined as missing
    if (questionIndex == null || !questionTotal) return 0
    return Math.round(((questionIndex + 1) / questionTotal) * 100)
  }, [questionIndex, questionTotal])

  // Fullscreen helpers
  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    const d = document as any
    const inFs = !!(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement)
    if (!inFs) {
      const req = (el as any).requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen
      req && req.call(el)
    } else {
      const exit = (document as any).exitFullscreen || (d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen)
      exit && exit.call(document)
    }
  }

  useEffect(() => {
    const handler = () => {
      const d = document as any
      const fs = !!(document.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement)
      setIsFullscreen(fs)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler as any)
    document.addEventListener('mozfullscreenchange', handler as any)
    document.addEventListener('MSFullscreenChange', handler as any)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler as any)
      document.removeEventListener('mozfullscreenchange', handler as any)
      document.removeEventListener('MSFullscreenChange', handler as any)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video layer */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        muted
        autoPlay
      />
      {/* Canvas overlay - Hidden but still used for body language analysis */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Subtle gradient vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none z-20" />

      {/* Top bar - Minimal status badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 flex-wrap">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-red-500 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium text-white">{statusBadge}</span>
          </motion.div>
          {state.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full shadow-lg"
              title={state.errors[state.errors.length - 1]}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-medium">Camera error ({state.errors.length})</span>
            </motion.div>
          )}
          {phase && typeof secondsRemaining === 'number' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Badge 
                variant={
                  secondsRemaining <= 10 ? 'destructive' : 
                  phase === 'prep' ? 'secondary' : 'default'
                }
                className="px-3 py-1.5 text-sm font-semibold backdrop-blur-md bg-opacity-90"
              >
                {phase === 'prep' ? '🎯 Prep' : '🎤 Answer'}: {Math.max(0, secondsRemaining)}s
              </Badge>
            </motion.div>
          )}
          {!phase && typeof secondsRemaining === 'number' && secondsRemaining <= 40 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={secondsRemaining <= 30 ? 'animate-pulse' : ''}
            >
              <Badge 
                variant={
                  secondsRemaining <= 10 ? 'destructive' : 
                  secondsRemaining <= 30 ? 'default' : 'outline'
                }
                className="px-3 py-1.5 text-sm font-semibold backdrop-blur-md"
              >
                ⏱️ {Math.max(0, secondsRemaining)}s
              </Badge>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {candidateName && (
            <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-lg text-sm font-medium">
              {candidateName}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar removed - shown in floating button instead */}

      {/* Question text */}
      {showQuestionOverlay && questionText && (
        <div className="absolute top-16 left-6 right-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={questionText}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-block rounded-lg bg-background/60 text-foreground px-4 py-2 backdrop-blur-sm"
            >
              <div className="text-sm opacity-80">Current Question</div>
              <div className="text-base md:text-lg font-medium leading-snug">{questionText}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Real-time Performance Feedback Panel (hidden when showBodyBadge=false) */}
      {showBodyBadge && (running || preview) && state.score && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 z-30 space-y-2"
        >
          <div className="bg-background/90 backdrop-blur-xl rounded-xl shadow-2xl border border-border/50 p-3 space-y-2 min-w-[200px]">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Live Feedback</div>
            
            {/* Eye Contact and Expression removed - posture only */}

            {/* Posture - Show numeric score */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🪑</span>
                <span className="text-xs font-medium">Posture</span>
              </div>
              <Badge 
                variant={
                  state.score.posture.score >= 70 ? 'default' : 
                  state.score.posture.score >= 50 ? 'secondary' : 
                  'destructive'
                }
                className="text-xs px-2 py-0 font-semibold"
              >
                {state.score.posture.score}/100
              </Badge>
            </div>

            {/* Overall Body Language Score */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold">Overall</span>
                <Badge 
                  variant={
                    state.score.overallScore >= 70 ? 'default' : 
                    state.score.overallScore >= 50 ? 'secondary' : 
                    'destructive'
                  }
                  className="text-xs px-2 py-0 font-bold"
                >
                  {Math.round(state.score.overallScore)}/100
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Live captions - Enhanced glassmorphism */}
      {showCaptions && (
        <div className="absolute bottom-20 left-6 right-6 flex justify-center z-30">
          <AnimatePresence mode="wait">
            {currentTranscript ? (
              <motion.div
                key={currentTranscript}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl w-full text-center text-foreground text-base md:text-lg bg-background/90 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border border-border/50"
              >
                {currentTranscript}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* Camera not started - show placeholder (only when camera/preview hasn't been initialized) */}
      {!running && !preview && !state.previewing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-sm z-40"
        >
          <div className="text-center text-foreground bg-background/90 backdrop-blur-xl px-8 py-6 rounded-2xl border border-border/50 shadow-2xl max-w-md">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">🎥</span>
            </div>
            <div className="text-base font-medium mb-2">Camera Ready</div>
            <div className="text-sm text-muted-foreground">Grant camera permissions to see preview.</div>
          </div>
        </motion.div>
      )}

      {/* Bottom controls - Only fullscreen button */}
      <div className="absolute bottom-4 right-4 z-30">
        <Button 
          size="icon" 
          variant="secondary"
          onClick={toggleFullscreen} 
          className="rounded-full h-10 w-10 bg-white/90 hover:bg-white shadow-lg"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

    </div>
  )
}

// PERFORMANCE FIX: Memoize with custom comparison function
export const InterviewStage = React.memo(InterviewStageComponent, (prevProps, nextProps) => {
  // Only re-render if these critical props change
  return (
    prevProps.running === nextProps.running &&
    prevProps.preview === nextProps.preview &&
    prevProps.phase === nextProps.phase &&
    prevProps.secondsRemaining === nextProps.secondsRemaining &&
    prevProps.questionIndex === nextProps.questionIndex &&
    prevProps.currentTranscript === nextProps.currentTranscript
  )
})

export default InterviewStage
