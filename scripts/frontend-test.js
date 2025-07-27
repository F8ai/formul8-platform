#!/usr/bin/env node

// Test if frontend is working by checking specific content in rendered pages
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

async function testFrontend() {
  console.log('🔍 Frontend Functionality Test');
  console.log('='.repeat(50));
  
  try {
    // Test customer-success agent page
    const response = await fetch(`${baseUrl}/agent/customer-success`);
    const content = await response.text();
    
    console.log(`Page Status: ${response.status}`);
    console.log(`Content Size: ${content.length} bytes`);
    
    // Check for success indicators
    const successPatterns = [
      'Customer Success Agent',
      'Cannabis customer success',
      'Dashboard',
      'Overview',
      'Baseline',
      'Configuration'
    ];
    
    const foundSuccess = successPatterns.filter(pattern => content.includes(pattern));
    console.log(`✅ Success Patterns Found: ${foundSuccess.join(', ')}`);
    
    // Check for error indicators
    const errorPatterns = [
      'Agent Not Found',
      'Failed to fetch',
      'Error:',
      'undefined',
      'ReferenceError'
    ];
    
    const foundErrors = errorPatterns.filter(pattern => content.includes(pattern));
    console.log(`❌ Error Patterns Found: ${foundErrors.length > 0 ? foundErrors.join(', ') : 'None'}`);
    
    // Check if React is loading properly
    const hasReactDiv = content.includes('<div id="root">');
    const hasScript = content.includes('src="/src/main.tsx');
    
    console.log(`React Container: ${hasReactDiv ? '✅' : '❌'}`);
    console.log(`Main Script: ${hasScript ? '✅' : '❌'}`);
    
    // Final assessment
    if (foundSuccess.length >= 3 && foundErrors.length === 0) {
      console.log('\n🎉 FRONTEND IS WORKING!');
      return true;
    } else if (foundSuccess.length > 0) {
      console.log('\n⚠️ Frontend partially working');
      return false;
    } else {
      console.log('\n❌ Frontend not working');
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

testFrontend();