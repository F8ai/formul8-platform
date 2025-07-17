import express from 'express';
import { z } from 'zod';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { googleDriveService } from '../services/google-drive';
import { enhancedGoogleDocsService } from '../services/enhanced-google-docs';
import { googleFormsService } from '../services/google-forms';
import { googleTemplateService } from '../services/google-templates';
import { insertUserArtifactSchema, insertAgentToolSchema } from '@shared/schema';

const router = express.Router();

// Get user artifacts
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const category = req.query.category as string;
    
    const artifacts = await storage.getUserArtifacts(userId, category);
    res.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: 'Failed to fetch artifacts' });
  }
});

// Search user artifacts
router.get('/search', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const artifacts = await storage.searchArtifacts(userId, query);
    res.json(artifacts);
  } catch (error) {
    console.error('Error searching artifacts:', error);
    res.status(500).json({ error: 'Failed to search artifacts' });
  }
});

// Get specific artifact
router.get('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const artifactId = parseInt(req.params.id);
    
    const artifact = await storage.getArtifact(artifactId);
    if (!artifact || artifact.userId !== userId) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    res.json(artifact);
  } catch (error) {
    console.error('Error fetching artifact:', error);
    res.status(500).json({ error: 'Failed to fetch artifact' });
  }
});

// Create new artifact
router.post('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    
    const artifactData = insertUserArtifactSchema.parse({
      ...req.body,
      userId,
    });
    
    let googleDriveFileId: string | undefined;
    let googleDriveUrl: string | undefined;
    
    // Create Google Drive document based on type
    if (req.body.createGoogleDoc) {
      switch (artifactData.type) {
        case 'patent_search':
          const patentDocId = await enhancedGoogleDocsService.createPatentSearchDocument(artifactData.content);
          googleDriveFileId = patentDocId;
          googleDriveUrl = `https://docs.google.com/document/d/${patentDocId}`;
          
          // Share with user
          await googleDriveService.shareFile(patentDocId, userEmail, 'writer');
          break;
          
        case 'sop':
          const sopDocId = await enhancedGoogleDocsService.createSOPDocument(artifactData.content);
          googleDriveFileId = sopDocId;
          googleDriveUrl = `https://docs.google.com/document/d/${sopDocId}`;
          
          await googleDriveService.shareFile(sopDocId, userEmail, 'writer');
          break;
          
        case 'formulation':
          const formulationDocId = await enhancedGoogleDocsService.createFormulationSheet(artifactData.content);
          googleDriveFileId = formulationDocId;
          googleDriveUrl = `https://docs.google.com/document/d/${formulationDocId}`;
          
          await googleDriveService.shareFile(formulationDocId, userEmail, 'writer');
          break;
          
        case 'marketing_sheet':
          const marketingSheet = await googleDriveService.createMarketingExpenseSheet(userId, userEmail, artifactData.content);
          googleDriveFileId = marketingSheet.id;
          googleDriveUrl = marketingSheet.webViewLink;
          break;
          
        case 'form':
          let form;
          if (artifactData.content.formType === 'customer_feedback') {
            form = await googleFormsService.createCustomerFeedbackForm();
          } else if (artifactData.content.formType === 'compliance_checklist') {
            form = await googleFormsService.createComplianceChecklistForm();
          } else if (artifactData.content.formType === 'product_development') {
            form = await googleFormsService.createProductDevelopmentForm();
          } else {
            form = await googleFormsService.createForm(artifactData.content);
          }
          
          googleDriveFileId = form.id;
          googleDriveUrl = form.publishedUrl;
          
          // Share with user
          await googleFormsService.shareForm(form.id, userEmail, 'writer');
          break;
      }
    }
    
    // Create artifact in database
    const artifact = await storage.createArtifact({
      ...artifactData,
      googleDriveFileId,
      googleDriveUrl,
    });
    
    res.json(artifact);
  } catch (error) {
    console.error('Error creating artifact:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid artifact data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create artifact' });
  }
});

