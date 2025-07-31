import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

export interface DocumentEdit {
  type: 'insert' | 'replace' | 'delete' | 'format' | 'insertTable' | 'insertImage';
  position?: number;
  endPosition?: number;
  text?: string;
  searchText?: string;
  replaceText?: string;
  formatting?: any;
  tableRows?: number;
  tableColumns?: number;
  imageUrl?: string;
  imageSize?: { width: number; height: number };
}

export interface DocumentSection {
  title: string;
  content: string;
  formatting?: any;
}

export class EnhancedGoogleDocsService {
  private auth: JWT;
  private docs: any;
  private drive: any;

  constructor() {
    this.auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
      ]
    );

    this.docs = google.docs({ version: 'v1', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // Enhanced document content reading
  async getDocumentContent(documentId: string): Promise<any> {
    const response = await this.docs.documents.get({
      documentId,
    });
    return response.data;
  }

  async getDocumentText(documentId: string): Promise<string> {
    const document = await this.getDocumentContent(documentId);
    let text = '';
    
    if (document.body && document.body.content) {
      for (const element of document.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        } else if (element.table) {
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              for (const cellElement of cell.content || []) {
                if (cellElement.paragraph) {
                  for (const textElement of cellElement.paragraph.elements || []) {
                    if (textElement.textRun) {
                      text += textElement.textRun.content;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return text;
  }

  // Comprehensive document editing capabilities
  async batchUpdateDocument(documentId: string, edits: DocumentEdit[]): Promise<any> {
    const requests = edits.map(edit => this.convertEditToRequest(edit));
    
    const response = await this.docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });
    
    return response.data;
  }

  private convertEditToRequest(edit: DocumentEdit): any {
    switch (edit.type) {
      case 'insert':
        return {
          insertText: {
            location: { index: edit.position! },
            text: edit.text!,
          },
        };
      
      case 'replace':
        return {
          replaceAllText: {
            containsText: {
              text: edit.searchText!,
              matchCase: false,
            },
            replaceText: edit.replaceText!,
          },
        };
      
      case 'delete':
        return {
          deleteContentRange: {
            range: {
              startIndex: edit.position!,
              endIndex: edit.endPosition!,
            },
          },
        };
      
      case 'format':
        return {
          updateTextStyle: {
            range: {
              startIndex: edit.position!,
              endIndex: edit.endPosition!,
            },
            textStyle: edit.formatting!,
            fields: Object.keys(edit.formatting!).join(','),
          },
        };
      
      case 'insertTable':
        return {
          insertTable: {
            location: { index: edit.position! },
            rows: edit.tableRows!,
            columns: edit.tableColumns!,
          },
        };
      
      case 'insertImage':
        return {
          insertInlineImage: {
            location: { index: edit.position! },
            uri: edit.imageUrl!,
            objectSize: {
              height: { 
                magnitude: edit.imageSize?.height || 200, 
                unit: 'PT' 
              },
              width: { 
                magnitude: edit.imageSize?.width || 300, 
                unit: 'PT' 
              },
            },
          },
        };
      
      default:
        throw new Error(`Unknown edit type: ${edit.type}`);
    }
  }

  // Smart document creation with structured content
  async createStructuredDocument(title: string, sections: DocumentSection[]): Promise<string> {
    // Create the document
    const document = await this.docs.documents.create({
      requestBody: {
        title,
      },
    });

    const documentId = document.data.documentId!;

    // Build content with proper formatting
    const requests = [];
    let currentIndex = 1; // Start after the default paragraph

    for (const section of sections) {
      // Insert section title
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${section.title}\n`,
        },
      });

      // Format section title as heading
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + section.title.length + 1,
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_1',
          },
          fields: 'namedStyleType',
        },
      });

      currentIndex += section.title.length + 1;

      // Insert section content
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${section.content}\n\n`,
        },
      });

      // Apply custom formatting if specified
      if (section.formatting) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + section.content.length,
            },
            textStyle: section.formatting,
            fields: Object.keys(section.formatting).join(','),
          },
        });
      }

      currentIndex += section.content.length + 2;
    }

    // Apply all changes
    if (requests.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }

    return documentId;
  }

  // Template-based document creation for agents
  async createPatentSearchDocument(data: any): Promise<string> {
    const sections: DocumentSection[] = [
      {
        title: 'Patent Search Report',
        content: `Search Query: ${data.search_query}\nSearch Date: ${data.search_date}\nTotal Patents Found: ${data.total_patents}\nRelevant Patents: ${data.relevant_patents}`,
        formatting: { bold: true }
      },
      {
        title: 'Key Patent Findings',
        content: data.patents.map((patent: any, index: number) => 
          `${index + 1}. ${patent.title} (${patent.patent_number})\n` +
          `   Inventors: ${patent.inventors.join(', ')}\n` +
          `   Assignee: ${patent.assignee}\n` +
          `   Relevance Score: ${(patent.relevance_score * 100).toFixed(1)}%\n` +
          `   Abstract: ${patent.abstract}\n\n`
        ).join('')
      },
      {
        title: 'Freedom to Operate Analysis',
        content: `Risk Level: ${data.freedom_to_operate.risk_level}\n` +
                `Blocking Patents: ${data.freedom_to_operate.blocking_patents}\n` +
                `Expiring Patents: ${data.freedom_to_operate.expiring_patents}\n\n` +
                `Recommendations:\n${data.freedom_to_operate.recommendations.map((rec: string) => `• ${rec}`).join('\n')}`
      }
    ];

    return await this.createStructuredDocument(`Patent Search Report - ${data.search_query}`, sections);
  }

  async createSOPDocument(data: any): Promise<string> {
    const sections: DocumentSection[] = [
      {
        title: data.title,
        content: `Document ID: ${data.document_id}\nVersion: ${data.version}\nEffective Date: ${data.effective_date}\nAuthor: ${data.author}\nApprover: ${data.approver}`
      },
      {
        title: 'Scope and Purpose',
        content: data.scope
      },
      {
        title: 'Procedures',
        content: data.procedures.map((proc: any) => 
          `Step ${proc.step}: ${proc.title}\n` +
          `Duration: ${proc.duration}\n` +
          `Description: ${proc.description}\n` +
          `Equipment: ${proc.equipment.join(', ')}\n` +
          `Requirements:\n${proc.requirements.map((req: string) => `• ${req}`).join('\n')}\n\n`
        ).join('')
      },
      {
        title: 'Quality Metrics',
        content: Object.entries(data.quality_metrics).map(([key, value]) => 
          `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`
        ).join('\n')
      }
    ];

    return await this.createStructuredDocument(data.title, sections);
  }

  async createFormulationSheet(data: any): Promise<string> {
    const sections: DocumentSection[] = [
      {
        title: `Formulation Sheet: ${data.product_name}`,
        content: `Batch Number: ${data.batch_number}\nFormulation Date: ${data.formulation_date}\nFormulator: ${data.formulator}`
      },
      {
        title: 'Target Specifications',
        content: Object.entries(data.target_specifications).map(([key, value]) => 
          `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`
        ).join('\n')
      },
      {
        title: 'Ingredients',
        content: data.ingredients.map((ing: any, index: number) => 
          `${index + 1}. ${ing.ingredient}\n` +
          `   Supplier: ${ing.supplier}\n` +
          `   Lot Number: ${ing.lot_number}\n` +
          `   Purity: ${ing.purity}\n` +
          `   Quantity: ${ing.quantity_mg || ing.quantity_ml}\n` +
          `   Percentage: ${ing.percentage}\n` +
          `   Cost: ${ing.cost_per_gram || ing.cost_per_ml}\n\n`
        ).join('')
      },
      {
        title: 'Manufacturing Process',
        content: data.manufacturing_process.map((step: string, index: number) => 
          `${index + 1}. ${step}`
        ).join('\n')
      },
      {
        title: 'Testing Requirements',
        content: Object.entries(data.testing_requirements).map(([test, method]) => 
          `${test.replace(/_/g, ' ').toUpperCase()}: ${method}`
        ).join('\n')
      },
      {
        title: 'Cost Analysis',
        content: Object.entries(data.cost_analysis).map(([key, value]) => 
          `${key.replace(/_/g, ' ').toUpperCase()}: ${typeof value === 'number' ? `$${value.toFixed(2)}` : value}`
        ).join('\n')
      }
    ];

    return await this.createStructuredDocument(`${data.product_name} - Formulation Sheet`, sections);
  }

  // Advanced formatting capabilities
  async applyDocumentTheme(documentId: string, theme: 'professional' | 'creative' | 'technical'): Promise<void> {
    const themeStyles: Record<string, any> = {
      professional: {
        documentStyle: {
          background: {
            color: { color: { rgbColor: { red: 1, green: 1, blue: 1 } } }
          },
          defaultHeaderId: '',
          defaultFooterId: '',
          evenPageHeaderId: '',
          evenPageFooterId: '',
          firstPageHeaderId: '',
          firstPageFooterId: '',
          useFirstPageHeaderFooter: false,
          useEvenPageHeaderFooter: false,
          pageNumberStart: 1,
          marginTop: { magnitude: 72, unit: 'PT' },
          marginBottom: { magnitude: 72, unit: 'PT' },
          marginLeft: { magnitude: 72, unit: 'PT' },
          marginRight: { magnitude: 72, unit: 'PT' }
        }
      },
      creative: {
        // Add creative theme styles
      },
      technical: {
        // Add technical theme styles  
      }
    };

    const requests = [{
      updateDocumentStyle: {
        documentStyle: themeStyles[theme].documentStyle,
        fields: Object.keys(themeStyles[theme].documentStyle).join(',')
      }
    }];

    await this.docs.documents.batchUpdate({
      documentId,
      requestBody: { requests }
    });
  }

  // Agent-specific document operations
  async agentReadDocument(documentId: string, agentType: string): Promise<{ content: string; metadata: any }> {
    const document = await this.getDocumentContent(documentId);
    const text = await this.getDocumentText(documentId);
    
    return {
      content: text,
      metadata: {
        title: document.title,
        documentId,
        lastModified: document.revisionId,
        agentAccess: agentType,
        accessTime: new Date().toISOString()
      }
    };
  }

  async agentUpdateDocument(documentId: string, agentType: string, edits: DocumentEdit[], reason?: string): Promise<any> {
    // Log the agent modification
    const logEdit: DocumentEdit = {
      type: 'insert',
      position: 1,
      text: `[AGENT UPDATE - ${agentType} - ${new Date().toISOString()}${reason ? ` - ${reason}` : ''}]\n\n`
    };

    const allEdits = [logEdit, ...edits];
    return await this.batchUpdateDocument(documentId, allEdits);
  }

  // Share document with specific permissions
  async shareDocumentWithAgent(documentId: string, agentType: string, permission: 'reader' | 'writer' = 'writer'): Promise<void> {
    // This is a conceptual method - in practice, agents would access through service account
    console.log(`Document ${documentId} shared with ${agentType} agent with ${permission} permission`);
  }
}

export const enhancedGoogleDocsService = new EnhancedGoogleDocsService();