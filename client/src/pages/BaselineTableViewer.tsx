import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HumanGradingInterface from '@/components/HumanGradingInterface';

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

interface TestResultRow {
  questionId: number;
  question: string;
  expected_answer: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  state: string;
  model: string;
  ragEnabled: boolean;
  knowledgeBase: string;
  response: ModelResponse;
}

interface ModelResponse {
  id?: number;
  model: string;
  answer: string;
  confidence: number;
  grade: number;
  gradingConfidence: number;
  responseTime?: number;
  cost?: number;
  status?: string;
  // Human grading fields
  humanGrade?: number;
  humanGradedBy?: string;
  humanGradingNotes?: string;
  humanImprovedResponse?: string;
  humanGradedAt?: string;
  gradingAgreement?: number;
  requiresReview?: boolean;
  // AI grading details
  aiGradingReasoning?: string;
}

interface BaselineTableViewerProps {
  agentType?: string;
}

export default function BaselineTableViewer({ agentType: propAgentType }: BaselineTableViewerProps) {
  const params = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const agentType = propAgentType || pathParts[2] || 'compliance'; // Extract from /agent/{agentType}/baseline
  
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineJson, setBaselineJson] = useState('');
  const [editingQuestions, setEditingQuestions] = useState<Set<number>>(new Set());
  const [editingData, setEditingData] = useState<Record<number, Partial<BaselineQuestion>>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real baseline test results from JSON files using universal endpoint
  const { data: questionsData = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['/api/agents', agentType, 'baseline-results'],
    queryFn: async () => {
      console.log(`Loading baseline results for agent: ${agentType}`);
      const response = await fetch(`/api/agents/${agentType}/baseline-results`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length} questions for ${agentType} agent`);
        return data;
      } else {
        console.error(`Failed to load baseline results for ${agentType}:`, response.status);
        return [];
      }
    },
    enabled: !!agentType
  });

  console.log(`BaselineTableViewer loaded for ${agentType} agent with ${questionsData.length} questions`);

  // Fetch raw baseline.json for editing
  const { data: rawBaselineData, refetch: refetchBaseline } = useQuery({
    queryKey: ['/api/agents', agentType, 'baseline-json'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentType}/baseline-json`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load baseline.json');
    },
    enabled: false // Only fetch when editing
  });

  // Mutation to save baseline.json
  const saveBaselineMutation = useMutation({
    mutationFn: async (baselineData: any) => {
      const response = await fetch(`/api/agents/${agentType}/baseline-json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baselineData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save baseline');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Baseline saved successfully",
        description: data.message,
      });
      setEditingBaseline(false);
      queryClient.invalidateQueries({
        queryKey: ['/api/agents', agentType, 'baseline-results']
      });
      refetchQuestions();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save baseline",
        description: error.message || 'Unknown error occurred',
        variant: "destructive"
      });
    }
  });

  // Handle opening baseline editor
  const handleEditBaseline = async () => {
    try {
      await refetchBaseline();
      if (rawBaselineData) {
        setBaselineJson(JSON.stringify(rawBaselineData, null, 2));
        setEditingBaseline(true);
      }
    } catch (error) {
      toast({
        title: "Failed to load baseline",
        description: "Could not load baseline.json for editing",
        variant: "destructive"
      });
    }
  };

  // Handle saving baseline
  const handleSaveBaseline = () => {
    try {
      const parsedData = JSON.parse(baselineJson);
      saveBaselineMutation.mutate(parsedData);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax",
        variant: "destructive"
      });
    }
  };

  // Function to run a real model test
  const runModelTest = async (questionId: string, model: string) => {
    const testKey = `${questionId}-${model}`;
    setTestingModels(prev => new Set(prev).add(testKey));
    
    try {
      const response = await fetch(`/api/agents/${agentType}/baseline-questions/${questionId}/test/${model}`, {
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

  // Process questions into organized structure
  const questions = useMemo(() => {
    if (!questionsData || questionsData.length === 0) return [];
    
    return questionsData.map((q: any) => ({
      ...q,
      modelResponses: q.modelResponses || []
    }));
  }, [questionsData]);

  // Flatten questions into individual test result rows
  const testResultRows = useMemo(() => {
    const rows: TestResultRow[] = [];
    
    questions.forEach((question: any) => {
      if (question.modelResponses && question.modelResponses.length > 0) {
        question.modelResponses.forEach((response: ModelResponse) => {
          rows.push({
            questionId: question.id,
            question: question.question,
            expected_answer: question.expected_answer,
            category: question.category,
            difficulty: question.difficulty,
            state: question.state || 'MULTI',
            model: response.model,
            ragEnabled: response.model.includes('rag') || false, // Detect RAG from model name
            knowledgeBase: response.model.includes('kb') ? 'Cannabis KB' : 'Standard', // Detect KB from model name
            response: response
          });
        });
      } else {
        // Show questions without responses
        rows.push({
          questionId: question.id,
          question: question.question,
          expected_answer: question.expected_answer,
          category: question.category,
          difficulty: question.difficulty,
          state: question.state || 'MULTI',
          model: 'No test run',
          ragEnabled: false,
          knowledgeBase: 'N/A',
          response: {
            model: 'No test run',
            answer: 'Click "Run Test" to generate response',
            confidence: 0,
            grade: 0,
            gradingConfidence: 0,
            status: 'pending'
          } as ModelResponse
        });
      }
    });
    
    return rows;
  }, [questions]);

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
        totalCost: responses.reduce((sum: number, r: ModelResponse) => sum + (r.cost || 0), 0),
        avgResponseTime: responses.length > 0 ? responses.reduce((sum: number, r: ModelResponse) => sum + (r.responseTime || 0), 0) / responses.length : 0,
        avgGrade: responses.length > 0 ? responses.reduce((sum: number, r: ModelResponse) => sum + r.grade, 0) / responses.length : 0,
        testCount: responses.length
      };
    });

    return metrics;
  }, [questions, availableModels]);

  // Apply filters to test result rows
  const filteredTestResults = useMemo(() => {
    return testResultRows.filter((row: TestResultRow) => {
      const matchesSearch = !searchTerm || 
        row.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.expected_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.response.answer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = !difficultyFilter || difficultyFilter === 'all' || row.difficulty === difficultyFilter;
      const matchesState = !stateFilter || stateFilter === 'all' || row.state === stateFilter;
      const matchesModel = !modelFilter || modelFilter === 'all' || row.model === modelFilter;
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || row.category === categoryFilter;
      
      return matchesSearch && matchesDifficulty && matchesState && matchesModel && matchesCategory;
    });
  }, [testResultRows, searchTerm, difficultyFilter, stateFilter, modelFilter, categoryFilter]);

  // Extract all unique states
  const states = useMemo(() => {
    const stateSet = new Set<string>();
    testResultRows.forEach((row: TestResultRow) => {
      if (row.state) stateSet.add(row.state);
    });
    return Array.from(stateSet).sort();
  }, [testResultRows]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    testResultRows.forEach((row: TestResultRow) => {
      if (row.category) categorySet.add(row.category);
    });
    return Array.from(categorySet).sort();
  }, [testResultRows]);

  // Group filtered results by category, then by question to avoid duplicates
  const groupedResults = useMemo(() => {
    const groups: Record<string, TestResultRow[]> = {};
    
    // First, group by question ID to consolidate multiple model responses
    const questionGroups: Record<string, TestResultRow[]> = {};
    filteredTestResults.forEach(row => {
      const questionKey = `${row.questionId}`;
      if (!questionGroups[questionKey]) {
        questionGroups[questionKey] = [];
      }
      questionGroups[questionKey].push(row);
    });
    
    // Then group by category, taking only the first row per question for display
    Object.values(questionGroups).forEach(questionRows => {
      const firstRow = questionRows[0]; // Use first model response as the primary row
      const category = firstRow.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      
      // Attach all model responses to the first row for display
      const consolidatedRow = {
        ...firstRow,
        allModelResponses: questionRows.map(r => r.response)
      };
      groups[category].push(consolidatedRow);
    });
    
    return groups;
  }, [filteredTestResults]);





  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const startEditingQuestion = (questionId: number, question: BaselineQuestion) => {
    setEditingQuestions(prev => new Set(prev).add(questionId));
    setEditingData(prev => ({
      ...prev,
      [questionId]: {
        question: question.question,
        expected_answer: question.expected_answer,
        category: question.category,
        difficulty: question.difficulty,
        state: question.state
      }
    }));
  };

  const cancelEditingQuestion = (questionId: number) => {
    setEditingQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[questionId];
      return newData;
    });
  };

  const saveQuestionEdit = async (questionId: number) => {
    const editData = editingData[questionId];
    if (!editData) return;

    try {
      const response = await fetch(`/api/agents/${agentType}/baseline-questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      toast({
        title: "Question updated",
        description: "The baseline question has been saved successfully.",
      });

      // Remove from editing state
      cancelEditingQuestion(questionId);
      
      // Refresh data
      refetchQuestions();
    } catch (error) {
      toast({
        title: "Failed to update question",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const updateEditingData = (questionId: number, field: string, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const isCategoryCollapsed = (category: string) => collapsedCategories.has(category);



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
          <div className="flex gap-2">
            <Button onClick={handleEditBaseline} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Baseline
            </Button>
            <Button onClick={() => refetchQuestions()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
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

        {/* Compact Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {(searchTerm || difficultyFilter !== 'all' || stateFilter !== 'all' || modelFilter !== 'all' || categoryFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setDifficultyFilter('all');
                setStateFilter('all');
                setModelFilter('all');
                setCategoryFilter('all');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => {
              const visibleQuestions = filteredTestResults.map(row => row.questionId);
              if (editingQuestions.size === 0) {
                // Start editing all visible questions
                setEditingQuestions(new Set(visibleQuestions));
                const newEditingData: Record<number, Partial<BaselineQuestion>> = {};
                filteredTestResults.forEach(row => {
                  newEditingData[row.questionId] = {
                    question: row.question,
                    expected_answer: row.expected_answer,
                    category: row.category,
                    difficulty: row.difficulty,
                    state: row.state
                  };
                });
                setEditingData(newEditingData);
              } else {
                // Stop editing all
                setEditingQuestions(new Set());
                setEditingData({});
              }
            }}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {editingQuestions.size === 0 ? 'Edit Mode' : 'Cancel Edits'}
          </Button>
          
          {editingQuestions.size > 0 && (
            <Button
              onClick={() => {
                // Save all editing questions
                editingQuestions.forEach(questionId => {
                  saveQuestionEdit(questionId);
                });
              }}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save All ({editingQuestions.size})
            </Button>
          )}
        </div>

        {/* Test Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Questions & Responses ({Object.values(groupedResults).flat().length} questions)</CardTitle>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading test results...
              </div>
            ) : filteredTestResults.length === 0 ? (
              <div className="text-center py-8">
                No test results found matching the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[500px] max-w-[600px]">Question & AI Responses</TableHead>
                      <TableHead className="w-24">Category</TableHead>
                      <TableHead className="w-24">Difficulty</TableHead>
                      <TableHead className="w-16">State</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedResults).map(([category, categoryRows]) => {
                      const isCollapsed = isCategoryCollapsed(category);
                      const questionCount = categoryRows.length;
                      
                      return (
                        <React.Fragment key={`category-${category}`}>
                          {/* Category Header Row */}
                          <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                            <TableCell colSpan={5} className="font-semibold">
                              <button
                                onClick={() => toggleCategoryCollapse(category)}
                                className="flex items-center gap-2 w-full text-left"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                {category} ({questionCount} question{questionCount !== 1 ? 's' : ''})
                              </button>
                            </TableCell>
                          </TableRow>

                          {/* Category Questions */}
                          {!isCollapsed && categoryRows.map((row, index) => {
                            const isEditing = editingQuestions.has(row.questionId);
                            const editData = editingData[row.questionId];
                            
                            return (
                              <TableRow key={`${row.questionId}-${row.model}`} className="border-l-4 border-l-blue-200 dark:border-l-blue-800">
                          <TableCell className="min-w-[500px] max-w-[600px] align-top">
                            {isEditing ? (
                              <div className="space-y-3 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/30 dark:bg-blue-900/20">
                                <div>
                                  <label className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 block">Question:</label>
                                  <Textarea
                                    value={editData?.question || row.question}
                                    onChange={(e) => updateEditingData(row.questionId, 'question', e.target.value)}
                                    className="text-sm border-blue-300 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Enter your question..."
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 block">Expected Answer:</label>
                                  <Textarea
                                    value={editData?.expected_answer || row.expected_answer}
                                    onChange={(e) => updateEditingData(row.questionId, 'expected_answer', e.target.value)}
                                    className="text-sm border-blue-300 focus:border-blue-500"
                                    rows={4}
                                    placeholder="Enter the expected answer..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Question:</h4>
                                  <p className="text-sm leading-relaxed">
                                    {row.question}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Expected Answer:</h4>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {row.expected_answer}
                                  </p>
                                </div>
                                <div className="border-t pt-3 mt-3">
                                  <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                                    🤖 AI Responses
                                    {(row as any).allModelResponses && (row as any).allModelResponses.length > 0 ? 
                                      ` (${(row as any).allModelResponses.length} model${(row as any).allModelResponses.length !== 1 ? 's' : ''})` : 
                                      ''
                                    }:
                                  </h4>
                                  {(row as any).allModelResponses && (row as any).allModelResponses.length > 0 ? (
                                    <div className="space-y-3">
                                      {(row as any).allModelResponses.map((response: ModelResponse, idx: number) => (
                                        <div key={`${row.questionId}-${response.model}-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/50">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{response.model}</span>
                                              {response.grade !== undefined && (
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                  response.grade >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                                  response.grade >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                  Grade: {response.grade.toFixed(1)}%
                                                </span>
                                              )}
                                            </div>
                                            {response.cost && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Cost: ${response.cost.toFixed(4)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded p-3">
                                            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                                              {response.answer || 'No response generated'}
                                            </p>
                                          </div>
                                          {response.responseTime && (
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                              Response time: {(response.responseTime / 1000).toFixed(1)}s
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No AI responses available
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Run baseline tests to generate AI responses
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            {isEditing ? (
                              <div className="p-2 border border-blue-200 rounded bg-blue-50/20 dark:bg-blue-900/10">
                                <Input
                                  value={editData?.category || row.category}
                                  onChange={(e) => updateEditingData(row.questionId, 'category', e.target.value)}
                                  className="text-xs h-8 border-blue-300 focus:border-blue-500"
                                  placeholder="Category"
                                />
                              </div>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-gray-100"
                                onClick={() => startEditingQuestion(row.questionId, {
                                  id: row.questionId,
                                  question: row.question,
                                  expected_answer: row.expected_answer,
                                  category: row.category,
                                  difficulty: row.difficulty,
                                  state: row.state
                                } as BaselineQuestion)}
                              >
                                {row.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            {isEditing ? (
                              <div className="p-2 border border-blue-200 rounded bg-blue-50/20 dark:bg-blue-900/10">
                                <Select 
                                  value={editData?.difficulty || row.difficulty}
                                  onValueChange={(value) => updateEditingData(row.questionId, 'difficulty', value)}
                                >
                                  <SelectTrigger className="h-8 text-xs border-blue-300 focus:border-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs cursor-pointer hover:opacity-80 ${getDifficultyBadgeColor(row.difficulty)}`}
                                onClick={() => startEditingQuestion(row.questionId, {
                                  id: row.questionId,
                                  question: row.question,
                                  expected_answer: row.expected_answer,
                                  category: row.category,
                                  difficulty: row.difficulty,
                                  state: row.state
                                } as BaselineQuestion)}
                              >
                                {row.difficulty}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            {isEditing ? (
                              <div className="p-2 border border-blue-200 rounded bg-blue-50/20 dark:bg-blue-900/10">
                                <Input
                                  value={editData?.state || row.state}
                                  onChange={(e) => updateEditingData(row.questionId, 'state', e.target.value)}
                                  className="text-xs h-8 w-16 border-blue-300 focus:border-blue-500"
                                  placeholder="State"
                                />
                              </div>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-gray-100"
                                onClick={() => startEditingQuestion(row.questionId, {
                                  id: row.questionId,
                                  question: row.question,
                                  expected_answer: row.expected_answer,
                                  category: row.category,
                                  difficulty: row.difficulty,
                                  state: row.state
                                } as BaselineQuestion)}
                              >
                                {row.state}
                              </Badge>
                            )}
                          </TableCell>

                        <TableCell className="align-top">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => saveQuestionEdit(row.questionId)}
                                className="h-8 px-2 text-xs"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditingQuestion(row.questionId)}
                                className="h-8 px-2 text-xs"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingQuestion(row.questionId, {
                                id: row.questionId,
                                question: row.question,
                                expected_answer: row.expected_answer,
                                category: row.category,
                                difficulty: row.difficulty,
                                state: row.state
                              } as BaselineQuestion)}
                              className="h-8 px-2 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Baseline Editor Dialog */}
      <Dialog open={editingBaseline} onOpenChange={setEditingBaseline}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edit {agentType} baseline.json
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Edit the baseline questions directly. Changes will be saved to the agent's baseline.json file.
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Textarea
              value={baselineJson}
              onChange={(e) => setBaselineJson(e.target.value)}
              className="w-full h-[60vh] font-mono text-sm resize-none"
              placeholder="Loading baseline.json..."
            />
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Make sure your JSON is valid before saving
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingBaseline(false)}
                disabled={saveBaselineMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveBaseline}
                disabled={saveBaselineMutation.isPending}
              >
                {saveBaselineMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}