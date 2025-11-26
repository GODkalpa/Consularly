/**
 * AssemblyAI Speech Transcription Component
 * Real-time speech-to-text UI for mock interviews
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Mic,
  Square,
  Trash2,
  Download,
  Wifi,
  WifiOff,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { useAssemblyAITranscription } from '@/hooks/use-assemblyai-transcription';
import { TranscriptionResult } from '@/lib/assemblyai-service';

interface AssemblyAITranscriptionProps {
  onTranscriptComplete?: (transcript: TranscriptionResult) => void;
  onTranscriptUpdate?: (currentText: string) => void;
  className?: string;
  showControls?: boolean;
  showTranscripts?: boolean;
  autoStart?: boolean;
  // CRITICAL FIX: Separate connection from recording for UK/France prep phase
  // connected: establish WebSocket connection (prep phase for UK/France)
  // running: start audio capture and streaming (answer phase for UK/France, active for USA)
  connected?: boolean;
  running?: boolean;
  // Increment this key to clear transcripts (useful when moving to next question)
  resetKey?: number;
}

// PERFORMANCE FIX: Memoize component to prevent unnecessary re-renders
const AssemblyAITranscriptionComponent = ({
  onTranscriptComplete,
  onTranscriptUpdate,
  className = '',
  showControls = true,
  showTranscripts = true,
  autoStart = false,
  connected,
  running,
  resetKey
}: AssemblyAITranscriptionProps) => {
  const [recordingDuration, setRecordingDuration] = useState(0);

  const transcription = useAssemblyAITranscription({
    autoStart,
    onTranscriptComplete
  });

  // Update parent component with current transcript
  useEffect(() => {
    onTranscriptUpdate?.(transcription.currentTranscript);
  }, [transcription.currentTranscript, onTranscriptUpdate]);

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transcription.isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [transcription.isRecording]);

  // CRITICAL FIX: Separate connection control from recording control
  // Step 1: Establish connection when connected flag is true (prep phase for UK/France)
  useEffect(() => {
    if (connected === undefined) return;
    const control = async () => {
      try {
        if (connected && !transcription.isConnected && !transcription.isConnecting) {
          console.log('[STT Component] Establishing connection (prep phase)...');
          await transcription.connectService();
        } else if (!connected && transcription.isConnected) {
          console.log('[STT Component] Disconnecting...');
          await transcription.stopTranscription();
        }
      } catch (e) {
        console.error('[STT Component] Connection control error:', e);
      }
    };
    control();
    // We intentionally depend only on key flags to avoid re-creating functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, transcription.isConnected, transcription.isConnecting]);

  // Step 2: Start/stop recording when running flag changes (answer phase for UK/France)
  useEffect(() => {
    if (running === undefined) return;
    const control = async () => {
      try {
        if (running) {
          console.log('[STT Component] Starting recording (answer phase)...');
          await transcription.startTranscription();
        } else {
          console.log('[STT Component] Stopping recording...');
          // Pass false to keep connection alive (hot mic) but stop streaming
          // @ts-ignore - stopTranscription accepts an argument in our updated hook
          await transcription.stopTranscription(false);
        }
      } catch (e) {
        console.error('[STT Component] Recording control error:', e);
      }
    };
    control();
    // We intentionally depend only on 'running' to avoid re-creating functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Clear transcripts when resetKey changes
  useEffect(() => {
    if (resetKey === undefined) return;
    transcription.clearTranscripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start/stop recording
  const handleToggleRecording = async () => {
    if (transcription.isRecording) {
      await transcription.stopTranscription();
    } else {
      await transcription.startTranscription();
    }
  };

  // Clear transcripts
  const handleClear = () => {
    transcription.clearTranscripts();
  };

  // Export transcripts
  const handleExport = () => {
    const text = transcription.finalTranscripts.map((t: TranscriptionResult, index: number) =>
      `[${index + 1}] ${t.text} (Confidence: ${(t.confidence * 100).toFixed(1)}%)`
    ).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status and Controls */}
      {showControls && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Speech Transcription
              </span>
              <div className="flex items-center gap-2">
                {transcription.isConnected ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Disconnected
                  </Badge>
                )}
                {transcription.isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    Recording {formatDuration(recordingDuration)}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {transcription.error && (
              <div className="flex items-center gap-2 p-3 bg-[hsla(var(--destructive),0.1)] border border-[hsla(var(--destructive),0.3)] rounded-md">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                <p className="text-sm text-[hsl(var(--destructive))]">{transcription.error}</p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleToggleRecording}
                variant={transcription.isRecording ? "destructive" : "default"}
                size="lg"
                disabled={!!transcription.error}
                className="flex items-center gap-2"
              >
                {transcription.isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>

              <Button
                onClick={handleClear}
                variant="outline"
                size="lg"
                disabled={transcription.finalTranscripts.length === 0 && !transcription.currentTranscript}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>

              <Button
                onClick={handleExport}
                variant="outline"
                size="lg"
                disabled={transcription.finalTranscripts.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Confidence Indicator */}
            {transcription.confidence > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{(transcription.confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={transcription.confidence * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Transcript Display */}
      {showTranscripts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Transcript</span>
              <Badge variant="outline">
                {transcription.finalTranscripts.length} completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full rounded border p-4 overflow-y-auto">
              <div className="space-y-3">
                {/* Final Transcripts */}
                {transcription.finalTranscripts.map((transcript: TranscriptionResult, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Segment {index + 1}</span>
                      <span>Confidence: {(transcript.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-sm leading-relaxed">{transcript.text}</p>
                    {index < transcription.finalTranscripts.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}

                {/* Current Live Transcript */}
                {transcription.currentTranscript && (
                  <div className="space-y-1">
                    {transcription.finalTranscripts.length > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-[hsl(var(--destructive))] rounded-full animate-pulse" />
                        Live
                      </span>
                      {transcription.confidence > 0 && (
                        <span>Confidence: {(transcription.confidence * 100).toFixed(1)}%</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                      {transcription.currentTranscript}
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {transcription.finalTranscripts.length === 0 && !transcription.currentTranscript && (
                  <div className="text-center text-muted-foreground py-8">
                    <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start recording to see transcription here</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {transcription.finalTranscripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{transcription.finalTranscripts.length}</div>
                <div className="text-xs text-muted-foreground">Segments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {transcription.finalTranscripts.reduce((acc: number, t: TranscriptionResult) =>
                    acc + t.text.split(' ').length, 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {transcription.finalTranscripts.length > 0
                    ? ((transcription.finalTranscripts.reduce((acc: number, t: TranscriptionResult) =>
                      acc + t.confidence, 0) / transcription.finalTranscripts.length) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(transcription.finalTranscripts.reduce((acc: number, t: TranscriptionResult) =>
                    acc + (t.audio_end - t.audio_start), 0) / 1000)}s
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// PERFORMANCE FIX: Memoize with custom comparison to prevent re-renders when props haven't changed
export const AssemblyAITranscription = React.memo(AssemblyAITranscriptionComponent, (prevProps, nextProps) => {
  // Only re-render if these key props change
  return (
    prevProps.connected === nextProps.connected &&
    prevProps.running === nextProps.running &&
    prevProps.resetKey === nextProps.resetKey &&
    prevProps.showControls === nextProps.showControls &&
    prevProps.showTranscripts === nextProps.showTranscripts
  )
})

export default AssemblyAITranscription;
