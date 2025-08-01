import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Beaker, 
  Shield, 
  Scale, 
  Users, 
  Factory, 
  Pill, 
  Leaf, 
  FlaskConical,
  Building2,
  BookOpen,
  ArrowRight,
  MessageCircle,
  Copy,
  CheckCircle2
} from 'lucide-react';

const useCases = [
  {
    id: 'dmso',
    title: 'CBD Topical with DMSO',
    description: 'Multi-agent analysis of CBD topical formulation using DMSO for enhanced permeability across human, veterinary, FDA drug, and personal use scenarios.',
    complexity: 'High',
    agents: ['formulation', 'science', 'compliance', 'operations', 'customer-success'],
    icon: <Beaker className="w-6 h-6" />,
    color: 'bg-blue-500',
    scenarios: 4,
    estimatedTime: '8-12 min',
    chatQuestion: "I'm formulating a CBD topical with terpenes and want to use DMSO to improve permeability. What are the science, safety, and regulatory considerations for human use?"
  },
  {
    id: 'extraction-facility',
    title: 'CO2 Extraction Facility Setup',
    description: 'Comprehensive planning for establishing a compliant CO2 extraction facility including equipment, safety protocols, and regulatory requirements.',
    complexity: 'High',
    agents: ['operations', 'compliance', 'sourcing', 'formulation', 'customer-success'],
    icon: <Factory className="w-6 h-6" />,
    color: 'bg-green-500',
    scenarios: 3,
    estimatedTime: '10-15 min',
    chatQuestion: "I want to set up a CO2 extraction facility for cannabis processing. What are the equipment requirements, safety protocols, compliance considerations, and operational procedures I need to establish?"
  },
  {
    id: 'edibles-dosing',
    title: 'Consistent Edibles Dosing',
    description: 'Developing standardized cannabis edibles with precise dosing, stability testing, and quality control across different product formats.',
    complexity: 'Medium',
    agents: ['formulation', 'science', 'compliance', 'operations'],
    icon: <Pill className="w-6 h-6" />,
    color: 'bg-purple-500',
    scenarios: 3,
    estimatedTime: '6-10 min',
    chatQuestion: "I'm developing cannabis edibles and need to ensure consistent dosing across different product formats. What are the formulation strategies, quality control measures, and stability testing protocols I should implement?"
  },
  {
    id: 'strain-development',
    title: 'Custom Strain Development',
    description: 'Creating new cannabis strains with specific terpene profiles, cannabinoid ratios, and therapeutic targets through breeding and selection.',
    complexity: 'High',
    agents: ['science', 'formulation', 'compliance', 'marketing', 'operations'],
    icon: <Leaf className="w-6 h-6" />,
    color: 'bg-emerald-500',
    scenarios: 2,
    estimatedTime: '12-18 min',
    chatQuestion: "I want to develop a custom cannabis strain with specific terpene profiles and cannabinoid ratios for anxiety relief. What are the breeding strategies, selection criteria, and compliance considerations for strain development?"
  },
  {
    id: 'lab-testing',
    title: 'Comprehensive Lab Testing Protocol',
    description: 'Establishing testing protocols for potency, pesticides, heavy metals, and microbials with COA generation and compliance verification.',
    complexity: 'Medium',
    agents: ['spectra', 'science', 'compliance', 'operations'],
    icon: <FlaskConical className="w-6 h-6" />,
    color: 'bg-orange-500',
    scenarios: 4,
    estimatedTime: '7-12 min',
    chatQuestion: "I need to establish comprehensive lab testing protocols for cannabis products including potency, pesticides, heavy metals, and microbials. What testing methods, equipment, and COA generation procedures should I implement?"
  },
  {
    id: 'dispensary-launch',
    title: 'Dispensary Business Launch',
    description: 'Complete business plan for launching a cannabis dispensary including licensing, inventory management, and marketing strategies.',
    complexity: 'High',
    agents: ['compliance', 'marketing', 'operations', 'customer-success', 'sourcing'],
    icon: <Building2 className="w-6 h-6" />,
    color: 'bg-teal-500',
    scenarios: 5,
    estimatedTime: '15-20 min',
    chatQuestion: "I'm planning to launch a cannabis dispensary and need a comprehensive business plan. What are the licensing requirements, inventory management systems, marketing strategies, and operational procedures I should implement?"
  },
  {
    id: 'patent-protection',
    title: 'Intellectual Property Strategy',
    description: 'Developing comprehensive IP protection for cannabis innovations including patent applications, trademark registration, and trade secrets.',
    complexity: 'High',
    agents: ['patent', 'science', 'compliance', 'formulation'],
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-indigo-500',
    scenarios: 3,
    estimatedTime: '10-15 min',
    chatQuestion: "I have developed innovative cannabis extraction methods and formulations. What intellectual property protection strategies should I pursue, including patent applications, trademark registration, and trade secret protection?"
  },
  {
    id: 'research-study',
    title: 'Clinical Research Study Design',
    description: 'Designing clinical trials for cannabis therapeutics including protocol development, regulatory approvals, and data analysis plans.',
    complexity: 'High',
    agents: ['science', 'compliance', 'formulation', 'operations'],
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-pink-500',
    scenarios: 4,
    estimatedTime: '12-18 min',
    chatQuestion: "I want to design a clinical research study for cannabis therapeutics to treat chronic pain. What are the protocol development requirements, regulatory approval processes, and data analysis plans I need to establish?"
  }
];

