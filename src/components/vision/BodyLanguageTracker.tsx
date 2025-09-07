"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { NoSSR } from '@/components/NoSSR'
import { useBodyLanguageTracker } from '@/hooks/use-body-language-tracker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface BodyLanguageTrackerProps {
  width?: number
  height?: number
}

export const BodyLanguageTracker: React.FC<BodyLanguageTrackerProps> = ({ width = 640, height = 480 }) => {
  const { state, start, stop, videoRef, canvasRef, cameras, switchCamera, refreshCameras } = useBodyLanguageTracker({
    width,
    height,
    enablePose: true,
    enableHands: true,
    enableFace: true,
    maxFPS: 30,
  })

  const statusColor = useMemo(() => (state.running ? 'default' : 'secondary'), [state.running])

  const overall = state.score?.overallScore ?? 0

  return (
    <NoSSR>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Body Language Monitor
              <Badge variant={statusColor}>{state.running ? 'Live' : 'Idle'}</Badge>
              {state.backend && (
                <Badge variant="outline">{state.backend}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {!state.running ? (
                <>
                  <Button onClick={start}>Start</Button>
                  <Button variant="outline" onClick={refreshCameras}>Refresh Cameras</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={stop}>Stop</Button>
                  <Button variant="outline" onClick={start}>Retry</Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* Camera Selector */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Camera</div>
                <Select onValueChange={(v) => switchCamera(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={cameras.length ? 'Select camera' : 'No cameras found'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((c, idx) => (
                      <SelectItem key={c.deviceId || idx} value={c.deviceId}>
                        {c.label || `Camera ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video + Overlay */}
            <div className="relative w-full" style={{ maxWidth: width }}>
              <video ref={videoRef} className="rounded-md w-full" playsInline muted autoPlay />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            </div>

            {/* Scores */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Overall Confidence</span>
                  <span className="text-sm font-semibold">{overall}/100</span>
                </div>
                <Progress value={overall} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ScoreBadge title="Posture" value={state.score?.posture.score ?? 0} subtitle={state.score?.posture.slouchDetected ? 'Slouch detected' : 'Upright'} />
                <ScoreBadge title="Eye Contact" value={state.score?.expressions.eyeContactScore ?? 0} />
                <ScoreBadge title="Smile" value={state.score?.expressions.smileScore ?? 0} />
                <ScoreBadge title="Gestures" value={state.score?.gestures.score ?? 0} subtitle={`${state.score?.gestures.left ?? '—'} / ${state.score?.gestures.right ?? '—'}`} />
              </div>
            </div>

            {/* Feedback */}
            {state.score?.feedback?.length ? (
              <div className="rounded-md border p-3 bg-muted/30">
                <div className="text-sm font-medium mb-2">Suggestions</div>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {state.score.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Errors */}
            {state.errors.length > 0 && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 space-y-1">
                {state.errors.map((e, i) => (
                  <div key={i}>Error: {e}</div>
                ))}
                <div className="text-xs text-red-700 mt-2">
                  Tips: Ensure no other app is using the camera (Zoom/Teams/OBS), allow camera access in browser site settings, and check Windows Privacy settings for Camera.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </NoSSR>
  )
}

function ScoreBadge({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  const variant = value >= 70 ? 'default' : value >= 40 ? 'secondary' : 'outline'
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        {subtitle ? <div className="text-xs">{subtitle}</div> : null}
      </div>
      <Badge variant={variant as any}>{Math.round(value)}</Badge>
    </div>
  )
}

export default BodyLanguageTracker
