import { Router } from 'express';
import { metricsCollector } from '../benchmarks/real-metrics-collector';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Get real-time agent metrics
router.get('/metrics/dashboard', async (req, res) => {
  try {
    const dashboard = await metricsCollector.getDashboardMetrics();
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to get dashboard metrics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get detailed metrics for specific agent
router.get('/metrics/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const metrics = await metricsCollector.calculateAgentMetrics(agentType, days);
    res.json(metrics);
  } catch (error) {
    console.error(`Failed to get metrics for ${req.params.agentType}:`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve agent metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Run benchmarks for specific agent (requires authentication)
router.post('/benchmarks/:agentType', isAuthenticated, async (req, res) => {
  try {
    const { agentType } = req.params;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'OpenAI API key required',
        message: 'Real benchmarking requires OpenAI API access. Please configure OPENAI_API_KEY environment variable.'
      });
    }

    console.log(`Starting benchmark suite for ${agentType}...`);
    const results = await metricsCollector.runBenchmarkSuite(agentType);
    
    res.json({
      success: true,
      agentType,
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      results: results.map(r => ({
        testName: r.testName,
        success: r.success,
        responseTime: r.responseTime,
        accuracy: r.accuracy,
        confidence: r.confidence,
        errorMessage: r.errorMessage
      }))
    });
  } catch (error) {
    console.error(`Benchmark failed for ${req.params.agentType}:`, error);
    res.status(500).json({ 
      error: 'Benchmark execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Run all agent benchmarks (requires authentication)
router.post('/benchmarks/all', isAuthenticated, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'OpenAI API key required',
        message: 'Real benchmarking requires OpenAI API access. Please configure OPENAI_API_KEY environment variable.'
      });
    }

    // Start continuous benchmarking in background
    metricsCollector.runContinuousBenchmarking().catch(error => {
      console.error('Continuous benchmarking failed:', error);
    });

    res.json({
      success: true,
      message: 'Continuous benchmarking started for all agents',
      note: 'Results will be available in the dashboard as tests complete'
    });
  } catch (error) {
    console.error('Failed to start continuous benchmarking:', error);
    res.status(500).json({ 
      error: 'Failed to start benchmarking',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get benchmark history for an agent
router.get('/benchmarks/:agentType/history', async (req, res) => {
  try {
    const { agentType } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // This would need to be implemented to fetch from stored results
    // For now, return structure that frontend expects
    res.json({
      agentType,
      results: [],
      message: 'Benchmark history will be available after running real tests'
    });
  } catch (error) {
    console.error(`Failed to get benchmark history for ${req.params.agentType}:`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve benchmark history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as realMetricsRouter };