import { Router } from 'express';
import { AgentMode, AgentModeConfig } from '../agents/base.js';
import { voiceflowService } from '../services/voiceflow-service.js';
import { baselineService } from '../services/baseline-service.js';

const router = Router();

// Get available modes for an agent
router.get('/:agentType/modes', async (req, res) => {
  try {
    const { agentType } = req.params;
    
    // This would get the actual agent instance
    // For now, return default modes
    const defaultModes: AgentModeConfig[] = [
      {
        mode: 'voiceflow',
        name: 'VoiceFlow Mode',
        description: 'Uses VoiceFlow agent configuration',
        ragEnabled: false,
        kbEnabled: false,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        active: true
      },
      {
        mode: 'raw',
        name: 'Raw Mode',
        description: 'No system prompt, direct model response',
        ragEnabled: false,
        kbEnabled: false,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        active: true
      },
      {
        mode: 'prompt',
        name: 'Prompt Mode',
        description: 'Uses system prompt only',
        ragEnabled: false,
        kbEnabled: false,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        active: true
      },
      {
        mode: 'prompt_rag',
        name: 'Prompt + RAG',
        description: 'Uses system prompt with RAG retrieval',
        ragEnabled: true,
        kbEnabled: false,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        active: true
      },
      {
        mode: 'prompt_rag_kb',
        name: 'Prompt + RAG + KB',
        description: 'Uses system prompt with RAG and knowledge base',
        ragEnabled: true,
        kbEnabled: true,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        active: true
      }
    ];

    res.json({ modes: defaultModes });
  } catch (error) {
    console.error('Error getting agent modes:', error);
    res.status(500).json({ error: 'Failed to get agent modes' });
  }
});

// Update mode configuration
router.put('/:agentType/modes/:mode', async (req, res) => {
  try {
    const { agentType, mode } = req.params;
    const updates = req.body;

    // This would update the actual agent's mode configuration
    // For now, return success
    res.json({ 
      success: true, 
      message: `Mode ${mode} updated for ${agentType} agent` 
    });
  } catch (error) {
    console.error('Error updating agent mode:', error);
    res.status(500).json({ error: 'Failed to update agent mode' });
  }
});

// Query agent in specific mode
router.post('/:agentType/query', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { query, mode = 'prompt', context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    let response: any;

    if (mode === 'voiceflow') {
      const voiceflowMapping = voiceflowService.getVoiceFlowAgentMapping();
      const voiceflowAgentId = voiceflowMapping[agentType];
      
      if (voiceflowAgentId) {
        const voiceflowResponse = await voiceflowService.queryAgent(voiceflowAgentId, query);
        response = {
          agent: agentType,
          response: voiceflowResponse.response,
          confidence: voiceflowResponse.confidence,
          sources: voiceflowResponse.sources,
          mode: 'voiceflow',
          performanceMetrics: {
            responseTime: voiceflowResponse.metadata.responseTime,
            tokenUsage: voiceflowResponse.metadata.tokenUsage,
            ragHits: 0,
            kbHits: 0
          }
        };
      } else {
        return res.status(404).json({ error: 'VoiceFlow agent not found for this agent type' });
      }
    } else {
      // For other modes, this would call the actual agent
      response = {
        agent: agentType,
        response: `Mock response for ${agentType} in ${mode} mode: ${query}`,
        confidence: Math.random() * 100,
        sources: [],
        mode,
        performanceMetrics: {
          responseTime: Math.random() * 1000,
          tokenUsage: Math.floor(Math.random() * 1000),
          ragHits: mode.includes('rag') ? Math.floor(Math.random() * 5) : 0,
          kbHits: mode.includes('kb') ? Math.floor(Math.random() * 3) : 0
        }
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error querying agent:', error);
    res.status(500).json({ error: 'Failed to query agent' });
  }
});

// Get baseline questions for an agent
router.get('/:agentType/baseline-questions', async (req, res) => {
  try {
    const { agentType } = req.params;
    const questions = baselineService.getBaselineQuestions(agentType);
    
    res.json({ questions });
  } catch (error) {
    console.error('Error getting baseline questions:', error);
    res.status(500).json({ error: 'Failed to get baseline questions' });
  }
});

// Run baseline test for an agent in specific mode
router.post('/:agentType/baseline-test', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { mode, agentId } = req.body;

    if (!mode || !agentId) {
      return res.status(400).json({ error: 'Mode and agentId are required' });
    }

    const summary = await baselineService.runBaselineTest(agentId, agentType, mode);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error running baseline test:', error);
    res.status(500).json({ error: 'Failed to run baseline test' });
  }
});

// Compare modes for an agent
router.post('/:agentType/compare-modes', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { modes, agentId } = req.body;

    if (!modes || !Array.isArray(modes) || !agentId) {
      return res.status(400).json({ error: 'Modes array and agentId are required' });
    }

    const comparison = await baselineService.compareModes(agentId, agentType, modes);
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing modes:', error);
    res.status(500).json({ error: 'Failed to compare modes' });
  }
});

// Get test results for an agent
router.get('/:agentType/test-results', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { agentId, mode } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: 'AgentId is required' });
    }

    const results = baselineService.getTestResults(agentId as string, mode as AgentMode);
    const summary = baselineService.getTestSummary(agentId as string, mode as AgentMode);
    
    res.json({ results, summary });
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({ error: 'Failed to get test results' });
  }
});

// VoiceFlow integration routes
router.get('/voiceflow/agents', async (req, res) => {
  try {
    const agents = await voiceflowService.listAgents();
    res.json({ agents });
  } catch (error) {
    console.error('Error listing VoiceFlow agents:', error);
    res.status(500).json({ error: 'Failed to list VoiceFlow agents' });
  }
});

router.get('/voiceflow/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await voiceflowService.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'VoiceFlow agent not found' });
    }
    
    res.json({ agent });
  } catch (error) {
    console.error('Error getting VoiceFlow agent:', error);
    res.status(500).json({ error: 'Failed to get VoiceFlow agent' });
  }
});

router.post('/voiceflow/agents/:agentId/query', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { query, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await voiceflowService.queryAgent(agentId, query, sessionId);
    res.json(response);
  } catch (error) {
    console.error('Error querying VoiceFlow agent:', error);
    res.status(500).json({ error: 'Failed to query VoiceFlow agent' });
  }
});

// Get VoiceFlow agent mapping
router.get('/voiceflow/mapping', async (req, res) => {
  try {
    const mapping = voiceflowService.getVoiceFlowAgentMapping();
    res.json({ mapping });
  } catch (error) {
    console.error('Error getting VoiceFlow mapping:', error);
    res.status(500).json({ error: 'Failed to get VoiceFlow mapping' });
  }
});

export default router; 