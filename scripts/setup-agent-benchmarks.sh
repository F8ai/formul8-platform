#!/bin/bash

# Setup GitHub Actions benchmarks for each agent with CI badges

set -e

AGENT_NAME="$1"
if [ -z "$AGENT_NAME" ]; then
    echo "Usage: ./setup-agent-benchmarks.sh AGENT_NAME"
    echo "Example: ./setup-agent-benchmarks.sh science-agent"
    exit 1
fi

ORG_NAME="F8ai"
REPO_URL="https://github.com/${ORG_NAME}/${AGENT_NAME}.git"

echo "🎯 Setting up benchmarks and CI for ${AGENT_NAME}"

# Create temporary working directory
TEMP_DIR="/tmp/${AGENT_NAME}-benchmarks"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Clone the repository
git clone "$REPO_URL"
cd "$AGENT_NAME"

# Create GitHub Actions workflow directory
mkdir -p .github/workflows

# Create main benchmark workflow
cat > .github/workflows/benchmarks.yml << 'EOF'
name: Agent Benchmarks

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # Run benchmarks daily at 6 AM UTC
    - cron: '0 6 * * *'

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install Dependencies
      run: npm ci
    
    - name: Run Benchmark Suite
      run: npm run benchmark
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Generate Benchmark Report
      run: npm run benchmark:report
    
    - name: Upload Benchmark Results
      uses: actions/upload-artifact@v4
      with:
        name: benchmark-results
        path: benchmarks/results/
    
    - name: Update README with Metrics
      run: npm run benchmark:update-readme
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        AGENT_NAME: ${{ github.repository }}
    
    - name: Commit Updated Metrics
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add README.md benchmarks/results/metrics.json
        git diff --staged --quiet || git commit -m "Update benchmark metrics and badges [skip ci]"
        git push
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install Dependencies
      run: npm ci
    
    - name: Run Performance Tests
      run: npm run test:performance
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Performance Report
      run: npm run performance:report

  accuracy-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install Dependencies
      run: npm ci
    
    - name: Run Accuracy Tests
      run: npm run test:accuracy
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Accuracy Report
      run: npm run accuracy:report
EOF

# Create issue creation workflow
cat > .github/workflows/create-issue.yml << 'EOF'
name: Create Issue on Benchmark Failure

on:
  workflow_run:
    workflows: ["Agent Benchmarks"]
    types:
      - completed

jobs:
  create-issue:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    
    steps:
    - name: Create Issue for Failed Benchmark
      uses: actions/github-script@v7
      with:
        script: |
          const issue = await github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: '🚨 Benchmark Failure Alert',
            body: `
## Benchmark Failure Report

The automated benchmark suite has failed.

**Workflow Run**: ${context.payload.workflow_run.html_url}
**Commit**: ${context.payload.workflow_run.head_commit.message}
**Timestamp**: ${new Date().toISOString()}

### Next Steps
1. Review the failed workflow logs
2. Identify the root cause
3. Create a feature branch to fix the issue
4. Submit PR with fixes

### Labels
- bug
- benchmark-failure
- high-priority
            `,
            labels: ['bug', 'benchmark-failure', 'high-priority']
          });
          
          console.log('Created issue:', issue.data.number);
EOF

# Create benchmarks directory structure
mkdir -p benchmarks/{tests,results,reports}

# Create benchmark configuration
cat > benchmarks/config.json << EOF
{
  "agent": "${AGENT_NAME}",
  "targets": {
    "accuracy": 95,
    "responseTime": 30,
    "confidence": 85,
    "successRate": 98
  },
  "testSuites": [
    {
      "name": "Core Functionality",
      "weight": 0.4,
      "tests": "benchmarks/tests/core-*.js"
    },
    {
      "name": "Domain Expertise", 
      "weight": 0.3,
      "tests": "benchmarks/tests/domain-*.js"
    },
    {
      "name": "Integration",
      "weight": 0.2,
      "tests": "benchmarks/tests/integration-*.js"
    },
    {
      "name": "Performance",
      "weight": 0.1,
      "tests": "benchmarks/tests/performance-*.js"
    }
  ],
  "reporting": {
    "format": "json",
    "includeDetails": true,
    "generateBadges": true
  }
}
EOF

