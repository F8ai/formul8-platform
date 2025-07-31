import { AgentMode, BaselinePerformance } from '../agents/base.js';
import { voiceflowService } from './voiceflow-service.js';

export interface BaselineQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedResponse: string;
  expectedKeywords: string[];
  maxPoints: number;
  agentType: string;
}

export interface BaselineTestResult {
  agentId: string;
  agentType: string;
  mode: AgentMode;
  questionId: string;
  response: string;
  accuracy: number;
  confidence: number;
  responseTime: number;
  keywordsFound: string[];
  score: number;
  maxScore: number;
  timestamp: Date;
}

export interface BaselineTestSummary {
  agentId: string;
  agentType: string;
  mode: AgentMode;
  totalQuestions: number;
  totalScore: number;
  maxPossibleScore: number;
  averageAccuracy: number;
  averageConfidence: number;
  averageResponseTime: number;
  performanceScore: number;
  timestamp: Date;
}

export class BaselineService {
  private baselineQuestions: Map<string, BaselineQuestion[]> = new Map();
  private testResults: Map<string, BaselineTestResult[]> = new Map();

  constructor() {
    this.initializeBaselineQuestions();
  }

  private initializeBaselineQuestions(): void {
    // Compliance Agent Questions
    this.baselineQuestions.set('compliance', [
      {
        id: 'comp_001',
        category: 'regulatory',
        difficulty: 'medium',
        question: 'What are the THC limits for hemp products in the United States?',
        expectedResponse: '0.3% delta-9 THC by dry weight',
        expectedKeywords: ['0.3%', 'delta-9', 'THC', 'dry weight', 'hemp'],
        maxPoints: 10,
        agentType: 'compliance'
      },
      {
        id: 'comp_002',
        category: 'licensing',
        difficulty: 'hard',
        question: 'What licenses are required to manufacture cannabis edibles in California?',
        expectedResponse: 'Manufacturing license, distribution license, and testing license',
        expectedKeywords: ['manufacturing', 'distribution', 'testing', 'license', 'California'],
        maxPoints: 15,
        agentType: 'compliance'
      }
    ]);

    // Formulation Agent Questions
    this.baselineQuestions.set('formulation', [
      {
        id: 'form_001',
        category: 'chemistry',
        difficulty: 'medium',
        question: 'What is the recommended terpene content for vape cartridges?',
        expectedResponse: '5-10% total terpene content by volume',
        expectedKeywords: ['5-10%', 'terpene', 'content', 'volume', 'vape'],
        maxPoints: 10,
        agentType: 'formulation'
      },
      {
        id: 'form_002',
        category: 'stability',
        difficulty: 'hard',
        question: 'How do you prevent oxidation in cannabis oil formulations?',
        expectedResponse: 'Use antioxidants, nitrogen flushing, and proper packaging',
        expectedKeywords: ['antioxidants', 'nitrogen', 'flushing', 'packaging', 'oxidation'],
        maxPoints: 15,
        agentType: 'formulation'
      }
    ]);

    // Marketing Agent Questions
    this.baselineQuestions.set('marketing', [
      {
        id: 'mkt_001',
        category: 'strategy',
        difficulty: 'medium',
        question: 'What are the key demographics for CBD wellness products?',
        expectedResponse: 'Adults 25-54, health-conscious consumers, wellness enthusiasts',
        expectedKeywords: ['25-54', 'health-conscious', 'wellness', 'adults', 'demographics'],
        maxPoints: 10,
        agentType: 'marketing'
      }
    ]);

    // Operations Agent Questions
    this.baselineQuestions.set('operations', [
      {
        id: 'ops_001',
        category: 'efficiency',
        difficulty: 'medium',
        question: 'How can you optimize extraction yield in CO2 extraction?',
        expectedResponse: 'Optimize pressure, temperature, and flow rate parameters',
        expectedKeywords: ['pressure', 'temperature', 'flow rate', 'optimize', 'yield'],
        maxPoints: 10,
        agentType: 'operations'
      }
    ]);

    // Patent Agent Questions
    this.baselineQuestions.set('patent', [
      {
        id: 'pat_001',
        category: 'search',
        difficulty: 'hard',
        question: 'How do you conduct a freedom-to-operate analysis for cannabis products?',
        expectedResponse: 'Search patent databases, analyze claims, and assess infringement risk',
        expectedKeywords: ['patent', 'databases', 'claims', 'infringement', 'risk'],
        maxPoints: 15,
        agentType: 'patent'
      }
    ]);

    // Sourcing Agent Questions
    this.baselineQuestions.set('sourcing', [
      {
        id: 'src_001',
        category: 'suppliers',
        difficulty: 'medium',
        question: 'What certifications should cannabis packaging suppliers have?',
        expectedResponse: 'ISO 9001, FDA compliance, child-resistant certification',
        expectedKeywords: ['ISO 9001', 'FDA', 'compliance', 'child-resistant', 'certification'],
        maxPoints: 10,
        agentType: 'sourcing'
      }
    ]);

    // Science Agent Questions
    this.baselineQuestions.set('science', [
      {
        id: 'sci_001',
        category: 'research',
        difficulty: 'hard',
        question: 'What are the latest findings on CBD bioavailability?',
        expectedResponse: 'Lipid-based formulations improve bioavailability by 2-3x',
        expectedKeywords: ['lipid-based', 'bioavailability', '2-3x', 'formulations', 'improve'],
        maxPoints: 15,
        agentType: 'science'
      }
    ]);

    // Spectra Agent Questions
    this.baselineQuestions.set('spectra', [
      {
        id: 'spec_001',
        category: 'analysis',
        difficulty: 'medium',
        question: 'How do you interpret GCMS results for terpene analysis?',
        expectedResponse: 'Compare retention times and mass spectra to reference standards',
        expectedKeywords: ['retention times', 'mass spectra', 'reference', 'standards', 'GCMS'],
        maxPoints: 10,
        agentType: 'spectra'
      }
    ]);
  }

