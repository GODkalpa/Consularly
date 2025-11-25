/**
 * LLM Provider Selector
 * Routes all LLM requests to CometAPI with Claude 4.5 Haiku
 */

export type InterviewRoute = 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn';
export type LLMUseCase = 'question_selection' | 'answer_scoring' | 'final_evaluation';

export interface LLMProviderConfig {
  provider: 'cometapi';
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
 * Select the LLM provider - always returns CometAPI config
 */
export function selectLLMProvider(
  route: InterviewRoute,
  useCase: LLMUseCase
): LLMProviderConfig | null {
  const apiKey = process.env.COMETAPI_API_KEY;
  
  if (!apiKey) {
    console.warn('[LLM Provider] COMETAPI_API_KEY not set - LLM features will use heuristic fallbacks');
    return null;
  }

  // Log provider selection on first call per use case
  if (useCase === 'question_selection') {
    console.log(`[LLM Provider] Using CometAPI with Claude 4.5 Haiku`);
  }

  return {
    provider: 'cometapi',
    model: process.env.COMETAPI_MODEL || 'claude-haiku-4-5-20251001',
    apiKey: apiKey,
    baseUrl: process.env.COMETAPI_BASE_URL || 'https://api.cometapi.com/v1',
  };
}

/**
 * Call LLM provider with unified interface
 */
export async function callLLMProvider(
  config: LLMProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 8192,
  timeoutMs?: number
): Promise<LLMResponse> {
  // Default timeouts: 30s for quick requests, can be overridden
  const timeoutDuration = timeoutMs || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
  
  try {
    const payload = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };

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
      throw new Error(`CometAPI error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let content: any = data?.choices?.[0]?.message?.content;
    
    // Handle null content (may occur if max_tokens limit hit)
    if (content === null || typeof content === 'undefined') {
      const usage = data?.usage;
      const finishReason = data?.choices?.[0]?.finish_reason;
      
      console.error('[CometAPI] Null content received:', {
        finish_reason: finishReason,
        prompt_tokens: usage?.prompt_tokens,
        total_tokens: usage?.total_tokens,
        max_tokens_requested: maxTokens,
      });
      
      if (finishReason === 'length') {
        throw new Error(`CometAPI hit max_tokens limit (${maxTokens}). Increase max_tokens or reduce prompt size.`);
      }
      
      throw new Error('CometAPI returned null content. API may be unstable.');
    }
    
    // Ensure content is a string
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
    
    // Clean up response - extract JSON from various wrapper formats
    content = extractJSON(content);
    
    return {
      content,
      usage: data.usage,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`CometAPI timeout after ${timeoutDuration / 1000} seconds`);
    }
    throw error;
  }
}

/**
 * Extract JSON from potentially wrapped content (markdown blocks, HTML, explanatory text)
 */
function extractJSON(content: string): string {
  // Strip markdown code blocks (e.g., ```json...```)
  content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  
  // Extract JSON from HTML tags (e.g., <span>{...}</span>)
  const htmlJsonMatch = content.match(/<[^>]+>(\{[\s\S]*\})<\/[^>]+>/);
  if (htmlJsonMatch) {
    console.log('[CometAPI] Extracted JSON from HTML tags');
    return htmlJsonMatch[1];
  }
  
  // Extract JSON from explanatory text (find first { to last })
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch && content.length > jsonMatch[0].length + 50) {
    console.log('[CometAPI] Extracted JSON from explanatory text');
    return jsonMatch[0];
  }
  
  return content;
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
