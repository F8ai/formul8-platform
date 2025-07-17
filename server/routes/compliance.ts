import { Router } from 'express';
import { z } from 'zod';
// import { isAuthenticated } from '../replitAuth';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const router = Router();

// Dashboard metrics endpoint - AUTHENTIC DATA ONLY from baseline_results.json
router.get('/api/agents/compliance/dashboard', async (req, res) => {
  try {
    // Load authentic baseline test results - NO MOCK DATA
    const baselineResultsFile = path.join(process.cwd(), 'baseline_results.json');
    const baselineQuestionsFile = path.join(process.cwd(), 'compliance-agent/baseline.json');
    
    if (!fs.existsSync(baselineResultsFile)) {
      return res.status(404).json({
        error: 'Authentic baseline results not found',
        message: 'No baseline_results.json file available',
        path: baselineResultsFile
      });
    }

    const baselineResults = JSON.parse(fs.readFileSync(baselineResultsFile, 'utf8'));
    const complianceResults = baselineResults.agents['compliance-agent'];
    
    // Load actual questions for display
    let questionsData = [];
    if (fs.existsSync(baselineQuestionsFile)) {
      const questionsFile = JSON.parse(fs.readFileSync(baselineQuestionsFile, 'utf8'));
      questionsData = questionsFile.questions || [];
    }
    
    // Calculate authentic metrics from real test results
    const categories = Object.keys(complianceResults.baselineQuestions || {});
    const totalQuestions = complianceResults.tests.total;
    const passRate = complianceResults.tests.passRate;
    
    // Count questions by category from actual results
    const categoryStats = categories.reduce((acc: any, cat: string) => {
      const catData = complianceResults.baselineQuestions[cat];
      acc[cat] = catData ? catData.total : 0;
      return acc;
    }, {});
    
    // Count questions by difficulty from actual questions
    const difficultyStats = questionsData.reduce((acc: any, q: any) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});

    // Return only authentic data from baseline_results.json
    res.json({
      generated_at: new Date().toISOString(),
      data_source: 'baseline_results.json',
      authentic_data: true,
      baseline_info: {
        agent_type: 'compliance',
        description: 'Cannabis compliance and regulatory guidance with authentic test results',
        version: '1.0',
        last_updated: baselineResults.lastUpdated
      },
      test_results: {
        accuracy: complianceResults.accuracy,
        confidence: complianceResults.confidence,
        response_time: complianceResults.responseTime,
        pass_rate: passRate,
        total_tests: totalQuestions,
        passed_tests: complianceResults.tests.passed,
        failed_tests: complianceResults.tests.failed
      },
      question_metrics: {
        total_questions: totalQuestions,
        categories: categories,
        difficulties: Object.keys(difficultyStats),
        category_breakdown: categoryStats,
        difficulty_breakdown: difficultyStats
      },
      baseline_questions: complianceResults.baselineQuestions,
      real_questions: questionsData.slice(0, 10) // Show first 10 for display
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load authentic baseline results',
      message: error.message,
      authentic_data_only: true
    });
  }
});

// Chat endpoint
const ChatRequestSchema = z.object({
  message: z.string().min(1),
  conversation_id: z.string().optional(),
  context: z.object({
    state: z.string().optional(),
    license_type: z.string().optional(),
    query_type: z.string().optional()
  }).optional()
});

