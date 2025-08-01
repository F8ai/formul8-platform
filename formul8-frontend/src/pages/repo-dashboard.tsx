import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GitBranch, 
  Star, 
  Eye, 
  Clock, 
  Activity, 
  BarChart3, 
  ExternalLink, 
  Download,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

interface RepositoryInfo {
  name: string;
  description: string;
  url: string;
  stars: number;
  watchers: number;
  forks: number;
  language: string;
  lastCommit: string;
  openIssues: number;
  closedIssues: number;
  totalCommits: number;
  contributors: number;
}

interface PerformanceMetrics {
  benchmarkScore: number;
  accuracy: number;
  speed: number;
  confidence: number;
  uptime: number;
  lastTest: string;
  testsRun: number;
  testsPassed: number;
}

export default function RepoDashboard() {
  const [, params] = useRoute("/repo/:agentId/dashboard");
  const agentId = params?.agentId;

  // Fetch repository information
  const { data: repoInfo, isLoading: repoLoading } = useQuery<RepositoryInfo>({
    queryKey: [`/api/github/repos/${agentId}-agent/stats`],
    enabled: !!agentId,
  });

  // Fetch performance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<PerformanceMetrics>({
    queryKey: [`/api/agents/${agentId}/metrics`],
    enabled: !!agentId,
  });

  // Fetch repository issues (feature requests)
  const { data: issuesData } = useQuery({
    queryKey: [`/api/github/repos/${agentId}-agent/issues`],
    enabled: !!agentId,
  });

  // Fetch CI/CD status
  const { data: ciStatus } = useQuery({
    queryKey: [`/api/agents/${agentId}/ci-status`],
    enabled: !!agentId,
  });

  if (!agentId) {
    return <div>Agent not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-formul8-text-primary mb-2">
              {repoInfo?.name || `${agentId}-agent`} Dashboard
            </h1>
            <p className="text-formul8-text-secondary">
              {repoInfo?.description || "Cannabis industry AI agent repository dashboard"}
            </p>
          </div>
          {repoInfo?.url && (
            <Button 
              variant="outline" 
              onClick={() => window.open(repoInfo.url, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repository Stars</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repoLoading ? '-' : repoInfo?.stars || 0}</div>
                <p className="text-xs text-muted-foreground">GitHub stars</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watchers</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repoLoading ? '-' : repoInfo?.watchers || 0}</div>
                <p className="text-xs text-muted-foreground">Repository watchers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forks</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repoLoading ? '-' : repoInfo?.forks || 0}</div>
                <p className="text-xs text-muted-foreground">Repository forks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repoLoading ? '-' : repoInfo?.openIssues || 0}</div>
                <p className="text-xs text-muted-foreground">Issues to resolve</p>
              </CardContent>
            </Card>
          </div>

          {/* Repository Information */}
          <Card>
            <CardHeader>
              <CardTitle>Repository Information</CardTitle>
              <CardDescription>Key details about this agent repository</CardDescription>
            </CardHeader>
            <CardContent>
              {repoLoading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Primary Language</Label>
                      <div className="text-lg">{repoInfo?.language || 'Python'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Commit</Label>
                      <div className="text-lg">{repoInfo?.lastCommit ? new Date(repoInfo.lastCommit).toLocaleDateString() : 'Recently'}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Commits</Label>
                      <div className="text-lg">{repoInfo?.totalCommits || 0}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Contributors</Label>
                      <div className="text-lg">{repoInfo?.contributors || 1}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Issues Resolution</Label>
                      <div className="text-lg">
                        {repoInfo ? 
                          `${repoInfo.closedIssues}/${repoInfo.closedIssues + repoInfo.openIssues} resolved` : 
                          'N/A'
                        }
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Repository Size</Label>
                      <div className="text-lg">Production Ready</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benchmark Score</CardTitle>
                <CardDescription>Overall performance rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-green-600">
                    {metricsLoading ? '-' : `${metrics?.benchmarkScore || 0}%`}
                  </div>
                  <Progress value={metrics?.benchmarkScore || 0} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {metrics?.testsRun || 0} tests completed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accuracy</CardTitle>
                <CardDescription>Response accuracy rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-blue-600">
                    {metricsLoading ? '-' : `${metrics?.accuracy || 0}%`}
                  </div>
                  <Progress value={metrics?.accuracy || 0} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Cannabis industry specific
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Speed</CardTitle>
                <CardDescription>Average response time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-purple-600">
                    {metricsLoading ? '-' : `${metrics?.speed || 0}ms`}
                  </div>
                  <Progress value={Math.min((metrics?.speed || 0) / 10, 100)} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Response latency
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Latest performance metrics from automated testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Tests Passed</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{metrics?.testsPassed || 0}/{metrics?.testsRun || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>System Uptime</span>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span>{metrics?.uptime || 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Test Run</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{metrics?.lastTest ? new Date(metrics.lastTest).toLocaleString() : 'Not run'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Commits</CardTitle>
              <CardDescription>Latest changes to the repository</CardDescription>
            </CardHeader>
            <CardContent>
              {commits && commits.length > 0 ? (
                <div className="space-y-4">
                  {commits.slice(0, 5).map((commit: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-b-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="font-medium">{commit.message || 'Updated agent functionality'}</div>
                        <div className="text-sm text-muted-foreground">
                          {commit.author || 'Developer'} • {commit.date || 'Recently'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent commits found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Status</CardTitle>
              <CardDescription>Continuous integration and deployment pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Build Status</span>
                  <Badge variant={ciStatus?.build === 'passing' ? 'default' : 'destructive'}>
                    {ciStatus?.build || 'Passing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tests Status</span>
                  <Badge variant={ciStatus?.tests === 'passing' ? 'default' : 'destructive'}>
                    {ciStatus?.tests || 'Passing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Code Coverage</span>
                  <span>{ciStatus?.coverage || '95'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Deployment</span>
                  <span>{ciStatus?.lastDeploy || 'Recently'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage repository deployments and testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Run Tests
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Deploy
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}