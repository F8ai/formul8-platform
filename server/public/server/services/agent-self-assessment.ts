/**
 * Agent Self-Assessment Service
 * Analyzes baseline performance and creates improvement issues
 */

import { Octokit } from "@octokit/rest";
import { baselineExamService } from "./baseline-exam-service";
import OpenAI from "openai";
import { llmManager } from "./llm-manager";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

interface AssessmentResult {
  agentType: string;
  overallScore: number;
  weakAreas: string[];
  recommendations: Recommendation[];
  issuesCreated: number;
}

interface Recommendation {
  category: 'tool' | 'prompt' | 'data' | 'training' | 'architecture';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: 'small' | 'medium' | 'large';
  implementation: string;
  baselineQuestions: BaselineQuestion[];
}

export class AgentSelfAssessmentService {
  
  /**
   * Conduct self-assessment for an agent based on baseline results
   */
  async conductSelfAssessment(agentType: string): Promise<AssessmentResult> {
    // Get recent baseline results
    const baselineResults = await baselineExamService.getAgentExamHistory(agentType);
    
    if (baselineResults.length === 0) {
      throw new Error(`No baseline results found for agent: ${agentType}`);
    }

    const latestResult = baselineResults[0];
    const overallScore = parseFloat(latestResult.overallScore);
    
    // Analyze performance using AI
    const analysis = await this.analyzePerformanceWithAI(agentType, latestResult);
    
    // Generate specific recommendations
    const recommendations = await this.generateRecommendations(agentType, analysis);
    
    // Create GitHub issues for recommendations
    const issuesCreated = await this.createImprovementIssues(agentType, recommendations);
    
    return {
      agentType,
      overallScore,
      weakAreas: analysis.weakAreas,
      recommendations,
      issuesCreated
    };
  }

  /**
   * Analyze performance using AI to identify specific issues
   */
  private async analyzePerformanceWithAI(agentType: string, result: any): Promise<any> {
    if (!openai) {
      // Return mock analysis if OpenAI is not available
      return {
        weakAreas: ["Domain Knowledge", "Response Speed", "Accuracy"],
        rootCauses: ["Limited training data", "Insufficient tools", "Prompt optimization needed"],
        missingCapabilities: ["Specialized tools", "Real-time data access", "Enhanced domain knowledge"],
        performancePatterns: ["Inconsistent responses", "Slow processing", "Generic answers"]
      };
    }

    const prompt = `
You are an AI performance analyst reviewing baseline exam results for a ${agentType} agent in the cannabis industry.

Exam Results:
- Overall Score: ${result.overallScore}%
- Confidence Score: ${result.confidenceScore}%
- Accuracy Score: ${result.accuracyScore}%
- Speed Score: ${result.speedScore}%
- Test Results: ${JSON.stringify(result.testResults, null, 2)}

Analyze these results and identify:
1. Specific weak areas where the agent performed poorly
2. Root causes for these performance issues
3. Patterns in the failures
4. Missing capabilities that would improve performance

Provide your analysis in JSON format:
{
  "weakAreas": ["area1", "area2", "area3"],
  "rootCauses": ["cause1", "cause2"],
  "missingCapabilities": ["capability1", "capability2"],
  "performancePatterns": ["pattern1", "pattern2"]
}
`;

    const response = await llmManager.generateResponse(agentType, [
      { role: "system", content: "You are an expert AI performance analyst." },
      { role: "user", content: prompt }
    ], { settings: { temperature: 0.3 } });

    return JSON.parse(response.content);
  }

  /**
   * Generate specific improvement recommendations with baseline questions
   */
  private async generateRecommendations(agentType: string, analysis: any): Promise<Recommendation[]> {
    if (!openai) {
      // Return mock recommendations if OpenAI is not available
      return [
        {
          category: 'tool',
          title: `Implement Domain-Specific Tool for ${agentType}`,
          description: `Add specialized tools to enhance ${agentType} performance in cannabis industry tasks`,
          priority: 'high',
          estimatedEffort: 'medium',
          implementation: '1. Research domain-specific APIs\n2. Implement tool integration\n3. Add tool to agent configuration\n4. Test and validate functionality',
          baselineQuestions: [
            {
              id: `${agentType}-tool-001`,
              category: 'Tool Usage',
              difficulty: 'medium',
              question: `How would you use specialized tools to improve ${agentType} performance?`,
              expectedResponse: `I would use specialized tools to access real-time data, perform advanced analysis, and provide more accurate responses in the cannabis industry context.`,
              maxPoints: 100
            }
          ]
        },
        {
          category: 'data',
          title: `Enhance Knowledge Base for ${agentType}`,
          description: `Improve access to current cannabis industry data and regulations`,
          priority: 'high',
          estimatedEffort: 'large',
          implementation: '1. Identify data sources\n2. Implement data ingestion pipeline\n3. Set up RAG system\n4. Configure knowledge retrieval',
          baselineQuestions: [
            {
              id: `${agentType}-data-001`,
              category: 'Knowledge Base',
              difficulty: 'hard',
              question: `How do you stay updated with current cannabis industry regulations and data?`,
              expectedResponse: `I access real-time regulatory databases, industry reports, and current market data to provide accurate and up-to-date information for cannabis operations.`,
              maxPoints: 100
            }
          ]
        }
      ];
    }

    const prompt = `
Based on the performance analysis for a ${agentType} agent, generate specific improvement recommendations.

Analysis:
- Weak Areas: ${analysis.weakAreas.join(', ')}
- Root Causes: ${analysis.rootCauses.join(', ')}
- Missing Capabilities: ${analysis.missingCapabilities.join(', ')}
- Performance Patterns: ${analysis.performancePatterns.join(', ')}

For each recommendation, determine:
1. Category (tool, prompt, data, training, architecture)
2. Priority (high, medium, low)
3. Estimated effort (small, medium, large)
4. Specific implementation steps
5. Baseline questions that would test the improvement

Generate 3-5 actionable recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "tool",
      "title": "Implement X Tool",
      "description": "Detailed description of the improvement",
      "priority": "high",
      "estimatedEffort": "medium",
      "implementation": "Step-by-step implementation guide",
      "baselineQuestions": [
        {
          "id": "feature-001",
          "category": "Tool Usage",
          "difficulty": "medium",
          "question": "How would you use this new tool to solve X problem?",
          "expectedResponse": "I would use the tool by...",
          "maxPoints": 100
        }
      ]
    }
  ]
}
`;

    const response = await llmManager.generateResponse(agentType, [
      { role: "system", content: "You are an expert AI system architect specializing in cannabis industry applications." },
      { role: "user", content: prompt }
    ], { settings: { temperature: 0.4 } });

    const result = JSON.parse(response.content);
    return result.recommendations;
  }

