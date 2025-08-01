import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ExternalLink, 
  Settings, 
  Play, 
  Code, 
  Database, 
  Brain, 
  GitBranch, 
  Zap, 
  AlertTriangle,
  BarChart3,
  TestTube,
  MessageSquare,
  Cpu,
  Globe,
  BookOpen,
  Search
} from "lucide-react";
import Sidebar from "@/components/sidebar";

interface AgentMode {
  mode: string;
  name: string;
  description: string;
  ragEnabled: boolean;
  kbEnabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
}

interface BaselineTestSummary {
  agentId: string;
  agentType: string;
  mode: string;
  totalQuestions: number;
  totalScore: number;
  maxPossibleScore: number;
  averageAccuracy: number;
  averageConfidence: number;
  averageResponseTime: number;
  performanceScore: number;
  timestamp: string;
}

interface VoiceFlowAgent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  knowledgeBaseEnabled: boolean;
  pathTools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

const AGENT_TYPES = [
  'compliance',
  'formulation', 
  'marketing',
  'operations',
  'patent',
  'sourcing',
  'science',
  'spectra'
];

const MODE_ICONS = {
  voiceflow: Globe,
  raw: Cpu,
  prompt: MessageSquare,
  prompt_rag: Search,
  prompt_rag_kb: BookOpen
};

