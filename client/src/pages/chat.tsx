import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FormulaChatInterface from "@/components/FormulaChatInterface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Shield, FlaskConical, ShoppingCart } from "lucide-react";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">F8</span>
          </div>
          <p className="text-gray-600 font-medium">Loading your Cannabis OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-formul8-gradient-bg">
      {/* Header */}
      <header className="formul8-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-formul8-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">F8</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold formul8-text-gradient">Formul8.ai</h1>
              <p className="text-sm text-formul8-text-secondary">Your AI powered Cannabis OS</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-formul8-primary text-formul8-primary bg-green-50">
              <div className="w-2 h-2 bg-formul8-primary rounded-full mr-2"></div>
              All Agents Online
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/dashboard"}
              className="border-formul8-secondary text-formul8-secondary hover:bg-formul8-secondary hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="formul8-hero animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your <span className="formul8-text-gradient">$500k R&D Team</span> in One AI Chat
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Get expert guidance from PhD formulators, compliance specialists, extraction wizards, and cannabis industry veterans—launch and process products <strong>10× faster</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center">✓ State Compliance Engine</span>
            <span className="flex items-center">✓ Formulation Designer</span>
            <span className="flex items-center">✓ Extraction Optimizer</span>
            <span className="flex items-center">✓ GMP SOP Library</span>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="formul8-card shadow-2xl border-0 overflow-hidden mb-8 animate-fade-in">
          <div className="h-[650px]">
            <FormulaChatInterface />
          </div>
        </div>

        {/* Quick Actions - Cannabis OS Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
          {[
            { 
              title: "State Compliance Engine", 
              desc: "Expert regulatory assistance for all 50 states", 
              icon: Shield, 
              color: "text-formul8-primary",
              gradient: "from-green-500 to-emerald-600"
            },
            { 
              title: "Formulation Designer", 
              desc: "Rapid product iteration and chemistry", 
              icon: FlaskConical, 
              color: "text-formul8-purple",
              gradient: "from-purple-500 to-violet-600"
            },
            { 
              title: "Sourcing Marketplace", 
              desc: "Get ingredients, equipment, and services instantly", 
              icon: ShoppingCart, 
              color: "text-formul8-secondary",
              gradient: "from-blue-500 to-indigo-600"
            },
            { 
              title: "Expert Chat", 
              desc: "Multi-agent assistance from industry veterans", 
              icon: MessageSquare, 
              color: "text-formul8-orange",
              gradient: "from-orange-500 to-red-600"
            },
          ].map((feature, index) => (
            <div key={index} className="formul8-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Cost Comparison - Formul8.ai Style */}
        <div className="formul8-card p-8 mb-12 animate-fade-in">
          <div className="text-center space-y-8">
            <h3 className="text-3xl font-bold text-gray-900">Cost Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-formul8-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-2xl">F8</span>
                </div>
                <h4 className="text-2xl font-bold formul8-text-gradient">Formul8.ai</h4>
                <p className="text-4xl font-bold text-gray-900">$5k-$50k / yr</p>
                <p className="text-gray-600">Complete AI-powered R&D team</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ PhD Formulator</p>
                  <p>✓ Compliance Expert</p>
                  <p>✓ Extraction Wizard</p>
                  <p>✓ 24/7 Availability</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-300 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-gray-600 font-bold text-xl">👥</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-600">Traditional Staff</h4>
                <p className="text-4xl font-bold text-gray-900">$500k+ / yr</p>
                <p className="text-gray-600">Human experts only</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>→ Limited availability</p>
                  <p>→ Higher overhead costs</p>
                  <p>→ Slower development</p>
                  <p>→ Single expertise areas</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-formul8-primary font-bold text-xl">97% cost reduction</p>
              <p className="text-gray-700 mt-2">10× faster go-to-market and production</p>
            </div>
          </div>
        </div>

        {/* Footer Features */}
        <div className="text-center space-y-6 animate-fade-in">
          <p className="text-lg font-semibold text-gray-700">Powered by Multi-Agent Verification System</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-formul8-primary rounded-full"></div>
              <span>Real-time responses</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-formul8-secondary rounded-full"></div>
              <span>Multi-agent consensus</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-formul8-purple rounded-full"></div>
              <span>Industry expertise</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-formul8-orange rounded-full"></div>
              <span>Regulatory compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}