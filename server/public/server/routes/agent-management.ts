import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { AgentManager } from "../agents/agent-manager";
import { BenchmarkManager } from "../benchmarks/benchmark-manager";
import { z } from "zod";

// Initialize managers - will be created when routes are registered
let agentManager: AgentManager;
let benchmarkManager: BenchmarkManager;

// Validation schemas
const agentConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  systemPrompt: z.string().min(10),
  model: z.string().default('gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().min(100).max(4000).default(2000),
  capabilities: z.array(z.string()),
  restrictions: z.array(z.string()),
  performanceTargets: z.object({
    accuracyTarget: z.number().min(0).max(100),
    responseTimeTarget: z.number().min(1000),
    confidenceTarget: z.number().min(0).max(100)
  }),
  verificationRules: z.object({
    requiresCrossVerification: z.boolean(),
    verifyingAgents: z.array(z.string()),
    humanVerificationThreshold: z.number().min(0).max(100)
  }),
  active: z.boolean().default(true)
});

const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['api', 'database', 'file', 'calculation', 'external']),
  config: z.object({
    endpoint: z.string().optional(),
    method: z.string().optional(),
    headers: z.record(z.string()).optional(),
    parameters: z.record(z.any()).optional()
  }),
  enabled: z.boolean().default(true)
});

const benchmarkSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(['accuracy', 'performance', 'safety', 'compliance', 'quality', 'custom']),
  agentTypes: z.array(z.string()),
  scoring: z.object({
    weights: z.object({
      accuracy: z.number().min(0).max(1),
      responseTime: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1),
      safety: z.number().min(0).max(1),
      compliance: z.number().min(0).max(1)
    }),
    passingScore: z.number().min(0).max(100),
    perfectScore: z.number().min(0).max(100),
    penalties: z.object({
      timeoutPenalty: z.number().min(0),
      errorPenalty: z.number().min(0),
      safetyViolationPenalty: z.number().min(0)
    })
  }),
  schedule: z.object({
    frequency: z.enum(['manual', 'hourly', 'daily', 'weekly', 'monthly']),
    enabled: z.boolean()
  }),
  active: z.boolean().default(true)
});

const testCaseSchema = z.object({
  name: z.string().min(1),
  query: z.string().min(1),
  context: z.record(z.any()).optional(),
  expectedConfidence: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100)
  }),
  expectedResponseTime: z.number().min(100),
  weight: z.number().min(1).max(10),
  tags: z.array(z.string()),
  expectedOutput: z.object({
    type: z.enum(['exact_match', 'contains', 'regex', 'semantic', 'custom']),
    value: z.string(),
    threshold: z.number().optional()
  }).optional(),
  validator: z.object({
    type: z.enum(['javascript', 'ai_judge', 'external_api']),
    code: z.string().optional(),
    prompt: z.string().optional(),
    endpoint: z.string().optional()
  }).optional()
});

