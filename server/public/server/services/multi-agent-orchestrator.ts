import { baselineManager } from './baseline-manager';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  concerns: string[];
  recommendations: string[];
  requiresFollowUp: boolean;
  crossReferences: string[];
}

export interface MultiAgentQuery {
  id: string;
  originalQuery: string;
  primaryAgent: string;
  involvedAgents: string[];
  responses: AgentResponse[];
  consensus: string;
  finalRecommendation: string;
  riskAssessment: string;
  timestamp: string;
}

export class MultiAgentOrchestrator {
  private agentSpecializations = {
    'formulation-agent': {
      expertise: 'molecular analysis, chemical formulation, ingredient compatibility, stability testing',
      context: 'cannabis formulation scientist with expertise in product development, molecular analysis, and chemical composition'
    },
    'science-agent': {
      expertise: 'scientific literature, research validation, clinical studies, safety data',
      context: 'cannabis research scientist with expertise in scientific literature, clinical trials, and evidence-based analysis'
    },
    'compliance-agent': {
      expertise: 'regulatory requirements, legal compliance, safety regulations, FDA guidelines',
      context: 'cannabis compliance expert specializing in regulatory requirements, licensing, and legal compliance'
    },
    'operations-agent': {
      expertise: 'manufacturing processes, quality control, production safety, facility management',
      context: 'cannabis operations specialist focused on facility management, production optimization, and workflow automation'
    },
    'customer-success-agent': {
      expertise: 'customer safety, user experience, market acceptance, consumer education',
      context: 'cannabis customer success expert specializing in customer satisfaction, safety, and business analytics'
    }
  };

  async processMultiAgentQuery(query: string, primaryAgent: string): Promise<MultiAgentQuery> {
    const queryId = `ma_${Date.now()}`;
    
    // Determine which agents should be involved based on the query
    const involvedAgents = this.determineInvolvedAgents(query, primaryAgent);
    
    // Get responses from each agent
    const responses: AgentResponse[] = [];
    
    for (const agentName of involvedAgents) {
      const response = await this.getAgentResponse(agentName, query, responses);
      responses.push(response);
    }
    
    // Generate consensus and final recommendation
    const consensus = await this.generateConsensus(query, responses);
    const finalRecommendation = await this.generateFinalRecommendation(query, responses, consensus);
    const riskAssessment = await this.generateRiskAssessment(query, responses);
    
    return {
      id: queryId,
      originalQuery: query,
      primaryAgent,
      involvedAgents,
      responses,
      consensus,
      finalRecommendation,
      riskAssessment,
      timestamp: new Date().toISOString()
    };
  }

  private determineInvolvedAgents(query: string, primaryAgent: string): string[] {
    const queryLower = query.toLowerCase();
    const agents = new Set([primaryAgent]);
    
    // CBD topical with DMSO query would involve multiple agents
    if (queryLower.includes('dmso') || queryLower.includes('permeability')) {
      agents.add('formulation-agent');
      agents.add('science-agent');
      agents.add('compliance-agent');
      agents.add('operations-agent');
    }
    
    if (queryLower.includes('topical') || queryLower.includes('skin')) {
      agents.add('formulation-agent');
      agents.add('science-agent');
      agents.add('compliance-agent');
    }
    
    if (queryLower.includes('terpene') || queryLower.includes('safety')) {
      agents.add('formulation-agent');
      agents.add('science-agent');
      agents.add('compliance-agent');
    }
    
    if (queryLower.includes('regulatory') || queryLower.includes('legal')) {
      agents.add('compliance-agent');
    }
    
    if (queryLower.includes('manufacturing') || queryLower.includes('production')) {
      agents.add('operations-agent');
    }
    
    if (queryLower.includes('customer') || queryLower.includes('user')) {
      agents.add('customer-success-agent');
    }
    
    return Array.from(agents);
  }

  private async getAgentResponse(agentName: string, query: string, priorResponses: AgentResponse[]): Promise<AgentResponse> {
    const agentSpec = this.agentSpecializations[agentName];
    if (!agentSpec) {
      throw new Error(`Unknown agent: ${agentName}`);
    }
    
    // Include prior responses for context
    const contextFromPriorResponses = priorResponses.length > 0 
      ? `\n\nPrior agent responses to consider:\n${priorResponses.map(r => `${r.agent}: ${r.response}`).join('\n')}`
      : '';
    
    const systemPrompt = `You are a ${agentSpec.context}. 
    
Your areas of expertise include: ${agentSpec.expertise}.

When responding to queries:
1. Focus on your specific domain expertise
2. Identify any safety concerns or risks
3. Provide specific recommendations
4. Note if you need input from other specialists
5. Reference any cross-dependencies with other agents
6. Assess your confidence level in the response

Be thorough but focused on your specialty area.${contextFromPriorResponses}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${query}

Please provide your expert analysis focusing on your specialty area. Include:
- Your main response and recommendations
- Any safety concerns or risks you identify
- Specific recommendations for this formulation
- Whether you need input from other specialists
- Your confidence level (0-100)`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const responseText = response.choices[0].message.content || "No response generated";
    
    // Parse response to extract structured information
    const concerns = this.extractConcerns(responseText);
    const recommendations = this.extractRecommendations(responseText);
    const confidence = this.extractConfidence(responseText);
    const crossReferences = this.extractCrossReferences(responseText);
    const requiresFollowUp = this.determineFollowUpNeeded(responseText);
    
    return {
      agent: agentName,
      response: responseText,
      confidence,
      concerns,
      recommendations,
      requiresFollowUp,
      crossReferences
    };
  }

