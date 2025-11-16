/**
 * LLM Provider Selector
 * Routes LLM requests to appropriate providers based on interview route and use case
 * Supports: MegaLLM (primary) and Groq (fallback)
 */

export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn';
export type LLMUseCase = 'question_selection' | 'answer_scoring' | 'final_evaluation';

export interface LLMProviderConfig {
  provider: 'groq' | 'megallm';
  model: string;
  apiKey: string;
  baseUrl: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Select the appropriate LLM provider based on route and use case
 */
export function selectLLMProvider(
  route: InterviewRoute,
  useCase: LLMUseCase
): LLMProviderConfig | null {
  // Debug: Log available API keys on first call
  if (useCase === 'question_selection') {
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasMega = !!process.env.MEGALLM_API_KEY;
    console.log(`[LLM Provider Debug] Available keys: MegaLLM=${hasMega}, Groq=${hasGroq}`);
  }

  // Primary provider: MegaLLM (Gemini 2.5 Flash via OpenAI-compatible API)
  // If MEGALLM_API_KEY is configured, use this for all routes and use cases.
  if (process.env.MEGALLM_API_KEY) {
    return {
      provider: 'megallm',
      model: process.env.MEGALLM_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.MEGALLM_API_KEY,
      baseUrl: process.env.MEGALLM_BASE_URL || 'https://ai.megallm.io/v1',
    };
  }

  // Question Selection: Always use Groq Llama 3.1 8B (fast + cheap)
  // PERFORMANCE: 8B instant model is 3-5x faster than 70B models
  if (useCase === 'question_selection') {
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        model: process.env.LLM_MODEL_QUESTIONS || 'llama-3.1-8b-instant', // Ultra-fast for question selection
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    }
  }

  // UK Scoring/Evaluation: Use Groq Llama 3.3 70B by default
  if (route === 'uk_student' && (useCase === 'answer_scoring' || useCase === 'final_evaluation')) {
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        model: process.env.LLM_MODEL_SCORING || 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    }
  }

  // France Scoring/Evaluation: Use Groq Llama 3.3 70B by default
  if ((route === 'france_ema' || route === 'france_icn') && (useCase === 'answer_scoring' || useCase === 'final_evaluation')) {
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        model: process.env.LLM_MODEL_SCORING || 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    }
  }

  // USA Scoring/Evaluation: Use Groq Llama 3.3 70B
  if (route === 'usa_f1' && (useCase === 'answer_scoring' || useCase === 'final_evaluation')) {
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        model: process.env.LLM_MODEL_SCORING || 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    }
  }

  return null;
}

/**
 * Call LLM provider with unified interface
 */
export async function callLLMProvider(
  config: LLMProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 4096
): Promise<LLMResponse> {
  if (config.provider === 'groq' || config.provider === 'megallm') {
    return callOpenAICompatible(config, systemPrompt, userPrompt, temperature, maxTokens);
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

/**
 * Call OpenAI-compatible API (Groq, MegaLLM)
 */
async function callOpenAICompatible(
  config: LLMProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  // PERFORMANCE FIX: Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout for MegaLLM
  
  try {
    const payload: any = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };

    // Keep JSON-mode for providers that fully support OpenAI response_format
    if (config.provider !== 'megallm') {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Normalize content so callers always receive a string
    let content: any = data?.choices?.[0]?.message?.content;
    if ((content === null || typeof content === 'undefined') && config.provider === 'megallm') {
      // Debug unexpected MegaLLM response shape
      console.error('[MegaLLM Debug] Unexpected chat completion shape:', JSON.stringify(data).slice(0, 1000));
    }
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
    
    // Strip markdown code blocks from MegaLLM responses (e.g., ```json...```)
    if (config.provider === 'megallm' && typeof content === 'string') {
      content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    }
    
    return {
      content,
      usage: data.usage,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`${config.provider} API timeout after 15 seconds`);
    }
    throw error;
  }
}

/**
 * Helper to log provider selection for debugging
 */
export function logProviderSelection(
  route: InterviewRoute,
  useCase: LLMUseCase,
  config: LLMProviderConfig | null
): void {
  if (config) {
    console.log(`[LLM Provider] ${route} / ${useCase} → ${config.provider} (${config.model})`);
  } else {
    console.warn(`[LLM Provider] No provider available for ${route} / ${useCase}`);
  }
}
