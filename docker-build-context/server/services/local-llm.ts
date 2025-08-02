import fetch from 'node-fetch';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface LocalLLMConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class LocalLLMService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json() as { models: Array<{ name: string }> };
      return data.models.map(m => m.name);
    } catch (error) {
      console.error('Error listing local models:', error);
      return [];
    }
  }

  async pullModel(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: model })
      });
      return response.ok;
    } catch (error) {
      console.error(`Error pulling model ${model}:`, error);
      return false;
    }
  }

  async generateResponse(prompt: string, config: LocalLLMConfig): Promise<{
    response: string;
    confidence?: number;
    error?: string;
  }> {
    try {
      const isRunning = await this.isOllamaRunning();
      if (!isRunning) {
        return {
          response: '',
          error: 'Ollama is not running. Please start Ollama first.'
        };
      }

      const availableModels = await this.listModels();
      if (!availableModels.includes(config.model)) {
        // Try to pull the model automatically
        console.log(`Model ${config.model} not found. Attempting to pull...`);
        const pulled = await this.pullModel(config.model);
        if (!pulled) {
          return {
            response: '',
            error: `Model ${config.model} not available and couldn't be pulled automatically.`
          };
        }
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: config.temperature || 0.7,
            num_predict: config.max_tokens || 1000
          }
        })
      });

      if (!response.ok) {
        return {
          response: '',
          error: `Ollama API error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json() as OllamaResponse;
      
      // Try to extract confidence from response if model provides it
      const confidenceMatch = data.response.match(/confidence:\s*(\d+)%?/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : undefined;

      return {
        response: data.response,
        confidence: confidence
      };

    } catch (error) {
      console.error('Error generating local LLM response:', error);
      return {
        response: '',
        error: `Local LLM error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async checkModelStatus(model: string): Promise<{
    available: boolean;
    size?: string;
    pulled?: boolean;
  }> {
    try {
      const availableModels = await this.listModels();
      const isAvailable = availableModels.includes(model);
      
      return {
        available: isAvailable,
        pulled: isAvailable
      };
    } catch (error) {
      return {
        available: false,
        pulled: false
      };
    }
  }
}

export const localLLM = new LocalLLMService();