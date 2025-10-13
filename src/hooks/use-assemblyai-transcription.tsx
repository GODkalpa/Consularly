/**
 * React hooks for AssemblyAI speech transcription
 * Provides easy-to-use hooks for real-time speech-to-text functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AssemblyAIService, TranscriptionResult, TranscriptionError } from '@/lib/assemblyai-service';
import { AudioRecorder, AudioChunk } from '@/lib/audio-recorder';

export interface TranscriptionState {
  isRecording: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  currentTranscript: string;
  finalTranscripts: TranscriptionResult[];
  error: string | null;
  confidence: number;
}

export interface UseAssemblyAITranscriptionOptions {
  apiKey?: string;
  sampleRate?: number;
  autoStart?: boolean;
  onTranscriptComplete?: (transcript: TranscriptionResult) => void;
  onError?: (error: TranscriptionError) => void;
}

/**
 * Main hook for AssemblyAI real-time transcription
 */
export function useAssemblyAITranscription(options: UseAssemblyAITranscriptionOptions = {}) {
  const [state, setState] = useState<TranscriptionState>({
    isRecording: false,
    isConnected: false,
    isConnecting: false,
    currentTranscript: '',
    finalTranscripts: [],
    error: null,
    confidence: 0
  });

  const assemblyAIRef = useRef<AssemblyAIService | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize services (audio recorder + AssemblyAI service setup)
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      // 1) Initialize audio recorder FIRST to detect the true device sample rate
      audioRecorderRef.current = new AudioRecorder({
        sampleRate: options.sampleRate || 16000,
        channels: 1
      });

      // Set up audio recorder event handlers early; the callbacks will run only when recording
      audioRecorderRef.current.onAudioChunk((chunk: AudioChunk) => {
        if (assemblyAIRef.current?.isActive()) {
          assemblyAIRef.current.sendAudioData(chunk.data);
        }
      });

      audioRecorderRef.current.onStart(() => {
        setState(prev => ({ ...prev, isRecording: true, error: null }));
      });

      audioRecorderRef.current.onStop(() => {
        setState(prev => ({ ...prev, isRecording: false }));
      });

      audioRecorderRef.current.onError((error: string) => {
        setState(prev => ({ ...prev, error, isRecording: false }));
      });

      // Initialize microphone and AudioContext
      await audioRecorderRef.current.initialize();

      // 2) Discover the actual AudioContext sample rate and align the STT socket to it
      const actualSampleRate = audioRecorderRef.current.getActualSampleRate();

      // Initialize AssemblyAI service (token is obtained server-side; no API key needed in browser)
      assemblyAIRef.current = new AssemblyAIService({
        sampleRate: actualSampleRate
      });

      // Set up AssemblyAI event handlers
      assemblyAIRef.current.onConnected(() => {
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
      });

      assemblyAIRef.current.onDisconnected(() => {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false, isRecording: false }));
      });

      // Throttle interim transcript updates to reduce UI work
      const lastInterimRef = { ts: 0, text: '' }
      assemblyAIRef.current.onTranscript((result: TranscriptionResult) => {
        if (result.is_final) {
          // CRITICAL: This is a FINAL transcript segment - must be captured!
          console.log(`✅ [STT Hook] FINAL transcript segment: "${result.text}" (confidence: ${Math.round(result.confidence * 100)}%)`)
          setState(prev => ({
            ...prev,
            finalTranscripts: [...prev.finalTranscripts, result],
            currentTranscript: '',
            confidence: result.confidence
          }));
          options.onTranscriptComplete?.(result);
        } else {
          // Interim (partial) transcript - throttle to reduce UI work
          const now = performance.now()
          const tooSoon = now - lastInterimRef.ts < 120
          const sameText = result.text === lastInterimRef.text
          if (tooSoon && sameText) return
          lastInterimRef.ts = now
          lastInterimRef.text = result.text
          setState(prev => ({
            ...prev,
            currentTranscript: result.text,
            confidence: result.confidence
          }));
        }
      });

      assemblyAIRef.current.onError((error: TranscriptionError) => {
        setState(prev => ({ ...prev, error: error.error, isRecording: false, isConnecting: false }));
        options.onError?.(error);
      });

      isInitializedRef.current = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }));
      console.error('Failed to initialize transcription:', error);
    }
  }, [options]);

  // Connect to AssemblyAI service without starting recording (for pre-connection during prep phase)
  const connectService = useCallback(async () => {
    if (!isInitializedRef.current) {
      await initialize();
    }

    try {
      if (!assemblyAIRef.current) {
        throw new Error('AssemblyAI service not initialized');
      }

      // Already connected, skip
      if (assemblyAIRef.current.isActive()) {
        console.log('[STT] Already connected, skipping connection');
        return;
      }

      setState(prev => ({ ...prev, isConnecting: true }));
      console.log('[STT] Establishing connection (no recording yet)...');
      
      // Start AssemblyAI connection only (no audio recording)
      await assemblyAIRef.current.startTranscription();
      console.log('[STT] Connection established, ready for recording');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect service';
      setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }));
      console.error('Failed to connect AssemblyAI service:', error);
    }
  }, [initialize]);

  // Start recording (assumes connection already established or will establish it)
  const startTranscription = useCallback(async () => {
    if (!isInitializedRef.current) {
      await initialize();
    }

    try {
      if (!assemblyAIRef.current || !audioRecorderRef.current) {
        throw new Error('Services not initialized');
      }

      // If not connected yet, connect first
      if (!assemblyAIRef.current.isActive()) {
        setState(prev => ({ ...prev, isConnecting: true }));
        await assemblyAIRef.current.startTranscription();
      }
      
      // Start audio recording (connection is now ready)
      if (!audioRecorderRef.current.isActive()) {
        console.log('[STT] Starting audio recording...');
        await audioRecorderRef.current.startRecording();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription';
      setState(prev => ({ ...prev, error: errorMessage, isConnecting: false }));
      console.error('Failed to start transcription:', error);
    }
  }, [initialize]);

  // Handle auto-start outside of initialize to satisfy hooks deps
  useEffect(() => {
    if (options.autoStart) {
      startTranscription();
    }
    // It's intentional to depend only on the flag and the stable callback
  }, [options.autoStart, startTranscription]);

  // Stop transcription
  const stopTranscription = useCallback(async () => {
    try {
      if (audioRecorderRef.current?.isActive()) {
        audioRecorderRef.current.stopRecording();
      }

      if (assemblyAIRef.current?.isActive()) {
        await assemblyAIRef.current.stopTranscription();
      }

    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }, []);

  // Clear transcripts
  const clearTranscripts = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTranscript: '',
      finalTranscripts: [],
      error: null
    }));
  }, []);

  // Get full transcript text
  const getFullTranscript = useCallback(() => {
    const finalText = state.finalTranscripts.map(t => t.text).join(' ');
    return state.currentTranscript ? `${finalText} ${state.currentTranscript}` : finalText;
  }, [state.finalTranscripts, state.currentTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRecorderRef.current?.cleanup();
      assemblyAIRef.current?.stopTranscription();
    };
  }, []);

  return {
    ...state,
    connectService,
    startTranscription,
    stopTranscription,
    clearTranscripts,
    getFullTranscript,
    initialize
  };
}

