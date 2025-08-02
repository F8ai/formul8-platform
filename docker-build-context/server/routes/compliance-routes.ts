import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { regulatoryDataService, StateRegulation } from '../services/regulatory-data-service';
import { storage } from '../storage';

const router = Router();

// Initialize compliance agent with regulatory data
router.post('/initialize', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_initialization',
      details: { action: 'initialize_regulatory_data' }
    });

    // Start the initial download (this will run in background)
    regulatoryDataService.downloadAllStateRegulations().catch(console.error);
    
    res.json({ 
      message: 'Compliance agent initialization started',
      status: 'downloading',
      estimatedTime: '30-45 minutes for full download'
    });
  } catch (error) {
    console.error('Error initializing compliance agent:', error);
    res.status(500).json({ error: 'Failed to initialize compliance agent' });
  }
});

// Get regulatory data statistics
router.get('/statistics', isAuthenticated, async (req: any, res) => {
  try {
    const stats = regulatoryDataService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching compliance statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get regulations for a specific state
router.get('/state/:stateCode', isAuthenticated, async (req: any, res) => {
  try {
    const { stateCode } = req.params;
    const userId = req.user.claims.sub;
    
    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_query',
      details: { action: 'get_state_regulations', stateCode }
    });

    const regulations = regulatoryDataService.getStateRegulations(stateCode.toUpperCase());
    
    if (regulations.length === 0) {
      return res.status(404).json({ 
        error: 'No regulations found for this state',
        suggestion: 'Try initializing the compliance agent first'
      });
    }
    
    res.json({
      state: stateCode.toUpperCase(),
      regulationCount: regulations.length,
      regulations: regulations.map(reg => ({
        title: reg.title,
        category: reg.category,
        lastUpdated: reg.lastUpdated,
        url: reg.url,
        status: reg.status,
        contentPreview: reg.content.substring(0, 500) + '...'
      }))
    });
  } catch (error) {
    console.error('Error fetching state regulations:', error);
    res.status(500).json({ error: 'Failed to fetch state regulations' });
  }
});

// Search regulations across all states
router.get('/search', isAuthenticated, async (req: any, res) => {
  try {
    const { q: query, state } = req.query;
    const userId = req.user.claims.sub;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_search',
      details: { query, state, action: 'search_regulations' }
    });

    const results = regulatoryDataService.searchRegulations(
      query, 
      state ? String(state).toUpperCase() : undefined
    );
    
    res.json({
      query,
      state: state || 'all',
      resultCount: results.length,
      results: results.map(reg => ({
        state: reg.stateCode,
        title: reg.title,
        category: reg.category,
        lastUpdated: reg.lastUpdated,
        url: reg.url,
        relevantExcerpt: extractRelevantExcerpt(reg.content, query)
      }))
    });
  } catch (error) {
    console.error('Error searching regulations:', error);
    res.status(500).json({ error: 'Failed to search regulations' });
  }
});

// Get full regulation content
router.get('/regulation/:stateCode/:category', isAuthenticated, async (req: any, res) => {
  try {
    const { stateCode, category } = req.params;
    const userId = req.user.claims.sub;
    
    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_detail_view',
      details: { stateCode, category, action: 'view_full_regulation' }
    });

    const stateRegulations = regulatoryDataService.getStateRegulations(stateCode.toUpperCase());
    const regulation = stateRegulations.find(reg => reg.category === category);
    
    if (!regulation) {
      return res.status(404).json({ error: 'Regulation not found' });
    }
    
    res.json({
      regulation: {
        ...regulation,
        contentLength: regulation.content.length,
        wordCount: regulation.content.split(' ').length
      }
    });
  } catch (error) {
    console.error('Error fetching full regulation:', error);
    res.status(500).json({ error: 'Failed to fetch regulation' });
  }
});

