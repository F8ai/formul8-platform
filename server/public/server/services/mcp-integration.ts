import axios from 'axios';
import { storage } from '../storage';
import type { AgentTool } from '@shared/schema';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  description: string;
  capabilities: string[];
  schemas: any[];
  enabled: boolean;
  agentTypes: string[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  serverUrl: string;
}

export interface MCPRequest {
  method: string;
  params: any;
  id?: string;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string;
}

export class MCPIntegrationService {
  private servers: Map<string, MCPServer> = new Map();

  constructor() {
    this.initializeDefaultServers();
  }

  private initializeDefaultServers() {
    // Cannabis-specific MCP servers
    const defaultServers: MCPServer[] = [
      {
        id: 'cannabis-regulations',
        name: 'Cannabis Regulations Server',
        url: 'http://localhost:3001/mcp',
        description: 'Access to cannabis regulations and compliance data',
        capabilities: ['regulations/search', 'regulations/get', 'compliance/check'],
        schemas: [],
        enabled: true,
        agentTypes: ['compliance', 'patent'],
      },
      {
        id: 'chemical-analysis',
        name: 'Chemical Analysis Server',
        url: 'http://localhost:3002/mcp',
        description: 'Chemical compound analysis and molecular tools',
        capabilities: ['chemistry/analyze', 'chemistry/similarity', 'chemistry/properties'],
        schemas: [],
        enabled: true,
        agentTypes: ['formulation', 'science'],
      },
      {
        id: 'market-intelligence',
        name: 'Market Intelligence Server',
        url: 'http://localhost:3003/mcp',
        description: 'Cannabis market data and analytics',
        capabilities: ['market/trends', 'market/pricing', 'market/competitors'],
        schemas: [],
        enabled: true,
        agentTypes: ['marketing', 'operations'],
      },
      {
        id: 'pubmed-research',
        name: 'PubMed Research Server',
        url: 'http://localhost:3004/mcp',
        description: 'Scientific literature and research access',
        capabilities: ['pubmed/search', 'pubmed/paper', 'research/analyze'],
        schemas: [],
        enabled: true,
        agentTypes: ['science', 'formulation'],
      },
    ];

    defaultServers.forEach(server => {
      this.servers.set(server.id, server);
    });
  }

  // Register MCP server for agent type
  async registerMCPServer(agentType: string, serverConfig: Partial<MCPServer>): Promise<void> {
    const serverId = serverConfig.id || `${agentType}-${Date.now()}`;
    
    const server: MCPServer = {
      id: serverId,
      name: serverConfig.name || `${agentType} MCP Server`,
      url: serverConfig.url!,
      description: serverConfig.description || '',
      capabilities: serverConfig.capabilities || [],
      schemas: serverConfig.schemas || [],
      enabled: serverConfig.enabled !== false,
      agentTypes: serverConfig.agentTypes || [agentType],
    };

    this.servers.set(serverId, server);

    // Store in database
    await storage.createAgentTool({
      agentType,
      toolName: `mcp_server_${serverId}`,
      toolType: 'mcp_tool',
      configuration: {
        serverId,
        serverUrl: server.url,
        capabilities: server.capabilities,
        schemas: server.schemas,
      },
      enabled: server.enabled,
      mcpServerUrl: server.url,
    });
  }

