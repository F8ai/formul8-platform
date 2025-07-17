import { Octokit } from '@octokit/rest';
import { duplicatePreventionService } from './duplicate-prevention';

interface FeatureIssue {
  title: string;
  body: string;
  labels: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  agent: string;
  category: string;
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

export class GitHubFeatureManager {
  private octokit: Octokit;
  private org = 'F8ai';

  constructor() {
    if (!process.env.GITHUB_PAT) {
      throw new Error('GITHUB_PAT environment variable is required');
    }
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PAT,
    });
  }

  // Extract all functionalities from roadmap that need GitHub issues
  private extractRoadmapFunctionalities(): Record<string, AgentFeature[]> {
    const roadmapFunctionalities = {
      'compliance-agent': [
        'Formula & Process Regulatory Check',
        'SOP Verification',
        'Facility Compliance & AHJ Code Checks',
        'Licensing Compliance (e.g. CRA)',
        'Testing Requirements Engine',
        'Real-time Regulatory Updates',
        'Compliance Documentation Generator'
      ],
      'patent-agent': [
        'Prior Art Search Engine',
        'Patent Landscape Analysis',
        'Trademark Search & Analysis',
        'IP Portfolio Management',
        'Freedom to Operate Analysis',
        'Patent Application Assistant',
        'IP Risk Assessment'
      ],
      'operations-agent': [
        'Yield Optimization Engine',
        'Resource Planning System',
        'Financial Projection Engine',
        'Equipment Maintenance & Troubleshooting',
        'Supply Chain Optimization',
        'Production Scheduling',
        'Quality Control Workflows'
      ],
      'formulation-agent': [
        "'Your PhD Formulator' Assistant",
        'Academic Integration',
        'Human-Verified Answer Upsell',
        'Molecular Analysis Engine',
        'Terpene Profile Optimizer',
        'Stability Testing Protocols',
        'Ingredient Compatibility Matrix'
      ],
      'sourcing-agent': [
        'Equipment Sourcing',
        'Consumables & Services Sourcing',
        'Vendor Assessment & Risk Scoring',
        'Supply Chain Intelligence',
        'Cost Optimization Engine',
        'Vendor Relationship Management',
        'Procurement Automation'
      ],
      'marketing-agent': [
        'Market Research & Competitive Intelligence',
        'Creative Content Generation',
        'Mockup Images',
        'Role-Based Answer Formatting',
        'Brand Compliance Checker',
        'Campaign Performance Analytics',
        'Social Media Automation'
      ],
      'science-agent': [
        'PubMed Research Integration',
        'Scientific Claim Validation',
        'Literature Review Automation',
        'Evidence-Based Research Analysis',
        'Clinical Study Design Support',
        'Research Gap Identification',
        'Peer Review Analysis'
      ],
      'spectra-agent': [
        'COA Analysis',
        'GCMS Data Processing',
        'Spectral Pattern Recognition',
        'Quality Metrics Dashboard',
        'Lab Results Interpretation',
        'Testing Protocol Optimization',
        'Data Visualization Engine'
      ],
      'customer-success-agent': [
        'Customer Analytics Dashboard',
        'Onboarding Automation',
        'Support Ticket Intelligence',
        'Customer Health Scoring',
        'Churn Prevention Engine',
        'Success Metrics Tracking',
        'Escalation Management'
      ]
    };

    // Convert to AgentFeature format
    const features: Record<string, AgentFeature[]> = {};
    
    Object.entries(roadmapFunctionalities).forEach(([agentKey, functionalities]) => {
      features[agentKey] = functionalities.map((name, index) => ({
        name,
        description: this.generateFeatureDescription(name, agentKey),
        priority: this.determinePriority(name, index),
        category: this.categorizeFeature(name),
        implementation: this.generateImplementationSteps(name, agentKey),
        apis: this.identifyRequiredAPIs(name, agentKey),
        kpi: this.defineKPI(name, agentKey)
      }));
    });

    return features;
  }

  // Helper methods for feature generation
  private generateFeatureDescription(name: string, agent: string): string {
    const descriptions = {
      'Formula & Process Regulatory Check': 'Internal DB check for pre-vetted formulations with external source scan for jurisdiction-specific compliance',
      'SOP Verification': 'Compare user SOPs against trained internal templates and external resources with jurisdictional validity assessment',
      'COA Analysis': 'Certificate of Analysis interpretation with quality metrics assessment and compliance verification',
      'PubMed Research Integration': 'Real-time scientific literature search with evidence quality assessment and citation impact analysis',
      'Academic Integration': 'PubMed, PubChem, and Semantic Scholar APIs integration with white papers from universities',
      'Customer Analytics Dashboard': 'Customer health scoring with usage pattern analysis, risk assessment, and success prediction',
      "'Your PhD Formulator' Assistant": 'Guides THC/CBD ratios, terpene profiles, excipient selection based on internal formulation science'
    };
    
    return descriptions[name] || `Advanced ${name.toLowerCase()} functionality for ${agent.replace('-agent', '')} operations`;
  }

  private determinePriority(name: string, index: number): 'critical' | 'high' | 'medium' | 'low' {
    const criticalFeatures = ['Formula & Process Regulatory Check', 'SOP Verification', 'COA Analysis', 'PubMed Research Integration'];
    if (criticalFeatures.includes(name)) return 'critical';
    if (index < 3) return 'high';
    if (index < 5) return 'medium';
    return 'low';
  }

  private categorizeFeature(name: string): string {
    if (name.includes('Regulatory') || name.includes('Compliance')) return 'Regulatory Compliance';
    if (name.includes('Analysis') || name.includes('Research')) return 'Data Analysis';
    if (name.includes('Dashboard') || name.includes('Analytics')) return 'User Interface';
    if (name.includes('Integration') || name.includes('API')) return 'System Integration';
    return 'Core Functionality';
  }

  private generateImplementationSteps(name: string, agent: string): string[] {
    const commonSteps = ['LangChain agent setup', 'RAG system integration', 'API endpoint creation', 'Frontend interface'];
    const specificSteps = {
      'PubMed Research Integration': ['PubMed API integration', 'Citation analysis algorithm', 'Evidence quality scoring'],
      'COA Analysis': ['PDF parsing engine', 'Data extraction algorithms', 'Quality metrics calculation'],
      'SOP Verification': ['Template comparison engine', 'Diff highlighting system', 'Compliance checking']
    };
    
    return specificSteps[name] || commonSteps;
  }

  private identifyRequiredAPIs(name: string, agent: string): string[] {
    const apiMappings = {
      'PubMed Research Integration': ['PubMed API', 'PMC API', 'Citation APIs'],
      'Academic Integration': ['PubMed API', 'PubChem API', 'Semantic Scholar API'],
      'COA Analysis': ['Internal Lab APIs', 'PDF processing services'],
      'Formula & Process Regulatory Check': ['Internal regulatory DB', 'State compliance APIs']
    };
    
    return apiMappings[name] || ['Internal APIs', 'External data sources'];
  }

  private defineKPI(name: string, agent: string): string {
    const kpiMappings = {
      'compliance-agent': 'Accuracy of Answer',
      'patent-agent': 'Freedom to Operate',
      'operations-agent': 'Operational Efficiency',
      'formulation-agent': 'Formulation Quality',
      'sourcing-agent': 'Sourcing Efficiency',
      'marketing-agent': 'Marketing ROI',
      'science-agent': 'Scientific Accuracy',
      'spectra-agent': 'Analysis Accuracy',
      'customer-success-agent': 'Customer Satisfaction'
    };
    
    return kpiMappings[agent] || 'Performance Metric';
  }

  // Comprehensive roadmap feature analysis based on the document
  private getRoadmapFeatures(): Record<string, AgentFeature[]> {
    return this.extractRoadmapFunctionalities();
  }

  // Legacy compliance-agent features (keep existing structure)
  private getLegacyFeatures(): Record<string, AgentFeature[]> {
    return {
      'compliance-agent': [
        {
          name: 'Formula & Process Regulatory Check',
          description: 'Internal DB check for pre-vetted formulations with external source scan for jurisdiction-specific compliance',
          priority: 'critical',
          category: 'Core Functionality',
          implementation: ['Vector DB integration', 'GPT-o3 + Sentence-T', 'Pass/fail popup with rule links'],
          apis: ['Internal regulatory DB', 'State compliance APIs'],
          kpi: 'Accuracy of regulatory validation'
        },
        {
          name: 'SOP Verification System',
          description: 'Compare user SOPs against trained internal templates and external resources with jurisdictional validity assessment',
          priority: 'critical',
          category: 'SOP Management',
          implementation: ['Template comparison engine', 'Diff line highlighting', 'Jurisdiction-specific requirements'],
          apis: ['Internal SOP templates', 'External regulatory sources']
        },
        {
          name: 'Facility Compliance & AHJ Code Checks',
          description: 'Search internal code references and verify with latest ICC, OSHA, and local safety codes',
          priority: 'high',
          category: 'Facility Management',
          implementation: ['PDF crawling with OCR', 'Code snippet cards', 'API references integration'],
          apis: ['ICC API', 'OSHA API', 'Local safety codes']
        },
        {
          name: 'Licensing Compliance (CRA)',
          description: 'Extract and parse PDF documents from municipal or state sites with accurate PDF reader',
          priority: 'high',
          category: 'Licensing',
          implementation: ['PDF extraction', 'Municipal site parsing', 'County-level focus'],
          apis: ['Municipal APIs', 'State licensing systems', 'Simplifya integration']
        },
        {
          name: 'Testing Requirements Engine',
          description: 'Region-specific required test panels, thresholds, and labeling requirements',
          priority: 'high',
          category: 'Testing Compliance',
          implementation: ['Regional test panel database', 'Threshold validation', 'Labeling requirements'],
          apis: ['State testing APIs', 'Lab requirement databases']
        },
        {
          name: 'Marketing Compliance Validator',
          description: 'Flag child-appealing language or design and review structure-function claims against FDA guidelines',
          priority: 'high',
          category: 'Marketing Compliance',
          implementation: ['Language analysis', 'Design validation', 'FDA guidelines integration'],
          apis: ['FDA API', 'Marketing compliance databases']
        },
        {
          name: 'Regulator Assistant Sub-Agent',
          description: 'Explain complex cannabis processes and help regulators improve rule creation with SOP highlighting',
          priority: 'medium',
          category: 'Regulatory Support',
          implementation: ['Process explanation engine', 'Rule creation assistance', 'SOP highlighting'],
          apis: ['Educational databases', 'Regulatory training materials']
        },
        {
          name: '280E Expense Classification',
          description: 'Auto-classify expenses into COGs categories for minimizing 280e losses',
          priority: 'medium',
          category: 'Financial Compliance',
          implementation: ['Expense categorization', 'COGs optimization', 'Tax compliance'],
          apis: ['Accounting system APIs', 'Tax regulation databases']
        },
        {
          name: 'Compliance Calendar & Alerts',
          description: 'Alert users to upcoming regulatory changes, comments, live sessions, and regulatory events',
          priority: 'medium',
          category: 'Regulatory Monitoring',
          implementation: ['Event monitoring', 'Calendar integration', 'Alert system'],
          apis: ['Regulatory calendars', 'Event APIs', 'Email/SMS services']
        },
        {
          name: 'Confidence Scoring Layer',
          description: 'Add confidence scoring layer for compliance suggestions with agent response memory',
          priority: 'high',
          category: 'Quality Assurance',
          implementation: ['Confidence algorithms', 'Response memory', 'Multi-step verification'],
          apis: ['Internal scoring APIs', 'Memory management systems']
        }
      ],
      'patent-agent': [
        {
          name: 'Patent & Trademark Search Engine',
          description: 'Search USPTO, TSDR, PatentsView APIs with CrossRef and Semantic Scholar integration',
          priority: 'critical',
          category: 'IP Search',
          implementation: ['Multi-API integration', 'Patent database search', 'Trademark validation'],
          apis: ['USPTO API', 'TSDR API', 'PatentsView API', 'CrossRef API', 'Semantic Scholar API'],
          kpi: 'Patent search accuracy and coverage'
        },
        {
          name: 'Infringement Risk Assessment',
          description: 'Pattern recognition to flag risks with "close calls" highlighting and legal disclaimers',
          priority: 'critical',
          category: 'Risk Analysis',
          implementation: ['Pattern recognition algorithms', 'Risk scoring', 'Legal disclaimer system'],
          apis: ['Patent analysis APIs', 'Legal database APIs']
        },
        {
          name: 'Human-Verified Answer Upsell',
          description: 'Queue flagged queries for legal review with expert consultation upsell',
          priority: 'high',
          category: 'Expert Services',
          implementation: ['Query flagging system', 'Legal review queue', 'Expert consultation flow'],
          apis: ['Expert scheduling APIs', 'Payment processing APIs']
        },
        {
          name: 'Public Patent Database',
          description: 'Maintain internal database of public patent summaries and trademark filings by state',
          priority: 'medium',
          category: 'Database Management',
          implementation: ['Patent summary database', 'State trademark tracking', 'Infringement case logs'],
          apis: ['Patent databases', 'State filing systems']
        },
        {
          name: 'Landmark Case Analysis',
          description: 'Track and analyze public infringement cases and landmark legal decisions',
          priority: 'medium',
          category: 'Legal Analysis',
          implementation: ['Case tracking system', 'Legal analysis engine', 'Precedent database'],
          apis: ['Legal databases', 'Court record APIs']
        }
      ],
      'operations-agent': [
        {
          name: 'SOP Creation Assistant',
          description: 'Cross-check against compliance rules and repurpose for license expansions',
          priority: 'critical',
          category: 'SOP Management',
          implementation: ['SOP builder', 'Compliance integration', 'License expansion templates'],
          apis: ['Compliance APIs', 'Template databases'],
          kpi: 'SOP compliance accuracy'
        },
        {
          name: 'Operations Calculators Suite',
          description: 'Yield, loss, concentration calculations with terpene blending and infusion ratio estimates',
          priority: 'critical',
          category: 'Calculations',
          implementation: ['Calculator engine', 'Formula database', 'Efficiency algorithms'],
          apis: ['Formula APIs', 'Calculation services']
        },
        {
          name: 'Financial Projection Engine',
          description: 'Detailed cost vs margin analysis with multiple financial format outputs',
          priority: 'high',
          category: 'Financial Planning',
          implementation: ['Financial modeling', 'Cost analysis', 'Multiple format exports'],
          apis: ['Financial APIs', 'Accounting integrations']
        },
        {
          name: 'Equipment Maintenance & Troubleshooting',
          description: 'Structured equipment manuals with alert histories and manufacturer-specific documentation',
          priority: 'high',
          category: 'Equipment Management',
          implementation: ['Manual database', 'Alert system', 'Error code diagnosis'],
          apis: ['Manufacturer APIs', 'Equipment databases']
        },
        {
          name: 'Yield Optimization System',
          description: 'Highlight potential efficiency improvements with conversion formulas and loss tracking',
          priority: 'high',
          category: 'Optimization',
          implementation: ['Efficiency algorithms', 'Conversion tracking', 'Optimization recommendations'],
          apis: ['Production tracking APIs', 'Efficiency databases']
        },
        {
          name: '280E Tax Wizard',
          description: 'Parse QuickBooks CSV to generate deductible vs non-deductible expense charts',
          priority: 'medium',
          category: 'Tax Compliance',
          implementation: ['CSV parsing', 'Tax categorization', 'Expense classification'],
          apis: ['QuickBooks API', 'Tax APIs']
        },
        {
          name: 'Equipment Error Code Doctor',
          description: 'Enter equipment error codes to get troubleshooting steps, part links, and downtime estimates',
          priority: 'medium',
          category: 'Troubleshooting',
          implementation: ['Error code database', 'Troubleshooting guides', 'Parts integration'],
          apis: ['Manufacturer APIs', 'Parts supplier APIs']
        }
      ],
      'formulation-agent': [
        {
          name: 'PhD Formulator Assistant',
          description: 'Guide THC/CBD ratios, terpene profiles, and excipient selection based on formulation science',
          priority: 'critical',
          category: 'Formulation Science',
          implementation: ['Ratio optimization', 'Terpene profiling', 'Excipient database'],
          apis: ['PubMed API', 'PubChem API', 'Semantic Scholar API'],
          kpi: 'Formulation success rate and stability'
        },
        {
          name: 'Recipe Builder UI',
          description: 'Interactive sliders for THC/CBD ratio and terpene targets with full GRAS ingredient list output',
          priority: 'critical',
          category: 'User Interface',
          implementation: ['Interactive recipe builder', 'GRAS database integration', 'Real-time calculations'],
          apis: ['GRAS database', 'FDA ingredient APIs']
        },
        {
          name: 'Chemistry Integration Suite',
          description: 'RDKit molecular analysis with DeepChem and ChemAxon integration',
          priority: 'high',
          category: 'Chemical Analysis',
          implementation: ['RDKit integration', 'Molecular modeling', 'Chemical property analysis'],
          apis: ['RDKit APIs', 'ChemAxon APIs', 'DeepChem services']
        },
        {
          name: 'Stability Prediction Engine',
          description: 'Predict shelf-life curves with preservation recommendations like "add citric acid"',
          priority: 'high',
          category: 'Stability Analysis',
          implementation: ['Stability modeling', 'Preservation recommendations', 'Shelf-life prediction'],
          apis: ['Stability databases', 'Preservation APIs']
        },
        {
          name: 'Cost Dashboard Integration',
          description: 'Per-unit COGS calculations with direct links to Sourcing Agent SKUs',
          priority: 'high',
          category: 'Cost Management',
          implementation: ['COGS calculator', 'Sourcing integration', 'Cost optimization'],
          apis: ['Sourcing APIs', 'Pricing databases']
        },
        {
          name: 'Ingredient Compatibility Engine',
          description: 'Analyze ingredient interactions and compatibility rules from internal testing results',
          priority: 'medium',
          category: 'Safety Analysis',
          implementation: ['Compatibility database', 'Interaction analysis', 'Safety recommendations'],
          apis: ['Safety databases', 'Testing result APIs']
        },
        {
          name: 'Academic Integration',
          description: 'Access to white papers from universities and reputable organizations',
          priority: 'medium',
          category: 'Research Access',
          implementation: ['Academic paper access', 'Research database integration', 'Citation tracking'],
          apis: ['University databases', 'Research APIs']
        }
      ],
      'sourcing-agent': [
        {
          name: 'Equipment Sourcing Marketplace',
          description: 'Connect to trusted sources with Supply the Brand Excel and EAG repository integration',
          priority: 'critical',
          category: 'Equipment Sourcing',
          implementation: ['Marketplace integration', 'Vendor database', 'Equipment catalog'],
          apis: ['Supply the Brand API', 'EAG API', 'Vendor APIs'],
          kpi: 'Sourcing cost savings and vendor satisfaction'
        },
        {
          name: 'Vendor Reputation Scoring',
          description: 'Calculate and display company reputation scores with recommendation filtering',
          priority: 'critical',
          category: 'Vendor Management',
          implementation: ['Reputation algorithms', 'Score calculation', 'Review aggregation'],
          apis: ['Review APIs', 'Business rating services']
        },
        {
          name: 'Auto-RFQ System',
          description: 'Automatically submit RFQs with templated emails, specs, and NDAs to vendors',
          priority: 'high',
          category: 'Procurement Automation',
          implementation: ['RFQ automation', 'Email templates', 'NDA integration'],
          apis: ['Email APIs', 'Document management APIs']
        },
        {
          name: 'Consumables & Services Database',
          description: 'Internal preferred vendors with contact forms and cost tracking',
          priority: 'high',
          category: 'Supplier Management',
          implementation: ['Vendor database', 'Contact management', 'Cost tracking'],
          apis: ['Vendor APIs', 'Pricing services']
        },
        {
          name: 'Packaging Guidance System',
          description: 'Compliance-aware packaging recommendations with regulatory validation',
          priority: 'high',
          category: 'Packaging Compliance',
          implementation: ['Packaging database', 'Compliance validation', 'Regulatory checking'],
          apis: ['Packaging APIs', 'Compliance databases']
        },
        {
          name: 'Revenue Commission System',
          description: 'Affiliate equipment spreadsheet with commission tracking and referral management',
          priority: 'medium',
          category: 'Revenue Generation',
          implementation: ['Commission tracking', 'Affiliate management', 'Revenue analytics'],
          apis: ['Payment APIs', 'Affiliate tracking services']
        },
        {
          name: 'Lead Time Optimization',
          description: 'Track and optimize supplier lead times with MOQ management',
          priority: 'medium',
          category: 'Supply Chain',
          implementation: ['Lead time tracking', 'MOQ optimization', 'Supply chain analytics'],
          apis: ['Supplier APIs', 'Logistics services']
        }
      ],
      'marketing-agent': [
        {
          name: 'Copywriting Engine',
          description: 'Generate compliant marketing content with Compliance and FTO Agent validation',
          priority: 'critical',
          category: 'Content Generation',
          implementation: ['Copy generation', 'Compliance validation', 'Multi-format output'],
          apis: ['Compliance APIs', 'Content generation services'],
          kpi: 'Marketing compliance rate and engagement'
        },
        {
          name: 'Market Feasibility Engine',
          description: 'Pricing analysis with BDSA and Headset integration for market data',
          priority: 'critical',
          category: 'Market Analysis',
          implementation: ['Market analysis', 'Pricing optimization', 'Competitor tracking'],
          apis: ['BDSA API', 'Headset API', 'Market data services']
        },
        {
          name: 'High-End Image Generation',
          description: 'Unique, professional image creation with brand colors and compliance checking',
          priority: 'high',
          category: 'Visual Content',
          implementation: ['Advanced image generation', 'Brand compliance', 'Visual validation'],
          apis: ['SDXL API', 'DALL-E 3 API', 'Image generation services']
        },
        {
          name: 'Role-Based Answer Formatting',
          description: 'Tailor responses for C-Suite, R&D, Compliance, Legal roles with appropriate messaging',
          priority: 'high',
          category: 'Communication',
          implementation: ['Role detection', 'Response formatting', 'Audience optimization'],
          apis: ['User management APIs', 'Content formatting services']
        },
        {
          name: 'Copy Studio Suite',
          description: 'Product name to taglines, blurbs, SMS content with compliance checking',
          priority: 'high',
          category: 'Content Studio',
          implementation: ['Multi-format copy generation', 'Character limits', 'Compliance validation'],
          apis: ['Content APIs', 'Compliance checking services']
        },
        {
          name: 'Marketing Benchmarks Database',
          description: 'Product category-specific marketing benchmarks with regional compliance limits',
          priority: 'medium',
          category: 'Benchmarking',
          implementation: ['Benchmark database', 'Category analysis', 'Regional compliance tracking'],
          apis: ['Benchmark APIs', 'Regional compliance databases']
        },
        {
          name: 'Campaign Performance Analytics',
          description: 'Track marketing campaign effectiveness with ROI analysis',
          priority: 'medium',
          category: 'Analytics',
          implementation: ['Campaign tracking', 'ROI analysis', 'Performance metrics'],
          apis: ['Analytics APIs', 'Campaign management services']
        }
      ],
      'science-agent': [
        {
          name: 'PubMed Integration Suite',
          description: 'Evidence-based research analysis with scientific literature validation',
          priority: 'critical',
          category: 'Research Integration',
          implementation: ['PubMed API integration', 'Literature analysis', 'Evidence validation'],
          apis: ['PubMed API', 'Scientific databases'],
          kpi: 'Research accuracy and citation quality'
        },
        {
          name: 'Scientific Claim Validation',
          description: 'Validate scientific claims against peer-reviewed literature with confidence scoring',
          priority: 'critical',
          category: 'Validation',
          implementation: ['Claim analysis', 'Literature matching', 'Confidence scoring'],
          apis: ['Scientific databases', 'Validation services']
        },
        {
          name: 'Research Trend Analysis',
          description: 'Identify emerging trends in cannabis research with impact metrics',
          priority: 'high',
          category: 'Trend Analysis',
          implementation: ['Trend detection', 'Impact analysis', 'Research mapping'],
          apis: ['Research trend APIs', 'Citation analysis services']
        },
        {
          name: 'Evidence Quality Assessment',
          description: 'Systematic evidence quality scoring with high/moderate/low classification',
          priority: 'high',
          category: 'Quality Assessment',
          implementation: ['Evidence scoring', 'Quality metrics', 'Classification system'],
          apis: ['Quality assessment APIs', 'Evidence databases']
        },
        {
          name: 'Meta-Analysis Support',
          description: 'Support for systematic reviews and meta-analysis of cannabis research',
          priority: 'medium',
          category: 'Research Methods',
          implementation: ['Meta-analysis tools', 'Systematic review support', 'Data aggregation'],
          apis: ['Research aggregation APIs', 'Statistical analysis services']
        },
        {
          name: 'Research Gap Identification',
          description: 'Identify gaps in current cannabis research for R&D opportunities',
          priority: 'medium',
          category: 'Research Planning',
          implementation: ['Gap analysis', 'Research opportunity mapping', 'R&D recommendations'],
          apis: ['Research mapping APIs', 'Grant databases']
        }
      ],
      'spectra-agent': [
        {
          name: 'DreaMS Tensor Integration',
          description: 'File drag-drop for mzML processing with potency and terpene analysis in <120s',
          priority: 'critical',
          category: 'Spectral Analysis',
          implementation: ['mzML processing', 'DreaMS integration', 'Real-time analysis'],
          apis: ['DreaMS API', 'Spectral databases'],
          kpi: 'Analysis speed and accuracy'
        },
        {
          name: 'Unknown Compound Detection',
          description: 'Cluster novel peaks and link to Formulation agent for R&D opportunities',
          priority: 'critical',
          category: 'Compound Discovery',
          implementation: ['Peak clustering', 'Novel compound detection', 'R&D integration'],
          apis: ['Compound databases', 'Formulation APIs']
        },
        {
          name: 'ISO-Ready COA Generation',
          description: 'Auto-formatted PDF COAs with inline chromatograms for regulatory compliance',
          priority: 'high',
          category: 'Report Generation',
          implementation: ['PDF generation', 'Chromatogram integration', 'ISO formatting'],
          apis: ['PDF generation APIs', 'ISO template services']
        },
        {
          name: 'React Dropzone Interface',
          description: 'Drag-and-drop interface for spectrum files with progress tracking',
          priority: 'high',
          category: 'User Interface',
          implementation: ['File upload interface', 'Progress tracking', 'Error handling'],
          apis: ['File upload APIs', 'Progress tracking services']
        },
        {
          name: 'Metadata Preservation System',
          description: 'Read and preserve instrument settings from spectrum file metadata',
          priority: 'high',
          category: 'Data Integrity',
          implementation: ['Metadata extraction', 'Parameter preservation', 'Method tracking'],
          apis: ['Metadata APIs', 'Instrument databases']
        },
        {
          name: 'Contaminant Detection',
          description: 'Identify and flag contaminants with regulatory compliance checking',
          priority: 'medium',
          category: 'Safety Analysis',
          implementation: ['Contaminant detection', 'Safety flagging', 'Regulatory compliance'],
          apis: ['Contaminant databases', 'Safety APIs']
        },
        {
          name: 'Multi-Format Support',
          description: 'Support for mzML, mzXML, MGF formats with vendor data conversion',
          priority: 'medium',
          category: 'Format Support',
          implementation: ['Multi-format parsing', 'Vendor compatibility', 'Data conversion'],
          apis: ['Format conversion APIs', 'Vendor APIs']
        }
      ],
      'customer-success-agent': [
        {
          name: 'Customer Profile Analysis',
          description: 'Analyze customer behavior patterns with satisfaction trend tracking',
          priority: 'critical',
          category: 'Customer Analytics',
          implementation: ['Behavior analysis', 'Satisfaction tracking', 'Trend analysis'],
          apis: ['Analytics APIs', 'Customer data platforms'],
          kpi: 'Customer satisfaction and retention rates'
        },
        {
          name: 'Onboarding Support System',
          description: 'Guide customers through onboarding with automated support workflows',
          priority: 'critical',
          category: 'Onboarding',
          implementation: ['Onboarding workflows', 'Automated guidance', 'Progress tracking'],
          apis: ['Onboarding APIs', 'Progress tracking services']
        },
        {
          name: 'Issue Resolution Engine',
          description: 'Automated issue classification with resolution time tracking and escalation',
          priority: 'high',
          category: 'Support',
          implementation: ['Issue classification', 'Resolution tracking', 'Escalation workflows'],
          apis: ['Support ticket APIs', 'Resolution tracking services']
        },
        {
          name: 'Retention Strategy Engine',
          description: 'Develop data-driven strategies to improve customer retention',
          priority: 'high',
          category: 'Retention',
          implementation: ['Retention analysis', 'Strategy recommendations', 'Intervention triggers'],
          apis: ['Customer analytics APIs', 'Retention tracking services']
        },
        {
          name: 'Success Metrics Dashboard',
          description: 'Calculate and report customer success KPIs with predictive analytics',
          priority: 'high',
          category: 'Metrics',
          implementation: ['KPI calculation', 'Predictive analytics', 'Dashboard visualization'],
          apis: ['Analytics APIs', 'Dashboard services']
        },
        {
          name: 'Escalation Management',
          description: 'Manage high-priority customer issues with automated escalation workflows',
          priority: 'medium',
          category: 'Escalation',
          implementation: ['Priority scoring', 'Escalation workflows', 'Executive engagement'],
          apis: ['Escalation APIs', 'Executive notification services']
        },
        {
          name: 'Knowledge Base Integration',
          description: 'Search customer success knowledge base for solutions and best practices',
          priority: 'medium',
          category: 'Knowledge Management',
          implementation: ['Knowledge search', 'Best practices database', 'Solution recommendations'],
          apis: ['Knowledge base APIs', 'Search services']
        }
      ]
    };
  }

  async createFeatureIssues(agentName: string): Promise<any[]> {
    const features = this.getRoadmapFeatures()[agentName];
    if (!features) {
      throw new Error(`No features found for agent: ${agentName}`);
    }

    // CRITICAL: Check for existing issues first to prevent duplicates
    const existingIssues = await this.getExistingFeatureIssues(agentName);
    const existingTitles = new Set(existingIssues.map(issue => issue.title));

    console.log(`Found ${existingIssues.length} existing feature issues for ${agentName}`);

    const results = [];
    for (const feature of features) {
      try {
        const issueTitle = `Feature: ${feature.name}`;
        
        // DUPLICATE PREVENTION: Skip if issue already exists
        if (existingTitles.has(issueTitle)) {
          results.push({
            success: true,
            feature: feature.name,
            action: 'skipped_duplicate',
            message: `Issue already exists: ${issueTitle}`,
            existingIssue: existingIssues.find(issue => issue.title === issueTitle)?.number
          });
          console.log(`Skipping duplicate: ${issueTitle}`);
          continue;
        }

        const issueBody = this.generateIssueBody(feature);
        const labels = this.generateLabels(feature);

        // Use safe creation service with comprehensive duplicate prevention
        const creationResult = await duplicatePreventionService.safeCreateIssue(
          this.octokit,
          this.org,
          agentName,
          {
            title: issueTitle,
            body: issueBody,
            labels: labels
          }
        );

        if (creationResult.success && creationResult.data) {
          // Add detailed implementation comment to the issue
          try {
            await this.addDetailedImplementationComment(agentName, creationResult.data.number, feature);
          } catch (commentError) {
            console.log(`Could not add comment to issue ${creationResult.data.number}: ${commentError.message}`);
          }

          results.push({
            success: true,
            feature: feature.name,
            action: 'created',
            issueUrl: creationResult.data.html_url,
            issueNumber: creationResult.data.number
          });

          console.log(`Created new issue: ${issueTitle} (#${creationResult.data.number})`);
        } else {
          // Issue creation was prevented or failed
          results.push({
            success: false,
            feature: feature.name,
            action: creationResult.action,
            message: creationResult.message
          });

          console.log(`Issue creation prevented: ${issueTitle} - ${creationResult.message}`);
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          feature: feature.name,
          error: error.message
        });
      }
    }

    return results;
  }

  async createAllAgentFeatures(): Promise<Record<string, any[]>> {
    const agents = Object.keys(this.getRoadmapFeatures());
    const results: Record<string, any[]> = {};

    console.log(`🛡️ DUPLICATE PREVENTION: Starting feature creation with safeguards for ${agents.length} agents`);

    for (const agent of agents) {
      console.log(`Creating features for ${agent}...`);
      try {
        results[agent] = await this.createFeatureIssues(agent);
        
        const summary = results[agent].reduce((acc, result) => {
          if (result.action === 'created') acc.created++;
          if (result.action === 'skipped_duplicate') acc.skipped++;
          if (!result.success) acc.errors++;
          return acc;
        }, { created: 0, skipped: 0, errors: 0 });
        
        console.log(`${agent} summary: ${summary.created} created, ${summary.skipped} skipped (duplicates), ${summary.errors} errors`);
      } catch (error) {
        results[agent] = [{ success: false, error: error.message }];
      }
      
      // Wait 2 seconds between agents to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  async addDetailedImplementationComment(agentName: string, issueNumber: number, feature: AgentFeature): Promise<void> {
    const implementationComment = this.generateDetailedImplementationComment(feature, agentName);
    
    await this.octokit.rest.issues.createComment({
      owner: this.org,
      repo: agentName,
      issue_number: issueNumber,
      body: implementationComment
    });
  }

  private generateDetailedImplementationComment(feature: AgentFeature, agentName: string): string {
    const comment = `## 🚀 Detailed Implementation Plan

### Overview
This feature implements **${feature.name}** for the ${agentName} agent, focusing on ${feature.description.toLowerCase()}.

### Technical Architecture

#### Core Components
${feature.implementation.map(impl => `- **${impl}**: Implementation strategy for ${impl.toLowerCase()}`).join('\n')}

#### Required APIs & Integrations
${feature.apis ? feature.apis.map(api => `- **${api}**: Integration required for data access and functionality`).join('\n') : '- Internal APIs and data sources as needed'}

### Implementation Steps

#### Phase 1: Foundation Setup (Week 1-2)
1. **Project Structure Setup**
   - Create dedicated module in \`${agentName}/src/features/${feature.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}/\`
   - Implement base classes and interfaces
   - Set up configuration management

2. **API Integration Layer**
   - Implement API client classes for required external services
   - Add authentication and rate limiting
   - Create data transformation utilities

#### Phase 2: Core Logic Implementation (Week 3-4)
1. **Business Logic Development**
   ${this.generateCoreLogicSteps(feature, agentName)}

2. **Data Processing Pipeline**
   - Input validation and sanitization
   - Data transformation and enrichment
   - Output formatting and quality checks

#### Phase 3: Agent Integration (Week 5-6)
1. **LangChain Integration**
   - Create custom tools for LangChain agent
   - Implement memory and context management
   - Add conversation flow handling

2. **RAG Enhancement**
   - Build domain-specific knowledge base
   - Implement vector embeddings for feature-specific data
   - Add retrieval augmentation for improved responses

#### Phase 4: Testing & Optimization (Week 7-8)
1. **Comprehensive Testing**
   - Unit tests for all core functions
   - Integration tests with external APIs
   - Agent conversation testing

2. **Performance Optimization**
   - Response time optimization
   - Memory usage optimization
   - Error handling and resilience

### Success Criteria
- **Primary KPI**: ${feature.kpi || this.defineKPI(feature.name, agentName)}
- **Performance**: Response time < 3 seconds for 95% of requests
- **Accuracy**: ${this.getAccuracyTarget(feature, agentName)}
- **Integration**: Seamless integration with existing agent workflows

### Testing Strategy
1. **Automated Testing**
   - Jest/Vitest unit tests with 90%+ coverage
   - Integration tests for API endpoints
   - End-to-end agent conversation tests

2. **Manual Testing**
   - User acceptance testing scenarios
   - Cannabis industry expert validation
   - Cross-agent interaction testing

### Documentation Requirements
1. **Technical Documentation**
   - API documentation with OpenAPI specs
   - Code documentation with inline comments
   - Integration guides for other agents

2. **User Documentation**
   - Feature usage guides
   - Example conversations and workflows
   - Troubleshooting and FAQ

### Cannabis Industry Considerations
${this.getCannabisSpecificConsiderations(feature, agentName)}

### Deployment Plan
1. **Development Environment**: Feature branch with continuous integration
2. **Staging Environment**: Integration testing with full agent ecosystem
3. **Production Deployment**: Phased rollout with monitoring and rollback capability

### Risk Mitigation
- **Data Accuracy**: Multi-source validation and confidence scoring
- **API Dependencies**: Fallback mechanisms and caching strategies
- **Compliance**: Regular updates with changing cannabis regulations
- **Performance**: Load testing and horizontal scaling preparation

---
*This implementation plan follows Formul8's multi-agent AI orchestration architecture with agent-to-agent verification for production-ready cannabis industry solutions.*`;

    return comment;
  }

  private generateCoreLogicSteps(feature: AgentFeature, agentName: string): string {
    const categorySteps = {
      'Core Functionality': `   - Implement primary feature logic with error handling
   - Add data validation and business rule enforcement
   - Create response formatting and quality assurance`,
      'User Interface': `   - Design responsive UI components
   - Implement interactive elements and real-time updates
   - Add accessibility and mobile support`,
      'API Integration': `   - Set up external API connections with authentication
   - Implement data synchronization and caching
   - Add error handling and retry mechanisms`,
      'Data Processing': `   - Build data ingestion and transformation pipelines
   - Implement validation and quality checks
   - Create data export and reporting features`,
      'Analysis': `   - Develop analytical algorithms and scoring methods
   - Implement pattern recognition and trend analysis
   - Add visualization and reporting capabilities`
    };

    return categorySteps[feature.category] || `   - Implement core ${feature.category.toLowerCase()} functionality
   - Add business logic specific to ${feature.name}
   - Create integration points with other agent components`;
  }

  private getAccuracyTarget(feature: AgentFeature, agentName: string): string {
    const accuracyTargets = {
      'compliance-agent': '95%+ regulatory accuracy with legal review validation',
      'patent-agent': '90%+ prior art coverage with expert verification',
      'formulation-agent': '85%+ formulation success rate with stability testing',
      'operations-agent': '90%+ efficiency improvement predictions',
      'sourcing-agent': '95%+ vendor recommendation accuracy',
      'marketing-agent': '100% compliance with platform advertising policies',
      'science-agent': '95%+ scientific claim validation accuracy',
      'spectra-agent': '98%+ analytical result interpretation accuracy',
      'customer-success-agent': '90%+ customer satisfaction improvement'
    };

    return accuracyTargets[agentName] || '90%+ feature-specific accuracy metrics';
  }

  private getCannabisSpecificConsiderations(feature: AgentFeature, agentName: string): string {
    const considerations = {
      'compliance-agent': `- **Regulatory Complexity**: Cannabis laws vary significantly by state and locality
- **Real-time Updates**: Regulations change frequently, requiring dynamic update mechanisms
- **Multi-jurisdictional**: Support for multiple state compliance frameworks simultaneously
- **Audit Trail**: Complete documentation for regulatory inspections and compliance reviews`,
      
      'patent-agent': `- **Cannabis Patent Landscape**: Rapidly evolving IP landscape with many pending applications
- **State vs Federal**: Navigate complex federal/state legal framework differences
- **Prior Art Challenges**: Limited historical patent data for cannabis-specific innovations
- **Trademark Restrictions**: Platform-specific advertising and trademark limitations`,
      
      'formulation-agent': `- **Cannabinoid Stability**: Account for degradation and stability of cannabis compounds
- **Terpene Interactions**: Complex terpene synergy effects and stability considerations
- **Regulatory Limits**: THC/CBD limits vary by state and product category
- **GRAS Ingredients**: Ensure all ingredients are Generally Recognized as Safe`,
      
      'operations-agent': `- **Seed-to-Sale Tracking**: Integration with state tracking systems (Metrc, CCTT, etc.)
- **Testing Requirements**: Mandatory testing panels vary by state and product type
- **Inventory Management**: Cannabis-specific inventory and waste tracking requirements
- **Security Compliance**: Enhanced security requirements for cannabis operations`,
      
      'sourcing-agent': `- **Licensed Vendors**: Ensure all vendors are properly licensed for cannabis business
- **Interstate Commerce**: Navigate complex interstate cannabis commerce restrictions
- **Equipment Certification**: Cannabis-specific equipment certifications and requirements
- **Supply Chain Transparency**: Enhanced traceability requirements for cannabis products`,
      
      'marketing-agent': `- **Platform Restrictions**: Facebook, Google, Instagram advertising limitations
- **Claim Validation**: Strict requirements for health and wellness claims
- **Age Verification**: Robust age verification and geographic restrictions
- **Compliance Monitoring**: Real-time compliance checking across platforms`,
      
      'science-agent': `- **Cannabis Research**: Limited clinical research data due to federal restrictions
- **Endocannabinoid System**: Specialized knowledge of cannabis-human interaction
- **Dosing Guidelines**: Lack of standardized dosing for different consumption methods
- **Research Gaps**: Identification of areas needing additional scientific validation`,
      
      'spectra-agent': `- **Cannabis Testing Standards**: State-specific testing requirements and methodologies
- **Potency Analysis**: Accurate THC/CBD quantification across product types
- **Contaminant Detection**: Pesticide, heavy metals, and microbial testing requirements
- **Terpene Profiling**: Comprehensive terpene analysis for effect prediction`,
      
      'customer-success-agent': `- **Industry Education**: Many customers new to cannabis business operations
- **Compliance Support**: Ongoing guidance for evolving regulatory landscape
- **Business Maturity**: Mix of startups and established businesses with different needs
- **Stigma Sensitivity**: Professional approach to historically stigmatized industry`
    };

    return considerations[agentName] || `- **Cannabis Industry Focus**: Specialized considerations for cannabis business operations
- **Regulatory Environment**: Navigate complex and evolving cannabis regulations
- **Industry Standards**: Implement cannabis-specific best practices and standards
- **Professional Standards**: Maintain high professional standards in emerging industry`;
  }

  async addImplementationCommentsToExistingIssues(agentName?: string): Promise<Record<string, any[]>> {
    const agents = agentName ? [agentName] : Object.keys(this.getRoadmapFeatures());
    const results: Record<string, any[]> = {};

    for (const agent of agents) {
      console.log(`Adding implementation comments for ${agent}...`);
      const agentResults = [];
      
      try {
        // Get existing issues for this agent
        const issues = await this.octokit.rest.issues.listForRepo({
          owner: this.org,
          repo: agent,
          labels: 'feature',
          state: 'open',
          per_page: 100
        });

        const features = this.getRoadmapFeatures()[agent] || [];
        
        for (const issue of issues.data) {
          // Find matching feature for this issue
          const featureName = issue.title.replace('Feature: ', '');
          const matchingFeature = features.find(f => f.name === featureName);
          
          if (matchingFeature) {
            try {
              // Check if implementation comment already exists
              const comments = await this.octokit.rest.issues.listComments({
                owner: this.org,
                repo: agent,
                issue_number: issue.number
              });

              const hasImplementationComment = comments.data.some(comment => 
                comment.body.includes('🚀 Detailed Implementation Plan')
              );

              if (!hasImplementationComment) {
                await this.addDetailedImplementationComment(agent, issue.number, matchingFeature);
                agentResults.push({
                  success: true,
                  issue: issue.number,
                  title: issue.title,
                  message: 'Implementation comment added'
                });
              } else {
                agentResults.push({
                  success: true,
                  issue: issue.number,
                  title: issue.title,
                  message: 'Implementation comment already exists'
                });
              }

              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              agentResults.push({
                success: false,
                issue: issue.number,
                title: issue.title,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        agentResults.push({
          success: false,
          error: `Failed to process ${agent}: ${error.message}`
        });
      }

      results[agent] = agentResults;
      
      // Wait between agents
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  async getExistingFeatureIssues(agentName: string): Promise<any[]> {
    try {
      const issues = await this.octokit.rest.issues.listForRepo({
        owner: this.org,
        repo: agentName,
        labels: 'feature',
        state: 'all'
      });

      return issues.data.map(issue => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        labels: issue.labels.map(label => typeof label === 'string' ? label : label.name)
      }));
    } catch (error) {
      console.error(`Error fetching issues for ${agentName}:`, error);
      return [];
    }
  }

  private generateIssueBody(feature: AgentFeature): string {
    return `## Feature Description
${feature.description}

## Priority
${feature.priority.toUpperCase()}

## Category
${feature.category}

## Implementation Requirements
${feature.implementation.map(req => `- ${req}`).join('\n')}

${feature.apis ? `## Required APIs
${feature.apis.map(api => `- ${api}`).join('\n')}` : ''}

${feature.kpi ? `## Success Metrics
- ${feature.kpi}` : ''}

## Acceptance Criteria
- [ ] Feature implementation meets all requirements
- [ ] Integration tests pass
- [ ] Performance meets specified benchmarks
- [ ] Documentation is complete
- [ ] Security review completed (if applicable)

## Related Agents
This feature may require coordination with other agents in the Formul8 ecosystem for optimal integration.

---
*This issue was automatically generated from the Formul8 Product Roadmap*`;
  }

  private generateLabels(feature: AgentFeature): string[] {
    const labels = ['feature', feature.priority];
    
    // Add category-based labels
    if (feature.category.toLowerCase().includes('api')) labels.push('api');
    if (feature.category.toLowerCase().includes('ui')) labels.push('ui');
    if (feature.category.toLowerCase().includes('database')) labels.push('database');
    if (feature.category.toLowerCase().includes('compliance')) labels.push('compliance');
    if (feature.category.toLowerCase().includes('integration')) labels.push('integration');
    
    // Add specific labels
    if (feature.apis && feature.apis.length > 0) labels.push('external-api');
    if (feature.implementation.some(impl => impl.toLowerCase().includes('machine learning'))) labels.push('ml');
    if (feature.implementation.some(impl => impl.toLowerCase().includes('ai'))) labels.push('ai');
    
    return labels;
  }

  async addDetailedImplementationComment(repo: string, issueNumber: number, feature: AgentFeature): Promise<any> {
    try {
      const implementationPlan = this.generateDetailedImplementationPlan(feature, repo);
      
      const comment = `## 🔧 Detailed Implementation Approach

${implementationPlan.overview}

### 📋 Implementation Steps

${implementationPlan.steps.map((step, index) => `**${index + 1}. ${step.title}**

${step.description}

\`\`\`${step.language || 'bash'}
${step.code}
\`\`\``).join('\n\n')}

### 🎯 Success Criteria
${implementationPlan.successCriteria.map(criteria => `- ${criteria}`).join('\n')}

### 📊 Testing Strategy
${implementationPlan.testing.map(test => `- ${test}`).join('\n')}

### 🔗 Dependencies
${implementationPlan.dependencies.map(dep => `- ${dep}`).join('\n')}

### 📈 Performance Metrics
- **KPI**: ${feature.kpi || 'Standard performance metrics'}
- **Priority**: ${feature.priority}
- **Category**: ${feature.category}

### 🔄 Integration Points
- Agent Memory System for conversation continuity
- Cross-agent verification for quality assurance
- Real-time metrics collection for performance monitoring
- Frontend dashboard integration for user experience

---
*Generated by Formul8 Implementation Planning System*`;

      const response = await this.octokit.rest.issues.createComment({
        owner: this.org,
        repo,
        issue_number: issueNumber,
        body: comment,
      });

      return response.data;
    } catch (error) {
      console.error(`Error adding implementation comment to issue ${issueNumber} in ${repo}:`, error.message);
      throw error;
    }
  }

  private generateDetailedImplementationPlan(feature: AgentFeature, repo: string): any {
    const agentName = repo.replace('-agent', '');
    
    // Feature-specific implementation plans
    const implementationPlans = {
      'Formula & Process Regulatory Check': {
        overview: `Implement a comprehensive regulatory validation system that cross-references formulations against internal databases and external compliance sources. This system will provide real-time pass/fail feedback with direct links to relevant regulations.`,
        steps: [
          {
            title: 'Set up Vector Database Integration',
            description: 'Configure FAISS vectorstore for regulatory document embeddings',
            language: 'python',
            code: `from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings

# Initialize vector database for regulatory documents
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.load_local("./rag/vectorstore", embeddings)

def check_regulatory_compliance(formulation, jurisdiction):
    # Query vector database for relevant regulations
    docs = vectorstore.similarity_search(f"{formulation} {jurisdiction}", k=5)
    return analyze_compliance(docs, formulation)`
          },
          {
            title: 'Create Regulatory API Endpoints',
            description: 'Build REST API endpoints for regulatory checking',
            language: 'python',
            code: `@app.route('/api/regulatory/check', methods=['POST'])
def check_regulatory_compliance():
    formulation = request.json.get('formulation')
    jurisdiction = request.json.get('jurisdiction')
    
    # Process through RAG system
    compliance_result = agent.check_compliance(formulation, jurisdiction)
    
    return jsonify({
        'status': compliance_result['status'],
        'regulations': compliance_result['regulations'],
        'recommendations': compliance_result['recommendations'],
        'confidence': compliance_result['confidence']
    })`
          },
          {
            title: 'Implement Pass/Fail UI Components',
            description: 'Create React components for compliance results display',
            language: 'typescript',
            code: `interface ComplianceResult {
  status: 'pass' | 'fail' | 'warning';
  regulations: Regulation[];
  recommendations: string[];
  confidence: number;
}

export const ComplianceCard: React.FC<{result: ComplianceResult}> = ({result}) => {
  return (
    <Card className={cn(
      "border-2",
      result.status === 'pass' ? 'border-green-500 bg-green-50' : 
      result.status === 'fail' ? 'border-red-500 bg-red-50' : 
      'border-yellow-500 bg-yellow-50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {result.status === 'pass' && <CheckCircle className="text-green-500 h-5 w-5" />}
          {result.status === 'fail' && <XCircle className="text-red-500 h-5 w-5" />}
          {result.status === 'warning' && <AlertTriangle className="text-yellow-500 h-5 w-5" />}
          <span className="font-semibold">
            Regulatory Status: {result.status.toUpperCase()}
          </span>
          <Badge variant="outline">
            {Math.round(result.confidence * 100)}% confidence
          </Badge>
        </div>
        
        {result.regulations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Relevant Regulations:</h4>
            {result.regulations.map((reg, idx) => (
              <div key={idx} className="text-sm border rounded p-2">
                <a href={reg.url} target="_blank" className="text-blue-600 hover:underline">
                  {reg.title}
                </a>
                <p className="text-gray-600 mt-1">{reg.summary}</p>
              </div>
            ))}
          </div>
        )}
        
        {result.recommendations.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium">Recommendations:</h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              {result.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};`
          }
        ],
        successCriteria: [
          'Regulatory database returns accurate pass/fail results with >90% precision',
          'System processes formulations within 2 seconds',
          'UI displays clear compliance status with clickable regulation links',
          'Integration works across all supported jurisdictions (US states + Canada)',
          'Confidence scoring provides reliable assessment of result quality'
        ],
        testing: [
          'Unit tests for regulatory validation logic with known test cases',
          'Integration tests with mock regulatory APIs and vector database',
          'End-to-end tests for complete user workflow from input to result',
          'Performance tests ensuring <2s response time under load',
          'Accuracy validation against manual regulatory expert review'
        ],
        dependencies: [
          'Internal regulatory database with current state/federal regulations',
          'State compliance API access (where available)',
          'FAISS vector database with regulatory document embeddings',
          'OpenAI embeddings for semantic search',
          'Frontend UI component library (shadcn/ui)'
        ]
      },
      'PubMed Research Integration': {
        overview: `Build a comprehensive scientific literature integration system that connects to PubMed APIs for real-time research analysis, evidence quality assessment, and citation impact evaluation.`,
        steps: [
          {
            title: 'Configure PubMed API Integration',
            description: 'Set up Bio.Entrez for PubMed access with rate limiting',
            language: 'python',
            code: `from Bio import Entrez
import time
from typing import List, Dict
import asyncio

class PubMedIntegration:
    def __init__(self):
        Entrez.email = "formul8@example.com"  # Required by NCBI
        self.rate_limit_delay = 0.34  # Max 3 requests per second
        self.api_key = os.getenv('NCBI_API_KEY')  # Optional but recommended
    
    async def search_literature(self, query: str, max_results: int = 100) -> List[Dict]:
        """Search PubMed for relevant literature"""
        try:
            # Search for paper IDs
            handle = Entrez.esearch(
                db="pubmed", 
                term=query, 
                retmax=max_results,
                api_key=self.api_key
            )
            search_results = Entrez.read(handle)
            pmids = search_results['IdList']
            
            await asyncio.sleep(self.rate_limit_delay)
            
            # Fetch detailed information
            papers = await self.fetch_paper_details(pmids)
            return papers
            
        except Exception as e:
            print(f"PubMed search error: {e}")
            return []
    
    async def fetch_paper_details(self, pmids: List[str]) -> List[Dict]:
        """Fetch detailed paper information"""
        if not pmids:
            return []
            
        # Batch fetch to reduce API calls
        handle = Entrez.efetch(
            db="pubmed", 
            id=",".join(pmids), 
            rettype="xml",
            api_key=self.api_key
        )
        papers = Entrez.read(handle)
        await asyncio.sleep(self.rate_limit_delay)
        
        return self.parse_paper_data(papers)`
          },
          {
            title: 'Implement Evidence Quality Scoring',
            description: 'Create algorithm for assessing research quality and relevance',
            language: 'python',
            code: `def calculate_evidence_quality(paper: Dict) -> Dict:
    """Calculate evidence quality score with detailed breakdown"""
    quality_components = {
        'journal_impact': 0.0,
        'citation_count': 0.0,
        'study_design': 0.0,
        'sample_size': 0.0,
        'recency': 0.0
    }
    
    # Journal impact factor scoring (0-0.25)
    impact_factor = paper.get('journal_impact_factor', 0)
    if impact_factor > 10:
        quality_components['journal_impact'] = 0.25
    elif impact_factor > 5:
        quality_components['journal_impact'] = 0.20
    elif impact_factor > 2:
        quality_components['journal_impact'] = 0.15
    elif impact_factor > 1:
        quality_components['journal_impact'] = 0.10
    
    # Citation count scoring (0-0.25)
    citations = paper.get('citation_count', 0)
    if citations > 100:
        quality_components['citation_count'] = 0.25
    elif citations > 50:
        quality_components['citation_count'] = 0.20
    elif citations > 20:
        quality_components['citation_count'] = 0.15
    elif citations > 5:
        quality_components['citation_count'] = 0.10
    
    # Study design scoring (0-0.30)
    abstract = paper.get('abstract', '').toLowerCase()
    study_types = {
        'systematic review': 0.30,
        'meta-analysis': 0.30,
        'randomized controlled trial': 0.25,
        'clinical trial': 0.20,
        'cohort study': 0.15,
        'case-control': 0.10,
        'case report': 0.05
    }
    
    for study_type, score in study_types.items():
        if study_type in abstract:
            quality_components['study_design'] = score
            break
    
    # Sample size scoring (0-0.10)
    import re
    sample_matches = re.findall(r'n\s*=\s*(\d+)', abstract)
    if sample_matches:
        max_sample = max(int(n) for n in sample_matches)
        if max_sample > 1000:
            quality_components['sample_size'] = 0.10
        elif max_sample > 100:
            quality_components['sample_size'] = 0.08
        elif max_sample > 50:
            quality_components['sample_size'] = 0.05
    
    # Recency scoring (0-0.10)
    pub_year = paper.get('publication_year', 0)
    current_year = datetime.now().year
    years_old = current_year - pub_year
    if years_old <= 1:
        quality_components['recency'] = 0.10
    elif years_old <= 3:
        quality_components['recency'] = 0.08
    elif years_old <= 5:
        quality_components['recency'] = 0.05
    elif years_old <= 10:
        quality_components['recency'] = 0.03
    
    total_score = sum(quality_components.values())
    
    return {
        'total_score': min(total_score, 1.0),
        'components': quality_components,
        'grade': 'A' if total_score > 0.8 else 'B' if total_score > 0.6 else 'C'
    }`
          },
          {
            title: 'Build Research Dashboard Components',
            description: 'Create interactive UI for literature search and analysis',
            language: 'typescript',
            code: `interface ResearchPaper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publicationYear: number;
  abstract: string;
  qualityScore: number;
  qualityGrade: 'A' | 'B' | 'C';
  qualityComponents: {
    journal_impact: number;
    citation_count: number;
    study_design: number;
    sample_size: number;
    recency: number;
  };
  citationCount: number;
  relevanceScore: number;
  url: string;
}

export const ResearchDashboard: React.FC = () => {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minQuality: 0,
    maxAge: 10,
    studyTypes: [] as string[]
  });
  
  const searchLiterature = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/science/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          max_results: 50,
          filters 
        })
      });
      const results = await response.json();
      setPapers(results.papers || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredPapers = papers.filter(paper => 
    paper.qualityScore >= filters.minQuality &&
    (new Date().getFullYear() - paper.publicationYear) <= filters.maxAge
  );
  
  return (
    <div className="research-dashboard space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scientific Literature Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search PubMed literature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLiterature(searchQuery)}
              />
            </div>
            <Button onClick={() => searchLiterature(searchQuery)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
          
          <div className="mt-4 flex gap-4">
            <div>
              <Label>Min Quality Score</Label>
              <Slider
                value={[filters.minQuality]}
                onValueChange={(value) => setFilters({...filters, minQuality: value[0]})}
                max={1}
                step={0.1}
                className="w-32"
              />
            </div>
            <div>
              <Label>Max Age (years)</Label>
              <Slider
                value={[filters.maxAge]}
                onValueChange={(value) => setFilters({...filters, maxAge: value[0]})}
                max={20}
                step={1}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {filteredPapers.map((paper) => (
          <Card key={paper.pmid} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">
                  <a href={paper.url} target="_blank" className="text-blue-600 hover:underline">
                    {paper.title}
                  </a>
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant={paper.qualityGrade === 'A' ? 'default' : paper.qualityGrade === 'B' ? 'secondary' : 'outline'}>
                    Quality: {paper.qualityGrade}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(paper.qualityScore * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && \` et al.\`} • {paper.journal} • {paper.publicationYear}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                {paper.abstract}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Citations: {paper.citationCount}</span>
                <span>Relevance: {Math.round(paper.relevanceScore * 100)}%</span>
                <span>PMID: {paper.pmid}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredPapers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No papers found. Try adjusting your search terms or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};`
          }
        ],
        successCriteria: [
          'PubMed API integration returns relevant research papers with >95% availability',
          'Evidence quality scoring algorithm provides accurate assessments validated by experts',
          'Search functionality processes queries within 3 seconds',
          'Dashboard displays papers with quality, relevance, and citation metrics',
          'Advanced filtering works correctly for quality score, publication date, and study type'
        ],
        testing: [
          'PubMed API integration tests with mock responses and rate limiting',
          'Evidence quality algorithm validation against known high/low quality papers',
          'Search performance tests with various query complexities',
          'UI component testing for research dashboard functionality',
          'End-to-end testing of search → filter → result workflow'
        ],
        dependencies: [
          'PubMed API access via Bio.Entrez (free but rate-limited)',
          'Optional NCBI API key for higher rate limits',
          'Citation analysis databases or APIs',
          'Journal impact factor database',
          'Frontend research dashboard components with advanced filtering'
        ]
      },
      'COA Analysis': {
        overview: `Develop an automated Certificate of Analysis processing system that extracts, interprets, and validates lab results for cannabis products with compliance verification and quality metrics assessment.`,
        steps: [
          {
            title: 'PDF Processing Pipeline',
            description: 'Set up comprehensive PDF parsing and data extraction for COA documents',
            language: 'python',
            code: `import pdfplumber
import re
from typing import Dict, List, Optional
import pandas as pd

class COAProcessor:
    def __init__(self):
        self.cannabinoid_patterns = {
            'THC': r'(?:THC|Δ9-THC|Delta-9-THC)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?',
            'THCA': r'(?:THCA|THC-A)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?',
            'CBD': r'(?:CBD)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?',
            'CBDA': r'(?:CBDA|CBD-A)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?',
            'CBG': r'(?:CBG)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?',
            'CBN': r'(?:CBN)[A-Za-z\s]*:?\s*(\d+\.?\d*)\s*(?:%|mg/g|ppm)?'
        }
        
        self.contaminant_patterns = {
            'pesticides': r'(?:pesticide|pesticides)[^\\n]*?(?:pass|fail|<|>|\d+\.?\d*)',
            'heavy_metals': r'(?:heavy metal|lead|cadmium|mercury|arsenic)[^\\n]*?(?:pass|fail|<|>|\d+\.?\d*)',
            'microbials': r'(?:microbial|yeast|mold|e\.?\s*coli|salmonella)[^\\n]*?(?:pass|fail|<|>|\d+\.?\d*)',
            'residual_solvents': r'(?:solvent|butane|propane|ethanol)[^\\n]*?(?:pass|fail|<|>|\d+\.?\d*)'
        }
    
    def extract_data(self, pdf_path: str) -> Dict:
        """Extract all relevant data from COA PDF"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Extract text from all pages
                text = ''.join([page.extract_text() or '' for page in pdf.pages])
                
                # Extract tables if present
                tables = []
                for page in pdf.pages:
                    page_tables = page.extract_tables()
                    if page_tables:
                        tables.extend(page_tables)
                
                return {
                    'cannabinoids': self.parse_cannabinoid_data(text, tables),
                    'contaminants': self.parse_contaminant_data(text, tables),
                    'metadata': self.extract_metadata(text),
                    'quality_metrics': self.calculate_quality_metrics(text, tables)
                }
        except Exception as e:
            print(f"Error processing PDF: {e}")
            return {}
    
    def parse_cannabinoid_data(self, text: str, tables: List) -> Dict:
        """Extract cannabinoid percentages and values"""
        cannabinoids = {}
        
        # Try regex extraction first
        for cannabinoid, pattern in self.cannabinoid_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Take the first valid numeric match
                for match in matches:
                    try:
                        value = float(match)
                        cannabinoids[cannabinoid] = value
                        break
                    except ValueError:
                        continue
        
        # Try table extraction as backup
        if not cannabinoids and tables:
            cannabinoids.update(self.extract_from_tables(tables, 'cannabinoid'))
        
        return cannabinoids
    
    def extract_metadata(self, text: str) -> Dict:
        """Extract sample metadata"""
        metadata = {}
        
        # Sample ID
        sample_id_match = re.search(r'(?:sample|batch|lot)[^\\n]*?([A-Z0-9]{6,})', text, re.IGNORECASE)
        if sample_id_match:
            metadata['sample_id'] = sample_id_match.group(1)
        
        # Test date
        date_match = re.search(r'(?:tested|analyzed|date)[^\\n]*?(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})', text, re.IGNORECASE)
        if date_match:
            metadata['test_date'] = date_match.group(1)
        
        # Lab name
        lab_match = re.search(r'(?:laboratory|lab|tested by)[^\\n]*?([A-Za-z][^\\n]{10,50})', text, re.IGNORECASE)
        if lab_match:
            metadata['lab_name'] = lab_match.group(1).strip()
        
        return metadata`
          },
          {
            title: 'Quality Metrics Calculation',
            description: 'Implement comprehensive quality assessment algorithms for lab results',
            language: 'python',
            code: `def calculate_quality_metrics(self, coa_data: Dict) -> Dict:
    """Calculate comprehensive quality metrics"""
    metrics = {
        'overall_grade': 'N/A',
        'potency_assessment': {},
        'contamination_assessment': {},
        'compliance_status': {},
        'recommendations': []
    }
    
    cannabinoids = coa_data.get('cannabinoids', {})
    contaminants = coa_data.get('contaminants', {})
    
    # Potency Assessment
    total_thc = cannabinoids.get('THC', 0) + (cannabinoids.get('THCA', 0) * 0.877)
    total_cbd = cannabinoids.get('CBD', 0) + (cannabinoids.get('CBDA', 0) * 0.877)
    
    metrics['potency_assessment'] = {
        'total_thc': total_thc,
        'total_cbd': total_cbd,
        'total_cannabinoids': sum(cannabinoids.values()),
        'thc_cbd_ratio': total_thc / total_cbd if total_cbd > 0 else float('inf'),
        'potency_grade': self.grade_potency(total_thc, total_cbd)
    }
    
    # Contamination Assessment
    contamination_score = 0
    for contaminant_type, results in contaminants.items():
        if isinstance(results, dict):
            if results.get('status') == 'pass':
                contamination_score += 25
            elif results.get('status') == 'fail':
                metrics['recommendations'].append(f"Address {contaminant_type} contamination")
        elif results == 'pass':
            contamination_score += 25
    
    metrics['contamination_assessment'] = {
        'score': contamination_score,
        'grade': 'A' if contamination_score >= 90 else 'B' if contamination_score >= 70 else 'C',
        'details': contaminants
    }
    
    # Overall Grade Calculation
    potency_weight = 0.4
    contamination_weight = 0.6
    
    potency_numeric = {'A': 90, 'B': 80, 'C': 70, 'F': 50}.get(
        metrics['potency_assessment']['potency_grade'], 50
    )
    
    overall_score = (potency_numeric * potency_weight + 
                    contamination_score * contamination_weight)
    
    if overall_score >= 85:
        metrics['overall_grade'] = 'A'
    elif overall_score >= 75:
        metrics['overall_grade'] = 'B'
    elif overall_score >= 65:
        metrics['overall_grade'] = 'C'
    else:
        metrics['overall_grade'] = 'F'
        metrics['recommendations'].append("Sample quality below acceptable standards")
    
    return metrics

def grade_potency(self, thc: float, cbd: float) -> str:
    """Grade potency based on cannabinoid levels"""
    total = thc + cbd
    
    if total >= 20:
        return 'A'  # High potency
    elif total >= 10:
        return 'B'  # Medium potency
    elif total >= 5:
        return 'C'  # Low potency
    else:
        return 'F'  # Very low potency`
          },
          {
            title: 'COA Visualization Dashboard',
            description: 'Create comprehensive interactive dashboard for COA analysis results',
            language: 'typescript',
            code: `interface COAAnalysis {
  sampleId: string;
  testDate: string;
  labName: string;
  cannabinoids: Record<string, number>;
  contaminants: Record<string, any>;
  qualityMetrics: {
    overall_grade: string;
    potency_assessment: {
      total_thc: number;
      total_cbd: number;
      total_cannabinoids: number;
      thc_cbd_ratio: number;
      potency_grade: string;
    };
    contamination_assessment: {
      score: number;
      grade: string;
      details: Record<string, any>;
    };
    recommendations: string[];
  };
  complianceStatus: 'pass' | 'fail' | 'conditional';
}

export const COADashboard: React.FC<{analysis: COAAnalysis}> = ({analysis}) => {
  const cannabinoidData = Object.entries(analysis.cannabinoids).map(([name, value]) => ({
    name: name.toUpperCase(),
    value: Number(value.toFixed(2)),
    percentage: value
  }));
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="coa-dashboard space-y-6">
      {/* Header with Overall Grade */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>COA Analysis Results</CardTitle>
              <CardDescription>
                Sample ID: {analysis.sampleId} • {analysis.labName} • {analysis.testDate}
              </CardDescription>
            </div>
            <div className={cn("px-4 py-2 rounded-lg font-bold text-2xl", 
              getGradeColor(analysis.qualityMetrics.overall_grade))}>
              Grade: {analysis.qualityMetrics.overall_grade}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cannabinoid Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flask className="h-5 w-5" />
              Cannabinoid Profile
              <Badge className={getGradeColor(analysis.qualityMetrics.potency_assessment.potency_grade)}>
                {analysis.qualityMetrics.potency_assessment.potency_grade}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cannabinoidData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [\`\${value}%\`, 'Percentage']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total THC:</span> {analysis.qualityMetrics.potency_assessment.total_thc.toFixed(2)}%
              </div>
              <div>
                <span className="font-medium">Total CBD:</span> {analysis.qualityMetrics.potency_assessment.total_cbd.toFixed(2)}%
              </div>
              <div>
                <span className="font-medium">Total Cannabinoids:</span> {analysis.qualityMetrics.potency_assessment.total_cannabinoids.toFixed(2)}%
              </div>
              <div>
                <span className="font-medium">THC:CBD Ratio:</span> {
                  analysis.qualityMetrics.potency_assessment.thc_cbd_ratio === Infinity ? 
                  'THC Only' : 
                  analysis.qualityMetrics.potency_assessment.thc_cbd_ratio.toFixed(2)
                }
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Contamination Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety & Contamination
              <Badge className={getGradeColor(analysis.qualityMetrics.contamination_assessment.grade)}>
                {analysis.qualityMetrics.contamination_assessment.grade}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analysis.contaminants).map(([type, result]) => (
                <div key={type} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    {typeof result === 'object' ? (
                      <>
                        <span className="text-sm text-gray-600">
                          {result.value} {result.unit}
                        </span>
                        <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant={result === 'pass' ? 'default' : 'destructive'}>
                        {result}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium">
                Contamination Score: {analysis.qualityMetrics.contamination_assessment.score}/100
              </div>
              <Progress 
                value={analysis.qualityMetrics.contamination_assessment.score} 
                className="mt-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommendations */}
      {analysis.qualityMetrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.qualityMetrics.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("p-4 rounded-lg flex items-center gap-3",
            analysis.complianceStatus === 'pass' ? 'bg-green-100 text-green-800' :
            analysis.complianceStatus === 'fail' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          )}>
            {analysis.complianceStatus === 'pass' && <CheckCircle className="h-5 w-5" />}
            {analysis.complianceStatus === 'fail' && <XCircle className="h-5 w-5" />}
            {analysis.complianceStatus === 'conditional' && <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium">
              Compliance Status: {analysis.complianceStatus.toUpperCase()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};`
          }
        ],
        successCriteria: [
          'PDF extraction accurately captures lab data from 95% of common COA formats',
          'Quality metrics calculation provides reliable assessments validated by lab experts',
          'Compliance verification matches current regulatory standards for target jurisdictions',
          'Dashboard visualizes results clearly with actionable insights',
          'Processing completes within 10 seconds for typical COA documents'
        ],
        testing: [
          'PDF processing tests with 20+ different COA formats from major labs',
          'Data extraction accuracy validation against manual data entry',
          'Quality metrics algorithm verification against expert assessments',
          'UI component testing for dashboard functionality and responsiveness',
          'Performance testing with large COA files and batch processing'
        ],
        dependencies: [
          'PDF processing libraries (pdfplumber, PyPDF2, or similar)',
          'Lab data validation rules and thresholds',
          'Current regulatory compliance standards database',
          'Chart.js/Recharts for data visualization',
          'File upload and processing infrastructure'
        ]
      }
    };

    // Generate default plan if specific feature not found
    const defaultPlan = {
      overview: `Implement ${feature.name} as a core functionality for ${agentName} operations with comprehensive LangChain integration, RAG support, and user-friendly interface. This feature will enhance the agent's capabilities and provide significant value to cannabis industry users.`,
      steps: [
        {
          title: 'LangChain Agent Setup and Configuration',
          description: 'Initialize LangChain agent with proper tools, memory, and RAG integration',
          language: 'python',
          code: `from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.tools import Tool
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings

class ${agentName.charAt(0).toUpperCase() + agentName.slice(1)}Agent:
    def __init__(self):
        self.memory = ConversationBufferWindowMemory(
            k=10, 
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize RAG system
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = FAISS.load_local("./rag/vectorstore", self.embeddings)
        
        # Initialize tools specific to this feature
        self.tools = self._initialize_tools()
        
        # Create agent
        self.agent = create_openai_functions_agent(
            llm=self._get_llm(),
            tools=self.tools,
            prompt=self._get_prompt_template()
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=5
        )
    
    def _initialize_tools(self):
        return [
            Tool(
                name="${feature.name.replace(' ', '_').toLowerCase()}",
                description="Tool for ${feature.name.toLowerCase()}",
                func=self._process_${feature.name.replace(/\s+/g, '_').toLowerCase()}
            ),
            Tool(
                name="knowledge_search",
                description="Search knowledge base for relevant information",
                func=self._search_knowledge_base
            )
        ]
    
    def _process_${feature.name.replace(/\s+/g, '_').toLowerCase()}(self, query: str) -> str:
        """Main processing function for ${feature.name}"""
        # Implementation specific to this feature
        results = self.vectorstore.similarity_search(query, k=5)
        # Process results and return response
        return self._generate_response(results, query)`
        },
        {
          title: 'REST API Endpoint Implementation',
          description: 'Create comprehensive REST API endpoints for feature functionality',
          language: 'python',
          code: `from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/${agentName}/${feature.name.toLowerCase().replace(/\s+/g, '-')}', methods=['POST'])
def ${feature.name.toLowerCase().replace(/[\s\W]+/g, '_')}():
    """API endpoint for ${feature.name}"""
    try:
        # Validate request
        if not request.json:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        user_input = request.json.get('query')
        context = request.json.get('context', {})
        user_id = request.json.get('user_id', 'anonymous')
        
        if not user_input:
            return jsonify({'error': 'Query is required'}), 400
        
        # Process through agent
        result = agent.process_query(user_id, user_input, context)
        
        # Format response
        response = {
            'success': True,
            'result': result,
            'confidence': result.get('confidence', 0.8),
            'sources': result.get('sources', []),
            'processing_time': result.get('processing_time', 0)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/${agentName}/${feature.name.toLowerCase().replace(/\s+/g, '-')}/status', methods=['GET'])
def ${feature.name.toLowerCase().replace(/[\s\W]+/g, '_')}_status():
    """Get feature status and health check"""
    try:
        # Perform health checks
        vector_db_status = agent.vectorstore is not None
        llm_status = agent._test_llm_connection()
        
        return jsonify({
            'status': 'healthy' if vector_db_status and llm_status else 'degraded',
            'vector_db': vector_db_status,
            'llm_connection': llm_status,
            'feature_name': '${feature.name}',
            'agent': '${agentName}'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500`
        },
        {
          title: 'Frontend Interface Development',
          description: 'Build comprehensive React components for user interaction',
          language: 'typescript',
          code: `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ${feature.name.replace(/\s+/g, '')}Result {
  success: boolean;
  result: {
    answer: string;
    confidence: number;
    sources: Array<{
      title: string;
      url?: string;
      relevance: number;
    }>;
    recommendations: string[];
  };
  processing_time: number;
}

export const ${feature.name.replace(/\s+/g, '')}Component: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<${feature.name.replace(/\s+/g, '')}Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<Record<string, any>>({});
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/${agentName}/${feature.name.toLowerCase().replace(/\s+/g, '-')}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          context,
          user_id: 'user_123' // This would come from auth context
        }),
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        toast({
          title: "Analysis Complete",
          description: \`Processed in \${data.processing_time}ms with \${Math.round(data.result.confidence * 100)}% confidence\`,
        });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            ${feature.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium mb-2">
                Your Question
              </label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your ${feature.name.toLowerCase()} question..."
                rows={3}
                className="w-full"
              />
            </div>
            
            <Button type="submit" disabled={loading || !query.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                \`Analyze with ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent\`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Analysis Results</CardTitle>
              <div className="flex gap-2">
                <Badge className={getConfidenceColor(result.result.confidence)}>
                  {Math.round(result.result.confidence * 100)}% confidence
                </Badge>
                <Badge variant="outline">
                  {result.processing_time}ms
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Analysis</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{result.result.answer}</p>
              </div>
            </div>
            
            {result.result.sources.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sources</h4>
                <div className="space-y-2">
                  {result.result.sources.map((source, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {source.title}
                          </a>
                        ) : (
                          <span>{source.title}</span>
                        )}
                      </div>
                      <Badge variant="outline">
                        {Math.round(source.relevance * 100)}% relevant
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.result.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {result.result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ${feature.name.replace(/\s+/g, '')}Component;`
        }
      ],
      successCriteria: [
        `${feature.name} functionality works as specified in the product roadmap`,
        'API endpoints respond within acceptable time limits (<3 seconds)',
        'Frontend components provide intuitive and responsive user experience',
        'Integration with other agent systems functions properly',
        'Error handling provides clear, actionable feedback to users',
        'Performance meets or exceeds baseline requirements'
      ],
      testing: [
        'Unit tests for core functionality with >90% code coverage',
        'API endpoint integration tests with mock and real data',
        'Frontend component testing using React Testing Library',
        'End-to-end workflow validation with Cypress or Playwright',
        'Performance testing under expected load conditions',
        'Cross-browser compatibility testing'
      ],
      dependencies: feature.apis || [
        'LangChain framework for agent orchestration',
        'OpenAI API for language model inference',
        'FAISS for vector similarity search',
        'Agent memory system for conversation continuity',
        'Frontend UI component library (shadcn/ui)',
        'Database for persistent storage (if required)'
      ]
    };

    return implementationPlans[feature.name] || defaultPlan;
  }

  getRoadmapFeaturesForDisplay() {
    return this.getRoadmapFeatures();
  }

  // Get feature count summary
  getFeatureSummary() {
    const features = this.getRoadmapFeatures();
    const agentCounts = Object.entries(features).map(([agent, agentFeatures]) => ({
      agent,
      total: agentFeatures.length,
      critical: agentFeatures.filter(f => f.priority === 'critical').length,
      high: agentFeatures.filter(f => f.priority === 'high').length,
      medium: agentFeatures.filter(f => f.priority === 'medium').length,
      low: agentFeatures.filter(f => f.priority === 'low').length
    }));
    
    const totalFeatures = Object.values(features).reduce((sum, agentFeatures) => sum + agentFeatures.length, 0);
    
    return {
      totalFeatures,
      agentCounts,
      priorityBreakdown: {
        critical: agentCounts.reduce((sum, agent) => sum + agent.critical, 0),
        high: agentCounts.reduce((sum, agent) => sum + agent.high, 0),
        medium: agentCounts.reduce((sum, agent) => sum + agent.medium, 0),
        low: agentCounts.reduce((sum, agent) => sum + agent.low, 0)
      }
    };
  }

  async addImplementationCommentsToAllIssues(): Promise<Record<string, any[]>> {
    const agents = Object.keys(this.getRoadmapFeatures());
    const results: Record<string, any[]> = {};

    for (const agent of agents) {
      console.log(`Adding implementation comments to ${agent} issues...`);
      try {
        const agentResults = await this.addCommentsToAgentIssues(agent);
        results[agent] = agentResults;
      } catch (error) {
        results[agent] = [{ success: false, error: error.message }];
      }
      
      // Wait 2 seconds between agents to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  async addCommentsToAgentIssues(agentName: string): Promise<any[]> {
    try {
      // Get existing feature issues
      const existingIssues = await this.getExistingFeatureIssues(agentName);
      const agentFeatures = this.getRoadmapFeatures()[agentName] || [];
      
      const results = [];
      
      for (const issue of existingIssues) {
        // Find matching feature by comparing issue title to feature name
        const matchingFeature = agentFeatures.find(feature => 
          issue.title.toLowerCase().includes(feature.name.toLowerCase()) ||
          feature.name.toLowerCase().includes(issue.title.replace('Feature: ', '').toLowerCase())
        );
        
        if (matchingFeature) {
          try {
            // Check if issue already has implementation comment
            const comments = await this.octokit.rest.issues.listComments({
              owner: this.org,
              repo: agentName,
              issue_number: issue.number
            });
            
            const hasImplementationComment = comments.data.some(comment => 
              comment.body && comment.body.includes('🔧 Detailed Implementation Approach')
            );
            
            if (!hasImplementationComment) {
              await this.addDetailedImplementationComment(agentName, issue.number, matchingFeature);
              results.push({
                success: true,
                issueNumber: issue.number,
                issueTitle: issue.title,
                feature: matchingFeature.name,
                action: 'comment_added'
              });
            } else {
              results.push({
                success: true,
                issueNumber: issue.number,
                issueTitle: issue.title,
                feature: matchingFeature.name,
                action: 'comment_exists'
              });
            }
            
            // Rate limiting - wait 1 second between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            results.push({
              success: false,
              issueNumber: issue.number,
              issueTitle: issue.title,
              error: error.message
            });
          }
        } else {
          results.push({
            success: false,
            issueNumber: issue.number,
            issueTitle: issue.title,
            error: 'No matching feature found'
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to add comments to ${agentName} issues: ${error.message}`);
    }
  }
}

export const githubFeatureManager = new GitHubFeatureManager();