import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Play, Bot, Settings, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BaselineTestRunnerProps {
  agentType: string;
  onTestStarted?: (runId: number) => void;
}

export function BaselineTestRunner({ agentType, onTestStarted }: BaselineTestRunnerProps) {
  const [testConfig, setTestConfig] = useState({
    model: "gpt-4o",
    state: "all",
    ragEnabled: true,
    toolsEnabled: true,
    kbEnabled: true,
    customPrompt: "",
    questionLimit: ""
  });
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState({ current: 0, total: 0 });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const runTestMutation = useMutation({
    mutationFn: async (config: typeof testConfig) => {
      const response = await fetch(`/api/baseline-testing/run-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType,
          ...config,
          state: config.state === "all" ? undefined : config.state,
          questionLimit: config.questionLimit ? parseInt(config.questionLimit) : undefined
        })
      });
      if (!response.ok) throw new Error('Failed to run test');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Baseline Test Started",
        description: `Test run ${data.runId} started successfully. Navigating to results page...`,
      });
      
      // Generate result URL based on model and state
      const model = testConfig.model.replace('gpt-4o', 'gpt4o').replace('claude-3-5-sonnet-20241022', 'claude35sonnet');
      const state = testConfig.state !== 'all' ? testConfig.state : '';
      const resultId = state ? `${state}-${model}` : `${data.runId}`;
      
      // Navigate directly to the baseline result page
      setLocation(`/agent/${agentType}/baseline-${resultId}`);
      
      // Notify parent component if needed
      if (onTestStarted) {
        onTestStarted(data.runId);
      }
      
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ['/api/baseline-testing/runs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start baseline test",
        variant: "destructive",
      });
    },
  });

  const handleRunTest = () => {
    if (!testConfig.model) {
      toast({
        title: "Error",
        description: "Please select a model",
        variant: "destructive",
      });
      return;
    }
    runTestMutation.mutate(testConfig);
  };

  const handleConfigChange = (field: string, value: any) => {
    setTestConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Run Baseline Test
          </CardTitle>
          <CardDescription>
            Execute baseline test suite for the {agentType} agent with custom configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={testConfig.model} onValueChange={(value) => handleConfigChange("model", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State Filter (Optional)</Label>
              <Select value={testConfig.state} onValueChange={(value) => handleConfigChange("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="CO">Colorado</SelectItem>
                  <SelectItem value="WA">Washington</SelectItem>
                  <SelectItem value="OR">Oregon</SelectItem>
                  <SelectItem value="NV">Nevada</SelectItem>
                  <SelectItem value="AZ">Arizona</SelectItem>
                  <SelectItem value="MA">Massachusetts</SelectItem>
                  <SelectItem value="IL">Illinois</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="NJ">New Jersey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionLimit">Question Limit (Optional)</Label>
              <Input
                id="questionLimit"
                type="number"
                placeholder="All questions"
                value={testConfig.questionLimit}
                onChange={(e) => handleConfigChange("questionLimit", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rag"
                checked={testConfig.ragEnabled}
                onCheckedChange={(checked) => handleConfigChange("ragEnabled", checked)}
              />
              <Label htmlFor="rag">Enable RAG (Retrieval-Augmented Generation)</Label>
            </div>
            
            <div className="flex items-center space-x-2">  
              <Checkbox
                id="tools"
                checked={testConfig.toolsEnabled}
                onCheckedChange={(checked) => handleConfigChange("toolsEnabled", checked)}
              />
              <Label htmlFor="tools">Enable Agent Tools</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kb"
                checked={testConfig.kbEnabled}
                onCheckedChange={(checked) => handleConfigChange("kbEnabled", checked)}
              />
              <Label htmlFor="kb">Enable Knowledge Base</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPrompt">Custom System Prompt (Optional)</Label>
            <Textarea
              id="customPrompt"
              placeholder="Enter custom system prompt to override default..."
              value={testConfig.customPrompt}
              onChange={(e) => handleConfigChange("customPrompt", e.target.value)}
              rows={4}
            />
          </div>

          {isRunning && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Test Running...</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                    {runProgress.current}/{runProgress.total}
                  </Badge>
                </div>
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${runProgress.total > 0 ? (runProgress.current / runProgress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleRunTest}
              disabled={runTestMutation.isPending || isRunning}
              className="w-full md:w-auto"
            >
              {runTestMutation.isPending ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Starting Test...
                </>
              ) : isRunning ? (
                <>
                  <Bot className="w-4 h-4 mr-2 animate-pulse" />
                  Test Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Baseline Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}