  // Get available MCP tools for agent
  async getAvailableTools(agentType: string): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];
    
    for (const server of this.servers.values()) {
      if (!server.enabled || !server.agentTypes.includes(agentType)) {
        continue;
      }

      try {
        const serverTools = await this.discoverServerTools(server);
        tools.push(...serverTools);
      } catch (error) {
        console.error(`Error discovering tools from server ${server.name}:`, error);
      }
    }

    return tools;
  }

  // Discover tools from MCP server
  private async discoverServerTools(server: MCPServer): Promise<MCPTool[]> {
    try {
      const response = await this.callMCPServer(server.url, {
        method: 'tools/list',
        params: {},
      });

      if (response.error) {
        throw new Error(`MCP Server error: ${response.error.message}`);
      }

      return (response.result?.tools || []).map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        serverUrl: server.url,
      }));
    } catch (error) {
      console.error(`Error discovering tools from ${server.url}:`, error);
      return [];
    }
  }

  // Call MCP tool
  async callMCPTool(
    toolName: string,
    params: any,
    agentType: string
  ): Promise<any> {
    // Find server that has this tool
    const server = await this.findServerForTool(toolName, agentType);
    if (!server) {
      throw new Error(`No MCP server found for tool: ${toolName}`);
    }

    const response = await this.callMCPServer(server.url, {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params,
      },
    });

    if (response.error) {
      throw new Error(`MCP Tool error: ${response.error.message}`);
    }

    return response.result;
  }

  // Find server that provides a specific tool
  private async findServerForTool(toolName: string, agentType: string): Promise<MCPServer | null> {
    for (const server of this.servers.values()) {
      if (!server.enabled || !server.agentTypes.includes(agentType)) {
        continue;
      }

      try {
        const tools = await this.discoverServerTools(server);
        if (tools.some(tool => tool.name === toolName)) {
          return server;
        }
      } catch (error) {
        console.error(`Error checking server ${server.name} for tool ${toolName}:`, error);
      }
    }

    return null;
  }

  // Make HTTP call to MCP server
  private async callMCPServer(serverUrl: string, request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await axios.post(serverUrl, {
        jsonrpc: '2.0',
        id: request.id || Date.now().toString(),
        method: request.method,
        params: request.params,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`MCP Server communication error: ${error.message}`);
      }
      throw error;
    }
  }

  // Create MCP tool function for OpenAI Assistant
  async createMCPToolFunction(toolName: string, tool: MCPTool): Promise<any> {
    return {
      type: 'function',
      function: {
        name: `mcp_${toolName}`,
        description: tool.description,
        parameters: tool.inputSchema || {
          type: 'object',
          properties: {},
        },
      },
    };
  }

  // Execute MCP tool function for OpenAI Assistant
  async executeMCPToolFunction(
    functionName: string,
    args: any,
    agentType: string
  ): Promise<any> {
    // Remove mcp_ prefix to get actual tool name
    const toolName = functionName.replace(/^mcp_/, '');
    
    try {
      const result = await this.callMCPTool(toolName, args, agentType);
      return {
        success: true,
        result,
        toolName,
        agentType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      return {
        success: false,
        error: error.message,
        toolName,
        agentType,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get all registered servers
  getRegisteredServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  // Enable/disable server
  async toggleServer(serverId: string, enabled: boolean): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) {
      server.enabled = enabled;
      this.servers.set(serverId, server);

      // Update in database
      const tools = await storage.getAgentTools(server.agentTypes[0]);
      const serverTool = tools.find(tool => 
        tool.toolType === 'mcp_tool' && 
        (tool.configuration as any).serverId === serverId
      );

      if (serverTool) {
        await storage.updateAgentTool(serverTool.id, { enabled });
      }
    }
  }

  // Health check for all servers
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    await Promise.all(
      Array.from(this.servers.values()).map(async (server) => {
        try {
          const response = await this.callMCPServer(server.url, {
            method: 'ping',
            params: {},
          });
          health[server.id] = !response.error;
        } catch (error) {
          health[server.id] = false;
        }
      })
    );

    return health;
  }

  // Create cannabis-specific MCP tools
  getCannabisSpecificTools(): Record<string, MCPTool> {
    return {
      'cannabis_regulations_search': {
        name: 'cannabis_regulations_search',
        description: 'Search cannabis regulations by state, topic, or keyword',
        inputSchema: {
          type: 'object',
          properties: {
            state: { type: 'string', description: 'State abbreviation (e.g., CA, CO)' },
            topic: { type: 'string', description: 'Regulation topic (e.g., testing, packaging)' },
            keywords: { type: 'string', description: 'Search keywords' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            regulations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  state: { type: 'string' },
                  category: { type: 'string' },
                  lastUpdated: { type: 'string' },
                },
              },
            },
          },
        },
        serverUrl: 'http://localhost:3001/mcp',
      },

      'chemical_compound_analysis': {
        name: 'chemical_compound_analysis',
        description: 'Analyze chemical compounds and molecular properties',
        inputSchema: {
          type: 'object',
          properties: {
            smiles: { type: 'string', description: 'SMILES notation of the compound' },
            compound_name: { type: 'string', description: 'Common name of the compound' },
            analysis_type: { 
              type: 'string', 
              enum: ['properties', 'similarity', 'interactions'],
              description: 'Type of analysis to perform'
            },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            molecular_weight: { type: 'number' },
            logp: { type: 'number' },
            solubility: { type: 'string' },
            bioavailability: { type: 'number' },
            interactions: { type: 'array', items: { type: 'string' } },
          },
        },
        serverUrl: 'http://localhost:3002/mcp',
      },

      'cannabis_market_analysis': {
        name: 'cannabis_market_analysis',
        description: 'Get cannabis market trends, pricing, and competitive analysis',
        inputSchema: {
          type: 'object',
          properties: {
            region: { type: 'string', description: 'Geographic region (state or city)' },
            product_category: { 
              type: 'string', 
              enum: ['flower', 'concentrates', 'edibles', 'topicals'],
              description: 'Product category to analyze'
            },
            analysis_period: { type: 'string', description: 'Time period (e.g., 1M, 3M, 1Y)' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            market_size: { type: 'number' },
            growth_rate: { type: 'number' },
            average_pricing: { type: 'object' },
            top_competitors: { type: 'array', items: { type: 'string' } },
            trends: { type: 'array', items: { type: 'string' } },
          },
        },
        serverUrl: 'http://localhost:3003/mcp',
      },

      'pubmed_cannabis_research': {
        name: 'pubmed_cannabis_research',
        description: 'Search and analyze cannabis-related scientific literature',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Research query or topic' },
            max_results: { type: 'integer', default: 10, description: 'Maximum number of results' },
            year_range: { type: 'string', description: 'Year range (e.g., 2020-2024)' },
            study_type: { 
              type: 'string', 
              enum: ['clinical_trial', 'review', 'meta_analysis', 'all'],
              description: 'Type of studies to include'
            },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            papers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pmid: { type: 'string' },
                  title: { type: 'string' },
                  abstract: { type: 'string' },
                  authors: { type: 'array', items: { type: 'string' } },
                  journal: { type: 'string' },
                  year: { type: 'integer' },
                  doi: { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
            evidence_level: { type: 'string' },
          },
        },
        serverUrl: 'http://localhost:3004/mcp',
      },
    };
  }
}

export const mcpIntegrationService = new MCPIntegrationService();