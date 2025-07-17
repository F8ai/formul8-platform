import { Octokit } from "@octokit/rest";

interface AgentData {
  name: string;
  issues: Array<{
    title: string;
    url: string;
    labels: string[];
    state: string;
  }>;
  baselineQuestions: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
  }>;
  totalQuestions: number;
  totalIssues: number;
}

class AgentDataFetcher {
  private octokit: Octokit;
  private agentRepos = [
    'compliance-agent',
    'formulation-agent', 
    'marketing-agent',
    'science-agent',
    'operations-agent',
    'sourcing-agent',
    'patent-agent',
    'spectra-agent',
    'customer-success-agent'
  ];

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PAT
    });
  }

  async fetchAgentData(agentName: string): Promise<AgentData> {
    try {
      // Fetch GitHub issues
      const issuesResponse = await this.octokit.rest.issues.listForRepo({
        owner: 'F8ai',
        repo: agentName,
        state: 'all',
        per_page: 100
      });

      const issues = issuesResponse.data.map(issue => ({
        title: issue.title,
        url: issue.html_url,
        labels: issue.labels.map(label => typeof label === 'string' ? label : label.name || ''),
        state: issue.state
      }));

      // Fetch baseline.json from repository or local fallback
      let baselineQuestions: any[] = [];
      try {
        const baselineResponse = await this.octokit.rest.repos.getContent({
          owner: 'F8ai',
          repo: agentName,
          path: 'baseline.json'
        });

        if ('content' in baselineResponse.data) {
          const content = Buffer.from(baselineResponse.data.content, 'base64').toString();
          const baselineData = JSON.parse(content);
          baselineQuestions = baselineData.questions || baselineData || [];
        }
      } catch (error) {
        console.log(`No baseline.json found for ${agentName}`);
        // Try local fallback
        try {
          const fs = await import('fs');
          const path = await import('path');
          const localPath = path.join(process.cwd(), `${agentName}`, 'baseline.json');
          if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf8');
            baselineQuestions = JSON.parse(content);
            console.log(`Using local baseline.json for ${agentName}`);
          }
        } catch (localError) {
          console.log(`No local baseline.json found for ${agentName}`);
          // Use preloaded data as final fallback
          try {
            const { preloadedAgentData } = await import('../data/preloaded-agent-data.js');
            if (preloadedAgentData[agentName]) {
              baselineQuestions = preloadedAgentData[agentName].baselineQuestions;
              console.log(`Using preloaded data for ${agentName}`);
            }
          } catch (preloadError) {
            console.log(`Failed to load preloaded data for ${agentName}:`, preloadError);
          }
        }
      }

      // Add preloaded features if no GitHub issues exist
      if (issues.length === 0) {
        const { preloadedAgentData } = await import('../data/preloaded-agent-data.js');
        if (preloadedAgentData[agentName] && preloadedAgentData[agentName].features) {
          const preloadedFeatures = preloadedAgentData[agentName].features.map(feature => ({
            title: feature.title,
            url: `https://github.com/F8ai/${agentName}/issues/new`,
            labels: feature.labels,
            state: 'open'
          }));
          issues.push(...preloadedFeatures);
        }
      }

      return {
        name: agentName,
        issues,
        baselineQuestions,
        totalQuestions: baselineQuestions.length,
        totalIssues: issues.length
      };
    } catch (error) {
      console.error(`Error fetching data for ${agentName}:`, error);
      return {
        name: agentName,
        issues: [],
        baselineQuestions: [],
        totalQuestions: 0,
        totalIssues: 0
      };
    }
  }

  async fetchAllAgentsData(): Promise<AgentData[]> {
    const promises = this.agentRepos.map(repo => this.fetchAgentData(repo));
    return Promise.all(promises);
  }
}

export const agentDataFetcher = new AgentDataFetcher();