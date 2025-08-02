import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Shield, Scale, Cog, FlaskConical, Package, Megaphone, Target, BarChart, CheckCircle, Clock, AlertTriangle, ExternalLink, Github, Zap, Star, Users, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface FeatureIssue {
  number: number;
  title: string;
  url: string;
  state: string;
  labels: string[];
}

interface AgentFeature {
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  implementation: string[];
  apis?: string[];
  kpi?: string;
}

// Helper function to determine if a feature is available in GitHub
const isFeatureInGitHub = (featureName: string): boolean => {
  const githubFeatures = [
    // Core Agent Features
    'RAG Retrieval', 'Retrieval-Augmented Generation', 'Vector Search', 'Embeddings',
    'Database Query', 'SQL Query', 'Database Integration', 'Data Storage',
    'Agent Memory', 'Conversation Memory', 'Context Tracking', 'Session Management',
    'Baseline Testing', 'Test Suite', 'Quality Assurance', 'Automated Testing',
    'Performance Monitoring', 'Metrics', 'Analytics', 'Tracking',
    'Cross-Agent Verification', 'Multi-Agent', 'Agent Coordination', 'Consensus',
    'Issue Creation', 'GitHub Integration', 'Repository Management', 'Version Control',
    'Documentation Generation', 'Auto-Documentation', 'README Generation',
    
    // Scientific & Research Features
    'PubMed Integration', 'PubMed API', 'Literature Search', 'Academic Research',
    'Research Integration', 'Scientific Research', 'Evidence-Based', 'Citation Analysis',
    'Scientific Literature', 'Peer Review', 'Research Papers', 'Academic Sources',
    
    // Compliance & Regulatory Features
    'Regulatory Check', 'Compliance Verification', 'Legal Compliance', 'Regulatory Database',
    'SOP Verification', 'Standard Operating Procedures', 'Process Validation',
    'Regulatory Intelligence', 'Legal Research', 'Compliance Tracking',
    
    // Laboratory & Analysis Features
    'COA Analysis', 'Certificate of Analysis', 'Lab Results', 'Quality Control',
    'GCMS Data', 'Spectral Analysis', 'Chemical Analysis', 'Laboratory Integration',
    'Testing Protocols', 'Quality Assurance', 'Lab Equipment Integration',
    
    // Customer & Business Features
    'Customer Analytics', 'CRM Integration', 'Support Ticket', 'Customer Success',
    'Business Intelligence', 'Customer Data', 'Satisfaction Tracking',
    
    // Technical Infrastructure
    'API Integration', 'REST API', 'Microservices', 'Cloud Integration',
    'Real-time Processing', 'Async Processing', 'Queue Management',
    'Authentication', 'Authorization', 'Security', 'Data Protection',
    
    // Cannabis-Specific Features
    'Cannabis Regulations', 'THC Compliance', 'CBD Analysis', 'Terpene Analysis',
    'Cannabis Testing', 'Potency Testing', 'Microbial Testing', 'Heavy Metals',
    'Cannabis Formulation', 'Product Development', 'Extraction Methods',
    'Cannabis Operations', 'Facility Management', 'Inventory Tracking',
    'Cannabis Marketing', 'Brand Compliance', 'Advertising Restrictions',
    'Cannabis Supply Chain', 'Seed-to-Sale', 'Track and Trace'
  ];
  
  return githubFeatures.some(feature => 
    featureName.toLowerCase().includes(feature.toLowerCase()) ||
    feature.toLowerCase().includes(featureName.toLowerCase()) ||
    // Check for partial matches and synonyms
    (feature.includes('API') && featureName.toLowerCase().includes('integration')) ||
    (feature.includes('Database') && featureName.toLowerCase().includes('storage')) ||
    (feature.includes('Testing') && featureName.toLowerCase().includes('validation')) ||
    (feature.includes('Analytics') && featureName.toLowerCase().includes('dashboard'))
  );
};