  private async generateConsensus(query: string, responses: AgentResponse[]): Promise<string> {
    const allResponses = responses.map(r => `${r.agent}: ${r.response}`).join('\n\n');
    
    const consensusPrompt = `Based on the following expert responses to the query: "${query}"

${allResponses}

Generate a consensus summary that:
1. Identifies areas of agreement among the experts
2. Highlights any conflicting viewpoints
3. Synthesizes the key findings
4. Provides a balanced perspective

Focus on creating a unified understanding from the multiple expert perspectives.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at synthesizing multiple specialist opinions into a coherent consensus."
        },
        {
          role: "user",
          content: consensusPrompt
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });

    return response.choices[0].message.content || "No consensus generated";
  }

  private async generateFinalRecommendation(query: string, responses: AgentResponse[], consensus: string): Promise<string> {
    const allConcerns = responses.flatMap(r => r.concerns);
    const allRecommendations = responses.flatMap(r => r.recommendations);
    
    const recommendationPrompt = `Based on the multi-agent analysis of: "${query}"

Consensus: ${consensus}

Key concerns identified: ${allConcerns.join(', ')}
Key recommendations: ${allRecommendations.join(', ')}

Provide a final, actionable recommendation that:
1. Addresses the original query
2. Considers all safety concerns
3. Provides clear next steps
4. Indicates risk level (Low/Medium/High)
5. Suggests additional research or testing needed`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a senior consultant providing final recommendations based on multi-expert analysis."
        },
        {
          role: "user",
          content: recommendationPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    return response.choices[0].message.content || "No final recommendation generated";
  }

  private async generateRiskAssessment(query: string, responses: AgentResponse[]): Promise<string> {
    const allConcerns = responses.flatMap(r => r.concerns);
    const lowConfidenceResponses = responses.filter(r => r.confidence < 70);
    
    const riskPrompt = `Assess the risk level for: "${query}"

Concerns identified: ${allConcerns.join(', ')}
Low confidence responses: ${lowConfidenceResponses.map(r => r.agent).join(', ')}

Provide a risk assessment that categorizes the risk as:
- LOW: Well-established practices with minimal concerns
- MEDIUM: Some concerns that can be mitigated with proper precautions
- HIGH: Significant safety, legal, or technical concerns requiring extensive research

Include specific risk factors and mitigation strategies.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a risk assessment specialist for cannabis product development."
        },
        {
          role: "user",
          content: riskPrompt
        }
      ],
      max_tokens: 400,
      temperature: 0.1
    });

    return response.choices[0].message.content || "No risk assessment generated";
  }

  private extractConcerns(text: string): string[] {
    const concerns: string[] = [];
    const concernPatterns = [
      /concern[s]?[:\s]+([^.]+)/gi,
      /risk[s]?[:\s]+([^.]+)/gi,
      /warning[s]?[:\s]+([^.]+)/gi,
      /caution[s]?[:\s]+([^.]+)/gi
    ];
    
    concernPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concerns.push(...matches.map(match => match.trim()));
      }
    });
    
    return concerns.slice(0, 3); // Limit to top 3 concerns
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const recPatterns = [
      /recommend[s]?[:\s]+([^.]+)/gi,
      /suggest[s]?[:\s]+([^.]+)/gi,
      /should[:\s]+([^.]+)/gi
    ];
    
    recPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        recommendations.push(...matches.map(match => match.trim()));
      }
    });
    
    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    // Default confidence based on response quality
    if (text.includes('uncertain') || text.includes('unclear')) return 40;
    if (text.includes('likely') || text.includes('probably')) return 70;
    if (text.includes('definitely') || text.includes('certainly')) return 90;
    
    return 60; // Default moderate confidence
  }

  private extractCrossReferences(text: string): string[] {
    const crossRefs: string[] = [];
    const agentNames = Object.keys(this.agentSpecializations);
    
    agentNames.forEach(agent => {
      const agentType = agent.replace('-agent', '');
      if (text.toLowerCase().includes(agentType) || text.toLowerCase().includes(agent)) {
        crossRefs.push(agent);
      }
    });
    
    return crossRefs;
  }

  private determineFollowUpNeeded(text: string): boolean {
    const followUpIndicators = [
      'need more information',
      'require additional',
      'further research',
      'consult with',
      'recommend testing',
      'need input from'
    ];
    
    return followUpIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
  }
}

export const multiAgentOrchestrator = new MultiAgentOrchestrator();