// Update artifact (for agents)
router.patch('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const artifactId = parseInt(req.params.id);
    const agentType = req.body.agentType;
    const updates = req.body.updates;
    const reason = req.body.reason;
    
    // Verify artifact exists and user has access
    const artifact = await storage.getArtifact(artifactId);
    if (!artifact || artifact.userId !== userId) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Check agent permissions
    const permissions = artifact.permissions as any;
    if (agentType && permissions[agentType] !== 'write' && permissions[agentType] !== 'admin') {
      return res.status(403).json({ error: 'Agent does not have write permission' });
    }
    
    // Update Google Drive document if applicable
    if (artifact.googleDriveFileId && updates.content) {
      try {
        if (artifact.type === 'document' || artifact.type === 'sop' || artifact.type === 'patent_search' || artifact.type === 'formulation') {
          await enhancedGoogleDocsService.agentUpdateDocument(
            artifact.googleDriveFileId,
            agentType,
            updates.googleDocEdits || [],
            reason
          );
        }
      } catch (error) {
        console.error('Error updating Google Doc:', error);
        // Continue with database update even if Google Doc update fails
      }
    }
    
    // Update artifact in database
    const updatedArtifact = await storage.updateArtifact(artifactId, updates, agentType);
    
    res.json(updatedArtifact);
  } catch (error) {
    console.error('Error updating artifact:', error);
    res.status(500).json({ error: 'Failed to update artifact' });
  }
});

// Delete artifact
router.delete('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const artifactId = parseInt(req.params.id);
    
    const artifact = await storage.getArtifact(artifactId);
    if (!artifact || artifact.userId !== userId) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    // Delete from Google Drive if applicable
    if (artifact.googleDriveFileId) {
      try {
        await googleDriveService.deleteFile(artifact.googleDriveFileId);
      } catch (error) {
        console.error('Error deleting Google Drive file:', error);
        // Continue with database deletion even if Google Drive deletion fails
      }
    }
    
    const deleted = await storage.deleteArtifact(artifactId);
    if (!deleted) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting artifact:', error);
    res.status(500).json({ error: 'Failed to delete artifact' });
  }
});

// Get artifact history
router.get('/:id/history', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const artifactId = parseInt(req.params.id);
    
    const artifact = await storage.getArtifact(artifactId);
    if (!artifact || artifact.userId !== userId) {
      return res.status(404).json({ error: 'Artifact not found' });
    }
    
    const history = await storage.getArtifactHistory(artifactId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching artifact history:', error);
    res.status(500).json({ error: 'Failed to fetch artifact history' });
  }
});

// Agent tools management
router.get('/tools/:agentType', isAuthenticated, async (req: any, res) => {
  try {
    const agentType = req.params.agentType;
    const tools = await storage.getAgentTools(agentType);
    res.json(tools);
  } catch (error) {
    console.error('Error fetching agent tools:', error);
    res.status(500).json({ error: 'Failed to fetch agent tools' });
  }
});

router.post('/tools', isAuthenticated, async (req: any, res) => {
  try {
    const toolData = insertAgentToolSchema.parse(req.body);
    const tool = await storage.createAgentTool(toolData);
    res.json(tool);
  } catch (error) {
    console.error('Error creating agent tool:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid tool data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create agent tool' });
  }
});