export default function AgentModesDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string>('compliance');
  const [selectedMode, setSelectedMode] = useState<string>('prompt');
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isComparingModes, setIsComparingModes] = useState(false);

  // Fetch agent modes
  const { data: agentModes, isLoading: modesLoading } = useQuery({
    queryKey: ['agent-modes', selectedAgent],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/agent-modes/${selectedAgent}/modes`);
      const data = await response.json();
      return data.modes as AgentMode[];
    },
    enabled: isAuthenticated && !!selectedAgent,
  });

  // Fetch VoiceFlow agents
  const { data: voiceflowAgents } = useQuery({
    queryKey: ['voiceflow-agents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/agent-modes/voiceflow/agents');
      const data = await response.json();
      return data.agents as VoiceFlowAgent[];
    },
    enabled: isAuthenticated,
  });

  // Fetch VoiceFlow mapping
  const { data: voiceflowMapping } = useQuery({
    queryKey: ['voiceflow-mapping'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/agent-modes/voiceflow/mapping');
      const data = await response.json();
      return data.mapping as Record<string, string>;
    },
    enabled: isAuthenticated,
  });

  // Fetch baseline questions
  const { data: baselineQuestions } = useQuery({
    queryKey: ['baseline-questions', selectedAgent],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/agent-modes/${selectedAgent}/baseline-questions`);
      const data = await response.json();
      return data.questions;
    },
    enabled: isAuthenticated && !!selectedAgent,
  });

  // Fetch test results
  const { data: testResults } = useQuery({
    queryKey: ['test-results', selectedAgent],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/agent-modes/${selectedAgent}/test-results?agentId=${selectedAgent}`);
      const data = await response.json();
      return data;
    },
    enabled: isAuthenticated && !!selectedAgent,
  });

  // Test agent query
  const testQueryMutation = useMutation({
    mutationFn: async ({ query, mode }: { query: string; mode: string }) => {
      const response = await apiRequest('POST', `/api/agent-modes/${selectedAgent}/query`, { query, mode });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setTestResponse(data.response);
      toast({
        title: "Query Tested",
        description: `Response received in ${data.performanceMetrics?.responseTime}ms`,
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Failed to test agent query",
        variant: "destructive",
      });
    },
  });

  // Run baseline test
  const runBaselineTestMutation = useMutation({
    mutationFn: async ({ mode }: { mode: string }) => {
      const response = await apiRequest('POST', `/api/agent-modes/${selectedAgent}/baseline-test`, { mode, agentId: selectedAgent });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Baseline Test Complete",
        description: `Performance Score: ${data.summary.performanceScore.toFixed(1)}%`,
      });
      queryClient.invalidateQueries({ queryKey: ['test-results', selectedAgent] });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Failed to run baseline test",
        variant: "destructive",
      });
    },
  });

  // Compare modes
  const compareModesMutation = useMutation({
    mutationFn: async ({ modes }: { modes: string[] }) => {
      const response = await apiRequest('POST', `/api/agent-modes/${selectedAgent}/compare-modes`, { modes, agentId: selectedAgent });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Mode Comparison Complete",
        description: `Best mode: ${data.comparison.bestMode} (${data.comparison.bestScore.toFixed(1)}%)`,
      });
      queryClient.invalidateQueries({ queryKey: ['test-results', selectedAgent] });
    },
    onError: (error) => {
      toast({
        title: "Comparison Failed",
        description: "Failed to compare modes",
        variant: "destructive",
      });
    },
  });

  const handleTestQuery = () => {
    if (!testQuery.trim()) return;
    testQueryMutation.mutate({ query: testQuery, mode: selectedMode });
  };

  const handleRunBaselineTest = () => {
    setIsRunningTest(true);
    runBaselineTestMutation.mutate(
      { mode: selectedMode },
      {
        onSettled: () => setIsRunningTest(false),
      }
    );
  };

  const handleCompareModes = () => {
    if (!agentModes) return;
    setIsComparingModes(true);
    const activeModes = agentModes.filter(mode => mode.active).map(mode => mode.mode);
    compareModesMutation.mutate(
      { modes: activeModes },
      {
        onSettled: () => setIsComparingModes(false),
      }
    );
  };

  const getModeIcon = (mode: string) => {
    const IconComponent = MODE_ICONS[mode as keyof typeof MODE_ICONS] || Cpu;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access the Agent Modes Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Modes Dashboard</h1>
            <p className="text-gray-600">
              Manage and test different modes for each agent including VoiceFlow integration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Agent Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Agent Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        <span className="capitalize">{agent}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Mode Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentModes?.map((mode) => (
                      <SelectItem key={mode.mode} value={mode.mode}>
                        <div className="flex items-center gap-2">
                          {getModeIcon(mode.mode)}
                          {mode.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleRunBaselineTest}
                  disabled={isRunningTest}
                  className="w-full"
                  size="sm"
                >
                  {isRunningTest ? (
                    <>Running Test...</>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Baseline Test
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleCompareModes}
                  disabled={isComparingModes}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {isComparingModes ? (
                    <>Comparing...</>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Compare All Modes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* VoiceFlow Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  VoiceFlow Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Agents Available:</span>
                    <Badge variant="secondary">
                      {voiceflowAgents?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mapping Status:</span>
                    <Badge variant={voiceflowMapping ? "default" : "destructive"}>
                      {voiceflowMapping ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Mode Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Mode Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {agentModes && (
                  <div className="space-y-4">
                    {agentModes.map((mode) => (
                      <div key={mode.mode} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getModeIcon(mode.mode)}
                            <h3 className="font-semibold">{mode.name}</h3>
                          </div>
                          <Badge variant={mode.active ? "default" : "secondary"}>
                            {mode.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Model: {mode.model}</div>
                          <div>Temp: {mode.temperature}</div>
                          <div>Max Tokens: {mode.maxTokens}</div>
                          <div className="flex items-center gap-1">
                            RAG: {mode.ragEnabled ? "✓" : "✗"}
                          </div>
                          <div className="flex items-center gap-1">
                            KB: {mode.kbEnabled ? "✓" : "✗"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Test Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="test-query">Test Query</Label>
                    <Textarea
                      id="test-query"
                      placeholder="Enter a test query..."
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleTestQuery}
                    disabled={!testQuery.trim() || testQueryMutation.isPending}
                    className="w-full"
                  >
                    {testQueryMutation.isPending ? "Testing..." : "Test Query"}
                  </Button>
                  {testResponse && (
                    <div className="mt-4">
                      <Label>Response</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {testResponse}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Results */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Performance Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
                  <TabsTrigger value="comparison">Mode Comparison</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {testResults?.summary && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {testResults.summary.performanceScore.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Performance Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {testResults.summary.averageAccuracy.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Average Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {testResults.summary.averageResponseTime.toFixed(0)}ms
                          </div>
                          <div className="text-sm text-gray-600">Avg Response Time</div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="mt-4">
                  <div className="space-y-4">
                    {testResults?.results?.map((result: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Question {index + 1}</h4>
                          <Badge className={getPerformanceBadgeColor(result.accuracy)}>
                            {result.accuracy.toFixed(1)}% Accuracy
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.response}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>Score: {result.score}/{result.maxScore}</div>
                          <div>Confidence: {result.confidence.toFixed(1)}%</div>
                          <div>Time: {result.responseTime}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comparison" className="mt-4">
                  <div className="space-y-4">
                    {testResults?.comparison?.modeRankings?.map((ranking: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getModeIcon(ranking.mode)}
                          <span className="font-medium capitalize">{ranking.mode.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={ranking.score} className="w-24" />
                          <span className="text-sm font-medium">{ranking.score.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 