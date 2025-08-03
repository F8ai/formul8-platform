import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaselineAssessmentSection from '@/components/BaselineAssessmentSection';
import { BaselineTestRunner } from '@/components/ui/baseline-test-runner';
import { BaselineResultsViewer } from '@/components/ui/baseline-results-viewer';
import { BaselineResultsComparison } from '@/components/ui/baseline-results-comparison';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  FileText, 
  MessageSquare, 
  Search,
  BarChart3,
  Map,
  Send,
  Loader2,
  Settings,
  Save,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface StateMetric {
  state_code: string;
  state_name: string;
  status: 'completed' | 'in_progress' | 'failed' | 'not_started';
  last_updated: string;
  processing_metrics: {
    completed_phases: string[];
    failed_phases: string[];
    processing_time: number;
    current_phase: string;
  };
  data_metrics: {
    files_downloaded: number;
    download_size_mb: number;
    html_files: number;
    pdf_files: number;
    forms_found: number;
    regulations_found: number;
  };
  citation_metrics: {
    total_citations: number;
    regulation_citations: number;
    statute_citations: number;
    form_citations: number;
    unique_sections: number;
  };
  rag_metrics: {
    total_vectors: number;
    embedding_dimension: number;
    index_size_mb: number;
    search_quality_score: number;
    retrieval_accuracy: number;
  };
  quality_metrics: {
    data_quality_score: number;
    completeness_score: number;
    accuracy_score: number;
    validation_passed: boolean;
  };
}

