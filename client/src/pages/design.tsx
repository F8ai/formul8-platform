import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from "@/components/PageLayout";
import { BarChart3, Brain, Search, Shield, Users, Beaker } from "lucide-react";

export default function DesignPage() {
  return (
    <PageLayout activeFeature="design">
      <div className="min-h-full bg-formul8-bg-dark text-formul8-text-white overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-formul8-text-primary mb-4">
            Formul8 Platform Design & Architecture
          </h1>
          <p className="text-xl text-formul8-text-secondary max-w-4xl mx-auto">
            Comprehensive AI-powered cannabis operations platform with phased multi-agent AI orchestration, 
            baseline testing system, and federated enterprise integration capabilities.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-max grid-cols-5 gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="architecture" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Architecture</TabsTrigger>
              <TabsTrigger value="agents" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Agents</TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Workflows</TabsTrigger>
              <TabsTrigger value="tech-stack" className="text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">Tech Stack</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Project Overview</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Comprehensive cannabis industry intelligence platform with 12+ specialized AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-formul8-primary/10 border border-formul8-primary rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-formul8-primary mb-2">12+</div>
                    <div className="text-sm text-formul8-text-secondary">Specialized Agents</div>
                  </div>
                  <div className="bg-formul8-secondary/10 border border-formul8-secondary rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-formul8-secondary mb-2">203</div>
                    <div className="text-sm text-formul8-text-secondary">Baseline Questions</div>
                  </div>
                  <div className="bg-formul8-success/10 border border-formul8-success rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-formul8-success mb-2">3</div>
                    <div className="text-sm text-formul8-text-secondary">Deployment Phases</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">System Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Full-stack React application with TypeScript, Express backend, and PostgreSQL database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4">Frontend Architecture</h3>
                      <div className="space-y-3 text-sm text-blue-700">
                        <div><strong>React 18 + TypeScript:</strong> Modern component-based UI with type safety</div>
                        <div><strong>Vite Build System:</strong> Fast development and optimized production builds</div>
                        <div><strong>Tailwind CSS:</strong> Utility-first styling with custom Formul8 brand colors</div>
                        <div><strong>Shadcn/UI Components:</strong> Professional component library built on Radix UI</div>
                        <div><strong>TanStack Query:</strong> Powerful data fetching and state management</div>
                        <div><strong>Wouter Routing:</strong> Lightweight client-side routing solution</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-4">Backend Architecture</h3>
                      <div className="space-y-3 text-sm text-green-700">
                        <div><strong>Node.js + Express:</strong> Scalable server architecture with TypeScript</div>
                        <div><strong>PostgreSQL Database:</strong> Robust relational database with Drizzle ORM</div>
                        <div><strong>OpenAI Integration:</strong> GPT-4o for intelligent agent responses</div>
                        <div><strong>Session Management:</strong> PostgreSQL-backed sessions with Replit Auth</div>
                        <div><strong>RESTful APIs:</strong> Comprehensive API endpoints for all agent operations</div>
                        <div><strong>Real-time Updates:</strong> WebSocket connections for live agent interactions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Multi-Agent Architecture</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  12 specialized AI agents for comprehensive cannabis industry expertise
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Deployment Phasing Strategy</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Progressive deployment approach from MVP baseline system to full cloud-native AI platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Phase 1: MVP Foundation</h3>
                    <div className="space-y-2 text-sm text-green-700">
                      <div><strong>No AWS Cloud:</strong> Local development environment</div>
                      <div><strong>Baseline Q&A:</strong> 203 questions with expected answers</div>
                      <div><strong>6 Core Agents:</strong> Essential cannabis operations</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Phase 2: Enhanced Intelligence</h3>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div><strong>RAG Integration:</strong> FAISS vector stores</div>
                      <div><strong>Specialized Agents:</strong> Science, Spectra, FTO</div>
                      <div><strong>Multi-Model Support:</strong> OpenAI, Anthropic, Google</div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">Phase 3: Production Scale</h3>
                    <div className="space-y-2 text-sm text-purple-700">
                      <div><strong>AWS Cloud:</strong> SageMaker, Bedrock, Lambda</div>
                      <div><strong>Enterprise Features:</strong> Auto-scaling, multi-region</div>
                      <div><strong>Full Integration:</strong> LIMS, ERP, compliance systems</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tech-stack" className="space-y-6">
            <Card className="formul8-card">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary">Technology Stack</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Modern infrastructure supporting containerized agents with comprehensive testing
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <Badge variant="outline" className="mr-2">Replit Auth</Badge>
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

              {/* 4-Phase Implementation Timeline */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 4-Phase Implementation Timeline</h3>
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
          </CardContent>
        </Card>
      </div>
      </div>
    </PageLayout>
  );
}