import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class CustomerSuccessAgent extends BaseAgent {
  constructor() {
    super("customer-success", `You are a cannabis customer-success specialist providing expert consultation.
    You help cannabis businesses optimize their customer-success processes and strategies.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis customer-success query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide customer-success guidance including:
    1. Current best practices
    2. Industry recommendations
    3. Risk assessment
    4. Implementation strategy
    5. Success metrics
    
    Respond with JSON containing:
    {
      "response": "detailed customer-success guidance",
      "confidence": 85,
      "sources": ["industry standards and references"],
      "metadata": {
        "category": "customer-success",
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

export const customerSuccessAgent = new CustomerSuccessAgent();
