/**
 * LLM Provider Selector
 * Routes LLM requests to appropriate providers based on interview route and use case
 * Supports: Groq (primary), Claude (UK premium), Gemini (fallback)
 */

export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn';
export type LLMUseCase = 'question_selection' | 'answer_scoring' | 'final_evaluation';

export interface LLMProviderConfig {
  provider: 'groq' | 'claude' | 'gemini' | 'openrouter';
  model: string;
  apiKey: string;
  baseUrl: string;
  useGeminiFormat?: boolean;
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
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    console.log(`[LLM Provider Debug] Available keys: Groq=${hasGroq}, Gemini=${hasGemini}, Anthropic=${hasAnthropic}`);
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

  // UK Scoring/Evaluation: Check for premium tier first
  if (route === 'uk_student' && (useCase === 'answer_scoring' || useCase === 'final_evaluation')) {
    // Option 1: Claude (if premium enabled)
    if (process.env.USE_PREMIUM_UK === 'true' && process.env.ANTHROPIC_API_KEY) {
      return {
        provider: 'claude',
        model: 'claude-3-haiku-20240307',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1',
      };
    }

    // Option 2: Groq Llama 3.3 70B (default)
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

  // France Scoring/Evaluation: Follow UK pattern (can use premium or Groq)
  if ((route === 'france_ema' || route === 'france_icn') && (useCase === 'answer_scoring' || useCase === 'final_evaluation')) {
    // Option 1: Claude (if premium enabled)
    if (process.env.USE_PREMIUM_FRANCE === 'true' && process.env.ANTHROPIC_API_KEY) {
      return {
        provider: 'claude',
        model: 'claude-3-haiku-20240307',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1',
      };
    }

    // Option 2: Groq Llama 3.3 70B (default)
    if (process.env.GROQ_API_KEY) {
      return {
        provider: 'groq',
        model: process.env.LLM_MODEL_SCORING || 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    }
  }

  // Fallback 1: Gemini
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      useGeminiFormat: true,
    };
  }

  // Fallback 2: OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      model: 'meta-llama/llama-3.1-70b-instruct',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    };
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
  maxTokens: number = 1500
): Promise<LLMResponse> {
  if (config.provider === 'groq' || config.provider === 'openrouter') {
    return callOpenAICompatible(config, systemPrompt, userPrompt, temperature, maxTokens);
  } else if (config.provider === 'claude') {
    return callClaude(config, systemPrompt, userPrompt, temperature, maxTokens);
  } else if (config.provider === 'gemini') {
    return callGemini(config, systemPrompt, userPrompt, temperature, maxTokens);
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

/**
 * Call OpenAI-compatible API (Groq, OpenRouter)
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
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${config.provider} API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
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
 * Call Claude API (Anthropic format)
 */
async function callClaude(
  config: LLMProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  // PERFORMANCE FIX: Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for Claude
  
  try {
    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    return {
      content,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Claude API timeout after 20 seconds');
    }
    throw error;
  }
}

/**
 * Call Gemini API (Google format)
 */
async function callGemini(
  config: LLMProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  // PERFORMANCE FIX: Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for Gemini
  
  try {
    const response = await fetch(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: combinedPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    return {
      content,
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Gemini API timeout after 20 seconds');
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
