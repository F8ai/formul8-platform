import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, FileText, TrendingUp, Award, ExternalLink, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Science() {
  const [researchQuestion, setResearchQuestion] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  const [claimToValidate, setClaimToValidate] = useState("");
  const [summaryTopic, setSummaryTopic] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Research question mutation
  const researchMutation = useMutation({
    mutationFn: async (question: string) => {
      return await apiRequest("/api/science/research", "POST", { question });
    },
    onSuccess: () => {
      toast({
        title: "Research Complete",
        description: "Scientific analysis has been completed successfully."
      });
      setResearchQuestion("");
    },
    onError: (error) => {
      toast({
        title: "Research Failed",
        description: "Failed to complete scientific analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Literature search mutation
  const searchMutation = useMutation({
    mutationFn: async (terms: string[]) => {
      return await apiRequest("/api/science/literature-search", "POST", { 
        searchTerms: terms,
        filters: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Search Complete",
        description: "Literature search completed successfully."
      });
      setSearchTerms("");
    }
  });

  // Claim validation mutation
  const validateMutation = useMutation({
    mutationFn: async (claim: string) => {
      return await apiRequest("/api/science/validate-claim", "POST", { claim });
    },
    onSuccess: () => {
      toast({
        title: "Validation Complete",
        description: "Scientific claim has been validated."
      });
      setClaimToValidate("");
    }
  });

  // Research summary mutation
  const summaryMutation = useMutation({
    mutationFn: async (topic: string) => {
      return await apiRequest("/api/science/summary", "POST", { 
        topic,
        studyTypes: [],
        dateRange: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Summary Generated",
        description: "Research summary has been generated successfully."
      });
      setSummaryTopic("");
    }
  });

  // Fetch research trends
  const { data: trends } = useQuery({
    queryKey: ["/api/science/trends"],
    queryFn: () => apiRequest("/api/science/trends")
  });

  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (researchQuestion.trim()) {
      researchMutation.mutate(researchQuestion.trim());
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerms.trim()) {
      const terms = searchTerms.split(',').map(term => term.trim()).filter(term => term);
      searchMutation.mutate(terms);
    }
  };

  const handleValidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimToValidate.trim()) {
      validateMutation.mutate(claimToValidate.trim());
    }
  };

  const handleSummarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summaryTopic.trim()) {
      summaryMutation.mutate(summaryTopic.trim());
    }
  };

  const getEvidenceLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧬 Science Agent
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Evidence-based research analysis powered by PubMed and scientific literature databases
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2,450+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Research Papers</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">98%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">450+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Citations Analyzed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">92%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="research">Research Query</TabsTrigger>
            <TabsTrigger value="literature">Literature Search</TabsTrigger>
            <TabsTrigger value="validate">Claim Validation</TabsTrigger>
            <TabsTrigger value="summary">Research Summary</TabsTrigger>
            <TabsTrigger value="trends">Research Trends</TabsTrigger>
          </TabsList>

          {/* Research Query Tab */}
          <TabsContent value="research" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Scientific Research Query
                </CardTitle>
                <CardDescription>
                  Ask any cannabis/hemp research question and get evidence-based analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResearchSubmit} className="space-y-4">
                  <Textarea
                    placeholder="e.g., What does research show about CBD's effectiveness for anxiety disorders?"
                    value={researchQuestion}
                    onChange={(e) => setResearchQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    type="submit" 
                    disabled={researchMutation.isPending || !researchQuestion.trim()}
                    className="w-full"
                  >
                    {researchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Analyze Research
                  </Button>
                </form>
                
                {researchMutation.data && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getEvidenceLevelColor(researchMutation.data.evidenceLevel)}>
                        {researchMutation.data.evidenceLevel?.toUpperCase()} Evidence
                      </Badge>
                      <Badge variant="outline">
                        {researchMutation.data.response.confidence}% Confidence
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Research Analysis:</h4>
                      <div className="whitespace-pre-wrap text-sm">
                        {researchMutation.data.response.response}
                      </div>
                    </div>
                    
                    {researchMutation.data.response.sources?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Sources:</h4>
                        <ul className="space-y-1">
                          {researchMutation.data.response.sources.map((source: string, index: number) => (
                            <li key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {source}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Literature Search Tab */}
          <TabsContent value="literature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PubMed Literature Search
                </CardTitle>
                <CardDescription>
                  Search scientific literature using specific terms and keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <Input
                    placeholder="Enter search terms separated by commas (e.g., CBD, anxiety, clinical trial)"
                    value={searchTerms}
                    onChange={(e) => setSearchTerms(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    disabled={searchMutation.isPending || !searchTerms.trim()}
                    className="w-full"
                  >
                    {searchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Search Literature
                  </Button>
                </form>

                {searchMutation.data && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Search Results</h4>
                      <Badge variant="outline">
                        {searchMutation.data.totalResults} articles found
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-[400px] w-full border rounded-lg p-4">
                      <div className="space-y-4">
                        {searchMutation.data.results?.map((article: any, index: number) => (
                          <div key={index} className="border-b pb-4 last:border-b-0">
                            <h5 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {article.title}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {article.authors?.join(', ')} • {article.journal} • {article.publishDate}
                            </p>
                            <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                              {article.abstract?.substring(0, 200)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                PMID: {article.pmid}
                              </Badge>
                              {article.citationCount && (
                                <Badge variant="outline" className="text-xs">
                                  {article.citationCount} citations
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claim Validation Tab */}
          <TabsContent value="validate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Scientific Claim Validation
                </CardTitle>
                <CardDescription>
                  Validate scientific claims against peer-reviewed research
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidateSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Enter a scientific claim to validate (e.g., 'CBD reduces anxiety in clinical trials')"
                    value={claimToValidate}
                    onChange={(e) => setClaimToValidate(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    type="submit" 
                    disabled={validateMutation.isPending || !claimToValidate.trim()}
                    className="w-full"
                  >
                    {validateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Validate Claim
                  </Button>
                </form>

                {validateMutation.data && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getEvidenceLevelColor(validateMutation.data.evidenceLevel)}>
                        {validateMutation.data.evidenceLevel?.toUpperCase()} Evidence
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Consensus:</span>
                        <Progress value={validateMutation.data.consensusLevel} className="w-20" />
                        <span className="text-sm">{validateMutation.data.consensusLevel}%</span>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription>
                        <strong>Validation Summary:</strong> Found {validateMutation.data.supportingStudies} supporting studies
                        {validateMutation.data.contradictingStudies > 0 && 
                          ` and ${validateMutation.data.contradictingStudies} contradicting studies`
                        }.
                      </AlertDescription>
                    </Alert>

                    {validateMutation.data.recommendations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {validateMutation.data.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Research Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Research Summary Generator
                </CardTitle>
                <CardDescription>
                  Generate comprehensive summaries of research on specific topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSummarySubmit} className="space-y-4">
                  <Input
                    placeholder="Enter research topic (e.g., 'THC for chronic pain management')"
                    value={summaryTopic}
                    onChange={(e) => setSummaryTopic(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    disabled={summaryMutation.isPending || !summaryTopic.trim()}
                    className="w-full"
                  >
                    {summaryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate Summary
                  </Button>
                </form>

                {summaryMutation.data && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {summaryMutation.data.summary.totalStudies}
                          </div>
                          <div className="text-sm text-gray-600">Total Studies</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <Badge className={getEvidenceLevelColor(summaryMutation.data.summary.evidenceQuality)}>
                            {summaryMutation.data.summary.evidenceQuality?.toUpperCase()}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">Evidence Quality</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-600">
                            {Object.values(summaryMutation.data.summary.studyDistribution || {}).reduce((a: any, b: any) => a + b, 0)}
                          </div>
                          <div className="text-sm text-gray-600">Study Types</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Key Findings:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {summaryMutation.data.summary.keyFindings?.map((finding: string, index: number) => (
                          <li key={index} className="text-sm">{finding}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Clinical Relevance:</h4>
                      <p className="text-sm">{summaryMutation.data.summary.clinicalRelevance}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Research Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cannabis Research Trends
                </CardTitle>
                <CardDescription>
                  Explore emerging trends and patterns in cannabis research
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Emerging Research Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {trends.trends.emergingTopics?.map((topic: string, index: number) => (
                          <Badge key={index} variant="outline">{topic}</Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Publication Growth</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(trends.trends.publicationGrowth || {}).map(([year, count]: [string, any]) => (
                          <div key={year} className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-gray-600">{year}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Top Research Journals</h4>
                      <ul className="space-y-2">
                        {trends.trends.topJournals?.map((journal: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{journal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Research Gaps & Opportunities</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {trends.trends.researchGaps?.map((gap: string, index: number) => (
                          <li key={index} className="text-sm text-orange-600">{gap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading research trends...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}