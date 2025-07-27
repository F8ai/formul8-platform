#!/usr/bin/env node

// Final validation focusing on key agent dashboard functionality
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

async function finalValidation() {
  console.log('🎯 Final Frontend Validation');
  console.log('='.repeat(50));
  
  const testAgents = ['customer-success', 'compliance', 'formulation', 'marketing'];
  let passedTests = 0;
  let totalTests = 0;
  
  for (const agentType of testAgents) {
    console.log(`\n🔍 Testing ${agentType} agent...`);
    
    try {
      // Test API endpoint
      totalTests++;
      const apiResponse = await fetch(`${baseUrl}/api/agents/${agentType}/dashboard`);
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`✅ API: ${agentType} dashboard (${apiData.name})`);
        passedTests++;
      } else {
        console.log(`❌ API: ${agentType} dashboard (${apiResponse.status})`);
      }
      
      // Test baseline results API
      totalTests++;
      const baselineResponse = await fetch(`${baseUrl}/api/agents/${agentType}/baseline-results`);
      if (baselineResponse.ok) {
        const baselineData = await baselineResponse.json();
        console.log(`✅ Baseline: ${agentType} (${baselineData.length} questions)`);
        passedTests++;
      } else {
        console.log(`❌ Baseline: ${agentType} (${baselineResponse.status})`);
      }
      
      // Test frontend page
      totalTests++;
      const pageResponse = await fetch(`${baseUrl}/agent/${agentType}`);
      if (pageResponse.ok) {
        const pageContent = await pageResponse.text();
        const hasErrors = pageContent.includes('Failed to fetch') || pageContent.includes('Agent Not Found');
        if (!hasErrors) {
          console.log(`✅ Frontend: ${agentType} page loading correctly`);
          passedTests++;
        } else {
          console.log(`❌ Frontend: ${agentType} has errors`);
        }
      } else {
        console.log(`❌ Frontend: ${agentType} (${pageResponse.status})`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${agentType}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Final Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Frontend is fully functional!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('✅ Most tests passed - Frontend is mostly functional');
  } else {
    console.log('⚠️ Some issues remain');
  }
  
  return passedTests === totalTests;
}

finalValidation();