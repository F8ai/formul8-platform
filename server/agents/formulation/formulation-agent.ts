import { BaseAgent, type AgentResponse } from "../base/base-agent";

export class FormulationAgent extends BaseAgent {
  constructor() {
    super("formulation", `You are a cannabis formulation scientist with expertise in molecular analysis and product development.
    You help design cannabis formulations using chemical informatics and analytical chemistry.
    You have access to RDKit molecular analysis tools for advanced chemical calculations.
    Respond with JSON containing: response, confidence, sources, metadata.`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const prompt = `
    Cannabis formulation query: "${query}"
    
    Context: ${JSON.stringify(context || {})}
    
    Provide formulation guidance including:
    1. Chemical analysis and structure
    2. Formulation recommendations
    3. Stability considerations
    4. Dosing calculations
    5. Quality control parameters
    
    Note: For complex molecular analysis, recommend using the integrated RDKit dashboard.
    
    Respond with JSON containing:
    {
      "response": "detailed formulation guidance",
      "confidence": 90,
      "sources": ["analytical methods and references"],
      "metadata": {
        "formulation_type": "edibles/topicals/tinctures",
        "key_compounds": ["THC", "CBD", "terpenes"],
        "analysis_methods": ["HPLC", "GC-MS"],
        "rdkit_analysis": "molecular_properties_calculated"
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

export const formulationAgent = new FormulationAgent();
