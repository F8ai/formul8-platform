/**
 * Baseline Exam API Routes
 * Handles baseline exam management and GitHub integration
 */

import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { baselineExamService } from "../services/baseline-exam-service";
import { agentSelfAssessmentService } from "../services/agent-self-assessment";
import { Octokit } from "@octokit/rest";

const router = Router();

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

/**
 * GET /api/baseline-exam/agents
 * Get all agents with baseline exams
 */
router.get("/agents", isAuthenticated, async (req, res) => {
  try {
    const agentTypes = baselineExamService.getAvailableAgentTypes();
    res.json({ success: true, agents: agentTypes });
  } catch (error) {
    console.error("Error fetching baseline exam agents:", error);
    res.status(500).json({ success: false, error: "Failed to fetch agents" });
  }
});

/**
 * GET /api/baseline-exam/questions/:agentType
 * Get baseline exam questions for a specific agent
 */
router.get("/questions/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const questions = baselineExamService.getExamQuestions(agentType);
    res.json({ success: true, questions });
  } catch (error) {
    console.error("Error fetching baseline exam questions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch questions" });
  }
});

/**
 * POST /api/baseline-exam/run/:agentType
 * Run baseline exam for a specific agent
 */
router.post("/run/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const result = await baselineExamService.conductBaselineExam(agentType);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error running baseline exam:", error);
    res.status(500).json({ success: false, error: "Failed to run exam" });
  }
});

/**
 * GET /api/baseline-exam/results
 * Get latest baseline exam results for all agents
 */
router.get("/results", isAuthenticated, async (req, res) => {
  try {
    const results = await baselineExamService.getLatestExamResults();
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching baseline exam results:", error);
    res.status(500).json({ success: false, error: "Failed to fetch results" });
  }
});

/**
 * GET /api/baseline-exam/results/:agentType
 * Get baseline exam history for a specific agent
 */
router.get("/results/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const results = await baselineExamService.getAgentExamHistory(agentType);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error fetching agent exam history:", error);
    res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
});

/**
 * POST /api/baseline-exam/update-questions/:agentType
 * Update baseline exam questions for a specific agent in GitHub
 */
router.post("/update-questions/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const { questions } = req.body;
    
    // Update questions in GitHub repository
    const repoName = agentType;
    const questionContent = JSON.stringify(questions, null, 2);
    
    // Create or update baseline-exam.json file in the repository
    const filePath = 'baseline-exam.json';
    
    try {
      // Try to get existing file
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: 'F8ai',
        repo: repoName,
        path: filePath,
      });
      
      // Update existing file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'F8ai',
        repo: repoName,
        path: filePath,
        message: `Update baseline exam questions`,
        content: Buffer.from(questionContent).toString('base64'),
        sha: Array.isArray(existingFile) ? existingFile[0].sha : existingFile.sha,
      });
    } catch (error) {
      // File doesn't exist, create new one
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'F8ai',
        repo: repoName,
        path: filePath,
        message: `Create baseline exam questions`,
        content: Buffer.from(questionContent).toString('base64'),
      });
    }
    
    res.json({ success: true, message: "Questions updated successfully" });
  } catch (error) {
    console.error("Error updating baseline exam questions:", error);
    res.status(500).json({ success: false, error: "Failed to update questions" });
  }
});

/**
 * POST /api/baseline-exam/trigger-github-action/:agentType
 * Trigger GitHub Action to run baseline exam
 */
router.post("/trigger-github-action/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const repoName = agentType;
    
    // Trigger repository dispatch event
    await octokit.rest.repos.createDispatchEvent({
      owner: 'F8ai',
      repo: repoName,
      event_type: 'run-baseline-exam',
      client_payload: {
        triggered_by: 'dashboard',
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({ success: true, message: "GitHub Action triggered successfully" });
  } catch (error) {
    console.error("Error triggering GitHub Action:", error);
    res.status(500).json({ success: false, error: "Failed to trigger action" });
  }
});

/**
 * POST /api/baseline-exam/self-assess/:agentType
 * Trigger self-assessment for a specific agent
 */
router.post("/self-assess/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const assessment = await agentSelfAssessmentService.conductSelfAssessment(agentType);
    res.json({ success: true, assessment });
  } catch (error) {
    console.error("Error conducting self-assessment:", error);
    res.status(500).json({ success: false, error: "Failed to conduct self-assessment" });
  }
});

/**
 * POST /api/baseline-exam/self-assess-all
 * Trigger self-assessment for all agents
 */
router.post("/self-assess-all", isAuthenticated, async (req, res) => {
  try {
    const assessments = await agentSelfAssessmentService.runAllAgentAssessments();
    res.json({ success: true, assessments });
  } catch (error) {
    console.error("Error conducting all self-assessments:", error);
    res.status(500).json({ success: false, error: "Failed to conduct self-assessments" });
  }
});

/**
 * GET /api/baseline-exam/assessment-history/:agentType
 * Get self-assessment history for a specific agent
 */
router.get("/assessment-history/:agentType", isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    const history = await agentSelfAssessmentService.getAssessmentHistory(agentType);
    res.json({ success: true, history });
  } catch (error) {
    console.error("Error fetching assessment history:", error);
    res.status(500).json({ success: false, error: "Failed to fetch assessment history" });
  }
});

/**
 * GET /api/baseline-exam/badge-data/:agentType
 * Get badge data for a specific agent
 */
router.get("/badge-data/:agentType", async (req, res) => {
  try {
    const { agentType } = req.params;
    const results = await baselineExamService.getAgentExamHistory(agentType);
    
    if (results.length === 0) {
      return res.json({
        schemaVersion: 1,
        label: "baseline",
        message: "not tested",
        color: "lightgrey"
      });
    }
    
    const latestResult = results[0];
    const score = parseFloat(latestResult.overallScore);
    
    let color = "red";
    if (score >= 90) color = "brightgreen";
    else if (score >= 80) color = "green";
    else if (score >= 70) color = "yellow";
    else if (score >= 60) color = "orange";
    
    res.json({
      schemaVersion: 1,
      label: "baseline",
      message: `${score.toFixed(1)}%`,
      color: color
    });
  } catch (error) {
    console.error("Error generating badge data:", error);
    res.json({
      schemaVersion: 1,
      label: "baseline",
      message: "error",
      color: "red"
    });
  }
});

export default router;