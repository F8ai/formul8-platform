import { useState, useEffect } from 'react';
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

  // Fetch baseline questions
  const { data: questions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['/api/agents/compliance/baseline-questions'],
    queryFn: async () => {
      const response = await fetch('/api/agents/compliance/baseline-questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    }
  });

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

          {/* Questions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Baseline Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading questions...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No questions found matching the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((question: BaselineQuestion) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-mono">{question.id}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={question.question}>
                              {question.question}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{question.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDifficultyBadgeColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {question.state && <Badge variant="outline">{question.state}</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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