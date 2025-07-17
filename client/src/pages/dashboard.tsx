import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import AgentStatusCard from "@/components/agent-status-card";
import QueryInterface from "@/components/query-interface";
import RecentActivity from "@/components/recent-activity";
import VerificationLog from "@/components/verification-log";
import AgentNetworkGraph from "@/components/agent-network-graph";
import GitHubActivity from "@/components/github-activity";
import SpeedometerAgentLayout from "@/components/speedometer-agent-layout";
import { TrendChart } from "@/components/ui/trend-chart";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: agentStatuses, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/agents/status"],
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  // Fetch agent network data from API
  const { data: agentNodes } = useQuery({
    queryKey: ["/api/agents/network/nodes"],
    enabled: isAuthenticated,
  });

  const { data: agentInteractions } = useQuery({
    queryKey: ["/api/agents/network/interactions"],
    enabled: isAuthenticated,
  });

  const handleExport = (format: string) => {
    if (format === 'csv') {
      window.open('/api/export/csv', '_blank');
    } else {
      toast({
        title: "Export Coming Soon",
        description: `${format.toUpperCase()} export will be available soon.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-formul8-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">F8</span>
          </div>
          <p className="text-formul8-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-formul8-dark truncate">
                <span className="hidden md:inline">Agent Orchestration Dashboard</span>
                <span className="md:hidden">Orchestration Dashboard</span>
              </h2>
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <i className="fas fa-circle text-green-400 mr-2" style={{fontSize: '8px'}}></i>
                All Agents Online
              </span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button 
                onClick={() => window.location.href = "/profile"}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <i className="fas fa-user mr-0 md:mr-2"></i>
                <span className="hidden md:inline">Profile</span>
              </Button>
              <Button 
                onClick={() => handleExport('csv')}
                className="bg-formul8-blue hover:bg-blue-600 text-white hidden sm:flex"
                size="sm"
              >
                <i className="fas fa-download mr-2"></i>
                Export Data
              </Button>
              <Button className="bg-formul8-green hover:bg-formul8-light-green text-white" size="sm">
                <i className="fas fa-plus mr-0 md:mr-2"></i>
                <span className="hidden md:inline">New Query</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* 90-Day Progress Trend Chart */}
          <div className="mb-8">
            <TrendChart
              data={{
                dates: ['7/1/2025', '7/7/2025', '7/14/2025'],
                accuracy: [42, 45, 47],
                confidence: [0.48, 0.52, 0.55],
                baselineConfidence: [0.45, 0.50, 0.52],
                testsPassed: [42, 45, 47],
              }}
              agentType="System Average"
              showProjections={true}
            />
          </div>

          {/* Speedometer Agent Layout */}
          <div className="mb-8">
            <SpeedometerAgentLayout />
          </div>

          {/* Query Interface and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <QueryInterface />
            </div>
            
            {/* Quick Actions */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-formul8-dark mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-shield-alt text-formul8-green"></i>
                      <div>
                        <p className="font-medium text-formul8-dark">Compliance Check</p>
                        <p className="text-xs text-formul8-gray">Verify SOP compliance</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-flask text-orange-500"></i>
                      <div>
                        <p className="font-medium text-formul8-dark">Formulation Help</p>
                        <p className="text-xs text-formul8-gray">Product development</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-shopping-cart text-yellow-600"></i>
                      <div>
                        <p className="font-medium text-formul8-dark">Equipment Sourcing</p>
                        <p className="text-xs text-formul8-gray">Find trusted vendors</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Activity */}
          <div className="mb-8">
            <GitHubActivity />
          </div>

          {/* Recent Activity & Verification Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentActivity />
            <VerificationLog />
          </div>

          {/* Agent Network Graph */}
          {agentNodes && agentInteractions && (
            <div className="mb-8">
              <AgentNetworkGraph 
                agents={agentNodes}
                interactions={agentInteractions}
                onNodeClick={(nodeId) => {
                  console.log('Selected agent:', nodeId);
                  // Could navigate to agent detail page
                }}
              />
            </div>
          )}

          {/* Project Memory & Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-formul8-dark">Project Memory & Data Export</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <i className="fas fa-file-csv mr-2"></i>
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <i className="fas fa-file-pdf mr-2"></i>
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExport('asana')}
                >
                  <i className="fas fa-tasks mr-2"></i>
                  Asana
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-formul8-light-gray rounded-lg">
                <p className="text-2xl font-bold text-formul8-dark">{stats?.totalQueries || 0}</p>
                <p className="text-sm text-formul8-gray">Total Queries</p>
              </div>
              <div className="text-center p-4 bg-formul8-light-gray rounded-lg">
                <p className="text-2xl font-bold text-formul8-dark">{stats?.verifiedAnswers || 0}</p>
                <p className="text-sm text-formul8-gray">Verified Answers</p>
              </div>
              <div className="text-center p-4 bg-formul8-light-gray rounded-lg">
                <p className="text-2xl font-bold text-formul8-dark">{stats?.activeProjects || 0}</p>
                <p className="text-sm text-formul8-gray">Active Projects</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
