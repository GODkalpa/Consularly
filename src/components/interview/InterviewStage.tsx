"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBodyLanguageTracker } from '@/hooks/use-body-language-tracker'
import type { BodyLanguageScore } from '@/lib/body-language-scoring'
import { Play, Pause, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'

export interface InterviewStageProps {
  running: boolean
  questionCategory: string
  questionText: string
  currentTranscript?: string
  width?: number
  height?: number
  onScore?: (score: BodyLanguageScore) => void
  onTogglePause?: () => void
  onNext?: () => void
  statusBadge?: string
  startedAt?: Date
  candidateName?: string
  questionIndex?: number
  questionTotal?: number
}

export const InterviewStage: React.FC<InterviewStageProps> = ({
  running,
  questionCategory,
  questionText,
  currentTranscript,
  width = 1280,
  height = 720,
  onScore,
  onTogglePause,
  onNext,
  statusBadge = 'Live',
  startedAt,
  candidateName,
  questionIndex,
  questionTotal
}) => {
  const { state, start, stop, videoRef, canvasRef } = useBodyLanguageTracker({
    width,
    height,
    enableFace: true,
    enableHands: true,
    enablePose: true,
    maxFPS: 30,
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Parent-driven start/stop
  useEffect(() => {
    const control = async () => {
      try {
        if (running && !state.running) await start()
        if (!running && state.running) await stop()
      } catch {}
    }
    control()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, state.running])

  useEffect(() => {
    if (state.score && onScore) onScore(state.score)
  }, [state.score, onScore])

  const elapsed = useMemo(() => {
    if (!startedAt) return '0m'
    const ms = Date.now() - startedAt.getTime()
    const m = Math.max(0, Math.floor(ms / 60000))
    return `${m}m`
  }, [startedAt])

  const body = state.score?.overallScore ?? 0

  const progressPct = useMemo(() => {
    if (!questionIndex || !questionTotal) return 0
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
    <div ref={containerRef} className="relative w-full bg-background rounded-xl overflow-hidden shadow-lg aspect-video">
      {/* Video layer */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
      {/* Canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background)/0.3)] via-transparent to-[hsl(var(--background)/0.6)]" />

      {/* Top bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{questionCategory}</Badge>
          <Badge variant={running ? 'default' : 'secondary'} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--destructive))] animate-pulse" />
            {statusBadge}
          </Badge>
          <Badge variant="outline">Body {Math.round(body)}/100</Badge>
        </div>
        <div className="flex items-center gap-2">
          {candidateName && (
            <Badge variant="outline">{candidateName}</Badge>
          )}
          {startedAt && (
            <Badge variant="outline">{elapsed}</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {questionTotal && (
        <div className="absolute top-12 left-0 right-0">
          <div className="h-1 w-full bg-foreground/20">
            <div className="h-1 bg-primary" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Question text */}
      <div className="absolute top-16 left-6 right-6">
        <div className="inline-block rounded-lg bg-background/60 text-foreground px-4 py-2 backdrop-blur-sm">
          <div className="text-sm opacity-80">Current Question</div>
          <div className="text-base md:text-lg font-medium leading-snug">{questionText}</div>
        </div>
      </div>

      {/* Live captions */}
      <div className="absolute bottom-16 left-6 right-6 flex justify-center">
        {currentTranscript ? (
          <div className="max-w-3xl w-full text-center text-foreground text-base md:text-lg bg-background/60 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
            {currentTranscript}
          </div>
        ) : null}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-2 rounded-full shadow-lg">
          {onTogglePause && (
            <Button size="sm" variant={running ? 'secondary' : 'default'} onClick={onTogglePause} className="rounded-full px-3">
              {running ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Resume</>}
            </Button>
          )}
          {onNext && (
            <Button size="sm" onClick={onNext} className="rounded-full px-3">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={toggleFullscreen} className="text-foreground hover:bg-foreground/10 rounded-full">
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InterviewStage
