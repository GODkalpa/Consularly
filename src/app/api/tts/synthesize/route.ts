/**
 * TTS Synthesize API Route
 * Proxies TTS requests to MiniMax API with configuration from Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTTSService } from '@/lib/minimax-tts-service';
import { adminDb } from '@/lib/firebase-admin';
import { DEFAULT_TTS_CONFIG, type TTSAdminConfig } from '@/types/tts';

// Timeout for TTS requests (increased to 8 seconds for MiniMax API latency)
const TTS_TIMEOUT_MS = 8000;

interface SynthesizeRequest {
  text: string;
  voiceId?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body: SynthesizeRequest = await request.json();
    
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length (MiniMax supports up to 10,000 chars for sync API)
    if (body.text.length > 10000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 10,000 characters' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.MINIMAX_API_KEY || !process.env.MINIMAX_GROUP_ID) {
      console.error('[TTS API] MiniMax credentials not configured');
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 503 }
      );
    }

    // Fetch TTS config from Firestore
    let ttsConfig: TTSAdminConfig = DEFAULT_TTS_CONFIG;
    try {
      const configDoc = await adminDb()
        .collection('platform_settings')
        .doc('tts_config')
        .get();
      
      if (configDoc.exists) {
        const data = configDoc.data();
        ttsConfig = {
          enabled: data?.enabled ?? true,
          voiceId: data?.voiceId || DEFAULT_TTS_CONFIG.voiceId,
          speechRate: data?.speechRate ?? 1.0,
          volume: data?.volume ?? 1.0,
        };
      }
    } catch (dbError) {
      console.warn('[TTS API] Failed to fetch config, using defaults:', dbError);
    }

    // Check if TTS is enabled
    if (!ttsConfig.enabled) {
      return NextResponse.json(
        { error: 'TTS is disabled', disabled: true },
        { status: 503 }
      );
    }

    // Create TTS service with config
    const ttsService = createTTSService({
      voiceId: body.voiceId || ttsConfig.voiceId,
      speechRate: ttsConfig.speechRate,
      volume: ttsConfig.volume,
    });

    // Synthesize with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    try {
      const synthesizePromise = ttsService.synthesize({ text: body.text });
      
      // Race between synthesis and timeout
      const result = await Promise.race([
        synthesizePromise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('TTS request timeout'));
          });
        }),
      ]);

      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      // Log usage (fire and forget)
      logTTSUsage({
        characterCount: result.characterCount,
        voiceId: body.voiceId || ttsConfig.voiceId,
        success: true,
        latencyMs,
      }).catch(console.error);

      return NextResponse.json({
        audioUrl: result.audioUrl,
        duration: result.duration,
        characterCount: result.characterCount,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.message === 'TTS request timeout') {
        console.warn('[TTS API] Request timed out after', TTS_TIMEOUT_MS, 'ms');
        
        // Log timeout
        logTTSUsage({
          characterCount: body.text.length,
          voiceId: body.voiceId || ttsConfig.voiceId,
          success: false,
          latencyMs: TTS_TIMEOUT_MS,
          errorMessage: 'Timeout',
        }).catch(console.error);

        return NextResponse.json(
          { error: 'TTS request timed out', timeout: true },
          { status: 504 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('[TTS API] Error:', error);
    
    const latencyMs = Date.now() - startTime;
    
    // Log error
    logTTSUsage({
      characterCount: 0,
      voiceId: 'unknown',
      success: false,
      latencyMs,
      errorMessage: error.message,
    }).catch(console.error);

    return NextResponse.json(
      { error: 'TTS synthesis failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Log TTS usage to Firestore for monitoring
 */
async function logTTSUsage(data: {
  characterCount: number;
  voiceId: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
  userId?: string;
  interviewId?: string;
}) {
  try {
    await adminDb().collection('tts_usage_logs').add({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[TTS API] Failed to log usage:', error);
  }
}
