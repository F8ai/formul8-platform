import { ComplianceAgent } from '../agents/compliance/index.js';
import { PatentAgent } from '../agents/patent/index.js';
import { OperationsAgent } from '../agents/operations/index.js';
import { FormulationAgent } from '../agents/formulation/index.js';
import { SourcingAgent } from '../agents/sourcing/index.js';
import { MarketingAgent } from '../agents/marketing/index.js';
import { VerificationService } from './verification.js';
import { storage } from '../storage.js';
import type { Query } from '@shared/schema';
import type { BaseAgent } from '../agents/base.js';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;
  private verificationService: VerificationService;

  constructor() {
    this.agents = new Map([
      ['compliance', new ComplianceAgent()],
      ['patent', new PatentAgent()],
      ['operations', new OperationsAgent()],
      ['formulation', new FormulationAgent()],
      ['sourcing', new SourcingAgent()],
      ['marketing', new MarketingAgent()],
    ]);
    
    this.verificationService = new VerificationService();
  }

  async processQuery(query: Query): Promise<void> {
    try {
      // Update query status to processing
      await storage.updateQuery(query.id, { status: 'processing' });
      
      // Get the primary agent for this query
      const primaryAgent = this.agents.get(query.agentType);
      if (!primaryAgent) {
        throw new Error(`Agent ${query.agentType} not found`);
      }

      // Update agent heartbeat
      await this.updateAgentHeartbeat(query.agentType);

      // Process the query with the primary agent
      const primaryResponse = await primaryAgent.processQuery(query.content);
      
      // Store the primary response
      const storedResponse = await storage.createAgentResponse({
        queryId: query.id,
        agentType: query.agentType,
        response: primaryResponse,
        confidenceScore: primaryResponse.confidence.toString(),
      });

      // Determine if agent-to-agent verification is needed
      const needsVerification = primaryResponse.confidence < 80 || 
                               primaryResponse.requiresHumanVerification ||
                               this.shouldCrossVerify(query.agentType, query.content);

      let finalConfidence = primaryResponse.confidence;
      let verificationStatus = 'verified';

      if (needsVerification) {
        // Select appropriate verifying agents
        const verifyingAgents = this.selectVerifyingAgents(query.agentType, query.content);
        
        if (verifyingAgents.length > 0) {
          const verificationResult = await this.verificationService.performCrossVerification(
            primaryResponse,
            verifyingAgents,
            query.content
          );
          
          finalConfidence = verificationResult.finalConfidence;
          verificationStatus = verificationResult.consensusReached ? 'verified' : 'needs_human';
          
          // Store verification results
          for (const verifyingResponse of verificationResult.verifyingResponses) {
            const verifyingStored = await storage.createAgentResponse({
              queryId: query.id,
              agentType: verifyingResponse.agent,
              response: verifyingResponse,
              confidenceScore: verifyingResponse.confidence.toString(),
            });

            await storage.createVerification({
              primaryResponseId: storedResponse.id,
              verifyingResponseId: verifyingStored.id,
              consensusReached: verificationResult.consensusReached,
              discrepancyNotes: verificationResult.discrepancies?.join('; '),
              finalScore: finalConfidence.toString(),
            });
          }
        }
      }

      // Update query with final results
      await storage.updateQuery(query.id, {
        status: verificationStatus === 'verified' ? 'completed' : 'needs_human',
        confidenceScore: finalConfidence.toString(),
        requiresHumanVerification: verificationStatus === 'needs_human',
      });

      // Update agent response with verification status
      await storage.createAgentResponse({
        ...storedResponse,
        verificationStatus,
      });

      // Update agent statistics
      await this.updateAgentStats(query.agentType, true, finalConfidence);

    } catch (error) {
      console.error(`Error processing query ${query.id}:`, error);
      
      // Update query status to failed
      await storage.updateQuery(query.id, { 
        status: 'failed',
        requiresHumanVerification: true 
      });
      
      // Update agent statistics
      await this.updateAgentStats(query.agentType, false, 0);
    }
  }

  private shouldCrossVerify(agentType: string, content: string): boolean {
    // Always cross-verify for certain agent types or content patterns
    const highRiskAgents = ['compliance', 'patent'];
    const highRiskKeywords = ['legal', 'regulation', 'patent', 'trademark', 'lawsuit', 'safety'];
    
    if (highRiskAgents.includes(agentType)) return true;
    
    const lowerContent = content.toLowerCase();
    return highRiskKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private selectVerifyingAgents(primaryAgentType: string, content: string): BaseAgent[] {
    const verifyingAgents: BaseAgent[] = [];
    
    // Agent interaction matrix - which agents should verify each other
    const verificationMatrix: Record<string, string[]> = {
      'compliance': ['marketing', 'operations'],
      'patent': ['marketing', 'formulation'],
      'operations': ['compliance', 'sourcing'],
      'formulation': ['compliance', 'patent'],
      'sourcing': ['operations', 'compliance'],
      'marketing': ['compliance', 'patent'],
    };

    const recommendedVerifiers = verificationMatrix[primaryAgentType] || [];
    
    for (const agentType of recommendedVerifiers) {
      const agent = this.agents.get(agentType);
      if (agent) {
        verifyingAgents.push(agent);
      }
    }

    return verifyingAgents.slice(0, 2); // Limit to 2 verifying agents
  }

  private async updateAgentHeartbeat(agentType: string): Promise<void> {
    await storage.updateAgentStatus(agentType, {
      status: 'online',
      lastHeartbeat: new Date(),
    });
  }

  private async updateAgentStats(agentType: string, success: boolean, confidence: number): Promise<void> {
    const currentStatus = await storage.getAgentStatus(agentType);
    
    const totalQueries = (currentStatus?.totalQueries || 0) + 1;
    const successfulQueries = (currentStatus?.successfulQueries || 0) + (success ? 1 : 0);
    const avgConfidence = confidence;

    await storage.updateAgentStatus(agentType, {
      totalQueries,
      successfulQueries,
      confidenceScore: avgConfidence.toString(),
    });
  }

  async getAgentHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [agentType] of this.agents) {
      const status = await storage.getAgentStatus(agentType);
      health[agentType] = {
        status: status?.status || 'offline',
        lastHeartbeat: status?.lastHeartbeat,
        confidenceScore: status?.confidenceScore || 0,
        totalQueries: status?.totalQueries || 0,
        successRate: status?.totalQueries ? 
          ((status.successfulQueries || 0) / status.totalQueries * 100).toFixed(1) : 0
      };
    }
    
    return health;
  }
}

export const orchestrator = new AgentOrchestrator();