export function registerAgentManagementRoutes(app: Express): void {
  
  // Initialize managers when routes are registered
  agentManager = new AgentManager();
  benchmarkManager = new BenchmarkManager(agentManager);
  
  // ===== AGENT MANAGEMENT ROUTES =====
  
  // Get all agents
  app.get('/api/agents/management', isAuthenticated, (req, res) => {
    try {
      const agents = agentManager.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error getting agents:", error);
      res.status(500).json({ message: "Failed to get agents" });
    }
  });

  // Get specific agent
  app.get('/api/agents/management/:agentId', isAuthenticated, (req, res) => {
    try {
      const { agentId } = req.params;
      const agent = agentManager.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error getting agent:", error);
      res.status(500).json({ message: "Failed to get agent" });
    }
  });

  // Create new agent
  app.post('/api/agents/management', isAuthenticated, async (req: any, res) => {
    try {
      const agentData = agentConfigSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const agent = await agentManager.createAgent({
        ...agentData,
        tools: [],
        createdBy: userId
      });
      
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid agent configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  // Update agent
  app.put('/api/agents/management/:agentId', isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const updates = agentConfigSchema.partial().parse(req.body);
      
      const agent = await agentManager.updateAgent(agentId, updates);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // Delete agent
  app.delete('/api/agents/management/:agentId', isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const deleted = await agentManager.deleteAgent(agentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json({ message: "Agent deleted successfully" });
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Get agent performance dashboard
  app.get('/api/agents/management/dashboard', isAuthenticated, async (req, res) => {
    try {
      const dashboard = await agentManager.getPerformanceDashboard();
      res.json(dashboard);
    } catch (error) {
      console.error("Error getting performance dashboard:", error);
      res.status(500).json({ message: "Failed to get performance dashboard" });
    }
  });

  // Get agent metrics
  app.get('/api/agents/management/:agentId/metrics', isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const { timeframe = 'day' } = req.query;
      
      const metrics = await agentManager.getAgentMetrics(agentId, timeframe as any);
      if (!metrics) {
        return res.status(404).json({ message: "Metrics not found" });
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error getting agent metrics:", error);
      res.status(500).json({ message: "Failed to get agent metrics" });
    }
  });

  // ===== TOOL MANAGEMENT ROUTES =====

  // Add tool to agent
  app.post('/api/agents/management/:agentId/tools', isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const toolData = toolSchema.parse(req.body);
      
      const success = await agentManager.addToolToAgent(agentId, toolData);
      if (!success) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.status(201).json({ message: "Tool added successfully" });
    } catch (error) {
      console.error("Error adding tool:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tool configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add tool" });
    }
  });

  // Update agent tool
  app.put('/api/agents/management/:agentId/tools/:toolId', isAuthenticated, async (req, res) => {
    try {
      const { agentId, toolId } = req.params;
      const updates = toolSchema.partial().parse(req.body);
      
      const success = await agentManager.updateAgentTool(agentId, toolId, updates);
      if (!success) {
        return res.status(404).json({ message: "Agent or tool not found" });
      }
      
      res.json({ message: "Tool updated successfully" });
    } catch (error) {
      console.error("Error updating tool:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tool data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  // Remove tool from agent
  app.delete('/api/agents/management/:agentId/tools/:toolId', isAuthenticated, async (req, res) => {
    try {
      const { agentId, toolId } = req.params;
      
      const success = await agentManager.removeToolFromAgent(agentId, toolId);
      if (!success) {
        return res.status(404).json({ message: "Agent or tool not found" });
      }
      
      res.json({ message: "Tool removed successfully" });
    } catch (error) {
      console.error("Error removing tool:", error);
      res.status(500).json({ message: "Failed to remove tool" });
    }
  });

  // Execute tool
  app.post('/api/agents/management/:agentId/tools/:toolId/execute', isAuthenticated, async (req, res) => {
    try {
      const { agentId, toolId } = req.params;
      const { parameters = {} } = req.body;
      
      const result = await agentManager.executeTool(agentId, toolId, parameters);
      res.json({ result });
    } catch (error) {
      console.error("Error executing tool:", error);
      res.status(500).json({ message: error.message || "Failed to execute tool" });
    }
  });

  // ===== BENCHMARK MANAGEMENT ROUTES =====

  // Get all benchmarks
  app.get('/api/benchmarks/management', isAuthenticated, (req, res) => {
    try {
      const { category, agentType } = req.query;
      
      let benchmarks = benchmarkManager.getAllBenchmarks();
      
      if (category) {
        benchmarks = benchmarkManager.getBenchmarksByCategory(category as string);
      } else if (agentType) {
        benchmarks = benchmarkManager.getBenchmarksByAgent(agentType as string);
      }
      
      res.json(benchmarks);
    } catch (error) {
      console.error("Error getting benchmarks:", error);
      res.status(500).json({ message: "Failed to get benchmarks" });
    }
  });

  // Get specific benchmark
  app.get('/api/benchmarks/management/:benchmarkId', isAuthenticated, (req, res) => {
    try {
      const { benchmarkId } = req.params;
      const benchmark = benchmarkManager.getBenchmark(benchmarkId);
      
      if (!benchmark) {
        return res.status(404).json({ message: "Benchmark not found" });
      }
      
      res.json(benchmark);
    } catch (error) {
      console.error("Error getting benchmark:", error);
      res.status(500).json({ message: "Failed to get benchmark" });
    }
  });

  // Create new benchmark
  app.post('/api/benchmarks/management', isAuthenticated, async (req: any, res) => {
    try {
      const benchmarkData = benchmarkSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const benchmark = await benchmarkManager.createBenchmark({
        ...benchmarkData,
        testCases: [],
        createdBy: userId
      });
      
      res.status(201).json(benchmark);
    } catch (error) {
      console.error("Error creating benchmark:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid benchmark configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create benchmark" });
    }
  });

  // Update benchmark
  app.put('/api/benchmarks/management/:benchmarkId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId } = req.params;
      const updates = benchmarkSchema.partial().parse(req.body);
      
      const benchmark = await benchmarkManager.updateBenchmark(benchmarkId, updates);
      if (!benchmark) {
        return res.status(404).json({ message: "Benchmark not found" });
      }
      
      res.json(benchmark);
    } catch (error) {
      console.error("Error updating benchmark:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update benchmark" });
    }
  });

  // Delete benchmark
  app.delete('/api/benchmarks/management/:benchmarkId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId } = req.params;
      const deleted = await benchmarkManager.deleteBenchmark(benchmarkId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Benchmark not found" });
      }
      
      res.json({ message: "Benchmark deleted successfully" });
    } catch (error) {
      console.error("Error deleting benchmark:", error);
      res.status(500).json({ message: "Failed to delete benchmark" });
    }
  });

  // ===== TEST CASE MANAGEMENT ROUTES =====

  // Add test case to benchmark
  app.post('/api/benchmarks/management/:benchmarkId/tests', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId } = req.params;
      const testCaseData = testCaseSchema.parse(req.body);
      
      const success = await benchmarkManager.addTestCase(benchmarkId, testCaseData);
      if (!success) {
        return res.status(404).json({ message: "Benchmark not found" });
      }
      
      res.status(201).json({ message: "Test case added successfully" });
    } catch (error) {
      console.error("Error adding test case:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test case configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add test case" });
    }
  });

  // Update test case
  app.put('/api/benchmarks/management/:benchmarkId/tests/:testCaseId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId, testCaseId } = req.params;
      const updates = testCaseSchema.partial().parse(req.body);
      
      const success = await benchmarkManager.updateTestCase(benchmarkId, testCaseId, updates);
      if (!success) {
        return res.status(404).json({ message: "Benchmark or test case not found" });
      }
      
      res.json({ message: "Test case updated successfully" });
    } catch (error) {
      console.error("Error updating test case:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update test case" });
    }
  });

  // Remove test case
  app.delete('/api/benchmarks/management/:benchmarkId/tests/:testCaseId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId, testCaseId } = req.params;
      
      const success = await benchmarkManager.removeTestCase(benchmarkId, testCaseId);
      if (!success) {
        return res.status(404).json({ message: "Benchmark or test case not found" });
      }
      
      res.json({ message: "Test case removed successfully" });
    } catch (error) {
      console.error("Error removing test case:", error);
      res.status(500).json({ message: "Failed to remove test case" });
    }
  });

  // ===== BENCHMARK EXECUTION ROUTES =====

  // Run specific benchmark for an agent
  app.post('/api/benchmarks/management/:benchmarkId/run/:agentId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId, agentId } = req.params;
      
      // Start benchmark execution asynchronously
      benchmarkManager.runBenchmark(benchmarkId, agentId)
        .then(result => {
          console.log(`Benchmark ${benchmarkId} completed for agent ${agentId}`);
        })
        .catch(error => {
          console.error(`Benchmark ${benchmarkId} failed for agent ${agentId}:`, error);
        });
      
      res.json({ message: "Benchmark execution started", status: "running" });
    } catch (error) {
      console.error("Error starting benchmark:", error);
      res.status(500).json({ message: "Failed to start benchmark" });
    }
  });

  // Run all benchmarks for an agent
  app.post('/api/benchmarks/management/run-all/:agentId', isAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Start all benchmarks execution asynchronously
      benchmarkManager.runAllBenchmarks(agentId)
        .then(results => {
          console.log(`All benchmarks completed for agent ${agentId}: ${results.length} benchmarks run`);
        })
        .catch(error => {
          console.error(`Benchmarks failed for agent ${agentId}:`, error);
        });
      
      res.json({ message: "All benchmarks execution started", status: "running" });
    } catch (error) {
      console.error("Error starting benchmarks:", error);
      res.status(500).json({ message: "Failed to start benchmarks" });
    }
  });

  // Get benchmark analytics
  app.get('/api/benchmarks/management/:benchmarkId/analytics/:agentId', isAuthenticated, async (req, res) => {
    try {
      const { benchmarkId, agentId } = req.params;
      const { timeframe = 'week' } = req.query;
      
      const analytics = await benchmarkManager.getBenchmarkAnalytics(benchmarkId, agentId, timeframe as any);
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      
      res.json(analytics);
    } catch (error) {
      console.error("Error getting benchmark analytics:", error);
      res.status(500).json({ message: "Failed to get benchmark analytics" });
    }
  });

  // Get benchmark summary
  app.get('/api/benchmarks/management/summary', isAuthenticated, async (req, res) => {
    try {
      const summary = await benchmarkManager.getBenchmarkSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error getting benchmark summary:", error);
      res.status(500).json({ message: "Failed to get benchmark summary" });
    }
  });

  // Export managers for use in other modules
  app.locals.agentManager = agentManager;
  app.locals.benchmarkManager = benchmarkManager;
}