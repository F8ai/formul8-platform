import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Download, 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Play,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface AgentDomain {
  domain: string;
  config: {
    sources: Array<{
      name: string;
      type: string;
      urlCount: number;
    }>;
    categories: string[];
    questionTypes: string[];
  };
}

interface CorpusStatus {
  agentDomain: string;
  hasCorpus: boolean;
  totalDocuments: number;
  sources: string[];
  lastUpdated: number | null;
  totalSize: number;
  availableSources: string[];
  availableCategories: string[];
}

interface GenerationStats {
  totalQuestions: number;
  filePath: string;
  statistics: {
    totalDocuments: number;
    categoriesCovered: string[];
    difficultyDistribution: {
      basic: number;
      intermediate: number;
      advanced: number;
    };
    averageConfidence: number;
    sourcesCovered: string[];
    uniqueTags: string[];
  };
  preview: Array<{
    question: string;
    category: string;
    difficulty: string;
    confidence: number;
  }>;
}

export default function CorpusQAPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [maxQuestions, setMaxQuestions] = useState(100);
  const [difficulty, setDifficulty] = useState<string>("mixed");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [refreshCorpus, setRefreshCorpus] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Fetch available agent domains
  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: ['/api/corpus-qa/domains'],
    enabled: true
  });

  // Fetch corpus status for selected agent
  const { data: corpusStatus } = useQuery({
    queryKey: ['/api/corpus-qa/status', selectedAgent],
    enabled: !!selectedAgent
  });

  // Fetch generated Q&A files for selected agent
  const { data: qaFiles } = useQuery({
    queryKey: ['/api/corpus-qa/qa-files', selectedAgent],
    enabled: !!selectedAgent
  });

  // Download corpus mutation
  const downloadCorpusMutation = useMutation({
    mutationFn: async (agentDomain: string) => {
      return apiRequest('/api/corpus-qa/download', {
        method: 'POST',
        body: JSON.stringify({ agentDomain })
      });
    },
    onSuccess: () => {
      toast({
        title: "Corpus Downloaded",
        description: "Successfully downloaded corpus documents"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/corpus-qa/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download corpus",
        variant: "destructive"
      });
    }
  });

  // Generate Q&A mutation
  const generateQAMutation = useMutation({
    mutationFn: async (params: {
      agentDomain: string;
      maxQuestions: number;
      difficulty: string;
      categories?: string[];
      refreshCorpus: boolean;
    }) => {
      return apiRequest('/api/corpus-qa/generate', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Q&A Generated",
        description: `Generated ${data.data.totalQuestions} questions successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/corpus-qa/qa-files'] });
      setIsGenerating(false);
      setGenerationProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Q&A",
        variant: "destructive"
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  });

  // Generate baseline mutation
  const generateBaselineMutation = useMutation({
    mutationFn: async (params: { agentDomain: string; maxQuestions: number }) => {
      return apiRequest(`/api/corpus-qa/baseline/${params.agentDomain}`, {
        method: 'POST',
        body: JSON.stringify({ maxQuestions: params.maxQuestions })
      });
    },
    onSuccess: () => {
      toast({
        title: "Baseline Generated",
        description: "Successfully generated baseline corpus"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/corpus-qa/qa-files'] });
    },
    onError: (error: any) => {
      toast({
        title: "Baseline Failed",
        description: error.message || "Failed to generate baseline",
        variant: "destructive"
      });
    }
  });

  const handleGenerateQA = async () => {
    if (!selectedAgent) {
      toast({
        title: "Agent Required",
        description: "Please select an agent domain first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90));
    }, 2000);

    try {
      await generateQAMutation.mutateAsync({
        agentDomain: selectedAgent,
        maxQuestions,
        difficulty,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        refreshCorpus
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
    } catch (error) {
      clearInterval(progressInterval);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Corpus Q&A Generator</h1>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Generate training questions and answers from regulatory corpus data for any agent. 
        This system downloads real regulatory documents and creates high-quality Q&A pairs for training and testing.
      </p>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Q&A</TabsTrigger>
          <TabsTrigger value="status">Corpus Status</TabsTrigger>
          <TabsTrigger value="files">Generated Files</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Q&A from Corpus
              </CardTitle>
              <CardDescription>
                Create training questions and answers from regulatory documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent Selection */}
              <div className="space-y-2">
                <Label htmlFor="agent-select">Agent Domain</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainsData?.domains?.map((domain: AgentDomain) => (
                      <SelectItem key={domain.domain} value={domain.domain}>
                        {domain.domain.charAt(0).toUpperCase() + domain.domain.slice(1)} Agent
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-questions">Maximum Questions</Label>
                  <Input
                    id="max-questions"
                    type="number"
                    min="1"
                    max="500"
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed Difficulty</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Categories */}
              {selectedAgent && domainsData?.domains && (
                <div className="space-y-2">
                  <Label>Categories (optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {domainsData.domains
                      .find((d: AgentDomain) => d.domain === selectedAgent)
                      ?.config.categories.map((category: string) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                          />
                          <Label htmlFor={category} className="text-sm">
                            {category}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="refresh-corpus"
                  checked={refreshCorpus}
                  onCheckedChange={(checked) => setRefreshCorpus(checked as boolean)}
                />
                <Label htmlFor="refresh-corpus">
                  Refresh corpus (download latest documents)
                </Label>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Generation Progress</Label>
                    <span className="text-sm text-muted-foreground">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateQA}
                  disabled={!selectedAgent || isGenerating || generateQAMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Q&A'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => generateBaselineMutation.mutate({ 
                    agentDomain: selectedAgent, 
                    maxQuestions: 100 
                  })}
                  disabled={!selectedAgent || generateBaselineMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Generate Baseline
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {selectedAgent && corpusStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Corpus Status: {selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {corpusStatus.data.totalDocuments}
                    </div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {corpusStatus.data.sources.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Sources</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatFileSize(corpusStatus.data.totalSize)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {corpusStatus.data.lastUpdated ? 
                        formatDate(corpusStatus.data.lastUpdated) : 'Never'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                  </div>
                </div>

                {corpusStatus.data.sources.length > 0 && (
                  <div className="space-y-2">
                    <Label>Available Sources</Label>
                    <div className="flex flex-wrap gap-2">
                      {corpusStatus.data.sources.map((source: string) => (
                        <Badge key={source} variant="secondary">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {corpusStatus.data.availableCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Available Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {corpusStatus.data.availableCategories.map((category: string) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!corpusStatus.data.hasCorpus && (
                  <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-800">No Corpus Available</div>
                      <div className="text-sm text-orange-700">
                        Download corpus documents to start generating Q&A pairs.
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCorpusMutation.mutate(selectedAgent)}
                      disabled={downloadCorpusMutation.isPending}
                      className="ml-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          {selectedAgent && qaFiles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Q&A Files: {selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)}
                </CardTitle>
                <CardDescription>
                  Previously generated question and answer files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qaFiles.data.files.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No Q&A files generated yet for this agent.
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {qaFiles.data.files.map((file: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{file.filename}</div>
                            <Badge variant="secondary">
                              {file.totalQuestions} questions
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(file.created)} • 
                            Size: {formatFileSize(file.size)}
                          </div>
                          
                          {file.metadata && (
                            <div className="flex flex-wrap gap-1">
                              {file.metadata.categoriesCovered?.map((cat: string) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}