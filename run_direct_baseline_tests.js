#!/usr/bin/env node
/**
 * Run baseline tests directly using individual question testing endpoints
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

// Test agents that we know have baseline questions
const testAgents = [
  { name: 'sourcing', questions: 16 },
  { name: 'patent', questions: 16 },
  { name: 'spectra', questions: 16 },
  { name: 'customer-success', questions: 16 },
  { name: 'metabolomics', questions: 16 },
  { name: 'lms', questions: 18 },
  { name: 'compliance', questions: 52 }
];

const models = ['gpt-4o-mini', 'gpt-4o']; // Start with OpenAI models

async function testSingleQuestion(agent, questionId, model) {
  try {
    const response = await fetch(`${BASE_URL}/api/agents/${agent}/baseline-questions/${questionId}/test/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        agent,
        questionId,
        model,
        result
      };
    } else {
      return {
        success: false,
        agent,
        questionId,
        model,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      agent,
      questionId,
      model,
      error: error.message
    };
  }
}

async function runDirectBaselineTests() {
  console.log('🚀 Running Direct Baseline Tests');
  console.log('=================================');
  console.log(`Testing ${testAgents.length} agents with ${models.length} models`);
  
  const allResults = [];
  let totalTests = 0;
  let successCount = 0;
  
  for (const agentInfo of testAgents) {
    console.log(`\n📊 Testing ${agentInfo.name} agent (${agentInfo.questions} questions):`);
    
    // Get actual questions for this agent
    try {
      const questionsResponse = await fetch(`${BASE_URL}/api/agents/${agentInfo.name}/baseline-questions`);
      if (!questionsResponse.ok) {
        console.log(`   ❌ Failed to load questions: ${questionsResponse.status}`);
        continue;
      }
      
      const questions = await questionsResponse.json();
      console.log(`   ✅ Loaded ${questions.length} questions`);
      
      if (questions.length === 0) {
        console.log(`   ⚠️ No questions found, skipping`);
        continue;
      }
      
      // Test first few questions with each model to generate sample data
      const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
      
      for (const model of models) {
        console.log(`   🤖 Testing with ${model}...`);
        
        for (const question of sampleQuestions) {
          totalTests++;
          const result = await testSingleQuestion(agentInfo.name, question.id, model);
          
          if (result.success) {
            successCount++;
            console.log(`      ✅ Q${question.id}: Success`);
            allResults.push(result);
          } else {
            console.log(`      ❌ Q${question.id}: ${result.error}`);
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.log(`   ❌ Error testing ${agentInfo.name}: ${error.message}`);
    }
  }
  
  console.log('\n📋 FINAL RESULTS:');
  console.log('=================');
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`📊 Agents tested: ${testAgents.length}`);
  console.log(`🤖 Models: ${models.join(', ')}`);
  
  if (allResults.length > 0) {
    // Group results by agent
    const agentResults = {};
    allResults.forEach(result => {
      if (!agentResults[result.agent]) {
        agentResults[result.agent] = [];
      }
      agentResults[result.agent].push(result);
    });
    
    console.log('\n🎯 Results by Agent:');
    Object.entries(agentResults).forEach(([agent, results]) => {
      const modelCounts = {};
      results.forEach(r => {
        modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
      });
      console.log(`   ${agent}: ${results.length} tests (${Object.entries(modelCounts).map(([m, c]) => `${m}: ${c}`).join(', ')})`);
    });
    
    // Save results
    const resultsFile = 'direct_baseline_results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Results saved to ${resultsFile}`);
    
    console.log('\n🎉 Direct baseline testing complete!');
    console.log('📊 Real model response data generated for multiple agents.');
    console.log('🔍 Check agent baseline pages to see authentic test results.');
  } else {
    console.log('\n⚠️ No successful tests. Check API keys and endpoint availability.');
  }
}

runDirectBaselineTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});