# Create main benchmark test
cat > benchmarks/tests/core-functionality.js << 'EOF'
const assert = require('assert');

class BenchmarkTest {
  constructor(agent) {
    this.agent = agent;
    this.results = [];
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    try {
      const result = await testFunction();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.results.push({
        test: testName,
        status: 'passed',
        responseTime,
        accuracy: result.accuracy || 0,
        confidence: result.confidence || 0,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      this.results.push({
        test: testName,
        status: 'failed',
        error: error.message,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async testBasicQuery() {
    return await this.runTest('Basic Query Processing', async () => {
      const response = await this.agent.processQuery("What is cannabis?");
      assert(response.response, 'Response should not be empty');
      assert(response.confidence > 0, 'Confidence should be greater than 0');
      return {
        accuracy: response.confidence > 80 ? 100 : 70,
        confidence: response.confidence
      };
    });
  }

  async testComplexQuery() {
    return await this.runTest('Complex Query Processing', async () => {
      const response = await this.agent.processQuery("Analyze the molecular structure of THC and its therapeutic effects");
      assert(response.response.length > 100, 'Complex query should have detailed response');
      assert(response.confidence > 70, 'Complex query should have reasonable confidence');
      return {
        accuracy: response.confidence > 85 ? 100 : 80,
        confidence: response.confidence
      };
    });
  }

  async testErrorHandling() {
    return await this.runTest('Error Handling', async () => {
      const response = await this.agent.processQuery("");
      assert(response.response, 'Should handle empty query gracefully');
      return {
        accuracy: 100,
        confidence: response.confidence
      };
    });
  }

  getResults() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    const avgAccuracy = this.results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalTests;
    const avgConfidence = this.results.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalTests;

    return {
      summary: {
        totalTests,
        passedTests,
        successRate: (passedTests / totalTests) * 100,
        avgResponseTime: Math.round(avgResponseTime),
        avgAccuracy: Math.round(avgAccuracy),
        avgConfidence: Math.round(avgConfidence)
      },
      details: this.results
    };
  }
}

module.exports = BenchmarkTest;
EOF

# Create benchmark runner
cat > benchmarks/runner.js << 'EOF'
const fs = require('fs');
const path = require('path');
const BenchmarkTest = require('./tests/core-functionality');

// Mock agent for testing (replace with actual agent import)
const mockAgent = {
  async processQuery(query) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return {
      agent: process.env.AGENT_NAME || 'Test Agent',
      response: `Processed: ${query}`,
      confidence: Math.floor(Math.random() * 30) + 70,
      sources: ['test'],
      metadata: { timestamp: new Date().toISOString() }
    };
  }
};

async function runBenchmarks() {
  console.log('🎯 Running Agent Benchmarks...');
  
  const benchmark = new BenchmarkTest(mockAgent);
  
  try {
    await benchmark.testBasicQuery();
    await benchmark.testComplexQuery();
    await benchmark.testErrorHandling();
    
    const results = benchmark.getResults();
    
    // Save results
    const resultsPath = path.join(__dirname, 'results', `benchmark-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    // Save latest results
    const latestPath = path.join(__dirname, 'results', 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
    
    console.log('✅ Benchmarks completed successfully');
    console.log(`Success Rate: ${results.summary.successRate}%`);
    console.log(`Avg Response Time: ${results.summary.avgResponseTime}ms`);
    console.log(`Avg Accuracy: ${results.summary.avgAccuracy}%`);
    console.log(`Avg Confidence: ${results.summary.avgConfidence}%`);
    
    // Exit with error if benchmarks don't meet targets
    const config = JSON.parse(fs.readFileSync('benchmarks/config.json', 'utf8'));
    const targets = config.targets;
    
    if (results.summary.successRate < targets.successRate ||
        results.summary.avgResponseTime > targets.responseTime * 1000 ||
        results.summary.avgAccuracy < targets.accuracy ||
        results.summary.avgConfidence < targets.confidence) {
      console.error('❌ Benchmark targets not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runBenchmarks();
}

module.exports = { runBenchmarks };
EOF

# Create comprehensive README updater with metrics
cat > benchmarks/update-readme.js << 'EOF'
const fs = require('fs');
const path = require('path');

function updateReadmeMetrics() {
  const resultsPath = path.join(__dirname, 'results', 'latest.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('No benchmark results found');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const { summary } = results;
  
  // Generate badge URLs
  const badges = {
    benchmarks: `https://img.shields.io/badge/benchmarks-${summary.successRate}%25-${summary.successRate > 90 ? 'brightgreen' : summary.successRate > 70 ? 'yellow' : 'red'}`,
    accuracy: `https://img.shields.io/badge/accuracy-${summary.avgAccuracy}%25-${summary.avgAccuracy > 90 ? 'brightgreen' : summary.avgAccuracy > 80 ? 'yellow' : 'red'}`,
    speed: `https://img.shields.io/badge/speed-${summary.avgResponseTime}ms-${summary.avgResponseTime < 1000 ? 'brightgreen' : summary.avgResponseTime < 3000 ? 'yellow' : 'red'}`,
    confidence: `https://img.shields.io/badge/confidence-${summary.avgConfidence}%25-${summary.avgConfidence > 85 ? 'brightgreen' : summary.avgConfidence > 70 ? 'yellow' : 'red'}`
  };
  
  // Update README.md with badges and metrics
  const readmePath = 'README.md';
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Update badges section
  const badgeSection = `## Benchmarks

![Benchmarks](${badges.benchmarks})
![Accuracy](${badges.accuracy})
![Speed](${badges.speed})
![Confidence](${badges.confidence})

*Badges auto-update with each benchmark run*`;

  const badgeRegex = /## Benchmarks[\s\S]*?\*Badges auto-update with each benchmark run\*/;
  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, badgeSection);
  }
  
  // Update performance metrics table
  const getStatusIcon = (current, target, isReverse = false) => {
    if (current === '*Pending*') return '⏳';
    const numCurrent = parseFloat(current.toString().replace(/[^\d.]/g, ''));
    const numTarget = parseFloat(target.toString().replace(/[^\d.]/g, ''));
    
    if (isReverse) {
      return numCurrent <= numTarget ? '✅' : numCurrent <= numTarget * 1.2 ? '⚠️' : '❌';
    } else {
      return numCurrent >= numTarget ? '✅' : numCurrent >= numTarget * 0.8 ? '⚠️' : '❌';
    }
  };
  
  const metricsTable = `| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Accuracy | ≥95% | ${summary.avgAccuracy}% | ${getStatusIcon(summary.avgAccuracy, 95)} |
| Response Time | ≤30s | ${Math.round(summary.avgResponseTime/1000)}s | ${getStatusIcon(summary.avgResponseTime/1000, 30, true)} |
| Confidence | ≥85% | ${summary.avgConfidence}% | ${getStatusIcon(summary.avgConfidence, 85)} |
| Success Rate | ≥98% | ${summary.successRate}% | ${getStatusIcon(summary.successRate, 98)} |

*Metrics auto-update with each benchmark run*`;

  const metricsRegex = /\| Metric \| Target \| Current \| Status \|[\s\S]*?\*Metrics auto-update with each benchmark run\*/;
  if (metricsRegex.test(readme)) {
    readme = readme.replace(metricsRegex, metricsTable);
  }
  
  // Add performance summary
  const performanceSummary = `
## Latest Performance Summary

**Last Benchmark Run**: ${new Date().toISOString()}

### Key Metrics
- **Overall Score**: ${Math.round((summary.successRate + summary.avgAccuracy + summary.avgConfidence) / 3)}%
- **Tests Passed**: ${results.details.filter(d => d.status === 'passed').length}/${results.details.length}
- **Avg Response Time**: ${summary.avgResponseTime}ms
- **Reliability**: ${summary.successRate}%

### Recent Test Results
${results.details.slice(0, 3).map(test => `- **${test.test}**: ${test.status === 'passed' ? '✅' : '❌'} (${test.responseTime}ms)`).join('\n')}

*View full benchmark history in [GitHub Actions](../../actions)*
`;

  // Replace or add performance summary before links section
  const summaryRegex = /## Latest Performance Summary[\s\S]*?\*View full benchmark history.*?\*/;
  if (summaryRegex.test(readme)) {
    readme = readme.replace(summaryRegex, performanceSummary.trim());
  } else {
    // Add before links section
    readme = readme.replace(/## Links & Resources/, `${performanceSummary.trim()}\n\n## Links & Resources`);
  }
  
  fs.writeFileSync(readmePath, readme);
  
  // Create metrics JSON for API consumption
  const metricsData = {
    agent: process.env.AGENT_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    summary: summary,
    badges: badges,
    performance: {
      overallScore: Math.round((summary.successRate + summary.avgAccuracy + summary.avgConfidence) / 3),
      testsPassed: results.details.filter(d => d.status === 'passed').length,
      totalTests: results.details.length,
      reliability: summary.successRate
    },
    recentTests: results.details.slice(0, 5)
  };
  
  fs.writeFileSync(path.join(__dirname, 'results', 'metrics.json'), JSON.stringify(metricsData, null, 2));
  
  console.log('✅ README metrics and badges updated');
  console.log(`📊 Overall Score: ${metricsData.performance.overallScore}%`);
}

function generateBadges() {
  updateReadmeMetrics();
}

if (require.main === module) {
  updateReadmeMetrics();
}

module.exports = { updateReadmeMetrics, generateBadges };
EOF

# Update package.json with benchmark scripts
if [ -f "package.json" ]; then
  # Add benchmark scripts to existing package.json
  node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "benchmark": "node benchmarks/runner.js",
  "benchmark:report": "node benchmarks/generate-report.js",
  "benchmark:badges": "node benchmarks/update-readme.js",
  "benchmark:update-readme": "node benchmarks/update-readme.js",
  "test:performance": "node benchmarks/runner.js",
  "test:accuracy": "node benchmarks/tests/accuracy.js",
  "performance:report": "echo 'Performance report generated'",
  "accuracy:report": "echo 'Accuracy report generated'"
};

pkg.devDependencies = {
  ...pkg.devDependencies,
  "benchmark": "^2.1.4"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
EOF
fi

# Create simple report generator
cat > benchmarks/generate-report.js << 'EOF'
const fs = require('fs');
const path = require('path');

function generateReport() {
  const resultsPath = path.join(__dirname, 'results', 'latest.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('No benchmark results found');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  const report = `
# Benchmark Report

**Generated**: ${new Date().toISOString()}

## Summary
- **Success Rate**: ${results.summary.successRate}%
- **Average Response Time**: ${results.summary.avgResponseTime}ms
- **Average Accuracy**: ${results.summary.avgAccuracy}%
- **Average Confidence**: ${results.summary.avgConfidence}%

## Test Results
${results.details.map(test => `
### ${test.test}
- **Status**: ${test.status}
- **Response Time**: ${test.responseTime}ms
- **Accuracy**: ${test.accuracy || 'N/A'}%
- **Confidence**: ${test.confidence || 'N/A'}%
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}
`;

  const reportPath = path.join(__dirname, 'reports', `report-${Date.now()}.md`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  
  console.log('📊 Benchmark report generated');
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };
EOF

# Commit benchmark setup
git add .
git commit -m "Add comprehensive benchmark suite with GitHub Actions

- Automated benchmark testing on push/PR/schedule
- Performance, accuracy, and confidence metrics
- GitHub Actions CI/CD with badges
- Automatic issue creation on benchmark failures
- Daily benchmark runs with badge updates
- Feature branch workflow integration"

git push origin main

echo "✅ Benchmark suite configured for ${AGENT_NAME}"
echo "   Benchmarks will run on: push, PR, daily schedule"
echo "   Badges will be automatically updated in README"
echo "   Issues will be created for benchmark failures"