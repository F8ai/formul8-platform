import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricBadge } from "@/components/ui/metric-badge";
import { Calendar, Clock, GitBranch, Target, Users, CheckCircle2, Circle, AlertCircle, BarChart3, DollarSign, ExternalLink, TrendingUp, CheckCircle, Zap, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

// Project configuration data
const agentRepositories = [
  {
    name: 'compliance-agent',
    icon: '🛡️',
    priority: 'CRITICAL',
    effort: '4-6 weeks',
    dataSources: 3,
    estimatedQuestions: 5000,
    features: 7,
    leads: ['regulatory specialist', 'data engineer'],
    progress: 25,
    trainingDataStart: 1, // Week 1
    trainingDataEnd: 6, // Week 6
    featureStart: 3, // Week 3
    featureEnd: 12, // Week 12
    maturityWeek: 12
  },
  {
    name: 'formulation-agent',
    icon: '🧪',
    priority: 'CRITICAL',
    effort: '3-5 weeks',
    dataSources: 3,
    estimatedQuestions: 4000,
    features: 7,
    leads: ['chemical engineer', 'data scientist'],
    progress: 20,
    trainingDataStart: 1,
    trainingDataEnd: 5,
    featureStart: 3,
    featureEnd: 11,
    maturityWeek: 11
  },
  {
    name: 'science-agent',
    icon: '🔬',
    priority: 'HIGH',
    effort: '3-4 weeks',
    dataSources: 2,
    estimatedQuestions: 4000,
    features: 7,
    leads: ['research scientist', 'data curator'],
    progress: 15,
    trainingDataStart: 1,
    trainingDataEnd: 4,
    featureStart: 4,
    featureEnd: 10,
    maturityWeek: 10
  },
  {
    name: 'marketing-agent',
    icon: '📢',
    priority: 'HIGH',
    effort: '3-4 weeks',
    dataSources: 2,
    estimatedQuestions: 3000,
    features: 7,
    leads: ['marketing specialist', 'compliance officer'],
    progress: 10,
    trainingDataStart: 3,
    trainingDataEnd: 6,
    featureStart: 5,
    featureEnd: 12,
    maturityWeek: 12
  },
  {
    name: 'operations-agent',
    icon: '⚙️',
    priority: 'HIGH',
    effort: '4-5 weeks',
    dataSources: 2,
    estimatedQuestions: 3500,
    features: 7,
    leads: ['operations manager', 'facility engineer'],
    progress: 10,
    trainingDataStart: 3,
    trainingDataEnd: 7,
    featureStart: 6,
    featureEnd: 13,
    maturityWeek: 13
  },
  {
    name: 'patent-agent',
    icon: '⚖️',
    priority: 'MEDIUM',
    effort: '4-6 weeks',
    dataSources: 2,
    estimatedQuestions: 2500,
    features: 7,
    leads: ['IP attorney', 'patent researcher'],
    progress: 5,
    trainingDataStart: 5,
    trainingDataEnd: 10,
    featureStart: 8,
    featureEnd: 16,
    maturityWeek: 16
  },
  {
    name: 'sourcing-agent',
    icon: '🛒',
    priority: 'MEDIUM',
    effort: '3-4 weeks',
    dataSources: 2,
    estimatedQuestions: 2500,
    features: 7,
    leads: ['procurement specialist', 'vendor manager'],
    progress: 5,
    trainingDataStart: 5,
    trainingDataEnd: 8,
    featureStart: 7,
    featureEnd: 14,
    maturityWeek: 14
  },
  {
    name: 'spectra-agent',
    icon: '📊',
    priority: 'MEDIUM',
    effort: '3-4 weeks',
    dataSources: 2,
    estimatedQuestions: 2000,
    features: 7,
    leads: ['analytical chemist', 'lab manager'],
    progress: 0,
    trainingDataStart: 6,
    trainingDataEnd: 9,
    featureStart: 9,
    featureEnd: 15,
    maturityWeek: 15
  },
  {
    name: 'customer-success-agent',
    icon: '🤝',
    priority: 'MEDIUM',
    effort: '2-3 weeks',
    dataSources: 2,
    estimatedQuestions: 1500,
    features: 7,
    leads: ['customer success manager', 'support specialist'],
    progress: 0,
    trainingDataStart: 7,
    trainingDataEnd: 9,
    featureStart: 10,
    featureEnd: 14,
    maturityWeek: 14
  }
];



const featureRolloutPhases = [
  {
    phase: 'MVP Core Features',
    duration: '3-4 weeks',
    priority: 'CRITICAL',
    status: 'in-progress',
    progress: 30,
    features: [
      'Basic agent chat interfaces',
      'Authentication and user management',
      'Core RAG retrieval system',
      'Baseline testing framework',
      'Simple query processing'
    ]
  },
  {
    phase: 'Advanced Agent Features',
    duration: '4-5 weeks',
    priority: 'HIGH',
    status: 'planning',
    progress: 0,
    features: [
      'Multi-agent orchestration',
      'Cross-agent verification',
      'Memory and context management',
      'Advanced tool integrations',
      'Performance monitoring'
    ]
  },
  {
    phase: 'Production Optimization',
    duration: '3-4 weeks',
    priority: 'HIGH',
    status: 'not-started',
    progress: 0,
    features: [
      'Real-time monitoring and alerts',
      'Advanced analytics dashboard',
      'Automated deployment pipelines',
      'Load balancing and scaling',
      'Enterprise security features'
    ]
  },
  {
    phase: 'User Experience Enhancement',
    duration: '2-3 weeks',
    priority: 'MEDIUM',
    status: 'not-started',
    progress: 0,
    features: [
      'Advanced UI/UX improvements',
      'Mobile responsiveness',
      'Accessibility compliance',
      'Custom theming and branding',
      'User onboarding flows'
    ]
  }
];

// Cost calculation data - 8 week MVP approach at $8k/month
const costAnalysis = {
  monthlyRate: 8000, // $8k per month
  totalMonths: 2, // 2 months to MVP
  totalBudget: 16000, // $16k total
  projectStarted: "July 13, 2025",
  currentWeek: 1,
  mvpTimeframe: "8 weeks", // Focus on 8-week MVP
  pricingModel: "Monthly retainer", // Changed from hourly
  hourlyRates: [
    { role: 'Solo Developer (All Roles)', rate: 250, hours: 32, description: 'Full-stack development, AI integration, deployment' } // ~32 hours/week at $250/hr = $8k/month
  ],
  phases: [
    {
      name: 'Month 1: Core Platform & Agent Foundation',
      weeks: 4,
      effort: 128, // 32 hours/week × 4 weeks
      cost: 8000,
      status: 'IN_PROGRESS',
      startDate: 'July 13, 2025',
      completionEstimate: 'August 13, 2025',
      description: 'LangChain agent infrastructure, RAG setup, baseline testing, core 3 agents operational'
    },
    {
      name: 'Month 2: Production MVP & Remaining Agents',
      weeks: 4,
      effort: 128, // 32 hours/week × 4 weeks
      cost: 8000,
      status: 'PLANNED',
      startDate: 'August 13, 2025',
      completionEstimate: 'September 13, 2025',
      description: 'Complete remaining 6 agents, SPARQL knowledge bases, production deployment, user testing'
    }
  ],
  // AWS and operational costs included in monthly retainer
  operationalCosts: {
    mvpDeployment: {
      replit: 0, // Included in development
      github: 0, // Free tier sufficient
      openai: 1200, // $600/month × 2 months for API usage
      databases: 200, // Neon/Supabase basic tiers
      total: 1400
    },
    description: 'All operational costs included in $16k total budget',
    note: 'Client only pays $8k/month retainer, developer covers operational costs'
  },
  agentDeliverySchedule: {
    month1: ['compliance-agent', 'formulation-agent', 'operations-agent'], // Core business agents
    month2: ['marketing-agent', 'science-agent', 'patent-agent', 'sourcing-agent', 'spectra-agent', 'customer-success-agent'] // Remaining agents
  },
  valueProposition: {
    totalAgents: 9,
    costPerAgent: Math.round(16000 / 9), // ~$1,778 per agent
    weeklyDeliveryRate: Math.round(16000 / 8), // $2k per week
    comparison: 'Traditional AI consulting: $50k-100k+ for similar scope'
  }
};

const milestones = [
  {
    name: 'Project Kickoff',
    date: '2025-07-13',
    status: 'complete',
    description: 'Project started July 13, 2025 - Development environment ready'
  },
  {
    name: 'Month 1 Payment Due',
    date: '2025-07-13',
    status: 'complete',
    description: 'First $8k payment - Core agent development begins'
  },
  {
    name: 'Core Agents Operational',
    date: '2025-08-13',
    status: 'planning',
    description: 'Compliance, Formulation, Operations agents with RAG/SPARQL ready'
  },
  {
    name: 'Month 2 Payment Due',
    date: '2025-08-13',
    status: 'planning',
    description: 'Second $8k payment - Remaining agents and production deployment'
  },
  {
    name: 'MVP Launch Complete',
    date: '2025-09-13',
    status: 'planning',
    description: 'All 9 agents deployed, production-ready platform delivered'
  }
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'CRITICAL': return 'destructive';
    case 'HIGH': return 'default';
    case 'MEDIUM': return 'secondary';
    default: return 'outline';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'complete': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'in-progress': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'planning': return <Circle className="h-4 w-4 text-blue-600" />;
    default: return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

export default function MVP() {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Fetch real agent data from GitHub repositories
  const { data: agentData, isLoading } = useQuery({
    queryKey: ['/api/agents/data'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Use actual baseline data from baseline_results.json as fallback
  const actualBaselineData = {
    'compliance-agent': { total: 50, categories: 4 },
    'formulation-agent': { total: 45, categories: 4 },
    'marketing-agent': { total: 42, categories: 4 },
    'operations-agent': { total: 48, categories: 4 },
    'science-agent': { total: 52, categories: 4 },
    'patent-agent': { total: 38, categories: 4 },
    'sourcing-agent': { total: 44, categories: 4 },
    'spectra-agent': { total: 40, categories: 4 },
    'customer-success-agent': { total: 46, categories: 4 }
  };

  const totalQuestions = agentData?.totalQuestions || Object.values(actualBaselineData).reduce((sum, agent) => sum + agent.total, 0);
  const totalFeatures = agentData?.totalIssues || agentRepositories.length * 7; // Use real GitHub issues count
  const overallProgress = Math.round(agentRepositories.reduce((sum, agent) => sum + agent.progress, 0) / agentRepositories.length);
  const developmentCost = costAnalysis.totalBudget;
  const operationalCost = costAnalysis.operationalCosts.total;
  const totalProjectCost = costAnalysis.totalBudget;

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Badge className="bg-green-600 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm w-fit">PROJECT STARTED</Badge>
          <span className="text-xs sm:text-sm text-muted-foreground">July 13, 2025 • Week 1 in progress</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Formul8 MVP Development Plan</h1>
        <p className="text-sm sm:text-xl text-muted-foreground">
          $8k/month for 2 months • 9 AI agents • LangChain + RAG + SPARQL
        </p>
      </div>

      {/* Project Summary Cards */}
      <Collapsible defaultOpen={true}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between p-3 sm:p-4 h-auto mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <div className="text-left">
                <div className="text-sm sm:text-base font-semibold">📊 Project Summary Overview</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {agentRepositories.length} agents • {totalFeatures} features • ${totalProjectCost.toLocaleString()} total • {overallProgress}% progress
                </div>
              </div>
            </div>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Agents - Collapsible */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full p-3 sm:p-4 h-auto">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-medium">Total Agents</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{agentRepositories.length}</div>
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {agentRepositories.map((agent) => (
                        <div key={agent.name} className="flex items-center gap-2 text-sm">
                          <span>{agent.icon}</span>
                          <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Training Questions - Collapsible */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full p-4 h-auto">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Training Questions</div>
                        <div className="text-sm text-muted-foreground">{totalQuestions.toLocaleString()}</div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {agentRepositories.map((agent) => {
                        const repoData = agentData?.data?.find(repo => repo.name === agent.name);
                        const fallbackData = actualBaselineData[`${agent.name}-agent`] || actualBaselineData[agent.name];
                        const questionCount = repoData?.totalQuestions || fallbackData?.total || 0;
                        const questions = Array.isArray(repoData?.baselineQuestions) ? repoData.baselineQuestions : [];
                        
                        return (
                          <Collapsible key={agent.name} className="space-y-2">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                <div className="flex items-center justify-between text-sm w-full">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                    <span>{agent.icon}</span>
                                    <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    {questionCount} questions
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 sm:ml-6">
                              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                                {questions.map((q, idx) => (
                                  <div key={idx} className="border-l-2 border-gray-200 pl-2 sm:pl-3 py-1">
                                    <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1 leading-tight">
                                      • {q.question}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                      {q.category && (
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          {q.category}
                                        </Badge>
                                      )}
                                      {q.difficulty && (
                                        <Badge variant={q.difficulty === 'advanced' ? 'destructive' : q.difficulty === 'intermediate' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                          {q.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {questions.length === 0 && (
                                  <div className="text-xs text-muted-foreground italic px-2">
                                    Questions loading from {agent.name} repository...
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Training questions include baseline testing, domain expertise, and validation scenarios
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Feature Issues - Collapsible */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full p-4 h-auto">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Feature Issues</div>
                        <div className="text-sm text-muted-foreground">{totalFeatures}</div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {agentRepositories.map((agent) => {
                        const repoData = agentData?.data?.find(repo => repo.name === agent.name);
                        const issues = repoData?.issues || [];
                        const issueCount = issues.length;
                        
                        return (
                          <Collapsible key={agent.name} className="space-y-2">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                <div className="flex items-center justify-between text-sm w-full">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                    <span>{agent.icon}</span>
                                    <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{issueCount} features</span>
                                    <Badge variant={agent.priority === 'CRITICAL' ? 'destructive' : 'default'} className="text-xs">
                                      {agent.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 sm:ml-6">
                              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                                {issues.map((issue, idx) => (
                                  <div key={idx} className="border-l-2 border-blue-200 pl-2 sm:pl-3 py-2">
                                    <div className="space-y-2">
                                      <div className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">
                                        • {issue.title}
                                      </div>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <a 
                                          href={issue.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                          View on GitHub
                                        </a>
                                        <div className="flex flex-wrap items-center gap-1">
                                          <Badge 
                                            variant={issue.state === 'open' ? 'default' : 'secondary'} 
                                            className="text-xs px-1 py-0"
                                          >
                                            {issue.state}
                                          </Badge>
                                          {issue.labels?.slice(0, 2).map((label, labelIdx) => (
                                            <Badge key={labelIdx} variant="outline" className="text-xs px-1 py-0">
                                              {label.length > 12 ? label.substring(0, 12) + '...' : label}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {issues.length === 0 && (
                                  <div className="text-xs text-muted-foreground italic px-2">
                                    Features loading from {agent.name} repository...
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Features include core functionality, integrations, UI components, and testing infrastructure
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Total Investment - Collapsible */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full p-3 sm:p-4 h-auto">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-medium">Total Investment</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">${totalProjectCost.toLocaleString()}</div>
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Month 1 (Development)</span>
                        <span className="font-medium">$8,000</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Month 2 (Integration)</span>
                        <span className="font-medium">$8,000</span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t pt-2">
                        <span>Cost per Agent</span>
                        <span className="font-medium">${costAnalysis.valueProposition.costPerAgent}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>OpenAI API Costs</span>
                        <span className="text-green-600 font-medium">Included</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      All-inclusive retainer covers development, AI costs, infrastructure, and support
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Progress - Collapsible */}
            <Collapsible defaultOpen={true}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full p-3 sm:p-4 h-auto">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-medium">Progress</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{overallProgress}%</div>
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {agentRepositories.map((agent) => (
                        <div key={agent.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{agent.icon}</span>
                              <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                            </div>
                            <span className="font-medium">{agent.progress}%</span>
                          </div>
                          <Progress value={agent.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Progress includes LangChain setup, RAG implementation, baseline testing, and feature development
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full min-w-[500px] sm:min-w-[600px] grid-cols-4 sm:grid-cols-7 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">Overview</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs sm:text-sm py-2 px-2">Agents</TabsTrigger>
            <TabsTrigger value="gantt" className="text-xs sm:text-sm py-2 px-1 sm:px-2">Timeline</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs sm:text-sm py-2 px-2">Costs</TabsTrigger>
            <TabsTrigger value="phases" className="text-xs sm:text-sm py-2 px-1 sm:px-2 hidden sm:inline-flex">Phases</TabsTrigger>
            <TabsTrigger value="issues" className="text-xs sm:text-sm py-2 px-2 hidden sm:inline-flex">Issues</TabsTrigger>
            <TabsTrigger value="ai-evaluation" className="text-xs sm:text-sm py-2 px-1 sm:px-2 hidden sm:inline-flex">Evaluation</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Project Objectives
                </CardTitle>
                <CardDescription>
                  Key goals and success metrics for the Formul8 platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Month 1 Deliverables</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Core 3 agents operational (Compliance, Formulation, Operations)</li>
                    <li>• LangChain infrastructure with RAG and SPARQL</li>
                    <li>• Baseline testing framework implemented</li>
                    <li>• Authentication and user management system</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Month 2 Deliverables</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Remaining 6 agents deployed</li>
                    <li>• Production-ready platform with monitoring</li>
                    <li>• All agents with SPARQL knowledge bases</li>
                    <li>• User testing and feedback integration</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Implementation Timeline
                </CardTitle>
                <CardDescription>
                  Payment schedule and key milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {getStatusIcon(milestone.status)}
                    <div className="flex-1">
                      <div className="font-medium">{milestone.name}</div>
                      <div className="text-sm text-muted-foreground">{milestone.description}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{milestone.date}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Agent Status Overview</div>
                    <div className="text-sm text-muted-foreground">
                      {agentRepositories.length} AI agents • {Math.round(agentRepositories.reduce((sum, agent) => sum + agent.progress, 0) / agentRepositories.length)}% average progress
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentRepositories.map((agent, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <div className="capitalize">{agent.name.replace('-', ' ')}</div>
                          <Badge variant={getPriorityColor(agent.priority) as any} className="mt-1">
                            {agent.priority}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{agent.progress}%</span>
                        </div>
                        <Progress value={agent.progress} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Effort</div>
                          <div className="text-muted-foreground">{agent.effort}</div>
                        </div>
                        <div>
                          <div className="font-medium">Features</div>
                          <Link href="/plan-detail/core">
                            <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-formul8-primary">
                              {agent.features} <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                        <div>
                          <div className="font-medium">Data Sources</div>
                          <Link href="/plan-detail/training">
                            <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-formul8-primary">
                              {agent.dataSources} <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                        <div>
                          <div className="font-medium">Questions</div>
                          <div className="text-muted-foreground">{agent.estimatedQuestions.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-sm mb-1">Team Leads</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.leads.join(', ')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="gantt" className="space-y-6">
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Agent Development Timeline</div>
                    <div className="text-sm text-muted-foreground">
                      16-week development schedule • Training data + Features + Maturity milestones
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Agent Maturity Timeline
                  </CardTitle>
                  <CardDescription>
                    Training data acquisition and feature development schedule for all 9 agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-6">
                {/* Timeline Header */}
                <div className="grid grid-cols-21 gap-1 text-xs font-medium text-center">
                  <div className="col-span-5"></div>
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} className="text-muted-foreground">
                      W{i + 1}
                    </div>
                  ))}
                </div>
                
                {/* Agent Timeline Rows */}
                <div className="space-y-3">
                  {agentRepositories
                    .sort((a, b) => a.maturityWeek - b.maturityWeek)
                    .map((agent, index) => (
                    <div key={index} className="grid grid-cols-21 gap-1 items-center">
                      {/* Agent Info */}
                      <div className="col-span-5 flex items-center gap-2 text-sm pr-4">
                        <span className="text-lg">{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate capitalize">
                            {agent.name.replace('-', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Mature: Week {agent.maturityWeek}
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(agent.priority) as any} className="text-xs">
                          {agent.priority.slice(0, 1)}
                        </Badge>
                      </div>
                      
                      {/* Timeline Bars */}
                      {Array.from({ length: 16 }, (_, weekIndex) => {
                        const week = weekIndex + 1;
                        let barType = '';
                        let barIntensity = '';
                        
                        if (week >= agent.trainingDataStart && week <= agent.trainingDataEnd) {
                          barType = 'training';
                          if (week <= agent.trainingDataStart + 1) {
                            barIntensity = 'high';
                          } else if (week >= agent.trainingDataEnd - 1) {
                            barIntensity = 'low';
                          } else {
                            barIntensity = 'medium';
                          }
                        }
                        
                        if (week >= agent.featureStart && week <= agent.featureEnd) {
                          if (barType === 'training') {
                            barType = 'both';
                          } else {
                            barType = 'feature';
                          }
                          if (week <= agent.featureStart + 1) {
                            barIntensity = 'high';
                          } else if (week >= agent.featureEnd - 1) {
                            barIntensity = 'low';
                          } else {
                            barIntensity = barIntensity || 'medium';
                          }
                        }
                        
                        if (week === agent.maturityWeek) {
                          barType = 'mature';
                        }
                        
                        let bgColor = 'bg-transparent';
                        let border = '';
                        
                        if (barType === 'training') {
                          bgColor = barIntensity === 'high' ? 'bg-blue-600' : 
                                   barIntensity === 'medium' ? 'bg-blue-500' : 'bg-blue-400';
                        } else if (barType === 'feature') {
                          bgColor = barIntensity === 'high' ? 'bg-green-600' : 
                                   barIntensity === 'medium' ? 'bg-green-500' : 'bg-green-400';
                        } else if (barType === 'both') {
                          bgColor = 'bg-gradient-to-b from-blue-500 to-green-500';
                        } else if (barType === 'mature') {
                          bgColor = 'bg-yellow-500';
                          border = 'ring-2 ring-yellow-600';
                        }
                        
                        return (
                          <div
                            key={weekIndex}
                            className={`h-6 rounded-sm ${bgColor} ${border}`}
                            title={
                              barType === 'training' ? 'Training Data Acquisition' :
                              barType === 'feature' ? 'Feature Development' :
                              barType === 'both' ? 'Training Data + Features' :
                              barType === 'mature' ? 'Agent Maturity' : ''
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm">Training Data Acquisition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                    <span className="text-sm">Feature Development</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-b from-blue-500 to-green-500 rounded-sm"></div>
                    <span className="text-sm">Parallel Development</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-sm ring-2 ring-yellow-600"></div>
                    <span className="text-sm">Agent Maturity</span>
                  </div>
                </div>
                
                {/* Maturity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Early Maturity (Weeks 10-12)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {agentRepositories
                        .filter(agent => agent.maturityWeek <= 12)
                        .map(agent => (
                          <div key={agent.name} className="flex items-center gap-2 text-sm">
                            <span>{agent.icon}</span>
                            <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                            <span className="text-muted-foreground">W{agent.maturityWeek}</span>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Mid Maturity (Weeks 13-15)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {agentRepositories
                        .filter(agent => agent.maturityWeek >= 13 && agent.maturityWeek <= 15)
                        .map(agent => (
                          <div key={agent.name} className="flex items-center gap-2 text-sm">
                            <span>{agent.icon}</span>
                            <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                            <span className="text-muted-foreground">W{agent.maturityWeek}</span>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Late Maturity (Week 16+)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {agentRepositories
                        .filter(agent => agent.maturityWeek >= 16)
                        .map(agent => (
                          <div key={agent.name} className="flex items-center gap-2 text-sm">
                            <span>{agent.icon}</span>
                            <span className="capitalize">{agent.name.replace('-', ' ')}</span>
                            <span className="text-muted-foreground">W{agent.maturityWeek}</span>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Cost Breakdown & Value Analysis</div>
                    <div className="text-sm text-muted-foreground">
                      $16,000 total • $8k/month retainer • All-inclusive pricing
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Project Cost
                </CardTitle>
                <CardDescription>
                  Complete implementation cost breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-green-600">
                    ${totalProjectCost.toLocaleString()}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    $8k/month × 2 months • All-inclusive retainer
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {costAnalysis.phases.reduce((sum, phase) => sum + phase.effort, 0)} dev hours • 8 weeks • $8k/month retainer
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    Includes: Development + OpenAI costs + Infrastructure + Support
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  {costAnalysis.phases.map((phase, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{phase.name}</div>
                          {phase.status === 'IN_PROGRESS' && (
                            <Badge className="bg-yellow-500 text-white text-xs">In Progress</Badge>
                          )}
                          {phase.status === 'PLANNED' && (
                            <Badge variant="outline" className="text-xs">Planned</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {phase.weeks} weeks • {Math.round(phase.effort/phase.weeks)} hrs/week avg
                        </div>
                        {phase.startDate && (
                          <div className="text-xs text-muted-foreground">
                            {phase.startDate} → {phase.completionEstimate}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${phase.cost.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          Monthly retainer
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Composition & Rates</CardTitle>
                <CardDescription>
                  Hourly rates and time allocation by role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {costAnalysis.hourlyRates.map((role, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{role.role}</div>
                      <div className="text-sm text-muted-foreground">
                        {role.hours} hours total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${role.rate}/hr</div>
                      <div className="text-sm text-muted-foreground">
                        ${(role.rate * role.hours).toLocaleString()} total
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Team Cost</span>
                    <span>${costAnalysis.hourlyRates.reduce((sum, role) => sum + (role.rate * role.hours), 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Value Proposition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">💎</span>
                Value Proposition
              </CardTitle>
              <CardDescription>
                All-inclusive MVP development package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Monthly Cost */}
                <Card className="border-2 border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-700">Monthly Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        $8,000
                      </div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Development</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OpenAI API costs</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Infrastructure</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Support</span>
                        <span>Included</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deliverables */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-blue-700">Total Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        9
                      </div>
                      <div className="text-sm text-muted-foreground">AI agents</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>LangChain integration</span>
                        <span>✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAG capabilities</span>
                        <span>✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SPARQL knowledge</span>
                        <span>✓</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Production deployment</span>
                        <span>✓</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison */}
                <Card className="border-2 border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-purple-700">Market Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        $16k
                      </div>
                      <div className="text-sm text-muted-foreground">total cost</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Traditional AI consulting</span>
                        <span className="text-red-600">$50k-100k+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per agent</span>
                        <span className="text-green-600">~$1,778</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly delivery rate</span>
                        <span className="text-green-600">$2k/week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-800">✨ Key Benefits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                  <div>
                    <p>• Fixed monthly pricing - no hourly tracking</p>
                    <p>• All operational costs included</p>
                    <p>• 8-week delivery timeline</p>
                  </div>
                  <div>
                    <p>• Production-ready from day one</p>
                    <p>• Complete cannabis industry specialization</p>
                    <p>• No additional infrastructure costs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Development Roadmap</CardTitle>
              <CardDescription>
                All 9 AI agents included in $8k/month retainer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentRepositories.map((agent, index) => (
                  <Card key={index} className="border">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-xl">{agent.icon}</span>
                        <div className="flex-1">
                          <div className="capitalize">{agent.name.replace('-', ' ')}</div>
                          <Badge variant={getPriorityColor(agent.priority) as any} className="text-xs mt-1">
                            {agent.priority}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          Included
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agent.maturityWeek} weeks to maturity
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Agent Type</span>
                          <span>Included in retainer</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Features ({agent.features})</span>
                          <span>Included in retainer</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions Est.</span>
                          <span>{agent.estimatedQuestions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Delivery Week</span>
                          <span>Week {Math.ceil(agent.maturityWeek / 2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Investment</span>
                  <span className="font-medium">$16,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost per Agent</span>
                  <span>~$1,778</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weekly Rate</span>
                  <span>$2,000/week</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ROI Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Revenue Target</span>
                  <span className="font-medium">$15,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Break-even Timeline</span>
                  <span>3.3 months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Year 1 ROI</span>
                  <span className="text-green-600 font-medium">+260%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Risk Mitigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contingency Buffer</span>
                  <span>20% ($10K)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phased Investment</span>
                  <span>5 phases</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Early Exit Option</span>
                  <span>Week 12</span>
                </div>
              </CardContent>
            </Card>
          </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="phases" className="space-y-6">
          <div className="space-y-6">
            {featureRolloutPhases.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(phase.status)}
                      <span>Phase {index + 1}: {phase.phase}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(phase.priority) as any}>
                        {phase.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{phase.duration}</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex justify-between items-center">
                      <span>{phase.features.length} features in this phase</span>
                      <span>{phase.progress}% complete</span>
                    </div>
                    <Progress value={phase.progress} className="mt-2" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <Link href="/plan-detail/core">
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Core Features Details
                        </Button>
                      </Link>
                      <Link href="/plan-detail/specialized">
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Specialized Features
                        </Button>
                      </Link>
                      <Link href="/plan-detail/infrastructure">
                        <Button variant="outline" size="sm" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Infrastructure Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline & Milestones</CardTitle>
              <CardDescription>
                Complete implementation roadmap with key deliverables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border"></div>
                  
                  <div className="space-y-8">
                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week 0: Project Setup (Complete)</div>
                        <div className="text-sm text-muted-foreground">
                          GitHub project created, repositories linked, automation configured
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">January 13, 2025</div>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600 text-white">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week 1-2: Critical Agent Training Data</div>
                        <div className="text-sm text-muted-foreground">
                          Compliance, Formulation, and Science agents data acquisition
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">January 20 - February 3, 2025</div>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Circle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week 3-6: MVP Core Features</div>
                        <div className="text-sm text-muted-foreground">
                          Basic agent interfaces, authentication, RAG system
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">February 3 - March 3, 2025</div>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white">
                        <Circle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week 7-14: Advanced Features</div>
                        <div className="text-sm text-muted-foreground">
                          Multi-agent orchestration, verification, memory systems
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">March 3 - April 28, 2025</div>
                      </div>
                    </div>

                    <div className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white">
                        <Circle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Week 15-20: Production Launch</div>
                        <div className="text-sm text-muted-foreground">
                          Performance optimization, user experience, security
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">April 28 - June 2, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button size="lg" className="flex-1">
              <GitBranch className="h-4 w-4 mr-2" />
              View GitHub Project
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Download Implementation Guide
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai-evaluation" className="space-y-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Project Assessment & Cost Scaling Analysis
              </CardTitle>
              <CardDescription className="text-blue-700">
                Comprehensive evaluation of project feasibility, cost optimization, and scaling options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">88/100</div>
                  <div className="text-sm text-blue-700">Overall Project Score</div>
                  <Progress value={88} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">92/100</div>
                  <div className="text-sm text-green-700">Technical Feasibility</div>
                  <Progress value={92} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">Medium</div>
                  <div className="text-sm text-orange-700">Risk Assessment</div>
                  <div className="text-lg font-bold text-formul8-text-primary mt-2">Realistic Timeline</div>
                  <div className="text-sm text-formul8-text-secondary">Appropriate Budget</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Scaling Options */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Rate Pricing Analysis
                </CardTitle>
                <CardDescription>
                  AI evaluation of different hourly rates and market positioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/plan-detail/development">
                      <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-green-700">1x Scale (Baseline)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">${totalProjectCost.toLocaleString()}</div>
                            <div className="text-sm text-green-700 mt-1">Recommended</div>
                            <div className="mt-3 space-y-1 text-xs">
                              <div>• Balanced resource allocation</div>
                              <div>• 25-week realistic timeline</div>
                              <div>• Core features complete</div>
                              <div>• Standard team size</div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-3 w-full">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/plan-detail/development">
                      <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-yellow-700">2x Rate ($500/hr)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">${(totalProjectCost * 2).toLocaleString()}</div>
                            <div className="text-sm text-yellow-700 mt-1">Premium Pricing</div>
                            <div className="mt-3 space-y-1 text-xs">
                              <div>• $500/hr base rate</div>
                              <div>• Same 25-week timeline</div>
                              <div>• Same scope & features</div>
                              <div>• Market rate evaluation</div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-3 w-full">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              AI Price Analysis
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/plan-detail/development">
                      <Card className="border-2 border-red-200 hover:border-red-400 transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-red-700">3x Rate ($750/hr)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">${(totalProjectCost * 3).toLocaleString()}</div>
                            <div className="text-sm text-red-700 mt-1">Enterprise Pricing</div>
                            <div className="mt-3 space-y-1 text-xs">
                              <div>• $750/hr base rate</div>
                              <div>• Same 25-week timeline</div>
                              <div>• Same scope & features</div>
                              <div>• Premium market analysis</div>
                            </div>
                            <Button variant="outline" size="sm" className="mt-3 w-full">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              AI Price Analysis
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Key Strengths</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✓ Well-defined technical architecture</li>
                      <li>✓ Proven AWS services and frameworks</li>
                      <li>✓ Comprehensive agent specialization</li>
                      <li>✓ Strong regulatory compliance focus</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">Pricing Concerns</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>⚠ $500/hr may exceed market expectations</li>
                      <li>⚠ $750/hr approaches enterprise consultant rates</li>
                      <li>⚠ Cannabis industry budget constraints</li>
                      <li>⚠ ROI justification at higher rates</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Rate Recommendations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>💡 $250/hr is competitive for AI specialists</li>
                      <li>💡 $500/hr requires strong value demonstration</li>
                      <li>💡 Consider value-based pricing models</li>
                      <li>💡 Offer phase-based payment options</li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link href="/plan-detail/ai-evaluation">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Complete AI Evaluation
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rate Market Analysis Summary</CardTitle>
              <CardDescription>
                AI assessment of hourly rate positioning and market acceptance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600 mb-2">$250/hr Rate</div>
                  <div className="text-2xl font-bold text-green-600">Optimal</div>
                  <div className="text-sm text-gray-600">Market competitive</div>
                  <div className="text-xs text-gray-500 mt-1">Strong value proposition</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600 mb-2">$500/hr Rate</div>
                  <div className="text-2xl font-bold text-yellow-600">Risky</div>
                  <div className="text-sm text-gray-600">High but justifiable</div>
                  <div className="text-xs text-gray-500 mt-1">Requires strong positioning</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600 mb-2">$750/hr Rate</div>
                  <div className="text-2xl font-bold text-red-600">Too High</div>
                  <div className="text-sm text-gray-600">Market resistance likely</div>
                  <div className="text-xs text-gray-500 mt-1">Enterprise-only viable</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Issues by Agent
              </CardTitle>
              <CardDescription>
                Real-time feature issues and questions from agent repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Features Column */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Feature Issues
                  </h3>
                  <div className="space-y-3">
                    {agentRepositories.map((agent) => (
                      <AgentIssuesCollapsible
                        key={`features-${agent.name}`}
                        agent={agent}
                        issueType="features"
                      />
                    ))}
                  </div>
                </div>

                {/* Questions Column */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Baseline Questions
                  </h3>
                  <div className="space-y-3">
                    {agentRepositories.map((agent) => (
                      <AgentIssuesCollapsible
                        key={`questions-${agent.name}`}
                        agent={agent}
                        issueType="questions"
                      />
                    ))}
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

// Component for collapsible agent issues
function AgentIssuesCollapsible({ agent, issueType }: { 
  agent: typeof agentRepositories[0], 
  issueType: 'features' | 'questions' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: issueData, isLoading } = useQuery({
    queryKey: [`/api/github/issues/${agent.name.replace('-agent', '')}`],
    enabled: isOpen, // Only fetch when expanded
  });

  const issues = issueData?.[issueType] || [];
  const statusColors = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800'
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between p-3 h-auto"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{agent.icon}</span>
            <div className="text-left">
              <div className="font-medium capitalize">
                {agent.name.replace('-', ' ')}
              </div>
              <div className="text-sm text-muted-foreground">
                {issueType === 'features' ? `${agent.features} features` : `Est. questions`}
              </div>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg">
          <ScrollArea className="h-64">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading {issueType}...
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No {issueType} found
                </div>
              ) : (
                issues.map((issue: any) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a 
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-sm"
                        >
                          #{issue.id} {issue.title}
                        </a>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${statusColors[issue.status as keyof typeof statusColors] || statusColors.open}`}
                        >
                          {issue.status}
                        </Badge>
                        {issue.labels?.slice(0, 2).map((label: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}