#!/usr/bin/env node

/**
 * Comprehensive Curl Validation Suite for Formul8 Platform
 * Tests actual HTTP endpoints with real curl requests to identify 404 issues
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class CurlValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      summary: { total: 0, passed: 0, failed: 0, errors: [] },
      agentDashboards: [],
      agentBaselines: [],
      agentAPIs: [],
      generalPages: [],
      apiEndpoints: []
    };
    
    // All agent types from the agents directory
    this.agentTypes = [
      'compliance',
      'formulation', 
      'marketing',
      'operations',
      'science',
      'sourcing',
      'patent',
      'spectra',
      'customer-success',
      'lms',
      'metabolomics'
    ];
  }

  // Execute curl command and return response details
  async executeCurl(url, options = {}) {
    return new Promise((resolve) => {
      const curlArgs = [
        '-s', // Silent mode
        '-w', '%{http_code}|%{time_total}|%{size_download}', // Write out format
        ...(options.checkContent ? [] : ['-o', '/dev/null']), // Keep body if checking content
        '--max-time', '10', // 10 second timeout
        ...options.args || [],
        url
      ];

      const curl = spawn('curl', curlArgs);
      let output = '';
      let error = '';

      curl.stdout.on('data', (data) => {
        output += data.toString();
      });

      curl.stderr.on('data', (data) => {
        error += data.toString();
      });

      curl.on('close', (code) => {
        if (code === 0) {
          let httpCode, timeTotal, sizeDownload, content = '';
          
          if (options.checkContent) {
            // Extract metrics from end of output when content is included
            const lines = output.split('\n');
            const metricsLine = lines[lines.length - 1];
            if (metricsLine.includes('|')) {
              [httpCode, timeTotal, sizeDownload] = metricsLine.split('|');
              content = lines.slice(0, -1).join('\n');
            } else {
              // Fallback if metrics format is different
              httpCode = '200';
              timeTotal = '0';
              sizeDownload = output.length.toString();
              content = output;
            }
          } else {
            if (output.includes('|')) {
              [httpCode, timeTotal, sizeDownload] = output.trim().split('|');
            } else {
              httpCode = '0';
              timeTotal = '0';
              sizeDownload = '0';
            }
          }
          
          resolve({
            success: true,
            httpCode: parseInt(httpCode),
            timeTotal: parseFloat(timeTotal),
            sizeDownload: parseInt(sizeDownload),
            content: content,
            error: null
          });
        } else {
          resolve({
            success: false,
            httpCode: 0,
            timeTotal: 0,
            sizeDownload: 0,
            content: '',
            error: error.trim() || `Exit code: ${code}`
          });
        }
      });
    });
  }

  // Test a single endpoint with curl
  async testEndpoint(name, path, expectedStatus = 200) {
    const url = `${this.baseUrl}${path}`;
    console.log(`Testing: ${name} -> ${path}`);
    
    this.results.summary.total++;
    
    try {
      const result = await this.executeCurl(url);
      
      const testResult = {
        name,
        path,
        url,
        expectedStatus,
        actualStatus: result.httpCode,
        responseTime: result.timeTotal,
        sizeBytes: result.sizeDownload,
        success: result.success && (result.httpCode === expectedStatus),
        error: result.error
      };

      if (testResult.success) {
        this.results.summary.passed++;
        console.log(`✅ ${name}: HTTP ${result.httpCode} (${result.timeTotal}s, ${result.sizeDownload} bytes)`);
      } else {
        this.results.summary.failed++;
        const reason = result.error || `Expected ${expectedStatus}, got ${result.httpCode}`;
        console.log(`❌ ${name}: ${reason}`);
        this.results.summary.errors.push(`${name}: ${reason}`);
      }

      return testResult;
      
    } catch (error) {
      this.results.summary.failed++;
      const errorMsg = `Curl failed: ${error.message}`;
      console.log(`❌ ${name}: ${errorMsg}`);
      this.results.summary.errors.push(`${name}: ${errorMsg}`);
      
      return {
        name,
        path,
        url,
        expectedStatus,
        actualStatus: 0,
        responseTime: 0,
        sizeBytes: 0,
        success: false,
        error: errorMsg
      };
    }
  }

  // Test agent dashboard pages with content validation
  async testAgentDashboards() {
    console.log('\n🎯 Testing Agent Dashboard Pages...');
    
    for (const agent of this.agentTypes) {
      const result = await this.testEndpointWithContent(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Dashboard`,
        `/agent/${agent}`
      );
      this.results.agentDashboards.push(result);
    }
  }

  // Test endpoint with content validation for error messages
  async testEndpointWithContent(name, path, expectedStatus = 200) {
    const url = `${this.baseUrl}${path}`;
    console.log(`Testing: ${name} -> ${path}`);
    
    this.results.summary.total++;
    
    try {
      const result = await this.executeCurl(url, { checkContent: true });
      
      // Check for error messages in content
      const hasErrorContent = result.content && (
        result.content.includes('Agent Not Found') ||
        result.content.includes('Error:') ||
        result.content.includes('404') ||
        result.content.includes('Internal Server Error')
      );
      
      const testResult = {
        name,
        path,
        url,
        expectedStatus,
        actualStatus: result.httpCode,
        responseTime: result.timeTotal,
        sizeBytes: result.sizeDownload,
        success: result.success && (result.httpCode === expectedStatus) && !hasErrorContent,
        error: result.error || (hasErrorContent ? 'Error content detected in response' : null),
        contentError: hasErrorContent
      };

      if (testResult.success) {
        this.results.summary.passed++;
        console.log(`✅ ${name}: HTTP ${result.httpCode} (${result.timeTotal}s, ${result.sizeDownload} bytes)`);
      } else {
        this.results.summary.failed++;
        const reason = result.error || 
          (hasErrorContent ? 'Error content detected' : `Expected ${expectedStatus}, got ${result.httpCode}`);
        console.log(`❌ ${name}: ${reason}`);
        this.results.summary.errors.push(`${name}: ${reason}`);
      }

      return testResult;
      
    } catch (error) {
      this.results.summary.failed++;
      const errorMsg = `Curl failed: ${error.message}`;
      console.log(`❌ ${name}: ${errorMsg}`);
      this.results.summary.errors.push(`${name}: ${errorMsg}`);
      
      return {
        name,
        path,
        url,
        expectedStatus,
        actualStatus: 0,
        responseTime: 0,
        sizeBytes: 0,
        success: false,
        error: errorMsg,
        contentError: false
      };
    }
  }

  // Test agent baseline viewer pages
  async testAgentBaselines() {
    console.log('\n📊 Testing Agent Baseline Viewers...');
    
    for (const agent of this.agentTypes) {
      const result = await this.testEndpoint(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline`,
        `/agent/${agent}/baseline`
      );
      this.results.agentBaselines.push(result);
    }
  }

  // Test agent API endpoints
  async testAgentAPIs() {
    console.log('\n🔌 Testing Agent API Endpoints...');
    
    // Dashboard APIs
    for (const agent of this.agentTypes) {
      const result = await this.testEndpoint(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Dashboard API`,
        `/api/agents/${agent}/dashboard`
      );
      this.results.agentAPIs.push(result);
    }

    // Config APIs
    for (const agent of this.agentTypes) {
      const result = await this.testEndpoint(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Config API`,
        `/api/agents/${agent}/config`
      );
      this.results.agentAPIs.push(result);
    }

    // Baseline Questions APIs
    for (const agent of this.agentTypes) {
      const result = await this.testEndpoint(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline API`,
        `/api/agents/${agent}/baseline-results`
      );
      this.results.agentAPIs.push(result);
    }
  }

  // Test general pages
  async testGeneralPages() {
    console.log('\n🌐 Testing General Pages...');
    
    const pages = [
      { name: 'Home Page', path: '/' },
      { name: 'Agents Overview', path: '/agents' },
      { name: 'Data Management', path: '/data' },
      { name: 'Roadmap', path: '/roadmap' },
      { name: 'Baseline Testing', path: '/baseline-testing' },
      { name: 'Use Cases', path: '/use' },
      { name: 'Federated Network', path: '/federated' },
      { name: 'Compute Page', path: '/compute' },
      { name: 'Validation Page', path: '/validation' }
    ];

    for (const page of pages) {
      const result = await this.testEndpoint(page.name, page.path);
      this.results.generalPages.push(result);
    }
  }

  // Test API endpoints
  async testAPIEndpoints() {
    console.log('\n🔗 Testing Core API Endpoints...');
    
    const apis = [
      { name: 'Agent List', path: '/api/agents' },
      { name: 'Agent Status', path: '/api/agent-status' },
      { name: 'Agent Management Dashboard', path: '/api/agent-management/dashboard' },
      { name: 'Baseline Badges', path: '/api/baseline-exam/badges' },
      { name: 'Run All Tests Progress', path: '/api/run-all-tests/progress' },
      { name: 'Data Corpora', path: '/api/data/corpora' },
      { name: 'Knowledge Bases', path: '/api/data/knowledge-bases' },
      { name: 'Roadmap Features', path: '/api/roadmap/features' },
      { name: 'Health Check', path: '/api/health' }
    ];

    for (const api of apis) {
      const result = await this.testEndpoint(api.name, api.path);
      this.results.apiEndpoints.push(result);
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CURL VALIDATION REPORT');
    console.log('='.repeat(80));

    const { summary } = this.results;
    const successRate = Math.round((summary.passed / summary.total) * 100);

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   📊 Success Rate: ${successRate}%\n`);

    // Category breakdown
    console.log('📂 Category Breakdown:');
    console.log(`   🎯 Agent Dashboards: ${this.results.agentDashboards.filter(r => r.success).length}/${this.results.agentDashboards.length}`);
    console.log(`   📊 Agent Baselines: ${this.results.agentBaselines.filter(r => r.success).length}/${this.results.agentBaselines.length}`);
    console.log(`   🔌 Agent APIs: ${this.results.agentAPIs.filter(r => r.success).length}/${this.results.agentAPIs.length}`);
    console.log(`   🌐 General Pages: ${this.results.generalPages.filter(r => r.success).length}/${this.results.generalPages.length}`);
    console.log(`   🔗 Core APIs: ${this.results.apiEndpoints.filter(r => r.success).length}/${this.results.apiEndpoints.length}`);

    // Failed tests breakdown
    if (summary.failed > 0) {
      console.log('\n❌ FAILED TESTS BY CATEGORY:');
      console.log('-'.repeat(50));

      const printFailures = (results, category) => {
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          console.log(`\n${category}:`);
          failures.forEach(f => {
            console.log(`   ❌ ${f.name}: HTTP ${f.actualStatus} (expected ${f.expectedStatus})`);
            if (f.error) console.log(`      Error: ${f.error}`);
          });
        }
      };

      printFailures(this.results.agentDashboards, '🎯 Agent Dashboards');
      printFailures(this.results.agentBaselines, '📊 Agent Baselines');
      printFailures(this.results.agentAPIs, '🔌 Agent APIs');
      printFailures(this.results.generalPages, '🌐 General Pages');
      printFailures(this.results.apiEndpoints, '🔗 Core APIs');
    }

    // Performance analysis
    const allResults = [
      ...this.results.agentDashboards,
      ...this.results.agentBaselines,
      ...this.results.agentAPIs,
      ...this.results.generalPages,
      ...this.results.apiEndpoints
    ].filter(r => r.success);

    if (allResults.length > 0) {
      const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length;
      const slowTests = allResults.filter(r => r.responseTime > 1.0);
      
      console.log('\n⚡ Performance Analysis:');
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(3)}s`);
      console.log(`   Slow Tests (>1s): ${slowTests.length}`);
      
      if (slowTests.length > 0) {
        console.log('   Slowest endpoints:');
        slowTests
          .sort((a, b) => b.responseTime - a.responseTime)
          .slice(0, 5)
          .forEach(test => {
            console.log(`     • ${test.name}: ${test.responseTime.toFixed(3)}s`);
          });
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    const failures404 = summary.errors.filter(e => e.includes('404')).length;
    const failures500 = summary.errors.filter(e => e.includes('500')).length;
    const failuresTimeout = summary.errors.filter(e => e.includes('timeout')).length;

    if (failures404 > 0) {
      console.log(`   🔍 ${failures404} endpoints return 404 - routes may be missing or misconfigured`);
    }
    if (failures500 > 0) {
      console.log(`   🚨 ${failures500} endpoints return 500 - server errors need investigation`);
    }
    if (failuresTimeout > 0) {
      console.log(`   ⏱️  ${failuresTimeout} endpoints timeout - performance optimization needed`);
    }

    if (successRate >= 90) {
      console.log('\n🎉 Excellent! Platform endpoints are working well.');
    } else if (successRate >= 75) {
      console.log('\n⚠️  Good, but some endpoints need attention.');
    } else {
      console.log('\n🚨 Platform has significant endpoint issues requiring immediate attention.');
    }

    // Save detailed results
    const reportFile = path.join(process.cwd(), 'curl-validation-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }

  // Run complete validation suite
  async runValidation() {
    console.log('🚀 Starting Curl Validation Suite');
    console.log('='.repeat(80));
    console.log(`Testing base URL: ${this.baseUrl}\n`);

    await this.testGeneralPages();
    await this.testAgentDashboards();
    await this.testAgentBaselines();
    await this.testAgentAPIs();
    await this.testAPIEndpoints();

    this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CurlValidator();
  validator.runValidation().catch(console.error);
}

export default CurlValidator;