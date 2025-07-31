import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain, Database, Cog, Users, BarChart3, Shield, Search, Beaker, Microscope, Scale, Building2, TrendingUp, Palette, FlaskConical } from "lucide-react";
import { Link } from "wouter";

export default function Design() {
  return (
    <div className="min-h-screen bg-formul8-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-formul8-primary via-formul8-secondary to-formul8-tertiary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Formul8 System Design
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
              AWS-powered multi-agent AI platform leveraging SageMaker, Bedrock, and serverless technologies for cannabis industry operations
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full min-w-max grid-cols-5 gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="architecture" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Architecture</TabsTrigger>
              <TabsTrigger value="agents" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Agents</TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Workflows</TabsTrigger>
              <TabsTrigger value="tech-stack" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Tech Stack</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Cannabis Industry AI Platform</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Production-ready multi-agent system with workflow automation for comprehensive cannabis business operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-2">Core Capabilities</h4>
                    <ul className="space-y-1 text-formul8-text-secondary text-sm">
                      <li>• 9 specialized AI agents with RDF knowledge bases</li>
                      <li>• LangChain integration with memory and RAG</li>
                      <li>• Google Workspace integration with professional document styling</li>
                      <li>• Real-time document creation and collaborative editing</li>
                      <li>• Agent-to-agent verification for consensus answers</li>
                      <li>• PubMed & scientific literature integration</li>
                      <li>• GitHub automated testing and issue creation</li>
                      <li>• FAISS vectorstore and MCP tools integration</li>
                      <li>• RDKit molecular analysis capabilities</li>
                      <li>• Real-time performance monitoring & analytics</li>
                      <li>• Cannabis industry regulatory compliance</li>
                      <li>• Domain-wide delegation with service account authentication</li>
                      <li>• Professional document templates and formatting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-2">Google Workspace Integration</h4>
                    <div className="bg-formul8-secondary/10 border border-formul8-secondary rounded-lg p-4">
                      <div className="space-y-2 text-formul8-text-secondary text-sm">
                        <p><strong>Professional Document Management:</strong> Production-ready cannabis workspace</p>
                        <ul className="space-y-1 ml-4">
                          <li>• Service account authentication with domain-wide delegation</li>
                          <li>• Real-time Google Docs, Sheets, and Forms creation</li>
                          <li>• Professional styling with structured formatting</li>
                          <li>• Color-coded sections and branded typography</li>
                          <li>• Automated document organization and sharing</li>
                          <li>• Agent-based document editing and version control</li>
                        </ul>
                        <div className="bg-white/50 p-2 rounded mt-2">
                          <code className="text-xs">F8 Cannabis Workspace → Professional Templates → Agent Collaboration</code>
                        </div>
                        <div className="mt-2 text-xs text-green-600">
                          <strong>✅ Live Implementation:</strong> 5 production documents created with professional styling
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="formul8-card text-center">
                <CardHeader>
                  <CardTitle className="text-formul8-text-primary text-lg">Agent Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-formul8-secondary mb-2">9</div>
                  <p className="text-formul8-text-secondary text-sm">Specialized domain experts with cross-verification</p>
                </CardContent>
              </Card>
              
              <Card className="formul8-card text-center">
                <CardHeader>
                  <CardTitle className="text-formul8-text-primary text-lg">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-formul8-secondary mb-2">&lt;30s</div>
                  <p className="text-formul8-text-secondary text-sm">Average AI processing with workflow automation</p>
                </CardContent>
              </Card>
              
              <Card className="formul8-card text-center">
                <CardHeader>
                  <CardTitle className="text-formul8-text-primary text-lg">Accuracy Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-formul8-secondary mb-2">95%+</div>
                  <p className="text-formul8-text-secondary text-sm">Consensus-based verification system</p>
                </CardContent>
              </Card>
              
              <Card className="formul8-card text-center">
                <CardHeader>
                  <CardTitle className="text-formul8-text-primary text-lg">N8N Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-formul8-secondary mb-2">3+</div>
                  <p className="text-formul8-text-secondary text-sm">Pre-built automation templates</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Compliance Agent */}
              <Card className="formul8-card border-l-4 border-l-formul8-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-formul8-primary" />
                    <CardTitle className="text-base">Compliance Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit bg-green-50 text-green-700">RDF + LangChain</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    LangChain agent with RDF knowledge base and Phi-2 SPARQL generation.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• RDF/Turtle knowledge base (.ttl)</div>
                    <div>• Phi-2 natural language to SPARQL</div>
                    <div>• FAISS vectorstore with RAG</div>
                    <div>• Memory and conversation history</div>
                    <div>• MCP tools integration</div>
                  </div>
                </CardContent>
              </Card>

              {/* Science Agent */}
              <Card className="formul8-card border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Microscope className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">Science Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700">NEW</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Evidence-based research analysis with PubMed integration and scientific literature validation.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• PubMed literature search & analysis</div>
                    <div>• Scientific claim validation</div>
                    <div>• Evidence quality assessment</div>
                    <div>• Research trend analysis</div>
                    <div>• Citation impact metrics</div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulation Agent */}
              <Card className="formul8-card border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-base">Formulation Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit bg-green-50 text-green-700">Enhanced</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Advanced molecular analysis and formulation design using RDKit and Streamlit.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• RDKit molecular structure analysis</div>
                    <div>• Cannabinoid & terpene profiling</div>
                    <div>• Bioavailability assessment</div>
                    <div>• Interactive formulation design</div>
                    <div>• Compliance verification</div>
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Agent */}
              <Card className="formul8-card border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">Marketing Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">N8N Integrated</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Platform-specific advertising strategies with N8N workflow automation.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• Multi-platform compliance checking</div>
                    <div>• Creative workarounds for restrictions</div>
                    <div>• Market intelligence workflow</div>
                    <div>• Micro campaign testing</div>
                  </div>
                </CardContent>
              </Card>

              {/* Operations Agent */}
              <Card className="formul8-card border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base">Operations Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Development</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Cultivation, processing, and facility management optimization.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• Cultivation optimization</div>
                    <div>• Processing workflows</div>
                    <div>• Facility management</div>
                    <div>• Quality control systems</div>
                  </div>
                </CardContent>
              </Card>

              {/* Patent/Trademark Agent */}
              <Card className="formul8-card border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-indigo-500" />
                    <CardTitle className="text-base">Patent Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Development</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Intellectual property protection and trademark management.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• Patent search & analysis</div>
                    <div>• Trademark protection</div>
                    <div>• IP strategy development</div>
                    <div>• Prior art analysis</div>
                  </div>
                </CardContent>
              </Card>

              {/* Sourcing Agent */}
              <Card className="formul8-card border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-teal-500" />
                    <CardTitle className="text-base">Sourcing Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Development</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Supply chain optimization and vendor management.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• Supplier verification</div>
                    <div>• Quality assessment</div>
                    <div>• Cost optimization</div>
                    <div>• Logistics planning</div>
                  </div>
                </CardContent>
              </Card>

              {/* Spectra Agent */}
              <Card className="formul8-card border-l-4 border-l-pink-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-pink-500" />
                    <CardTitle className="text-base">Spectra Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Development</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Certificate of Analysis (CoA) and GCMS data interpretation.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• CoA analysis & validation</div>
                    <div>• GCMS data interpretation</div>
                    <div>• Contamination detection</div>
                    <div>• Quality assurance metrics</div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Success Agent */}
              <Card className="formul8-card border-l-4 border-l-rose-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-rose-500" />
                    <CardTitle className="text-base">Customer Success Agent</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Development</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-formul8-text-secondary">
                    Customer support automation and success optimization.
                  </p>
                  <div className="space-y-1 text-xs text-formul8-text-secondary">
                    <div>• Automated support responses</div>
                    <div>• Customer journey optimization</div>
                    <div>• Success metric tracking</div>
                    <div>• Proactive issue resolution</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Integration Overview */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Multi-Agent Orchestration</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  LangGraph-powered agent coordination with cross-verification and consensus building
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-formul8-primary/10 border border-formul8-primary rounded-lg p-4">
                  <h4 className="font-semibold text-formul8-primary mb-3">Agent Collaboration Framework</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-formul8-text-primary mb-2">Primary Processing</h5>
                      <p className="text-sm text-formul8-text-secondary">Selected agent processes user query using specialized knowledge and tools</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-formul8-text-primary mb-2">Cross-Verification</h5>
                      <p className="text-sm text-formul8-text-secondary">Secondary agents validate response accuracy and identify potential conflicts</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-formul8-text-primary mb-2">Consensus Building</h5>
                      <p className="text-sm text-formul8-text-secondary">Final response includes confidence scores and verification status</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Link href="/plan">
                    <Button className="bg-formul8-primary hover:bg-formul8-primary/90">
                      View Complete Implementation Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            {/* Frontend Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Frontend Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Modern React-based frontend with TypeScript, real-time updates, and comprehensive UI components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">⚛️</div>
                    <div className="font-semibold text-blue-800">React 18</div>
                    <div className="text-xs text-blue-600 mt-1">Component Framework</div>
                  </div>
                  <div className="bg-gradient-to-b from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">📘</div>
                    <div className="font-semibold text-indigo-800">TypeScript</div>
                    <div className="text-xs text-indigo-600 mt-1">Type Safety</div>
                  </div>
                  <div className="bg-gradient-to-b from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="font-semibold text-purple-800">Vite</div>
                    <div className="text-xs text-purple-600 mt-1">Build Tool</div>
                  </div>
                  <div className="bg-gradient-to-b from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🎨</div>
                    <div className="font-semibold text-emerald-800">Tailwind CSS</div>
                    <div className="text-xs text-emerald-600 mt-1">Styling Framework</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Core Frontend Technologies</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>UI Framework:</strong> Shadcn/ui components built on Radix UI primitives</div>
                      <div><strong>State Management:</strong> TanStack Query for server state management</div>
                      <div><strong>Routing:</strong> Wouter for lightweight client-side routing</div>
                      <div><strong>Authentication:</strong> Session-based auth with Replit Auth integration</div>
                      <div><strong>Forms:</strong> React Hook Form with Zod validation</div>
                      <div><strong>Data Fetching:</strong> TanStack Query with optimistic updates</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Frontend Architecture Patterns</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>Component Structure:</strong> Atomic design with reusable UI components</div>
                      <div><strong>Page Organization:</strong> Feature-based routing with dynamic parameters</div>
                      <div><strong>Real-time Updates:</strong> Automatic data refreshing and live polling</div>
                      <div><strong>Mobile Responsive:</strong> Touch-friendly interface with adaptive layouts</div>
                      <div><strong>Performance:</strong> Code splitting and lazy loading for optimal speed</div>
                      <div><strong>Accessibility:</strong> ARIA compliance and keyboard navigation</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Backend Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Backend Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Node.js Express server with PostgreSQL database, AI agent orchestration, and comprehensive API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-b from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🟢</div>
                    <div className="font-semibold text-green-800">Node.js</div>
                    <div className="text-xs text-green-600 mt-1">Runtime Environment</div>
                  </div>
                  <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="font-semibold text-gray-800">Express.js</div>
                    <div className="text-xs text-gray-600 mt-1">Web Framework</div>
                  </div>
                  <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🐘</div>
                    <div className="font-semibold text-blue-800">PostgreSQL</div>
                    <div className="text-xs text-blue-600 mt-1">Database</div>
                  </div>
                  <div className="bg-gradient-to-b from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold text-orange-800">OpenAI</div>
                    <div className="text-xs text-orange-600 mt-1">AI Integration</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Backend Technologies</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>Language:</strong> TypeScript with ES modules</div>
                      <div><strong>Database ORM:</strong> Drizzle ORM with Neon serverless PostgreSQL</div>
                      <div><strong>Authentication:</strong> Replit OpenID Connect with passport.js</div>
                      <div><strong>Session Storage:</strong> PostgreSQL-backed sessions (connect-pg-simple)</div>
                      <div><strong>AI Integration:</strong> OpenAI GPT-4o for agent responses</div>
                      <div><strong>File System:</strong> Agent-specific baseline and configuration management</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">API Architecture</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>RESTful APIs:</strong> Comprehensive CRUD operations for all agent data</div>
                      <div><strong>Agent Management:</strong> Dynamic agent discovery and configuration</div>
                      <div><strong>Baseline Testing:</strong> Real-time AI testing and performance metrics</div>
                      <div><strong>File Operations:</strong> Baseline question editing and repository access</div>
                      <div><strong>Real-time Updates:</strong> Live data synchronization and polling</div>
                      <div><strong>Error Handling:</strong> Comprehensive validation and error responses</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Structure */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Project Structure</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Organized codebase with clear separation of concerns and modular architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Frontend Structure</h4>
                    <div className="text-xs font-mono text-gray-700 space-y-1">
                      <div>client/</div>
                      <div>&nbsp;&nbsp;├── src/</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── components/</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── ui/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Shadcn components</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── pages/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Application pages</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── hooks/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Custom React hooks</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── lib/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Utility functions</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── assets/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Static assets</div>
                      <div>&nbsp;&nbsp;├── index.html</div>
                      <div>&nbsp;&nbsp;└── vite.config.ts</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Backend Structure</h4>
                    <div className="text-xs font-mono text-gray-700 space-y-1">
                      <div>server/</div>
                      <div>&nbsp;&nbsp;├── routes/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# API route handlers</div>
                      <div>&nbsp;&nbsp;├── services/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Business logic</div>
                      <div>&nbsp;&nbsp;├── storage.ts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Database interface</div>
                      <div>&nbsp;&nbsp;├── replitAuth.ts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Authentication</div>
                      <div>&nbsp;&nbsp;└── index.ts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Server entry point</div>
                      <div>shared/</div>
                      <div>&nbsp;&nbsp;├── schema.ts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Database schemas</div>
                      <div>&nbsp;&nbsp;└── types.ts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Shared types</div>
                      <div>agents/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Specialized AI agents</div>
                      <div>&nbsp;&nbsp;├── compliance-agent/</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── agent.py&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Agent implementation</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── baseline.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Test questions</div>
                      <div>&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── data/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Data submodule (Git LFS)</div>
                      <div>&nbsp;&nbsp;├── formulation-agent/</div>
                      <div>&nbsp;&nbsp;└── ...&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# 12 total agents (dual repo)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Multi-Agent Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Specialized AI agents with individual repositories, baseline testing, and comprehensive cannabis industry expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🧪</div>
                    <div className="font-semibold text-green-800">Phase 1 Agents</div>
                    <div className="text-xs text-green-600 mt-1">Core Operations (6 agents)</div>
                    <div className="text-xs text-green-700 mt-2">Compliance • Formulation • Marketing<br/>Operations • Sourcing • Patent</div>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🔬</div>
                    <div className="font-semibold text-blue-800">Phase 2 Agents</div>
                    <div className="text-xs text-blue-600 mt-1">Advanced Analytics (3 agents)</div>
                    <div className="text-xs text-blue-700 mt-2">Science • Spectra • FTO Analysis</div>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🎓</div>
                    <div className="font-semibold text-purple-800">Phase 3 Agents</div>
                    <div className="text-xs text-purple-600 mt-1">Education & Support (3 agents)</div>
                    <div className="text-xs text-purple-700 mt-2">LMS • Customer Success • Metabolomics</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Agent Infrastructure</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>Dual Repository Architecture:</strong> Each agent has main code repository + dedicated data repository</div>
                      <div><strong>Data Repository Structure:</strong> Separate Git LFS-enabled repos for training data, models, and vector stores</div>
                      <div><strong>Git Submodules Integration:</strong> Data repos linked as submodules at agents/{agent}/data/ for modular management</div>
                      <div><strong>Baseline Testing:</strong> Comprehensive question sets (203 total questions) with AI grading system</div>
                      <div><strong>Performance Tracking:</strong> Real-time metrics, confidence scoring, and cost analysis</div>
                      <div><strong>Configuration Management:</strong> Individual YAML configs and prompt engineering</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Agent Capabilities</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>Multi-Model Support:</strong> OpenAI GPT-4o, Anthropic Claude, Google Gemini</div>
                      <div><strong>Domain Specialization:</strong> Cannabis-specific knowledge bases and regulatory compliance</div>
                      <div><strong>Cross-Verification:</strong> Agent-to-agent validation for production-ready answers</div>
                      <div><strong>Real-time Testing:</strong> Continuous baseline evaluation with authentic API responses</div>
                      <div><strong>Cost Optimization:</strong> Per-token pricing and performance optimization across providers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Repository Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Agent Data Repository Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Dedicated data repositories with Git LFS support for large AI/ML files and independent data management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">📁 Main Agent Repository</h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <div><strong>Code & Configuration:</strong> Python agents, YAML configs, baseline.json</div>
                      <div><strong>Testing Framework:</strong> Baseline questions, test cases, performance tracking</div>
                      <div><strong>Documentation:</strong> README files, implementation guides, API docs</div>
                      <div><strong>Scripts:</strong> Agent runners, testing utilities, deployment scripts</div>
                    </div>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3">🗄️ Data Repository</h4>
                    <div className="text-sm text-green-700 space-y-2">
                      <div><strong>Training Data:</strong> JSONL corpus files, RAG documents, knowledge bases</div>
                      <div><strong>Vector Stores:</strong> FAISS indices, embeddings, similarity matrices</div>
                      <div><strong>AI Models:</strong> GGUF local models, fine-tuned weights, model artifacts</div>
                      <div><strong>Datasets:</strong> Parquet files, SQLite databases, processed training data</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Git LFS File Type Coverage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Training Data</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• *.jsonl (corpus files)</div>
                        <div>• *.parquet (datasets)</div>
                        <div>• *.sqlite (databases)</div>
                        <div>• *.csv (data exports)</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-2">AI Models</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• *.gguf (local models)</div>
                        <div>• *.bin (model weights)</div>
                        <div>• *.safetensors (safe tensors)</div>
                        <div>• *.pkl (pickled models)</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Vector Stores</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• *.faiss (FAISS indices)</div>
                        <div>• *.index (search indices)</div>
                        <div>• *.npy (numpy arrays)</div>
                        <div>• *.h5 (HDF5 files)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Repository Organization</h4>
                    <div className="text-xs font-mono text-gray-700 space-y-1">
                      <div>agents/compliance-agent/</div>
                      <div>&nbsp;&nbsp;├── agent.py&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Main agent code</div>
                      <div>&nbsp;&nbsp;├── baseline.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Test questions</div>
                      <div>&nbsp;&nbsp;├── agent_config.yaml&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Configuration</div>
                      <div>&nbsp;&nbsp;└── data/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Data submodule</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── corpus/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Training documents</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── vectorstore/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# FAISS indices</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── knowledge_base/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# RDF/TTL files</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── models/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Local AI models</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── datasets/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Processed data</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Data Management Benefits</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div><strong>Independent Data Lifecycle:</strong> Training data can be updated without affecting agent code</div>
                      <div><strong>Large File Efficiency:</strong> Git LFS handles multi-GB model files without repository bloat</div>
                      <div><strong>Modular Development:</strong> Agents can share data repositories or maintain specialized datasets</div>
                      <div><strong>Version Control:</strong> Complete data lineage tracking with Git history and branching</div>
                      <div><strong>Scalable Storage:</strong> Efficient transfer and storage of large AI/ML artifacts</div>
                      <div><strong>Access Control:</strong> Independent permissions for code vs. sensitive training data</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Workspace Document Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Google Workspace Document Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Professional document management with real-time collaboration and agent-based editing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-3">F8 Cannabis Workspace Structure</h4>
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-800 font-medium">📁 Compliance Documents</div>
                        <div className="text-xs text-green-600">Cannabis SOPs, regulatory checklists, compliance tracking</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-blue-800 font-medium">📁 Product Development</div>
                        <div className="text-xs text-blue-600">Formulation briefs, strain profiles, R&D documentation</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="text-sm text-purple-800 font-medium">📁 Marketing Campaigns</div>
                        <div className="text-xs text-purple-600">Campaign strategies, budget tracking, creative assets</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="text-sm text-orange-800 font-medium">📁 Lab Results & Operations</div>
                        <div className="text-xs text-orange-600">CoA tracking, quality control, operational procedures</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-3">Professional Document Features</h4>
                    <div className="space-y-3">
                      <div className="bg-formul8-primary/10 border border-formul8-primary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">✨ Professional Styling</div>
                        <div className="text-xs text-formul8-text-secondary">Color-coded sections, branded typography, structured formatting</div>
                      </div>
                      <div className="bg-formul8-secondary/10 border border-formul8-secondary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">🤖 Agent Collaboration</div>
                        <div className="text-xs text-formul8-text-secondary">Real-time agent editing, version control, automated updates</div>
                      </div>
                      <div className="bg-formul8-tertiary/10 border border-formul8-tertiary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">🔐 Domain-Wide Access</div>
                        <div className="text-xs text-formul8-text-secondary">Service account authentication, secure sharing, permission management</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Live Production Documents</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>📋 <strong>Cannabis Standard Operating Procedures:</strong> Professional SOP with quality control protocols</div>
                    <div>📊 <strong>Compliance Tracking Dashboard:</strong> Real-time compliance monitoring spreadsheet</div>
                    <div>🧪 <strong>Product Development Brief:</strong> Comprehensive formulation documentation</div>
                    <div>🔬 <strong>Lab Results Tracker:</strong> CoA management and quality metrics</div>
                    <div>📈 <strong>Marketing Framework:</strong> Campaign strategy and budget planning</div>
                    <div>🧬 <strong>CBD Tincture Formulation Sheet:</strong> Beautifully styled terpene mixing guide with color-coded sections</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">🧪 Featured: CBD Tincture Formulation Sheet</h4>
                  <div className="text-sm text-green-700 mb-3">
                    Professional cannabis formulation document with comprehensive terpene profiles, quality control specifications, and batch tracking
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="bg-white rounded p-2 border">
                        <strong>🌿 Terpene Blend:</strong> Limonene (0.5%), Linalool (0.3%), Pinene (0.2%), Myrcene (0.1%)
                      </div>
                      <div className="bg-white rounded p-2 border">
                        <strong>💡 Formulation Steps:</strong> 10-step process with temperature controls and quality checks
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-2 border">
                        <strong>🔬 Quality Control:</strong> CBD potency, terpene profiles, microbial testing, heavy metals
                      </div>
                      <div className="bg-white rounded p-2 border">
                        <strong>📝 Batch Records:</strong> Production tracking with yield analysis and quality metrics
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RDF Knowledge Base Architecture */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">RDF Knowledge Base + SPARQL Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Each agent has a structured RDF knowledge base with AI-powered natural language to SPARQL query generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-3">RDF Knowledge Bases</h4>
                    <div className="space-y-3">
                      <div className="bg-formul8-primary/10 border border-formul8-primary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">compliance-agent/rag/knowledge_base.ttl</div>
                        <div className="text-xs text-formul8-text-secondary">Regulatory bodies, license types, compliance requirements</div>
                      </div>
                      <div className="bg-formul8-secondary/10 border border-formul8-secondary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">formulation-agent/rag/knowledge_base.ttl</div>
                        <div className="text-xs text-formul8-text-secondary">Cannabinoids, terpenes, extraction methods, RDKit integration</div>
                      </div>
                      <div className="bg-formul8-tertiary/10 border border-formul8-tertiary rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">marketing-agent/rag/knowledge_base.ttl</div>
                        <div className="text-xs text-formul8-text-secondary">Platforms, strategies, demographics, creative workarounds</div>
                      </div>
                      <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                        <div className="text-sm text-formul8-text-primary font-medium">+ 6 more agent knowledge bases</div>
                        <div className="text-xs text-formul8-text-secondary">Operations, sourcing, patent, science, spectra, customer success</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-3">Phi-2 SPARQL Generation</h4>
                    <div className="space-y-3 text-sm text-formul8-text-secondary">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <strong>Natural Language Input:</strong><br/>
                          "What are the licensing requirements in California?"
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <strong>Phi-2 Generated SPARQL:</strong><br/>
                          <code className="text-xs bg-gray-100 p-1 rounded">
                            SELECT ?requirement WHERE &#123; compliance:CaliforniaDCC compliance:requires ?requirement &#125;
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <strong>RDF Query Execution:</strong><br/>
                          Returns structured knowledge from agent's .ttl file
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-formul8-surface border rounded-lg p-4">
                  <h4 className="font-semibold text-formul8-text-primary mb-3">LangChain + RDF Integration Flow</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">1</div>
                      <div className="text-sm font-medium">User Query</div>
                      <div className="text-xs text-formul8-text-secondary">Natural language question</div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">2</div>
                      <div className="text-sm font-medium">Phi-2 SPARQL</div>
                      <div className="text-xs text-formul8-text-secondary">Generate structured query</div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">3</div>
                      <div className="text-sm font-medium">RDF Query</div>
                      <div className="text-xs text-formul8-text-secondary">Execute against .ttl</div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">4</div>
                      <div className="text-sm font-medium">LangChain RAG</div>
                      <div className="text-xs text-formul8-text-secondary">Combine with vectorstore</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* LangChain Agent Structure */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Agent Directory Structure</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Standardized structure for all 9 agents with RAG, memory, and testing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <div>agent-name/</div>
                  <div>├── rag/</div>
                  <div>│   ├── knowledge_base.ttl        # RDF structured knowledge</div>
                  <div>│   ├── corpus.jsonl             # Training data</div>
                  <div>│   ├── vectorstore/             # FAISS index files</div>
                  <div>│   ├── config.yaml              # RAG configuration</div>
                  <div>│   └── model/                   # Local models (GGUF)</div>
                  <div>├── agent_config.yaml            # Agent configuration</div>
                  <div>├── agent.py                     # LangChain implementation</div>
                  <div>├── baseline.json                # Test questions</div>
                  <div>├── test_cases/                  # Testing scenarios</div>
                  <div>└── dashboard.html               # Agent dashboard</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            {/* Deployment Phasing */}
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Deployment Phasing Strategy</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Progressive deployment approach from MVP baseline system to full cloud-native AI platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Phase 1 - MVP */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">Phase 1: MVP Foundation</h3>
                        <p className="text-sm text-green-600">Learning-focused baseline system with local LangChain agents</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-800 mb-3">Core Components</h4>
                        <div className="space-y-2 text-sm text-green-700">
                          <div><strong>No AWS Cloud:</strong> Local development environment for learning and testing</div>
                          <div><strong>Baseline Q&A System:</strong> Comprehensive question sets (203 questions) with expected answers</div>
                          <div><strong>LangChain Agents:</strong> Local agent implementations for query resolution</div>
                          <div><strong>6 Core Agents:</strong> Compliance, Formulation, Marketing, Operations, Sourcing, Patent</div>
                          <div><strong>React Frontend:</strong> Basic dashboard with agent interaction and baseline testing</div>
                          <div><strong>Local Storage:</strong> File-based data storage with JSON configurations</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 mb-3">Learning Objectives</h4>
                        <div className="space-y-2 text-sm text-green-700">
                          <div><strong>Agent Development:</strong> Understanding cannabis industry domain expertise</div>
                          <div><strong>Baseline Testing:</strong> Establishing performance benchmarks and accuracy metrics</div>
                          <div><strong>LangChain Integration:</strong> Mastering agent orchestration and prompt engineering</div>
                          <div><strong>Cannabis Compliance:</strong> Building regulatory knowledge and validation systems</div>
                          <div><strong>User Interface:</strong> Creating intuitive agent interaction patterns</div>
                          <div><strong>Performance Metrics:</strong> Tracking response quality and system reliability</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 bg-white border border-green-300 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">Phase 1 Technical Stack</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium text-green-700 mb-2">Frontend</div>
                          <div className="text-sm text-green-600 space-y-1">
                            <div>• React + TypeScript</div>
                            <div>• Vite development server</div>
                            <div>• Tailwind CSS + Shadcn/ui</div>
                            <div>• Local API integration</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700 mb-2">Backend</div>
                          <div className="text-sm text-green-600 space-y-1">
                            <div>• Node.js Express server</div>
                            <div>• Local file system storage</div>
                            <div>• LangChain Python agents</div>
                            <div>• OpenAI API integration</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700 mb-2">Data Management</div>
                          <div className="text-sm text-green-600 space-y-1">
                            <div>• JSON configuration files</div>
                            <div>• Local baseline.json storage</div>
                            <div>• Git version control</div>
                            <div>• Individual agent repositories</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 - Enhanced Intelligence */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800">Phase 2: Enhanced Intelligence</h3>
                        <p className="text-sm text-blue-600">Advanced analytics with RAG, vector stores, and specialized domain agents</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-3">Intelligence Upgrades</h4>
                        <div className="space-y-2 text-sm text-blue-700">
                          <div><strong>RAG Integration:</strong> Vector stores with FAISS indexing for contextual retrieval from regulatory documents</div>
                          <div><strong>Specialized Agents:</strong> Science agent for research validation, Spectra agent for analytical chemistry, FTO agent for patent analysis</div>
                          <div><strong>Knowledge Graphs:</strong> RDF/TTL ontologies with SPARQL querying for complex regulatory relationships</div>
                          <div><strong>Multi-Model Intelligence:</strong> OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini Pro with dynamic model selection</div>
                          <div><strong>Cross-Verification:</strong> Agent-to-agent validation for production-ready compliance answers</div>
                          <div><strong>Semantic Search:</strong> Natural language queries across 25+ state cannabis regulations with precise citations</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-3">Data & Performance</h4>
                        <div className="space-y-2 text-sm text-blue-700">
                          <div><strong>PostgreSQL Database:</strong> Persistent storage with Drizzle ORM for conversation history and performance metrics</div>
                          <div><strong>Vector Embeddings:</strong> Sentence transformers for semantic similarity across cannabis knowledge base</div>
                          <div><strong>Real-time Analytics:</strong> Performance tracking, confidence scoring, and cost optimization across all models</div>
                          <div><strong>Advanced Baseline Testing:</strong> Multi-model comparison, AI grading, and comprehensive accuracy assessment</div>
                          <div><strong>Git LFS Data Repositories:</strong> Efficient handling of large training datasets, vector stores, and AI model files</div>
                          <div><strong>Regulatory Automation:</strong> Automated compliance checking with change detection and citation extraction</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-blue-300 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-blue-800 mb-3">Phase 2 Agent Ecosystem</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium text-blue-700 mb-2">Core Agents (Enhanced)</div>
                          <div className="text-sm text-blue-600 space-y-1">
                            <div>• Compliance Agent + RAG</div>
                            <div>• Formulation Agent + Chemical DB</div>
                            <div>• Marketing Agent + Analytics</div>
                            <div>• Operations Agent + Workflow</div>
                            <div>• Sourcing Agent + Supply Chain</div>
                            <div>• Patent Agent + IP Search</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-700 mb-2">Specialized Agents</div>
                          <div className="text-sm text-blue-600 space-y-1">
                            <div>• Science Agent (Research validation)</div>
                            <div>• Spectra Agent (Analytical chemistry)</div>
                            <div>• Customer Success Agent</div>
                            <div>• Metabolomics Agent</div>
                            <div>• LMS Agent (Training systems)</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-700 mb-2">Intelligence Features</div>
                          <div className="text-sm text-blue-600 space-y-1">
                            <div>• Multi-agent orchestration</div>
                            <div>• Cross-domain knowledge fusion</div>
                            <div>• Consensus validation</div>
                            <div>• Dynamic model selection</div>
                            <div>• Cost-performance optimization</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">Phase 2 Learning Outcomes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-sm text-blue-700 space-y-2">
                          <div><strong>Advanced AI Integration:</strong> Master RAG architectures, vector databases, and semantic search</div>
                          <div><strong>Multi-Model Orchestration:</strong> Optimize performance across different AI providers and models</div>
                          <div><strong>Domain Expertise:</strong> Deep cannabis industry knowledge with specialized analytical capabilities</div>
                        </div>
                        <div className="text-sm text-blue-700 space-y-2">
                          <div><strong>Enterprise Data Management:</strong> PostgreSQL, Git LFS, and scalable data architecture patterns</div>
                          <div><strong>Quality Assurance:</strong> Cross-agent verification, confidence scoring, and production validation</div>
                          <div><strong>Performance Analytics:</strong> Real-time monitoring, cost optimization, and accuracy tracking</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 - Production Scale */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-800">Phase 3: Production Scale</h3>
                        <p className="text-sm text-purple-600">Enterprise deployment with AWS cloud infrastructure and full automation</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-3">Cloud Infrastructure</h4>
                        <div className="space-y-2 text-sm text-purple-700">
                          <div><strong>AWS SageMaker:</strong> Model training and inference endpoints</div>
                          <div><strong>AWS Bedrock:</strong> Foundation model access and fine-tuning</div>
                          <div><strong>Lambda Functions:</strong> Serverless agent orchestration</div>
                          <div><strong>CloudWatch:</strong> Comprehensive monitoring and analytics</div>
                          <div><strong>S3 Storage:</strong> Scalable data lake for training datasets</div>
                          <div><strong>API Gateway:</strong> Production API management and scaling</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-3">Enterprise Features</h4>
                        <div className="space-y-2 text-sm text-purple-700">
                          <div><strong>Auto-scaling:</strong> Dynamic resource allocation based on demand</div>
                          <div><strong>Multi-region:</strong> Global deployment with edge optimization</div>
                          <div><strong>Security:</strong> Enterprise-grade authentication and data encryption</div>
                          <div><strong>Compliance:</strong> SOC 2, HIPAA, and cannabis industry standards</div>
                          <div><strong>Analytics:</strong> Advanced business intelligence and reporting</div>
                          <div><strong>Integration:</strong> Enterprise CRM, ERP, and workflow systems</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Marketing Agent Workflow Automation</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Automated workflow system for cannabis marketing compliance and campaign optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Workflow Diagram */}
                  <div className="bg-formul8-primary/5 border border-formul8-primary rounded-lg p-6">
                    <h4 className="font-semibold text-formul8-primary mb-4">Marketing Intelligence Workflow</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-primary rounded-full flex items-center justify-center mx-auto mb-2">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">Content Upload</h5>
                        <p className="text-xs text-formul8-text-secondary">Marketing team submits ad</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                          <Search className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">OCR + Analysis</h5>
                        <p className="text-xs text-formul8-text-secondary">Extract text & images</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-warning rounded-full flex items-center justify-center mx-auto mb-2">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">AI Compliance</h5>
                        <p className="text-xs text-formul8-text-secondary">Marketing Agent review</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-warning rounded-full flex items-center justify-center mx-auto mb-2">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">Compliance Check</h5>
                        <p className="text-xs text-formul8-text-secondary">Legal review & approval</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-tertiary rounded-full flex items-center justify-center mx-auto mb-2">
                          <Beaker className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">Micro Campaign</h5>
                        <p className="text-xs text-formul8-text-secondary">Test market & CPC analysis</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border text-center">
                        <div className="w-12 h-12 bg-formul8-success rounded-full flex items-center justify-center mx-auto mb-2">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <h5 className="font-medium text-formul8-text-primary mb-1">Market Intelligence</h5>
                        <p className="text-xs text-formul8-text-secondary">Size, CPC, ROI estimates</p>
                      </div>
                    </div>
                  </div>

                  {/* Implementation Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-formul8-primary">
                      <CardHeader>
                        <CardTitle className="text-formul8-primary text-lg">Workflow Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-formul8-surface p-3 rounded border">
                          <h5 className="font-medium text-formul8-text-primary mb-2">Webhook Trigger</h5>
                          <pre className="text-xs text-formul8-text-secondary">
{`{
  "path": "/marketing-review",
  "method": "POST",
  "authentication": "headerAuth",
  "options": {
    "authHeaderName": "X-API-Key"
  }
}`}
                          </pre>
                        </div>
                        
                        <div className="bg-formul8-surface p-3 rounded border">
                          <h5 className="font-medium text-formul8-text-primary mb-2">Campaign Creation</h5>
                          <pre className="text-xs text-formul8-text-secondary">
{`{
  "platform": "Google Ads API",
  "campaign": {
    "name": "Micro Test - {{$json.adId}}",
    "budget": 50,
    "duration": "48 hours",
    "targeting": "{{$json.demographics}}"
  }
}`}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-formul8-secondary">
                      <CardHeader>
                        <CardTitle className="text-formul8-secondary text-lg">Marketing Agent Integration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-formul8-surface p-3 rounded border">
                          <h5 className="font-medium text-formul8-text-primary mb-2">Market Analysis</h5>
                          <pre className="text-xs text-formul8-text-secondary">
{`{
  "url": "https://formul8.replit.app/api/n8n/webhook/marketing",
  "body": {
    "campaignData": "{{$json.metrics}}",
    "cpc": "{{$json.avgCPC}}",
    "impressions": "{{$json.totalImpressions}}",
    "clicks": "{{$json.totalClicks}}",
    "demographics": "{{$json.audienceData}}"
  }
}`}
                          </pre>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Campaign Setup</span>
                            <span className="text-sm font-medium">5-10 minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Test Duration</span>
                            <span className="text-sm font-medium text-formul8-info">48 hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">Market Size Accuracy</span>
                            <span className="text-sm font-medium text-formul8-success">±15%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-formul8-text-secondary">CPC Prediction</span>
                            <span className="text-sm font-medium text-formul8-success">±12%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Benefits */}
                  <div className="bg-formul8-success/10 border border-formul8-success rounded-lg p-4">
                    <h4 className="font-semibold text-formul8-success mb-3">Market Intelligence Benefits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium text-formul8-text-primary mb-2">Speed & Efficiency</h5>
                        <ul className="space-y-1 text-formul8-text-secondary text-sm">
                          <li>✓ Automated compliance + market testing</li>
                          <li>✓ 48-hour market size estimates</li>
                          <li>✓ Real-time CPC optimization</li>
                          <li>✓ Eliminates guesswork in budgeting</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-formul8-text-primary mb-2">Risk Reduction</h5>
                        <ul className="space-y-1 text-formul8-text-secondary text-sm">
                          <li>✓ Validates market demand before full launch</li>
                          <li>✓ Prevents over-spending on poor audiences</li>
                          <li>✓ Ensures legal compliance across platforms</li>
                          <li>✓ Tests creative performance safely</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-formul8-text-primary mb-2">Strategic Insights</h5>
                        <ul className="space-y-1 text-formul8-text-secondary text-sm">
                          <li>✓ Market size estimation (±15% accuracy)</li>
                          <li>✓ CPC prediction (±12% accuracy)</li>
                          <li>✓ Demographic performance analysis</li>
                          <li>✓ ROI forecasting for full campaigns</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Example Results */}
                  <div className="bg-formul8-info/10 border border-formul8-info rounded-lg p-4">
                    <h4 className="font-semibold text-formul8-info mb-3">Example Micro Campaign Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">$2.34</div>
                        <p className="text-sm text-formul8-text-secondary">Avg CPC</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">125K</div>
                        <p className="text-sm text-formul8-text-secondary">Market Size</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">3.2%</div>
                        <p className="text-sm text-formul8-text-secondary">CTR</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-formul8-secondary">$450</div>
                        <p className="text-sm text-formul8-text-secondary">Est. Monthly Budget</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain the same... */}
          <TabsContent value="tech-stack" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Technology Stack & Development Workflow</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Modern infrastructure supporting containerized agents with GitHub Actions benchmarking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tech Stack */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-formul8-text-primary">Frontend Stack</h4>
                      <div className="space-y-2">
                        <Badge variant="outline" className="mr-2">React 18 + TypeScript</Badge>
                        <Badge variant="outline" className="mr-2">Vite</Badge>
                        <Badge variant="outline" className="mr-2">Shadcn/UI</Badge>
                        <Badge variant="outline" className="mr-2">TanStack Query</Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-formul8-text-primary">Backend Services</h4>
                      <div className="space-y-2">
                        <Badge variant="outline" className="mr-2">Node.js + Express</Badge>
                        <Badge variant="outline" className="mr-2">PostgreSQL + Drizzle</Badge>
                        <Badge variant="outline" className="mr-2">OpenAI GPT-4o</Badge>
                        <Badge variant="outline" className="mr-2">N8N Workflows</Badge>
                        <Badge variant="outline" className="mr-2">PubMed API</Badge>
                        <Badge variant="outline" className="mr-2">RDKit Chemistry</Badge>
                        <Badge variant="outline" className="mr-2">Streamlit</Badge>
                        <Badge variant="outline" className="mr-2">Replit Auth</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Issue-Driven Development */}
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-4">Issue-Driven Development Workflow</h4>
                    <div className="bg-formul8-surface border rounded-lg p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Create GitHub Issue</h5>
                          <p className="text-sm text-formul8-text-secondary">Describe feature, bug, or enhancement in agent repository</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Create Feature Branch</h5>
                          <p className="text-sm text-formul8-text-secondary">Branch naming: <code className="bg-background px-1 rounded text-xs">feature/ISSUE_NUMBER-description</code></p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Develop in Replit</h5>
                          <p className="text-sm text-formul8-text-secondary">Open agent repository in Replit for one-click development environment</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Test with Benchmarks</h5>
                          <p className="text-sm text-formul8-text-secondary">Automated CI/CD runs accuracy, speed, and confidence benchmarks</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Pull Request to Main</h5>
                          <p className="text-sm text-formul8-text-secondary">Include <code className="bg-background px-1 rounded text-xs">Closes #ISSUE_NUMBER</code> to auto-close issue</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                        <div>
                          <h5 className="font-medium text-formul8-text-primary">Deploy & Update</h5>
                          <p className="text-sm text-formul8-text-secondary">Agent updates automatically in orchestrator via Git submodules</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Containerized Environments */}
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-4">Containerized Agent Environments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-formul8-primary rounded-lg p-3">
                        <h5 className="font-medium text-formul8-primary mb-2">🧪 Formulation Agent</h5>
                        <p className="text-sm text-formul8-text-secondary mb-2">Streamlit + RDKit + Chemical Analysis</p>
                        <code className="text-xs bg-formul8-surface p-1 rounded block">streamlit run app.py</code>
                      </div>
                      <div className="border border-formul8-secondary rounded-lg p-3">
                        <h5 className="font-medium text-formul8-secondary mb-2">📈 Marketing Agent</h5>
                        <p className="text-sm text-formul8-text-secondary mb-2">N8N + Workflow Automation</p>
                        <code className="text-xs bg-formul8-surface p-1 rounded block">n8n start --tunnel</code>
                      </div>
                      <div className="border border-formul8-tertiary rounded-lg p-3">
                        <h5 className="font-medium text-formul8-tertiary mb-2">🔬 Science Agent</h5>
                        <p className="text-sm text-formul8-text-secondary mb-2">Node.js + PubMed API</p>
                        <code className="text-xs bg-formul8-surface p-1 rounded block">npm run dev</code>
                      </div>
                      <div className="border border-formul8-warning rounded-lg p-3">
                        <h5 className="font-medium text-formul8-warning mb-2">⚖️ Compliance Agent</h5>
                        <p className="text-sm text-formul8-text-secondary mb-2">FastAPI + Python</p>
                        <code className="text-xs bg-formul8-surface p-1 rounded block">python main.py</code>
                      </div>
                    </div>
                  </div>

                  {/* Automated Benchmarking */}
                  <div>
                    <h4 className="font-semibold text-formul8-text-primary mb-4">Automated Benchmarking & CI</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-formul8-text-secondary">GitHub Actions run benchmarks on every push and PR</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-formul8-text-secondary">Daily automated benchmark runs with badge updates</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-formul8-text-secondary">Automatic GitHub issue creation on benchmark failures</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-formul8-text-secondary">Performance metrics: accuracy, speed, confidence tracking</span>
                      </div>
                    </div>
                    
                    {/* Benchmark Badge Examples */}
                    <div className="bg-formul8-surface border rounded-lg p-4 mt-4">
                      <h5 className="font-medium text-formul8-text-primary mb-3">Example CI Badges</h5>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <img src="https://img.shields.io/badge/benchmarks-95%25-brightgreen" alt="Benchmarks Badge" className="h-5" />
                          <img src="https://img.shields.io/badge/accuracy-92%25-brightgreen" alt="Accuracy Badge" className="h-5" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <img src="https://img.shields.io/badge/speed-850ms-brightgreen" alt="Speed Badge" className="h-5" />
                          <img src="https://img.shields.io/badge/confidence-87%25-brightgreen" alt="Confidence Badge" className="h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Frontend UX Design Section */}
        <Card className="formul8-card mt-8">
          <CardHeader>
            <CardTitle className="text-formul8-text-primary">Frontend UX Design</CardTitle>
            <CardDescription className="text-formul8-text-secondary">
              Chat-focused user experience with document artifacts, Google Drive integration, and comprehensive user history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Chat-Focused Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">💬 Chat-Centered Experience</h3>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div><strong>Primary Interface:</strong> Chat is the main interaction method - users communicate naturally with specialized cannabis agents</div>
                    <div><strong>Agent Selection:</strong> Smart routing to appropriate agents (compliance, formulation, marketing) based on query context</div>
                    <div><strong>Multi-Agent Conversations:</strong> Seamless handoffs between agents within single conversation threads</div>
                    <div><strong>Real-Time Responses:</strong> Streaming responses with typing indicators and progress updates for complex queries</div>
                    <div><strong>Voice Input:</strong> Speech-to-text for hands-free operation in laboratory and production environments</div>
                  </div>
                </div>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">📄 Document Artifacts</h3>
                  <div className="space-y-3 text-sm text-green-700">
                    <div><strong>Google Drive Frontend:</strong> Direct integration with Google Workspace for document creation and management</div>
                    <div><strong>Live Document Generation:</strong> SOPs, compliance checklists, formulation sheets generated directly into user's Drive folder</div>
                    <div><strong>Template Library:</strong> Pre-built cannabis industry templates (batch records, testing protocols, compliance forms)</div>
                    <div><strong>Collaborative Editing:</strong> Multi-user document editing with agent suggestions and real-time compliance validation</div>
                    <div><strong>Version Control:</strong> Automatic document versioning with change tracking and approval workflows</div>
                  </div>
                </div>
              </div>

              {/* User History & Context */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4">🗂️ User History & Context</h3>
                  <div className="space-y-3 text-sm text-purple-700">
                    <div><strong>Conversation Memory:</strong> Persistent chat history across sessions with searchable message archive</div>
                    <div><strong>Project Continuity:</strong> Agents remember ongoing projects, formulations, and compliance requirements</div>
                    <div><strong>Smart Suggestions:</strong> Context-aware recommendations based on user's historical interactions and preferences</div>
                    <div><strong>Workflow Tracking:</strong> Visual timeline of project progression from initial query to final deliverable</div>
                    <div><strong>Bookmarking System:</strong> Save important conversations, documents, and agent responses for easy retrieval</div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4">📤 File Upload & Processing</h3>
                  <div className="space-y-3 text-sm text-orange-700">
                    <div><strong>Drag-and-Drop Interface:</strong> Simple file upload directly into chat for immediate agent analysis</div>
                    <div><strong>Multi-Format Support:</strong> PDFs, images, spreadsheets, lab reports, and regulatory documents</div>
                    <div><strong>AI-Powered Analysis:</strong> Automatic content extraction, compliance checking, and data validation</div>
                    <div><strong>Batch Processing:</strong> Upload multiple files for comparative analysis and batch operations</div>
                    <div><strong>Secure Storage:</strong> Encrypted file storage with role-based access control and audit trails</div>
                  </div>
                </div>
              </div>

              {/* Interface Components */}
              <div className="bg-formul8-surface border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-formul8-text-primary mb-4">🎨 Interface Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-formul8-text-primary">Chat Components</h4>
                    <ul className="text-sm text-formul8-text-secondary space-y-1">
                      <li>• Message bubbles with agent avatars</li>
                      <li>• Code syntax highlighting</li>
                      <li>• Inline document previews</li>
                      <li>• Action buttons (save, share, edit)</li>
                      <li>• Reaction system for feedback</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-formul8-text-primary">Navigation</h4>
                    <ul className="text-sm text-formul8-text-secondary space-y-1">
                      <li>• Collapsible sidebar with chat history</li>
                      <li>• Agent status indicators</li>
                      <li>• Quick action toolbar</li>
                      <li>• Search functionality</li>
                      <li>• Filter by agent or date range</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-formul8-text-primary">Mobile Experience</h4>
                    <ul className="text-sm text-formul8-text-secondary space-y-1">
                      <li>• Responsive design for tablets</li>
                      <li>• Touch-optimized interactions</li>
                      <li>• Offline message queuing</li>
                      <li>• Push notifications</li>
                      <li>• Camera integration for QR codes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Google Drive Integration Details */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔗 Google Drive Integration Architecture</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Document Workflow</h4>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>User requests SOP via chat</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Agent generates document content</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Auto-creates Google Doc in user's workspace</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Shares link in chat with edit permissions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Folder Organization</h4>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="space-y-1 text-sm font-mono">
                        <div>📁 F8 Cannabis Workspace/</div>
                        <div className="ml-4">📁 Compliance Documents/</div>
                        <div className="ml-4">📁 Product Development/</div>
                        <div className="ml-4">📁 Lab Results/</div>
                        <div className="ml-4">📁 Marketing Assets/</div>
                        <div className="ml-4">📁 Operations/</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Experience Flow */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Complete User Experience Flow</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">1. Chat</div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>Natural conversation</div>
                      <div>Agent selection</div>
                      <div>Context awareness</div>
                    </div>
                  </div>
                  <div className="bg-white border border-blue-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">2. Upload</div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>Drag & drop files</div>
                      <div>AI analysis</div>
                      <div>Instant feedback</div>
                    </div>
                  </div>
                  <div className="bg-white border border-purple-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">3. Generate</div>
                    <div className="text-sm text-purple-700 space-y-1">
                      <div>Document creation</div>
                      <div>Google Drive sync</div>
                      <div>Template application</div>
                    </div>
                  </div>
                  <div className="bg-white border border-orange-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">4. Collaborate</div>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div>Multi-user editing</div>
                      <div>Version control</div>
                      <div>Approval workflows</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Federated Formul8 Section */}
        <Card className="formul8-card mt-8">
          <CardHeader>
            <CardTitle className="text-formul8-text-primary">Federated Formul8 Integration</CardTitle>
            <CardDescription className="text-formul8-text-secondary">
              Enterprise deployment with internal customer systems, LIMS integration, and hybrid cloud architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Integration Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">🏢 Enterprise Integration</h3>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div><strong>LIMS Integration:</strong> Direct connection to Laboratory Information Management Systems for real-time test results</div>
                    <div><strong>ERP Connectivity:</strong> Integration with enterprise resource planning systems for inventory and compliance tracking</div>
                    <div><strong>Quality Management:</strong> Connection to QMS platforms for batch records, SOPs, and audit trails</div>
                    <div><strong>Regulatory Compliance:</strong> Automated reporting to state tracking systems (METRC, BioTrace, Leaf Data)</div>
                    <div><strong>Data Sovereignty:</strong> On-premises deployment options for sensitive data retention</div>
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">🔗 Hybrid Architecture</h3>
                  <div className="space-y-3 text-sm text-green-700">
                    <div><strong>Local Agents:</strong> Cannabis operators deploy agents on-premises at customer.formul8.ai subdomains</div>
                    <div><strong>Cloud Intelligence:</strong> Access to centralized AI models and regulatory updates via formul8.ai cloud</div>
                    <div><strong>Secure Communication:</strong> mTLS encryption between local and cloud agents with certificate-based authentication</div>
                    <div><strong>Data Classification:</strong> Sensitive data stays local, while general queries leverage cloud intelligence</div>
                    <div><strong>Federated Learning:</strong> Local insights contribute to global knowledge without exposing proprietary data</div>
                  </div>
                </div>
              </div>

              {/* LIMS Integration Details */}
              <div className="bg-gray-50 border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Laboratory Information Management Systems (LIMS)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Supported LIMS Platforms</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• LabWare LIMS</div>
                      <div>• Thermo Fisher SampleManager</div>
                      <div>• Agilent OpenLAB</div>
                      <div>• STARLIMS</div>
                      <div>• LabVantage</div>
                      <div>• Custom REST APIs</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Integration Capabilities</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• Real-time test result ingestion</div>
                      <div>• Automated COA generation</div>
                      <div>• Batch release automation</div>
                      <div>• Compliance validation workflows</div>
                      <div>• Quality control monitoring</div>
                      <div>• Audit trail synchronization</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">AI-Enhanced Features</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• Predictive quality analysis</div>
                      <div>• Anomaly detection in test results</div>
                      <div>• Intelligent batch routing</div>
                      <div>• Compliance risk assessment</div>
                      <div>• Method optimization suggestions</div>
                      <div>• Trend analysis and forecasting</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer System Architecture */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Customer System Architecture</h3>
                <div className="space-y-4">
                  <div className="bg-white border border-purple-300 rounded-lg p-4">
                    <div className="text-xs font-mono text-purple-700 space-y-1">
                      <div>customer.formul8.ai/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Customer subdomain</div>
                      <div>├── agents/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Local agent deployment</div>
                      <div>│&nbsp;&nbsp;&nbsp;├── compliance-agent/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# On-premises compliance</div>
                      <div>│&nbsp;&nbsp;&nbsp;├── lims-integration/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Laboratory connectivity</div>
                      <div>│&nbsp;&nbsp;&nbsp;└── local-data/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Proprietary datasets</div>
                      <div>├── integrations/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# System connections</div>
                      <div>│&nbsp;&nbsp;&nbsp;├── lims-connector/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# LIMS API integration</div>
                      <div>│&nbsp;&nbsp;&nbsp;├── erp-sync/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# ERP system sync</div>
                      <div>│&nbsp;&nbsp;&nbsp;└── regulatory-reporting/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# State compliance</div>
                      <div>└── cloud-bridge/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Secure cloud connection</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;├── encrypted-tunnel/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# mTLS communication</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;└── intelligence-sync/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# AI model updates</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3">Local Benefits</h4>
                      <div className="text-sm text-purple-600 space-y-2">
                        <div>• Complete data sovereignty and control</div>
                        <div>• Zero-latency access to internal systems</div>
                        <div>• Customized workflows and business rules</div>
                        <div>• Proprietary data training and fine-tuning</div>
                        <div>• Air-gap deployment options available</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3">Cloud Benefits</h4>
                      <div className="text-sm text-purple-600 space-y-2">
                        <div>• Access to latest AI models and research</div>
                        <div>• Regulatory updates across all states</div>
                        <div>• Industry benchmarking and best practices</div>
                        <div>• Global cannabis knowledge base</div>
                        <div>• Continuous model improvements</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Implementation Timeline */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">Federated Implementation Timeline</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-orange-300 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">Phase 1</div>
                      <div className="text-sm text-orange-700 space-y-1">
                        <div>Local agent deployment</div>
                        <div>Basic LIMS integration</div>
                        <div>4-6 weeks</div>
                      </div>
                    </div>
                    <div className="bg-white border border-orange-300 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">Phase 2</div>
                      <div className="text-sm text-orange-700 space-y-1">
                        <div>Cloud bridge setup</div>
                        <div>mTLS authentication</div>
                        <div>2-3 weeks</div>
                      </div>
                    </div>
                    <div className="bg-white border border-orange-300 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">Phase 3</div>
                      <div className="text-sm text-orange-700 space-y-1">
                        <div>ERP system integration</div>
                        <div>Workflow automation</div>
                        <div>3-4 weeks</div>
                      </div>
                    </div>
                    <div className="bg-white border border-orange-300 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">Phase 4</div>
                      <div className="text-sm text-orange-700 space-y-1">
                        <div>Advanced AI features</div>
                        <div>Federated learning</div>
                        <div>2-3 weeks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
                <CardDescription className="text-formul8-text-secondary">
                  Comprehensive 25-week project roadmap with detailed cost analysis and Gantt chart visualization
                </CardDescription>
