import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Upload, FileText, Brain, Search, Plus, Download, Trash2, Play, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CorpusInfo {
  agent: string;
  path: string;
  size: number;
  documents: number;
  lastUpdated: string;
  vectorized: boolean;
  description: string;
}

interface KnowledgeBase {
  agent: string;
  ontologyFile: string;
  triples: number;
  lastUpdated: string;
  sparqlEndpoint?: string;
  description: string;
}

export default function DataManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAgent, setSelectedAgent] = useState<string>('compliance');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Fetch all corpora information
  const { data: corporaData, isLoading: corporaLoading } = useQuery({
    queryKey: ['/api/data/corpora'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch knowledge bases information
  const { data: knowledgeBases, isLoading: kbLoading } = useQuery({
    queryKey: ['/api/data/knowledge-bases'],
    refetchInterval: 30000,
  });

  // Fetch SPARQL query results
  const [sparqlQuery, setSparqlQuery] = useState('SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10');
  const [sparqlResults, setSparqlResults] = useState<any[]>([]);

  // Document upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files, agent }: { files: FileList; agent: string }) => {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('documents', file));
      formData.append('agent', agent);
      
      return apiRequest('/api/data/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Documents Uploaded",
        description: "Files have been successfully added to the corpus"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/data/corpora'] });
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  });

  // RAG generation mutation
  const generateRAGMutation = useMutation({
    mutationFn: async ({ agent, options }: { agent: string; options: any }) => {
      return apiRequest('/api/data/generate-rag', {
        method: 'POST',
        body: { agent, ...options }
      });
    },
    onSuccess: () => {
      toast({
        title: "RAG Generated",
        description: "Vector embeddings have been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/data/corpora'] });
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: "RAG Generation Failed",
        description: error.message || "Failed to generate vector embeddings",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // SPARQL query mutation
  const sparqlQueryMutation = useMutation({
    mutationFn: async ({ query, agent }: { query: string; agent: string }) => {
      return apiRequest('/api/data/sparql', {
        method: 'POST',
        body: { query, agent }
      });
    },
    onSuccess: (data) => {
      setSparqlResults(data.results || []);
      toast({
        title: "Query Executed",
        description: `Found ${data.results?.length || 0} results`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Query Failed",
        description: error.message || "SPARQL query execution failed",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadProgress(10);
      uploadMutation.mutate({ files, agent: selectedAgent });
    }
  };

  const handleGenerateRAG = (agent: string) => {
    setIsProcessing(true);
    generateRAGMutation.mutate({ 
      agent, 
      options: {
        chunkSize: 1000,
        chunkOverlap: 200,
        embeddingModel: 'text-embedding-ada-002'
      }
    });
  };

  const handleSparqlQuery = () => {
    sparqlQueryMutation.mutate({ query: sparqlQuery, agent: selectedAgent });
  };

  const mockCorpora: CorpusInfo[] = [
    {
      agent: 'compliance',
      path: 'agents/compliance-agent/rag/corpus.jsonl',
      size: 245760,
      documents: 52,
      lastUpdated: '2025-01-27T18:00:00Z',
      vectorized: true,
      description: 'Cannabis compliance regulations and legal documents'
    },
    {
      agent: 'formulation',
      path: 'agents/formulation-agent/rag/corpus.jsonl',
      size: 189430,
      documents: 38,
      lastUpdated: '2025-01-27T17:30:00Z',
      vectorized: true,
      description: 'Cannabis formulation recipes and ingredient data'
    },
    {
      agent: 'marketing',
      path: 'agents/marketing-agent/rag/corpus.jsonl',
      size: 156720,
      documents: 29,
      lastUpdated: '2025-01-27T16:45:00Z',
      vectorized: false,
      description: 'Cannabis marketing strategies and campaign data'
    }
  ];

  const mockKnowledgeBases: KnowledgeBase[] = [
    {
      agent: 'compliance',
      ontologyFile: 'knowledge_base.ttl',
      triples: 15420,
      lastUpdated: '2025-01-27T18:00:00Z',
      sparqlEndpoint: 'http://localhost:3030/compliance/sparql',
      description: 'Cannabis compliance ontology with regulatory relationships'
    },
    {
      agent: 'formulation',
      ontologyFile: 'knowledge_base.ttl',
      triples: 8930,
      lastUpdated: '2025-01-27T17:30:00Z',
      description: 'Cannabis compound and formulation ontology'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-gray-600">Manage corpora, knowledge bases, and data processing for all agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="agentSelect">Active Agent:</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="formulation">Formulation</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="sourcing">Sourcing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Total Corpora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockCorpora.length}</div>
            <div className="text-sm text-gray-600">
              {mockCorpora.reduce((sum, c) => sum + c.documents, 0)} documents
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Knowledge Bases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockKnowledgeBases.length}</div>
            <div className="text-sm text-gray-600">
              {mockKnowledgeBases.reduce((sum, kb) => sum + kb.triples, 0)} triples
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Vectorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {mockCorpora.filter(c => c.vectorized).length}
            </div>
            <div className="text-sm text-gray-600">
              Ready for RAG
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(mockCorpora.reduce((sum, c) => sum + c.size, 0) / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-gray-600">
              Across all agents
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="corpora" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="corpora">Corpora</TabsTrigger>
          <TabsTrigger value="knowledge-bases">Knowledge Bases</TabsTrigger>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="sparql">SPARQL Query</TabsTrigger>
        </TabsList>

        <TabsContent value="corpora" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {mockCorpora.map((corpus, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {corpus.agent.charAt(0).toUpperCase() + corpus.agent.slice(1)} Agent Corpus
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={corpus.vectorized ? "default" : "secondary"}>
                        {corpus.vectorized ? "Vectorized" : "Not Vectorized"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleGenerateRAG(corpus.agent)}>
                        <Play className="h-4 w-4 mr-1" />
                        Generate RAG
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{corpus.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{corpus.documents}</div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(corpus.size / 1024)}KB
                      </div>
                      <div className="text-sm text-gray-600">Size</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {new Date(corpus.lastUpdated).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Updated</div>
                    </div>
                    <div>
                      <div className="text-sm font-mono text-gray-600">{corpus.path}</div>
                      <div className="text-sm text-gray-500">Path</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="knowledge-bases" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {mockKnowledgeBases.map((kb, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {kb.agent.charAt(0).toUpperCase() + kb.agent.slice(1)} Knowledge Base
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{kb.triples} triples</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Export TTL
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{kb.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-mono text-gray-600">{kb.ontologyFile}</div>
                      <div className="text-sm text-gray-500">Ontology File</div>
                    </div>
                    <div>
                      <div className="text-sm font-mono text-gray-600">
                        {kb.sparqlEndpoint || 'Not configured'}
                      </div>
                      <div className="text-sm text-gray-500">SPARQL Endpoint</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        {new Date(kb.lastUpdated).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">Last Updated</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Add new documents to the {selectedAgent} agent corpus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Select Documents</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.json,.jsonl"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                  <div className="text-xs text-gray-500">
                    Supported formats: PDF, TXT, MD, JSON, JSONL
                  </div>
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Upload Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  disabled={uploadMutation.isPending}
                  onClick={() => document.getElementById('fileUpload')?.click()}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Choose Files"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  RAG Processing
                </CardTitle>
                <CardDescription>
                  Generate vector embeddings for the selected agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Processing Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="chunkSize" className="text-xs">Chunk Size</Label>
                      <Input id="chunkSize" type="number" defaultValue="1000" />
                    </div>
                    <div>
                      <Label htmlFor="overlap" className="text-xs">Overlap</Label>
                      <Input id="overlap" type="number" defaultValue="200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embeddingModel">Embedding Model</Label>
                  <Select defaultValue="text-embedding-ada-002">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-embedding-ada-002">OpenAI Ada-002</SelectItem>
                      <SelectItem value="text-embedding-3-small">OpenAI Embedding-3-Small</SelectItem>
                      <SelectItem value="text-embedding-3-large">OpenAI Embedding-3-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleGenerateRAG(selectedAgent)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Generate Vector Embeddings"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sparql" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SPARQL Query Interface
                </CardTitle>
                <CardDescription>
                  Query the {selectedAgent} agent knowledge base using SPARQL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sparqlQuery">SPARQL Query</Label>
                  <Textarea
                    id="sparqlQuery"
                    value={sparqlQuery}
                    onChange={(e) => setSparqlQuery(e.target.value)}
                    placeholder="Enter your SPARQL query..."
                    className="min-h-[120px] font-mono"
                  />
                </div>

                <Button 
                  onClick={handleSparqlQuery}
                  disabled={sparqlQueryMutation.isPending}
                  className="w-full"
                >
                  {sparqlQueryMutation.isPending ? "Executing..." : "Execute Query"}
                </Button>

                {sparqlResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Query Results ({sparqlResults.length} rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-2 font-mono text-sm max-h-60 overflow-auto">
                        <pre>{JSON.stringify(sparqlResults, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}