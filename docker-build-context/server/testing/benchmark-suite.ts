import { ComplianceAgent } from '../agents/compliance/index.js';
import { PatentAgent } from '../agents/patent/index.js';
import { OperationsAgent } from '../agents/operations/index.js';
import { FormulationAgent } from '../agents/formulation/index.js';
import { SourcingAgent } from '../agents/sourcing/index.js';
import { MarketingAgent } from '../agents/marketing/index.js';
import type { BaseAgent, AgentResponse } from '../agents/base.js';

interface BenchmarkResult {
  agentType: string;
  testName: string;
  passed: boolean;
  score: number;
  responseTime: number;
  confidence: number;
  details: any;
  timestamp: Date;
}

interface BenchmarkTest {
  name: string;
  query: string;
  expectedConfidence: number;
  maxResponseTime: number;
  validator: (response: AgentResponse) => { passed: boolean; score: number; details: any };
}

export class BenchmarkSuite {
  private agents: Map<string, BaseAgent>;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.agents = new Map([
      ['compliance', new ComplianceAgent()],
      ['patent', new PatentAgent()],
      ['operations', new OperationsAgent()],
      ['formulation', new FormulationAgent()],
      ['sourcing', new SourcingAgent()],
      ['marketing', new MarketingAgent()],
    ]);
  }

  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('Starting comprehensive agent benchmark suite...');
    
    // Run benchmarks for each agent
    for (const [agentType, agent] of this.agents) {
      console.log(`\n=== Testing ${agentType.toUpperCase()} Agent ===`);
      await this.runAgentBenchmarks(agentType, agent);
    }

    // Run cross-agent verification benchmarks
    console.log('\n=== Testing Cross-Agent Verification ===');
    await this.runVerificationBenchmarks();

    return this.results;
  }

  private async runAgentBenchmarks(agentType: string, agent: BaseAgent): Promise<void> {
    const tests = this.getTestsForAgent(agentType);
    
    for (const test of tests) {
      console.log(`Running test: ${test.name}`);
      const result = await this.runSingleTest(agentType, agent, test);
      this.results.push(result);
      
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${status} - Score: ${result.score}% - Time: ${result.responseTime}ms`);
    }
  }

  private async runSingleTest(
    agentType: string, 
    agent: BaseAgent, 
    test: BenchmarkTest
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    
    try {
      const response = await agent.processQuery(test.query);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const validation = test.validator(response);
      const confidenceMet = response.confidence >= test.expectedConfidence;
      const timeMet = responseTime <= test.maxResponseTime;
      const passed = validation.passed && confidenceMet && timeMet;

      return {
        agentType,
        testName: test.name,
        passed,
        score: validation.score,
        responseTime,
        confidence: response.confidence,
        details: {
          ...validation.details,
          expectedConfidence: test.expectedConfidence,
          actualConfidence: response.confidence,
          maxResponseTime: test.maxResponseTime,
          actualResponseTime: responseTime,
          response: response.response.substring(0, 200) + '...'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        agentType,
        testName: test.name,
        passed: false,
        score: 0,
        responseTime: Date.now() - startTime,
        confidence: 0,
        details: { error: error.message },
        timestamp: new Date()
      };
    }
  }

  private getTestsForAgent(agentType: string): BenchmarkTest[] {
    switch (agentType) {
      case 'compliance':
        return this.getComplianceTests();
      case 'patent':
        return this.getPatentTests();
      case 'operations':
        return this.getOperationsTests();
      case 'formulation':
        return this.getFormulationTests();
      case 'sourcing':
        return this.getSourcingTests();
      case 'marketing':
        return this.getMarketingTests();
      default:
        return [];
    }
  }

  private getComplianceTests(): BenchmarkTest[] {
    return [
      {
        name: "Multi-jurisdiction Compliance Query",
        query: "What are the packaging requirements for cannabis edibles in California and Colorado?",
        expectedConfidence: 85,
        maxResponseTime: 30000,
        validator: (response) => ({
          passed: response.response.includes('California') && response.response.includes('Colorado'),
          score: this.calculateComplianceScore(response),
          details: { 
            containsBothStates: response.response.includes('California') && response.response.includes('Colorado'),
            hasSources: response.sources && response.sources.length > 0
          }
        })
      },
      {
        name: "Regulatory Citation Accuracy",
        query: "What are the current THC limits for cannabis products in California?",
        expectedConfidence: 90,
        maxResponseTime: 25000,
        validator: (response) => ({
          passed: response.response.includes('mg') && response.response.includes('California'),
          score: this.calculateAccuracyScore(response),
          details: {
            containsSpecificLimits: response.response.includes('mg'),
            containsJurisdiction: response.response.includes('California'),
            providesWarnings: response.metadata?.warnings && response.metadata.warnings.length > 0
          }
        })
      },
      {
        name: "Safety Protocol Verification",
        query: "What safety protocols are required for cannabis extraction using butane?",
        expectedConfidence: 95,
        maxResponseTime: 35000,
        validator: (response) => ({
          passed: response.response.includes('ventilation') && response.response.includes('safety'),
          score: this.calculateSafetyScore(response),
          details: {
            addressesSafety: response.response.includes('safety'),
            mentionsVentilation: response.response.includes('ventilation'),
            requiresHumanVerification: response.requiresHumanVerification
          }
        })
      }
    ];
  }

  private getPatentTests(): BenchmarkTest[] {
    return [
      {
        name: "Patent Search Comprehensiveness",
        query: "Are there any patents for cannabis CO2 extraction methods?",
        expectedConfidence: 80,
        maxResponseTime: 45000,
        validator: (response) => ({
          passed: response.response.includes('patent') && response.metadata?.patentsFound,
          score: this.calculatePatentScore(response),
          details: {
            foundPatents: response.metadata?.patentsFound || [],
            providesRiskLevel: response.metadata?.riskLevel !== undefined,
            includesLegalDisclaimer: response.response.includes('not a lawyer') || response.response.includes('attorney')
          }
        })
      },
      {
        name: "Trademark Conflict Detection",
        query: "Is the name 'Green Gold' available for a cannabis brand?",
        expectedConfidence: 75,
        maxResponseTime: 40000,
        validator: (response) => ({
          passed: response.response.includes('trademark') || response.response.includes('search'),
          score: this.calculateTrademarkScore(response),
          details: {
            mentionsTrademark: response.response.includes('trademark'),
            providesRiskAssessment: response.metadata?.riskLevel !== undefined,
            recommendsLegalReview: response.requiresHumanVerification || response.metadata?.requiresLegalReview
          }
        })
      }
    ];
  }

  private getOperationsTests(): BenchmarkTest[] {
    return [
      {
        name: "Yield Calculation Accuracy",
        query: "How can I improve yields in a 1000 sq ft indoor cannabis cultivation facility?",
        expectedConfidence: 85,
        maxResponseTime: 30000,
        validator: (response) => ({
          passed: response.response.includes('yield') && (response.response.includes('gram') || response.response.includes('pound')),
          score: this.calculateYieldScore(response),
          details: {
            includesCalculations: response.metadata?.calculations !== undefined,
            providesSpecificRecommendations: response.metadata?.equipmentRecommendations && response.metadata.equipmentRecommendations.length > 0,
            addressesSquareFootage: response.response.includes('1000') || response.response.includes('sq ft')
          }
        })
      },
      {
        name: "Equipment Troubleshooting",
        query: "My cannabis drying room humidity is staying at 70% despite dehumidifier running. What should I check?",
        expectedConfidence: 80,
        maxResponseTime: 25000,
        validator: (response) => ({
          passed: response.response.includes('humidity') && response.response.includes('dehumidifier'),
          score: this.calculateTroubleshootingScore(response),
          details: {
            addressesHumidity: response.response.includes('humidity'),
            providesSteps: response.metadata?.nextSteps && response.metadata.nextSteps.length > 0,
            includesSafetyWarnings: response.metadata?.safetyWarnings && response.metadata.safetyWarnings.length > 0
          }
        })
      }
    ];
  }

  private getFormulationTests(): BenchmarkTest[] {
    return [
      {
        name: "Cannabinoid Ratio Optimization",
        query: "What's the optimal CBD:THC ratio for anxiety relief in edibles?",
        expectedConfidence: 85,
        maxResponseTime: 35000,
        validator: (response) => ({
          passed: response.response.includes('CBD') && response.response.includes('THC') && response.response.includes('ratio'),
          score: this.calculateFormulationScore(response),
          details: {
            includesRatios: response.metadata?.formulationDetails?.cannabinoid_ratios !== undefined,
            addressesAnxiety: response.response.includes('anxiety'),
            citesSources: response.sources && response.sources.length > 0,
            requiresExpertReview: response.requiresHumanVerification
          }
        })
      },
      {
        name: "Terpene Profile Recommendation",
        query: "Which terpenes should I include in a sleep-promoting cannabis product?",
        expectedConfidence: 80,
        maxResponseTime: 30000,
        validator: (response) => ({
          passed: response.response.includes('terpene') && response.response.includes('sleep'),
          score: this.calculateTerpeneScore(response),
          details: {
            includesTerpeneProfile: response.metadata?.formulationDetails?.terpene_profile !== undefined,
            mentionsSpecificTerpenes: response.response.includes('myrcene') || response.response.includes('linalool'),
            addressesSleep: response.response.includes('sleep'),
            includesConcentrations: response.response.includes('%') || response.response.includes('mg')
          }
        })
      }
    ];
  }

  private getSourcingTests(): BenchmarkTest[] {
    return [
      {
        name: "Equipment Sourcing Accuracy",
        query: "I need to source extraction equipment for a small-scale CO2 operation. Budget is $50,000.",
        expectedConfidence: 85,
        maxResponseTime: 25000,
        validator: (response) => ({
          passed: response.response.includes('CO2') && response.response.includes('$50,000'),
          score: this.calculateSourcingScore(response),
          details: {
            includesVendorRecommendations: response.metadata?.vendorRecommendations && response.metadata.vendorRecommendations.length > 0,
            staysWithinBudget: response.response.includes('50,000') || response.response.includes('budget'),
            providesSpecs: response.metadata?.equipmentSpecs && response.metadata.equipmentSpecs.length > 0,
            includesAlternatives: response.metadata?.alternatives && response.metadata.alternatives.length > 0
          }
        })
      },
      {
        name: "Vendor Reliability Assessment",
        query: "Can you recommend reliable suppliers for cannabis packaging materials in California?",
        expectedConfidence: 80,
        maxResponseTime: 20000,
        validator: (response) => ({
          passed: response.response.includes('packaging') && response.response.includes('California'),
          score: this.calculateVendorScore(response),
          details: {
            includesReputationScores: response.metadata?.vendorRecommendations?.some((v: any) => v.reputation_score !== undefined),
            addressesCompliance: response.metadata?.complianceNotes && response.metadata.complianceNotes.length > 0,
            providesContactInfo: response.response.includes('contact') || response.response.includes('website')
          }
        })
      }
    ];
  }

  private getMarketingTests(): BenchmarkTest[] {
    return [
      {
        name: "Compliance Content Creation",
        query: "Create marketing copy for a new cannabis vape product targeting adults 21+",
        expectedConfidence: 90,
        maxResponseTime: 30000,
        validator: (response) => ({
          passed: response.response.includes('21') && !this.containsProhibitedContent(response.response),
          score: this.calculateMarketingScore(response),
          details: {
            targetsCorrectAge: response.response.includes('21'),
            avoidsProhibitedContent: !this.containsProhibitedContent(response.response),
            complianceVerified: response.metadata?.complianceVerified === true,
            includesWarnings: response.metadata?.complianceWarnings && response.metadata.complianceWarnings.length === 0
          }
        })
      },
      {
        name: "Multi-Platform Strategy",
        query: "Develop a social media strategy for a cannabis dispensary that complies with platform policies",
        expectedConfidence: 85,
        maxResponseTime: 35000,
        validator: (response) => ({
          passed: response.response.includes('social media') && response.response.includes('compliant'),
          score: this.calculateStrategyScore(response),
          details: {
            includesChannelRecommendations: response.metadata?.channelRecommendations && response.metadata.channelRecommendations.length > 0,
            addressesCompliance: response.metadata?.complianceVerified === true,
            providesContentSuggestions: response.metadata?.contentSuggestions && response.metadata.contentSuggestions.length > 0
          }
        })
      }
    ];
  }

  private async runVerificationBenchmarks(): Promise<void> {
    // Test cross-agent verification scenarios
    const verificationTests = [
      {
        name: "Compliance-Marketing Verification",
        primaryAgent: 'marketing',
        verifyingAgent: 'compliance',
        query: "Create advertising copy for cannabis edibles"
      },
      {
        name: "Patent-Formulation Verification", 
        primaryAgent: 'formulation',
        verifyingAgent: 'patent',
        query: "Develop a novel cannabis extraction method"
      },
      {
        name: "Operations-Sourcing Verification",
        primaryAgent: 'operations',
        verifyingAgent: 'sourcing', 
        query: "Recommend equipment for cannabis processing facility"
      }
    ];

    for (const test of verificationTests) {
      console.log(`Running verification test: ${test.name}`);
      const result = await this.runVerificationTest(test);
      this.results.push(result);
      
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${status} - Score: ${result.score}% - Time: ${result.responseTime}ms`);
    }
  }

  private async runVerificationTest(test: any): Promise<BenchmarkResult> {
    const startTime = Date.now();
    
    try {
      const primaryAgent = this.agents.get(test.primaryAgent);
      const verifyingAgent = this.agents.get(test.verifyingAgent);
      
      if (!primaryAgent || !verifyingAgent) {
        throw new Error(`Agent not found: ${test.primaryAgent} or ${test.verifyingAgent}`);
      }

      const primaryResponse = await primaryAgent.processQuery(test.query);
      const verificationResult = await primaryAgent.verifyAgainstAgent(
        primaryResponse,
        verifyingAgent,
        test.query
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        agentType: 'verification',
        testName: test.name,
        passed: verificationResult.consensusReached,
        score: verificationResult.finalConfidence,
        responseTime,
        confidence: verificationResult.finalConfidence,
        details: {
          consensusReached: verificationResult.consensusReached,
          discrepancies: verificationResult.discrepancies,
          recommendation: verificationResult.recommendation,
          primaryAgent: test.primaryAgent,
          verifyingAgent: test.verifyingAgent
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        agentType: 'verification',
        testName: test.name,
        passed: false,
        score: 0,
        responseTime: Date.now() - startTime,
        confidence: 0,
        details: { error: error.message },
        timestamp: new Date()
      };
    }
  }

  // Scoring helper methods
  private calculateComplianceScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 85) score += 30;
    if (response.sources && response.sources.length > 0) score += 25;
    if (response.metadata?.jurisdiction) score += 20;
    if (response.metadata?.warnings) score += 15;
    if (response.response.length > 100) score += 10;
    return Math.min(score, 100);
  }

  private calculateAccuracyScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 90) score += 40;
    if (response.sources && response.sources.length > 0) score += 30;
    if (response.response.includes('mg') || response.response.includes('limit')) score += 20;
    if (response.response.length > 150) score += 10;
    return Math.min(score, 100);
  }

  private calculateSafetyScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 95) score += 30;
    if (response.response.includes('safety')) score += 25;
    if (response.response.includes('ventilation') || response.response.includes('fire')) score += 25;
    if (response.requiresHumanVerification) score += 20;
    return Math.min(score, 100);
  }

  private calculatePatentScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 80) score += 25;
    if (response.metadata?.patentsFound) score += 30;
    if (response.metadata?.riskLevel) score += 20;
    if (response.response.includes('attorney') || response.response.includes('lawyer')) score += 25;
    return Math.min(score, 100);
  }

  private calculateTrademarkScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 75) score += 25;
    if (response.response.includes('trademark')) score += 30;
    if (response.metadata?.riskLevel) score += 25;
    if (response.requiresHumanVerification) score += 20;
    return Math.min(score, 100);
  }

  private calculateYieldScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 85) score += 30;
    if (response.metadata?.calculations) score += 25;
    if (response.metadata?.equipmentRecommendations) score += 25;
    if (response.response.includes('gram') || response.response.includes('pound')) score += 20;
    return Math.min(score, 100);
  }

  private calculateTroubleshootingScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 80) score += 25;
    if (response.metadata?.nextSteps) score += 30;
    if (response.response.includes('check') || response.response.includes('inspect')) score += 25;
    if (response.metadata?.safetyWarnings) score += 20;
    return Math.min(score, 100);
  }

  private calculateFormulationScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 85) score += 25;
    if (response.metadata?.formulationDetails) score += 30;
    if (response.sources && response.sources.length > 0) score += 25;
    if (response.response.includes('ratio')) score += 20;
    return Math.min(score, 100);
  }

  private calculateTerpeneScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 80) score += 25;
    if (response.response.includes('myrcene') || response.response.includes('linalool')) score += 30;
    if (response.metadata?.formulationDetails?.terpene_profile) score += 25;
    if (response.response.includes('%') || response.response.includes('mg')) score += 20;
    return Math.min(score, 100);
  }

  private calculateSourcingScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 85) score += 25;
    if (response.metadata?.vendorRecommendations) score += 30;
    if (response.metadata?.equipmentSpecs) score += 25;
    if (response.response.includes('budget') || response.response.includes('$')) score += 20;
    return Math.min(score, 100);
  }

  private calculateVendorScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 80) score += 25;
    if (response.metadata?.vendorRecommendations?.length > 0) score += 35;
    if (response.metadata?.complianceNotes) score += 20;
    if (response.response.includes('contact') || response.response.includes('website')) score += 20;
    return Math.min(score, 100);
  }

  private calculateMarketingScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 90) score += 30;
    if (response.metadata?.complianceVerified === true) score += 35;
    if (!this.containsProhibitedContent(response.response)) score += 25;
    if (response.response.includes('21')) score += 10;
    return Math.min(score, 100);
  }

  private calculateStrategyScore(response: AgentResponse): number {
    let score = 0;
    if (response.confidence >= 85) score += 25;
    if (response.metadata?.channelRecommendations) score += 30;
    if (response.metadata?.contentSuggestions) score += 25;
    if (response.metadata?.complianceVerified === true) score += 20;
    return Math.min(score, 100);
  }

  private containsProhibitedContent(content: string): boolean {
    const prohibitedTerms = [
      'kids', 'children', 'minors', 'school', 'playground', 'candy-like',
      'cartoon', 'toy', 'game', 'fun for all ages', 'family friendly'
    ];
    return prohibitedTerms.some(term => content.toLowerCase().includes(term));
  }

  generateReport(): any {
    const agentResults = this.groupResultsByAgent();
    const overallStats = this.calculateOverallStats();
    
    return {
      timestamp: new Date().toISOString(),
      overallStats,
      agentResults,
      summary: this.generateSummary(agentResults, overallStats),
      recommendations: this.generateRecommendations(agentResults)
    };
  }

  private groupResultsByAgent(): any {
    const grouped: any = {};
    
    for (const result of this.results) {
      if (!grouped[result.agentType]) {
        grouped[result.agentType] = {
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
          averageResponseTime: 0,
          averageConfidence: 0,
          tests: []
        };
      }
      
      grouped[result.agentType].totalTests++;
      if (result.passed) grouped[result.agentType].passedTests++;
      grouped[result.agentType].tests.push(result);
    }
    
    // Calculate averages
    for (const agentType of Object.keys(grouped)) {
      const agent = grouped[agentType];
      agent.passRate = (agent.passedTests / agent.totalTests * 100).toFixed(1);
      agent.averageScore = (agent.tests.reduce((sum: number, test: any) => sum + test.score, 0) / agent.totalTests).toFixed(1);
      agent.averageResponseTime = Math.round(agent.tests.reduce((sum: number, test: any) => sum + test.responseTime, 0) / agent.totalTests);
      agent.averageConfidence = (agent.tests.reduce((sum: number, test: any) => sum + test.confidence, 0) / agent.totalTests).toFixed(1);
    }
    
    return grouped;
  }

  private calculateOverallStats(): any {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const averageScore = this.results.reduce((sum, r) => sum + r.score, 0) / totalTests;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    const averageConfidence = this.results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
    
    return {
      totalTests,
      passedTests,
      passRate: (passedTests / totalTests * 100).toFixed(1),
      averageScore: averageScore.toFixed(1),
      averageResponseTime: Math.round(averageResponseTime),
      averageConfidence: averageConfidence.toFixed(1)
    };
  }

  private generateSummary(agentResults: any, overallStats: any): string {
    const bestAgent = Object.keys(agentResults).reduce((best, current) => 
      parseFloat(agentResults[current].averageScore) > parseFloat(agentResults[best]?.averageScore || '0') ? current : best
    );
    
    const worstAgent = Object.keys(agentResults).reduce((worst, current) => 
      parseFloat(agentResults[current].averageScore) < parseFloat(agentResults[worst]?.averageScore || '100') ? current : worst
    );
    
    return `Overall benchmark results: ${overallStats.passRate}% pass rate with ${overallStats.averageScore}% average score. ` +
           `Best performing agent: ${bestAgent} (${agentResults[bestAgent].averageScore}% score). ` +
           `Needs improvement: ${worstAgent} (${agentResults[worstAgent].averageScore}% score).`;
  }

  private generateRecommendations(agentResults: any): string[] {
    const recommendations: string[] = [];
    
    for (const [agentType, results] of Object.entries(agentResults) as [string, any][]) {
      if (parseFloat(results.passRate) < 80) {
        recommendations.push(`${agentType} agent needs improvement - only ${results.passRate}% pass rate`);
      }
      
      if (parseFloat(results.averageConfidence) < 80) {
        recommendations.push(`${agentType} agent shows low confidence - average ${results.averageConfidence}%`);
      }
      
      if (results.averageResponseTime > 30000) {
        recommendations.push(`${agentType} agent response time too slow - ${results.averageResponseTime}ms average`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All agents performing within acceptable parameters');
    }
    
    return recommendations;
  }
}