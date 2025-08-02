import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  size?: string;
}

export interface SheetData {
  range: string;
  values: any[][];
}

export class GoogleDriveService {
  private auth: JWT;
  private drive: any;
  private sheets: any;
  private docs: any;
  private slides: any;

  constructor() {
    // Initialize Google Auth with service account
    this.auth = new google.auth.JWT(
      'f8-868@f8ai-465903.iam.gserviceaccount.com',
      undefined,
      `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQConD37+aK4MCgi
STNOBCT6uUOqtwTG6wURBLhEbjk9f5umQam3lMGRCatw913d/53e5i8kBzeutEShv
+bTNBUq7G2nzKmPnCbuG1+vSdNMDu6fbWGiMhFa7mM6mWb5utpJOf3DFsSucRgPB
pKflKnbKuk6oJ0YF+nuA58Md/dPOOxSybrhACyuTjJFzVeTauFsdiMDSq7GOpUx+
m51wTV2YZLzl2a0ZIW6eiwC3S4MJ5gUYCFGDSQEZqWAOgRQxaYPWOIciqct2aEZt
tCzjfE9lzJUTf98pBFLZWL17ncbOIJiGy/Sejp5a/fV9NLMGeOGq5REgsRSjR0DO
S0yptd5fAgMBAAECggEAHC2UXE5xZ7fAlU5HcTQGMCqctbISRgQzjHMO79x+Hmhg
Qz7OI93M+56RNRKTyX/c7djTHGaWCuPRrrj8AsFuJkvkDnvYm01wlg3yvsbAVyDe
4hTp0AXz2sEkU/+uiCEh3VWF+rvrrl+zFAMY/f71QFcXexmpJamhRz80SAhaA95t
IBclRdU5Ncv88CrSfxaibjDbNZdzwJuzVpNm14ucitu90U/nwOilIghqZ15/b+EG
p5pIKUZ3z8Ef+UFT0ZegMC/28JK7OzH+5ZZqzd9oZs673kytWP7a3A2y3Tu86QZQ
doG6w5ByEzFFurVpzjOAyxeFZmkH3pY1VH7eDRbONQKBgQDha0qHuLTBc8udyBiO
Xzs39iom14hCn/+6VOZRWhgJcsu7agJ7wgYSfLIcZBPk8ewnwI/bs+xShPXqGxUv
VWGSoljugkCVW6KQTqgMRmNsSho+J4N6LO4E8ns4L+HwAsMBmNTYVCd9LRcqvK8O
MWOt9zqtODkNxkZjbZ0VPJkogwKBgQC/fAGZiQs+bS+e4Jh3x74IqfCVgZR11nTE
m8cZIidBddgxPx9PhR7LeuxRH29qPfiFFGm6hviGF61C6tMZQODC6lwU0lhFH7Xl
oFTYatbBs8MzE9k/rSNKsKkSdm9eZvhwur/EXR7I7ceLEim0CMQ2XTvwL8uRxSwP
rEoqGrAz9QKBgByX2G9YzYzQXF6aOAsvJzrU/cnJgx44X17KUCC3ld708cTHEKOU
G+MScCFLzH449aShN14991cMSIk2gDxtzx+jejZezURkyD0XzRcpgokE6UlDB9li
g5qbC2g4IqeoIgY81ZrPKecl5g9kuavKNgOmHYpFXG9T3C/WgptkAWVzAoGAad+a
0tWfTej5B5OPOctLG2c7Cq8W8wCcl4i6UP89TUhnPPN10HX+TOuudjw3Ujrpikt7
GhM+noXA2tsT1Ua1/4+tUiXrgGzEGi7IOtD35SoLp9Y1rKuCc+2xze+GLGAqxcm7
9kq2lspCJnbocA7YzmZGmcsTd4nZjuDoMNeIzXECgYBN3vspWdocpxMFYr+IJkxQ
kobzS2/SOd2qoltos0fQXsVGehQI+3EnXdsr22uhnbYyvT6caA649PSWbwDkjfU0
VzNqWXSB/VDnZ2mVyfLYps86OMbMf5A62OYwI8QIlCBrCgfPxGvhmpgS/XfTjgjs
1CBcDCEGtwIu3/drNW2/gw==
-----END PRIVATE KEY-----`,
      [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/presentations'
      ]
    );

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.docs = google.docs({ version: 'v1', auth: this.auth });
    this.slides = google.slides({ version: 'v1', auth: this.auth });
  }

