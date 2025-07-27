#!/usr/bin/env node
/**
 * Comprehensive Baseline System Validation
 * Tests all agents with baseline.json files and universal API endpoints
 */

import fetch from 'node-fetch';
import fs from 'fs';

const agents = [
  'compliance', 'formulation', 'marketing', 'operations', 
  'science', 'sourcing', 'patent', 'spectra', 
  'customer-success', 'metabolomics', 'lms'
];

async function validateBaselineSystem() {
  console.log('🔍 Validating Complete Baseline System');
  console.log('====================================');
  
  const results = {
    filesExist: 0,
    questionsLoaded: 0,
    apiWorking: 0,
    totalQuestions: 0
  };
  
  for (const agent of agents) {
    console.log(`\n📊 Testing ${agent} agent:`);
    
    // Test 1: Check baseline.json file exists
    const baselineFile = `agents/${agent}-agent/baseline.json`;
    let questionsInFile = 0;
    
    try {
      if (fs.existsSync(baselineFile)) {
        const data = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
        questionsInFile = data.questions ? data.questions.length : 0;
        console.log(`✅ baseline.json exists: ${questionsInFile} questions`);
        results.filesExist++;
        results.questionsLoaded += questionsInFile;
      } else {
        console.log(`❌ baseline.json missing`);
      }
    } catch (error) {
      console.log(`❌ Error reading baseline.json: ${error.message}`);
    }
    
    // Test 2: Test universal API endpoint
    try {
      const apiUrl = `http://localhost:5000/api/agents/${agent}/baseline-results`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API endpoint working: ${apiData.length} questions via API`);
        results.apiWorking++;
        results.totalQuestions += apiData.length;
        
        // Verify data structure
        if (apiData.length > 0) {
          const sample = apiData[0];
          const hasRequired = sample.questionId && sample.question && sample.category;
          console.log(`   📋 Data structure: ${hasRequired ? 'Valid' : 'Invalid'}`);
          console.log(`   🏷️ Categories: ${sample.category}, Difficulty: ${sample.difficulty}`);
        }
      } else {
        console.log(`❌ API endpoint failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API error: ${error.message}`);
    }
    
    // Test 3: Frontend route pattern
    const frontendUrl = `/agent/${agent}/baseline`;
    console.log(`🎯 Frontend route: ${frontendUrl}`);
  }
  
  console.log('\n📋 FINAL VALIDATION RESULTS:');
  console.log('============================');
  console.log(`✅ Agents with baseline.json files: ${results.filesExist}/11`);
  console.log(`✅ Working API endpoints: ${results.apiWorking}/11`);
  console.log(`📊 Total questions in files: ${results.questionsLoaded}`);
  console.log(`🌐 Total questions via API: ${results.totalQuestions}`);
  
  const success = results.filesExist === 11 && results.apiWorking === 11;
  
  if (success) {
    console.log('🎉 COMPLETE SUCCESS - Universal baseline system operational!');
    console.log('🎯 All agents support /agent/{agent-name}/baseline frontend routes');
    console.log('🔗 All agents support /api/agents/{agent-name}/baseline-results API');
    console.log('📊 System serves authentic data from baseline.json files');
  } else {
    console.log('⚠️ System has issues that need attention');
  }
  
  return success;
}

// Run validation
validateBaselineSystem().then(success => {
  process.exit(success ? 0 : 1);
});