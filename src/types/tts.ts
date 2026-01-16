/**
 * TTS Types and Interfaces for MiniMax Integration
 * Used for USA F1 visa interview voice synthesis
 */

// MiniMax TTS Models
export type TTSModel = 'speech-02-hd' | 'speech-02-turbo' | 'speech-2.6-hd' | 'speech-2.6-turbo';

// Voice gender types
export type VoiceGender = 'male' | 'female';

// Voice interface representing a MiniMax system voice
export interface Voice {
  voiceId: string;
  name: string;
  gender: VoiceGender;
  language: string;
  accent?: string;
  description?: string;
}

// TTS Service configuration
export interface TTSConfig {
  apiKey: string;
  groupId: string;
  model: TTSModel;
  voiceId: string;
  speechRate?: number; // 0.5 - 2.0, default 1.0
  volume?: number; // 0.0 - 1.0, default 1.0
}

// Request to synthesize speech
export interface TTSRequest {
  text: string;
  voiceId?: string; // Override default voice
  speechRate?: number;
  volume?: number;
}

// Response from TTS synthesis
export interface TTSResponse {
  audioData: ArrayBuffer;
  audioUrl?: string; // Base64 data URL
  duration: number; // milliseconds
  characterCount: number;
}

// Admin configuration stored in Firestore
export interface TTSAdminConfig {
  enabled: boolean;
  voiceId: string;
  speechRate: number;
  volume: number;
  updatedAt?: Date;
  updatedBy?: string;
}

// Firestore document for TTS config
export interface TTSConfigDocument {
  enabled: boolean;
  voiceId: string;
  speechRate: number;
  volume: number;
  updatedAt: FirebaseFirestore.Timestamp;
  updatedBy: string;
}

// TTS usage log for monitoring
export interface TTSUsageLog {
  timestamp: Date;
  userId: string;
  interviewId: string;
  characterCount: number;
  voiceId: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
}

// Default voices for USA F1 interview (American English)
export const DEFAULT_VOICES = {
  male: {
    voiceId: 'male-qn-qingse',
    name: 'American Male Professional',
    gender: 'male' as VoiceGender,
    language: 'en-US',
    accent: 'American',
    description: 'Professional male voice suitable for visa officer simulation',
  },
  female: {
    voiceId: 'female-shaonv',
    name: 'American Female Professional',
    gender: 'female' as VoiceGender,
    language: 'en-US',
    accent: 'American',
    description: 'Professional female voice suitable for visa officer simulation',
  },
} as const;

// Default TTS configuration
export const DEFAULT_TTS_CONFIG: TTSAdminConfig = {
  enabled: true,
  voiceId: DEFAULT_VOICES.male.voiceId,
  speechRate: 1.0,
  volume: 1.0,
};

// Available system voices for admin selection
export const AVAILABLE_VOICES: Voice[] = [
  DEFAULT_VOICES.male,
  DEFAULT_VOICES.female,
  {
    voiceId: 'male-qn-jingying',
    name: 'American Male Authoritative',
    gender: 'male',
    language: 'en-US',
    accent: 'American',
    description: 'Authoritative male voice with commanding presence',
  },
  {
    voiceId: 'female-yujie',
    name: 'American Female Formal',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    description: 'Formal female voice for professional settings',
  },
];
