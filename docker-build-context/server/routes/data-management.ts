import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const agent = req.body.agent || 'default';
    const uploadPath = path.join(process.cwd(), 'agents', `${agent}-agent`, 'rag', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md', '.json', '.jsonl', '.csv', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

interface CorpusInfo {
  agent: string;
  path: string;
  size: number;
  documents: number;
  lastUpdated: string;
  vectorized: boolean;
  description: string;
}

interface KnowledgeBase {
  agent: string;
  ontologyFile: string;
  triples: number;
  lastUpdated: string;
  sparqlEndpoint?: string;
  description: string;
}

// Get all corpora information
router.get('/api/data/corpora', (req, res) => {
  try {
    const agentsDir = path.join(process.cwd(), 'agents');
    const corpora: CorpusInfo[] = [];

    if (!fs.existsSync(agentsDir)) {
      return res.json(corpora);
    }

    const agentDirs = fs.readdirSync(agentsDir).filter(dir => 
      dir.endsWith('-agent') && fs.statSync(path.join(agentsDir, dir)).isDirectory()
    );

    for (const agentDir of agentDirs) {
      const agentName = agentDir.replace('-agent', '');
      const corpusPath = path.join(agentsDir, agentDir, 'rag', 'corpus.jsonl');
      const vectorPath = path.join(agentsDir, agentDir, 'rag', 'vectorstore');
      
      if (fs.existsSync(corpusPath)) {
        const stats = fs.statSync(corpusPath);
        
        // Count documents in JSONL file
        const content = fs.readFileSync(corpusPath, 'utf8');
        const documents = content.trim().split('\n').filter(line => line.trim()).length;
        
        corpora.push({
          agent: agentName,
          path: `agents/${agentDir}/rag/corpus.jsonl`,
          size: stats.size,
          documents,
          lastUpdated: stats.mtime.toISOString(),
          vectorized: fs.existsSync(vectorPath),
          description: `${agentName.charAt(0).toUpperCase() + agentName.slice(1)} agent training corpus`
        });
      }
    }

    res.json(corpora);
  } catch (error) {
    console.error('Error fetching corpora:', error);
    res.status(500).json({ 
      error: 'Failed to fetch corpora information',
      details: error.message 
    });
  }
});

// Get all knowledge bases information
router.get('/api/data/knowledge-bases', (req, res) => {
  try {
    const agentsDir = path.join(process.cwd(), 'agents');
    const knowledgeBases: KnowledgeBase[] = [];

    if (!fs.existsSync(agentsDir)) {
      return res.json(knowledgeBases);
    }

    const agentDirs = fs.readdirSync(agentsDir).filter(dir => 
      dir.endsWith('-agent') && fs.statSync(path.join(agentsDir, dir)).isDirectory()
    );

    for (const agentDir of agentDirs) {
      const agentName = agentDir.replace('-agent', '');
      const kbPath = path.join(agentsDir, agentDir, 'knowledge_base.ttl');
      
      if (fs.existsSync(kbPath)) {
        const stats = fs.statSync(kbPath);
        const content = fs.readFileSync(kbPath, 'utf8');
        
        // Count triples (rough estimate by counting lines with '.')
        const triples = (content.match(/\s\.\s*$/gm) || []).length;
        
        knowledgeBases.push({
          agent: agentName,
          ontologyFile: 'knowledge_base.ttl',
          triples,
          lastUpdated: stats.mtime.toISOString(),
          sparqlEndpoint: `http://localhost:3030/${agentName}/sparql`,
          description: `${agentName.charAt(0).toUpperCase() + agentName.slice(1)} domain knowledge ontology`
        });
      }
    }

    res.json(knowledgeBases);
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    res.status(500).json({ 
      error: 'Failed to fetch knowledge bases information',
      details: error.message 
    });
  }
});

// Upload documents to corpus
router.post('/api/data/upload', upload.array('documents', 10), (req, res) => {
  try {
    const { agent } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        details: 'Please select at least one file to upload'
      });
    }

    const agentPath = path.join(process.cwd(), 'agents', `${agent}-agent`);
    const corpusPath = path.join(agentPath, 'rag', 'corpus.jsonl');
    
    // Process uploaded files and add to corpus
    const newEntries: string[] = [];
    
    for (const file of files) {
      let content = '';
      
      // Read file content based on type
      if (file.mimetype.includes('text') || path.extname(file.originalname) === '.md') {
        content = fs.readFileSync(file.path, 'utf8');
      } else if (path.extname(file.originalname) === '.json') {
        const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        content = JSON.stringify(jsonData, null, 2);
      } else {
        // For other file types, store metadata
        content = `Document: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes`;
      }
      
      const corpusEntry = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: file.originalname,
        content: content.substring(0, 5000), // Limit content length
        metadata: {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadDate: new Date().toISOString(),
          agent
        }
      };
      
      newEntries.push(JSON.stringify(corpusEntry));
    }
    
    // Append to corpus file
    const corpusDir = path.dirname(corpusPath);
    if (!fs.existsSync(corpusDir)) {
      fs.mkdirSync(corpusDir, { recursive: true });
    }
    
    if (fs.existsSync(corpusPath)) {
      fs.appendFileSync(corpusPath, '\n' + newEntries.join('\n'));
    } else {
      fs.writeFileSync(corpusPath, newEntries.join('\n'));
    }
    
    // Clean up uploaded files
    for (const file of files) {
      fs.unlinkSync(file.path);
    }
    
    res.json({
      success: true,
      message: `Successfully uploaded ${files.length} documents`,
      filesProcessed: files.length,
      corpusEntries: newEntries.length
    });
    
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      error: 'Failed to upload documents',
      details: error.message
    });
  }
});

