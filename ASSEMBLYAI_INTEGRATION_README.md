# AssemblyAI Speech-to-Text Integration

This document provides comprehensive information about the AssemblyAI real-time speech transcription integration for the F1 visa mock interview platform.

## Overview

The AssemblyAI integration enables real-time speech-to-text transcription during mock interviews, allowing administrators to capture and analyze student responses automatically. The system provides high-accuracy transcription with confidence scoring and real-time feedback.

## Features

- **Real-time Speech Transcription**: Live speech-to-text conversion using AssemblyAI's WebSocket API
- **High Accuracy**: Industry-leading speech recognition with confidence scoring
- **Interview Integration**: Seamlessly integrated with F1 visa mock interview system
- **Response Analysis**: Automatic analysis of student responses with AI-powered feedback
- **Audio Recording**: Browser-based audio capture with microphone access
- **Export Functionality**: Save transcripts and interview sessions
- **Real-time Feedback**: Live confidence indicators and speech quality metrics

## Architecture

### Core Components

1. **AssemblyAIService** (`src/lib/assemblyai-service.ts`)
   - WebSocket connection to AssemblyAI real-time API
   - Handles authentication and session management
   - Processes audio data and returns transcription results

2. **AudioRecorder** (`src/lib/audio-recorder.ts`)
   - Browser audio capture using Web Audio API
   - Real-time audio processing and streaming
   - Microphone permission handling

3. **React Hooks** (`src/hooks/use-assemblyai-transcription.tsx`)
   - `useAssemblyAITranscription`: Main hook for transcription management
   - `useSimpleTranscription`: Simplified hook for basic use cases
   - `useContinuousTranscription`: Hook for continuous speech recognition

4. **UI Components** (`src/components/speech/AssemblyAITranscription.tsx`)
   - Complete transcription interface with controls
   - Real-time transcript display
   - Statistics and confidence indicators

5. **Interview System** (`src/components/admin/InterviewSimulation.tsx`)
   - Full F1 visa mock interview with speech transcription
   - Question management and response analysis
   - Session recording and export

## Setup Instructions

### 1. Get AssemblyAI API Key

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Navigate to your dashboard and copy your API key
3. The API key should start with your account identifier

### 2. Environment Configuration

Add your AssemblyAI API key to your environment file:

```bash
# .env.local
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

**Important**: The API key must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Browser Requirements

- **HTTPS Required**: Microphone access requires a secure connection (HTTPS)
- **Microphone Permissions**: Users must grant microphone access
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

### 4. Test the Integration

```typescript
import { AssemblyAIService } from '@/lib/assemblyai-service';

// Test API connection
const isValid = await AssemblyAIService.testApiKey(process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY!);
console.log('API Key Valid:', isValid);
```

## Usage Examples

### Basic Transcription

```typescript
import { useAssemblyAITranscription } from '@/hooks/use-assemblyai-transcription';

function MyComponent() {
  const transcription = useAssemblyAITranscription({
    onTranscriptComplete: (result) => {
      console.log('Final transcript:', result.text);
      console.log('Confidence:', result.confidence);
    }
  });

  return (
    <div>
      <button onClick={transcription.startTranscription}>
        Start Recording
      </button>
      <button onClick={transcription.stopTranscription}>
        Stop Recording
      </button>
      <p>Current: {transcription.currentTranscript}</p>
      <p>Status: {transcription.isRecording ? 'Recording' : 'Stopped'}</p>
    </div>
  );
}
```

### Interview Integration

```typescript
import { InterviewSimulation } from '@/components/admin/InterviewSimulation';

function AdminDashboard() {
  return (
    <div>
      <h1>F1 Visa Mock Interview</h1>
      <InterviewSimulation />
    </div>
  );
}
```

### Complete UI Component

```typescript
import { AssemblyAITranscription } from '@/components/speech/AssemblyAITranscription';

function TranscriptionPage() {
  return (
    <AssemblyAITranscription
      onTranscriptComplete={(result) => {
        // Handle completed transcript
        console.log('Transcript:', result.text);
      }}
      onTranscriptUpdate={(currentText) => {
        // Handle real-time updates
        console.log('Current:', currentText);
      }}
      showControls={true}
      showTranscripts={true}
    />
  );
}
```

## API Reference

### AssemblyAIService

```typescript
class AssemblyAIService {
  constructor(config: AssemblyAIConfig)
  
  // Start real-time transcription
  async startTranscription(): Promise<void>
  
  // Send audio data for transcription
  sendAudioData(audioData: ArrayBuffer): void
  
  // Stop transcription
  async stopTranscription(): Promise<void>
  
  // Check if transcription is active
  isActive(): boolean
  
