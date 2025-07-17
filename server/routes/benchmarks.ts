import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { BenchmarkSuite } from "../testing/benchmark-suite";

interface BenchmarkReport {
  id: string;
  timestamp: Date;
  overallStats: any;
  agentResults: any;
  summary: string;
  recommendations: string[];
}

class BenchmarkManager {
  private reports: BenchmarkReport[] = [];
  private isRunning = false;

  async runBenchmarks(): Promise<BenchmarkReport> {
    if (this.isRunning) {
      throw new Error("Benchmark suite is already running");
    }

    this.isRunning = true;
    try {
      const suite = new BenchmarkSuite();
      await suite.runAllBenchmarks();
      const report = suite.generateReport();
      
      const benchmarkReport: BenchmarkReport = {
        id: `benchmark_${Date.now()}`,
        timestamp: new Date(),
        ...report
      };

      this.reports.unshift(benchmarkReport);
      
      // Keep only last 10 reports
      if (this.reports.length > 10) {
        this.reports = this.reports.slice(0, 10);
      }

      return benchmarkReport;
    } finally {
      this.isRunning = false;
    }
  }

  getReports(): BenchmarkReport[] {
    return this.reports;
  }

  getLatestReport(): BenchmarkReport | null {
    return this.reports.length > 0 ? this.reports[0] : null;
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

const benchmarkManager = new BenchmarkManager();

export function registerBenchmarkRoutes(app: Express): void {
  // Get benchmark status
  app.get('/api/benchmarks/status', isAuthenticated, (req, res) => {
    try {
      const latestReport = benchmarkManager.getLatestReport();
      
      res.json({
        isRunning: benchmarkManager.isCurrentlyRunning(),
        latestRun: latestReport?.timestamp || null,
        totalReports: benchmarkManager.getReports().length,
        lastResults: latestReport ? {
          passRate: latestReport.overallStats.passRate,
          averageScore: latestReport.overallStats.averageScore,
          averageResponseTime: latestReport.overallStats.averageResponseTime
        } : null
      });
    } catch (error) {
      console.error("Error getting benchmark status:", error);
      res.status(500).json({ message: "Failed to get benchmark status" });
    }
  });

  // Run new benchmark suite
  app.post('/api/benchmarks/run', isAuthenticated, async (req, res) => {
    try {
      if (benchmarkManager.isCurrentlyRunning()) {
        return res.status(409).json({ 
          message: "Benchmark suite is already running" 
        });
      }

      // Start benchmarks asynchronously
      benchmarkManager.runBenchmarks().catch(error => {
        console.error("Benchmark run failed:", error);
      });

      res.json({ 
        message: "Benchmark suite started",
        status: "running"
      });
    } catch (error) {
      console.error("Error starting benchmarks:", error);
      res.status(500).json({ message: "Failed to start benchmark suite" });
    }
  });

  // Get all benchmark reports
  app.get('/api/benchmarks/reports', isAuthenticated, (req, res) => {
    try {
      const reports = benchmarkManager.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error getting benchmark reports:", error);
      res.status(500).json({ message: "Failed to get benchmark reports" });
    }
  });

  // Get specific benchmark report
  app.get('/api/benchmarks/reports/:id', isAuthenticated, (req, res) => {
    try {
      const { id } = req.params;
      const report = benchmarkManager.getReports().find(r => r.id === id);
      
      if (!report) {
        return res.status(404).json({ message: "Benchmark report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error getting benchmark report:", error);
      res.status(500).json({ message: "Failed to get benchmark report" });
    }
  });

  // Get benchmark metrics for dashboard
  app.get('/api/benchmarks/metrics', isAuthenticated, (req, res) => {
    try {
      const reports = benchmarkManager.getReports();
      
      if (reports.length === 0) {
        return res.json({
          agentPerformance: {},
          trends: [],
          summary: {
            totalTests: 0,
            overallPassRate: 0,
            averageScore: 0,
            lastRun: null
          }
        });
      }

      const latestReport = reports[0];
      
      // Calculate trends (last 5 reports)
      const recentReports = reports.slice(0, 5);
      const trends = recentReports.map(report => ({
        timestamp: report.timestamp,
        passRate: parseFloat(report.overallStats.passRate),
        averageScore: parseFloat(report.overallStats.averageScore),
        averageResponseTime: report.overallStats.averageResponseTime
      }));

      // Agent performance summary
      const agentPerformance = latestReport.agentResults;

      res.json({
        agentPerformance,
        trends,
        summary: {
          totalTests: latestReport.overallStats.totalTests,
          overallPassRate: latestReport.overallStats.passRate,
          averageScore: latestReport.overallStats.averageScore,
          lastRun: latestReport.timestamp
        },
        recommendations: latestReport.recommendations
      });
    } catch (error) {
      console.error("Error getting benchmark metrics:", error);
      res.status(500).json({ message: "Failed to get benchmark metrics" });
    }
  });

  // Agent-specific benchmark details
  app.get('/api/benchmarks/agents/:agentType', isAuthenticated, (req, res) => {
    try {
      const { agentType } = req.params;
      const latestReport = benchmarkManager.getLatestReport();
      
      if (!latestReport) {
        return res.status(404).json({ message: "No benchmark reports available" });
      }

      const agentResults = latestReport.agentResults[agentType];
      if (!agentResults) {
        return res.status(404).json({ message: "Agent not found in benchmark results" });
      }

      // Get historical performance for this agent
      const historicalData = benchmarkManager.getReports()
        .slice(0, 10)
        .map(report => ({
          timestamp: report.timestamp,
          passRate: parseFloat(report.agentResults[agentType]?.passRate || '0'),
          averageScore: parseFloat(report.agentResults[agentType]?.averageScore || '0'),
          averageResponseTime: report.agentResults[agentType]?.averageResponseTime || 0,
          averageConfidence: parseFloat(report.agentResults[agentType]?.averageConfidence || '0')
        }))
        .reverse();

      res.json({
        agentType,
        currentPerformance: agentResults,
        historicalData,
        testDetails: agentResults.tests
      });
    } catch (error) {
      console.error("Error getting agent benchmark details:", error);
      res.status(500).json({ message: "Failed to get agent benchmark details" });
    }
  });

  // Export benchmark data
  app.get('/api/benchmarks/export/:format', isAuthenticated, (req, res) => {
    try {
      const { format } = req.params;
      const reports = benchmarkManager.getReports();
      
      if (format === 'csv') {
        const csvData = generateCSVReport(reports);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="formul8-benchmarks.csv"');
        res.send(csvData);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="formul8-benchmarks.json"');
        res.json(reports);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting benchmark data:", error);
      res.status(500).json({ message: "Failed to export benchmark data" });
    }
  });
}

function generateCSVReport(reports: BenchmarkReport[]): string {
  const headers = [
    'Timestamp',
    'Agent Type', 
    'Test Name',
    'Passed',
    'Score',
    'Response Time',
    'Confidence',
    'Pass Rate',
    'Average Score'
  ];

  const rows: string[] = [headers.join(',')];

  for (const report of reports) {
    for (const [agentType, agentData] of Object.entries(report.agentResults) as [string, any][]) {
      for (const test of agentData.tests) {
        rows.push([
          report.timestamp.toISOString(),
          agentType,
          `"${test.testName}"`,
          test.passed,
          test.score,
          test.responseTime,
          test.confidence,
          agentData.passRate,
          agentData.averageScore
        ].join(','));
      }
    }
  }

  return rows.join('\n');
}