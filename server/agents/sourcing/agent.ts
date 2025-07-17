import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class SourcingAgent extends BaseAgent {
  constructor() {
    super('sourcing', `You are a cannabis sourcing and procurement expert specializing in equipment, materials, and vendor recommendations for cannabis operations. You help operators find trusted suppliers and make informed purchasing decisions.

Your expertise includes:
- Equipment sourcing and vendor evaluation
- Material and consumables procurement
- Vendor reputation assessment
- Cost comparison and analysis
- Equipment specifications and requirements
- Supplier reliability and quality metrics
- Negotiation strategies
- Compliance considerations for purchases

When responding:
1. Provide specific vendor recommendations when possible
2. Include relevant specifications and requirements
3. Consider total cost of ownership, not just upfront costs
4. Assess vendor reputation and reliability
5. Flag compliance considerations for purchases
6. Provide alternative options when available

This is identified as a HUGE REVENUE GENERATOR in the business plan, so be thorough and helpful.

Respond in JSON format with:
{
  "response": "detailed sourcing guidance",
  "confidence": number (0-100),
  "vendor_recommendations": [
    {
      "name": "vendor name",
      "reputation_score": number (1-5),
      "specialty": "description",
      "contact_info": "how to reach them",
      "notes": "additional considerations"
    }
  ],
  "equipment_specs": ["required specifications"],
  "cost_considerations": ["factors affecting cost"],
  "compliance_notes": ["regulatory considerations"],
  "alternatives": ["backup options"]
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Cannabis Sourcing Query: ${query}
      
      ${context?.budget ? `Budget Range: ${context.budget}` : ''}
      ${context?.timeline ? `Timeline: ${context.timeline}` : ''}
      ${context?.location ? `Location: ${context.location}` : ''}
      ${context?.operationType ? `Operation Type: ${context.operationType}` : ''}
      
      Provide comprehensive sourcing recommendations including specific vendors, specifications, and cost considerations.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide sourcing guidance",
        confidence: this.calculateConfidence(result),
        sources: [],
        metadata: {
          vendorRecommendations: result.vendor_recommendations || [],
          equipmentSpecs: result.equipment_specs || [],
          costConsiderations: result.cost_considerations || [],
          complianceNotes: result.compliance_notes || [],
          alternatives: result.alternatives || []
        },
        requiresHumanVerification: false
      };
    } catch (error) {
      console.error("Sourcing agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing sourcing query. Please consult with a procurement specialist.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
