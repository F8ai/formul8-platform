import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Download,
  Upload,
  FileText,
  Target,
  TrendingUp,
  Clock
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

export default function BaselineTableViewer() {
  const [activeTab, setActiveTab] = useState('questions');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState<BaselineQuestion | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
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
  const availableModels = React.useMemo(() => {
    const modelSet = new Set<string>();
    questions.forEach((q: any) => {
      q.modelResponses?.forEach((response: ModelResponse) => {
        modelSet.add(response.model);
      });
    });
    return Array.from(modelSet).sort();
  }, [questions]);

  // Fetch test runs
  const { data: testRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ['/api/baseline-testing/runs', 'compliance'],
    queryFn: async () => {
      const response = await fetch('/api/baseline-testing/runs?agentType=compliance');
      if (!response.ok) throw new Error('Failed to fetch test runs');
      return response.json();
    }
  });

  // Filter questions
  const filteredQuestions = questions.filter((q: BaselineQuestion) => {
    const matchesSearch = !searchTerm || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.expected_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.keywords && q.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || q.category === categoryFilter;
    const matchesDifficulty = !difficultyFilter || difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchesState = !stateFilter || stateFilter === 'all' || q.state === stateFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesState;
  });

  // Get unique values for filters
  const categories = Array.from(new Set(questions.map((q: BaselineQuestion) => q.category))).filter(Boolean);
  const states = Array.from(new Set(questions.map((q: BaselineQuestion) => q.state))).filter(Boolean);

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSaveQuestion = async (question: BaselineQuestion) => {
    try {
      const url = question.id ? `/api/agents/compliance/baseline-questions/${question.id}` : '/api/agents/compliance/baseline-questions';
      const method = question.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });
      
      if (!response.ok) throw new Error('Failed to save question');
      
      toast({
        title: "Success",
        description: `Question ${question.id ? 'updated' : 'created'} successfully`
      });
      
      refetchQuestions();
      setEditingQuestion(null);
      setIsAddingNew(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`/api/agents/compliance/baseline-questions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete question');
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
      
      refetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const recentTestRuns = testRuns.slice(0, 5);
  const completedRuns = testRuns.filter((run: BaselineTestRun) => run.status === 'completed');
  const avgAccuracy = completedRuns.length > 0 
    ? completedRuns.reduce((sum: number, run: BaselineTestRun) => sum + (run.avgAccuracy || 0), 0) / completedRuns.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Agent Baseline</h1>
          <p className="text-muted-foreground">Smart table viewer and editor for baseline questions and test results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredQuestions.length} filtered
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedRuns.length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              From {completedRuns.length} runs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Question categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="questions">Questions ({filteredQuestions.length})</TabsTrigger>
          <TabsTrigger value="test-runs">Test Runs ({testRuns.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
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
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setDifficultyFilter('all');
                    setStateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Questions and Responses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Baseline Questions with Model Responses</CardTitle>
              <div className="text-sm text-muted-foreground">
                {availableModels.length > 0 ? (
                  `Showing results for ${availableModels.length} models: ${availableModels.join(', ')}`
                ) : (
                  'No model responses available'
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48 sticky left-0 bg-background z-10">Category</TableHead>
                      <TableHead className="w-96 sticky left-48 bg-background z-10">Question</TableHead>
                      <TableHead className="w-64 sticky left-[26rem] bg-background z-10">Correct Answer</TableHead>
                      {availableModels.map(model => (
                        <TableHead key={model} className="w-48 text-center">
                          {model}
                        </TableHead>
                      ))}
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4 + availableModels.length} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading questions and responses...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4 + availableModels.length} className="text-center py-8">
                          No questions found matching the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((question: any) => (
                        <TableRow key={question.id} className="group">
                          <TableCell className="sticky left-0 bg-background z-10">
                            <div className="space-y-1">
                              <Badge variant="outline" className={getDifficultyBadgeColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                              <div className="text-sm font-medium">{question.category}</div>
                              {question.state && (
                                <Badge variant="outline" className="text-xs">{question.state}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="sticky left-48 bg-background z-10">
                            <div className="space-y-2">
                              <div className="text-sm font-medium leading-5">
                                {question.question}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {question.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="sticky left-[26rem] bg-background z-10">
                            <div className="text-sm leading-5 max-h-24 overflow-y-auto">
                              {question.expected_answer}
                            </div>
                          </TableCell>
                          
                          {/* Dynamic Model Response Columns */}
                          {availableModels.map(modelName => {
                            const response = question.modelResponses?.find((r: ModelResponse) => 
                              r.model === modelName
                            );
                            
                            return (
                              <TableCell key={modelName}>
                                {response ? (
                                  <ModelResponseCell response={response} />
                                ) : (
                                  <div className="text-xs text-muted-foreground text-center py-4">
                                    No response
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading test runs...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : testRuns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No test runs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      testRuns.map((run: BaselineTestRun) => {
                        const resultUrl = `/agent/compliance/baseline/baseline-${run.state || 'general'}-${run.model.replace(/[^a-zA-Z0-9]/g, '')}`;
                        return (
                          <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = resultUrl}>
                            <TableCell className="font-mono">#{run.id}</TableCell>
                            <TableCell>{run.model}</TableCell>
                            <TableCell>
                              {run.state && <Badge variant="outline">{run.state}</Badge>}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(run.status)}>
                                {run.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{run.successfulTests}/{run.totalQuestions}</TableCell>
                            <TableCell>
                              {run.avgAccuracy ? `${run.avgAccuracy.toFixed(1)}%` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {run.totalCost ? `$${run.totalCost.toFixed(3)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {new Date(run.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion || isAddingNew} onOpenChange={(open) => {
        if (!open) {
          setEditingQuestion(null);
          setIsAddingNew(false);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
          </DialogHeader>
          <QuestionEditor 
            question={editingQuestion || {
              id: 0,
              question: '',
              expected_answer: '',
              category: '',
              difficulty: 'basic',
              keywords: [],
              tags: []
            }}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setEditingQuestion(null);
              setIsAddingNew(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QuestionEditorProps {
  question: BaselineQuestion;
  onSave: (question: BaselineQuestion) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [formData, setFormData] = useState(question);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="Enter the baseline question..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="expected_answer">Expected Answer</Label>
        <Textarea
          id="expected_answer"
          value={formData.expected_answer}
          onChange={(e) => setFormData({ ...formData, expected_answer: e.target.value })}
          placeholder="Enter the expected answer..."
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., licensing, packaging"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="state">State (Optional)</Label>
        <Input
          id="state"
          value={formData.state || ''}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          placeholder="e.g., CA, CO, WA"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Save Question
        </Button>
      </div>
    </form>
  );
}

interface ModelResponseCellProps {
  response: ModelResponse;
}

function ModelResponseCell({ response }: ModelResponseCellProps) {
  const getGradeColor = (grade: number) => {
    if (grade >= 8) return 'text-green-600 dark:text-green-400';
    if (grade >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Metrics Row */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <span className={`font-bold ${getGradeColor(response.grade)}`}>
            {response.grade}/10
          </span>
          <span className={`${getConfidenceColor(response.confidence)}`}>
            {response.confidence}%
          </span>
        </div>
        {response.cost && (
          <span className="text-muted-foreground">
            ${response.cost.toFixed(3)}
          </span>
        )}
      </div>
      
      {/* Answer Preview */}
      <div className="text-xs leading-4 max-h-16 overflow-y-auto border-l-2 border-muted pl-2">
        {response.answer.length > 100 
          ? `${response.answer.substring(0, 100)}...`
          : response.answer
        }
      </div>
      
      {/* Additional Metrics */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>AI: {response.gradingConfidence}%</span>
        {response.responseTime && (
          <span>{response.responseTime}ms</span>
        )}
      </div>
    </div>
  );
}