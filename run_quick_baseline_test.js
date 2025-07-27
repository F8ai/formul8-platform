#!/usr/bin/env node
/**
 * Quick baseline test with a single agent to verify the system
 */

import fetch from 'node-fetch';

async function runQuickTest() {
  console.log('🧪 Quick Baseline Test');
  console.log('======================');
  
  const agent = 'sourcing';
  const model = 'gpt-4o-mini';
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Get baseline questions
    console.log(`1. Loading ${agent} baseline questions...`);
    const questionsResponse = await fetch(`${baseUrl}/api/agents/${agent}/baseline-questions`);
    
    if (!questionsResponse.ok) {
      throw new Error(`Failed to get questions: ${questionsResponse.status}`);
    }
    
    const questions = await questionsResponse.json();
    console.log(`✅ Loaded ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.log('❌ No questions found. Cannot run test.');
      return;
    }
    
    // Show sample question
    const sample = questions[0];
    console.log(`   Sample: ${sample.id} - ${sample.question.substring(0, 60)}...`);
    
    // Start baseline test with just first 3 questions for quick test
    const testQuestions = questions.slice(0, 3);
    console.log(`\n2. Starting baseline test with ${testQuestions.length} questions...`);
    
    const testResponse = await fetch(`${baseUrl}/api/baseline-testing/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentType: agent,
        model: model,
        state: 'CO',
        questions: testQuestions
      }),
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`Failed to start test: ${testResponse.status} - ${errorText}`);
    }
    
    const testData = await testResponse.json();
    console.log(`✅ Test started: Run ID ${testData.runId}`);
    
    // Monitor progress
    console.log(`\n3. Monitoring test progress...`);
    const runId = testData.runId;
    let attempts = 0;
    const maxAttempts = 20; // 2 minutes max for quick test
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
      
      const progressResponse = await fetch(`${baseUrl}/api/baseline-testing/runs/${runId}/progress`);
      if (!progressResponse.ok) {
        throw new Error(`Failed to get progress: ${progressResponse.status}`);
      }
      
      const progress = await progressResponse.json();
      console.log(`   Progress: ${progress.completedQuestions}/${progress.totalQuestions} questions (${progress.status})`);
      
      if (progress.metrics) {
        console.log(`   Metrics: Accuracy ${progress.metrics.avgAccuracy?.toFixed(1)}%, Cost $${progress.metrics.totalCost?.toFixed(4)}`);
      }
      
      if (progress.status === 'completed') {
        console.log(`\n✅ Test completed successfully!`);
        
        // Get final results
        const resultsResponse = await fetch(`${baseUrl}/api/baseline-testing/runs/${runId}/results`);
        if (resultsResponse.ok) {
          const results = await resultsResponse.json();
          console.log(`📊 Final Results:`);
          console.log(`   Total questions: ${results.length}`);
          console.log(`   Average grade: ${results.reduce((sum, r) => sum + r.grade, 0) / results.length}%`);
          console.log(`   Total cost: $${results.reduce((sum, r) => sum + (r.cost || 0), 0).toFixed(4)}`);
        }
        
        return true;
      } else if (progress.status === 'failed') {
        throw new Error('Test run failed');
      }
      
      attempts++;
    }
    
    console.log('⚠️ Test timed out, but may still be running in background');
    return false;
    
  } catch (error) {
    console.error(`❌ Quick test failed: ${error.message}`);
    return false;
  }
}

runQuickTest().then(success => {
  if (success) {
    console.log('\n🎉 Quick test successful! Ready to run full baseline tests.');
  } else {
    console.log('\n⚠️ Quick test had issues. Check configuration before running full tests.');
  }
});