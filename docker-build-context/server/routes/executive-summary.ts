import express from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate AI executive summary of system performance
router.get('/api/executive-summary', async (req, res) => {
  try {
    // Get baseline summary data first
    const baselineSummary = await getBaselineSummaryData();
    
    // Analyze agent directory structure for completeness
    const systemAnalysis = await analyzeSystemCompleteness();
    
    // Generate AI analysis
    const aiAnalysis = await generateAIExecutiveSummary(baselineSummary, systemAnalysis);
    
    res.json(aiAnalysis);
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({ error: 'Failed to generate executive summary' });
  }
});

async function getBaselineSummaryData() {
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

    // Add agent summary
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

async function analyzeSystemCompleteness() {
  const expectedAgents = [
    'compliance-agent', 'formulation-agent', 'marketing-agent', 'operations-agent',
    'science-agent', 'sourcing-agent', 'patent-agent', 'spectra-agent',
    'customer-success-agent', 'metabolomics-agent', 'lms-agent'
  ];

  const analysis = {
    totalAgents: expectedAgents.length,
    agentsWithBaselines: 0,
    agentsWithResults: 0,
    incompleteAgents: [],
    missingComponents: []
  };

  for (const agentDir of expectedAgents) {
    const agentPath = path.resolve(process.cwd(), `agents/${agentDir}`);
    const agentName = agentDir.replace('-agent', '');
    
    if (!fs.existsSync(agentPath)) {
      analysis.incompleteAgents.push(agentName);
      analysis.missingComponents.push(`${agentName}: Missing agent directory`);
      continue;
    }

    // Check for baseline.json
    const baselineFile = path.join(agentPath, 'baseline.json');
    if (fs.existsSync(baselineFile)) {
      analysis.agentsWithBaselines++;
    } else {
      analysis.missingComponents.push(`${agentName}: Missing baseline.json`);
    }

    // Check for test results
    const files = fs.readdirSync(agentPath);
    const resultFiles = files.filter(file => file.match(/^CO-.+\.json$/));
    if (resultFiles.length > 0) {
      analysis.agentsWithResults++;
    } else {
      analysis.missingComponents.push(`${agentName}: No test results`);
    }
  }

  return analysis;
}

async function generateAIExecutiveSummary(baselineSummary: any, systemAnalysis: any) {
  const prompt = `You are an AI executive analyzing a cannabis industry multi-agent AI platform. Based on the following real performance data, provide a comprehensive executive summary:

SYSTEM PERFORMANCE DATA:
- Total Agents: ${baselineSummary.totalAgents}
- Agents with Test Results: ${baselineSummary.agentsWithResults}
- Total Test Results: ${baselineSummary.totalTestResults}
- AI Models Tested: ${baselineSummary.modelsWithResults} (${baselineSummary.models.join(', ')})
- Average Performance Grade: ${baselineSummary.avgGrade}%
- Total Testing Cost: $${baselineSummary.totalCost.toFixed(4)}
- Average Cost per Test: $${baselineSummary.totalTestResults > 0 ? (baselineSummary.totalCost / baselineSummary.totalTestResults).toFixed(4) : '0'}

SYSTEM COMPLETENESS:
- Agents with Baseline Files: ${systemAnalysis.agentsWithBaselines}/${systemAnalysis.totalAgents}
- Agents with Test Results: ${systemAnalysis.agentsWithResults}/${systemAnalysis.totalAgents}
- Missing Components: ${systemAnalysis.missingComponents.join(', ')}

AGENT PERFORMANCE BREAKDOWN:
${baselineSummary.agentSummaries.map((agent: any) => 
  `- ${agent.agent}: ${agent.avgGrade}% avg grade, ${agent.totalResults} tests, $${agent.totalCost.toFixed(4)} cost`
).join('\n')}

Provide a JSON response with this exact structure:
{
  "performance": {
    "title": "Overall Assessment Title",
    "assessment": "Brief assessment of current performance",
    "highlights": ["key strength 1", "key strength 2", "key strength 3"]
  },
  "concerns": {
    "title": "Areas Needing Work",
    "assessment": "Brief assessment of main concerns",
    "recommendations": ["specific action 1", "specific action 2", "specific action 3"]
  },
  "recommendations": [
    {"priority": "High", "action": "specific high priority action", "impact": "expected impact"},
    {"priority": "Medium", "action": "specific medium priority action", "impact": "expected impact"},
    {"priority": "Low", "action": "specific low priority action", "impact": "expected impact"}
  ],
  "metrics": {
    "readiness": number between 0-100,
    "testCoverage": number between 0-100,
    "modelDiversity": number of models,
    "costEfficiency": average cost per test as string like "0.0030"
  },
  "timestamp": "${new Date().toISOString()}"
}

Focus on:
1. What's working well (high performance grades, model diversity, cost efficiency)
2. What needs immediate attention (agents without results, missing baselines)
3. Strategic recommendations for improvement
4. Realistic assessment of system readiness for production use`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using cost-effective model for analysis
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3 // Lower temperature for more consistent analysis
    });

    const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add calculated metrics if not provided by AI
    if (!aiAnalysis.metrics) {
      aiAnalysis.metrics = {
        readiness: Math.round((baselineSummary.agentsWithResults / baselineSummary.totalAgents) * 100),
        testCoverage: Math.round((systemAnalysis.agentsWithResults / systemAnalysis.totalAgents) * 100),
        modelDiversity: baselineSummary.modelsWithResults,
        costEfficiency: baselineSummary.totalTestResults > 0 ? 
          (baselineSummary.totalCost / baselineSummary.totalTestResults).toFixed(4) : '0.0000'
      };
    }

    return aiAnalysis;
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    
    // Fallback analysis based on data
    return {
      performance: {
        title: `Strong Performance: ${baselineSummary.avgGrade}% Average Grade`,
        assessment: `The system demonstrates solid performance with ${baselineSummary.totalTestResults} successful tests across ${baselineSummary.modelsWithResults} AI models. Average performance of ${baselineSummary.avgGrade}% indicates reliable agent responses.`,
        highlights: [
          `${baselineSummary.modelsWithResults} AI models tested for reliability`,
          `Cost-effective testing at $${(baselineSummary.totalCost / baselineSummary.totalTestResults).toFixed(4)} per test`,
          `${baselineSummary.agentsWithResults} agents with validated performance data`
        ]
      },
      concerns: {
        title: "Expansion Needed",
        assessment: `${baselineSummary.totalAgents - baselineSummary.agentsWithResults} agents still need baseline testing to achieve full system coverage.`,
        recommendations: [
          "Generate baseline tests for remaining agents",
          "Establish automated testing pipelines",
          "Add more diverse question categories per agent"
        ]
      },
      recommendations: [
        {
          priority: "High",
          action: "Complete baseline testing for all 11 agents",
          impact: "Full system validation and performance visibility"
        },
        {
          priority: "Medium", 
          action: "Increase test questions per agent to 10+ per model",
          impact: "More reliable performance statistics"
        },
        {
          priority: "Low",
          action: "Add automated daily testing workflows",
          impact: "Continuous performance monitoring"
        }
      ],
      metrics: {
        readiness: Math.round((baselineSummary.agentsWithResults / baselineSummary.totalAgents) * 100),
        testCoverage: Math.round((systemAnalysis.agentsWithResults / systemAnalysis.totalAgents) * 100),
        modelDiversity: baselineSummary.modelsWithResults,
        costEfficiency: baselineSummary.totalTestResults > 0 ? 
          (baselineSummary.totalCost / baselineSummary.totalTestResults).toFixed(4) : '0.0000'
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default router;