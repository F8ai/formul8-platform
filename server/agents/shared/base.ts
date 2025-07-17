import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// GitHub Integration for Issue Management
export class GitHubIntegration {
  private token: string;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title,
          body,
          labels: labels || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      throw error;
    }
  }

  async updateIssue(issueNumber: number, updates: { title?: string; body?: string; state?: 'open' | 'closed' }): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating GitHub issue:', error);
      throw error;
    }
  }

  async getIssues(state: 'open' | 'closed' | 'all' = 'open', labels?: string[]): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        state,
        ...(labels && { labels: labels.join(',') })
      });
      
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues?${params}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub issues:', error);
      throw error;
    }
  }

  async addComment(issueNumber: number, body: string): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ body })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding GitHub comment:', error);
      throw error;
    }
  }

  // GitHub Projects V2 Integration
  async getProjects(): Promise<any[]> {
    try {
      const response = await fetch(`https://api.github.com/orgs/${this.owner}/projects`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub projects:', error);
      throw error;
    }
  }

  async createProjectItem(projectId: string, issueId: string): Promise<any> {
    try {
      const mutation = `
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
            item {
              id
            }
          }
        }
      `;
      
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            projectId,
            contentId: issueId
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub GraphQL API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding item to project:', error);
      throw error;
    }
  }

  async updateProjectItemField(projectId: string, itemId: string, fieldId: string, value: any): Promise<any> {
    try {
      const mutation = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
          updateProjectV2ItemFieldValue(
            input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
              value: $value
            }
          ) {
            projectV2Item {
              id
            }
          }
        }
      `;
      
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            projectId,
            itemId,
            fieldId,
            value
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub GraphQL API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating project item field:', error);
      throw error;
    }
  }
}

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

export interface VerificationResult {
  consensusReached: boolean;
  finalConfidence: number;
  discrepancies?: string[];
  recommendation: string;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected systemPrompt: string;
  protected githubIntegration?: GitHubIntegration;

  constructor(agentType: string, systemPrompt: string) {
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
    
    // Initialize GitHub integration if credentials are available
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      this.githubIntegration = new GitHubIntegration(
        process.env.GITHUB_TOKEN,
        process.env.GITHUB_OWNER,
        process.env.GITHUB_REPO
      );
    }
  }

  abstract processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse>;

  protected async callOpenAI(prompt: string, useJson = true): Promise<any> {
    try {
      const messages = [
        { role: "system" as const, content: this.systemPrompt },
        { role: "user" as const, content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        ...(useJson && { response_format: { type: "json_object" as const } }),
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      return useJson ? JSON.parse(content || "{}") : content;
    } catch (error) {
      console.error(`Error in ${this.agentType} agent:`, error);
      throw new Error(`Failed to process query with ${this.agentType} agent`);
    }
  }

  protected calculateConfidence(response: any): number {
    // Base confidence calculation - can be overridden by specific agents
    if (response.confidence) return Math.min(100, Math.max(0, response.confidence));
    
    // Simple heuristic based on response completeness
    const hasResponse = response.response && response.response.length > 10;
    const hasSources = response.sources && response.sources.length > 0;
    
    if (hasResponse && hasSources) return 85;
    if (hasResponse) return 70;
    return 50;
  }

  async verifyAgainstAgent(
    primaryResponse: AgentResponse, 
    verifyingAgent: BaseAgent, 
    originalQuery: string
  ): Promise<VerificationResult> {
    const verificationPrompt = `
      Verify the following response from a ${primaryResponse.agent} agent for the query: "${originalQuery}"
      
      Response to verify: ${primaryResponse.response}
      Confidence claimed: ${primaryResponse.confidence}%
      
      As a ${verifyingAgent.agentType} expert, do you agree with this response? 
      Respond with JSON containing:
      {
        "agrees": boolean,
        "confidence": number (0-100),
        "discrepancies": string[] (list any issues found),
        "notes": "string (explanation of your assessment)"
      }
    `;

    try {
      const verification = await verifyingAgent.callOpenAI(verificationPrompt, true);
      
      const consensusReached = verification.agrees && 
        Math.abs(verification.confidence - primaryResponse.confidence) < 20;
      
      const finalConfidence = consensusReached 
        ? Math.min(primaryResponse.confidence, verification.confidence)
        : Math.max(0, Math.min(primaryResponse.confidence, verification.confidence) - 15);

      return {
        consensusReached,
        finalConfidence,
        discrepancies: verification.discrepancies || [],
        recommendation: consensusReached 
          ? "Response verified by cross-agent validation"
          : "Response requires human verification due to agent disagreement"
      };
    } catch (error) {
      console.error("Error in agent verification:", error);
      return {
        consensusReached: false,
        finalConfidence: Math.max(0, primaryResponse.confidence - 30),
        discrepancies: ["Verification process failed"],
        recommendation: "Human verification required due to technical issues"
      };
    }
  }

  // GitHub Issue Management Methods
  async createIssue(title: string, body: string, labels?: string[]): Promise<any> {
    if (!this.githubIntegration) {
      console.warn('GitHub integration not configured');
      return null;
    }
    
    try {
      const agentLabels = [this.agentType, 'ai-generated', ...(labels || [])];
      const issueBody = `**Generated by ${this.agentType} agent**\n\n${body}`;
      
      return await this.githubIntegration.createIssue(title, issueBody, agentLabels);
    } catch (error) {
      console.error(`Error creating issue from ${this.agentType} agent:`, error);
      return null;
    }
  }

  async updateIssue(issueNumber: number, updates: { title?: string; body?: string; state?: 'open' | 'closed' }): Promise<any> {
    if (!this.githubIntegration) {
      console.warn('GitHub integration not configured');
      return null;
    }
    
    try {
      return await this.githubIntegration.updateIssue(issueNumber, updates);
    } catch (error) {
      console.error(`Error updating issue from ${this.agentType} agent:`, error);
      return null;
    }
  }

  async getIssues(state: 'open' | 'closed' | 'all' = 'open', agentSpecific = true): Promise<any[]> {
    if (!this.githubIntegration) {
      console.warn('GitHub integration not configured');
      return [];
    }
    
    try {
      const labels = agentSpecific ? [this.agentType] : undefined;
      return await this.githubIntegration.getIssues(state, labels);
    } catch (error) {
      console.error(`Error fetching issues from ${this.agentType} agent:`, error);
      return [];
    }
  }

  async addComment(issueNumber: number, comment: string): Promise<any> {
    if (!this.githubIntegration) {
      console.warn('GitHub integration not configured');
      return null;
    }
    
    try {
      const agentComment = `**${this.agentType} agent update:**\n\n${comment}`;
      return await this.githubIntegration.addComment(issueNumber, agentComment);
    } catch (error) {
      console.error(`Error adding comment from ${this.agentType} agent:`, error);
      return null;
    }
  }

  // Helper method to log findings as GitHub issues
  async logFinding(title: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<any> {
    const severityLabels = {
      low: ['finding', 'priority-low'],
      medium: ['finding', 'priority-medium'], 
      high: ['finding', 'priority-high'],
      critical: ['finding', 'priority-critical', 'urgent']
    };

    const issueTitle = `[${this.agentType.toUpperCase()}] ${title}`;
    const issueBody = `**Severity:** ${severity.toUpperCase()}\n**Agent:** ${this.agentType}\n\n${description}\n\n*This issue was automatically generated by the Formul8 AI system.*`;
    
    return await this.createIssue(issueTitle, issueBody, severityLabels[severity]);
  }

  // Cross-agent collaboration methods
  async requestCollaboration(targetAgent: string, task: {
    title: string;
    description: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<any> {
    const labels = [
      'cross-agent-collaboration',
      `requester-${this.agentType}`,
      `target-${targetAgent}`,
      `priority-${task.priority}`,
      'orchestration'
    ];

    const issueTitle = `[COLLABORATION] ${this.agentType} → ${targetAgent}: ${task.title}`;
    const issueBody = `
**Requesting Agent:** ${this.agentType}
**Target Agent:** ${targetAgent}
**Priority:** ${task.priority}

## Task Description
${task.description}

## Collaboration Reason
${task.reason}

## Expected Outcome
*To be defined collaboratively between agents*

## Status
- [ ] Request acknowledged by target agent
- [ ] Collaboration plan agreed upon
- [ ] Task execution completed
- [ ] Results validated by both agents

---
*This collaboration request was generated by the ${this.agentType} agent for cross-agent coordination.*
    `;

    return await this.createIssue(issueTitle, issueBody, labels);
  }

  // Report to orchestrator for coordination
  async reportToOrchestrator(report: {
    type: 'performance' | 'issue' | 'improvement' | 'collaboration';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    requiresAction?: boolean;
  }): Promise<any> {
    const labels = [
      'orchestration-report',
      `type-${report.type}`,
      `priority-${report.priority}`,
      `from-${this.agentType}`,
      ...(report.requiresAction ? ['action-required'] : [])
    ];

    const issueTitle = `[${this.agentType.toUpperCase()}] ${report.title}`;
    const issueBody = `
**Reporting Agent:** ${this.agentType}
**Report Type:** ${report.type}
**Priority:** ${report.priority}
**Action Required:** ${report.requiresAction ? 'Yes' : 'No'}

## Report Details
${report.description}

## Orchestrator Actions
- [ ] Report reviewed
- [ ] Impact assessed
- [ ] Coordination plan created (if needed)
- [ ] Follow-up scheduled

---
*This report was automatically generated by the ${this.agentType} agent for orchestration oversight.*
    `;

    return await this.createIssue(issueTitle, issueBody, labels);
  }

  // Project-based task management for agent improvement
  async createImprovementTask(improvement: {
    title: string;
    description: string;
    type: 'performance' | 'accuracy' | 'feature' | 'bug';
    priority: 'low' | 'medium' | 'high';
    estimatedEffort: 'small' | 'medium' | 'large';
  }): Promise<any> {
    const labels = [
      'agent-improvement',
      `type-${improvement.type}`,
      `priority-${improvement.priority}`,
      `effort-${improvement.estimatedEffort}`,
      this.agentType
    ];

    const issueTitle = `[IMPROVEMENT] ${improvement.title}`;
    const issueBody = `
**Agent:** ${this.agentType}
**Type:** ${improvement.type}
**Priority:** ${improvement.priority}
**Estimated Effort:** ${improvement.estimatedEffort}

## Description
${improvement.description}

## Success Criteria
- [ ] Implementation completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Performance validation

## Implementation Notes
*This section will be updated by the agent during implementation*

---
*This improvement task was automatically generated by the ${this.agentType} agent for self-improvement.*
    `;

    return await this.createIssue(issueTitle, issueBody, labels);
  }

  // Analyze performance and suggest improvements
  async analyzeAndSuggestImprovements(performanceData: {
    averageResponseTime: number;
    averageConfidence: number;
    successRate: number;
    commonFailures: string[];
    userFeedback: any[];
  }): Promise<void> {
    const improvements = [];

    // Performance-based improvements
    if (performanceData.averageResponseTime > 10000) {
      improvements.push({
        title: 'Optimize response time',
        description: `Current average response time is ${performanceData.averageResponseTime}ms. Target: <10s`,
        type: 'performance' as const,
        priority: 'high' as const,
        estimatedEffort: 'medium' as const
      });
    }

    // Accuracy-based improvements
    if (performanceData.averageConfidence < 80) {
      improvements.push({
        title: 'Improve confidence scoring',
        description: `Current average confidence is ${performanceData.averageConfidence}%. Target: >80%`,
        type: 'accuracy' as const,
        priority: 'high' as const,
        estimatedEffort: 'large' as const
      });
    }

    // Success rate improvements
    if (performanceData.successRate < 90) {
      improvements.push({
        title: 'Improve success rate',
        description: `Current success rate is ${performanceData.successRate}%. Target: >90%`,
        type: 'accuracy' as const,
        priority: 'medium' as const,
        estimatedEffort: 'large' as const
      });
    }

    // Common failure analysis
    if (performanceData.commonFailures.length > 0) {
      improvements.push({
        title: 'Address common failure patterns',
        description: `Common failures: ${performanceData.commonFailures.join(', ')}`,
        type: 'bug' as const,
        priority: 'high' as const,
        estimatedEffort: 'medium' as const
      });
    }

    // Create improvement tasks
    for (const improvement of improvements) {
      await this.createImprovementTask(improvement);
    }

    // Log analysis summary
    if (improvements.length > 0) {
      await this.logFinding(
        'Performance Analysis Complete',
        `Generated ${improvements.length} improvement tasks based on performance data analysis.`,
        'medium'
      );
    }
  }

  // Get assigned improvement tasks
  async getMyImprovementTasks(): Promise<any[]> {
    try {
      const issues = await this.getIssues('open', true);
      return issues.filter(issue => 
        issue.labels.some((label: any) => label.name === 'agent-improvement')
      );
    } catch (error) {
      console.error('Error fetching improvement tasks:', error);
      return [];
    }
  }

  // Update task progress
  async updateTaskProgress(issueNumber: number, progress: {
    status: 'in-progress' | 'testing' | 'completed';
    notes?: string;
    blockers?: string[];
  }): Promise<any> {
    const statusEmojis = {
      'in-progress': '🔄',
      'testing': '🧪',
      'completed': '✅'
    };

    let comment = `${statusEmojis[progress.status]} **Status Update: ${progress.status.toUpperCase()}**\n\n`;
    
    if (progress.notes) {
      comment += `**Progress Notes:**\n${progress.notes}\n\n`;
    }
    
    if (progress.blockers && progress.blockers.length > 0) {
      comment += `**Blockers:**\n${progress.blockers.map(b => `- ${b}`).join('\n')}\n\n`;
    }
    
    comment += `*Updated by ${this.agentType} agent at ${new Date().toISOString()}*`;

    // Add status label
    const statusLabel = `status-${progress.status}`;
    
    // Update issue with new label and comment
    await this.addComment(issueNumber, comment);
    
    // Close issue if completed
    if (progress.status === 'completed') {
      await this.updateIssue(issueNumber, { state: 'closed' });
    }

    return { success: true, status: progress.status };
  }
}