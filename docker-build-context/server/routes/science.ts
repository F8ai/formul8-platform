import { Router } from 'express';
import { ScienceAgent } from '../agents/science/science-agent';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { insertQuerySchema, insertAgentResponseSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();
const scienceAgent = new ScienceAgent();

// Science research endpoint
router.post('/research', isAuthenticated, async (req: any, res) => {
  try {
    const { question, projectId } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Question is required' });
    }

    const userId = req.user.claims.sub;
    
    // Create query record
    const queryData = insertQuerySchema.parse({
      userId,
      projectId: projectId || null,
      question,
      agentType: 'science',
      status: 'processing'
    });

    const query = await storage.createQuery(queryData);
    
    // Process with Science Agent
    const agentResponse = await scienceAgent.processQuery(query);
    
    // Save agent response
    const responseData = insertAgentResponseSchema.parse({
      queryId: query.id,
      agentType: 'science',
      response: agentResponse.response,
      confidence: agentResponse.confidence,
      responseTime: agentResponse.responseTime,
      sources: agentResponse.sources,
      metadata: agentResponse.metadata
    });

    const savedResponse = await storage.createAgentResponse(responseData);
    
    // Update query status
    await storage.updateQuery(query.id!, { status: 'completed' });
    
    res.json({
      query,
      response: savedResponse,
      researchType: agentResponse.metadata?.researchType || 'general-analysis',
      evidenceLevel: agentResponse.metadata?.evidenceLevel || 'moderate'
    });

  } catch (error) {
    console.error('Science research error:', error);
    res.status(500).json({ message: 'Failed to process research request' });
  }
});

// Literature search endpoint
router.post('/literature-search', isAuthenticated, async (req: any, res) => {
  try {
    const { searchTerms, filters = {} } = req.body;
    
    if (!searchTerms || !Array.isArray(searchTerms)) {
      return res.status(400).json({ message: 'Search terms array is required' });
    }

    // Simulate literature search (would integrate with real PubMed API)
    const results = await scienceAgent.searchLiterature(searchTerms, filters);
    
    res.json({
      searchTerms,
      totalResults: results.length,
      results: results.slice(0, 20), // Limit to 20 results
      filters: filters,
      searchStrategy: `(cannabis OR marijuana OR hemp) AND (${searchTerms.join(' AND ')})`
    });

  } catch (error) {
    console.error('Literature search error:', error);
    res.status(500).json({ message: 'Failed to perform literature search' });
  }
});

// Evidence validation endpoint
router.post('/validate-claim', isAuthenticated, async (req: any, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim || typeof claim !== 'string') {
      return res.status(400).json({ message: 'Claim is required' });
    }

    const validation = await scienceAgent.validateClaim(claim);
    
    res.json({
      claim,
      evidenceLevel: validation.evidenceLevel,
      consensusLevel: validation.consensusLevel,
      supportingStudies: validation.supportingStudies.length,
      contradictingStudies: validation.contradictingStudies.length,
      recommendations: validation.recommendations,
      lastReviewed: validation.lastReviewed
    });

  } catch (error) {
    console.error('Claim validation error:', error);
    res.status(500).json({ message: 'Failed to validate claim' });
  }
});

// Research trends endpoint
router.get('/trends', isAuthenticated, async (req: any, res) => {
  try {
    const { timeframe = '1year', topics = [] } = req.query;
    
    // Simulate research trends analysis
    const trends = await scienceAgent.analyzeTrends(timeframe, topics);
    
    res.json({
      timeframe,
      topics,
      trends: {
        emergingTopics: [
          'Minor cannabinoids research',
          'Terpene entourage effects',
          'Nanotechnology applications',
          'Personalized cannabis medicine'
        ],
        publicationGrowth: {
          '2020': 1250,
          '2021': 1680,
          '2022': 2100,
          '2023': 2450
        },
        topJournals: [
          'Cannabis and Cannabinoid Research',
          'Journal of Cannabis Research',
          'Frontiers in Pharmacology',
          'Epilepsia'
        ],
        researchGaps: [
          'Long-term safety studies',
          'Pediatric applications',
          'Drug interaction studies',
          'Standardization protocols'
        ]
      }
    });

  } catch (error) {
    console.error('Trends analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze research trends' });
  }
});

// Citation analysis endpoint
router.get('/citations/:pmid', isAuthenticated, async (req: any, res) => {
  try {
    const { pmid } = req.params;
    
    if (!pmid || !/^\d+$/.test(pmid)) {
      return res.status(400).json({ message: 'Valid PMID is required' });
    }

    const citationData = await scienceAgent.analyzeCitations(pmid);
    
    res.json({
      pmid,
      citationCount: citationData.citationCount,
      citingArticles: citationData.citingArticles,
      impactMetrics: citationData.impactMetrics,
      citationTrend: citationData.citationTrend,
      relatedArticles: citationData.relatedArticles
    });

  } catch (error) {
    console.error('Citation analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze citations' });
  }
});

// Research summary endpoint
router.post('/summary', isAuthenticated, async (req: any, res) => {
  try {
    const { topic, studyTypes = [], dateRange = {} } = req.body;
    
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ message: 'Research topic is required' });
    }

    const summary = await scienceAgent.generateResearchSummary(topic, {
      studyTypes,
      dateRange
    });
    
    res.json({
      topic,
      summary: {
        totalStudies: summary.totalStudies,
        evidenceQuality: summary.evidenceQuality,
        keyFindings: summary.keyFindings,
        limitations: summary.limitations,
        clinicalRelevance: summary.clinicalRelevance,
        futureResearch: summary.futureResearch,
        studyDistribution: summary.studyTypes
      },
      methodology: {
        searchStrategy: summary.searchStrategy,
        inclusionCriteria: summary.inclusionCriteria,
        qualityAssessment: summary.qualityAssessment
      }
    });

  } catch (error) {
    console.error('Research summary error:', error);
    res.status(500).json({ message: 'Failed to generate research summary' });
  }
});

// Export to integrate with main routes
export { router as scienceRoutes };