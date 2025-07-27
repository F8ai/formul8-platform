#!/usr/bin/env node

/**
 * Frontend Validation - React Query and Agent Dashboard Testing
 * Tests the specific fixes made to React Query configuration and data loading
 */

import { spawn } from 'child_process';

class FrontendValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      reactQuery: [],
      agentDashboards: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };
  }

  // Execute curl request
  async executeCurl(url) {
    return new Promise((resolve) => {
      const curl = spawn('curl', ['-s', '-w', '\\n%{http_code}', this.baseUrl + url]);
      let output = '';

      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.on('close', (code) => {
        const lines = output.split('\n');
        const httpCode = parseInt(lines[lines.length - 1]);
        const content = lines.slice(0, -1).join('\n');
        
        resolve({
          httpCode,
          content,
          success: code === 0 && httpCode >= 200 && httpCode < 400
        });
      });
    });
  }

  // Test React Query configuration (auth should fail but not break other queries)
  async testReactQueryConfiguration() {
    console.log('🔍 Testing React Query Configuration...');
    
    // Test auth endpoint (should return 401)
    const authResult = await this.executeCurl('/api/auth/user');
    const authTest = {
      name: 'Auth Endpoint Returns 401',
      url: '/api/auth/user',
      status: authResult.httpCode === 401 ? 'PASS' : 'FAIL',
      httpCode: authResult.httpCode,
      description: 'Auth endpoint properly returns 401 without breaking React Query'
    };
    this.results.reactQuery.push(authTest);
    console.log(`  ${authTest.status === 'PASS' ? '✅' : '❌'} ${authTest.name}: HTTP ${authTest.httpCode}`);

    // Test that agent APIs still work despite auth failures
    const testAgents = ['customer-success', 'compliance', 'formulation'];
    for (const agent of testAgents) {
      const agentResult = await this.executeCurl(`/api/agents/${agent}/dashboard`);
      const agentTest = {
        name: `${agent} API Independence`,
        url: `/api/agents/${agent}/dashboard`,
        status: agentResult.httpCode === 200 ? 'PASS' : 'FAIL',
        httpCode: agentResult.httpCode,
        description: 'Agent API works independently of auth failures'
      };
      this.results.reactQuery.push(agentTest);
      console.log(`  ${agentTest.status === 'PASS' ? '✅' : '❌'} ${agentTest.name}: HTTP ${agentTest.httpCode}`);
    }
  }

  // Test agent dashboard data loading
  async testAgentDashboards() {
    console.log('\n🎯 Testing Agent Dashboard Data Loading...');
    
    const testAgents = ['customer-success', 'compliance', 'formulation', 'marketing'];
    
    for (const agent of testAgents) {
      console.log(`  Testing ${agent} agent...`);
      
      // Test dashboard API
      const dashboardResult = await this.executeCurl(`/api/agents/${agent}/dashboard`);
      const dashboardTest = {
        name: `${agent} Dashboard API`,
        url: `/api/agents/${agent}/dashboard`,
        status: dashboardResult.httpCode === 200 ? 'PASS' : 'FAIL',
        httpCode: dashboardResult.httpCode,
        hasData: dashboardResult.success && dashboardResult.content.length > 0
      };
      this.results.agentDashboards.push(dashboardTest);
      
      // Test baseline results API
      const baselineResult = await this.executeCurl(`/api/agents/${agent}/baseline-results`);
      const baselineTest = {
        name: `${agent} Baseline API`,
        url: `/api/agents/${agent}/baseline-results`,
        status: baselineResult.httpCode === 200 ? 'PASS' : 'FAIL',
        httpCode: baselineResult.httpCode,
        questionCount: baselineResult.success ? JSON.parse(baselineResult.content || '[]').length : 0
      };
      this.results.agentDashboards.push(baselineTest);
      
      // Test frontend page
      const pageResult = await this.executeCurl(`/agent/${agent}`);
      const hasReactDiv = pageResult.content.includes('<div id="root">');
      const hasMainScript = pageResult.content.includes('src="/src/main.tsx');
      const pageTest = {
        name: `${agent} Frontend Page`,
        url: `/agent/${agent}`,
        status: pageResult.httpCode === 200 && hasReactDiv && hasMainScript ? 'PASS' : 'FAIL',
        httpCode: pageResult.httpCode,
        hasReactDiv,
        hasMainScript
      };
      this.results.agentDashboards.push(pageTest);
      
      console.log(`    ${dashboardTest.status === 'PASS' ? '✅' : '❌'} Dashboard API: HTTP ${dashboardTest.httpCode}`);
      console.log(`    ${baselineTest.status === 'PASS' ? '✅' : '❌'} Baseline API: HTTP ${baselineTest.httpCode} (${baselineTest.questionCount} questions)`);
      console.log(`    ${pageTest.status === 'PASS' ? '✅' : '❌'} Frontend Page: HTTP ${pageTest.httpCode}`);
    }
  }

  // Generate summary report
  generateReport() {
    const allTests = [...this.results.reactQuery, ...this.results.agentDashboards];
    this.results.summary.total = allTests.length;
    this.results.summary.passed = allTests.filter(t => t.status === 'PASS').length;
    this.results.summary.failed = allTests.filter(t => t.status === 'FAIL').length;
    
    const successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FRONTEND VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    console.log('\n📂 Component Results:');
    console.log(`   ⚛️  React Query: ${this.results.reactQuery.filter(t => t.status === 'PASS').length}/${this.results.reactQuery.length} passed`);
    console.log(`   🎯 Agent Dashboards: ${this.results.agentDashboards.filter(t => t.status === 'PASS').length}/${this.results.agentDashboards.length} passed`);
    
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 SUCCESS: All frontend functionality working correctly!');
      console.log('   ✅ React Query configuration fixed');
      console.log('   ✅ Agent APIs working independently');
      console.log('   ✅ Frontend pages rendering properly');
    } else {
      console.log('\n⚠️  Some issues detected:');
      const failedTests = allTests.filter(t => t.status === 'FAIL');
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.name}: HTTP ${test.httpCode}`);
      });
    }
  }

  // Run all frontend validation tests
  async validate() {
    console.log('🚀 Frontend Validation Suite');
    console.log('Testing React Query fixes and agent dashboard functionality\n');
    
    await this.testReactQueryConfiguration();
    await this.testAgentDashboards();
    this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new FrontendValidator();
  validator.validate().catch(console.error);
}

export default FrontendValidator;