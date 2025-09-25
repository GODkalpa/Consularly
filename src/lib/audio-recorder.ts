/**
 * Audio Recorder Service for Real-time Speech Capture
 * Handles microphone access and audio streaming for AssemblyAI transcription
 */

export interface AudioRecorderConfig {
  sampleRate?: number;
  channels?: number;
  bufferSize?: number;
  mimeType?: string;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private config: AudioRecorderConfig;
  
  // Event handlers
  private onAudioChunkHandler?: (chunk: AudioChunk) => void;
  private onStartHandler?: () => void;
  private onStopHandler?: () => void;
  private onErrorHandler?: (error: string) => void;

  constructor(config: AudioRecorderConfig = {}) {
    this.config = {
      sampleRate: 16000,
      channels: 1,
      bufferSize: 4096,
      mimeType: 'audio/webm;codecs=opus',
      ...config
    };
  }

  /**
   * Initialize audio recording with microphone access
   */
  async initialize(): Promise<void> {
    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support audio recording');
      }

      // Request microphone access (do not force sampleRate; let device choose native rate)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context for real-time processing (no explicit sampleRate to use device native)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create audio source from media stream
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create script processor for real-time audio chunks
      this.processor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        this.config.channels,
        this.config.channels
      );

      // Handle audio processing
      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const audioData = inputBuffer.getChannelData(0);
        
        // Convert Float32Array to ArrayBuffer
        const arrayBuffer = this.float32ToArrayBuffer(audioData);
        
        this.onAudioChunkHandler?.({
          data: arrayBuffer,
          timestamp: Date.now()
        });
      };

      // Connect audio nodes
      this.source.connect(this.processor);
      // Do not play mic back to speakers. Route through a silent gain node
      const silent = this.audioContext.createGain();
      silent.gain.value = 0;
      this.processor.connect(silent);
      silent.connect(this.audioContext.destination);

      console.log('Audio recorder initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize audio recorder:', errorMessage);
      this.onErrorHandler?.(errorMessage);
      throw error;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    if (!this.audioContext || !this.mediaStream) {
      await this.initialize();
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isRecording = true;
      console.log('Audio recording started');
      this.onStartHandler?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('Error starting recording:', errorMessage);
      this.onErrorHandler?.(errorMessage);
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (!this.isRecording) {
      console.warn('No recording in progress');
      return;
    }

    this.isRecording = false;
    console.log('Audio recording stopped');
    this.onStopHandler?.();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopRecording();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    console.log('Audio recorder cleaned up');
  }

  /**
   * Check if recording is active
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get current audio configuration
   */
  getConfig(): AudioRecorderConfig {
    return { ...this.config };
  }

  /**
   * Return the actual microphone stream sample rate being used by the AudioContext.
   * Browsers commonly run at 48000 Hz regardless of requested constraints.
   * Use this to configure downstream STT services with the correct sample rate.
   */
  getActualSampleRate(): number {
    // If AudioContext is not yet initialized, fall back to the requested config
    return this.audioContext?.sampleRate || this.config.sampleRate || 48000;
  }

  /**
   * Set event handlers
   */
  onAudioChunk(handler: (chunk: AudioChunk) => void): void {
    this.onAudioChunkHandler = handler;
  }

  onStart(handler: () => void): void {
    this.onStartHandler = handler;
  }

  onStop(handler: () => void): void {
    this.onStopHandler = handler;
  }

  onError(handler: (error: string) => void): void {
    this.onErrorHandler = handler;
  }

  /**
   * Convert Float32Array to ArrayBuffer for AssemblyAI
   */
  private float32ToArrayBuffer(float32Array: Float32Array): ArrayBuffer {
    // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
    const int16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return int16Array.buffer;
  }

  /**
   * Static method to check microphone permissions
   */
  static async checkMicrophonePermission(): Promise<PermissionState> {
    try {
      if (!navigator.permissions) {
        return 'granted'; // Assume granted if permissions API not available
      }
      
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state;
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'granted'; // Fallback assumption
    }
  }

  /**
   * Static method to test microphone access
   */
  static async testMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone access test failed:', error);
      return false;
    }
  }
}

/**
 * Create audio recorder instance with default configuration
 */
export function createAudioRecorder(config?: AudioRecorderConfig): AudioRecorder {
  return new AudioRecorder(config);
}
