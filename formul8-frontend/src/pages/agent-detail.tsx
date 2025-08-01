import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { AlertCircle, Bot, CheckCircle, Clock, Users, Zap, BarChart3, FileText, TrendingUp, Target, Settings, Database, Brain, Cpu } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentDetailPageProps {
  agentId: string;
}

interface AgentConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  ragEnabled: boolean;
  knowledgeBaseEnabled: boolean;
  systemPrompt: string;
  ragSettings: {
    vectorStore: string;
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
  };
  knowledgeBaseSettings: {
    sparqlEndpoint: string;
    ontologyFile: string;
    queryTimeout: number;
  };
}

export default function AgentDetailPage({ agentId }: AgentDetailPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Agent configuration state
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    defaultModel: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    ragEnabled: true,
    knowledgeBaseEnabled: false,
    systemPrompt: '',
    ragSettings: {
      vectorStore: 'faiss',
      chunkSize: 1000,
      chunkOverlap: 200,
      topK: 5
    },
    knowledgeBaseSettings: {
      sparqlEndpoint: '',
      ontologyFile: 'knowledge_base.ttl',
      queryTimeout: 30
    }
  });

  // Fetch agent README content
  const { data: readmeData } = useQuery({
    queryKey: [`/api/agents/${agentId}/readme`],
  });

  // Fetch baseline coverage analysis for this agent
  const { data: coverageAnalysis, isLoading: coverageLoading } = useQuery({
    queryKey: ["/api/baseline-coverage", agentId],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch baseline questions
  const { data: baselineQuestions } = useQuery({
    queryKey: [`/api/agents/${agentId}/baseline-questions`],
  });

  // Fetch agent performance metrics
  const { data: metrics } = useQuery({
    queryKey: [`/api/baseline-exam/badges`],
  });

  // Fetch agent configuration
  const { data: currentConfig } = useQuery({
    queryKey: [`/api/agents/${agentId}/config`],
    onSuccess: (data) => {
      if (data) {
        setAgentConfig(data);
      }
    }
  });

  // Get README content from API or use fallback
  const readmeContent = readmeData?.content || `# ${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent

## Overview
The ${agentId} agent provides specialized cannabis industry guidance and expertise.

## Core Functionality
1. **Primary Feature**: Core operational guidance
2. **Secondary Feature**: Compliance monitoring
3. **Tertiary Feature**: Performance optimization

## Performance Metrics
- **Accuracy**: 95%+ target
- **Response Time**: <2 seconds
- **Coverage**: Comprehensive domain expertise

## Integration Capabilities
- Multi-agent collaboration
- Real-time data integration
- API connectivity

## Success Criteria
- Zero compliance violations
- 100% operational coverage
- Optimal performance delivery`;

  // Save README mutation
  const saveReadmeMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/agents/${agentId}/readme`, {
        method: 'PUT',
        body: { content }
      });
    },
    onSuccess: () => {
      toast({
        title: "README Updated",
        description: "Agent documentation has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-coverage", agentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save README",
        variant: "destructive"
      });
    }
  });

  const handleSaveReadme = (content: string) => {
    saveReadmeMutation.mutate(content);
  };

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: AgentConfig) => {
      return apiRequest(`/api/agents/${agentId}/config`, {
        method: 'PUT',
        body: config
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Agent configuration has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/config`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    }
  });

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(agentConfig);
  };

  const agentMetrics = metrics?.[`${agentId}-agent`] || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent</h1>
          <p className="text-gray-600">Cannabis industry AI agent specialization</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/agents')}
        >
          ← Back to Agents
        </Button>
      </div>

      {/* Coverage Analysis Card */}
      {coverageAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Baseline Coverage Analysis
              {coverageLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
            </CardTitle>
            <CardDescription>
              AI evaluation of how well baseline questions cover desired functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {coverageAnalysis.confidence}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
                <Progress value={coverageAnalysis.confidence} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {coverageAnalysis.coverage}%
                </div>
                <div className="text-sm text-gray-600">Coverage</div>
                <Progress value={coverageAnalysis.coverage} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {coverageAnalysis.gaps?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {coverageAnalysis.strengths?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Strengths</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">AI Analysis Summary:</h4>
              <p className="text-sm text-gray-700">
                {coverageAnalysis.detailedAnalysis}
              </p>
            </div>

            {coverageAnalysis.gaps && coverageAnalysis.gaps.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-red-700">Identified Gaps:</h4>
                <ul className="space-y-1">
                  {coverageAnalysis.gaps.map((gap: string, index: number) => (
                    <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {coverageAnalysis.recommendations && coverageAnalysis.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-blue-700">Recommendations:</h4>
                <ul className="space-y-1">
                  {coverageAnalysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                      <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="readme" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="readme">README</TabsTrigger>
          <TabsTrigger value="baseline">Baseline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="space-y-4">
          <MarkdownEditor
            content={readmeContent}
            onSave={handleSaveReadme}
            title={`${agentId} Agent Documentation`}
            editable={true}
          />
        </TabsContent>

        <TabsContent value="baseline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Baseline Questions</CardTitle>
              <CardDescription>
                Test questions for evaluating agent performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {baselineQuestions && baselineQuestions.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{baselineQuestions.length}</div>
                      <div className="text-sm text-gray-600">Total Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {new Set(baselineQuestions.map((q: any) => q.category)).size}
                      </div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {baselineQuestions.filter((q: any) => q.difficulty === 'advanced').length}
                      </div>
                      <div className="text-sm text-gray-600">Advanced</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {baselineQuestions.slice(0, 5).map((question: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{question.question}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Category: {question.category} | Difficulty: {question.difficulty}
                            </div>
                          </div>
                          <Badge variant="outline">{question.difficulty}</Badge>
                        </div>
                      </div>
                    ))}
                    {baselineQuestions.length > 5 && (
                      <div className="text-center text-sm text-gray-500">
                        ... and {baselineQuestions.length - 5} more questions
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No baseline questions found</div>
                  <div className="text-sm">Create baseline.json to get started</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {agentMetrics.accuracy || '0'}%
                </div>
                <Progress value={parseFloat(agentMetrics.accuracy || '0')} className="mt-2" />
                <div className="text-sm text-gray-600 mt-2">Target: 95%+</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {agentMetrics.responseTime || '0'}ms
                </div>
                <div className="text-sm text-gray-600 mt-2">Target: &lt;2000ms</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reliability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {agentMetrics.reliability || '0'}%
                </div>
                <Progress value={parseFloat(agentMetrics.reliability || '0')} className="mt-2" />
                <div className="text-sm text-gray-600 mt-2">Target: 99%+</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
                <CardDescription>
                  Configure AI model settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default Model</Label>
                  <Select 
                    value={agentConfig.defaultModel} 
                    onValueChange={(value) => setAgentConfig({...agentConfig, defaultModel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {agentConfig.temperature}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={agentConfig.temperature}
                    onChange={(e) => setAgentConfig({...agentConfig, temperature: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Controls randomness in responses (0 = deterministic, 2 = very creative)</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    type="number"
                    value={agentConfig.maxTokens}
                    onChange={(e) => setAgentConfig({...agentConfig, maxTokens: parseInt(e.target.value)})}
                    placeholder="2048"
                  />
                  <div className="text-xs text-gray-500">Maximum length of model responses</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    value={agentConfig.systemPrompt}
                    onChange={(e) => setAgentConfig({...agentConfig, systemPrompt: e.target.value})}
                    placeholder="Enter system prompt for this agent..."
                    className="min-h-[100px]"
                  />
                  <div className="text-xs text-gray-500">Instructions that define the agent's behavior and expertise</div>
                </div>
              </CardContent>
            </Card>

            {/* RAG Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  RAG Configuration
                </CardTitle>
                <CardDescription>
                  Retrieval-Augmented Generation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={agentConfig.ragEnabled}
                    onCheckedChange={(checked) => setAgentConfig({...agentConfig, ragEnabled: checked})}
                  />
                  <Label>Enable RAG</Label>
                </div>

                {agentConfig.ragEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="vectorStore">Vector Store</Label>
                      <Select 
                        value={agentConfig.ragSettings.vectorStore} 
                        onValueChange={(value) => setAgentConfig({
                          ...agentConfig, 
                          ragSettings: {...agentConfig.ragSettings, vectorStore: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vector store" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faiss">FAISS</SelectItem>
                          <SelectItem value="chroma">Chroma</SelectItem>
                          <SelectItem value="pinecone">Pinecone</SelectItem>
                          <SelectItem value="weaviate">Weaviate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chunkSize">Chunk Size</Label>
                        <Input
                          type="number"
                          value={agentConfig.ragSettings.chunkSize}
                          onChange={(e) => setAgentConfig({
                            ...agentConfig,
                            ragSettings: {...agentConfig.ragSettings, chunkSize: parseInt(e.target.value)}
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                        <Input
                          type="number"
                          value={agentConfig.ragSettings.chunkOverlap}
                          onChange={(e) => setAgentConfig({
                            ...agentConfig,
                            ragSettings: {...agentConfig.ragSettings, chunkOverlap: parseInt(e.target.value)}
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topK">Top K Results</Label>
                      <Input
                        type="number"
                        value={agentConfig.ragSettings.topK}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          ragSettings: {...agentConfig.ragSettings, topK: parseInt(e.target.value)}
                        })}
                      />
                      <div className="text-xs text-gray-500">Number of top similar documents to retrieve</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Base Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
                <CardDescription>
                  SPARQL and ontology settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={agentConfig.knowledgeBaseEnabled}
                    onCheckedChange={(checked) => setAgentConfig({...agentConfig, knowledgeBaseEnabled: checked})}
                  />
                  <Label>Enable Knowledge Base</Label>
                </div>

                {agentConfig.knowledgeBaseEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sparqlEndpoint">SPARQL Endpoint</Label>
                      <Input
                        value={agentConfig.knowledgeBaseSettings.sparqlEndpoint}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          knowledgeBaseSettings: {...agentConfig.knowledgeBaseSettings, sparqlEndpoint: e.target.value}
                        })}
                        placeholder="http://localhost:3030/dataset/sparql"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ontologyFile">Ontology File</Label>
                      <Input
                        value={agentConfig.knowledgeBaseSettings.ontologyFile}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          knowledgeBaseSettings: {...agentConfig.knowledgeBaseSettings, ontologyFile: e.target.value}
                        })}
                        placeholder="knowledge_base.ttl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                      <Input
                        type="number"
                        value={agentConfig.knowledgeBaseSettings.queryTimeout}
                        onChange={(e) => setAgentConfig({
                          ...agentConfig,
                          knowledgeBaseSettings: {...agentConfig.knowledgeBaseSettings, queryTimeout: parseInt(e.target.value)}
                        })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Configuration Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Actions
                </CardTitle>
                <CardDescription>
                  Save and manage agent configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending}
                  className="w-full"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Export Config
                  </Button>
                  <Button variant="outline" size="sm">
                    Import Config
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <div className="font-medium mb-1">Configuration Status:</div>
                  <div>Model: {agentConfig.defaultModel}</div>
                  <div>RAG: {agentConfig.ragEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div>Knowledge Base: {agentConfig.knowledgeBaseEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div>Temperature: {agentConfig.temperature}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Management</CardTitle>
              <CardDescription>
                Run and manage baseline tests for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => setLocation(`/agent/${agentId}/baseline`)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Baseline Testing
                </Button>
                
                <div className="text-sm text-gray-600">
                  Access comprehensive baseline testing interface with multi-model AI evaluation, 
                  performance tracking, and detailed result analysis.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}