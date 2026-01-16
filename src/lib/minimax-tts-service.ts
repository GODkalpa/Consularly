/**
 * MiniMax TTS Service
 * Server-side service for text-to-speech synthesis using MiniMax API
 */

import type { TTSConfig, TTSRequest, TTSResponse, Voice } from '@/types/tts';
import { AVAILABLE_VOICES, DEFAULT_VOICES } from '@/types/tts';

// MiniMax API endpoints
// Note: Use api.minimaxi.chat for Chinese platform accounts, api.minimax.chat for global
const MINIMAX_TTS_URL = 'https://api.minimaxi.chat/v1/t2a_v2';

// MiniMax API request format
interface MinimaxTTSRequest {
  model: string;
  text: string;
  stream: boolean;
  voice_setting: {
    voice_id: string;
    speed: number;
    vol: number;
    pitch: number;
  };
  audio_setting: {
    sample_rate: number;
    bitrate: number;
    format: string;
  };
}

// MiniMax API response format
interface MinimaxTTSResponse {
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
  data?: {
    audio: string; // Hex-encoded audio data
  };
  extra_info?: {
    audio_length: number;
    audio_sample_rate: number;
    audio_size: number;
    bitrate: number;
    word_count: number;
    audio_format?: string;
    audio_channel?: number;
  };
}

export class MinimaxTTSService {
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now();
    
    const voiceId = request.voiceId || this.config.voiceId || DEFAULT_VOICES.male.voiceId;
    const speechRate = request.speechRate ?? this.config.speechRate ?? 1.0;
    const volume = request.volume ?? this.config.volume ?? 1.0;

    // Validate and sanitize text
    const sanitizedText = this.sanitizeText(request.text);
    if (!sanitizedText) {
      throw new Error('Text is empty or contains only invalid characters');
    }

    const apiRequest: MinimaxTTSRequest = {
      model: this.config.model,
      text: sanitizedText,
      stream: false,
      voice_setting: {
        voice_id: voiceId,
        speed: speechRate,
        vol: volume,
        pitch: 0, // Default pitch
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
      },
    };

    try {
      const response = await fetch(`${MINIMAX_TTS_URL}?GroupId=${this.config.groupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(apiRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MinimaxTTS] API error:', response.status, errorText);
        throw new Error(`MiniMax API error: ${response.status}`);
      }

      const data: MinimaxTTSResponse = await response.json();

      // Check for API-level errors
      if (data.base_resp && data.base_resp.status_code !== 0) {
        console.error('[MinimaxTTS] API returned error:', data.base_resp);
        throw new Error(`MiniMax API error: ${data.base_resp.status_msg}`);
      }

      if (!data.data?.audio) {
        throw new Error('No audio data in response');
      }

      // MiniMax returns hex-encoded audio data, convert to base64 for browser playback
      const hexAudio = data.data.audio;
      const audioBuffer = this.hexToArrayBuffer(hexAudio);
      const audioBase64 = this.arrayBufferToBase64(audioBuffer);
      
      // Calculate duration from extra_info or estimate
      const duration = data.extra_info?.audio_length 
        ? data.extra_info.audio_length * 1000 // Convert to ms
        : this.estimateDuration(sanitizedText);

      const latencyMs = Date.now() - startTime;
      console.log(`[MinimaxTTS] Synthesized ${sanitizedText.length} chars in ${latencyMs}ms`);

      // Determine format from extra_info or default to mp3
      const format = data.extra_info?.audio_format || 'mp3';
      
      return {
        audioData: audioBuffer,
        audioUrl: `data:audio/${format};base64,${audioBase64}`,
        duration,
        characterCount: sanitizedText.length,
      };
    } catch (error) {
      console.error('[MinimaxTTS] Synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Voice[]> {
    // Return predefined voices - MiniMax doesn't have a voice listing API
    return AVAILABLE_VOICES;
  }

  /**
   * Sanitize text for TTS
   * MiniMax requires text without certain control characters
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t and \n
      .trim();
  }

  /**
   * Convert hex string to ArrayBuffer
   * MiniMax returns audio data as hex-encoded string
   */
  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Estimate audio duration based on text length
   * Average speaking rate is ~150 words per minute
   */
  private estimateDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const wordsPerSecond = 150 / 60; // 2.5 words per second
    return Math.ceil((words / wordsPerSecond) * 1000); // Return ms
  }
}

/**
 * Create a TTS service instance with environment config
 */
export function createTTSService(overrides?: Partial<TTSConfig>): MinimaxTTSService {
  const config: TTSConfig = {
    apiKey: process.env.MINIMAX_API_KEY || '',
    groupId: process.env.MINIMAX_GROUP_ID || '',
    model: 'speech-02-hd',
    voiceId: overrides?.voiceId || DEFAULT_VOICES.male.voiceId,
    speechRate: overrides?.speechRate ?? 1.0,
    volume: overrides?.volume ?? 1.0,
    ...overrides,
  };

  if (!config.apiKey) {
    console.warn('[MinimaxTTS] MINIMAX_API_KEY not configured');
  }
  if (!config.groupId) {
    console.warn('[MinimaxTTS] MINIMAX_GROUP_ID not configured');
  }

  return new MinimaxTTSService(config);
}
