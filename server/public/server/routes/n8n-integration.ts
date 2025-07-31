import { Router } from 'express';
import { n8nClient } from '../integrations/n8n-client';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// N8N Health and Status
router.get('/health', async (req, res) => {
  try {
    const health = await n8nClient.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Workflow Management
router.get('/workflows', isAuthenticated, async (req, res) => {
  try {
    const workflows = await n8nClient.getWorkflows();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch workflows' 
    });
  }
});

router.get('/workflows/:id', isAuthenticated, async (req, res) => {
  try {
    const workflow = await n8nClient.getWorkflow(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch workflow' 
    });
  }
});

router.post('/workflows', isAuthenticated, async (req, res) => {
  try {
    const workflow = await n8nClient.createWorkflow(req.body);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create workflow' 
    });
  }
});

router.put('/workflows/:id', isAuthenticated, async (req, res) => {
  try {
    const workflow = await n8nClient.updateWorkflow(req.params.id, req.body);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update workflow' 
    });
  }
});

router.delete('/workflows/:id', isAuthenticated, async (req, res) => {
  try {
    await n8nClient.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete workflow' 
    });
  }
});

router.post('/workflows/:id/activate', isAuthenticated, async (req, res) => {
  try {
    const workflow = await n8nClient.activateWorkflow(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to activate workflow' 
    });
  }
});

router.post('/workflows/:id/deactivate', isAuthenticated, async (req, res) => {
  try {
    const workflow = await n8nClient.deactivateWorkflow(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to deactivate workflow' 
    });
  }
});

// Execution Management
router.post('/workflows/:id/execute', isAuthenticated, async (req, res) => {
  try {
    const execution = await n8nClient.executeWorkflow(req.params.id, req.body);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute workflow' 
    });
  }
});

router.get('/executions', isAuthenticated, async (req, res) => {
  try {
    const { workflowId, limit } = req.query;
    const executions = await n8nClient.getExecutions(
      workflowId as string, 
      limit ? parseInt(limit as string) : 20
    );
    res.json(executions);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch executions' 
    });
  }
});

router.get('/executions/:id', isAuthenticated, async (req, res) => {
  try {
    const execution = await n8nClient.getExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch execution' 
    });
  }
});

router.post('/executions/:id/stop', isAuthenticated, async (req, res) => {
  try {
    const execution = await n8nClient.stopExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to stop execution' 
    });
  }
});

// Cannabis Industry Specific Workflows
router.post('/workflows/compliance/:agentId', isAuthenticated, async (req, res) => {
  try {
    const { jurisdictions } = req.body;
    const workflow = await n8nClient.createComplianceWorkflow(req.params.agentId, jurisdictions);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create compliance workflow' 
    });
  }
});

router.post('/workflows/orchestration/:primaryAgent', isAuthenticated, async (req, res) => {
  try {
    const { verifyingAgents } = req.body;
    const workflow = await n8nClient.createAgentOrchestrationWorkflow(
      req.params.primaryAgent, 
      verifyingAgents
    );
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create orchestration workflow' 
    });
  }
});

router.post('/workflows/template/:agentType', isAuthenticated, async (req, res) => {
  try {
    const { capabilities } = req.body;
    const workflow = await n8nClient.createAgentWorkflowTemplate(req.params.agentType, capabilities);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create agent workflow template' 
    });
  }
});

// Agent Integration Endpoints
router.post('/agents/:agentId/workflow', isAuthenticated, async (req, res) => {
  try {
    const { workflowId, data } = req.body;
    const execution = await n8nClient.executeWorkflow(workflowId, {
      agentId: req.params.agentId,
      ...data
    });
    res.json(execution);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to execute agent workflow' 
    });
  }
});

router.get('/agents/:agentId/workflows', isAuthenticated, async (req, res) => {
  try {
    const workflows = await n8nClient.getWorkflows();
    const agentWorkflows = workflows.filter(w => 
      w.tags?.includes(req.params.agentId) || 
      w.name.includes(req.params.agentId)
    );
    res.json(agentWorkflows);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch agent workflows' 
    });
  }
});

// Webhook endpoints for N8N integration
router.post('/webhook/compliance-alert/:agentId', async (req, res) => {
  try {
    // Handle compliance alerts from N8N workflows
    const { agentId } = req.params;
    const alertData = req.body;
    
    // Log the alert and potentially trigger notifications
    console.log(`Compliance alert for agent ${agentId}:`, alertData);
    
    // Here you could:
    // - Store the alert in the database
    // - Send notifications to users
    // - Trigger corrective actions
    
    res.json({ received: true, agentId, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process compliance alert' 
    });
  }
});

router.post('/webhook/agent-query/:agentId', async (req, res) => {
  try {
    // Handle agent queries from N8N workflows
    const { agentId } = req.params;
    const { query, context } = req.body;
    
    // Process the query through the normal agent system
    // This would integrate with your existing agent processing logic
    
    res.json({ 
      agentId, 
      query,
      status: 'queued',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process agent query' 
    });
  }
});

export default router;