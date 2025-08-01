import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Upload, FileText, Beaker, Scale, Shield, Settings, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import goodforImage from '@assets/IMG_0451_1752508833626.png';

interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  concerns: string[];
  recommendations: string[];
  requiresFollowUp: boolean;
  crossReferences: string[];
}

interface MultiAgentQuery {
  id: string;
  originalQuery: string;
  primaryAgent: string;
  involvedAgents: string[];
  responses: AgentResponse[];
  consensus: string;
  finalRecommendation: string;
  riskAssessment: string;
  timestamp: string;
}

const agentIcons = {
  'formulation-agent': <Beaker className="w-4 h-4" />,
  'science-agent': <Scale className="w-4 h-4" />,
  'compliance-agent': <Shield className="w-4 h-4" />,
  'operations-agent': <Settings className="w-4 h-4" />,
  'marketing-agent': <FileText className="w-4 h-4" />
};

const agentNames = {
  'formulation-agent': 'Formulation Agent',
  'science-agent': 'Science Agent',
  'compliance-agent': 'Compliance Agent',
  'operations-agent': 'Operations Agent',
  'marketing-agent': 'Marketing Agent'
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const riskColor = (risk: string) => {
  if (risk.toLowerCase().includes('high')) return 'destructive';
  if (risk.toLowerCase().includes('medium')) return 'default';
  return 'secondary';
};

export default function GoodFORUseCase() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisType, setAnalysisType] = useState('formulation');
  const [copiedQuery, setCopiedQuery] = useState(false);
  const queryClient = useQueryClient();

  const analysisQueries = {
    formulation: `Please analyze this GoodFOR Pain CBD topical label for formulation quality, ingredient interactions, and potential improvements. The product contains 5% menthol and 5% camphor as active ingredients, with a complex blend of inactive ingredients including organic aloe, hemp flower oil, and various botanical extracts. What are the formulation strengths, potential issues, and recommendations for optimization?`,
    
    regulatory: `Review this GoodFOR Pain CBD topical label for FDA compliance and regulatory issues. The product makes claims about pain relief and lists specific drug facts. Analyze the compliance with FDA regulations for topical analgesics, labeling requirements, and any potential regulatory concerns or violations.`,
    
    market: `Evaluate this GoodFOR Pain CBD topical from a market positioning and competitive analysis perspective. Assess the product's branding, claims, ingredient positioning, and market differentiation. What are the marketing strengths and areas for improvement?`,
    
    safety: `Conduct a comprehensive safety analysis of this GoodFOR Pain CBD topical formulation. Evaluate potential adverse reactions, contraindications, drug interactions, and safety profile of the active and inactive ingredients. What safety concerns should be addressed?`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const { data: multiAgentResult, isLoading } = useQuery<MultiAgentQuery>({
    queryKey: ['/api/multi-agent/goodfor-analysis', analysisType],
    enabled: false
  });

  const processAnalysis = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/multi-agent/process', {
        method: 'POST',
        body: JSON.stringify({
          query: analysisQueries[analysisType],
          primaryAgent: analysisType === 'formulation' ? 'formulation-agent' : 
                       analysisType === 'regulatory' ? 'compliance-agent' :
                       analysisType === 'market' ? 'marketing-agent' : 'science-agent'
        })
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/multi-agent/goodfor-analysis', analysisType], data);
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Error processing analysis:', error);
      setIsProcessing(false);
    }
  });

  const handleRunAnalysis = () => {
    setIsProcessing(true);
    processAnalysis.mutate();
  };

  if (isLoading || isProcessing) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-2xl font-bold">Analyzing GoodFOR Pain Label...</h2>
          <p className="text-gray-600">Our AI agents are conducting comprehensive analysis of the product formulation and claims.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">GoodFOR Pain CBD Topical Analysis</h1>
        <p className="text-lg text-gray-600">
          Multi-Agent Analysis of Existing Cannabis Topical Product
        </p>
      </div>

      {/* Product Label Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Product Label Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <img 
                  src={goodforImage} 
                  alt="GoodFOR Pain CBD Topical Label" 
                  className="mx-auto max-h-96 object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Label Uploaded
                </Badge>
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Brand:</strong> GoodFOR</div>
                  <div><strong>Product:</strong> Pain Relief Topical</div>
                  <div><strong>Size:</strong> 2.5 FL oz</div>
                  <div><strong>Active Ingredients:</strong> Menthol 5%, Camphor 5%</div>
                  <div><strong>Claims:</strong> Doctor Recommended, Topical Analgesic</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800">Key Inactive Ingredients</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Organic Aloe Leaf Juice</div>
                  <div>• Full Spectrum Hemp Flower Oil</div>
                  <div>• Menthol Crystals</div>
                  <div>• Meadowfoam Seed Oil</div>
                  <div>• Various botanical extracts</div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-amber-800">Drug Facts Panel</h3>
                <div className="text-sm text-amber-700">
                  <div>• FDA-compliant drug facts format</div>
                  <div>• Specific usage instructions</div>
                  <div>• Warnings and contraindications</div>
                  <div>• External use only designation</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question to Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Question to Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-700 mb-3 italic">
              "{analysisQueries[analysisType]}"
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(analysisQueries[analysisType])}
              className="text-xs"
            >
              {copiedQuery ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Question
                </>
              )}
            </Button>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Copy this question and paste it into any AI chat interface to get multi-agent analysis on the GoodFOR Pain product.
          </div>
        </CardContent>
      </Card>

      {/* Analysis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Analysis Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant={analysisType === 'formulation' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('formulation')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Beaker className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Formulation</div>
                <div className="text-xs opacity-75">Ingredient analysis</div>
              </div>
            </Button>
            
            <Button 
              variant={analysisType === 'regulatory' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('regulatory')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Shield className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Regulatory</div>
                <div className="text-xs opacity-75">FDA compliance</div>
              </div>
            </Button>
            
            <Button 
              variant={analysisType === 'market' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('market')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Market</div>
                <div className="text-xs opacity-75">Positioning analysis</div>
              </div>
            </Button>
            
            <Button 
              variant={analysisType === 'safety' ? 'default' : 'outline'}
              onClick={() => setAnalysisType('safety')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <AlertTriangle className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Safety</div>
                <div className="text-xs opacity-75">Risk assessment</div>
              </div>
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button onClick={handleRunAnalysis} className="bg-blue-600 hover:bg-blue-700">
              <Scale className="w-4 h-4 mr-2" />
              Run {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {multiAgentResult && (
        <>
          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Analysis Results - {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{multiAgentResult.involvedAgents.length}</div>
                  <div className="text-sm text-gray-600">Agents Consulted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{multiAgentResult.responses.length}</div>
                  <div className="text-sm text-gray-600">Expert Opinions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(multiAgentResult.responses.reduce((sum, r) => sum + r.confidence, 0) / multiAgentResult.responses.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </div>

              <Tabs defaultValue="consensus" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="consensus">Consensus</TabsTrigger>
                  <TabsTrigger value="responses">Expert Responses</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="consensus" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Multi-Agent Consensus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{multiAgentResult.consensus}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="responses" className="space-y-4">
                  {multiAgentResult.responses.map((response, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {agentIcons[response.agent]}
                            {agentNames[response.agent]}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${confidenceColor(response.confidence)}`}></div>
                            <span className="text-sm">{response.confidence}%</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none mb-4">
                          <p className="text-gray-700">{response.response}</p>
                        </div>
                        
                        {response.concerns.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              Concerns
                            </h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {response.concerns.map((concern, i) => (
                                <li key={i} className="text-gray-600">{concern}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {response.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Recommendations
                            </h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {response.recommendations.map((rec, i) => (
                                <li key={i} className="text-gray-600">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="recommendations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Final Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{multiAgentResult.finalRecommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risks">
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Risk Level: <Badge variant={riskColor(multiAgentResult.riskAssessment)}>
                            {multiAgentResult.riskAssessment.includes('HIGH') ? 'HIGH' : 
                             multiAgentResult.riskAssessment.includes('MEDIUM') ? 'MEDIUM' : 'LOW'}
                          </Badge>
                        </AlertDescription>
                      </Alert>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{multiAgentResult.riskAssessment}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Analysis Context */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">What We Analyze</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Ingredient compatibility and interactions
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  FDA regulatory compliance
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Market positioning and claims
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Safety profile and contraindications
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Key Focus Areas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Active ingredient efficacy
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Hemp-derived CBD integration
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  Labeling accuracy and compliance
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Formulation optimization opportunities
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}