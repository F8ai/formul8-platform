import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class MarketingAgent extends BaseAgent {
  constructor() {
    super('marketing', `You are a cannabis marketing expert specializing in compliant marketing strategies, content creation, and brand positioning for cannabis businesses. You help operators develop effective marketing while staying within regulatory boundaries.

Your expertise includes:
- Compliant copywriting and content creation
- Brand positioning and messaging
- Market analysis and competitive intelligence
- Digital marketing strategies
- Packaging and label design guidance
- Social media compliance
- Advertising regulations by jurisdiction
- Consumer education content
- Market research and pricing strategies

When responding:
1. Always prioritize compliance with advertising regulations
2. Flag content that may appeal to minors
3. Ensure health claims are appropriate and legal
4. Consider jurisdiction-specific marketing rules
5. Provide specific, actionable marketing recommendations
6. Cross-reference with compliance requirements

Respond in JSON format with:
{
  "response": "detailed marketing guidance",
  "confidence": number (0-100),
  "content_suggestions": ["specific content ideas"],
  "compliance_warnings": ["potential compliance issues"],
  "target_audience": "recommended audience",
  "messaging_framework": ["key messages"],
  "channel_recommendations": ["marketing channels"],
  "compliance_verified": boolean
}`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
      Cannabis Marketing Query: ${query}
      
      ${context?.jurisdiction ? `Jurisdiction: ${context.jurisdiction}` : ''}
      ${context?.productType ? `Product Type: ${context.productType}` : ''}
      ${context?.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
      ${context?.brand ? `Brand: ${context.brand}` : ''}
      
      Provide comprehensive marketing guidance that is fully compliant with cannabis advertising regulations.
      
      CRITICAL: Ensure all recommendations comply with cannabis marketing laws and do not appeal to minors.
    `;

    try {
      const result = await this.callOpenAI(prompt, true);
      
      const hasComplianceWarnings = result.compliance_warnings && result.compliance_warnings.length > 0;
      
      return {
        agent: this.agentType,
        response: result.response || "Unable to provide marketing guidance",
        confidence: this.calculateConfidence(result),
        sources: [],
        metadata: {
          contentSuggestions: result.content_suggestions || [],
          complianceWarnings: result.compliance_warnings || [],
          targetAudience: result.target_audience || '',
          messagingFramework: result.messaging_framework || [],
          channelRecommendations: result.channel_recommendations || [],
          complianceVerified: result.compliance_verified || false
        },
        requiresHumanVerification: hasComplianceWarnings || !result.compliance_verified
      };
    } catch (error) {
      console.error("Marketing agent error:", error);
      return {
        agent: this.agentType,
        response: "Error processing marketing query. Please consult with a cannabis marketing specialist.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }
}
