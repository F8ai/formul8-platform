"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Code, 
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react"

interface Tool {
  id: string
  name: string
  description: string
  type: 'api' | 'function' | 'query' | 'analysis'
  category: string
  parameters: Record<string, any>
  enabled: boolean
  lastUsed?: string
  executionCount?: number
}

interface AgentToolsManagerProps {
  agentId: string
  isOpen: boolean
  onClose: () => void
}

export function AgentToolsManager({ agentId, isOpen, onClose }: AgentToolsManagerProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [executingTool, setExecutingTool] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && agentId) {
      loadTools()
    }
  }, [isOpen, agentId])

  const loadTools = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/agents/management/${agentId}/tools`)
      if (!response.ok) {
        throw new Error('Failed to load tools')
      }
      const data = await response.json()
      setTools(data.tools || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agent tools",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveTool = async (tool: Tool) => {
    setSaving(true)
    try {
      const isNew = !tools.find(t => t.id === tool.id)
      const url = isNew 
        ? `/api/agents/management/${agentId}/tools`
        : `/api/agents/management/${agentId}/tools/${tool.id}`
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool)
      })

      if (!response.ok) {
        throw new Error('Failed to save tool')
      }

      await loadTools()
      setEditingTool(null)
      toast({
        title: "Success",
        description: `Tool ${isNew ? 'created' : 'updated'} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tool",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteTool = async (toolId: string) => {
    try {
      const response = await fetch(`/api/agents/management/${agentId}/tools/${toolId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete tool')
      }

      await loadTools()
      toast({
        title: "Success",
        description: "Tool deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tool",
        variant: "destructive",
      })
    }
  }

  const executeTool = async (toolId: string, parameters: Record<string, any> = {}) => {
    setExecutingTool(toolId)
    try {
      const response = await fetch(`/api/agents/management/${agentId}/tools/${toolId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters })
      })

      if (!response.ok) {
        throw new Error('Failed to execute tool')
      }

      const result = await response.json()
      toast({
        title: "Tool Executed",
        description: "Tool executed successfully",
      })
      
      await loadTools() // Refresh to update execution count
      return result
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute tool",
        variant: "destructive",
      })
    } finally {
      setExecutingTool(null)
    }
  }

  const handleAddTool = () => {
    const newTool: Tool = {
      id: `tool_${Date.now()}`,
      name: "",
      description: "",
      type: "function",
      category: "general",
      parameters: {},
      enabled: true
    }
    setEditingTool(newTool)
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !categoryFilter || tool.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(tools.map(t => t.category)))
  const toolTypes = [
    { value: 'api', label: 'API Call' },
    { value: 'function', label: 'Function' },
    { value: 'query', label: 'Query' },
    { value: 'analysis', label: 'Analysis' }
  ]

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'api': return <Code className="h-4 w-4" />
      case 'function': return <Wrench className="h-4 w-4" />
      case 'query': return <Settings className="h-4 w-4" />
      case 'analysis': return <AlertCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Agent Tools Manager - {agentId}
          </DialogTitle>
          <DialogDescription>
            Manage tools and capabilities for this agent
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[calc(90vh-140px)]">
          {/* Filters and Search */}
          <div className="flex gap-4 p-4 border-b">
            <div className="flex-1">
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddTool}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </div>

          {/* Tools List */}
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Clock className="h-6 w-6 animate-spin mr-2" />
                Loading tools...
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No tools found</p>
                <Button onClick={handleAddTool} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tool
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTools.map((tool) => (
                  <Card key={tool.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getToolIcon(tool.type)}
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <Badge className={getStatusColor(tool.enabled)}>
                            {tool.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">{tool.type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => executeTool(tool.id)}
                            disabled={!tool.enabled || executingTool === tool.id}
                          >
                            {executingTool === tool.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTool(tool)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTool(tool.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-2">
                        {tool.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Category: {tool.category}</span>
                        {tool.executionCount && (
                          <span>Executions: {tool.executionCount}</span>
                        )}
                        {tool.lastUsed && (
                          <span>Last used: {new Date(tool.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Edit Tool Dialog */}
        {editingTool && (
          <Dialog open={true} onOpenChange={() => setEditingTool(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {tools.find(t => t.id === editingTool.id) ? 'Edit Tool' : 'Add New Tool'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tool Name</Label>
                    <Input
                      id="name"
                      value={editingTool.name}
                      onChange={(e) => setEditingTool({...editingTool, name: e.target.value})}
                      placeholder="Enter tool name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tool Type</Label>
                    <Select 
                      value={editingTool.type} 
                      onValueChange={(value) => setEditingTool({...editingTool, type: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toolTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingTool.description}
                    onChange={(e) => setEditingTool({...editingTool, description: e.target.value})}
                    placeholder="Describe what this tool does"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingTool.category}
                    onChange={(e) => setEditingTool({...editingTool, category: e.target.value})}
                    placeholder="Enter category"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingTool(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => saveTool(editingTool)}
                    disabled={saving || !editingTool.name}
                  >
                    {saving ? 'Saving...' : 'Save Tool'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AgentToolsManager