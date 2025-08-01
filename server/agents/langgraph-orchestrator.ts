import OpenAI from "openai";
import { ComplianceAgent } from "./compliance/index.js";
import { FormulationAgent } from "./formulation/index.js";
import { PatentAgent } from "./patent/index.js";
import { OperationsAgent } from "./operations/index.js";
import { SourcingAgent } from "./sourcing/index.js";
import { MarketingAgent } from "./marketing/index.js";
import { SpectraAgent } from "./spectra/index.js";
// import { CustomerSuccessAgent } from "./customer-success/index.js";
import type { AgentResponse } from "./base";

// Define the state structure for our multi-agent system (simplified for now)
export interface AgentStateType {
  messages: any[];
  originalQuery: string;
  primaryResponse: AgentResponse | null;
  verificationResponses: AgentResponse[];
  consensusReached: boolean;
  finalConfidence: number;
  requiresHumanReview: boolean;
  agentType: string;
  context: Record<string, any>;
}

export class LangGraphOrchestrator {
  private openai: OpenAI | null;
  private agents: Map<string, any>;
  private conversationHistory: Map<string, any[]>;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found - LangGraph features will be limited");
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    this.conversationHistory = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    this.agents = new Map([
      ['compliance', new ComplianceAgent()],
      ['formulation', new FormulationAgent()],
      ['patent', new PatentAgent()],
      ['operations', new OperationsAgent()],
      ['sourcing', new SourcingAgent()],
      ['marketing', new MarketingAgent()],
      ['spectra', new SpectraAgent()],
      // ['customer-success', new CustomerSuccessAgent()], // Temporarily disabled
    ]);
  }

  // Simplified workflow orchestration without LangGraph dependencies
  private async orchestrateWorkflow(state: AgentStateType): Promise<any> {
    try {
      // Step 1: Route query to appropriate agent
      await this.routeQuery(state);
      
      // Step 2: Process with primary agent
      await this.processPrimaryQuery(state);
      
      // Step 3: Perform verification if needed
      await this.performVerification(state);
      
      // Step 4: Build consensus
      await this.buildConsensus(state);
      
      // Step 5: Request human review if needed
      if (state.requiresHumanReview) {
        await this.requestHumanReview(state);
      }
      
      // Step 6: Finalize response
      return await this.finalizeResponse(state);
    } catch (error) {
      console.error("Error in workflow orchestration:", error);
      throw error;
    }
  }

  // Route incoming queries to appropriate primary agent
  private async routeQuery(state: AgentStateType): Promise<void> {
    const query = state.originalQuery;

    const routingPrompt = `
      Analyze this cannabis industry query and determine the most appropriate primary agent:
      
      Query: "${query}"
      
      Available agents:
      - compliance: Regulatory, legal, licensing, SOP validation
      - formulation: Product development, cannabinoid profiles, recipes
      - patent: Intellectual property, trademarks, patent searches
      - operations: Equipment, manufacturing, facility management
      - sourcing: Suppliers, vendors, procurement, materials
      - marketing: Branding, advertising, content, customer engagement
      - spectra: CoA analysis, chromatography data, testing compliance, quality control
      - customer-success: Customer support, sales enablement, business intelligence, account management
      
      Respond with JSON: {"agent": "agent_name", "reasoning": "brief explanation"}
    `;

    try {
      if (!this.openai) {
        // Fallback routing based on keywords
        state.agentType = this.getAgentByKeywords(query);
        state.context = { routingReasoning: "Keyword-based routing (no OpenAI key)" };
        return;
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: routingPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const routing = JSON.parse(response.choices[0].message.content || "{}");
      
      state.agentType = routing.agent || "compliance";
      state.context = { ...state.context, routingReasoning: routing.reasoning };
    } catch (error) {
      console.error("Error in query routing:", error);
      // Default to compliance for cannabis-related queries
      state.agentType = "compliance";
      state.context = { ...state.context, routingReasoning: "Default routing due to error" };
    }
  }

  // Process query with the primary agent
  private async processPrimaryQuery(state: AgentStateType): Promise<void> {
    const agent = this.agents.get(state.agentType);
    if (!agent) {
      throw new Error(`Agent ${state.agentType} not found`);
    }

    try {
      const response = await agent.processQuery(state.originalQuery, state.context);
      state.primaryResponse = response;
      state.messages.push({
        role: "assistant",
        content: `Primary agent (${state.agentType}) processed query with ${response.confidence}% confidence`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error in primary agent ${state.agentType}:`, error);
      
      state.primaryResponse = {
        agent: state.agentType,
        response: "Error processing query",
        confidence: 0,
        requiresHumanVerification: true,
      };
      state.messages.push({
        role: "assistant",
        content: "Error in primary agent processing",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Perform cross-agent verification for high-stakes queries
  private async performVerification(state: AgentStateType): Promise<void> {
    if (!state.primaryResponse || state.primaryResponse.confidence < 70) {
      // Low confidence responses need verification
      const verificationAgents = this.selectVerificationAgents(state.agentType, state.originalQuery);
      const verifications: AgentResponse[] = [];

      for (const agentType of verificationAgents) {
        const agent = this.agents.get(agentType);
        if (agent && agent.verifyAgainstAgent) {
          try {
            const verification = await agent.verifyAgainstAgent(
              state.primaryResponse,
              agent,
              state.originalQuery
            );
            
            const verificationResponse: AgentResponse = {
              agent: agentType,
              response: verification.recommendation,
              confidence: verification.finalConfidence,
              metadata: {
                consensusReached: verification.consensusReached,
                discrepancies: verification.discrepancies,
              },
            };
            
            verifications.push(verificationResponse);
          } catch (error) {
            console.error(`Verification error with ${agentType}:`, error);
          }
        }
      }

      state.verificationResponses = verifications;
      state.messages.push({
        role: "assistant",
        content: `Performed verification with ${verifications.length} agents`,
        timestamp: new Date().toISOString(),
      });
    } else {
      state.messages.push({
        role: "assistant",
        content: "High confidence response - skipping verification",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Build consensus from multiple agent responses
  private async buildConsensus(state: AgentStateType): Promise<void> {
    if (!state.verificationResponses || state.verificationResponses.length === 0) {
      state.consensusReached = true;
      state.finalConfidence = state.primaryResponse?.confidence || 0;
      state.requiresHumanReview = state.finalConfidence < 75;
      return;
    }

    const allResponses = [state.primaryResponse, ...state.verificationResponses].filter(Boolean);
    const averageConfidence = allResponses.reduce((sum, r) => sum + (r?.confidence || 0), 0) / allResponses.length;
    
    // Check for consensus (agents agree within 20% confidence)
    const confidenceRange = Math.max(...allResponses.map(r => r?.confidence || 0)) - 
                           Math.min(...allResponses.map(r => r?.confidence || 0));
    
    const consensusReached = confidenceRange <= 20;
    const finalConfidence = consensusReached ? averageConfidence : Math.max(0, averageConfidence - 15);

    state.consensusReached = consensusReached;
    state.finalConfidence = finalConfidence;
    state.requiresHumanReview = !consensusReached || finalConfidence < 75;
    
    state.messages.push({
      role: "assistant",
      content: `Consensus analysis: ${consensusReached ? 'Reached' : 'Not reached'} (${finalConfidence.toFixed(1)}% confidence)`,
      timestamp: new Date().toISOString(),
    });
  }

  // Route for human review when consensus is not reached
  private async requestHumanReview(state: AgentStateType): Promise<void> {
    const reviewContext = {
      originalQuery: state.originalQuery,
      primaryResponse: state.primaryResponse,
      verificationResponses: state.verificationResponses,
      consensusReached: state.consensusReached,
      finalConfidence: state.finalConfidence,
      timestamp: new Date().toISOString(),
    };

    state.context = { 
      ...state.context, 
      humanReviewRequested: true,
      reviewContext,
    };
    
    state.messages.push({
      role: "assistant",
      content: "Human review requested due to low consensus or confidence",
      timestamp: new Date().toISOString(),
    });
  }

  // Finalize the response with all gathered information
  private async finalizeResponse(state: AgentStateType): Promise<any> {
    const finalResponse = {
      query: state.originalQuery,
      primaryAgent: state.agentType,
      response: state.primaryResponse?.response || "No response generated",
      confidence: state.finalConfidence || 0,
      consensusReached: state.consensusReached || false,
      verificationCount: state.verificationResponses?.length || 0,
      requiresHumanReview: state.requiresHumanReview || false,
      timestamp: new Date().toISOString(),
    };

    return finalResponse;
  }

  // Conditional edge functions
  private shouldRouteToAgent(state: AgentStateType): string {
    return state.agentType ? "primary_agent" : "end";
  }

  private shouldPerformConsensus(state: AgentStateType): string {
    return state.verificationResponses && state.verificationResponses.length > 0 ? "consensus" : "finalize";
  }

  private shouldRequestHumanReview(state: AgentStateType): string {
    return state.requiresHumanReview ? "human_review" : "finalize";
  }

  // Helper method to select appropriate verification agents
  private selectVerificationAgents(primaryAgent: string, query: string): string[] {
    const verificationMatrix: Record<string, string[]> = {
      compliance: ['operations', 'patent'],
      formulation: ['compliance', 'sourcing', 'spectra'],
      patent: ['compliance', 'operations'],
      operations: ['compliance', 'formulation'],
      sourcing: ['compliance', 'formulation'],
      marketing: ['compliance', 'patent', 'customer-success'],
      spectra: ['compliance', 'formulation'],
      'customer-success': ['compliance', 'marketing'],
    };

    return verificationMatrix[primaryAgent] || ['compliance'];
  }

  // Helper method for keyword-based agent routing when OpenAI is unavailable
  private getAgentByKeywords(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('coa') || lowerQuery.includes('certificate') || lowerQuery.includes('chromatography') || lowerQuery.includes('gcms') || lowerQuery.includes('hplc') || lowerQuery.includes('testing')) {
      return 'spectra';
    }
    if (lowerQuery.includes('customer') || lowerQuery.includes('support') || lowerQuery.includes('sales') || lowerQuery.includes('service')) {
      return 'customer-success';
    }
    if (lowerQuery.includes('complian') || lowerQuery.includes('regulat') || lowerQuery.includes('legal') || lowerQuery.includes('sop')) {
      return 'compliance';
    }
    if (lowerQuery.includes('formula') || lowerQuery.includes('recipe') || lowerQuery.includes('cannabinoid') || lowerQuery.includes('terpene')) {
      return 'formulation';
    }
    if (lowerQuery.includes('patent') || lowerQuery.includes('trademark') || lowerQuery.includes('ip') || lowerQuery.includes('intellectual')) {
      return 'patent';
    }
    if (lowerQuery.includes('equipment') || lowerQuery.includes('operation') || lowerQuery.includes('manufactur')) {
      return 'operations';
    }
    if (lowerQuery.includes('sourc') || lowerQuery.includes('vendor') || lowerQuery.includes('supplier') || lowerQuery.includes('procurement')) {
      return 'sourcing';
    }
    if (lowerQuery.includes('market') || lowerQuery.includes('brand') || lowerQuery.includes('advertis')) {
      return 'marketing';
    }
    
    // Default to compliance for cannabis-related queries
    return 'compliance';
  }

  // Public method to process queries through the simplified orchestrator
  async processQuery(query: string, threadId: string = "default"): Promise<any> {
    try {
      // Initialize state
      const state: AgentStateType = {
        messages: [{ role: "user", content: query, timestamp: new Date().toISOString() }],
        originalQuery: query,
        primaryResponse: null,
        verificationResponses: [],
        consensusReached: false,
        finalConfidence: 0,
        requiresHumanReview: false,
        agentType: '',
        context: { threadId }
      };

      // Store conversation history
      if (!this.conversationHistory.has(threadId)) {
        this.conversationHistory.set(threadId, []);
      }
      
      const history = this.conversationHistory.get(threadId)!;
      history.push({ timestamp: new Date().toISOString(), query, type: 'input' });

      // Execute the workflow
      const result = await this.orchestrateWorkflow(state);
      
      // Store result in history
      history.push({ timestamp: new Date().toISOString(), result, type: 'output' });
      
      return result;

    } catch (error) {
      console.error("Error in LangGraph processing:", error);
      throw new Error(`LangGraph processing failed: ${error.message}`);
    }
  }

  // Get conversation history for a thread
  async getHistory(threadId: string): Promise<any[]> {
    try {
      return this.conversationHistory.get(threadId) || [];
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return [];
    }
  }

  // Generate a simple workflow visualization
  getGraphVisualization(): string {
    return `
graph TD
    A[User Query] --> B[Route Query]
    B --> C{Agent Selection}
    C -->|Compliance| D[Compliance Agent]
    C -->|Formulation| E[Formulation Agent]
    C -->|Patent| F[Patent Agent]
    C -->|Operations| G[Operations Agent]
    C -->|Sourcing| H[Sourcing Agent]
    C -->|Marketing| I[Marketing Agent]
    C -->|Spectra| J[Spectra Agent]
    C -->|Customer Success| K[Customer Success Agent]
    D --> L[Verification]
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    L --> M[Consensus Building]
    M --> N{Human Review Needed?}
    N -->|Yes| O[Human Review Queue]
    N -->|No| P[Finalize Response]
    O --> P
    P --> Q[Final Result]
    `;
  }
}

export const langGraphOrchestrator = new LangGraphOrchestrator();