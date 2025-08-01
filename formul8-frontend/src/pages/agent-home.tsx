import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Palette, 
  GitBranch,
  Star,
  Activity,
  Clock,
  CheckCircle,
  ExternalLink,
  Plus,
  Bug,
  Lightbulb,
  Target,
  Calendar,
  User,
  BarChart3,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AgentInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  repositoryUrl: string;
  hasInterface: boolean;
  category: string;
  capabilities: string[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface AgentStats {
  totalQueries: number;
  avgConfidence: number;
  avgResponseTime: number;
  successRate: number;
  lastActive: string;
}

interface AgentMetrics {
  agent: string;
  timestamp: string;
  summary: {
    totalTests: number;
    passedTests: number;
    successRate: number;
    avgResponseTime: number;
    avgAccuracy: number;
    avgConfidence: number;
  };
  badges: {
    benchmarks: string;
    accuracy: string;
    speed: string;
    confidence: string;
  };
  performance: {
    overallScore: number;
    testsPassed: number;
    totalTests: number;
    reliability: number;
  };
  recentTests: Array<{
    test: string;
    status: 'passed' | 'failed';
    responseTime: number;
    accuracy?: number;
    confidence?: number;
    timestamp: string;
  }>;
}

export default function AgentHome() {
  const [, params] = useRoute("/agent/:agentId/home");
  const agentId = params?.agentId;
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueBody, setNewIssueBody] = useState("");
  const [issueType, setIssueType] = useState<"feature" | "bug" | "enhancement">("feature");
  const queryClient = useQueryClient();

  const { data: agentInfo, isLoading: agentLoading } = useQuery<AgentInfo>({
    queryKey: [`/api/agents/${agentId}/info`],
    enabled: !!agentId,
  });

  const { data: agentIssues = [], isLoading: issuesLoading } = useQuery<GitHubIssue[]>({
    queryKey: [`/api/agents/${agentId}/issues`],
    enabled: !!agentId,
  });

  const { data: agentStats } = useQuery<AgentStats>({
    queryKey: [`/api/agents/${agentId}/stats`],
    enabled: !!agentId,
  });

  const { data: agentMetrics } = useQuery<AgentMetrics>({
    queryKey: [`/api/agents/${agentId}/metrics`],
    enabled: !!agentId,
  });

  const createIssueMutation = useMutation({
    mutationFn: async (issueData: { title: string; body: string; labels: string[] }) => {
      return await apiRequest(`/api/agents/${agentId}/issues`, {
        method: "POST",
        body: JSON.stringify(issueData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/issues`] });
      setNewIssueTitle("");
      setNewIssueBody("");
    }
  });

  const handleCreateIssue = () => {
    if (!newIssueTitle.trim()) return;

    const labels = [issueType];
    if (issueType === "feature") labels.push("enhancement");
    if (issueType === "bug") labels.push("bug");

    createIssueMutation.mutate({
      title: newIssueTitle,
      body: newIssueBody,
      labels
    });
  };

  const getIssueIcon = (labels: Array<{ name: string; color: string }>) => {
    const labelNames = labels.map(l => l.name.toLowerCase());
    if (labelNames.includes("bug")) return <Bug className="h-4 w-4 text-red-500" />;
    if (labelNames.includes("enhancement") || labelNames.includes("feature")) return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    return <Target className="h-4 w-4 text-blue-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (agentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading agent home...</span>
        </div>
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-muted-foreground">The requested agent could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openIssues = agentIssues.filter(issue => issue.state === 'open');
  const closedIssues = agentIssues.filter(issue => issue.state === 'closed');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
              {agentInfo.displayName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{agentInfo.displayName}</h1>
            <p className="text-muted-foreground text-lg">{agentInfo.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{agentInfo.category}</Badge>
              <Badge className={getStatusColor(agentInfo.status)}>
                {agentInfo.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Updated {new Date(agentInfo.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/agent/${agentInfo.id}`}>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </Link>
          <Link href={`/agent/${agentInfo.id}/design`}>
            <Button variant="outline">
              <Palette className="h-4 w-4 mr-2" />
              Design
            </Button>
          </Link>
          <Link href={`/agent/${agentInfo.id}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{agentStats?.totalQueries || 0}</p>
                <p className="text-xs text-muted-foreground">Total Queries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{agentStats?.avgConfidence || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{agentStats?.avgResponseTime || 0}s</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{agentStats?.successRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features & Issues</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Benchmark Performance Section */}
          {agentMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Benchmark Performance</span>
                </CardTitle>
                <CardDescription>
                  Real-time CI/CD metrics from GitHub Actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <img src={agentMetrics.badges.benchmarks} alt="Benchmarks" className="h-5" />
                    <img src={agentMetrics.badges.accuracy} alt="Accuracy" className="h-5" />
                    <img src={agentMetrics.badges.speed} alt="Speed" className="h-5" />
                    <img src={agentMetrics.badges.confidence} alt="Confidence" className="h-5" />
                  </div>
                  
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{agentMetrics.performance.overallScore}%</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{agentMetrics.summary.avgAccuracy}%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{agentMetrics.summary.avgResponseTime}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{agentMetrics.performance.testsPassed}/{agentMetrics.performance.totalTests}</div>
                      <div className="text-sm text-muted-foreground">Tests Passed</div>
                    </div>
                  </div>
                  
                  {/* Recent Test Results */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Test Results</h4>
                    <div className="space-y-2">
                      {agentMetrics.recentTests.slice(0, 3).map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-2">
                            {test.status === 'passed' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{test.test}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{test.responseTime}ms</span>
                            {test.confidence && <span>{test.confidence}% confidence</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`${agentInfo.repositoryUrl}/actions`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Full History
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Overview</CardTitle>
                <CardDescription>Core functionality and purpose</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{agentInfo.description}</p>
                  <div>
                    <h4 className="font-medium mb-2">Primary Focus</h4>
                    <Badge variant="outline" className="text-sm">
                      {agentInfo.category}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {agentInfo.capabilities.slice(0, 4).map((capability) => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {agentInfo.capabilities.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{agentInfo.capabilities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href={`/agent/${agentInfo.id}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                  </Link>
                  <Link href={`/agent/${agentInfo.id}/design`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Palette className="h-4 w-4 mr-2" />
                      View Design
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={agentInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="h-4 w-4 mr-2" />
                      View Repository
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`${agentInfo.repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      GitHub Issues
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Agent Status: Active</p>
                    <p className="text-xs text-muted-foreground">Last checked: {new Date().toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Last Repository Update</p>
                    <p className="text-xs text-muted-foreground">{new Date(agentInfo.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Open Issues</p>
                    <p className="text-xs text-muted-foreground">{openIssues.length} active feature requests and bugs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Open Issues ({openIssues.length})</CardTitle>
                  <CardDescription>Active feature requests and bug reports</CardDescription>
                </CardHeader>
                <CardContent>
                  {issuesLoading ? (
                    <div className="text-center py-4">Loading issues...</div>
                  ) : openIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No open issues</p>
                      <p className="text-sm">All features are up to date!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openIssues.slice(0, 5).map((issue) => (
                        <div key={issue.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          {getIssueIcon(issue.labels)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              #{issue.number} opened {new Date(issue.created_at).toLocaleDateString()} by {issue.user.login}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {issue.labels.map((label) => (
                                <Badge key={label.name} variant="secondary" className="text-xs">
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                      {openIssues.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${agentInfo.repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">
                              View all {openIssues.length} issues
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {closedIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Completed ({closedIssues.length})</CardTitle>
                    <CardDescription>Recently resolved issues and features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {closedIssues.slice(0, 3).map((issue) => (
                        <div key={issue.id} className="flex items-center space-x-3 p-2 opacity-75">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Completed {new Date(issue.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create New Issue</CardTitle>
                <CardDescription>Report bugs or request features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as any)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="enhancement">Enhancement</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={newIssueBody}
                      onChange={(e) => setNewIssueBody(e.target.value)}
                      placeholder="Detailed description, steps to reproduce, or feature requirements"
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateIssue}
                    disabled={!newIssueTitle.trim() || createIssueMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentInfo.capabilities.map((capability) => (
              <Card key={capability}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-medium">{capability}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Specialized capability for cannabis industry operations
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Repository Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Repository URL</h4>
                    <code className="text-sm bg-muted p-2 rounded block break-all">
                      {agentInfo.repositoryUrl}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Clone Command</h4>
                    <code className="text-sm bg-muted p-2 rounded block">
                      git clone {agentInfo.repositoryUrl}
                    </code>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={agentInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Repository
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${agentInfo.repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Issues
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Development Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Development Server</h4>
                    <code className="text-xs bg-muted p-1 rounded block">npm run dev</code>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Build for Production</h4>
                    <code className="text-xs bg-muted p-1 rounded block">npm run build</code>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Run Tests</h4>
                    <code className="text-xs bg-muted p-1 rounded block">npm test</code>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Lint Code</h4>
                    <code className="text-xs bg-muted p-1 rounded block">npm run lint</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}