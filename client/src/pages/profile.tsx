import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MessageSquare, 
  Activity, 
  Clock, 
  Calendar,
  Bot,
  FolderOpen,
  Search,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();

  // Fetch comprehensive user profile with history
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  // Fetch recent activity
  const { data: activity } = useQuery({
    queryKey: ["/api/user/activity"],
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground">Unable to load user profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversation_created': return <MessageSquare className="h-4 w-4" />;
      case 'query': return <Search className="h-4 w-4" />;
      case 'login': return <User className="h-4 w-4" />;
      case 'project_created': return <FolderOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-formul8-text-primary mb-2">
          User Profile
        </h1>
        <p className="text-formul8-text-secondary">
          Manage your account, view conversation history, and track your activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.firstName, profile.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : profile.email}
                  </CardTitle>
                  <CardDescription>{profile.email}</CardDescription>
                  {profile.company && (
                    <Badge variant="outline" className="mt-1">
                      {profile.company}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium capitalize">{profile.role}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Queries</div>
                  <div className="font-medium">{profile.totalQueries || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Member Since</div>
                  <div className="font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Active</div>
                  <div className="font-medium">
                    {profile.lastActiveAt 
                      ? formatDistanceToNow(new Date(profile.lastActiveAt), { addSuffix: true })
                      : 'Never'}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projects</span>
                    <span>{profile.projects?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversations</span>
                    <span>{profile.recentConversations?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recent Queries</span>
                    <span>{profile.recentQueries?.length || 0}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="queries">Queries</TabsTrigger>
            </TabsList>

            {/* Conversations Tab */}
            <TabsContent value="conversations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Conversations
                  </CardTitle>
                  <CardDescription>
                    Your recent chat sessions with AI agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {conversations && conversations.length > 0 ? (
                      <div className="space-y-4">
                        {conversations.map((conversation: any) => (
                          <div key={conversation.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0">
                              <Bot className="h-8 w-8 p-1 bg-blue-100 rounded-lg text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium truncate">
                                  {conversation.title || `${conversation.agentType} conversation`}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {conversation.agentType}
                                </Badge>
                                <Badge variant={conversation.isActive ? "default" : "secondary"} className="text-xs">
                                  {conversation.isActive ? "Active" : "Archived"}
                                </Badge>
                              </div>
                              {conversation.summary && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {conversation.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
                        <p className="text-muted-foreground">Start chatting with agents to see your conversation history here.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your recent interactions and system activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {activity && activity.length > 0 ? (
                      <div className="space-y-3">
                        {activity.map((item: any) => (
                          <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(item.activityType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium">
                                  {item.activityType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              {item.agentType && (
                                <Badge variant="outline" className="text-xs mr-2">
                                  {item.agentType}
                                </Badge>
                              )}
                              {item.details && typeof item.details === 'object' && (
                                <p className="text-xs text-muted-foreground">
                                  {JSON.stringify(item.details)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                        <p className="text-muted-foreground">Your activity history will appear here as you use the platform.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Projects
                  </CardTitle>
                  <CardDescription>
                    Your cannabis industry projects and formulations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {profile.projects && profile.projects.length > 0 ? (
                      <div className="space-y-4">
                        {profile.projects.map((project: any) => (
                          <div key={project.id} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium">{project.name}</h4>
                              <Badge variant={project.status === 'active' ? "default" : "secondary"}>
                                {project.status}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {project.description}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                        <p className="text-muted-foreground">Create your first project to get started with organized cannabis operations.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queries Tab */}
            <TabsContent value="queries">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Recent Queries
                  </CardTitle>
                  <CardDescription>
                    Your recent questions and agent interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {profile.recentQueries && profile.recentQueries.length > 0 ? (
                      <div className="space-y-4">
                        {profile.recentQueries.map((query: any) => (
                          <div key={query.id} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{query.agentType}</Badge>
                              <div className="flex items-center gap-2">
                                <Badge variant={query.status === 'completed' ? "default" : "secondary"}>
                                  {query.status}
                                </Badge>
                                {query.confidenceScore && (
                                  <Badge variant="outline">
                                    {Math.round(parseFloat(query.confidenceScore))}% confidence
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm mb-2 line-clamp-2">{query.content}</p>
                            <div className="text-xs text-muted-foreground">
                              Asked {formatDistanceToNow(new Date(query.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Queries Yet</h3>
                        <p className="text-muted-foreground">Start asking questions to our AI agents to see your query history here.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}