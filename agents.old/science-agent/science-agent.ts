import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class ScienceAgent extends BaseAgent {
  constructor() {
    super("science", `You are a cannabis science research specialist with access to PubMed and scientific literature. 
    You provide evidence-based analysis of cannabis research, validate scientific claims, and analyze research trends.
    Always cite your sources and indicate confidence levels.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    try {
      // Check if this is a literature search request
      if (query.toLowerCase().includes('literature') || query.toLowerCase().includes('research') || query.toLowerCase().includes('studies')) {
        return await this.performLiteratureSearch(query, context);
      }
      
      // Check if this is a claim validation request
      if (query.toLowerCase().includes('validate') || query.toLowerCase().includes('verify') || query.toLowerCase().includes('evidence')) {
        return await this.validateScientificClaim(query, context);
      }
      
      // General scientific query
      return await this.processGeneralQuery(query, context);
    } catch (error) {
      console.error("Error in Science Agent:", error);
      return {
        agent: this.agentType,
        response: "I encountered an error processing your scientific query. Please try again.",
        confidence: 0,
        requiresHumanVerification: true
      };
    }
  }

  private async performLiteratureSearch(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Perform a scientific literature search for: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide a comprehensive literature review response including:
    1. Key findings from relevant studies
    2. Quality of evidence assessment
    3. Research gaps identified
    4. Clinical significance
    5. Recommended next steps
    
    Respond with JSON containing:
    {
      "response": "detailed literature review with key findings",
      "confidence": 85,
      "sources": ["list of relevant studies/papers"],
      "metadata": {
        "search_terms": ["extracted search terms"],
        "evidence_quality": "high/moderate/low",
        "studies_found": 15,
        "research_gaps": ["identified gaps"]
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
      requiresHumanVerification: result.confidence < 70
    };
  }

  private async validateScientificClaim(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Validate the scientific claim: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide evidence-based validation including:
    1. Supporting evidence analysis
    2. Contradicting evidence review
    3. Overall evidence strength
    4. Limitations and caveats
    5. Validation conclusion
    
    Respond with JSON containing:
    {
      "response": "detailed validation analysis",
      "confidence": 80,
      "sources": ["supporting studies and evidence"],
      "metadata": {
        "validation_status": "supported/partially_supported/not_supported",
        "evidence_strength": "strong/moderate/weak",
        "supporting_studies": 8,
        "contradicting_studies": 2,
        "limitations": ["key limitations"]
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

  private async processGeneralQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Answer this cannabis science question: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide a scientific, evidence-based response covering:
    1. Direct answer to the question
    2. Supporting scientific evidence
    3. Relevant research findings
    4. Practical implications
    5. Areas for further research
    
    Respond with JSON containing:
    {
      "response": "comprehensive scientific answer",
      "confidence": 90,
      "sources": ["relevant studies and references"],
      "metadata": {
        "topic_areas": ["pharmacology", "biochemistry"],
        "research_quality": "high/moderate/low",
        "practical_applications": ["list of applications"]
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
      requiresHumanVerification: result.confidence < 70
    };
  }
}

export const scienceAgent = new ScienceAgent();
