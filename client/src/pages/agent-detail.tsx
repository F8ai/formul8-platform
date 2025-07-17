import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bot, Code, Play, FileText, BarChart3, Settings, TestTube, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentDetailProps {
  agentId: string;
}

export default function AgentDetail({ agentId }: AgentDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testQuery, setTestQuery] = useState("");
  const [contextData, setContextData] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);

  // Agent configurations
  const agentConfigs = {
    compliance: {
      name: "Compliance Agent",
      description: "Cannabis regulatory guidance, SOP validation, and compliance risk assessment",
      icon: "🛡️",
      color: "bg-blue-500",
      file: "server/agents/compliance.ts",
      capabilities: [
        "State and local cannabis regulations",
        "Packaging and labeling requirements", 
        "Testing requirements and limits",
        "SOP compliance verification",
        "Facility compliance (ICC, OSHA, local codes)",
        "Marketing compliance (avoiding child-appeal, proper claims)",
        "280E tax compliance",
        "Licensing requirements"
      ],
      sampleQueries: [
        "What are the THC limits for edibles in California?",
        "How should I label my cannabis products for Colorado compliance?",
        "What testing requirements do I need for flower in Washington state?",
        "Can you help me validate my SOP for extraction operations?"
      ],
      contextFields: [
        { name: "jurisdiction", label: "Jurisdiction", placeholder: "e.g., California, Colorado" },
        { name: "businessType", label: "Business Type", placeholder: "e.g., cultivator, processor, retailer" },
        { name: "productType", label: "Product Type", placeholder: "e.g., flower, edibles, concentrates" }
      ]
    },
    marketing: {
      name: "Marketing Agent",
      description: "Cannabis marketing compliance, campaign optimization, and market intelligence",
      icon: "📈",
      color: "bg-purple-500", 
      file: "server/agents/marketing.ts",
      capabilities: [
        "Platform-specific advertising rules (Google, Facebook, Instagram, TikTok)",
        "Creative workarounds for restrictive platforms",
        "Cannabis marketing compliance checking",
        "Market size estimation via micro campaigns",
        "CPC analysis and budget optimization", 
        "Alternative advertising strategies (wellness, lifestyle angles)",
        "Content moderation and policy navigation",
        "Demographic targeting optimization",
        "ROI forecasting and campaign intelligence",
        "Brand positioning for cannabis market"
      ],
      sampleQueries: [
        "What can I advertise on Facebook for my CBD wellness brand?",
        "How do I market cannabis products on Instagram without getting banned?",
        "What are creative workarounds for Google Ads cannabis restrictions?",
        "Help me create lifestyle content that hints at cannabis benefits"
      ],
      contextFields: [
        { name: "jurisdiction", label: "Jurisdiction", placeholder: "e.g., California, Colorado" },
        { name: "platform", label: "Platform", placeholder: "e.g., Google Ads, Facebook, Instagram" },
        { name: "productCategory", label: "Product Category", placeholder: "e.g., flower, edibles, CBD wellness" },
        { name: "targetAudience", label: "Target Audience", placeholder: "e.g., medical patients, recreational users" }
      ],
      n8nWorkflow: {
        name: "Marketing Intelligence Workflow",
        description: "Automated compliance checking, micro campaign testing, and market analysis",
        steps: [
          { name: "Content Upload", description: "Marketing team submits ad content", icon: "👥" },
          { name: "OCR + Analysis", description: "Extract text and analyze images", icon: "🔍" },
          { name: "AI Compliance", description: "Marketing Agent compliance review", icon: "🧠" },
          { name: "Compliance Check", description: "Legal review and approval", icon: "🛡️" },
          { name: "Micro Campaign", description: "Test market and CPC analysis", icon: "🧪" },
          { name: "Market Intelligence", description: "Size, CPC, ROI estimates", icon: "📊" }
        ],
        configuration: {
          webhook: {
            path: "/marketing-review",
            method: "POST",
            authentication: "headerAuth"
          },
          campaign: {
            platform: "Google Ads API",
            budget: 50,
            duration: "48 hours"
          },
          analysis: {
            marketSizeAccuracy: "±15%",
            cpcPrediction: "±12%",
            setupTime: "5-10 minutes",
            testDuration: "48 hours"
          }
        },
        benefits: [
          "Platform-specific compliance checking",
          "Creative workaround strategies for restricted platforms",
          "Automated market testing across allowable channels",
          "48-hour market size estimates", 
          "Real-time CPC optimization",
          "Alternative messaging for mainstream platforms",
          "Market size estimation (±15% accuracy)",
          "CPC prediction (±12% accuracy)"
        ],
        exampleResults: {
          avgCPC: "$2.34",
          marketSize: "125K",
          ctr: "3.2%",
          estimatedMonthlyBudget: "$450"
        }
      }
    },
    formulation: {
      name: "Formulation Agent", 
      description: "Product development, cannabinoid profiles, and chemistry guidance",
      icon: "🧪",
      color: "bg-green-500",
      file: "server/agents/formulation.ts",
      capabilities: [
        "Product development guidance",
        "Cannabinoid profile optimization",
        "Terpene blending recommendations",
        "Extraction method selection", 
        "Recipe development and scaling",
        "Stability and shelf-life analysis",
        "Carrier oil selection",
        "Dosage calculations"
      ],
      sampleQueries: [
        "How do I formulate a balanced 1:1 THC:CBD tincture?",
        "What terpenes should I add for a relaxing effect?",
        "How do I scale my gummy recipe from 100mg to 1000mg batches?",
        "What's the best extraction method for preserving terpenes?"
      ],
      contextFields: [
        { name: "productType", label: "Product Type", placeholder: "e.g., tincture, edibles, topical" },
        { name: "targetPotency", label: "Target Potency", placeholder: "e.g., 10mg THC per dose" },
        { name: "desiredEffect", label: "Desired Effect", placeholder: "e.g., relaxing, energizing, pain relief" }
      ]
    },
    patent: {
      name: "Patent/Trademark Agent", 
      description: "IP research, freedom to operate analysis, and patent searches",
      icon: "©️",
      color: "bg-purple-500",
      file: "server/agents/patent.ts",
      capabilities: [
        "Patent landscape analysis",
        "Freedom to operate research",
        "Trademark searches and analysis",
        "IP infringement assessments",
        "Prior art searches",
        "Patent application guidance",
        "Brand protection strategies",
        "Cannabis-specific IP challenges"
      ],
      sampleQueries: [
        "Are there any patents on CO2 extraction methods?",
        "Can I trademark my cannabis brand name?",
        "What IP considerations are there for my vape cartridge design?",
        "How do I search for existing patents on my extraction process?"
      ],
      contextFields: [
        { name: "innovationType", label: "Innovation Type", placeholder: "e.g., extraction method, product design" },
        { name: "geography", label: "Geographic Scope", placeholder: "e.g., US, Canada, international" },
        { name: "technology", label: "Technology Area", placeholder: "e.g., extraction, cultivation, processing" }
      ]
    },
    operations: {
      name: "Operations Agent",
      description: "Equipment management, yield calculations, and process optimization", 
      icon: "⚙️",
      color: "bg-orange-500",
      file: "server/agents/operations.ts",
      capabilities: [
        "Equipment selection and sizing",
        "Yield optimization calculations",
        "Process flow design",
        "Facility layout planning",
        "Production scheduling",
        "Quality control processes",
        "Inventory management",
        "Cost analysis and efficiency"
      ],
      sampleQueries: [
        "What size extraction equipment do I need for 100lb/day processing?",
        "How can I optimize my flower drying process?",
        "What's the typical yield for CO2 extraction of flower?",
        "How should I layout my processing facility for efficiency?"
      ],
      contextFields: [
        { name: "facilitySize", label: "Facility Size", placeholder: "e.g., 10,000 sq ft" },
        { name: "processingVolume", label: "Processing Volume", placeholder: "e.g., 100 lbs/day" },
        { name: "operationType", label: "Operation Type", placeholder: "e.g., cultivation, extraction, manufacturing" }
      ]
    },
    sourcing: {
      name: "Sourcing Agent",
      description: "Vendor recommendations, equipment sourcing, and procurement guidance",
      icon: "🛒", 
      color: "bg-teal-500",
      file: "server/agents/sourcing.ts",
      capabilities: [
        "Equipment vendor recommendations",
        "Price comparison and analysis",
        "Supplier qualification criteria",
        "Procurement best practices",
        "Contract negotiation guidance",
        "Quality standards verification",
        "Lead time and logistics planning",
        "Cost optimization strategies"
      ],
      sampleQueries: [
        "Who are the best vendors for CO2 extraction equipment?",
        "What should I look for when sourcing packaging materials?",
        "How much should I budget for a complete extraction lab setup?",
        "What are the key criteria for selecting a testing lab partner?"
      ],
      contextFields: [
        { name: "budget", label: "Budget Range", placeholder: "e.g., $50K-100K" },
        { name: "equipment", label: "Equipment Type", placeholder: "e.g., extraction, packaging, testing" },
        { name: "timeline", label: "Timeline", placeholder: "e.g., 3 months, urgent" }
      ]
    },
    spectra: {
      name: "Spectra Agent",
      description: "CoA analysis, chromatography data processing, and testing compliance",
      icon: "📊",
      color: "bg-indigo-500",
      file: "server/agents/spectra.ts", 
      capabilities: [
        "Certificate of Analysis (CoA) validation",
        "GCMS/HPLC chromatography interpretation",
        "Cannabinoid and terpene profile analysis",
        "Contaminant detection and compliance",
        "Testing method validation",
        "Batch consistency analysis",
        "Quality control recommendations",
        "Regulatory compliance verification"
      ],
      sampleQueries: [
        "Can you analyze this CoA for compliance issues?",
        "What do these HPLC peaks indicate about my product?",
        "Is my batch within acceptable potency variance limits?",
        "How should I interpret these pesticide test results?"
      ],
      contextFields: [
        { name: "testType", label: "Test Type", placeholder: "e.g., potency, pesticides, terpenes" },
        { name: "jurisdiction", label: "Regulatory Jurisdiction", placeholder: "e.g., California, Colorado" },
        { name: "productType", label: "Product Type", placeholder: "e.g., flower, concentrate, edible" }
      ]
    },
    "customer-success": {
      name: "Customer Success Agent",
      description: "Customer support, sales enablement, and business intelligence",
      icon: "👥",
      color: "bg-emerald-500",
      file: "server/agents/customer-success.ts",
      capabilities: [
        "Customer support best practices",
        "Sales process optimization", 
        "Customer onboarding strategies",
        "Retention and loyalty programs",
        "Business intelligence insights",
        "Performance metrics analysis",
        "Customer feedback management",
        "Account management strategies"
      ],
      sampleQueries: [
        "How can I improve customer retention in my dispensary?",
        "What are effective sales techniques for cannabis products?",
        "How should I handle customer complaints about product quality?",
        "What metrics should I track to measure customer satisfaction?"
      ],
      contextFields: [
        { name: "businessModel", label: "Business Model", placeholder: "e.g., B2B, B2C, dispensary" },
        { name: "customerSegment", label: "Customer Segment", placeholder: "e.g., new users, medical patients" },
        { name: "challengeType", label: "Challenge Type", placeholder: "e.g., retention, acquisition, support" }
      ]
    }
  };

  const agent = agentConfigs[agentId as keyof typeof agentConfigs];
  
  // Fetch agent status
  const { data: agentStatus } = useQuery({
    queryKey: ["/api/agent-status", agentId],
  });

  // Test query mutation
  const testQueryMutation = useMutation({
    mutationFn: async (data: { query: string; context?: any }) => {
      try {
        const context = contextData ? JSON.parse(contextData) : data.context;
        return await apiRequest(`/api/langgraph/process`, {
          method: "POST",
          body: { 
            query: data.query, 
            agentType: agentId,
            context 
          }
        });
      } catch (error) {
        // Fallback to basic query endpoint if LangGraph isn't available
        const context = contextData ? JSON.parse(contextData) : data.context;
        return await apiRequest(`/api/query`, {
          method: "POST",
          body: { 
            content: data.query, 
            agentType: agentId,
            context 
          }
        });
      }
    },
    onSuccess: (result) => {
      setTestResults(prev => [{ timestamp: new Date(), query: testQuery, result }, ...prev]);
      toast({
        title: "Query Processed",
        description: `${agent.name} processed your query successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Query Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSampleQuery = (query: string) => {
    setTestQuery(query);
  };

  const handleTest = () => {
    if (!testQuery.trim()) return;
    
    let context = {};
    if (contextData.trim()) {
      try {
        context = JSON.parse(contextData);
      } catch (e) {
        toast({
          title: "Invalid Context",
          description: "Context must be valid JSON",
          variant: "destructive",
        });
        return;
      }
    }
    
    testQueryMutation.mutate({ query: testQuery, context });
  };

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-formul8-text-primary mb-4">Agent Not Found</h1>
          <Button onClick={() => setLocation("/agents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/agents")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
        
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 ${agent.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
            {agent.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-formul8-text-primary">{agent.name}</h1>
            <p className="text-formul8-text-secondary">{agent.description}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            {agent.file}
          </Badge>
          {agentStatus && (
            <Badge variant={agentStatus.status === 'active' ? 'default' : 'secondary'}>
              {agentStatus.status || 'inactive'}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${agentId === 'marketing' ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          {agentId === 'marketing' && <TabsTrigger value="workflow">N8N Workflow</TabsTrigger>}
          <TabsTrigger value="code">Source Code</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {agent.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-formul8-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{capability}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Sample Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.sampleQueries.map((query, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-formul8-primary hover:bg-formul8-primary/5 transition-colors"
                      onClick={() => handleSampleQuery(query)}
                    >
                      <span className="text-sm">{query}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {agentStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="font-medium">{agentStatus.status || 'inactive'}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Confidence</Label>
                    <div className="font-medium">{agentStatus.confidence || 0}%</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Queries</Label>
                    <div className="font-medium">{agentStatus.totalQueries || 0}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Response Time</Label>
                    <div className="font-medium">{agentStatus.averageResponseTime || 0}ms</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test {agent.name}
              </CardTitle>
              <CardDescription>
                Test this agent individually with custom queries and context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Test Query</Label>
                  <Textarea
                    placeholder="Enter your query for this agent..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Context (JSON)</Label>
                  <Textarea
                    placeholder={`{\n${agent.contextFields.map(f => `  "${f.name}": "${f.placeholder}"`).join(',\n')}\n}`}
                    value={contextData}
                    onChange={(e) => setContextData(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Optional context fields: {agent.contextFields.map(f => f.name).join(', ')}
                  </div>
                </div>

                <Button
                  onClick={handleTest}
                  disabled={!testQuery.trim() || testQueryMutation.isPending}
                  className="w-full"
                >
                  {testQueryMutation.isPending ? "Processing..." : `Test ${agent.name}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Source Code Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Agent Source Code
              </CardTitle>
              <CardDescription>
                View and understand the {agent.name} implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">File Location</span>
                    <Badge variant="outline">{agent.file}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This agent extends the BaseAgent class and implements cannabis industry-specific logic for {agent.name.toLowerCase()}.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Key Components</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Agent Architecture</Label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Extends BaseAgent class</li>
                        <li>• Cannabis-specific system prompt</li>
                        <li>• Structured JSON responses</li>
                        <li>• Confidence scoring system</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Response Format</Label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Detailed response content</li>
                        <li>• Confidence percentage</li>
                        <li>• Source citations</li>
                        <li>• Human verification flags</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Development Notes</h5>
                  <p className="text-sm text-blue-800">
                    Each agent is designed as an independent module that can be tested, modified, and deployed separately. 
                    The agent uses OpenAI GPT-4o with cannabis industry-specific prompting for accurate, compliant responses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-formul8-primary">{agentStatus.confidence || 0}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-formul8-primary">{agentStatus.totalQueries || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Queries</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-formul8-primary">{agentStatus.averageResponseTime || 0}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-formul8-primary">{agentStatus.successRate || 0}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No metrics available for this agent</p>
                  <p className="text-sm">Run some test queries to generate performance data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Test Results
              </CardTitle>
              <CardDescription>
                Recent test queries and responses from this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {testResults.length > 0 ? (
                  <div className="space-y-4">
                    {testResults.map((result, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">
                            {result.timestamp.toLocaleTimeString()}
                          </Badge>
                          <Badge variant={result.result.confidence > 80 ? 'default' : 'secondary'}>
                            {result.result.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Query</Label>
                          <p className="text-sm text-muted-foreground mt-1">{result.query}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-sm font-medium">Response</Label>
                          <p className="text-sm mt-1">{result.result.response}</p>
                        </div>
                        
                        {result.result.sources && result.result.sources.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Sources</Label>
                            <ul className="text-sm text-muted-foreground mt-1">
                              {result.result.sources.map((source: string, sidx: number) => (
                                <li key={sidx}>• {source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No test results yet</p>
                    <p className="text-sm">Run some test queries to see results here</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Agent N8N Workflow Tab */}
        {agentId === 'marketing' && agent.n8nWorkflow && (
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {agent.n8nWorkflow.name}
                </CardTitle>
                <CardDescription>
                  {agent.n8nWorkflow.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Workflow Steps */}
                  <div className="bg-formul8-primary/5 border border-formul8-primary rounded-lg p-6">
                    <h4 className="font-semibold text-formul8-primary mb-4">Workflow Steps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      {agent.n8nWorkflow.steps.map((step, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border text-center">
                          <div className="text-2xl mb-2">{step.icon}</div>
                          <h5 className="font-medium text-formul8-text-primary mb-1 text-sm">{step.name}</h5>
                          <p className="text-xs text-formul8-text-secondary">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-formul8-primary">
                      <CardHeader>
                        <CardTitle className="text-formul8-primary text-lg">N8N Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-formul8-surface p-3 rounded border">
                          <h5 className="font-medium text-formul8-text-primary mb-2">Webhook Trigger</h5>
                          <pre className="text-xs text-formul8-text-secondary">
{`{
  "path": "${agent.n8nWorkflow.configuration.webhook.path}",
  "method": "${agent.n8nWorkflow.configuration.webhook.method}",
  "authentication": "${agent.n8nWorkflow.configuration.webhook.authentication}"
}`}
                          </pre>
                        </div>
                        
                        <div className="bg-formul8-surface p-3 rounded border">
                          <h5 className="font-medium text-formul8-text-primary mb-2">Campaign Setup</h5>
                          <pre className="text-xs text-formul8-text-secondary">
{`{
  "platform": "${agent.n8nWorkflow.configuration.campaign.platform}",
  "budget": ${agent.n8nWorkflow.configuration.campaign.budget},
  "duration": "${agent.n8nWorkflow.configuration.campaign.duration}"
}`}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-formul8-secondary">
                      <CardHeader>
                        <CardTitle className="text-formul8-secondary text-lg">Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Setup Time</span>
                            <span className="text-sm font-medium">{agent.n8nWorkflow.configuration.analysis.setupTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Test Duration</span>
                            <span className="text-sm font-medium">{agent.n8nWorkflow.configuration.analysis.testDuration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Market Size Accuracy</span>
                            <span className="text-sm font-medium text-formul8-success">{agent.n8nWorkflow.configuration.analysis.marketSizeAccuracy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">CPC Prediction</span>
                            <span className="text-sm font-medium text-formul8-success">{agent.n8nWorkflow.configuration.analysis.cpcPrediction}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Benefits */}
                  <div className="bg-formul8-success/10 border border-formul8-success rounded-lg p-4">
                    <h4 className="font-semibold text-formul8-success mb-3">Workflow Benefits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agent.n8nWorkflow.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-formul8-success rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-formul8-text-secondary">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example Results */}
                  <div className="bg-formul8-info/10 border border-formul8-info rounded-lg p-4">
                    <h4 className="font-semibold text-formul8-info mb-3">Example Micro Campaign Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">{agent.n8nWorkflow.exampleResults.avgCPC}</div>
                        <p className="text-sm text-formul8-text-secondary">Avg CPC</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">{agent.n8nWorkflow.exampleResults.marketSize}</div>
                        <p className="text-sm text-formul8-text-secondary">Market Size</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">{agent.n8nWorkflow.exampleResults.ctr}</div>
                        <p className="text-sm text-formul8-text-secondary">CTR</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">{agent.n8nWorkflow.exampleResults.estimatedMonthlyBudget}</div>
                        <p className="text-sm text-formul8-text-secondary">Est. Monthly Budget</p>
                      </div>
                    </div>
                  </div>

                  {/* Platform Strategies */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-formul8-warning">Platform-Specific Strategies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h5 className="font-medium text-formul8-primary">Restricted Platforms</h5>
                          <div className="space-y-2">
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <h6 className="font-medium text-red-800">Facebook/Instagram</h6>
                              <p className="text-xs text-red-700">Focus on wellness, lifestyle, education. Avoid direct cannabis mentions.</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded p-3">
                              <h6 className="font-medium text-orange-800">Google Ads</h6>
                              <p className="text-xs text-orange-700">CBD wellness only. Use hemp, wellness, and natural health angles.</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h5 className="font-medium text-formul8-primary">Allowed Platforms</h5>
                          <div className="space-y-2">
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <h6 className="font-medium text-green-800">Weedmaps</h6>
                              <p className="text-xs text-green-700">Direct cannabis advertising allowed. Full product showcasing.</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <h6 className="font-medium text-blue-800">Leafly</h6>
                              <p className="text-xs text-blue-700">Cannabis-specific platform. Education and product focus.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Creative Workarounds */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-formul8-tertiary">Creative Workarounds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-formul8-surface p-3 rounded border">
                            <h6 className="font-medium text-formul8-primary mb-2">Wellness Angle</h6>
                            <ul className="text-xs text-formul8-text-secondary space-y-1">
                              <li>• "Natural wellness solutions"</li>
                              <li>• "Plant-based therapy"</li>
                              <li>• "Holistic health approach"</li>
                              <li>• "Botanical supplements"</li>
                            </ul>
                          </div>
                          <div className="bg-formul8-surface p-3 rounded border">
                            <h6 className="font-medium text-formul8-primary mb-2">Lifestyle Focus</h6>
                            <ul className="text-xs text-formul8-text-secondary space-y-1">
                              <li>• "Elevated experiences"</li>
                              <li>• "Mindful living"</li>
                              <li>• "Natural relaxation"</li>
                              <li>• "Wellness community"</li>
                            </ul>
                          </div>
                          <div className="bg-formul8-surface p-3 rounded border">
                            <h6 className="font-medium text-formul8-primary mb-2">Educational Content</h6>
                            <ul className="text-xs text-formul8-text-secondary space-y-1">
                              <li>• "Learn about terpenes"</li>
                              <li>• "Plant science education"</li>
                              <li>• "Wellness research"</li>
                              <li>• "Natural health studies"</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Implementation Guide */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-formul8-primary">Implementation Guide</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-formul8-primary text-white">1</Badge>
                          <div>
                            <h5 className="font-medium">Set up N8N Webhook</h5>
                            <p className="text-sm text-formul8-text-secondary">Configure webhook trigger with authentication</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-formul8-secondary text-white">2</Badge>
                          <div>
                            <h5 className="font-medium">Connect Platform APIs</h5>
                            <p className="text-sm text-formul8-text-secondary">Set up API credentials for Weedmaps, Leafly, and compliant platforms</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-formul8-tertiary text-white">3</Badge>
                          <div>
                            <h5 className="font-medium">Configure Marketing Agent Integration</h5>
                            <p className="text-sm text-formul8-text-secondary">Connect workflow to platform-specific compliance checking</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-formul8-success text-white">4</Badge>
                          <div>
                            <h5 className="font-medium">Test & Deploy</h5>
                            <p className="text-sm text-formul8-text-secondary">Run micro campaigns across compliant platforms and validate strategies</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}