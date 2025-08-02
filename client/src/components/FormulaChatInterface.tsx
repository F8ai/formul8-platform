import { useState, useRef, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, MessageSquare, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { DocumentPreview } from "./DocumentPreview";
import { WindowManagerContext } from "./WindowManager";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agent?: string;
  confidence?: number;
  requiresHumanReview?: boolean;
  verificationCount?: number;
}

interface AgentResponse {
  query: string;
  primaryAgent: string;
  response: string;
  confidence: number;
  consensusReached: boolean;
  verificationCount: number;
  requiresHumanReview: boolean;
  timestamp: string;
}

export default function FormulaChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: "Welcome to Formul8.ai! 🌿 I'm your AI cannabis consultant. Ask me anything about compliance, formulation, operations, sourcing, patents, marketing, testing, or customer success.\n\n**Enhanced Features:**\n- 😊 Full emoji support\n- 🧪 Chemical formulas: $C_{21}H_{30}O_2$ (THC), $C_{21}H_{26}O_2$ (CBD)\n- 📄 Document previews that open in new tabs\n- 💬 Multi-agent verification system\n\nTry asking about THC extraction or compliance documents!",
      timestamp: new Date().toISOString(),
      agent: 'system',
      confidence: 100
    }
  ]);
  const [input, setInput] = useState("");
  const [threadId] = useState(() => `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const windowManager = useContext(WindowManagerContext);
  
  if (!windowManager) {
    console.warn('WindowManagerContext not found in FormulaChatInterface');
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (query: string): Promise<AgentResponse> => {
      return apiRequest(`/api/langgraph/query`, {
        method: 'POST',
        body: JSON.stringify({
          query,
          threadId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data: AgentResponse) => {
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        agent: data.primaryAgent,
        confidence: data.confidence,
        requiresHumanReview: data.requiresHumanReview,
        verificationCount: data.verificationCount
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Invalidate relevant queries to refresh any data displays
      queryClient.invalidateQueries({ queryKey: ['/api/queries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/verifications'] });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date().toISOString(),
        agent: 'system',
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'compliance': 'bg-formul8-primary',
      'formulation': 'bg-formul8-warning',
      'patent': 'bg-formul8-info',
      'operations': 'bg-formul8-tertiary',
      'sourcing': 'bg-formul8-secondary',
      'marketing': 'bg-formul8-success',
      'spectra': 'bg-formul8-error',
      'customer-success': 'bg-purple-500',
      'system': 'bg-gray-500'
    };
    return colors[agent] || 'bg-gray-500';
  };

  const getAgentName = (agent: string) => {
    const names: Record<string, string> = {
      'compliance': 'Compliance Expert',
      'formulation': 'Formulation Specialist',
      'patent': 'IP Attorney',
      'operations': 'Operations Engineer', 
      'sourcing': 'Sourcing Agent',
      'marketing': 'Marketing Strategist',
      'spectra': 'Analytical Chemist',
      'customer-success': 'Customer Success',
      'system': 'Formul8 Assistant'
    };
    return names[agent] || 'AI Assistant';
  };

  const handleOpenDocument = (url: string, title: string, type: string) => {
    if (windowManager) {
      windowManager.createWindow({
        type: 'document',
        title: title,
        content: { 
          mode: 'document-viewer',
          url: url,
          fileType: type,
          fileName: title
        }
      });
    }
  };

  // Custom markdown components to render document previews
  const markdownComponents = {
    a: ({ href, children, ...props }: any) => {
      // Check if this is an external document link
      const isDocument = href && (
        href.includes('.pdf') || 
        href.includes('.doc') || 
        href.includes('.docx') || 
        href.includes('.xls') || 
        href.includes('.xlsx') || 
        href.includes('.ppt') || 
        href.includes('.pptx') ||
        href.includes('docs.google.com') ||
        href.includes('drive.google.com') ||
        href.includes('sharepoint.com') ||
        href.includes('onedrive.com')
      );

      if (isDocument) {
        return (
          <DocumentPreview
            url={href}
            title={children?.toString() || href.split('/').pop() || 'Document'}
            onOpenDocument={handleOpenDocument}
          />
        );
      }

      // Regular link
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-formul8-primary hover:text-formul8-blue underline"
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-formul8-border bg-formul8-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-formul8-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-formul8-white">Formul8 AI Assistant</h2>
            <p className="text-sm text-formul8-gray">Multi-agent cannabis intelligence</p>
          </div>
        </div>
        <Badge variant="outline" className="border-formul8-primary text-formul8-primary bg-formul8-bg-card">
          Thread: {threadId.split('_')[1]}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className={`${message.role === 'user' ? 'bg-formul8-secondary' : getAgentColor(message.agent || 'system')} text-white text-xs`}>
                    {message.role === 'user' ? 'U' : message.agent?.charAt(0).toUpperCase() || 'F'}
                  </AvatarFallback>
                </Avatar>
                <Card className={`${message.role === 'user' ? 'bg-formul8-primary text-white' : 'bg-formul8-card border-formul8-border'} shadow-sm`}>
                  <CardContent className="p-3">
                    {message.role !== 'user' && message.agent && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-formul8-gray">
                          {getAgentName(message.agent)}
                        </span>
                        {message.confidence !== undefined && (
                          <div className="flex items-center space-x-2">
                            {message.confidence > 80 ? (
                              <CheckCircle className="w-3 h-3 text-formul8-success" />
                            ) : message.confidence > 60 ? (
                              <AlertCircle className="w-3 h-3 text-formul8-warning" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-formul8-error" />
                            )}
                            <span className="text-xs text-formul8-muted">
                              {message.confidence}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-formul8-white'}`}>
                      <ReactMarkdown 
                        components={markdownComponents}
                        remarkPlugins={[remarkMath, remarkEmoji, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.verificationCount !== undefined && message.verificationCount > 0 && (
                      <div className="mt-2 pt-2 border-t border-formul8-border">
                        <span className="text-xs text-formul8-muted">
                          Verified with {message.verificationCount} additional agent{message.verificationCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {message.requiresHumanReview && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs border-formul8-warning text-formul8-warning bg-formul8-bg-card">
                          Human Review Requested
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-formul8-primary text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-formul8-card border-formul8-border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-formul8-primary" />
                      <span className="text-sm text-formul8-gray">Processing with multi-agent system...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="p-4 border-t border-formul8-border bg-formul8-card">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about compliance, formulation, patents, operations, or more..."
            className="flex-1 border-formul8-border focus:border-formul8-primary bg-formul8-bg-dark text-formul8-white placeholder:text-formul8-muted"
            disabled={chatMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-formul8-primary hover:bg-formul8-blue text-white px-6"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-formul8-muted mt-2 text-center">
          Powered by multi-agent verification system with {messages.filter(m => m.agent && m.agent !== 'system').length > 0 ? 'active' : 'ready'} cannabis industry experts
        </p>
      </div>
    </div>
  );
}