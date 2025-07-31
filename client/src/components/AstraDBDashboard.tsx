import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Database, 
  Upload, 
  BarChart3, 
  Activity, 
  Settings, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AstraDBStats {
  total_documents: number;
  collection_name: string;
  vector_dimension: number;
  metadata_categories: string[];
  avg_similarity_score: number;
  last_updated: string;
}

interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  similarity_score: number;
  id: string;
}

interface VectorSearchParams {
  query: string;
  agentType: string;
  topK: number;
  filterMetadata?: Record<string, any>;
}

interface CrossAgentSearchParams {
  query: string;
  agentTypes?: string[];
  topKPerAgent: number;
}

export default function AstraDBDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('compliance');
  const [topK, setTopK] = useState(5);
  const [crossAgentSearch, setCrossAgentSearch] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Available agents organized by phase
  const agents = [
    'compliance', 'formulation', 'marketing',
    'operations', 'sourcing', 'patent', 'spectra', 'lms'
  ];

  // Health check query
  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/astradb/health'],
    refetchInterval: 30000
  });

  // Configuration query
  const { data: configData } = useQuery({
    queryKey: ['/api/astradb/config']
  });

  // Knowledge base stats
  const { data: knowledgeBaseStats } = useQuery({
    queryKey: ['/api/astradb/knowledge-base'],
    refetchInterval: 60000
  });

  // Agent stats
  const { data: agentStats } = useQuery({
    queryKey: ['/api/astradb/stats', selectedAgent],
    enabled: !!selectedAgent
  });

  // Vector search mutation
  const vectorSearchMutation = useMutation({
    mutationFn: async (params: VectorSearchParams) => {
      return await apiRequest('/api/astradb/search', 'POST', JSON.stringify(params));
    }
  });

  // Cross-agent search mutation
  const crossSearchMutation = useMutation({
    mutationFn: async (params: CrossAgentSearchParams) => {
      return await apiRequest('/api/astradb/cross-search', 'POST', JSON.stringify(params));
    }
  });

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async (params: { agentType?: string; verifyOnly?: boolean }) => {
      return await apiRequest('/api/astradb/migrate', 'POST', JSON.stringify(params));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/astradb/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/astradb/knowledge-base'] });
      setMigrationStatus('completed');
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    if (crossAgentSearch) {
      crossSearchMutation.mutate({
        query: searchQuery,
        topKPerAgent: topK
      });
    } else {
      vectorSearchMutation.mutate({
        query: searchQuery,
        agentType: selectedAgent,
        topK
      });
    }
  };

  const handleMigration = (agentType?: string) => {
    migrationMutation.mutate({ agentType });
    setMigrationStatus('running');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSearchResults = (results: SearchResult[]) => {
    if (!results || results.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No results found for your query.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={result.id || index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">
                  Result {index + 1}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.similarity_score * 100)}% match
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                {result.content}
              </p>
              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <p className="text-xs font-medium text-gray-600 mb-1">Metadata:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(result.metadata)
                      .filter(([key]) => key !== 'id')
                      .map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AstraDB Vector Search Dashboard</h1>
        <p className="text-gray-600">
          Manage and search cannabis industry knowledge across all 9 AI agents
        </p>
      </div>

      {/* Health Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHealth()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(healthData?.status || 'unknown')}>
              {healthData?.status || 'Unknown'}
            </Badge>
            {healthData?.status === 'healthy' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                AstraDB Connected
              </div>
            )}
            {healthData?.error && (
              <Alert className="flex-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{healthData.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Vector Search</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Vector Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search cannabis knowledge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Results:</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cross-agent"
                    checked={crossAgentSearch}
                    onChange={(e) => setCrossAgentSearch(e.target.checked)}
                  />
                  <label htmlFor="cross-agent" className="text-sm">
                    Search across all agents
                  </label>
                </div>

                {!crossAgentSearch && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Agent:</label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      {agents.map(agent => (
                        <option key={agent} value={agent}>
                          {agent.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  disabled={vectorSearchMutation.isPending || crossSearchMutation.isPending}
                  className="ml-auto"
                >
                  {(vectorSearchMutation.isPending || crossSearchMutation.isPending) ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {(vectorSearchMutation.data || crossSearchMutation.data) && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <p className="text-sm text-gray-600">
                  {crossAgentSearch 
                    ? `Found ${crossSearchMutation.data?.total_results || 0} results across multiple agents`
                    : `Found ${vectorSearchMutation.data?.total_results || 0} results in ${selectedAgent} agent`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {crossAgentSearch ? (
                  <div className="space-y-6">
                    {crossSearchMutation.data?.results && Object.entries(crossSearchMutation.data.results).map(([agent, results]) => (
                      <div key={agent}>
                        <h4 className="font-medium mb-3 capitalize">{agent.replace('-', ' ')} Agent</h4>
                        {renderSearchResults(results as SearchResult[])}
                      </div>
                    ))}
                  </div>
                ) : (
                  renderSearchResults(vectorSearchMutation.data?.results || [])
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Knowledge Base Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Knowledge Base Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {knowledgeBaseStats?.knowledge_base_stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {knowledgeBaseStats.knowledge_base_stats.total_agents || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {knowledgeBaseStats.knowledge_base_stats.total_documents || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {knowledgeBaseStats.knowledge_base_stats.last_updated || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent-Specific Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Statistics</CardTitle>
              <div className="flex gap-2">
                {agents.map(agent => (
                  <Button
                    key={agent}
                    variant={selectedAgent === agent ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    {agent.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {agentStats?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold">{agentStats.stats.total_documents || 0}</div>
                    <div className="text-sm text-gray-600">Documents</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold">{agentStats.stats.collection_name || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Collection</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-semibold">{agentStats.stats.vector_dimension || 0}</div>
                    <div className="text-sm text-gray-600">Vector Dimension</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold">
                      {agentStats.stats.metadata_categories?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Metadata Categories</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Migration Tools
              </CardTitle>
              <p className="text-sm text-gray-600">
                Migrate agent data from FAISS to AstraDB
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationStatus && (
                <Alert className={migrationStatus === 'completed' ? 'border-green-200' : 'border-yellow-200'}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Migration status: {migrationStatus}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => handleMigration()}
                  disabled={migrationMutation.isPending}
                  className="flex-1"
                >
                  {migrationMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Migrating All Agents...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Migrate All Agents
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleMigration(selectedAgent)}
                  disabled={migrationMutation.isPending}
                  className="flex-1"
                >
                  Migrate {selectedAgent.replace('-', ' ')} Agent
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {agents.map(agent => (
                  <Button
                    key={agent}
                    variant="outline"
                    size="sm"
                    onClick={() => handleMigration(agent)}
                    disabled={migrationMutation.isPending}
                  >
                    {agent.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configData && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">AstraDB Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={configData.astradb.enabled ? "default" : "secondary"}>
                          {configData.astradb.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <span className="text-sm">AstraDB Connection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={configData.astradb.hasEndpoint ? "default" : "secondary"}>
                          {configData.astradb.hasEndpoint ? "Configured" : "Missing"}
                        </Badge>
                        <span className="text-sm">API Endpoint</span>
                      </div>
                      <div className="text-sm">
                        <strong>Embedding Model:</strong> {configData.astradb.embeddingModel}
                      </div>
                      <div className="text-sm">
                        <strong>Vector Dimension:</strong> {configData.astradb.vectorDimension}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Available Agents</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {configData.agents.map((agent: string) => (
                        <Badge key={agent} variant="outline">
                          {agent.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(configData.features).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Badge variant={enabled ? "default" : "secondary"}>
                            {enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <span className="text-sm capitalize">
                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}