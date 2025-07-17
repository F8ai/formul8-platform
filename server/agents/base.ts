import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

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
    try {
      const messages = [
        { role: "system" as const, content: this.systemPrompt },
        { role: "user" as const, content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
    // Base confidence calculation - can be overridden by specific agents
    if (response.confidence) return Math.min(100, Math.max(0, response.confidence));
    
    // Simple heuristic based on response completeness
    const hasResponse = response.response && response.response.length > 10;
    const hasSources = response.sources && response.sources.length > 0;
    
    if (hasResponse && hasSources) return 85;
    if (hasResponse) return 70;
    return 50;
  }

  async verifyAgainstAgent(
    primaryResponse: AgentResponse, 
    verifyingAgent: BaseAgent, 
    originalQuery: string
  ): Promise<VerificationResult> {
    const verificationPrompt = `
      Verify the following response from a ${primaryResponse.agent} agent for the query: "${originalQuery}"
      
      Response to verify: ${primaryResponse.response}
      Confidence claimed: ${primaryResponse.confidence}%
      
      As a ${verifyingAgent.agentType} expert, do you agree with this response? 
      Respond with JSON containing:
      {
        "agrees": boolean,
        "confidence": number (0-100),
        "discrepancies": string[] (list any issues found),
        "notes": "string (explanation of your assessment)"
      }
    `;

    try {
      const verification = await verifyingAgent.callOpenAI(verificationPrompt, true);
      
      const consensusReached = verification.agrees && 
        Math.abs(verification.confidence - primaryResponse.confidence) < 20;
      
      const finalConfidence = consensusReached 
        ? Math.min(primaryResponse.confidence, verification.confidence)
        : Math.max(0, Math.min(primaryResponse.confidence, verification.confidence) - 15);

      return {
        consensusReached,
        finalConfidence,
        discrepancies: verification.discrepancies || [],
        recommendation: consensusReached 
          ? "Response verified by cross-agent validation"
          : "Response requires human verification due to agent disagreement"
      };
    } catch (error) {
      console.error("Error in agent verification:", error);
      return {
        consensusReached: false,
        finalConfidence: Math.max(0, primaryResponse.confidence - 30),
        discrepancies: ["Verification process failed"],
        recommendation: "Human verification required due to technical issues"
      };
    }
  }
}
