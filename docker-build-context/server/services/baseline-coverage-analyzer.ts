import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CoverageAnalysis {
  confidence: number;
  coverage: number;
  gaps: string[];
  strengths: string[];
  recommendations: string[];
  detailedAnalysis: string;
  functionalityMap: { [key: string]: number };
  timestamp: string;
}

export class BaselineCoverageAnalyzer {
  
  async analyzeAgentCoverage(agentName: string): Promise<CoverageAnalysis> {
    const agentPath = path.join(process.cwd(), 'agents', `${agentName}-agent`);
    
    // Load README.md
    const readmePath = path.join(agentPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      throw new Error(`README.md not found for ${agentName} agent`);
    }
    
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Load baseline.json
    const baselinePath = path.join(agentPath, 'baseline.json');
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`baseline.json not found for ${agentName} agent`);
    }
    
    const baselineContent = fs.readFileSync(baselinePath, 'utf8');
    const baselineData = JSON.parse(baselineContent);
    const questions = baselineData.questions || [];
    
    // Perform AI analysis
    const analysis = await this.performAIAnalysis(readmeContent, questions, agentName);
    
    return {
      ...analysis,
      timestamp: new Date().toISOString()
    };
  }
  
  private async performAIAnalysis(readmeContent: string, questions: any[], agentName: string): Promise<Omit<CoverageAnalysis, 'timestamp'>> {
    const analysisPrompt = `
You are analyzing the baseline test coverage for a ${agentName} agent in a cannabis industry AI platform.

README.md Content (Desired Functionality):
${readmeContent}

Current Baseline Questions (${questions.length} total):
${questions.map((q, i) => `${i + 1}. ${q.question || q.text || 'No question text'} (Category: ${q.category || 'uncategorized'})`).join('\n')}

Please analyze how well these baseline questions cover the desired functionality described in the README. Provide a comprehensive analysis in the following JSON format:

{
  "confidence": 85,  // 0-100 score for overall confidence in baseline coverage
  "coverage": 75,    // 0-100 percentage of functionality areas covered
  "gaps": [          // Array of specific functionality gaps not covered by questions
    "Missing questions about real-time regulatory monitoring",
    "No questions covering automated alert systems"
  ],
  "strengths": [     // Array of well-covered areas
    "Comprehensive license management coverage",
    "Strong testing protocol questions"
  ],
  "recommendations": [ // Specific suggestions for improvement
    "Add 3-5 questions about real-time regulatory tracking",
    "Include questions about API integration capabilities"
  ],
  "detailedAnalysis": "Comprehensive paragraph analyzing the coverage quality...",
  "functionalityMap": {  // Map of core functionality areas to coverage percentage
    "Regulatory Compliance Monitoring": 60,
    "License Management": 90,
    "SOP Documentation": 80
  }
}

Focus on:
1. How many of the 10 core functionality areas from README are covered
2. Quality and depth of questions for each area
3. Missing critical functionality testing
4. Specific gaps and improvement opportunities
5. Overall readiness for production deployment

Respond with only valid JSON.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysisText = response.choices[0].message.content || '{}';
      
      // Clean up the response to ensure valid JSON
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI analysis JSON:', parseError);
        console.error('Raw response:', analysisText);
        
        // Fallback analysis
        return this.createFallbackAnalysis(questions, readmeContent);
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return this.createFallbackAnalysis(questions, readmeContent);
    }
  }
  
  private createFallbackAnalysis(questions: any[], readmeContent: string): Omit<CoverageAnalysis, 'timestamp'> {
    // Extract functionality areas from README
    const functionalityCount = (readmeContent.match(/### \d+\./g) || []).length;
    const questionCount = questions.length;
    
    // Simple coverage calculation
    const coverage = Math.min(100, Math.round((questionCount / (functionalityCount * 1.5)) * 100));
    const confidence = Math.max(20, coverage - 15); // Confidence slightly lower than coverage
    
    return {
      confidence,
      coverage,
      gaps: [
        'AI analysis unavailable - manual review recommended',
        'Coverage calculation based on question-to-functionality ratio only'
      ],
      strengths: [
        `${questionCount} baseline questions available`,
        `${functionalityCount} functionality areas identified in README`
      ],
      recommendations: [
        'Perform manual review of question coverage',
        'Ensure questions test all major functionality areas',
        'Add integration and performance testing questions'
      ],
      detailedAnalysis: `Fallback analysis: Found ${questionCount} questions for ${functionalityCount} functionality areas. Coverage estimated at ${coverage}% based on question density. Manual review recommended for comprehensive assessment.`,
      functionalityMap: {
        'Total Questions': questionCount,
        'Functionality Areas': functionalityCount,
        'Coverage Ratio': Math.round((questionCount / functionalityCount) * 10) / 10
      }
    };
  }
  
  async analyzeAllAgents(): Promise<{ [agentName: string]: CoverageAnalysis }> {
    const agentDirs = [
      'compliance-agent', 'formulation-agent', 'marketing-agent', 'operations-agent',
      'science-agent', 'sourcing-agent', 'patent-agent', 'spectra-agent',
      'customer-success-agent', 'metabolomics-agent', 'lms-agent'
    ];
    
    const results: { [agentName: string]: CoverageAnalysis } = {};
    
    for (const agentDir of agentDirs) {
      const agentName = agentDir.replace('-agent', '');
      try {
        results[agentName] = await this.analyzeAgentCoverage(agentName);
      } catch (error) {
        console.error(`Error analyzing ${agentName}:`, error);
        // Create minimal analysis for agents without README/baseline
        results[agentName] = {
          confidence: 0,
          coverage: 0,
          gaps: ['README.md or baseline.json not found'],
          strengths: [],
          recommendations: ['Create README.md with desired functionality', 'Create baseline.json with test questions'],
          detailedAnalysis: `Analysis failed: ${error.message}`,
          functionalityMap: {},
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return results;
  }
}

export const baselineCoverageAnalyzer = new BaselineCoverageAnalyzer();