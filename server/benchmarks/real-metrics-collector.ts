import { performance } from 'perf_hooks';
import OpenAI from 'openai';
import { storage } from '../storage';

interface BenchmarkResult {
  agentType: string;
  testName: string;
  query: string;
  response: string;
  responseTime: number;
  accuracy?: number;
  confidence?: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

interface AgentMetrics {
  agentType: string;
  totalTests: number;
  successfulTests: number;
  averageResponseTime: number;
  averageAccuracy: number;
  averageConfidence: number;
  successRate: number;
  lastUpdated: Date;
}

export class RealMetricsCollector {
  private openai?: OpenAI;
  private results: BenchmarkResult[] = [];

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  // Run real benchmark tests with actual OpenAI calls
  async runBenchmarkSuite(agentType: string): Promise<BenchmarkResult[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key required for real benchmarks');
    }

    const testCases = this.getTestCases(agentType);
    const results: BenchmarkResult[] = [];

    for (const testCase of testCases) {
      try {
        const startTime = performance.now();
        
        // Make actual OpenAI API call
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: this.getSystemPrompt(agentType) },
            { role: "user", content: testCase.query }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1500
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const content = response.choices[0].message.content;
        const parsedResponse = JSON.parse(content || '{}');

        // Calculate accuracy and confidence based on response quality
        const accuracy = this.calculateAccuracy(testCase, parsedResponse);
        const confidence = parsedResponse.confidence || this.estimateConfidence(parsedResponse);

        const result: BenchmarkResult = {
          agentType,
          testName: testCase.name,
          query: testCase.query,
          response: content || '',
          responseTime,
          accuracy,
          confidence,
          timestamp: new Date(),
          success: true
        };

        results.push(result);
        this.results.push(result);

        // Store in database
        await this.storeResult(result);

      } catch (error) {
        const result: BenchmarkResult = {
          agentType,
          testName: testCase.name,
          query: testCase.query,
          response: '',
          responseTime: 0,
          timestamp: new Date(),
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };

        results.push(result);
        this.results.push(result);
      }

      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // Get agent-specific test cases
  private getTestCases(agentType: string) {
    const testSuites = {
      compliance: [
        {
          name: "regulatory_analysis",
          query: "What are the requirements for cannabis product labeling in California?",
          expectedElements: ["thc_content", "cbd_content", "batch_number", "test_results"]
        },
        {
          name: "license_verification",
          query: "How do I verify a cannabis distributor license in Colorado?",
          expectedElements: ["metrc_system", "license_lookup", "verification_process"]
        },
        {
          name: "sop_validation",
          query: "Create an SOP for cannabis testing laboratory sample handling",
          expectedElements: ["chain_of_custody", "storage_requirements", "documentation"]
        }
      ],
      formulation: [
        {
          name: "cannabinoid_ratio",
          query: "Calculate the optimal THC:CBD ratio for anxiety relief",
          expectedElements: ["thc_percentage", "cbd_percentage", "therapeutic_range"]
        },
        {
          name: "extraction_method",
          query: "Compare CO2 vs ethanol extraction for terpene preservation",
          expectedElements: ["terpene_retention", "efficiency", "purity"]
        },
        {
          name: "dosage_calculation",
          query: "Calculate edible dosing for a 150mg THC chocolate bar",
          expectedElements: ["dose_per_piece", "onset_time", "duration"]
        }
      ],
      marketing: [
        {
          name: "compliant_advertising",
          query: "Create a compliant social media post for a new cannabis strain",
          expectedElements: ["platform_restrictions", "compliant_language", "target_audience"]
        },
        {
          name: "brand_positioning",
          query: "Develop positioning strategy for premium cannabis concentrate brand",
          expectedElements: ["value_proposition", "target_market", "differentiation"]
        }
      ],
      operations: [
        {
          name: "inventory_optimization",
          query: "Optimize inventory levels for a cannabis retail store",
          expectedElements: ["turnover_rate", "safety_stock", "reorder_points"]
        },
        {
          name: "quality_control",
          query: "Design quality control process for cannabis cultivation",
          expectedElements: ["testing_schedule", "quality_metrics", "documentation"]
        }
      ],
      sourcing: [
        {
          name: "vendor_evaluation",
          query: "Evaluate suppliers for cannabis packaging materials",
          expectedElements: ["quality_criteria", "cost_analysis", "compliance_requirements"]
        },
        {
          name: "price_negotiation",
          query: "Negotiate pricing for bulk cannabis testing services",
          expectedElements: ["volume_discounts", "service_levels", "contract_terms"]
        }
      ]
    };

    return testSuites[agentType as keyof typeof testSuites] || [];
  }

