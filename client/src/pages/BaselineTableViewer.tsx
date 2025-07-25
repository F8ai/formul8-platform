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
}

export default function BaselineTableViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
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
                                    return (
                                      <TableCell key={model} className="text-center">
                                        {response ? (
                                          <div className="space-y-2">
                                            <Badge 
                                              variant={response.grade >= 80 ? "default" : response.grade >= 60 ? "secondary" : "destructive"}
                                              className="text-xs"
                                            >
                                              {response.grade}%
                                            </Badge>
                                            <div className="text-xs text-muted-foreground">
                                              {response.confidence}% conf
                                            </div>
                                            <div className="max-w-xs p-2 bg-muted rounded text-xs text-left">
                                              <div className="font-semibold mb-1">Response:</div>
                                              <p className="line-clamp-4 text-muted-foreground">
                                                {response.answer}
                                              </p>
                                              {response.answer && response.answer.length > 150 && (
                                                <button 
                                                  className="text-primary hover:underline mt-1"
                                                  onClick={() => {
                                                    alert(`Full ${model} Response:\n\n${response.answer}`);
                                                  }}
                                                >
                                                  Show full response
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">
                                            No response
                                          </Badge>
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