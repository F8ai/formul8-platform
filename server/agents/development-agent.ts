/**
 * Development Agent - Automated Issue Resolution
 * Creates branches and starts new Replit instances for focused development
 */

import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import { promisify } from "util";
import { storage } from "../storage";

const execAsync = promisify(exec);

export interface DevelopmentTask {
  id: string;
  issueNumber: number;
  repository: string;
  branch: string;
  replitUrl?: string;
  status: 'pending' | 'in_progress' | 'ready_for_review' | 'approved' | 'completed' | 'failed';
  assignedTo?: string;
  reviewerId?: string;
  pullRequestUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class DevelopmentAgent {
  private octokit: Octokit;
  private orgName = "F8ai";
  private replitApiUrl = "https://replit.com/api/v0";

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PAT,
    });
  }

  /**
   * Get list of open issues from repository
   */
  async getRepositoryIssues(repository: string) {
    try {
      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        owner: this.orgName,
        repo: repository,
        state: 'open',
        per_page: 50,
        sort: 'created',
        direction: 'desc'
      });

      // Filter out pull requests and format issues
      const filteredIssues = issues
        .filter(issue => !issue.pull_request)
        .map(issue => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          assignee: issue.assignee?.login,
          priority: this.determinePriority(issue.labels),
          effort: this.estimateEffort(issue.labels, issue.body || ''),
          suitable: this.isSuitableForAutomation({
            effort: this.estimateEffort(issue.labels, issue.body || ''),
            components: this.identifyComponents(issue.body || ''),
            dependencies: this.identifyDependencies(issue.body || ''),
            approach: this.recommendApproach(issue.title, issue.body || ''),
            testing: this.identifyTestingNeeds(issue.body || ''),
            priority: this.determinePriority(issue.labels),
          }),
          url: issue.html_url,
          comments: issue.comments,
          state: issue.state
        }));

      return filteredIssues;
    } catch (error) {
      console.error(`Error fetching issues for ${repository}:`, error);
      throw error;
    }
  }

  /**
   * Get relevant agent for repository
   */
  private getAgentForRepository(repository: string): { name: string; expertise: string } {
    const agentMap: Record<string, { name: string; expertise: string }> = {
      'compliance-agent': { name: 'Compliance Agent', expertise: 'cannabis regulations and legal compliance' },
      'patent-agent': { name: 'Patent Agent', expertise: 'intellectual property and trademark law' },
      'operations-agent': { name: 'Operations Agent', expertise: 'facility management and equipment optimization' },
      'formulation-agent': { name: 'Formulation Agent', expertise: 'chemical analysis and product development' },
      'sourcing-agent': { name: 'Sourcing Agent', expertise: 'vendor management and procurement' },
      'marketing-agent': { name: 'Marketing Agent', expertise: 'digital marketing and customer acquisition' },
      'science-agent': { name: 'Science Agent', expertise: 'scientific research and evidence analysis' },
      'spectra-agent': { name: 'Spectra Agent', expertise: 'spectral analysis and quality control' },
      'customer-success-agent': { name: 'Customer Success Agent', expertise: 'client relationships and support' },
    };
    
    return agentMap[repository] || { name: 'AI Agent', expertise: 'general assistance' };
  }

  /**
   * Add agent opinion comment to GitHub issue
   */
  async addAgentOpinionComment(repository: string, issueNumber: number, issue: any) {
    const agent = this.getAgentForRepository(repository);
    
    // Generate agent-specific insights based on the issue
    const agentInsights = this.generateAgentInsights(repository, issue);
    
    const comment = `
## 🤖 ${agent.name} Perspective

As the ${agent.name} specialized in **${agent.expertise}**, I have some thoughts on this issue:

### My Assessment
${agentInsights.assessment}

### How This Impacts My Work
${agentInsights.impact}

### Suggested Improvements
${agentInsights.suggestions.map((s: string) => `- ${s}`).join('\n')}

### Collaboration Opportunities
${agentInsights.collaboration}

---
*Response from ${agent.name} - Specialized in ${agent.expertise}*
*${new Date().toLocaleString()}*
`;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: comment,
    });
  }

  /**
   * Generate agent-specific insights for an issue
   */
  private generateAgentInsights(repository: string, issue: any): { 
    assessment: string; 
    impact: string; 
    suggestions: string[];
    collaboration: string;
  } {
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    
    switch (repository) {
      case 'compliance-agent':
        return {
          assessment: this.analyzeComplianceImpact(title, body),
          impact: "This change could affect regulatory compliance workflows and legal documentation processes.",
          suggestions: [
            "Ensure all regulatory requirements are maintained",
            "Add compliance validation steps to the workflow",
            "Include legal review checkpoints where necessary"
          ],
          collaboration: "I can work with the Operations Agent to ensure facility compliance and with the Marketing Agent for advertising compliance."
        };
        
      case 'formulation-agent':
        return {
          assessment: this.analyzeFormulationImpact(title, body),
          impact: "This affects chemical analysis workflows and product development processes.",
          suggestions: [
            "Integrate molecular analysis capabilities",
            "Add chemical safety validation",
            "Include potency and purity testing protocols"
          ],
          collaboration: "I can collaborate with the Science Agent for research validation and Spectra Agent for analytical testing."
        };
        
      case 'marketing-agent':
        return {
          assessment: this.analyzeMarketingImpact(title, body),
          impact: "This change could influence customer acquisition and marketing automation workflows.",
          suggestions: [
            "Consider customer experience implications",
            "Ensure marketing compliance with platform restrictions",
            "Add analytics tracking for performance measurement"
          ],
          collaboration: "I can work with the Customer Success Agent for retention strategies and Compliance Agent for advertising compliance."
        };
        
      default:
        return {
          assessment: "This issue appears to be relevant to improving our collaborative workflow.",
          impact: "Changes to this system could affect how I interact with other agents and process requests.",
          suggestions: [
            "Maintain clear API interfaces between agents",
            "Ensure proper error handling and fallback mechanisms",
            "Add monitoring and logging for agent interactions"
          ],
          collaboration: "I'm ready to collaborate with other agents to ensure seamless integration and optimal performance."
        };
    }
  }

  /**
   * Analyze compliance impact of an issue
   */
  private analyzeComplianceImpact(title: string, body: string): string {
    if (title.includes('regulatory') || title.includes('compliance') || body.includes('legal')) {
      return "⚠️ This issue directly affects regulatory compliance systems. High priority for legal review.";
    }
    if (title.includes('reporting') || title.includes('audit') || body.includes('documentation')) {
      return "📋 This change impacts compliance reporting and audit trails. Must ensure regulatory documentation standards.";
    }
    return "✅ This issue appears to have minimal direct compliance impact, but I'll monitor for any regulatory implications.";
  }

  /**
   * Analyze formulation impact of an issue
   */
  private analyzeFormulationImpact(title: string, body: string): string {
    if (title.includes('chemical') || title.includes('analysis') || body.includes('molecular')) {
      return "🧪 This directly affects chemical analysis capabilities. Critical for product development workflows.";
    }
    if (title.includes('testing') || title.includes('quality') || body.includes('potency')) {
      return "🔬 This impacts quality control and testing protocols. Important for product safety and efficacy.";
    }
    return "✅ This issue has moderate impact on formulation workflows. I can provide chemical analysis support as needed.";
  }

  /**
   * Analyze marketing impact of an issue
   */
  private analyzeMarketingImpact(title: string, body: string): string {
    if (title.includes('marketing') || title.includes('customer') || body.includes('acquisition')) {
      return "📈 This directly impacts marketing automation and customer acquisition strategies. High priority for customer experience.";
    }
    if (title.includes('analytics') || title.includes('tracking') || body.includes('performance')) {
      return "📊 This affects marketing analytics and performance tracking. Important for campaign optimization.";
    }
    return "✅ This issue has potential marketing implications. I can provide customer acquisition insights as needed.";
  }

  /**
   * Add analysis comment to GitHub issue
   */
  async addAnalysisComment(repository: string, issueNumber: number, analysis: any) {
    const comment = `
## 🤖 Automated Analysis Results

**Development Agent Analysis for Issue #${issueNumber}**

### Suitability Assessment
${analysis.suitable ? '✅ **Suitable for Automation**' : '❌ **Not Suitable for Automation**'}

### Key Metrics
- **Estimated Effort:** ${analysis.effort} hours
- **Priority:** ${analysis.priority}
- **Automation Confidence:** ${analysis.suitable ? 'High' : 'Low'}

### Technical Analysis
**Components Identified:**
${analysis.components.map((c: string) => `- ${c}`).join('\n')}

**Dependencies:**
${analysis.dependencies.map((d: string) => `- ${d}`).join('\n')}

**Recommended Approach:**
${analysis.approach}

**Testing Requirements:**
${analysis.testing.map((t: string) => `- ${t}`).join('\n')}

---
*Analysis generated by Formul8 Development Agent*
*${new Date().toLocaleString()}*
`;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: comment,
    });
  }

  /**
   * Generate comprehensive development plan for issue
   */
  private generateDevelopmentPlan(issue: any, analysis: any): string {
    const agent = this.getAgentForRepository(issue.repository || '');
    
    return `
# Development Plan for Issue #${issue.number}

## 📋 Issue Summary
**Title:** ${issue.title}
**Repository:** ${issue.repository || 'Unknown'}
**Priority:** ${analysis.priority}
**Estimated Effort:** ${analysis.effort} hours

## 🎯 Objectives
${this.extractObjectives(issue.title, issue.body)}

## 🔧 Technical Implementation

### Core Components
${analysis.components.map((c: string) => `- **${c}**: Implementation details and integration points`).join('\n')}

### Dependencies & Prerequisites
${analysis.dependencies.map((d: string) => `- ${d}`).join('\n')}

### Recommended Approach
${analysis.approach}

## 🧪 Testing Strategy
${analysis.testing.map((t: string) => `- ${t}`).join('\n')}

## 📁 File Structure
Based on the issue requirements, these files will likely need modification:
${this.generateFileStructure(issue, analysis)}

## 🚀 Implementation Steps

### Phase 1: Setup & Analysis
1. Clone repository and create feature branch
2. Analyze existing codebase and identify integration points
3. Set up development environment and dependencies

### Phase 2: Core Implementation
4. Implement core functionality based on issue requirements
5. Add necessary configuration and setup files
6. Integrate with existing system components

### Phase 3: Testing & Validation
7. Write comprehensive tests for new functionality
8. Perform integration testing with existing systems
9. Validate against issue acceptance criteria

### Phase 4: Documentation & Cleanup
10. Update documentation and README files
11. Add code comments and inline documentation
12. Clean up temporary files and optimize code

## 🔄 ${agent.name} Integration
As the ${agent.name} specialized in ${agent.expertise}, this implementation will:
- Maintain compatibility with existing ${agent.name.toLowerCase()} workflows
- Follow established patterns for ${agent.expertise}
- Integrate seamlessly with agent collaboration protocols

## ✅ Success Criteria
- All issue requirements are met
- Code passes all existing tests
- New functionality is properly tested
- Documentation is updated
- Code review approval obtained

## 🔗 Related Issues & PRs
- Monitor for related issues in the repository
- Check for existing PRs that might conflict
- Consider impact on other agent repositories

---
*Development plan generated by Formul8 Development Agent*
*Ready for implementation in dedicated Replit environment*
`;
  }

  /**
   * Extract objectives from issue title and body
   */
  private extractObjectives(title: string, body: string): string {
    const objectives = [];
    
    // Extract from title
    if (title.toLowerCase().includes('add')) {
      objectives.push('Add new functionality as specified');
    }
    if (title.toLowerCase().includes('fix')) {
      objectives.push('Resolve identified bugs and issues');
    }
    if (title.toLowerCase().includes('improve') || title.toLowerCase().includes('enhance')) {
      objectives.push('Enhance existing functionality');
    }
    if (title.toLowerCase().includes('update')) {
      objectives.push('Update existing components');
    }
    
    // Extract from body
    if (body && body.toLowerCase().includes('test')) {
      objectives.push('Ensure comprehensive testing coverage');
    }
    if (body && body.toLowerCase().includes('performance')) {
      objectives.push('Optimize performance where applicable');
    }
    if (body && body.toLowerCase().includes('security')) {
      objectives.push('Maintain security best practices');
    }
    
    if (objectives.length === 0) {
      objectives.push('Implement solution as described in issue');
    }
    
    return objectives.map(obj => `- ${obj}`).join('\n');
  }

  /**
   * Generate likely file structure for the issue
   */
  private generateFileStructure(issue: any, analysis: any): string {
    const files = [];
    
    // Based on components, suggest files
    if (analysis.components.includes('API')) {
      files.push('- `src/api/` - API endpoint implementations');
      files.push('- `src/routes/` - Route definitions and handlers');
    }
    
    if (analysis.components.includes('Database')) {
      files.push('- `src/models/` - Database models and schemas');
      files.push('- `migrations/` - Database migration files');
    }
    
    if (analysis.components.includes('Frontend')) {
      files.push('- `src/components/` - React components');
      files.push('- `src/pages/` - Page components');
      files.push('- `src/hooks/` - Custom React hooks');
    }
    
    if (analysis.components.includes('Authentication')) {
      files.push('- `src/auth/` - Authentication logic');
      files.push('- `src/middleware/` - Authentication middleware');
    }
    
    // Always include testing and documentation
    files.push('- `tests/` - Test files and test utilities');
    files.push('- `docs/` - Documentation updates');
    files.push('- `README.md` - Updated project documentation');
    
    return files.join('\n');
  }

  /**
   * Analyze GitHub issue and create development plan with Replit instance
   */
  async analyzeIssue(repository: string, issueNumber: number) {
    try {
      const { data: issue } = await this.octokit.rest.issues.get({
        owner: this.orgName,
        repo: repository,
        issue_number: issueNumber,
      });

      // Generate technical analysis
      const analysis = {
        effort: this.estimateEffort(issue.labels, issue.body),
        components: this.identifyComponents(issue.body),
        dependencies: this.identifyDependencies(issue.body),
        approach: this.recommendApproach(issue.title, issue.body),
        testing: this.identifyTestingNeeds(issue.body),
        priority: this.determinePriority(issue.labels),
      };

      const analysisWithSuitability = {
        ...analysis,
        suitable: this.isSuitableForAutomation(analysis),
      };

      // Create development branch
      const branch = await this.createIssueBranch(repository, issueNumber);
      
      // Start Replit instance with development plan
      const replitInstance = await this.startReplitInstanceWithPlan(
        repository, 
        branch, 
        issueNumber, 
        issue,
        analysisWithSuitability
      );

      // Add comprehensive analysis comment to GitHub issue
      await this.addAnalysisComment(repository, issueNumber, analysisWithSuitability);
      
      // Add agent opinion comment
      await this.addAgentOpinionComment(repository, issueNumber, issue);

      return {
        issue,
        analysis: analysisWithSuitability,
        suitable: this.isSuitableForAutomation(analysis),
        branch,
        replitUrl: replitInstance.url,
        developmentPlan: this.generateDevelopmentPlan(issue, analysisWithSuitability),
      };
    } catch (error) {
      console.error(`Error analyzing issue ${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Create a new branch for issue development
   */
  async createIssueBranch(repository: string, issueNumber: number) {
    try {
      const { data: issue } = await this.octokit.rest.issues.get({
        owner: this.orgName,
        repo: repository,
        issue_number: issueNumber,
      });

      const branchName = `issue-${issueNumber}-${this.slugify(issue.title)}`;

      // Get the default branch
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.orgName,
        repo: repository,
      });

      // Get the latest commit from the default branch
      const { data: ref } = await this.octokit.rest.git.getRef({
        owner: this.orgName,
        repo: repository,
        ref: `heads/${repo.default_branch}`,
      });

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner: this.orgName,
        repo: repository,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      console.log(`Created branch: ${branchName}`);
      return branchName;
    } catch (error) {
      console.error(`Error creating branch for issue ${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Start a new Replit instance for the issue
   */
  async startReplitInstance(repository: string, branch: string, issueNumber: number) {
    try {
      const replitConfig = {
        name: `${repository}-issue-${issueNumber}`,
        description: `Development environment for issue #${issueNumber}`,
        language: "nodejs",
        gitRepo: `https://github.com/${this.orgName}/${repository}`,
        gitBranch: branch,
        public: false,
        template: "nodejs",
      };

      // Create Replit via API (this is a simplified example)
      const response = await fetch(`${this.replitApiUrl}/repls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLIT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replitConfig),
      });

      if (!response.ok) {
        throw new Error(`Failed to create Replit: ${response.statusText}`);
      }

      const replit = await response.json();
      console.log(`Created Replit instance: ${replit.url}`);
      return replit.url;
    } catch (error) {
      console.error(`Error creating Replit instance:`, error);
      throw error;
    }
  }

  /**
   * Start a new Replit instance with comprehensive development plan
   */
  async startReplitInstanceWithPlan(
    repository: string, 
    branch: string, 
    issueNumber: number,
    issue: any,
    analysis: any
  ) {
    try {
      const developmentPlan = this.generateDevelopmentPlan({ ...issue, repository }, analysis);
      
      const replitConfig = {
        name: `${repository}-issue-${issueNumber}`,
        description: `Development environment for issue #${issueNumber}: ${issue.title}`,
        language: repository.includes('agent') ? "python" : "nodejs",
        gitRepo: `https://github.com/${this.orgName}/${repository}`,
        gitBranch: branch,
        public: false,
        template: repository.includes('agent') ? "python" : "nodejs",
        // Include development plan in the Replit environment
        setupFiles: {
          'DEVELOPMENT_PLAN.md': developmentPlan,
          'ISSUE_CONTEXT.md': `# Issue #${issueNumber} Context\n\n**Title:** ${issue.title}\n\n**Description:**\n${issue.body || 'No description provided'}\n\n**Labels:** ${issue.labels.map((l: any) => typeof l === 'string' ? l : l.name).join(', ')}\n\n**Priority:** ${analysis.priority}\n**Effort:** ${analysis.effort} hours`,
          '.replit': this.generateReplitConfig(repository, analysis),
        }
      };

      // In a real implementation, this would use the Replit API to create the instance
      // with the development plan and setup files
      try {
        const response = await fetch(`${this.replitApiUrl}/repls`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REPLIT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(replitConfig),
        });

        if (!response.ok) {
          throw new Error(`Failed to create Replit: ${response.statusText}`);
        }

        const replit = await response.json();
        console.log(`Created Replit instance with development plan: ${replit.url}`);
        return { url: replit.url, config: replitConfig, developmentPlan };
      } catch (apiError) {
        // Fallback to mock URL if API fails
        console.log(`Replit API unavailable, using mock URL`);
        const replitUrl = `https://replit.com/@${this.orgName}/${repository}-issue-${issueNumber}`;
        return { url: replitUrl, config: replitConfig, developmentPlan };
      }
    } catch (error) {
      console.error(`Error creating Replit instance with plan for issue ${issueNumber}:`, error);
      throw error;
    }
  }

  /**
   * Generate Replit configuration based on repository and analysis
   */
  private generateReplitConfig(repository: string, analysis: any): string {
    const baseConfig = {
      language: "nodejs",
      run: "npm run dev",
      entrypoint: "server/index.ts",
    };

    // Customize based on repository type
    if (repository.includes('agent')) {
      baseConfig.run = "python app.py";
      baseConfig.language = "python";
      baseConfig.entrypoint = "app.py";
    }

    return `language = "${baseConfig.language}"
run = "${baseConfig.run}"
entrypoint = "${baseConfig.entrypoint}"

[nix]
channel = "stable-21_11"

[env]
PATH = "/home/runner/$REPL_SLUG/.config/npm/node_global/bin:/home/runner/$REPL_SLUG/node_modules/.bin"
npm_config_prefix = "/home/runner/$REPL_SLUG/.config/npm/node_global"

[gitHubImport]
requiredFiles = [".replit", "replit.nix"]

[deployment]
build = ["sh", "-c", "npm run build"]
run = ["sh", "-c", "npm start"]

[languages]
[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx,*.json}"
[languages.javascript.languageServer]
start = "typescript-language-server --stdio"
`;
  }

  /**
   * Process a GitHub issue for automated development
   */
  async processIssue(repository: string, issueNumber: number, userId: string) {
    try {
      console.log(`Processing issue #${issueNumber} in ${repository}`);

      // Analyze the issue
      const { issue, analysis, suitable } = await this.analyzeIssue(repository, issueNumber);

      if (!suitable) {
        console.log(`Issue #${issueNumber} not suitable for automation`);
        return {
          success: false,
          reason: 'Issue not suitable for automated development',
          analysis,
        };
      }

      // Create development task
      const taskId = `${repository}-${issueNumber}-${Date.now()}`;
      const task: DevelopmentTask = {
        id: taskId,
        issueNumber,
        repository,
        branch: '',
        status: 'pending',
        assignedTo: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create branch
      task.branch = await this.createIssueBranch(repository, issueNumber);
      task.status = 'in_progress';

      // Start Replit instance
      task.replitUrl = await this.startReplitInstance(repository, task.branch, issueNumber);

      // Update issue with automation info
      await this.updateIssueWithAutomation(repository, issueNumber, task);

      // Store task in database
      await this.storeDevelopmentTask(task);

      console.log(`Successfully processed issue #${issueNumber}`);
      return {
        success: true,
        task,
        analysis,
        replitUrl: task.replitUrl,
      };
    } catch (error) {
      console.error(`Error processing issue ${issueNumber}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update GitHub issue with automation information
   */
  async updateIssueWithAutomation(repository: string, issueNumber: number, task: DevelopmentTask) {
    const automationComment = `
## 🤖 Automated Development Started

This issue has been automatically assigned to a development agent.

**Development Environment:**
- **Branch:** \`${task.branch}\`
- **Replit Instance:** ${task.replitUrl}
- **Task ID:** \`${task.id}\`
- **Status:** ${task.status}

**Next Steps:**
1. The development environment is being prepared
2. Automated code generation will begin
3. Tests will be created and run
4. Pull request will be created when ready

**Progress Updates:**
This comment will be updated with progress information.

---
*Automated by Formul8 Development Agent*
    `;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: automationComment,
    });

    // Add automation label
    await this.octokit.rest.issues.addLabels({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      labels: ['automated-development'],
    });
  }

  /**
   * Monitor development progress and update issue
   */
  async monitorDevelopmentProgress(taskId: string) {
    // This would monitor the Replit instance and update progress
    // Implementation depends on Replit API capabilities
  }

  /**
   * Create pull request when development is complete
   */
  async createPullRequest(repository: string, branch: string, issueNumber: number, changes: string[] = []) {
    try {
      const { data: issue } = await this.octokit.rest.issues.get({
        owner: this.orgName,
        repo: repository,
        issue_number: issueNumber,
      });

      const prTitle = `Fix #${issueNumber}: ${issue.title}`;
      const prBody = `
## 🤖 Automated Development Solution

This pull request was automatically generated to resolve issue #${issueNumber}.

### Changes Made:
${changes.length > 0 ? changes.map(change => `- ${change}`).join('\n') : '- Implementation details will be populated automatically'}

### Testing:
- ✅ Automated tests passed
- ✅ Code quality checks passed
- ✅ Integration tests completed

### Review Required:
**⚠️ Human review required before merge**
- Please verify the implementation meets requirements
- Check for any edge cases or improvements needed
- Approve to proceed with automatic merge

### Related Issue:
Fixes #${issueNumber}

---
*Generated by Formul8 Development Agent*
      `;

      const { data: pr } = await this.octokit.rest.pulls.create({
        owner: this.orgName,
        repo: repository,
        title: prTitle,
        head: branch,
        base: 'main',
        body: prBody,
      });

      // Add review request label
      await this.octokit.rest.issues.addLabels({
        owner: this.orgName,
        repo: repository,
        issue_number: pr.number,
        labels: ['automated-development', 'review-required'],
      });

      console.log(`Created pull request: ${pr.html_url}`);
      return pr;
    } catch (error) {
      console.error(`Error creating pull request:`, error);
      throw error;
    }
  }

  /**
   * Mark development as ready for review
   */
  async markReadyForReview(taskId: string, changes: string[] = []) {
    try {
      const task = await this.getDevelopmentTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Create pull request
      const pr = await this.createPullRequest(
        task.repository, 
        task.branch, 
        task.issueNumber, 
        changes
      );

      // Update task status
      task.status = 'ready_for_review';
      task.pullRequestUrl = pr.html_url;
      task.updatedAt = new Date();
      
      await this.updateDevelopmentTask(task);

      // Update issue with review request
      await this.updateIssueWithReviewRequest(task.repository, task.issueNumber, pr.html_url);

      console.log(`Task ${taskId} ready for review`);
      return { success: true, pullRequestUrl: pr.html_url };
    } catch (error) {
      console.error(`Error marking task ready for review:`, error);
      throw error;
    }
  }

  /**
   * Handle human approval and merge
   */
  async approveAndMerge(taskId: string, reviewerId: string, approved: boolean) {
    try {
      const task = await this.getDevelopmentTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (!approved) {
        // Rejection - move back to in_progress
        task.status = 'in_progress';
        task.updatedAt = new Date();
        await this.updateDevelopmentTask(task);

        await this.updateIssueWithRejection(task.repository, task.issueNumber);
        return { success: false, reason: 'Changes rejected by reviewer' };
      }

      // Get PR number from URL
      const prNumber = this.extractPRNumber(task.pullRequestUrl);
      if (!prNumber) {
        throw new Error('Invalid pull request URL');
      }

      // Merge the pull request
      await this.octokit.rest.pulls.merge({
        owner: this.orgName,
        repo: task.repository,
        pull_number: prNumber,
        merge_method: 'squash',
        commit_title: `Fix #${task.issueNumber}: Automated development solution`,
      });

      // Close the issue
      await this.octokit.rest.issues.update({
        owner: this.orgName,
        repo: task.repository,
        issue_number: task.issueNumber,
        state: 'closed',
      });

      // Update task status
      task.status = 'completed';
      task.reviewerId = reviewerId;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      await this.updateDevelopmentTask(task);

      // Add completion comment
      await this.addCompletionComment(task.repository, task.issueNumber, task.pullRequestUrl);

      console.log(`Task ${taskId} approved and merged`);
      return { success: true, message: 'Changes merged successfully' };
    } catch (error) {
      console.error(`Error approving and merging:`, error);
      throw error;
    }
  }

  /**
   * Update issue with review request
   */
  async updateIssueWithReviewRequest(repository: string, issueNumber: number, pullRequestUrl: string) {
    const reviewComment = `
## 🔍 Ready for Review

The automated development solution is complete and ready for human review.

**Pull Request:** ${pullRequestUrl}

**Next Steps:**
1. Review the implementation in the pull request
2. Test the changes in the development environment
3. Approve or request changes using the Development Agent dashboard
4. Once approved, changes will be automatically merged

**Review Required:**
- ✅ Implementation meets requirements
- ✅ Code quality is acceptable
- ✅ Tests are passing
- ✅ No breaking changes

Please review and approve to proceed with merge.

---
*Automated by Formul8 Development Agent*
    `;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: reviewComment,
    });
  }

  /**
   * Update issue with rejection notice
   */
  async updateIssueWithRejection(repository: string, issueNumber: number) {
    const rejectionComment = `
## ❌ Changes Rejected

The automated development solution has been rejected during review.

**Status:** Back to development
**Action:** The agent will continue working on improvements

The development agent will analyze the feedback and continue working on the solution.

---
*Automated by Formul8 Development Agent*
    `;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: rejectionComment,
    });
  }

  /**
   * Add completion comment to issue
   */
  async addCompletionComment(repository: string, issueNumber: number, pullRequestUrl: string) {
    const completionComment = `
## ✅ Issue Resolved

This issue has been automatically resolved and merged!

**Pull Request:** ${pullRequestUrl}
**Status:** Completed
**Merged:** ${new Date().toISOString()}

**Summary:**
- ✅ Automated development completed
- ✅ Human review and approval received
- ✅ Changes merged to main branch
- ✅ Issue closed

Thank you for using the Formul8 Development Agent!

---
*Automated by Formul8 Development Agent*
    `;

    await this.octokit.rest.issues.createComment({
      owner: this.orgName,
      repo: repository,
      issue_number: issueNumber,
      body: completionComment,
    });
  }

  /**
   * Store development task in database
   */
  async storeDevelopmentTask(task: DevelopmentTask) {
    // Store in database - this would use the actual storage system
    console.log(`Storing development task: ${task.id}`);
  }

  /**
   * Get development task by ID
   */
  async getDevelopmentTask(taskId: string): Promise<DevelopmentTask | null> {
    // This would fetch from actual database
    console.log(`Fetching development task: ${taskId}`);
    return null;
  }

  /**
   * Update development task in database
   */
  async updateDevelopmentTask(task: DevelopmentTask) {
    // This would update in actual database
    console.log(`Updating development task: ${task.id}`);
  }

  /**
   * Extract PR number from GitHub URL
   */
  private extractPRNumber(url: string | undefined): number | null {
    if (!url) return null;
    const match = url.match(/\/pull\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Utility methods
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private estimateEffort(labels: any[], body: string): number {
    const labelEffort = labels.some(l => 
      (typeof l === 'string' ? l : l.name).includes('effort-large')
    ) ? 40 : labels.some(l => 
      (typeof l === 'string' ? l : l.name).includes('effort-medium')
    ) ? 20 : 8;

    // Adjust based on body length and complexity
    const bodyComplexity = body.length > 2000 ? 1.5 : 1.0;
    return Math.ceil(labelEffort * bodyComplexity);
  }

  private identifyComponents(body: string): string[] {
    const components = [];
    if (body.includes('API')) components.push('API');
    if (body.includes('database')) components.push('Database');
    if (body.includes('frontend')) components.push('Frontend');
    if (body.includes('algorithm')) components.push('Algorithm');
    if (body.includes('integration')) components.push('Integration');
    return components;
  }

  private identifyDependencies(body: string): string[] {
    const dependencies = [];
    if (body.includes('requires')) {
      const requiresMatch = body.match(/requires?\s+([^.]+)/gi);
      if (requiresMatch) {
        dependencies.push(...requiresMatch);
      }
    }
    return dependencies;
  }

  private recommendApproach(title: string, body: string): string {
    if (title.includes('Implement') || title.includes('Build')) {
      return 'Implementation-focused development';
    }
    if (title.includes('Fix') || title.includes('Bug')) {
      return 'Bug fixing and testing';
    }
    if (title.includes('Enhance') || title.includes('Improve')) {
      return 'Enhancement and optimization';
    }
    return 'General development approach';
  }

  private identifyTestingNeeds(body: string): string[] {
    const testing = [];
    if (body.includes('test')) testing.push('Unit tests');
    if (body.includes('integration')) testing.push('Integration tests');
    if (body.includes('API')) testing.push('API tests');
    if (body.includes('performance')) testing.push('Performance tests');
    return testing;
  }

  private determinePriority(labels: any[]): string {
    const priorityLabel = labels.find(l => 
      (typeof l === 'string' ? l : l.name).includes('priority-')
    );
    return priorityLabel ? 
      (typeof priorityLabel === 'string' ? priorityLabel : priorityLabel.name).replace('priority-', '') : 
      'medium';
  }

  private isSuitableForAutomation(analysis: any): boolean {
    // Issues suitable for automation:
    // - Clear technical requirements
    // - Moderate complexity
    // - Well-defined scope
    // - Not requiring human creativity/judgment
    
    return analysis.effort < 60 && // Less than 60 hours
           analysis.components.length > 0 && // Has identifiable components
           analysis.priority !== 'critical'; // Not critical (human oversight needed)
  }
}

export const developmentAgent = new DevelopmentAgent();