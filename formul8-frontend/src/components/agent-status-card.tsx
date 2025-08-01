import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, GitBranch, Star } from "lucide-react";

interface AgentStatusCardProps {
  name: string;
  description: string;
  icon: string;
  color: string;
  agentId: string;
  status: 'online' | 'offline' | 'maintenance';
}

export default function AgentStatusCard({
  name,
  description,
  icon,
  color,
  agentId,
  status
}: AgentStatusCardProps) {
  // Fetch real GitHub metrics and baseline data for this agent
  const { data: githubMetrics, isLoading } = useQuery({
    queryKey: [`/api/github/agent-metrics/${agentId}`],
    enabled: !!agentId
  });

  const { data: baselineData } = useQuery({
    queryKey: [`/api/agents/${agentId}/baseline`],
    enabled: !!agentId
  });

  const statusColors = {
    online: 'bg-green-100 text-green-800',
    offline: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800'
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 60) return 'text-green-600';
    if (value >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeColor = (value: number) => {
    if (value >= 60) return 'success';
    if (value >= 45) return 'warning';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = githubMetrics || baselineData || { accuracy: 0, confidence: 0, tests: 0, stars: 0, commits: 0 };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              <i className={`${icon} text-white`}></i>
            </div>
            <div>
              <h4 className="font-semibold text-formul8-dark flex items-center gap-2">
                {name}
                <a 
                  href={`https://github.com/F8ai/${agentId}-agent`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </h4>
              <p className="text-sm text-formul8-gray">{description}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* GitHub Performance Badges */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={getBadgeColor(metrics.accuracy)} className="text-xs">
              Accuracy: {metrics.accuracy}%
            </Badge>
            <Badge variant={getBadgeColor(metrics.confidence)} className="text-xs">
              Confidence: {metrics.confidence}%
            </Badge>
            <Badge variant="outline" className="text-xs">
              Tests: {metrics.tests}/100
            </Badge>
          </div>

          {/* GitHub Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Star className="h-3 w-3" />
              <span>{metrics.stars}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <GitBranch className="h-3 w-3" />
              <span>{metrics.commits} commits</span>
            </div>
            <div className={`font-medium ${getPerformanceColor(metrics.accuracy)}`}>
              {metrics.accuracy < 45 ? 'Needs Improvement' : metrics.accuracy < 60 ? 'Developing' : 'Good'}
            </div>
          </div>

          {/* Performance Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                metrics.accuracy >= 60 ? 'bg-green-500' : 
                metrics.accuracy >= 45 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{width: `${Math.min(metrics.accuracy, 100)}%`}}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
