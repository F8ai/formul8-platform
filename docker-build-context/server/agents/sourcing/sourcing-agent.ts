import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class SourcingAgent extends BaseAgent {
  constructor() {
    super("sourcing", `You are a cannabis sourcing specialist providing expert consultation.
    You help cannabis businesses optimize their sourcing processes and strategies.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis sourcing query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide sourcing guidance including:
    1. Current best practices
    2. Industry recommendations
    3. Risk assessment
    4. Implementation strategy
    5. Success metrics
    
    Respond with JSON containing:
    {
      "response": "detailed sourcing guidance",
      "confidence": 85,
      "sources": ["industry standards and references"],
      "metadata": {
        "category": "sourcing",
        "complexity": "low/medium/high",
        "implementation_time": "estimated_timeline",
        "success_factors": ["key success factors"]
      }
    }
    `;

    const result = await this.callOpenAI(prompt, true);
    
    return {
      agent: this.agentType,
      response: result.response,
      confidence: this.calculateConfidence(result),
      sources: result.sources || [],
      metadata: result.metadata || {},
      requiresHumanVerification: result.confidence < 70
    };
  }
}

export const sourcingAgent = new SourcingAgent();