// Force update regulations for a specific state
router.post('/update/:stateCode', isAuthenticated, async (req: any, res) => {
  try {
    const { stateCode } = req.params;
    const userId = req.user.claims.sub;
    
    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_manual_update',
      details: { stateCode, action: 'force_update_regulations' }
    });

    const regulations = await regulatoryDataService.downloadStateRegulations(stateCode.toUpperCase());
    
    res.json({
      message: `Successfully updated regulations for ${stateCode.toUpperCase()}`,
      regulationCount: regulations.length,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating state regulations:', error);
    res.status(500).json({ error: 'Failed to update state regulations' });
  }
});

// Get compliance advice based on regulations
router.post('/advice', isAuthenticated, async (req: any, res) => {
  try {
    const { question, stateCode, businessType } = req.body;
    const userId = req.user.claims.sub;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Log user activity
    await storage.logUserActivity({
      userId,
      activityType: 'compliance_advice_request',
      details: { question, stateCode, businessType, action: 'request_compliance_advice' }
    });

    // Search for relevant regulations
    const relevantRegulations = regulatoryDataService.searchRegulations(question, stateCode);
    
    if (relevantRegulations.length === 0) {
      return res.json({
        advice: 'No specific regulations found for your question. Please consult with a cannabis attorney for personalized legal advice.',
        disclaimer: 'This is not legal advice. Consult with qualified legal counsel.',
        relevantRegulations: []
      });
    }

    // Generate compliance advice based on regulations
    const advice = generateComplianceAdvice(question, relevantRegulations, businessType);
    
    res.json({
      question,
      stateCode: stateCode || 'multi-state',
      businessType,
      advice,
      relevantRegulations: relevantRegulations.slice(0, 5).map(reg => ({
        state: reg.stateCode,
        title: reg.title,
        category: reg.category,
        excerpt: extractRelevantExcerpt(reg.content, question)
      })),
      disclaimer: 'This information is based on publicly available regulations and is not legal advice. Always consult with qualified legal counsel for compliance matters.',
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error generating compliance advice:', error);
    res.status(500).json({ error: 'Failed to generate compliance advice' });
  }
});

// Helper function to extract relevant excerpts
function extractRelevantExcerpt(content: string, query: string): string {
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  const sentences = content.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    if (queryTerms.some(term => lowerSentence.includes(term))) {
      return sentence.trim().substring(0, 300) + '...';
    }
  }
  
  return content.substring(0, 300) + '...';
}

// Helper function to generate compliance advice
function generateComplianceAdvice(question: string, regulations: StateRegulation[], businessType?: string): string {
  const stateCount = new Set(regulations.map(r => r.stateCode)).size;
  const categories = new Set(regulations.map(r => r.category));
  
  let advice = `Based on analysis of ${regulations.length} relevant regulations across ${stateCount} state(s), `;
  
  if (businessType) {
    advice += `for ${businessType} operations, `;
  }
  
  advice += `here are the key compliance considerations:\n\n`;
  
  // Group regulations by category
  const regulationsByCategory = regulations.reduce((acc, reg) => {
    if (!acc[reg.category]) acc[reg.category] = [];
    acc[reg.category].push(reg);
    return acc;
  }, {} as Record<string, StateRegulation[]>);
  
  Object.entries(regulationsByCategory).forEach(([category, regs]) => {
    advice += `**${category.charAt(0).toUpperCase() + category.slice(1)} Requirements:**\n`;
    
    const states = regs.map(r => r.stateCode).join(', ');
    advice += `- Applicable in: ${states}\n`;
    advice += `- Key considerations: Review licensing requirements, operational standards, and reporting obligations\n`;
    advice += `- Recent updates: ${regs.length} regulation(s) found\n\n`;
  });
  
  advice += `**Important Notes:**\n`;
  advice += `- Regulations change frequently - verify current requirements\n`;
  advice += `- State-specific variations exist - review each jurisdiction\n`;
  advice += `- Consider local municipal requirements in addition to state laws\n`;
  advice += `- Consult with cannabis compliance attorney for implementation guidance\n`;
  
  return advice;
}

export default router;