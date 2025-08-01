import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultComparison } from "@/components/ui/result-comparison";
import { RefreshCw, GitCompare, Eye } from "lucide-react";

interface BaselineTestRun {
  id: number;
  agentType: string;
  model: string;
  state?: string;
  status: string;
  totalQuestions: number;
  successfulTests: number;
  avgAccuracy?: number;
  avgConfidence?: number;
  avgResponseTime?: number;
  totalCost?: number;
  createdAt: string;
}

interface BaselineResultsComparisonProps {
  agentType: string;
}

export function BaselineResultsComparison({ agentType }: BaselineResultsComparisonProps) {
  const [result1Id, setResult1Id] = useState<string>("");
  const [result2Id, setResult2Id] = useState<string>("");
  const [showComparison, setShowComparison] = useState(false);

  const { data: testRuns = [], isLoading } = useQuery({
    queryKey: ['/api/baseline-testing/runs', agentType],
    queryFn: async () => {
      const response = await fetch(`/api/baseline-testing/runs?agentType=${agentType}`);
      if (!response.ok) throw new Error('Failed to fetch test runs');
      return response.json();
    }
  });

  // Filter only completed runs for comparison
  const completedRuns = testRuns.filter((run: BaselineTestRun) => run.status === 'completed');

  const handleCompare = () => {
    if (result1Id && result2Id && result1Id !== result2Id) {
      setShowComparison(true);
    }
  };

  const getRunLabel = (run: BaselineTestRun) => {
    const date = new Date(run.createdAt).toLocaleDateString();
    const state = run.state ? ` (${run.state})` : '';
    const accuracy = run.avgAccuracy ? ` - ${run.avgAccuracy.toFixed(1)}%` : '';
    return `${run.model}${state}${accuracy} - ${date}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitCompare className="w-5 h-5 mr-2" />
            Compare Baseline Results
          </CardTitle>
          <CardDescription>
            Compare performance metrics between different baseline test runs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading test results...
            </div>
          ) : completedRuns.length < 2 ? (
            <div className="text-center py-8">
              <GitCompare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Need More Test Results</h3>
              <p className="text-gray-500 dark:text-gray-400">
                At least 2 completed baseline test runs are required for comparison.
                {completedRuns.length === 1 ? " You have 1 completed run." : " You have no completed runs."}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Run more baseline tests in the "Baseline" tab to enable comparisons.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Result</label>
                  <Select value={result1Id} onValueChange={setResult1Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first result to compare" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedRuns.map((run: BaselineTestRun) => (
                        <SelectItem key={run.id} value={run.id.toString()}>
                          {getRunLabel(run)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Second Result</label>
                  <Select value={result2Id} onValueChange={setResult2Id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select second result to compare" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedRuns.map((run: BaselineTestRun) => (
                        <SelectItem 
                          key={run.id} 
                          value={run.id.toString()}
                          disabled={run.id.toString() === result1Id}
                        >
                          {getRunLabel(run)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleCompare}
                  disabled={!result1Id || !result2Id || result1Id === result2Id}
                  className="w-full md:w-auto"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Results
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showComparison && result1Id && result2Id && (
        <ResultComparison 
          result1Id={parseInt(result1Id)}
          result2Id={parseInt(result2Id)}
        />
      )}

      {/* Recent Results Overview */}
      {completedRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Recent Completed Results
            </CardTitle>
            <CardDescription>
              Quick overview of recent completed baseline test runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedRuns.slice(0, 6).map((run: BaselineTestRun) => (
                <Card key={run.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{run.model}</span>
                      {run.state && (
                        <Badge variant="outline" className="text-xs">{run.state}</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Accuracy:</span>
                        <span className={`ml-1 font-medium ${
                          run.avgAccuracy && run.avgAccuracy >= 80 ? 'text-green-600' : 
                          run.avgAccuracy && run.avgAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {run.avgAccuracy ? `${run.avgAccuracy.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Questions:</span>
                        <span className="ml-1 font-medium">{run.successfulTests}/{run.totalQuestions}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResult1Id(run.id.toString())}
                        className="flex-1 text-xs"
                      >
                        Select as First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResult2Id(run.id.toString())}
                        className="flex-1 text-xs"
                        disabled={result1Id === run.id.toString()}
                      >
                        Select as Second
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}