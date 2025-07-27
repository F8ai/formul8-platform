import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { AlertCircle, Bot, CheckCircle, Clock, Users, Zap, BarChart3, FileText, TrendingUp, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentDetailPageProps {
  agentId: string;
}

export default function AgentDetailPage({ agentId }: AgentDetailPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch agent README content
  const { data: agentInfo } = useQuery({
    queryKey: ["/api/agents", agentId],
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

  // Mock README content for demonstration
  const mockReadmeContent = `# ${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="readme">README</TabsTrigger>
          <TabsTrigger value="baseline">Baseline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="space-y-4">
          <MarkdownEditor
            content={mockReadmeContent}
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