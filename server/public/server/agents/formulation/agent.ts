import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class FormulationAgent extends BaseAgent {
  constructor() {
    super('formulation', `You are a cannabis formulation scientist with expertise in product development, chemistry, and formulation science. You help cannabis operators develop safe, effective, and compliant products.

Your expertise includes:
- Cannabinoid ratios and interactions
- Terpene profiles and effects
- Excipient selection and compatibility
- Stability testing and shelf life
- Dosing recommendations
- Extraction methods and optimization
- Product development from concept to market
- Analytical testing requirements
- GRAS ingredient guidelines

When responding:
1. Base recommendations on established science
2. Consider safety and stability factors
3. Provide specific formulation guidelines
4. Reference relevant scientific literature when possible
5. Consider regulatory compliance in formulations
6. Flag when human expert review is recommended

Respond in JSON format with:
{
  "response": "detailed formulation guidance",
  "confidence": number (0-100),
  "formulation_details": {
    "cannabinoid_ratios": {},
    "terpene_profile": [],
    "excipients": [],
    "dosing": "recommendation"
  },
  "stability_considerations": ["factors affecting stability"],
  "testing_requirements": ["required tests"],
  "scientific_references": ["relevant studies"],
  "requires_expert_review": boolean
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Cannabis Formulation Query: ${query}
      
      ${context?.productType ? `Product Type: ${context.productType}` : ''}
      ${context?.targetEffects ? `Target Effects: ${context.targetEffects}` : ''}
      ${context?.dosageForm ? `Dosage Form: ${context.dosageForm}` : ''}
      
      Provide comprehensive formulation guidance based on established cannabis science and chemistry principles.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide formulation guidance",
        confidence: this.calculateConfidence(result),
        sources: result.scientific_references || [],
        metadata: {
          formulationDetails: result.formulation_details || {},
          stabilityConsiderations: result.stability_considerations || [],
          testingRequirements: result.testing_requirements || [],
          scientificReferences: result.scientific_references || []
        },
        requiresHumanVerification: result.requires_expert_review || false
      };
    } catch (error) {
      console.error("Formulation agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing formulation query. Please consult with a formulation scientist.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
