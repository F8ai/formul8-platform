import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Grid, 
  Eye, 
  EyeOff,
  Layout,
  Palette,
  Monitor
} from "lucide-react";

interface WidgetConfig {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  title?: string;
  settings?: Record<string, any>;
}

interface DashboardLayout {
  id?: string;
  userId: string;
  layoutName: string;
  widgets: WidgetConfig[];
  gridConfig: {
    cols: number;
    rows: number;
    margin: [number, number];
    compactType: 'vertical' | 'horizontal' | null;
    preventCollision: boolean;
  };
  isDefault: boolean;
}

interface WidgetPreferences {
  id?: string;
  userId: string;
  widgetType: string;
  preferences: Record<string, any>;
  isEnabled: boolean;
}

const AVAILABLE_WIDGETS = [
  { 
    type: 'agent-status', 
    name: 'Agent Status', 
    description: 'Real-time status of all AI agents',
    defaultSize: { w: 4, h: 3 },
    category: 'agents'
  },
  { 
    type: 'recent-activity', 
    name: 'Recent Activity', 
    description: 'Latest user interactions and queries',
    defaultSize: { w: 6, h: 4 },
    category: 'activity'
  },
  { 
    type: 'compliance-summary', 
    name: 'Compliance Summary', 
    description: 'Cannabis regulatory compliance overview',
    defaultSize: { w: 4, h: 3 },
    category: 'compliance'
  },
  { 
    type: 'formulation-queue', 
    name: 'Formulation Queue', 
    description: 'Active product formulations and progress',
    defaultSize: { w: 6, h: 4 },
    category: 'formulation'
  },
  { 
    type: 'cost-tracker', 
    name: 'Cost Tracker', 
    description: 'API usage and operational costs',
    defaultSize: { w: 4, h: 3 },
    category: 'analytics'
  },
  { 
    type: 'chat-quick-access', 
    name: 'Chat Quick Access', 
    description: 'Quick access to agent conversations',
    defaultSize: { w: 3, h: 4 },
    category: 'chat'
  },
  { 
    type: 'metrics-overview', 
    name: 'Metrics Overview', 
    description: 'Key performance indicators and analytics',
    defaultSize: { w: 8, h: 4 },
    category: 'analytics'
  },
  { 
    type: 'calendar', 
    name: 'Calendar', 
    description: 'Upcoming deadlines and compliance dates',
    defaultSize: { w: 4, h: 4 },
    category: 'planning'
  },
  { 
    type: 'notifications', 
    name: 'Notifications', 
    description: 'System alerts and important updates',
    defaultSize: { w: 3, h: 3 },
    category: 'system'
  }
];

const WIDGET_CATEGORIES = [
  { id: 'agents', name: 'AI Agents', color: 'bg-blue-500' },
  { id: 'activity', name: 'Activity', color: 'bg-green-500' },
  { id: 'compliance', name: 'Compliance', color: 'bg-yellow-500' },
  { id: 'formulation', name: 'Formulation', color: 'bg-purple-500' },
  { id: 'analytics', name: 'Analytics', color: 'bg-red-500' },
  { id: 'chat', name: 'Chat', color: 'bg-teal-500' },
  { id: 'planning', name: 'Planning', color: 'bg-orange-500' },
  { id: 'system', name: 'System', color: 'bg-gray-500' }
];