// Get available templates
router.get('/templates', isAuthenticated, async (req: any, res) => {
  try {
    const category = req.query.category as string;
    const templates = await googleTemplateService.getAvailableTemplates(category);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create document from template
router.post('/templates/:templateId/create', isAuthenticated, async (req: any, res) => {
  try {
    const templateId = req.params.templateId;
    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;
    const { title, variables } = req.body;

    const document = await googleTemplateService.createFromTemplate(
      templateId,
      variables,
      title,
      userEmail
    );

    // Create artifact record
    const artifact = await storage.createArtifact({
      userId,
      title,
      description: `Created from template`,
      type: 'document',
      category: 'general',
      content: { variables, templateId },
      googleDriveFileId: document.id,
      googleDriveUrl: document.url,
      status: 'active',
      permissions: {},
      tags: ['template', 'generated'],
    });

    res.json({ artifact, document });
  } catch (error) {
    console.error('Error creating document from template:', error);
    res.status(500).json({ error: 'Failed to create document from template' });
  }
});

// Initialize cannabis industry templates
router.post('/templates/cannabis/init', isAuthenticated, async (req: any, res) => {
  try {
    const templates = await googleTemplateService.createCannabisTemplates();
    res.json({
      message: 'Cannabis industry templates created successfully',
      templates,
    });
  } catch (error) {
    console.error('Error creating cannabis templates:', error);
    res.status(500).json({ error: 'Failed to create cannabis templates' });
  }
});

// Create demo artifacts for user with Google Workspace integration
router.post('/demo', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const userEmail = req.user.claims.email;

    console.log('Creating demo artifacts for user:', userId, userEmail);
    
    // Create F8/ folder in Google Drive
    let f8Folder = null;
    try {
      f8Folder = await googleDriveService.findOrCreateFolder('F8');
      console.log('Created F8 folder:', f8Folder.id);
    } catch (error) {
      console.log('Failed to create F8 folder:', error.message);
    }

    // Create demo artifacts even if Google Drive fails
    const demoArtifacts = [
      {
        title: 'Cannabis SOP - Seed to Sale Tracking',
        description: 'Comprehensive standard operating procedure for cannabis seed-to-sale tracking compliance',
        type: 'document',
        category: 'compliance',
        status: 'active',
        content: {
          seed_stage: 'Track genetic lineage, germination rates, and compliance tagging',
          cultivation: 'Monitor plant health, nutrients, and environmental controls',
          harvest: 'Document yield weights, quality metrics, and processing steps',
          distribution: 'Inventory management, sales documentation, and compliance reporting'
        },
        tags: ['cannabis', 'sop', 'compliance', 'tracking'],
        version: 1,
        permissions: { 'compliance-agent': 'write' },
        agentAccess: ['compliance-agent'],
        googleDriveFileId: f8Folder?.id || null,
        googleDriveUrl: f8Folder?.webViewLink || null
      },
      {
        title: 'Product Development Brief - Sunset Hybrid',
        description: 'Detailed product development brief for Sunset Hybrid cannabis strain',
        type: 'document',
        category: 'formulation',
        status: 'active',
        content: {
          strain_type: 'Indica-dominant hybrid (70% Indica, 30% Sativa)',
          target_thc: '22-26%',
          target_cbd: '1-3%',
          flowering_time: '8-9 weeks',
          expected_yield: '450-550g/m²',
          terpene_profile: 'Myrcene 35%, Limonene 25%, Caryophyllene 20%'
        },
        tags: ['cannabis', 'product', 'hybrid', 'formulation'],
        version: 1,
        permissions: { 'formulation-agent': 'write' },
        agentAccess: ['formulation-agent'],
        googleDriveFileId: f8Folder?.id || null,
        googleDriveUrl: f8Folder?.webViewLink || null
      },
      {
        title: 'Marketing Campaign Q1 2025',
        description: 'Comprehensive marketing campaign strategy for Q1 2025 cannabis operations',
        type: 'spreadsheet',
        category: 'marketing',
        status: 'active',
        content: {
          total_budget: '$105,000',
          platforms: 'Weedmaps, Leafly, Instagram, Cannabis Media',
          key_campaigns: 'Brand awareness, Product launch, Educational content',
          compliance_focus: 'Regulatory compliant advertising across all platforms'
        },
        tags: ['cannabis', 'marketing', 'campaign', 'q1-2025'],
        version: 1,
        permissions: { 'marketing-agent': 'write' },
        agentAccess: ['marketing-agent'],
        googleDriveFileId: f8Folder?.id || null,
        googleDriveUrl: f8Folder?.webViewLink || null
      }
    ];

    // Store artifacts in database
    const createdArtifacts = [];
    for (const artifact of demoArtifacts) {
      const artifactData = {
        userId,
        ...artifact,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const created = await storage.createArtifact(artifactData);
      createdArtifacts.push(created);
    }

    res.json({
      success: true,
      message: 'F8 folder and demo artifacts created successfully',
      folder: f8Folder,
      artifacts: createdArtifacts
    });
  } catch (error) {
    console.error('Error creating demo artifacts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create demo artifacts',
      message: error.message 
    });
  }
});

// Get all artifacts for user
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const category = req.query.category;
    
    const artifacts = await storage.getUserArtifacts(userId, category);
    res.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: 'Failed to fetch artifacts' });
  }
});

// Search artifacts
router.get('/search', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const results = await storage.searchArtifacts(userId, query);
    res.json(results);
  } catch (error) {
    console.error('Error searching artifacts:', error);
    res.status(500).json({ error: 'Failed to search artifacts' });
  }
});

// Get artifact templates
router.get('/templates', isAuthenticated, async (req: any, res) => {
  try {
    const templates = [
      {
        id: 1,
        name: 'Cannabis SOP Template',
        description: 'Standard operating procedure template for cannabis operations',
        category: 'compliance',
        type: 'document'
      },
      {
        id: 2,
        name: 'Product Development Brief',
        description: 'Template for cannabis product development documentation',
        category: 'formulation',
        type: 'document'
      },
      {
        id: 3,
        name: 'Marketing Campaign Tracker',
        description: 'Template for tracking cannabis marketing campaigns',
        category: 'marketing',
        type: 'spreadsheet'
      }
    ];
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create new artifact
router.post('/', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const artifactData = {
      userId,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const artifact = await storage.createArtifact(artifactData);
    res.json(artifact);
  } catch (error) {
    console.error('Error creating artifact:', error);
    res.status(500).json({ error: 'Failed to create artifact' });
  }
});

export default router;