  async createFolder(name: string, parentFolderId?: string): Promise<DriveFile> {
    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const response = await this.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, mimeType, webViewLink, createdTime',
    });

    return response.data;
  }

  async findOrCreateFolder(name: string, parentFolderId?: string): Promise<DriveFile> {
    // First, search for existing folder
    const searchQuery = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const existingFolders = await this.drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, webViewLink, mimeType, createdTime)',
      pageSize: 1,
    });

    if (existingFolders.data.files && existingFolders.data.files.length > 0) {
      return existingFolders.data.files[0];
    }

    // If not found, create new folder
    return this.createFolder(name, parentFolderId);
  }

  async createCostReportSheet(userId: string, data: any): Promise<DriveFile> {
    // Create a new Google Sheet
    const spreadsheet = await this.sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `Formul8 Cost Report - ${new Date().toLocaleDateString()}`,
        },
        sheets: [
          {
            properties: {
              title: 'Cost Summary',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          },
          {
            properties: {
              title: 'Agent Breakdown',
            },
          },
          {
            properties: {
              title: 'User Breakdown',
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Populate Cost Summary sheet
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Cost Summary!A1:F20',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['Formul8 AI Cost Report', '', '', '', '', ''],
          ['Generated:', new Date().toLocaleString(), '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Summary Metrics', '', '', '', '', ''],
          ['Total Costs', `$${data.totalCosts?.toFixed(2) || '0.00'}`, '', '', '', ''],
          ['Daily Costs', `$${data.dailyCosts?.toFixed(2) || '0.00'}`, '', '', '', ''],
          ['Weekly Costs', `$${data.weeklyCosts?.toFixed(2) || '0.00'}`, '', '', '', ''],
          ['Monthly Costs', `$${data.monthlyCosts?.toFixed(2) || '0.00'}`, '', '', '', ''],
          ['Cost Per User', `$${data.costPerUser?.toFixed(2) || '0.00'}`, '', '', '', ''],
          ['Active Users', data.activeUsers || 0, '', '', '', ''],
          ['Total Queries', data.totalQueries || 0, '', '', '', ''],
          ['Avg Cost Per Query', `$${data.averageCostPerQuery?.toFixed(4) || '0.0000'}`, '', '', '', ''],
        ],
      },
    });

    // Populate Agent Breakdown sheet
    if (data.agentCosts) {
      const agentData = [
        ['Agent Type', 'Total Cost', 'Query Count', 'Avg Cost/Query', 'Percentage'],
        ...data.agentCosts.map((agent: any) => [
          agent.agentType,
          `$${agent.totalCost.toFixed(2)}`,
          agent.queriesCount,
          `$${agent.avgCostPerQuery.toFixed(4)}`,
          `${agent.percentage.toFixed(1)}%`,
        ]),
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Agent Breakdown!A1:E50',
        valueInputOption: 'USER_ENTERED',
        resource: { values: agentData },
      });
    }

    // Populate User Breakdown sheet
    if (data.userCosts) {
      const userData = [
        ['User ID', 'Name', 'Email', 'Total Cost', 'Query Count', 'Avg Cost/Query', 'Last Activity'],
        ...data.userCosts.map((user: any) => [
          user.userId,
          user.userName || '',
          user.email,
          `$${user.totalCost.toFixed(2)}`,
          user.queriesCount,
          `$${user.avgCostPerQuery.toFixed(4)}`,
          new Date(user.lastActivity).toLocaleDateString(),
        ]),
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'User Breakdown!A1:G100',
        valueInputOption: 'USER_ENTERED',
        resource: { values: userData },
      });
    }

    // Format the spreadsheet
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.3 },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });

    return {
      id: spreadsheetId,
      name: `Formul8 Cost Report - ${new Date().toLocaleDateString()}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      createdTime: new Date().toISOString(),
    };
  }

  async createProjectDoc(userId: string, projectData: any): Promise<DriveFile> {
    // Create a new Google Doc
    const doc = await this.docs.documents.create({
      resource: {
        title: `Formul8 Project: ${projectData.name || 'Untitled Project'}`,
      },
    });

    const documentId = doc.data.documentId!;

    // Add content to the document
    const requests = [
      {
        insertText: {
          location: { index: 1 },
          text: `Formul8 AI Project Report\n\n`,
        },
      },
      {
        insertText: {
          location: { index: 30 },
          text: `Project: ${projectData.name || 'Untitled Project'}\n`,
        },
      },
      {
        insertText: {
          location: { index: 60 },
          text: `Created: ${new Date().toLocaleDateString()}\n\n`,
        },
      },
      {
        insertText: {
          location: { index: 90 },
          text: `Description:\n${projectData.description || 'No description provided'}\n\n`,
        },
      },
      {
        insertText: {
          location: { index: 150 },
          text: `AI Agents Used:\n`,
        },
      },
    ];

    // Add agent information
    if (projectData.agentTypes) {
      requests.push({
        insertText: {
          location: { index: 170 },
          text: projectData.agentTypes.map((agent: string) => `• ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent\n`).join(''),
        },
      });
    }

    // Add cost information
    if (projectData.totalCost) {
      requests.push({
        insertText: {
          location: { index: 250 },
          text: `\nProject Costs:\n• Total Cost: $${projectData.totalCost.toFixed(2)}\n• Queries: ${projectData.queryCount || 0}\n• Avg Cost per Query: $${projectData.avgCostPerQuery?.toFixed(4) || '0.0000'}\n\n`,
        },
      });
    }

    await this.docs.documents.batchUpdate({
      documentId,
      resource: { requests },
    });

    return {
      id: documentId,
      name: `Formul8 Project: ${projectData.name || 'Untitled Project'}`,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: `https://docs.google.com/document/d/${documentId}`,
      createdTime: new Date().toISOString(),
    };
  }

  async listFiles(folderId?: string): Promise<DriveFile[]> {
    const query = folderId ? `'${folderId}' in parents` : undefined;
    
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, createdTime, size)',
      orderBy: 'createdTime desc',
    });

    return response.data.files || [];
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      resource: {
        role,
        type: 'user',
        emailAddress: email,
      },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }

  async exportAsCSV(sheetId: string): Promise<Buffer> {
    const response = await this.drive.files.export({
      fileId: sheetId,
      mimeType: 'text/csv',
    });

    return Buffer.from(response.data);
  }

  async exportAsPDF(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.export({
      fileId,
      mimeType: 'application/pdf',
    });

    return Buffer.from(response.data);
  }

  async createMarketingExpenseSheet(userId: string, userEmail: string, data: any): Promise<DriveFile> {
    const sheetData = this.generateMarketingExpenseData(data);
    
    const spreadsheet = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Marketing Expense Tracker - ${data.company || 'Cannabis Business'} - ${new Date().getFullYear()}`,
        },
        sheets: [
          {
            properties: {
              title: 'Monthly Overview',
              gridProperties: { rowCount: 20, columnCount: 15 },
            },
          },
          {
            properties: {
              title: 'Channel Breakdown',
              gridProperties: { rowCount: 50, columnCount: 10 },
            },
          },
          {
            properties: {
              title: 'Product Sales',
              gridProperties: { rowCount: 50, columnCount: 8 },
            },
          },
          {
            properties: {
              title: 'ROI Analysis',
              gridProperties: { rowCount: 30, columnCount: 12 },
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Populate Monthly Overview sheet
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Monthly Overview!A1:O20',
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData.monthlyOverview,
      },
    });

    // Populate Channel Breakdown sheet
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Channel Breakdown!A1:J50',
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData.channelBreakdown,
      },
    });

    // Populate Product Sales sheet
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Product Sales!A1:H50',
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData.productSales,
      },
    });

    // Populate ROI Analysis sheet
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'ROI Analysis!A1:L30',
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData.roiAnalysis,
      },
    });

    // Format the sheets with headers and styling
    await this.formatMarketingSheet(spreadsheetId);

    // Share with user
    await this.shareFile(spreadsheetId, userEmail, 'writer');

    return {
      id: spreadsheetId,
      name: `Marketing Expense Tracker - ${data.company || 'Cannabis Business'}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      createdTime: new Date().toISOString(),
    };
  }

  private generateMarketingExpenseData(data: any): any {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Monthly Overview data with realistic cannabis marketing spend
    const monthlyOverview = [
      ['Month', 'Total Marketing Spend', 'Digital Ads', 'Social Media', 'Events/Trade', 'Content Creation', 'Traditional Ads', 'Total Sales', 'New Customers', 'ROAS', 'CAC'],
      ...months.map((month, index) => {
        const baseSpend = 25000 * (1 + (Math.random() - 0.5) * 0.4);
        const seasonalMultiplier = [6, 7, 8, 11, 12].includes(index + 1) ? 1.3 : 1.0;
        const totalSpend = baseSpend * seasonalMultiplier;
        const totalSales = totalSpend * (3.5 + Math.random() * 1.5);
        const newCustomers = Math.round(totalSales / 45);
        
        return [
          month,
          Math.round(totalSpend),
          Math.round(totalSpend * 0.45),
          Math.round(totalSpend * 0.25),
          Math.round(totalSpend * 0.15),
          Math.round(totalSpend * 0.10),
          Math.round(totalSpend * 0.05),
          Math.round(totalSales),
          newCustomers,
          (totalSales / totalSpend).toFixed(2),
          Math.round(totalSpend / newCustomers),
        ];
      }),
    ];

    // Channel Breakdown data for cannabis-specific platforms
    const channelBreakdown = [
      ['Month', 'Channel', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'Revenue', 'ROAS'],
      ...months.flatMap((month, index) => {
        const channels = ['Weedmaps', 'Leafly', 'Instagram Wellness', 'Email Marketing', 'Content Marketing'];
        return channels.map(channel => {
          const spend = Math.round(5000 + Math.random() * 10000);
          const impressions = Math.round(spend * 100 + Math.random() * 50000);
          const clicks = Math.round(impressions * (0.02 + Math.random() * 0.03));
          const conversions = Math.round(clicks * (0.05 + Math.random() * 0.15));
          const revenue = Math.round(conversions * (50 + Math.random() * 100));
          
          return [
            month,
            channel,
            spend,
            impressions,
            clicks,
            ((clicks / impressions) * 100).toFixed(2) + '%',
            (spend / clicks).toFixed(2),
            conversions,
            revenue,
            (revenue / spend).toFixed(2),
          ];
        });
      }),
    ];

    // Product Sales data for cannabis products
    const productSales = [
      ['Month', 'Product Category', 'Units Sold', 'Revenue', 'Average Price', 'Market Share', 'Growth Rate'],
      ...months.flatMap((month, index) => {
        const products = ['Flower', 'Concentrates', 'Edibles', 'Topicals', 'Accessories'];
        return products.map(product => {
          const unitsSold = Math.round(500 + Math.random() * 2000);
          const avgPrice = 25 + Math.random() * 75;
          const revenue = Math.round(unitsSold * avgPrice);
          const marketShare = (10 + Math.random() * 40).toFixed(1);
          const growthRate = ((Math.random() - 0.5) * 40).toFixed(1);
          
          return [
            month,
            product,
            unitsSold,
            revenue,
            avgPrice.toFixed(2),
            marketShare + '%',
            growthRate + '%',
          ];
        });
      }),
    ];

    // ROI Analysis data
    const roiAnalysis = [
      ['Metric', 'Q1', 'Q2', 'Q3', 'Q4', 'Annual Total', 'Target', 'Variance', 'Performance'],
      ['Total Marketing Investment', 75000, 85000, 110000, 95000, 365000, 350000, '+4.3%', 'Above Target'],
      ['Total Revenue Generated', 285000, 340000, 445000, 380000, 1450000, 1400000, '+3.6%', 'Above Target'],
      ['Overall ROAS', 3.8, 4.0, 4.0, 4.0, 3.97, 4.0, '-0.8%', 'Near Target'],
      ['Customer Acquisition Cost', 42, 38, 35, 40, 38.75, 40, '-3.1%', 'Below Target'],
      ['Customer Lifetime Value', 180, 195, 205, 190, 192.5, 200, '-3.8%', 'Near Target'],
      ['Marketing Efficiency Ratio', 0.26, 0.25, 0.25, 0.25, 0.25, 0.25, '0.0%', 'On Target'],
      ['Brand Awareness Lift', '12%', '18%', '25%', '22%', '19.25%', '20%', '-0.75%', 'Near Target'],
      ['Market Share Growth', '2.1%', '3.2%', '4.1%', '3.8%', '3.3%', '3.5%', '-0.2%', 'Near Target'],
    ];

    return { monthlyOverview, channelBreakdown, productSales, roiAnalysis };
  }

  private async formatMarketingSheet(spreadsheetId: string): Promise<void> {
    const requests = [
      // Format headers in Monthly Overview
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      // Format headers in Channel Breakdown
      {
        repeatCell: {
          range: {
            sheetId: 1,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 10,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      // Format headers in Product Sales
      {
        repeatCell: {
          range: {
            sheetId: 2,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 7,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      // Format headers in ROI Analysis
      {
        repeatCell: {
          range: {
            sheetId: 3,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 9,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  async createCostReportSlides(userId: string, data: any): Promise<DriveFile> {
    // Create a new Google Slides presentation
    const presentation = await this.slides.presentations.create({
      resource: {
        title: `Formul8 Cost Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const presentationId = presentation.data.presentationId!;

    // Define slides content
    const slideRequests = [
      // Title slide
      {
        createSlide: {
          objectId: 'title_slide',
          insertionIndex: 1,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      // Cost summary slide
      {
        createSlide: {
          objectId: 'cost_summary',
          insertionIndex: 2,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      // Agent breakdown slide
      {
        createSlide: {
          objectId: 'agent_breakdown',
          insertionIndex: 3,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      // User analysis slide
      {
        createSlide: {
          objectId: 'user_analysis',
          insertionIndex: 4,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      // Budget status slide
      {
        createSlide: {
          objectId: 'budget_status',
          insertionIndex: 5,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
    ];

    await this.slides.presentations.batchUpdate({
      presentationId,
      resource: { requests: slideRequests },
    });

    // Add content to slides
    const contentRequests = [
      // Title slide content
      {
        insertText: {
          objectId: presentation.data.slides![0].objectId,
          insertionIndex: 0,
          text: 'Formul8 AI Cost Report',
        },
      },
      {
        insertText: {
          objectId: presentation.data.slides![0].pageElements?.find(el => el.shape?.shapeType === 'TEXT_BOX')?.objectId,
          insertionIndex: 0,
          text: `Generated: ${new Date().toLocaleDateString()}\n\nComprehensive cost analysis and budget tracking for Formul8 AI platform usage.`,
        },
      },
      // Cost summary slide
      {
        insertText: {
          objectId: 'cost_summary',
          insertionIndex: 0,
          text: 'Cost Summary',
        },
      },
      // Agent breakdown content
      {
        insertText: {
          objectId: 'agent_breakdown',
          insertionIndex: 0,
          text: 'Cost by AI Agent',
        },
      },
      // User analysis content
      {
        insertText: {
          objectId: 'user_analysis',
          insertionIndex: 0,
          text: 'Per-User Cost Analysis',
        },
      },
      // Budget status content
      {
        insertText: {
          objectId: 'budget_status',
          insertionIndex: 0,
          text: 'Budget Status & Alerts',
        },
      },
    ];

    // Add detailed content for cost summary
    if (data) {
      contentRequests.push({
        insertText: {
          objectId: 'cost_summary',
          insertionIndex: 50,
          text: `
Key Metrics:
• Total Costs: $${data.totalCosts?.toFixed(2) || '0.00'}
• Daily Average: $${data.dailyCosts?.toFixed(2) || '0.00'}
• Cost Per User: $${data.costPerUser?.toFixed(2) || '0.00'}
• Active Users: ${data.activeUsers || 0}
• Total Queries: ${data.totalQueries || 0}
• Avg Cost Per Query: $${data.averageCostPerQuery?.toFixed(4) || '0.0000'}

Monthly Projection: $${((data.dailyCosts || 0) * 30).toFixed(2)}`,
        },
      });

      // Add agent breakdown content
      if (data.agentCosts) {
        const agentText = data.agentCosts.map((agent: any) => 
          `• ${agent.agentType.charAt(0).toUpperCase() + agent.agentType.slice(1)}: $${agent.totalCost.toFixed(2)} (${agent.percentage.toFixed(1)}%)`
        ).join('\n');

        contentRequests.push({
          insertText: {
            objectId: 'agent_breakdown',
            insertionIndex: 50,
            text: `
Top Cost Centers:
${agentText}

Most queries processed by ${data.agentCosts[0]?.agentType || 'N/A'} agent.
Focus areas for optimization identified.`,
          },
        });
      }

      // Add user analysis content
      if (data.userCosts && data.userCosts.length > 0) {
        const topUsers = data.userCosts.slice(0, 5);
        const userText = topUsers.map((user: any, index: number) => 
          `${index + 1}. ${user.userName || user.email}: $${user.totalCost.toFixed(2)} (${user.queriesCount} queries)`
        ).join('\n');

        contentRequests.push({
          insertText: {
            objectId: 'user_analysis',
            insertionIndex: 50,
            text: `
Top Users by Cost:
${userText}

Average queries per user: ${Math.round((data.totalQueries || 0) / (data.activeUsers || 1))}
User engagement trending upward.`,
          },
        });
      }
    }

    await this.slides.presentations.batchUpdate({
      presentationId,
      resource: { requests: contentRequests },
    });

    return {
      id: presentationId,
      name: `Formul8 Cost Report - ${new Date().toLocaleDateString()}`,
      mimeType: 'application/vnd.google-apps.presentation',
      webViewLink: `https://docs.google.com/presentation/d/${presentationId}`,
      createdTime: new Date().toISOString(),
    };
  }

  async createProjectPresentationSlides(userId: string, projectData: any): Promise<DriveFile> {
    // Create a new presentation for project overview
    const presentation = await this.slides.presentations.create({
      resource: {
        title: `Formul8 Project: ${projectData.name || 'Project Overview'}`,
      },
    });

    const presentationId = presentation.data.presentationId!;

    // Create slides
    const slideRequests = [
      {
        createSlide: {
          objectId: 'project_overview',
          insertionIndex: 1,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      {
        createSlide: {
          objectId: 'agent_usage',
          insertionIndex: 2,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      {
        createSlide: {
          objectId: 'results_insights',
          insertionIndex: 3,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
      {
        createSlide: {
          objectId: 'next_steps',
          insertionIndex: 4,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      },
    ];

    await this.slides.presentations.batchUpdate({
      presentationId,
      resource: { requests: slideRequests },
    });

    // Add content
    const contentRequests = [
      // Title slide
      {
        insertText: {
          objectId: presentation.data.slides![0].objectId,
          insertionIndex: 0,
          text: projectData.name || 'Formul8 Project Overview',
        },
      },
      // Project overview
      {
        insertText: {
          objectId: 'project_overview',
          insertionIndex: 0,
          text: 'Project Overview',
        },
      },
      {
        insertText: {
          objectId: 'project_overview',
          insertionIndex: 50,
          text: `
Project Details:
• Name: ${projectData.name || 'Untitled Project'}
• Created: ${new Date(projectData.createdAt || Date.now()).toLocaleDateString()}
• Status: ${projectData.status || 'Active'}
• Total Cost: $${projectData.totalCost?.toFixed(2) || '0.00'}
• Queries Processed: ${projectData.queryCount || 0}

Description:
${projectData.description || 'No description provided'}`,
        },
      },
      // Agent usage
      {
        insertText: {
          objectId: 'agent_usage',
          insertionIndex: 0,
          text: 'AI Agents Utilized',
        },
      },
      // Results and insights
      {
        insertText: {
          objectId: 'results_insights',
          insertionIndex: 0,
          text: 'Key Results & Insights',
        },
      },
      // Next steps
      {
        insertText: {
          objectId: 'next_steps',
          insertionIndex: 0,
          text: 'Recommendations & Next Steps',
        },
      },
    ];

    if (projectData.agentTypes) {
      const agentText = projectData.agentTypes.map((agent: string) => 
        `• ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent`
      ).join('\n');

      contentRequests.push({
        insertText: {
          objectId: 'agent_usage',
          insertionIndex: 50,
          text: `
Agents Used:
${agentText}

Multi-agent collaboration enabled comprehensive analysis across all cannabis industry domains.`,
        },
      });
    }

    await this.slides.presentations.batchUpdate({
      presentationId,
      resource: { requests: contentRequests },
    });

    return {
      id: presentationId,
      name: `Formul8 Project: ${projectData.name || 'Project Overview'}`,
      mimeType: 'application/vnd.google-apps.presentation',
      webViewLink: `https://docs.google.com/presentation/d/${presentationId}`,
      createdTime: new Date().toISOString(),
    };
  }

  async createUserSpaceFolder(userId: string, userEmail: string): Promise<DriveFile> {
    // Create a dedicated folder for the user
    const folder = await this.createFolder(`Formul8 - ${userEmail}`);
    
    // Create subfolders for organization
    await Promise.all([
      this.createFolder('Cost Reports', folder.id),
      this.createFolder('Project Documents', folder.id),
      this.createFolder('Presentations', folder.id),
      this.createFolder('Exports', folder.id),
    ]);

    // Share the folder with the user
    await this.shareFile(folder.id, userEmail, 'writer');

    return folder;
  }
}

export const googleDriveService = new GoogleDriveService();