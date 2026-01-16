/**
 * TTS Config API Route
 * Admin endpoint for managing TTS configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { DEFAULT_TTS_CONFIG, AVAILABLE_VOICES, type TTSAdminConfig } from '@/types/tts';

/**
 * GET /api/admin/tts-config
 * Retrieve current TTS configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch TTS config
    const configDoc = await adminDb
      .collection('platform_settings')
      .doc('tts_config')
      .get();

    let config: TTSAdminConfig;
    if (configDoc.exists) {
      const data = configDoc.data();
      config = {
        enabled: data?.enabled ?? DEFAULT_TTS_CONFIG.enabled,
        voiceId: data?.voiceId || DEFAULT_TTS_CONFIG.voiceId,
        speechRate: data?.speechRate ?? DEFAULT_TTS_CONFIG.speechRate,
        volume: data?.volume ?? DEFAULT_TTS_CONFIG.volume,
        updatedAt: data?.updatedAt?.toDate(),
        updatedBy: data?.updatedBy,
      };
    } else {
      config = DEFAULT_TTS_CONFIG;
    }

    return NextResponse.json({
      config,
      availableVoices: AVAILABLE_VOICES,
    });
  } catch (error: any) {
    console.error('[TTS Config API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TTS config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tts-config
 * Update TTS configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate fields
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof body.voiceId !== 'string' || !body.voiceId) {
      return NextResponse.json(
        { error: 'voiceId is required' },
        { status: 400 }
      );
    }

    // Validate voice exists
    const validVoice = AVAILABLE_VOICES.find(v => v.voiceId === body.voiceId);
    if (!validVoice) {
      return NextResponse.json(
        { error: 'Invalid voiceId' },
        { status: 400 }
      );
    }

    // Validate speechRate (0.5 - 2.0)
    const speechRate = parseFloat(body.speechRate);
    if (isNaN(speechRate) || speechRate < 0.5 || speechRate > 2.0) {
      return NextResponse.json(
        { error: 'speechRate must be between 0.5 and 2.0' },
        { status: 400 }
      );
    }

    // Validate volume (0.0 - 1.0)
    const volume = parseFloat(body.volume);
    if (isNaN(volume) || volume < 0 || volume > 1.0) {
      return NextResponse.json(
        { error: 'volume must be between 0.0 and 1.0' },
        { status: 400 }
      );
    }

    // Update config in Firestore
    const configData = {
      enabled: body.enabled,
      voiceId: body.voiceId,
      speechRate,
      volume,
      updatedAt: new Date(),
      updatedBy: decodedToken.uid,
    };

    await adminDb
      .collection('platform_settings')
      .doc('tts_config')
      .set(configData, { merge: true });

    console.log('[TTS Config API] Config updated by', decodedToken.uid);

    return NextResponse.json({
      success: true,
      config: {
        ...configData,
        updatedAt: configData.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[TTS Config API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update TTS config' },
      { status: 500 }
    );
  }
}
