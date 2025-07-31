import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BaselineQuestion {
  id: string;
  question: string;
  expected_answer: string;
  keywords: string[];
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  agent_response?: string;
  confidence_score?: number;
  accuracy_score?: number;
  timestamp?: string;
}

export interface BaselineResult {
  question_id: string;
  question: string;
  expected_answer: string;
  agent_response: string;
  confidence_score: number;
  accuracy_score: number;
  keywords_matched: string[];
  category: string;
  difficulty: string;
  timestamp: string;
}

export class BaselineManager {
  private agentNames = [
    'compliance-agent',
    'formulation-agent', 
    'marketing-agent',
    'science-agent',
    'operations-agent',
    'customer-success-agent',
    'patent-agent',
    'spectra-agent',
    'sourcing-agent'
  ];

  async loadBaselineQuestions(agentName: string): Promise<BaselineQuestion[]> {
    try {
      const filePath = path.join(process.cwd(), agentName, 'baseline.json');
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      return data.questions || [];
    } catch (error) {
      console.error(`Error loading baseline questions for ${agentName}:`, error);
      return [];
    }
  }

  async saveBaselineResults(agentName: string, results: BaselineResult[]): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), agentName, 'baseline-results.json');
      await fs.writeFile(filePath, JSON.stringify({
        agent: agentName,
        timestamp: new Date().toISOString(),
        results: results
      }, null, 2));
    } catch (error) {
      console.error(`Error saving baseline results for ${agentName}:`, error);
    }
  }

  async runBaselineTest(agentName: string, questionId?: string): Promise<BaselineResult[]> {
    const questions = await this.loadBaselineQuestions(agentName);
    
    if (questions.length === 0) {
      throw new Error(`No baseline questions found for ${agentName}`);
    }

    const questionsToTest = questionId 
      ? questions.filter(q => q.id === questionId)
      : questions;

    const results: BaselineResult[] = [];

    for (const question of questionsToTest) {
      try {
        const agentResponse = await this.getAgentResponse(agentName, question.question);
        const accuracyScore = await this.calculateAccuracyScore(question, agentResponse);
        const confidenceScore = await this.calculateConfidenceScore(agentResponse);
        const keywordsMatched = this.getMatchedKeywords(question.keywords, agentResponse);

        const result: BaselineResult = {
          question_id: question.id,
          question: question.question,
          expected_answer: question.expected_answer,
          agent_response: agentResponse,
          confidence_score: confidenceScore,
          accuracy_score: accuracyScore,
          keywords_matched: keywordsMatched,
          category: question.category,
          difficulty: question.difficulty,
          timestamp: new Date().toISOString()
        };

        results.push(result);
      } catch (error) {
        console.error(`Error testing question ${question.id}:`, error);
        results.push({
          question_id: question.id,
          question: question.question,
          expected_answer: question.expected_answer,
          agent_response: `Error: ${error.message}`,
          confidence_score: 0,
          accuracy_score: 0,
          keywords_matched: [],
          category: question.category,
          difficulty: question.difficulty,
          timestamp: new Date().toISOString()
        });
      }
    }

    await this.saveBaselineResults(agentName, results);
    return results;
  }

  private async getAgentResponse(agentName: string, question: string): Promise<string> {
    const agentContext = this.getAgentContext(agentName);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a ${agentContext}. Answer the following question with detailed, accurate information based on your expertise. Be comprehensive but concise.`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    return response.choices[0].message.content || "No response generated";
  }

  private getAgentContext(agentName: string): string {
    const contexts = {
      'compliance-agent': 'cannabis compliance expert specializing in regulatory requirements, licensing, and legal compliance across different states',
      'formulation-agent': 'cannabis formulation scientist with expertise in product development, molecular analysis, and chemical composition',
      'marketing-agent': 'cannabis marketing expert knowledgeable about industry regulations, digital marketing, and brand development',
      'science-agent': 'cannabis research scientist with expertise in scientific literature, clinical trials, and evidence-based analysis',
      'operations-agent': 'cannabis operations specialist focused on facility management, production optimization, and workflow automation',
      'customer-success-agent': 'cannabis customer success expert specializing in customer satisfaction, retention strategies, and business analytics',
      'patent-agent': 'cannabis intellectual property expert with knowledge of patents, trademarks, and IP strategy',
      'spectra-agent': 'cannabis analytical chemistry expert specializing in spectroscopy, testing methods, and quality control',
      'sourcing-agent': 'cannabis procurement specialist with expertise in supplier management, quality evaluation, and supply chain optimization'
    };
    
    return contexts[agentName] || 'cannabis industry expert';
  }

  private async calculateAccuracyScore(question: BaselineQuestion, response: string): Promise<number> {
    try {
      const evaluationPrompt = `
        Evaluate the accuracy of this response to a cannabis industry question.
        
        Question: ${question.question}
        Expected Answer: ${question.expected_answer}
        Actual Response: ${response}
        Keywords: ${question.keywords.join(', ')}
        
        Score the accuracy from 0-100 based on:
        1. Factual correctness
        2. Completeness relative to expected answer
        3. Keyword coverage
        4. Industry-specific knowledge
        
        Return only a number between 0-100.
      `;

      const evaluationResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert evaluator of cannabis industry knowledge. Score responses objectively based on accuracy and completeness."
          },
          {
            role: "user",
            content: evaluationPrompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const scoreText = evaluationResponse.choices[0].message.content?.trim() || "0";
      const score = parseInt(scoreText);
      return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating accuracy score:', error);
      return 0;
    }
  }

  private async calculateConfidenceScore(response: string): Promise<number> {
    try {
      const confidencePrompt = `
        Analyze this response and rate the confidence level from 0-100 based on:
        1. Definitiveness of statements
        2. Use of specific facts vs. general statements
        3. Presence of qualifying language ("might", "could", "possibly")
        4. Depth of technical detail
        
        Response: ${response}
        
        Return only a number between 0-100.
      `;

      const confidenceResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing response confidence levels. Rate objectively based on the certainty and specificity of the content."
          },
          {
            role: "user",
            content: confidencePrompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const scoreText = confidenceResponse.choices[0].message.content?.trim() || "0";
      const score = parseInt(scoreText);
      return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating confidence score:', error);
      return 0;
    }
  }

  private getMatchedKeywords(keywords: string[], response: string): string[] {
    const responseText = response.toLowerCase();
    return keywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    );
  }

  async getBaselineStatus(agentName: string): Promise<{
    totalQuestions: number;
    averageAccuracy: number;
    averageConfidence: number;
    lastTestDate: string | null;
    categoryBreakdown: Record<string, number>;
    difficultyBreakdown: Record<string, number>;
  }> {
    try {
      const filePath = path.join(process.cwd(), agentName, 'baseline-results.json');
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const results = data.results || [];
      const totalQuestions = results.length;
      
      if (totalQuestions === 0) {
        return {
          totalQuestions: 0,
          averageAccuracy: 0,
          averageConfidence: 0,
          lastTestDate: null,
          categoryBreakdown: {},
          difficultyBreakdown: {}
        };
      }

      const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy_score, 0) / totalQuestions;
      const averageConfidence = results.reduce((sum, r) => sum + r.confidence_score, 0) / totalQuestions;
      
      const categoryBreakdown = results.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {});

      const difficultyBreakdown = results.reduce((acc, r) => {
        acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
        return acc;
      }, {});

      return {
        totalQuestions,
        averageAccuracy: Math.round(averageAccuracy),
        averageConfidence: Math.round(averageConfidence),
        lastTestDate: data.timestamp,
        categoryBreakdown,
        difficultyBreakdown
      };
    } catch (error) {
      // If no results file exists, return baseline data
      const questions = await this.loadBaselineQuestions(agentName);
      return {
        totalQuestions: questions.length,
        averageAccuracy: 0,
        averageConfidence: 0,
        lastTestDate: null,
        categoryBreakdown: {},
        difficultyBreakdown: {}
      };
    }
  }

  async getAllAgentsStatus(): Promise<Record<string, any>> {
    const statuses = {};
    
    for (const agentName of this.agentNames) {
      statuses[agentName] = await this.getBaselineStatus(agentName);
    }
    
    return statuses;
  }
}

export const baselineManager = new BaselineManager();