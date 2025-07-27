#!/usr/bin/env node

/**
 * Comprehensive Validation Suite - Follows Every Link, Loads Every Page
 * Tests complete application functionality with deep crawling and content validation
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

class ComprehensiveValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.visited = new Set();
    this.results = {
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, errors: [] },
      pages: [],
      apis: [],
      assets: [],
      jsErrors: [],
      performance: []
    };
    
    // All known routes to test
    this.knownRoutes = [
      '/',
      '/agents',
      '/data',
      '/roadmap',
      '/baseline-testing',
      '/use',
      '/federated',
      '/compute',
      '/validation',
      '/design',
      '/science',
      '/development-agent',
      '/agents-dashboard',
      '/baselines',
      '/baseline-assessment',
      '/langgraph',
      '/corpus-qa',
      '/mvp',
      '/artifacts',
      '/profile'
    ];

    // Agent routes
    this.agentTypes = [
      'compliance', 'formulation', 'marketing', 'operations', 'science',
      'sourcing', 'patent', 'spectra', 'customer-success', 'lms', 'metabolomics'
    ];

    // API endpoints to test
    this.apiEndpoints = [
      '/api/agents',
      '/api/agent-status',
      '/api/agent-management/dashboard',
      '/api/baseline-exam/badges',
      '/api/run-all-tests/progress',
      '/api/data/corpora',
      '/api/data/knowledge-bases',
      '/api/roadmap/features',
      '/api/health',
      '/api/baseline-coverage',
      '/api/baseline-summary'
    ];
  }

  // Execute curl with full content capture
  async executeCurl(url, options = {}) {
    return new Promise((resolve) => {
      const curlArgs = [
        '-s', // Silent mode
        '-L', // Follow redirects
        '-w', '\\n%{http_code}|%{time_total}|%{size_download}|%{url_effective}',
        '--max-time', '10', // 10 second timeout
        '--connect-timeout', '3',
        '--retry', '1',
        '--fail-with-body', // Return body even on HTTP errors
        ...options.args || [],
        this.baseUrl + url
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
          // Extract metrics from end of output
          const lines = output.split('\n');
          const metricsLine = lines[lines.length - 1];
          let httpCode, timeTotal, sizeDownload, finalUrl, content = '';
          
          if (metricsLine.includes('|')) {
            [httpCode, timeTotal, sizeDownload, finalUrl] = metricsLine.split('|');
            content = lines.slice(0, -1).join('\n');
          } else {
            httpCode = '200';
            timeTotal = '0';
            sizeDownload = output.length.toString();
            finalUrl = url;
            content = output;
          }
          
          resolve({
            success: true,
            httpCode: parseInt(httpCode),
            timeTotal: parseFloat(timeTotal),
            sizeDownload: parseInt(sizeDownload),
            finalUrl,
            content,
            error: null
          });
        } else {
          resolve({
            success: false,
            httpCode: 0,
            timeTotal: 0,
            sizeDownload: 0,
            finalUrl: url,
            content: '',
            error: error.trim() || `Exit code: ${code}`
          });
        }
      });
    });
  }

  // Extract links from HTML content
  extractLinks(content, baseUrl) {
    try {
      const dom = new JSDOM(content);
      const document = dom.window.document;
      const links = [];

      // Extract all href attributes
      const anchors = document.querySelectorAll('a[href]');
      anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          // Convert relative URLs to absolute
          const absoluteUrl = href.startsWith('http') ? href : 
                             href.startsWith('/') ? `${baseUrl}${href}` :
                             `${baseUrl}/${href}`;
          links.push({
            url: absoluteUrl,
            text: anchor.textContent?.trim() || '',
            context: anchor.getAttribute('title') || ''
          });
        }
      });

      // Extract API calls from script tags
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || '';
        const apiMatches = content.match(/["']\/api\/[^"']*["']/g);
        if (apiMatches) {
          apiMatches.forEach(match => {
            const apiPath = match.replace(/["']/g, '');
            links.push({
              url: `${baseUrl}${apiPath}`,
              text: 'API Endpoint',
              context: 'Found in JavaScript'
            });
          });
        }
      });

      return links;
    } catch (error) {
      console.log(`Error parsing HTML for ${baseUrl}: ${error.message}`);
      return [];
    }
  }

  // Analyze page content for errors and issues
  analyzeContent(content, url) {
    const issues = [];
    const warnings = [];

    // Check for error indicators
    const errorPatterns = [
      'Agent Not Found',
      'Error:',
      '404',
      '500',
      'Internal Server Error',
      'Cannot GET',
      'ReferenceError',
      'TypeError',
      'SyntaxError',
      'Uncaught',
      'Failed to fetch'
    ];

    errorPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        issues.push(`Contains error pattern: ${pattern}`);
      }
    });

    // Check for warning indicators
    const warningPatterns = [
      'Warning:',
      'Deprecated',
      'Missing',
      'undefined',
      'null',
      'Loading...',
      'No data available'
    ];

    warningPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        warnings.push(`Contains warning pattern: ${pattern}`);
      }
    });

    // Check for React errors
    if (content.includes('The above error occurred in the') || 
        content.includes('React will try to recreate this component')) {
      issues.push('React component error detected');
    }

    // Check for incomplete pages
    if (content.length < 1000 && !url.includes('/api/')) {
      warnings.push('Page content unusually short');
    }

    // Check for missing assets
    if (content.includes('Failed to load resource') || 
        content.includes('net::ERR_')) {
      issues.push('Missing resources detected');
    }

    return { issues, warnings };
  }

  // Test a single page/endpoint comprehensively
  async testPageComprehensive(url, depth = 0, maxDepth = 2) {
    if (this.visited.has(url) || depth > maxDepth) {
      return null;
    }

    this.visited.add(url);
    console.log(`${'  '.repeat(depth)}Testing: ${url}`);
    
    this.results.summary.total++;
    
    try {
      const result = await this.executeCurl(url);
      const analysis = this.analyzeContent(result.content, url);
      
      const testResult = {
        url,
        finalUrl: result.finalUrl,
        httpCode: result.httpCode,
        responseTime: result.timeTotal,
        sizeBytes: result.sizeDownload,
        success: result.success && result.httpCode >= 200 && result.httpCode < 400 && analysis.issues.length === 0,
        issues: analysis.issues,
        warnings: analysis.warnings,
        error: result.error,
        depth,
        redirected: result.finalUrl !== url
      };

      // Extract and test links if this is a successful page
      if (result.success && result.httpCode === 200 && depth < maxDepth && !url.includes('/api/')) {
        const links = this.extractLinks(result.content, this.baseUrl);
        testResult.foundLinks = links.length;
        
        // Test internal links
        for (const link of links) {
          if (link.url.startsWith(this.baseUrl) && !this.visited.has(link.url)) {
            const subResult = await this.testPageComprehensive(link.url, depth + 1, maxDepth);
            if (subResult) {
              this.results.pages.push(subResult);
            }
          }
        }
      }

      // Categorize results
      if (testResult.success) {
        this.results.summary.passed++;
        console.log(`${'  '.repeat(depth)}✅ ${url}: HTTP ${result.httpCode} (${result.timeTotal.toFixed(3)}s)`);
      } else if (testResult.issues.length > 0) {
        this.results.summary.failed++;
        console.log(`${'  '.repeat(depth)}❌ ${url}: ${testResult.issues.join(', ')}`);
        this.results.summary.errors.push(`${url}: ${testResult.issues.join(', ')}`);
      } else {
        this.results.summary.warnings++;
        console.log(`${'  '.repeat(depth)}⚠️  ${url}: ${testResult.warnings.join(', ')}`);
      }

      if (testResult.warnings.length > 0) {
        testResult.warnings.forEach(warning => {
          console.log(`${'  '.repeat(depth)}   Warning: ${warning}`);
        });
      }

      return testResult;
      
    } catch (error) {
      this.results.summary.failed++;
      const errorMsg = `Request failed: ${error.message}`;
      console.log(`${'  '.repeat(depth)}❌ ${url}: ${errorMsg}`);
      this.results.summary.errors.push(`${url}: ${errorMsg}`);
      
      return {
        url,
        finalUrl: url,
        httpCode: 0,
        responseTime: 0,
        sizeBytes: 0,
        success: false,
        issues: [errorMsg],
        warnings: [],
        error: errorMsg,
        depth
      };
    }
  }

  // Test all known routes
  async testKnownRoutes() {
    console.log('\n🌐 Testing Known Routes...');
    
    for (const route of this.knownRoutes) {
      const result = await this.testPageComprehensive(route);
      if (result) {
        this.results.pages.push(result);
      }
    }
  }

  // Test all agent routes
  async testAgentRoutes() {
    console.log('\n🎯 Testing Agent Routes...');
    
    for (const agent of this.agentTypes) {
      // Test dashboard
      const dashboardResult = await this.testPageComprehensive(`/agent/${agent}`);
      if (dashboardResult) {
        this.results.pages.push(dashboardResult);
      }

      // Test baseline viewer
      const baselineResult = await this.testPageComprehensive(`/agent/${agent}/baseline`);
      if (baselineResult) {
        this.results.pages.push(baselineResult);
      }
    }
  }

  // Test all API endpoints
  async testAPIEndpoints() {
    console.log('\n🔌 Testing API Endpoints...');
    
    for (const endpoint of this.apiEndpoints) {
      const result = await this.testPageComprehensive(endpoint);
      if (result) {
        this.results.apis.push(result);
      }
    }

    // Test agent-specific APIs
    for (const agent of this.agentTypes) {
      const endpoints = [
        `/api/agents/${agent}/dashboard`,
        `/api/agents/${agent}/config`,
        `/api/agents/${agent}/baseline-results`
      ];

      for (const endpoint of endpoints) {
        const result = await this.testPageComprehensive(endpoint);
        if (result) {
          this.results.apis.push(result);
        }
      }
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(100));
    console.log('🔍 COMPREHENSIVE VALIDATION REPORT');
    console.log('='.repeat(100));

    const { summary } = this.results;
    const successRate = Math.round((summary.passed / summary.total) * 100);

    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   📊 Success Rate: ${successRate}%`);
    console.log(`   🔗 Unique URLs Tested: ${this.visited.size}`);

    // Category breakdown
    const pages = this.results.pages;
    const apis = this.results.apis;
    
    console.log('\n📂 Category Breakdown:');
    console.log(`   🌐 Pages: ${pages.filter(r => r.success).length}/${pages.length} successful`);
    console.log(`   🔌 APIs: ${apis.filter(r => r.success).length}/${apis.length} successful`);

    // Failed tests by category
    if (summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('-'.repeat(60));
      summary.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    // Performance analysis
    const allResults = [...pages, ...apis].filter(r => r.success);
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
            console.log(`     • ${test.url}: ${test.responseTime.toFixed(3)}s`);
          });
      }
    }

    // Coverage analysis
    console.log('\n🎯 Coverage Analysis:');
    console.log(`   Agent Dashboards: ${pages.filter(p => p.url.includes('/agent/') && !p.url.includes('/baseline')).length}/11`);
    console.log(`   Agent Baselines: ${pages.filter(p => p.url.includes('/baseline')).length}/11`);
    console.log(`   Core APIs: ${apis.filter(a => a.success && !a.url.includes('/agents/')).length}`);
    console.log(`   Agent APIs: ${apis.filter(a => a.success && a.url.includes('/agents/')).length}/33`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    const criticalIssues = summary.errors.filter(e => 
      e.includes('Agent Not Found') || e.includes('500') || e.includes('ReferenceError')
    ).length;
    
    if (criticalIssues > 0) {
      console.log(`   🚨 ${criticalIssues} critical issues require immediate attention`);
    }
    if (successRate >= 95) {
      console.log('   🎉 Excellent! Platform is in great condition.');
    } else if (successRate >= 85) {
      console.log('   👍 Good overall health, minor issues to address.');
    } else {
      console.log('   🔧 Platform needs significant fixes before production.');
    }

    // Save detailed results
    const reportFile = path.join(process.cwd(), 'comprehensive-validation-report.json');
    const reportData = {
      ...this.results,
      summary: {
        ...summary,
        successRate,
        uniqueUrls: this.visited.size,
        timestamp: new Date().toISOString()
      }
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }

  // Run comprehensive validation
  async runValidation() {
    console.log('🚀 Starting Comprehensive Validation Suite');
    console.log('='.repeat(100));
    console.log(`Testing base URL: ${this.baseUrl}`);
    console.log('Following every link, loading every page...\n');

    await this.testKnownRoutes();
    await this.testAgentRoutes();
    await this.testAPIEndpoints();

    this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ComprehensiveValidator();
  validator.runValidation().catch(console.error);
}

export default ComprehensiveValidator;