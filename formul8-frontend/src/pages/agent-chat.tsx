import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  User, 
  Bot, 
  ExternalLink, 
  GitBranch, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  metadata?: Record<string, any>;
}

interface AgentInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  repositoryUrl: string;
  hasInterface: boolean;
  category: string;
  capabilities: string[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function AgentChat() {
  const [, params] = useRoute("/agent/:agentId");
  const agentId = params?.agentId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: agentInfo, isLoading: agentLoading } = useQuery<AgentInfo>({
    queryKey: [`/api/agents/${agentId}/info`],
    enabled: !!agentId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest(`/api/query`, {
        method: "POST",
        body: JSON.stringify({
          query: message,
          agentType: agentId,
          context: {}
        })
      });
    },
    onSuccess: (response) => {
      const agentMessage: Message = {
        id: Date.now().toString() + '-agent',
        type: 'agent',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        metadata: response.metadata
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsLoading(false);
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        type: 'agent',
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    sendMessageMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (agentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading agent...</span>
        </div>
      </div>
    );
  }

  if (!agentInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
            <p className="text-muted-foreground">The requested agent could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Agent Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-500 text-white">
                  {agentInfo.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{agentInfo.displayName}</CardTitle>
                <p className="text-muted-foreground">{agentInfo.description}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline">{agentInfo.category}</Badge>
              <Button variant="outline" size="sm" asChild>
                <a href={agentInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Repository
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat with {agentInfo.displayName}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Sparkles className="h-8 w-8 mx-auto mb-2" />
                    <p>Start a conversation with {agentInfo.displayName}</p>
                    <p className="text-sm mt-1">Ask about cannabis {agentInfo.category.toLowerCase()} topics</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.type === 'agent' && (
                          <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="h-4 w-4 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {message.type === 'agent' && message.confidence !== undefined && (
                            <div className={`flex items-center mt-2 text-sm ${getConfidenceColor(message.confidence)}`}>
                              {getConfidenceIcon(message.confidence)}
                              <span className="ml-1">Confidence: {message.confidence}%</span>
                            </div>
                          )}
                          
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-1">Sources:</p>
                              <div className="space-y-1">
                                {message.sources.map((source, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs mr-1">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center mt-2 text-xs opacity-70">
                            <Clock className="h-3 w-3 mr-1" />
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <Separator />
              
              {/* Input Area */}
              <div className="p-4">
                <div className="flex space-x-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ${agentInfo.displayName} about cannabis ${agentInfo.category.toLowerCase()}...`}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agentInfo.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline" className="mr-1 mb-1">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={agentInfo.status === 'active' ? 'default' : 'secondary'}>
                    {agentInfo.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Category</span>
                  <span className="text-sm text-muted-foreground">{agentInfo.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(agentInfo.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Development</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={agentInfo.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Repository
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={`${agentInfo.repositoryUrl}/issues`} target="_blank" rel="noopener noreferrer">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Issue
                  </a>
                </Button>
                <div className="text-xs text-muted-foreground">
                  <p>This agent can be developed independently.</p>
                  <code className="text-xs bg-muted p-1 rounded mt-1 block">
                    git clone {agentInfo.repositoryUrl}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}