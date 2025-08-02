import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Get real baseline metrics from agent files
router.get('/api/baseline/metrics', isAuthenticated, async (req, res) => {
  try {
    const agents = [
      'compliance-agent',
      'patent-agent', 
      'operations-agent',
      'formulation-agent',
      'sourcing-agent',
      'marketing-agent',
      'science-agent',
      'spectra-agent',
      'customer-success-agent',
      'lms-agent'
    ];

    const metrics = [];
    let totalQuestions = 0;
    const allCategories = new Set();
    const allDifficulties = new Set();

    for (const agent of agents) {
      const baselineFile = path.join(__dirname, `../../agents/${agent}/baseline.json`);
      const resultsFile = path.join(__dirname, `../../agents/${agent}/baseline_results.json`);
      
      // Load baseline results if they exist
      let baselineResults = null;
      if (fs.existsSync(resultsFile)) {
        try {
          baselineResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        } catch (error) {
          console.warn(`Could not parse baseline_results.json for ${agent}:`, error);
        }
      }
      
      if (fs.existsSync(baselineFile)) {
        try {
          const baselineData = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
          const questions = baselineData.questions || [];
          
          if (questions.length > 0) {
            totalQuestions += questions.length;
            
            // Extract categories and difficulties
            questions.forEach(q => {
              if (q.category) allCategories.add(q.category);
              if (q.difficulty) allDifficulties.add(q.difficulty);
            });

            metrics.push({
              agent,
              total_questions: questions.length,
              categories: [...new Set(questions.map(q => q.category))],
              difficulty_levels: [...new Set(questions.map(q => q.difficulty))],
              data_source: 'real_baseline_questions',
              status: 'questions_loaded',
              baseline_results: baselineResults, // Include results from baseline_results.json
              last_updated: baselineResults?.timestamp || null
            });
          } else {
            metrics.push({
              agent,
              total_questions: 0,
              status: 'baseline_file_empty'
            });
          }
        } catch (error) {
          metrics.push({
            agent,
            error: `Failed to parse baseline.json: ${error.message}`,
            status: 'baseline_file_error'
          });
        }
      } else {
        metrics.push({
          agent,
          status: 'baseline_file_missing'
        });
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      data_source: 'real_baseline_files',
      total_agents: agents.length,
      agents_with_questions: metrics.filter(m => m.total_questions > 0).length,
      total_questions: totalQuestions,
      categories: [...allCategories],
      difficulty_levels: [...allDifficulties],
      agents: metrics
    });

  } catch (error) {
    console.error('Error loading baseline metrics:', error);
    res.status(500).json({ 
      error: 'Failed to load baseline metrics',
      message: error.message 
    });
  }
});

export default router;