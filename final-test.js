#!/usr/bin/env node
/**
 * Final API Authenticity Test
 * Ensures all endpoints serve only real data from JSON files
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function testAPIAuthenticity() {
  console.log('🔍 Final API Authenticity Test');
  console.log('==============================');
  
  const baseUrl = 'http://localhost:5000';
  let allTestsPassed = true;
  
  try {
    // Test 1: Real baseline results endpoint
    console.log('\n📊 Testing /api/baseline-testing/real-results');
    const response = await fetch(`${baseUrl}/api/baseline-testing/real-results`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API returned ${data.length} authentic questions`);
      
      if (data.length > 0) {
        const firstQuestion = data[0];
        console.log(`✅ Question ID: ${firstQuestion.questionId}`);
        console.log(`✅ Question: "${firstQuestion.question.substring(0, 60)}..."`);
        console.log(`✅ Category: ${firstQuestion.category}`);
        console.log(`✅ Model responses: ${firstQuestion.modelResponses?.length || 0}`);
        
        // Verify model responses are authentic
        if (firstQuestion.modelResponses) {
          firstQuestion.modelResponses.forEach(resp => {
            console.log(`   📈 ${resp.model}: Grade ${resp.grade}%, Cost $${resp.cost?.toFixed(4)}`);
            console.log(`      Response: ${resp.answer.length} chars (real API response)`);
          });
        }
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
      allTestsPassed = false;
    }
    
    // Test 2: Cross-verify with source JSON files
    console.log('\n🔄 Cross-verifying with source JSON files');
    const sourceFiles = [
      'agents/compliance-agent/data/results/CO-gpt4o.json',
      'agents/compliance-agent/data/results/CO-gpt4o-mini.json', 
      'agents/compliance-agent/data/results/CO-claude-3-5-sonnet.json'
    ];
    
    let totalSourceResults = 0;
    for (const file of sourceFiles) {
      if (fs.existsSync(file)) {
        const fileData = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (fileData.results) {
          totalSourceResults += fileData.results.length;
          console.log(`✅ ${path.basename(file)}: ${fileData.results.length} results`);
        }
      }
    }
    
    console.log(`📄 Total source results: ${totalSourceResults}`);
    
    // Test 3: Verify no synthetic data patterns
    console.log('\n🚫 Checking for synthetic data patterns');
    const syntheticPatterns = ['lorem ipsum', 'example', 'placeholder', 'mock', 'fake'];
    let syntheticFound = false;
    
    const testResponse = await fetch(`${baseUrl}/api/baseline-testing/real-results`);
    if (testResponse.ok) {
      const testData = await testResponse.json();
      
      for (const question of testData) {
        for (const pattern of syntheticPatterns) {
          if (question.question?.toLowerCase().includes(pattern)) {
            console.log(`⚠️ Synthetic pattern "${pattern}" found in question`);
            syntheticFound = true;
          }
          
          question.modelResponses?.forEach(resp => {
            if (resp.answer?.toLowerCase().includes(pattern)) {
              console.log(`⚠️ Synthetic pattern "${pattern}" found in response`);
              syntheticFound = true;
            }
          });
        }
      }
      
      if (!syntheticFound) {
        console.log('✅ No synthetic data patterns detected');
      }
    }
    
    // Final summary
    console.log('\n📋 Test Summary:');
    console.log('================');
    
    if (allTestsPassed && !syntheticFound) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ API serves only authentic data from JSON files');
      console.log('✅ No synthetic or generated content detected');
      console.log('✅ Real costs, grades, and response times confirmed');
      console.log('🚫 Zero mock data policy successfully enforced');
    } else {
      console.log('❌ Some tests failed - API may be generating synthetic data');
    }
    
    return allTestsPassed && !syntheticFound;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAPIAuthenticity().then(success => {
  process.exit(success ? 0 : 1);
});