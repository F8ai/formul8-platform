import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BaselineQuestion {
  id: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  state: string;
  question: string;
  expected_answer: string;
  max_score?: number;
  tags?: string[];
}

interface BaselineData {
  agent: string;
  description: string;
  categories: Record<string, string>;
  difficulty_levels: Record<string, string>;
  questions: BaselineQuestion[];
}

interface BaselineEditorProps {
  agentType: string;
}

export default function BaselineEditor({ agentType }: BaselineEditorProps) {
  const [editingQuestions, setEditingQuestions] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<Record<string, Partial<BaselineQuestion>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<BaselineQuestion>>({
    category: '',
    difficulty: 'beginner',
    state: 'MULTI',
    question: '',
    expected_answer: '',
    tags: []
  });

  const queryClient = useQueryClient();

  // Fetch baseline questions
  const { data: baselineData, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: [`/api/agents/${agentType}/baseline-questions`],
    enabled: !!agentType,
  });

  const questions = useMemo(() => {
    if (!baselineData || !baselineData.questions) return [];
    return baselineData.questions.map((q: any) => ({
      ...q,
      expected_answer: q.expected_answer || q.expectedAnswer || ''
    }));
  }, [baselineData]);

  // Save question mutation
  const saveQuestionMutation = useMutation({
    mutationFn: async (data: { questionId: string; updates: Partial<BaselineQuestion> }) => {
      const response = await fetch(`/api/agents/${agentType}/baseline-questions/${data.questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Updated",
        description: "Baseline question has been successfully updated.",
      });
      refetchQuestions();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });

  // Add new question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (question: Partial<BaselineQuestion>) => {
      const response = await fetch(`/api/agents/${agentType}/baseline-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
      });
      if (!response.ok) throw new Error('Failed to add question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Added",
        description: "New baseline question has been successfully added.",
      });
      setIsAddingNew(false);
      setNewQuestion({
        category: '',
        difficulty: 'beginner',
        state: 'MULTI',
        question: '',
        expected_answer: '',
        tags: []
      });
      refetchQuestions();
    },
    onError: (error: any) => {
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add question",
        variant: "destructive",
      });
    },
  });

  const startEditingQuestion = (questionId: string, question: BaselineQuestion) => {
    setEditingQuestions(prev => new Set(prev).add(questionId));
    setEditingData(prev => ({
      ...prev,
      [questionId]: { ...question }
    }));
  };

  const cancelEditingQuestion = (questionId: string) => {
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

  const saveQuestionEdit = (questionId: string) => {
    const updates = editingData[questionId];
    if (updates) {
      saveQuestionMutation.mutate({ questionId, updates });
      cancelEditingQuestion(questionId);
    }
  };

  const updateEditingData = (questionId: string, field: keyof BaselineQuestion, value: any) => {
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

  // Filter and group questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q: BaselineQuestion) => {
      const matchesSearch = !searchTerm || 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.expected_answer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = !difficultyFilter || difficultyFilter === 'all' || q.difficulty === difficultyFilter;
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || q.category === categoryFilter;
      
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [questions, searchTerm, difficultyFilter, categoryFilter]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, BaselineQuestion[]> = {};
    filteredQuestions.forEach(question => {
      const category = question.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(question);
    });
    return groups;
  }, [filteredQuestions]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    questions.forEach((question: BaselineQuestion) => categorySet.add(question.category));
    return Array.from(categorySet).sort();
  }, [questions]);

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-3" />
        <span>Loading baseline questions...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Baseline Questions Editor</h1>
          <p className="text-muted-foreground mt-1">
            Edit baseline questions and expected answers for {agentType} agent
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions or answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
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
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Questions ({filteredQuestions.length} of {questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[400px]">Question & Expected Answer</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-24">Difficulty</TableHead>
                  <TableHead className="w-16">State</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Add New Question Row */}
                {isAddingNew && (
                  <TableRow className="bg-blue-50/50 dark:bg-blue-900/20">
                    <TableCell>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Question:</label>
                          <Textarea
                            value={newQuestion.question || ''}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="Enter the question..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Expected Answer:</label>
                          <Textarea
                            value={newQuestion.expected_answer || ''}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, expected_answer: e.target.value }))}
                            placeholder="Enter the expected answer..."
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newQuestion.category || ''}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Category"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={newQuestion.difficulty || 'beginner'}
                        onValueChange={(value) => setNewQuestion(prev => ({ ...prev, difficulty: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newQuestion.state || 'MULTI'}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => addQuestionMutation.mutate(newQuestion)}
                          disabled={!newQuestion.question || !newQuestion.expected_answer || addQuestionMutation.isPending}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddingNew(false)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Category Groups */}
                {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => {
                  const isCollapsed = isCategoryCollapsed(category);
                  
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
                            {category} ({categoryQuestions.length} question{categoryQuestions.length !== 1 ? 's' : ''})
                          </button>
                        </TableCell>
                      </TableRow>

                      {/* Category Questions */}
                      {!isCollapsed && categoryQuestions.map((question) => {
                        const isEditing = editingQuestions.has(question.id);
                        const editData = editingData[question.id];

                        return (
                          <TableRow key={question.id} className={isEditing ? "bg-blue-50/20 dark:bg-blue-900/10" : ""}>
                            <TableCell>
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium">Question:</label>
                                    <Textarea
                                      value={editData?.question || question.question}
                                      onChange={(e) => updateEditingData(question.id, 'question', e.target.value)}
                                      rows={3}
                                      className="mt-1 border-blue-300 focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Expected Answer:</label>
                                    <Textarea
                                      value={editData?.expected_answer || question.expected_answer}
                                      onChange={(e) => updateEditingData(question.id, 'expected_answer', e.target.value)}
                                      rows={4}
                                      className="mt-1 border-blue-300 focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Question:</h4>
                                    <p className="text-sm leading-relaxed">{question.question}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Expected Answer:</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {question.expected_answer}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={editData?.category || question.category}
                                  onChange={(e) => updateEditingData(question.id, 'category', e.target.value)}
                                  className="border-blue-300 focus:border-blue-500"
                                />
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {question.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select 
                                  value={editData?.difficulty || question.difficulty}
                                  onValueChange={(value) => updateEditingData(question.id, 'difficulty', value)}
                                >
                                  <SelectTrigger className="border-blue-300 focus:border-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={`text-xs ${getDifficultyBadgeColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={editData?.state || question.state}
                                  onChange={(e) => updateEditingData(question.id, 'state', e.target.value)}
                                  className="w-16 border-blue-300 focus:border-blue-500"
                                />
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {question.state}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => saveQuestionEdit(question.id)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cancelEditingQuestion(question.id)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingQuestion(question.id, question)}
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

                {filteredQuestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        <span>No questions found matching the current filters</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}