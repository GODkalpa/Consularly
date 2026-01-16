# Implementation Plan

- [x] 1. Set up MiniMax TTS service and types



  - [x] 1.1 Create TTS types and interfaces

    - Create `src/types/tts.ts` with TTSConfig, TTSRequest, TTSResponse, Voice interfaces
    - Define default voice constants for American English
    - _Requirements: 2.1, 2.2, 5.4_

  - [x] 1.2 Implement MiniMax TTS service

    - Create `src/lib/minimax-tts-service.ts`
    - Implement synthesize() method using MiniMax WebSocket API
    - Implement getAvailableVoices() method
    - Add speech rate and volume parameter support
    - _Requirements: 2.1, 2.3, 3.2, 6.2_
  - [ ]* 1.3 Write property test for default voice fallback
    - **Property 9: Default voice fallback**
    - **Validates: Requirements 5.4**

- [x] 2. Create TTS API routes



  - [x] 2.1 Implement TTS synthesize API route

    - Create `src/app/api/tts/synthesize/route.ts`
    - Read MINIMAX_API_KEY from environment variables
    - Fetch TTS config from Firestore for voice settings
    - Return audio as base64 data URL
    - Add timeout handling (3 second limit)
    - Log usage metrics to Firestore
    - _Requirements: 3.1, 3.3, 6.1, 6.4_
  - [ ]* 2.2 Write property test for timeout fallback
    - **Property 5: Timeout triggers fallback**
    - **Validates: Requirements 3.3**

  - [x] 2.3 Implement TTS config API route

    - Create `src/app/api/admin/tts-config/route.ts`
    - GET endpoint to retrieve current config
    - PUT endpoint to update config (admin only)
    - Store in Firestore platform_settings/tts_config
    - _Requirements: 5.2, 5.3_
  - [ ]* 2.4 Write property test for voice configuration persistence
    - **Property 7: Voice configuration persistence**
    - **Validates: Requirements 5.2**

- [x] 3. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create TTS React hook



  - [x] 4.1 Implement useTTS hook

    - Create `src/hooks/useTTS.ts`
    - Manage isPlaying, isLoading, error states
    - Implement speak() method to call API and play audio
    - Implement stop() method to halt playback
    - Add onStart, onEnd, onError callbacks
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 4.2 Write property test for speaking indicator state
    - **Property 2: Speaking indicator reflects playback state**
    - **Validates: Requirements 1.2**
  - [ ]* 4.3 Write property test for microphone disabled during playback
    - **Property 6: Microphone disabled during playback**
    - **Validates: Requirements 4.1, 4.2**

- [x] 5. Integrate TTS into InterviewRunner



  - [x] 5.1 Add TTS playback to question display

    - Modify `src/components/interview/InterviewRunner.tsx`
    - Call useTTS.speak() when new question is displayed
    - Add speaking indicator UI (animated icon/text)
    - Disable microphone while TTS is playing
    - Enable microphone after TTS completes
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_
  - [ ]* 5.2 Write property test for TTS triggers on question display
    - **Property 1: TTS triggers on question display**
    - **Validates: Requirements 1.1**
  - [ ]* 5.3 Write property test for microphone enables after audio
    - **Property 3: Microphone enables after audio completion**
    - **Validates: Requirements 1.3**

  - [ ] 5.4 Implement error handling and fallback
    - Add try-catch around TTS calls
    - Show fallback notification when TTS fails
    - Continue interview in text-only mode on error
    - _Requirements: 1.4, 7.1, 7.2, 7.3_
  - [ ]* 5.5 Write property test for graceful fallback
    - **Property 4: Graceful fallback on TTS failure**
    - **Validates: Requirements 1.4, 7.1**
  - [ ]* 5.6 Write property test for fallback notification
    - **Property 11: Fallback notification shown**
    - **Validates: Requirements 7.3**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create admin TTS settings



  - [x] 7.1 Implement TTSSettings component

    - Create `src/components/admin/TTSSettings.tsx`
    - Add voice selection dropdown with available voices
    - Add speech rate slider (0.5 - 2.0)
    - Add volume slider (0.0 - 1.0)
    - Add enable/disable toggle
    - Add save button with loading state
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Integrate TTSSettings into GlobalSettings

    - Add new "TTS" tab to GlobalSettings component
    - Wire up save functionality to API
    - _Requirements: 5.1_
  - [ ]* 7.3 Write property test for configured voice used in requests
    - **Property 8: Configured voice used in requests**
    - **Validates: Requirements 5.3**
  - [ ]* 7.4 Write property test for TTS disabled skips synthesis
    - **Property 10: TTS disabled skips synthesis**
    - **Validates: Requirements 6.3**

- [x] 8. Add environment configuration


  - [x] 8.1 Update environment variables


    - Add MINIMAX_API_KEY to .env.local.example
    - Add MINIMAX_GROUP_ID to .env.local.example (if required by API)
    - Update .env.local.INSTRUCTIONS with setup guide
    - _Requirements: 6.1_



- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
