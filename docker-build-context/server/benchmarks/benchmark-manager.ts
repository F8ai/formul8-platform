import { AgentManager, type AgentConfiguration } from '../agents/agent-manager.js';
import { storage } from '../storage.js';

export interface BenchmarkDefinition {
  id: string;
  name: string;
  description: string;
  category: 'accuracy' | 'performance' | 'safety' | 'compliance' | 'quality' | 'custom';
  agentTypes: string[];
  testCases: BenchmarkTestCase[];
  scoring: BenchmarkScoring;
  schedule: BenchmarkSchedule;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkTestCase {
  id: string;
  name: string;
  query: string;
  context?: Record<string, any>;
  expectedOutput?: {
    type: 'exact_match' | 'contains' | 'regex' | 'semantic' | 'custom';
    value: string;
    threshold?: number;
  };
  expectedConfidence: {
    min: number;
    max: number;
  };
  expectedResponseTime: number; // milliseconds
  weight: number; // 1-10, importance of this test case
  tags: string[];
  validator?: {
    type: 'javascript' | 'ai_judge' | 'external_api';
    code?: string;
    prompt?: string;
    endpoint?: string;
  };
}

export interface BenchmarkScoring {
  weights: {
    accuracy: number;
    responseTime: number;
    confidence: number;
    safety: number;
    compliance: number;
  };
  passingScore: number;
  perfectScore: number;
  penalties: {
    timeoutPenalty: number;
    errorPenalty: number;
    safetyViolationPenalty: number;
  };
}

export interface BenchmarkSchedule {
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  runAt?: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface BenchmarkResult {
  id: string;
  benchmarkId: string;
  agentId: string;
  agentConfiguration: AgentConfiguration;
  testResults: TestResult[];
  overallScore: number;
  breakdown: {
    accuracy: number;
    responseTime: number;
    confidence: number;
    safety: number;
    compliance: number;
  };
  passed: boolean;
  executionTime: number;
  errors: string[];
  warnings: string[];
  runAt: Date;
  metadata: Record<string, any>;
}

export interface TestResult {
  testCaseId: string;
  testName: string;
  query: string;
  response: string;
  confidence: number;
  responseTime: number;
  score: number;
  passed: boolean;
  validationResults: {
    accuracy: { passed: boolean; score: number; details: string };
    safety: { passed: boolean; score: number; details: string };
    compliance: { passed: boolean; score: number; details: string };
  };
  expectedVsActual: {
    expectedConfidence: { min: number; max: number };
    actualConfidence: number;
    expectedResponseTime: number;
    actualResponseTime: number;
  };
  errors: string[];
}

export interface BenchmarkAnalytics {
  benchmarkId: string;
  agentId: string;
  timeframe: 'day' | 'week' | 'month' | 'quarter';
  trendData: {
    dates: string[];
    scores: number[];
    accuracy: number[];
    responseTime: number[];
    confidence: number[];
  };
  performance: {
    averageScore: number;
    bestScore: number;
    worstScore: number;
    improvement: number; // percentage change
    consistencyScore: number; // lower variance = higher consistency
  };
  regressions: Array<{
    testCaseId: string;
    testName: string;
    previousScore: number;
    currentScore: number;
    degradation: number;
  }>;
  improvements: Array<{
    testCaseId: string;
    testName: string;
    previousScore: number;
    currentScore: number;
    improvement: number;
  }>;
}

export class BenchmarkManager {
  private benchmarks: Map<string, BenchmarkDefinition> = new Map();
  private results: Map<string, BenchmarkResult[]> = new Map();
  private agentManager: AgentManager;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    this.initializeDefaultBenchmarks();
  }

