import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Shield,
  Beaker,
  Calculator,
  FlaskConical,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign,
  MessageSquareText,
  Users,
  ShoppingCart,
  UserCheck,
  Menu,
  X,
  Home,
  HelpCircle
} from "lucide-react";
import { useState } from "react";

const features = [
  { 
    id: 'compliance', 
    name: 'State Compliance Engine', 
    icon: Shield, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    route: '/agent/compliance'
  },
  { 
    id: 'calculator', 
    name: 'QC Calculator Suite', 
    icon: Calculator, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    route: '/calculator'
  },
  { 
    id: 'extraction', 
    name: 'Extraction Optimizer', 
    icon: FlaskConical, 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    route: '/extraction'
  },
  { 
    id: 'formulation', 
    name: 'Formulation Designer', 
    icon: Beaker, 
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    route: '/agent/formulation'
  },
  { 
    id: 'stability', 
    name: 'Stability Predictor', 
    icon: AlertTriangle, 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    route: '/stability'
  },
  { 
    id: 'sop', 
    name: 'GMP SOP Library', 
    icon: FileText, 
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    route: '/sop'
  },
  { 
    id: 'margin', 
    name: 'Margin Calculator', 
    icon: DollarSign, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    route: '/margin'
  },
  { 
    id: 'sourcing', 
    name: 'Sourcing Marketplace', 
    icon: ShoppingCart, 
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    route: '/agent/sourcing'
  },
  { 
    id: 'copy', 
    name: 'Compliant Copy', 
    icon: MessageSquareText, 
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    route: '/copy'
  },
  { 
    id: 'audit', 
    name: 'Audit Trail Export', 
    icon: Scale, 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    route: '/audit'
  },
  { 
    id: 'user-sop', 
    name: 'User Generated SOPs', 
    icon: UserCheck, 
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    route: '/user-sop'
  },
  { 
    id: 'chat', 
    name: 'Expert Chat', 
    icon: Users, 
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    route: '/api/login'
  }
];

export default function Landing() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFeatureClick = (route: string) => {
    window.location.href = route;
  };

  return (
    <div className="min-h-screen bg-formul8-bg-dark relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-formul8-bg-card border border-formul8-border rounded-lg flex items-center justify-center text-formul8-white hover:bg-formul8-primary/20 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left Sidebar Toolbar - Replit Style */}
      <div className={`fixed left-0 top-0 h-full w-14 bg-formul8-bg-card border-r border-formul8-border z-40 flex flex-col items-center py-3 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Home Icon at Top */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.location.href = '/'}
              className="w-10 h-10 rounded-lg bg-formul8-primary/20 flex items-center justify-center hover:scale-105 transition-all duration-200 hover:shadow-lg group mb-4"
            >
              <Home className="w-5 h-5 text-formul8-primary group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-formul8-bg-dark border-formul8-border text-formul8-white">
            <p className="text-sm font-medium">Home</p>
          </TooltipContent>
        </Tooltip>

        {/* Feature Icons */}
        <div className="flex flex-col space-y-1 flex-1">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Tooltip key={feature.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleFeatureClick(feature.route)}
                    className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center hover:scale-105 transition-all duration-200 hover:shadow-lg group`}
                  >
                    <Icon className={`w-4 h-4 ${feature.color} group-hover:scale-110 transition-transform`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-formul8-bg-dark border-formul8-border text-formul8-white">
                  <p className="text-sm font-medium">{feature.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Help Icon at Bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.open('https://docs.formul8.ai', '_blank')}
              className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center hover:scale-105 transition-all duration-200 hover:shadow-lg group"
            >
              <HelpCircle className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-formul8-bg-dark border-formul8-border text-formul8-white">
            <p className="text-sm font-medium">Help & Documentation</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-14 transition-all duration-300">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo - Formul8.ai Molecular Style Logo */}
            <div className="mb-16">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  {/* Molecular structure inspired by the logo */}
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#19E6CC" />
                      <stop offset="50%" stopColor="#1AB7E6" />
                      <stop offset="100%" stopColor="#4A90E2" />
                    </linearGradient>
                  </defs>
                  {/* Molecular nodes */}
                  <circle cx="40" cy="20" r="8" fill="url(#logoGradient)" />
                  <circle cx="25" cy="45" r="6" fill="url(#logoGradient)" />
                  <circle cx="55" cy="45" r="6" fill="url(#logoGradient)" />
                  <circle cx="40" cy="60" r="5" fill="url(#logoGradient)" />
                  {/* Molecular bonds */}
                  <line x1="40" y1="28" x2="31" y2="39" stroke="url(#logoGradient)" strokeWidth="2" />
                  <line x1="40" y1="28" x2="49" y2="39" stroke="url(#logoGradient)" strokeWidth="2" />
                  <line x1="31" y1="51" x2="43" y2="55" stroke="url(#logoGradient)" strokeWidth="2" />
                  <line x1="49" y1="51" x2="43" y2="55" stroke="url(#logoGradient)" strokeWidth="2" />
                </svg>
              </div>
              <div className="text-formul8-white text-3xl font-bold tracking-widest mb-2" style={{fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace'}}>
                FORMUL8.AI
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
              <span className="text-formul8-white">Your AI powered </span>
              <span className="bg-formul8-gradient-text bg-clip-text text-transparent">
                Cannabis OS.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-formul8-gray mb-12 max-w-3xl mx-auto leading-relaxed">
              Formul8.ai puts a PhD formulator, extraction wizard, processing engineer, SOP writer,
              compliance strategist, sourcing agent, analytical chemist, and marketer at your 
              fingertips—launch and process products 10× faster.
            </p>

            {/* CTA Button */}
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-formul8-button-green hover:bg-formul8-green text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Try the Formul8 Preview - Click Here
            </Button>
          </div>
        </section>

        {/* Features Grid - All 12 Features from Homepage */}
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id}
                    className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleFeatureClick(feature.route)}
                  >
                    <CardContent className="p-0">
                      <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-formul8-white font-semibold mb-2">{feature.name}</h3>
                      <p className="text-formul8-gray text-sm">
                        {feature.id === 'compliance' && 'Expert Regulatory Assistance for all 50 states'}
                        {feature.id === 'calculator' && 'Formulation, Yield, & More calculations'}
                        {feature.id === 'extraction' && 'Maximize cannabinoid recovery'}
                        {feature.id === 'formulation' && 'Rapid product iteration'}
                        {feature.id === 'stability' && 'Shelf-life & aging models'}
                        {feature.id === 'sop' && 'Auto-generated workflows'}
                        {feature.id === 'margin' && 'Live COGS tracking'}
                        {feature.id === 'sourcing' && 'Get ingredients, equipment, and services in an instant'}
                        {feature.id === 'copy' && 'Regulatory checked marketing'}
                        {feature.id === 'audit' && 'One-click compliance records'}
                        {feature.id === 'user-sop' && 'SOPs from industry leaders'}
                        {feature.id === 'chat' && 'Multi-agent assistance'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}