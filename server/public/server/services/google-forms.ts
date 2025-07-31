import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

export interface FormField {
  type: 'text' | 'multipleChoice' | 'checkboxes' | 'dropdown' | 'scale' | 'textLong';
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
}

export interface FormConfig {
  title: string;
  description: string;
  fields: FormField[];
}

export class GoogleFormsService {
  private auth: JWT;
  private forms: any;
  private drive: any;

  constructor() {
    this.auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      [
        'https://www.googleapis.com/auth/forms',
        'https://www.googleapis.com/auth/drive',
      ]
    );

    this.forms = google.forms({ version: 'v1', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // Create form from configuration
  async createForm(config: FormConfig): Promise<{ id: string; publishedUrl: string }> {
    const form = await this.forms.forms.create({
      requestBody: {
        info: {
          title: config.title,
          description: config.description,
        },
      },
    });

    const formId = form.data.formId!;

    // Add fields to the form
    if (config.fields.length > 0) {
      const requests = config.fields.map((field, index) => ({
        createItem: {
          item: {
            title: field.title,
            description: field.description,
            questionItem: {
              question: {
                required: field.required || false,
                ...this.getQuestionConfig(field),
              },
            },
          },
          location: {
            index: index,
          },
        },
      }));

      await this.forms.forms.batchUpdate({
        formId,
        requestBody: { requests },
      });
    }

    return {
      id: formId,
      publishedUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
    };
  }

  private getQuestionConfig(field: FormField): any {
    switch (field.type) {
      case 'text':
        return {
          textQuestion: {
            paragraph: false,
          },
        };
      
      case 'textLong':
        return {
          textQuestion: {
            paragraph: true,
          },
        };
      
      case 'multipleChoice':
        return {
          choiceQuestion: {
            type: 'RADIO',
            options: field.options?.map(option => ({ value: option })) || [],
          },
        };
      
      case 'checkboxes':
        return {
          choiceQuestion: {
            type: 'CHECKBOX',
            options: field.options?.map(option => ({ value: option })) || [],
          },
        };
      
      case 'dropdown':
        return {
          choiceQuestion: {
            type: 'DROP_DOWN',
            options: field.options?.map(option => ({ value: option })) || [],
          },
        };
      
      case 'scale':
        return {
          scaleQuestion: {
            low: 1,
            high: 5,
            lowLabel: 'Poor',
            highLabel: 'Excellent',
          },
        };
      
      default:
        return {
          textQuestion: {
            paragraph: false,
          },
        };
    }
  }

  // Create customer feedback form
  async createCustomerFeedbackForm(): Promise<{ id: string; publishedUrl: string }> {
    const config: FormConfig = {
      title: 'Formul8 Customer Feedback Survey',
      description: 'Help us improve our AI-powered cannabis consultation platform',
      fields: [
        {
          type: 'text',
          title: 'Company/Organization Name',
          required: true,
        },
        {
          type: 'multipleChoice',
          title: 'Which Formul8 agents have you used?',
          options: [
            'Compliance Agent',
            'Patent/IP Agent', 
            'Formulation Agent',
            'Marketing Agent',
            'Science Agent',
            'Operations Agent',
            'Customer Success Agent',
            'Multiple agents',
          ],
          required: true,
        },
        {
          type: 'scale',
          title: 'Overall satisfaction with Formul8',
          required: true,
        },
        {
          type: 'scale',
          title: 'Quality of AI responses',
          required: true,
        },
        {
          type: 'scale',
          title: 'Speed of response',
          required: true,
        },
        {
          type: 'scale',
          title: 'Accuracy of information',
          required: true,
        },
        {
          type: 'multipleChoice',
          title: 'How often do you use Formul8?',
          options: [
            'Daily',
            'Weekly',
            'Monthly',
            'Rarely',
            'First time',
          ],
          required: true,
        },
        {
          type: 'textLong',
          title: 'What features would you like to see added?',
          required: false,
        },
        {
          type: 'textLong',
          title: 'Any specific feedback or suggestions?',
          required: false,
        },
        {
          type: 'multipleChoice',
          title: 'Would you recommend Formul8 to others?',
          options: [
            'Definitely yes',
            'Probably yes',
            'Not sure',
            'Probably no',
            'Definitely no',
          ],
          required: true,
        },
      ],
    };

    return await this.createForm(config);
  }

  // Create compliance checklist form
  async createComplianceChecklistForm(): Promise<{ id: string; publishedUrl: string }> {
    const config: FormConfig = {
      title: 'Cannabis Compliance Self-Assessment',
      description: 'Evaluate your facility\'s compliance status across key regulatory areas',
      fields: [
        {
          type: 'text',
          title: 'Facility Name',
          required: true,
        },
        {
          type: 'text',
          title: 'License Number',
          required: true,
        },
        {
          type: 'multipleChoice',
          title: 'State/Province',
          options: [
            'California',
            'Colorado',
            'Washington',
            'Oregon',
            'Nevada',
            'Arizona',
            'Massachusetts',
            'Illinois',
            'New York',
            'New Jersey',
            'Other',
          ],
          required: true,
        },
        {
          type: 'multipleChoice',
          title: 'License Type',
          options: [
            'Cultivation',
            'Manufacturing',
            'Distribution',
            'Retail',
            'Testing Laboratory',
            'Vertically Integrated',
          ],
          required: true,
        },
        {
          type: 'checkboxes',
          title: 'Current SOPs in place (check all that apply)',
          options: [
            'Seed-to-sale tracking',
            'Product testing protocols',
            'Security procedures',
            'Inventory management',
            'Waste disposal',
            'Quality control',
            'Employee training',
            'Record keeping',
            'Transportation/delivery',
            'Customer verification',
          ],
        },
        {
          type: 'scale',
          title: 'Confidence in current compliance status',
          required: true,
        },
        {
          type: 'textLong',
          title: 'Describe any compliance challenges you\'re facing',
          required: false,
        },
        {
          type: 'multipleChoice',
          title: 'How often do you review compliance procedures?',
          options: [
            'Weekly',
            'Monthly',
            'Quarterly', 
            'Annually',
            'As needed',
            'Rarely/Never',
          ],
          required: true,
        },
      ],
    };

    return await this.createForm(config);
  }

  // Create product development form
  async createProductDevelopmentForm(): Promise<{ id: string; publishedUrl: string }> {
    const config: FormConfig = {
      title: 'Cannabis Product Development Request',
      description: 'Submit your product development requirements and specifications',
      fields: [
        {
          type: 'text',
          title: 'Product Name/Working Title',
          required: true,
        },
        {
          type: 'multipleChoice',
          title: 'Product Category',
          options: [
            'Flower',
            'Pre-rolls',
            'Concentrates/Extracts',
            'Edibles',
            'Beverages',
            'Topicals',
            'Tinctures',
            'Capsules',
            'Vape cartridges',
            'Other',
          ],
          required: true,
        },
        {
          type: 'textLong',
          title: 'Product Description and Goals',
          description: 'Describe the product concept, target effects, and market positioning',
          required: true,
        },
        {
          type: 'text',
          title: 'Target THC Percentage (%)',
          required: false,
        },
        {
          type: 'text',
          title: 'Target CBD Percentage (%)',
          required: false,
        },
        {
          type: 'checkboxes',
          title: 'Desired Terpene Profile (check all that apply)',
          options: [
            'Myrcene (relaxing)',
            'Limonene (uplifting)',
            'Pinene (alertness)',
            'Linalool (calming)',
            'Caryophyllene (anti-inflammatory)',
            'Humulene (appetite suppressant)',
            'Terpinolene (sedating)',
            'Ocimene (energizing)',
            'Custom blend',
            'No preference',
          ],
        },
        {
          type: 'text',
          title: 'Target Launch Date',
          required: false,
        },
        {
          type: 'text',
          title: 'Development Budget Range',
          required: false,
        },
        {
          type: 'multipleChoice',
          title: 'Primary Target Market',
          options: [
            'Medical patients',
            'Recreational consumers',
            'Both medical and recreational',
            'Wellness-focused consumers',
            'Experienced users',
            'New users',
          ],
          required: true,
        },
        {
          type: 'textLong',
          title: 'Special Requirements or Considerations',
          description: 'Include any specific formulation requirements, allergen considerations, etc.',
          required: false,
        },
      ],
    };

    return await this.createForm(config);
  }

  // Share form with user
  async shareForm(formId: string, email: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
    await this.drive.permissions.create({
      fileId: formId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: email,
      },
    });
  }

  // Get form responses
  async getFormResponses(formId: string): Promise<any[]> {
    const responses = await this.forms.forms.responses.list({
      formId,
    });

    return responses.data.responses || [];
  }

  // Delete form
  async deleteForm(formId: string): Promise<void> {
    await this.drive.files.delete({
      fileId: formId,
    });
  }
}

export const googleFormsService = new GoogleFormsService();