import { google } from 'googleapis';
import fs from 'fs';

// Load service account credentials
const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));

// Initialize Google APIs with service account
const auth = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/presentations'],
  'dan@syzygyx.com' // Domain-wide delegation
);

const slides = google.slides({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

const CANNABIS_WORKSPACE_ID = '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE';

async function createDesignSlideDecks() {
  console.log('📊 Creating Formul8 Design Document Slide Deck...');
  
  try {
    // Create presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: 'Formul8 AI Platform - System Design & Architecture'
      }
    });

    const presentationId = presentation.data.presentationId;
    console.log(`📝 Created presentation: ${presentationId}`);

    // Define slide content based on design page
    const slideContent = [
      {
        title: "Formul8 AI Platform",
        subtitle: "Cannabis Industry Multi-Agent System Design & Architecture",
        content: [
          "AWS-powered multi-agent AI platform",
          "9 specialized domain experts with cross-verification",
          "Google Workspace integration with professional styling",
          "Production-ready cannabis business operations"
        ]
      },
      {
        title: "Core Capabilities",
        subtitle: "Advanced AI-Powered Cannabis Operations",
        content: [
          "9 specialized AI agents with RDF knowledge bases",
          "LangChain integration with memory and RAG",
          "Google Workspace integration with professional document styling",
          "Agent-to-agent verification for consensus answers",
          "PubMed & scientific literature integration",
          "RDKit molecular analysis capabilities",
          "Real-time performance monitoring & analytics",
          "Cannabis industry regulatory compliance"
        ]
      },
      {
        title: "Google Workspace Integration",
        subtitle: "Professional Document Management System",
        content: [
          "Service account authentication with domain-wide delegation",
          "Real-time Google Docs, Sheets, and Forms creation",
          "Professional styling with structured formatting",
          "Color-coded sections and branded typography",
          "Automated document organization and sharing",
          "Agent-based document editing and version control",
          "Live Implementation: 5 production documents created"
        ]
      },
      {
        title: "9 Specialized AI Agents",
        subtitle: "Domain Expert Coverage",
        content: [
          "🛡️ Compliance Agent - RDF + LangChain with regulatory intelligence",
          "🔬 Science Agent - PubMed integration & evidence validation",
          "⚗️ Formulation Agent - RDKit molecular analysis & design",
          "📈 Marketing Agent - N8N workflows & platform compliance",
          "🏢 Operations Agent - Cultivation & facility optimization",
          "⚖️ Patent Agent - IP protection & trademark management",
          "🔍 Sourcing Agent - Supply chain & vendor management",
          "📊 Spectra Agent - Lab analysis & quality control",
          "👥 Customer Success Agent - Retention & satisfaction"
        ]
      },
      {
        title: "Technical Architecture",
        subtitle: "Production-Ready Infrastructure",
        content: [
          "Frontend: React + TypeScript with Shadcn/ui",
          "Backend: Node.js + Express with PostgreSQL",
          "AI: OpenAI GPT-4o with LangChain orchestration",
          "Database: Neon serverless PostgreSQL with Drizzle ORM",
          "Authentication: Replit OpenID Connect",
          "Storage: FAISS vectorstores with RAG",
          "Knowledge: RDF/Turtle with SPARQL queries",
          "Deployment: Replit with automated workflows"
        ]
      },
      {
        title: "Agent Architecture Details",
        subtitle: "LangChain + RDF + RAG Integration",
        content: [
          "LangChain agents with conversation memory",
          "RDF knowledge bases with Phi-2 SPARQL generation",
          "FAISS vectorstore with semantic search",
          "MCP tools for specialized functions",
          "Baseline testing with GitHub automation",
          "Cross-agent verification for consensus",
          "Real-time performance monitoring",
          "Cannabis-specific domain expertise"
        ]
      },
      {
        title: "Key Performance Metrics",
        subtitle: "Production Targets & Achievements",
        content: [
          "Agent Coverage: 9 specialized domain experts",
          "Response Time: <30s average processing",
          "Accuracy Target: 95%+ with verification",
          "N8N Workflows: 3+ pre-built automations",
          "Document Creation: Real-time Google Workspace",
          "Knowledge Base: RDF + vectorstore integration",
          "Testing: Automated GitHub issue creation",
          "Compliance: Cannabis industry regulations"
        ]
      },
      {
        title: "Cannabis Industry Focus",
        subtitle: "Specialized Domain Expertise",
        content: [
          "Regulatory compliance across multiple states",
          "Product formulation with molecular analysis",
          "Quality control and lab testing protocols",
          "Marketing compliance for restricted platforms",
          "Cultivation optimization and processing",
          "Intellectual property protection",
          "Supply chain and vendor management",
          "Customer success and retention strategies"
        ]
      },
      {
        title: "Document Templates & Styling",
        subtitle: "Professional Cannabis Business Documents",
        content: [
          "CBD Tincture Formulation Sheets with terpene profiles",
          "Cannabis Standard Operating Procedures",
          "Compliance Tracking Dashboards",
          "Lab Results and Quality Control",
          "Marketing Campaign Frameworks",
          "Professional color-coded formatting",
          "Structured typography and branding",
          "Automated template population"
        ]
      },
      {
        title: "Implementation Status",
        subtitle: "Live Production System",
        content: [
          "✅ F8 Cannabis Workspace operational",
          "✅ Google service account with domain delegation",
          "✅ 9 agents with baseline testing",
          "✅ Professional document templates",
          "✅ RDF knowledge bases deployed",
          "✅ LangChain integration complete",
          "✅ Real-time document creation",
          "✅ Cannabis compliance framework"
        ]
      },
      {
        title: "Next Steps & Roadmap",
        subtitle: "Continued Development",
        content: [
          "Enhanced agent cross-verification",
          "Expanded document template library",
          "Advanced analytics and reporting",
          "Mobile application development",
          "API monetization framework",
          "Enterprise deployment options",
          "Additional state compliance",
          "Advanced molecular modeling"
        ]
      }
    ];

    // Create slides with content
    const requests = [];
    
    // Update title slide
    requests.push({
      updateTextStyle: {
        objectId: 'slide_0',
        textRange: { type: 'ALL' },
        style: {
          fontFamily: 'Arial',
          fontSize: { magnitude: 32, unit: 'PT' },
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.5, blue: 0.3 } } }
        },
        fields: 'fontFamily,fontSize,bold,foregroundColor'
      }
    });

    // Add slides for each content section
    for (let i = 0; i < slideContent.length; i++) {
      const content = slideContent[i];
      
      // Create new slide
      requests.push({
        createSlide: {
          objectId: `slide_${i + 1}`,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          },
          placeholderIdMappings: [
            {
              layoutPlaceholder: {
                type: 'TITLE',
                index: 0
              },
              objectId: `title_${i + 1}`
            },
            {
              layoutPlaceholder: {
                type: 'BODY',
                index: 0
              },
              objectId: `body_${i + 1}`
            }
          ]
        }
      });

      // Add title text
      requests.push({
        insertText: {
          objectId: `title_${i + 1}`,
          text: content.title
        }
      });

      // Add subtitle and content
      const bodyText = content.subtitle + '\n\n' + content.content.join('\n');
      requests.push({
        insertText: {
          objectId: `body_${i + 1}`,
          text: bodyText
        }
      });

      // Style title
      requests.push({
        updateTextStyle: {
          objectId: `title_${i + 1}`,
          textRange: { type: 'ALL' },
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 28, unit: 'PT' },
            bold: true,
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.5, blue: 0.3 } } }
          },
          fields: 'fontFamily,fontSize,bold,foregroundColor'
        }
      });

      // Style subtitle
      requests.push({
        updateTextStyle: {
          objectId: `body_${i + 1}`,
          textRange: { startIndex: 0, endIndex: content.subtitle.length },
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 18, unit: 'PT' },
            bold: true,
            italic: true,
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.3, green: 0.6, blue: 0.4 } } }
          },
          fields: 'fontFamily,fontSize,bold,italic,foregroundColor'
        }
      });

      // Style bullet points
      requests.push({
        updateTextStyle: {
          objectId: `body_${i + 1}`,
          textRange: { startIndex: content.subtitle.length + 2, endIndex: bodyText.length },
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 14, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } } }
          },
          fields: 'fontFamily,fontSize,foregroundColor'
        }
      });
    }

    // Apply all requests
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests }
    });

    console.log('🎨 Applied slide content and styling');

    // Move to Cannabis workspace
    await drive.files.update({
      fileId: presentationId,
      addParents: CANNABIS_WORKSPACE_ID,
      fields: 'id, parents'
    });

    console.log('📁 Moved to Cannabis workspace');

    const url = `https://docs.google.com/presentation/d/${presentationId}`;
    console.log(`✅ Formul8 Design Slide Deck created successfully!`);
    console.log(`🔗 URL: ${url}`);
    
    return {
      id: presentationId,
      url: url
    };
    
  } catch (error) {
    console.error('❌ Error creating design slide deck:', error);
    throw error;
  }
}

// Run the creation
createDesignSlideDecks();