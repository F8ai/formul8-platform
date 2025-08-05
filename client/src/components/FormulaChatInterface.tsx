import { useState, useRef, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, MessageSquare, Loader2, CheckCircle, AlertCircle, FileText, ExternalLink, Plus, Paperclip, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import { DocumentPreview } from "./DocumentPreview";
import { WindowManagerContext } from "../contexts/WindowManagerContext";
import { useIsMobile } from '@/hooks/use-mobile';
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from '@uppy/core';

interface Attachment {
  id: string;
  fileName: string;
  objectPath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agent?: string;
  confidence?: number;
  requiresHumanReview?: boolean;
  verificationCount?: number;
  attachments?: Attachment[];
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

// Enhanced welcome message with tool suggestions
const generateToolSuggestions = () => {
  return `Welcome to Formul8.ai! 🌿 I'm your AI cannabis consultant with access to specialized tools and documents.

**What I can help you with:**
• 🧪 **Formulation** - Create recipes, calculate dosages, optimize extractions
• ⚖️ **Compliance** - Navigate regulations, permits, and legal requirements  
• 📄 **Documents** - Access SOPs, templates, and artifacts
• 📊 **Testing** - Run baseline assessments and evaluations
• 📈 **Analytics** - View dashboards and metrics
• 🐛 **Issues** - Report problems or request features
• 💼 **Workspace** - Manage files and folders

**Smart Tool Detection:**
Just mention what you need! I'll automatically suggest or open the right tool for you.

Try asking: "Help me formulate a new product" or "I need compliance info for California"`;
};

export default function FormulaChatInterface() {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: generateToolSuggestions(),
      timestamp: new Date().toISOString(),
      agent: 'system',
      confidence: 100
    }
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
    mutationFn: async (query: string): Promise<any> => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          agentType: 'general',
          systemPrompt: 'You are a helpful AI assistant for the cannabis industry platform Formul8.ai. Provide accurate, helpful responses. If you are creating documents, format them appropriately.'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data: any) => {
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.content || 'No response received',
        timestamp: new Date().toISOString(),
        agent: 'general',
        confidence: 85,
        requiresHumanReview: false,
        verificationCount: 1
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If response contains file data, automatically create a document window
      if (data.fileData && windowManager?.createWindow) {
        try {
          const documentTitle = data.fileData.title || 'Generated Document';
          const documentContent = data.fileData.content || '';
          
          // Position in top-right area of desktop
          const desktopWidth = window.innerWidth - 56; // Account for left nav
          const topRightX = desktopWidth - 720; // 700px width + 20px margin
          const topRightY = 80; // Below header with margin
          
          windowManager.createWindow({
            type: 'document',
            title: documentTitle,
            content: {
              documentContent,
              documentType: data.fileData.documentType || 'general',
              isAsciiDoc: documentContent.includes('=') && documentContent.includes('::')
            },
            size: { width: 700, height: 500 },
            position: { x: topRightX, y: topRightY }
          });

          // Save document to server and refresh desktop
          fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: documentTitle,
              content: documentContent,
              documentType: data.fileData.documentType || 'general',
              position: { x: topRightX, y: topRightY }
            })
          }).then(response => {
            if (response.ok) {
              // Refresh desktop icons by invalidating documents cache
              queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
            }
          }).catch(saveError => {
            console.error('Error saving document:', saveError);
          });
        } catch (docError) {
          console.error('Error creating document window:', docError);
        }
      }

      // Legacy function call if it exists
      if (typeof detectAndPreviewGeneratedFiles === 'function') {
        detectAndPreviewGeneratedFiles(data.content);
      }
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
    if ((!input.trim() && attachments.length === 0) || chatMutation.isPending) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input || (attachments.length > 0 ? "📎 Shared files" : ""),
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Detect intent and suggest/open tools
    const detectedTools = detectIntentAndOpenTool(input);
    
    // If we detected relevant tools, show suggestions and optionally auto-open
    if (detectedTools.length > 0 && input.trim()) {
      const toolSuggestions = detectedTools.map(tool => tool.description).join(', ');
      
      // Add a system message with tool suggestions
      setTimeout(() => {
        const systemMessage: Message = {
          id: `system_tools_${Date.now()}`,
          role: 'system',
          content: `I detected you might need: **${toolSuggestions}**\n\nI can open these tools for you or provide information. Would you like me to launch any of these tools?`,
          timestamp: new Date().toISOString(),
          agent: 'system',
          confidence: 100
        };
        setMessages(prev => [...prev, systemMessage]);
        
        // Auto-open the most relevant tool (first match) for specific high-confidence cases
        if (detectedTools.length === 1 && 
            (input.includes('open') || input.includes('launch') || input.includes('start'))) {
          detectedTools[0].action();
        }
      }, 1000);
    }
    
    // Include attachment info in the query if available
    const queryText = attachments.length > 0 
      ? `${input}\n\nAttached files: ${attachments.map(a => a.fileName).join(', ')}`
      : input;
    
    chatMutation.mutate(queryText);
    setInput("");
    setAttachments([]);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/attachments/upload-url', {
        method: 'POST'
      });
      return {
        method: 'PUT' as const,
        url: response.uploadURL
      };
    } catch (error) {
      console.error('Failed to get upload parameters:', error);
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      for (const file of result.successful) {
        if (file.uploadURL) {
          const response = await apiRequest('/api/attachments', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileUrl: file.uploadURL,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          setAttachments(prev => [...prev, response]);
        }
      }
    } catch (error) {
      console.error('Failed to process attachment:', error);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Tool routing based on user intent
  const detectIntentAndOpenTool = (userInput: string) => {
    const input = userInput.toLowerCase().trim();
    
    // Define intent patterns and corresponding tools
    const intentMappings = [
      {
        patterns: ['formulation', 'formulate', 'recipe', 'formula', 'extract', 'concentration', 'dosage'],
        tool: 'formulation',
        description: 'Formulation Wizard',
        route: '/design',
        icon: '🧪',
        action: () => {
          // Open in tabbed interface
          window.open('/design', '_blank');
        }
      },
      {
        patterns: ['issue', 'bug', 'problem', 'report', 'ticket', 'support'],
        tool: 'issue',
        description: 'Issue Tracker',
        route: '/roadmap',
        icon: '🐛',
        action: () => {
          // Open in tabbed interface
          window.open('/roadmap', '_blank');
        }
      },
      {
        patterns: ['compliance', 'regulation', 'legal', 'law', 'permit', 'license'],
        tool: 'compliance',
        description: 'Compliance Dashboard',
        route: '/pages/ComplianceAgent',
        icon: '⚖️',
        action: () => {
          // Open in tabbed interface
          window.open('/ComplianceAgent', '_blank');
        }
      },
      {
        patterns: ['artifact', 'document', 'template', 'form', 'sop', 'procedure'],
        tool: 'artifacts',
        description: 'Document Manager',
        route: '/artifacts',
        icon: '📄',
        action: () => {
          // Open in tabbed interface
          window.open('/artifacts', '_blank');
        }
      },
      {
        patterns: ['baseline', 'test', 'assessment', 'evaluation', 'metric'],
        tool: 'baseline',
        description: 'Baseline Testing',
        route: '/baseline-testing',
        icon: '📊',
        action: () => {
          // Open in tabbed interface
          window.open('/BaselineAssessment', '_blank');
        }
      },
      {
        patterns: ['dashboard', 'overview', 'analytics', 'metrics', 'stats'],
        tool: 'dashboard',
        description: 'Main Dashboard',
        route: '/dashboard',
        icon: '📈',
        action: () => {
          // Open in tabbed interface
          window.open('/dashboard', '_blank');
        }
      },
      {
        patterns: ['workspace', 'desktop', 'file', 'folder', 'files'],
        tool: 'workspace',
        description: 'File Workspace',
        route: '/workspace',
        icon: '💼',
        action: () => {
          // Open in tabbed interface
          window.open('/workspace', '_blank');
        }
      },
      {
        patterns: ['langchain', 'lang chain', 'langgraph', 'agent workflow', 'workflow', 'chain', 'graph'],
        tool: 'langchain',
        description: 'LangChain Dashboard',
        route: '/langgraph-dashboard',
        icon: '🦜',
        action: () => {
          // Open in tabbed interface
          window.open('/langgraph-dashboard', '_blank');
        }
      }
    ];

    // Check for intent matches
    const matchedTools = intentMappings.filter(mapping => 
      mapping.patterns.some(pattern => input.includes(pattern))
    );

    return matchedTools;
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

  const detectAndPreviewGeneratedFiles = (content: string) => {
    // Look for code blocks that might contain generated files
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const fileIndicators = [
      'asciidoc', 'adoc', 'txt', 'md', 'markdown', 
      'json', 'yaml', 'yml', 'csv', 'xml'
    ];
    
    let match;
    const detectedFiles = [];
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, fileContent] = match;
      
      // If language indicates a file type or content looks like a document
      if (fileIndicators.includes(language.toLowerCase()) || 
          fileContent.includes('= ') || // AsciiDoc title
          fileContent.includes('## ') || // Markdown title
          fileContent.includes('title:') || // YAML frontmatter
          fileContent.length > 200) { // Substantial content
        
        const defaultExtension = language.toLowerCase() || 'adoc';
        const fileName = `Generated_${Date.now()}.${defaultExtension}`;
        
        detectedFiles.push({
          fileName,
          content: fileContent,
          language: defaultExtension,
          fullMatch
        });
      }
    }

    // If files detected, handle mobile vs desktop layout
    if (detectedFiles.length > 0 && windowManager) {
      const file = detectedFiles[0]; // Use first detected file
      
      if (isMobile) {
        // On mobile: Create fullscreen file preview
        windowManager.createWindow({
          type: 'document',
          title: `📄 ${file.fileName}`,
          content: {
            mode: 'file-preview',
            fileName: file.fileName,
            fileContent: file.content,
            fileType: file.language,
            isGenerated: true
          },
          size: { 
            width: window.innerWidth, 
            height: window.innerHeight 
          },
          position: { 
            x: 0, 
            y: 0 
          }
        });
      } else {
        // On desktop: Split horizontally - resize current chat to left half
        const currentWindows = windowManager.windows || [];
        const chatWindow = currentWindows.find(w => w.type === 'chat');
        
        if (chatWindow) {
          // Resize chat to left half
          windowManager.updateWindow({
            ...chatWindow,
            width: Math.floor(window.innerWidth / 2),
            height: window.innerHeight,
            x: 0,
            y: 0
          });
        }

        // Open file preview in right half
        windowManager.createWindow({
          type: 'document',
          title: `📄 ${file.fileName}`,
          content: {
            mode: 'file-preview',
            fileName: file.fileName,
            fileContent: file.content,
            fileType: file.language,
            isGenerated: true
          },
          size: { 
            width: Math.floor(window.innerWidth / 2), 
            height: window.innerHeight 
          },
          position: { 
            x: Math.floor(window.innerWidth / 2), 
            y: 0 
          }
        });
      }
    }
  };

  const renderGeneratedFilePreview = (content: string) => {
    // Look for code blocks that contain file content
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const fileIndicators = [
      'asciidoc', 'adoc', 'txt', 'md', 'markdown', 
      'json', 'yaml', 'yml', 'csv', 'xml'
    ];
    
    const match = codeBlockRegex.exec(content);
    if (!match) return null;
    
    const [fullMatch, language, fileContent] = match;
    
    // Check if this looks like a generated file
    if (fileIndicators.includes(language.toLowerCase()) || 
        fileContent.includes('= ') || // AsciiDoc title
        fileContent.includes('## ') || // Markdown title
        fileContent.includes('title:') || // YAML frontmatter
        fileContent.length > 100) { // Substantial content
      
      const defaultExtension = language.toLowerCase() || 'adoc';
      const fileName = `Preview.${defaultExtension}`;
      
      return (
        <div className="mt-4 border border-formul8-border rounded-lg bg-formul8-bg-dark">
          <div className="flex items-center justify-between p-3 border-b border-formul8-border bg-formul8-bg-card">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-formul8-primary" />
              <span className="text-sm font-medium text-formul8-white">Generated File Preview</span>
              <Badge variant="outline" className="text-xs border-formul8-primary text-formul8-primary">
                {defaultExtension.toUpperCase()}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Open in tabbed interface
                window.open('/artifacts', '_blank');
              }}
              className="text-xs border-formul8-border text-formul8-white hover:bg-formul8-bg-light"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Full View
            </Button>
          </div>
          <div className="p-3 max-h-40 overflow-y-auto">
            <pre className="text-xs text-formul8-white font-mono whitespace-pre-wrap">
              {fileContent.slice(0, 300)}{fileContent.length > 300 ? '...' : ''}
            </pre>
          </div>
        </div>
      );
    }
    
    return null;
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
    <div className="flex flex-col h-full w-full bg-formul8-bg-dark">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-formul8-border bg-formul8-bg-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-formul8-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-formul8-white">Formul8 AI Assistant</h2>
            <p className="text-sm text-formul8-muted">Multi-agent cannabis intelligence</p>
          </div>
        </div>
        <Badge variant="outline" className="border-formul8-primary text-formul8-primary bg-formul8-bg-dark">
          Thread: {threadId.split('_')[1]}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 bg-formul8-bg-dark">
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
                <Card className={`${message.role === 'user' ? 'bg-formul8-primary text-white' : 'bg-formul8-bg-card border-formul8-border'} shadow-sm`}>
                  <CardContent className="p-3">
                    {message.role !== 'user' && message.agent && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-formul8-muted">
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
                        rehypePlugins={[[rehypeKatex, { output: 'htmlAndMathml' }]]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Show attachments if present */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className="flex items-center gap-2 p-2 bg-formul8-bg-dark rounded-lg border border-formul8-border"
                          >
                            <Paperclip className="w-4 h-4 text-formul8-muted" />
                            <span className="text-xs text-formul8-white truncate flex-1">
                              {attachment.fileName}
                            </span>
                            <Badge variant="outline" className="text-xs border-formul8-muted text-formul8-muted">
                              {Math.round(attachment.fileSize / 1024)}KB
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tool suggestion buttons */}
                    {message.role === 'system' && message.content.includes('I detected you might need') && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {detectIntentAndOpenTool(input).map((tool, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            onClick={() => tool.action()}
                            className="text-xs bg-formul8-primary/10 border-formul8-primary/30 text-formul8-primary hover:bg-formul8-primary/20"
                          >
                            {tool.icon} {tool.description}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {/* Inline File Preview for Generated Files */}
                    {message.role === 'assistant' && renderGeneratedFilePreview(message.content)}
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
      <div className="px-4 py-4 border-t border-formul8-border bg-formul8-bg-dark">
        {/* Show pending attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-xs text-formul8-muted">Attached files:</p>
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className="flex items-center gap-2 p-2 bg-formul8-bg-dark rounded-lg border border-formul8-border"
              >
                <Paperclip className="w-4 h-4 text-formul8-primary" />
                <span className="text-xs text-formul8-white truncate flex-1">
                  {attachment.fileName}
                </span>
                <Badge variant="outline" className="text-xs border-formul8-primary text-formul8-primary">
                  {Math.round(attachment.fileSize / 1024)}KB
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(attachment.id)}
                  className="h-6 w-6 p-0 text-formul8-muted hover:text-formul8-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about compliance, formulation, patents, operations, or more..."
            className="flex-1 border-formul8-border focus:border-formul8-primary bg-formul8-bg-dark text-formul8-white placeholder:text-formul8-muted"
            disabled={chatMutation.isPending}
          />
          
          {/* Attachment Upload Button */}
          <ObjectUploader
            maxNumberOfFiles={3}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-formul8-bg-dark border border-formul8-border hover:bg-formul8-bg-light text-formul8-white p-2 h-10 w-10"
          >
            <Plus className="w-4 h-4" />
          </ObjectUploader>
          
          <Button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || chatMutation.isPending}
            className="bg-formul8-primary hover:bg-formul8-blue text-white px-6"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-formul8-text-gray mt-2 text-center">
          Powered by multi-agent verification system with {messages.filter(m => m.agent && m.agent !== 'system').length > 0 ? 'active' : 'ready'} cannabis industry experts
        </p>
      </div>
    </div>
  );
}