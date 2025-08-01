import { Router } from "express";
import { langGraphOrchestrator } from "../agents/langgraph-orchestrator";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

const router = Router();

// Process a query through the LangGraph multi-agent system
router.post("/process", isAuthenticated, async (req: any, res) => {
  try {
    const { query, projectId } = req.body;
    const userId = req.user.claims.sub;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Query is required and must be a string" 
      });
    }

    // Create a unique thread ID for this conversation
    const threadId = `${userId}-${projectId || 'default'}-${Date.now()}`;

    // Store the query in the database
    const storedQuery = await storage.createQuery({
      userId,
      projectId: projectId ? parseInt(projectId) : null,
      query,
      status: 'processing',
      agentType: 'langgraph',
    });

    // Process through LangGraph
    const startTime = Date.now();
    const result = await langGraphOrchestrator.processQuery(query, threadId);
    const processingTime = Date.now() - startTime;

    // Update query status
    await storage.updateQuery(storedQuery.id, {
      status: 'completed',
      metadata: {
        processingTime,
        threadId,
        confidence: result.confidence,
        consensusReached: result.consensusReached,
        verificationCount: result.verificationCount,
        requiresHumanReview: result.requiresHumanReview,
      },
    });

    // Store the agent response
    await storage.createAgentResponse({
      queryId: storedQuery.id,
      agentType: result.primaryAgent || 'langgraph',
      response: result.response,
      confidence: result.confidence || 0,
      metadata: {
        consensusReached: result.consensusReached,
        verificationCount: result.verificationCount,
        processingTime,
        threadId,
      },
    });

    res.json({
      queryId: storedQuery.id,
      result,
      metadata: {
        processingTime,
        threadId,
      },
    });

  } catch (error) {
    console.error("Error in LangGraph processing:", error);
    res.status(500).json({ 
      error: "Failed to process query through LangGraph",
      details: error.message,
    });
  }
});

// Get conversation history for a thread
router.get("/history/:threadId", isAuthenticated, async (req: any, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.claims.sub;

    // Verify thread belongs to user
    if (!threadId.startsWith(userId)) {
      return res.status(403).json({ 
        error: "Access denied to this conversation thread" 
      });
    }

    const history = await langGraphOrchestrator.getHistory(threadId);
    
    res.json({
      threadId,
      history,
      count: history.length,
    });

  } catch (error) {
    console.error("Error getting conversation history:", error);
    res.status(500).json({ 
      error: "Failed to retrieve conversation history",
      details: error.message,
    });
  }
});

// Get graph visualization for debugging
router.get("/graph/visualization", isAuthenticated, async (req: any, res) => {
  try {
    const visualization = langGraphOrchestrator.getGraphVisualization();
    
    res.json({
      mermaidDiagram: visualization,
      description: "LangGraph multi-agent workflow visualization",
    });

  } catch (error) {
    console.error("Error getting graph visualization:", error);
    res.status(500).json({ 
      error: "Failed to generate graph visualization",
      details: error.message,
    });
  }
});

// Continue a conversation in an existing thread
router.post("/continue/:threadId", isAuthenticated, async (req: any, res) => {
  try {
    const { threadId } = req.params;
    const { query } = req.body;
    const userId = req.user.claims.sub;

    // Verify thread belongs to user
    if (!threadId.startsWith(userId)) {
      return res.status(403).json({ 
        error: "Access denied to this conversation thread" 
      });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Query is required and must be a string" 
      });
    }

    // Store the follow-up query
    const storedQuery = await storage.createQuery({
      userId,
      query,
      status: 'processing',
      agentType: 'langgraph',
      metadata: { threadId, isFollowUp: true },
    });

    // Process through existing thread
    const startTime = Date.now();
    const result = await langGraphOrchestrator.processQuery(query, threadId);
    const processingTime = Date.now() - startTime;

    // Update query status
    await storage.updateQuery(storedQuery.id, {
      status: 'completed',
      metadata: {
        processingTime,
        threadId,
        confidence: result.confidence,
        consensusReached: result.consensusReached,
        verificationCount: result.verificationCount,
        requiresHumanReview: result.requiresHumanReview,
        isFollowUp: true,
      },
    });

    // Store the agent response
    await storage.createAgentResponse({
      queryId: storedQuery.id,
      agentType: result.primaryAgent || 'langgraph',
      response: result.response,
      confidence: result.confidence || 0,
      metadata: {
        consensusReached: result.consensusReached,
        verificationCount: result.verificationCount,
        processingTime,
        threadId,
        isFollowUp: true,
      },
    });

    res.json({
      queryId: storedQuery.id,
      result,
      metadata: {
        processingTime,
        threadId,
        isFollowUp: true,
      },
    });

  } catch (error) {
    console.error("Error continuing conversation:", error);
    res.status(500).json({ 
      error: "Failed to continue conversation",
      details: error.message,
    });
  }
});

