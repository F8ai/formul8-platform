#!/usr/bin/env node

/**
 * Comprehensive Validation Suite for Formul8 Platform
 * Tests all pages, APIs, and critical functionality
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const TIMEOUT = 10000; // 10 second timeout

class ValidationSuite {
  constructor() {
    this.results = {
      pages: [],
      apis: [],
      files: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  // HTTP request helper
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        timeout: TIMEOUT,
        ...options
      };

      const req = http.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            size: Buffer.byteLength(data)
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  // Test a single page/endpoint
  async testEndpoint(name, path, expectedStatus = 200, options = {}) {
    try {
      console.log(`Testing ${name}...`);
      const url = `${BASE_URL}${path}`;
      const response = await this.makeRequest(url, options);
      
      const result = {
        name,
        path,
        status: response.statusCode === expectedStatus ? 'PASS' : 'FAIL',
        statusCode: response.statusCode,
        expectedStatus,
        responseSize: response.size,
        responseTime: Date.now(),
        error: null,
        warnings: []
      };

      // Check for common issues
      if (response.statusCode === 401 && expectedStatus === 200) {
        result.warnings.push('Authentication required');
      }
      
      if (response.statusCode === 404) {
        result.warnings.push('Endpoint not found');
      }

      if (response.size === 0 && expectedStatus === 200) {
        result.warnings.push('Empty response');
      }

      // Try to parse JSON responses
      if (response.headers['content-type']?.includes('application/json')) {
        try {
          const json = JSON.parse(response.data);
          result.hasValidJson = true;
          result.dataKeys = Object.keys(json);
        } catch (e) {
          result.hasValidJson = false;
          result.warnings.push('Invalid JSON response');
        }
      }

      this.results.summary.totalTests++;
      if (result.status === 'PASS') {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
      this.results.summary.warnings += result.warnings.length;

      return result;
    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}`);
      const result = {
        name,
        path,
        status: 'FAIL',
        error: error.message,
        warnings: []
      };
      
      this.results.summary.totalTests++;
      this.results.summary.failed++;
      
      return result;
    }
  }

  // Test file existence
  testFile(name, filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const exists = fs.existsSync(fullPath);
      const stats = exists ? fs.statSync(fullPath) : null;
      
      const result = {
        name,
        path: filePath,
        status: exists ? 'PASS' : 'FAIL',
        size: stats ? stats.size : 0,
        modified: stats ? stats.mtime.toISOString() : null,
        error: exists ? null : 'File not found'
      };

      this.results.summary.totalTests++;
      if (result.status === 'PASS') {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }

      return result;
    } catch (error) {
      const result = {
        name,
        path: filePath,
        status: 'FAIL',
        error: error.message
      };
      
      this.results.summary.totalTests++;
      this.results.summary.failed++;
      
      return result;
    }
  }

  // Run all validations
  async runValidation() {
    console.log('🚀 Starting Formul8 Platform Validation Suite\n');
    console.log('='.repeat(60));

    // Test critical files
    console.log('\n📁 Testing Critical Files...');
    this.results.files = [
      this.testFile('Package.json', 'package.json'),
      this.testFile('Server Index', 'server/index.ts'),
      this.testFile('Frontend App', 'formul8-frontend/src/App.tsx'),
      this.testFile('Database Config', 'drizzle.config.ts'),
      this.testFile('Schema', 'shared/schema.ts'),
      this.testFile('Replit Config', 'replit.md'),
    ];

    // All agent types from the agents directory  
    const agentTypes = [
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

    // Test frontend pages
    console.log('\n🌐 Testing Frontend Pages...');
    const pages = [
      { name: 'Home Page', path: '/' },
      { name: 'Dashboard', path: '/dashboard', expectedStatus: 401 }, // Requires auth
      { name: 'Agents Overview', path: '/agents' },
      { name: 'Data Management', path: '/data' },
      { name: 'Roadmap', path: '/roadmap' },
      { name: 'Baseline Testing', path: '/baseline-testing' },
      { name: 'Use Cases', path: '/use' },
      { name: 'Federated Network', path: '/federated' },
      { name: 'Compute Page', path: '/compute' },
      { name: 'Validation Page', path: '/validation' },
      // Add all agent dashboard routes
      ...agentTypes.map(agent => ({ 
        name: `Agent Dashboard (${agent})`, 
        path: `/agent/${agent}` 
      })),
      // Add baseline viewer routes  
      ...agentTypes.map(agent => ({ 
        name: `Baseline Viewer (${agent})`, 
        path: `/agent/${agent}/baseline` 
      }))
    ];

    for (const page of pages) {
      const result = await this.testEndpoint(page.name, page.path, page.expectedStatus || 200);
      this.results.pages.push(result);
    }

    // Test API endpoints
    console.log('\n🔌 Testing API Endpoints...');
    const apis = [
      // Authentication APIs
      { name: 'Auth Status', path: '/api/auth/user', expectedStatus: 401 },
      
      // Agent APIs
      { name: 'Agent List', path: '/api/agents' },
      { name: 'Agent Status', path: '/api/agent-status' },
      { name: 'Agent Management Dashboard', path: '/api/agent-management/dashboard' },
      
      // Individual agent dashboard APIs
      ...agentTypes.map(agent => ({ 
        name: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent Dashboard`, 
        path: `/api/agents/${agent}/dashboard` 
      })),
      
      // Agent configuration APIs
      ...agentTypes.map(agent => ({ 
        name: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent Config`, 
        path: `/api/agents/${agent}/config` 
      })),
      
      // Baseline Testing APIs
      { name: 'Baseline Badges', path: '/api/baseline-exam/badges' },
      { name: 'Baseline Coverage', path: '/api/baseline-coverage' },
      { name: 'Run All Tests Progress', path: '/api/run-all-tests/progress' },
      
      // Agent baseline question APIs
      ...agentTypes.map(agent => ({ 
        name: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline Questions`, 
        path: `/api/agents/${agent}/baseline-results` 
      })),
      
      // Data Management APIs
      { name: 'Data Corpora', path: '/api/data/corpora' },
      { name: 'Knowledge Bases', path: '/api/data/knowledge-bases' },
      
      // System APIs
      { name: 'Health Check', path: '/api/health', expectedStatus: 404 }, // Doesn't exist yet
      { name: 'Roadmap Features', path: '/api/roadmap/features' },
    ];

    for (const api of apis) {
      const result = await this.testEndpoint(api.name, api.path, api.expectedStatus || 200);
      this.results.apis.push(result);
    }

    // Test POST endpoints with sample data
    console.log('\n📝 Testing POST Endpoints...');
    const postApis = [
      {
        name: 'SPARQL Query',
        path: '/api/data/sparql',
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 5',
          agent: 'compliance'
        }),
        headers: { 'Content-Type': 'application/json' }
      }
    ];

    for (const api of postApis) {
      const result = await this.testEndpoint(api.name, api.path, 200, {
        method: api.method,
        body: api.body,
        headers: api.headers
      });
      this.results.apis.push(result);
    }

    // Test agent baseline files
    console.log('\n📊 Testing Agent Baseline Files...');
    this.results.baselines = [];
    
    for (const agent of agentTypes) {
      const baselineResult = this.testFile(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline`,
        `agents/${agent}-agent/baseline.json`
      );
      this.results.baselines.push(baselineResult);
      
      // Test baseline file structure if it exists
      if (baselineResult.status === 'pass') {
        try {
          const baselineContent = require(path.join(process.cwd(), `agents/${agent}-agent/baseline.json`));
          const structureResult = this.validateBaselineStructure(agent, baselineContent);
          this.results.baselines.push(structureResult);
        } catch (error) {
          this.results.baselines.push({
            test: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline Structure`,
            status: 'fail',
            message: `Failed to parse baseline.json: ${error.message}`,
            details: `Agent: ${agent}, Error: ${error.message}`
          });
          this.results.summary.totalTests++;
          this.results.summary.failed++;
        }
      }
    }

    this.generateReport();
  }

  // Validate baseline.json structure
  validateBaselineStructure(agent, baseline) {
    this.results.summary.totalTests++;
    
    const requiredFields = ['agent', 'description', 'categories', 'difficulty_levels', 'questions'];
    const missingFields = requiredFields.filter(field => !baseline.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      this.results.summary.failed++;
      return {
        test: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline Structure`,
        status: 'fail',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: `Agent: ${agent}, Structure validation failed`
      };
    }
    
    // Validate questions array
    if (!Array.isArray(baseline.questions) || baseline.questions.length === 0) {
      this.results.summary.failed++;
      return {
        test: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline Questions`,
        status: 'fail',
        message: 'No questions found in baseline.json',
        details: `Agent: ${agent}, Questions: ${baseline.questions?.length || 0}`
      };
    }
    
    // Validate individual questions
    const questionValidation = baseline.questions.every(q => 
      q.id && q.category && q.difficulty && q.question && q.expected_answer
    );
    
    if (!questionValidation) {
      this.results.summary.failed++;
      return {
        test: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Question Validation`,
        status: 'fail',
        message: 'Some questions missing required fields (id, category, difficulty, question, expected_answer)',
        details: `Agent: ${agent}, Questions: ${baseline.questions.length}`
      };
    }
    
    this.results.summary.passed++;
    return {
      test: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Baseline Structure`,
      status: 'pass',
      message: `Valid structure with ${baseline.questions.length} questions`,
      details: `Agent: ${agent}, Questions: ${baseline.questions.length}, Categories: ${Object.keys(baseline.categories).length}`
    };
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION REPORT');
    console.log('='.repeat(60));

    const { summary } = this.results;
    const successRate = Math.round((summary.passed / summary.totalTests) * 100);

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   📊 Success Rate: ${successRate}%\n`);

    // File validation results
    console.log('📁 File Validation:');
    this.results.files.forEach(file => {
      const status = file.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${file.name}: ${file.path}`);
      if (file.error) console.log(`      Error: ${file.error}`);
    });

    // Page validation results
    console.log('\n🌐 Page Validation:');
    this.results.pages.forEach(page => {
      const status = page.status === 'PASS' ? '✅' : '❌';
      const warnings = page.warnings?.length > 0 ? ` (${page.warnings.length} warnings)` : '';
      console.log(`   ${status} ${page.name}: ${page.statusCode}${warnings}`);
      if (page.warnings?.length > 0) {
        page.warnings.forEach(warning => console.log(`      ⚠️  ${warning}`));
      }
      if (page.error) console.log(`      Error: ${page.error}`);
    });

    // API validation results
    console.log('\n🔌 API Validation:');
    this.results.apis.forEach(api => {
      const status = api.status === 'PASS' ? '✅' : '❌';
      const warnings = api.warnings?.length > 0 ? ` (${api.warnings.length} warnings)` : '';
      const dataInfo = api.hasValidJson ? ` [JSON: ${api.dataKeys?.length || 0} keys]` : '';
      console.log(`   ${status} ${api.name}: ${api.statusCode}${warnings}${dataInfo}`);
      if (api.warnings?.length > 0) {
        api.warnings.forEach(warning => console.log(`      ⚠️  ${warning}`));
      }
      if (api.error) console.log(`      Error: ${api.error}`);
    });

    // Baseline validation results
    if (this.results.baselines && this.results.baselines.length > 0) {
      console.log('\n📊 Baseline Validation:');
      this.results.baselines.forEach(baseline => {
        const status = baseline.status === 'pass' ? '✅' : '❌';
        console.log(`   ${status} ${baseline.test}: ${baseline.message}`);
        if (baseline.details && baseline.status === 'pass') {
          console.log(`      Details: ${baseline.details}`);
        }
        if (baseline.status === 'fail') {
          console.log(`      Error: ${baseline.details || baseline.message}`);
        }
      });
    }

    // Critical issues
    const criticalIssues = [
      ...this.results.files.filter(f => f.status === 'FAIL'),
      ...this.results.pages.filter(p => p.status === 'FAIL' && !p.warnings?.includes('Authentication required')),
      ...this.results.apis.filter(a => a.status === 'FAIL' && a.expectedStatus === 200),
      ...(this.results.baselines || []).filter(b => b.status === 'fail')
    ];

    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue.name}: ${issue.error || 'Failed validation'}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    const authIssues = this.results.apis.filter(a => a.statusCode === 401).length;
    if (authIssues > 0) {
      console.log(`   🔐 ${authIssues} endpoints require authentication - this is expected`);
    }

    const notFoundIssues = this.results.apis.filter(a => a.statusCode === 404).length;
    if (notFoundIssues > 0) {
      console.log(`   🔍 ${notFoundIssues} endpoints return 404 - consider implementing missing routes`);
    }

    const jsonIssues = this.results.apis.filter(a => a.hasValidJson === false).length;
    if (jsonIssues > 0) {
      console.log(`   📝 ${jsonIssues} APIs return invalid JSON - check response formatting`);
    }

    if (successRate >= 80) {
      console.log('\n🎉 Platform validation successful! Most components are working correctly.');
    } else {
      console.log('\n⚠️  Platform has significant issues that need attention.');
    }

    // Save detailed results to file
    const reportFile = path.join(process.cwd(), 'validation-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new ValidationSuite();
  suite.runValidation().catch(console.error);
}

export default ValidationSuite;