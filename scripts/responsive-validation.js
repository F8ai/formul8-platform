#!/usr/bin/env node

/**
 * Comprehensive Responsive Validation Suite
 * Tests all pages for mobile responsiveness without browser automation
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Device viewports to test
const DEVICES = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1440, height: 900, name: 'Desktop' }
};

// Pages to test for responsiveness
const PAGES = [
  { path: '/', name: 'Home Page' },
  { path: '/agents', name: 'Agents List' },
  { path: '/agent/compliance', name: 'Compliance Agent Dashboard' },
  { path: '/agent/marketing', name: 'Marketing Agent Dashboard' },
  { path: '/agent/formulation', name: 'Formulation Agent Dashboard' },
  { path: '/baseline-testing', name: 'Baseline Testing' },
  { path: '/data', name: 'Data Management' },
  { path: '/roadmap', name: 'Roadmap' },
  { path: '/design', name: 'Design Page' }
];

class ResponsiveValidator {
  constructor() {
    this.results = {
      pages: {},
      summary: { total: 0, passed: 0, failed: 0 }
    };
  }

  async testPageAccessibility(url, pageName) {
    const pageResults = {};
    
    for (const [deviceKey, device] of Object.entries(DEVICES)) {
      try {
        const startTime = Date.now();
        
        // Test if page loads successfully
        const response = await fetch(url, {
          headers: {
            'User-Agent': `Responsive-Test-${device.name}`,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        const loadTime = Date.now() - startTime;
        const success = response.status === 200;
        
        let issues = [];
        let contentSize = 0;
        
        if (success) {
          const content = await response.text();
          contentSize = content.length;
          
          // Static analysis for responsive issues
          const responsiveChecks = this.analyzeHtmlForResponsiveness(content, device);
          issues = responsiveChecks.issues;
        }

        pageResults[deviceKey] = {
          device: device.name,
          viewport: `${device.width}x${device.height}`,
          success: success && issues.length === 0,
          httpStatus: response.status,
          loadTime: loadTime,
          contentSize: contentSize,
          issues: issues,
          recommendations: this.getRecommendations(issues)
        };

        const status = success && issues.length === 0 ? '✅' : success ? '⚠️' : '❌';
        console.log(`  ${device.name} (${device.width}x${device.height}): ${status} ${issues.length} issues, ${loadTime}ms`);
        
        if (issues.length > 0) {
          issues.forEach(issue => console.log(`    - ${issue}`));
        }

      } catch (error) {
        pageResults[deviceKey] = {
          device: device.name,
          success: false,
          error: error.message,
          issues: ['Network error']
        };
        console.log(`  ${device.name}: ❌ ${error.message}`);
      }
    }

    return pageResults;
  }

  analyzeHtmlForResponsiveness(html, device) {
    const issues = [];
    
    // Check for viewport meta tag
    if (!html.includes('<meta name="viewport"')) {
      issues.push('Missing viewport meta tag');
    }
    
    // Check for responsive CSS frameworks
    const hasResponsiveFramework = html.includes('tailwind') || 
                                  html.includes('bootstrap') || 
                                  html.includes('@media');
    
    if (!hasResponsiveFramework) {
      issues.push('No responsive CSS framework detected');
    }
    
    // Check for common responsive classes (more comprehensive)
    const responsiveClasses = [
      'sm:', 'md:', 'lg:', 'xl:', '2xl:', // Tailwind breakpoints
      'flex-col', 'flex-row', 'hidden sm:', 'block sm:', // Tailwind responsive
      'grid-cols-1', 'grid-cols-2', 'space-y-', 'space-x-', // Tailwind layout
      'col-xs-', 'col-sm-', 'col-md-', 'col-lg-', // Bootstrap
      'hidden-xs', 'hidden-sm', 'visible-md' // Bootstrap visibility
    ];
    
    const responsiveClassCount = responsiveClasses.reduce((count, cls) => {
      return count + (html.match(new RegExp(cls, 'g')) || []).length;
    }, 0);
    
    if (responsiveClassCount < 5) {
      issues.push(`Limited responsive class usage detected (${responsiveClassCount} instances)`);
    }
    
    // Check for fixed widths that might cause issues
    const fixedWidthPattern = /width:\s*\d+px/gi;
    const fixedWidthMatches = html.match(fixedWidthPattern);
    if (fixedWidthMatches && fixedWidthMatches.length > 10) {
      issues.push(`${fixedWidthMatches.length} fixed width elements detected`);
    }
    
    // Check for mobile-unfriendly elements
    if (html.includes('overflow-x-auto') && device.width < 768) {
      issues.push('Horizontal scroll elements detected on mobile');
    }
    
    // Check for table elements without responsive wrappers
    const tableCount = (html.match(/<table/gi) || []).length;
    const responsiveTableCount = (html.match(/table-responsive|overflow-x-auto/gi) || []).length;
    
    if (tableCount > responsiveTableCount && device.width < 768) {
      issues.push(`${tableCount - responsiveTableCount} tables without responsive wrappers`);
    }
    
    return { issues };
  }

  getRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(i => i.includes('viewport'))) {
      recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
    }
    
    if (issues.some(i => i.includes('responsive class'))) {
      recommendations.push('Use responsive utility classes (sm:, md:, lg:) for better mobile experience');
    }
    
    if (issues.some(i => i.includes('fixed width'))) {
      recommendations.push('Replace fixed widths with responsive units (%, vw, rem)');
    }
    
    if (issues.some(i => i.includes('table'))) {
      recommendations.push('Wrap tables in responsive containers or use card layouts on mobile');
    }
    
    return recommendations;
  }

  async checkServerStatus() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/user`);
      return response.status === 401; // 401 is expected for unauthenticated requests
    } catch (error) {
      console.error('Server not responding:', error.message);
      return false;
    }
  }

  printSummary() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    console.log('\n============================================================');
    console.log('📱 RESPONSIVE VALIDATION SUMMARY');
    console.log('============================================================');

    Object.entries(this.results.pages).forEach(([pageName, devices]) => {
      console.log(`\n📄 ${pageName}:`);
      Object.entries(devices).forEach(([deviceKey, result]) => {
        totalTests++;
        if (result.success) {
          passedTests++;
          console.log(`   ✅ ${result.device}: Responsive`);
        } else {
          failedTests++;
          console.log(`   ❌ ${result.device}: ${result.error || result.issues.join(', ')}`);
        }
      });
    });

    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n============================================================');
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('');
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Great responsive design across all devices!');
    } else if (successRate >= 75) {
      console.log('👍 GOOD: Most pages are responsive with minor issues');
    } else if (successRate >= 50) {
      console.log('⚠️  NEEDS WORK: Significant responsive issues detected');
    } else {
      console.log('🚨 CRITICAL: Major responsive design problems');
    }

    console.log('\n📋 Recommendations:');
    console.log('   • Use CSS Grid/Flexbox for flexible layouts');
    console.log('   • Implement proper breakpoints (sm:, md:, lg:)');
    console.log('   • Ensure touch targets are at least 44px');
    console.log('   • Test on real devices when possible');
    console.log('   • Use responsive images and media queries');
  }

  async run() {
    console.log('🚀 Comprehensive Responsive Validation Suite');
    console.log('Testing all pages for mobile responsiveness\n');

    // Check if server is running
    const serverRunning = await this.checkServerStatus();
    if (!serverRunning) {
      console.error('❌ Server is not running. Please start the application first.');
      return;
    }

    // Test each page
    for (const pageConfig of PAGES) {
      console.log(`\n🔍 Testing ${pageConfig.name} (${pageConfig.path})...`);
      
      const url = `${BASE_URL}${pageConfig.path}`;
      const results = await this.testPageAccessibility(url, pageConfig.name);
      this.results.pages[pageConfig.name] = results;
    }

    this.printSummary();
  }
}

// Run the responsive validation
const validator = new ResponsiveValidator();
validator.run().catch(console.error);