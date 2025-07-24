import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { 
  insertBaselineTestRunSchema, 
  insertBaselineTestResultSchema,
  type BaselineTestRun,
  type BaselineTestResult 
} from "@shared/schema";
import path from "path";
import { spawn } from "child_process";

const router = Router();

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
router.get("/api/baseline-testing/runs", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
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
router.get("/api/baseline-testing/runs/:id", isAuthenticated, async (req: any, res) => {
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

// Get baseline test results for a run
router.get("/api/baseline-testing/runs/:id/results", isAuthenticated, async (req: any, res) => {
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
    const models = [
      "gpt-4o",
      "gpt-4o-mini", 
      "o1-preview",
      "o1-mini",
      "o3",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "gemini-1.5-pro-002"
    ];
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

export default router;