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
import { ExternalLink, Settings, Play, Code, Database, Brain, GitBranch, Zap, AlertTriangle } from "lucide-react";
import Sidebar from "@/components/sidebar";

interface Agent {
  name: string;
  type: string;
  repository: string;
  description: string;
  status: 'active' | 'inactive' | 'development';
  performance: {
    baseline: number;
    confidence: number;
    accuracy: number;
    speed: number;
  };
  configuration: {
    prompt: string;
    tools: string[];
    ragEnabled: boolean;
    model: string;
  };
  lastUpdated: string;
}

interface BaselineQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  expectedResponse: string;
  maxPoints: number;
}

export default function AgentsDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [newTool, setNewTool] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<BaselineQuestion[]>([]);

  // Fetch agents data
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ["/api/agents/dashboard"],
    enabled: isAuthenticated,
  });

  // Fetch baseline exam data
  const { data: baselineData } = useQuery({
    queryKey: ["/api/baseline-exam/results"],
    enabled: isAuthenticated,
  });

  // Update agent configuration
  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentType, updates }: { agentType: string; updates: any }) => {
      return await apiRequest(`/api/agents/${agentType}/configure`, {
        method: "POST",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/dashboard"] });
      toast({
        title: "Configuration Updated",
        description: "Agent configuration has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update agent configuration",
        variant: "destructive",
      });
    },
  });

  // Run baseline exam
  const runBaselineMutation = useMutation({
    mutationFn: async (agentType: string) => {
      return await apiRequest(`/api/baseline-exam/run/${agentType}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-exam/results"] });
      toast({
        title: "Baseline Exam Started",
        description: "Baseline examination is running in the background",
      });
    },
    onError: (error) => {
      toast({
        title: "Exam Failed",
        description: "Failed to start baseline examination",
        variant: "destructive",
      });
    },
  });

  // Trigger GitHub Action
  const triggerGitHubMutation = useMutation({
    mutationFn: async (agentType: string) => {
      return await apiRequest(`/api/baseline-exam/trigger-github-action/${agentType}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "GitHub Action Triggered",
        description: "Repository workflow has been triggered",
      });
    },
    onError: (error) => {
      toast({
        title: "Trigger Failed",
        description: "Failed to trigger GitHub Action",
        variant: "destructive",
      });
    },
  });

  // Run all baselines mutation
  const runAllBaselinesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/baseline-exam/run-all', {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-exam/results"] });
      toast({
        title: "All Baselines Complete",
        description: `Baseline exams completed for ${data.results?.length || 9} agents`,
      });
    },
    onError: (error) => {
      toast({
        title: "Baseline Failed",
        description: "Failed to run baseline exams for all agents",
        variant: "destructive",
      });
    },
  });

  // Self-assessment mutation
  const selfAssessMutation = useMutation({
    mutationFn: async (agentType: string) => {
      return await apiRequest(`/api/baseline-exam/self-assess/${agentType}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Self-Assessment Complete",
        description: "Agent has analyzed its performance and created improvement issues",
      });
    },
    onError: (error) => {
      toast({
        title: "Assessment Failed",
        description: "Failed to conduct self-assessment",
        variant: "destructive",
      });
    },
  });

  const handlePromptSave = () => {
    if (!selectedAgent) return;
    
    updateAgentMutation.mutate({
      agentType: selectedAgent.type,
      updates: { prompt: promptContent }
    });
    setEditingPrompt(false);
  };

  const handleAddTool = () => {
    if (!selectedAgent || !newTool.trim()) return;
    
    const updatedTools = [...selectedAgent.configuration.tools, newTool.trim()];
    updateAgentMutation.mutate({
      agentType: selectedAgent.type,
      updates: { tools: updatedTools }
    });
    setNewTool("");
  };

  const handleToggleRAG = () => {
    if (!selectedAgent) return;
    
    updateAgentMutation.mutate({
      agentType: selectedAgent.type,
      updates: { ragEnabled: !selectedAgent.configuration.ragEnabled }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'development': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (agentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-formul8-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">F8</span>
          </div>
          <p className="text-formul8-gray">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-formul8-dark">AI Agents Dashboard</h2>
              <Badge className="bg-blue-100 text-blue-800">
                {agents?.length || 0} Agents
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => runAllBaselinesMutation.mutate()}
                disabled={runAllBaselinesMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {runAllBaselinesMutation.isPending ? "Running..." : "Run All Baselines"}
              </Button>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/agents/dashboard"] })}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agents?.map((agent: Agent) => (
                      <div
                        key={agent.type}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAgent?.type === agent.type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getPerformanceColor(agent.performance.baseline)}`}>
                            {agent.performance.baseline}% of {agent.performance.corpusSize}
                          </span>
                          <a
                            href={`https://github.com/F8ai/${agent.repository}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Details */}
            <div className="lg:col-span-2">
              {selectedAgent ? (
                <div className="space-y-6">
                  {/* Agent Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedAgent.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => runBaselineMutation.mutate(selectedAgent.type)}
                            disabled={runBaselineMutation.isPending}
                            size="sm"
                            variant="outline"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {runBaselineMutation.isPending ? "Running..." : "Run Baseline"}
                          </Button>
                          <Button
                            onClick={() => triggerGitHubMutation.mutate(selectedAgent.type)}
                            disabled={triggerGitHubMutation.isPending}
                            size="sm"
                            variant="outline"
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            {triggerGitHubMutation.isPending ? "Triggering..." : "GitHub Action"}
                          </Button>
                          <Button
                            onClick={() => selfAssessMutation.mutate(selectedAgent.type)}
                            disabled={selfAssessMutation.isPending}
                            size="sm"
                            variant="outline"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {selfAssessMutation.isPending ? "Assessing..." : "Self-Assess"}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(selectedAgent.performance.baseline)}`}>
                            {selectedAgent.performance.baseline}%
                          </div>
                          <div className="text-sm text-gray-600">Baseline</div>
                          <div className="text-xs text-gray-500">
                            {selectedAgent.performance.corpusSize > 0 
                              ? `${selectedAgent.performance.corpusSize} questions`
                              : 'No baseline data'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(selectedAgent.performance.confidence)}`}>
                            {selectedAgent.performance.confidence}%
                          </div>
                          <div className="text-sm text-gray-600">Confidence</div>
                          <div className="text-xs text-gray-500">
                            {selectedAgent.performance.lastExamDate 
                              ? new Date(selectedAgent.performance.lastExamDate).toLocaleDateString()
                              : 'No exam data'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(selectedAgent.performance.accuracy)}`}>
                            {selectedAgent.performance.accuracy}%
                          </div>
                          <div className="text-sm text-gray-600">Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(selectedAgent.performance.speed)}`}>
                            {selectedAgent.performance.speed}%
                          </div>
                          <div className="text-sm text-gray-600">Speed</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Repository: <a href={`https://github.com/F8ai/${selectedAgent.repository}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{selectedAgent.repository}</a>
                      </div>
                      <div className="text-sm text-gray-600">
                        Last Updated: {new Date(selectedAgent.lastUpdated).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration Tabs */}
                  <Card>
                    <CardContent className="p-0">
                      <Tabs defaultValue="prompt" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="prompt">Prompt Engineering</TabsTrigger>
                          <TabsTrigger value="tools">Tools</TabsTrigger>
                          <TabsTrigger value="rag">RAG System</TabsTrigger>
                          <TabsTrigger value="baseline">Baseline Exam</TabsTrigger>
                          <TabsTrigger value="assessment">Self-Assessment</TabsTrigger>
                        </TabsList>

                        <TabsContent value="prompt" className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">System Prompt</h3>
                              <Button
                                onClick={() => {
                                  setEditingPrompt(true);
                                  setPromptContent(selectedAgent.configuration.prompt);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                            
                            {editingPrompt ? (
                              <div className="space-y-4">
                                <Textarea
                                  value={promptContent}
                                  onChange={(e) => setPromptContent(e.target.value)}
                                  rows={8}
                                  placeholder="Enter system prompt..."
                                  className="font-mono text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <Button onClick={handlePromptSave} size="sm">
                                    Save Changes
                                  </Button>
                                  <Button onClick={() => setEditingPrompt(false)} size="sm" variant="outline">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {selectedAgent.configuration.prompt}
                                </pre>
                              </div>
                            )}
                            
                            <div className="mt-4">
                              <Label>Model Configuration</Label>
                              <Select value={selectedAgent.configuration.model} onValueChange={(value) => updateAgentMutation.mutate({
                                agentType: selectedAgent.type,
                                updates: { model: value }
                              })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="o3">OpenAI o3</SelectItem>
                                  <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="tools" className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Available Tools</h3>
                              <span className="text-sm text-gray-600">
                                {selectedAgent.configuration.tools.length} tools
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {selectedAgent.configuration.tools.map((tool, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Code className="h-4 w-4 text-gray-600" />
                                    <span className="font-mono text-sm">{tool}</span>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      const updatedTools = selectedAgent.configuration.tools.filter((_, i) => i !== index);
                                      updateAgentMutation.mutate({
                                        agentType: selectedAgent.type,
                                        updates: { tools: updatedTools }
                                      });
                                    }}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Input
                                value={newTool}
                                onChange={(e) => setNewTool(e.target.value)}
                                placeholder="Tool name or function"
                                className="flex-1"
                              />
                              <Button onClick={handleAddTool} size="sm">
                                Add Tool
                              </Button>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="rag" className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">RAG System</h3>
                              <Button
                                onClick={handleToggleRAG}
                                size="sm"
                                variant={selectedAgent.configuration.ragEnabled ? "default" : "outline"}
                              >
                                <Database className="h-4 w-4 mr-2" />
                                {selectedAgent.configuration.ragEnabled ? "Enabled" : "Disabled"}
                              </Button>
                            </div>
                            
                            {selectedAgent.configuration.ragEnabled ? (
                              <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-green-800">RAG System Active</span>
                                  </div>
                                  <p className="text-sm text-green-700">
                                    This agent has access to specialized knowledge base and can retrieve relevant information to enhance responses.
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700">Documents Indexed</div>
                                    <div className="text-2xl font-bold text-gray-900">1,247</div>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700">Last Updated</div>
                                    <div className="text-2xl font-bold text-gray-900">2h ago</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  RAG system is disabled. This agent relies on its training data and configured tools only.
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="baseline" className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Baseline Examination</h3>
                              <Button
                                onClick={() => runBaselineMutation.mutate(selectedAgent.type)}
                                disabled={runBaselineMutation.isPending}
                                size="sm"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                {runBaselineMutation.isPending ? "Running..." : "Run Exam"}
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Overall Performance</Label>
                                <Progress value={selectedAgent.performance.baseline} className="mt-2" />
                                <div className="text-sm text-gray-600 mt-1">
                                  {selectedAgent.performance.baseline}% baseline score
                                </div>
                              </div>
                              <div>
                                <Label>Confidence Level</Label>
                                <Progress value={selectedAgent.performance.confidence} className="mt-2" />
                                <div className="text-sm text-gray-600 mt-1">
                                  {selectedAgent.performance.confidence}% confidence
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2">Recent Exam Results</div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Accuracy Score</span>
                                  <span>{selectedAgent.performance.accuracy}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Speed Score</span>
                                  <span>{selectedAgent.performance.speed}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Last Examination</span>
                                  <span>{new Date(selectedAgent.lastUpdated).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="assessment" className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Self-Assessment</h3>
                              <Button
                                onClick={() => selfAssessMutation.mutate(selectedAgent.type)}
                                disabled={selfAssessMutation.isPending}
                                size="sm"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {selfAssessMutation.isPending ? "Assessing..." : "Run Assessment"}
                              </Button>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-blue-800">AI Self-Improvement</span>
                              </div>
                              <p className="text-sm text-blue-700">
                                The agent analyzes its baseline performance and automatically creates GitHub issues for identified improvements, 
                                including new baseline questions to test the enhancements.
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-gray-700">Assessment Areas:</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Code className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">Tool Requirements</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Database className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">Data Gaps</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Settings className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">Prompt Optimization</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <Zap className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">Performance Issues</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2">Latest Assessment</div>
                              <div className="text-sm text-gray-600">
                                Click "Run Assessment" to analyze current performance and generate improvement recommendations.
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700">Select an Agent</h3>
                      <p className="text-gray-600">Choose an agent from the list to view and manage its configuration</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}