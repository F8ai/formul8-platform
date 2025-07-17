import { Request, Response } from 'express';
import { githubFeatureManager } from '../services/github-feature-manager';

export async function createFeatureIssues(req: Request, res: Response) {
  try {
    const { agent } = req.params;
    
    if (!agent) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    const results = await githubFeatureManager.createFeatureIssues(agent);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error creating feature issues:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createAllFeatureIssues(req: Request, res: Response) {
  try {
    const results = await githubFeatureManager.createAllAgentFeatures();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error creating all feature issues:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getFeatureIssues(req: Request, res: Response) {
  try {
    const { agent } = req.params;
    
    if (!agent) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    const issues = await githubFeatureManager.getExistingFeatureIssues(agent);
    res.json({ success: true, issues });
  } catch (error) {
    console.error('Error fetching feature issues:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getRoadmapFeatures(req: Request, res: Response) {
  try {
    const features = githubFeatureManager.getRoadmapFeaturesForDisplay();
    const summary = githubFeatureManager.getFeatureSummary();
    res.json({ success: true, features: features.features, summary });
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getFeatureSummary(req: Request, res: Response) {
  try {
    const summary = githubFeatureManager.getFeatureSummary();
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching feature summary:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function addCommentsToAllIssues(req: Request, res: Response) {
  try {
    const { agentName } = req.body;
    const results = await githubFeatureManager.addImplementationCommentsToExistingIssues(agentName);
    
    const summary = {
      totalAgents: Object.keys(results).length,
      totalComments: Object.values(results).flat().filter(r => r.success && r.message === 'Implementation comment added').length,
      totalSkipped: Object.values(results).flat().filter(r => r.success && r.message === 'Implementation comment already exists').length,
      totalErrors: Object.values(results).flat().filter(r => !r.success).length
    };
    
    res.json({ success: true, results, summary });
  } catch (error) {
    console.error('Error adding comments to issues:', error);
    res.status(500).json({ error: error.message });
  }
}