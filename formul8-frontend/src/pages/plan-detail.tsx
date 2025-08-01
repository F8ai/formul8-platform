import { useRoute } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from "lucide-react";
import { Link } from "wouter";

interface FeatureDetail {
  id: string;
  name: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  effort: "Large" | "Medium" | "Small";
  timeline: string;
  dependencies: string[];
  acceptance_criteria: string[];
  technical_notes: string[];
}

interface DataDetail {
  id: string;
  name: string;
  description: string;
  volume: string;
  quality_requirements: string[];
  sources: string[];
  processing_needs: string[];
  storage_requirements: string;
  compliance_notes: string[];
}

interface CostDetail {
  category: string;
  description: string;
  amount: number;
  breakdown: { item: string; cost: number; notes: string }[];
  scaling_factors: string[];
  optimization_opportunities: string[];
}

interface AIEvaluation {
  overall_score: number;
  feasibility_score: number;
  risk_assessment: "Low" | "Medium" | "High";
  key_strengths: string[];
  major_concerns: string[];
  recommendations: string[];
  timeline_assessment: "Aggressive" | "Realistic" | "Conservative";
  budget_assessment: "Under" | "Appropriate" | "Over";
}

export default function PlanDetail() {
  const [match, params] = useRoute("/plan-detail/:type");
  const [costScale, setCostScale] = useState<1 | 2 | 3>(1);
  
  if (!match || !params?.type) {
    return <div>Invalid plan detail type</div>;
  }

  const planType = params.type;

  // Feature Details Data
  const featureDetails: Record<string, FeatureDetail[]> = {
    core: [
      {
        id: "F001",
        name: "Multi-Agent Orchestration System",
        description: "LangGraph-based orchestration system coordinating all 9 specialized agents with state management and conditional routing",
        priority: "Critical",
        effort: "Large",
        timeline: "Weeks 2-8",
        dependencies: ["Agent base architecture", "Database schema"],
        acceptance_criteria: [
          "Successfully route queries to appropriate agents",
          "Handle complex multi-agent workflows",
          "Maintain conversation state across agents",
          "Provide real-time status updates"
        ],
        technical_notes: [
          "Uses LangGraph for workflow management",
          "Redis for state management",
          "WebSocket for real-time updates",
          "Retry logic for failed agent calls"
        ]
      },
      {
        id: "F002", 
        name: "Agent-to-Agent Verification",
        description: "Cross-validation system where agents verify each other's responses to ensure production-ready accuracy",
        priority: "Critical",
        effort: "Large",
        timeline: "Weeks 6-10",
        dependencies: ["Multi-agent orchestration", "Confidence scoring"],
        acceptance_criteria: [
          "Minimum 95% primary domain accuracy",
          "85% cross-domain verification accuracy", 
          "Automatic escalation for low confidence",
          "Audit trail for all verifications"
        ],
        technical_notes: [
          "Implements consensus algorithms",
          "Confidence scoring with thresholds",
          "Escalation to human experts",
          "Machine learning for verification improvement"
        ]
      }
    ],
    specialized: [
      {
        id: "F003",
        name: "AWS SageMaker Integration",
        description: "Integration with AWS SageMaker for custom model training, deployment, and inference across all agents",
        priority: "High",
        effort: "Large",
        timeline: "Weeks 3-12",
        dependencies: ["AWS infrastructure setup", "Training data collection"],
        acceptance_criteria: [
          "Deploy custom models to SageMaker endpoints",
          "Real-time inference < 3 seconds",
          "Auto-scaling based on demand",
          "Model versioning and rollback"
        ],
        technical_notes: [
          "Uses SageMaker Python SDK",
          "Docker containers for custom models",
          "CloudWatch monitoring",
          "A/B testing for model versions"
        ]
      },
      {
        id: "F004",
        name: "RDKit Molecular Analysis", 
        description: "Advanced chemical informatics using RDKit for molecular structure analysis, SMILES parsing, and property prediction",
        priority: "High",
        effort: "Medium",
        timeline: "Weeks 4-8",
        dependencies: ["Formulation agent base", "Chemical databases"],
        acceptance_criteria: [
          "Parse and validate SMILES structures",
          "Calculate molecular descriptors",
          "Predict bioavailability and stability",
          "Generate 3D molecular visualizations"
        ],
        technical_notes: [
          "Python RDKit library integration",
          "PostgreSQL for chemical storage",
          "3D visualization with RDKit.js",
          "QSAR modeling capabilities"
        ]
      }
    ],
    infrastructure: [
      {
        id: "F005",
        name: "AWS Lambda Microservices",
        description: "Serverless microservices architecture using AWS Lambda for scalable agent processing and API endpoints",
        priority: "High",
        effort: "Medium", 
        timeline: "Weeks 1-6",
        dependencies: ["AWS account setup", "API design"],
        acceptance_criteria: [
          "Auto-scaling Lambda functions",
          "API Gateway integration",
          "< 500ms cold start times",
          "Cost optimization with reserved capacity"
        ],
        technical_notes: [
          "Python and Node.js runtimes",
          "Serverless Framework deployment",
          "Environment variable management",
          "Dead letter queues for error handling"
        ]
      }
    ]
  };

  // Data Details
  const dataDetails: Record<string, DataDetail[]> = {
    training: [
      {
        id: "D001",
        name: "Cannabis Regulatory Corpus",
        description: "Comprehensive collection of cannabis regulations from all 24+ legal jurisdictions in the United States",
        volume: "500MB structured text + 2GB PDF documents",
        quality_requirements: [
          "99% accuracy in regulation text extraction",
          "Daily updates from official sources",
          "Version control for regulatory changes",
          "Structured metadata tagging"
        ],
        sources: [
          "State government websites",
          "Cannabis Control Board publications", 
          "Legal databases (Westlaw, LexisNexis)",
          "Industry compliance platforms"
        ],
        processing_needs: [
          "OCR for PDF documents",
          "NLP for text extraction and cleaning",
          "Entity recognition for key terms",
          "Change detection algorithms"
        ],
        storage_requirements: "S3 with versioning + PostgreSQL metadata",
        compliance_notes: [
          "GDPR compliance for user data",
          "State-specific privacy requirements",
          "Audit logging for access",
          "Encryption at rest and in transit"
        ]
      },
      {
        id: "D002",
        name: "Scientific Literature Database",
        description: "Curated database of peer-reviewed cannabis research from PubMed, Google Scholar, and specialized journals",
        volume: "10GB structured abstracts + 50GB full-text papers",
        quality_requirements: [
          "Peer-review validation",
          "Impact factor weighting",
          "Citation network analysis",
          "Evidence quality scoring (GRADE framework)"
        ],
        sources: [
          "PubMed/MEDLINE database",
          "Google Scholar API",
          "Cannabis-specific journals",
          "Clinical trial registries"
        ],
        processing_needs: [
          "PDF text extraction",
          "Citation parsing and linking",
          "Abstract summarization",
          "Research trend analysis"
        ],
        storage_requirements: "S3 Data Lake + Neptune knowledge graph",
        compliance_notes: [
          "Publisher copyright compliance",
          "Fair use guidelines",
          "Attribution requirements",
          "Open access prioritization"
        ]
      }
    ],
    operational: [
      {
        id: "D003", 
        name: "Real-time Market Data",
        description: "Live market intelligence including pricing, competition, and consumer sentiment across cannabis markets",
        volume: "1GB daily ingestion + 100GB historical",
        quality_requirements: [
          "Sub-hour data freshness",
          "95% data completeness",
          "Anomaly detection and filtering",
          "Source reliability scoring"
        ],
        sources: [
          "Cannabis market APIs (Weedmaps, Leafly)",
          "Social media sentiment feeds",
          "Price aggregation services",
          "Competitor website monitoring"
        ],
        processing_needs: [
          "Real-time data pipelines",
          "Sentiment analysis",
          "Price normalization",
          "Trend detection algorithms"
        ],
        storage_requirements: "Kinesis + S3 + ElasticSearch",
        compliance_notes: [
          "API rate limiting compliance",
          "Data usage agreements",
          "Privacy-preserving analytics",
          "Geographic data restrictions"
        ]
      }
    ]
  };

  // Cost Details
  const costDetails: Record<string, CostDetail[]> = {
    development: [
      {
        category: "Development Team",
        description: "Core development team for 25-week implementation timeline",
        amount: 50000 * costScale,
        breakdown: [
          { item: "Senior Developer", cost: 20000 * costScale, notes: "20 hours/week × 25 weeks × $100/hour (50% discount)" },
          { item: "AI/ML Specialist", cost: 15000 * costScale, notes: "15 hours/week × 25 weeks × $100/hour" },
          { item: "DevOps Engineer", cost: 10000 * costScale, notes: "10 hours/week × 25 weeks × $100/hour" },
          { item: "QA Testing", cost: 5000 * costScale, notes: "5 hours/week × 25 weeks × $100/hour" }
        ],
        scaling_factors: [
          "Additional team members for parallel development",
          "Specialist consultants for domain expertise",
          "Extended timeline for additional features",
          "International team for 24/7 development"
        ],
        optimization_opportunities: [
          "Junior developers for non-critical tasks",
          "Offshore development team",
          "Open source components",
          "Automated testing tools"
        ]
      }
    ],
    aws: [
      {
        category: "AWS AI Training",
        description: "SageMaker and Bedrock services for model training and fine-tuning",
        amount: 27600 * costScale,
        breakdown: [
          { item: "SageMaker Training Jobs", cost: 12000 * costScale, notes: "28,000 questions × $0.43/question average" },
          { item: "Bedrock Model Fine-tuning", cost: 6000 * costScale, notes: "Custom model training for specialized domains" },
          { item: "Model Validation & Testing", cost: 3300 * costScale, notes: "Cross-validation and benchmark testing" },
          { item: "Data Processing Pipeline", cost: 6300 * costScale, notes: "ETL and data preparation workflows" }
        ],
        scaling_factors: [
          "Additional training data volumes",
          "More frequent model retraining",
          "Advanced model architectures",
          "Multi-region deployment"
        ],
        optimization_opportunities: [
          "Spot instances for training",
          "Model compression techniques",
          "Transfer learning approaches",
          "Efficient data sampling strategies"
        ]
      },
      {
        category: "AWS Infrastructure",
        description: "Deployment, storage, and ongoing operational costs",
        amount: 14260 * costScale,
        breakdown: [
          { item: "SageMaker Endpoints", cost: 4800 * costScale, notes: "Real-time inference hosting" },
          { item: "Bedrock Inference", cost: 3600 * costScale, notes: "Pay-per-token usage" },
          { item: "Lambda Functions", cost: 1200 * costScale, notes: "Serverless compute" },
          { item: "Storage (S3 + RDS)", cost: 800 * costScale, notes: "Data storage and databases" },
          { item: "Networking & Security", cost: 2900 * costScale, notes: "Load balancer, WAF, KMS" },
          { item: "Monitoring & Logging", cost: 960 * costScale, notes: "CloudWatch and observability" }
        ],
        scaling_factors: [
          "Higher user volumes",
          "Additional geographic regions",
          "Enhanced security requirements",
          "Disaster recovery capabilities"
        ],
        optimization_opportunities: [
          "Reserved instances for predictable workloads",
          "S3 Intelligent Tiering",
          "CloudFront caching",
          "Auto-scaling policies"
        ]
      }
    ]
  };

  // AI Evaluation based on cost scale
  const getAIEvaluation = (scale: number): AIEvaluation => {
    const baseEval: AIEvaluation = {
      overall_score: 85,
      feasibility_score: 90,
      risk_assessment: "Medium",
      key_strengths: [
        "Well-defined technical architecture",
        "Proven AWS services and frameworks",
        "Comprehensive agent specialization",
        "Strong compliance and regulatory focus"
      ],
      major_concerns: [
        "Complex multi-agent coordination challenges",
        "Training data quality and availability",
        "AWS cost management and optimization",
        "Regulatory compliance across jurisdictions"
      ],
      recommendations: [
        "Implement phased rollout approach",
        "Establish robust testing framework",
        "Create detailed cost monitoring",
        "Build regulatory advisory board"
      ],
      timeline_assessment: "Realistic",
      budget_assessment: "Appropriate"
    };

    if (scale === 2) {
      return {
        ...baseEval,
        overall_score: 78,
        feasibility_score: 88,
        risk_assessment: "Medium",
        key_strengths: [
          ...baseEval.key_strengths,
          "Premium positioning in AI market",
          "Strong profit margins",
          "Attracts serious enterprise clients"
        ],
        major_concerns: [
          "$500/hr rate may limit client pool",
          "Requires exceptional value demonstration",
          "Cannabis industry budget constraints",
          "Higher client expectations and scrutiny"
        ],
        recommendations: [
          "Emphasize specialized AI expertise",
          "Demonstrate clear ROI metrics",
          "Offer flexible payment terms",
          "Target established cannabis companies"
        ],
        timeline_assessment: "Realistic",
        budget_assessment: "High but Justifiable"
      };
    }

    if (scale === 3) {
      return {
        ...baseEval,
        overall_score: 65,
        feasibility_score: 75,
        risk_assessment: "High",
        key_strengths: [
          "Enterprise consultant positioning",
          "Premium market segment",
          "Highest profit margins",
          "Exclusive client relationships"
        ],
        major_concerns: [
          "$750/hr exceeds most cannabis budgets",
          "Limited to Fortune 500 cannabis companies",
          "Market resistance highly likely",
          "Must deliver exceptional outcomes"
        ],
        recommendations: [
          "Focus on large MSO clients only",
          "Offer comprehensive consulting packages",
          "Provide guaranteed outcomes",
          "Consider value-based pricing instead"
        ],
        timeline_assessment: "Realistic",
        budget_assessment: "Too High for Most Clients"
      };
    }

    return baseEval;
  };

  const currentEval = getAIEvaluation(costScale);

  const renderFeatureDetails = () => {
    const features = featureDetails[planType] || [];
    return (
      <div className="space-y-6">
        {features.map((feature) => (
          <Card key={feature.id} className="formul8-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-formul8-text-primary flex items-center gap-2">
                    <span className="text-sm font-mono bg-formul8-primary/10 px-2 py-1 rounded">
                      {feature.id}
                    </span>
                    {feature.name}
                  </CardTitle>
                  <p className="text-formul8-text-secondary mt-2">{feature.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={feature.priority === "Critical" ? "destructive" : feature.priority === "High" ? "default" : "secondary"}>
                    {feature.priority}
                  </Badge>
                  <Badge variant="outline">{feature.effort}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </h4>
                  <p className="text-sm text-formul8-text-secondary">{feature.timeline}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Dependencies
                  </h4>
                  <ul className="text-sm text-formul8-text-secondary space-y-1">
                    {feature.dependencies.map((dep, i) => (
                      <li key={i}>• {dep}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-formul8-text-primary mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Acceptance Criteria
                </h4>
                <ul className="text-sm text-formul8-text-secondary space-y-1">
                  {feature.acceptance_criteria.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-formul8-success mt-1">✓</span>
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-formul8-text-primary mb-2">Technical Implementation Notes</h4>
                <ul className="text-sm text-formul8-text-secondary space-y-1">
                  {feature.technical_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-formul8-info mt-1">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderDataDetails = () => {
    const data = dataDetails[planType] || [];
    return (
      <div className="space-y-6">
        {data.map((item) => (
          <Card key={item.id} className="formul8-card">
            <CardHeader>
              <CardTitle className="text-formul8-text-primary flex items-center gap-2">
                <span className="text-sm font-mono bg-formul8-secondary/10 px-2 py-1 rounded">
                  {item.id}
                </span>
                {item.name}
              </CardTitle>
              <p className="text-formul8-text-secondary">{item.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2">Volume</h4>
                  <p className="text-sm text-formul8-text-secondary">{item.volume}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2">Storage</h4>
                  <p className="text-sm text-formul8-text-secondary">{item.storage_requirements}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-formul8-text-primary mb-2">Quality Requirements</h4>
                <ul className="text-sm text-formul8-text-secondary space-y-1">
                  {item.quality_requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-formul8-warning mt-1">⚡</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2">Data Sources</h4>
                  <ul className="text-sm text-formul8-text-secondary space-y-1">
                    {item.sources.map((source, i) => (
                      <li key={i}>• {source}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2">Processing Needs</h4>
                  <ul className="text-sm text-formul8-text-secondary space-y-1">
                    {item.processing_needs.map((need, i) => (
                      <li key={i}>• {need}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-formul8-text-primary mb-2">Compliance Notes</h4>
                <ul className="text-sm text-formul8-text-secondary space-y-1">
                  {item.compliance_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-formul8-error mt-1">⚠</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCostDetails = () => {
    const costs = costDetails[planType] || [];
    return (
      <div className="space-y-6">
        {/* Cost Scale Selector */}
        <Card className="formul8-card border-2 border-formul8-primary">
          <CardHeader>
            <CardTitle className="text-formul8-text-primary flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Analysis & Scaling Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Select Cost Scale for Analysis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={costScale === 1 ? "default" : "outline"}
                    onClick={() => setCostScale(1)}
                    className="h-auto flex-col p-4"
                  >
                    <span className="font-semibold">1x Scale</span>
                    <span className="text-sm">Baseline Budget</span>
                    <span className="text-lg font-bold">${(114825).toLocaleString()}</span>
                  </Button>
                  <Button
                    variant={costScale === 2 ? "default" : "outline"}
                    onClick={() => setCostScale(2)}
                    className="h-auto flex-col p-4"
                  >
                    <span className="font-semibold">$500/hr Rate</span>
                    <span className="text-sm">Premium Pricing</span>
                    <span className="text-lg font-bold">${(229650).toLocaleString()}</span>
                  </Button>
                  <Button
                    variant={costScale === 3 ? "default" : "outline"}
                    onClick={() => setCostScale(3)}
                    className="h-auto flex-col p-4"
                  >
                    <span className="font-semibold">$750/hr Rate</span>
                    <span className="text-sm">Enterprise Pricing</span>
                    <span className="text-lg font-bold">${(344475).toLocaleString()}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {costs.map((cost, index) => (
          <Card key={index} className="formul8-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-formul8-text-primary">{cost.category}</CardTitle>
                <Badge variant="default" className="text-lg px-3 py-1">
                  ${cost.amount.toLocaleString()}
                </Badge>
              </div>
              <p className="text-formul8-text-secondary">{cost.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-formul8-text-primary mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  {cost.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-formul8-surface rounded-lg">
                      <div>
                        <div className="font-medium text-formul8-text-primary">{item.item}</div>
                        <div className="text-sm text-formul8-text-secondary">{item.notes}</div>
                      </div>
                      <div className="font-semibold text-formul8-text-primary">
                        ${item.cost.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Scaling Factors
                  </h4>
                  <ul className="text-sm text-formul8-text-secondary space-y-1">
                    {cost.scaling_factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-formul8-info mt-1">↗</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-formul8-text-primary mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Optimization Opportunities
                  </h4>
                  <ul className="text-sm text-formul8-text-secondary space-y-1">
                    {cost.optimization_opportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-formul8-success mt-1">💡</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderAIEvaluation = () => {
    const evaluation = currentEval;
    const riskColor = evaluation.risk_assessment === "Low" ? "text-formul8-success" : 
                     evaluation.risk_assessment === "Medium" ? "text-formul8-warning" : "text-formul8-error";
    
    return (
      <div className="space-y-6">
        {/* Overall Assessment */}
        <Card className="formul8-card border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Project Assessment - {costScale}x Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{evaluation.overall_score}/100</div>
                <div className="text-sm text-blue-700">Overall Score</div>
                <Progress value={evaluation.overall_score} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{evaluation.feasibility_score}/100</div>
                <div className="text-sm text-green-700">Feasibility</div>
                <Progress value={evaluation.feasibility_score} className="mt-2" />
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${riskColor}`}>{evaluation.risk_assessment}</div>
                <div className="text-sm text-formul8-text-secondary">Risk Level</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-formul8-text-primary">{evaluation.timeline_assessment}</div>
                <div className="text-sm text-formul8-text-secondary">Timeline</div>
                <div className="text-lg font-bold text-formul8-text-primary mt-1">{evaluation.budget_assessment}</div>
                <div className="text-sm text-formul8-text-secondary">Budget</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="formul8-card">
            <CardHeader>
              <CardTitle className="text-formul8-success flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.key_strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-formul8-success mt-1">✓</span>
                    <span className="text-formul8-text-secondary">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Concerns */}
          <Card className="formul8-card">
            <CardHeader>
              <CardTitle className="text-formul8-warning flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Major Concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.major_concerns.map((concern, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-formul8-warning mt-1">⚠</span>
                    <span className="text-formul8-text-secondary">{concern}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="formul8-card">
          <CardHeader>
            <CardTitle className="text-formul8-info flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-formul8-surface rounded-lg">
                  <span className="text-formul8-info mt-1">💡</span>
                  <span className="text-formul8-text-secondary">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis by Scale */}
        <Card className="formul8-card">
          <CardHeader>
            <CardTitle className="text-formul8-text-primary">Scale-Specific Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {costScale === 1 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-formul8-text-primary">1x Scale Assessment</h4>
                <p className="text-formul8-text-secondary">
                  The baseline budget represents a well-balanced approach with realistic resource allocation. 
                  The 25-week timeline is achievable with the proposed team structure. Key risks include 
                  coordination complexity and potential technical challenges with multi-agent systems.
                </p>
                <div className="bg-formul8-info/10 p-3 rounded-lg">
                  <strong className="text-formul8-info">Recommendation:</strong> Proceed with this scale for 
                  a solid foundation. Focus on MVP features first and iterate based on user feedback.
                </div>
              </div>
            )}
            {costScale === 2 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-formul8-text-primary">2x Scale Assessment</h4>
                <p className="text-formul8-text-secondary">
                  Doubling the budget provides significant additional resources but with diminishing returns. 
                  Additional team members can accelerate development but may introduce coordination overhead. 
                  Enhanced AWS resources reduce technical risk but increase ongoing costs.
                </p>
                <div className="bg-formul8-warning/10 p-3 rounded-lg">
                  <strong className="text-formul8-warning">Recommendation:</strong> Consider this scale only 
                  if rapid time-to-market is critical. Implement strict scope and budget controls.
                </div>
              </div>
            )}
            {costScale === 3 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-formul8-text-primary">3x Scale Assessment</h4>
                <p className="text-formul8-text-secondary">
                  Tripling the budget enters high-risk territory with limited additional benefits. 
                  Coordination complexity increases exponentially. Risk of over-engineering and 
                  feature creep becomes significant. ROI becomes questionable at this scale.
                </p>
                <div className="bg-formul8-error/10 p-3 rounded-lg">
                  <strong className="text-formul8-error">Recommendation:</strong> Not recommended unless 
                  extraordinary circumstances require maximum resource deployment. Consider alternative 
                  approaches or phased development instead.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-formul8-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/mvp">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to MVP
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-formul8-text-primary capitalize">
              {planType} Plan Details
            </h1>
            <p className="text-formul8-text-secondary">
              Comprehensive analysis and specifications for {planType} components
            </p>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="ai-evaluation">AI Evaluation</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            {renderFeatureDetails()}
          </TabsContent>

          <TabsContent value="data">
            {renderDataDetails()}
          </TabsContent>

          <TabsContent value="costs">
            {renderCostDetails()}
          </TabsContent>

          <TabsContent value="ai-evaluation">
            {renderAIEvaluation()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}