/**
 * Test MiniMax TTS API directly
 * Run with: npx ts-node scripts/test-minimax.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

async function testMinimax() {
  console.log('Testing MiniMax TTS API...');
  console.log('API Key (first 50 chars):', MINIMAX_API_KEY?.substring(0, 50) + '...');
  console.log('Group ID:', MINIMAX_GROUP_ID);
  
  if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
    console.error('Missing MINIMAX_API_KEY or MINIMAX_GROUP_ID');
    return;
  }

  const testText = 'Hello, this is a test.';
  
  // Try global endpoint
  const endpoints = [
    'https://api.minimax.chat/v1/t2a_v2',
    'https://api.minimaxi.chat/v1/t2a_v2',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n--- Testing endpoint: ${endpoint} ---`);
    
    try {
      const response = await fetch(`${endpoint}?GroupId=${MINIMAX_GROUP_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'speech-02-hd',
          text: testText,
          stream: false,
          voice_setting: {
            voice_id: 'male-qn-qingse',
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
          },
        }),
      });

      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.base_resp?.status_code === 0) {
        console.log('✅ SUCCESS! This endpoint works.');
        console.log('Audio length:', data.extra_info?.audio_length);
        return;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  console.log('\n❌ Neither endpoint worked. Check your API key and Group ID.');
}

testMinimax();
