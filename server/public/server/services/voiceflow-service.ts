export interface VoiceFlowAgent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  knowledgeBaseEnabled: boolean;
  pathTools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export interface VoiceFlowResponse {
  response: string;
  confidence: number;
  sources: string[];
  metadata: {
    agentId: string;
    model: string;
    tokenUsage: number;
    responseTime: number;
  };
}

export class VoiceFlowService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.VOICEFLOW_API_KEY || '';
    this.baseUrl = 'https://api.voiceflow.com/v2';
  }

  async getAgent(agentId: string): Promise<VoiceFlowAgent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const agent = await response.json();
      return {
        id: agent.id,
        name: agent.name || 'VoiceFlow Agent',
        description: agent.description || '',
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.3,
        maxTokens: agent.maxTokens || 2000,
        knowledgeBaseEnabled: agent.knowledgeBaseEnabled || false,
        pathTools: agent.pathTools || []
      };
    } catch (error) {
      console.error('Error fetching VoiceFlow agent:', error);
      return null;
    }
  }

  async queryAgent(agentId: string, query: string, sessionId?: string): Promise<VoiceFlowResponse> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          sessionId: sessionId || `session_${Date.now()}`,
          context: {
            platform: 'webchat',
            locale: 'en-US'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        response: data.response || 'No response from VoiceFlow agent',
        confidence: data.confidence || 75,
        sources: data.sources || [],
        metadata: {
          agentId,
          model: data.model || 'gpt-4o',
          tokenUsage: data.tokenUsage || 0,
          responseTime
        }
      };
    } catch (error) {
      console.error('Error querying VoiceFlow agent:', error);
      throw new Error(`Failed to query VoiceFlow agent: ${error}`);
    }
  }

  async listAgents(): Promise<VoiceFlowAgent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.agents?.map((agent: any) => ({
        id: agent.id,
        name: agent.name || 'VoiceFlow Agent',
        description: agent.description || '',
        instructions: agent.instructions || '',
        model: agent.model || 'gpt-4o',
        temperature: agent.temperature || 0.3,
        maxTokens: agent.maxTokens || 2000,
        knowledgeBaseEnabled: agent.knowledgeBaseEnabled || false,
        pathTools: agent.pathTools || []
      })) || [];
    } catch (error) {
      console.error('Error listing VoiceFlow agents:', error);
      return [];
    }
  }

  async createAgent(agentConfig: Omit<VoiceFlowAgent, 'id'>): Promise<VoiceFlowAgent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentConfig)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        knowledgeBaseEnabled: data.knowledgeBaseEnabled,
        pathTools: data.pathTools
      };
    } catch (error) {
      console.error('Error creating VoiceFlow agent:', error);
      return null;
    }
  }

  async updateAgent(agentId: string, updates: Partial<VoiceFlowAgent>): Promise<VoiceFlowAgent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        knowledgeBaseEnabled: data.knowledgeBaseEnabled,
        pathTools: data.pathTools
      };
    } catch (error) {
      console.error('Error updating VoiceFlow agent:', error);
      return null;
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting VoiceFlow agent:', error);
      return false;
    }
  }

  // Extract agent prompts from VoiceFlow .vf file
  async extractPromptsFromVF(vfFilePath: string): Promise<Record<string, string>> {
    try {
      // This would parse the .vf file and extract agent instructions
      // For now, return a placeholder structure
      return {
        'formulation': 'Dr. Formul8 instructions from VoiceFlow',
        'compliance': 'Counsel CannaLex instructions from VoiceFlow',
        'marketing': 'Market Maven instructions from VoiceFlow',
        'operations': 'Operations instructions from VoiceFlow',
        'patent': 'IP Sentinel instructions from VoiceFlow',
        'sourcing': 'Supply Scout instructions from VoiceFlow',
        'extraction': 'Process Pro instructions from VoiceFlow',
        'regulatory': 'Reg-Navigator instructions from VoiceFlow'
      };
    } catch (error) {
      console.error('Error extracting prompts from VoiceFlow file:', error);
      return {};
    }
  }

  // Map Formul8 agents to VoiceFlow agents
  getVoiceFlowAgentMapping(): Record<string, string> {
    return {
      'formulation': '680a4383df064418b5db1cb4', // Dr. Formul8
      'compliance': '680a4d5ddf064418b5db22dd', // Counsel CannaLex
      'marketing': '680a5659df064418b5db271f', // Market Maven
      'operations': 'operations_agent_id',
      'patent': '680a5685df064418b5db2733', // IP Sentinel
      'sourcing': '680a5699df064418b5db274a', // Supply Scout
      'extraction': '680a5474df064418b5db260e', // Process Pro
      'regulatory': '680a544fdf064418b5db25fd' // Reg-Navigator
    };
  }
}

export const voiceflowService = new VoiceFlowService(); 