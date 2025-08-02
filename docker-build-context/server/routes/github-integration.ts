import { Router } from "express";
import { Octokit } from "@octokit/rest";
import { isAuthenticated } from "../replitAuth";

const router = Router();

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

const orgName = "F8ai";

// Get repository issues
router.get("/repos/:repo/issues", isAuthenticated, async (req, res) => {
  try {
    const { repo } = req.params;
    const { state = "open", labels, page = 1, per_page = 10 } = req.query;

    const response = await octokit.issues.listForRepo({
      owner: orgName,
      repo,
      state: state as "open" | "closed" | "all",
      labels: labels as string,
      page: parseInt(page as string),
      per_page: parseInt(per_page as string)
    });

    const issues = response.data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map(label => ({
        name: typeof label === 'string' ? label : label.name,
        color: typeof label === 'string' ? null : label.color
      })),
      assignees: issue.assignees?.map(assignee => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url
      })),
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.html_url,
      user: {
        login: issue.user?.login,
        avatar_url: issue.user?.avatar_url
      }
    }));

    res.json({
      issues,
      total_count: response.headers['x-ratelimit-remaining'],
      has_next: response.data.length === parseInt(per_page as string)
    });

  } catch (error) {
    console.error("Error fetching repository issues:", error);
    res.status(500).json({ 
      message: "Failed to fetch issues",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get repository statistics
router.get("/repos/:repo/stats", isAuthenticated, async (req, res) => {
  try {
    const { repo } = req.params;

    // Get repository details
    const repoResponse = await octokit.repos.get({
      owner: orgName,
      repo
    });

    // Get issues statistics
    const openIssuesResponse = await octokit.issues.listForRepo({
      owner: orgName,
      repo,
      state: "open",
      per_page: 1
    });

    const closedIssuesResponse = await octokit.issues.listForRepo({
      owner: orgName,
      repo,
      state: "closed",
      per_page: 1
    });

    // Get recent commits
    const commitsResponse = await octokit.repos.listCommits({
      owner: orgName,
      repo,
      per_page: 5
    });

    // Get contributors
    const contributorsResponse = await octokit.repos.listContributors({
      owner: orgName,
      repo,
      per_page: 10
    });

    const repoStats = {
      name: repoResponse.data.name,
      description: repoResponse.data.description,
      url: repoResponse.data.html_url,
      stars: repoResponse.data.stargazers_count,
      watchers: repoResponse.data.watchers_count,
      forks: repoResponse.data.forks_count,
      language: repoResponse.data.language,
      lastCommit: commitsResponse.data[0]?.commit.committer?.date,
      openIssues: parseInt(openIssuesResponse.headers['x-total-count'] || '0'),
      closedIssues: parseInt(closedIssuesResponse.headers['x-total-count'] || '0'),
      totalCommits: repoResponse.data.size, // Approximation
      contributors: contributorsResponse.data.length,
      recentCommits: commitsResponse.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name,
        date: commit.commit.author?.date,
        url: commit.html_url
      }))
    };

    res.json(repoStats);

  } catch (error) {
    console.error("Error fetching repository stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch repository statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create new issue
router.post("/repos/:repo/issues", isAuthenticated, async (req, res) => {
  try {
    const { repo } = req.params;
    const { title, body, labels, assignees } = req.body;

    const response = await octokit.issues.create({
      owner: orgName,
      repo,
      title,
      body,
      labels,
      assignees
    });

    res.json({
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      html_url: response.data.html_url,
      state: response.data.state,
      created_at: response.data.created_at
    });

  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ 
      message: "Failed to create issue",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update issue
router.patch("/repos/:repo/issues/:issue_number", isAuthenticated, async (req, res) => {
  try {
    const { repo, issue_number } = req.params;
    const updates = req.body;

    const response = await octokit.issues.update({
      owner: orgName,
      repo,
      issue_number: parseInt(issue_number),
      ...updates
    });

    res.json({
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      state: response.data.state,
      updated_at: response.data.updated_at
    });

  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ 
      message: "Failed to update issue",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export { router as githubIntegrationRouter };