const agentColors = {
  formulation: 'bg-blue-100 text-blue-800',
  science: 'bg-green-100 text-green-800',
  compliance: 'bg-red-100 text-red-800',
  operations: 'bg-yellow-100 text-yellow-800',
  'customer-success': 'bg-purple-100 text-purple-800',
  sourcing: 'bg-orange-100 text-orange-800',
  marketing: 'bg-pink-100 text-pink-800',
  spectra: 'bg-teal-100 text-teal-800',
  patent: 'bg-indigo-100 text-indigo-800'
};

const complexityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800'
};

export default function UseCasesIndex() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Multi-Agent Use Cases</h1>
        <p className="text-lg text-gray-600">
          Complex cannabis industry scenarios demonstrating intelligent agent collaboration
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{useCases.length}</div>
              <div className="text-sm text-gray-600">Use Cases</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {useCases.reduce((sum, uc) => sum + uc.scenarios, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Scenarios</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">9</div>
              <div className="text-sm text-gray-600">AI Agents</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {useCases.reduce((sum, uc) => sum + uc.agents.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Agent Interactions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Use Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {useCases.map((useCase) => (
          <Card key={useCase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useCase.color} text-white`}>
                  {useCase.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold">{useCase.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={complexityColors[useCase.complexity]}>
                      {useCase.complexity}
                    </Badge>
                    <span className="text-sm text-gray-500">{useCase.estimatedTime}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{useCase.description}</p>
              
              {/* Agents Involved */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Agents Involved:</div>
                <div className="flex flex-wrap gap-1">
                  {useCase.agents.map((agent) => (
                    <Badge key={agent} variant="secondary" className={agentColors[agent]}>
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Scenarios Count */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {useCase.scenarios} scenario{useCase.scenarios !== 1 ? 's' : ''} available
                </div>
                <div className="text-sm text-gray-600">
                  {useCase.agents.length} agent{useCase.agents.length !== 1 ? 's' : ''} involved
                </div>
              </div>

              {/* Question to Chat */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Question to Chat:</span>
                </div>
                <div className="text-sm text-gray-700 mb-2 italic">
                  "{useCase.chatQuestion}"
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(useCase.chatQuestion, useCases.indexOf(useCase))}
                  className="text-xs"
                >
                  {copiedIndex === useCases.indexOf(useCase) ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Question
                    </>
                  )}
                </Button>
              </div>

              {/* Action Button */}
              <Link href={`/use/${useCase.id}`}>
                <Button className="w-full" variant="outline">
                  Explore Use Case
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            How Multi-Agent Collaboration Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Query Analysis</h3>
              <p className="text-sm text-gray-600">
                System analyzes the query and determines which specialized agents are needed based on expertise requirements.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Agent Collaboration</h3>
              <p className="text-sm text-gray-600">
                Multiple agents work together, sharing insights and cross-referencing expertise to provide comprehensive analysis.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Consensus & Recommendations</h3>
              <p className="text-sm text-gray-600">
                System generates consensus findings, final recommendations, and comprehensive risk assessments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}