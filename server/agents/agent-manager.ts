import { BaseAgent, type AgentResponse } from './base.js';
import OpenAI from 'openai';

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'database' | 'file' | 'calculation' | 'external';
  config: {
    endpoint?: string;
    apiKey?: string;
    method?: string;
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
  };
  enabled: boolean;
  lastUsed?: Date;
  usageCount: number;
  successRate: number;
}

export interface AgentConfiguration {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: AgentTool[];
  capabilities: string[];
  restrictions: string[];
  performanceTargets: {
    accuracyTarget: number;
    responseTimeTarget: number;
    confidenceTarget: number;
  };
  verificationRules: {
    requiresCrossVerification: boolean;
    verifyingAgents: string[];
    humanVerificationThreshold: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMetrics {
  agentId: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  totalQueries: number;
  successfulResponses: number;
  averageResponseTime: number;
  averageConfidence: number;
  averageAccuracy: number;
  toolUsage: Record<string, number>;
  errorRate: number;
  humanVerificationRate: number;
  crossVerificationSuccess: number;
  performanceScore: number;
  trends: {
    responseTime: number[];
    confidence: number[];
    accuracy: number[];
    errorRate: number[];
  };
  topQueries: Array<{
    query: string;
    count: number;
    avgConfidence: number;
  }>;
  lastUpdated: Date;
}

export class AgentManager {
  private agents: Map<string, AgentConfiguration> = new Map();
  private metrics: Map<string, AgentMetrics> = new Map();
  private openai?: OpenAI;

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      console.warn('OpenAI API key not found - AI features will be limited');
    }
    this.initializeDefaultAgents();
  }

  // Agent Configuration Management
  async createAgent(config: Omit<AgentConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfiguration> {
    const agentConfig: AgentConfiguration = {
      ...config,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.agents.set(agentConfig.id, agentConfig);
    this.initializeAgentMetrics(agentConfig.id);
    
    return agentConfig;
  }

  async updateAgent(agentId: string, updates: Partial<AgentConfiguration>): Promise<AgentConfiguration | null> {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date()
    };

    this.agents.set(agentId, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      this.metrics.delete(agentId);
    }
    return deleted;
  }

  getAgent(agentId: string): AgentConfiguration | null {
    return this.agents.get(agentId) || null;
  }

  getAllAgents(): AgentConfiguration[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): AgentConfiguration[] {
    return Array.from(this.agents.values()).filter(agent => agent.active);
  }

  // Tool Management
  async addToolToAgent(agentId: string, tool: Omit<AgentTool, 'lastUsed' | 'usageCount' | 'successRate'>): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const newTool: AgentTool = {
      ...tool,
      usageCount: 0,
      successRate: 0
    };

    agent.tools.push(newTool);
    agent.updatedAt = new Date();
    
    return true;
  }

  async updateAgentTool(agentId: string, toolId: string, updates: Partial<AgentTool>): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const toolIndex = agent.tools.findIndex(tool => tool.id === toolId);
    if (toolIndex === -1) return false;

    agent.tools[toolIndex] = { ...agent.tools[toolIndex], ...updates };
    agent.updatedAt = new Date();
    
