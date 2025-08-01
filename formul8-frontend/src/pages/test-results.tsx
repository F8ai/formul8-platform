import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

interface BaselineTestResult {
  id: number;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  status: 'passed' | 'failed' | 'active';
  confidence: number;
  category: string;
  timestamp: string;
  executionTime: number;
}

interface TestResultsProps {
  agentId: string;
}

export default function TestResults({ agentId }: TestResultsProps) {
  
  const { data: testResults, isLoading } = useQuery({
    queryKey: [`/api/baseline-exam/results/${agentId}`],
    retry: false,
  });

  const { data: agentStats } = useQuery({
    queryKey: [`/api/agents/${agentId}/repository-stats`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  const agentConfig = {
    compliance: { emoji: '🛡️', name: 'Compliance Agent', color: 'blue' },
    patent: { emoji: '⚖️', name: 'Patent Agent', color: 'purple' },
    operations: { emoji: '⚙️', name: 'Operations Agent', color: 'green' },
    formulation: { emoji: '🧪', name: 'Formulation Agent', color: 'teal' },
    sourcing: { emoji: '🛒', name: 'Sourcing Agent', color: 'orange' },
    marketing: { emoji: '📢', name: 'Marketing Agent', color: 'pink' },
    science: { emoji: '🔬', name: 'Science Agent', color: 'indigo' },
    spectra: { emoji: '📊', name: 'Spectra Agent', color: 'cyan' },
    'customer-success': { emoji: '🤝', name: 'Customer Success Agent', color: 'emerald' }
  };

  const agent = agentConfig[agentId as keyof typeof agentConfig] || { emoji: '🤖', name: 'Agent', color: 'gray' };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'active': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Mock data structure - replace with real API data
  const mockResults: BaselineTestResult[] = testResults?.questions || [
    {
      id: 1,
      question: "What are the cultivation license requirements in California?",
      expectedAnswer: "Valid cultivation license from California Cannabis Industry Association, track-and-trace compliance with METRC system, local municipal permits, security requirements including cameras and alarm systems, waste disposal protocols, and compliance with CEQA environmental regulations.",
      actualAnswer: "Valid cultivation license, track-and-trace compliance, local permits required for operation",
      status: 'passed',
      confidence: 85,
      category: 'Licensing',
      timestamp: '2025-01-13T20:00:00Z',
      executionTime: 2.3
    },
    {
      id: 2,
      question: "What is the THC testing requirement in Colorado?",
      expectedAnswer: "All cannabis products must be tested by state-licensed laboratory for potency, pesticides, heavy metals, residual solvents, and microbials. THC content must be accurately labeled with ±15% variance allowance.",
      actualAnswer: "Products must test below 1% THC content",
      status: 'failed',
      confidence: 45,
      category: 'Testing',
      timestamp: '2025-01-13T19:55:00Z',
      executionTime: 1.8
    },
    {
      id: 3,
      question: "What packaging requirements exist in Massachusetts?",
      expectedAnswer: "Child-resistant packaging required, opaque containers that prevent product visibility, proper labeling with warnings, batch tracking information, and compliance with state packaging regulations including size restrictions.",
      actualAnswer: "Child-resistant packaging, proper labeling requirements, opaque containers for all products",
      status: 'passed',
      confidence: 92,
      category: 'Packaging',
      timestamp: '2025-01-13T19:50:00Z',
      executionTime: 3.1
    }
  ];

  const totalTests = mockResults.length;
  const passedTests = mockResults.filter(t => t.status === 'passed').length;
  const failedTests = mockResults.filter(t => t.status === 'failed').length;
  const activeTests = mockResults.filter(t => t.status === 'active').length;
  const avgConfidence = Math.round(mockResults.reduce((sum, t) => sum + t.confidence, 0) / totalTests);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{agent.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600">Baseline Test Results</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getConfidenceColor(avgConfidence)}`}>{avgConfidence}%</div>
            <div className="text-sm text-gray-500">Avg Confidence</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
            <div className="text-sm text-gray-500">Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            <div className="text-sm text-gray-500">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{activeTests}</div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockResults.map((test) => (
              <div key={test.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{test.question}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Badge variant="outline" className={getStatusColor(test.status)}>
                          {test.status.toUpperCase()}
                        </Badge>
                        <span>Category: {test.category}</span>
                        <span>Execution: {test.executionTime}s</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getConfidenceColor(test.confidence)}`}>
                    {test.confidence}%
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Expected Answer</h4>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                      {test.expectedAnswer}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Actual Answer</h4>
                    <p className={`text-sm p-3 rounded border ${
                      test.status === 'passed' 
                        ? 'text-gray-700 bg-blue-50 border-blue-200'
                        : 'text-gray-700 bg-red-50 border-red-200'
                    }`}>
                      {test.actualAnswer}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Executed: {new Date(test.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          
          {mockResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No test results available for this agent.</p>
              <p className="text-sm mt-2">Test results will appear here once baseline exams are executed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}