export default function DashboardWidgetCustomizer({ userId }: { userId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [newLayoutName, setNewLayoutName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch user's dashboard layouts
  const { data: layouts = [], isLoading: layoutsLoading } = useQuery({
    queryKey: ['/api/dashboard/layouts', userId],
    enabled: !!userId,
  });

  // Fetch user's widget preferences
  const { data: preferences = [], isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/dashboard/preferences', userId],
    enabled: !!userId,
  });

  // Create layout mutation
  const createLayoutMutation = useMutation({
    mutationFn: (layout: Omit<DashboardLayout, 'id'>) =>
      apiRequest('/api/dashboard/layouts', {
        method: 'POST',
        body: JSON.stringify(layout)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/layouts'] });
      toast({ title: "Layout created successfully" });
      setNewLayoutName("");
    },
    onError: () => {
      toast({ title: "Failed to create layout", variant: "destructive" });
    }
  });

  // Update layout mutation
  const updateLayoutMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DashboardLayout> }) =>
      apiRequest(`/api/dashboard/layouts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/layouts'] });
      toast({ title: "Layout updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update layout", variant: "destructive" });
    }
  });

  // Update widget preferences mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: ({ widgetType, enabled }: { widgetType: string; enabled: boolean }) =>
      apiRequest('/api/dashboard/preferences', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          widgetType,
          preferences: {},
          isEnabled: enabled
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/preferences'] });
      toast({ title: "Widget preferences updated" });
    },
    onError: () => {
      toast({ title: "Failed to update preferences", variant: "destructive" });
    }
  });

  const createDefaultLayout = () => {
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'agent-status-1',
        type: 'agent-status',
        position: { x: 0, y: 0, w: 4, h: 3 },
        title: 'AI Agent Status'
      },
      {
        id: 'recent-activity-1',
        type: 'recent-activity',
        position: { x: 4, y: 0, w: 8, h: 4 },
        title: 'Recent Activity'
      },
      {
        id: 'compliance-summary-1',
        type: 'compliance-summary',
        position: { x: 0, y: 3, w: 4, h: 3 },
        title: 'Compliance Overview'
      },
      {
        id: 'chat-quick-access-1',
        type: 'chat-quick-access',
        position: { x: 8, y: 4, w: 4, h: 4 },
        title: 'Quick Chat Access'
      }
    ];

    createLayoutMutation.mutate({
      userId,
      layoutName: newLayoutName || "My Custom Layout",
      widgets: defaultWidgets,
      gridConfig: {
        cols: 12,
        rows: 20,
        margin: [10, 10],
        compactType: 'vertical',
        preventCollision: false,
      },
      isDefault: layouts.length === 0
    });
  };

  const filteredWidgets = selectedCategory === "all" 
    ? AVAILABLE_WIDGETS 
    : AVAILABLE_WIDGETS.filter(widget => widget.category === selectedCategory);

  const getWidgetPreference = (widgetType: string) => {
    return preferences.find(p => p.widgetType === widgetType);
  };

  if (layoutsLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 bg-formul8-primary rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading customization options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Customization</h2>
          <p className="text-gray-600 dark:text-gray-400">Personalize your Formul8 dashboard experience</p>
        </div>
        <Button 
          onClick={() => setIsCustomizing(!isCustomizing)}
          variant={isCustomizing ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          {isCustomizing ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {isCustomizing ? "Exit Customization" : "Customize Dashboard"}
        </Button>
      </div>

      <Tabs defaultValue="layouts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layouts" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layouts
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Widgets
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Layouts Tab */}
        <TabsContent value="layouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Dashboard Layouts
              </CardTitle>
              <CardDescription>
                Create and manage different dashboard configurations for various workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Layout */}
              <div className="flex gap-2">
                <Input
                  placeholder="Layout name (e.g., 'Daily Operations', 'Compliance Focus')"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={createDefaultLayout}
                  disabled={createLayoutMutation.isPending || !newLayoutName.trim()}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Layout
                </Button>
              </div>

              {/* Existing Layouts */}
              <div className="grid gap-3">
                {layouts.map((layout: DashboardLayout) => (
                  <div key={layout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{layout.layoutName}</h4>
                        {layout.isDefault && <Badge variant="default">Default</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {layout.widgets.length} widgets • Updated {new Date(layout.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedLayout(layout.id!)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateLayoutMutation.mutate({ 
                          id: layout.id!, 
                          updates: { isDefault: !layout.isDefault } 
                        })}
                      >
                        {layout.isDefault ? "Remove Default" : "Set Default"}
                      </Button>
                    </div>
                  </div>
                ))}
                
                {layouts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Grid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No custom layouts yet. Create your first layout to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Widgets</CardTitle>
              <CardDescription>
                Enable or disable widgets for your dashboard. Disabled widgets won't appear in any layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Categories
                </Button>
                {WIDGET_CATEGORIES.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${category.color}`} />
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* Widget Grid */}
              <div className="grid gap-3">
                {filteredWidgets.map(widget => {
                  const preference = getWidgetPreference(widget.type);
                  const isEnabled = preference?.isEnabled ?? true;
                  
                  return (
                    <div key={widget.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            WIDGET_CATEGORIES.find(c => c.id === widget.category)?.color || 'bg-gray-400'
                          }`} />
                          <div>
                            <h4 className="font-medium">{widget.name}</h4>
                            <p className="text-sm text-gray-500">{widget.description}</p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(enabled) => 
                          updatePreferenceMutation.mutate({ widgetType: widget.type, enabled })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Appearance</CardTitle>
              <CardDescription>
                Customize the visual appearance and grid settings for your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Grid Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grid-cols">Grid Columns</Label>
                    <Input
                      id="grid-cols"
                      type="number"
                      min="6"
                      max="24"
                      defaultValue="12"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grid-margin">Widget Spacing</Label>
                    <Input
                      id="grid-margin"
                      type="number"
                      min="0"
                      max="20"
                      defaultValue="10"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Compact Mode</h4>
                  <p className="text-sm text-gray-500">Automatically arrange widgets to minimize empty space</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Widget Animation */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Widget Animations</h4>
                  <p className="text-sm text-gray-500">Enable smooth transitions when rearranging widgets</p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-save Layout</h4>
                  <p className="text-sm text-gray-500">Automatically save changes as you customize</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}