import { BaseAgent } from '../agents/base.js';
import crypto from 'crypto';

interface FederatedNode {
  id: string;
  type: 'local' | 'cloud';
  endpoint: string;
  agents: string[];
  lastHeartbeat: Date;
  certificateFingerprint?: string;
}

interface FederationRequest {
  agentType: string;
  query: string;
  sourceNode: string;
  requiresSecureChannel: boolean;
}

export class FederationManager {
  private nodes: Map<string, FederatedNode> = new Map();
  private localAgents: Map<string, BaseAgent> = new Map();
  
  constructor() {
    // Initialize with cloud node (this instance)
    this.registerNode({
      id: 'formul8-cloud',
      type: 'cloud',
      endpoint: process.env.CLOUD_ENDPOINT || 'https://formul8.ai',
      agents: ['compliance', 'patent', 'marketing', 'science', 'spectra'],
      lastHeartbeat: new Date()
    });
  }

  async registerLocalNode(nodeConfig: Omit<FederatedNode, 'lastHeartbeat'>): Promise<string> {
    const nodeId = nodeConfig.id || crypto.randomUUID();
    
    this.nodes.set(nodeId, {
      ...nodeConfig,
      id: nodeId,
      lastHeartbeat: new Date()
    });
    
    console.log(`Registered federated node: ${nodeId} at ${nodeConfig.endpoint}`);
    return nodeId;
  }

  async routeQuery(request: FederationRequest): Promise<any> {
    // Find best node for this agent type
    const targetNode = this.findBestNodeForAgent(request.agentType);
    
    if (!targetNode) {
      throw new Error(`No federated node available for agent: ${request.agentType}`);
    }

    if (targetNode.type === 'local' && targetNode.id !== 'formul8-cloud') {
      // Route to local federated node
      return this.forwardToLocalNode(targetNode, request);
    } else {
      // Process locally on cloud
      return this.processLocally(request);
    }
  }

  private findBestNodeForAgent(agentType: string): FederatedNode | null {
    for (const node of this.nodes.values()) {
      if (node.agents.includes(agentType)) {
        // Prefer local nodes for data sovereignty
        if (node.type === 'local') return node;
      }
    }
    
    // Fallback to cloud nodes
    for (const node of this.nodes.values()) {
      if (node.agents.includes(agentType) && node.type === 'cloud') {
        return node;
      }
    }
    
    return null;
  }

  private async forwardToLocalNode(node: FederatedNode, request: FederationRequest): Promise<any> {
    const response = await fetch(`${node.endpoint}/api/federation/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Federation-Source': 'formul8-cloud',
        'X-Certificate-Fingerprint': node.certificateFingerprint || ''
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Federation request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async processLocally(request: FederationRequest): Promise<any> {
    const agent = this.localAgents.get(request.agentType);
    
    if (!agent) {
      throw new Error(`Local agent ${request.agentType} not available`);
    }

    return agent.processQuery(request.query);
  }

  async updateHeartbeat(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = new Date();
    }
  }

  getActiveNodes(): FederatedNode[] {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    return Array.from(this.nodes.values())
      .filter(node => node.lastHeartbeat > cutoff);
  }

  generateNodeCredentials(): { nodeId: string; certificate: string; privateKey: string } {
    const nodeId = crypto.randomUUID();
    // In production, generate proper X.509 certificates
    const certificate = Buffer.from(`cert-${nodeId}`).toString('base64');
    const privateKey = Buffer.from(`key-${nodeId}`).toString('base64');
    
    return { nodeId, certificate, privateKey };
  }
}

export const federationManager = new FederationManager();