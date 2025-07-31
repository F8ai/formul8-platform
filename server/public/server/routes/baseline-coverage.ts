import express from 'express';
import { baselineCoverageAnalyzer } from '../services/baseline-coverage-analyzer';

const router = express.Router();

// Get baseline coverage analysis for a specific agent
router.get('/api/baseline-coverage/:agentName', async (req, res) => {
  const { agentName } = req.params;
  
  try {
    const analysis = await baselineCoverageAnalyzer.analyzeAgentCoverage(agentName);
    res.json(analysis);
  } catch (error) {
    console.error(`Error analyzing baseline coverage for ${agentName}:`, error);
    res.status(500).json({ 
      error: 'Failed to analyze baseline coverage',
      details: error.message 
    });
  }
});

// Get baseline coverage analysis for all agents
router.get('/api/baseline-coverage', async (req, res) => {
  try {
    const analysis = await baselineCoverageAnalyzer.analyzeAllAgents();
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing baseline coverage for all agents:', error);
    res.status(500).json({ 
      error: 'Failed to analyze baseline coverage for all agents',
      details: error.message 
    });
  }
});

export default router;