  getBaselineQuestions(agentType: string): BaselineQuestion[] {
    return this.baselineQuestions.get(agentType) || [];
  }

  getAllBaselineQuestions(): BaselineQuestion[] {
    return Array.from(this.baselineQuestions.values()).flat();
  }

  async runBaselineTest(
    agentId: string,
    agentType: string,
    mode: AgentMode,
    questions?: BaselineQuestion[]
  ): Promise<BaselineTestSummary> {
    const testQuestions = questions || this.getBaselineQuestions(agentType);
    const results: BaselineTestResult[] = [];

    for (const question of testQuestions) {
      const startTime = Date.now();
      
      let response: string;
      let confidence: number;

      try {
        if (mode === 'voiceflow') {
          const voiceflowMapping = voiceflowService.getVoiceFlowAgentMapping();
          const voiceflowAgentId = voiceflowMapping[agentType];
          if (voiceflowAgentId) {
            const voiceflowResponse = await voiceflowService.queryAgent(voiceflowAgentId, question.question);
            response = voiceflowResponse.response;
            confidence = voiceflowResponse.confidence;
          } else {
            response = 'VoiceFlow agent not found';
            confidence = 0;
          }
        } else {
          // For other modes, this would call the actual agent
          response = `Mock response for ${agentType} in ${mode} mode`;
          confidence = Math.random() * 100;
        }

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const result = this.evaluateResponse(question, response, confidence, responseTime, agentId, agentType, mode);
        results.push(result);

      } catch (error) {
        console.error(`Error running baseline test for question ${question.id}:`, error);
        const result: BaselineTestResult = {
          agentId,
          agentType,
          mode,
          questionId: question.id,
          response: 'Error occurred during testing',
          accuracy: 0,
          confidence: 0,
          responseTime: 0,
          keywordsFound: [],
          score: 0,
          maxScore: question.maxPoints,
          timestamp: new Date()
        };
        results.push(result);
      }
    }

    const summary = this.calculateTestSummary(results, agentId, agentType, mode);
    this.saveTestResults(results);
    
    return summary;
  }

