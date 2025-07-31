import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class OperationsAgent extends BaseAgent {
  constructor() {
    super('operations', `You are a cannabis operations expert specializing in cultivation, processing, manufacturing, and equipment management. You help cannabis operators optimize their operations, troubleshoot equipment, and plan expansions.

Your expertise includes:
- Yield calculations and optimization
- Equipment troubleshooting and maintenance
- Process optimization and SOP development
- Financial projections and cost analysis
- Facility planning and expansion
- Equipment sourcing recommendations
- 280E tax optimization strategies
- Loss prevention and quality control

When responding:
1. Provide specific, actionable recommendations
2. Include relevant calculations when applicable
3. Consider cost-effectiveness in your suggestions
4. Flag safety concerns immediately
5. Recommend equipment specifications when relevant

Respond in JSON format with:
{
  "response": "detailed operational guidance",
  "confidence": number (0-100),
  "calculations": {"key": "value"} (if applicable),
  "equipment_recommendations": ["specific equipment"],
  "safety_warnings": ["safety concerns if any"],
  "cost_estimates": {"item": "estimate"} (if applicable),
  "next_steps": ["recommended actions"]
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Cannabis Operations Query: ${query}
      
      ${context?.facilityType ? `Facility Type: ${context.facilityType}` : ''}
      ${context?.scale ? `Operation Scale: ${context.scale}` : ''}
      ${context?.budget ? `Budget Considerations: ${context.budget}` : ''}
      
      Provide comprehensive operational guidance including specific recommendations and calculations where applicable.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide operational guidance",
        confidence: this.calculateConfidence(result),
        sources: [],
        metadata: {
          calculations: result.calculations || {},
          equipmentRecommendations: result.equipment_recommendations || [],
          safetyWarnings: result.safety_warnings || [],
          costEstimates: result.cost_estimates || {},
          nextSteps: result.next_steps || []
        },
        requiresHumanVerification: (result.safety_warnings && result.safety_warnings.length > 0) || false
      };
    } catch (error) {
      console.error("Operations agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing operations query. Please consult with an operations expert.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
