import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Users, Beaker, Scale, Shield, Settings, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

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
  'customer-success-agent': <Users className="w-4 h-4" />
};

const agentNames = {
  'formulation-agent': 'Formulation Agent',
  'science-agent': 'Science Agent',
  'compliance-agent': 'Compliance Agent',
  'operations-agent': 'Operations Agent',
  'customer-success-agent': 'Customer Success Agent'
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

export default function DMSOUseCase() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUseCase, setSelectedUseCase] = useState('human');
  const [copiedQuery, setCopiedQuery] = useState(false);
  const queryClient = useQueryClient();
  
  const useCaseQueries = {
    human: "I'm formulating a CBD topical with terpenes and want to use DMSO to improve permeability. What are the science, safety, and regulatory considerations for human use?",
    veterinary: "I'm developing a CBD topical with DMSO for veterinary applications in dogs and cats. What are the specific safety, efficacy, and regulatory considerations for animal use?",
    fda: "I want to develop a CBD topical with DMSO as an FDA-approved drug for treating specific medical conditions. What are the clinical trial requirements, safety studies, and regulatory pathway considerations?",
    personal: "I'm interested in making a CBD topical with DMSO for personal use. What are the safety considerations, formulation guidelines, and legal implications I should be aware of?"
  };
  
  const demoQuery = useCaseQueries[selectedUseCase];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const { data: multiAgentResult, isLoading } = useQuery<MultiAgentQuery>({
    queryKey: ['/api/multi-agent/dmso-demo'],
    enabled: false // We'll trigger this manually
  });

  const processQuery = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/multi-agent/process', {
        method: 'POST',
        body: JSON.stringify({
          query: demoQuery,
          primaryAgent: 'formulation-agent'
        })
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/multi-agent/dmso-demo'], data);
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Error processing multi-agent query:', error);
      setIsProcessing(false);
    }
  });

  const handleRunDemo = () => {
    setIsProcessing(true);
    processQuery.mutate();
  };

  if (isLoading || isProcessing) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-2xl font-bold">Processing Multi-Agent Query...</h2>
          <p className="text-gray-600">Our AI agents are collaborating to analyze your CBD topical formulation question.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Use Case: CBD Topical with DMSO</h1>
        <p className="text-lg text-gray-600">
          Multi-Agent Analysis of Complex Cannabis Formulation Questions
        </p>
        
        {/* Use Case Selector */}
        <div className="flex justify-center space-x-2 mt-4">
          <Button 
            variant={selectedUseCase === 'human' ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase('human')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Human Use
          </Button>
          <Button 
            variant={selectedUseCase === 'veterinary' ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase('veterinary')}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Veterinary
          </Button>
          <Button 
            variant={selectedUseCase === 'fda' ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase('fda')}
            className="flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            FDA Drug
          </Button>
          <Button 
            variant={selectedUseCase === 'personal' ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase('personal')}
            className="flex items-center gap-2"
          >
            <Beaker className="w-4 h-4" />
            Personal Use
          </Button>
        </div>
      </div>

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
              "{demoQuery}"
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(demoQuery)}
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
            Copy this question and paste it into any AI chat interface to get multi-agent analysis on your CBD topical formulation.
          </div>
        </CardContent>
      </Card>

      {/* Query Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            {selectedUseCase === 'human' && 'Human Use Query'}
            {selectedUseCase === 'veterinary' && 'Veterinary Application Query'}
            {selectedUseCase === 'fda' && 'FDA Drug Development Query'}
            {selectedUseCase === 'personal' && 'Personal Use Query'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700">{demoQuery}</p>
          </div>
          
          {/* Use Case Context */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Use Case Context:</h4>
            <p className="text-sm text-blue-700">
              {selectedUseCase === 'human' && 'Standard human topical formulation with commercial considerations and consumer safety requirements.'}
              {selectedUseCase === 'veterinary' && 'Veterinary applications require species-specific safety data, veterinarian oversight, and compliance with animal drug regulations.'}
              {selectedUseCase === 'fda' && 'FDA drug development pathway requires extensive clinical trials, safety studies, and regulatory approval for therapeutic claims.'}
              {selectedUseCase === 'personal' && 'Personal use formulations focus on safety, legal compliance, and DIY formulation guidelines for individual use.'}
            </p>
          </div>
          
          {!multiAgentResult && (
            <div className="text-center">
              <Button onClick={handleRunDemo} className="bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                Run Multi-Agent Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {multiAgentResult && (
        <>
          {/* Agent Involvement Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agent Collaboration Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{multiAgentResult.involvedAgents.length}</div>
                  <div className="text-sm text-gray-600">Agents Involved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{multiAgentResult.responses.length}</div>
                  <div className="text-sm text-gray-600">Expert Responses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(multiAgentResult.responses.reduce((sum, r) => sum + r.confidence, 0) / multiAgentResult.responses.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {multiAgentResult.involvedAgents.map((agent) => (
                  <Badge key={agent} variant="secondary" className="flex items-center gap-1">
                    {agentIcons[agent]}
                    {agentNames[agent]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="responses" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="responses">Agent Responses</TabsTrigger>
              <TabsTrigger value="consensus">Consensus</TabsTrigger>
              <TabsTrigger value="recommendations">Final Recommendations</TabsTrigger>
              <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
            </TabsList>

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
                        <Badge variant={response.requiresFollowUp ? "destructive" : "secondary"}>
                          {response.requiresFollowUp ? "Follow-up Required" : "Complete"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${confidenceColor(response.confidence)}`}></div>
                          <span className="text-sm">{response.confidence}%</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700">{response.response}</p>
                      </div>
                      
                      {response.concerns.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Concerns Identified
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
                      
                      {response.crossReferences.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">Cross-References</h4>
                          <div className="flex flex-wrap gap-1">
                            {response.crossReferences.map((ref, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {agentNames[ref] || ref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="consensus">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Multi-Agent Consensus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{multiAgentResult.consensus}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Final Recommendations
                  </CardTitle>
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
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Risk Assessment
                  </CardTitle>
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

          {/* Process Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Process Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-2">
                Query processed at: {new Date(multiAgentResult.timestamp).toLocaleString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Query Analysis</span>
                  <span className="text-green-600">Complete</span>
                </div>
                <Progress value={100} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Agent Responses ({multiAgentResult.responses.length})</span>
                  <span className="text-green-600">Complete</span>
                </div>
                <Progress value={100} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Consensus Generation</span>
                  <span className="text-green-600">Complete</span>
                </div>
                <Progress value={100} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Final Recommendations</span>
                  <span className="text-green-600">Complete</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}