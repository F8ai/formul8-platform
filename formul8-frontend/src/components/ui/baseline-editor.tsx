import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Save, Plus, Trash2, FileText, Search, Filter } from "lucide-react";

interface BaselineQuestion {
  id: string;
  question: string;
  expectedAnswer?: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  maxScore: number;
  keywords?: string[];
  tags?: string[];
}

interface BaselineData {
  agentType: string;
  description: string;
  version: string;
  questions: BaselineQuestion[];
}

interface BaselineEditorProps {
  agentType: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BaselineEditor({ agentType, isOpen, onClose }: BaselineEditorProps) {
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BaselineQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && agentType) {
      loadBaselineData();
    }
  }, [isOpen, agentType]);

  const loadBaselineData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/baseline-testing/baseline/${agentType}`);
      if (!response.ok) {
        throw new Error('Failed to load baseline data');
      }
      const data = await response.json();
      setBaselineData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load baseline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBaselineData = async () => {
    if (!baselineData) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/baseline-testing/baseline/${agentType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baselineData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save baseline data');
      }
      
      toast({
        title: "Success",
        description: "Baseline data saved successfully",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save baseline data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (question: BaselineQuestion) => {
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !baselineData) return;
    
    const updatedQuestions = baselineData.questions.map(q =>
      q.id === editingQuestion.id ? editingQuestion : q
    );
    
    setBaselineData({
      ...baselineData,
      questions: updatedQuestions
    });
    
    setEditingQuestion(null);
    setIsEditing(true);
  };

  const handleAddQuestion = () => {
    const newQuestion: BaselineQuestion = {
      id: `new_${Date.now()}`,
      question: "",
      expectedAnswer: "",
      category: "general",
      difficulty: "basic",
      maxScore: 10,
      keywords: [],
      tags: []
    };
    setEditingQuestion(newQuestion);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!baselineData) return;
    
    const updatedQuestions = baselineData.questions.filter(q => q.id !== questionId);
    setBaselineData({
      ...baselineData,
      questions: updatedQuestions
    });
    setIsEditing(true);
  };

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

  const filteredQuestions = baselineData?.questions?.filter(question => {
    const matchesSearch = !searchQuery || 
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.expectedAnswer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || question.category === categoryFilter;
    const matchesDifficulty = !difficultyFilter || question.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  const categories = Array.from(new Set(baselineData?.questions?.map(q => q.category) || []));
  const difficulties = ['basic', 'intermediate', 'advanced'];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Baseline Editor - {agentType?.replace('-agent', '').toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            View and edit baseline questions for comprehensive agent testing
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading baseline data...</p>
            </div>
          </div>
        ) : baselineData ? (
          <div className="space-y-6 overflow-hidden">
            {/* Header Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Agent Type</Label>
                    <p className="text-muted-foreground">{baselineData.agentType}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Version</Label>
                    <p className="text-muted-foreground">{baselineData.version}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Total Questions</Label>
                    <p className="text-muted-foreground">{baselineData.questions.length}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="font-medium">Description</Label>
                  <p className="text-muted-foreground text-sm">{baselineData.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddQuestion} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
                {isEditing && (
                  <Button onClick={saveBaselineData} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>

            {/* Questions Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-32">Category</TableHead>
                      <TableHead className="w-28">Difficulty</TableHead>
                      <TableHead className="w-20">Score</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-mono text-xs">{question.id}</TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm line-clamp-2">{question.question}</p>
                            {question.keywords && question.keywords.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {question.keywords.slice(0, 3).map((keyword, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                                {question.keywords.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{question.keywords.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{question.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.maxScore}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditQuestion(question)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || categoryFilter || difficultyFilter 
                  ? "No questions match the current filters" 
                  : "No questions found"
                }
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load baseline data
          </div>
        )}

        {/* Edit Question Dialog */}
        {editingQuestion && (
          <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion.id.startsWith('new_') ? 'Add New Question' : 'Edit Question'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question-id">Question ID</Label>
                  <Input
                    id="question-id"
                    value={editingQuestion.id}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      id: e.target.value
                    })}
                    disabled={!editingQuestion.id.startsWith('new_')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value
                    })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="expected-answer">Expected Answer</Label>
                  <Textarea
                    id="expected-answer"
                    value={editingQuestion.expectedAnswer || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      expectedAnswer: e.target.value
                    })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingQuestion.category}
                      onValueChange={(value) => setEditingQuestion({
                        ...editingQuestion,
                        category: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                        <SelectItem value="new-category">+ Add New Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={editingQuestion.difficulty}
                      onValueChange={(value: 'basic' | 'intermediate' | 'advanced') => 
                        setEditingQuestion({
                          ...editingQuestion,
                          difficulty: value
                        })}
                    >
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

                  <div>
                    <Label htmlFor="max-score">Max Score</Label>
                    <Input
                      id="max-score"
                      type="number"
                      value={editingQuestion.maxScore}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        maxScore: parseInt(e.target.value) || 10
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={editingQuestion.keywords?.join(', ') || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    })}
                  />
                </div>

                <Button onClick={handleSaveQuestion} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}