import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, TrendingUp, AlertTriangle, Target, Users, PieChart, Calendar, Clock, FileSpreadsheet, FileText, Presentation, Download, Share } from "lucide-react";

interface CostSummary {
  totalCosts: number;
  dailyCosts: number;
  weeklyCosts: number;
  monthlyCosts: number;
  costPerUser: number;
  activeUsers: number;
  averageCostPerQuery: number;
  totalQueries: number;
}

interface AgentCostBreakdown {
  agentType: string;
  totalCost: number;
  queriesCount: number;
  avgCostPerQuery: number;
  percentage: number;
}

interface UserCostBreakdown {
  userId: string;
  userName: string;
  email: string;
  totalCost: number;
  queriesCount: number;
  avgCostPerQuery: number;
  lastActivity: string;
}

interface BudgetStatus {
  id: number;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  period: string;
  status: 'healthy' | 'warning' | 'exceeded';
  agentTypes: string[];
}

export default function CostDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: costSummary, isLoading: summaryLoading } = useQuery<CostSummary>({
    queryKey: ["/api/costs/summary"],
  });

  const { data: agentCosts, isLoading: agentLoading } = useQuery<AgentCostBreakdown[]>({
    queryKey: ["/api/costs/by-agent"],
  });

  const { data: userCosts, isLoading: userLoading } = useQuery<UserCostBreakdown[]>({
    queryKey: ["/api/costs/by-user"],
  });

  const { data: budgets, isLoading: budgetLoading } = useQuery<BudgetStatus[]>({
    queryKey: ["/api/budgets/status"],
  });

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatCurrencyLarge = (amount: number) => `$${amount.toFixed(2)}`;

  // Generate Google Drive reports
  const generateReportMutation = useMutation({
    mutationFn: async (reportType: 'sheet' | 'slides' | 'doc') => {
      const endpoint = reportType === 'sheet' ? '/api/drive/cost-report/sheet' :
                     reportType === 'slides' ? '/api/drive/cost-report/slides' :
                     '/api/drive/cost-report/doc';
      return await apiRequest(endpoint, { method: 'POST' });
    },
    onSuccess: (data, reportType) => {
      toast({
        title: "Report Generated Successfully",
        description: `Your ${reportType === 'sheet' ? 'spreadsheet' : reportType === 'slides' ? 'presentation' : 'document'} has been created in Google Drive.`,
      });
      // Open the generated file
      if (data.file?.webViewLink) {
        window.open(data.file.webViewLink, '_blank');
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = (reportType: 'sheet' | 'slides' | 'doc') => {
    generateReportMutation.mutate(reportType);
  };

  const handleExportData = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      window.open('/api/export/costs/csv', '_blank');
    } else {
      toast({
        title: "Export Coming Soon",
        description: `${format.toUpperCase()} export will be available soon.`,
      });
    }
  };

  if (summaryLoading || agentLoading || userLoading || budgetLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-formul8-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-formul8-text-secondary">Total Costs</p>
                <p className="text-2xl font-bold text-formul8-primary">
                  {formatCurrencyLarge(costSummary?.totalCosts || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-formul8-primary" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-formul8-text-secondary ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-formul8-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-formul8-text-secondary">Cost Per User</p>
                <p className="text-2xl font-bold text-formul8-secondary">
                  {formatCurrencyLarge(costSummary?.costPerUser || 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-formul8-secondary" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-formul8-text-secondary">
                {costSummary?.activeUsers || 0} active users
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-formul8-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-formul8-text-secondary">Daily Costs</p>
                <p className="text-2xl font-bold text-formul8-tertiary">
                  {formatCurrencyLarge(costSummary?.dailyCosts || 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-formul8-tertiary" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-formul8-text-secondary">
                {formatCurrency(costSummary?.averageCostPerQuery || 0)} per query
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-formul8-text-secondary">Total Queries</p>
                <p className="text-2xl font-bold text-orange-600">
                  {costSummary?.totalQueries || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-formul8-text-secondary">
                This month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Budget Status
          </CardTitle>
          <CardDescription>
            Current budget utilization and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets?.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{budget.name}</h4>
                    <Badge 
                      variant={budget.status === 'healthy' ? 'default' : budget.status === 'warning' ? 'destructive' : 'secondary'}
                    >
                      {budget.status === 'exceeded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {budget.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-sm text-formul8-text-secondary">
                    <span>{formatCurrencyLarge(budget.spent)} / {formatCurrencyLarge(budget.amount)}</span>
                    <span>{budget.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={budget.percentage} 
                    className={`h-2 ${budget.status === 'exceeded' ? 'bg-red-100' : budget.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}
                  />
                  <div className="flex items-center mt-2 text-xs text-formul8-text-secondary">
                    <span>Period: {budget.period}</span>
                    <span className="mx-2">•</span>
                    <span>Agents: {budget.agentTypes.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdowns */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Cost by Agent</TabsTrigger>
          <TabsTrigger value="users">Cost by User</TabsTrigger>
          <TabsTrigger value="timeline">Cost Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Agent Cost Breakdown
              </CardTitle>
              <CardDescription>
                Cost analysis by AI agent type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentCosts?.map((agent) => (
                  <div key={agent.agentType} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-formul8-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-formul8-primary font-bold text-lg">
                          {agent.agentType.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{agent.agentType}</h4>
                        <p className="text-sm text-formul8-text-secondary">
                          {agent.queriesCount} queries • {formatCurrency(agent.avgCostPerQuery)} avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrencyLarge(agent.totalCost)}</p>
                      <p className="text-sm text-formul8-text-secondary">{agent.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Cost Analysis
              </CardTitle>
              <CardDescription>
                Per-user cost breakdown and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userCosts?.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold">
                          {user.userName?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{user.userName || user.email}</h4>
                        <p className="text-sm text-formul8-text-secondary">
                          {user.queriesCount} queries • Last active: {new Date(user.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrencyLarge(user.totalCost)}</p>
                      <p className="text-sm text-formul8-text-secondary">
                        {formatCurrency(user.avgCostPerQuery)} avg/query
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Cost Timeline</CardTitle>
              <CardDescription>
                Historical cost trends and projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-formul8-surface rounded-lg">
                    <p className="text-sm text-formul8-text-secondary">Weekly</p>
                    <p className="text-xl font-bold">{formatCurrencyLarge(costSummary?.weeklyCosts || 0)}</p>
                  </div>
                  <div className="text-center p-4 bg-formul8-surface rounded-lg">
                    <p className="text-sm text-formul8-text-secondary">Monthly</p>
                    <p className="text-xl font-bold">{formatCurrencyLarge(costSummary?.monthlyCosts || 0)}</p>
                  </div>
                  <div className="text-center p-4 bg-formul8-surface rounded-lg">
                    <p className="text-sm text-formul8-text-secondary">Projected</p>
                    <p className="text-xl font-bold">{formatCurrencyLarge((costSummary?.monthlyCosts || 0) * 1.15)}</p>
                  </div>
                </div>
                <div className="text-center py-8 text-formul8-text-secondary">
                  <PieChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Detailed cost charts coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Google Drive Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Generate Reports
          </CardTitle>
          <CardDescription>
            Create comprehensive reports in Google Drive for sharing and collaboration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleGenerateReport('sheet')}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Generate Spreadsheet
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleGenerateReport('slides')}
            >
              <Presentation className="h-4 w-4 mr-2" />
              Generate Presentation
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => handleGenerateReport('doc')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Document
            </Button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Share className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Your Personal Drive Space</h4>
                <p className="text-sm text-blue-700 mt-1">
                  All generated reports are automatically saved to your personal Google Drive folder and shared with your email address for easy access and collaboration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button className="bg-formul8-primary hover:bg-formul8-primary/90">
          <Target className="h-4 w-4 mr-2" />
          Set Budget Alert
        </Button>
        <Button variant="outline" onClick={() => handleExportData('csv')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV Data
        </Button>
      </div>
    </div>
  );
}