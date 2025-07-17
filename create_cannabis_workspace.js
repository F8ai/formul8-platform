import { google } from 'googleapis';
import fs from 'fs';

async function createCannabisWorkspace() {
  console.log('🌿 Creating Complete Cannabis Industry Workspace');
  console.log('===============================================');
  
  try {
    // Load service account
    const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
    
    // Use domain-wide delegation with user impersonation
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: 'dan@syzygyx.com' // Impersonate domain user
    });

    await auth.authorize();
    console.log('✅ Domain-wide delegation authorized');

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get F8 workspace folders
    const workspaceFolders = await drive.files.list({
      q: "'1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE' in parents and mimeType='application/vnd.google-apps.folder'",
      pageSize: 10
    });

    const folders = {};
    workspaceFolders.data.files.forEach(folder => {
      folders[folder.name] = folder.id;
    });

    console.log(`\n📁 Found ${Object.keys(folders).length} workspace folders`);

    // 1. Create Cannabis SOP Document
    console.log('\n📄 Creating Cannabis Standard Operating Procedure...');
    const sopDoc = await docs.documents.create({
      requestBody: {
        title: 'F8 Cannabis - Standard Operating Procedures'
      }
    });

    // Add comprehensive SOP content
    await docs.documents.batchUpdate({
      documentId: sopDoc.data.documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `CANNABIS STANDARD OPERATING PROCEDURES
F8 Cannabis Operations Platform

==================================================

1. QUALITY CONTROL TESTING PROCEDURES

1.1 Sample Collection Protocol
• Collect samples from multiple batches using sterile equipment
• Label samples with batch ID, date, time, and collector initials
• Store samples in appropriate containers at controlled temperature
• Transport samples to certified testing laboratory within 24 hours

1.2 Testing Requirements
• Cannabinoid profile analysis (THC, CBD, CBG, CBN)
• Terpene profile analysis
• Residual solvents testing
• Heavy metals screening
• Pesticide residue analysis
• Microbial contamination testing

1.3 Documentation Requirements
• Maintain chain of custody documentation
• Record all testing results in batch records
• Generate Certificate of Analysis (COA) for each batch
• Archive all testing documents for minimum 3 years

2. COMPLIANCE MANAGEMENT

2.1 Regulatory Compliance
• Maintain current licenses and permits
• Track inventory using state-mandated system
• Conduct regular internal audits
• Prepare for regulatory inspections

2.2 Record Keeping
• Maintain detailed batch records
• Document all processing steps
• Record equipment maintenance
• Track waste disposal

3. PRODUCT DEVELOPMENT

3.1 Formulation Development
• Document all ingredients and ratios
• Conduct stability testing
• Validate extraction methods
• Optimize processing parameters

3.2 Quality Assurance
• Implement HACCP principles
• Conduct regular equipment calibration
• Monitor environmental conditions
• Verify product consistency

4. SAFETY PROTOCOLS

4.1 Personal Protective Equipment
• Require appropriate PPE for all operations
• Conduct regular safety training
• Maintain emergency procedures
• Document all safety incidents

4.2 Equipment Safety
• Follow manufacturer operating procedures
• Conduct preventive maintenance
• Maintain safety equipment inspections
• Document equipment malfunctions

This SOP ensures consistent, compliant cannabis operations across all F8 platform activities.`
            }
          }
        ]
      }
    });

    // Move to Compliance Documents folder
    if (folders['Compliance Documents']) {
      await drive.files.update({
        fileId: sopDoc.data.documentId,
        addParents: folders['Compliance Documents']
      });
    }

    console.log(`✅ Cannabis SOP created: https://docs.google.com/document/d/${sopDoc.data.documentId}`);

    // 2. Create Compliance Tracking Spreadsheet
    console.log('\n📊 Creating Compliance Tracking Spreadsheet...');
    const complianceSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'F8 Cannabis - Compliance Tracking Dashboard'
        }
      }
    });

    // Add compliance tracking data
    await sheets.spreadsheets.values.update({
      spreadsheetId: complianceSheet.data.spreadsheetId,
      range: 'A1:L20',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Batch ID', 'Product Type', 'Test Date', 'THC %', 'CBD %', 'Status', 'COA Link', 'Compliance Officer', 'Expiry Date', 'Storage Location', 'Inventory Count', 'Notes'],
          ['B001-2025', 'Flower', '2025-01-15', '22.5', '1.2', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B001', 'J. Smith', '2025-07-15', 'Vault A-1', '1250g', 'Premium indoor strain'],
          ['B002-2025', 'Concentrate', '2025-01-15', '78.3', '2.1', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B002', 'J. Smith', '2025-06-15', 'Vault A-2', '150g', 'Live resin extract'],
          ['B003-2025', 'Edible', '2025-01-16', '10.0', '0.5', 'PENDING', 'https://lab.f8cannabis.com/coa/B003', 'M. Johnson', '2025-04-16', 'Vault B-1', '2000 units', 'Gummy production batch'],
          ['B004-2025', 'Vape', '2025-01-16', '85.2', '1.8', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B004', 'J. Smith', '2025-08-16', 'Vault A-3', '500 units', 'Distillate cartridges'],
          ['B005-2025', 'Topical', '2025-01-17', '5.0', '15.0', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B005', 'M. Johnson', '2025-05-17', 'Vault C-1', '300 units', 'CBD relief cream'],
          ['B006-2025', 'Flower', '2025-01-18', '18.7', '2.3', 'TESTING', 'PENDING', 'J. Smith', '2025-07-18', 'Vault A-4', '980g', 'Outdoor cultivation'],
          ['B007-2025', 'Concentrate', '2025-01-19', '72.1', '3.2', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B007', 'K. Williams', '2025-06-19', 'Vault A-5', '200g', 'Rosin press extraction'],
          ['B008-2025', 'Edible', '2025-01-20', '12.5', '0.8', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B008', 'M. Johnson', '2025-04-20', 'Vault B-2', '1500 units', 'Chocolate bar batch'],
          ['B009-2025', 'Vape', '2025-01-21', '88.9', '1.1', 'TESTING', 'PENDING', 'J. Smith', '2025-08-21', 'Vault A-6', '750 units', 'CO2 extraction'],
          ['B010-2025', 'Topical', '2025-01-22', '3.5', '18.2', 'COMPLIANT', 'https://lab.f8cannabis.com/coa/B010', 'K. Williams', '2025-05-22', 'Vault C-2', '400 units', 'High CBD salve'],
          ['', '', '', '', '', '', '', '', '', '', '', ''],
          ['COMPLIANCE SUMMARY', '', '', '', '', '', '', '', '', '', '', ''],
          ['Total Batches', '10', '', '', '', '', '', '', '', '', '', ''],
          ['Compliant', '7', '', '', '', '', '', '', '', '', '', ''],
          ['Pending/Testing', '3', '', '', '', '', '', '', '', '', '', ''],
          ['Compliance Rate', '70%', '', '', '', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', '', '', '', '', ''],
          ['Next Audit Date', '2025-02-15', '', '', '', '', '', '', '', '', '', ''],
          ['Regulatory Contact', 'State Cannabis Board', '', '', '', '', '', '', '', '', '', '']
        ]
      }
    });

    // Format the spreadsheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: complianceSheet.data.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 12
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 12,
                endRowIndex: 13,
                startColumnIndex: 0,
                endColumnIndex: 12
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    // Move to Compliance Documents folder
    if (folders['Compliance Documents']) {
      await drive.files.update({
        fileId: complianceSheet.data.spreadsheetId,
        addParents: folders['Compliance Documents']
      });
    }

    console.log(`✅ Compliance Tracker created: https://docs.google.com/spreadsheets/d/${complianceSheet.data.spreadsheetId}`);

    // 3. Create Product Development Template
    console.log('\n🧪 Creating Product Development Template...');
    const productDoc = await docs.documents.create({
      requestBody: {
        title: 'F8 Cannabis - Product Development Brief'
      }
    });

    await docs.documents.batchUpdate({
      documentId: productDoc.data.documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `PRODUCT DEVELOPMENT BRIEF
F8 Cannabis Innovation Lab

==================================================

PROJECT: New Cannabis Product Development
DATE: January 2025
DEVELOPER: F8 Cannabis Team

1. PRODUCT CONCEPT

Product Name: [Enter Product Name]
Product Type: ☐ Flower ☐ Concentrate ☐ Edible ☐ Topical ☐ Vape ☐ Other
Target Market: ☐ Medical ☐ Recreational ☐ Both
Target Demographics: 
Price Point: $[Enter Price]

2. FORMULATION REQUIREMENTS

Primary Cannabinoids:
• THC Target: ____%
• CBD Target: ____%
• CBG Target: ____%
• CBN Target: ____%

Terpene Profile:
• Myrcene: ____%
• Limonene: ____%
• Pinene: ____%
• Linalool: ____%
• Caryophyllene: ____%

Extraction Method:
☐ CO2 Extraction
☐ Ethanol Extraction
☐ Hydrocarbon Extraction
☐ Rosin Press
☐ Other: ___________

3. QUALITY SPECIFICATIONS

Potency Tolerance: ±5%
Moisture Content: <12%
Microbial Limits: <1000 CFU/g
Heavy Metals: Below regulatory limits
Pesticide Residues: Below regulatory limits
Residual Solvents: Below regulatory limits

4. PACKAGING REQUIREMENTS

Primary Packaging: ___________
Secondary Packaging: ___________
Labeling Requirements:
• Product name and type
• Cannabinoid content
• Batch number and test date
• Expiration date
• Regulatory warnings
• QR code for COA access

5. REGULATORY COMPLIANCE

Required Testing:
☐ Cannabinoid potency
☐ Terpene profile
☐ Residual solvents
☐ Heavy metals
☐ Pesticides
☐ Microbials
☐ Moisture content

License Requirements:
☐ Manufacturing license
☐ Distribution license
☐ Retail license (if applicable)

6. PRODUCTION SPECIFICATIONS

Batch Size: _____ units
Production Timeline: _____ days
Equipment Requirements:
• Extraction equipment
• Processing equipment
• Packaging equipment
• Testing equipment

7. DEVELOPMENT TIMELINE

Phase 1: Formulation Development (Week 1-2)
• Initial recipe development
• Small-scale testing
• Potency optimization

Phase 2: Stability Testing (Week 3-4)
• Shelf-life studies
• Environmental stress testing
• Packaging validation

Phase 3: Regulatory Testing (Week 5-6)
• Full panel testing
• COA generation
• Compliance verification

Phase 4: Production Scale-up (Week 7-8)
• Equipment validation
• Process optimization
• Quality control implementation

8. SUCCESS METRICS

Quality Metrics:
• Potency accuracy: ±5%
• Consistency: <10% variation
• Yield: >85%
• First-pass testing: >95%

Commercial Metrics:
• Production cost: $_____ per unit
• Retail price: $_____ per unit
• Margin: ____%
• Market acceptance: >80%

9. RISK ASSESSMENT

Technical Risks:
• Formulation stability
• Extraction efficiency
• Quality consistency
• Equipment reliability

Regulatory Risks:
• Compliance changes
• Testing requirements
• Labeling updates
• License renewals

Market Risks:
• Competition
• Price pressure
• Demand fluctuation
• Consumer preferences

10. APPROVAL CHECKLIST

☐ Formulation approved by R&D
☐ Regulatory compliance verified
☐ Quality specifications met
☐ Production process validated
☐ Packaging approved
☐ Marketing materials ready
☐ Distribution plan confirmed
☐ Launch timeline finalized

This product development brief ensures systematic development of high-quality cannabis products that meet all regulatory requirements and market expectations.`
            }
          }
        ]
      }
    });

    // Move to Product Development folder
    if (folders['Product Development']) {
      await drive.files.update({
        fileId: productDoc.data.documentId,
        addParents: folders['Product Development']
      });
    }

    console.log(`✅ Product Development Brief created: https://docs.google.com/document/d/${productDoc.data.documentId}`);

    // 4. Create Lab Results Tracking Sheet
    console.log('\n🔬 Creating Lab Results Tracking Sheet...');
    const labSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'F8 Cannabis - Lab Results & COA Tracking'
        }
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: labSheet.data.spreadsheetId,
      range: 'A1:O15',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Test ID', 'Batch ID', 'Product', 'Test Date', 'Lab', 'THC %', 'CBD %', 'CBG %', 'CBN %', 'Terpenes', 'Pesticides', 'Heavy Metals', 'Microbials', 'Solvents', 'COA Status'],
          ['T001-2025', 'B001-2025', 'Premium Flower', '2025-01-15', 'Green Lab Analytics', '22.5', '1.2', '0.8', '0.3', 'PASS', 'PASS', 'PASS', 'PASS', 'N/A', 'APPROVED'],
          ['T002-2025', 'B002-2025', 'Live Resin', '2025-01-15', 'Cannabis Testing Co', '78.3', '2.1', '1.5', '0.9', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'APPROVED'],
          ['T003-2025', 'B003-2025', 'Gummy Bears', '2025-01-16', 'Green Lab Analytics', '10.0', '0.5', '0.2', '0.1', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'PENDING'],
          ['T004-2025', 'B004-2025', 'Vape Cartridge', '2025-01-16', 'Analytical 360', '85.2', '1.8', '0.9', '0.4', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'APPROVED'],
          ['T005-2025', 'B005-2025', 'CBD Cream', '2025-01-17', 'Cannabis Testing Co', '5.0', '15.0', '2.1', '0.8', 'PASS', 'PASS', 'PASS', 'PASS', 'N/A', 'APPROVED'],
          ['T006-2025', 'B006-2025', 'Outdoor Flower', '2025-01-18', 'Green Lab Analytics', '18.7', '2.3', '1.1', '0.6', 'PASS', 'PASS', 'PASS', 'PASS', 'N/A', 'IN PROCESS'],
          ['T007-2025', 'B007-2025', 'Rosin', '2025-01-19', 'Analytical 360', '72.1', '3.2', '1.8', '1.2', 'PASS', 'PASS', 'PASS', 'PASS', 'N/A', 'APPROVED'],
          ['T008-2025', 'B008-2025', 'Chocolate Bar', '2025-01-20', 'Cannabis Testing Co', '12.5', '0.8', '0.3', '0.2', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'APPROVED'],
          ['T009-2025', 'B009-2025', 'CO2 Cartridge', '2025-01-21', 'Green Lab Analytics', '88.9', '1.1', '0.7', '0.3', 'PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'IN PROCESS'],
          ['T010-2025', 'B010-2025', 'High CBD Salve', '2025-01-22', 'Analytical 360', '3.5', '18.2', '2.5', '1.0', 'PASS', 'PASS', 'PASS', 'PASS', 'N/A', 'APPROVED'],
          ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          ['TESTING SUMMARY', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          ['Total Tests', '10', 'Approved COAs', '7', 'Pass Rate', '100%', '', '', '', '', '', '', '', '', ''],
          ['Pending Tests', '3', 'Average THC', '41.27%', 'Average CBD', '4.62%', '', '', '', '', '', '', '', '', '']
        ]
      }
    });

    // Format the lab results sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: labSheet.data.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 15
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.3, green: 0.4, blue: 0.8 },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    // Move to Lab Results folder
    if (folders['Lab Results']) {
      await drive.files.update({
        fileId: labSheet.data.spreadsheetId,
        addParents: folders['Lab Results']
      });
    }

    console.log(`✅ Lab Results Tracker created: https://docs.google.com/spreadsheets/d/${labSheet.data.spreadsheetId}`);

    // 5. Create Marketing Campaign Template
    console.log('\n📢 Creating Marketing Campaign Template...');
    const marketingDoc = await docs.documents.create({
      requestBody: {
        title: 'F8 Cannabis - Marketing Campaign Framework'
      }
    });

    await docs.documents.batchUpdate({
      documentId: marketingDoc.data.documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `CANNABIS MARKETING CAMPAIGN FRAMEWORK
F8 Cannabis Marketing Strategy

==================================================

CAMPAIGN: [Enter Campaign Name]
LAUNCH DATE: [Enter Date]
BUDGET: $[Enter Budget]
DURATION: [Enter Duration]

1. CAMPAIGN OBJECTIVES

Primary Goal:
☐ Brand Awareness
☐ Product Launch
☐ Customer Acquisition
☐ Customer Retention
☐ Market Share Growth

Key Performance Indicators (KPIs):
• Brand awareness: +____%
• Website traffic: +____%
• Sales conversion: +____%
• Customer acquisition cost: $____
• Return on ad spend: ____%

2. TARGET AUDIENCE

Demographics:
• Age: _____ to _____
• Gender: ___________
• Income: $_____ to $_____
• Location: ___________
• Education: ___________

Cannabis Use Profile:
• Experience level: ☐ Beginner ☐ Intermediate ☐ Expert
• Consumption frequency: ☐ Daily ☐ Weekly ☐ Monthly ☐ Occasional
• Preferred products: ☐ Flower ☐ Edibles ☐ Concentrates ☐ Topicals
• Purchase motivation: ☐ Medical ☐ Recreational ☐ Both

3. PLATFORM STRATEGY

Compliant Platforms:
✓ Weedmaps
✓ Leafly
✓ Cannabis-specific publications
✓ Direct email marketing
✓ SMS marketing (where legal)
✓ Local print media
✓ Radio advertising
✓ Outdoor advertising

Restricted Platforms (Use Wellness Angle):
⚠️ Facebook (wellness/lifestyle focus)
⚠️ Instagram (educational content)
⚠️ Google Ads (hemp/CBD only)
⚠️ LinkedIn (B2B cannabis industry)

4. CREATIVE STRATEGY

Brand Messaging:
• Quality and safety first
• Lab-tested products
• Trusted cannabis source
• Expert cultivation
• Customer education focus

Visual Identity:
• Professional, clean design
• Earth tones and natural colors
• High-quality product photography
• Consistent brand elements
• Regulatory compliance visuals

Content Themes:
• Product education
• Safety and testing
• Consumption guidelines
• Health and wellness
• Community involvement

5. COMPLIANCE REQUIREMENTS

Content Guidelines:
• No health claims
• Age-gated content
• Clear 21+ messaging
• Responsible use messaging
• No targeting minors
• No interstate commerce claims

Required Disclaimers:
• "For use only by adults 21 and over"
• "Keep out of reach of children"
• "Not for use by pregnant or nursing women"
• "This product has not been evaluated by the FDA"
• State-specific warnings

6. CAMPAIGN TACTICS

Digital Marketing:
• SEO-optimized website content
• Email newsletter campaigns
• Social media educational content
• Influencer partnerships (where legal)
• Retargeting campaigns
• Local search optimization

Traditional Marketing:
• Print advertising in cannabis publications
• Radio sponsorships
• Local event sponsorships
• Direct mail campaigns
• In-store promotions
• Loyalty programs

7. BUDGET ALLOCATION

Channel Distribution:
• Digital advertising: ____%
• Traditional media: ____%
• Content creation: ____%
• Influencer partnerships: ____%
• Events and sponsorships: ____%
• Production costs: ____%

8. MEASUREMENT FRAMEWORK

Awareness Metrics:
• Brand recall surveys
• Website traffic analysis
• Social media engagement
• Email open rates
• Search volume tracking

Conversion Metrics:
• Lead generation
• Sales attribution
• Customer lifetime value
• Repeat purchase rate
• Referral tracking

9. CAMPAIGN TIMELINE

Pre-Launch (Week 1-2):
• Creative development
• Compliance review
• Platform setup
• Content creation
• Influencer outreach

Launch Phase (Week 3-4):
• Campaign activation
• Media buying
• Social media promotion
• Email campaigns
• Performance monitoring

Optimization Phase (Week 5-8):
• Performance analysis
• Creative optimization
• Audience refinement
• Budget reallocation
• A/B testing

10. RISK MITIGATION

Platform Risks:
• Ad account suspension
• Content restrictions
• Policy changes
• Compliance violations

Mitigation Strategies:
• Platform diversification
• Compliant content creation
• Regular policy monitoring
• Legal review process
• Backup campaign assets

11. SUCCESS CHECKLIST

☐ Campaign objectives defined
☐ Target audience identified
☐ Platform strategy approved
☐ Creative assets completed
☐ Compliance review passed
☐ Budget allocated
☐ Timeline finalized
☐ Measurement plan implemented
☐ Risk mitigation strategies prepared
☐ Launch checklist completed

This marketing framework ensures compliant, effective cannabis marketing campaigns that drive business growth while maintaining regulatory compliance and brand integrity.`
            }
          }
        ]
      }
    });

    // Move to Marketing Campaigns folder
    if (folders['Marketing Campaigns']) {
      await drive.files.update({
        fileId: marketingDoc.data.documentId,
        addParents: folders['Marketing Campaigns']
      });
    }

    console.log(`✅ Marketing Campaign Framework created: https://docs.google.com/document/d/${marketingDoc.data.documentId}`);

    console.log('\n🎉 F8 CANNABIS WORKSPACE CREATION COMPLETE!');
    console.log('==========================================');
    console.log('📂 F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE');
    console.log('✅ Professional cannabis industry templates created');
    console.log('✅ Comprehensive compliance tracking systems deployed');
    console.log('✅ Product development workflows established');
    console.log('✅ Lab results management systems operational');
    console.log('✅ Marketing campaign frameworks ready');
    console.log('✅ Agent-based document management system fully functional');
    console.log('\n📋 Created Documents:');
    console.log(`• Cannabis SOP: https://docs.google.com/document/d/${sopDoc.data.documentId}`);
    console.log(`• Compliance Tracker: https://docs.google.com/spreadsheets/d/${complianceSheet.data.spreadsheetId}`);
    console.log(`• Product Development: https://docs.google.com/document/d/${productDoc.data.documentId}`);
    console.log(`• Lab Results Tracker: https://docs.google.com/spreadsheets/d/${labSheet.data.spreadsheetId}`);
    console.log(`• Marketing Framework: https://docs.google.com/document/d/${marketingDoc.data.documentId}`);
    
  } catch (error) {
    console.error('❌ Error creating cannabis workspace:', error.message);
  }
}

createCannabisWorkspace();