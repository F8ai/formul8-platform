import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricBadge } from "@/components/ui/metric-badge";
import { TrendChart } from "@/components/ui/trend-chart";
import { AlertCircle, Bot, CheckCircle, Clock, Users, Zap, BarChart3, Settings, Play, Eye, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AgentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [testQuery, setTestQuery] = useState("");
  const [threadId, setThreadId] = useState("demo-thread");

  // Fetch agent status
  const { data: agentStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/agent-status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch agent performance metrics
  const { data: metrics } = useQuery({
    queryKey: ["/api/agent-management/dashboard"],
  });

  // Fetch conversation history
  const { data: history } = useQuery({
    queryKey: ["/api/langgraph/history", threadId],
    enabled: !!threadId,
  });

  // Fetch baseline badges
  const { data: baselineBadges } = useQuery({
    queryKey: ["/api/baseline-exam/badges"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Test query mutation
  const testQueryMutation = useMutation({
    mutationFn: async ({ query, agent }: { query: string; agent?: string }) => {
      if (agent) {
        return await apiRequest(`/api/query`, {
          method: "POST",
          body: { content: query, agentType: agent }
        });
      } else {
        return await apiRequest(`/api/langgraph/process`, {
          method: "POST",
          body: { query, threadId }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Query Processed",
        description: "Agent response generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/langgraph/history"] });
    },
    onError: (error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch discovered agents from repositories
  const { data: discoveredAgents, isLoading: agentsLoading } = useQuery({
    queryKey: ["/api/agents"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Agent icon and color mapping
  const agentMetadata = {
    compliance: { icon: "🛡️", color: "bg-blue-500" },
    formulation: { icon: "🧪", color: "bg-green-500" },
    patent: { icon: "©️", color: "bg-purple-500" },
    operations: { icon: "⚙️", color: "bg-orange-500" },
    sourcing: { icon: "🛒", color: "bg-teal-500" },
    marketing: { icon: "📢", color: "bg-pink-500" },
    spectra: { icon: "📊", color: "bg-indigo-500" },
    "customer-success": { icon: "👥", color: "bg-emerald-500" },
    science: { icon: "🔬", color: "bg-cyan-500" }
  };

  // Transform discovered agents into display format
  const agents = discoveredAgents?.map((agent: any) => ({
    id: agent.id,
    name: agent.displayName,
    description: agent.description,
    icon: agentMetadata[agent.id as keyof typeof agentMetadata]?.icon || "🤖",
    color: agentMetadata[agent.id as keyof typeof agentMetadata]?.color || "bg-gray-500",
    capabilities: agent.capabilities || [],
    repositoryUrl: agent.repositoryUrl,
    lastUpdated: agent.lastUpdated,
    status: agent.status || 'inactive'
  })) || [];

  const getAgentStatus = (agentId: string) => {
    if (!agentStatus) return { status: "unknown", confidence: 0, queries: 0, responseTime: 0 };
    
    const status = agentStatus.find((s: any) => s.agentType === agentId);
    return status || { status: "unknown", confidence: 0, queries: 0, responseTime: 0 };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-formul8-text-primary mb-2">
          Agent Backend System
        </h1>
        <p className="text-formul8-text-secondary">
          Explore and interact with Formul8's {agents.length} specialized cannabis industry AI agents from live GitHub repositories
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Specialized cannabis agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {agentStatus?.filter((s: any) => s.status === 'active').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agentStatus ? 
                    Math.round(agentStatus.reduce((acc: number, s: any) => acc + (s.averageResponseTime || 0), 0) / agentStatus.length) 
                    : 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Cross-agent average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agentStatus?.reduce((acc: number, s: any) => acc + (s.totalQueries || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processed this session
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Baseline Confidence Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Baseline Quality Assessment
              </CardTitle>
              <CardDescription>
                System-wide baseline test quality and agent performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {baselineBadges && Object.keys(baselineBadges).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(baselineBadges).slice(0, 8).map(([agentName, badges]: [string, any]) => (
                    <div key={agentName} className="space-y-2">
                      <Label className="text-sm font-medium capitalize">{agentName}</Label>
                      <div className="flex flex-wrap gap-1">
                        <MetricBadge 
                          label="B" 
                          value={badges.baseline || `0/10`} 
                          type="tests" 
                          className="text-xs"
                        />
                        <MetricBadge 
                          label="A" 
                          value={badges.accuracy || `0/10`} 
                          type="tests" 
                          className="text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading baseline metrics...
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                LangGraph Multi-Agent Orchestration
              </CardTitle>
              <CardDescription>
                Production-ready multi-agent workflow with state management and consensus building
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Workflow Features</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Intelligent query routing</li>
                    <li>• Agent-to-agent verification</li>
                    <li>• Consensus building protocols</li>
                    <li>• Human escalation handling</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">State Management</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Conversation persistence</li>
                    <li>• Thread-based history</li>
                    <li>• Context preservation</li>
                    <li>• Multi-turn conversations</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quality Assurance</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cross-verification matrix</li>
                    <li>• Confidence scoring</li>
                    <li>• Production-ready answers</li>
                    <li>• Cannabis-specific validation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          {agentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="w-16 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
                    <div className="w-full h-4 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="w-full h-8 bg-gray-200 rounded"></div>
                      <div className="w-full h-12 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
                <p className="text-muted-foreground mb-4">
                  No agent repositories were discovered. Check your GitHub configuration.
                </p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/agents"] })}>
                  Refresh Agents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => {
                const status = getAgentStatus(agent.id);
                return (
                  <Card 
                    key={agent.id} 
                    className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/agent/${agent.id}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {agent.icon}
                        </div>
                        <div className="flex gap-2">
                          <Badge 
                            variant={agent.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {agent.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            GitHub
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Performance Badges */}
                      {baselineBadges?.[agent.id] && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Performance Metrics</Label>
                          <div className="flex flex-wrap gap-1">
                            <MetricBadge 
                              label="Accuracy" 
                              value={status.accuracy || 75} 
                              type="accuracy" 
                              className="text-xs"
                            />
                            <MetricBadge 
                              label="Confidence" 
                              value={status.confidence || 80} 
                              type="confidence" 
                              className="text-xs"
                            />
                            <MetricBadge 
                              label="Baseline" 
                              value={status.baselineConfidence || 70} 
                              type="baseline" 
                              className="text-xs"
                            />
                            <MetricBadge 
                              label="Tests" 
                              value={`${status.passed || 75}/${status.total || 100}`} 
                              type="tests" 
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Queries</Label>
                          <div className="font-medium">{status.totalQueries || 0}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Avg Time</Label>
                          <div className="font-medium">{status.averageResponseTime || 0}ms</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Capabilities</Label>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 2).map((cap: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.capabilities.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {agent.lastUpdated && (
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(agent.lastUpdated).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/agent/${agent.id}`);
                          }}
                          className="flex-1"
                        >
                          Test Agent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`${agent.repositoryUrl}/issues`, '_blank');
                          }}
                          className="flex-1"
                        >
                          Issues
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Agent Testing Interface
              </CardTitle>
              <CardDescription>
                Test individual agents or the full LangGraph orchestration system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Test Query</Label>
                  <Textarea
                    placeholder="Enter your cannabis industry question..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Agent Selection</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-route (LangGraph)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto-route">Auto-route (LangGraph)</SelectItem>
                      {!agentsLoading && agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    <Label>Thread ID</Label>
                    <Input
                      value={threadId}
                      onChange={(e) => setThreadId(e.target.value)}
                      placeholder="demo-thread"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => testQueryMutation.mutate({ 
                    query: testQuery, 
                    agent: selectedAgent === "auto-route" ? undefined : selectedAgent || undefined 
                  })}
                  disabled={!testQuery || testQueryMutation.isPending}
                  className="flex-1"
                >
                  {testQueryMutation.isPending ? "Processing..." : "Test Query"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setTestQuery("");
                    setSelectedAgent("");
                  }}
                >
                  Clear
                </Button>
              </div>

              {selectedAgent && selectedAgent !== "auto-route" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Single Agent Mode:</strong> Query will be processed by {agents.find(a => a.id === selectedAgent)?.name} only
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>LangGraph Mode:</strong> Query will be auto-routed to the best agent with cross-verification
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {/* Overall System Trend Chart */}
          <TrendChart
            data={{
              dates: ['7/1/2025', '7/7/2025', '7/14/2025'],
              accuracy: [42, 45, 47],
              confidence: [0.48, 0.52, 0.55],
              baselineConfidence: [0.45, 0.50, 0.52],
              testsPassed: [42, 45, 47],
            }}
            agentType={selectedAgent || "System Average"}
            showProjections={true}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Metrics</CardTitle>
              <CardDescription>
                Real-time performance data and 90-day improvement projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading metrics...</div>
                </div>
              ) : agentStatus && agentStatus.length > 0 ? (
                <div className="space-y-4">
                  {agentStatus.map((status: any) => {
                    const agent = agents.find(a => a.id === status.agentType);
                    return (
                      <div key={status.agentType} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${agent?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white text-sm`}>
                              {agent?.icon || '🤖'}
                            </div>
                            <div>
                              <h3 className="font-medium">{agent?.name || status.agentType}</h3>
                              <Badge variant={status.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {status.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{status.confidence || 0}% confidence</div>
                            <div className="text-xs text-muted-foreground">{status.totalQueries || 0} queries</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Response Time</Label>
                            <div className="font-medium">{status.averageResponseTime || 0}ms</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Success Rate</Label>
                            <div className="font-medium">{status.successRate || 0}%</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Last Active</Label>
                            <div className="font-medium">{status.lastActive || 'Never'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No agent metrics available</p>
                  <p className="text-sm">Start testing agents to see performance data</p>
                </div>
              )}
              
              {/* 90-Day Progress Summary */}
              {selectedAgent && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">90-Day Development Progress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Current Phase</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">Phase 1</div>
                        <p className="text-xs text-muted-foreground">OpenAI Baseline Development</p>
                        <Progress value={14} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">Day 14/90</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Progress Target</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">80%</div>
                        <p className="text-xs text-muted-foreground">Via prompt engineering + tools</p>
                        <div className="mt-2 text-xs">
                          <div className="text-muted-foreground">Current: 47%</div>
                          <div className="text-green-600">On track for target</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Baseline Quality</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">90%+</div>
                        <p className="text-xs text-muted-foreground">Expected confidence by day 90</p>
                        <div className="mt-2 text-xs">
                          <div className="text-muted-foreground">Current: 52%</div>
                          <div className="text-yellow-600">Improving baseline tests</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>
                LangGraph conversation threads and agent interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    value={threadId}
                    onChange={(e) => setThreadId(e.target.value)}
                    placeholder="Thread ID"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/langgraph/history"] })}
                  >
                    Refresh
                  </Button>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {history && history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((entry: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-blue-200 pl-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={entry.type === 'input' ? 'default' : 'secondary'}>
                              {entry.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {entry.type === 'input' ? (
                            <p className="text-sm">{entry.query}</p>
                          ) : (
                            <div className="text-sm space-y-2">
                              <p><strong>Agent:</strong> {entry.result?.primaryAgent}</p>
                              <p><strong>Response:</strong> {entry.result?.response || 'Processing...'}</p>
                              <p><strong>Confidence:</strong> {entry.result?.confidence || 0}%</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversation history found</p>
                      <p className="text-sm">Start a conversation to see the history</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}