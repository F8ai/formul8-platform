import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Search, 
  Plus, 
  ExternalLink, 
  History, 
  Filter,
  Download,
  Share,
  Edit,
  Trash2,
  Users,
  Bot,
  Calendar,
  Tag
} from 'lucide-react';

interface UserArtifact {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  content: any;
  googleDriveFileId?: string;
  googleDriveUrl?: string;
  status: string;
  permissions: Record<string, string>;
  agentAccess: string[];
  lastModifiedByAgent?: string;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ArtifactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<UserArtifact | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user artifacts
  const { data: artifacts = [], isLoading } = useQuery({
    queryKey: ['/api/artifacts', selectedCategory],
    queryFn: () => apiRequest(`/api/artifacts${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`),
  });

  // Fetch available templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/artifacts/templates'],
    queryFn: () => apiRequest('/api/artifacts/templates'),
  });

  // Search artifacts
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/artifacts/search', searchQuery],
    queryFn: () => apiRequest(`/api/artifacts/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length > 2,
  });

  // Create demo artifacts
  const createDemoMutation = useMutation({
    mutationFn: () => apiRequest('/api/artifacts/demo', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artifacts'] });
      toast({
        title: "F8 Folder & Demo Artifacts Created",
        description: "✅ F8 folder created in Google Drive with cannabis industry documents shared with dcmcshan@mac.com",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create demo artifacts.",
        variant: "destructive",
      });
    },
  });

  // Initialize cannabis templates
  const initTemplatesMutation = useMutation({
    mutationFn: () => apiRequest('/api/artifacts/templates/cannabis/init', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artifacts/templates'] });
      toast({
        title: "Cannabis Templates Created",
        description: "Professional cannabis industry templates are now available.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create cannabis templates.",
        variant: "destructive",
      });
    },
  });

  const displayedArtifacts = searchQuery.length > 2 ? searchResults : artifacts;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'patent', label: 'Patent/IP' },
    { value: 'formulation', label: 'Formulation' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'science', label: 'Science' },
    { value: 'operations', label: 'Operations' },
    { value: 'customer_success', label: 'Customer Success' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'sop':
      case 'patent_search':
      case 'formulation':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Artifacts</h1>
          <p className="text-muted-foreground">
            Documents, sheets, and forms that agents can read and modify
          </p>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">📁 F8 Folder System Ready</h3>
            <p className="text-sm text-green-700">
              Google Workspace integration configured with service account: <code className="bg-green-100 px-1 rounded">an-app@wired-trees-351713.iam.gserviceaccount.com</code>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Click "Create F8 Folder & Demo Artifacts" to generate cannabis industry documents in your Google Drive
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => initTemplatesMutation.mutate()}
            disabled={initTemplatesMutation.isPending}
            variant="outline"
          >
            Create Cannabis Templates
          </Button>
          <Button
            onClick={() => createDemoMutation.mutate()}
            disabled={createDemoMutation.isPending}
            variant="outline"
          >
            {createDemoMutation.isPending ? 'Creating F8 Folder...' : 'Create F8 Folder & Demo Artifacts'}
          </Button>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                From Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create from Template</DialogTitle>
                <DialogDescription>
                  Choose from professional cannabis industry templates
                </DialogDescription>
              </DialogHeader>
              <TemplateSelector 
                templates={templates} 
                onClose={() => setShowTemplateDialog(false)} 
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Artifact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Artifact</DialogTitle>
                <DialogDescription>
                  Create a new document, sheet, or form that agents can interact with.
                </DialogDescription>
              </DialogHeader>
              <CreateArtifactForm onClose={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedArtifacts.map((artifact: UserArtifact) => (
            <Card key={artifact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(artifact.type)}
                    <div>
                      <CardTitle className="text-lg">{artifact.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {artifact.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(artifact.status)} text-white`}>
                    {artifact.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {artifact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>v{artifact.version}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{Object.keys(artifact.permissions).length} agents</span>
                  </div>
                </div>

                {artifact.lastModifiedByAgent && (
                  <div className="flex items-center space-x-1 text-sm text-blue-600">
                    <Bot className="h-4 w-4" />
                    <span>Last modified by {artifact.lastModifiedByAgent}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    {artifact.googleDriveUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(artifact.googleDriveUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedArtifact(artifact)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {artifact.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {displayedArtifacts.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No artifacts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery.length > 2 
                ? "No artifacts match your search criteria."
                : "Create your first artifact to get started."
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Artifact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Artifact Details Dialog */}
      {selectedArtifact && (
        <ArtifactDetailsDialog
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
}

function CreateArtifactForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    category: 'compliance',
    createGoogleDoc: true,
    tags: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/artifacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artifacts'] });
      toast({
        title: "Artifact Created",
        description: "Your artifact has been created successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create artifact.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    createMutation.mutate({
      ...formData,
      tags,
      content: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
      },
      permissions: {
        [`${formData.category}-agent`]: 'write'
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="sop">SOP</SelectItem>
              <SelectItem value="patent_search">Patent Search</SelectItem>
              <SelectItem value="formulation">Formulation</SelectItem>
              <SelectItem value="marketing_sheet">Marketing Sheet</SelectItem>
              <SelectItem value="form">Form</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="patent">Patent/IP</SelectItem>
              <SelectItem value="formulation">Formulation</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="customer_success">Customer Success</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="cannabis, compliance, extraction"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Artifact'}
        </Button>
      </div>
    </form>
  );
}

function ArtifactDetailsDialog({ artifact, onClose }: { artifact: UserArtifact; onClose: () => void }) {
  const { data: history = [] } = useQuery({
    queryKey: ['/api/artifacts', artifact.id, 'history'],
    queryFn: () => apiRequest(`/api/artifacts/${artifact.id}/history`),
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getTypeIcon(artifact.type)}
            <span>{artifact.title}</span>
          </DialogTitle>
          <DialogDescription>{artifact.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <p className="font-medium">{artifact.type}</p>
              </div>
              <div>
                <Label>Category</Label>
                <p className="font-medium">{artifact.category}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge className={`${getStatusColor(artifact.status)} text-white`}>
                  {artifact.status}
                </Badge>
              </div>
              <div>
                <Label>Version</Label>
                <p className="font-medium">v{artifact.version}</p>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {artifact.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {artifact.googleDriveUrl && (
              <div>
                <Label>Google Drive Link</Label>
                <Button
                  variant="outline"
                  className="mt-1 w-full justify-start"
                  onClick={() => window.open(artifact.googleDriveUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Drive
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div>
              <Label>Agent Permissions</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(artifact.permissions).map(([agent, permission]) => (
                  <div key={agent} className="flex justify-between items-center">
                    <span className="font-medium">{agent}</span>
                    <Badge variant={permission === 'write' ? 'default' : 'secondary'}>
                      {permission}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {artifact.agentAccess.length > 0 && (
              <div>
                <Label>Recent Agent Access</Label>
                <div className="mt-2 space-y-1">
                  {artifact.agentAccess.map((agent, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {agent}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div>
              <Label>Change History</Label>
              <div className="mt-2 space-y-2">
                {history.map((change: any) => (
                  <Card key={change.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{change.changeType}</p>
                          {change.agentType && (
                            <p className="text-sm text-muted-foreground">
                              by {change.agentType}
                            </p>
                          )}
                          {change.changeReason && (
                            <p className="text-sm">{change.changeReason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(change.createdAt).toLocaleString()}
                          </p>
                          {change.newVersion && (
                            <p className="text-sm">v{change.newVersion}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function getTypeIcon(type: string) {
  return <FileText className="h-5 w-5" />;
}

function TemplateSelector({ templates, onClose }: { templates: any[]; onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFromTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/artifacts/templates/${data.templateId}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artifacts'] });
      toast({
        title: "Document Created",
        description: "Your document has been created from the template.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create document from template.",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
    
    // Initialize form data with template variables
    const initialData: Record<string, string> = {};
    template.variables.forEach((variable: string) => {
      initialData[variable] = '';
    });
    setFormData(initialData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    createFromTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      title,
      variables: formData,
    });
  };

  return (
    <div className="space-y-6">
      {!selectedTemplate ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTemplateSelect(template)}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{template.category}</Badge>
                  <Button size="sm" variant="outline">
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {selectedTemplate.variables.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Template Variables</h3>
              {selectedTemplate.variables.map((variable: string) => (
                <div key={variable}>
                  <Label htmlFor={variable}>
                    {variable.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Label>
                  <Input
                    id={variable}
                    value={formData[variable] || ''}
                    onChange={(e) => setFormData({ ...formData, [variable]: e.target.value })}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSelectedTemplate(null)}>
              Back to Templates
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFromTemplateMutation.isPending}>
                {createFromTemplateMutation.isPending ? 'Creating...' : 'Create Document'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'draft':
      return 'bg-yellow-500';
    case 'archived':
      return 'bg-gray-500';
    default:
      return 'bg-blue-500';
  }
}