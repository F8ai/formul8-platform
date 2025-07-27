import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

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

    res.json(summary);
  } catch (error) {
    console.error('Error generating baseline summary:', error);
    res.status(500).json({ error: 'Failed to generate baseline summary' });
  }
});

export default router;