import { Octokit } from "@octokit/rest";

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request?: {
    url: string;
  };
}

export interface CreateIssueRequest {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

export interface UpdateIssueRequest {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
}

export class GitHubIssuesService {
  private octokit: Octokit;
  private orgName = "F8ai";

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PAT
    });
  }

  async getAgentIssues(agentName: string): Promise<GitHubIssue[]> {
    try {
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner: this.orgName,
        repo: agentName,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      });

      return issues.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '000000' : label.color || '000000'
        })),
        user: {
          login: issue.user?.login || 'unknown',
          avatar_url: issue.user?.avatar_url || ''
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
        pull_request: issue.pull_request ? { url: issue.pull_request.url } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching issues for ${agentName}:`, error);
      return [];
    }
  }

  async createAgentIssue(agentName: string, issue: CreateIssueRequest): Promise<GitHubIssue | null> {
    try {
      const { data: createdIssue } = await this.octokit.issues.create({
        owner: this.orgName,
        repo: agentName,
        title: issue.title,
        body: issue.body,
        labels: issue.labels || [],
        assignees: issue.assignees || []
      });

      return {
        id: createdIssue.id,
        number: createdIssue.number,
        title: createdIssue.title,
        body: createdIssue.body || '',
        state: createdIssue.state as 'open' | 'closed',
        labels: createdIssue.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '000000' : label.color || '000000'
        })),
        user: {
          login: createdIssue.user?.login || 'unknown',
          avatar_url: createdIssue.user?.avatar_url || ''
        },
        created_at: createdIssue.created_at,
        updated_at: createdIssue.updated_at,
        html_url: createdIssue.html_url
      };
    } catch (error) {
      console.error(`Error creating issue for ${agentName}:`, error);
      return null;
    }
  }

  async updateAgentIssue(agentName: string, issueNumber: number, updates: UpdateIssueRequest): Promise<GitHubIssue | null> {
    try {
      const { data: updatedIssue } = await this.octokit.issues.update({
        owner: this.orgName,
        repo: agentName,
        issue_number: issueNumber,
        title: updates.title,
        body: updates.body,
        state: updates.state,
        labels: updates.labels
      });

      return {
        id: updatedIssue.id,
        number: updatedIssue.number,
        title: updatedIssue.title,
        body: updatedIssue.body || '',
        state: updatedIssue.state as 'open' | 'closed',
        labels: updatedIssue.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '000000' : label.color || '000000'
        })),
        user: {
          login: updatedIssue.user?.login || 'unknown',
          avatar_url: updatedIssue.user?.avatar_url || ''
        },
        created_at: updatedIssue.created_at,
        updated_at: updatedIssue.updated_at,
        html_url: updatedIssue.html_url
      };
    } catch (error) {
      console.error(`Error updating issue ${issueNumber} for ${agentName}:`, error);
      return null;
    }
  }

  async closeIssue(agentName: string, issueNumber: number, closingComment?: string): Promise<boolean> {
    try {
      // Add closing comment if provided
      if (closingComment) {
        await this.octokit.issues.createComment({
          owner: this.orgName,
          repo: agentName,
          issue_number: issueNumber,
          body: closingComment
        });
      }

      // Close the issue
      await this.octokit.issues.update({
        owner: this.orgName,
        repo: agentName,
        issue_number: issueNumber,
        state: 'closed'
      });

      return true;
    } catch (error) {
      console.error(`Error closing issue ${issueNumber} for ${agentName}:`, error);
      return false;
    }
  }

  async getIssueComments(agentName: string, issueNumber: number) {
    try {
      const { data: comments } = await this.octokit.issues.listComments({
        owner: this.orgName,
        repo: agentName,
        issue_number: issueNumber
      });

      return comments;
    } catch (error) {
      console.error(`Error fetching comments for issue ${issueNumber} in ${agentName}:`, error);
      return [];
    }
  }

  async createPullRequest(agentName: string, options: {
    title: string;
    head: string;
    base: string;
    body: string;
    issue?: number;
  }) {
    try {
      let body = options.body;
      
      // Link to issue if provided
      if (options.issue) {
        body += `\n\nCloses #${options.issue}`;
      }

      const { data: pr } = await this.octokit.pulls.create({
        owner: this.orgName,
        repo: agentName,
        title: options.title,
        head: options.head,
        base: options.base,
        body
      });

      return pr;
    } catch (error) {
      console.error(`Error creating pull request for ${agentName}:`, error);
      return null;
    }
  }

  async createFeatureBranch(agentName: string, featureName: string, issueNumber?: number) {
    try {
      // Get the main branch reference
      const { data: mainRef } = await this.octokit.git.getRef({
        owner: this.orgName,
        repo: agentName,
        ref: 'heads/main'
      });

      // Create feature branch name
      const branchName = issueNumber 
        ? `feature/${issueNumber}-${featureName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        : `feature/${featureName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      // Create the new branch
      await this.octokit.git.createRef({
        owner: this.orgName,
        repo: agentName,
        ref: `refs/heads/${branchName}`,
        sha: mainRef.data.object.sha
      });

      return branchName;
    } catch (error) {
      console.error(`Error creating feature branch for ${agentName}:`, error);
      return null;
    }
  }

  async linkIssueToAgent(agentName: string, issueNumber: number, agentAction: string) {
    try {
      await this.octokit.issues.createComment({
        owner: this.orgName,
        repo: agentName,
        issue_number: issueNumber,
        body: `🤖 **Agent Action**: ${agentAction}\n\n*This comment was automatically generated by the ${agentName} agent.*`
      });
      return true;
    } catch (error) {
      console.error(`Error linking issue to agent ${agentName}:`, error);
      return false;
    }
  }
}

export const githubIssues = new GitHubIssuesService();