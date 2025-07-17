import type { Express } from "express";
import { googleDriveService } from "../services/google-drive";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

export function registerGoogleDriveRoutes(app: Express) {
  
  // Create user's Google Drive space
  app.post('/api/drive/setup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      if (!userEmail) {
        return res.status(400).json({ error: 'User email required for Drive setup' });
      }

      const userFolder = await googleDriveService.createUserSpaceFolder(userId, userEmail);
      
      res.json({
        success: true,
        folder: userFolder,
        message: 'Google Drive space created successfully'
      });
    } catch (error) {
      console.error('Drive setup error:', error);
      res.status(500).json({ error: 'Failed to setup Google Drive space' });
    }
  });

  // Generate cost report spreadsheet
  app.post('/api/drive/cost-report/sheet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get cost data (you'll need to implement these endpoints)
      const costSummary = await storage.getCostSummary(userId);
      const agentCosts = await storage.getAgentCosts(userId);
      const userCosts = await storage.getUserCosts(userId);
      
      const costData = {
        ...costSummary,
        agentCosts,
        userCosts
      };

      const sheet = await googleDriveService.createCostReportSheet(userId, costData);
      
      res.json({
        success: true,
        file: sheet,
        message: 'Cost report spreadsheet created successfully'
      });
    } catch (error) {
      console.error('Cost report sheet error:', error);
      res.status(500).json({ error: 'Failed to create cost report spreadsheet' });
    }
  });

  // Generate cost report presentation
  app.post('/api/drive/cost-report/slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get cost data
      const costSummary = await storage.getCostSummary(userId);
      const agentCosts = await storage.getAgentCosts(userId);
      const userCosts = await storage.getUserCosts(userId);
      
      const costData = {
        ...costSummary,
        agentCosts,
        userCosts
      };

      const slides = await googleDriveService.createCostReportSlides(userId, costData);
      
      res.json({
        success: true,
        file: slides,
        message: 'Cost report presentation created successfully'
      });
    } catch (error) {
      console.error('Cost report slides error:', error);
      res.status(500).json({ error: 'Failed to create cost report presentation' });
    }
  });

  // Generate project document
  app.post('/api/drive/project/:projectId/doc', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      const project = await storage.getProject(parseInt(projectId));
      
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get project data including queries and costs
      const projectQueries = await storage.getProjectQueries(parseInt(projectId));
      const projectCosts = await storage.getProjectCosts(parseInt(projectId));
      
      const projectData = {
        ...project,
        queryCount: projectQueries.length,
        totalCost: projectCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount), 0),
        agentTypes: [...new Set(projectQueries.map((q: any) => q.agentType))],
        avgCostPerQuery: projectCosts.length > 0 ? 
          projectCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount), 0) / projectQueries.length : 0
      };

      const doc = await googleDriveService.createProjectDoc(userId, projectData);
      
      res.json({
        success: true,
        file: doc,
        message: 'Project document created successfully'
      });
    } catch (error) {
      console.error('Project doc error:', error);
      res.status(500).json({ error: 'Failed to create project document' });
    }
  });

  // Generate project presentation
  app.post('/api/drive/project/:projectId/slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      const project = await storage.getProject(parseInt(projectId));
      
      if (!project || project.userId !== userId) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get project data
      const projectQueries = await storage.getProjectQueries(parseInt(projectId));
      const projectCosts = await storage.getProjectCosts(parseInt(projectId));
      
      const projectData = {
        ...project,
        queryCount: projectQueries.length,
        totalCost: projectCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount), 0),
        agentTypes: [...new Set(projectQueries.map((q: any) => q.agentType))],
      };

      const slides = await googleDriveService.createProjectPresentationSlides(userId, projectData);
      
      res.json({
        success: true,
        file: slides,
        message: 'Project presentation created successfully'
      });
    } catch (error) {
      console.error('Project slides error:', error);
      res.status(500).json({ error: 'Failed to create project presentation' });
    }
  });

  // List user's files
  app.get('/api/drive/files', isAuthenticated, async (req: any, res) => {
    try {
      const { folderId } = req.query;
      
      const files = await googleDriveService.listFiles(folderId);
      
      res.json({
        success: true,
        files
      });
    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // Share file with user
  app.post('/api/drive/files/:fileId/share', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      const { email, role = 'reader' } = req.body;
      
      await googleDriveService.shareFile(fileId, email, role);
      
      res.json({
        success: true,
        message: 'File shared successfully'
      });
    } catch (error) {
      console.error('Share file error:', error);
      res.status(500).json({ error: 'Failed to share file' });
    }
  });

  // Delete file
  app.delete('/api/drive/files/:fileId', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      
      await googleDriveService.deleteFile(fileId);
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // Export as CSV
  app.get('/api/drive/files/:fileId/export/csv', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      
      const csvBuffer = await googleDriveService.exportAsCSV(fileId);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.send(csvBuffer);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export as CSV' });
    }
  });

  // Export as PDF
  app.get('/api/drive/files/:fileId/export/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      
      const pdfBuffer = await googleDriveService.exportAsPDF(fileId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="export.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ error: 'Failed to export as PDF' });
    }
  });
}