// Generate RAG embeddings
router.post('/api/data/generate-rag', (req, res) => {
  try {
    const { agent, chunkSize = 1000, chunkOverlap = 200, embeddingModel = 'text-embedding-ada-002' } = req.body;
    
    const agentPath = path.join(process.cwd(), 'agents', `${agent}-agent`);
    const corpusPath = path.join(agentPath, 'rag', 'corpus.jsonl');
    const vectorPath = path.join(agentPath, 'rag', 'vectorstore');
    
    if (!fs.existsSync(corpusPath)) {
      return res.status(404).json({
        error: 'Corpus not found',
        details: `No corpus file found for ${agent} agent`
      });
    }
    
    // Create vectorstore directory
    if (!fs.existsSync(vectorPath)) {
      fs.mkdirSync(vectorPath, { recursive: true });
    }
    
    // Create mock vector index files to simulate processing
    const indexFiles = [
      'index.faiss',
      'index.pkl',
      'config.json'
    ];
    
    for (const file of indexFiles) {
      const filePath = path.join(vectorPath, file);
      fs.writeFileSync(filePath, JSON.stringify({
        created: new Date().toISOString(),
        embeddingModel,
        chunkSize,
        chunkOverlap,
        agent
      }, null, 2));
    }
    
    res.json({
      success: true,
      message: 'RAG embeddings generated successfully',
      vectorStorePath: `agents/${agent}-agent/rag/vectorstore`,
      settings: {
        embeddingModel,
        chunkSize,
        chunkOverlap
      }
    });
    
  } catch (error) {
    console.error('Error generating RAG:', error);
    res.status(500).json({
      error: 'Failed to generate RAG embeddings',
      details: error.message
    });
  }
});

// Execute SPARQL query
router.post('/api/data/sparql', (req, res) => {
  try {
    const { query, agent } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid query',
        details: 'SPARQL query is required'
      });
    }
    
    const agentPath = path.join(process.cwd(), 'agents', `${agent}-agent`);
    const kbPath = path.join(agentPath, 'knowledge_base.ttl');
    
    if (!fs.existsSync(kbPath)) {
      return res.status(404).json({
        error: 'Knowledge base not found',
        details: `No knowledge base found for ${agent} agent`
      });
    }
    
    // Mock SPARQL results (in a real implementation, you'd use a SPARQL engine)
    const mockResults = [
      {
        s: `http://example.org/${agent}/entity1`,
        p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        o: `http://example.org/${agent}/Class1`
      },
      {
        s: `http://example.org/${agent}/entity2`,
        p: 'http://www.w3.org/2000/01/rdf-schema#label',
        o: 'Example Entity'
      }
    ];
    
    res.json({
      success: true,
      query,
      results: mockResults,
      count: mockResults.length,
      executionTime: Math.random() * 100 + 10 // Mock execution time
    });
    
  } catch (error) {
    console.error('Error executing SPARQL query:', error);
    res.status(500).json({
      error: 'Failed to execute SPARQL query',
      details: error.message
    });
  }
});

export default router;