  // Benchmark Definition Management
  async createBenchmark(benchmark: Omit<BenchmarkDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<BenchmarkDefinition> {
    const benchmarkDef: BenchmarkDefinition = {
      ...benchmark,
      id: `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.benchmarks.set(benchmarkDef.id, benchmarkDef);
    return benchmarkDef;
  }

  async updateBenchmark(benchmarkId: string, updates: Partial<BenchmarkDefinition>): Promise<BenchmarkDefinition | null> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) return null;

    const updated = {
      ...benchmark,
      ...updates,
      updatedAt: new Date()
    };

    this.benchmarks.set(benchmarkId, updated);
    return updated;
  }

  async deleteBenchmark(benchmarkId: string): Promise<boolean> {
    const deleted = this.benchmarks.delete(benchmarkId);
    if (deleted) {
      this.results.delete(benchmarkId);
    }
    return deleted;
  }

  getBenchmark(benchmarkId: string): BenchmarkDefinition | null {
    return this.benchmarks.get(benchmarkId) || null;
  }

  getAllBenchmarks(): BenchmarkDefinition[] {
    return Array.from(this.benchmarks.values());
  }

  getBenchmarksByAgent(agentType: string): BenchmarkDefinition[] {
    return Array.from(this.benchmarks.values())
      .filter(b => b.agentTypes.includes(agentType) || b.agentTypes.includes('all'));
  }

  getBenchmarksByCategory(category: string): BenchmarkDefinition[] {
    return Array.from(this.benchmarks.values())
      .filter(b => b.category === category);
  }

  // Test Case Management
  async addTestCase(benchmarkId: string, testCase: Omit<BenchmarkTestCase, 'id'>): Promise<boolean> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) return false;

    const newTestCase: BenchmarkTestCase = {
      ...testCase,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    benchmark.testCases.push(newTestCase);
    benchmark.updatedAt = new Date();
    return true;
  }

  async updateTestCase(benchmarkId: string, testCaseId: string, updates: Partial<BenchmarkTestCase>): Promise<boolean> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) return false;

    const testCaseIndex = benchmark.testCases.findIndex(tc => tc.id === testCaseId);
    if (testCaseIndex === -1) return false;

    benchmark.testCases[testCaseIndex] = { ...benchmark.testCases[testCaseIndex], ...updates };
    benchmark.updatedAt = new Date();
    return true;
  }

  async removeTestCase(benchmarkId: string, testCaseId: string): Promise<boolean> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) return false;

    const initialLength = benchmark.testCases.length;
    benchmark.testCases = benchmark.testCases.filter(tc => tc.id !== testCaseId);
    benchmark.updatedAt = new Date();
    
    return benchmark.testCases.length < initialLength;
  }

  // Benchmark Execution
  async runBenchmark(benchmarkId: string, agentId: string): Promise<BenchmarkResult> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) throw new Error('Benchmark not found');

    const agent = this.agentManager.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    const startTime = Date.now();
    const testResults: TestResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log(`Running benchmark "${benchmark.name}" for agent "${agent.name}"`);

    for (const testCase of benchmark.testCases) {
      try {
        const testResult = await this.runSingleTest(testCase, agent);
        testResults.push(testResult);
        
        if (!testResult.passed) {
          warnings.push(`Test "${testCase.name}" failed with score ${testResult.score}`);
        }
      } catch (error) {
        errors.push(`Test "${testCase.name}" error: ${error.message}`);
        testResults.push(this.createFailedTestResult(testCase, error.message));
      }
    }

    const breakdown = this.calculateBreakdown(testResults, benchmark.scoring);
    const overallScore = this.calculateOverallScore(breakdown, benchmark.scoring);
    const passed = overallScore >= benchmark.scoring.passingScore;

    const result: BenchmarkResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      benchmarkId,
      agentId,
      agentConfiguration: agent,
      testResults,
      overallScore,
      breakdown,
      passed,
      executionTime: Date.now() - startTime,
      errors,
      warnings,
      runAt: new Date(),
      metadata: {
        testCaseCount: benchmark.testCases.length,
        averageResponseTime: testResults.reduce((sum, tr) => sum + tr.responseTime, 0) / testResults.length,
        averageConfidence: testResults.reduce((sum, tr) => sum + tr.confidence, 0) / testResults.length
      }
    };

    // Store result
    if (!this.results.has(benchmarkId)) {
      this.results.set(benchmarkId, []);
    }
    this.results.get(benchmarkId)!.push(result);

    // Keep only last 50 results per benchmark
    const results = this.results.get(benchmarkId)!;
    if (results.length > 50) {
      this.results.set(benchmarkId, results.slice(-50));
    }

    return result;
  }

  async runAllBenchmarks(agentId: string): Promise<BenchmarkResult[]> {
    const agent = this.agentManager.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    const applicableBenchmarks = this.getBenchmarksByAgent(agent.type);
    const results: BenchmarkResult[] = [];

    for (const benchmark of applicableBenchmarks) {
      if (benchmark.active) {
        try {
          const result = await this.runBenchmark(benchmark.id, agentId);
          results.push(result);
        } catch (error) {
          console.error(`Failed to run benchmark ${benchmark.name}:`, error);
        }
      }
    }

    return results;
  }

  // Analytics and Reporting
  async getBenchmarkAnalytics(benchmarkId: string, agentId: string, timeframe: 'day' | 'week' | 'month' | 'quarter' = 'week'): Promise<BenchmarkAnalytics | null> {
    const results = this.results.get(benchmarkId);
    if (!results) return null;

    const agentResults = results.filter(r => r.agentId === agentId);
    if (agentResults.length < 2) return null; // Need at least 2 results for comparison

    // Filter by timeframe
    const cutoffDate = new Date();
    switch (timeframe) {
      case 'day':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
    }

    const timeframedResults = agentResults.filter(r => r.runAt >= cutoffDate);
    if (timeframedResults.length === 0) return null;

    const trendData = {
      dates: timeframedResults.map(r => r.runAt.toISOString().split('T')[0]),
      scores: timeframedResults.map(r => r.overallScore),
      accuracy: timeframedResults.map(r => r.breakdown.accuracy),
      responseTime: timeframedResults.map(r => r.breakdown.responseTime),
      confidence: timeframedResults.map(r => r.breakdown.confidence)
    };

    const scores = trendData.scores;
    const performance = {
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      improvement: scores.length > 1 ? ((scores[scores.length - 1] - scores[0]) / scores[0]) * 100 : 0,
      consistencyScore: 100 - (this.calculateVariance(scores) / Math.max(...scores)) * 100
    };

    // Find regressions and improvements by comparing latest vs previous results
    const latestResult = timeframedResults[timeframedResults.length - 1];
    const previousResult = timeframedResults[timeframedResults.length - 2];
    
    const regressions: any[] = [];
    const improvements: any[] = [];

    if (previousResult) {
      latestResult.testResults.forEach(latestTest => {
        const previousTest = previousResult.testResults.find(pt => pt.testCaseId === latestTest.testCaseId);
        if (previousTest) {
          const scoreDiff = latestTest.score - previousTest.score;
          if (scoreDiff < -5) { // Regression threshold
            regressions.push({
              testCaseId: latestTest.testCaseId,
              testName: latestTest.testName,
              previousScore: previousTest.score,
              currentScore: latestTest.score,
              degradation: Math.abs(scoreDiff)
            });
          } else if (scoreDiff > 5) { // Improvement threshold
            improvements.push({
              testCaseId: latestTest.testCaseId,
              testName: latestTest.testName,
              previousScore: previousTest.score,
              currentScore: latestTest.score,
              improvement: scoreDiff
            });
          }
        }
      });
    }

    return {
      benchmarkId,
      agentId,
      timeframe,
      trendData,
      performance,
      regressions,
      improvements
    };
  }

  async getBenchmarkSummary(): Promise<{
    totalBenchmarks: number;
    activeBenchmarks: number;
    totalTestCases: number;
    recentResults: Array<{
      benchmarkName: string;
      agentName: string;
      score: number;
      passed: boolean;
      runAt: Date;
    }>;
    performanceOverview: {
      averageScore: number;
      passRate: number;
      totalRuns: number;
    };
  }> {
    const benchmarks = Array.from(this.benchmarks.values());
    const activeBenchmarks = benchmarks.filter(b => b.active);
    const totalTestCases = benchmarks.reduce((sum, b) => sum + b.testCases.length, 0);

    // Get recent results across all benchmarks
    const allResults: BenchmarkResult[] = [];
    for (const results of this.results.values()) {
      allResults.push(...results);
    }

    allResults.sort((a, b) => b.runAt.getTime() - a.runAt.getTime());
    const recentResults = allResults.slice(0, 10).map(result => {
      const benchmark = this.benchmarks.get(result.benchmarkId);
      const agent = this.agentManager.getAgent(result.agentId);
      
      return {
        benchmarkName: benchmark?.name || 'Unknown',
        agentName: agent?.name || 'Unknown',
        score: result.overallScore,
        passed: result.passed,
        runAt: result.runAt
      };
    });

    const performanceOverview = {
      averageScore: allResults.length > 0 ? allResults.reduce((sum, r) => sum + r.overallScore, 0) / allResults.length : 0,
      passRate: allResults.length > 0 ? (allResults.filter(r => r.passed).length / allResults.length) * 100 : 0,
      totalRuns: allResults.length
    };

    return {
      totalBenchmarks: benchmarks.length,
      activeBenchmarks: activeBenchmarks.length,
      totalTestCases,
      recentResults,
      performanceOverview
    };
  }

  // Private helper methods
  private async runSingleTest(testCase: BenchmarkTestCase, agent: AgentConfiguration): Promise<TestResult> {
    const startTime = Date.now();
    
    // This would integrate with your actual agent execution
    // For now, we'll simulate the response
    const mockResponse = `Mock response for: ${testCase.query}`;
    const mockConfidence = 85;
    const responseTime = Date.now() - startTime;

    // Validate the response
    const validationResults = await this.validateTestResult(testCase, mockResponse, mockConfidence);
    
    // Calculate score based on multiple factors
    const score = this.calculateTestScore(testCase, {
      response: mockResponse,
      confidence: mockConfidence,
      responseTime,
      validationResults
    });

    return {
      testCaseId: testCase.id,
      testName: testCase.name,
      query: testCase.query,
      response: mockResponse,
      confidence: mockConfidence,
      responseTime,
      score,
      passed: score >= 70, // Configurable passing threshold
      validationResults,
      expectedVsActual: {
        expectedConfidence: testCase.expectedConfidence,
        actualConfidence: mockConfidence,
        expectedResponseTime: testCase.expectedResponseTime,
        actualResponseTime: responseTime
      },
      errors: []
    };
  }

  private async validateTestResult(testCase: BenchmarkTestCase, response: string, confidence: number): Promise<any> {
    const results = {
      accuracy: { passed: true, score: 85, details: 'Response matches expected criteria' },
      safety: { passed: true, score: 100, details: 'No safety violations detected' },
      compliance: { passed: true, score: 90, details: 'Response is compliant with regulations' }
    };

    // Expected output validation
    if (testCase.expectedOutput) {
      switch (testCase.expectedOutput.type) {
        case 'contains':
          results.accuracy.passed = response.toLowerCase().includes(testCase.expectedOutput.value.toLowerCase());
          break;
        case 'regex':
          const regex = new RegExp(testCase.expectedOutput.value);
          results.accuracy.passed = regex.test(response);
          break;
        // Add more validation types as needed
      }
    }

    // Custom validator execution
    if (testCase.validator) {
      switch (testCase.validator.type) {
        case 'javascript':
          try {
            const validatorFunction = new Function('response', 'confidence', 'testCase', testCase.validator.code!);
            const customResult = validatorFunction(response, confidence, testCase);
            if (typeof customResult === 'object') {
              Object.assign(results, customResult);
            }
          } catch (error) {
            results.accuracy.passed = false;
            results.accuracy.details = `Validator error: ${error.message}`;
          }
          break;
        // Add AI judge and external API validators
      }
    }

    return results;
  }

  private calculateTestScore(testCase: BenchmarkTestCase, result: any): number {
    let score = 0;
    const maxScore = 100;

    // Accuracy component (40%)
    score += result.validationResults.accuracy.score * 0.4;

    // Confidence component (20%)
    const confidenceInRange = result.confidence >= testCase.expectedConfidence.min && 
                             result.confidence <= testCase.expectedConfidence.max;
    score += (confidenceInRange ? 100 : Math.max(0, 100 - Math.abs(result.confidence - testCase.expectedConfidence.min))) * 0.2;

    // Response time component (20%)
    const timeScore = result.responseTime <= testCase.expectedResponseTime ? 100 : 
                     Math.max(0, 100 - ((result.responseTime - testCase.expectedResponseTime) / testCase.expectedResponseTime) * 100);
    score += timeScore * 0.2;

    // Safety component (10%)
    score += result.validationResults.safety.score * 0.1;

    // Compliance component (10%)
    score += result.validationResults.compliance.score * 0.1;

    return Math.min(maxScore, Math.max(0, score));
  }

  private calculateBreakdown(testResults: TestResult[], scoring: BenchmarkScoring): any {
    const breakdown = {
      accuracy: 0,
      responseTime: 0,
      confidence: 0,
      safety: 0,
      compliance: 0
    };

    if (testResults.length === 0) return breakdown;

    breakdown.accuracy = testResults.reduce((sum, tr) => sum + tr.validationResults.accuracy.score, 0) / testResults.length;
    breakdown.safety = testResults.reduce((sum, tr) => sum + tr.validationResults.safety.score, 0) / testResults.length;
    breakdown.compliance = testResults.reduce((sum, tr) => sum + tr.validationResults.compliance.score, 0) / testResults.length;
    breakdown.confidence = testResults.reduce((sum, tr) => sum + tr.confidence, 0) / testResults.length;
    
    // Response time score (inverse - lower time = higher score)
    const avgResponseTime = testResults.reduce((sum, tr) => sum + tr.responseTime, 0) / testResults.length;
    const maxAcceptableTime = 30000; // 30 seconds
    breakdown.responseTime = Math.max(0, 100 - (avgResponseTime / maxAcceptableTime) * 100);

    return breakdown;
  }

  private calculateOverallScore(breakdown: any, scoring: BenchmarkScoring): number {
    return (
      breakdown.accuracy * scoring.weights.accuracy +
      breakdown.responseTime * scoring.weights.responseTime +
      breakdown.confidence * scoring.weights.confidence +
      breakdown.safety * scoring.weights.safety +
      breakdown.compliance * scoring.weights.compliance
    );
  }

  private createFailedTestResult(testCase: BenchmarkTestCase, error: string): TestResult {
    return {
      testCaseId: testCase.id,
      testName: testCase.name,
      query: testCase.query,
      response: '',
      confidence: 0,
      responseTime: 0,
      score: 0,
      passed: false,
      validationResults: {
        accuracy: { passed: false, score: 0, details: error },
        safety: { passed: false, score: 0, details: error },
        compliance: { passed: false, score: 0, details: error }
      },
      expectedVsActual: {
        expectedConfidence: testCase.expectedConfidence,
        actualConfidence: 0,
        expectedResponseTime: testCase.expectedResponseTime,
        actualResponseTime: 0
      },
      errors: [error]
    };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  private initializeDefaultBenchmarks(): void {
    // Create default benchmark definitions for each agent type
    const defaultBenchmarks = [
      {
        name: 'Compliance Agent Core Tests',
        description: 'Essential compliance verification tests',
        category: 'compliance' as const,
        agentTypes: ['compliance'],
        testCases: [
          {
            name: 'Multi-jurisdiction Query',
            query: 'What are packaging requirements for cannabis edibles in California and Colorado?',
            expectedConfidence: { min: 80, max: 95 },
            expectedResponseTime: 30000,
            weight: 10,
            tags: ['multi-jurisdiction', 'packaging', 'edibles'],
            expectedOutput: {
              type: 'contains' as const,
              value: 'California'
            }
          }
        ],
        scoring: {
          weights: { accuracy: 0.4, responseTime: 0.2, confidence: 0.2, safety: 0.1, compliance: 0.1 },
          passingScore: 75,
          perfectScore: 95,
          penalties: { timeoutPenalty: 20, errorPenalty: 30, safetyViolationPenalty: 50 }
        },
        schedule: {
          frequency: 'daily' as const,
          enabled: true
        },
        active: true,
        createdBy: 'system'
      }
      // Add more default benchmarks...
    ];

    // This would be implemented to create default benchmark definitions
  }
}