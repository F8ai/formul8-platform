/**
 * Baseline Exam Service
 * Manages baseline examinations for each AI agent to establish performance benchmarks
 */

import { storage } from "../storage";
import type { InsertBaselineExamResult, BaselineExamResult } from "@shared/schema";

export interface BaselineQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedResponse: string;
  scoringCriteria: {
    accuracy: number;
    completeness: number;
    relevance: number;
    timeliness: number;
  };
  maxPoints: number;
}

export interface ExamResult {
  questionId: string;
  response: string;
  score: number;
  maxScore: number;
  responseTime: number;
  feedback: string;
}

export class BaselineExamService {
  private agentExams: Record<string, BaselineQuestion[]> = {};

  constructor() {
    this.initializeExams();
  }

  private initializeExams() {
    // Compliance Agent Exam
    this.agentExams['compliance-agent'] = [
      {
        id: 'comp-001',
        category: 'State Regulations',
        difficulty: 'medium',
        question: 'What are the THC limits for recreational cannabis products in California?',
        expectedResponse: 'California allows recreational cannabis products with up to 10mg THC per serving for edibles, with a maximum of 100mg per package. For flower products, there are no specific THC limits, but products must be tested and properly labeled.',
        scoringCriteria: { accuracy: 40, completeness: 30, relevance: 20, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'comp-002',
        category: 'Federal Law',
        difficulty: 'hard',
        question: 'How does the 2018 Farm Bill affect hemp-derived CBD products?',
        expectedResponse: 'The 2018 Farm Bill legalized hemp with less than 0.3% THC on a dry weight basis, removing it from the Controlled Substances Act. However, CBD products still require FDA approval for food and dietary supplements, and interstate commerce regulations apply.',
        scoringCriteria: { accuracy: 35, completeness: 35, relevance: 20, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'comp-003',
        category: 'Packaging Requirements',
        difficulty: 'easy',
        question: 'What information must be included on cannabis product labels?',
        expectedResponse: 'Cannabis labels must include: THC/CBD content, serving size, batch/lot number, expiration date, warning statements, manufacturer information, and state-required symbols. Child-resistant packaging is mandatory.',
        scoringCriteria: { accuracy: 30, completeness: 40, relevance: 20, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Formulation Agent Exam
    this.agentExams['formulation-agent'] = [
      {
        id: 'form-001',
        category: 'Chemical Analysis',
        difficulty: 'hard',
        question: 'Explain the decarboxylation process and its importance in cannabis product formulation.',
        expectedResponse: 'Decarboxylation removes a carboxyl group from cannabinoid acids (THCA, CBDA) through heat, converting them to active forms (THC, CBD). This process is essential for bioavailability and typically occurs at 105-120°C for 30-60 minutes.',
        scoringCriteria: { accuracy: 35, completeness: 30, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'form-002',
        category: 'Extraction Methods',
        difficulty: 'medium',
        question: 'Compare CO2 extraction vs. ethanol extraction for cannabis concentrates.',
        expectedResponse: 'CO2 extraction uses supercritical CO2, producing clean, solvent-free extracts with precise temperature/pressure control. Ethanol extraction is faster and cost-effective but requires solvent removal. CO2 preserves terpenes better, while ethanol can extract more cannabinoids.',
        scoringCriteria: { accuracy: 30, completeness: 35, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'form-003',
        category: 'Molecular Structure',
        difficulty: 'hard',
        question: 'What is the molecular formula of THC and how does it differ from CBD?',
        expectedResponse: 'THC (C21H30O2) and CBD (C21H30O2) are isomers with identical molecular formulas but different structures. THC has a cyclic ring structure that binds to CB1 receptors, while CBD has a hydroxyl group arrangement that doesn\'t directly bind to cannabinoid receptors.',
        scoringCriteria: { accuracy: 40, completeness: 25, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Marketing Agent Exam
    this.agentExams['marketing-agent'] = [
      {
        id: 'mark-001',
        category: 'Digital Marketing',
        difficulty: 'medium',
        question: 'What are the key restrictions for cannabis advertising on social media platforms?',
        expectedResponse: 'Facebook, Instagram, and Google prohibit cannabis advertising. Strategies include: wellness-focused content, educational posts, influencer partnerships, email marketing, and platform-specific channels like Weedmaps and Leafly. Content must avoid direct product promotion.',
        scoringCriteria: { accuracy: 35, completeness: 30, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'mark-002',
        category: 'Customer Segmentation',
        difficulty: 'easy',
        question: 'Identify three key customer segments in the cannabis market.',
        expectedResponse: 'Key segments include: 1) Medical patients seeking therapeutic benefits, 2) Recreational users wanting experiences/effects, 3) Wellness consumers interested in CBD and minor cannabinoids. Each segment requires different messaging and product positioning.',
        scoringCriteria: { accuracy: 30, completeness: 35, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'mark-003',
        category: 'Brand Positioning',
        difficulty: 'medium',
        question: 'How should cannabis brands position themselves in restricted advertising environments?',
        expectedResponse: 'Focus on lifestyle branding, educational content, community building, and wellness positioning. Emphasize quality, safety, and expertise. Use creative workarounds like "plant medicine" or "botanical wellness" terminology while maintaining authenticity.',
        scoringCriteria: { accuracy: 25, completeness: 30, relevance: 35, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Science Agent Exam
    this.agentExams['science-agent'] = [
      {
        id: 'sci-001',
        category: 'Research Methods',
        difficulty: 'hard',
        question: 'Describe the endocannabinoid system and its role in human physiology.',
        expectedResponse: 'The endocannabinoid system includes CB1 and CB2 receptors, endogenous ligands (anandamide, 2-AG), and metabolic enzymes. It regulates homeostasis, affecting mood, appetite, pain, and immune function. THC mimics anandamide, while CBD modulates the system indirectly.',
        scoringCriteria: { accuracy: 40, completeness: 30, relevance: 20, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'sci-002',
        category: 'Clinical Evidence',
        difficulty: 'medium',
        question: 'What clinical evidence supports CBD use for epilepsy treatment?',
        expectedResponse: 'Clinical trials showed CBD (Epidiolex) significantly reduced seizures in Lennox-Gastaut and Dravet syndromes. FDA approved it in 2018 based on randomized controlled trials demonstrating 40-50% seizure reduction in treatment-resistant epilepsy patients.',
        scoringCriteria: { accuracy: 35, completeness: 35, relevance: 20, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'sci-003',
        category: 'Pharmacokinetics',
        difficulty: 'hard',
        question: 'Compare the bioavailability of different cannabis consumption methods.',
        expectedResponse: 'Smoking/vaping: 10-35% bioavailability, rapid onset (minutes). Oral: 4-20% bioavailability, slow onset (1-2 hours), longer duration. Sublingual: 12-35% bioavailability, moderate onset (15-45 minutes). Topical: minimal systemic absorption.',
        scoringCriteria: { accuracy: 35, completeness: 30, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Operations Agent Exam
    this.agentExams['operations-agent'] = [
      {
        id: 'ops-001',
        category: 'Facility Management',
        difficulty: 'medium',
        question: 'What are the key environmental controls needed for cannabis cultivation?',
        expectedResponse: 'Temperature (65-80°F), humidity (40-60% RH), CO2 levels (1000-1500ppm), light cycles (18/6 veg, 12/12 flower), air circulation, and pH monitoring (6.0-7.0 soil, 5.5-6.5 hydro). HVAC systems must prevent mold and maintain consistent conditions.',
        scoringCriteria: { accuracy: 30, completeness: 35, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'ops-002',
        category: 'Security Systems',
        difficulty: 'easy',
        question: 'What security measures are required for cannabis facilities?',
        expectedResponse: 'Requirements include: 24/7 video surveillance, alarm systems, access controls, inventory tracking, secure storage, background checks for employees, and state reporting compliance. Cameras must cover all areas where cannabis is present.',
        scoringCriteria: { accuracy: 25, completeness: 40, relevance: 25, timeliness: 10 },
        maxPoints: 100
      },
      {
        id: 'ops-003',
        category: 'Quality Control',
        difficulty: 'medium',
        question: 'Outline the testing requirements for cannabis products before sale.',
        expectedResponse: 'Testing must include: potency (cannabinoids), contamination (pesticides, heavy metals, microbials), residual solvents, moisture content, and foreign matter. Third-party labs conduct testing, and products must pass all tests before retail distribution.',
        scoringCriteria: { accuracy: 35, completeness: 30, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Initialize exams for other agents
    this.initializeRemainingAgentExams();
  }

  private initializeRemainingAgentExams() {
    // Sourcing Agent Exam
    this.agentExams['sourcing-agent'] = [
      {
        id: 'src-001',
        category: 'Vendor Management',
        difficulty: 'medium',
        question: 'What criteria should be used to evaluate cannabis suppliers?',
        expectedResponse: 'Key criteria include: licensing compliance, product quality and testing, pricing competitiveness, reliability and delivery, financial stability, reputation, and ability to scale. Supplier audits and ongoing performance monitoring are essential.',
        scoringCriteria: { accuracy: 30, completeness: 35, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Patent Agent Exam
    this.agentExams['patent-agent'] = [
      {
        id: 'pat-001',
        category: 'Intellectual Property',
        difficulty: 'hard',
        question: 'Can cannabis strains be patented, and what are the requirements?',
        expectedResponse: 'Plant patents and utility patents may protect cannabis strains if they meet novelty, non-obviousness, and utility requirements. Asexually reproduced distinct varieties can receive plant patents. Utility patents may cover specific genetic modifications or breeding methods.',
        scoringCriteria: { accuracy: 40, completeness: 30, relevance: 20, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Spectra Agent Exam
    this.agentExams['spectra-agent'] = [
      {
        id: 'spec-001',
        category: 'Analytical Testing',
        difficulty: 'hard',
        question: 'Explain how HPLC is used for cannabinoid analysis.',
        expectedResponse: 'HPLC separates cannabinoids using reversed-phase columns with mobile phases of water/acetonitrile. UV detection at 220nm identifies compounds. Retention times and peak areas determine cannabinoid identity and concentration. Sample preparation involves extraction and filtration.',
        scoringCriteria: { accuracy: 35, completeness: 30, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];

    // Customer Success Agent Exam
    this.agentExams['customer-success-agent'] = [
      {
        id: 'cs-001',
        category: 'Customer Support',
        difficulty: 'medium',
        question: 'How should customer service representatives handle dosing questions?',
        expectedResponse: 'Representatives should: 1) Advise "start low, go slow", 2) Refer to product labeling, 3) Recommend consulting healthcare providers, 4) Provide general educational information, 5) Never give medical advice, 6) Document interactions appropriately.',
        scoringCriteria: { accuracy: 30, completeness: 35, relevance: 25, timeliness: 10 },
        maxPoints: 100
      }
    ];
  }

  /**
   * Conduct baseline exam for a specific agent
   */
  async conductBaselineExam(agentType: string): Promise<BaselineExamResult> {
    const questions = this.agentExams[agentType];
    if (!questions) {
      throw new Error(`No baseline exam found for agent: ${agentType}`);
    }

    const results: ExamResult[] = [];
    let totalScore = 0;
    let totalMaxScore = 0;
    let totalResponseTime = 0;

    // Simulate exam taking (in real implementation, this would call the actual agent)
    for (const question of questions) {
      const startTime = Date.now();
      
      // Simulate agent response (in real implementation, this would be actual agent call)
      const response = await this.simulateAgentResponse(agentType, question);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const score = this.scoreResponse(question, response);
      
      results.push({
        questionId: question.id,
        response,
        score,
        maxScore: question.maxPoints,
        responseTime,
        feedback: this.generateFeedback(question, response, score)
      });

      totalScore += score;
      totalMaxScore += question.maxPoints;
      totalResponseTime += responseTime;
    }

    // Calculate performance metrics
    const overallScore = (totalScore / totalMaxScore) * 100;
    const confidenceScore = this.calculateConfidenceScore(results);
    const accuracyScore = this.calculateAccuracyScore(results);
    const speedScore = this.calculateSpeedScore(totalResponseTime / results.length);

    // Store results in database
    const examResult = await storage.createBaselineExamResult({
      agentType,
      examDate: new Date(),
      overallScore: overallScore.toString(),
      confidenceScore: confidenceScore.toString(),
      accuracyScore: accuracyScore.toString(),
      speedScore: speedScore.toString(),
      domainExpertise: this.calculateDomainExpertise(results, questions),
      testResults: {
        totalQuestions: questions.length,
        correctAnswers: results.filter(r => r.score >= r.maxScore * 0.7).length,
        averageResponseTime: totalResponseTime / results.length,
        categoryScores: this.calculateCategoryScores(results, questions)
      },
      notes: `Baseline exam conducted with ${questions.length} questions across multiple categories`
    });

    return examResult;
  }

  /**
   * Simulate agent response (replace with actual agent call in production)
   */
  private async simulateAgentResponse(agentType: string, question: BaselineQuestion): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Simulate varying response quality
    const quality = Math.random();
    if (quality > 0.8) {
      return question.expectedResponse;
    } else if (quality > 0.5) {
      return question.expectedResponse.substring(0, Math.floor(question.expectedResponse.length * 0.8));
    } else {
      return "I need more information to provide a comprehensive answer to this question.";
    }
  }

  /**
   * Score agent response against expected answer
   */
  private scoreResponse(question: BaselineQuestion, response: string): number {
    const expectedWords = question.expectedResponse.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    let matchCount = 0;
    expectedWords.forEach(word => {
      if (responseWords.includes(word)) {
        matchCount++;
      }
    });
    
    const baseScore = (matchCount / expectedWords.length) * question.maxPoints;
    
    // Apply scoring criteria adjustments
    const lengthRatio = response.length / question.expectedResponse.length;
    const completenessMultiplier = Math.min(lengthRatio, 1.0);
    
    return Math.round(baseScore * completenessMultiplier);
  }

  /**
   * Calculate confidence score based on response consistency
   */
  private calculateConfidenceScore(results: ExamResult[]): number {
    const scores = results.map(r => (r.score / r.maxScore) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    return Math.max(0, 100 - standardDeviation * 10);
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(results: ExamResult[]): number {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalMaxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    return (totalScore / totalMaxScore) * 100;
  }

  /**
   * Calculate speed score based on response time
   */
  private calculateSpeedScore(averageResponseTime: number): number {
    // Optimal response time is 3 seconds, max acceptable is 30 seconds
    const optimal = 3000;
    const maxAcceptable = 30000;
    
    if (averageResponseTime <= optimal) return 100;
    if (averageResponseTime >= maxAcceptable) return 0;
    
    return 100 - ((averageResponseTime - optimal) / (maxAcceptable - optimal)) * 100;
  }

  /**
   * Calculate domain expertise scores by category
   */
  private calculateDomainExpertise(results: ExamResult[], questions: BaselineQuestion[]): Record<string, number> {
    const categoryScores: Record<string, { total: number; max: number }> = {};
    
    results.forEach((result, index) => {
      const question = questions[index];
      const category = question.category;
      
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, max: 0 };
      }
      
      categoryScores[category].total += result.score;
      categoryScores[category].max += result.maxScore;
    });
    
    const expertise: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      expertise[category] = (scores.total / scores.max) * 100;
    });
    
    return expertise;
  }

  /**
   * Calculate category scores
   */
  private calculateCategoryScores(results: ExamResult[], questions: BaselineQuestion[]): Record<string, number> {
    return this.calculateDomainExpertise(results, questions);
  }

  /**
   * Generate feedback for a response
   */
  private generateFeedback(question: BaselineQuestion, response: string, score: number): string {
    const percentage = (score / question.maxPoints) * 100;
    
    if (percentage >= 90) {
      return "Excellent response with comprehensive coverage of key points.";
    } else if (percentage >= 70) {
      return "Good response but could include more detail on specific aspects.";
    } else if (percentage >= 50) {
      return "Adequate response but missing several important elements.";
    } else {
      return "Response needs significant improvement to meet baseline standards.";
    }
  }

  /**
   * Get baseline exam questions for an agent
   */
  getExamQuestions(agentType: string): BaselineQuestion[] {
    return this.agentExams[agentType] || [];
  }

  /**
   * Get all agent types with exams
   */
  getAvailableAgentTypes(): string[] {
    return Object.keys(this.agentExams);
  }

  /**
   * Get latest exam results for all agents
   */
  async getLatestExamResults(): Promise<BaselineExamResult[]> {
    return await storage.getLatestBaselineExamResults();
  }

  /**
   * Get exam history for specific agent
   */
  async getAgentExamHistory(agentType: string): Promise<BaselineExamResult[]> {
    return await storage.getBaselineExamResultsForAgent(agentType);
  }
}

export const baselineExamService = new BaselineExamService();