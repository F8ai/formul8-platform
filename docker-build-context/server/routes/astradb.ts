import { Router } from "express";
import { z } from "zod";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import path from "path";

const router = Router();
const execAsync = promisify(exec);

// Request schemas
const vectorSearchSchema = z.object({
  query: z.string().min(1),
  agentType: z.string().min(1),
  topK: z.number().min(1).max(20).optional().default(5),
  filterMetadata: z.record(z.any()).optional(),
});

const crossAgentSearchSchema = z.object({
  query: z.string().min(1),
  agentTypes: z.array(z.string()).optional(),
  topKPerAgent: z.number().min(1).max(10).optional().default(3),
});

const addDocumentsSchema = z.object({
  agentType: z.string().min(1),
  documents: z.array(z.object({
    content: z.string().min(1),
    metadata: z.record(z.any()),
  })),
});

const migrationSchema = z.object({
  agentType: z.string().optional(),
  verifyOnly: z.boolean().optional().default(false),
});

// Vector search endpoint
router.post("/search", async (req, res) => {
  try {
    const { query, agentType, topK, filterMetadata } = vectorSearchSchema.parse(req.body);
    
    // Call Python script for vector search
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    const searchParams = JSON.stringify({
      query,
      agent_type: agentType,
      top_k: topK,
      filter_metadata: filterMetadata
    });
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" search '${searchParams}'`
    );
    
    if (stderr) {
      console.error("Search error:", stderr);
      return res.status(500).json({ error: "Search failed", details: stderr });
    }
    
    const results = JSON.parse(stdout);
    res.json(results);
    
  } catch (error) {
    console.error("Vector search error:", error);
    res.status(500).json({ error: "Vector search failed", details: error.message });
  }
});

// Cross-agent search endpoint
router.post("/cross-search", async (req, res) => {
  try {
    const { query, agentTypes, topKPerAgent } = crossAgentSearchSchema.parse(req.body);
    
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    const searchParams = JSON.stringify({
      query,
      agent_types: agentTypes,
      top_k_per_agent: topKPerAgent
    });
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" cross-search '${searchParams}'`
    );
    
    if (stderr) {
      console.error("Cross-search error:", stderr);
      return res.status(500).json({ error: "Cross-search failed", details: stderr });
    }
    
    const results = JSON.parse(stdout);
    res.json(results);
    
  } catch (error) {
    console.error("Cross-agent search error:", error);
    res.status(500).json({ error: "Cross-agent search failed", details: error.message });
  }
});

// Add documents endpoint
router.post("/documents", async (req, res) => {
  try {
    const { agentType, documents } = addDocumentsSchema.parse(req.body);
    
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    const docParams = JSON.stringify({
      agent_type: agentType,
      documents
    });
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" add-documents '${docParams}'`
    );
    
    if (stderr) {
      console.error("Add documents error:", stderr);
      return res.status(500).json({ error: "Failed to add documents", details: stderr });
    }
    
    const results = JSON.parse(stdout);
    res.json(results);
    
  } catch (error) {
    console.error("Add documents error:", error);
    res.status(500).json({ error: "Failed to add documents", details: error.message });
  }
});

// Get agent statistics
router.get("/stats/:agentType", async (req, res) => {
  try {
    const { agentType } = req.params;
    
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    const statsParams = JSON.stringify({ agent_type: agentType });
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" stats '${statsParams}'`
    );
    
    if (stderr) {
      console.error("Stats error:", stderr);
      return res.status(500).json({ error: "Failed to get stats", details: stderr });
    }
    
    const stats = JSON.parse(stdout);
    res.json(stats);
    
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to get stats", details: error.message });
  }
});

// Get knowledge base overview
router.get("/knowledge-base", async (req, res) => {
  try {
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" knowledge-base`
    );
    
    if (stderr) {
      console.error("Knowledge base error:", stderr);
      return res.status(500).json({ error: "Failed to get knowledge base stats", details: stderr });
    }
    
    const stats = JSON.parse(stdout);
    res.json(stats);
    
  } catch (error) {
    console.error("Knowledge base error:", error);
    res.status(500).json({ error: "Failed to get knowledge base stats", details: error.message });
  }
});

// Migration endpoint
router.post("/migrate", async (req, res) => {
  try {
    const { agentType, verifyOnly } = migrationSchema.parse(req.body);
    
    const pythonScript = path.join(__dirname, "../python/astradb_migration.py");
    const migrationParams = JSON.stringify({
      agent_type: agentType,
      verify_only: verifyOnly
    });
    
    // Use spawn for long-running migration process
    const child = spawn("python3", [pythonScript, "migrate", migrationParams]);
    
    let stdout = "";
    let stderr = "";
    
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    child.on("close", (code) => {
      if (code === 0) {
        try {
          const results = JSON.parse(stdout);
          res.json(results);
        } catch (e) {
          res.json({ status: "completed", output: stdout });
        }
      } else {
        res.status(500).json({ error: "Migration failed", details: stderr });
      }
    });
    
    // Set timeout for migration
    setTimeout(() => {
      child.kill();
      res.status(408).json({ error: "Migration timeout" });
    }, 300000); // 5 minutes
    
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: "Migration failed", details: error.message });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const pythonScript = path.join(__dirname, "../python/astradb_search.py");
    
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" health`
    );
    
    if (stderr) {
      return res.status(500).json({ 
        status: "unhealthy", 
        error: stderr,
        timestamp: new Date().toISOString() 
      });
    }
    
    const health = JSON.parse(stdout);
    res.json({
      status: "healthy",
      ...health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Configuration endpoint
router.get("/config", (req, res) => {
  res.json({
    astradb: {
      enabled: !!process.env.ASTRA_DB_APPLICATION_TOKEN,
      hasEndpoint: !!process.env.ASTRA_DB_API_ENDPOINT,
      embeddingModel: "text-embedding-3-small",
      vectorDimension: 1536,
      distanceMetric: "cosine"
    },
    agents: [
      "compliance", "formulation", "marketing",
      "operations", "sourcing", "patent", "spectra"
    ],
    features: {
      vectorSearch: true,
      crossAgentSearch: true,
      documentManagement: true,
      migration: true,
      analytics: true
    }
  });
});

export default router;