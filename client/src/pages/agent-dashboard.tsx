import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  GitBranch, 
  Play, 
  AlertTriangle, 
  ExternalLink,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Settings,
  Terminal,
  Menu
} from "lucide-react";
import Sidebar from "@/components/sidebar";

interface AgentMetrics {
  baseline: number;
  confidence: number;
  accuracy: number;
  speed: number;
  corpusSize: number;
  lastExamDate: string | null;
}

interface AgentDashboardData {
  name: string;
  type: string;
  description: string;
  status: string;
  repository: string;
  performance: AgentMetrics;
  configuration: {
    prompt: string;
    tools: string[];
    ragEnabled: boolean;
    llmProvider: string;
    model: string;
  };
  lastUpdated: string;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    status: string;
    details: string;
  }>;
  repositoryStats: {
    stars: number;
    forks: number;
    issues: number;
    lastCommit: string;
  };
}

interface AgentDashboardProps {
  agentType?: string;
}

export default function AgentDashboard({ agentType: propAgentType }: AgentDashboardProps) {
  const { agentType: paramAgentType } = useParams<{ agentType: string }>();
  const agentType = propAgentType || paramAgentType;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch agent-specific data with custom query function
  const { data: agentData, isLoading, error } = useQuery<AgentDashboardData>({
    queryKey: [`/api/agents/${agentType}/dashboard`],
    enabled: !!agentType,
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentType}/dashboard`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agent data: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
  });

  // Debug logging
  console.log('AgentDashboard Debug:', {
    agentType,
    isAuthenticated,
    isLoading,
    hasData: !!agentData,
    error,
    apiUrl: `/api/agents/${agentType}/dashboard`
  });

  // Fetch repository data from GitHub
  const { data: repoData } = useQuery({
    queryKey: [`/api/agents/${agentType}/repository-stats`],
    enabled: !!agentType,
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentType}/repository-stats`);
      if (!response.ok) {
        console.warn(`Repository stats not available for ${agentType}`);
        return null;
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch baseline questions from API instead of direct file access
  const { data: baselineResults } = useQuery({
    queryKey: [`/api/agents/${agentType}/baseline-results`],
    enabled: !!agentType,
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentType}/baseline-results`);
      if (!response.ok) {
        console.warn(`Baseline results not available for ${agentType}`);
        return [];
      }
      return response.json();
    },
    retry: false,
  });

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

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'baseline_exam': return <Play className="h-4 w-4" />;
      case 'self_assessment': return <AlertTriangle className="h-4 w-4" />;
      case 'github_action': return <GitBranch className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-formul8-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">F8</span>
          </div>
          <p className="text-formul8-gray">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (!agentData && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested agent dashboard could not be loaded.
            {error && <span className="block text-sm mt-2 text-red-600">Error: {error.message}</span>}
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!agentData) {
    return null; // This should not happen due to earlier checks
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 w-64">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Header - Mobile responsive */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            {/* Top row: Menu, back button and title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex-shrink-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-formul8-dark truncate">{agentData.name}</h1>
                <p className="text-sm sm:text-base text-formul8-gray truncate">{agentData.description}</p>
              </div>
            </div>
            
            {/* Bottom row: Badge and external link */}
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <Badge className={getStatusColor(agentData.status)}>
                {agentData.status}
              </Badge>
              <a
                href={`https://github.com/F8ai/${agentData.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        </header>

        {/* Main Content - Mobile responsive padding */}
        <main className="flex-1 p-3 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile-responsive tab navigation */}
            <div className="mb-6">
              {/* Mobile: Horizontal scrollable tabs */}
              <div className="block sm:hidden">
                <div className="flex space-x-1 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "overview" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("baseline")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "baseline" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Baseline
                  </button>
                  <button
                    onClick={() => setActiveTab("performance")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "performance" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "activity" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setActiveTab("configuration")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "configuration" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Config
                  </button>
                  <button
                    onClick={() => setActiveTab("repository")}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "repository" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Repository
                  </button>
                </div>
              </div>
              
              {/* Desktop: Standard tab list */}
              <div className="hidden sm:block">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="baseline">Baseline</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                  <TabsTrigger value="repository">Repository</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = `/agent/${agentType}/baseline`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {baselineResults?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Click to view baseline test table
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl sm:text-2xl font-bold ${getPerformanceColor(agentData.performance.confidence)}`}>
                      {agentData.performance.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {agentData.performance.lastExamDate 
                        ? new Date(agentData.performance.lastExamDate).toLocaleDateString()
                        : 'No exam data'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl sm:text-2xl font-bold ${getPerformanceColor(agentData.performance.accuracy)}`}>
                      {agentData.performance.accuracy}%
                    </div>
                    <div className="text-xs text-gray-500">Last assessment</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Response Speed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl sm:text-2xl font-bold ${getPerformanceColor(agentData.performance.speed)}`}>
                      {agentData.performance.speed}%
                    </div>
                    <div className="text-xs text-gray-500">Performance score</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions - Mobile responsive */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      <Play className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Run Baseline Exam</span>
                      <span className="sm:hidden">Baseline</span>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Self-Assessment</span>
                      <span className="sm:hidden">Assessment</span>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                      <GitBranch className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Trigger GitHub Action</span>
                      <span className="sm:hidden">GitHub</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Baseline Tab - Mobile responsive */}
            <TabsContent value="baseline" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Baseline Questions</CardTitle>
                  <p className="text-sm text-gray-600">
                    View and manage all {baselineResults?.length || 0} baseline questions for this agent
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] sm:h-[600px] overflow-hidden">
                    <iframe 
                      src={`/agent/${agentType}/baseline`}
                      className="w-full h-full border-0"
                      title="Baseline Questions Table"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Baseline Score</span>
                        <span className="text-sm text-gray-600">{agentData.performance.baseline}%</span>
                      </div>
                      <Progress value={agentData.performance.baseline} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Confidence</span>
                        <span className="text-sm text-gray-600">{agentData.performance.confidence}%</span>
                      </div>
                      <Progress value={agentData.performance.confidence} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Accuracy</span>
                        <span className="text-sm text-gray-600">{agentData.performance.accuracy}%</span>
                      </div>
                      <Progress value={agentData.performance.accuracy} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Speed</span>
                        <span className="text-sm text-gray-600">{agentData.performance.speed}%</span>
                      </div>
                      <Progress value={agentData.performance.speed} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentData.recentActivity?.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{activity.action.replace('_', ' ')}</span>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(activity.status)}
                              <span className="text-sm text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">LLM Provider</label>
                      <p className="text-sm text-gray-600">{agentData.configuration.llmProvider}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Model</label>
                      <p className="text-sm text-gray-600">{agentData.configuration.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tools</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {agentData.configuration.tools.map((tool, index) => (
                          <Badge key={index} variant="secondary">{tool}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">RAG Enabled</label>
                      <p className="text-sm text-gray-600">
                        {agentData.configuration.ragEnabled ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Repository Tab */}
            <TabsContent value="repository" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Repository Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Repository</label>
                      <p className="text-sm text-gray-600">
                        <a 
                          href={`https://github.com/F8ai/${agentData.repository}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          F8ai/{agentData.repository}
                        </a>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Updated</label>
                      <p className="text-sm text-gray-600">
                        {new Date(agentData.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                    {agentData.repositoryStats && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{agentData.repositoryStats.stars}</div>
                          <div className="text-sm text-gray-600">Stars</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{agentData.repositoryStats.forks}</div>
                          <div className="text-sm text-gray-600">Forks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{agentData.repositoryStats.issues}</div>
                          <div className="text-sm text-gray-600">Issues</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}