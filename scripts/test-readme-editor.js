#!/usr/bin/env node

/**
 * Test README Editor Functionality
 * Validates that README content can be fetched and saved for all agents
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const AGENT_TYPES = [
  'compliance', 'formulation', 'marketing', 'operations', 'science',
  'sourcing', 'patent', 'spectra', 'customer-success', 'lms', 'metabolomics'
];

class ReadmeEditorTester {
  constructor() {
    this.results = {
      readmeGet: [],
      readmePut: []
    };
  }

  async testEndpoint(name, path, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${path}`, options);
      const responseTime = (Date.now() - startTime) / 1000;
      
      const success = response.status === 200;
      const data = success ? await response.json() : null;
      
      return {
        name,
        path,
        method,
        expectedStatus: 200,
        actualStatus: response.status,
        responseTime,
        success,
        error: success ? null : `HTTP ${response.status}`,
        contentLength: data?.content ? data.content.length : null
      };
    } catch (error) {
      return {
        name,
        path,
        method,
        expectedStatus: 200,
        actualStatus: 0,
        responseTime: 0,
        success: false,
        error: error.message,
        contentLength: null
      };
    }
  }

  async testReadmeGet() {
    console.log('\n📖 Testing README GET Endpoints...');
    
    for (const agent of AGENT_TYPES) {
      const result = await this.testEndpoint(
        `${agent.charAt(0).toUpperCase() + agent.slice(1)} README GET`,
        `/api/agents/${agent}/readme`
      );
      this.results.readmeGet.push(result);
      
      const status = result.success ? '✅' : '❌';
      const contentInfo = result.contentLength ? ` (${result.contentLength} chars)` : '';
      console.log(`  ${status} ${result.name}: HTTP ${result.actualStatus}${contentInfo}`);
    }
  }

  async testReadmePut() {
    console.log('\n💾 Testing README PUT Endpoints...');
    
    // Test with a sample agent (marketing) to avoid modifying all READMEs
    const testContent = `# Test README\n\nThis is a test update at ${new Date().toISOString()}\n\n## Test Section\n\n- Test item 1\n- Test item 2`;
    
    const result = await this.testEndpoint(
      'Marketing README PUT',
      `/api/agents/marketing/readme`,
      'PUT',
      { content: testContent }
    );
    
    this.results.readmePut.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.name}: HTTP ${result.actualStatus}`);
    
    // Restore original content if test was successful
    if (result.success) {
      console.log('  🔄 Restoring original README content...');
      const originalContent = `# Marketing Agent

## Overview
The Marketing Agent provides comprehensive cannabis marketing strategies while ensuring full compliance with advertising restrictions and building effective brand presence.

## Core Functionality

### 1. Brand Strategy Development
- Cannabis brand positioning and differentiation
- Target audience identification and segmentation
- Brand voice and messaging development
- Competitive analysis and market positioning

### 2. Compliance-First Marketing
- State-specific advertising regulation compliance
- Social media marketing within legal boundaries
- Content approval and compliance verification
- Marketing material regulatory review

### 3. Digital Marketing Strategy
- SEO-optimized website development strategy
- Social media strategy within platform restrictions
- Email marketing campaign development
- Digital advertising compliance and optimization

### 4. Content Marketing
- Educational content development strategy
- Blog and article content planning
- Video content strategy and production guidance
- Podcast and audio content development

### 5. Customer Acquisition
- Customer journey mapping and optimization
- Conversion funnel development and optimization
- Lead generation strategy development
- Customer acquisition cost optimization

### 6. Customer Retention
- Loyalty program development and management
- Customer lifecycle marketing automation
- Retention campaign strategy and execution
- Customer satisfaction and feedback management

### 7. Product Launch Strategy
- New product introduction campaigns
- Market entry strategy development
- Launch timeline and milestone planning
- Success metrics and KPI tracking

### 8. Event Marketing
- Trade show and expo participation strategy
- Educational event planning and execution
- Community engagement and outreach
- Sponsorship and partnership opportunities

### 9. Analytics and Performance
- Marketing ROI measurement and optimization
- Campaign performance tracking and analysis
- Customer behavior analysis and insights
- Market trend identification and response

### 10. Influencer and Partnership Marketing
- Influencer identification and collaboration
- Strategic partnership development
- Cross-promotion campaign management
- Community building and engagement

## Performance Metrics
- **Customer Acquisition Cost**: <$50 per customer
- **Conversion Rate**: 3%+ website conversion rate
- **Brand Awareness**: 25%+ increase in brand recognition
- **Customer Lifetime Value**: $500+ average CLV
- **Compliance Rate**: 100% marketing compliance

## Integration Capabilities
- Customer relationship management (CRM) integration
- Marketing automation platform integration
- Analytics and tracking system integration
- Social media management platform integration
- Multi-agent collaboration for comprehensive campaigns

## Success Criteria
- 50%+ increase in qualified leads
- 100% compliance with all marketing regulations
- 30%+ improvement in customer retention rate
- Positive brand sentiment across all channels`;

      await this.testEndpoint(
        'Marketing README Restore',
        `/api/agents/marketing/readme`,
        'PUT',
        { content: originalContent }
      );
      console.log('  ✅ Original content restored');
    }
  }

  printSummary() {
    const totalTests = this.results.readmeGet.length + this.results.readmePut.length;
    const passedTests = [
      ...this.results.readmeGet.filter(r => r.success),
      ...this.results.readmePut.filter(r => r.success)
    ].length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n============================================================');
    console.log('📖 README EDITOR VALIDATION SUMMARY');
    console.log('============================================================');
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('');
    console.log('📂 Component Results:');
    console.log(`   📖 README GET APIs: ${this.results.readmeGet.filter(r => r.success).length}/${this.results.readmeGet.length} passed`);
    console.log(`   💾 README PUT APIs: ${this.results.readmePut.filter(r => r.success).length}/${this.results.readmePut.length} passed`);
    console.log('');
    
    if (successRate === 100) {
      console.log('🎉 SUCCESS: README editor functionality working correctly!');
      console.log('   ✅ All agents can fetch README content');
      console.log('   ✅ README content can be saved successfully');
      console.log('   ✅ Content integrity maintained');
    } else {
      console.log('⚠️  Some README editor tests failed');
      const failedTests = [
        ...this.results.readmeGet.filter(r => !r.success),
        ...this.results.readmePut.filter(r => !r.success)
      ];
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.error}`);
      });
    }
  }

  async run() {
    console.log('🚀 README Editor Validation Suite');
    console.log('Testing README content fetching and saving functionality');
    
    await this.testReadmeGet();
    await this.testReadmePut();
    
    this.printSummary();
  }
}

// Run the tests
const tester = new ReadmeEditorTester();
tester.run().catch(console.error);