interface DashboardData {
  generated_at: string;
  data_source: string;
  authentic_data: boolean;
  baseline_info: {
    agent_type: string;
    description: string;
    version: string;
    last_updated: string;
  };
  question_metrics: {
    total_questions: number;
    categories: string[];
    difficulties: string[];
    category_breakdown: Record<string, number>;
    difficulty_breakdown: Record<string, number>;
  };
  real_questions: Array<{
    id: string;
    category: string;
    question: string;
    expectedAnswer: string;
    difficulty: string;
    tags: string[];
  }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ComplianceAgent() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeTestRun, setActiveTestRun] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [promptConfig, setPromptConfig] = useState<any>(null);
  const [configChanges, setConfigChanges] = useState<any>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch authentic baseline data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/agents/compliance/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch prompt configuration
  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ['/api/agents/compliance/config'],
    onSuccess: (data) => {
      setPromptConfig(data);
    }
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('/api/agents/compliance/chat', {
        method: 'POST',
        body: { message, conversation_id: 'compliance-dashboard' }
      });
    },
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    },
  });

  // Config update mutation
  const configUpdateMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('/api/agents/compliance/config', {
        method: 'PUT',
        body: updates
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Prompt configuration has been saved successfully.",
      });
      setConfigChanges({});
      queryClient.invalidateQueries({ queryKey: ['/api/agents/compliance/config'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleConfigChange = (section: string, field: string, value: any) => {
    setConfigChanges(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveConfig = () => {
    configUpdateMutation.mutate(configChanges);
  };

  const getCurrentConfigValue = (section: string, field: string) => {
    if (configChanges[section] && configChanges[section][field] !== undefined) {
      return configChanges[section][field];
    }
    return promptConfig?.[section]?.[field] || '';
  };

  const handleTestStarted = (runId: number) => {
    setActiveTestRun(runId);
    setActiveTab("results");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-formul8-bg-dark">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-formul8-teal mx-auto mb-2" />
          <span className="text-formul8-text-white">Loading compliance dashboard...</span>
        </div>
      </div>
    );
  }

  const data = dashboardData as DashboardData;

  // Show fallback if no data or if data has error
  if (!data || data.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-formul8-bg-dark">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-formul8-warning" />
          <h2 className="text-xl font-semibold mb-2 text-formul8-text-white">Real Cannabis Regulatory Data Collection</h2>
          <p className="text-formul8-text-gray mb-4">
            Collecting live data from state cannabis regulatory websites including:<br/>
            California DCC, Colorado MED, Washington LCB, Oregon OLCC, and 21+ other states
          </p>
          <div className="bg-formul8-bg-card p-4 rounded-lg border border-formul8-border">
            <p className="text-sm text-formul8-text-white">
              🌐 <strong>Real Data Sources:</strong> cannabis.ca.gov, colorado.gov, lcb.wa.gov, oregon.gov/olcc<br/>
              📊 <strong>No Mock Data:</strong> All metrics collected from actual regulatory websites<br/>
              🔄 <strong>Live Collection:</strong> Processing regulatory citations and compliance documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-formul8-bg-dark text-formul8-text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance Agent Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time cannabis regulatory data from 25 state websites
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Live Data Collection
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              {data?.data_source === 'real_state_websites' ? 'Real regulatory sources' : 'Processing...'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="baseline">Baseline</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Authentic Data Notice */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Authentic Cannabis Compliance Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Data Source:</strong> {data?.data_source || 'baseline_results.json'}
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Description:</strong> {data?.baseline_info?.description || 'Cannabis compliance with authentic test results'}
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Version:</strong> {data?.baseline_info?.version || '1.0'}
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Last Updated:</strong> {data?.baseline_info?.last_updated ? new Date(data.baseline_info.last_updated).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Performance Results */}
            {data?.test_results && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentic Test Performance</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real test results from baseline_results.json
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{data.test_results.accuracy}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{data.test_results.confidence}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{data.test_results.pass_rate}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{data.test_results.response_time}ms</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Tests Passed: <strong className="text-green-600">{data.test_results.passed_tests}</strong></span>
                      <span>Tests Failed: <strong className="text-red-600">{data.test_results.failed_tests}</strong></span>
                      <span>Total Tests: <strong>{data.test_results.total_tests}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.question_metrics?.total_questions || '0'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Baseline test questions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.question_metrics?.categories?.length || '0'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Compliance areas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Difficulty Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.question_metrics?.difficulties?.length || '0'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Question complexity
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Baseline Testing Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Baseline Testing & Model Comparison</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and manage baseline questions with comprehensive model comparison data
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/agent/compliance/baseline">
                    <Button className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      View Baseline Table
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("baseline")}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Run New Test
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("results")}
                    className="flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    View Results
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Baseline Table:</strong> Dynamic table showing questions with model responses, grades, confidence scores, and cost analysis across all available AI models
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Category Performance Results */}
            {data?.baseline_questions && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance Results</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Authentic test results by compliance category
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(data.baseline_questions).map(([category, results]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium capitalize">{category.replace('_', ' ')}</h4>
                          <Badge variant={results.accuracy >= 70 ? 'default' : results.accuracy >= 50 ? 'secondary' : 'destructive'}>
                            {results.accuracy}% accuracy
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Passed: {results.passed}/{results.total}</span>
                          <span>Failed: {results.total - results.passed}</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                results.accuracy >= 70 ? 'bg-green-500' : 
                                results.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${results.accuracy}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Question Categories</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click on a category to view baseline test results
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data?.question_metrics?.category_breakdown && Object.entries(data.question_metrics.category_breakdown).map(([category, count]) => (
                    <div 
                      key={category} 
                      onClick={() => setActiveTab("results")}
                      className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {category.replace(/[-_]/g, ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Question Difficulty</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click on a difficulty level to view baseline test results
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data?.question_metrics?.difficulty_breakdown && Object.entries(data.question_metrics.difficulty_breakdown).map(([difficulty, count]) => (
                    <div 
                      key={difficulty} 
                      onClick={() => setActiveTab("results")}
                      className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real Questions Display */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Authentic Questions & Answers</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real cannabis compliance questions and expert answers from baseline.json
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data?.real_questions?.slice(0, 3).map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                          <Badge variant={question.difficulty === 'advanced' ? 'destructive' : question.difficulty === 'intermediate' ? 'default' : 'secondary'}>
                            {question.difficulty}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">ID: {question.id}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Q: {question.question}
                          </h4>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                            Expert Answer:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {question.expectedAnswer}
                          </p>
                        </div>
                        
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {question.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="baseline" className="space-y-6">
            <BaselineTestRunner agentType="compliance" onTestStarted={handleTestStarted} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <BaselineResultsViewer agentType="compliance" activeTestRun={activeTestRun} />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <BaselineResultsComparison agentType="compliance" />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Expert Chat</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions about cannabis compliance and regulations
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chat functionality will be implemented with authentic compliance data from baseline.json
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Configuration</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure how the compliance agent responds to queries
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Prompt engineering settings will use authentic baseline data structures
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}