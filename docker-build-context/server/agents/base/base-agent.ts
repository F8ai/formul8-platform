import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

export interface VerificationResult {
  consensusReached: boolean;
  finalConfidence: number;
  discrepancies?: string[];
  recommendation: string;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected systemPrompt: string;

  constructor(agentType: string, systemPrompt: string) {
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
  }

  abstract processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse>;

  protected async callOpenAI(prompt: string, useJson = true): Promise<any> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const messages = [
        { role: "system" as const, content: this.systemPrompt },
        { role: "user" as const, content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        ...(useJson && { response_format: { type: "json_object" as const } }),
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      return useJson ? JSON.parse(content || "{}") : content;
    } catch (error) {
      console.error(`Error in ${this.agentType} agent:`, error);
      throw new Error(`Failed to process query with ${this.agentType} agent`);
    }
  }

  protected calculateConfidence(response: any): number {
    if (response.confidence) return Math.min(100, Math.max(0, response.confidence));
    
    const hasResponse = response.response && response.response.length > 10;
    const hasSources = response.sources && response.sources.length > 0;
    
    if (hasResponse && hasSources) return 85;
    if (hasResponse) return 70;
    return 50;
  }
}
