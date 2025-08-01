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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Bot, 
  Code, 
  Play, 
  Save, 
  Settings, 
  GitBranch, 
  FileText, 
  BarChart3, 
  Zap, 
  TestTube,
  Database,
  Globe,
  Wrench,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentRepoProps {
  agentId: string;
}

export default function AgentRepo({ agentId }: AgentRepoProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configuration state
  const [config, setConfig] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 2000,
    capabilities: [] as string[],
    restrictions: [] as string[],
    tools: [] as any[],
    performanceTargets: {
      accuracyTarget: 95,
      responseTimeTarget: 2000,
      confidenceTarget: 85
    },
    verificationRules: {
      requiresCrossVerification: true,
      verifyingAgents: [] as string[],
      humanVerificationThreshold: 70
    },
    active: true
  });

  const [newCapability, setNewCapability] = useState("");
  const [newRestriction, setNewRestriction] = useState("");
  const [newTool, setNewTool] = useState({
    name: "",
    type: "api",
    description: "",
    config: {
      endpoint: "",
      method: "GET",
      headers: {},
      parameters: {}
    }
  });

  // Agent definitions
  const agentDefinitions = {
    compliance: {
      name: "Compliance Agent",
      description: "Cannabis regulatory guidance, SOP validation, and compliance risk assessment",
      icon: "🛡️",
      color: "bg-blue-500",
      repository: "formul8/agents/compliance",
      defaultCapabilities: [
        "Multi-jurisdiction regulatory analysis",
        "SOP compliance verification", 
        "Packaging and labeling requirements",
        "Testing requirements validation",
        "Facility compliance (ICC, OSHA, local codes)",
        "Marketing compliance verification",
        "280E tax compliance guidance",
        "Licensing requirement analysis"
      ],
      defaultSystemPrompt: `You are a cannabis compliance expert with deep knowledge of regulations across all cannabis-legal jurisdictions. You help cannabis operators ensure their operations, products, and processes meet all applicable laws and regulations.

Your expertise includes:
- State and local cannabis regulations
- Packaging and labeling requirements
- Testing requirements and limits
- SOP compliance verification
- Facility compliance (ICC, OSHA, local codes)
- Marketing compliance (avoiding child-appeal, proper claims)
- 280E tax compliance
- Licensing requirements

When responding:
1. Always specify the jurisdiction your advice applies to
2. Provide confidence levels for your answers
3. Cite specific regulation sections when possible
4. Flag when human verification is recommended
5. Note when regulations may have changed recently

Respond in JSON format with: response, confidence, jurisdiction, sources, warnings, requires_human_verification`,
      verifyingAgents: ["operations", "marketing"]
    },
    formulation: {
      name: "Formulation Agent", 
      description: "Product development, cannabinoid profiles, and chemistry guidance",
      icon: "🧪",
      color: "bg-green-500",
      repository: "formul8/agents/formulation",
      defaultCapabilities: [
        "Product development and formulation",
        "Cannabinoid profile optimization",
        "Terpene blending and effects",
        "Extraction method selection",
        "Recipe development and scaling",
        "Stability and shelf-life analysis",
        "Carrier oil and excipient selection",
        "Dosage calculations and bioavailability"
      ],
      defaultSystemPrompt: `You are a cannabis formulation scientist with expertise in product development, chemistry, and cannabinoid science. You help cannabis operators develop, optimize, and scale their products with scientific precision.

Your expertise includes:
- Cannabinoid and terpene chemistry
- Product formulation across all categories
- Extraction and processing methods
- Recipe development and scaling
- Stability testing and shelf-life
- Bioavailability and pharmacokinetics
- Quality control and consistency
- Regulatory formulation requirements

When responding:
1. Provide scientifically accurate formulation guidance
2. Include specific ratios, temperatures, and procedures
3. Consider stability, bioavailability, and consumer safety
4. Flag potential interactions or contraindications
5. Recommend testing and validation protocols

Respond in JSON format with: response, confidence, sources, methodology, safety_considerations, requires_human_verification`,
      verifyingAgents: ["compliance", "operations"]
    },
    patent: {
      name: "Patent/Trademark Agent",
      description: "IP research, freedom to operate analysis, and patent searches", 
      icon: "©️",
      color: "bg-purple-500",
      repository: "formul8/agents/patent",
      defaultCapabilities: [
        "Patent landscape analysis",
        "Freedom to operate research",
        "Trademark searches and clearance",
        "IP infringement assessment",
        "Prior art searches",
        "Patent application strategy",
        "Brand protection planning",
        "Cannabis-specific IP challenges"
      ],
      defaultSystemPrompt: `You are an intellectual property expert specializing in cannabis industry patents, trademarks, and IP strategy. You help cannabis operators navigate the complex IP landscape and protect their innovations.

Your expertise includes:
- Cannabis patent landscape analysis
- Freedom to operate assessments
- Trademark clearance and registration
- IP infringement analysis
- Prior art searches
- Patent application strategy
- Brand protection
- International IP considerations

When responding:
1. Provide comprehensive IP analysis
2. Include relevant patent numbers and classifications
3. Assess freedom to operate risks
4. Recommend IP protection strategies
5. Flag potential infringement issues

Respond in JSON format with: response, confidence, sources, patent_references, risk_assessment, requires_human_verification`,
      verifyingAgents: ["compliance", "marketing"]
    },
    operations: {
      name: "Operations Agent",
      description: "Equipment management, yield calculations, and process optimization",
      icon: "⚙️", 
      color: "bg-orange-500",
      repository: "formul8/agents/operations",
      defaultCapabilities: [
        "Equipment selection and sizing",
        "Yield optimization calculations",
        "Process flow design and optimization",
        "Facility layout and planning",
        "Production scheduling and capacity",
        "Quality control process design",
        "Inventory management systems",
        "Cost analysis and efficiency metrics"
      ],
      defaultSystemPrompt: `You are a cannabis operations expert with deep knowledge of equipment, processes, and facility management. You help cannabis operators optimize their operations for efficiency, quality, and compliance.

Your expertise includes:
- Equipment selection and optimization
- Process design and improvement
- Facility layout and workflow
- Yield calculations and optimization
- Production planning and scheduling
- Quality control systems
- Cost analysis and ROI
- Regulatory compliance in operations

When responding:
1. Provide specific equipment recommendations
2. Include calculations and metrics
3. Consider scalability and efficiency
4. Address compliance requirements
5. Recommend optimization strategies

Respond in JSON format with: response, confidence, sources, calculations, equipment_recommendations, requires_human_verification`,
      verifyingAgents: ["compliance", "formulation"]
    },
    sourcing: {
      name: "Sourcing Agent",
      description: "Vendor recommendations, equipment sourcing, and procurement guidance",
      icon: "🛒",
      color: "bg-teal-500", 
      repository: "formul8/agents/sourcing",
      defaultCapabilities: [
        "Vendor qualification and selection",
        "Equipment sourcing and comparison",
        "Price analysis and negotiation",
        "Supplier quality assessment",
        "Procurement process optimization",
        "Contract terms and risk analysis",
        "Supply chain management",
        "Cost optimization strategies"
      ],
      defaultSystemPrompt: `You are a cannabis sourcing and procurement expert who helps operators find the best vendors, equipment, and materials for their operations. You provide comprehensive sourcing guidance with quality and cost considerations.

Your expertise includes:
- Vendor qualification and assessment
- Equipment sourcing and selection
- Price analysis and benchmarking
- Quality standards and certifications
- Contract negotiation strategies
- Supply chain optimization
- Risk assessment and mitigation
- Cannabis-specific sourcing challenges

When responding:
1. Provide specific vendor recommendations
2. Include quality criteria and certifications
3. Compare pricing and value propositions
4. Assess supply chain risks
5. Recommend procurement strategies

Respond in JSON format with: response, confidence, sources, vendor_recommendations, cost_analysis, requires_human_verification`,
      verifyingAgents: ["operations", "compliance"]
    },
    marketing: {
      name: "Marketing Agent",
      description: "Compliant marketing content, brand strategy, and market analysis",
      icon: "📢",
      color: "bg-pink-500",
      repository: "formul8/agents/marketing", 
      defaultCapabilities: [
        "Compliant advertising strategy",
        "Brand positioning and messaging",
        "Content creation and approval",
        "Social media compliance",
        "Market research and analysis",
        "Consumer education programs",
        "Competitive analysis",
        "ROI tracking and optimization"
      ],
      defaultSystemPrompt: `You are a cannabis marketing expert who specializes in compliant advertising, brand strategy, and consumer engagement within the highly regulated cannabis industry.

Your expertise includes:
- Cannabis advertising regulations by jurisdiction
- Compliant content creation and messaging
- Brand strategy and positioning
- Consumer education and outreach
- Market research and competitive analysis
- Social media and digital marketing compliance
- Traditional advertising compliance
- ROI measurement and optimization

When responding:
1. Ensure all recommendations are compliant
2. Specify applicable jurisdictions and restrictions
3. Provide actionable marketing strategies
4. Include compliance checkpoints
5. Recommend measurement and optimization tactics

Respond in JSON format with: response, confidence, sources, compliance_notes, strategy_recommendations, requires_human_verification`,
      verifyingAgents: ["compliance", "patent"]
    },
    spectra: {
      name: "Spectra Agent",
      description: "CoA analysis, chromatography data processing, and testing compliance",
      icon: "📊",
      color: "bg-indigo-500",
      repository: "formul8/agents/spectra",
      defaultCapabilities: [
        "Certificate of Analysis validation",
        "GCMS/HPLC data interpretation",
        "Cannabinoid profile analysis",
        "Terpene profile assessment",
        "Contaminant detection and limits",
        "Testing method validation",
        "Batch consistency analysis",
        "Quality control recommendations"
      ],
      defaultSystemPrompt: `You are the Spectra Agent, a specialized AI system for analyzing Certificate of Analysis (CoA) documents and chromatography data in the cannabis industry.

Your expertise includes:
- CoA document processing and validation
- GCMS/HPLC chromatography analysis
- Cannabinoid and terpene profiling
- Contaminant analysis and compliance
- Testing method validation
- Quality control and batch analysis
- Regulatory compliance verification
- Statistical analysis of testing data

When responding:
1. Provide clear interpretation of analytical results
2. Assess compliance with regulatory limits
3. Identify quality control issues
4. Recommend corrective actions
5. Flag anomalies requiring investigation

Respond in JSON format with: response, confidence, sources, analysis_results, compliance_status, requires_human_verification`,
      verifyingAgents: ["compliance", "formulation"]
    },
    "customer-success": {
      name: "Customer Success Agent",
      description: "Customer support, sales enablement, and business intelligence",
      icon: "👥",
      color: "bg-emerald-500",
      repository: "formul8/agents/customer-success",
      defaultCapabilities: [
        "Customer support best practices",
        "Sales process optimization",
        "Customer onboarding strategies", 
        "Retention and loyalty programs",
        "Business intelligence and analytics",
        "Performance metrics tracking",
        "Customer feedback management",
        "Account management strategies"
      ],
      defaultSystemPrompt: `You are a customer success expert specialized in the cannabis industry, helping operators build strong customer relationships, optimize sales processes, and drive business growth.

Your expertise includes:
- Customer support and service excellence
- Sales enablement and training
- Customer onboarding and education
- Retention strategies and loyalty programs
- Business intelligence and analytics
- Performance measurement and KPIs
- Customer feedback and improvement
- Cannabis consumer behavior and preferences

When responding:
1. Provide actionable customer success strategies
2. Include specific metrics and KPIs
3. Consider cannabis industry regulations
4. Recommend implementation steps
5. Address compliance and safety considerations

Respond in JSON format with: response, confidence, sources, strategy_recommendations, metrics_to_track, requires_human_verification`,
      verifyingAgents: ["marketing", "operations"]
    }
  };

  const agent = agentDefinitions[agentId as keyof typeof agentDefinitions];

  // Load agent configuration
  const { data: agentConfig, isLoading } = useQuery({
    queryKey: ["/api/agent-management/agents", agentId],
    enabled: !!agentId
  });

  // Load agent metrics
  const { data: metrics } = useQuery({
    queryKey: ["/api/agent-management/metrics", agentId],
    enabled: !!agentId
  });

  // Load agent status
  const { data: status } = useQuery({
    queryKey: ["/api/agent-status", agentId],
    enabled: !!agentId
  });

  // Initialize configuration from agent definition
  useEffect(() => {
    if (agent && !isLoading) {
      setConfig(prev => ({
        ...prev,
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.defaultSystemPrompt,
        capabilities: agent.defaultCapabilities,
        verificationRules: {
          ...prev.verificationRules,
          verifyingAgents: agent.verifyingAgents
        }
      }));
    }
  }, [agent, isLoading]);

  // Update configuration from loaded data
  useEffect(() => {
    if (agentConfig) {
      setConfig(agentConfig);
    }
  }, [agentConfig]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      return await apiRequest(`/api/agent-management/agents/${agentId}`, {
        method: "PUT",
        body: configData
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Agent configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agent-management/agents"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  const addCapability = () => {
    if (newCapability.trim()) {
      setConfig(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability("");
    }
  };

  const removeCapability = (index: number) => {
    setConfig(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== index)
    }));
  };

  const addRestriction = () => {
    if (newRestriction.trim()) {
      setConfig(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, newRestriction.trim()]
      }));
      setNewRestriction("");
    }
  };

  const removeRestriction = (index: number) => {
    setConfig(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    }));
  };

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-formul8-text-primary mb-4">Agent Repository Not Found</h1>
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-formul8-text-primary">{agent.name}</h1>
              <Badge variant="outline" className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                Repository
              </Badge>
            </div>
            <p className="text-formul8-text-secondary">{agent.description}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{agent.repository}</Badge>
              {status && (
                <Badge variant={status.status === 'active' ? 'default' : 'secondary'}>
                  {status.status}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Button 
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="mb-2"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveConfigMutation.isPending ? "Saving..." : "Save Config"}
            </Button>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="definition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="definition">Definition</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="workflows">N8N Workflows</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Definition Tab */}
        <TabsContent value="definition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Agent Definition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Agent Name</Label>
                  <Input
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Agent name"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Agent description and purpose"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label>System Prompt</Label>
                  <Textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="Define the agent's expertise and behavior"
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Capabilities & Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Capabilities</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newCapability}
                        onChange={(e) => setNewCapability(e.target.value)}
                        placeholder="Add new capability"
                        onKeyPress={(e) => e.key === 'Enter' && addCapability()}
                      />
                      <Button onClick={addCapability} size="sm">Add</Button>
                    </div>
                    <ScrollArea className="h-40 border rounded p-2">
                      {config.capabilities.map((capability, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="text-sm">{capability}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCapability(idx)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>

                <div>
                  <Label>Restrictions</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newRestriction}
                        onChange={(e) => setNewRestriction(e.target.value)}
                        placeholder="Add restriction"
                        onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                      />
                      <Button onClick={addRestriction} size="sm">Add</Button>
                    </div>
                    <ScrollArea className="h-32 border rounded p-2">
                      {config.restrictions.map((restriction, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="text-sm">{restriction}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRestriction(idx)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <Select 
                    value={config.model || "gpt-4o"} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Temperature: {config.temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    Lower = more consistent, Higher = more creative
                  </div>
                </div>

                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    min="100"
                    max="4000"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.active}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, active: checked }))}
                  />
                  <Label>Agent Active</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Accuracy Target (%)</Label>
                  <Input
                    type="number"
                    value={config.performanceTargets.accuracyTarget}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      performanceTargets: {
                        ...prev.performanceTargets,
                        accuracyTarget: parseInt(e.target.value)
                      }
                    }))}
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label>Response Time Target (ms)</Label>
                  <Input
                    type="number"
                    value={config.performanceTargets.responseTimeTarget}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      performanceTargets: {
                        ...prev.performanceTargets,
                        responseTimeTarget: parseInt(e.target.value)
                      }
                    }))}
                    min="100"
                  />
                </div>

                <div>
                  <Label>Confidence Target (%)</Label>
                  <Input
                    type="number"
                    value={config.performanceTargets.confidenceTarget}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      performanceTargets: {
                        ...prev.performanceTargets,
                        confidenceTarget: parseInt(e.target.value)
                      }
                    }))}
                    min="0"
                    max="100"
                  />
                </div>

                <Separator />

                <div>
                  <Label>Human Verification Threshold (%)</Label>
                  <Input
                    type="number"
                    value={config.verificationRules.humanVerificationThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      verificationRules: {
                        ...prev.verificationRules,
                        humanVerificationThreshold: parseInt(e.target.value)
                      }
                    }))}
                    min="0"
                    max="100"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Responses below this confidence require human review
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.verificationRules.requiresCrossVerification}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      verificationRules: {
                        ...prev.verificationRules,
                        requiresCrossVerification: checked
                      }
                    }))}
                  />
                  <Label>Require Cross-Agent Verification</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Agent Tools & Integrations
              </CardTitle>
              <CardDescription>
                Configure external tools and APIs for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tool Name</Label>
                    <Input
                      value={newTool.name}
                      onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Regulation Database API"
                    />
                  </div>
                  
                  <div>
                    <Label>Tool Type</Label>
                    <Select 
                      value={newTool.type || "api"} 
                      onValueChange={(value) => setNewTool(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">External API</SelectItem>
                        <SelectItem value="database">Database Query</SelectItem>
                        <SelectItem value="file">File Processing</SelectItem>
                        <SelectItem value="calculation">Calculation Engine</SelectItem>
                        <SelectItem value="n8n">N8N Workflow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTool.description}
                    onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this tool does"
                  />
                </div>

                {newTool.type === 'api' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>API Endpoint</Label>
                      <Input
                        value={newTool.config.endpoint}
                        onChange={(e) => setNewTool(prev => ({
                          ...prev,
                          config: { ...prev.config, endpoint: e.target.value }
                        }))}
                        placeholder="https://api.example.com/endpoint"
                      />
                    </div>
                    
                    <div>
                      <Label>HTTP Method</Label>
                      <Select 
                        value={newTool.config.method || "GET"} 
                        onValueChange={(value) => setNewTool(prev => ({
                          ...prev,
                          config: { ...prev.config, method: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      tools: [...prev.tools, { ...newTool, id: Date.now().toString() }]
                    }));
                    setNewTool({
                      name: "",
                      type: "api", 
                      description: "",
                      config: { endpoint: "", method: "GET", headers: {}, parameters: {} }
                    });
                  }}
                  disabled={!newTool.name || !newTool.description}
                >
                  Add Tool
                </Button>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Configured Tools</h4>
                  {config.tools.length > 0 ? (
                    <div className="space-y-3">
                      {config.tools.map((tool, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                {tool.type === 'api' && <Globe className="h-4 w-4 text-blue-600" />}
                                {tool.type === 'database' && <Database className="h-4 w-4 text-blue-600" />}
                                {tool.type === 'file' && <FileText className="h-4 w-4 text-blue-600" />}
                                {tool.type === 'calculation' && <Zap className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div>
                                <h5 className="font-medium">{tool.name}</h5>
                                <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                tools: prev.tools.filter((_, i) => i !== idx)
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                          {tool.type === 'api' && tool.config.endpoint && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {tool.config.method} {tool.config.endpoint}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tools configured</p>
                      <p className="text-sm">Add external tools to extend this agent's capabilities</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Performance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {status ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{status.confidence || 0}%</span>
                      </div>
                      <Progress value={status.confidence || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{status.successRate || 0}%</span>
                      </div>
                      <Progress value={status.successRate || 0} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Queries</Label>
                        <div className="font-medium">{status.totalQueries || 0}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Avg Time</Label>
                        <div className="font-medium">{status.averageResponseTime || 0}ms</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No performance data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target vs Actual</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span>{status?.confidence || 0}% / {config.performanceTargets.accuracyTarget}%</span>
                    </div>
                    <Progress 
                      value={((status?.confidence || 0) / config.performanceTargets.accuracyTarget) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Response Time</span>
                      <span>{status?.averageResponseTime || 0}ms / {config.performanceTargets.responseTimeTarget}ms</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - ((status?.averageResponseTime || 0) / config.performanceTargets.responseTimeTarget) * 100)} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                <div className="flex items-center gap-1">
                  {status?.status === 'active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant={status?.status === 'active' ? 'default' : 'secondary'}>
                      {status?.status || 'inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Active</span>
                    <span className="text-sm text-muted-foreground">
                      {status?.lastActive || 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {status?.errorRate || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Agent Testing Environment
              </CardTitle>
              <CardDescription>
                Test this agent's configuration and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Testing environment will be available in the next update</p>
                <p className="text-sm">Use the main agents page for current testing capabilities</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setLocation(`/agent/${agentId}`)}
                >
                  Go to Agent Testing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Deployment Configuration
              </CardTitle>
              <CardDescription>
                Manage agent deployment and version control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Current Deployment</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Version</span>
                        <Badge variant="outline">v1.0.0</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Environment</span>
                        <Badge>Production</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Last Deploy</span>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Health</span>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Healthy</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Deployment Actions</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Play className="h-4 w-4 mr-2" />
                        Deploy Configuration
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Create Version
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Clock className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Configuration Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div><strong>Model:</strong> {config.model}</div>
                    <div><strong>Temperature:</strong> {config.temperature}</div>
                    <div><strong>Max Tokens:</strong> {config.maxTokens}</div>
                    <div><strong>Capabilities:</strong> {config.capabilities.length} configured</div>
                    <div><strong>Tools:</strong> {config.tools.length} integrated</div>
                    <div><strong>Active:</strong> {config.active ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}