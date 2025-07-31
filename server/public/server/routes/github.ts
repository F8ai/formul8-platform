import { Router } from "express";

const router = Router();

// Mock GitHub issues data with proper Feature/Bug/Task labeling
const mockGitHubIssues = [
  {
    id: 1,
    title: "Real-time Agent Performance Dashboard",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'dashboard', color: '0075ca' },
      { name: 'real-time', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T20:00:00Z',
    updated_at: '2025-01-13T20:30:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/1',
    repository: 'formul8-platform',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 2,
    title: "Multi-Provider LLM Configuration UI",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'llm', color: 'c5def5' },
      { name: 'configuration', color: 'bfdadc' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T19:45:00Z',
    updated_at: '2025-01-13T20:25:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/2',
    repository: 'formul8-platform',
    priority: 'medium',
    type: 'feature'
  },
  {
    id: 3,
    title: "Advanced Agent Orchestration Workflows",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'langgraph', color: 'e4e669' },
      { name: 'orchestration', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T19:30:00Z',
    updated_at: '2025-01-13T20:20:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/3',
    repository: 'formul8-platform',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 4,
    title: "Multi-State Regulatory Intelligence Engine",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'compliance', color: '0e8a16' },
      { name: 'real-time', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T19:15:00Z',
    updated_at: '2025-01-13T20:15:00Z',
    html_url: 'https://github.com/F8ai/compliance-agent/issues/1',
    repository: 'compliance-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 5,
    title: "Automated Document Generation System",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'documents', color: 'bfd4f2' },
      { name: 'automation', color: 'c2e0c6' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T19:00:00Z',
    updated_at: '2025-01-13T20:10:00Z',
    html_url: 'https://github.com/F8ai/compliance-agent/issues/2',
    repository: 'compliance-agent',
    priority: 'medium',
    type: 'feature'
  },
  {
    id: 6,
    title: "Advanced Molecular Analysis Engine",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'molecular-analysis', color: 'fef2c0' },
      { name: 'rdkit', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T18:45:00Z',
    updated_at: '2025-01-13T20:05:00Z',
    html_url: 'https://github.com/F8ai/formulation-agent/issues/1',
    repository: 'formulation-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 7,
    title: "Formulation Optimization Platform",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'optimization', color: 'c2e0c6' },
      { name: 'ai', color: 'bfd4f2' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T18:30:00Z',
    updated_at: '2025-01-13T20:00:00Z',
    html_url: 'https://github.com/F8ai/formulation-agent/issues/2',
    repository: 'formulation-agent',
    priority: 'medium',
    type: 'feature'
  },
  {
    id: 8,
    title: "Multi-Platform Compliant Content Engine",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'content-generation', color: 'c5def5' },
      { name: 'compliance', color: '0e8a16' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T18:15:00Z',
    updated_at: '2025-01-13T19:55:00Z',
    html_url: 'https://github.com/F8ai/marketing-agent/issues/1',
    repository: 'marketing-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 9,
    title: "Advanced Scientific Literature Analysis Engine",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'literature-analysis', color: 'e4e669' },
      { name: 'pubmed', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T18:00:00Z',
    updated_at: '2025-01-13T19:50:00Z',
    html_url: 'https://github.com/F8ai/science-agent/issues/1',
    repository: 'science-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 10,
    title: "Intelligent Equipment Management System",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'equipment-management', color: 'bfd4f2' },
      { name: 'predictive-maintenance', color: 'c2e0c6' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T17:45:00Z',
    updated_at: '2025-01-13T19:45:00Z',
    html_url: 'https://github.com/F8ai/operations-agent/issues/1',
    repository: 'operations-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 11,
    title: "Intelligent Vendor Discovery & Evaluation",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'vendor-discovery', color: 'fef2c0' },
      { name: 'evaluation', color: 'c5def5' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T17:30:00Z',
    updated_at: '2025-01-13T19:40:00Z',
    html_url: 'https://github.com/F8ai/sourcing-agent/issues/1',
    repository: 'sourcing-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 12,
    title: "Comprehensive IP Landscape Analysis",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'patent-analysis', color: 'e4e669' },
      { name: 'ip-landscape', color: 'f9d0c4' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T17:15:00Z',
    updated_at: '2025-01-13T19:35:00Z',
    html_url: 'https://github.com/F8ai/patent-agent/issues/1',
    repository: 'patent-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 13,
    title: "Advanced Spectral Analysis Engine",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'spectral-analysis', color: 'bfd4f2' },
      { name: 'automation', color: 'c2e0c6' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T17:00:00Z',
    updated_at: '2025-01-13T19:30:00Z',
    html_url: 'https://github.com/F8ai/spectra-agent/issues/1',
    repository: 'spectra-agent',
    priority: 'high',
    type: 'feature'
  },
  {
    id: 14,
    title: "Intelligent Customer Support Automation",
    state: 'open',
    labels: [
      { name: 'Feature', color: '7057ff' },
      { name: 'customer-support', color: 'c5def5' },
      { name: 'ai', color: 'bfd4f2' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T16:45:00Z',
    updated_at: '2025-01-13T19:25:00Z',
    html_url: 'https://github.com/F8ai/customer-success-agent/issues/1',
    repository: 'customer-success-agent',
    priority: 'high',
    type: 'feature'
  },
  // Bug examples associated with baseline task failures
  {
    id: 15,
    title: "Compliance agent baseline exam failure - regulation parsing timeout",
    state: 'open',
    labels: [
      { name: 'Bug', color: 'd73a4a' },
      { name: 'baseline-failure', color: 'ff0000' },
      { name: 'timeout', color: 'ff6b6b' },
      { name: 'high-priority', color: 'b60205' }
    ],
    created_at: '2025-01-13T10:20:00Z',
    updated_at: '2025-01-13T19:20:00Z',
    html_url: 'https://github.com/F8ai/compliance-agent/issues/15',
    repository: 'compliance-agent',
    priority: 'high',
    type: 'bug'
  },
  {
    id: 16,
    title: "Formulation agent RDKit molecular analysis memory leak",
    state: 'open',
    labels: [
      { name: 'Bug', color: 'd73a4a' },
      { name: 'baseline-failure', color: 'ff0000' },
      { name: 'memory-leak', color: 'ff6b6b' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T11:15:00Z',
    updated_at: '2025-01-13T19:15:00Z',
    html_url: 'https://github.com/F8ai/formulation-agent/issues/16',
    repository: 'formulation-agent',
    priority: 'medium',
    type: 'bug'
  },
  {
    id: 17,
    title: "Science agent PubMed API rate limiting issues",
    state: 'open',
    labels: [
      { name: 'Bug', color: 'd73a4a' },
      { name: 'baseline-failure', color: 'ff0000' },
      { name: 'rate-limiting', color: 'ff6b6b' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T12:30:00Z',
    updated_at: '2025-01-13T19:10:00Z',
    html_url: 'https://github.com/F8ai/science-agent/issues/17',
    repository: 'science-agent',
    priority: 'medium',
    type: 'bug'
  },
  // Task examples
  {
    id: 18,
    title: "Update agent documentation for LLM configuration",
    state: 'open',
    labels: [
      { name: 'Task', color: 'a2eeef' },
      { name: 'documentation', color: '0075ca' },
      { name: 'low-priority', color: '0e8a16' }
    ],
    created_at: '2025-01-13T14:15:00Z',
    updated_at: '2025-01-13T19:05:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/18',
    repository: 'formul8-platform',
    priority: 'low',
    type: 'enhancement'
  },
  {
    id: 19,
    title: "Add GitHub Actions workflows for all agent repositories",
    state: 'open',
    labels: [
      { name: 'Task', color: 'a2eeef' },
      { name: 'ci/cd', color: 'bfd4f2' },
      { name: 'automation', color: 'c2e0c6' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-13T13:45:00Z',
    updated_at: '2025-01-13T19:00:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/19',
    repository: 'formul8-platform',
    priority: 'medium',
    type: 'enhancement'
  },
  {
    id: 20,
    title: "Standardize API response formats across all agents",
    state: 'closed',
    labels: [
      { name: 'Task', color: 'a2eeef' },
      { name: 'api', color: 'e4e669' },
      { name: 'standardization', color: 'fef2c0' },
      { name: 'medium-priority', color: 'fbca04' }
    ],
    created_at: '2025-01-12T16:30:00Z',
    updated_at: '2025-01-13T18:55:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/issues/20',
    repository: 'formul8-platform',
    priority: 'medium',
    type: 'enhancement'
  }
];

const mockPullRequests = [
  {
    id: 1,
    title: "feat: Add real-time agent performance dashboard",
    state: 'open',
    created_at: '2025-01-13T20:15:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/pull/1',
    repository: 'formul8-platform',
    author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
    draft: false
  },
  {
    id: 2,
    title: "fix: Resolve compliance agent baseline parsing timeout",
    state: 'merged',
    created_at: '2025-01-13T19:30:00Z',
    html_url: 'https://github.com/F8ai/compliance-agent/pull/2',
    repository: 'compliance-agent',
    author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
    draft: false
  },
  {
    id: 3,
    title: "feat: Enhanced LLM provider configuration UI",
    state: 'open',
    created_at: '2025-01-13T18:45:00Z',
    html_url: 'https://github.com/F8ai/formul8-platform/pull/3',
    repository: 'formul8-platform',
    author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
    draft: true
  },
  {
    id: 4,
    title: "feat: Multi-state regulatory intelligence engine",
    state: 'open',
    created_at: '2025-01-13T17:20:00Z',
    html_url: 'https://github.com/F8ai/compliance-agent/pull/4',
    repository: 'compliance-agent',
    author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
    draft: false
  }
];

// Get GitHub issues
router.get("/issues", async (req, res) => {
  try {
    // In production, this would fetch from the GitHub API
    // For now, return mock data with proper Feature/Bug/Task labeling
    res.json(mockGitHubIssues);
  } catch (error) {
    console.error("Error fetching GitHub issues:", error);
    res.status(500).json({ message: "Failed to fetch GitHub issues" });
  }
});

// Get GitHub pull requests
router.get("/pulls", async (req, res) => {
  try {
    // In production, this would fetch from the GitHub API
    res.json(mockPullRequests);
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    res.status(500).json({ message: "Failed to fetch GitHub pull requests" });
  }
});

// Get repository statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      totalIssues: mockGitHubIssues.length,
      openIssues: mockGitHubIssues.filter(issue => issue.state === 'open').length,
      closedIssues: mockGitHubIssues.filter(issue => issue.state === 'closed').length,
      features: mockGitHubIssues.filter(issue => issue.labels.some(label => label.name === 'Feature')).length,
      bugs: mockGitHubIssues.filter(issue => issue.labels.some(label => label.name === 'Bug')).length,
      tasks: mockGitHubIssues.filter(issue => issue.labels.some(label => label.name === 'Task')).length,
      repositories: [...new Set(mockGitHubIssues.map(issue => issue.repository))].length
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    res.status(500).json({ message: "Failed to fetch GitHub stats" });
  }
});

export { router as githubRouter };