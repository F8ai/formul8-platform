import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  Bug, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Plus
} from "lucide-react";

interface GitHubIssue {
  id: number;
  title: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignee?: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  repository: string;
  priority?: 'high' | 'medium' | 'low';
  type: 'bug' | 'feature' | 'enhancement' | 'documentation';
}

interface GitHubPullRequest {
  id: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  html_url: string;
  repository: string;
  author: { login: string; avatar_url: string };
  draft: boolean;
}

export default function GitHubActivity() {
  const [activeTab, setActiveTab] = useState("issues");

  // Fetch real GitHub issues from API
  const { data: realIssues, isLoading } = useQuery({
    queryKey: ["/api/github/issues"],
    retry: false,
  });

  const mockIssues: GitHubIssue[] = realIssues || [
    {
      id: 1,
      title: "Enhanced LLM Provider Configuration UI",
      state: 'open',
      labels: [
        { name: 'Feature', color: '7057ff' },
        { name: 'ui/ux', color: 'd73a4a' },
        { name: 'high-priority', color: 'b60205' }
      ],
      created_at: '2025-01-13T19:30:00Z',
      updated_at: '2025-01-13T20:15:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/1',
      repository: 'formul8-platform',
      priority: 'high',
      type: 'feature'
    },
    {
      id: 2,
      title: "Mobile sidebar responsiveness improvements",
      state: 'closed',
      labels: [
        { name: 'Bug', color: 'd73a4a' },
        { name: 'mobile', color: '0075ca' },
        { name: 'medium-priority', color: 'fbca04' }
      ],
      created_at: '2025-01-13T18:45:00Z',
      updated_at: '2025-01-13T19:52:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/2',
      repository: 'formul8-platform',
      priority: 'medium',
      type: 'bug'
    },
    {
      id: 3,
      title: "Add agent emoji visual identification",
      state: 'closed',
      labels: [
        { name: 'Feature', color: '7057ff' },
        { name: 'design', color: 'fbca04' },
        { name: 'low-priority', color: '0e8a16' }
      ],
      created_at: '2025-01-13T17:20:00Z',
      updated_at: '2025-01-13T19:45:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/3',
      repository: 'formul8-platform',
      priority: 'low',
      type: 'feature'
    },
    {
      id: 4,
      title: "Compliance agent real regulatory data integration",
      state: 'open',
      labels: [
        { name: 'Feature', color: '7057ff' },
        { name: 'compliance', color: '0e8a16' },
        { name: 'high-priority', color: 'b60205' }
      ],
      created_at: '2025-01-12T14:30:00Z',
      updated_at: '2025-01-13T16:20:00Z',
      html_url: 'https://github.com/F8ai/compliance-agent/issues/1',
      repository: 'compliance-agent',
      priority: 'high',
      type: 'feature'
    },
    {
      id: 5,
      title: "Dashboard grid layout optimization",
      state: 'open',
      labels: [
        { name: 'Task', color: 'a2eeef' },
        { name: 'performance', color: 'ff6b6b' },
        { name: 'medium-priority', color: 'fbca04' }
      ],
      created_at: '2025-01-13T16:00:00Z',
      updated_at: '2025-01-13T19:30:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/5',
      repository: 'formul8-platform',
      priority: 'medium',
      type: 'enhancement'
    },
    {
      id: 6,
      title: "Fix network graph cytoscape runtime error",
      state: 'closed',
      labels: [
        { name: 'Bug', color: 'd73a4a' },
        { name: 'baseline-failure', color: 'ff0000' },
        { name: 'high-priority', color: 'b60205' }
      ],
      created_at: '2025-01-13T15:30:00Z',
      updated_at: '2025-01-13T18:45:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/6',
      repository: 'formul8-platform',
      priority: 'high',
      type: 'bug'
    },
    {
      id: 8,
      title: "Compliance agent baseline exam failure - regulation parsing",
      state: 'open',
      labels: [
        { name: 'Bug', color: 'd73a4a' },
        { name: 'baseline-failure', color: 'ff0000' },
        { name: 'compliance', color: '0e8a16' },
        { name: 'high-priority', color: 'b60205' }
      ],
      created_at: '2025-01-13T10:20:00Z',
      updated_at: '2025-01-13T16:45:00Z',
      html_url: 'https://github.com/F8ai/compliance-agent/issues/8',
      repository: 'compliance-agent',
      priority: 'high',
      type: 'bug'
    },
    {
      id: 9,
      title: "Formulation agent RDKit molecular analysis timeout",
      state: 'open',
      labels: [
        { name: 'Bug', color: 'd73a4a' },
        { name: 'baseline-failure', color: 'ff0000' },
        { name: 'performance', color: 'ff6b6b' },
        { name: 'medium-priority', color: 'fbca04' }
      ],
      created_at: '2025-01-13T12:15:00Z',
      updated_at: '2025-01-13T18:20:00Z',
      html_url: 'https://github.com/F8ai/formulation-agent/issues/9',
      repository: 'formulation-agent',
      priority: 'medium',
      type: 'bug'
    },
    {
      id: 7,
      title: "Update documentation for agent configuration",
      state: 'open',
      labels: [
        { name: 'Task', color: 'a2eeef' },
        { name: 'documentation', color: '0075ca' },
        { name: 'low-priority', color: '0e8a16' }
      ],
      created_at: '2025-01-13T14:15:00Z',
      updated_at: '2025-01-13T17:30:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/issues/7',
      repository: 'formul8-platform',
      priority: 'low',
      type: 'enhancement'
    }
  ];

  const mockPullRequests: GitHubPullRequest[] = [
    {
      id: 1,
      title: "feat: Add mobile-responsive sidebar with emoji agents",
      state: 'merged',
      created_at: '2025-01-13T19:52:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/pull/1',
      repository: 'formul8-platform',
      author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
      draft: false
    },
    {
      id: 2,
      title: "fix: Network graph cytoscape runtime error resolution",
      state: 'merged',
      created_at: '2025-01-13T18:30:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/pull/2',
      repository: 'formul8-platform',
      author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
      draft: false
    },
    {
      id: 3,
      title: "feat: Agent dashboard 3x3 grid layout",
      state: 'open',
      created_at: '2025-01-13T20:30:00Z',
      html_url: 'https://github.com/F8ai/formul8-platform/pull/3',
      repository: 'formul8-platform',
      author: { login: 'formul8-dev', avatar_url: 'https://github.com/formul8.png' },
      draft: false
    }
  ];

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4 text-red-500" />;
      case 'feature': return <Star className="h-4 w-4 text-blue-500" />;
      case 'enhancement': return <Plus className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'open': return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      case 'merged': return <GitBranch className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issues">Issues & Features</TabsTrigger>
            <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-green-500" />
                  {mockIssues.filter(i => i.state === 'open').length} Open
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  {mockIssues.filter(i => i.state === 'closed').length} Closed
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open('https://github.com/F8ai/formul8-platform/issues/new', '_blank')}>
                <Plus className="h-4 w-4 mr-1" />
                New Issue
              </Button>
            </div>

            <div className="space-y-2">
              {mockIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.open(issue.html_url, '_blank')}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStateIcon(issue.state)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {issue.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            #{issue.id} • {issue.repository} • {formatTimeAgo(issue.updated_at)}
                          </span>
                          {issue.priority && (
                            <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
                              {issue.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getIssueIcon(issue.type)}
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {issue.labels.slice(0, 3).map((label) => (
                        <Badge 
                          key={label.name} 
                          variant="secondary" 
                          className="text-xs"
                          style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pulls" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-green-500" />
                  {mockPullRequests.filter(pr => pr.state === 'open').length} Open
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                  {mockPullRequests.filter(pr => pr.state === 'merged').length} Merged
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open('https://github.com/F8ai/formul8-platform/compare', '_blank')}>
                <GitBranch className="h-4 w-4 mr-1" />
                New PR
              </Button>
            </div>

            <div className="space-y-2">
              {mockPullRequests.map((pr) => (
                <div 
                  key={pr.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.open(pr.html_url, '_blank')}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStateIcon(pr.state)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pr.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            #{pr.id} • {pr.repository} • by {pr.author.login} • {formatTimeAgo(pr.created_at)}
                          </span>
                          {pr.draft && (
                            <Badge variant="secondary" className="text-xs">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-4 w-4 text-blue-500" />
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}