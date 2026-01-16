/**
 * useTTS Hook
 * Client-side hook for managing TTS playback state
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: Error | null;
  isFallbackMode: boolean;
}

export function useTTS(options?: UseTTSOptions): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Speak the given text using TTS
   */
  const speak = useCallback(async (text: string): Promise<void> => {
    // Don't start new speech if already playing
    if (isPlaying || isLoading) {
      console.warn('[useTTS] Already playing or loading, ignoring speak request');
      return;
    }

    // Reset state
    setError(null);
    setIsFallbackMode(false);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Call TTS API
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        if (errorData.disabled) {
          console.log('[useTTS] TTS is disabled, falling back to text-only');
          setIsFallbackMode(true);
          setIsLoading(false);
          options?.onEnd?.();
          return;
        }
        
        if (errorData.timeout) {
          console.warn('[useTTS] TTS request timed out');
          throw new Error('TTS request timed out');
        }
        
        throw new Error(errorData.error || `TTS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useTTS] API response:', { 
        hasAudioUrl: !!data.audioUrl, 
        duration: data.duration,
        characterCount: data.characterCount,
        audioUrlLength: data.audioUrl?.length 
      });

      if (!data.audioUrl) {
        throw new Error('No audio URL in response');
      }

      // Create and play audio
      // Convert data URL to Blob URL for better browser compatibility with large audio
      let audioSrc = data.audioUrl;
      if (data.audioUrl.startsWith('data:audio/')) {
        try {
          const base64Data = data.audioUrl.split(',')[1];
          const mimeType = data.audioUrl.split(';')[0].split(':')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          audioSrc = URL.createObjectURL(blob);
          console.log('[useTTS] Converted data URL to Blob URL:', audioSrc);
        } catch (conversionError) {
          console.warn('[useTTS] Failed to convert to Blob URL, using data URL:', conversionError);
        }
      }
      
      console.log('[useTTS] Creating Audio element');
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      // Set up event handlers
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        options?.onStart?.();
      };

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        options?.onEnd?.();
      };

      audio.onerror = (e) => {
        const audioError = audio.error;
        console.error('[useTTS] Audio playback error:', {
          event: e,
          errorCode: audioError?.code,
          errorMessage: audioError?.message,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
        setIsPlaying(false);
        setIsLoading(false);
        setIsFallbackMode(true);
        audioRef.current = null;
        const playbackError = new Error(`Audio playback failed: ${audioError?.message || 'Unknown error'}`);
        setError(playbackError);
        options?.onError?.(playbackError);
        options?.onEnd?.();
      };

      // Start playback
      await audio.play();
    } catch (err: any) {
      console.error('[useTTS] Error:', err);
      
      // Handle abort
      if (err.name === 'AbortError') {
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsFallbackMode(true);
      setError(err);
      options?.onError?.(err);
      options?.onEnd?.();
    }
  }, [isPlaying, isLoading, options]);

  /**
   * Stop current playback
   */
  const stop = useCallback(() => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
    error,
    isFallbackMode,
  };
}
