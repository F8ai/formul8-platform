/**
 * Development Agent Dashboard
 * Interface for automated issue resolution
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  GitBranch, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Code,
  Bot,
  Zap
} from "lucide-react";

interface DevelopmentTask {
  id: string;
  issueNumber: number;
  repository: string;
  branch: string;
  replitUrl?: string;
  status: 'pending' | 'in_progress' | 'ready_for_review' | 'approved' | 'completed' | 'failed';
  assignedTo?: string;
  reviewerId?: string;
  pullRequestUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface IssueAnalysis {
  effort: number;
  components: string[];
  dependencies: string[];
  approach: string;
  testing: string[];
  priority: string;
  suitable: boolean;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  priority: string;
  effort: number;
  suitable: boolean;
  url: string;
  comments: number;
  state: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function DevelopmentAgent() {
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [analysisResult, setAnalysisResult] = useState<IssueAnalysis | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available repositories
  const { data: repositories } = useQuery({
    queryKey: ["/api/development-agent/repositories"],
  });

  // Fetch issues for selected repository
  const { data: repoIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ["/api/development-agent/issues", selectedRepo],
    enabled: !!selectedRepo,
  });

  // Fetch user's development tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/development-agent/tasks"],
  });

  // Analyze issue mutation
  const analyzeIssueMutation = useMutation({
    mutationFn: async ({ repository, issueNumber }: { repository: string; issueNumber: number }) => {
      return await apiRequest(`/api/development-agent/analyze/${repository}/${issueNumber}`);
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Issue has been analyzed for automation suitability",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze issue",
        variant: "destructive",
      });
    },
  });

  // Process issue mutation
  const processIssueMutation = useMutation({
    mutationFn: async ({ repository, issueNumber }: { repository: string; issueNumber: number }) => {
      return await apiRequest("/api/development-agent/process", {
        method: "POST",
        body: JSON.stringify({ repository, issueNumber }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/development-agent/tasks"] });
      toast({
        title: "Development Started",
        description: "Automated development environment has been created",
      });
      setSelectedIssue(null);
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: "Failed to start automated development",
        variant: "destructive",
      });
    },
  });

  // Agent opinion mutation
  const agentOpinionMutation = useMutation({
    mutationFn: async ({ repository, issueNumber }: { repository: string; issueNumber: number }) => {
      return await apiRequest("/api/development-agent/agent-opinion", {
        method: "POST",
        body: JSON.stringify({ repository, issueNumber }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Agent Opinion Added",
        description: "The specialized agent has provided their perspective on this issue",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Opinion",
        description: "Could not add agent opinion to the issue",
        variant: "destructive",
      });
    },
  });

  // Approve task mutation
  const approveMutation = useMutation({
    mutationFn: async ({ taskId, approved }: { taskId: string; approved: boolean }) => {
      return await apiRequest("/api/development-agent/approve", {
        method: "POST",
        body: JSON.stringify({ taskId, approved }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/development-agent/tasks"] });
      toast({
        title: data.success ? "Task Approved" : "Task Rejected",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: "Failed to process approval",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeIssue = () => {
    if (!selectedRepo || !selectedIssue) {
      toast({
        title: "Missing Information",
        description: "Please select a repository and an issue",
        variant: "destructive",
      });
      return;
    }

    console.log("Analyzing issue:", selectedRepo, selectedIssue.number);
    analyzeIssueMutation.mutate({
      repository: selectedRepo,
      issueNumber: selectedIssue.number,
    });
  };

  const handleProcessIssue = () => {
    if (!selectedRepo || !selectedIssue) {
      toast({
        title: "Missing Information",
        description: "Please select a repository and an issue",
        variant: "destructive",
      });
      return;
    }

    console.log("Processing issue:", selectedRepo, selectedIssue.number);
    processIssueMutation.mutate({
      repository: selectedRepo,
      issueNumber: selectedIssue.number,
    });
  };

  const handleAgentOpinion = () => {
    if (!selectedRepo || !selectedIssue) {
      toast({
        title: "Missing Information",
        description: "Please select a repository and an issue",
        variant: "destructive",
      });
      return;
    }

    console.log("Getting agent opinion for:", selectedRepo, selectedIssue.number);
    agentOpinionMutation.mutate({
      repository: selectedRepo,
      issueNumber: selectedIssue.number,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'ready_for_review':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'ready_for_review':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Development Agent</h1>
          <p className="text-gray-600">Automated issue resolution and development environment creation</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Task</TabsTrigger>
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Automated Issue Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="repository">Repository</Label>
                  <Select value={selectedRepo} onValueChange={(value) => {
                    setSelectedRepo(value);
                    setSelectedIssue(null);
                    setAnalysisResult(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repositories?.repositories?.map((repo: string) => (
                        <SelectItem key={repo} value={repo}>
                          {repo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRepo && (
                  <div>
                    <Label htmlFor="issue">Available Issues</Label>
                    {issuesLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading issues...</p>
                      </div>
                    ) : repoIssues?.issues?.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600">No open issues found</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto border rounded-md">
                        {repoIssues?.issues?.map((issue: GitHubIssue) => (
                          <div
                            key={issue.id}
                            className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                              selectedIssue?.id === issue.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedIssue(issue)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-sm">#{issue.number}</h4>
                                  <Badge className={issue.suitable ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                    {issue.suitable ? "Suitable" : "Manual"}
                                  </Badge>
                                  <Badge className={getPriorityColor(issue.priority)}>
                                    {issue.priority}
                                  </Badge>
                                  <a 
                                    href={issue.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 ml-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">{issue.title}</p>
                                {issue.body && (
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-3">{issue.body}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{issue.effort}h effort</span>
                                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                  {issue.comments > 0 && (
                                    <span className="flex items-center gap-1">
                                      <i className="fas fa-comment"></i>
                                      {issue.comments}
                                    </span>
                                  )}
                                  {issue.assignee && <span>@{issue.assignee}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedIssue && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900">Selected Issue:</p>
                  <p className="text-sm text-blue-700">#{selectedIssue.number} - {selectedIssue.title}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleAnalyzeIssue}
                  disabled={analyzeIssueMutation.isPending || !selectedRepo || !selectedIssue}
                  variant="outline"
                >
                  {analyzeIssueMutation.isPending ? "Analyzing..." : "Analyze Issue"}
                </Button>
                <Button 
                  onClick={handleAgentOpinion}
                  disabled={agentOpinionMutation.isPending || !selectedRepo || !selectedIssue}
                  variant="outline"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {agentOpinionMutation.isPending ? "Getting Opinion..." : "Get Agent Opinion"}
                </Button>
                <Button 
                  onClick={handleProcessIssue}
                  disabled={processIssueMutation.isPending || !selectedRepo || !selectedIssue}
                >
                  {processIssueMutation.isPending ? "Processing..." : "Start Development"}
                </Button>
              </div>

              {analysisResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Issue Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={analysisResult.suitable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysisResult.suitable ? "Suitable for Automation" : "Not Suitable"}
                      </Badge>
                      <Badge className={getPriorityColor(analysisResult.priority)}>
                        {analysisResult.priority} priority
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Estimated Effort</Label>
                        <p className="text-sm text-gray-600">{analysisResult.effort} hours</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Approach</Label>
                        <p className="text-sm text-gray-600">{analysisResult.approach}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Components</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.components.map((component) => (
                          <Badge key={component} variant="secondary">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Testing Requirements</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.testing.map((test) => (
                          <Badge key={test} variant="outline">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {!analysisResult.suitable && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This issue may require human creativity, complex decision-making, or has high complexity. 
                          Manual development is recommended.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading tasks...</p>
                </div>
              ) : tasks?.tasks?.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No development tasks yet</p>
                  <p className="text-sm text-gray-500">Create your first automated development task above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks?.tasks?.map((task: DevelopmentTask) => (
                    <Card key={task.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {task.repository} #{task.issueNumber}
                              </h3>
                              <Badge className={getStatusColor(task.status)}>
                                {getStatusIcon(task.status)}
                                {task.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <GitBranch className="h-4 w-4" />
                                {task.branch}
                              </div>
                              <div>
                                Created: {new Date(task.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {task.replitUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(task.replitUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open in Replit
                                </Button>
                              )}
                              
                              {task.pullRequestUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(task.pullRequestUrl, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View PR
                                </Button>
                              )}

                              {task.status === 'ready_for_review' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approveMutation.mutate({ taskId: task.id, approved: true })}
                                    disabled={approveMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve & Merge
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => approveMutation.mutate({ taskId: task.id, approved: false })}
                                    disabled={approveMutation.isPending}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automation Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73%</div>
                <p className="text-sm text-gray-600">Issues suitable for automation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Avg. Resolution Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <p className="text-sm text-gray-600">Average time to resolve</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-sm text-gray-600">Successful automated resolutions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repository Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositories?.repositories?.map((repo: string) => (
                  <div key={repo} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">{repo}</h4>
                      <p className="text-sm text-gray-600">3 issues automated this week</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}