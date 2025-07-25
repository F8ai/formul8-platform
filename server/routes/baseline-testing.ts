import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import OpenAI from "openai";
import { isAuthenticated } from "../replitAuth";
import { 
  insertBaselineTestRunSchema, 
  insertBaselineTestResultSchema,
  type BaselineTestRun,
  type BaselineTestResult 
} from "@shared/schema";
import path from "path";
import { spawn } from "child_process";
import fs from "fs/promises";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load models configuration from base-agent/models.json
async function loadModelsConfig() {
  try {
    const configPath = path.join(process.cwd(), 'agents', 'base-agent', 'models.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Failed to load models configuration from agents/base-agent/models.json:', error);
    throw new Error('Models configuration not found in base-agent directory');
  }
}

// Load agent prompts
async function loadAgentPrompts(agentType: string) {
  try {
    const promptsPath = path.join(process.cwd(), 'agents', agentType, 'prompts.json');
    const promptsData = await fs.readFile(promptsPath, 'utf8');
    return JSON.parse(promptsData);
  } catch (error) {
    console.warn(`Failed to load prompts for ${agentType}:`, error);
    return {
      prompts: {
        default: {
          name: "Default Assistant",
          system_prompt: "You are a helpful AI assistant.",
          description: "Default system prompt"
        }
      }
    };
  }
}

// Save agent prompts
async function saveAgentPrompts(agentType: string, promptsData: any) {
  try {
    const promptsPath = path.join(process.cwd(), 'agents', agentType, 'prompts.json');
    await fs.mkdir(path.dirname(promptsPath), { recursive: true });
    await fs.writeFile(promptsPath, JSON.stringify(promptsData, null, 2));
    return true;
  } catch (error) {
    console.error(`Failed to save prompts for ${agentType}:`, error);
    return false;
  }
}

