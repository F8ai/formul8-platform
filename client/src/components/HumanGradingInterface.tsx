import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bot, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Save,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TestResult {
  id: number;
  questionId: string;
  question: string;
  agentResponse: string;
  expectedAnswer?: string;
  aiGrade?: number;
  humanGrade?: number;
  aiGradingConfidence?: number;
  aiGradingReasoning?: string;
  humanGradingNotes?: string;
  gradingAgreement?: number;
  requiresReview?: boolean;
  humanGradedBy?: string;
  humanGradedAt?: string;
}

interface HumanGradingInterfaceProps {
  result: TestResult;
  agentType: string;
  onGradeSubmitted?: () => void;
}

export default function HumanGradingInterface({ 
  result, 
  agentType, 
  onGradeSubmitted 
}: HumanGradingInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [humanGrade, setHumanGrade] = useState(result.humanGrade || 75);
  const [gradingNotes, setGradingNotes] = useState(result.humanGradingNotes || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitGradeMutation = useMutation({
    mutationFn: async (gradeData: { 
      resultId: number; 
      humanGrade: number; 
      humanGradingNotes: string 
    }) => {
      return apiRequest('/api/human-grading/grade', {
        method: 'POST',
        body: JSON.stringify(gradeData),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Grade Submitted",
        description: "Human grade saved successfully"
      });
      setIsOpen(false);
      onGradeSubmitted?.();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', agentType, 'baseline-results'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit grade",
        variant: "destructive"
      });
    }
  });

  const handleSubmitGrade = () => {
    submitGradeMutation.mutate({
      resultId: result.id,
      humanGrade,
      humanGradingNotes: gradingNotes
    });
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return 'text-green-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAgreementColor = (agreement: number) => {
    if (agreement >= 90) return 'bg-green-100 text-green-800';
    if (agreement >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={result.humanGrade ? "outline" : "default"}
          size="sm"
          className={`gap-2 ${result.requiresReview ? 'border-amber-500' : ''}`}
        >
          <User className="h-4 w-4" />
          {result.humanGrade ? `${result.humanGrade}%` : 'Grade'}
          {result.requiresReview && <AlertTriangle className="h-3 w-3 text-amber-500" />}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Human Grading Interface
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question and Response Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question #{result.questionId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Question:</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {result.question}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">AI Response:</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-md text-sm max-h-32 overflow-y-auto">
                  {result.agentResponse}
                </div>
              </div>
              
              {result.expectedAnswer && (
                <div>
                  <Label className="text-sm font-medium">Expected Answer:</Label>
                  <p className="mt-1 p-3 bg-green-50 rounded-md text-sm">
                    {result.expectedAnswer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Grading */}
            {result.aiGrade && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Grading
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grade:</span>
                    <Badge className={getGradeColor(result.aiGrade)}>
                      {result.aiGrade}%
                    </Badge>
                  </div>
                  
                  {result.aiGradingConfidence && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidence:</span>
                      <span className="text-sm font-medium">
                        {result.aiGradingConfidence}%
                      </span>
                    </div>
                  )}
                  
                  {result.aiGradingReasoning && (
                    <div>
                      <Label className="text-sm">AI Reasoning:</Label>
                      <p className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {result.aiGradingReasoning}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Human Grading */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Human Grading
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Your Grade: {humanGrade}%</Label>
                  <Slider
                    value={[humanGrade]}
                    onValueChange={(value) => setHumanGrade(value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Grading Notes (Optional):</Label>
                  <Textarea
                    value={gradingNotes}
                    onChange={(e) => setGradingNotes(e.target.value)}
                    placeholder="Add notes about your grading decision..."
                    className="mt-1 text-sm"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agreement Analysis */}
          {result.aiGrade && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grade Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {result.aiGrade}%
                    </div>
                    <div className="text-sm text-gray-500">AI Grade</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {humanGrade}%
                    </div>
                    <div className="text-sm text-gray-500">Your Grade</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.abs(result.aiGrade - humanGrade)}
                    </div>
                    <div className="text-sm text-gray-500">Difference</div>
                  </div>
                </div>
                
                {Math.abs(result.aiGrade - humanGrade) > 20 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Large grade difference detected - this result will be flagged for review
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Previous Human Grading */}
          {result.humanGrade && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Previous Grading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Previous Grade:</span>
                  <Badge className={getGradeColor(result.humanGrade)}>
                    {result.humanGrade}%
                  </Badge>
                </div>
                
                {result.humanGradedBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Graded By:</span>
                    <span className="text-sm font-medium">{result.humanGradedBy}</span>
                  </div>
                )}
                
                {result.humanGradedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Graded At:</span>
                    <span className="text-sm">
                      {new Date(result.humanGradedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {result.humanGradingNotes && (
                  <div>
                    <Label className="text-sm">Previous Notes:</Label>
                    <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                      {result.humanGradingNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitGrade}
              disabled={submitGradeMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {submitGradeMutation.isPending ? 'Saving...' : 'Save Grade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}