import express from 'express';
import { federationManager } from '../services/federation-manager.js';
import { orchestrator } from '../services/orchestrator.js';
import { storage } from '../storage.js';

const router = express.Router();

// Federation node registration endpoint
router.post('/register', async (req, res) => {
  try {
    const nodeConfig = req.body;
    
    // Validate required fields
    if (!nodeConfig.endpoint || !nodeConfig.agents || !Array.isArray(nodeConfig.agents)) {
      return res.status(400).json({ 
        error: 'Missing required fields: endpoint, agents' 
      });
    }

    const nodeId = await federationManager.registerLocalNode(nodeConfig);
    
    res.json({ 
      success: true, 
      nodeId,
      message: 'Node registered successfully' 
    });
  } catch (error) {
    console.error('Federation registration error:', error);
    res.status(500).json({ error: 'Failed to register node' });
  }
});

// Federation query routing endpoint
router.post('/query', async (req, res) => {
  try {
    const federationRequest = req.body;
    
    // Validate request
    if (!federationRequest.agentType || !federationRequest.query) {
      return res.status(400).json({ 
        error: 'Missing required fields: agentType, query' 
      });
    }

    // Route query through federation manager
    const response = await federationManager.routeQuery(federationRequest);
    
    res.json({ 
      success: true, 
      response,
      routedBy: 'federation-manager' 
    });
  } catch (error) {
    console.error('Federation query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Node heartbeat endpoint
router.post('/heartbeat/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    await federationManager.updateHeartbeat(nodeId);
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// Get active federated nodes
router.get('/nodes', async (req, res) => {
  try {
    const activeNodes = federationManager.getActiveNodes();
    
    res.json({ 
      success: true, 
      nodes: activeNodes,
      count: activeNodes.length 
    });
  } catch (error) {
    console.error('Get nodes error:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

// Generate credentials for new federated node
router.post('/credentials', async (req, res) => {
  try {
    const credentials = federationManager.generateNodeCredentials();
    
    res.json({ 
      success: true, 
      credentials,
      instructions: 'Store these credentials securely. They will be used for mTLS authentication.' 
    });
  } catch (error) {
    console.error('Credential generation error:', error);
    res.status(500).json({ error: 'Failed to generate credentials' });
  }
});

// Federation network topology
router.get('/topology', async (req, res) => {
  try {
    const nodes = federationManager.getActiveNodes();
    
    // Create network topology data
    const topology = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        agents: node.agents,
        status: 'active',
        lastSeen: node.lastHeartbeat
      })),
      connections: nodes.map(node => ({
        source: 'formul8-cloud',
        target: node.id,
        type: node.type === 'local' ? 'federated' : 'internal'
      }))
    };
    
    res.json({ 
      success: true, 
      topology 
    });
  } catch (error) {
    console.error('Topology error:', error);
    res.status(500).json({ error: 'Failed to fetch topology' });
  }
});

export default router;