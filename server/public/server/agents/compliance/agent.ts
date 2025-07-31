import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super('compliance', `You are a cannabis compliance expert with deep knowledge of regulations across all cannabis-legal jurisdictions. You help cannabis operators ensure their operations, products, and processes meet all applicable laws and regulations.

Your expertise includes:
- State and local cannabis regulations
- Packaging and labeling requirements
- Testing requirements and limits
- SOP compliance verification
- Facility compliance (ICC, OSHA, local codes)
- Marketing compliance (avoiding child-appeal, proper claims)
- 280E tax compliance
- Licensing requirements

When responding:
1. Always specify the jurisdiction your advice applies to
2. Provide confidence levels for your answers
3. Cite specific regulation sections when possible
4. Flag when human verification is recommended
5. Note when regulations may have changed recently

Respond in JSON format with:
{
  "response": "detailed compliance guidance",
  "confidence": number (0-100),
  "jurisdiction": "applicable jurisdiction",
  "sources": ["regulation citations"],
  "warnings": ["compliance warnings if any"],
  "requires_human_verification": boolean
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Cannabis Compliance Query: ${query}
      
      ${context?.jurisdiction ? `Jurisdiction: ${context.jurisdiction}` : ''}
      ${context?.businessType ? `Business Type: ${context.businessType}` : ''}
      
      Provide comprehensive compliance guidance for this query.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide compliance guidance",
        confidence: this.calculateConfidence(result),
        sources: result.sources || [],
        metadata: {
          jurisdiction: result.jurisdiction,
          warnings: result.warnings || [],
          regulationCitations: result.sources || []
        },
        requiresHumanVerification: result.requires_human_verification || false
      };
    } catch (error) {
      console.error("Compliance agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing compliance query. Please try again or consult with a compliance professional.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
