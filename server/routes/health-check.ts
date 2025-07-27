import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    filesystem: {
      status: 'up' | 'down';
      agentsFound: number;
      corporaFiles: number;
    };
    apis: {
      status: 'up' | 'down';
      endpointsChecked: number;
      workingEndpoints: number;
    };
  };
  metrics: {
    totalAgents: number;
    totalCorpora: number;
    totalKnowledgeBases: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

// Health check endpoint
router.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      services: {
        database: { status: 'down' },
        filesystem: { status: 'down', agentsFound: 0, corporaFiles: 0 },
        apis: { status: 'up', endpointsChecked: 0, workingEndpoints: 0 }
      },
      metrics: {
        totalAgents: 0,
        totalCorpora: 0,
        totalKnowledgeBases: 0,
        memoryUsage: process.memoryUsage()
      }
    };

    // Check database connectivity
    try {
      const dbStart = Date.now();
      // Simple query to test database
      await db.execute('SELECT 1 as test');
      health.services.database = {
        status: 'up',
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      health.services.database = {
        status: 'down',
        error: error.message
      };
      health.status = 'degraded';
    }

    // Check filesystem and agents
    try {
      const agentsDir = path.join(process.cwd(), 'agents');
      let agentsFound = 0;
      let corporaFiles = 0;
      let knowledgeBases = 0;

      if (fs.existsSync(agentsDir)) {
        const agentDirs = fs.readdirSync(agentsDir).filter(dir => 
          dir.endsWith('-agent') && fs.statSync(path.join(agentsDir, dir)).isDirectory()
        );
        
        agentsFound = agentDirs.length;

        for (const agentDir of agentDirs) {
          const corpusPath = path.join(agentsDir, agentDir, 'rag', 'corpus.jsonl');
          const kbPath = path.join(agentsDir, agentDir, 'knowledge_base.ttl');
          
          if (fs.existsSync(corpusPath)) corporaFiles++;
          if (fs.existsSync(kbPath)) knowledgeBases++;
        }
      }

      health.services.filesystem = {
        status: agentsFound > 0 ? 'up' : 'down',
        agentsFound,
        corporaFiles
      };

      health.metrics.totalAgents = agentsFound;
      health.metrics.totalCorpora = corporaFiles;
      health.metrics.totalKnowledgeBases = knowledgeBases;

      if (agentsFound === 0) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.filesystem = {
        status: 'down',
        agentsFound: 0,
        corporaFiles: 0
      };
      health.status = 'degraded';
    }

    // Determine overall status
    if (health.services.database.status === 'down') {
      health.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    
    res.status(health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503).json({
      ...health,
      responseTime
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

// Detailed system information
router.get('/api/health/detailed', async (req, res) => {
  try {
    const agentsDir = path.join(process.cwd(), 'agents');
    const agents = [];

    if (fs.existsSync(agentsDir)) {
      const agentDirs = fs.readdirSync(agentsDir).filter(dir => 
        dir.endsWith('-agent') && fs.statSync(path.join(agentsDir, dir)).isDirectory()
      );

      for (const agentDir of agentDirs) {
        const agentPath = path.join(agentsDir, agentDir);
        const corpusPath = path.join(agentPath, 'rag', 'corpus.jsonl');
        const kbPath = path.join(agentPath, 'knowledge_base.ttl');
        const baselinePath = path.join(agentPath, 'baseline.json');

        const agent = {
          name: agentDir.replace('-agent', ''),
          directory: agentDir,
          hasCorpus: fs.existsSync(corpusPath),
          hasKnowledgeBase: fs.existsSync(kbPath),
          hasBaseline: fs.existsSync(baselinePath),
          corpusSize: 0,
          baselineQuestions: 0,
          lastModified: null
        };

        if (agent.hasCorpus) {
          const stats = fs.statSync(corpusPath);
          agent.corpusSize = stats.size;
          agent.lastModified = stats.mtime.toISOString();
        }

        if (agent.hasBaseline) {
          try {
            const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
            agent.baselineQuestions = Array.isArray(baseline.questions) ? baseline.questions.length : 0;
          } catch (e) {
            agent.baselineQuestions = 0;
          }
        }

        agents.push(agent);
      }
    }

    res.json({
      agents,
      summary: {
        totalAgents: agents.length,
        agentsWithCorpus: agents.filter(a => a.hasCorpus).length,
        agentsWithKnowledgeBase: agents.filter(a => a.hasKnowledgeBase).length,
        agentsWithBaseline: agents.filter(a => a.hasBaseline).length,
        totalCorpusSize: agents.reduce((sum, a) => sum + a.corpusSize, 0),
        totalBaselineQuestions: agents.reduce((sum, a) => sum + a.baselineQuestions, 0)
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get detailed health information',
      details: error.message
    });
  }
});

// Readiness probe (simpler check for container orchestration)
router.get('/api/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Liveness probe (basic server responsiveness)
router.get('/api/alive', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

export default router;