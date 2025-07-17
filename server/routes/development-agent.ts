/**
 * Development Agent API Routes
 * Handles automated issue resolution requests
 */

import { Router } from "express";
import { developmentAgent } from "../agents/development-agent";
import { isAuthenticated } from "../replitAuth";

const router = Router();

/**
 * GET /api/development-agent/analyze/:repository/:issueNumber
 * Analyze a GitHub issue for automation suitability
 */
router.get("/analyze/:repository/:issueNumber", isAuthenticated, async (req, res) => {
  try {
    const { repository, issueNumber } = req.params;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const analysis = await developmentAgent.analyzeIssue(repository, parseInt(issueNumber));
    
    res.json({
      success: true,
      analysis,
      repository,
      issueNumber: parseInt(issueNumber),
    });
  } catch (error) {
    console.error("Error analyzing issue:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to analyze issue" 
    });
  }
});

/**
 * POST /api/development-agent/process
 * Process a GitHub issue for automated development
 */
router.post("/process", isAuthenticated, async (req, res) => {
  try {
    const { repository, issueNumber } = req.body;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!repository || !issueNumber) {
      return res.status(400).json({ 
        error: "Repository and issue number are required" 
      });
    }

    const result = await developmentAgent.processIssue(repository, issueNumber, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: "Issue processing started",
        task: result.task,
        analysis: result.analysis,
        replitUrl: result.replitUrl,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.reason || result.error,
        analysis: result.analysis,
      });
    }
  } catch (error) {
    console.error("Error processing issue:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process issue" 
    });
  }
});

/**
 * GET /api/development-agent/tasks
 * Get user's development tasks
 */
router.get("/tasks", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // In a real implementation, this would fetch from database
    const tasks = []; // await storage.getUserDevelopmentTasks(userId);
    
    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch tasks" 
    });
  }
});

/**
 * GET /api/development-agent/status/:taskId
 * Get development task status
 */
router.get("/status/:taskId", isAuthenticated, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // In a real implementation, this would fetch from database
    const task = null; // await storage.getDevelopmentTask(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: "Task not found" 
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error fetching task status:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch task status" 
    });
  }
});

/**
 * POST /api/development-agent/webhook
 * Handle GitHub webhooks for issue updates
 */
router.post("/webhook", async (req, res) => {
  try {
    const { action, issue, repository } = req.body;

    if (action === "opened" || action === "reopened") {
      // Check if issue is suitable for automation
      const analysis = await developmentAgent.analyzeIssue(
        repository.name, 
        issue.number
      );

      if (analysis.suitable) {
        console.log(`Issue #${issue.number} is suitable for automation`);
        
        // Add comment suggesting automation
        // This would be implemented in a real system
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to handle webhook" 
    });
  }
});

/**
 * POST /api/development-agent/ready-for-review
 * Mark development task as ready for review
 */
router.post("/ready-for-review", isAuthenticated, async (req, res) => {
  try {
    const { taskId, changes } = req.body;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    const result = await developmentAgent.markReadyForReview(taskId, changes);
    
    res.json({
      success: true,
      message: "Task marked as ready for review",
      pullRequestUrl: result.pullRequestUrl,
    });
  } catch (error) {
    console.error("Error marking task ready for review:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to mark task ready for review" 
    });
  }
});

/**
 * POST /api/development-agent/approve
 * Approve and merge development task
 */
router.post("/approve", isAuthenticated, async (req, res) => {
  try {
    const { taskId, approved } = req.body;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!taskId || typeof approved !== 'boolean') {
      return res.status(400).json({ error: "Task ID and approval status are required" });
    }

    const result = await developmentAgent.approveAndMerge(taskId, userId, approved);
    
    res.json({
      success: result.success,
      message: result.success ? result.message : result.reason,
    });
  } catch (error) {
    console.error("Error approving task:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to approve task" 
    });
  }
});

/**
 * GET /api/development-agent/repositories
 * Get list of repositories available for automation
 */
router.get("/repositories", isAuthenticated, async (req, res) => {
  try {
    const repositories = [
      "formulation-agent",
      "operations-agent",
      "sourcing-agent",
      "patent-agent",
      "spectra-agent",
      "customer-success-agent",
      "marketing-agent",
      "science-agent",
      "compliance-agent",
    ];

    res.json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch repositories" 
    });
  }
});

/**
 * GET /api/development-agent/issues/:repository
 * Get list of open issues for a repository
 */
router.get("/issues/:repository", isAuthenticated, async (req, res) => {
  try {
    const { repository } = req.params;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const issues = await developmentAgent.getRepositoryIssues(repository);
    
    res.json({
      success: true,
      repository,
      issues,
    });
  } catch (error) {
    console.error("Error fetching repository issues:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch repository issues" 
    });
  }
});

/**
 * POST /api/development-agent/agent-opinion
 * Add agent opinion comment to an issue
 */
router.post("/agent-opinion", isAuthenticated, async (req, res) => {
  try {
    const { repository, issueNumber } = req.body;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!repository || !issueNumber) {
      return res.status(400).json({ error: "Repository and issue number are required" });
    }

    // Get the issue details first
    const issueData = await developmentAgent.octokit.rest.issues.get({
      owner: "F8ai",
      repo: repository,
      issue_number: issueNumber,
    });

    // Add agent opinion comment
    await developmentAgent.addAgentOpinionComment(repository, issueNumber, issueData.data);

    res.json({
      success: true,
      message: "Agent opinion added successfully",
    });
  } catch (error) {
    console.error("Error adding agent opinion:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to add agent opinion" 
    });
  }
});

export default router;