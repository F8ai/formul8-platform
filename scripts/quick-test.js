#!/usr/bin/env node

// Quick test to verify the current status
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

async function quickTest() {
  console.log('🚀 Quick Status Check');
  console.log('='.repeat(50));
  
  try {
    // Test API endpoint
    console.log('Testing API: /api/agents/customer-success/dashboard');
    const apiResponse = await fetch(`${baseUrl}/api/agents/customer-success/dashboard`);
    console.log(`API Status: ${apiResponse.status} ${apiResponse.statusText}`);
    const apiData = await apiResponse.json();
    console.log(`API Data: ${JSON.stringify(apiData, null, 2).substring(0, 200)}...`);
    
    // Test HTML page
    console.log('\nTesting Page: /agent/customer-success');
    const pageResponse = await fetch(`${baseUrl}/agent/customer-success`);
    console.log(`Page Status: ${pageResponse.status} ${pageResponse.statusText}`);
    const pageData = await pageResponse.text();
    console.log(`Page Size: ${pageData.length} bytes`);
    
    // Check for error patterns
    const errorPatterns = ['Agent Not Found', 'Error:', 'Failed to fetch', 'undefined'];
    const foundErrors = errorPatterns.filter(pattern => pageData.includes(pattern));
    console.log(`Error Patterns Found: ${foundErrors.length > 0 ? foundErrors.join(', ') : 'None'}`);
    
    // Check for success patterns
    const successPatterns = ['Customer Success', 'Dashboard', 'root'];
    const foundSuccess = successPatterns.filter(pattern => pageData.includes(pattern));
    console.log(`Success Patterns Found: ${foundSuccess.join(', ')}`);
    
    console.log('\n✅ Quick test completed');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

quickTest();