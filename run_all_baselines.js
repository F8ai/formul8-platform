#!/usr/bin/env node
/**
 * Run baseline tests across all agents to generate real data
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const agents = [
  'compliance', 'formulation', 'marketing', 'operations', 
  'science', 'sourcing', 'patent', 'spectra', 
  'customer-success', 'metabolomics', 'lms'
];

const models = [
  'gpt-4o',
  'gpt-4o-mini', 
  'claude-3-5-sonnet',
  'claude-3-haiku',
  'gemini-1.5-pro'
];

async function runBaselineTest(agent, model, state = 'CO') {
  try {
    console.log(`🧪 Testing ${agent} with ${model}...`);
    
    // First, get the baseline questions
    const questionsResponse = await fetch(`${BASE_URL}/api/agents/${agent}/baseline-questions`);
    if (!questionsResponse.ok) {
      throw new Error(`Failed to get questions: ${questionsResponse.status}`);
    }
    
    const questions = await questionsResponse.json();
    console.log(`   Found ${questions.length} questions for ${agent}`);
    
    if (questions.length === 0) {
      console.log(`   ⚠️ No questions found for ${agent}, skipping`);
      return null;
    }
    
    // Start baseline test
    const testResponse = await fetch(`${BASE_URL}/api/baseline-testing/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentType: agent,
        model: model,
        state: state,
        questions: questions
      }),
    });
    
    if (!testResponse.ok) {
      throw new Error(`Failed to start test: ${testResponse.status}`);
    }
    
    const testData = await testResponse.json();
    const runId = testData.runId;
    console.log(`   Started test run ${runId}`);
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`${BASE_URL}/api/baseline-testing/runs/${runId}/progress`);
      if (!statusResponse.ok) {
        throw new Error(`Failed to get progress: ${statusResponse.status}`);
      }
      
      const progress = await statusResponse.json();
      console.log(`   Progress: ${progress.completedQuestions}/${progress.totalQuestions} (${progress.status})`);
      
      if (progress.status === 'completed') {
        console.log(`   ✅ ${agent} + ${model} completed successfully`);
        return {
          agent,
          model,
          runId,
          totalQuestions: progress.totalQuestions,
          completedQuestions: progress.completedQuestions,
          metrics: progress.metrics
        };
      } else if (progress.status === 'failed') {
        throw new Error('Test run failed');
      }
      
      attempts++;
    }
    
    throw new Error('Test timed out');
    
  } catch (error) {
    console.log(`   ❌ ${agent} + ${model} failed: ${error.message}`);
    return null;
  }
}

async function runAllBaselines() {
  console.log('🚀 Running Baseline Tests Across All Agents');
  console.log('============================================');
  console.log(`Testing ${agents.length} agents with ${models.length} models = ${agents.length * models.length} total tests`);
  
  const results = [];
  let successCount = 0;
  let totalTests = 0;
  
  for (const agent of agents) {
    console.log(`\n📊 Testing ${agent} agent:`);
    
    for (const model of models) {
      totalTests++;
      const result = await runBaselineTest(agent, model);
      
      if (result) {
        results.push(result);
        successCount++;
      }
    }
  }
  
  console.log('\n📋 FINAL RESULTS:');
  console.log('=================');
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`📊 Total agents tested: ${agents.length}`);
  console.log(`🤖 Models tested: ${models.join(', ')}`);
  
  if (results.length > 0) {
    console.log('\n🎯 Test Summary:');
    const agentResults = {};
    results.forEach(result => {
      if (!agentResults[result.agent]) {
        agentResults[result.agent] = [];
      }
      agentResults[result.agent].push(result.model);
    });
    
    Object.entries(agentResults).forEach(([agent, testedModels]) => {
      console.log(`   ${agent}: ${testedModels.length} models (${testedModels.join(', ')})`);
    });
    
    // Save results to file
    const resultsFile = 'baseline_test_results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to ${resultsFile}`);
    
    console.log('\n🎉 Baseline testing complete! Real test data generated for all agents.');
    console.log('📊 You can now view authentic model responses in the baseline interface.');
  } else {
    console.log('\n⚠️ No successful tests completed. Check API keys and agent configurations.');
  }
}

// Run the baseline tests
runAllBaselines().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});