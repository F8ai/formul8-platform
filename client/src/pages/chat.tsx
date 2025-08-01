import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FormulaChatInterface from "@/components/FormulaChatInterface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Shield, FlaskConical, ShoppingCart } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">F8</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your AI Cannabis OS</h1>
              <p className="text-sm text-gray-600">Multi-agent assistance at your fingertips</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All Agents Online
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
              <Settings className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Get expert cannabis guidance instantly
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chat with PhD formulators, compliance specialists, and cannabis industry veterans—all powered by AI.
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="shadow-xl border-0 overflow-hidden mb-8">
          <div className="h-[600px]">
            <FormulaChatInterface />
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              title: "State Compliance Check", 
              desc: "Verify your operations meet all regulatory requirements", 
              icon: Shield, 
              color: "text-green-600",
              prompt: "I need help checking if my cannabis operation complies with state regulations. Can you guide me through the key compliance requirements?"
            },
            { 
              title: "Formulation Assistance", 
              desc: "Get help with product development and chemistry", 
              icon: FlaskConical, 
              color: "text-purple-600",
              prompt: "I'm developing a new cannabis product and need help with the formulation. Can you assist with dosing, stability, and chemistry considerations?"
            },
            { 
              title: "Equipment Sourcing", 
              desc: "Find trusted vendors and equipment suppliers", 
              icon: ShoppingCart, 
              color: "text-blue-600",
              prompt: "I need to source equipment for my cannabis operation. Can you help me find trusted vendors and recommend the right equipment for my needs?"
            },
          ].map((action, index) => (
            <Card 
              key={index} 
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200/50"
              onClick={() => {
                // This would trigger the chat with the predefined prompt
                // For now, we'll just scroll to the chat interface
                document.querySelector('.min-h-screen')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="flex items-start space-x-3">
                <action.icon className={`w-6 h-6 ${action.color} mt-1`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Powered by multi-agent verification system</p>
          <div className="flex justify-center items-center space-x-6 text-xs text-gray-400">
            <span>✓ Real-time responses</span>
            <span>✓ Multi-agent consensus</span>
            <span>✓ Industry expertise</span>
            <span>✓ Regulatory compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}