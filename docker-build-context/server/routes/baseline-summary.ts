import express from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache for executive summary
let cachedSummary: any = null;
let lastDataHash: string = '';
let lastSummaryGenerated: number = 0;

// Get baseline testing summary across all agents
router.get('/api/baseline-summary', async (req, res) => {
  try {
    const agentDirs = [
      'compliance-agent', 'formulation-agent', 'marketing-agent', 'operations-agent',
      'science-agent', 'sourcing-agent', 'patent-agent', 'spectra-agent',
      'customer-success-agent', 'metabolomics-agent', 'lms-agent'
    ];

    let totalTestResults = 0;
    let totalGradeSum = 0;
    let totalCostSum = 0;
    const modelsFound = new Set<string>();
    const recentTests: any[] = [];
    const agentSummaries: any[] = [];

    for (const agentDir of agentDirs) {
      const agentPath = path.resolve(process.cwd(), `agents/${agentDir}`);
      if (!fs.existsSync(agentPath)) continue;

      const agentName = agentDir.replace('-agent', '');
      let agentResults = 0;
      let agentGradeSum = 0;
      let agentCostSum = 0;
      const agentModels = new Set<string>();

      // Find all result files for this agent
      const files = fs.readdirSync(agentPath);
      const resultFiles = files.filter(file => file.match(/^CO-.+\.json$/));

      for (const file of resultFiles) {
        try {
          const filePath = path.join(agentPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const results = JSON.parse(fileContent);

          if (Array.isArray(results)) {
            const modelName = file.replace('CO-', '').replace('.json', '');
            modelsFound.add(modelName);
            agentModels.add(modelName);

            for (const result of results) {
              if (result.status === 'success' && typeof result.grade === 'number') {
                totalTestResults++;
                agentResults++;
                totalGradeSum += result.grade;
                agentGradeSum += result.grade;
                
                if (result.cost) {
                  totalCostSum += result.cost;
                  agentCostSum += result.cost;
                }

                // Add to recent tests
                recentTests.push({
                  agent: agentName,
                  model: modelName,
                  grade: result.grade,
                  cost: result.cost,
                  timestamp: result.timestamp || new Date().toISOString(),
                  questionId: result.questionId
                });
              }
            }
          }
        } catch (error) {
          console.log(`Error reading ${file}:`, error.message);
        }
      }

      // Add agent summary
      if (agentResults > 0) {
        agentSummaries.push({
          agent: agentName,
          totalResults: agentResults,
          avgGrade: Math.round(agentGradeSum / agentResults),
          totalCost: agentCostSum,
          modelsCount: agentModels.size,
          models: Array.from(agentModels)
        });
      }
    }

    // Sort recent tests by timestamp (newest first)
    recentTests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const summary = {
      totalAgents: agentDirs.length,
      agentsWithResults: agentSummaries.length,
      totalTestResults,
      modelsWithResults: modelsFound.size,
      avgGrade: totalTestResults > 0 ? Math.round(totalGradeSum / totalTestResults) : 0,
      totalCost: totalCostSum,
      models: Array.from(modelsFound),
      recentTests: recentTests.slice(0, 10), // Last 10 tests
      agentSummaries: agentSummaries.sort((a, b) => b.avgGrade - a.avgGrade), // Sort by performance
      timestamp: new Date().toISOString()
    };

    // Generate data hash to detect changes
    const dataHash = generateDataHash(summary);
    
    // Generate executive summary if data changed or cache is old
    const now = Date.now();
    const cacheAge = now - lastSummaryGenerated;
    const cacheExpired = cacheAge > 5 * 60 * 1000; // 5 minutes
    
    if (dataHash !== lastDataHash || cacheExpired || !cachedSummary) {
      console.log('Data changed or cache expired, generating new AI executive summary...');
      try {
        cachedSummary = await generateExecutiveSummary(summary);
        lastDataHash = dataHash;
        lastSummaryGenerated = now;
        console.log('AI executive summary updated');
      } catch (error) {
        console.error('Failed to generate executive summary:', error);
        // Use fallback summary if AI generation fails
        if (!cachedSummary) {
          cachedSummary = generateFallbackSummary(summary);
        }
      }
    }

    // Add executive summary to response
    summary.executiveSummary = cachedSummary;

    res.json(summary);
  } catch (error) {
    console.error('Error generating baseline summary:', error);
    res.status(500).json({ error: 'Failed to generate baseline summary' });
  }
});

// Generate executive summary endpoint (for manual refresh)
router.post('/api/executive-summary/refresh', async (req, res) => {
  try {
    // Force regenerate executive summary
    const summary = await generateBaselineSummaryData();
    cachedSummary = await generateExecutiveSummary(summary);
    lastDataHash = generateDataHash(summary);
    lastSummaryGenerated = Date.now();
    
    res.json({ 
      success: true, 
      summary: cachedSummary,
      message: 'Executive summary refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing executive summary:', error);
    res.status(500).json({ error: 'Failed to refresh executive summary' });
  }
});

function generateDataHash(summary: any): string {
  // Create hash from key metrics to detect changes
  const key = `${summary.totalTestResults}-${summary.avgGrade}-${summary.agentsWithResults}-${summary.modelsWithResults}`;
  return key;
}

async function generateBaselineSummaryData() {
  const agentDirs = [
    'compliance-agent', 'formulation-agent', 'marketing-agent', 'operations-agent',
    'science-agent', 'sourcing-agent', 'patent-agent', 'spectra-agent',
    'customer-success-agent', 'metabolomics-agent', 'lms-agent'
  ];

  let totalTestResults = 0;
  let totalGradeSum = 0;
  let totalCostSum = 0;
  const modelsFound = new Set<string>();
  const agentSummaries: any[] = [];

  for (const agentDir of agentDirs) {
    const agentPath = path.resolve(process.cwd(), `agents/${agentDir}`);
    if (!fs.existsSync(agentPath)) continue;

    const agentName = agentDir.replace('-agent', '');
    let agentResults = 0;
    let agentGradeSum = 0;
    let agentCostSum = 0;

    const files = fs.readdirSync(agentPath);
    const resultFiles = files.filter(file => file.match(/^CO-.+\.json$/));

    for (const file of resultFiles) {
      try {
        const filePath = path.join(agentPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const results = JSON.parse(fileContent);

        if (Array.isArray(results)) {
          const modelName = file.replace('CO-', '').replace('.json', '');
          modelsFound.add(modelName);

          for (const result of results) {
            if (result.status === 'success' && typeof result.grade === 'number') {
              totalTestResults++;
              agentResults++;
              totalGradeSum += result.grade;
              agentGradeSum += result.grade;
              
              if (result.cost) {
                totalCostSum += result.cost;
                agentCostSum += result.cost;
              }
            }
          }
        }
      } catch (error) {
        // Skip invalid files
      }
    }

    if (agentResults > 0) {
      agentSummaries.push({
        agent: agentName,
        totalResults: agentResults,
        avgGrade: Math.round(agentGradeSum / agentResults),
        totalCost: agentCostSum
      });
    }
  }

  return {
    totalAgents: agentDirs.length,
    agentsWithResults: agentSummaries.length,
    totalTestResults,
    modelsWithResults: modelsFound.size,
    avgGrade: totalTestResults > 0 ? Math.round(totalGradeSum / totalTestResults) : 0,
    totalCost: totalCostSum,
    models: Array.from(modelsFound),
    agentSummaries
  };
}

async function generateExecutiveSummary(summary: any) {
  const prompt = `Analyze this cannabis AI platform performance data and provide executive insights:

CURRENT METRICS:
- Total Agents: ${summary.totalAgents}
- Agents with Results: ${summary.agentsWithResults}  
- Test Results: ${summary.totalTestResults}
- AI Models: ${summary.modelsWithResults} (${summary.models.join(', ')})
- Avg Performance: ${summary.avgGrade}%
- Total Cost: $${summary.totalCost.toFixed(4)}
- Cost/Test: $${summary.totalTestResults > 0 ? (summary.totalCost / summary.totalTestResults).toFixed(4) : '0'}

AGENT BREAKDOWN:
${summary.agentSummaries.map((agent: any) => 
  `${agent.agent}: ${agent.avgGrade}% (${agent.totalResults} tests)`
).join(', ')}

Provide JSON with this structure:
{
  "performance": {
    "title": "Performance status title",
    "assessment": "Brief current state assessment",
    "highlights": ["strength 1", "strength 2", "strength 3"]
  },
  "concerns": {
    "title": "Areas needing work title", 
    "assessment": "Brief problem assessment",
    "recommendations": ["action 1", "action 2", "action 3"]
  },
  "recommendations": [
    {"priority": "High", "action": "urgent action", "impact": "impact description"},
    {"priority": "Medium", "action": "important action", "impact": "impact description"}
  ],
  "metrics": {
    "readiness": ${Math.round((summary.agentsWithResults / summary.totalAgents) * 100)},
    "testCoverage": ${Math.round((summary.agentsWithResults / summary.totalAgents) * 100)},
    "modelDiversity": ${summary.modelsWithResults},
    "costEfficiency": "${summary.totalTestResults > 0 ? (summary.totalCost / summary.totalTestResults).toFixed(4) : '0.0000'}"
  },
  "timestamp": "${new Date().toISOString()}"
}

Focus on actionable insights about system completeness, performance trends, and next steps.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.2
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

function generateFallbackSummary(summary: any) {
  const readiness = Math.round((summary.agentsWithResults / summary.totalAgents) * 100);
  const costPerTest = summary.totalTestResults > 0 ? (summary.totalCost / summary.totalTestResults).toFixed(4) : '0.0000';
  
  return {
    performance: {
      title: `System Performance: ${summary.avgGrade}% Average`,
      assessment: `Platform shows ${summary.avgGrade}% average performance across ${summary.totalTestResults} tests with ${summary.modelsWithResults} AI models.`,
      highlights: [
        `${summary.modelsWithResults} AI models tested for reliability`,
        `Cost-effective at $${costPerTest} per test`,
        `${summary.agentsWithResults} agents with validated results`
      ]
    },
    concerns: {
      title: "Coverage Expansion Needed",
      assessment: `${summary.totalAgents - summary.agentsWithResults} agents need baseline testing for complete coverage.`,
      recommendations: [
        "Generate baseline tests for remaining agents",
        "Increase test questions per agent",
        "Add automated testing workflows"
      ]
    },
    recommendations: [
      {
        priority: "High",
        action: "Complete baseline testing for all agents",
        impact: "Full system validation coverage"
      },
      {
        priority: "Medium",
        action: "Expand test questions per model",
        impact: "More reliable performance statistics"
      }
    ],
    metrics: {
      readiness,
      testCoverage: readiness,
      modelDiversity: summary.modelsWithResults,
      costEfficiency: costPerTest
    },
    timestamp: new Date().toISOString()
  };
}

export default router;