// Use built-in fetch (Node.js 18+)

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  nodes: N8NNode[];
  connections: Record<string, any>;
  settings: {
    executionOrder: 'v1' | 'v0';
  };
  staticData?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface N8NNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  startedAt: string;
  stoppedAt?: string;
  status: 'new' | 'running' | 'success' | 'failed' | 'canceled' | 'crashed' | 'waiting';
  data?: {
    resultData: {
      runData: Record<string, any>;
    };
  };
}

export class N8NClient {
  private baseUrl: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = process.env.N8N_BASE_URL || 'http://localhost:5678', apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey || process.env.N8N_API_KEY;
    
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      this.headers['X-N8N-API-KEY'] = this.apiKey;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`N8N API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Workflow management
  async getWorkflows(): Promise<N8NWorkflow[]> {
    const response = await this.request('/workflows');
    return response.data || [];
  }

  async getWorkflow(id: string): Promise<N8NWorkflow> {
    return this.request(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async activateWorkflow(id: string): Promise<N8NWorkflow> {
    return this.request(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string): Promise<N8NWorkflow> {
    return this.request(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Execution management
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<N8NExecution> {
    return this.request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async getExecutions(workflowId?: string, limit = 20): Promise<N8NExecution[]> {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    params.append('limit', limit.toString());
    
    const response = await this.request(`/executions?${params}`);
    return response.data || [];
  }

  async getExecution(id: string): Promise<N8NExecution> {
    return this.request(`/executions/${id}`);
  }

  async stopExecution(id: string): Promise<N8NExecution> {
    return this.request(`/executions/${id}/stop`, {
      method: 'POST',
    });
  }

  // Cannabis industry specific workflows
  async createComplianceWorkflow(agentId: string, jurisdictions: string[]): Promise<N8NWorkflow> {
    const workflow: Partial<N8NWorkflow> = {
      name: `Compliance Monitor - ${agentId}`,
      active: true,
      tags: ['cannabis', 'compliance', agentId],
      nodes: [
        {
          id: 'trigger',
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1,
          position: [0, 0],
          parameters: {
            rule: {
              interval: [{ field: 'hours', value: 24 }]
            }
          }
        },
        {
          id: 'compliance-check',
          name: 'Compliance Check',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [200, 0],
          parameters: {
            url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/agents/${agentId}/compliance-check`,
            method: 'POST',
            body: {
              jurisdictions,
              timestamp: '={{$now}}'
            }
          }
        },
        {
          id: 'alert-webhook',
          name: 'Alert Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [400, 0],
          parameters: {
            path: `compliance-alert-${agentId}`,
            httpMethod: 'POST'
          }
        }
      ],
      connections: {
        'Schedule Trigger': {
          main: [[{ node: 'Compliance Check', type: 'main', index: 0 }]]
        },
        'Compliance Check': {
          main: [[{ node: 'Alert Webhook', type: 'main', index: 0 }]]
        }
      },
      settings: {
        executionOrder: 'v1'
      }
    };

    return this.createWorkflow(workflow);
  }

  async createAgentOrchestrationWorkflow(primaryAgent: string, verifyingAgents: string[]): Promise<N8NWorkflow> {
    const nodes: N8NNode[] = [
      {
        id: 'webhook-trigger',
        name: 'Query Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [0, 0],
        parameters: {
          path: `agent-query-${primaryAgent}`,
          httpMethod: 'POST'
        }
      },
      {
        id: 'primary-agent',
        name: 'Primary Agent Query',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [200, 0],
        parameters: {
          url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/agents/${primaryAgent}/query`,
          method: 'POST',
          body: {
            query: '={{$json.query}}',
            context: '={{$json.context}}'
          }
        }
      }
    ];

    // Add verification nodes for each verifying agent
    verifyingAgents.forEach((agent, index) => {
      nodes.push({
        id: `verify-${agent}`,
        name: `Verify with ${agent}`,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [400, index * 100],
        parameters: {
          url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/agents/${agent}/verify`,
          method: 'POST',
          body: {
            primaryResponse: '={{$json.response}}',
            originalQuery: '={{$json.query}}'
          }
        }
      });
    });

    // Add consensus node
    nodes.push({
      id: 'consensus',
      name: 'Build Consensus',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [600, 0],
      parameters: {
        functionCode: `
          // Collect all verification responses
          const primaryResponse = items[0].json;
          const verifications = items.slice(1);
          
          // Calculate consensus
          const totalConfidence = verifications.reduce((sum, v) => sum + v.json.confidence, primaryResponse.confidence);
          const avgConfidence = totalConfidence / (verifications.length + 1);
          
          const consensusReached = verifications.every(v => 
            Math.abs(v.json.confidence - primaryResponse.confidence) < 20
          );
          
          return [{
            json: {
              ...primaryResponse,
              finalConfidence: avgConfidence,
              consensusReached,
              verifications: verifications.map(v => v.json),
              requiresHumanReview: !consensusReached || avgConfidence < 70
            }
          }];
        `
      }
    });

    const workflow: Partial<N8NWorkflow> = {
      name: `Agent Orchestration - ${primaryAgent}`,
      active: true,
      tags: ['cannabis', 'agents', 'orchestration', primaryAgent],
      nodes,
      connections: this.buildOrchestrationConnections(verifyingAgents),
      settings: {
        executionOrder: 'v1'
      }
    };

    return this.createWorkflow(workflow);
  }

  private buildOrchestrationConnections(verifyingAgents: string[]): Record<string, any> {
    const connections: Record<string, any> = {
      'Query Webhook': {
        main: [[{ node: 'Primary Agent Query', type: 'main', index: 0 }]]
      },
      'Primary Agent Query': {
        main: [verifyingAgents.map(agent => ({ node: `Verify with ${agent}`, type: 'main', index: 0 }))]
      }
    };

    // Connect all verification nodes to consensus
    verifyingAgents.forEach(agent => {
      connections[`Verify with ${agent}`] = {
        main: [[{ node: 'Build Consensus', type: 'main', index: 0 }]]
      };
    });

    return connections;
  }

  // Integration with Formul8 agents
  async createAgentWorkflowTemplate(agentType: string, capabilities: string[]): Promise<N8NWorkflow> {
    const workflow: Partial<N8NWorkflow> = {
      name: `${agentType} Agent Workflow`,
      active: false,
      tags: ['cannabis', 'agent-template', agentType],
      nodes: [
        {
          id: 'start',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          typeVersion: 1,
          position: [0, 0],
          parameters: {}
        },
        {
          id: 'agent-query',
          name: 'Process Query',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 3,
          position: [200, 0],
          parameters: {
            url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/agents/${agentType}/query`,
            method: 'POST',
            body: {
              query: '={{$json.query}}',
              context: '={{$json.context}}',
              capabilities
            }
          }
        },
        {
          id: 'format-response',
          name: 'Format Response',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [400, 0],
          parameters: {
            functionCode: `
              const response = items[0].json;
              return [{
                json: {
                  agent: '${agentType}',
                  response: response.response,
                  confidence: response.confidence,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    capabilities: ${JSON.stringify(capabilities)},
                    processingTime: response.processingTime,
                    sources: response.sources
                  }
                }
              }];
            `
          }
        }
      ],
      connections: {
        'Start': {
          main: [[{ node: 'Process Query', type: 'main', index: 0 }]]
        },
        'Process Query': {
          main: [[{ node: 'Format Response', type: 'main', index: 0 }]]
        }
      },
      settings: {
        executionOrder: 'v1'
      }
    };

    return this.createWorkflow(workflow);
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', version?: string }> {
    try {
      const response = await this.request('/health');
      return { status: 'healthy', version: response.version };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

// Export singleton instance
export const n8nClient = new N8NClient();