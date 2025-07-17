/**
 * Test baseline system functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testBaselineSystem() {
  console.log('🔍 Testing baseline system...\n');
  
  const agents = [
    'compliance-agent',
    'patent-agent', 
    'operations-agent',
    'formulation-agent',
    'sourcing-agent',
    'marketing-agent',
    'science-agent',
    'spectra-agent',
    'customer-success-agent'
  ];

  let totalQuestions = 0;
  const allCategories = new Set();
  const allDifficulties = new Set();
  const results = [];

  console.log('Agent Status Report:');
  console.log('===================');

  for (const agent of agents) {
    const baselineFile = path.join(__dirname, `${agent}/baseline.json`);
    const resultsFile = path.join(__dirname, `${agent}/baseline_results.json`);
    
    const status = {
      agent,
      baseline_exists: fs.existsSync(baselineFile),
      results_exists: fs.existsSync(resultsFile),
      questions: 0,
      categories: [],
      difficulties: [],
      status: 'unknown'
    };

    // Check baseline.json
    if (status.baseline_exists) {
      try {
        const baselineData = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
        const questions = baselineData.questions || [];
        
        status.questions = questions.length;
        status.categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
        status.difficulties = [...new Set(questions.map(q => q.difficulty).filter(Boolean))];
        
        if (questions.length > 0) {
          totalQuestions += questions.length;
          status.categories.forEach(cat => allCategories.add(cat));
          status.difficulties.forEach(diff => allDifficulties.add(diff));
          status.status = 'questions_loaded';
        } else {
          status.status = 'baseline_file_empty';
        }
      } catch (error) {
        status.status = 'baseline_file_error';
        status.error = error.message;
      }
    } else {
      status.status = 'baseline_file_missing';
    }

    // Check baseline_results.json
    if (status.results_exists) {
      try {
        const resultsData = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
        status.last_updated = resultsData.timestamp;
        status.results_status = resultsData.status;
      } catch (error) {
        status.results_error = error.message;
      }
    }

    results.push(status);
    
    // Display status
    const statusIcon = status.status === 'questions_loaded' ? '✅' : 
                      status.status === 'baseline_file_missing' ? '❌' : 
                      status.status === 'baseline_file_empty' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} ${agent}:`);
    console.log(`   Baseline: ${status.baseline_exists ? 'EXISTS' : 'MISSING'}`);
    console.log(`   Results: ${status.results_exists ? 'EXISTS' : 'MISSING'}`);
    console.log(`   Questions: ${status.questions}`);
    console.log(`   Categories: ${status.categories.join(', ') || 'none'}`);
    console.log(`   Difficulties: ${status.difficulties.join(', ') || 'none'}`);
    console.log(`   Status: ${status.status}`);
    if (status.error) console.log(`   Error: ${status.error}`);
    console.log('');
  }

  console.log('Summary:');
  console.log('========');
  console.log(`Total Agents: ${agents.length}`);
  console.log(`Agents with Questions: ${results.filter(r => r.questions > 0).length}`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Categories: ${[...allCategories].join(', ')}`);
  console.log(`Difficulty Levels: ${[...allDifficulties].join(', ')}`);
  console.log(`Data Source: real_baseline_files`);
  
  const systemStatus = totalQuestions > 0 ? 'OPERATIONAL' : 'NEEDS_BASELINE_QUESTIONS';
  console.log(`System Status: ${systemStatus}`);

  return {
    total_agents: agents.length,
    agents_with_questions: results.filter(r => r.questions > 0).length,
    total_questions: totalQuestions,
    categories: [...allCategories],
    difficulty_levels: [...allDifficulties],
    agents: results,
    system_status: systemStatus
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testBaselineSystem();
}

export { testBaselineSystem };