import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface AgentConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  ragEnabled: boolean;
  knowledgeBaseEnabled: boolean;
  systemPrompt: string;
  ragSettings: {
    vectorStore: string;
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
  };
  knowledgeBaseSettings: {
    sparqlEndpoint: string;
    ontologyFile: string;
    queryTimeout: number;
  };
}

const getDefaultConfig = (): AgentConfig => ({
  defaultModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  ragEnabled: true,
  knowledgeBaseEnabled: false,
  systemPrompt: 'You are a helpful cannabis industry expert agent.',
  ragSettings: {
    vectorStore: 'faiss',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5
  },
  knowledgeBaseSettings: {
    sparqlEndpoint: '',
    ontologyFile: 'knowledge_base.ttl',
    queryTimeout: 30
  }
});

// Get agent configuration
router.get('/api/agents/:agentId/config', (req, res) => {
  const { agentId } = req.params;
  const agentPath = path.join(process.cwd(), 'agents', `${agentId}-agent`);
  const configPath = path.join(agentPath, 'agent_config.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      res.json(config);
    } else {
      // Return default configuration if none exists
      const defaultConfig = getDefaultConfig();
      res.json(defaultConfig);
    }
  } catch (error) {
    console.error(`Error loading config for ${agentId}:`, error);
    res.status(500).json({ 
      error: 'Failed to load agent configuration',
      details: error.message 
    });
  }
});

// Save agent configuration
router.put('/api/agents/:agentId/config', (req, res) => {
  const { agentId } = req.params;
  const config: AgentConfig = req.body;
  
  const agentPath = path.join(process.cwd(), 'agents', `${agentId}-agent`);
  const configPath = path.join(agentPath, 'agent_config.json');

  try {
    // Ensure agent directory exists
    if (!fs.existsSync(agentPath)) {
      fs.mkdirSync(agentPath, { recursive: true });
    }

    // Validate configuration
    if (!config.defaultModel || typeof config.temperature !== 'number') {
      return res.status(400).json({
        error: 'Invalid configuration data',
        details: 'Missing required fields or invalid data types'
      });
    }

    // Save configuration with timestamp
    const configWithMetadata = {
      ...config,
      lastUpdated: new Date().toISOString(),
      agentId
    };

    fs.writeFileSync(configPath, JSON.stringify(configWithMetadata, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Configuration saved successfully',
      config: configWithMetadata
    });
  } catch (error) {
    console.error(`Error saving config for ${agentId}:`, error);
    res.status(500).json({ 
      error: 'Failed to save agent configuration',
      details: error.message 
    });
  }
});

// Get agent README content
router.get('/api/agents/:agentId/readme', (req, res) => {
  const { agentId } = req.params;
  const agentPath = path.join(process.cwd(), 'agents', `${agentId}-agent`);
  const readmePath = path.join(agentPath, 'README.md');

  try {
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      res.json({ content: readmeContent });
    } else {
      res.json({ 
        content: `# ${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent

## Overview
The ${agentId} agent provides specialized cannabis industry guidance and expertise.

## Core Functionality
1. **Primary Feature**: Core operational guidance
2. **Secondary Feature**: Compliance monitoring  
3. **Tertiary Feature**: Performance optimization

## Performance Metrics
- **Accuracy**: 95%+ target
- **Response Time**: <2 seconds
- **Coverage**: Comprehensive domain expertise

## Integration Capabilities
- Multi-agent collaboration
- Real-time data integration
- API connectivity

## Success Criteria
- Zero compliance violations
- 100% operational coverage
- Optimal performance delivery`
      });
    }
  } catch (error) {
    console.error(`Error loading README for ${agentId}:`, error);
    res.status(500).json({ 
      error: 'Failed to load README content',
      details: error.message 
    });
  }
});

// Save agent README content
router.put('/api/agents/:agentId/readme', (req, res) => {
  const { agentId } = req.params;
  const { content } = req.body;
  
  const agentPath = path.join(process.cwd(), 'agents', `${agentId}-agent`);
  const readmePath = path.join(agentPath, 'README.md');

  try {
    // Ensure agent directory exists
    if (!fs.existsSync(agentPath)) {
      fs.mkdirSync(agentPath, { recursive: true });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Invalid README content',
        details: 'Content must be a non-empty string'
      });
    }

    fs.writeFileSync(readmePath, content);
    
    res.json({ 
      success: true, 
      message: 'README saved successfully',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error saving README for ${agentId}:`, error);
    res.status(500).json({ 
      error: 'Failed to save README content',
      details: error.message 
    });
  }
});

export default router;