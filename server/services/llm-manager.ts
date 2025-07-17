/**
 * LLM Manager Service
 * Handles multiple LLM providers and models for different agents
 */

import OpenAI from 'openai';

// Conditional import for Anthropic
let Anthropic: any = null;
try {
  Anthropic = require('@anthropic-ai/sdk').Anthropic;
} catch (error) {
  // Anthropic SDK not available
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  settings: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    [key: string]: any;
  };
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMManager {
  private openai: OpenAI | null = null;
  private anthropic: any = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize Anthropic if API key is available and SDK is installed
    if (process.env.ANTHROPIC_API_KEY && Anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Get the appropriate LLM configuration for an agent type
   */
  getAgentLLMConfig(agentType: string): LLMConfig {
    const configs: Record<string, LLMConfig> = {
      'compliance-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.1, // Lower temperature for regulatory accuracy
          maxTokens: 2000,
          topP: 0.9
        }
      },
      'formulation-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.2, // Slightly higher for creative formulations
          maxTokens: 3000,
          topP: 0.95
        }
      },
      'marketing-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.4, // Higher temperature for creative marketing
          maxTokens: 2500,
          topP: 0.95
        }
      },
      'science-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.15, // Lower temperature for scientific accuracy
          maxTokens: 4000,
          topP: 0.9
        }
      },
      'operations-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.3, // Balanced for practical operations
          maxTokens: 2000,
          topP: 0.9
        }
      },
      'sourcing-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.25, // Lower for procurement accuracy
          maxTokens: 2000,
          topP: 0.9
        }
      },
      'patent-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.1, // Very low for legal accuracy
          maxTokens: 3000,
          topP: 0.85
        }
      },
      'spectra-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.2, // Lower for technical analysis
          maxTokens: 2500,
          topP: 0.9
        }
      },
      'customer-success-agent': {
        provider: 'openai',
        model: 'gpt-4o',
        settings: {
          temperature: 0.3, // Balanced for customer interaction
          maxTokens: 2000,
          topP: 0.95
        }
      }
    };

    return configs[agentType] || configs['compliance-agent']; // Default fallback
  }

  /**
   * Generate a response using the appropriate LLM for the agent
   */
  async generateResponse(
    agentType: string,
    messages: LLMMessage[],
    customConfig?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const config = { ...this.getAgentLLMConfig(agentType), ...customConfig };

    switch (config.provider) {
      case 'openai':
        return this.generateOpenAIResponse(messages, config);
      case 'anthropic':
        if (this.anthropic) {
          return this.generateAnthropicResponse(messages, config);
        } else {
          // Fallback to OpenAI if Anthropic not available
          return this.generateOpenAIResponse(messages, { ...config, provider: 'openai', model: 'gpt-4o' });
        }
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    messages: LLMMessage[],
    config: LLMConfig
  ): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide OPENAI_API_KEY.');
    }

    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: config.settings.temperature || 0.3,
      max_tokens: config.settings.maxTokens || 2000,
      top_p: config.settings.topP || 0.9,
      frequency_penalty: config.settings.frequencyPenalty || 0,
      presence_penalty: config.settings.presencePenalty || 0,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  /**
   * Generate response using Anthropic Claude
   */
  private async generateAnthropicResponse(
    messages: LLMMessage[],
    config: LLMConfig
  ): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Please provide ANTHROPIC_API_KEY.');
    }

    // Separate system message from other messages
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: config.model,
      system: systemMessage,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      temperature: config.settings.temperature || 0.3,
      max_tokens: config.settings.maxTokens || 2000,
      top_p: config.settings.topP || 0.9,
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      } : undefined
    };
  }

  /**
   * Update LLM configuration for an agent
   */
  async updateAgentLLMConfig(agentType: string, config: Partial<LLMConfig>): Promise<void> {
    // This would typically update the database
    // For now, we'll just log the update
    console.log(`Updated LLM config for ${agentType}:`, config);
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: string): string[] {
    const models: Record<string, string[]> = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      google: ['gemini-pro', 'gemini-pro-vision'],
      local: ['ollama-llama2', 'ollama-codellama', 'ollama-mistral']
    };

    return models[provider] || [];
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: string): boolean {
    switch (provider) {
      case 'openai':
        return !!this.openai;
      case 'anthropic':
        return !!this.anthropic;
      case 'google':
        return !!process.env.GOOGLE_API_KEY;
      case 'local':
        return !!process.env.OLLAMA_URL;
      default:
        return false;
    }
  }
}

export const llmManager = new LLMManager();