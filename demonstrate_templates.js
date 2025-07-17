import { google } from 'googleapis';
import fs from 'fs';

async function demonstrateTemplates() {
  console.log('📋 Demonstrating Cannabis Industry Templates...');
  
  try {
    // Load service account credentials
    const serviceAccountCredentials = {
      "type": "service_account",
      "project_id": "f8ai-465903",
      "private_key_id": "97a52fb7865c58c2a42704dba731f8047bd17e60",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQConD37+aK4MCgi\nSTNOBT6uUOqtwTG6wURBLhEbjk9f5umQam3lMGRCatw913d/53e5i8kBzeutEShv\n+bTNBUq7G2nzKmPnCbuG1+vSdNMDu6fbWGiMhFa7mM6mWb5utpJOf3DFsSucRgPB\npKflKnbKuk6oJ0YF+nuA58Md/dPOOxSybrhACyuTjJFzVeTauFsdiMDSq7GOpUx+\nm51wTV2YZLzl2a0ZIW6eiwC3S4MJ5gUYCFGDSQEZqWAOgRQxaYPWOIciqct2aEZt\ntCzjfE9lzJUTf98pBFLZWL17ncbOIJiGy/Sejp5a/fV9NLMGeOGq5REgsRSjR0DO\nS0yptd5fAgMBAAECggEAHC2UXE5xZ7fAlU5HcTQGMCqctbISRgQzjHMO79x+Hmhg\nQz7OI93M+56RNRKTyX/c7djTHGaWCuPRrrj8AsFuJkvkDnvYm01wlg3yvsbAVyDe\n4hTp0AXz2sEkU/+uiCEh3VWF+rvrrl+zFAMY/f71QFcXexmpJamhRz80SAhaA95t\nIBclRdU5Ncv88CrSfxaibjDbNZdzwJuzVpNm14ucitu90U/nwOilIghqZ15/b+EG\np5pIKUZ3z8Ef+UFT0ZegMC/28JK7OzH+5ZZqzd9oZs673kytWP7a3A2y3Tu86QZQ\ndoG6w5ByEzFFurVpzjOAyxeFZmkH3pY1VH7eDRbONQKBgQDha0qHuLTBc8udyBiO\nXzs39iom14hCn/+6VOZRWhgJcsu7agJ7wgYSfLIcZBPk8ewnwI/bs+xShPXqGxUv\nVWGSoljugkCVW6KQTqgMRmNsSho+J4N6LO4E8ns4L+HwAsMBmNTYVCd9LRcqvK8O\nMWOt9zqtODkNxkZjbZ0VPJkogwKBgQC/fAGZiQs+bS+e4Jh3x74IqfCVgZR11nTE\nm8cZIidBddgxPx9PhR7LeuxRH29qPfiFFGm6hviGF61C6tMZQODC6lwU0lhFH7Xl\noFTYatbBs8MzE9k/rSNKsKkSdm9eZvhwur/EXR7I7ceLEim0CMQ2XTvwL8uRxSwP\nrEoqGrAz9QKBgByX2G9YzYzQXF6aOAsvJzrU/cnJgx44X17KUCC3ld708cTHEKOU\nG+MScCFLzH449aShN14991cMSIk2gDxtzx+jejZezURkyD0XzRcpgokE6UlDB9li\ng5qbC2g4IqeoIgY81ZrPKecl5g9kuavKNgOmHYpFXG9T3C/WgptkAWVzAoGAad+a\n0tWfTej5B5OPOctLG2c7Cq8W8wCcl4i6UP89TUhnPPN10HX+TOuudjw3Ujrpikt7\nGhM+noXA2tsT1Ua1/4+tUiXrgGzEGi7IOtD35SoLp9Y1rKuCc+2xze+GLGAqxcm7\n9kq2lspCJnbocA7YzmZGmcsTd4nZjuDoMNeIzXECgYBN3vspWdocpxMFYr+IJkxQ\nkobzS2/SOd2qoltos0fQXsVGehQI+3EnXdsr22uhnbYyvT6caA649PSWbwDkjfU0\nVzNqWXSB/VDnZ2mVyfLYps86OMbMf5A62OYwI8QIlCBrCgfPxGvhmpgS/XfTjgjs\n1CBcDCEGtwIu3/drNW2/gw==\n-----END PRIVATE KEY-----\n",
      "client_email": "f8-868@f8ai-465903.iam.gserviceaccount.com",
      "client_id": "101655712299195998813",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/f8-868%40f8ai-465903.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    // Save credentials to temp file
    fs.writeFileSync('temp_service_account.json', JSON.stringify(serviceAccountCredentials, null, 2));
    
    // Create authentication
    const auth = new google.auth.GoogleAuth({
      keyFile: 'temp_service_account.json',
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });
    const docs = google.docs({ version: 'v1', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const f8FolderId = '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE';

    // Template 1: Cannabis SOP Template
    console.log('\n📄 Creating Cannabis SOP Template...');
    const sopTemplate = `# Cannabis Standard Operating Procedure Template
## [SOP TITLE]

### Document Information
- **Document ID**: SOP-[XXX]
- **Version**: 1.0
- **Effective Date**: [DATE]
- **Review Date**: [DATE]
- **Approved By**: [NAME, TITLE]

### Purpose
[Brief description of the SOP purpose and objectives]

### Scope
[Define what this SOP covers and any limitations]

### Responsibilities
- **[Role 1]**: [Responsibilities]
- **[Role 2]**: [Responsibilities]
- **[Role 3]**: [Responsibilities]

### Definitions
- **[Term 1]**: [Definition]
- **[Term 2]**: [Definition]
- **[Term 3]**: [Definition]

### Procedure
#### Step 1: [Action]
1. [Detailed instruction]
2. [Detailed instruction]
3. [Detailed instruction]

#### Step 2: [Action]
1. [Detailed instruction]
2. [Detailed instruction]
3. [Detailed instruction]

#### Step 3: [Action]
1. [Detailed instruction]
2. [Detailed instruction]
3. [Detailed instruction]

### Quality Control
- **Acceptance Criteria**: [Define pass/fail criteria]
- **Testing Requirements**: [List required tests]
- **Documentation**: [Required records and forms]

### Safety Precautions
- [Safety requirement 1]
- [Safety requirement 2]
- [Safety requirement 3]

### Equipment & Materials
- [Equipment item 1]
- [Equipment item 2]
- [Material 1]
- [Material 2]

### Records & Documentation
- [Record type 1] - Retention: [Time period]
- [Record type 2] - Retention: [Time period]
- [Record type 3] - Retention: [Time period]

### References
- [Regulation/Standard 1]
- [Regulation/Standard 2]
- [Internal procedure reference]

### Revision History
| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | [DATE] | Initial creation | [NAME] |

---
**Note**: This template is designed for cannabis industry compliance. Customize sections based on specific operational requirements and regulatory standards.`;

    try {
      const sopDoc = await docs.documents.create({
        requestBody: { title: 'Cannabis SOP Template' }
      });

      await drive.files.update({
        fileId: sopDoc.data.documentId,
        addParents: f8FolderId,
        fields: 'id,parents'
      });

      await docs.documents.batchUpdate({
        documentId: sopDoc.data.documentId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: sopTemplate
            }
          }]
        }
      });

      console.log('✅ Cannabis SOP Template created successfully');
      console.log(`   Document ID: ${sopDoc.data.documentId}`);
      
    } catch (error) {
      console.log(`❌ Error creating SOP template: ${error.message}`);
    }

    // Template 2: Compliance Checklist Template
    console.log('\n📋 Creating Compliance Checklist Template...');
    const checklistHeaders = [
      'Compliance Item',
      'Requirement',
      'Frequency',
      'Responsible Party',
      'Status',
      'Due Date',
      'Completion Date',
      'Notes'
    ];

    const checklistData = [
      ['License Renewal', 'State cannabis license', 'Annual', 'Legal Team', 'Pending', '[DATE]', '', 'Submit 60 days before expiration'],
      ['Inventory Tracking', 'METRC/State system update', 'Daily', 'Operations', 'Current', 'Daily', '[DATE]', 'Automated system in place'],
      ['Security Audit', 'Third-party security assessment', 'Annual', 'Security Team', 'Scheduled', '[DATE]', '', 'Vendor selected'],
      ['Employee Training', 'Cannabis handling certification', 'Annual', 'HR Department', 'In Progress', '[DATE]', '', '85% staff completed'],
      ['Product Testing', 'Potency and contamination testing', 'Per Batch', 'QC Lab', 'Current', 'Per Batch', '[DATE]', 'Lab partner contracted'],
      ['Financial Reporting', 'State tax and revenue reports', 'Monthly', 'Accounting', 'Current', 'Monthly', '[DATE]', 'Automated reporting'],
      ['Waste Disposal', 'Manifested waste disposal', 'Weekly', 'Operations', 'Current', 'Weekly', '[DATE]', 'Licensed disposal company'],
      ['Packaging Compliance', 'Child-resistant packaging audit', 'Quarterly', 'Packaging Team', 'Due', '[DATE]', '', 'New regulations effective'],
      ['Advertising Review', 'Marketing materials compliance', 'Per Campaign', 'Marketing', 'Current', 'Per Campaign', '[DATE]', 'Legal review required'],
      ['Facility Inspection', 'State regulatory inspection', 'As Required', 'Facility Manager', 'Scheduled', '[DATE]', '', 'Inspection notice received']
    ];

    try {
      const checklistSheet = await sheets.spreadsheets.create({
        requestBody: { properties: { title: 'Cannabis Compliance Checklist Template' } }
      });

      await drive.files.update({
        fileId: checklistSheet.data.spreadsheetId,
        addParents: f8FolderId,
        fields: 'id,parents'
      });

      const allData = [checklistHeaders, ...checklistData];
      await sheets.spreadsheets.values.update({
        spreadsheetId: checklistSheet.data.spreadsheetId,
        range: `Sheet1!A1:H${allData.length}`,
        valueInputOption: 'RAW',
        requestBody: { values: allData }
      });

      console.log('✅ Compliance Checklist Template created successfully');
      console.log(`   Spreadsheet ID: ${checklistSheet.data.spreadsheetId}`);
      
    } catch (error) {
      console.log(`❌ Error creating checklist template: ${error.message}`);
    }

    // Template 3: Product Development Brief Template
    console.log('\n🧪 Creating Product Development Brief Template...');
    const productBriefTemplate = `# Product Development Brief Template
## [PRODUCT NAME]

### Executive Summary
- **Product Type**: [Flower/Concentrate/Edible/Topical/Other]
- **Target Market**: [Consumer segment]
- **Unique Selling Proposition**: [Key differentiator]
- **Expected Launch Date**: [DATE]
- **Project Budget**: $[AMOUNT]

### Market Analysis
#### Target Demographics
- **Primary Audience**: [Age, income, lifestyle]
- **Secondary Audience**: [Age, income, lifestyle]
- **Market Size**: [Estimated revenue potential]
- **Competitive Landscape**: [Key competitors and positioning]

#### Market Opportunity
- **Gap Analysis**: [Unmet needs in the market]
- **Trend Alignment**: [Relevant industry trends]
- **Regulatory Environment**: [Legal considerations]

### Product Specifications
#### Technical Requirements
- **Cannabinoid Profile**: [THC/CBD/Other percentages]
- **Terpene Profile**: [Desired terpenes and effects]
- **Potency Range**: [Minimum and maximum potency]
- **Form Factor**: [Physical characteristics]
- **Packaging**: [Size, materials, compliance requirements]

#### Quality Standards
- **Testing Requirements**: [Mandatory tests]
- **Shelf Life**: [Stability requirements]
- **Storage Conditions**: [Temperature, humidity, light]
- **Allergen Information**: [Potential allergens]

### Development Timeline
#### Phase 1: Research & Development (Weeks 1-4)
- [ ] Market research completion
- [ ] Formulation development
- [ ] Initial testing and optimization
- [ ] Regulatory compliance review

#### Phase 2: Prototype Development (Weeks 5-8)
- [ ] Prototype creation
- [ ] Internal testing and evaluation
- [ ] Regulatory submission preparation
- [ ] Packaging design development

#### Phase 3: Testing & Validation (Weeks 9-12)
- [ ] Third-party laboratory testing
- [ ] Stability testing initiation
- [ ] Focus group feedback collection
- [ ] Regulatory approval process

#### Phase 4: Production Preparation (Weeks 13-16)
- [ ] Manufacturing process optimization
- [ ] Quality control procedures
- [ ] Staff training completion
- [ ] Launch preparation

### Resource Requirements
#### Team Structure
- **Project Manager**: [Name/Role]
- **Lead Developer**: [Name/Role]
- **Quality Assurance**: [Name/Role]
- **Regulatory Affairs**: [Name/Role]
- **Marketing Liaison**: [Name/Role]

#### Budget Allocation
- **R&D Costs**: $[AMOUNT]
- **Testing & Validation**: $[AMOUNT]
- **Equipment & Materials**: $[AMOUNT]
- **Regulatory Fees**: $[AMOUNT]
- **Marketing Launch**: $[AMOUNT]
- **Contingency (10%)**: $[AMOUNT]

### Success Metrics
#### Development KPIs
- **Time to Market**: [Target timeline]
- **Development Cost**: [Budget adherence]
- **Quality Metrics**: [Pass rates, consistency]
- **Regulatory Compliance**: [Approval timeline]

#### Commercial KPIs
- **Sales Volume**: [Units in first 6 months]
- **Revenue Target**: [Financial goals]
- **Market Penetration**: [Market share goals]
- **Customer Satisfaction**: [Rating targets]

### Risk Assessment
#### Technical Risks
- **Risk 1**: [Description] - Mitigation: [Strategy]
- **Risk 2**: [Description] - Mitigation: [Strategy]
- **Risk 3**: [Description] - Mitigation: [Strategy]

#### Market Risks
- **Risk 1**: [Description] - Mitigation: [Strategy]
- **Risk 2**: [Description] - Mitigation: [Strategy]
- **Risk 3**: [Description] - Mitigation: [Strategy]

#### Regulatory Risks
- **Risk 1**: [Description] - Mitigation: [Strategy]
- **Risk 2**: [Description] - Mitigation: [Strategy]
- **Risk 3**: [Description] - Mitigation: [Strategy]

### Approval Process
- **Technical Review**: [Reviewer name and date]
- **Regulatory Review**: [Reviewer name and date]
- **Financial Review**: [Reviewer name and date]
- **Executive Approval**: [Approver name and date]

### Appendices
- **Appendix A**: Market Research Data
- **Appendix B**: Competitive Analysis
- **Appendix C**: Regulatory Requirements
- **Appendix D**: Financial Projections

---
**Document Version**: 1.0
**Created By**: [NAME]
**Date**: [DATE]
**Status**: [DRAFT/APPROVED/ACTIVE]`;

    try {
      const productBriefDoc = await docs.documents.create({
        requestBody: { title: 'Product Development Brief Template' }
      });

      await drive.files.update({
        fileId: productBriefDoc.data.documentId,
        addParents: f8FolderId,
        fields: 'id,parents'
      });

      await docs.documents.batchUpdate({
        documentId: productBriefDoc.data.documentId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: productBriefTemplate
            }
          }]
        }
      });

      console.log('✅ Product Development Brief Template created successfully');
      console.log(`   Document ID: ${productBriefDoc.data.documentId}`);
      
    } catch (error) {
      console.log(`❌ Error creating product brief template: ${error.message}`);
    }

    // Template 4: Lab Results Tracking Template
    console.log('\n🔬 Creating Lab Results Tracking Template...');
    const labResultsHeaders = [
      'Batch ID',
      'Product Type',
      'Sample Date',
      'Test Date',
      'Lab Name',
      'THC %',
      'CBD %',
      'Total Cannabinoids %',
      'Terpenes',
      'Pesticides',
      'Heavy Metals',
      'Microbials',
      'Residual Solvents',
      'Water Activity',
      'Moisture Content',
      'Overall Status',
      'COA Link',
      'Notes'
    ];

    const labResultsData = [
      ['F-2025-001', 'Flower', '2025-01-15', '2025-01-18', 'Green Scientific', '23.2%', '0.8%', '26.4%', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '0.52', '10.2%', 'PASS', '[COA URL]', 'Premium quality'],
      ['C-2025-001', 'Concentrate', '2025-01-16', '2025-01-19', 'CannTest Labs', '78.5%', '1.2%', '85.3%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '2.1%', 'PASS', '[COA URL]', 'Rosin extraction'],
      ['E-2025-001', 'Edible', '2025-01-17', '2025-01-20', 'Green Scientific', '10.1%', '0.3%', '10.8%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', '0.48', '8.7%', 'PASS', '[COA URL]', 'Gummy formulation'],
      ['F-2025-002', 'Flower', '2025-01-18', '2025-01-21', 'CannTest Labs', '19.8%', '1.5%', '23.1%', 'Pass', 'FAIL', 'Pass', 'Pass', 'N/A', '0.55', '11.3%', 'FAIL', '[COA URL]', 'Myclobutanil detected'],
      ['T-2025-001', 'Topical', '2025-01-19', '2025-01-22', 'Green Scientific', '0.0%', '15.2%', '18.4%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '5.2%', 'PASS', '[COA URL]', 'CBD isolate base'],
      ['C-2025-002', 'Concentrate', '2025-01-20', '2025-01-23', 'CannTest Labs', '82.1%', '0.9%', '89.7%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '1.8%', 'PASS', '[COA URL]', 'Live resin'],
      ['F-2025-003', 'Flower', '2025-01-21', '2025-01-24', 'Green Scientific', '21.7%', '1.1%', '25.3%', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '0.51', '9.8%', 'PASS', '[COA URL]', 'Outdoor grown'],
      ['E-2025-002', 'Edible', '2025-01-22', '2025-01-25', 'CannTest Labs', '5.2%', '5.1%', '11.8%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', '0.49', '7.9%', 'PASS', '[COA URL]', '1:1 ratio chocolate'],
      ['F-2025-004', 'Flower', '2025-01-23', '2025-01-26', 'Green Scientific', '24.1%', '0.7%', '27.8%', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '0.53', '10.7%', 'PASS', '[COA URL]', 'Indoor hydroponic'],
      ['C-2025-003', 'Concentrate', '2025-01-24', '2025-01-27', 'CannTest Labs', '75.3%', '1.8%', '83.2%', 'Pass', 'Pass', 'Pass', 'Pass', 'Pass', 'N/A', '2.3%', 'PASS', '[COA URL]', 'BHO extraction']
    ];

    try {
      const labResultsSheet = await sheets.spreadsheets.create({
        requestBody: { properties: { title: 'Lab Results Tracking Template' } }
      });

      await drive.files.update({
        fileId: labResultsSheet.data.spreadsheetId,
        addParents: f8FolderId,
        fields: 'id,parents'
      });

      const allLabData = [labResultsHeaders, ...labResultsData];
      await sheets.spreadsheets.values.update({
        spreadsheetId: labResultsSheet.data.spreadsheetId,
        range: `Sheet1!A1:R${allLabData.length}`,
        valueInputOption: 'RAW',
        requestBody: { values: allLabData }
      });

      console.log('✅ Lab Results Tracking Template created successfully');
      console.log(`   Spreadsheet ID: ${labResultsSheet.data.spreadsheetId}`);
      
    } catch (error) {
      console.log(`❌ Error creating lab results template: ${error.message}`);
    }

    // List all files in the workspace
    console.log('\n📁 F8 Cannabis Workspace Contents:');
    const allFiles = await drive.files.list({
      q: `'${f8FolderId}' in parents`,
      fields: 'files(id,name,mimeType,webViewLink,createdTime)'
    });

    allFiles.data.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Type: ${file.mimeType.includes('document') ? 'Document' : file.mimeType.includes('spreadsheet') ? 'Spreadsheet' : 'Folder'}`);
      console.log(`   URL: ${file.webViewLink}`);
      console.log(`   Created: ${new Date(file.createdTime).toLocaleString()}`);
      console.log('');
    });

    // Clean up temp file
    fs.unlinkSync('temp_service_account.json');

    console.log('\n🎉 CANNABIS INDUSTRY TEMPLATES DEMONSTRATION COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📂 F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE`);
    console.log('✅ Professional cannabis industry templates created');
    console.log('✅ Ready-to-use SOP, compliance, and development templates');
    console.log('✅ Comprehensive tracking spreadsheets for operations');
    console.log('✅ Agent-ready document management system operational');

  } catch (error) {
    console.error('❌ Error demonstrating templates:', error.message);
    
    // Clean up temp file if it exists
    if (fs.existsSync('temp_service_account.json')) {
      fs.unlinkSync('temp_service_account.json');
    }
  }
}

demonstrateTemplates().catch(console.error);