export default function Roadmap() {
  const [openSections, setOpenSections] = useState({
    phase1: true,
    phase2: false,
    phase3: false,
    architecture: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch roadmap features
  const { data: roadmapData } = useQuery({
    queryKey: ['/api/roadmap/features'],
    staleTime: 5 * 60 * 1000,
  });

  // Auto-create all missing issues on page load
  useEffect(() => {
    const createMissingIssues = async () => {
      try {
        const response = await fetch('/api/roadmap/create-all-issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          console.log('All GitHub issues created or verified');
        }
      } catch (error) {
        console.log('Issues creation in progress:', error.message);
      }
    };
    createMissingIssues();
  }, []);

  const AgentCard = ({ agent, index }: { agent: any; index: number }) => {
    const agentKey = agent.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const agentFeatures = roadmapData?.features?.[agentKey] || [];
    
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {agent.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {agentFeatures.length} Features
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {agent.kpi}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Primary Responsibilities:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {agent.responsibilities.map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {resp}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Core Functionalities:</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              {agent.functionalities.map((func: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {typeof func === 'string' ? func : func.name}
                    </span>
                    {(typeof func === 'object' && func.inGitHub) || (typeof func === 'string' && isFeatureInGitHub(func)) ? (
                      <Github className="h-3 w-3 text-gray-600 dark:text-gray-400 ml-1" title="Available in GitHub" />
                    ) : null}
                  </div>
                  {typeof func === 'object' && func.subItems && (
                    <ul className="ml-5 space-y-1">
                      {func.subItems.map((subItem: string, subIdx: number) => (
                        <li key={subIdx} className="flex items-start gap-2 text-xs">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                          {subItem}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {agent.internalDatabase && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Internal Database Examples:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {agent.internalDatabase.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {agent.developerConsiderations && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Developer Considerations:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {agent.developerConsiderations.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-sm mb-2">Interacts With:</h4>
            <div className="flex flex-wrap gap-1">
              {agent.interactions.map((interaction: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {interaction}
                </Badge>
              ))}
            </div>
          </div>

          {agentFeatures.length > 0 && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(`https://github.com/F8ai/${agentKey}`, '_blank')}
              >
                <Github className="h-3 w-3 mr-2" />
                View GitHub Repository
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const phase1Agents = [
    {
      name: "Compliance Agent",
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      kpi: "Accuracy of Answer",
      responsibilities: [
        "Provide up-to-date regulatory guidance across jurisdictions for various purposes to the user",
        "Interacts with all agents",
        "Cross-check SOPs, product formulations, and operational practices against internal regulatory databases",
        "Alert users to compliance risks and upcoming regulatory changes, or even upcoming comments, live sessions, or other similar events by regulators. Potential to be tied into existing calendars or event sindicators",
        "Can be defined based on users interests or location",
        "Primary KPI - accuracy of answer"
      ],
      functionalities: [
        {
          name: "Formula & Process Regulatory Check",
          inGitHub: true,
          subItems: [
            "Internal DB check for pre-vetted formulations",
            "External source scan for jurisdiction-specific compliance",
            "Ability to get human verified answers or guidance"
          ]
        },
        {
          name: "SOP Verification",
          inGitHub: true,
          subItems: [
            "Compares user SOPs against trained internal templates and external resources",
            "Adding proprietary Formul8 data and templates will be key here",
            "Including jurisdiction specific SOP requirements",
            "Assesses jurisdictional validity before external lookup",
            "Lookup additional data that is checked for how up to date it is, that we scrub for and keep updated"
          ]
        },
        {
          name: "Facility Compliance & AHJ Code Checks",
          inGitHub: true,
          subItems: [
            "Search internal code references and verify with latest codes",
            "API references for ICC, OSHA, and local safety code access"
          ]
        },
        {
          name: "Licensing Compliance (e.g. CRA)",
          inGitHub: true,
          subItems: [
            "Extracts and parses PDF documents from municipal or state sites",
            "Very important that it has an accurate and solid PDF reader",
            "County-level focus in Phase 1; link to local resources",
            "Phase 2+ expands to more city and local level (depending on the ability to gather and keep updated such data)",
            "May include Simplifya scraping or similar service integration, we would like to identify the strongest solution in this category"
          ]
        },
        {
          name: "Testing Requirements",
          inGitHub: true,
          subItems: [
            "Region-specific required test panels, thresholds",
            "Testing labeling requirements"
          ]
        },
        {
          name: "Marketing Compliance",
          inGitHub: true,
          subItems: [
            "Flags child-appealing language or design",
            "Reviews structure-function claims against FDA or similar guidelines",
            "Work directly and importantly with the FTO agent"
          ]
        },
        {
          name: "Regulator Assistant Sub-Agent",
          inGitHub: true,
          subItems: [
            "Explains complex cannabis processes (e.g. terpene chemistry)",
            "Helps regulators improve rule creation and understanding",
            "Help highlighting important factors related to creating SOPs"
          ]
        },
        {
          name: "Auto-classifies expenses into COGs categories",
          inGitHub: true,
          subItems: [
            "For minimizing 280e losses"
          ]
        }
      ],
      internalDatabase: [
        "SOP templates (state-specific)",
        "Regional compliance guides",
        "Regulatory FAQs and municipal PDFs",
        "Testing panel summaries",
        "Manufacturer Compliance Documents",
        "And more..."
      ],
      developerConsiderations: [
        "Add a confidence scoring layer for compliance suggestions",
        "Enable agent response memory for multi-step verifications"
      ],
      interactions: ["All Agents", "Marketing Agent", "FTO Agent"]
    },
    {
      name: "Patent/Trademark Agent",
      icon: <Scale className="h-5 w-5 text-purple-600" />,
      kpi: "Freedom to Operate",
      responsibilities: [
        "Search patent databases to identify existing intellectual property",
        "Guide users to avoid infringement",
        "Highlight potential 'close calls' as well",
        "Interacts with Compliance and Marketing Agents"
      ],
      functionalities: [
        {
          name: "Patent & Trademark Search",
          inGitHub: true,
          subItems: [
            "Links to USPTO, TSDR, PatentsView APIs",
            "Optionally link to CrossRef and Semantic Scholar"
          ]
        },
        {
          name: "Infringement Risk Assessment",
          inGitHub: true,
          subItems: [
            "Uses prompt pattern recognition to flag risks",
            "'I am not a lawyer' disclaimer"
          ]
        },
        {
          name: "Human-Verified Answer Upsell",
          inGitHub: true,
          subItems: [
            "Allow flagged queries to queue for legal review or upsell to expert"
          ]
        }
      ],
      internalDatabase: [
        "Public patent summaries",
        "Internal logs of filed trademarks by state",
        "Public infringement cases and landmark cases"
      ],
      developerConsiderations: [
        "Allow flagged queries to queue for legal review or upsell to expert"
      ],
      interactions: ["Compliance Agent", "Marketing Agent"]
    },
    {
      name: "Operations & Equipment Agent", 
      icon: <Cog className="h-5 w-5 text-green-600" />,
      kpi: "Operational Efficiency",
      responsibilities: [
        "Support cannabis operators with day-to-day and strategic operations",
        "Calculate product outputs, plan expansions, and maintain equipment",
        "Find solutions to equipment problems",
        "Find recommendations for most efficient use for various equipment and manufacturers",
        "Interacts with compliance agent"
      ],
      functionalities: [
        {
          name: "SOP Creation Assistant",
          inGitHub: true,
          subItems: [
            "Cross-checks against compliance rules",
            "Can be repurposed for license expansions"
          ]
        },
        {
          name: "Operations Calculators",
          inGitHub: true,
          subItems: [
            "Yield, loss, concentration",
            "Terpene blending, infusion ratio estimates",
            "Highlight potential efficiency improvements"
          ]
        },
        {
          name: "Financial Projection Engine",
          inGitHub: true,
          subItems: [
            "Projected cost vs margin analysis (detailed)",
            "Ability to put into multiple financial formats"
          ]
        },
        {
          name: "Equipment Maintenance & Troubleshooting",
          inGitHub: true,
          subItems: [
            "Pulls structured equipment manuals and alert histories"
          ]
        }
      ],
      internalDatabase: [
        "Yield calculators, conversion formulas",
        "Equipment maintenance logs",
        "Licensing expansion samples",
        "Manufacturer specific equipment documents, some not readily available to the public"
      ],
      developerConsiderations: [
        "Integrate equipment prompt responses with internal error resolution dataset",
        "Some of these error codes can be pulled from existing documents, but serve as an easier way to diagnose and correct them"
      ],
      interactions: ["Compliance Agent", "Formulation Agent"]
    },
    {
      name: "Formulation Agent",
      icon: <FlaskConical className="h-5 w-5 text-orange-600" />,
      kpi: "Formulation Quality",
      responsibilities: [
        "Assist in cannabis product development and refinement",
        "Provide chemistry-backed formulation recommendations",
        "Another huge area for upsell, human verified answers and more",
        "Interacts with Compliance, Operations, Marketing agents"
      ],
      functionalities: [
        {
          name: "'Your PhD Formulator' Assistant",
          inGitHub: true,
          subItems: [
            "Guides THC/CBD ratios, terpene profiles, excipient selection",
            "Based on internal formulation science and academic sources",
            "In-house formulation guides and testing results",
            "Ingredient compatibility rules"
          ]
        },
        {
          name: "Academic Integration",
          inGitHub: true,
          subItems: [
            "PubMed, PubChem, and Semantic Scholar APIs",
            "White papers from universities and other reputable organizations",
            "Tie formulation agent to operations agent for yield or cost estimates"
          ]
        },
        {
          name: "Human-Verified Answer Upsell",
          inGitHub: true,
          subItems: [
            "Expert consultation for complex formulations",
            "Professional review of formulation recommendations"
          ]
        }
      ],
      internalDatabase: [
        "In-house formulation guides and testing results",
        "Ingredient compatibility rules",
        "White papers from universities and other reputable organizations"
      ],
      developerConsiderations: [
        "Integrate PubMed, PubChem, and Semantic Scholar APIs",
        "Tie formulation agent to operations agent for yield or cost estimates"
      ],
      interactions: ["Compliance Agent", "Operations Agent", "Marketing Agent"]
    },
    {
      name: "Sourcing Agent",
      icon: <Package className="h-5 w-5 text-teal-600" />,
      kpi: "Sourcing Efficiency",
      responsibilities: [
        "Source materials, equipment, services, and suppliers",
        "Providing accurate and vetted recommendations",
        "Provide a way to contact a recommended vendor",
        "Recommendations on what to avoid",
        "Ability to view a snapshot of a companies reputation score, which we could train on how to calculate",
        "Interacts with all agents"
      ],
      functionalities: [
        {
          name: "Equipment Sourcing",
          inGitHub: true,
          subItems: [
            "Connect to trusted sources defined by us",
            "Possible connection to Supply the Brand excel database",
            "Possible connection to EAG used repository site",
            "Manually loaded database entries",
            "Links to MFG websites"
          ]
        },
        {
          name: "Consumables & Services Sourcing",
          inGitHub: true,
          subItems: [
            "Link to internal preferred vendors and contact forms",
            "Affiliate equipment spreadsheet",
            "Consumables cost lists",
            "Contact form templates",
            "Links to EAG and STB product databases"
          ]
        },
        {
          name: "Packaging Guidance",
          inGitHub: true,
          subItems: [
            "Compliance + Sourcing integration",
            "Auto-submit RFQs or contact requests where allowed",
            "Needs to be tagged that it originated from Formul8"
          ]
        }
      ],
      internalDatabase: [
        "Affiliate equipment spreadsheet",
        "Consumables cost lists",
        "Contact form templates",
        "Links to EAG and STB product databases"
      ],
      developerConsiderations: [
        "Auto-submit RFQs or contact requests where allowed",
        "Needs to be tagged that it originated from Formul8"
      ],
      interactions: ["All Agents"]
    },
    {
      name: "Marketing Agent",
      icon: <Megaphone className="h-5 w-5 text-pink-600" />,
      kpi: "Marketing Compliance",
      responsibilities: [
        "Guide compliant marketing content and validate feasibility of new product strategies",
        "Interacts with Compliance, FTO"
      ],
      functionalities: [
        {
          name: "Copywriting Engine",
          inGitHub: true,
          subItems: [
            "Works with Compliance and FTO Agent to validate content",
            "Product category-specific marketing benchmarks",
            "Compliance limits on claims or visuals by region"
          ]
        },
        {
          name: "Market Feasibility Review",
          inGitHub: true,
          subItems: [
            "Based on pricing, state data, BDSA, Headset integration",
            "Would be good for Formul8 to develop a special relationship where we can access snippets of this data for free to entice the user, then sell a full report via referral, for another revenue generating area"
          ]
        },
        {
          name: "Mockup Images",
          inGitHub: true,
          subItems: [
            "Uses prompt-to-image pipeline (e.g., Unsplash API)",
            "MUST have a high-end image creator, this is extremely important and must be unique"
          ]
        },
        {
          name: "Role-Based Answer Formatting",
          inGitHub: true,
          subItems: [
            "Tailors response for C-Suite, R&D, Compliance, Legal, etc.",
            "Special Note: Should we have role-based answer formatting as a unique feature for all our agents? This would avoid complex prompting on audience or purpose",
            "Clarification Needed: Confirm how user role would be detected: dropdown, login setting, or prompt inference?"
          ]
        }
      ],
      internalDatabase: [
        "Product category-specific marketing benchmarks",
        "Compliance limits on claims or visuals by region"
      ],
      interactions: ["Compliance Agent", "Patent Agent", "Formulation Agent"]
    },
    {
      name: "Science Agent",
      icon: <Target className="h-5 w-5 text-indigo-600" />,
      kpi: "Scientific Accuracy",
      responsibilities: [
        "Evidence-based research analysis",
        "Scientific literature validation",
        "Research methodology guidance",
        "Clinical study interpretation"
      ],
      functionalities: [
        {
          name: "PubMed Research Integration",
          inGitHub: true,
          subItems: [
            "Real-time scientific literature search",
            "Evidence quality assessment",
            "Citation impact analysis"
          ]
        },
        {
          name: "Scientific Claim Validation",
          inGitHub: true,
          subItems: [
            "Systematic evidence review",
            "Research quality scoring",
            "Confidence level assessment"
          ]
        },
        {
          name: "Literature Review Automation",
          inGitHub: true,
          subItems: [
            "Automated systematic reviews",
            "Meta-analysis support",
            "Research gap identification"
          ]
        }
      ],
      internalDatabase: [
        "PubMed abstracts and full-text research papers",
        "Scientific literature quality assessment criteria",
        "Citation impact analysis data",
        "Research methodology evaluation frameworks"
      ],
      developerConsiderations: [
        "Integrate real-time PubMed API for latest research",
        "Implement citation quality scoring algorithms",
        "Add research gap identification algorithms"
      ],
      interactions: ["Formulation Agent", "Compliance Agent"]
    },
    {
      name: "Spectra Agent",
      icon: <BarChart className="h-5 w-5 text-yellow-600" />,
      kpi: "Analysis Accuracy",
      responsibilities: [
        "Lab results interpretation",
        "Quality control analysis",
        "Spectral data processing",
        "Testing protocol optimization"
      ],
      functionalities: [
        {
          name: "COA Analysis",
          inGitHub: true,
          subItems: [
            "Certificate of Analysis interpretation",
            "Quality metrics assessment",
            "Compliance verification"
          ]
        },
        {
          name: "GCMS Data Processing",
          inGitHub: true,
          subItems: [
            "Gas chromatography-mass spectrometry analysis",
            "Compound identification",
            "Quantitative analysis"
          ]
        },
        {
          name: "Quality Control Recommendations",
          inGitHub: true,
          subItems: [
            "Testing protocol optimization",
            "Quality assurance procedures",
            "Method validation guidance"
          ]
        }
      ],
      internalDatabase: [
        "COA templates and interpretation guides",
        "GCMS spectral libraries and compound databases",
        "Quality control benchmarks and standards",
        "Laboratory testing protocols and procedures"
      ],
      developerConsiderations: [
        "Integrate spectral analysis algorithms for compound identification",
        "Add automated quality control checks and alerts",
        "Implement testing protocol optimization recommendations"
      ],
      interactions: ["Compliance Agent", "Formulation Agent"]
    },
    {
      name: "Customer Success Agent",
      icon: <Users className="h-5 w-5 text-red-600" />,
      kpi: "Customer Satisfaction",
      responsibilities: [
        "Client onboarding automation",
        "Customer support optimization",
        "Success metric tracking",
        "Retention strategy development"
      ],
      functionalities: [
        {
          name: "Onboarding Workflow Automation",
          inGitHub: true,
          subItems: [
            "Automated client setup",
            "Training material delivery",
            "Progress tracking"
          ]
        },
        {
          name: "Support Ticket Analysis",
          inGitHub: true,
          subItems: [
            "Issue categorization",
            "Response optimization",
            "Escalation management"
          ]
        },
        {
          name: "Customer Health Scoring",
          inGitHub: true,
          subItems: [
            "Usage pattern analysis",
            "Risk assessment",
            "Success prediction"
          ]
        }
      ],
      internalDatabase: [
        "Customer onboarding workflows and templates",
        "Support ticket categorization and resolution data",
        "Customer health scoring algorithms",
        "Success plan templates and best practices"
      ],
      developerConsiderations: [
        "Implement automated customer health scoring",
        "Add predictive analytics for customer success",
        "Integrate with CRM systems for comprehensive customer view"
      ],
      interactions: ["All Agents"]
    }
  ];

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Formul8 Product Roadmap and Scope of Work</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Modular AI-powered consultant platform for cannabis operators across cultivation, processing, manufacturing, and retail
          </p>
        </div>
        
        {/* Document Purpose */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Document Purpose:</h3>
            <p className="text-muted-foreground">
              This document defines the full scope of work for the development of Formul8, a modular AI-powered consultant platform designed to serve cannabis operators across cultivation, processing, manufacturing, and retail. It is intended for internal developer guidance and will later be adapted for investors and enterprise clients.
            </p>
          </CardContent>
        </Card>

        {/* Core Product Vision */}
        <Card className="border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Core Product Vision:</h3>
            <p className="text-muted-foreground">
              Formul8 leverages multi-agent AI orchestration with internal proprietary datasets and expert system logic. A key differentiator is its <strong>Agent-to-Agent Verification layer</strong>, where multiple specialized agents interact, validate each other's outputs, and generate refined, consensus-based answers for the end user.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kevin's Note */}
      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Kevin's Note from Vrson Call:</h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                <strong>Check for Discrepancies.</strong> Make sure the AI notifies the user when discrepancies are noted. Consider human intervention. Another selling point to ensure hallucinations are minimized and AI answers are production-ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1 - Core Functional Agents */}
      <Collapsible open={openSections.phase1} onOpenChange={() => toggleSection('phase1')}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full p-6 h-auto mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <ChevronRight className={`h-6 w-6 transition-transform ${openSections.phase1 ? 'rotate-90' : ''}`} />
                <div className="text-left">
                  <h2 className="text-2xl font-bold">Phase 1 — Core Functional Agents (Modules)</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    All agents below are to be developed simultaneously as part of the MVP. There is no sequential priority in Phase 1.
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                9 Agents
              </Badge>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {phase1Agents.map((agent, index) => (
              <AgentCard key={index} agent={agent} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Project Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Project Overview & Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">9</div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">AI Agents</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Phase 1 MVP</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{roadmapData?.summary?.totalFeatures || 63}</div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">Total Features</div>
              <div className="text-xs text-green-600 dark:text-green-400">GitHub Tracked</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">$16K</div>
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">MVP Budget</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">2-Month Timeline</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">Multi-Agent</div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Verification</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Key Differentiator</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Considerations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Developer Considerations</CardTitle>
          <CardDescription>Critical implementation notes for the development team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Agent Architecture:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add confidence scoring layer for all agent suggestions</li>
                <li>• Enable agent response memory for multi-step verifications</li>
                <li>• Implement agent-to-agent verification protocols</li>
                <li>• Queue flagged queries for legal/expert review</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Data Integration:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Integrate equipment responses with error resolution datasets</li>
                <li>• Accurate PDF reader for regulatory document parsing</li>
                <li>• Real-time regulatory database updates</li>
                <li>• Human verification upsell integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Integration Status */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Github className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">GitHub Integration Active</h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                All {roadmapData?.summary?.totalFeatures || 63} features are automatically tracked in GitHub issues across 9 agent repositories. 
                Issues are created automatically and linked to this roadmap for seamless development tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}