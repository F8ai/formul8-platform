import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { createCorpusQAGenerator, AGENT_CORPUS_CONFIGS } from '../../shared/corpus-qa-generator';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateQASchema = z.object({
  agentDomain: z.string(),
  maxQuestions: z.number().min(1).max(500).default(100),
  difficulty: z.enum(['basic', 'intermediate', 'advanced', 'mixed']).default('mixed'),
  categories: z.array(z.string()).optional(),
  refreshCorpus: z.boolean().default(false)
});

const downloadCorpusSchema = z.object({
  agentDomain: z.string(),
  sources: z.array(z.string()).optional()
});

// Get available agent domains and their configurations
router.get('/domains', async (req, res) => {
  try {
    const domains = Object.keys(AGENT_CORPUS_CONFIGS).map(domain => ({
      domain,
      config: {
        sources: AGENT_CORPUS_CONFIGS[domain].sources.map(s => ({
          name: s.name,
          type: s.type,
          urlCount: s.urls.length
        })),
        categories: AGENT_CORPUS_CONFIGS[domain].categories,
        questionTypes: AGENT_CORPUS_CONFIGS[domain].questionTypes
      }
    }));

    res.json({
      success: true,
      domains,
      totalDomains: domains.length
    });
  } catch (error) {
    console.error('Error getting corpus domains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get corpus domains',
      message: error.message
    });
  }
});

// Download corpus for specific agent
router.post('/download', isAuthenticated, async (req, res) => {
  try {
    const { agentDomain, sources } = downloadCorpusSchema.parse(req.body);
    
    if (!AGENT_CORPUS_CONFIGS[agentDomain]) {
      return res.status(400).json({
        success: false,
        error: `Unknown agent domain: ${agentDomain}`
      });
    }

    console.log(`Starting corpus download for ${agentDomain}...`);
    
    const generator = createCorpusQAGenerator(agentDomain);
    const documents = await generator.downloadCorpus();
    
    res.json({
      success: true,
      message: `Successfully downloaded corpus for ${agentDomain}`,
      data: {
        agentDomain,
        totalDocuments: documents.length,
        sources: [...new Set(documents.map(d => d.source))],
        totalSize: documents.reduce((sum, d) => sum + d.content.length, 0),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error downloading corpus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download corpus',
      message: error.message
    });
  }
});

// Generate Q&A from corpus
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { agentDomain, maxQuestions, difficulty, categories, refreshCorpus } = 
      generateQASchema.parse(req.body);
    
    if (!AGENT_CORPUS_CONFIGS[agentDomain]) {
      return res.status(400).json({
        success: false,
        error: `Unknown agent domain: ${agentDomain}`
      });
    }

    console.log(`Generating ${maxQuestions} Q&A pairs for ${agentDomain}...`);
    
    const generator = createCorpusQAGenerator(agentDomain);
    
    // Get or download corpus
    let documents = refreshCorpus ? [] : await generator.loadStoredCorpus();
    
    if (documents.length === 0) {
      console.log('No existing corpus found, downloading fresh content...');
      documents = await generator.downloadCorpus();
    }
    
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No corpus documents available',
        message: 'Failed to download or find existing corpus content'
      });
    }

    // Generate Q&A pairs
    const qas = await generator.generateQuestionsFromCorpus(documents, {
      maxQuestions,
      difficulty,
      categories: categories || AGENT_CORPUS_CONFIGS[agentDomain].categories
    });
    
    // Save generated Q&A
    const filePath = await generator.saveGeneratedQAs(qas);
    
    res.json({
      success: true,
      message: `Generated ${qas.length} Q&A pairs for ${agentDomain}`,
      data: {
        agentDomain,
        totalQuestions: qas.length,
        filePath,
        statistics: {
          totalDocuments: documents.length,
          categoriesCovered: [...new Set(qas.map(qa => qa.category))],
          difficultyDistribution: {
            basic: qas.filter(qa => qa.difficulty === 'basic').length,
            intermediate: qas.filter(qa => qa.difficulty === 'intermediate').length,
            advanced: qas.filter(qa => qa.difficulty === 'advanced').length
          },
          averageConfidence: qas.reduce((sum, qa) => sum + qa.confidence, 0) / qas.length,
          sourcesCovered: [...new Set(qas.map(qa => qa.source))],
          uniqueTags: [...new Set(qas.flatMap(qa => qa.tags))]
        },
        preview: qas.slice(0, 3).map(qa => ({
          question: qa.question,
          category: qa.category,
          difficulty: qa.difficulty,
          confidence: qa.confidence
        }))
      }
    });
  } catch (error) {
    console.error('Error generating Q&A:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Q&A from corpus',
      message: error.message
    });
  }
});

// Generate baseline corpus for agent
router.post('/baseline/:agentDomain', isAuthenticated, async (req, res) => {
  try {
    const { agentDomain } = req.params;
    const { maxQuestions = 100 } = req.body;
    
    if (!AGENT_CORPUS_CONFIGS[agentDomain]) {
      return res.status(400).json({
        success: false,
        error: `Unknown agent domain: ${agentDomain}`
      });
    }

    console.log(`Generating baseline corpus for ${agentDomain}...`);
    
    const generator = createCorpusQAGenerator(agentDomain);
    const { filePath, stats } = await generator.generateCorpusBaseline(maxQuestions);
    
    res.json({
      success: true,
      message: `Generated baseline corpus for ${agentDomain}`,
      data: {
        filePath,
        stats,
        agentDomain
      }
    });
  } catch (error) {
    console.error('Error generating baseline corpus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate baseline corpus',
      message: error.message
    });
  }
});

// Get corpus status for agent
router.get('/status/:agentDomain', async (req, res) => {
  try {
    const { agentDomain } = req.params;
    
    if (!AGENT_CORPUS_CONFIGS[agentDomain]) {
      return res.status(400).json({
        success: false,
        error: `Unknown agent domain: ${agentDomain}`
      });
    }

    const generator = createCorpusQAGenerator(agentDomain);
    const documents = await generator.loadStoredCorpus();
    
    res.json({
      success: true,
      data: {
        agentDomain,
        hasCorpus: documents.length > 0,
        totalDocuments: documents.length,
        sources: [...new Set(documents.map(d => d.source))],
        lastUpdated: documents.length > 0 ? 
          Math.max(...documents.map(d => new Date(d.lastUpdated).getTime())) : null,
        totalSize: documents.reduce((sum, d) => sum + d.content.length, 0),
        availableSources: AGENT_CORPUS_CONFIGS[agentDomain].sources.map(s => s.name),
        availableCategories: AGENT_CORPUS_CONFIGS[agentDomain].categories
      }
    });
  } catch (error) {
    console.error('Error getting corpus status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get corpus status',
      message: error.message
    });
  }
});

// Get generated Q&A files for agent
router.get('/qa-files/:agentDomain', async (req, res) => {
  try {
    const { agentDomain } = req.params;
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const qaPath = path.join(process.cwd(), 'data', 'generated-qa', agentDomain);
    
    try {
      const files = await fs.readdir(qaPath);
      const qaFiles = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(qaPath, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          qaFiles.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            totalQuestions: data.questions?.length || 0,
            metadata: data.metadata || {}
          });
        }
      }
      
      res.json({
        success: true,
        data: {
          agentDomain,
          files: qaFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime()),
          totalFiles: qaFiles.length
        }
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          data: {
            agentDomain,
            files: [],
            totalFiles: 0
          }
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error getting Q&A files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Q&A files',
      message: error.message
    });
  }
});

export default router;