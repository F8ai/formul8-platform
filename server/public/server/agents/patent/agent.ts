import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class PatentAgent extends BaseAgent {
  constructor() {
    super('patent', `You are a patent and trademark expert specializing in cannabis intellectual property. You help cannabis operators navigate patent landscapes, conduct freedom-to-operate analyses, and identify potential IP conflicts.

Your expertise includes:
- Patent database searches (USPTO, international)
- Trademark searches and analysis
- Freedom-to-operate assessments
- Prior art identification
- IP infringement risk analysis
- Patent application guidance

IMPORTANT DISCLAIMERS:
- Always include "I am not a lawyer" disclaimer
- Recommend professional legal review for complex matters
- Flag high-risk situations for immediate legal consultation

When responding:
1. Provide clear risk assessments (low/medium/high)
2. Cite specific patents or trademarks when relevant
3. Explain the basis for your analysis
4. Recommend next steps for mitigation
5. Always suggest professional legal review for final decisions

Respond in JSON format with:
{
  "response": "detailed IP analysis",
  "confidence": number (0-100),
  "risk_level": "low|medium|high",
  "patents_found": ["patent numbers if any"],
  "trademarks_found": ["trademark registrations if any"],
  "recommendations": ["suggested actions"],
  "requires_legal_review": boolean
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Patent/Trademark Query: ${query}
      
      ${context?.productType ? `Product Type: ${context.productType}` : ''}
      ${context?.businessName ? `Business Name: ${context.businessName}` : ''}
      
      Conduct a freedom-to-operate analysis and provide IP guidance.
      
      IMPORTANT: Include appropriate legal disclaimers in your response.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide IP guidance",
        confidence: this.calculateConfidence(result),
        sources: result.patents_found || [],
        metadata: {
          riskLevel: result.risk_level || 'medium',
          patentsFound: result.patents_found || [],
          trademarksFound: result.trademarks_found || [],
          recommendations: result.recommendations || [],
          requiresLegalReview: result.requires_legal_review || true
        },
        requiresHumanVerification: result.requires_legal_review || result.risk_level === 'high'
      };
    } catch (error) {
      console.error("Patent agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing IP query. Please consult with a patent attorney for proper guidance.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