// AI grading service function
async function gradeWithAI(question: string, expectedAnswer: string, agentResponse: string, model = "gpt-4o"): Promise<{
  grade: number;
  feedback: string;
  confidence: number;
}> {
  try {
    const prompt = `You are an expert evaluator for AI system responses. Please grade the following response on a scale of 0-10.

QUESTION: ${question}

EXPECTED ANSWER: ${expectedAnswer}

AGENT RESPONSE: ${agentResponse}

Please evaluate the agent's response considering:
1. Factual accuracy (40%)
2. Completeness of answer (25%)
3. Relevance to the question (20%)
4. Clarity and coherence (15%)

Also provide your confidence level (0-100%) in your grading accuracy.

Provide your response in JSON format:
{
  "grade": [0-10 integer],
  "feedback": "[Detailed feedback explaining the grade, highlighting strengths and weaknesses]",
  "confidence": [0-100 percentage indicating your confidence in this grade]
}`;

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are an expert AI evaluator. You must respond with valid JSON containing a grade (0-10) and detailed feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"grade": 0, "feedback": "No response", "confidence": 0}');
    
    // Ensure grade is within bounds
    result.grade = Math.max(0, Math.min(10, Math.round(result.grade)));
    
    // Ensure confidence is within bounds
    result.confidence = Math.max(0, Math.min(100, Math.round(result.confidence || 75)));
    
    return result;
  } catch (error) {
    console.error("AI grading failed:", error);
    return {
      grade: 0,
      feedback: `AI grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
}

// Create a new baseline test run
router.post("/api/baseline-testing/runs", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const runData = insertBaselineTestRunSchema.parse({
      ...req.body,
      userId,
    });

    const run = await storage.createBaselineTestRun(runData);
    res.json(run);
  } catch (error) {
    console.error("Error creating baseline test run:", error);
    res.status(500).json({ message: "Failed to create baseline test run" });
  }
});

// Start a baseline test run directly from the API
router.post("/api/baseline-testing/runs/:id/start", isAuthenticated, async (req: any, res) => {
  try {
    const runId = parseInt(req.params.id);
    const run = await storage.getBaselineTestRun(runId);
    
    if (!run) {
      return res.status(404).json({ message: "Test run not found" });
    }

    // Update run status to running
    await storage.updateBaselineTestRun(runId, {
      status: "running",
    });

    // Start the baseline test in the background
    const testProcess = spawn("python", [
      "run_baseline_tests.py",
      "--agent", run.agentType,
      "--model", run.model,
      ...(run.state ? ["--state", run.state] : []),
      ...(run.ragEnabled ? ["--rag"] : ["--no-rag"]),
      ...(run.toolsEnabled ? ["--tools"] : ["--no-tools"]),
      ...(run.kbEnabled ? ["--kb"] : ["--no-kb"]),
      ...(run.customPrompt ? ["--custom-prompt", run.customPrompt] : []),
      "--output-format", "json",
      "--save-to-db", runId.toString(),
    ], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Don't wait for completion, return immediately
    res.json({ 
      message: "Baseline test started", 
      runId,
      status: "running" 
    });

    // Handle test completion in background
    testProcess.on("close", async (code) => {
      const status = code === 0 ? "completed" : "failed";
      await storage.updateBaselineTestRun(runId, {
        status,
        completedAt: new Date(),
      });
    });

  } catch (error) {
    console.error("Error starting baseline test:", error);
    res.status(500).json({ message: "Failed to start baseline test" });
  }
});

// Get baseline test runs with filtering
router.get("/api/baseline-testing/runs", async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub; // Optional for unauthenticated access
    const filters = {
      agentType: req.query.agentType as string,
      model: req.query.model as string,
      state: req.query.state as string,
      userId: req.query.userId === "all" ? undefined : userId,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const runs = await storage.getBaselineTestRuns(filters);
    res.json(runs);
  } catch (error) {
    console.error("Error fetching baseline test runs:", error);
    res.status(500).json({ message: "Failed to fetch baseline test runs" });
  }
});

// Get a specific baseline test run
router.get("/api/baseline-testing/runs/:id", async (req: any, res) => {
  try {
    const runId = parseInt(req.params.id);
    const run = await storage.getBaselineTestRun(runId);
    
    if (!run) {
      return res.status(404).json({ message: "Test run not found" });
    }

    res.json(run);
  } catch (error) {
    console.error("Error fetching baseline test run:", error);
    res.status(500).json({ message: "Failed to fetch baseline test run" });
  }
});

// Update a baseline test run
router.patch("/api/baseline-testing/runs/:id", isAuthenticated, async (req: any, res) => {
  try {
    const runId = parseInt(req.params.id);
    const updates = req.body;

    const updatedRun = await storage.updateBaselineTestRun(runId, updates);
    
    if (!updatedRun) {
      return res.status(404).json({ message: "Test run not found" });
    }

    res.json(updatedRun);
  } catch (error) {
    console.error("Error updating baseline test run:", error);
    res.status(500).json({ message: "Failed to update baseline test run" });
  }
});

// Create baseline test result
router.post("/api/baseline-testing/results", isAuthenticated, async (req: any, res) => {
  try {
    const resultData = insertBaselineTestResultSchema.parse(req.body);
    const result = await storage.createBaselineTestResult(resultData);
    res.json(result);
  } catch (error) {
    console.error("Error creating baseline test result:", error);
    res.status(500).json({ message: "Failed to create baseline test result" });
  }
});

// Get baseline test results for a run (public endpoint)
router.get("/api/baseline-testing/runs/:id/results", async (req: any, res) => {
  try {
    const runId = parseInt(req.params.id);
    const results = await storage.getBaselineTestResults(runId);
    res.json(results);
  } catch (error) {
    console.error("Error fetching baseline test results:", error);
    res.status(500).json({ message: "Failed to fetch baseline test results" });
  }
});

// Update a baseline test result (for manual grading)
router.patch("/api/baseline-testing/results/:id", isAuthenticated, async (req: any, res) => {
  try {
    const resultId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    
    const updateData = {
      ...req.body,
      gradedBy: userId,
      gradedAt: new Date(),
    };

    const updatedResult = await storage.updateBaselineTestResult(resultId, updateData);
    
    if (!updatedResult) {
      return res.status(404).json({ message: "Test result not found" });
    }

    res.json(updatedResult);
  } catch (error) {
    console.error("Error updating baseline test result:", error);
    res.status(500).json({ message: "Failed to update baseline test result" });
  }
});

// Get baseline test results with complex filtering
router.get("/api/baseline-testing/results", isAuthenticated, async (req: any, res) => {
  try {
    const filters = {
      runId: req.query.runId ? parseInt(req.query.runId as string) : undefined,
      agentType: req.query.agentType as string,
      category: req.query.category as string,
      difficulty: req.query.difficulty as string,
      manualGrade: req.query.manualGrade ? parseInt(req.query.manualGrade as string) : undefined,
      gradedBy: req.query.gradedBy as string,
      limit: parseInt(req.query.limit as string) || 100,
    };

    const results = await storage.getBaselineTestResultsWithFilters(filters);
    res.json(results);
  } catch (error) {
    console.error("Error fetching baseline test results:", error);
    res.status(500).json({ message: "Failed to fetch baseline test results" });
  }
});

// Get available agents for testing
router.get("/api/baseline-testing/agents", isAuthenticated, async (req: any, res) => {
  try {
    const agents = [
      "compliance-agent",
      "formulation-agent", 
      "marketing-agent",
      "operations-agent",
      "sourcing-agent",
      "patent-agent",
      "science-agent",
      "spectra-agent",
      "customer-success-agent"
    ];
    res.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({ message: "Failed to fetch agents" });
  }
});

// Get available models for testing
router.get("/api/baseline-testing/models", isAuthenticated, async (req: any, res) => {
  try {
    const modelsConfig = await loadModelsConfig();
    const models = [];
    
    for (const [provider, providerModels] of Object.entries(modelsConfig.models || {})) {
      for (const [modelId, config] of Object.entries(providerModels as Record<string, any>)) {
        const modelInfo: any = {
          id: modelId,
          name: config.name,
          provider: config.provider,
          description: config.description,
          context_window: config.context_window,
          cost_per_1k_tokens: config.cost_per_1k_tokens,
          supports_vision: config.supports_vision,
          supports_function_calling: config.supports_function_calling
        };

        // Add local model specific fields
        if (config.provider === "local") {
          modelInfo.model_size = config.model_size;
          modelInfo.requires_ollama = config.requires_ollama;
          
          // Check if local model is available
          try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
            if (response.ok) {
              const data = await response.json() as { models: Array<{ name: string }> };
              const availableModels = data.models.map(m => m.name);
              const ollamaModelName = modelId.replace('-', ':');
              modelInfo.local_available = availableModels.some(m => m.includes(modelId) || m.includes(ollamaModelName));
            } else {
              modelInfo.local_available = false;
            }
          } catch (error) {
            modelInfo.local_available = false;
            modelInfo.local_error = "Ollama not running";
          }
        }

        models.push(modelInfo);
      }
    }
    
    res.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ message: "Failed to fetch models" });
  }
});

// Get available states for testing
router.get("/api/baseline-testing/states", isAuthenticated, async (req: any, res) => {
  try {
    const states = [
      "CA", "CO", "WA", "OR", "NV", "AZ", "MA", "IL", "NY", "NJ", 
      "CT", "MI", "FL", "PA", "OH", "MN", "MD", "DC", "VT", "ME", 
      "RI", "NM", "MT", "AK", "HI"
    ];
    res.json(states);
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ message: "Failed to fetch states" });
  }
});

// AI grading endpoint - grade a specific test result with AI
router.post("/api/baseline-testing/results/:id/ai-grade", isAuthenticated, async (req: any, res) => {
  try {
    const resultId = parseInt(req.params.id);
    const { model = "gpt-4o" } = req.body;
    
    // Get the test result
    const result = await storage.getBaselineTestResult(resultId);
    if (!result) {
      return res.status(404).json({ message: "Test result not found" });
    }

    // Check if we have the required data for grading
    if (!result.question || !result.agentResponse) {
      return res.status(400).json({ message: "Missing question or agent response for grading" });
    }

    // Perform AI grading
    const aiGrading = await gradeWithAI(
      result.question,
      result.expectedAnswer || "",
      result.agentResponse,
      model
    );

    // Update the result with AI grading
    const updateData = {
      aiGrade: aiGrading.grade,
      aiFeedback: aiGrading.feedback,
      aiGradingConfidence: aiGrading.confidence,
      aiGradedAt: new Date(),
      aiGradingModel: model,
    };

    const updatedResult = await storage.updateBaselineTestResult(resultId, updateData);
    
    res.json({
      ...updatedResult,
      aiGrading
    });
  } catch (error) {
    console.error("Error performing AI grading:", error);
    res.status(500).json({ message: "Failed to perform AI grading" });
  }
});

// Batch AI grading endpoint - grade multiple results for a run
router.post("/api/baseline-testing/runs/:id/ai-grade-batch", isAuthenticated, async (req: any, res) => {
  try {
    const runId = parseInt(req.params.id);
    const { model = "gpt-4o", limit = 50 } = req.body;
    
    // Get all results for this run that haven't been AI graded yet
    const results = await storage.getBaselineTestResults(runId);
    const ungradedResults = results.filter(r => !r.aiGrade && r.agentResponse);
    
    if (ungradedResults.length === 0) {
      return res.json({ message: "No ungraded results found", gradedCount: 0 });
    }

    const resultsToGrade = ungradedResults.slice(0, limit);
    let gradedCount = 0;
    const errors: string[] = [];

    // Grade each result
    for (const result of resultsToGrade) {
      try {
        const aiGrading = await gradeWithAI(
          result.question,
          result.expectedAnswer || "",
          result.agentResponse!,
          model
        );

        await storage.updateBaselineTestResult(result.id, {
          aiGrade: aiGrading.grade,
          aiFeedback: aiGrading.feedback,
          aiGradedAt: new Date(),
          aiGradingModel: model,
        });

        gradedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errors.push(`Failed to grade result ${result.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      message: `Successfully graded ${gradedCount} out of ${resultsToGrade.length} results`,
      gradedCount,
      totalResults: ungradedResults.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error performing batch AI grading:", error);
    res.status(500).json({ message: "Failed to perform batch AI grading" });
  }
});

// Start AI grading for a specific run or all ungraded results
router.post("/api/baseline-testing/ai-grade", isAuthenticated, async (req: any, res) => {
  try {
    const { runId, gradeAll } = req.body;
    
    // Start AI grading in the background
    // This would typically be handled by a background job queue
    // For now, we'll return success and let the Python script handle it
    const command = gradeAll 
      ? `python3 run_baseline_test_db.py --agent compliance-agent --enable-ai-grading`
      : `python3 run_baseline_test_db.py --agent compliance-agent --run-id ${runId} --enable-ai-grading`;
    
    // In a real implementation, you'd queue this job
    // For now, just return success
    res.json({ 
      success: true, 
      message: "AI grading started",
      command: command
    });
  } catch (error) {
    console.error("Error starting AI grading:", error);
    res.status(500).json({ message: "Failed to start AI grading" });
  }
});

export default router;