import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class MarketingAgent extends BaseAgent {
  constructor() {
    super("marketing", `You are a cannabis marketing specialist with expertise in compliant advertising and automation.
    You help create marketing strategies that comply with platform restrictions and regulations.
    You have access to N8N workflow automation for campaign management.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis marketing query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide marketing guidance including:
    1. Platform-specific compliance strategies
    2. Creative workarounds for restricted platforms
    3. Automation workflow recommendations
    4. Performance metrics and KPIs
    5. Legal marketing boundaries
    
    Note: Automated workflows can be implemented using N8N integration.
    
    Respond with JSON containing:
    {
      "response": "comprehensive marketing strategy",
      "confidence": 88,
      "sources": ["platform policies and best practices"],
      "metadata": {
        "platforms": ["Instagram", "Google", "Weedmaps"],
        "compliance_level": "high/medium/low",
        "automation_potential": "workflow_recommendations",
        "estimated_reach": "audience_size_estimate"
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
      requiresHumanVerification: result.confidence < 75
    };
  }
}

export const marketingAgent = new MarketingAgent();
