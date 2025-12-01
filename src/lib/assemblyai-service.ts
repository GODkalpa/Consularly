/**
 * AssemblyAI Real-time Speech-to-Text Service
 * Provides real-time transcription capabilities for mock interviews
 */

export interface TranscriptionResult {
  text: string;
  confidence: number;
  is_final: boolean;
  audio_start: number;
  audio_end: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language_code?: string;
  language_confidence?: number;
}

export interface TranscriptionError {
  error: string;
  code?: string;
}

export interface AssemblyAIConfig {
  apiKey?: string; // optional; server route uses server-side key
  sampleRate?: number;
  wordBoost?: string[];
  languageCode?: string;
  enableLanguageDetection?: boolean;
}

export class AssemblyAIService {
  private apiKey: string;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private sessionId: string | null = null;
  private config: AssemblyAIConfig;

  // Event handlers
  private onTranscriptHandler?: (result: TranscriptionResult) => void;
  private onErrorHandler?: (error: TranscriptionError) => void;
  private onConnectedHandler?: () => void;
  private onDisconnectedHandler?: () => void;

  constructor(config: AssemblyAIConfig) {
    this.config = config;
    this.apiKey = config.apiKey || '';
  }

  /**
   * Start real-time transcription session
   */
  async startTranscription(): Promise<void> {
    if (this.isConnected) {
      console.warn('Transcription session already active');
      return;
    }

    try {
      // Request a temporary session token from our server route (avoids CORS and keeps API key private)
      const tokenResponse = await fetch('/api/assemblyai/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_in: 60, // request short-lived token to maximize compatibility
        }),
      });

      if (!tokenResponse.ok) {
        let detail = '';
        try { detail = JSON.stringify(await tokenResponse.json()); } catch { }
        throw new Error(`Failed to get session token: ${tokenResponse.statusText}${detail ? ' - ' + detail : ''}`);
      }

      const { token } = await tokenResponse.json();

      // Connect to Streaming v3 WebSocket with language detection enabled
      const sampleRate = this.config.sampleRate || 16000;
      const enableLanguageDetection = this.config.enableLanguageDetection !== false; // Default to true
      const socketUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${sampleRate}&encoding=pcm_s16le&enable_extra_session_information=true&token=${token}`;

      this.socket = new WebSocket(socketUrl);

      this.socket.onopen = () => {
        console.log('AssemblyAI WebSocket connected');
        this.isConnected = true;
        this.onConnectedHandler?.();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // v3 messages use types: Begin, Turn, Termination
          if (data.type === 'Begin') {
            this.sessionId = data.id;
            console.log('AssemblyAI v3 session started:', this.sessionId);
          } else if (data.type === 'Turn') {
            const isFinal = Boolean(data.end_of_turn);
            const result = {
              text: data.transcript || '',
              confidence: typeof data.end_of_turn_confidence === 'number' ? data.end_of_turn_confidence : (typeof data.confidence === 'number' ? data.confidence : 0),
              is_final: isFinal,
              audio_start: 0,
              audio_end: 0,
              words: [],
              language_code: data.language_code,
              language_confidence: data.language_confidence
            } as TranscriptionResult;

            // Log language detection for monitoring
            if (isFinal && data.language_code && data.language_code !== 'en') {
              console.warn(`🌐 Non-English language detected: ${data.language_code} (confidence: ${Math.round((data.language_confidence || 0) * 100)}%)`);
            }

            this.onTranscriptHandler?.(result);
          } else if (data.type === 'Termination') {
            console.log('AssemblyAI v3 session terminated');
            this.disconnect();
          }
        } catch (error) {
          // Some frames can be binary; ignore parsing errors for non-JSON frames
          // but log unexpected issues
        }
      };

      this.socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        this.onErrorHandler?.({
          error: 'WebSocket connection error',
          code: 'CONNECTION_ERROR'
        });
      };

      this.socket.onclose = () => {
        console.log('AssemblyAI WebSocket disconnected');
        this.isConnected = false;
        this.sessionId = null;
        this.onDisconnectedHandler?.();
      };

    } catch (error) {
      console.error('Failed to start AssemblyAI transcription:', error);
      this.onErrorHandler?.({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INITIALIZATION_ERROR'
      });
      throw error;
    }
  }

  /**
   * Send audio data for transcription
   */
  sendAudioData(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send audio: WebSocket not connected');
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      // v3 expects raw binary PCM frames
      this.socket.send(audioData);
    }
  }

  /**
   * Stop transcription and disconnect
   * @param disconnect - Whether to close the WebSocket connection (default: true)
   */
  async stopTranscription(disconnect: boolean = true): Promise<void> {
    // If we want to keep the connection alive (hot mic), we don't send Terminate
    // The hook handles stopping the audio stream
    if (!disconnect) {
      console.log('Keeping AssemblyAI connection alive (hot mic)');
      return;
    }

    if (!this.isConnected || !this.socket) {
      return;
    }

    // Send termination message
    if (this.socket.readyState === WebSocket.OPEN) {
      // v3 termination message
      console.log('Sending Terminate message to AssemblyAI...');
      this.socket.send(JSON.stringify({ type: 'Terminate' }));

      // CRITICAL FIX: Do NOT disconnect immediately.
      // Wait for the server to send the "Termination" message which confirms
      // all final transcripts have been sent.

      // Create a promise that resolves when the socket closes or we get the termination message
      return new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.warn('AssemblyAI termination timed out, forcing disconnect');
          this.disconnect();
          resolve();
        }, 3000); // Wait up to 3 seconds for final transcripts

        // Better approach: The onmessage handler already calls this.disconnect() when it sees 'Termination'.
        // So we just need to wait for isConnected to become false.

        const checkInterval = setInterval(() => {
          if (!this.isConnected) {
            clearTimeout(timeoutId);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    } else {
      this.disconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  /**
   * Check if transcription is active
   */
  isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set event handlers
   */
  onTranscript(handler: (result: TranscriptionResult) => void): void {
    this.onTranscriptHandler = handler;
  }

  onError(handler: (error: TranscriptionError) => void): void {
    this.onErrorHandler = handler;
  }

  onConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  onDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  /**
   * Format transcription result from AssemblyAI response
   */
  private formatTranscriptionResult(data: any, isFinal: boolean): TranscriptionResult {
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      is_final: isFinal,
      audio_start: data.audio_start || 0,
      audio_end: data.audio_end || 0,
      words: data.words || []
    };
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
   * Static method to test API key validity
   */
  static async testApiKey(): Promise<boolean> {
    try {
      const response = await fetch('/api/assemblyai/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in: 60 }),
      });
      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}

/**
 * Create AssemblyAI service instance with environment configuration
 */
export function createAssemblyAIService(): AssemblyAIService {
  return new AssemblyAIService({
    sampleRate: 16000,
    languageCode: 'en_us',
    enableLanguageDetection: true // Enable language detection by default
  });
}
