import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button,
} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Play, Eye, Edit, Save, Filter, RefreshCw, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { CostDisplay, TokenBreakdown } from "@/components/ui/cost-display";
import { ResultComparison } from "@/components/ui/result-comparison";
import { BaselineEditor } from "@/components/ui/baseline-editor";

interface BaselineTestRun {
  id: number;
  agentType: string;
  model: string;
  state?: string;
  ragEnabled: boolean;
  toolsEnabled: boolean;
  kbEnabled: boolean;
  customPrompt?: string;
  status: string;
  totalQuestions?: number;
  successfulTests?: number;
  failedTests?: number;
  avgAccuracy?: number;
  avgConfidence?: number;
  avgResponseTime?: number;
  createdAt: string;
  completedAt?: string;
}

interface BaselineTestResult {
  id: number;
  runId: number;
  questionId: string;
  question: string;
  expectedAnswer?: string;
  agentResponse?: string;
  accuracy?: number;
  confidence?: number;
  responseTime?: number;
  category?: string;
  difficulty?: string;
  maxScore: number;
  manualGrade?: number;
  manualFeedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  aiGrade?: number;
  aiFeedback?: string;
  aiGradedAt?: string;
  aiGradingModel?: string;
  // Token and cost tracking
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  aiGradingInputTokens?: number;
  aiGradingOutputTokens?: number;
  aiGradingTotalTokens?: number;
  aiGradingEstimatedCost?: number;
  createdAt: string;
}