/**
 * Simplified hook for basic transcription needs
 */
export function useSimpleTranscription() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcription = useAssemblyAITranscription({
    onTranscriptComplete: (result) => {
      setTranscript(prev => prev + ' ' + result.text);
    },
    onError: (error) => {
      setError(error.error);
    }
  });

  const startRecording = useCallback(async () => {
    setError(null);
    setIsRecording(true);
    await transcription.startTranscription();
  }, [transcription]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    await transcription.stopTranscription();
  }, [transcription]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    transcription.clearTranscripts();
  }, [transcription]);

  return {
    transcript,
    isRecording: isRecording && transcription.isRecording,
    isConnected: transcription.isConnected,
    error: error || transcription.error,
    confidence: transcription.confidence,
    startRecording,
    stopRecording,
    clearTranscript
  };
}

/**
 * Hook for continuous transcription with automatic restarts
 */
export function useContinuousTranscription(options: UseAssemblyAITranscriptionOptions = {}) {
  const [transcripts, setTranscripts] = useState<TranscriptionResult[]>([]);
  const [isActive, setIsActive] = useState(false);

  const transcription = useAssemblyAITranscription({
    ...options,
    onTranscriptComplete: (result) => {
      setTranscripts(prev => [...prev, result]);
      options.onTranscriptComplete?.(result);
    }
  });

  const startContinuous = useCallback(async () => {
    setIsActive(true);
    await transcription.startTranscription();
  }, [transcription]);

  const stopContinuous = useCallback(async () => {
    setIsActive(false);
    await transcription.stopTranscription();
  }, [transcription]);

  const clearAll = useCallback(() => {
    setTranscripts([]);
    transcription.clearTranscripts();
  }, [transcription]);

  // Auto-restart on disconnection if still active
  const { startTranscription: startTx, isConnected, isRecording } = transcription;
  useEffect(() => {
    if (isActive && !isConnected && !isRecording) {
      const timer = setTimeout(() => {
        startTx();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, isConnected, isRecording, startTx]);

  return {
    transcripts,
    currentTranscript: transcription.currentTranscript,
    isActive: isActive && transcription.isRecording,
    isConnected: transcription.isConnected,
    error: transcription.error,
    confidence: transcription.confidence,
    startContinuous,
    stopContinuous,
    clearAll,
    getFullText: () => transcripts.map(t => t.text).join(' ') + ' ' + transcription.currentTranscript
  };
}