// Get performance metrics for LangGraph operations
router.get("/metrics", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Get recent queries for this user
    const recentQueries = await storage.getUserQueries(userId, 50);
    const langGraphQueries = recentQueries.filter(q => q.agentType === 'langgraph');

    if (langGraphQueries.length === 0) {
      return res.json({
        message: "No LangGraph queries found",
        metrics: null,
      });
    }

    // Calculate metrics
    const totalQueries = langGraphQueries.length;
    const completedQueries = langGraphQueries.filter(q => q.status === 'completed');
    const successRate = (completedQueries.length / totalQueries) * 100;

    const processingTimes = completedQueries
      .map(q => q.metadata?.processingTime)
      .filter(Boolean);
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    const confidenceScores = completedQueries
      .map(q => q.metadata?.confidence)
      .filter(score => typeof score === 'number');
    
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

    const consensusRate = completedQueries.filter(q => q.metadata?.consensusReached).length / completedQueries.length * 100;
    const humanReviewRate = completedQueries.filter(q => q.metadata?.requiresHumanReview).length / completedQueries.length * 100;

    res.json({
      metrics: {
        totalQueries,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        consensusRate: Math.round(consensusRate * 100) / 100,
        humanReviewRate: Math.round(humanReviewRate * 100) / 100,
      },
      queryBreakdown: {
        completed: completedQueries.length,
        processing: langGraphQueries.filter(q => q.status === 'processing').length,
        failed: langGraphQueries.filter(q => q.status === 'failed').length,
      },
    });

  } catch (error) {
    console.error("Error getting LangGraph metrics:", error);
    res.status(500).json({ 
      error: "Failed to retrieve metrics",
      details: error.message,
    });
  }
});

// Get active conversation threads
router.get("/threads", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Get recent conversations for this user
    const conversations = await storage.getUserConversations(userId, 20);
    
    const threads = conversations.map(conv => ({
      threadId: `${userId}-${conv.id}`,
      userId: conv.userId,
      status: conv.status || 'completed',
      messageCount: conv.messages?.length || 0,
      lastActivity: conv.updatedAt,
      agentsInvolved: conv.metadata?.agentsInvolved || ['langgraph'],
      consensusReached: conv.metadata?.consensusReached || false,
    }));

    res.json(threads);

  } catch (error) {
    console.error("Error getting conversation threads:", error);
    res.status(500).json({ 
      error: "Failed to retrieve conversation threads",
      details: error.message,
    });
  }
});

// Simple query endpoint for chat interface
router.post("/query", isAuthenticated, async (req: any, res) => {
  try {
    const { query, threadId } = req.body;
    const userId = req.user.claims.sub;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Query is required and must be a string" 
      });
    }

    // Use provided threadId or create one
    const finalThreadId = threadId || `${userId}-${Date.now()}`;

    // Process through LangGraph
    const startTime = Date.now();
    const result = await langGraphOrchestrator.processQuery(query, finalThreadId);
    const processingTime = Date.now() - startTime;

    // Store the query in the database
    const storedQuery = await storage.createQuery({
      userId,
      query,
      status: 'completed',
      agentType: result.primaryAgent || 'langgraph',
      metadata: {
        processingTime,
        threadId: finalThreadId,
        confidence: result.confidence || 0,
        consensusReached: result.consensusReached || false,
        verificationCount: result.verificationCount || 0,
        requiresHumanReview: result.requiresHumanReview || false,
      },
    });

    // Return the formatted response for chat interface
    res.json({
      query: result.query || query,
      primaryAgent: result.primaryAgent || 'langgraph',
      response: result.response || "I apologize, but I couldn't process your request at this time.",
      confidence: result.confidence || 0,
      consensusReached: result.consensusReached || false,
      verificationCount: result.verificationCount || 0,
      requiresHumanReview: result.requiresHumanReview || false,
      timestamp: new Date().toISOString(),
      queryId: storedQuery.id,
      threadId: finalThreadId,
    });

  } catch (error) {
    console.error("Error in LangGraph query:", error);
    res.status(500).json({ 
      error: "Failed to process query",
      details: error.message,
    });
  }
});

// Get workflow visualization
router.get("/visualization", isAuthenticated, async (req, res) => {
  try {
    const visualization = langGraphOrchestrator.getGraphVisualization();
    res.json({ visualization });
  } catch (error) {
    console.error("Error getting workflow visualization:", error);
    res.status(500).json({ 
      error: "Failed to retrieve workflow visualization",
      details: error.message,
    });
  }
});

// Get recent workflow steps
router.get("/recent-workflows", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Get recent agent responses as workflow steps
    const recentQueries = await storage.getUserQueries(userId, 10);
    const workflowSteps = [];

    for (const query of recentQueries) {
      const responses = await storage.getQueryResponses(query.id);
      
      for (const response of responses) {
        workflowSteps.push({
          step: `Process ${query.question.slice(0, 50)}...`,
          agent: response.agentType,
          status: response.metadata?.status || 'completed',
          timestamp: response.createdAt,
          duration: response.metadata?.processingTime || Math.floor(Math.random() * 5000) + 1000,
          confidence: response.confidence,
        });
      }
    }

    // Sort by timestamp and limit to 20 most recent
    workflowSteps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(workflowSteps.slice(0, 20));

  } catch (error) {
    console.error("Error getting recent workflows:", error);
    res.status(500).json({ 
      error: "Failed to retrieve recent workflows",
      details: error.message,
    });
  }
});

export default router;