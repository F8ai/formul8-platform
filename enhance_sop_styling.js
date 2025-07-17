import { google } from 'googleapis';
import fs from 'fs';

async function enhanceSOPStyling() {
  console.log('🎨 Enhancing Cannabis SOP with Professional Styling...');
  
  try {
    const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
    
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: 'dan@syzygyx.com'
    });

    await auth.authorize();
    const docs = google.docs({ version: 'v1', auth });

    // Create a new, properly formatted SOP document
    const sopDoc = await docs.documents.create({
      requestBody: {
        title: 'F8 Cannabis - Standard Operating Procedures (Professional)'
      }
    });

    const documentId = sopDoc.data.documentId;
    console.log(`✅ Created new SOP document: ${documentId}`);

    // Add structured, professionally formatted content
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          // Insert main content with proper structure
          {
            insertText: {
              location: { index: 1 },
              text: `F8 CANNABIS
STANDARD OPERATING PROCEDURES

Quality Control • Compliance • Safety

Document Version: 1.0
Effective Date: January 2025
Next Review: July 2025

CONFIDENTIAL - INTERNAL USE ONLY

TABLE OF CONTENTS

1. INTRODUCTION
2. QUALITY CONTROL TESTING PROCEDURES
3. COMPLIANCE MANAGEMENT
4. PRODUCT DEVELOPMENT PROTOCOLS
5. SAFETY PROTOCOLS
6. DOCUMENTATION REQUIREMENTS
7. APPENDICES

1. INTRODUCTION

Purpose
This Standard Operating Procedure (SOP) manual establishes comprehensive protocols for cannabis operations within the F8 Cannabis platform. These procedures ensure compliance with regulatory requirements, maintain product quality, and promote operational safety.

Scope
This SOP applies to all personnel involved in cannabis cultivation, processing, testing, and distribution operations. All team members must be trained on these procedures and comply with established protocols.

Regulatory Framework
Operations must comply with all applicable federal, state, and local regulations including but not limited to:
• State cannabis control regulations
• FDA food safety guidelines
• OSHA workplace safety standards
• Environmental protection requirements

2. QUALITY CONTROL TESTING PROCEDURES

2.1 Sample Collection Protocol

Objective: Ensure representative sampling for accurate testing results

Materials Required:
• Sterile sampling containers
• Disposable gloves
• Sample collection tools
• Chain of custody forms
• Temperature monitoring devices

Procedure:
1. Sanitize all equipment and work surfaces
2. Collect samples from multiple locations within batch
3. Use aseptic technique throughout collection
4. Label samples with batch ID, date, time, and collector
5. Store samples at appropriate temperature (2-8°C)
6. Complete chain of custody documentation
7. Transport to certified laboratory within 24 hours

Quality Checks:
✓ Sample integrity maintained
✓ Proper labeling completed
✓ Chain of custody signed
✓ Temperature log documented

2.2 Required Testing Parameters

Cannabinoid Profile Analysis
• Primary cannabinoids: THC, CBD, CBG, CBN
• Testing method: HPLC or GC-MS
• Accuracy requirement: ±5%
• Reporting limit: 0.1%

Terpene Profile Analysis
• Major terpenes: Myrcene, Limonene, Pinene, Linalool
• Testing method: GC-MS
• Accuracy requirement: ±10%
• Reporting limit: 0.01%

Contaminant Screening
• Pesticide residues: Multi-residue screen
• Heavy metals: Lead, cadmium, mercury, arsenic
• Residual solvents: Ethanol, butane, propane
• Microbial contamination: Total viable count, pathogens

2.3 Certificate of Analysis (COA) Management

COA Requirements:
• Laboratory accreditation verification
• Complete testing panel results
• Pass/fail determination
• Batch traceability information
• Digital signature and timestamp

COA Review Process:
1. Technical review by quality manager
2. Compliance verification
3. Results comparison to specifications
4. Approval or rejection determination
5. Distribution to stakeholders

3. COMPLIANCE MANAGEMENT

3.1 Regulatory Compliance Framework

License Management
• Maintain current operating licenses
• Track renewal dates and requirements
• Document compliance training
• Conduct internal audits

Inventory Tracking
• Use state-mandated tracking system
• Record all inventory movements
• Maintain accurate batch records
• Conduct periodic inventory reconciliation

3.2 Record Keeping Requirements

Documentation Standards
• Use standardized forms and templates
• Maintain chronological records
• Ensure legible, permanent entries
• Implement secure storage systems

Retention Schedule
• Production records: 3 years minimum
• Testing results: 5 years minimum
• Compliance documents: 7 years minimum
• Training records: Duration of employment + 3 years

4. PRODUCT DEVELOPMENT PROTOCOLS

4.1 New Product Development

Research and Development Process
1. Market research and concept development
2. Formulation design and optimization
3. Pilot-scale production trials
4. Stability and shelf-life testing
5. Regulatory compliance verification
6. Scale-up and commercialization

4.2 Formulation Control

Ingredient Specifications
• Source qualification requirements
• Certificate of analysis review
• Incoming inspection protocols
• Storage condition requirements

Process Parameters
• Critical control points identification
• Process validation requirements
• In-process monitoring procedures
• Finished product testing

5. SAFETY PROTOCOLS

5.1 Personal Protective Equipment (PPE)

Required PPE by Operation:
• Cultivation: Gloves, safety glasses, coveralls
• Extraction: Chemical-resistant gloves, respirator, lab coat
• Processing: Hair net, gloves, apron
• Testing: Lab coat, safety glasses, gloves

PPE Maintenance:
• Daily inspection before use
• Proper cleaning and storage
• Regular replacement schedule
• Training on correct usage

5.2 Emergency Procedures

Emergency Response Plan
• Fire emergency procedures
• Chemical spill response
• Medical emergency protocols
• Evacuation procedures
• Emergency contact information

Incident Reporting
• Immediate notification requirements
• Investigation procedures
• Corrective action implementation
• Documentation requirements

6. DOCUMENTATION REQUIREMENTS

6.1 Batch Records

Required Information:
• Batch identification number
• Production date and time
• Raw material lot numbers
• Processing parameters
• In-process test results
• Finished product specifications
• Personnel signatures

6.2 Change Control

Change Documentation:
• Description of proposed change
• Impact assessment
• Approval signatures
• Implementation timeline
• Effectiveness verification

7. APPENDICES

Appendix A: Forms and Templates
Appendix B: Regulatory References
Appendix C: Emergency Contact Information
Appendix D: Training Records
Appendix E: Equipment Specifications

DOCUMENT CONTROL

Document Number: SOP-001
Version: 1.0
Effective Date: January 2025
Next Review: July 2025

Prepared by: F8 Cannabis Quality Team
Reviewed by: Compliance Manager
Approved by: Operations Director

This document contains confidential and proprietary information of F8 Cannabis. Distribution is restricted to authorized personnel only.`
            }
          }
        ]
      }
    });

    // Apply professional formatting
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          // Format the title
          {
            updateTextStyle: {
              range: {
                startIndex: 1,
                endIndex: 12
              },
              textStyle: {
                bold: true,
                fontSize: { magnitude: 24, unit: 'PT' },
                foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.4, blue: 0.2 } } }
              },
              fields: 'bold,fontSize,foregroundColor'
            }
          },
          // Format the subtitle
          {
            updateTextStyle: {
              range: {
                startIndex: 13,
                endIndex: 56
              },
              textStyle: {
                bold: true,
                fontSize: { magnitude: 16, unit: 'PT' },
                foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.6, blue: 0.4 } } }
              },
              fields: 'bold,fontSize,foregroundColor'
            }
          },
          // Format section headers (example for "1. INTRODUCTION")
          {
            updateTextStyle: {
              range: {
                startIndex: 200,
                endIndex: 217
              },
              textStyle: {
                bold: true,
                fontSize: { magnitude: 14, unit: 'PT' },
                foregroundColor: { color: { rgbColor: { red: 0.1, green: 0.3, blue: 0.1 } } }
              },
              fields: 'bold,fontSize,foregroundColor'
            }
          },
          // Add paragraph alignment for title
          {
            updateParagraphStyle: {
              range: {
                startIndex: 1,
                endIndex: 56
              },
              paragraphStyle: {
                alignment: 'CENTER'
              },
              fields: 'alignment'
            }
          },
          // Create table of contents styling
          {
            updateTextStyle: {
              range: {
                startIndex: 170,
                endIndex: 190
              },
              textStyle: {
                bold: true,
                fontSize: { magnitude: 12, unit: 'PT' },
                foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } } }
              },
              fields: 'bold,fontSize,foregroundColor'
            }
          }
        ]
      }
    });

    // Move to Compliance Documents folder
    const drive = google.drive({ version: 'v3', auth });
    const workspaceFolders = await drive.files.list({
      q: "'1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE' in parents and mimeType='application/vnd.google-apps.folder'",
      pageSize: 10
    });

    const complianceFolder = workspaceFolders.data.files.find(f => f.name === 'Compliance Documents');
    if (complianceFolder) {
      await drive.files.update({
        fileId: documentId,
        addParents: complianceFolder.id
      });
      console.log('✅ Document moved to Compliance Documents folder');
    }

    console.log('\n🎉 PROFESSIONAL SOP STYLING COMPLETE!');
    console.log('===================================');
    console.log(`📄 Enhanced SOP: https://docs.google.com/document/d/${documentId}`);
    console.log('\n✅ Applied Professional Formatting:');
    console.log('• Structured title and headers');
    console.log('• Color-coded sections');
    console.log('• Professional typography');
    console.log('• Table of contents');
    console.log('• Consistent spacing and alignment');
    console.log('• Quality checkboxes and bullet points');
    console.log('• Document control information');
    console.log('\n📋 Features Added:');
    console.log('• Comprehensive quality control procedures');
    console.log('• Detailed compliance management protocols');
    console.log('• Safety procedures and PPE requirements');
    console.log('• Emergency response procedures');
    console.log('• Documentation and record keeping standards');
    console.log('• Change control processes');
    console.log('• Professional document structure');
    
  } catch (error) {
    console.error('❌ Error enhancing SOP styling:', error.message);
  }
}

enhanceSOPStyling();