  /**
   * Create GitHub issues for improvement recommendations
   */
  private async createImprovementIssues(agentType: string, recommendations: Recommendation[]): Promise<number> {
    let issuesCreated = 0;
    
    for (const rec of recommendations) {
      try {
        const issue = await this.createGitHubIssue(agentType, rec);
        if (issue) {
          issuesCreated++;
        }
      } catch (error) {
        console.error(`Failed to create issue for ${agentType}:`, error);
      }
    }
    
    return issuesCreated;
  }

  /**
   * Create a GitHub issue for a specific recommendation
   */
  private async createGitHubIssue(agentType: string, recommendation: Recommendation): Promise<boolean> {
    const repoName = agentType;
    
    const issueTitle = `🔧 ${recommendation.title}`;
    
    // Format baseline questions for the issue
    const questionsSection = recommendation.baselineQuestions.length > 0 ? `
## 📝 Baseline Questions for Testing

Once this feature is implemented, these questions should be added to the baseline exam to test the improvement:

${recommendation.baselineQuestions.map((q, index) => `
### Question ${index + 1}
- **ID:** ${q.id}
- **Category:** ${q.category}
- **Difficulty:** ${q.difficulty}
- **Question:** ${q.question}
- **Expected Response:** ${q.expectedResponse}
- **Max Points:** ${q.maxPoints}
`).join('\n')}

### Adding to Baseline Exam
1. Copy the questions above to \`baseline-exam.json\` in the repository
2. Run the baseline exam to establish new performance metrics
3. Update the GitHub Actions workflow to include these questions
` : '';

    const issueBody = `
## 🎯 Self-Assessment Improvement Recommendation

**Category:** ${recommendation.category}
**Priority:** ${recommendation.priority}
**Estimated Effort:** ${recommendation.estimatedEffort}

## 📋 Description
${recommendation.description}

## 🛠️ Implementation Plan
${recommendation.implementation}

${questionsSection}

## 📊 Expected Impact
Implementing this improvement should enhance the agent's performance in baseline examinations and real-world usage.

## 🔍 Context
This issue was automatically created by the agent's self-assessment system based on baseline exam performance analysis.

---
*This issue was created automatically by the Formul8 Agent Self-Assessment System*
`;

    const labels = [
      'enhancement',
      'self-assessment',
      `priority-${recommendation.priority}`,
      `effort-${recommendation.estimatedEffort}`,
      `category-${recommendation.category}`
    ];

    try {
      const issue = await octokit.rest.issues.create({
        owner: 'F8ai',
        repo: repoName,
        title: issueTitle,
        body: issueBody,
        labels: labels
      });
      
      console.log(`Created issue for ${agentType}: ${issue.data.html_url}`);
      return true;
    } catch (error) {
      console.error(`Failed to create GitHub issue for ${agentType}:`, error);
      return false;
    }
  }

  /**
   * Run self-assessment for all agents
   */
  async runAllAgentAssessments(): Promise<AssessmentResult[]> {
    const agentTypes = baselineExamService.getAvailableAgentTypes();
    const results: AssessmentResult[] = [];
    
    for (const agentType of agentTypes) {
      try {
        const assessment = await this.conductSelfAssessment(agentType);
        results.push(assessment);
      } catch (error) {
        console.error(`Failed to assess ${agentType}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get assessment history for an agent
   */
  async getAssessmentHistory(agentType: string): Promise<any[]> {
    try {
      // Get issues created by self-assessment
      const issues = await octokit.rest.issues.listForRepo({
        owner: 'F8ai',
        repo: agentType,
        labels: 'self-assessment',
        state: 'all',
        sort: 'created',
        direction: 'desc'
      });
      
      return issues.data.map(issue => ({
        id: issue.id,
        title: issue.title,
        state: issue.state,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        url: issue.html_url,
        labels: issue.labels.map(label => typeof label === 'string' ? label : label.name)
      }));
    } catch (error) {
      console.error(`Failed to get assessment history for ${agentType}:`, error);
      return [];
    }
  }
}

export const agentSelfAssessmentService = new AgentSelfAssessmentService();