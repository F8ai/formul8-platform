import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  FlaskConical, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  Bell,
  BarChart3,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Maximize2,
  MoreHorizontal
} from "lucide-react";

interface WidgetProps {
  type: string;
  title?: string;
  settings?: Record<string, any>;
  onResize?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

// Mock data - in real implementation, this would come from APIs
const MOCK_DATA = {
  agentStatus: [
    { name: 'Compliance Expert', status: 'active', accuracy: 94, queries: 23 },
    { name: 'Formulation Specialist', status: 'active', accuracy: 97, queries: 18 },
    { name: 'Marketing Strategist', status: 'idle', accuracy: 89, queries: 7 },
    { name: 'Operations Engineer', status: 'active', accuracy: 92, queries: 15 },
  ],
  recentActivity: [
    { user: 'Sarah Chen', action: 'Asked about California compliance', time: '2 mins ago', type: 'compliance' },
    { user: 'Mike Rodriguez', action: 'Reviewed formulation for CBD gummies', time: '15 mins ago', type: 'formulation' },
    { user: 'Alex Kim', action: 'Updated SOP for extraction process', time: '1 hour ago', type: 'operations' },
    { user: 'Emma Davis', action: 'Generated marketing copy for edibles', time: '2 hours ago', type: 'marketing' },
  ],
  compliance: {
    overallScore: 95,
    activeIssues: 2,
    upcomingDeadlines: 3,
    recentUpdates: 5
  },
  costs: {
    thisMonth: 1247.50,
    lastMonth: 1089.25,
    budget: 2000,
    breakdown: [
      { service: 'OpenAI API', cost: 789.30, percentage: 63 },
      { service: 'Anthropic API', cost: 234.50, percentage: 19 },
      { service: 'Google Gemini', cost: 156.20, percentage: 13 },
      { service: 'Other', cost: 67.50, percentage: 5 }
    ]
  }
};

export default function DashboardWidget({ type, title, settings, onResize, onEdit, onRemove, className }: WidgetProps) {
  const renderWidgetContent = () => {
    switch (type) {
      case 'agent-status':
        return (
          <div className="space-y-3">
            {MOCK_DATA.agentStatus.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.queries} queries today</p>
                  </div>
                </div>
                <Badge variant={agent.accuracy > 90 ? "default" : "secondary"}>
                  {agent.accuracy}%
                </Badge>
              </div>
            ))}
          </div>
        );

      case 'recent-activity':
        return (
          <div className="space-y-3">
            {MOCK_DATA.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        );

      case 'compliance-summary':
        const { overallScore, activeIssues, upcomingDeadlines, recentUpdates } = MOCK_DATA.compliance;
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-formul8-primary">{overallScore}%</div>
              <p className="text-sm text-gray-500">Overall Compliance Score</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-semibold text-red-600">{activeIssues}</div>
                <p className="text-xs text-gray-500">Active Issues</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">{upcomingDeadlines}</div>
                <p className="text-xs text-gray-500">Deadlines</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{recentUpdates}</div>
                <p className="text-xs text-gray-500">Updates</p>
              </div>
            </div>
          </div>
        );

      case 'cost-tracker':
        const { thisMonth, lastMonth, budget, breakdown } = MOCK_DATA.costs;
        const budgetUsed = (thisMonth / budget) * 100;
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">${thisMonth.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">vs Last Month</p>
                <p className={`font-medium ${thisMonth > lastMonth ? 'text-red-600' : 'text-green-600'}`}>
                  {((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Budget Usage</span>
                <span>{budgetUsed.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUsed} className="h-2" />
            </div>
            <div className="space-y-2">
              {breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.service}</span>
                  <span className="font-medium">${item.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'chat-quick-access':
        return (
          <div className="space-y-3">
            {['Compliance Expert', 'Formulation Specialist', 'Marketing Strategist'].map((agent, index) => (
              <Button key={index} variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with {agent}
              </Button>
            ))}
            <Button className="w-full" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Start Group Chat
            </Button>
          </div>
        );

      case 'metrics-overview':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-bold">247</div>
              <div className="text-xs text-gray-600">Total Queries</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-bold">94.2%</div>
              <div className="text-xs text-gray-600">Avg Accuracy</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-xl font-bold">2.1s</div>
              <div className="text-xs text-gray-600">Avg Response</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Activity className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-bold">89%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-lg font-semibold">Upcoming Deadlines</div>
              <div className="text-sm text-gray-500">Next 7 days</div>
            </div>
            <div className="space-y-2">
              {[
                { task: 'Nevada compliance report', date: 'Today', urgency: 'high' },
                { task: 'Product testing results', date: 'Tomorrow', urgency: 'medium' },
                { task: 'Marketing review meeting', date: 'Friday', urgency: 'low' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm font-medium">{item.task}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    item.urgency === 'high' ? 'bg-red-500' : 
                    item.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-2">
            {[
              { message: 'New compliance update for CA', type: 'info', time: '5m' },
              { message: 'Agent accuracy below threshold', type: 'warning', time: '1h' },
              { message: 'System maintenance scheduled', type: 'info', time: '3h' },
            ].map((notification, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {notification.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time} ago</p>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Widget configuration needed</p>
            </div>
          </div>
        );
    }
  };

  const getWidgetIcon = () => {
    const iconMap = {
      'agent-status': Shield,
      'recent-activity': Activity,
      'compliance-summary': CheckCircle,
      'formulation-queue': FlaskConical,
      'cost-tracker': DollarSign,
      'chat-quick-access': MessageSquare,
      'metrics-overview': BarChart3,
      'calendar': Calendar,
      'notifications': Bell,
    };
    
    const IconComponent = iconMap[type as keyof typeof iconMap] || Settings;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Card className={`relative group ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getWidgetIcon()}
            <CardTitle className="text-base font-medium">
              {title || type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onResize}>
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
              <Settings className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}