export default function BaselineTestingPage() {
  const [selectedTab, setSelectedTab] = useState("new-test");
  const [comparisonResultA, setComparisonResultA] = useState<BaselineTestResult | undefined>();
  const [comparisonResultB, setComparisonResultB] = useState<BaselineTestResult | undefined>();
  const [baselineEditorOpen, setBaselineEditorOpen] = useState(false);
  const [selectedAgentForEditor, setSelectedAgentForEditor] = useState<string>("");
  const [testConfig, setTestConfig] = useState({
    agentType: "",
    model: "gpt-4o",
    state: "",
    ragEnabled: false,
    toolsEnabled: false,
    kbEnabled: false,
    customPrompt: "",
  });
  const [filters, setFilters] = useState({
    agentType: "",
    model: "",
    status: "",
  });
  const [selectedRun, setSelectedRun] = useState<BaselineTestRun | null>(null);
  const [editingResult, setEditingResult] = useState<BaselineTestResult | null>(null);
  const [gradingData, setGradingData] = useState({
    manualGrade: 0,
    manualFeedback: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available options
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/baseline-testing/agents"],
  });

  const { data: models = [] } = useQuery({
    queryKey: ["/api/baseline-testing/models"],
  });

  const { data: states = [] } = useQuery({
    queryKey: ["/api/baseline-testing/states"],
  });

  // Fetch test runs
  const { data: testRuns = [], refetch: refetchRuns } = useQuery({
    queryKey: ["/api/baseline-testing/runs", filters],
    queryFn: () => apiRequest(`/api/baseline-testing/runs?${new URLSearchParams(filters)}`),
  });

  // Fetch results for selected run
  const { data: testResults = [] } = useQuery({
    queryKey: ["/api/baseline-testing/runs", selectedRun?.id, "results"],
    queryFn: () => apiRequest(`/api/baseline-testing/runs/${selectedRun?.id}/results`),
    enabled: !!selectedRun,
  });

  // Mutations
  const createRunMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/baseline-testing/runs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (run) => {
      toast({
        title: "Test Created",
        description: `Baseline test run created with ID: ${run.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-testing/runs"] });
      setSelectedTab("runs");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test run",
        variant: "destructive",
      });
    },
  });

  const startTestMutation = useMutation({
    mutationFn: (runId: number) => apiRequest(`/api/baseline-testing/runs/${runId}/start`, {
      method: "POST",
    }),
    onSuccess: () => {
      toast({
        title: "Test Started",
        description: "Baseline test is now running in the background",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-testing/runs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start test",
        variant: "destructive",
      });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/baseline-testing/results/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Result Updated",
        description: "Manual grading saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-testing/runs"] });
      setEditingResult(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update result",
        variant: "destructive",
      });
    },
  });

  const aiGradeMutation = useMutation({
    mutationFn: ({ runId, gradeAll }: { runId?: number; gradeAll?: boolean }) => 
      apiRequest("/api/baseline-testing/ai-grade", {
        method: "POST",
        body: JSON.stringify({ runId, gradeAll }),
      }),
    onSuccess: () => {
      toast({
        title: "AI Grading Started",
        description: "AI grading is running in the background",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-testing/runs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start AI grading",
        variant: "destructive",
      });
    },
  });

  const handleCreateRun = () => {
    if (!testConfig.agentType) {
      toast({
        title: "Error", 
        description: "Please select an agent",
        variant: "destructive",
      });
      return;
    }
    createRunMutation.mutate(testConfig);
  };

  const handleStartTest = (runId: number) => {
    startTestMutation.mutate(runId);
  };

  const handleGradeResult = (result: BaselineTestResult) => {
    setEditingResult(result);
    setGradingData({
      manualGrade: result.manualGrade || 0,
      manualFeedback: result.manualFeedback || "",
    });
  };

  const handleSaveGrade = () => {
    if (!editingResult) return;
    updateResultMutation.mutate({
      id: editingResult.id,
      data: gradingData,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "running": return "bg-blue-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "basic": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Baseline Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Run comprehensive baseline tests and perform manual grading
          </p>
        </div>
        <Button 
          onClick={() => refetchRuns()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="new-test">New Test</TabsTrigger>
          <TabsTrigger value="runs">Test Runs</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="grading">Manual Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="new-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Baseline Test</CardTitle>
              <CardDescription>
                Configure and run a new baseline test for any agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select value={testConfig.agentType} onValueChange={(value) => 
                    setTestConfig(prev => ({ ...prev, agentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent: string) => (
                        <SelectItem key={agent} value={agent}>
                          {agent.replace('-agent', '').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={testConfig.model} onValueChange={(value) => 
                    setTestConfig(prev => ({ ...prev, model: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model: any) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {model.provider === "local" && (
                              <div className="flex items-center gap-1">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    model.local_available ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                />
                                <span className="text-xs text-gray-500">
                                  {model.model_size}
                                </span>
                              </div>
                            )}
                            {model.cost_per_1k_tokens === 0 && (
                              <Badge variant="secondary" className="text-xs">FREE</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State (optional)</Label>
                  <Select value={testConfig.state} onValueChange={(value) => 
                    setTestConfig(prev => ({ ...prev, state: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: string) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Configuration Options</Label>
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rag"
                      checked={testConfig.ragEnabled}
                      onCheckedChange={(checked) => 
                        setTestConfig(prev => ({ ...prev, ragEnabled: !!checked }))
                      }
                    />
                    <Label htmlFor="rag">Enable RAG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="tools"
                      checked={testConfig.toolsEnabled}
                      onCheckedChange={(checked) => 
                        setTestConfig(prev => ({ ...prev, toolsEnabled: !!checked }))
                      }
                    />
                    <Label htmlFor="tools">Enable Tools</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="kb"
                      checked={testConfig.kbEnabled}
                      onCheckedChange={(checked) => 
                        setTestConfig(prev => ({ ...prev, kbEnabled: !!checked }))
                      }
                    />
                    <Label htmlFor="kb">Enable Knowledge Base</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt">Custom Prompt (optional)</Label>
                <Textarea 
                  id="customPrompt"
                  placeholder="Enter custom system prompt..."
                  value={testConfig.customPrompt}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, customPrompt: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleCreateRun}
                disabled={createRunMutation.isPending}
                className="w-full"
              >
                {createRunMutation.isPending ? "Creating..." : "Create Test Run"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Baseline Test Runs</CardTitle>
              <CardDescription>
                View and manage all baseline test runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select value={filters.agentType} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, agentType: value }))
                  }>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All agents</SelectItem>
                      {agents.map((agent: string) => (
                        <SelectItem key={agent} value={agent}>
                          {agent.replace('-agent', '').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.model} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, model: value }))
                  }>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All models</SelectItem>
                      {models.map((model: string) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testRuns.map((run: BaselineTestRun) => (
                      <TableRow key={run.id}>
                        <TableCell>{run.id}</TableCell>
                        <TableCell>
                          {run.agentType.replace('-agent', '').toUpperCase()}
                          {run.state && <Badge variant="outline" className="ml-2">{run.state}</Badge>}
                        </TableCell>
                        <TableCell>{run.model}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(run.status)}>
                              {run.status}
                            </Badge>
                            {run.status === 'completed' && (
                              <Link href={`/agent/${run.agentType}/baseline-${run.state ? `${run.state}-` : ''}${run.model?.replace('/', '-') || run.id}`}>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  View Results
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {run.totalQuestions ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => {
                                setSelectedAgentForEditor(run.agentType);
                                setBaselineEditorOpen(true);
                              }}
                            >
                              {run.successfulTests}/{run.totalQuestions}
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {run.avgAccuracy ? `${run.avgAccuracy.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(run.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {run.status === 'running' ? (
                            <Badge variant="secondary">Running...</Badge>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartTest(run.id)}
                                disabled={startTestMutation.isPending}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRun(run)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {selectedRun ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Test Results - Run #{selectedRun.id}</CardTitle>
                    <CardDescription>
                      {selectedRun.agentType.replace('-agent', '').toUpperCase()} • {selectedRun.model}
                      {selectedRun.state && ` • ${selectedRun.state}`}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => aiGradeMutation.mutate({ runId: selectedRun.id })}
                    disabled={aiGradeMutation.isPending}
                    variant="outline"
                    className="gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    {aiGradeMutation.isPending ? "AI Grading..." : "AI Grade All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Grades</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((result: BaselineTestResult) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.questionId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(result.difficulty)}>
                            {result.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.accuracy ? `${result.accuracy.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {result.manualGrade !== null ? `Manual: ${result.manualGrade}/${result.maxScore}` : 'Manual: Not graded'}
                            </div>
                            <div className="text-sm text-blue-600">
                              {result.aiGrade !== null ? (
                                <div className="space-y-1">
                                  <span>AI: {result.aiGrade}/{result.maxScore}</span>
                                  {result.aiGradingConfidence && (
                                    <div className="text-xs text-gray-500">
                                      Confidence: {result.aiGradingConfidence}%
                                    </div>
                                  )}
                                </div>
                              ) : 'AI: Not graded'}
                            </div>
                            {result.confidence && (
                              <div className="text-xs text-green-600">
                                Model Confidence: {result.confidence.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <CostDisplay 
                              cost={result.estimatedCost || 0} 
                              tokens={result.totalTokens}
                              variant="outline"
                            />
                            {result.aiGradingEstimatedCost && (
                              <CostDisplay 
                                cost={result.aiGradingEstimatedCost} 
                                tokens={result.aiGradingTotalTokens}
                                variant="secondary"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGradeResult(result)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Grade Question - {result.questionId}</DialogTitle>
                                <DialogDescription>
                                  Review the question, expected answer, and agent response
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Question</Label>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{result.question}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Expected Answer</Label>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{result.expectedAnswer}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Agent Response</Label>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{result.agentResponse}</p>
                                </div>
                                {result.aiGrade !== null && (
                                  <div>
                                    <Label className="text-sm font-medium">AI Grading</Label>
                                    <div className="bg-blue-50 p-3 rounded space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">AI Grade: {result.aiGrade}/{result.maxScore}</span>
                                        <div className="flex gap-2">
                                          {result.aiGradingConfidence && (
                                            <Badge variant="secondary" className="text-xs">
                                              {result.aiGradingConfidence}% confidence
                                            </Badge>
                                          )}
                                          <Badge variant="outline">{result.aiGradingModel}</Badge>
                                        </div>
                                      </div>
                                      {result.aiFeedback && (
                                        <p className="text-sm text-gray-700">{result.aiFeedback}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="grade">Manual Grade (0-{result.maxScore})</Label>
                                    <Input
                                      id="grade"
                                      type="number"
                                      min="0"
                                      max={result.maxScore}
                                      value={gradingData.manualGrade}
                                      onChange={(e) => setGradingData(prev => ({ 
                                        ...prev, 
                                        manualGrade: parseInt(e.target.value) 
                                      }))}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="feedback">Manual Feedback</Label>
                                  <Textarea
                                    id="feedback"
                                    value={gradingData.manualFeedback}
                                    onChange={(e) => setGradingData(prev => ({ 
                                      ...prev, 
                                      manualFeedback: e.target.value 
                                    }))}
                                    rows={4}
                                    placeholder="Enter detailed feedback..."
                                  />
                                </div>
                                <Button onClick={handleSaveGrade} className="w-full">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Grade
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Select a test run from the "Test Runs" tab to view results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <ResultComparison
            results={selectedRunResults}
            selectedResultA={comparisonResultA}
            selectedResultB={comparisonResultB}
            onResultAChange={setComparisonResultA}
            onResultBChange={setComparisonResultB}
          />
        </TabsContent>

        <TabsContent value="grading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Grading</CardTitle>
              <CardDescription>
                Review and grade test results across all runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Manual grading interface - select results from the Results tab to grade individual questions
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Baseline Editor Modal */}
      <BaselineEditor
        agentType={selectedAgentForEditor}
        isOpen={baselineEditorOpen}
        onClose={() => {
          setBaselineEditorOpen(false);
          setSelectedAgentForEditor("");
        }}
      />
    </div>
  );
}