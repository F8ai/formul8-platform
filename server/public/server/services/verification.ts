import type { BaseAgent, AgentResponse } from '../agents/base.js';

export interface VerificationResult {
  consensusReached: boolean;
  finalConfidence: number;
  discrepancies?: string[];
  recommendation: string;
  verifyingResponses: AgentResponse[];
}

export class VerificationService {
  async performCrossVerification(
    primaryResponse: AgentResponse,
    verifyingAgents: BaseAgent[],
    originalQuery: string
  ): Promise<VerificationResult> {
    const verifyingResponses: AgentResponse[] = [];
    const verificationResults: any[] = [];

    // Get responses from all verifying agents
    for (const agent of verifyingAgents) {
      try {
        const verificationResult = await primaryResponse.constructor.prototype.verifyAgainstAgent.call(
          agent,
          primaryResponse,
          agent,
          originalQuery
        );
        
        verificationResults.push(verificationResult);
        
        // Also get the verifying agent's independent response
        const independentResponse = await agent.processQuery(originalQuery);
        verifyingResponses.push(independentResponse);
      } catch (error) {
        console.error(`Verification failed with agent ${agent.constructor.name}:`, error);
        verificationResults.push({
          consensusReached: false,
          finalConfidence: 0,
          discrepancies: ['Verification process failed'],
          recommendation: 'Technical error during verification'
        });
      }
    }

    // Analyze all verification results
    const consensusCount = verificationResults.filter(r => r.consensusReached).length;
    const consensusReached = consensusCount >= Math.ceil(verificationResults.length / 2);
    
    // Calculate final confidence as weighted average
    const confidenceScores = [
      primaryResponse.confidence,
      ...verifyingResponses.map(r => r.confidence)
    ];
    
    const finalConfidence = consensusReached
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : Math.min(...confidenceScores) * 0.7; // Reduce confidence if no consensus

    // Collect all discrepancies
    const allDiscrepancies = verificationResults
      .flatMap(r => r.discrepancies || [])
      .filter(d => d && d.length > 0);

    // Generate recommendation
    let recommendation: string;
    if (consensusReached && finalConfidence >= 80) {
      recommendation = 'Response verified through agent consensus with high confidence';
    } else if (consensusReached && finalConfidence >= 60) {
      recommendation = 'Response verified through agent consensus with moderate confidence';
    } else if (allDiscrepancies.length > 0) {
      recommendation = `Human verification recommended due to agent disagreements: ${allDiscrepancies.slice(0, 2).join('; ')}`;
    } else {
      recommendation = 'Human verification recommended due to low confidence scores';
    }

    return {
      consensusReached,
      finalConfidence: Math.round(finalConfidence),
      discrepancies: allDiscrepancies,
      recommendation,
      verifyingResponses
    };
  }

  calculateConfidenceScore(responses: AgentResponse[]): number {
    if (responses.length === 0) return 0;
    
    const scores = responses.map(r => r.confidence);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Reduce score if there's high variance between agents
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Penalize high standard deviation
    const penalty = Math.min(standardDeviation / 2, 20);
    
    return Math.max(0, Math.round(average - penalty));
  }

  detectDiscrepancies(responses: AgentResponse[]): string[] {
    const discrepancies: string[] = [];
    
    if (responses.length < 2) return discrepancies;
    
    // Check for significant confidence differences
    const confidences = responses.map(r => r.confidence);
    const maxConfidence = Math.max(...confidences);
    const minConfidence = Math.min(...confidences);
    
    if (maxConfidence - minConfidence > 30) {
      discrepancies.push(`Significant confidence variance: ${minConfidence}% to ${maxConfidence}%`);
    }
    
    // Check for conflicting recommendations on human verification
    const humanVerificationNeeded = responses.filter(r => r.requiresHumanVerification).length;
    const humanVerificationNotNeeded = responses.length - humanVerificationNeeded;
    
    if (humanVerificationNeeded > 0 && humanVerificationNotNeeded > 0) {
      discrepancies.push('Agents disagree on need for human verification');
    }
    
    // Add more discrepancy detection logic as needed
    
    return discrepancies;
  }
}