  private evaluateResponse(
    question: BaselineQuestion,
    response: string,
    confidence: number,
    responseTime: number,
    agentId: string,
    agentType: string,
    mode: AgentMode
  ): BaselineTestResult {
    const keywordsFound = question.expectedKeywords.filter(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    const keywordAccuracy = keywordsFound.length / question.expectedKeywords.length;
    const responseAccuracy = this.calculateResponseAccuracy(response, question.expectedResponse);
    const overallAccuracy = (keywordAccuracy + responseAccuracy) / 2;

    const score = Math.round(overallAccuracy * question.maxPoints);

    return {
      agentId,
      agentType,
      mode,
      questionId: question.id,
      response,
      accuracy: overallAccuracy * 100,
      confidence,
      responseTime,
      keywordsFound,
      score,
      maxScore: question.maxPoints,
      timestamp: new Date()
    };
  }

  private calculateResponseAccuracy(response: string, expectedResponse: string): number {
    const responseWords = response.toLowerCase().split(/\s+/);
    const expectedWords = expectedResponse.toLowerCase().split(/\s+/);
    
    const commonWords = responseWords.filter(word => expectedWords.includes(word));
    return commonWords.length / expectedWords.length;
  }

  private calculateTestSummary(
    results: BaselineTestResult[],
    agentId: string,
    agentType: string,
    mode: AgentMode
  ): BaselineTestSummary {
    const totalQuestions = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxPossibleScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    const averageAccuracy = results.reduce((sum, result) => sum + result.accuracy, 0) / totalQuestions;
    const averageConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / totalQuestions;
    const averageResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / totalQuestions;

    const performanceScore = (totalScore / maxPossibleScore) * 100;

    return {
      agentId,
      agentType,
      mode,
      totalQuestions,
      totalScore,
      maxPossibleScore,
      averageAccuracy,
      averageConfidence,
      averageResponseTime,
      performanceScore,
      timestamp: new Date()
    };
  }

  private saveTestResults(results: BaselineTestResult[]): void {
    const key = `${results[0]?.agentId}_${results[0]?.mode}_${Date.now()}`;
    this.testResults.set(key, results);
  }

  getTestResults(agentId: string, mode?: AgentMode): BaselineTestResult[] {
    const allResults: BaselineTestResult[] = [];
    
    this.testResults.forEach((results, key) => {
      if (key.startsWith(agentId) && (!mode || results[0]?.mode === mode)) {
        allResults.push(...results);
      }
    });
    
    return allResults;
  }

  getTestSummary(agentId: string, mode?: AgentMode): BaselineTestSummary | null {
    const results = this.getTestResults(agentId, mode);
    if (results.length === 0) return null;

    return this.calculateTestSummary(results, agentId, results[0].agentType, results[0].mode);
  }

  async compareModes(agentId: string, agentType: string, modes: AgentMode[]): Promise<{
    summaries: BaselineTestSummary[];
    comparison: {
      bestMode: AgentMode;
      bestScore: number;
      modeRankings: Array<{ mode: AgentMode; score: number }>;
    };
  }> {
    const summaries: BaselineTestSummary[] = [];

    for (const mode of modes) {
      const summary = await this.runBaselineTest(agentId, agentType, mode);
      summaries.push(summary);
    }

    const modeRankings = summaries
      .map(summary => ({ mode: summary.mode, score: summary.performanceScore }))
      .sort((a, b) => b.score - a.score);

    const bestMode = modeRankings[0].mode;
    const bestScore = modeRankings[0].score;

    return {
      summaries,
      comparison: {
        bestMode,
        bestScore,
        modeRankings
      }
    };
  }
}

export const baselineService = new BaselineService(); 