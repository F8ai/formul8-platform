import OpenAI from 'openai';
import { storage } from '../storage';
import type { UserArtifact, AgentTool } from '@shared/schema';

export interface AssistantConfig {
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: any[];
  agentType: string;
}

export interface MCPServer {
  url: string;
  name: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
}

export class OpenAIAssistantService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Create OpenAI Assistant for agent
  async createAssistant(config: AssistantConfig): Promise<string> {
    const assistant = await this.openai.beta.assistants.create({
      name: config.name,
      description: config.description,
      instructions: config.instructions,
      model: config.model,
      tools: config.tools,
    });

    // Store assistant configuration
    await storage.createAgentTool({
      agentType: config.agentType,
      toolName: 'openai_assistant',
      toolType: 'openai_function',
      configuration: {
        assistantId: assistant.id,
        model: config.model,
        instructions: config.instructions,
        tools: config.tools,
      },
      enabled: true,
      openaiAssistantId: assistant.id,
    });

    return assistant.id;
  }

  // Get or create document reading function for assistant
  async createDocumentReadingTool(agentType: string): Promise<any> {
    return {
      type: 'function',
      function: {
        name: 'read_user_artifact',
        description: 'Read content from a user artifact (document, sheet, form, etc.)',
        parameters: {
          type: 'object',
          properties: {
            artifactId: {
              type: 'integer',
              description: 'The ID of the artifact to read',
            },
            userId: {
              type: 'string',
              description: 'The user ID who owns the artifact',
            },
          },
          required: ['artifactId', 'userId'],
        },
      },
    };
  }

  // Create document writing function for assistant
  async createDocumentWritingTool(agentType: string): Promise<any> {
    return {
      type: 'function',
      function: {
        name: 'update_user_artifact',
        description: 'Update content in a user artifact with tracking',
        parameters: {
          type: 'object',
          properties: {
            artifactId: {
              type: 'integer',
              description: 'The ID of the artifact to update',
            },
            userId: {
              type: 'string',
              description: 'The user ID who owns the artifact',
            },
            updates: {
              type: 'object',
              description: 'The updates to apply to the artifact',
              properties: {
                content: {
                  type: 'object',
                  description: 'Updated content for the artifact',
                },
                title: {
                  type: 'string',
                  description: 'Updated title (optional)',
                },
                description: {
                  type: 'string',
                  description: 'Updated description (optional)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Updated tags (optional)',
                },
              },
            },
            reason: {
              type: 'string',
              description: 'Reason for the modification',
            },
          },
          required: ['artifactId', 'userId', 'updates', 'reason'],
        },
      },
    };
  }

  // Create Google Docs editing tool for assistant
  async createGoogleDocsEditingTool(agentType: string): Promise<any> {
    return {
      type: 'function',
      function: {
        name: 'edit_google_document',
        description: 'Edit a Google Document with specific operations',
        parameters: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Google Document ID',
            },
            edits: {
              type: 'array',
              description: 'Array of edit operations to perform',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['insert', 'replace', 'delete', 'format', 'insertTable', 'insertImage'],
                    description: 'Type of edit operation',
                  },
                  position: {
                    type: 'integer',
                    description: 'Character position for insert/delete operations',
                  },
                  endPosition: {
                    type: 'integer',
                    description: 'End position for delete/format operations',
                  },
                  text: {
                    type: 'string',
                    description: 'Text to insert',
                  },
                  searchText: {
                    type: 'string',
                    description: 'Text to search for replacement',
                  },
                  replaceText: {
                    type: 'string',
                    description: 'Replacement text',
                  },
                  formatting: {
                    type: 'object',
                    description: 'Text formatting options',
                  },
                  tableRows: {
                    type: 'integer',
                    description: 'Number of table rows',
                  },
                  tableColumns: {
                    type: 'integer',
                    description: 'Number of table columns',
                  },
                  imageUrl: {
                    type: 'string',
                    description: 'URL of image to insert',
                  },
                },
                required: ['type'],
              },
            },
            reason: {
              type: 'string',
              description: 'Reason for the document edits',
            },
          },
          required: ['documentId', 'edits', 'reason'],
        },
      },
    };
  }

  // Execute assistant function call
  async executeFunction(functionName: string, args: any, agentType: string): Promise<any> {
    try {
      switch (functionName) {
        case 'read_user_artifact':
          return await this.readUserArtifact(args.artifactId, args.userId, agentType);
        
        case 'update_user_artifact':
          return await this.updateUserArtifact(
            args.artifactId,
            args.userId,
            args.updates,
            args.reason,
            agentType
          );
        
        case 'edit_google_document':
          return await this.editGoogleDocument(
            args.documentId,
            args.edits,
            args.reason,
            agentType
          );
        
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      throw error;
    }
  }

  private async readUserArtifact(artifactId: number, userId: string, agentType: string): Promise<any> {
    const artifact = await storage.getArtifact(artifactId);
    
    if (!artifact || artifact.userId !== userId) {
      throw new Error('Artifact not found or access denied');
    }

    // Check permissions
    const permissions = artifact.permissions as any;
    if (!permissions[agentType] || (permissions[agentType] !== 'read' && permissions[agentType] !== 'write' && permissions[agentType] !== 'admin')) {
      throw new Error('Agent does not have read permission');
    }

    // Log access
    const currentAccess = Array.isArray(artifact.agentAccess) ? artifact.agentAccess : [];
    if (!currentAccess.includes(agentType)) {
      await storage.updateArtifact(artifactId, {
        agentAccess: [...currentAccess, agentType],
      });
    }

    return {
      id: artifact.id,
      title: artifact.title,
      description: artifact.description,
      type: artifact.type,
      category: artifact.category,
      content: artifact.content,
      version: artifact.version,
      status: artifact.status,
      tags: artifact.tags,
      googleDriveUrl: artifact.googleDriveUrl,
      lastModified: artifact.updatedAt,
    };
  }

  private async updateUserArtifact(
    artifactId: number,
    userId: string,
    updates: any,
    reason: string,
    agentType: string
  ): Promise<any> {
    const artifact = await storage.getArtifact(artifactId);
    
    if (!artifact || artifact.userId !== userId) {
      throw new Error('Artifact not found or access denied');
    }

    // Check permissions
    const permissions = artifact.permissions as any;
    if (!permissions[agentType] || (permissions[agentType] !== 'write' && permissions[agentType] !== 'admin')) {
      throw new Error('Agent does not have write permission');
    }

    // Update artifact
    const updatedArtifact = await storage.updateArtifact(artifactId, updates, agentType);

    // Log the change
    await storage.logArtifactChange({
      artifactId,
      userId,
      agentType,
      changeType: 'update',
      changes: updates,
      changeReason: reason,
      previousVersion: artifact.version || 1,
      newVersion: (artifact.version || 1) + 1,
    });

    return {
      success: true,
      newVersion: updatedArtifact?.version,
      message: `Artifact updated by ${agentType}: ${reason}`,
    };
  }

  private async editGoogleDocument(
    documentId: string,
    edits: any[],
    reason: string,
    agentType: string
  ): Promise<any> {
    // Import enhanced Google Docs service
    const { enhancedGoogleDocsService } = await import('./enhanced-google-docs');
    
    try {
      const result = await enhancedGoogleDocsService.agentUpdateDocument(
        documentId,
        agentType,
        edits,
        reason
      );

      return {
        success: true,
        message: `Document edited by ${agentType}: ${reason}`,
        editsApplied: edits.length,
        result,
      };
    } catch (error) {
      console.error('Error editing Google Document:', error);
      throw new Error(`Failed to edit document: ${error.message}`);
    }
  }

  // Create comprehensive assistant for agent type
  async createComprehensiveAssistant(agentType: string): Promise<string> {
    const tools = [
      await this.createDocumentReadingTool(agentType),
      await this.createDocumentWritingTool(agentType),
      await this.createGoogleDocsEditingTool(agentType),
    ];

    const config: AssistantConfig = {
      name: `Formul8 ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
      description: `Specialized AI agent for ${agentType} operations in the cannabis industry`,
      instructions: this.getAgentInstructions(agentType),
      model: 'gpt-4o', // Use latest model
      tools,
      agentType,
    };

    return await this.createAssistant(config);
  }

  private getAgentInstructions(agentType: string): string {
    const baseInstructions = `You are a specialized AI agent for the cannabis industry, working as part of the Formul8 platform. You have access to user artifacts (documents, sheets, forms) that you can read and modify to help users with their tasks.

Always be professional, accurate, and compliant with cannabis regulations. When modifying documents, provide clear reasons for your changes and maintain version control.

You can:
1. Read user artifacts to understand their content and structure
2. Update artifact content with proper tracking and versioning
3. Edit Google Documents with specific formatting and content changes
4. Maintain detailed logs of all modifications

Always ask for clarification if user requests are ambiguous, and prioritize accuracy over speed.`;

    const agentSpecificInstructions = {
      'compliance': `You specialize in cannabis compliance and regulatory guidance. Focus on:
- State and federal cannabis regulations
- Compliance documentation and procedures
- Regulatory change tracking
- License requirements and applications
- Quality assurance protocols`,

      'patent': `You specialize in patent and intellectual property research. Focus on:
- Patent landscape analysis
- Freedom-to-operate assessments
- IP strategy and protection
- Prior art searches
- Patent filing guidance`,

      'formulation': `You specialize in cannabis product formulation and chemistry. Focus on:
- Product development and optimization
- Chemical analysis and molecular properties
- Extraction method recommendations
- Dosage calculations and formulations
- Quality control testing`,

      'marketing': `You specialize in cannabis marketing and brand strategy. Focus on:
- Compliant marketing strategies
- Brand development and positioning
- Campaign optimization and analytics
- Market research and competitive analysis
- Customer acquisition and retention`,

      'science': `You specialize in cannabis science and research. Focus on:
- Scientific literature analysis
- Research methodology and design
- Evidence-based recommendations
- Clinical study evaluation
- Academic research synthesis`,

      'operations': `You specialize in cannabis operations and facility management. Focus on:
- Operational efficiency optimization
- Facility design and workflow
- Inventory management systems
- Process standardization
- Cost optimization strategies`,

      'customer-success': `You specialize in customer success and support. Focus on:
- Customer relationship management
- Support ticket resolution
- User experience optimization
- Customer feedback analysis
- Success metric tracking`,
    };

    return baseInstructions + '\n\n' + (agentSpecificInstructions[agentType] || 'You are a general-purpose cannabis industry agent.');
  }
}

export const openaiAssistantService = new OpenAIAssistantService();