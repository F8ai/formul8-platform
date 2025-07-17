import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class CustomerSuccessAgent extends BaseAgent {
  constructor() {
    super("customer-success", `
You are the Customer Success Agent, a specialized AI system focused on customer support, sales enablement, and business intelligence for cannabis operations. You are an expert in:

1. Customer Support & Service:
   - Technical support for cannabis operations and equipment
   - Product usage guidance and troubleshooting
   - Regulatory compliance support for customers
   - Escalation protocols for complex inquiries
   - Knowledge base management and FAQ responses

2. Sales Enablement:
   - Lead qualification and opportunity assessment
   - Product recommendations based on customer needs
   - ROI calculations and business case development
   - Competitive positioning and differentiation
   - Sales process optimization and CRM integration

3. Business Intelligence & Analytics:
   - Customer usage pattern analysis
   - Market trend identification and reporting
   - Performance metrics and KPI tracking
   - Customer health scoring and churn prevention
   - Revenue optimization strategies

4. Onboarding & Training:
   - New customer onboarding workflows
   - Product training and certification programs
   - Best practices documentation and sharing
   - Success metric definition and tracking
   - User adoption and engagement strategies

5. Account Management:
   - Customer relationship management
   - Upselling and cross-selling opportunities
   - Contract renewal and expansion planning
   - Customer feedback collection and analysis
   - Satisfaction surveys and NPS tracking

6. Industry Expertise:
   - Cannabis market trends and opportunities
   - Regulatory landscape navigation for customers
   - Industry benchmarking and best practices
   - Networking and partnership facilitation
   - Market entry and expansion strategies

Always provide:
- Customer-focused solutions and recommendations
- Clear next steps and action items
- Appropriate escalation guidance when needed
- Business impact and ROI considerations
- Confidence levels for recommendations

Respond in JSON format with: response, confidence, sources, metadata, and requiresHumanVerification fields.
    `);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const supportPrompt = `
As the Customer Success Agent specializing in customer support, sales enablement, and business intelligence for cannabis operations, please analyze this query:

Query: "${query}"

Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Based on your expertise in:
- Customer support and technical assistance
- Sales process optimization and lead qualification
- Business intelligence and market analysis
- Customer onboarding and training programs
- Account management and relationship building
- Cannabis industry trends and opportunities

Provide a comprehensive response that includes:
1. Direct solution or guidance for the query
2. Relevant business impact considerations
3. Customer success best practices
4. Appropriate escalation recommendations if needed
5. Follow-up actions or next steps

Consider factors like:
- Customer satisfaction and retention
- Revenue impact and ROI
- Market positioning and competitive advantage
- Regulatory compliance for customers
- Scalability and growth opportunities
- Industry-specific challenges and solutions

Determine if this requires human escalation based on:
- Complex technical issues beyond standard support
- High-value customer concerns or complaints
- Legal or compliance questions requiring expertise
- Strategic business decisions or partnerships
- Sensitive customer relationship matters

Respond with JSON containing:
{
  "response": "comprehensive customer success guidance and recommendations",
  "confidence": confidence_score_0_to_100,
  "sources": ["relevant_support_resources", "industry_best_practices"],
  "metadata": {
    "queryType": "support|sales|business_intelligence|onboarding|account_management",
    "customerImpact": "description_of_potential_customer_impact",
    "businessValue": "revenue_or_strategic_implications",
    "recommendedActions": ["specific_actionable_steps"],
    "escalationLevel": "none|technical|management|executive",
    "followUpRequired": boolean_if_followup_needed,
    "marketOpportunity": "any_identified_market_opportunities"
  },
  "requiresHumanVerification": boolean_for_complex_customer_or_business_issues
}`;

    try {
      const result = await this.callOpenAI(supportPrompt, true);
      
      // Validate and enhance the response
      const confidence = this.calculateConfidence(result);
      const enhancedResult = {
        ...result,
        confidence,
        agent: 'customer-success',
        sources: result.sources || ['Customer success best practices', 'Cannabis industry benchmarks'],
        metadata: {
          ...result.metadata,
          queryType: result.metadata?.queryType || 'support',
          processingTimestamp: new Date().toISOString(),
        }
      };

      // Flag for human verification for sensitive customer issues
      if (query.toLowerCase().includes('complaint') || 
          query.toLowerCase().includes('cancel') || 
          query.toLowerCase().includes('refund') ||
          query.toLowerCase().includes('legal') ||
          result.metadata?.escalationLevel === 'executive' ||
          confidence < 70) {
        enhancedResult.requiresHumanVerification = true;
      }

      return enhancedResult;

    } catch (error) {
      console.error("Error in Customer Success agent:", error);
      return {
        agent: 'customer-success',
        response: "I encountered an error processing your customer success query. For immediate assistance with customer issues, please contact our support team directly or try rephrasing your question.",
        confidence: 0,
        sources: [],
        metadata: { 
          error: error.message,
          escalationLevel: 'technical',
          requiresHumanVerification: true 
        },
        requiresHumanVerification: true,
      };
    }
  }

  protected calculateConfidence(response: any): number {
    let confidence = super.calculateConfidence(response);
    
    // Boost confidence for standard support queries
    if (response.metadata?.queryType === 'support' && 
        response.response.length > 150) {
      confidence = Math.min(100, confidence + 15);
    }
    
    // Reduce confidence for complex business intelligence queries
    if (response.metadata?.queryType === 'business_intelligence' && 
        !response.sources?.length) {
      confidence = Math.max(40, confidence - 20);
    }
    
    // High confidence for sales enablement with clear recommendations
    if (response.metadata?.queryType === 'sales' && 
        response.metadata?.recommendedActions?.length > 0) {
      confidence = Math.min(100, confidence + 10);
    }
    
    // Lower confidence for queries requiring executive escalation
    if (response.metadata?.escalationLevel === 'executive') {
      confidence = Math.max(30, confidence - 25);
    }
    
    // Boost confidence for customer onboarding guidance
    if (response.metadata?.queryType === 'onboarding' && 
        response.metadata?.recommendedActions?.length > 2) {
      confidence = Math.min(100, confidence + 12);
    }
    
    return confidence;
  }
}