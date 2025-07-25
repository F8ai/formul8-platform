import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BaselineQuestion {
  id: number;
  question: string;
  expected_answer: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  keywords?: string[];
  state?: string;
  tags?: string[];
  lastUpdated?: string;
  modelResponses?: ModelResponse[];
}

interface ModelResponse {
  model: string;
  answer: string;
  confidence: number;
  grade: number;
  gradingConfidence: number;
  responseTime?: number;
  cost?: number;
  status?: string;
}

export default function BaselineTableViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch baseline questions with model responses
  const { data: questionsData = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['/api/agents/compliance/baseline-questions-with-responses'],
    queryFn: async () => {
      const response = await fetch('/api/agents/compliance/baseline-questions-with-responses');
      if (!response.ok) throw new Error('Failed to fetch questions with responses');
      return response.json();
    }
  });

  // Function to run a real model test
  const runModelTest = async (questionId: string, model: string) => {
    const testKey = `${questionId}-${model}`;
    setTestingModels(prev => new Set(prev).add(testKey));
    
    try {
      const response = await fetch(`/api/agents/compliance/baseline-questions/${questionId}/test/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to test model: ${response.statusText}`);
      }
      
      await response.json();
      
      // Refresh questions to get updated data
      await refetchQuestions();
      
      toast({
        title: "Model test completed",
        description: `${model} has been tested on question ${questionId}`,
      });
    } catch (error) {
      console.error(`Error testing model ${model}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Model test failed",
        description: `Failed to test ${model}: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setTestingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(testKey);
        return newSet;
      });
    }
  };

  const questions = questionsData.map((q: any) => ({
    ...q,
    modelResponses: q.modelResponses || []
  }));

  // Extract all unique models from the data
  const availableModels = useMemo(() => {
    const modelSet = new Set<string>();
    questions.forEach((q: any) => {
      q.modelResponses?.forEach((response: ModelResponse) => {
        modelSet.add(response.model);
      });
    });
    return Array.from(modelSet).sort();
  }, [questions]);

  // Calculate cost and performance metrics
  const modelMetrics = useMemo(() => {
    const metrics: Record<string, {
      totalCost: number,
      avgResponseTime: number,
      avgGrade: number,
      testCount: number
    }> = {};

    availableModels.forEach(model => {
      const responses = questions.flatMap((q: any) => 
        q.modelResponses?.filter((r: ModelResponse) => r.model === model && r.cost && r.cost > 0) || []
      );
      
      metrics[model] = {
        totalCost: responses.reduce((sum, r) => sum + (r.cost || 0), 0),
        avgResponseTime: responses.length > 0 ? responses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / responses.length : 0,
        avgGrade: responses.length > 0 ? responses.reduce((sum, r) => sum + r.grade, 0) / responses.length : 0,
        testCount: responses.length
      };
    });

    return metrics;
  }, [questions, availableModels]);

  // Group questions by category
  const questionsByCategory = useMemo(() => {
    const grouped: Record<string, BaselineQuestion[]> = {};
    questions.forEach((q: BaselineQuestion) => {
      const category = q.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(q);
    });
    return grouped;
  }, [questions]);

  // Apply filters to each category
  const filteredQuestionsByCategory = useMemo(() => {
    const filtered: Record<string, BaselineQuestion[]> = {};
    Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
      const filteredCategoryQuestions = categoryQuestions.filter((q: BaselineQuestion) => {
        const matchesSearch = !searchTerm || 
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.expected_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (q.keywords && q.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
        
        const matchesDifficulty = !difficultyFilter || difficultyFilter === 'all' || q.difficulty === difficultyFilter;
        const matchesState = !stateFilter || stateFilter === 'all' || q.state === stateFilter;
        
        return matchesSearch && matchesDifficulty && matchesState;
      });
      
      if (filteredCategoryQuestions.length > 0) {
        filtered[category] = filteredCategoryQuestions;
      }
    });
    return filtered;
  }, [questionsByCategory, searchTerm, difficultyFilter, stateFilter]);

  // Extract all unique states
  const states = useMemo(() => {
    const stateSet = new Set<string>();
    questions.forEach((q: BaselineQuestion) => {
      if (q.state) stateSet.add(q.state);
    });
    return Array.from(stateSet).sort();
  }, [questions]);

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  // Get unique values for filters
  const categories = Array.from(new Set(questions.map((q: BaselineQuestion) => q.category))).filter(Boolean);

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get response for a specific model and question
  const getModelResponse = (question: BaselineQuestion, model: string): ModelResponse | null => {
    return question.modelResponses?.find((r: ModelResponse) => r.model === model) || null;
  };

  // Calculate category statistics
  const getCategoryStats = (categoryQuestions: BaselineQuestion[]) => {
    const totalQuestions = categoryQuestions.length;
    const totalResponses = categoryQuestions.reduce((acc, q) => acc + (q.modelResponses?.length || 0), 0);
    const avgGrade = totalResponses > 0 
      ? categoryQuestions.reduce((acc, q) => {
          const grades = q.modelResponses?.map((r: ModelResponse) => r.grade) || [];
          return acc + grades.reduce((sum, grade) => sum + grade, 0);
        }, 0) / totalResponses
      : 0;
    
    return { totalQuestions, totalResponses, avgGrade };
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Baseline Questions with Model Responses</h1>
            <p className="text-muted-foreground">
              Showing results for {availableModels.length} models: {availableModels.join(', ')}
            </p>
          </div>
          <Button onClick={() => refetchQuestions()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Model Performance Metrics */}
        {availableModels.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Model Performance & Cost Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time costs and performance from actual API calls
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableModels.map(model => {
                  const metrics = modelMetrics[model];
                  const hasRealData = questions.some((q: any) => 
                    q.modelResponses?.some((r: ModelResponse) => r.model === model && r.status === 'success')
                  );
                  
                  return (
                    <div key={model} className={`border rounded-lg p-4 ${hasRealData ? 'bg-muted/30' : 'bg-yellow-50/50 opacity-70'}`}>
                      <div className="font-medium text-sm mb-3 text-center flex items-center justify-center gap-1">
                        {model}
                        {!hasRealData && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                            SIMULATED
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tests:</span>
                          <span className="font-medium">{metrics.testCount}</span>
                        </div>
                        {metrics.totalCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Cost:</span>
                            <span className={`font-medium ${hasRealData ? 'text-green-600' : 'text-yellow-600'}`}>
                              ${metrics.totalCost.toFixed(4)}
                              {!hasRealData && <span className="text-xs ml-1">(est.)</span>}
                            </span>
                          </div>
                        )}
                        {metrics.avgGrade > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Grade:</span>
                            <Badge variant={metrics.avgGrade >= 80 ? "default" : metrics.avgGrade >= 60 ? "secondary" : "destructive"} className="text-xs">
                              {metrics.avgGrade.toFixed(1)}%
                              {!hasRealData && <span className="ml-1">(sim.)</span>}
                            </Badge>
                          </div>
                        )}
                        {metrics.avgResponseTime > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Time:</span>
                            <span className={`font-medium ${hasRealData ? 'text-blue-600' : 'text-yellow-600'}`}>
                              {(metrics.avgResponseTime / 1000).toFixed(1)}s
                              {!hasRealData && <span className="text-xs ml-1">(est.)</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDifficultyFilter('all');
                  setStateFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category-Based Collapsible Sections */}
        <div className="space-y-4">
          {questionsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading questions and responses...
              </CardContent>
            </Card>
          ) : Object.keys(filteredQuestionsByCategory).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                No questions found matching the current filters.
              </CardContent>
            </Card>
          ) : (
            Object.entries(filteredQuestionsByCategory).map(([category, categoryQuestions]) => {
              const stats = getCategoryStats(categoryQuestions);
              const isCollapsed = collapsedCategories.has(category);
              
              return (
                <Card key={category}>
                  <Collapsible>
                    <CollapsibleTrigger 
                      className="w-full"
                      onClick={() => toggleCategory(category)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">{category}</CardTitle>
                          <Badge variant="secondary">
                            {stats.totalQuestions} questions
                          </Badge>
                          {stats.totalResponses > 0 && (
                            <Badge variant="outline">
                              {stats.avgGrade.toFixed(1)}% avg grade
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-96">Question</TableHead>
                                <TableHead className="w-20">Difficulty</TableHead>
                                <TableHead className="w-16">State</TableHead>
                                {availableModels.map(model => (
                                  <TableHead key={model} className="w-32 text-center">
                                    {model}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryQuestions.map((question) => (
                                <TableRow key={question.id}>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <p className="font-medium">{question.question}</p>
                                      {question.state && (
                                        <Badge variant="outline" className="text-xs">
                                          {question.state}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${getDifficultyBadgeColor(question.difficulty)} text-xs`}>
                                      {question.difficulty}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {question.state || 'MULTI'}
                                    </Badge>
                                  </TableCell>
                                  {availableModels.map(model => {
                                    const response = getModelResponse(question, model);
                                    const testKey = `${question.id.toString()}-${model}`;
                                    const isTesting = testingModels.has(testKey);
                                    const isUntestedModel = response && response.answer === 'Click "Run Test" to generate real response from this model';
                                    
                                    return (
                                      <TableCell key={model} className="text-center">
                                        {response && !isUntestedModel ? (
                                          <div className={`space-y-2 ${response.status === 'success' ? '' : 'opacity-60 grayscale'}`}>
                                            <div className="flex items-center gap-1">
                                              <Badge 
                                                variant={response.grade >= 80 ? "default" : response.grade >= 60 ? "secondary" : "destructive"}
                                                className="text-xs"
                                              >
                                                {response.grade}%
                                              </Badge>
                                              {response.status !== 'success' && (
                                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                                  SIMULATED
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {response.confidence}% conf
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              {response.cost && response.cost > 0 && (
                                                <span className="text-green-600 font-medium">
                                                  ${response.cost.toFixed(4)}
                                                </span>
                                              )}
                                              {response.responseTime && response.responseTime > 0 && (
                                                <span className="text-blue-600">
                                                  {(response.responseTime / 1000).toFixed(1)}s
                                                </span>
                                              )}
                                            </div>
                                            <div className="max-w-xs p-2 bg-muted rounded text-xs text-left">
                                              <div className="font-semibold mb-1 flex items-center gap-1">
                                                Response:
                                                {response.status !== 'success' && (
                                                  <span className="text-yellow-600 text-xs">(Simulated)</span>
                                                )}
                                              </div>
                                              <p className="line-clamp-4 text-muted-foreground">
                                                {response.answer}
                                              </p>
                                              {response.answer && response.answer.length > 150 && (
                                                <button 
                                                  className="text-primary hover:underline mt-1"
                                                  onClick={() => {
                                                    const title = response.status === 'success' ? `Full ${model} Response` : `Full ${model} Response (SIMULATED DATA)`;
                                                    alert(`${title}:\n\n${response.answer}`);
                                                  }}
                                                >
                                                  Show full response
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => runModelTest(question.id.toString(), model)}
                                              disabled={isTesting}
                                              className="text-xs"
                                            >
                                              {isTesting ? (
                                                <>
                                                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                                  Testing...
                                                </>
                                              ) : (
                                                'Run Test'
                                              )}
                                            </Button>
                                            {isUntestedModel && (
                                              <div className="text-xs text-muted-foreground">
                                                Real API
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}