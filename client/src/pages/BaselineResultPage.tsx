import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CostDisplay } from "@/components/ui/cost-display";
import { ArrowLeft, Bot, Eye, Edit, FileText, Clock, Target, TrendingUp, Filter, X } from "lucide-react";
import { Link } from "wouter";

interface BaselineTestResult {
  id: number;
  runId: number;
  questionId: string;
  question: string;
  expectedAnswer: string;
  agentResponse: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  accuracy?: number;
  confidence?: number;
  responseTime?: number;
  manualGrade?: number;
  aiGrade?: number;
  aiGradingConfidence?: number;
  maxScore: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  aiGradingInputTokens?: number;
  aiGradingOutputTokens?: number;
  aiGradingTotalTokens?: number;
  aiGradingEstimatedCost?: number;
  createdAt: string;
}

interface BaselineTestRun {
  id: number;
  agentType: string;
  model: string;
  state?: string;
  status: string;
  totalQuestions: number;
  successfulTests: number;
  avgAccuracy?: number;
  avgConfidence?: number;
  avgResponseTime?: number;
  totalCost?: number;
  createdAt: string;
}

export default function BaselineResultPage() {
  const params = useParams();
  const search = useSearch();
  const { agentType, resultId } = params;
  
  // Debug logging
  console.log('BaselineResultPage params:', { agentType, resultId });
  console.log('BaselineResultPage search:', search);
  console.log('BaselineResultPage full params:', params);
  
  const [testRun, setTestRun] = useState<BaselineTestRun | null>(null);
  const [testResults, setTestResults] = useState<BaselineTestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<BaselineTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BaselineTestResult | null>(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  
  const { toast } = useToast();



  // Parse URL parameters for initial filters
  useEffect(() => {
    const urlParams = new URLSearchParams(search);
    const category = urlParams.get('category');
    const difficulty = urlParams.get('difficulty');
    
    if (category) setCategoryFilter(category);
    if (difficulty) setDifficultyFilter(difficulty);
  }, [search]);

  useEffect(() => {
    if (resultId) {
      loadBaselineResults();
    }
  }, [resultId]);

  const loadBaselineResults = async () => {
    setLoading(true);
    try {
      // Parse the resultId to extract run info
      // Format: baseline-{state}-{model} or just {runId}
      let runId: number;
      let state: string | undefined;
      let model: string | undefined;

      // Handle formats: CO-gpt4o, baseline-CO-gpt4o, or just runId
      if (resultId?.includes('-') && isNaN(parseInt(resultId))) {
        const parts = resultId.replace('baseline-', '').split('-');
        if (parts.length >= 2) {
          state = parts[0];
          model = parts.slice(1).join('-');
        }
        
        // Find the most recent run matching these criteria
        const runsResponse = await fetch('/api/baseline-testing/runs');
        if (!runsResponse.ok) {
          throw new Error('Failed to fetch test runs');
        }
        const runs = await runsResponse.json();
        
        // Debug logging
        console.log('Looking for run with:', { agentType, state, model });
        console.log('Available runs:', runs);
        
        const matchingRun = runs.find((run: BaselineTestRun) => {
          const agentMatch = run.agentType === agentType;
          const stateMatch = !state || run.state === state;
          
          // Improved model matching - handle common format variations
          let modelMatch = false;
          if (!model) {
            modelMatch = true;
          } else {
            const runModelNormalized = run.model.toLowerCase().replace(/[-_]/g, '');
            const searchModelNormalized = model.toLowerCase().replace(/[-_]/g, '');
            modelMatch = runModelNormalized.includes(searchModelNormalized) || 
                        searchModelNormalized.includes(runModelNormalized);
          }
          
          console.log('Checking run:', run.id, { 
            agentMatch, 
            stateMatch, 
            modelMatch, 
            runModel: run.model, 
            searchModel: model 
          });
          return agentMatch && stateMatch && modelMatch;
        });
        
        if (!matchingRun) {
          console.error('No matching run found for:', { agentType, state, model });
          console.log('Trying fallback - looking for any run with agentType:', agentType);
          
          // Try fallback - find any run for this agent type
          const fallbackRun = runs.find((run: BaselineTestRun) => run.agentType === agentType);
          
          if (fallbackRun) {
            console.log('Using fallback run:', fallbackRun.id);
            runId = fallbackRun.id;
          } else {
            toast({
              title: "No Test Data Found", 
              description: `No baseline test runs found for ${agentType}. Please run a baseline test first.`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        } else {
          runId = matchingRun.id;
        }
        
        runId = matchingRun.id;
      } else {
        // Direct run ID
        runId = parseInt(resultId || '0');
      }

      // Load run details
      const runResponse = await fetch(`/api/baseline-testing/runs/${runId}`);
      if (!runResponse.ok) {
        throw new Error('Failed to load test run');
      }
      const runData = await runResponse.json();
      setTestRun(runData);

      // Load test results
      const resultsResponse = await fetch(`/api/baseline-testing/runs/${runId}/results`);
      if (!resultsResponse.ok) {
        throw new Error('Failed to load test results');
      }
      const resultsData = await resultsResponse.json();
      setTestResults(resultsData);
      setFilteredResults(resultsData);

    } catch (error) {
      console.error('Error loading baseline results:', error);
      toast({
        title: "Error",
        description: "Failed to load baseline results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter results based on current filters
  useEffect(() => {
    let filtered = testResults;

    if (categoryFilter) {
      filtered = filtered.filter(result => 
        result.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (difficultyFilter) {
      filtered = filtered.filter(result => 
        result.difficulty === difficultyFilter
      );
    }

    if (searchFilter) {
      filtered = filtered.filter(result =>
        result.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
        result.questionId.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    setFilteredResults(filtered);
  }, [testResults, categoryFilter, difficultyFilter, searchFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccuracyColor = (accuracy: number | undefined) => {
    if (!accuracy) return 'text-gray-500';
    if (accuracy >= 85) return 'text-green-600';
    if (accuracy >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading baseline results...</p>
        </div>
      </div>
    );
  }

  if (!testRun) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Baseline Results Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The requested baseline test results could not be found.
        </p>
        <Link href="/baseline-testing">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Baseline Testing
          </Button>
        </Link>
      </div>
    );
  }

  const categoryStats = filteredResults.reduce((acc, result) => {
    const category = result.category;
    if (!acc[category]) {
      acc[category] = { total: 0, passed: 0, avgAccuracy: 0 };
    }
    acc[category].total++;
    if (result.accuracy && result.accuracy >= 70) {
      acc[category].passed++;
    }
    acc[category].avgAccuracy += result.accuracy || 0;
    return acc;
  }, {} as Record<string, { total: number; passed: number; avgAccuracy: number }>);

  // Calculate averages
  Object.keys(categoryStats).forEach(category => {
    categoryStats[category].avgAccuracy = categoryStats[category].avgAccuracy / categoryStats[category].total;
  });

  return (
    <div className="space-y-6">

      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/baseline-testing">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {testRun.agentType.replace('-agent', '').toUpperCase()} Baseline Results
            </h1>
            <p className="text-muted-foreground">
              Run #{testRun.id} • {testRun.model}
              {testRun.state && ` • ${testRun.state}`}
              • {new Date(testRun.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRun.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {testRun.successfulTests} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAccuracyColor(testRun.avgAccuracy)}`}>
              {testRun.avgAccuracy ? `${testRun.avgAccuracy.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
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
              {testRun.avgResponseTime ? `${testRun.avgResponseTime.toFixed(2)}s` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testRun.totalCost ? `$${testRun.totalCost.toFixed(4)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Including AI grading
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {(categoryFilter || difficultyFilter || searchFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('');
                  setDifficultyFilter('');
                  setSearchFilter('');
                }}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {Array.from(new Set(testResults.map(r => r.category))).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All difficulties</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <Input
                placeholder="Search questions..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>
          
          {(categoryFilter || difficultyFilter || searchFilter) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Showing {filteredResults.length} of {testResults.length} results
                </span>
                <div className="flex gap-2">
                  {categoryFilter && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Category: {categoryFilter}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setCategoryFilter('')}
                      />
                    </Badge>
                  )}
                  {difficultyFilter && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Difficulty: {difficultyFilter}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setDifficultyFilter('')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance */}
      {Object.keys(categoryStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
            <CardDescription>
              Breakdown of results across different question categories
              {(categoryFilter || difficultyFilter) && ' (filtered view)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats.passed}/{stats.total}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Pass Rate</span>
                      <span className={getAccuracyColor((stats.passed / stats.total) * 100)}>
                        {((stats.passed / stats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Accuracy</span>
                      <span className={getAccuracyColor(stats.avgAccuracy)}>
                        {stats.avgAccuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>
            Individual question results with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Grades</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-mono text-xs">{result.questionId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(result.difficulty)}>
                      {result.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={getAccuracyColor(result.accuracy)}>
                      {result.accuracy ? `${result.accuracy.toFixed(1)}%` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {result.manualGrade !== null ? `Manual: ${result.manualGrade}/${result.maxScore}` : 'Manual: Not graded'}
                      </div>
                      <div className="text-sm text-blue-600">
                        {result.aiGrade !== null ? (
                          <div className="space-y-1">
                            <span>AI: {result.aiGrade}/{result.maxScore}</span>
                            {result.aiGradingConfidence && (
                              <div className="text-xs text-gray-500">
                                Confidence: {result.aiGradingConfidence}%
                              </div>
                            )}
                          </div>
                        ) : 'AI: Not graded'}
                      </div>
                      {result.confidence && (
                        <div className="text-xs text-green-600">
                          Model Confidence: {result.confidence.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <CostDisplay 
                        cost={result.estimatedCost || 0} 
                        tokens={result.totalTokens}
                        variant="outline"
                      />
                      {result.aiGradingEstimatedCost && (
                        <CostDisplay 
                          cost={result.aiGradingEstimatedCost} 
                          tokens={result.aiGradingTotalTokens}
                          variant="secondary"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Question Details - {result.questionId}</DialogTitle>
                          <DialogDescription>
                            Review the question, expected answer, and agent response
                          </DialogDescription>
                        </DialogHeader>
                        {selectedResult && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Question</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded">{selectedResult.question}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Expected Answer</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded">{selectedResult.expectedAnswer}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Agent Response</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded">{selectedResult.agentResponse}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Performance Metrics</Label>
                                <div className="text-sm space-y-1 mt-1">
                                  <div>Accuracy: {selectedResult.accuracy?.toFixed(1)}%</div>
                                  <div>Confidence: {selectedResult.confidence?.toFixed(1)}%</div>
                                  <div>Response Time: {selectedResult.responseTime?.toFixed(2)}s</div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Cost Breakdown</Label>
                                <div className="text-sm space-y-1 mt-1">
                                  <div>Input Tokens: {selectedResult.inputTokens || 0}</div>
                                  <div>Output Tokens: {selectedResult.outputTokens || 0}</div>
                                  <div>Total Cost: ${selectedResult.estimatedCost?.toFixed(6) || '0.000000'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}