interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface ModelPricing {
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
}

// Model pricing data (cost per 1K tokens)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI models
  'gpt-4o': { inputCostPer1kTokens: 0.0025, outputCostPer1kTokens: 0.01 },
  'gpt-4o-mini': { inputCostPer1kTokens: 0.00015, outputCostPer1kTokens: 0.0006 },
  'gpt-4-turbo': { inputCostPer1kTokens: 0.01, outputCostPer1kTokens: 0.03 },
  'gpt-3.5-turbo': { inputCostPer1kTokens: 0.0005, outputCostPer1kTokens: 0.0015 },
  'o1-preview': { inputCostPer1kTokens: 0.015, outputCostPer1kTokens: 0.06 },
  'o1-mini': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.012 },
  'o3': { inputCostPer1kTokens: 0.02, outputCostPer1kTokens: 0.08 },

  // Anthropic models
  'claude-3-5-sonnet-20241022': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015 },
  'claude-3-5-haiku-20241022': { inputCostPer1kTokens: 0.0008, outputCostPer1kTokens: 0.004 },
  'claude-3-opus-20240229': { inputCostPer1kTokens: 0.015, outputCostPer1kTokens: 0.075 },
  'claude-3-sonnet-20240229': { inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015 },

  // Google models
  'gemini-1.5-pro-002': { inputCostPer1kTokens: 0.00125, outputCostPer1kTokens: 0.005 },
  'gemini-2.0-flash-experimental': { inputCostPer1kTokens: 0.00075, outputCostPer1kTokens: 0.003 },

  // xAI models
  'grok-2-1212': { inputCostPer1kTokens: 0.002, outputCostPer1kTokens: 0.01 },
  'grok-2-vision-1212': { inputCostPer1kTokens: 0.002, outputCostPer1kTokens: 0.01 },

  // Local models (free)
  'llama3.2-1b': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
  'llama3.2-3b': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
  'phi3-mini': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
  'tinyllama': { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 },
};

export function estimateTokenCount(text: string): number {
  // Simple token estimation: roughly 4 characters per token for most models
  // This is an approximation - for exact counts, we'd need model-specific tokenizers
  return Math.ceil(text.length / 4);
}

export function calculateTokensAndCost(
  inputText: string,
  outputText: string,
  modelId: string
): TokenUsage {
  const inputTokens = estimateTokenCount(inputText);
  const outputTokens = estimateTokenCount(outputText);
  const totalTokens = inputTokens + outputTokens;

  const pricing = MODEL_PRICING[modelId] || { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 };
  
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1kTokens;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1kTokens;
  const estimatedCost = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost: Math.round(estimatedCost * 100000) / 100000 // Round to 5 decimal places
  };
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}‰`; // Show in per-mille for very small costs
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

// Extract token usage from API responses
export function extractTokenUsageFromResponse(response: any, modelId: string): TokenUsage | null {
  try {
    // OpenAI/xAI response format
    if (response.usage) {
      const { prompt_tokens, completion_tokens, total_tokens } = response.usage;
      const pricing = MODEL_PRICING[modelId] || { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 };
      
      const inputCost = (prompt_tokens / 1000) * pricing.inputCostPer1kTokens;
      const outputCost = (completion_tokens / 1000) * pricing.outputCostPer1kTokens;
      
      return {
        inputTokens: prompt_tokens,
        outputTokens: completion_tokens,
        totalTokens: total_tokens,
        estimatedCost: Math.round((inputCost + outputCost) * 100000) / 100000
      };
    }

    // Anthropic response format
    if (response.usage && response.usage.input_tokens) {
      const { input_tokens, output_tokens } = response.usage;
      const total_tokens = input_tokens + output_tokens;
      const pricing = MODEL_PRICING[modelId] || { inputCostPer1kTokens: 0, outputCostPer1kTokens: 0 };
      
      const inputCost = (input_tokens / 1000) * pricing.inputCostPer1kTokens;
      const outputCost = (output_tokens / 1000) * pricing.outputCostPer1kTokens;
      
      return {
        inputTokens: input_tokens,
        outputTokens: output_tokens,
        totalTokens: total_tokens,
        estimatedCost: Math.round((inputCost + outputCost) * 100000) / 100000
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting token usage:', error);
    return null;
  }
}