router.post('/api/agents/compliance/chat', async (req, res) => {
  try {
    const { message, conversation_id, context } = ChatRequestSchema.parse(req.body);
    
    // Load prompt configuration
    const promptConfig = loadPromptConfig();
    
    // Determine query type and select appropriate template
    const queryType = determineQueryType(message);
    const systemPrompt = buildSystemPrompt(promptConfig, queryType, context);
    
    // For now, return a mock response - in production this would call the actual agent
    const mockResponse = generateMockResponse(message, queryType, context);
    
    res.json({
      response: mockResponse,
      conversation_id: conversation_id || generateConversationId(),
      query_type: queryType,
      confidence: 0.85,
      citations: extractCitations(mockResponse),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Prompt configuration endpoints
router.get('/api/agents/compliance/config', async (req, res) => {
  try {
    const config = loadPromptConfig();
    res.json(config);
  } catch (error) {
    console.error('Config load error:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

const ConfigUpdateSchema = z.object({
  system_prompt: z.string().optional(),
  prompt_templates: z.record(z.string()).optional(),
  model_settings: z.object({
    temperature: z.number().min(0).max(1).optional(),
    max_tokens: z.number().min(1).max(4000).optional(),
    top_p: z.number().min(0).max(1).optional()
  }).optional(),
  response_quality: z.object({
    citation_accuracy_threshold: z.number().min(0).max(1).optional(),
    minimum_confidence_score: z.number().min(0).max(1).optional(),
    max_response_length: z.number().min(100).max(5000).optional()
  }).optional()
});

router.put('/api/agents/compliance/config', async (req, res) => {
  try {
    const updates = ConfigUpdateSchema.parse(req.body);
    
    // Load current config
    const currentConfig = loadPromptConfig();
    
    // Merge updates
    const updatedConfig = {
      ...currentConfig,
      ...updates,
      last_updated: new Date().toISOString(),
      updated_by: req.user?.claims?.sub || 'unknown'
    };
    
    // Save updated config
    savePromptConfig(updatedConfig);
    
    res.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Utility functions
function loadPromptConfig() {
  try {
    const configPath = path.join(process.cwd(), 'compliance-agent/config/prompt_config.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    return yaml.load(configFile) as any;
  } catch (error) {
    console.error('Error loading prompt config:', error);
    return getDefaultConfig();
  }
}

function savePromptConfig(config: any) {
  try {
    const configPath = path.join(process.cwd(), 'compliance-agent/config/prompt_config.yaml');
    const yamlString = yaml.dump(config, { 
      indent: 2,
      lineWidth: 120,
      quotingType: '"'
    });
    fs.writeFileSync(configPath, yamlString);
  } catch (error) {
    console.error('Error saving prompt config:', error);
    throw error;
  }
}

function getDefaultConfig() {
  return {
    agent_name: "Compliance Agent",
    system_prompt: "You are a cannabis compliance expert. Provide accurate regulatory guidance with specific citations.",
    model_settings: {
      temperature: 0.1,
      max_tokens: 2000,
      top_p: 0.9
    },
    response_quality: {
      citation_accuracy_threshold: 0.95,
      minimum_confidence_score: 0.85,
      max_response_length: 2000
    }
  };
}

function determineQueryType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('license') || lowerMessage.includes('permit') || lowerMessage.includes('application')) {
    return 'licensing_inquiry';
  }
  if (lowerMessage.includes('operation') || lowerMessage.includes('compliance') || lowerMessage.includes('requirement')) {
    return 'operational_compliance';
  }
  if (lowerMessage.includes('citation') || lowerMessage.includes('regulation') || lowerMessage.includes('section')) {
    return 'regulatory_citation';
  }
  if (lowerMessage.includes('state') || lowerMessage.includes('compare') || lowerMessage.includes('different')) {
    return 'multi_state_comparison';
  }
  if (lowerMessage.includes('risk') || lowerMessage.includes('violation') || lowerMessage.includes('penalty')) {
    return 'risk_assessment';
  }
  
  return 'general_inquiry';
}

function buildSystemPrompt(config: any, queryType: string, context?: any): string {
  let systemPrompt = config.system_prompt || '';
  
  // Add query-specific template
  if (config.prompt_templates && config.prompt_templates[queryType]) {
    systemPrompt += '\n\n' + config.prompt_templates[queryType];
  }
  
  // Add context-specific information
  if (context) {
    if (context.state) {
      systemPrompt += `\n\nContext: The user is asking about ${context.state} state regulations.`;
    }
    if (context.license_type) {
      systemPrompt += `\n\nContext: The query relates to ${context.license_type} licensing.`;
    }
  }
  
  return systemPrompt;
}

function generateMockResponse(message: string, queryType: string, context?: any): string {
  const responses = {
    licensing_inquiry: `Based on your licensing inquiry, here are the key requirements:

**License Application Process:**
- Complete the state application form (Form MJ-1)
- Submit required documentation and fees
- Pass background checks and financial review
- Comply with zoning and security requirements

**Specific Citation:** 
California Code of Regulations, Title 16, Section 5300 - "License Application Requirements"

**Key Requirements:**
1. Proof of financial capability ($250,000 minimum)
2. Security plan meeting state specifications
3. Operating procedures manual
4. Zoning compliance certificate

**Timeline:** Applications typically take 60-90 days for initial review.

**Next Steps:** I recommend reviewing the complete application checklist and scheduling a pre-application meeting with the regulatory agency.`,

    operational_compliance: `For operational compliance, you must adhere to these core requirements:

**Daily Operations:**
- Maintain seed-to-sale tracking (METRC system)
- Conduct daily inventory reconciliation
- Submit monthly compliance reports
- Maintain security surveillance recordings

**Regulatory Citation:** 
Colorado Marijuana Code, Section 12-43.3-402 - "Operational Requirements"

**Key Compliance Areas:**
1. Inventory Management: Track all products from seed to sale
2. Quality Control: Test all products before distribution
3. Record Keeping: Maintain records for minimum 3 years
4. Security: 24/7 surveillance and alarm systems

**Common Violations to Avoid:**
- Inventory discrepancies over 3%
- Late or incomplete reporting
- Security system failures
- Improper waste disposal

**Recommendation:** Implement automated compliance software and conduct monthly internal audits.`,

    regulatory_citation: `Here is the specific regulatory citation you requested:

**Primary Citation:**
Washington Administrative Code (WAC) 314-55-077 - "Marijuana processor license privileges"

**Full Text:**
"A marijuana processor licensed under this chapter may process, package, and label marijuana concentrates and useable marijuana..."

**Key Provisions:**
1. Processing only permitted with valid license
2. All products must be tested by certified lab
3. Packaging must meet child-resistant requirements
4. Labels must include required warnings and information

**Recent Updates:** 
Amended December 2023 - New potency limits for edible products

**Related Regulations:**
- WAC 314-55-102 (Labeling requirements)
- WAC 314-55-095 (Product testing)
- WAC 314-55-089 (Packaging requirements)

**Practical Application:** This regulation governs all processing activities and requires strict compliance with testing and packaging standards.`,

    multi_state_comparison: `Here's a comparison of regulations across key states:

**License Types Comparison:**

**California:** 
- 22 license types including micro-businesses
- Vertical integration permitted with restrictions
- Local approval required before state license

**Colorado:**
- 8 primary license types
- Vertical integration allowed
- State-only licensing (no local approval required)

**Washington:**
- 3-tier system (producer, processor, retailer)
- No vertical integration
- State licensing with local opt-out provisions

**Key Differences:**
1. **Vertical Integration:** CA/CO allow, WA prohibits
2. **Local Control:** CA requires local approval, WA allows opt-out
3. **License Types:** CA most complex, WA most restrictive

**Common Requirements:**
- Background checks for all license holders
- Seed-to-sale tracking systems
- Product testing requirements
- Security and surveillance standards

**Multi-State Recommendation:** Focus on common compliance standards while maintaining state-specific procedures for each jurisdiction.`,

    risk_assessment: `**Compliance Risk Assessment:**

**High-Risk Areas:**
1. **Inventory Tracking Failures** - Most common violation
2. **Security System Gaps** - Mandatory surveillance requirements
3. **Testing Non-Compliance** - Product safety violations
4. **Reporting Delays** - Monthly/quarterly filing requirements

**Risk Mitigation Strategies:**

**Inventory Management:**
- Implement automated tracking systems
- Conduct daily reconciliation
- Maintain backup documentation
- Regular audit procedures

**Regulatory Monitoring:**
- Subscribe to regulatory update services
- Maintain compliance calendar
- Regular training for staff
- Legal counsel on retainer

**Enforcement Trends:**
- Increased focus on diversion prevention
- Stricter enforcement of testing requirements
- Enhanced penalties for repeat violations
- More frequent compliance inspections

**Recommended Actions:**
1. Conduct quarterly compliance audits
2. Implement staff training programs
3. Establish regulatory monitoring system
4. Create violation response procedures

**Early Warning Signs:**
- Inventory discrepancies trending upward
- Customer complaints about products
- Staff turnover in compliance roles
- Delayed regulatory filings`,

    general_inquiry: `Thank you for your compliance question. I can help you with:

**Available Services:**
- Regulatory guidance and citations
- License application assistance
- Operational compliance requirements
- Multi-state regulation comparison
- Risk assessment and mitigation

**How to Get Specific Help:**
1. **Licensing Questions:** Ask about application requirements, fees, or processes
2. **Operational Guidance:** Inquire about daily compliance, reporting, or procedures
3. **Regulatory Citations:** Request specific regulation references and interpretations
4. **Multi-State Issues:** Compare requirements across different jurisdictions
5. **Risk Assessment:** Evaluate compliance risks and mitigation strategies

**Current Database Coverage:**
- 27 cannabis-legal states
- 15,000+ regulatory citations
- 50,000+ vector embeddings
- Real-time regulatory updates

**Please provide more specific information about:**
- Which state's regulations apply
- Your license type or business activity
- The specific compliance area you need help with

This will help me provide more targeted and accurate guidance.`
  };

  return responses[queryType as keyof typeof responses] || responses.general_inquiry;
}

function extractCitations(response: string): string[] {
  const citations: string[] = [];
  const citationRegex = /([A-Z][a-z]+ [A-Z][a-z]+ [Cc]ode|[A-Z][a-z]+ [Aa]dministrative [Cc]ode|[A-Z][a-z]+ [Cc]ode of [Rr]egulations)[^,]*[,]?\s*[Tt]itle\s*\d+[^,]*[,]?\s*[Ss]ection\s*[\d\-\.]+/g;
  
  let match;
  while ((match = citationRegex.exec(response)) !== null) {
    citations.push(match[0]);
  }
  
  return citations;
}

function generateConversationId(): string {
  return 'compliance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateDashboardMetrics() {
  // Cannabis legal states with realistic data
  const states = [
    { code: 'ca', name: 'California', mature: true },
    { code: 'co', name: 'Colorado', mature: true },
    { code: 'wa', name: 'Washington', mature: true },
    { code: 'or', name: 'Oregon', mature: true },
    { code: 'nv', name: 'Nevada', mature: true },
    { code: 'az', name: 'Arizona', mature: false },
    { code: 'ma', name: 'Massachusetts', mature: true },
    { code: 'il', name: 'Illinois', mature: false },
    { code: 'ny', name: 'New York', mature: false },
    { code: 'nj', name: 'New Jersey', mature: false },
    { code: 'ct', name: 'Connecticut', mature: false },
    { code: 'mi', name: 'Michigan', mature: true },
    { code: 'fl', name: 'Florida', mature: false },
    { code: 'pa', name: 'Pennsylvania', mature: false },
    { code: 'oh', name: 'Ohio', mature: false },
    { code: 'mn', name: 'Minnesota', mature: false },
    { code: 'md', name: 'Maryland', mature: false },
    { code: 'dc', name: 'District of Columbia', mature: true },
    { code: 'vt', name: 'Vermont', mature: false },
    { code: 'me', name: 'Maine', mature: true },
    { code: 'ri', name: 'Rhode Island', mature: false },
    { code: 'nm', name: 'New Mexico', mature: false },
    { code: 'mt', name: 'Montana', mature: false },
    { code: 'ak', name: 'Alaska', mature: true },
    { code: 'hi', name: 'Hawaii', mature: false }
  ];

  const stateMetrics = states.map(state => {
    const isMature = state.mature;
    const statusOptions = ['completed', 'in_progress', 'failed', 'not_started'];
    const status = isMature ? 
      (Math.random() > 0.2 ? 'completed' : 'in_progress') :
      statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const baseFiles = isMature ? 150 + Math.floor(Math.random() * 300) : 50 + Math.floor(Math.random() * 150);
    const baseSize = baseFiles * (0.5 + Math.random() * 2);
    const baseCitations = Math.floor(baseFiles * (0.3 + Math.random() * 0.7));
    const baseVectors = Math.floor(baseCitations * (8 + Math.random() * 12));
    
    return {
      state_code: state.code,
      state_name: state.name,
      status,
      last_updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      processing_metrics: {
        completed_phases: status === 'completed' ? ['mirror', 'extract', 'vectorize', 'validate'] :
                         status === 'in_progress' ? ['mirror', 'extract'] :
                         status === 'failed' ? ['mirror'] : [],
        failed_phases: status === 'failed' ? ['extract'] : [],
        processing_time: Math.floor(30 + Math.random() * 120),
        current_phase: status === 'completed' ? 'complete' :
                      status === 'in_progress' ? 'vectorize' :
                      status === 'failed' ? 'extract' : 'not_started'
      },
      data_metrics: {
        files_downloaded: status === 'not_started' ? 0 : baseFiles,
        download_size_mb: status === 'not_started' ? 0 : Math.round(baseSize * 10) / 10,
        html_files: status === 'not_started' ? 0 : Math.floor(baseFiles * 0.7),
        pdf_files: status === 'not_started' ? 0 : Math.floor(baseFiles * 0.3),
        forms_found: status === 'not_started' ? 0 : Math.floor(10 + Math.random() * 40),
        regulations_found: status === 'not_started' ? 0 : Math.floor(50 + Math.random() * 150)
      },
      citation_metrics: {
        total_citations: status === 'not_started' ? 0 : baseCitations,
        regulation_citations: status === 'not_started' ? 0 : Math.floor(baseCitations * 0.6),
        statute_citations: status === 'not_started' ? 0 : Math.floor(baseCitations * 0.3),
        form_citations: status === 'not_started' ? 0 : Math.floor(baseCitations * 0.1),
        unique_sections: status === 'not_started' ? 0 : Math.floor(baseCitations * 0.4)
      },
      rag_metrics: {
        total_vectors: status === 'not_started' || status === 'failed' ? 0 : baseVectors,
        embedding_dimension: status === 'not_started' || status === 'failed' ? 0 : 384,
        index_size_mb: status === 'not_started' || status === 'failed' ? 0 : Math.round(baseVectors * 0.002 * 10) / 10,
        search_quality_score: status === 'completed' ? 0.75 + Math.random() * 0.2 : 0,
        retrieval_accuracy: status === 'completed' ? 0.8 + Math.random() * 0.15 : 0
      },
      quality_metrics: {
        data_quality_score: status === 'completed' ? 0.7 + Math.random() * 0.25 : 
                           status === 'in_progress' ? 0.5 + Math.random() * 0.3 : 0,
        completeness_score: status === 'completed' ? 0.85 + Math.random() * 0.1 : 
                           status === 'in_progress' ? 0.4 + Math.random() * 0.4 : 0,
        accuracy_score: status === 'completed' ? 0.8 + Math.random() * 0.15 : 
                       status === 'in_progress' ? 0.6 + Math.random() * 0.25 : 0,
        validation_passed: status === 'completed'
      }
    };
  });

  // Calculate summary metrics
  const summaryMetrics = {
    total_files_downloaded: stateMetrics.reduce((sum, s) => sum + s.data_metrics.files_downloaded, 0),
    total_download_size_mb: Math.round(stateMetrics.reduce((sum, s) => sum + s.data_metrics.download_size_mb, 0) * 10) / 10,
    total_citations: stateMetrics.reduce((sum, s) => sum + s.citation_metrics.total_citations, 0),
    total_vectors: stateMetrics.reduce((sum, s) => sum + s.rag_metrics.total_vectors, 0),
    average_quality_score: Math.round(stateMetrics.reduce((sum, s) => sum + s.quality_metrics.data_quality_score, 0) / stateMetrics.length * 100) / 100,
    states_completed: stateMetrics.filter(s => s.status === 'completed').length,
    states_in_progress: stateMetrics.filter(s => s.status === 'in_progress').length,
    states_failed: stateMetrics.filter(s => s.status === 'failed').length,
    states_not_started: stateMetrics.filter(s => s.status === 'not_started').length
  };

  // Top performers
  const topQuality = stateMetrics
    .filter(s => s.quality_metrics.data_quality_score > 0)
    .sort((a, b) => b.quality_metrics.data_quality_score - a.quality_metrics.data_quality_score)
    .slice(0, 5)
    .map(s => ({
      state_name: s.state_name,
      state_code: s.state_code,
      quality_score: s.quality_metrics.data_quality_score
    }));

  const topData = stateMetrics
    .filter(s => s.data_metrics.files_downloaded > 0)
    .sort((a, b) => b.data_metrics.files_downloaded - a.data_metrics.files_downloaded)
    .slice(0, 5)
    .map(s => ({
      state_name: s.state_name,
      state_code: s.state_code,
      files_downloaded: s.data_metrics.files_downloaded
    }));

  const completionRate = Math.round((summaryMetrics.states_completed / states.length) * 100 * 10) / 10;
  const healthyStates = summaryMetrics.states_completed;
  const failedStates = summaryMetrics.states_failed;
  const healthScore = Math.round((healthyStates / states.length) * 100 * 10) / 10;

  return {
    generated_at: new Date().toISOString(),
    total_states: states.length,
    summary_metrics: summaryMetrics,
    state_metrics: stateMetrics,
    processing_status: {
      status_breakdown: {
        completed: summaryMetrics.states_completed,
        in_progress: summaryMetrics.states_in_progress,
        failed: summaryMetrics.states_failed,
        not_started: summaryMetrics.states_not_started
      },
      phase_completion: {
        mirror: stateMetrics.filter(s => s.processing_metrics.completed_phases.includes('mirror')).length,
        extract: stateMetrics.filter(s => s.processing_metrics.completed_phases.includes('extract')).length,
        vectorize: stateMetrics.filter(s => s.processing_metrics.completed_phases.includes('vectorize')).length,
        validate: stateMetrics.filter(s => s.processing_metrics.completed_phases.includes('validate')).length
      },
      completion_rate: completionRate
    },
    top_performers: {
      highest_quality: topQuality,
      most_data: topData
    },
    system_health: {
      overall_health_score: healthScore,
      healthy_states: healthyStates,
      failed_states: failedStates,
      system_status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'critical'
    }
  };
}

export default router;