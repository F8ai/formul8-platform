import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertTriangle, Clock, Play, RefreshCw, Activity, Server, Globe, FolderOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  name: string;
  path: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  statusCode?: number;
  expectedStatus?: number;
  responseSize?: number;
  responseTime?: number;
  error?: string;
  warnings?: string[];
  hasValidJson?: boolean;
  dataKeys?: string[];
}

interface ValidationReport {
  pages: ValidationResult[];
  apis: ValidationResult[];
  files: ValidationResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export default function ValidationPage() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ValidationReport | null>(null);

  // Health check query
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 30000,
  });

  // Detailed health check
  const { data: detailedHealth } = useQuery({
    queryKey: ['/api/health/detailed'],
    refetchInterval: 60000,
  });

  // Run validation suite
  const runValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Simulate progress during validation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Run the actual validation by calling our endpoints
      const results: ValidationReport = {
        pages: [],
        apis: [],
        files: [],
        summary: { totalTests: 0, passed: 0, failed: 0, warnings: 0 }
      };

      // Test pages
      const pages = [
        { name: 'Home Page', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Agents', path: '/agents' },
        { name: 'Data Management', path: '/data' },
        { name: 'Roadmap', path: '/roadmap' },
        { name: 'Baseline Testing', path: '/baseline-testing' },
      ];

      for (const page of pages) {
        try {
          const response = await fetch(page.path);
          results.pages.push({
            name: page.name,
            path: page.path,
            status: response.ok ? 'PASS' : 'FAIL',
            statusCode: response.status,
            responseSize: parseInt(response.headers.get('content-length') || '0')
          });
        } catch (error) {
          results.pages.push({
            name: page.name,
            path: page.path,
            status: 'FAIL',
            error: error.message
          });
        }
      }

      // Test APIs
      const apis = [
        { name: 'Health Check', path: '/api/health' },
        { name: 'Agent Status', path: '/api/agent-status' },
        { name: 'Agents List', path: '/api/agents' },
        { name: 'Data Corpora', path: '/api/data/corpora' },
        { name: 'Knowledge Bases', path: '/api/data/knowledge-bases' },
        { name: 'Baseline Coverage', path: '/api/baseline-coverage' },
      ];

      for (const api of apis) {
        try {
          const response = await fetch(api.path);
          const isJson = response.headers.get('content-type')?.includes('application/json');
          let hasValidJson = false;
          let dataKeys = [];

          if (isJson) {
            try {
              const data = await response.json();
              hasValidJson = true;
              dataKeys = typeof data === 'object' ? Object.keys(data) : [];
            } catch (e) {
              hasValidJson = false;
            }
          }

          results.apis.push({
            name: api.name,
            path: api.path,
            status: response.ok ? 'PASS' : 'FAIL',
            statusCode: response.status,
            hasValidJson,
            dataKeys
          });
        } catch (error) {
          results.apis.push({
            name: api.name,
            path: api.path,
            status: 'FAIL',
            error: error.message
          });
        }
      }

      // Calculate summary
      const allResults = [...results.pages, ...results.apis, ...results.files];
      results.summary = {
        totalTests: allResults.length,
        passed: allResults.filter(r => r.status === 'PASS').length,
        failed: allResults.filter(r => r.status === 'FAIL').length,
        warnings: allResults.filter(r => r.warnings?.length > 0).length
      };

      clearInterval(progressInterval);
      setProgress(100);
      setReport(results);
      
      toast({
        title: "Validation Complete",
        description: `${results.summary.passed}/${results.summary.totalTests} tests passed`
      });

    } catch (error) {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAIL':
      case 'unhealthy':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'healthy':
      case 'up':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
      case 'unhealthy':
      case 'down':
        return 'bg-red-100 text-red-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Validation</h1>
          <p className="text-gray-600">Comprehensive health checks for all platform components</p>
        </div>
        <Button 
          onClick={runValidation}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Running...' : 'Run Validation'}
        </Button>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Validation Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : healthData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge className={getStatusColor(healthData.status)}>
                    {getStatusIcon(healthData.status)}
                    {healthData.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uptime:</span>
                  <span>{Math.floor(healthData.uptime / 60)}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response:</span>
                  <span>{healthData.responseTime}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-500">Health check failed</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthData?.services && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Database:</span>
                  <Badge className={getStatusColor(healthData.services.database.status)}>
                    {getStatusIcon(healthData.services.database.status)}
                    {healthData.services.database.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Filesystem:</span>
                  <Badge className={getStatusColor(healthData.services.filesystem.status)}>
                    {getStatusIcon(healthData.services.filesystem.status)}
                    {healthData.services.filesystem.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>APIs:</span>
                  <Badge className={getStatusColor(healthData.services.apis.status)}>
                    {getStatusIcon(healthData.services.apis.status)}
                    {healthData.services.apis.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthData?.metrics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Agents:</span>
                  <span>{healthData.metrics.totalAgents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Corpora:</span>
                  <span>{healthData.metrics.totalCorpora}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Knowledge Bases:</span>
                  <span>{healthData.metrics.totalKnowledgeBases}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {report && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="pages">Pages ({report.pages.length})</TabsTrigger>
            <TabsTrigger value="apis">APIs ({report.apis.length})</TabsTrigger>
            <TabsTrigger value="agents">Agent Details</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{report.summary.totalTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-green-600">Passed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{report.summary.passed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-red-600">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{report.summary.failed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-yellow-600">Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{report.summary.warnings}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={(report.summary.passed / report.summary.totalTests) * 100} 
                  className="h-4"
                />
                <div className="mt-2 text-center text-sm text-gray-600">
                  {Math.round((report.summary.passed / report.summary.totalTests) * 100)}% of tests passing
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Page Validation Results
                </CardTitle>
                <CardDescription>Frontend page accessibility and response checks</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {report.pages.map((page, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(page.status)}
                          <div>
                            <div className="font-medium">{page.name}</div>
                            <div className="text-sm text-gray-600">{page.path}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {page.statusCode && (
                            <Badge variant="outline">{page.statusCode}</Badge>
                          )}
                          {page.error && (
                            <div className="text-sm text-red-600 mt-1">{page.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  API Validation Results
                </CardTitle>
                <CardDescription>Backend API endpoint functionality checks</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {report.apis.map((api, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(api.status)}
                          <div>
                            <div className="font-medium">{api.name}</div>
                            <div className="text-sm text-gray-600">{api.path}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {api.statusCode && (
                              <Badge variant="outline">{api.statusCode}</Badge>
                            )}
                            {api.hasValidJson && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                JSON
                              </Badge>
                            )}
                          </div>
                          {api.dataKeys && api.dataKeys.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              {api.dataKeys.length} keys
                            </div>
                          )}
                          {api.error && (
                            <div className="text-sm text-red-600 mt-1">{api.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
                <CardDescription>Detailed information about each agent's health</CardDescription>
              </CardHeader>
              <CardContent>
                {detailedHealth?.agents && (
                  <div className="space-y-4">
                    {detailedHealth.agents.map((agent, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium capitalize">{agent.name}</h3>
                          <div className="flex items-center gap-2">
                            {agent.hasCorpus && <Badge variant="outline">Corpus</Badge>}
                            {agent.hasKnowledgeBase && <Badge variant="outline">KB</Badge>}
                            {agent.hasBaseline && <Badge variant="outline">Baseline</Badge>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Corpus Size</div>
                            <div>{Math.round(agent.corpusSize / 1024)}KB</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Questions</div>
                            <div>{agent.baselineQuestions}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Directory</div>
                            <div className="font-mono">{agent.directory}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Modified</div>
                            <div>{agent.lastModified ? new Date(agent.lastModified).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}