    return true;
  }

  async removeToolFromAgent(agentId: string, toolId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    const initialLength = agent.tools.length;
    agent.tools = agent.tools.filter(tool => tool.id !== toolId);
    agent.updatedAt = new Date();
    
    return agent.tools.length < initialLength;
  }

  // Tool Execution
  async executeTool(agentId: string, toolId: string, parameters: Record<string, any>): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    const tool = agent.tools.find(t => t.id === toolId);
    if (!tool || !tool.enabled) throw new Error('Tool not found or disabled');

    const startTime = Date.now();
    let success = false;

    try {
      let result;

      switch (tool.type) {
        case 'api':
          result = await this.executeApiTool(tool, parameters);
          break;
        case 'database':
          result = await this.executeDatabaseTool(tool, parameters);
          break;
        case 'calculation':
          result = await this.executeCalculationTool(tool, parameters);
          break;
        case 'external':
          result = await this.executeExternalTool(tool, parameters);
          break;
        default:
          throw new Error(`Unsupported tool type: ${tool.type}`);
      }

      success = true;
      this.updateToolMetrics(agentId, toolId, true, Date.now() - startTime);
      return result;

    } catch (error) {
      this.updateToolMetrics(agentId, toolId, false, Date.now() - startTime);
      throw error;
    }
  }

  // Metrics and Monitoring
  async getAgentMetrics(agentId: string, timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<AgentMetrics | null> {
    return this.metrics.get(`${agentId}_${timeframe}`) || null;
  }

  async updateAgentMetrics(agentId: string, queryResult: {
    responseTime: number;
    confidence: number;
    success: boolean;
    toolsUsed: string[];
    requiresHumanVerification: boolean;
    query: string;
  }): Promise<void> {
    const timeframes: Array<'hour' | 'day' | 'week' | 'month'> = ['hour', 'day', 'week', 'month'];
    
    for (const timeframe of timeframes) {
      const metricsKey = `${agentId}_${timeframe}`;
      let metrics = this.metrics.get(metricsKey);
      
      if (!metrics) {
        metrics = this.initializeAgentMetrics(agentId, timeframe);
      }

      // Update metrics
      metrics.totalQueries++;
      if (queryResult.success) metrics.successfulResponses++;
      
      // Update averages
      metrics.averageResponseTime = this.updateAverage(
        metrics.averageResponseTime, 
        queryResult.responseTime, 
        metrics.totalQueries
      );
      
      metrics.averageConfidence = this.updateAverage(
        metrics.averageConfidence, 
        queryResult.confidence, 
        metrics.totalQueries
      );

      // Update tool usage
      queryResult.toolsUsed.forEach(toolId => {
        metrics.toolUsage[toolId] = (metrics.toolUsage[toolId] || 0) + 1;
      });

      // Update rates
      metrics.errorRate = ((metrics.totalQueries - metrics.successfulResponses) / metrics.totalQueries) * 100;
      if (queryResult.requiresHumanVerification) {
        metrics.humanVerificationRate = ((metrics.humanVerificationRate * (metrics.totalQueries - 1)) + 1) / metrics.totalQueries;
      }

      // Update trends (keep last 24 data points)
      metrics.trends.responseTime.push(queryResult.responseTime);
      metrics.trends.confidence.push(queryResult.confidence);
      metrics.trends.errorRate.push(queryResult.success ? 0 : 1);
      
      if (metrics.trends.responseTime.length > 24) {
        metrics.trends.responseTime.shift();
        metrics.trends.confidence.shift();
        metrics.trends.errorRate.shift();
      }

      // Update top queries
      const existingQuery = metrics.topQueries.find(q => q.query === queryResult.query);
      if (existingQuery) {
        existingQuery.count++;
        existingQuery.avgConfidence = this.updateAverage(
          existingQuery.avgConfidence, 
          queryResult.confidence, 
          existingQuery.count
        );
      } else {
        metrics.topQueries.push({
          query: queryResult.query,
          count: 1,
          avgConfidence: queryResult.confidence
        });
      }

      // Keep only top 10 queries
      metrics.topQueries.sort((a, b) => b.count - a.count);
      if (metrics.topQueries.length > 10) {
        metrics.topQueries = metrics.topQueries.slice(0, 10);
      }

      metrics.lastUpdated = new Date();
      this.metrics.set(metricsKey, metrics);
    }
  }

  async getPerformanceDashboard(): Promise<{
    overview: {
      totalAgents: number;
      activeAgents: number;
      totalQueries: number;
      averageResponseTime: number;
      overallSuccessRate: number;
    };
    agentRankings: Array<{
      agentId: string;
      name: string;
      performanceScore: number;
      successRate: number;
      averageResponseTime: number;
    }>;
    alertsAndIssues: Array<{
      agentId: string;
      type: 'performance' | 'error' | 'timeout' | 'accuracy';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    const agents = this.getAllAgents();
    const activeAgents = this.getActiveAgents();
    
    let totalQueries = 0;
    let totalResponseTime = 0;
    let totalSuccessful = 0;
    
    const agentRankings: any[] = [];
    const alerts: any[] = [];

    for (const agent of activeAgents) {
      const metrics = await this.getAgentMetrics(agent.id, 'day');
      if (metrics) {
        totalQueries += metrics.totalQueries;
        totalResponseTime += metrics.averageResponseTime * metrics.totalQueries;
        totalSuccessful += metrics.successfulResponses;

        const successRate = (metrics.successfulResponses / metrics.totalQueries) * 100;
        agentRankings.push({
          agentId: agent.id,
          name: agent.name,
          performanceScore: metrics.performanceScore,
          successRate,
          averageResponseTime: metrics.averageResponseTime
        });

        // Check for performance issues
        if (metrics.averageResponseTime > agent.performanceTargets.responseTimeTarget) {
          alerts.push({
            agentId: agent.id,
            type: 'timeout',
            message: `Response time (${metrics.averageResponseTime}ms) exceeds target (${agent.performanceTargets.responseTimeTarget}ms)`,
            severity: 'high'
          });
        }

        if (successRate < 90) {
          alerts.push({
            agentId: agent.id,
            type: 'error',
            message: `Success rate (${successRate.toFixed(1)}%) below 90%`,
            severity: successRate < 80 ? 'critical' : 'high'
          });
        }

        if (metrics.averageConfidence < agent.performanceTargets.confidenceTarget) {
          alerts.push({
            agentId: agent.id,
            type: 'accuracy',
            message: `Average confidence (${metrics.averageConfidence.toFixed(1)}%) below target (${agent.performanceTargets.confidenceTarget}%)`,
            severity: 'medium'
          });
        }
      }
    }

    agentRankings.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      overview: {
        totalAgents: agents.length,
        activeAgents: activeAgents.length,
        totalQueries,
        averageResponseTime: totalQueries > 0 ? totalResponseTime / totalQueries : 0,
        overallSuccessRate: totalQueries > 0 ? (totalSuccessful / totalQueries) * 100 : 0
      },
      agentRankings,
      alertsAndIssues: alerts
    };
  }

  // Private helper methods
  private async executeApiTool(tool: AgentTool, parameters: Record<string, any>): Promise<any> {
    const response = await fetch(tool.config.endpoint!, {
      method: tool.config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...tool.config.headers
      },
      body: tool.config.method !== 'GET' ? JSON.stringify({ ...tool.config.parameters, ...parameters }) : undefined
    });

    if (!response.ok) {
      throw new Error(`API tool failed: ${response.status} ${response.statusText}`);
    }

    // Try to parse JSON, fallback to text if not JSON
    let result;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = {
          success: true,
          status: response.status,
          statusText: response.statusText,
          data: text || 'OK',
          tool: tool.name
        };
      }
    } catch (error) {
      // If JSON parsing fails, return basic response info
      result = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        message: 'API call succeeded but response could not be parsed as JSON',
        tool: tool.name
      };
    }

    return result;
  }

  private async executeDatabaseTool(tool: AgentTool, parameters: Record<string, any>): Promise<any> {
    // Implementation for database tools
    // This would integrate with your database layer
    throw new Error('Database tools not yet implemented');
  }

  private async executeCalculationTool(tool: AgentTool, parameters: Record<string, any>): Promise<any> {
    // Implementation for calculation tools
    const { expression, operation, a, b } = parameters;
    
    try {
      let result;
      
      if (expression) {
        // Evaluate mathematical expression (safely)
        result = this.evaluateExpression(expression);
      } else if (operation && a !== undefined && b !== undefined) {
        // Perform basic operations
        switch (operation) {
          case 'add': result = Number(a) + Number(b); break;
          case 'subtract': result = Number(a) - Number(b); break;
          case 'multiply': result = Number(a) * Number(b); break;
          case 'divide': result = Number(b) !== 0 ? Number(a) / Number(b) : 'Error: Division by zero'; break;
          default: throw new Error(`Unknown operation: ${operation}`);
        }
      } else {
        throw new Error('Invalid parameters for calculation tool');
      }
      
      return { 
        success: true,
        result,
        tool: tool.name,
        parameters 
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tool: tool.name,
        parameters
      };
    }
  }

  private async executeExternalTool(tool: AgentTool, parameters: Record<string, any>): Promise<any> {
    // Implementation for external service integrations
    return {
      success: true,
      result: `External tool ${tool.name} executed successfully`,
      message: 'External tool simulation - this would integrate with real external services',
      tool: tool.name,
      parameters: { ...tool.config.parameters, ...parameters }
    };
  }

  private evaluateExpression(expression: string): number {
    // Basic safe expression evaluation
    // Remove any non-mathematical characters for security
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      // Use Function constructor for safer evaluation than eval
      const result = new Function('return ' + sanitized)();
      if (typeof result === 'number' && !isNaN(result)) {
        return result;
      } else {
        throw new Error('Invalid mathematical expression');
      }
    } catch (error) {
      throw new Error('Failed to evaluate expression: ' + error.message);
    }
  }

  private updateToolMetrics(agentId: string, toolId: string, success: boolean, responseTime: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const tool = agent.tools.find(t => t.id === toolId);
    if (!tool) return;

    tool.usageCount++;
    tool.lastUsed = new Date();
    
    const previousSuccesses = Math.round(tool.successRate * (tool.usageCount - 1));
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    tool.successRate = newSuccesses / tool.usageCount;
  }

  private initializeAgentMetrics(agentId: string, timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): AgentMetrics {
    const metrics: AgentMetrics = {
      agentId,
      timeframe,
      totalQueries: 0,
      successfulResponses: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      averageAccuracy: 0,
      toolUsage: {},
      errorRate: 0,
      humanVerificationRate: 0,
      crossVerificationSuccess: 0,
      performanceScore: 100,
      trends: {
        responseTime: [],
        confidence: [],
        accuracy: [],
        errorRate: []
      },
      topQueries: [],
      lastUpdated: new Date()
    };

    this.metrics.set(`${agentId}_${timeframe}`, metrics);
    return metrics;
  }

  private updateAverage(currentAverage: number, newValue: number, totalCount: number): number {
    return ((currentAverage * (totalCount - 1)) + newValue) / totalCount;
  }

  private initializeDefaultAgents(): void {
    // Initialize default agent configurations
    const defaultTools: AgentTool[] = [
      {
        id: 'api_status_check',
        name: 'API Status Check',
        description: 'Check the status of external APIs and services',
        type: 'api',
        config: {
          endpoint: 'https://httpbin.org/status/200',
          method: 'GET',
          headers: {}
        },
        enabled: true,
        usageCount: 0,
        successRate: 0
      },
      {
        id: 'calculation_tool',
        name: 'Basic Calculator',
        description: 'Perform basic mathematical calculations',
        type: 'calculation',
        config: {},
        enabled: true,
        usageCount: 0,
        successRate: 0
      },
      {
        id: 'compliance_check',
        name: 'Compliance Checker',
        description: 'Check compliance requirements and regulations',
        type: 'external',
        config: {
          parameters: {
            state: 'california',
            sector: 'cannabis'
          }
        },
        enabled: true,
        usageCount: 0,
        successRate: 0
      }
    ];

    const defaultAgents = [
      {
        name: 'Compliance Agent',
        type: 'compliance',
        systemPrompt: 'You are a cannabis compliance expert specializing in regulatory guidance and risk assessment.',
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        tools: [...defaultTools],
        capabilities: ['regulatory-guidance', 'sop-verification', 'risk-assessment'],
        restrictions: ['no-legal-advice', 'jurisdiction-specific'],
        performanceTargets: { accuracyTarget: 95, responseTimeTarget: 30000, confidenceTarget: 85 },
        verificationRules: { requiresCrossVerification: true, verifyingAgents: ['marketing'], humanVerificationThreshold: 50 },
        active: true
      },
      {
        name: 'Development Agent',
        type: 'development',
        systemPrompt: 'You are a software development expert with tools for testing and deployment.',
        model: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 3000,
        tools: [...defaultTools],
        capabilities: ['code-review', 'testing', 'deployment'],
        restrictions: ['no-production-changes'],
        performanceTargets: { accuracyTarget: 90, responseTimeTarget: 25000, confidenceTarget: 80 },
        verificationRules: { requiresCrossVerification: false, verifyingAgents: [], humanVerificationThreshold: 70 },
        active: true
      }
    ];

    // Create default agents if they don't exist
    defaultAgents.forEach(async (agentConfig) => {
      const existingAgent = Array.from(this.agents.values()).find(a => a.name === agentConfig.name);
      if (!existingAgent) {
        await this.createAgent(agentConfig);
      }
    });
  }
}