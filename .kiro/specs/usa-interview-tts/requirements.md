# Requirements Document

## Introduction

This feature integrates MiniMax Text-to-Speech (TTS) into the USA F1 visa interview simulation to provide real-time spoken questions from a simulated visa officer. The TTS system will use MiniMax's speech-02-hd model via WebSocket for synchronous, low-latency audio synthesis, creating a more immersive and realistic interview experience.

## Glossary

- **TTS_Service**: The MiniMax Text-to-Speech API service that converts text questions into spoken audio
- **Interview_Runner**: The React component that orchestrates the interview flow and user interactions
- **WebSocket_TTS**: MiniMax's synchronous TTS API that provides real-time audio streaming
- **Voice_ID**: A unique identifier for a specific voice in the MiniMax voice library
- **Audio_Player**: The browser-based audio playback system for TTS output
- **Admin_Dashboard**: The administrative interface where system-wide settings are configured

## Requirements

### Requirement 1

**User Story:** As a student practicing for my F1 visa interview, I want to hear the visa officer's questions spoken aloud, so that I can experience a more realistic interview simulation.

#### Acceptance Criteria

1. WHEN a new interview question is displayed THEN the TTS_Service SHALL convert the question text to audio and play it automatically
2. WHEN the TTS audio is playing THEN the Interview_Runner SHALL display a visual indicator showing the officer is speaking
3. WHEN the TTS audio finishes playing THEN the Interview_Runner SHALL enable the user's microphone for response
4. IF the TTS_Service fails to generate audio THEN the Interview_Runner SHALL display the question text and allow the interview to continue without audio

### Requirement 2

**User Story:** As a student, I want the visa officer voice to sound professional and American, so that the simulation feels authentic to a real US embassy interview.

#### Acceptance Criteria

1. THE TTS_Service SHALL use the MiniMax speech-02-hd model for highest quality audio output
2. THE TTS_Service SHALL select a professional American English voice from the available system voices
3. WHEN generating speech THEN the TTS_Service SHALL use appropriate speech rate and tone for formal interview context

### Requirement 3

**User Story:** As a student, I want minimal delay between seeing a question and hearing it spoken, so that the interview flow feels natural.

#### Acceptance Criteria

1. WHEN a question is ready to be spoken THEN the TTS_Service SHALL begin audio playback within 2 seconds of the request
2. THE TTS_Service SHALL use WebSocket synchronous API for real-time audio streaming
3. IF network latency exceeds 3 seconds THEN the Interview_Runner SHALL show a loading indicator and proceed with text-only display

### Requirement 4

**User Story:** As a student, I want to listen to the full question without interruption, so that I experience the interview as it would happen at a real embassy.

#### Acceptance Criteria

1. WHEN TTS audio is playing THEN the Interview_Runner SHALL NOT allow skipping or interrupting the audio
2. WHEN TTS audio is playing THEN the Interview_Runner SHALL disable the microphone until audio completes
3. THE Interview_Runner SHALL display the question text alongside the audio for accessibility

### Requirement 5

**User Story:** As an admin, I want to configure which voice is used for interviews from the admin dashboard, so that I can customize the interview experience.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a voice selection interface with available MiniMax system voices
2. WHEN an admin selects a voice THEN the system SHALL store the voice_id in the global configuration
3. THE TTS_Service SHALL use the admin-configured voice_id when generating speech
4. WHEN no voice is configured THEN the TTS_Service SHALL use a default professional American English voice

### Requirement 6

**User Story:** As a developer, I want the TTS integration to be properly configured and monitored, so that the system runs reliably.

#### Acceptance Criteria

1. THE TTS_Service SHALL read the MiniMax API key from environment variables (MINIMAX_API_KEY)
2. THE TTS_Service SHALL support configuration of speech_rate and volume parameters
3. WHEN TTS is disabled in configuration THEN the Interview_Runner SHALL skip audio generation and display questions as text only
4. THE TTS_Service SHALL log API usage metrics for monitoring and cost tracking

### Requirement 7

**User Story:** As a student on a slow connection, I want the interview to work even if audio fails, so that I can complete my practice session.

#### Acceptance Criteria

1. IF the TTS API returns an error THEN the Interview_Runner SHALL gracefully fall back to text-only mode
2. IF audio playback fails mid-stream THEN the Interview_Runner SHALL display the remaining question text
3. WHEN operating in fallback mode THEN the Interview_Runner SHALL notify the user that audio is unavailable