  // Get agent-specific system prompts
  private getSystemPrompt(agentType: string): string {
    const prompts = {
      compliance: `You are a cannabis compliance expert. Provide accurate regulatory guidance and ensure all recommendations comply with state and local laws. Always include specific regulatory references and compliance requirements.`,
      
      formulation: `You are a cannabis formulation scientist with expertise in cannabinoids, terpenes, and product development. Provide scientifically accurate information about cannabis chemistry and product formulation.`,
      
      marketing: `You are a cannabis marketing expert who understands advertising restrictions and compliance requirements. Create marketing strategies that are both effective and legally compliant.`,
      
      operations: `You are a cannabis operations expert specializing in cultivation, manufacturing, and retail operations. Provide practical guidance for efficient and compliant cannabis business operations.`,
      
      sourcing: `You are a cannabis sourcing and procurement expert. Help identify quality suppliers, negotiate favorable terms, and ensure supply chain compliance and efficiency.`
    };

    return prompts[agentType as keyof typeof prompts] || 'You are a helpful cannabis industry expert.';
  }

  // Calculate accuracy based on expected elements in response
  private calculateAccuracy(testCase: any, response: any): number {
    if (!testCase.expectedElements) return 80; // Default if no criteria

    const expectedElements = testCase.expectedElements;
    const responseText = JSON.stringify(response).toLowerCase();
    
    let foundElements = 0;
    for (const element of expectedElements) {
      if (responseText.includes(element.toLowerCase().replace(/_/g, ' ')) || 
          responseText.includes(element.toLowerCase())) {
        foundElements++;
      }
    }

    return Math.round((foundElements / expectedElements.length) * 100);
  }

  // Estimate confidence based on response completeness
  private estimateConfidence(response: any): number {
    const responseText = JSON.stringify(response);
    
    // Base confidence on response length and structure
    let confidence = 50;
    
    if (responseText.length > 200) confidence += 20;
    if (responseText.length > 500) confidence += 10;
    if (response.sources && response.sources.length > 0) confidence += 10;
    if (response.recommendations) confidence += 5;
    if (response.regulatory_references) confidence += 5;
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  // Store benchmark result in database
  private async storeResult(result: BenchmarkResult): Promise<void> {
    try {
      // Store in agent responses table for tracking
      await storage.createAgentResponse({
        queryId: 0, // Benchmark query
        agentType: result.agentType,
        response: result.response,
        confidence: result.confidence || 0,
        processingTime: result.responseTime,
        sources: JSON.stringify({ benchmark: true, testName: result.testName }),
        metadata: JSON.stringify({
          benchmark: true,
          accuracy: result.accuracy,
          success: result.success,
          errorMessage: result.errorMessage
        })
      });
    } catch (error) {
      console.error('Failed to store benchmark result:', error);
    }
  }

  // Calculate aggregated metrics for an agent
  async calculateAgentMetrics(agentType: string, days: number = 30): Promise<AgentMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get recent benchmark results
    const recentResults = this.results.filter(r => 
      r.agentType === agentType && 
      r.timestamp > cutoffDate
    );

    if (recentResults.length === 0) {
      // Run fresh benchmarks if no recent data
      await this.runBenchmarkSuite(agentType);
      return this.calculateAgentMetrics(agentType, days);
    }

    const successfulTests = recentResults.filter(r => r.success);
    const totalTests = recentResults.length;

    const metrics: AgentMetrics = {
      agentType,
      totalTests,
      successfulTests: successfulTests.length,
      averageResponseTime: successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length || 0,
      averageAccuracy: successfulTests.reduce((sum, r) => sum + (r.accuracy || 0), 0) / successfulTests.length || 0,
      averageConfidence: successfulTests.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulTests.length || 0,
      successRate: (successfulTests.length / totalTests) * 100,
      lastUpdated: new Date()
    };

    return metrics;
  }

  // Get real-time performance dashboard data
  async getDashboardMetrics(): Promise<Record<string, AgentMetrics>> {
    const agentTypes = ['compliance', 'formulation', 'marketing', 'operations', 'sourcing'];
    const dashboard: Record<string, AgentMetrics> = {};

    for (const agentType of agentTypes) {
      try {
        dashboard[agentType] = await this.calculateAgentMetrics(agentType);
      } catch (error) {
        console.error(`Failed to get metrics for ${agentType}:`, error);
        // Provide minimal data structure
        dashboard[agentType] = {
          agentType,
          totalTests: 0,
          successfulTests: 0,
          averageResponseTime: 0,
          averageAccuracy: 0,
          averageConfidence: 0,
          successRate: 0,
          lastUpdated: new Date()
        };
      }
    }

    return dashboard;
  }

  // Run continuous benchmarking (for scheduled execution)
  async runContinuousBenchmarking(): Promise<void> {
    const agentTypes = ['compliance', 'formulation', 'marketing', 'operations', 'sourcing'];
    
    for (const agentType of agentTypes) {
      try {
        console.log(`Running benchmarks for ${agentType} agent...`);
        await this.runBenchmarkSuite(agentType);
        console.log(`Completed benchmarks for ${agentType} agent`);
        
        // Wait between agent types
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Benchmark failed for ${agentType}:`, error);
      }
    }
  }
}

export const metricsCollector = new RealMetricsCollector();