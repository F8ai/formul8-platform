import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Palette, 
  Brain, 
  Cpu, 
  Database, 
  GitBranch, 
  Layers, 
  Target,
  Clock,
  CheckCircle,
  Settings,
  Code
} from "lucide-react";
import { Link } from "wouter";

interface AgentInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  repositoryUrl: string;
  hasInterface: boolean;
  category: string;
  capabilities: string[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface AgentDesignInfo {
  architecture: {
    type: string;
    model: string;
    specializations: string[];
    integrations: string[];
  };
  interface: {
    inputTypes: string[];
    outputFormats: string[];
    responseTime: string;
    accuracy: string;
  };
  workflow: {
    steps: string[];
    verification: string[];
    fallbacks: string[];
  };
  technical: {
    dependencies: string[];
    apiEndpoints: string[];
    dataFlow: string[];
  };
}

export default function AgentDesign() {
  const [, params] = useRoute("/agent/:agentId/design");
  const agentId = params?.agentId;

  const { data: agentInfo, isLoading: agentLoading } = useQuery<AgentInfo>({
    queryKey: [`/api/agents/${agentId}/info`],
    enabled: !!agentId,
  });

  // Generate design information based on agent type and capabilities
  const getAgentDesignInfo = (agent: AgentInfo): AgentDesignInfo => {
    const baseDesign: AgentDesignInfo = {
      architecture: {
        type: "Specialized AI Agent",
        model: "OpenAI GPT-4o",
        specializations: agent.capabilities,
        integrations: ["Formul8 Platform", "LangGraph Orchestrator"]
      },
      interface: {
        inputTypes: ["Natural Language", "Structured Data", "Context"],
        outputFormats: ["Detailed Response", "Confidence Score", "Sources", "Metadata"],
        responseTime: "< 30 seconds",
        accuracy: "95%+ target"
      },
      workflow: {
        steps: [
          "Query Reception & Parsing",
          "Context Analysis",
          "Domain-Specific Processing",
          "Response Generation",
          "Confidence Assessment"
        ],
        verification: ["Cross-Agent Validation", "Source Verification", "Confidence Scoring"],
        fallbacks: ["Human Escalation", "Alternative Sources", "Reduced Confidence Response"]
      },
      technical: {
        dependencies: ["OpenAI API", "Zod Validation", "TypeScript"],
        apiEndpoints: ["/process-query", "/get-status", "/health-check"],
        dataFlow: ["Input → Validation → Processing → Output → Storage"]
      }
    };

    // Customize based on agent type
    switch (agent.id) {
      case 'science':
        return {
          ...baseDesign,
          architecture: {
            ...baseDesign.architecture,
            integrations: [...baseDesign.architecture.integrations, "PubMed API", "Scientific Databases"]
          },
          workflow: {
            ...baseDesign.workflow,
            steps: [
              "Literature Search Query",
              "PubMed API Integration",
              "Evidence Quality Assessment",
              "Scientific Validation",
              "Citation Generation"
            ]
          }
        };
      
      case 'formulation':
        return {
          ...baseDesign,
          architecture: {
            ...baseDesign.architecture,
            integrations: [...baseDesign.architecture.integrations, "RDKit", "Streamlit Dashboard", "Chemical Databases"]
          },
          workflow: {
            ...baseDesign.workflow,
            steps: [
              "Molecular Structure Analysis",
              "RDKit Integration",
              "Chemical Property Calculation",
              "Formulation Optimization",
              "Safety Assessment"
            ]
          }
        };
      
      case 'marketing':
        return {
          ...baseDesign,
          architecture: {
            ...baseDesign.architecture,
            integrations: [...baseDesign.architecture.integrations, "N8N Workflows", "Platform APIs", "Compliance Engines"]
          },
          workflow: {
            ...baseDesign.workflow,
            steps: [
              "Platform Strategy Analysis",
              "Compliance Rule Checking",
              "Creative Workaround Generation",
              "Campaign Optimization",
              "Performance Prediction"
            ]
          }
        };
      
      default:
        return baseDesign;
    }
  };

  if (agentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading agent design...</span>
        </div>
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-muted-foreground">The requested agent design could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const designInfo = getAgentDesignInfo(agentInfo);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-purple-500 text-white text-lg">
              {agentInfo.displayName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{agentInfo.displayName} Design</h1>
            <p className="text-muted-foreground">{agentInfo.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{agentInfo.category}</Badge>
              <Badge variant={agentInfo.status === 'active' ? 'default' : 'secondary'}>
                {agentInfo.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/agent/${agentInfo.id}`}>
            <Button variant="outline">Chat Interface</Button>
          </Link>
          <Link href={`/agent/${agentInfo.id}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Agent Purpose
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{agentInfo.description}</p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Primary Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {agentInfo.capabilities.map((capability) => (
                        <Badge key={capability} variant="secondary">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Specialization</h4>
                    <p className="text-sm text-muted-foreground">{agentInfo.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Performance Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <Badge variant="outline">{designInfo.interface.responseTime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Accuracy Target</span>
                    <Badge variant="outline">{designInfo.interface.accuracy}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm">Operational</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(agentInfo.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Development Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Repository</h4>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={agentInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      View on GitHub
                    </a>
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Independent Development</h4>
                  <p className="text-sm text-muted-foreground">
                    Clone and develop independently with Git submodules
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Seamless integration with Formul8 orchestrator platform
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="h-5 w-5 mr-2" />
                  Core Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Agent Type</h4>
                    <p className="text-sm text-muted-foreground">{designInfo.architecture.type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">AI Model</h4>
                    <Badge variant="outline">{designInfo.architecture.model}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {designInfo.architecture.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2" />
                  System Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {designInfo.architecture.integrations.map((integration) => (
                    <div key={integration} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{integration}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {designInfo.workflow.steps.map((step, index) => (
                    <div key={step} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {designInfo.workflow.verification.map((verification) => (
                    <div key={verification} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{verification}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fallback Mechanisms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {designInfo.workflow.fallbacks.map((fallback) => (
                    <div key={fallback} className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{fallback}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Supported Input Types</h4>
                    <div className="space-y-2">
                      {designInfo.interface.inputTypes.map((inputType) => (
                        <div key={inputType} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{inputType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Response Formats</h4>
                    <div className="space-y-2">
                      {designInfo.interface.outputFormats.map((outputFormat) => (
                        <div key={outputFormat} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{outputFormat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {designInfo.technical.dependencies.map((dependency) => (
                    <Badge key={dependency} variant="outline" className="mr-1 mb-1">
                      {dependency}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {designInfo.technical.apiEndpoints.map((endpoint) => (
                    <code key={endpoint} className="block text-xs bg-muted p-2 rounded">
                      {endpoint}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {designInfo.technical.dataFlow.map((flow) => (
                    <div key={flow} className="text-sm text-muted-foreground">
                      {flow}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}