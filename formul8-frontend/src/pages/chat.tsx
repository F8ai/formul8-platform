import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";
import FormulaChatInterface from "@/components/FormulaChatInterface";
import Formul8Logo from "@/components/Formul8Logo";
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
    <PageLayout activeFeature="chat">
      <div className="min-h-full bg-formul8-dark overflow-y-auto">
      {/* Header */}
      <header className="formul8-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Formul8Logo size="lg" showText={true} />
            <div className="ml-4">
              <p className="text-sm text-formul8-gray">Your AI powered Cannabis OS</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-formul8-teal text-formul8-teal bg-formul8-teal/10">
              <div className="w-2 h-2 bg-formul8-teal rounded-full mr-2"></div>
              All Agents Online
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/dashboard"}
              className="border-formul8-blue text-formul8-blue hover:bg-formul8-blue/20"
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
          <h2 className="text-4xl md:text-5xl font-bold text-formul8-white mb-6">
            Your <span className="formul8-text-gradient">AI powered Cannabis OS.</span>
          </h2>
          <p className="text-lg md:text-xl text-formul8-gray max-w-4xl mx-auto mb-8 leading-relaxed">
            Formul8.ai puts a PhD formulator, extraction wizard, processing engineer, SOP writer, compliance strategist, sourcing agent, analytical chemist, and marketer at your fingertips—launch and process products 10× faster.
          </p>
          <div className="mb-8">
            <button className="formul8-button-primary">
              Try the Formul8 Preview - Click Here
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="formul8-card shadow-2xl border-0 overflow-hidden mb-8 animate-fade-in">
          <div className="h-[650px]">
            <FormulaChatInterface />
          </div>
        </div>

        {/* Cannabis OS Features - Dark Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-fade-in">
          {[
            { 
              title: "State Compliance Engine", 
              desc: "Expert Regulatory Assistance for all 50 states", 
              icon: Shield, 
              iconClass: "formul8-icon-teal"
            },
            { 
              title: "QC Calculator Suite", 
              desc: "Formulation, Yield, & More calculations", 
              icon: FlaskConical, 
              iconClass: "formul8-icon-blue"
            },
            { 
              title: "Extraction Optimizer", 
              desc: "Maximize cannabinoid recovery", 
              icon: ShoppingCart, 
              iconClass: "formul8-icon-green"
            },
            { 
              title: "Formulation Designer", 
              desc: "Rapid product iteration", 
              icon: FlaskConical, 
              iconClass: "formul8-icon-teal"
            },
            { 
              title: "Sourcing Marketplace", 
              desc: "Get ingredients, equipment, and services in an instant", 
              icon: ShoppingCart, 
              iconClass: "formul8-icon-blue"
            },
            { 
              title: "Expert Chat", 
              desc: "Multi-agent assistance", 
              icon: MessageSquare, 
              iconClass: "formul8-icon-green"
            },
          ].map((feature, index) => (
            <div key={index} className="formul8-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className={`${feature.iconClass} mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-formul8-white mb-2">{feature.title}</h3>
              <p className="text-sm text-formul8-gray leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Cost Comparison - Dark Theme */}
        <div className="formul8-card p-8 mb-12 animate-fade-in">
          <div className="text-center space-y-8">
            <h3 className="text-3xl font-bold text-formul8-white">Cost Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Formul8Logo size="xl" showText={false} />
                </div>
                <h4 className="text-2xl font-bold formul8-text-gradient">Formul8.ai</h4>
                <p className="text-4xl font-bold text-formul8-white">$5k-$50k / yr</p>
                <p className="text-formul8-gray">Complete AI-powered R&D team</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-formul8-border rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-formul8-gray font-bold text-xl">👥</span>
                </div>
                <h4 className="text-2xl font-bold text-formul8-gray">Traditional Staff</h4>
                <p className="text-4xl font-bold text-formul8-white">$500k+ / yr</p>
                <p className="text-formul8-gray">Human experts only</p>
              </div>
            </div>
            <div className="bg-formul8-teal/10 border border-formul8-teal/30 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-formul8-teal font-bold text-xl">97% cost reduction, 10× faster go-to-market and production</p>
            </div>
          </div>
        </div>

        {/* Footer Features */}
        <div className="text-center space-y-6 animate-fade-in">
          <p className="text-lg font-semibold text-formul8-white">Frequently Asked Questions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="space-y-4">
              <h4 className="font-bold text-formul8-white">How accurate is the compliance checking?</h4>
              <p className="text-formul8-gray text-sm leading-relaxed">Our compliance engine is updated daily with the latest regulations from all 50 states. It achieves 99.9% accuracy in regulatory checks, verified by third-party auditors.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-formul8-white">What's included in the subscription?</h4>
              <p className="text-formul8-gray text-sm leading-relaxed">Tiered subscriptions fit to client can include unlimited access to the AI assistant, SOP generation, compliance checking, supplier network, and regular regulatory updates.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}