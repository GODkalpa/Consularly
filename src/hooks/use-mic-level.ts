"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

export interface MicLevelState {
  running: boolean
  level: number // 0..1
  error?: string
}

export function useMicLevel() {
  const [state, setState] = useState<MicLevelState>({ running: false, level: 0 })
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    try { sourceRef.current?.disconnect() } catch {}
    try { analyserRef.current?.disconnect() } catch {}
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    analyserRef.current = null
    sourceRef.current = null
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach(t => t.stop()) } catch {}
    }
    streamRef.current = null
    setState((s) => ({ ...s, running: false, level: 0 }))
  }, [])

  const tick = useCallback(() => {
    if (!analyserRef.current) return
    const analyser = analyserRef.current
    const data = dataArrayRef.current!
    analyser.getByteTimeDomainData(data)
    // Compute RMS on time domain data
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128 // -1..1
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length) // 0..~1
    const level = Math.min(1, rms * 1.5)
    setState((s) => ({ ...s, level }))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async () => {
    if (state.running) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyserRef.current = analyser
      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source
      source.connect(analyser)
      // Use an explicit ArrayBuffer to satisfy TS signature expecting Uint8Array<ArrayBuffer>
      // For time-domain data, the array length should be analyser.fftSize
      const buf = new ArrayBuffer(analyser.fftSize)
      dataArrayRef.current = new Uint8Array(buf)
      setState((s) => ({ ...s, running: true, error: undefined }))
      rafRef.current = requestAnimationFrame(tick)
    } catch (e: any) {
      setState((s) => ({ ...s, error: e?.message || String(e), running: false }))
    }
  }, [state.running, tick])

  useEffect(() => {
    return () => { stop() }
  }, [stop])

  return { ...state, start, stop }
}
