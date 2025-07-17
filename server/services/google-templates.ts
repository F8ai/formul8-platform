import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

export interface TemplateConfig {
  name: string;
  description: string;
  category: string;
  templateType: 'document' | 'spreadsheet' | 'presentation' | 'form';
  variables: Record<string, any>;
  sections?: Array<{
    title: string;
    placeholder: string;
    required: boolean;
  }>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  previewUrl: string;
  variables: string[];
  createdAt: string;
}

export class GoogleTemplateService {
  private auth: JWT;
  private drive: any;
  private docs: any;
  private sheets: any;
  private slides: any;
  private forms: any;
  private templateFolderId: string = '';

  constructor() {
    this.auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/forms',
      ]
    );

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.docs = google.docs({ version: 'v1', auth: this.auth });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.slides = google.slides({ version: 'v1', auth: this.auth });
    this.forms = google.forms({ version: 'v1', auth: this.auth });
  }

  // Initialize template folder
  async initializeTemplateFolder(): Promise<string> {
    if (this.templateFolderId) return this.templateFolderId;

    try {
      // Check if template folder exists
      const response = await this.drive.files.list({
        q: "name='Formul8 Templates' and mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        this.templateFolderId = response.data.files[0].id;
      } else {
        // Create template folder
        const folder = await this.drive.files.create({
          requestBody: {
            name: 'Formul8 Templates',
            mimeType: 'application/vnd.google-apps.folder',
          },
        });
        this.templateFolderId = folder.data.id;
      }

      return this.templateFolderId;
    } catch (error) {
      console.error('Error initializing template folder:', error);
      throw error;
    }
  }

  // Create document template
  async createDocumentTemplate(config: TemplateConfig): Promise<DocumentTemplate> {
    const folderId = await this.initializeTemplateFolder();

    // Create the template document
    const doc = await this.docs.documents.create({
      requestBody: {
        title: `Template: ${config.name}`,
      },
    });

    const documentId = doc.data.documentId!;

    // Build template content with placeholders
    const requests = [];
    let currentIndex = 1;

    // Title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `${config.name}\n\n`,
      },
    });

    // Format title
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + config.name.length + 2,
        },
        paragraphStyle: {
          namedStyleType: 'TITLE',
        },
        fields: 'namedStyleType',
      },
    });

    currentIndex += config.name.length + 2;

    // Add sections with placeholders
    if (config.sections) {
      for (const section of config.sections) {
        // Section heading
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: `${section.title}\n`,
          },
        });

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

        // Placeholder text
        const placeholderText = `${section.placeholder}${section.required ? ' *' : ''}\n\n`;
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: placeholderText,
          },
        });

        // Style placeholder text
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + placeholderText.length,
            },
            textStyle: {
              italic: true,
              foregroundColor: {
                color: {
                  rgbColor: { red: 0.5, green: 0.5, blue: 0.5 },
                },
              },
            },
            fields: 'italic,foregroundColor',
          },
        });

        currentIndex += placeholderText.length;
      }
    }

    // Apply all changes
    if (requests.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }

    // Move to template folder
    await this.drive.files.update({
      fileId: documentId,
      addParents: folderId,
    });

    return {
      id: documentId,
      name: config.name,
      description: config.description,
      category: config.category,
      previewUrl: `https://docs.google.com/document/d/${documentId}`,
      variables: Object.keys(config.variables),
      createdAt: new Date().toISOString(),
    };
  }

  // Create spreadsheet template
  async createSpreadsheetTemplate(config: TemplateConfig): Promise<DocumentTemplate> {
    const folderId = await this.initializeTemplateFolder();

    const spreadsheet = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Template: ${config.name}`,
        },
        sheets: [
          {
            properties: {
              title: 'Main',
              gridProperties: { rowCount: 1000, columnCount: 26 },
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Add template headers and sample data
    const values = [
      [config.name, '', '', '', ''],
      ['Created from Formul8 Template', '', '', '', ''],
      ['', '', '', '', ''],
      ...this.generateSpreadsheetSections(config),
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Main!A1:E50',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Move to template folder
    await this.drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
    });

    return {
      id: spreadsheetId,
      name: config.name,
      description: config.description,
      category: config.category,
      previewUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      variables: Object.keys(config.variables),
      createdAt: new Date().toISOString(),
    };
  }

  // Create presentation template
  async createPresentationTemplate(config: TemplateConfig): Promise<DocumentTemplate> {
    const folderId = await this.initializeTemplateFolder();

    const presentation = await this.slides.presentations.create({
      requestBody: {
        title: `Template: ${config.name}`,
      },
    });

    const presentationId = presentation.data.presentationId!;

    // Add template slides
    const requests = [];

    // Title slide content
    requests.push({
      insertText: {
        objectId: presentation.data.slides![0].pageElements![0].objectId,
        text: config.name,
      },
    });

    requests.push({
      insertText: {
        objectId: presentation.data.slides![0].pageElements![1].objectId,
        text: config.description,
      },
    });

    // Add additional slides for each section
    if (config.sections) {
      config.sections.forEach((section, index) => {
        requests.push({
          createSlide: {
            objectId: `slide_${index + 1}`,
            insertionIndex: index + 1,
            slideLayoutReference: {
              predefinedLayout: 'TITLE_AND_BODY',
            },
          },
        });
      });
    }

    await this.slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });

    // Move to template folder
    await this.drive.files.update({
      fileId: presentationId,
      addParents: folderId,
    });

    return {
      id: presentationId,
      name: config.name,
      description: config.description,
      category: config.category,
      previewUrl: `https://docs.google.com/presentation/d/${presentationId}`,
      variables: Object.keys(config.variables),
      createdAt: new Date().toISOString(),
    };
  }

  // Create document from template
  async createFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    title: string,
    userEmail: string
  ): Promise<{ id: string; url: string }> {
    // Copy the template
    const copy = await this.drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: title,
      },
    });

    const newDocumentId = copy.data.id!;

    // Get document content
    const document = await this.docs.documents.get({
      documentId: newDocumentId,
    });

    // Replace variables in the document
    const requests = [];
    
    for (const [variable, value] of Object.entries(variables)) {
      requests.push({
        replaceAllText: {
          containsText: {
            text: `{{${variable}}}`,
            matchCase: false,
          },
          replaceText: String(value),
        },
      });
    }

    if (requests.length > 0) {
      await this.docs.documents.batchUpdate({
        documentId: newDocumentId,
        requestBody: { requests },
      });
    }

    // Share with user
    await this.drive.permissions.create({
      fileId: newDocumentId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: userEmail,
      },
    });

    return {
      id: newDocumentId,
      url: `https://docs.google.com/document/d/${newDocumentId}`,
    };
  }

  // Get all available templates
  async getAvailableTemplates(category?: string): Promise<DocumentTemplate[]> {
    const folderId = await this.initializeTemplateFolder();

    let query = `'${folderId}' in parents and name contains 'Template:'`;
    if (category) {
      query += ` and fullText contains '${category}'`;
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, description, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc',
    });

    return (response.data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name.replace('Template: ', ''),
      description: file.description || '',
      category: this.extractCategoryFromFile(file),
      previewUrl: file.webViewLink,
      variables: [], // Would need to parse document to extract variables
      createdAt: file.createdTime,
    }));
  }

  // Create cannabis industry specific templates
  async createCannabisTemplates(): Promise<DocumentTemplate[]> {
    const templates = [];

    // 1. Standard Operating Procedure Template
    const sopTemplate = await this.createDocumentTemplate({
      name: 'Cannabis SOP Template',
      description: 'Standard Operating Procedure template for cannabis operations',
      category: 'compliance',
      templateType: 'document',
      variables: {
        procedure_name: 'Procedure Name',
        effective_date: 'Effective Date',
        version: 'Version',
        author: 'Author Name',
        approver: 'Approver Name',
      },
      sections: [
        {
          title: 'Purpose and Scope',
          placeholder: 'Describe the purpose and scope of this procedure...',
          required: true,
        },
        {
          title: 'Definitions',
          placeholder: 'Define key terms used in this procedure...',
          required: false,
        },
        {
          title: 'Responsibilities',
          placeholder: 'List roles and responsibilities...',
          required: true,
        },
        {
          title: 'Procedure Steps',
          placeholder: 'Detail step-by-step procedures...',
          required: true,
        },
        {
          title: 'Quality Control Measures',
          placeholder: 'Describe quality control and monitoring...',
          required: true,
        },
        {
          title: 'Documentation Requirements',
          placeholder: 'Specify required documentation and records...',
          required: true,
        },
      ],
    });
    templates.push(sopTemplate);

    // 2. Product Development Brief Template
    const productTemplate = await this.createDocumentTemplate({
      name: 'Cannabis Product Development Brief',
      description: 'Product development and formulation planning template',
      category: 'formulation',
      templateType: 'document',
      variables: {
        product_name: 'Product Name',
        project_lead: 'Project Lead',
        target_launch: 'Target Launch Date',
        budget: 'Development Budget',
      },
      sections: [
        {
          title: 'Product Overview',
          placeholder: 'High-level product description and objectives...',
          required: true,
        },
        {
          title: 'Target Market Analysis',
          placeholder: 'Target demographics and market positioning...',
          required: true,
        },
        {
          title: 'Formulation Requirements',
          placeholder: 'Technical specifications and cannabinoid profile...',
          required: true,
        },
        {
          title: 'Regulatory Considerations',
          placeholder: 'Compliance requirements and regulatory pathway...',
          required: true,
        },
        {
          title: 'Manufacturing Plan',
          placeholder: 'Production process and scaling considerations...',
          required: true,
        },
        {
          title: 'Testing Protocol',
          placeholder: 'Quality testing and validation procedures...',
          required: true,
        },
      ],
    });
    templates.push(productTemplate);

    // 3. Marketing Campaign Template (Spreadsheet)
    const marketingTemplate = await this.createSpreadsheetTemplate({
      name: 'Cannabis Marketing Campaign Tracker',
      description: 'Campaign planning and performance tracking template',
      category: 'marketing',
      templateType: 'spreadsheet',
      variables: {
        campaign_name: 'Campaign Name',
        start_date: 'Start Date',
        end_date: 'End Date',
        budget: 'Total Budget',
      },
    });
    templates.push(marketingTemplate);

    // 4. Compliance Audit Template (Presentation)
    const auditTemplate = await this.createPresentationTemplate({
      name: 'Cannabis Compliance Audit Report',
      description: 'Compliance audit findings and recommendations presentation',
      category: 'compliance',
      templateType: 'presentation',
      variables: {
        facility_name: 'Facility Name',
        audit_date: 'Audit Date',
        auditor: 'Lead Auditor',
        license_number: 'License Number',
      },
      sections: [
        { title: 'Executive Summary', placeholder: 'Key findings overview', required: true },
        { title: 'Audit Scope', placeholder: 'Areas and processes audited', required: true },
        { title: 'Findings', placeholder: 'Detailed compliance findings', required: true },
        { title: 'Recommendations', placeholder: 'Corrective actions needed', required: true },
        { title: 'Timeline', placeholder: 'Implementation schedule', required: true },
      ],
    });
    templates.push(auditTemplate);

    return templates;
  }

  // Helper methods
  private generateSpreadsheetSections(config: TemplateConfig): string[][] {
    const sections = [];
    
    if (config.sections) {
      config.sections.forEach((section, index) => {
        sections.push([section.title, '', '', '', '']);
        sections.push([section.placeholder, '', '', '', '']);
        sections.push(['', '', '', '', '']);
      });
    }

    // Add sample data structure
    sections.push(['Sample Data Section:', '', '', '', '']);
    sections.push(['Item', 'Category', 'Value', 'Notes', 'Status']);
    sections.push(['{{sample_item}}', '{{category}}', '{{value}}', '{{notes}}', '{{status}}']);
    
    return sections;
  }

  private extractCategoryFromFile(file: any): string {
    const name = file.name.toLowerCase();
    if (name.includes('compliance') || name.includes('audit')) return 'compliance';
    if (name.includes('marketing') || name.includes('campaign')) return 'marketing';
    if (name.includes('formulation') || name.includes('product')) return 'formulation';
    if (name.includes('science') || name.includes('research')) return 'science';
    if (name.includes('operation') || name.includes('sop')) return 'operations';
    return 'general';
  }

  // Template management methods
  async updateTemplate(templateId: string, updates: Partial<TemplateConfig>): Promise<void> {
    // Update template metadata and content
    if (updates.name) {
      await this.drive.files.update({
        fileId: templateId,
        requestBody: {
          name: `Template: ${updates.name}`,
          description: updates.description,
        },
      });
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.drive.files.delete({
      fileId: templateId,
    });
  }

  async duplicateTemplate(templateId: string, newName: string): Promise<string> {
    const copy = await this.drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `Template: ${newName}`,
      },
    });

    return copy.data.id!;
  }
}

export const googleTemplateService = new GoogleTemplateService();