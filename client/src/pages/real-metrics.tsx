import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Play, Zap, Clock, CheckCircle, XCircle, BarChart3, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentMetrics {
  agentType: string;
  totalTests: number;
  successfulTests: number;
  averageResponseTime: number;
  averageAccuracy: number;
  averageConfidence: number;
  successRate: number;
  lastUpdated: string;
}

export default function RealMetricsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  // Fetch real-time metrics
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<Record<string, AgentMetrics>>({
    queryKey: ["/api/metrics/dashboard"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Run single agent benchmark mutation
  const runAgentBenchmark = useMutation({
    mutationFn: async (agentType: string) => {
      return await apiRequest(`/api/benchmarks/${agentType}`, {
        method: "POST"
      });
    },
    onSuccess: (data, agentType) => {
      toast({
        title: "Benchmark Complete",
        description: `${agentType} agent benchmark completed with ${data.successfulTests}/${data.totalTests} successful tests`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/dashboard"] });
    },
    onError: (error: any) => {
      const message = error.message || "Benchmark failed";
      if (message.includes("OpenAI API key")) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key needed for real benchmarks. Please configure your API key.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Benchmark Failed",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  // Run all benchmarks mutation
  const runAllBenchmarks = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/benchmarks/all", {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "All Benchmarks Started",
        description: "Running comprehensive benchmarks for all agents. Results will appear as tests complete.",
      });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to start benchmarks";
      if (message.includes("OpenAI API key")) {
        toast({
          title: "API Key Required", 
          description: "OpenAI API key needed for real benchmarks. Please configure your API key.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Benchmarks Failed",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  const agents = [
    { id: "compliance", name: "Compliance Agent", icon: "🛡️", color: "bg-blue-500" },
    { id: "formulation", name: "Formulation Agent", icon: "🧪", color: "bg-green-500" },
    { id: "marketing", name: "Marketing Agent", icon: "📢", color: "bg-pink-500" },
    { id: "operations", name: "Operations Agent", icon: "⚙️", color: "bg-orange-500" },
    { id: "sourcing", name: "Sourcing Agent", icon: "🛒", color: "bg-teal-500" }
  ];

  const getMetrics = (agentId: string): AgentMetrics | null => {
    return dashboard?.[agentId] || null;
  };

  const hasRealData = dashboard && Object.values(dashboard).some(metrics => metrics.totalTests > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-formul8-text-primary mb-2">
          Real Performance Metrics
        </h1>
        <p className="text-formul8-text-secondary">
          Authentic benchmarking data collected from actual OpenAI API calls and cannabis industry test scenarios
        </p>
      </div>

      {/* Real vs Fake Data Explanation */}
      <Card className="mb-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Real vs Simulated Data
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📊 Previous Metrics (Simulated)</h4>
              <ul className="text-sm space-y-1">
                <li>• Static placeholder values</li>
                <li>• No actual API testing</li>
                <li>• Fictional response times</li>
                <li>• Estimated accuracy scores</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔬 Real Metrics (This Page)</h4>
              <ul className="text-sm space-y-1">
                <li>• Actual OpenAI API calls</li>
                <li>• Measured response times</li>
                <li>• Quality-assessed accuracy</li>
                <li>• Cannabis-specific test scenarios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="testing">Run Tests</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {!hasRealData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No real benchmark data available yet. Use the "Run Tests" tab to generate authentic performance metrics.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const metrics = getMetrics(agent.id);
              const hasData = metrics && metrics.totalTests > 0;

              return (
                <Card key={agent.id} className={hasData ? "border-green-200" : "border-gray-200"}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                        {agent.icon}
                      </div>
                      <Badge variant={hasData ? "default" : "secondary"}>
                        {hasData ? "Real Data" : "No Data"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>
                      {hasData ? `${metrics.totalTests} real tests completed` : "No benchmark data available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasData ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Success Rate</div>
                            <div className="font-medium">{metrics.successRate.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg Response</div>
                            <div className="font-medium">{metrics.averageResponseTime.toFixed(0)}ms</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Accuracy</div>
                            <div className="font-medium">{metrics.averageAccuracy.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Confidence</div>
                            <div className="font-medium">{metrics.averageConfidence.toFixed(1)}%</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Overall Performance</span>
                            <span>{((metrics.averageAccuracy + metrics.averageConfidence + metrics.successRate) / 3).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={(metrics.averageAccuracy + metrics.averageConfidence + metrics.successRate) / 3} 
                            className="h-2" 
                          />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Run benchmarks to see real data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Run Real Benchmarks
              </CardTitle>
              <CardDescription>
                Execute actual OpenAI API calls with cannabis industry test scenarios to collect authentic performance data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => runAllBenchmarks.mutate()}
                  disabled={runAllBenchmarks.isPending}
                  className="flex-1"
                >
                  {runAllBenchmarks.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running All Tests...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run All Agent Benchmarks
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/metrics/dashboard"] })}
                  disabled={dashboardLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="text-center">
                    <CardContent className="pt-6">
                      <div className={`w-8 h-8 ${agent.color} rounded-lg flex items-center justify-center text-white mx-auto mb-2`}>
                        {agent.icon}
                      </div>
                      <h4 className="font-medium mb-2">{agent.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAgentBenchmark.mutate(agent.id)}
                        disabled={runAgentBenchmark.isPending}
                        className="w-full"
                      >
                        {runAgentBenchmark.isPending && selectedAgent === agent.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Run Test"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Real benchmarks make actual OpenAI API calls and may take 1-3 minutes per agent. 
                  Results include measured response times, accuracy assessments, and cannabis industry-specific test scenarios.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real Metrics Setup</CardTitle>
              <CardDescription>
                Configure your environment for authentic performance measurement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Requirements for Real Metrics:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>OpenAI API Key (for actual model calls)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Database connection (for storing results)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Cannabis industry test scenarios</span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Key Required:</strong> To run real benchmarks, you need to configure your OpenAI API key. 
                    Without it, the system will only show placeholder data.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Test Categories Include:</h5>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Regulatory compliance analysis</li>
                    <li>• Cannabinoid ratio calculations</li>
                    <li>• Marketing compliance validation</li>
                    <li>• Operations optimization</li>
                    <li>• Vendor evaluation processes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}