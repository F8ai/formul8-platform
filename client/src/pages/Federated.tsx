import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Building2, 
  Network, 
  Shield, 
  ArrowLeftRight, 
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Zap,
  BarChart3,
  Settings,
  Download,
  ExternalLink
} from "lucide-react";

export default function Federated() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const federationBenefits = [
    {
      icon: Shield,
      title: "Data Sovereignty",
      description: "Keep sensitive data on your premises while accessing cloud intelligence"
    },
    {
      icon: Zap,
      title: "Hybrid Performance",
      description: "Fast local responses combined with comprehensive cloud analysis"
    },
    {
      icon: Lock,
      title: "Enhanced Security",
      description: "mTLS encryption with certificate-based authentication"
    },
    {
      icon: Network,
      title: "Seamless Integration",
      description: "Local and cloud agents work together transparently"
    }
  ];

  const deploymentOptions = [
    {
      name: "Compliance-First",
      subdomain: "compliance.f8.company.com",
      agents: ["Compliance", "Operations"],
      cloudAgents: ["Patent", "Marketing"],
      dataClass: "Highly Regulated",
      price: "$1,200/month",
      description: "Maximum data control for regulated environments"
    },
    {
      name: "Hybrid Intelligence",
      subdomain: "api.f8.company.com",
      agents: ["Compliance", "Formulation", "Operations"],
      cloudAgents: ["Patent", "Marketing", "Science", "Spectra"],
      dataClass: "Mixed Sensitivity",
      price: "$2,400/month",
      description: "Balanced approach with local processing and cloud insights"
    },
    {
      name: "Enterprise Scale",
      subdomain: "*.f8.company.com",
      agents: ["All Local Agents"],
      cloudAgents: ["Global Intelligence", "Analytics"],
      dataClass: "Enterprise Grade",
      price: "$4,800/month",
      description: "Full local deployment with cloud orchestration"
    }
  ];

  const collaborationScenarios = [
    {
      id: "compliance-patent",
      title: "Compliance + Patent Analysis",
      localAgent: "Compliance Agent",
      cloudAgents: ["Patent Agent"],
      query: "Is this CBD formulation compliant in California?",
      flow: [
        "Local compliance agent processes CA regulations",
        "Detects potential IP concerns in formulation",
        "Securely queries cloud patent agent for FTO analysis",
        "Combines compliance status with patent risk assessment",
        "Returns comprehensive compliance + IP guidance"
      ],
      result: "✅ CA compliant, ⚠️ potential patent conflict with US Patent 123456"
    },
    {
      id: "formulation-market",
      title: "Formulation + Market Intelligence",
      localAgent: "Formulation Agent",
      cloudAgents: ["Marketing Agent", "Science Agent"],
      query: "Optimize this tincture formula for market appeal",
      flow: [
        "Local formulation agent analyzes molecular structure",
        "Queries cloud marketing agent for consumer preferences",
        "Requests cloud science agent for efficacy data",
        "Integrates molecular optimization with market insights",
        "Returns enhanced formula with positioning strategy"
      ],
      result: "Enhanced formulation + market strategy + efficacy validation"
    },
    {
      id: "operations-benchmarking",
      title: "Operations + Industry Benchmarking",
      localAgent: "Operations Agent",
      cloudAgents: ["Global Operations", "Sourcing Agent"],
      query: "How can we improve our extraction efficiency?",
      flow: [
        "Local operations agent analyzes facility performance",
        "Queries cloud for industry benchmarks and best practices",
        "Requests equipment recommendations from sourcing agent",
        "Creates improvement plan with ROI projections",
        "Provides specific recommendations with implementation timeline"
      ],
      result: "Operational improvements with 15-25% efficiency gains projected"
    }
  ];

  const networkTopology = {
    cloudPlatform: {
      name: "formul8.ai",
      agents: ["Marketing", "Patent", "Science", "Spectra", "Customer Success"],
      capabilities: ["Global Knowledge", "Cross-Agent Coordination", "Analytics"]
    },
    localDeployment: {
      name: "f8.company.com",
      agents: ["Compliance", "Formulation", "Operations", "Sourcing"],
      capabilities: ["Local Data", "Fast Response", "Air-gap Capable"]
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Federated Agent Network</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Deploy local agents at <code className="bg-muted px-2 py-1 rounded">f8.company.com</code> that seamlessly 
          communicate with cloud agents on <code className="bg-muted px-2 py-1 rounded">formul8.ai</code>
        </p>
        
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {federationBenefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <benefit.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="scenarios">Use Cases</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Topology
              </CardTitle>
              <CardDescription>
                Distributed intelligence network with local data sovereignty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Cloud Platform */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Cloud className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold">{networkTopology.cloudPlatform.name}</h3>
                      <p className="text-sm text-muted-foreground">Global Intelligence Platform</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Cloud Agents:</h4>
                    <div className="flex flex-wrap gap-1">
                      {networkTopology.cloudPlatform.agents.map((agent, index) => (
                        <Badge key={index} variant="secondary">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Capabilities:</h4>
                    <ul className="space-y-1">
                      {networkTopology.cloudPlatform.capabilities.map((capability, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Local Deployment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold">{networkTopology.localDeployment.name}</h3>
                      <p className="text-sm text-muted-foreground">Local Agent Infrastructure</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Local Agents:</h4>
                    <div className="flex flex-wrap gap-1">
                      {networkTopology.localDeployment.agents.map((agent, index) => (
                        <Badge key={index} variant="outline">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Capabilities:</h4>
                    <ul className="space-y-1">
                      {networkTopology.localDeployment.capabilities.map((capability, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Communication Flow */}
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Secure Agent-to-Agent Communication
                </h4>
                <div className="text-sm text-muted-foreground">
                  <code>f8.company.com/compliance</code> → Local Processing → 
                  <code>formul8.ai/patent</code> → Cloud Intelligence → 
                  Combined Response
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Collaboration Scenarios</CardTitle>
              <CardDescription>
                Real-world examples of local and cloud agents working together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {collaborationScenarios.map((scenario) => (
                  <Card 
                    key={scenario.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedScenario === scenario.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedScenario(
                      selectedScenario === scenario.id ? null : scenario.id
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scenario.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{scenario.localAgent}</Badge>
                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                          {scenario.cloudAgents.map((agent, index) => (
                            <Badge key={index} variant="secondary">{agent}</Badge>
                          ))}
                        </div>
                      </div>
                      <CardDescription>
                        <strong>Query:</strong> "{scenario.query}"
                      </CardDescription>
                    </CardHeader>
                    
                    {selectedScenario === scenario.id && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Processing Flow:</h4>
                            <ol className="space-y-1">
                              {scenario.flow.map((step, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                                    {index + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                          
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">Result:</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">{scenario.result}</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {deploymentOptions.map((option, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {option.name}
                    <Badge variant="outline">{option.price}</Badge>
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Subdomain:</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{option.subdomain}</code>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Local Agents:</div>
                    <div className="flex flex-wrap gap-1">
                      {option.agents.map((agent, agentIndex) => (
                        <Badge key={agentIndex} variant="outline" className="text-xs">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Cloud Integration:</div>
                    <div className="flex flex-wrap gap-1">
                      {option.cloudAgents.map((agent, agentIndex) => (
                        <Badge key={agentIndex} variant="secondary" className="text-xs">{agent}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Data Classification:</div>
                    <div className="text-sm text-muted-foreground">{option.dataClass}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Quick Deployment
              </CardTitle>
              <CardDescription>
                Get started with federated agents in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">1. Quick Start (Docker)</h4>
                <pre className="text-sm bg-background p-2 rounded border">
{`# Download Formul8 Federated Agent
curl -sSL https://get.formul8.ai/federated | bash

# Configure environment
./formul8-federated configure --domain=f8.company.com

# Deploy selected agents
./formul8-federated deploy --agents compliance,formulation

# Start services
./formul8-federated start`}
                </pre>
              </div>
              
              <div className="flex gap-4">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Deployment Kit
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Authentication:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      mTLS certificate-based authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      API key rotation (monthly)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      JWT token validation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Role-based access control
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Data Protection:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      End-to-end TLS 1.3 encryption
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Local data encryption at rest
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Secure key management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Comprehensive audit logging
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">federation.yaml</h4>
                  <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
{`federation:
  enabled: true
  cloud_endpoint: "https://api.formul8.ai"
  local_domain: "f8.company.com"
  certificate_path: "/certs/f8-company.pem"

agents:
  local:
    - name: "compliance"
      port: 3001
      data_classification: "sensitive"
    - name: "formulation"  
      port: 3002
      cloud_fallback: true

security:
  encryption_at_rest: true
  audit_logging: true
  data_retention: "30d"`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Federation Licensing</CardTitle>
                <CardDescription>Per-agent monthly pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Compliance Agent</div>
                      <div className="text-sm text-muted-foreground">Regulatory intelligence</div>
                    </div>
                    <Badge variant="outline">$500/month</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Formulation Agent</div>
                      <div className="text-sm text-muted-foreground">Molecular analysis</div>
                    </div>
                    <Badge variant="outline">$400/month</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Operations Agent</div>
                      <div className="text-sm text-muted-foreground">Process optimization</div>
                    </div>
                    <Badge variant="outline">$300/month</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Additional Agents</div>
                      <div className="text-sm text-muted-foreground">Any additional agent</div>
                    </div>
                    <Badge variant="outline">$200/month</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bundle Options</CardTitle>
                <CardDescription>Save with multi-agent bundles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">3-Agent Bundle</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">$1,200</span>
                        <Badge>$1,000/month</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Save 17%</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">5-Agent Bundle</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">$2,000</span>
                        <Badge>$1,500/month</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Save 25%</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Enterprise Bundle</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">$3,000</span>
                        <Badge>$2,000/month</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Save 33% - All agents</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Additional Services:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Setup & Installation</span>
                      <span>$2,500 one-time</span>
                    </li>
                    <li className="flex justify-between">
                      <span>24/7 Monitoring</span>
                      <span>$500/month</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Custom Integration</span>
                      <span>$10K-25K</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cloud Service Consumption
              </CardTitle>
              <CardDescription>Pay-per-use pricing for cloud agent queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">$0.01</div>
                  <div className="text-sm text-muted-foreground">per query</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">$0.10</div>
                  <div className="text-sm text-muted-foreground">per GB transfer</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">$0.05</div>
                  <div className="text-sm text-muted-foreground">premium queries</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">$100</div>
                  <div className="text-sm text-muted-foreground">real-time sync/month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Ready to Deploy Federated Agents?</h3>
            <p className="text-muted-foreground mb-4">
              Contact our enterprise team for a custom federated deployment consultation
            </p>
            <Button size="lg">
              Contact Enterprise Sales
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}