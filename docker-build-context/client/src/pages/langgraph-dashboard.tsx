import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { 
  RefreshCw, 
  GitBranch, 
  Activity, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Zap,
  BarChart3,
  ArrowRight,
  Network,
  Timer,
  TrendingUp
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import AgentNetworkGraph from "@/components/agent-network-graph";

interface LangGraphMetrics {
  totalQueries: number;
  successRate: number;
  avgProcessingTime: number;
  avgConfidence: number;
  consensusRate: number;
  humanReviewRate: number;
  queryBreakdown: {
    completed: number;
    processing: number;
    failed: number;
  };
}

interface ConversationThread {
  threadId: string;
  userId: string;
  status: 'active' | 'completed' | 'failed';
  messageCount: number;
  lastActivity: string;
  agentsInvolved: string[];
  consensusReached: boolean;
}

interface WorkflowStep {
  step: string;
  agent: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  timestamp: string;
  duration: number;
  confidence?: number;
}

export default function LangGraphDashboard() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // Fetch LangGraph metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<LangGraphMetrics>({
    queryKey: ["/api/langgraph/metrics"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active conversation threads
  const { data: threads, isLoading: threadsLoading } = useQuery<ConversationThread[]>({
    queryKey: ["/api/langgraph/threads"],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch workflow visualization data
  const { data: workflowVizData } = useQuery<{ visualization: string }>({
    queryKey: ["/api/langgraph/visualization"],
    enabled: isAuthenticated,
  });
  
  const workflowViz = workflowVizData?.visualization;

  // Fetch recent workflow steps
  const { data: recentWorkflows, isLoading: workflowsLoading } = useQuery<WorkflowStep[]>({
    queryKey: ["/api/langgraph/recent-workflows"],
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-formul8-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">F8</span>
          </div>
          <p className="text-formul8-gray">Please log in to access the LangGraph dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar />
      
      <div className="flex-1 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitBranch className="h-5 w-5 lg:h-6 lg:w-6 text-formul8-green" />
              <span className="hidden sm:inline">LangGraph Orchestration Dashboard</span>
              <span className="sm:hidden">LangGraph Dashboard</span>
            </h1>
            <p className="text-sm lg:text-base text-gray-600">Monitor multi-agent workflows and consensus building</p>
          </div>
          <Button 
            onClick={() => refetchMetrics()} 
            disabled={metricsLoading}
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">Overview</TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs sm:text-sm px-2 py-2">Workflows</TabsTrigger>
            <TabsTrigger value="threads" className="text-xs sm:text-sm px-2 py-2">Conversations</TabsTrigger>
            <TabsTrigger value="visualization" className="text-xs sm:text-sm px-2 py-2">Visualization</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 lg:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Queries</p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {metricsLoading ? "..." : metrics?.totalQueries || 0}
                      </p>
                    </div>
                    <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-xl lg:text-2xl font-bold text-green-600">
                        {metricsLoading ? "..." : `${metrics?.successRate || 0}%`}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Processing Time</p>
                      <p className="text-xl lg:text-2xl font-bold text-orange-600">
                        {metricsLoading ? "..." : `${metrics?.avgProcessingTime || 0}s`}
                      </p>
                    </div>
                    <Timer className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Consensus Rate</p>
                      <p className="text-xl lg:text-2xl font-bold text-purple-600">
                        {metricsLoading ? "..." : `${metrics?.consensusRate || 0}%`}
                      </p>
                    </div>
                    <Users className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Query Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 lg:space-y-4">
                  {metrics?.queryBreakdown && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">Completed</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {metrics.queryBreakdown.completed}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">Processing</span>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {metrics.queryBreakdown.processing}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">Failed</span>
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {metrics.queryBreakdown.failed}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 lg:space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Average Confidence</span>
                      <span>{metrics?.avgConfidence || 0}%</span>
                    </div>
                    <Progress value={metrics?.avgConfidence || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Human Review Rate</span>
                      <span>{metrics?.humanReviewRate || 0}%</span>
                    </div>
                    <Progress value={metrics?.humanReviewRate || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <Activity className="h-4 w-4 lg:h-5 lg:w-5" />
                  Recent Workflow Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="text-center py-6 lg:py-8 text-sm lg:text-base">Loading workflow data...</div>
                ) : recentWorkflows && recentWorkflows.length > 0 ? (
                  <div className="space-y-2 lg:space-y-3">
                    {recentWorkflows.map((step, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(step.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm lg:text-base truncate">{step.step}</p>
                            <p className="text-xs lg:text-sm text-gray-600">Agent: {step.agent}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 sm:gap-1">
                          <Badge className={`${getStatusColor(step.status)} text-xs`}>
                            {step.status}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {step.duration}ms
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 lg:py-8 text-gray-500 text-sm lg:text-base">
                    No recent workflow activity
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="threads" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
                  Active Conversation Threads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {threadsLoading ? (
                  <div className="text-center py-6 lg:py-8 text-sm lg:text-base">Loading conversation threads...</div>
                ) : threads && threads.length > 0 ? (
                  <div className="space-y-2 lg:space-y-3">
                    {threads.map((thread) => (
                      <div 
                        key={thread.threadId} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer gap-3 sm:gap-0"
                        onClick={() => setSelectedThread(thread.threadId)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(thread.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm lg:text-base">Thread {thread.threadId.slice(-8)}</p>
                            <p className="text-xs lg:text-sm text-gray-600">
                              {thread.messageCount} messages • {thread.agentsInvolved.length} agents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 sm:gap-1">
                          <Badge className={`${getStatusColor(thread.status)} text-xs`}>
                            {thread.status}
                          </Badge>
                          {thread.consensusReached && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Consensus</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 lg:py-8 text-gray-500 text-sm lg:text-base">
                    No active conversation threads
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              {/* Agent Network Graph */}
              <Card className="xl:col-span-2">
                <CardHeader className="pb-3 lg:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <Network className="h-4 w-4 lg:h-5 lg:w-5" />
                    Agent Network Graph
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 lg:h-[500px]">
                    <AgentNetworkGraph />
                  </div>
                </CardContent>
              </Card>
              
              {/* Workflow Visualization */}
              <Card className="xl:col-span-2">
                <CardHeader className="pb-3 lg:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <GitBranch className="h-4 w-4 lg:h-5 lg:w-5" />
                    LangGraph Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workflowViz ? (
                    <div className="border rounded-lg p-3 lg:p-4 bg-white overflow-x-auto">
                      <pre className="text-xs lg:text-sm whitespace-pre-wrap font-mono">
                        {workflowViz}
                      </pre>
                      <div className="mt-3 lg:mt-4 text-xs text-gray-500">
                        This Mermaid diagram shows the complete LangGraph workflow from query to final response.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 lg:py-8 text-gray-500 text-sm lg:text-base">
                      Workflow visualization not available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}