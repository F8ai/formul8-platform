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
              <p className="text-sm text-gray-600">10× faster product development & operations</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All Agents Online
            </Badge>
            <Button variant="outline" size="sm">
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
            <div className="text-center space-y-4 py-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Multi-agent assistance at your fingertips
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get expert guidance from PhD formulators, compliance specialists, and cannabis industry veterans—all in one chat interface.
              </p>
            </div>

            {/* Chat Interface */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-[600px]">
                <FormulaChatInterface />
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "State Compliance Check", desc: "Verify your operations meet all regulatory requirements", icon: Shield, color: "text-green-600" },
                { title: "Formulation Assistance", desc: "Get help with product development and chemistry", icon: FlaskConical, color: "text-purple-600" },
                { title: "Equipment Sourcing", desc: "Find trusted vendors and equipment suppliers", icon: ShoppingCart, color: "text-blue-600" },
              ].map((action, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200/50">
                  <div className="flex items-start space-x-3">
                    <action.icon className={`w-6 h-6 ${action.color} mt-1`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${agent.color} rounded-lg flex items-center justify-center`}>
                        <agent.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.desc}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        Active
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalQueries || 0}</p>
                    <p className="text-sm text-gray-600">Total Queries</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.verifiedAnswers || 0}</p>
                    <p className="text-sm text-gray-600">Verified Answers</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeProjects || 0}</p>
                    <p className="text-sm text-gray-600">Active Projects</p>
                  </div>
                </div>
              </Card>
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
