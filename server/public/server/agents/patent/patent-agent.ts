import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class PatentAgent extends BaseAgent {
  constructor() {
    super("patent", `You are a cannabis patent specialist providing expert consultation.
    You help cannabis businesses optimize their patent processes and strategies.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis patent query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide patent guidance including:
    1. Current best practices
    2. Industry recommendations
    3. Risk assessment
    4. Implementation strategy
    5. Success metrics
    
    Respond with JSON containing:
    {
      "response": "detailed patent guidance",
      "confidence": 85,
      "sources": ["industry standards and references"],
      "metadata": {
        "category": "patent",
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

export const patentAgent = new PatentAgent();
