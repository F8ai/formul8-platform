import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BaselineResult {
  agentName: string;
  passed: number;
  total: number;
  accuracy: number;
  confidence: number;
  lastUpdated: string;
  status: 'success' | 'failure' | 'running' | 'pending';
  badges: {
    accuracy: string;
    tests: string;
    confidence: string;
    status: string;
  };
}

interface BaselineMetrics {
  totalAgents: number;
  activeAgents: number;
  averageAccuracy: number;
  averageConfidence: number;
  lastRunTime: string;
  results: BaselineResult[];
}

const BaselineManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch baseline status
  const { data: metrics, isLoading, error } = useQuery<BaselineMetrics>({
    queryKey: ['/api/baselines/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Trigger all baselines mutation
  const triggerAllMutation = useMutation({
    mutationFn: async () => apiRequest('/api/baselines/trigger', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "Baseline Tests Triggered",
        description: `Successfully triggered ${data.triggered?.length || 0} agents`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/baselines/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to trigger baseline tests",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failure':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatAgentName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading baseline metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Error Loading Baseline Data</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Unable to fetch baseline metrics. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Baseline Test Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and control automated baseline testing across all agents
          </p>
        </div>
        <Button
          onClick={() => triggerAllMutation.mutate()}
          disabled={triggerAllMutation.isPending}
          className="flex items-center gap-2"
        >
          {triggerAllMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Trigger All Tests
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAgents || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.activeAgents || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageAccuracy?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.averageConfidence * 100)?.toFixed(0) || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Details</TabsTrigger>
          <TabsTrigger value="badges">Badge Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.results?.map((result) => (
                  <Card key={result.agentName} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{formatAgentName(result.agentName)}</CardTitle>
                        {getStatusIcon(result.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Accuracy</span>
                          <span className="font-medium">{result.accuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={result.accuracy} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confidence</span>
                          <span className="font-medium">{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={result.confidence * 100} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{result.passed}/{result.total} tests</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.results?.map((result) => (
                  <div key={result.agentName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium">{formatAgentName(result.agentName)}</h3>
                        <p className="text-sm text-gray-500">
                          Last updated: {new Date(result.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{result.accuracy.toFixed(1)}% accuracy</div>
                        <div className="text-xs text-gray-500">{result.passed}/{result.total} tests passed</div>
                      </div>
                      
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Badges</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy these badge URLs for use in README files
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics?.results?.map((result) => (
                  <div key={result.agentName} className="space-y-3">
                    <h3 className="font-medium">{formatAgentName(result.agentName)}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Accuracy Badge</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <img src={result.badges.accuracy} alt="Accuracy Badge" className="h-5" />
                          <input
                            type="text"
                            value={result.badges.accuracy}
                            readOnly
                            className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500">Tests Badge</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <img src={result.badges.tests} alt="Tests Badge" className="h-5" />
                          <input
                            type="text"
                            value={result.badges.tests}
                            readOnly
                            className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500">Confidence Badge</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <img src={result.badges.confidence} alt="Confidence Badge" className="h-5" />
                          <input
                            type="text"
                            value={result.badges.confidence}
                            readOnly
                            className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-500">Status Badge</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <img src={result.badges.status} alt="Status Badge" className="h-5" />
                          <input
                            type="text"
                            value={result.badges.status}
                            readOnly
                            className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BaselineManagement;