import { Router } from 'express';
import { Octokit } from '@octokit/rest';

const router = Router();

// GitHub configuration
const GITHUB_OWNER = 'formul8-ai'; // Will need to create this public repo
const GITHUB_REPO = 'formul8-feedback';

// Initialize Octokit (will need GITHUB_TOKEN environment variable)
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Create GitHub issue from feedback
router.post('/github-issue', async (req, res) => {
  try {
    const { title, body, labels = [] } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
      console.warn('GitHub token not configured, logging feedback locally');
      console.log('Feedback submission:', { title, body, labels });
      
      // For development/demo purposes, return a mock response
      return res.json({
        number: Math.floor(Math.random() * 1000) + 1,
        html_url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/mock`,
        message: 'Feedback logged locally (GitHub integration not configured)'
      });
    }

    // Create the GitHub issue
    const issue = await octokit.rest.issues.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title,
      body,
      labels: Array.isArray(labels) ? labels : [labels].filter(Boolean)
    });

    res.json({
      number: issue.data.number,
      html_url: issue.data.html_url,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    
    // Check if it's a repository not found error
    if (error.status === 404) {
      return res.status(500).json({ 
        error: 'Repository not found. Please ensure the feedback repository exists.',
        details: `Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`
      });
    }

    res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: error.message 
    });
  }
});

// Get feedback repository info
router.get('/repo-info', async (req, res) => {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return res.json({
        configured: false,
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        message: 'GitHub integration not configured'
      });
    }

    const repo = await octokit.rest.repos.get({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO
    });

    res.json({
      configured: true,
      repo: repo.data.full_name,
      url: repo.data.html_url,
      description: repo.data.description,
      open_issues: repo.data.open_issues_count
    });

  } catch (error) {
    console.error('Error getting repo info:', error);
    res.status(500).json({ 
      error: 'Failed to get repository information',
      details: error.message 
    });
  }
});

export default router;