  // Event handlers
  onTranscript(handler: (result: TranscriptionResult) => void): void
  onError(handler: (error: TranscriptionError) => void): void
  onConnected(handler: () => void): void
  onDisconnected(handler: () => void): void
  
  // Static method to test API key
  static async testApiKey(apiKey: string): Promise<boolean>
}
```

### AudioRecorder

```typescript
class AudioRecorder {
  constructor(config?: AudioRecorderConfig)
  
  // Initialize audio recording
  async initialize(): Promise<void>
  
  // Start recording
  async startRecording(): Promise<void>
  
  // Stop recording
  stopRecording(): void
  
  // Clean up resources
  cleanup(): void
  
  // Check if recording is active
  isActive(): boolean
  
  // Event handlers
  onAudioChunk(handler: (chunk: AudioChunk) => void): void
  onStart(handler: () => void): void
  onStop(handler: () => void): void
  onError(handler: (error: string) => void): void
}
```

### React Hooks

```typescript
// Main transcription hook
function useAssemblyAITranscription(options?: UseAssemblyAITranscriptionOptions): {
  isRecording: boolean;
  isConnected: boolean;
  currentTranscript: string;
  finalTranscripts: TranscriptionResult[];
  error: string | null;
  confidence: number;
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<void>;
  clearTranscripts: () => void;
  getFullTranscript: () => string;
}

// Simplified hook
function useSimpleTranscription(): {
  transcript: string;
  isRecording: boolean;
  isConnected: boolean;
  error: string | null;
  confidence: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;
}
```

## Configuration Options

### AssemblyAI Configuration

```typescript
interface AssemblyAIConfig {
  apiKey: string;           // Your AssemblyAI API key
  sampleRate?: number;      // Audio sample rate (default: 16000)
  wordBoost?: string[];     // Words to boost recognition
  languageCode?: string;    // Language code (default: 'en_us')
}
```

### Audio Recorder Configuration

```typescript
interface AudioRecorderConfig {
  sampleRate?: number;      // Sample rate (default: 16000)
  channels?: number;        // Audio channels (default: 1)
  bufferSize?: number;      // Buffer size (default: 4096)
  mimeType?: string;        // MIME type for recording
}
```

## Interview System Features

### F1 Visa Questions Integration

- **122 Authentic Questions**: Real F1 visa questions from US Embassy Nepal
- **6 Categories**: Study plans, University choice, Academic capability, Financial status, Post-graduation plans, Additional/General
- **Smart Question Flow**: AI-powered question selection based on responses

### Response Analysis

- **Real-time Transcription**: Live speech-to-text during answers
- **Confidence Scoring**: Speech recognition confidence levels
- **Content Analysis**: AI-powered response quality assessment
- **Feedback Generation**: Automatic suggestions for improvement

### Session Management

- **Interview Sessions**: Complete interview tracking with timestamps
- **Response Recording**: All answers saved with transcripts and analysis
- **Export Functionality**: Download interview sessions as JSON
- **Progress Tracking**: Visual progress indicators and statistics

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Try refreshing the page

2. **API Key Invalid**
   - Verify API key is correct
   - Check environment variable name
   - Ensure key has proper permissions

3. **Poor Transcription Quality**
   - Check microphone quality
   - Reduce background noise
   - Speak clearly and at moderate pace

4. **WebSocket Connection Failed**
   - Check internet connection
   - Verify API key validity
   - Try refreshing the page

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 60+     | ✅ Full |
| Firefox | 55+     | ✅ Full |
| Safari  | 11+     | ✅ Full |
| Edge    | 79+     | ✅ Full |

### Performance Optimization

- **Audio Quality**: Use 16kHz sample rate for optimal balance
- **Buffer Size**: 4096 samples provides good real-time performance
- **Network**: Stable internet connection required for WebSocket
- **Memory**: Clear transcripts periodically for long sessions

## Security Considerations

- **API Key Protection**: Never expose API keys in client-side code
- **HTTPS Required**: Microphone access requires secure connection
- **Data Privacy**: Audio data is processed by AssemblyAI servers
- **Session Storage**: Interview data should be encrypted at rest

## Examples and Demos

See `examples/assemblyai-interview-demo.ts` for comprehensive usage examples:

- Basic transcription demo
- Full interview simulation
- Real-time analysis demo
- API connection testing

## Support and Resources

- **AssemblyAI Documentation**: https://www.assemblyai.com/docs/
- **API Reference**: https://www.assemblyai.com/docs/api-reference
- **WebSocket API**: https://www.assemblyai.com/docs/walkthroughs#realtime-streaming-transcription
- **Pricing**: https://www.assemblyai.com/pricing

## License

This integration is part of the visa-mockup project. Please refer to the main project license for usage terms.
