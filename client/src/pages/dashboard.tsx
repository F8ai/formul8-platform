import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FormulaChatInterface from "@/components/FormulaChatInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Shield, 
  FlaskConical, 
  ShoppingCart, 
  FileText, 
  Search, 
  TrendingUp, 
  Users, 
  Zap,
  ChevronRight,
  BarChart3,
  Settings
} from "lucide-react";

const agents = [
  { id: 'compliance', name: 'Compliance Expert', icon: Shield, color: 'bg-green-500', desc: 'State regulations & GMP guidance' },
  { id: 'formulation', name: 'Formulation Specialist', icon: FlaskConical, color: 'bg-purple-500', desc: 'Product development & chemistry' },
  { id: 'sourcing', name: 'Sourcing Agent', icon: ShoppingCart, color: 'bg-blue-500', desc: 'Equipment & ingredient sourcing' },
  { id: 'patent', name: 'IP Attorney', icon: FileText, color: 'bg-indigo-500', desc: 'Patents & intellectual property' },
  { id: 'operations', name: 'Operations Engineer', icon: Settings, color: 'bg-orange-500', desc: 'Process optimization & SOPs' },
  { id: 'marketing', name: 'Marketing Strategist', icon: TrendingUp, color: 'bg-pink-500', desc: 'Regulatory marketing & copy' },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");

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

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

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
              <h1 className="text-2xl font-bold formul8-text-gradient">Formul8.ai Dashboard</h1>
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
              onClick={() => window.location.href = "/"}
              className="border-formul8-primary text-formul8-primary hover:bg-formul8-primary hover:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-formul8-secondary text-formul8-secondary hover:bg-formul8-secondary hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Expert Chat</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Agent Status</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            {/* Hero Section */}
            <div className="formul8-hero animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Multi-agent assistance at your fingertips
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get expert guidance from PhD formulators, compliance specialists, and cannabis industry veterans—all in one chat interface.
              </p>
            </div>

            {/* Chat Interface */}
            <div className="formul8-card shadow-2xl border-0 overflow-hidden animate-fade-in">
              <div className="h-[600px]">
                <FormulaChatInterface />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {[
                { title: "State Compliance Check", desc: "Verify your operations meet all regulatory requirements", icon: Shield, color: "text-formul8-primary", gradient: "from-green-500 to-emerald-600" },
                { title: "Formulation Assistance", desc: "Get help with product development and chemistry", icon: FlaskConical, color: "text-formul8-purple", gradient: "from-purple-500 to-violet-600" },
                { title: "Equipment Sourcing", desc: "Find trusted vendors and equipment suppliers", icon: ShoppingCart, color: "text-formul8-secondary", gradient: "from-blue-500 to-indigo-600" },
              ].map((action, index) => (
                <div key={index} className="formul8-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="formul8-card p-6 hover:scale-105 transition-all duration-300 animate-fade-in">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 ${agent.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <agent.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{agent.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{agent.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Badge variant="outline" className="border-formul8-primary text-formul8-primary bg-green-50">
                        Active
                      </Badge>
                      <Button variant="ghost" size="sm" className="formul8-button-gradient text-xs">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="formul8-card p-6 animate-fade-in">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold formul8-text-gradient">{stats?.totalQueries || 1247}</p>
                    <p className="text-sm text-gray-600 font-medium">Total Queries</p>
                  </div>
                </div>
              </div>
              <div className="formul8-card p-6 animate-fade-in">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold formul8-text-gradient">{stats?.verifiedAnswers || 1189}</p>
                    <p className="text-sm text-gray-600 font-medium">Verified Answers</p>
                  </div>
                </div>
              </div>
              <div className="formul8-card p-6 animate-fade-in">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold formul8-text-gradient">{stats?.activeProjects || 23}</p>
                    <p className="text-sm text-gray-600 font-medium">Active Projects</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Comparison */}
            <Card className="p-8">
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Cost Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-blue-600">Formul8.ai</h4>
                    <p className="text-3xl font-bold text-gray-900">$5k-$50k / yr</p>
                    <p className="text-sm text-gray-600">Complete AI-powered team</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-600">Traditional Staff</h4>
                    <p className="text-3xl font-bold text-gray-900">$500k+ / yr</p>
                    <p className="text-sm text-gray-600">Human experts only</p>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-green-800 font-semibold">97% cost reduction, 10× faster go-to-market</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
