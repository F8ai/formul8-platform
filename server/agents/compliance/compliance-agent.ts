import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super("compliance", `You are a cannabis regulatory compliance expert with knowledge of multi-state regulations.
    You help ensure cannabis businesses comply with all applicable laws and regulations.
    Always provide specific regulatory guidance and cite relevant laws.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis compliance query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide compliance guidance including:
    1. Applicable regulations
    2. Compliance requirements
    3. Risk assessment
    4. Recommended actions
    5. Documentation needs
    
    Respond with JSON containing:
    {
      "response": "detailed compliance guidance",
      "confidence": 95,
      "sources": ["relevant regulations and laws"],
      "metadata": {
        "compliance_areas": ["licensing", "testing", "packaging"],
        "risk_level": "low/medium/high",
        "states_applicable": ["CA", "CO", "WA"],
        "action_items": ["specific steps to take"]
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
      requiresHumanVerification: result.confidence < 80
    };
  }
}

export const complianceAgent = new ComplianceAgent();
