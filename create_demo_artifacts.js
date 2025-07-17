import { google } from 'googleapis';
import fs from 'fs';

// Load service account credentials
const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));

// Initialize Google Auth with domain-wide delegation
const auth = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/spreadsheets'
  ],
  'dan@syzygyx.com' // Impersonate domain user
);

const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Cannabis workspace folder ID
const CANNABIS_WORKSPACE_ID = '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE';

async function createDemoArtifacts() {
  console.log('🚀 Creating demo artifacts for Formul8 platform...');

  try {
    // 1. Cannabis Business Plan Template
    console.log('\n📋 Creating Cannabis Business Plan Template...');
    const businessPlan = await createBusinessPlanTemplate();
    console.log(`✅ Business Plan created: ${businessPlan.url}`);

    // 2. Inventory Management Dashboard
    console.log('\n📊 Creating Inventory Management Dashboard...');
    const inventory = await createInventoryDashboard();
    console.log(`✅ Inventory Dashboard created: ${inventory.url}`);

    // 3. Cannabis Testing Protocol
    console.log('\n🔬 Creating Cannabis Testing Protocol...');
    const testingProtocol = await createTestingProtocol();
    console.log(`✅ Testing Protocol created: ${testingProtocol.url}`);

    // 4. Marketing Campaign Tracker
    console.log('\n📈 Creating Marketing Campaign Tracker...');
    const marketingTracker = await createMarketingCampaignTracker();
    console.log(`✅ Marketing Tracker created: ${marketingTracker.url}`);

    // 5. Cannabis Strain Database
    console.log('\n🌿 Creating Cannabis Strain Database...');
    const strainDatabase = await createStrainDatabase();
    console.log(`✅ Strain Database created: ${strainDatabase.url}`);

    // 6. Employee Training Manual
    console.log('\n👥 Creating Employee Training Manual...');
    const trainingManual = await createTrainingManual();
    console.log(`✅ Training Manual created: ${trainingManual.url}`);

    // 7. CBD Tincture Formulation Sheet
    console.log('\n🧪 Creating CBD Tincture Formulation Sheet...');
    const tincture = await createTinctureFormulation();
    console.log(`✅ Tincture Formulation created: ${tincture.url}`);

    console.log('\n🎉 All demo artifacts created successfully!');
    console.log('\n📂 F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE');

  } catch (error) {
    console.error('❌ Error creating demo artifacts:', error);
  }
}

async function createBusinessPlanTemplate() {
  // Create document
  const doc = await docs.documents.create({
    requestBody: {
      title: 'Cannabis Business Plan Template - Formul8 Demo'
    }
  });

  const documentId = doc.data.documentId;

  // Add professional content
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: 'CANNABIS BUSINESS PLAN TEMPLATE\n\nExecutive Summary\n\nBusiness Overview\nOur cannabis operation represents a comprehensive approach to cultivation, processing, and distribution within the regulated cannabis industry. This business plan outlines our strategic vision, operational framework, and financial projections for establishing a successful cannabis enterprise.\n\nMarket Analysis\n\nIndustry Overview\nThe legal cannabis industry continues to experience unprecedented growth, with market projections indicating sustained expansion across multiple segments including medical, recreational, and industrial hemp applications.\n\nTarget Market\n• Medical patients seeking therapeutic cannabis products\n• Adult recreational consumers (21+)\n• B2B partnerships with dispensaries and retailers\n• Wholesale distribution channels\n\nOperations Plan\n\nCultivation Operations\n• Indoor cultivation facility with climate control systems\n• Hydroponic and soil-based growing methods\n• Strain selection and breeding programs\n• Quality control and testing protocols\n\nProcessing & Manufacturing\n• Extraction and processing capabilities\n• Product development and formulation\n• Packaging and labeling operations\n• Quality assurance systems\n\nCompliance Framework\n\nRegulatory Compliance\n• State licensing requirements\n• Local zoning and permitting\n• Seed-to-sale tracking systems\n• Laboratory testing requirements\n• Security and surveillance protocols\n\nFinancial Projections\n\nStartup Costs\n• Facility acquisition and buildout: $500,000\n• Equipment and technology: $300,000\n• Initial inventory and supplies: $100,000\n• Working capital: $200,000\n• Total startup investment: $1,100,000\n\nRevenue Projections (Year 1)\n• Q1: $150,000\n• Q2: $275,000\n• Q3: $400,000\n• Q4: $525,000\n• Annual total: $1,350,000\n\nRisk Assessment\n\nKey Risk Factors\n• Regulatory changes and compliance requirements\n• Market competition and pricing pressures\n• Supply chain disruptions\n• Banking and financial service limitations\n\nMitigation Strategies\n• Comprehensive compliance monitoring\n• Diversified product portfolio\n• Strategic partnerships and alliances\n• Robust financial planning and reserves\n\nConclusion\n\nThis cannabis business plan template provides a foundation for developing a comprehensive strategy for entering and succeeding in the regulated cannabis industry. Regular updates and revisions should be made to reflect changing market conditions and regulatory requirements.\n\n---\nDocument prepared using Formul8 AI Cannabis Operations Platform\nFor more information: https://formul8.ai'
          }
        },
        // Professional styling
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: 34 },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 18, unit: 'PT' },
              foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.4, blue: 0.2 } } }
            },
            fields: 'bold,fontSize,foregroundColor'
          }
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: documentId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: documentId,
    url: `https://docs.google.com/document/d/${documentId}`
  };
}

async function createInventoryDashboard() {
  // Create spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Cannabis Inventory Management Dashboard - Formul8 Demo'
      },
      sheets: [
        {
          properties: {
            title: 'Current Inventory',
            gridProperties: { rowCount: 100, columnCount: 15 }
          }
        },
        {
          properties: {
            title: 'Strain Library',
            gridProperties: { rowCount: 50, columnCount: 12 }
          }
        },
        {
          properties: {
            title: 'Sales Analytics',
            gridProperties: { rowCount: 30, columnCount: 10 }
          }
        }
      ]
    }
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // Add inventory data
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Current Inventory!A1:N20',
          values: [
            ['Product ID', 'Strain Name', 'Product Type', 'Batch Number', 'Quantity (g)', 'THC %', 'CBD %', 'Harvest Date', 'Test Date', 'Status', 'Location', 'Cost per gram', 'Retail Price', 'Notes'],
            ['INV001', 'Blue Dream', 'Flower', 'BD2025001', '2540', '18.5', '0.8', '2025-06-15', '2025-06-20', 'Ready', 'Vault A-1', '$2.50', '$8.00', 'Premium quality'],
            ['INV002', 'OG Kush', 'Flower', 'OG2025002', '1875', '22.3', '0.5', '2025-06-10', '2025-06-18', 'Ready', 'Vault A-2', '$3.00', '$10.00', 'High THC strain'],
            ['INV003', 'Charlotte\'s Web', 'Flower', 'CW2025003', '1200', '0.3', '17.2', '2025-06-12', '2025-06-19', 'Ready', 'Vault B-1', '$4.00', '$12.00', 'High CBD medical'],
            ['INV004', 'Sour Diesel', 'Flower', 'SD2025004', '980', '20.1', '0.7', '2025-06-08', '2025-06-16', 'Ready', 'Vault A-3', '$2.75', '$9.00', 'Sativa dominant'],
            ['INV005', 'Purple Kush', 'Flower', 'PK2025005', '1560', '19.8', '0.6', '2025-06-14', '2025-06-21', 'Testing', 'Vault B-2', '$2.80', '$8.50', 'Indica dominant'],
            ['INV006', 'Green Crack', 'Flower', 'GC2025006', '2100', '21.4', '0.4', '2025-06-11', '2025-06-17', 'Ready', 'Vault A-4', '$2.90', '$9.50', 'Energizing sativa'],
            ['INV007', 'Granddaddy Purple', 'Flower', 'GP2025007', '1450', '17.9', '0.9', '2025-06-13', '2025-06-20', 'Ready', 'Vault B-3', '$3.20', '$10.50', 'Purple phenotype'],
            ['INV008', 'White Widow', 'Flower', 'WW2025008', '1800', '20.5', '0.8', '2025-06-09', '2025-06-18', 'Ready', 'Vault A-5', '$2.60', '$8.75', 'Balanced hybrid'],
            ['INV009', 'Amnesia Haze', 'Flower', 'AH2025009', '1320', '22.8', '0.3', '2025-06-16', '2025-06-22', 'Testing', 'Vault B-4', '$3.40', '$11.00', 'Potent sativa'],
            ['INV010', 'Bubba Kush', 'Flower', 'BK2025010', '1650', '18.2', '1.2', '2025-06-07', '2025-06-15', 'Ready', 'Vault A-6', '$2.70', '$9.25', 'Relaxing indica'],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['CONCENTRATES', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['CON001', 'Blue Dream', 'Shatter', 'BD-SH001', '125', '78.5', '2.1', '2025-06-20', '2025-06-22', 'Ready', 'Vault C-1', '$25.00', '$60.00', 'High quality extract'],
            ['CON002', 'OG Kush', 'Live Resin', 'OG-LR002', '85', '82.3', '1.8', '2025-06-18', '2025-06-21', 'Ready', 'Vault C-2', '$35.00', '$80.00', 'Premium live resin'],
            ['CON003', 'Sour Diesel', 'Wax', 'SD-WX003', '95', '75.2', '2.5', '2025-06-19', '2025-06-23', 'Testing', 'Vault C-3', '$30.00', '$70.00', 'Smooth consistency'],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['EDIBLES', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['EDI001', 'Mixed Berry', 'Gummies', 'MB-GU001', '200 units', '10mg/unit', '0mg/unit', '2025-06-25', '2025-06-26', 'Ready', 'Vault D-1', '$0.75', '$3.00', '10mg THC per gummy'],
            ['EDI002', 'Chocolate Bar', 'Chocolate', 'CB-CH002', '50 units', '100mg/unit', '0mg/unit', '2025-06-24', '2025-06-25', 'Ready', 'Vault D-2', '$5.00', '$20.00', '100mg THC per bar']
          ]
        },
        {
          range: 'Strain Library!A1:L15',
          values: [
            ['Strain Name', 'Type', 'THC Range', 'CBD Range', 'Terpene Profile', 'Effects', 'Medical Uses', 'Flowering Time', 'Yield', 'Difficulty', 'Genetics', 'Notes'],
            ['Blue Dream', 'Hybrid', '17-24%', '0.1-2%', 'Myrcene, Pinene, Caryophyllene', 'Uplifting, Creative, Relaxed', 'Pain, Depression, Nausea', '9-10 weeks', 'High', 'Easy', 'Blueberry x Haze', 'Popular balanced hybrid'],
            ['OG Kush', 'Indica', '19-26%', '0.1-0.3%', 'Limonene, Myrcene, Caryophyllene', 'Euphoric, Relaxed, Happy', 'Stress, Pain, Insomnia', '8-9 weeks', 'Medium', 'Moderate', 'Chemdawg x Lemon Thai x Pakistani', 'Classic indica strain'],
            ['Charlotte\'s Web', 'Sativa', '0.3-1%', '15-20%', 'Myrcene, Pinene, Caryophyllene', 'Clear-headed, Calm', 'Epilepsy, Anxiety, Inflammation', '9-10 weeks', 'Medium', 'Easy', 'Charlotte\'s Web phenotype', 'High CBD medical strain'],
            ['Sour Diesel', 'Sativa', '18-25%', '0.1-0.3%', 'Limonene, Caryophyllene, Myrcene', 'Energizing, Uplifting, Creative', 'Depression, Fatigue, Stress', '10-11 weeks', 'High', 'Moderate', 'Chemdawg 91 x Super Skunk', 'Potent sativa favorite'],
            ['Purple Kush', 'Indica', '17-22%', '0.1-1%', 'Myrcene, Caryophyllene, Pinene', 'Relaxed, Sleepy, Happy', 'Insomnia, Pain, Stress', '8-9 weeks', 'Medium', 'Easy', 'Purple Afghani x Hindu Kush', 'Pure indica strain'],
            ['Green Crack', 'Sativa', '19-25%', '0.1-0.2%', 'Myrcene, Caryophyllene, Pinene', 'Energetic, Focused, Uplifted', 'Depression, Fatigue, ADHD', '7-9 weeks', 'High', 'Easy', 'Skunk #1 x Unknown indica', 'Energizing daytime strain'],
            ['Granddaddy Purple', 'Indica', '17-23%', '0.1-1%', 'Myrcene, Pinene, Caryophyllene', 'Relaxed, Sleepy, Euphoric', 'Insomnia, Pain, Appetite', '8-11 weeks', 'High', 'Easy', 'Purple Urkle x Big Bud', 'Famous purple strain'],
            ['White Widow', 'Hybrid', '18-25%', '0.1-1%', 'Myrcene, Limonene, Caryophyllene', 'Energetic, Euphoric, Creative', 'Stress, Depression, Pain', '8-9 weeks', 'High', 'Moderate', 'Brazilian x South Indian', 'Balanced hybrid classic'],
            ['Amnesia Haze', 'Sativa', '20-25%', '0.1-0.2%', 'Terpinolene, Myrcene, Pinene', 'Euphoric, Creative, Energetic', 'Depression, Stress, Fatigue', '10-12 weeks', 'High', 'Difficult', 'Jamaican x Afghani x Laos', 'Potent sativa strain'],
            ['Bubba Kush', 'Indica', '15-22%', '0.1-1%', 'Myrcene, Caryophyllene, Limonene', 'Relaxed, Sleepy, Happy', 'Insomnia, Pain, Stress', '8-9 weeks', 'Medium', 'Easy', 'Bubble Gum x Kush', 'Potent indica strain']
          ]
        },
        {
          range: 'Sales Analytics!A1:J10',
          values: [
            ['Date', 'Product Category', 'Units Sold', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Customer Type', 'Location', 'Notes'],
            ['2025-07-01', 'Flower', '245', '$1,960', '$612', '$1,348', '68.8%', 'Retail', 'Dispensary A', 'Strong flower sales'],
            ['2025-07-01', 'Concentrates', '18', '$1,260', '$450', '$810', '64.3%', 'Retail', 'Dispensary B', 'Premium concentrates'],
            ['2025-07-01', 'Edibles', '32', '$640', '$240', '$400', '62.5%', 'Retail', 'Dispensary A', 'Gummy sales strong'],
            ['2025-07-02', 'Flower', '198', '$1,584', '$495', '$1,089', '68.8%', 'Retail', 'Dispensary C', 'Weekend sales'],
            ['2025-07-02', 'Concentrates', '22', '$1,540', '$550', '$990', '64.3%', 'Wholesale', 'Processor X', 'Bulk concentrate order'],
            ['2025-07-02', 'Edibles', '28', '$560', '$210', '$350', '62.5%', 'Retail', 'Dispensary B', 'Chocolate bar sales'],
            ['2025-07-03', 'Flower', '312', '$2,496', '$780', '$1,716', '68.8%', 'Wholesale', 'Distributor Y', 'Large wholesale order'],
            ['2025-07-03', 'Concentrates', '15', '$1,050', '$375', '$675', '64.3%', 'Retail', 'Dispensary A', 'Live resin popular']
          ]
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

async function createTestingProtocol() {
  // Create document
  const doc = await docs.documents.create({
    requestBody: {
      title: 'Cannabis Testing Protocol - Formul8 Demo'
    }
  });

  const documentId = doc.data.documentId;

  // Add testing protocol content
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: 'CANNABIS TESTING PROTOCOL\n\nDocument Control\nDocument ID: CTP-2025-001\nVersion: 1.0\nEffective Date: July 14, 2025\nNext Review: January 14, 2026\nApproved By: Quality Control Manager\n\nPurpose and Scope\n\nThis protocol establishes standardized procedures for cannabis testing to ensure product safety, potency, and compliance with regulatory requirements. All cannabis products must undergo comprehensive testing before release to market.\n\nTesting Requirements\n\nMandatory Tests\n□ Cannabinoid Profile Analysis\n□ Terpene Profile Analysis\n□ Residual Solvents Testing\n□ Pesticide Screening\n□ Heavy Metals Analysis\n□ Microbial Testing\n□ Moisture Content Analysis\n□ Foreign Matter Inspection\n\nSample Collection Procedures\n\nSampling Protocol\n1. Use sterile collection tools and containers\n2. Collect representative samples from multiple locations\n3. Minimum sample size: 0.5g for flower, 1g for concentrates\n4. Label samples with batch number, date, and collector initials\n5. Store samples at appropriate temperature until testing\n6. Maintain chain of custody documentation\n\nSample Storage\n• Flower samples: Store at room temperature in sealed containers\n• Concentrate samples: Store refrigerated at 2-8°C\n• Edible samples: Store according to product specifications\n• Maximum storage time: 30 days before testing\n\nCannabinoid Analysis\n\nTarget Cannabinoids\n• THC (Delta-9-tetrahydrocannabinol)\n• THCA (Tetrahydrocannabinolic acid)\n• CBD (Cannabidiol)\n• CBDA (Cannabidiolic acid)\n• CBG (Cannabigerol)\n• CBN (Cannabinol)\n• CBC (Cannabichromene)\n\nAcceptable Limits\n• THC: <0.3% for hemp products, variable for cannabis\n• Total THC: THCA × 0.877 + THC\n• Total CBD: CBDA × 0.877 + CBD\n• Measurement uncertainty: ±10%\n\nTerpene Analysis\n\nTarget Terpenes\n• Myrcene\n• Limonene\n• Pinene (α and β)\n• Caryophyllene\n• Linalool\n• Humulene\n• Terpinolene\n• Ocimene\n• Bisabolol\n• Camphene\n\nContaminant Testing\n\nPesticide Screening\n• Test for over 60 pesticides including:\n  - Abamectin\n  - Bifenthrin\n  - Carbaryl\n  - Chlorpyrifos\n  - Diazinon\n  - Malathion\n  - Permethrin\n• Action levels as defined by state regulations\n• Method: LC-MS/MS and GC-MS/MS\n\nHeavy Metals\n• Arsenic: <1.5 ppm\n• Cadmium: <0.5 ppm\n• Lead: <0.5 ppm\n• Mercury: <0.1 ppm\n• Method: ICP-MS\n\nMicrobial Testing\n• Total Yeast and Mold: <10,000 CFU/g\n• Total Aerobic Bacteria: <100,000 CFU/g\n• Coliforms: <1,000 CFU/g\n• E. coli: <100 CFU/g\n• Salmonella: Not detected\n• Method: Plate count and PCR\n\nResidual Solvents\n• Ethanol: <500 ppm\n• Isopropanol: <500 ppm\n• Acetone: <500 ppm\n• Butane: <500 ppm\n• Hexane: <30 ppm\n• Benzene: <0.5 ppm\n• Method: GC-MS\n\nQuality Control\n\nLaboratory Requirements\n• ISO 17025 accreditation preferred\n• State-licensed testing facility\n• Proficiency testing participation\n• Certificate of Analysis (COA) required\n• Turnaround time: 5-7 business days\n\nResult Interpretation\n• Pass/Fail determination based on regulatory limits\n• Retesting required for failed samples\n• Batch rejection for safety failures\n• Documentation of all results\n\nRecord Keeping\n\nRequired Documentation\n• Chain of custody forms\n• Sample collection logs\n• Laboratory certificates of analysis\n• Batch testing records\n• Corrective action reports\n• Retention period: 3 years minimum\n\nReporting\n• Weekly testing summary reports\n• Monthly quality trends analysis\n• Immediate notification of failures\n• Regulatory reporting as required\n\nTraining and Competency\n\nStaff Requirements\n• Cannabis testing training completion\n• Annual competency assessment\n• Documentation of training records\n• Continuing education requirements\n\nApproval and Revision\n\nThis protocol is subject to annual review and revision based on:\n• Regulatory changes\n• Industry best practices\n• Laboratory capabilities\n• Quality system improvements\n\n---\nDocument prepared using Formul8 AI Cannabis Operations Platform\nFor more information: https://formul8.ai'
          }
        },
        // Professional styling
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: 28 },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 18, unit: 'PT' },
              foregroundColor: { color: { rgbColor: { red: 0.1, green: 0.3, blue: 0.6 } } }
            },
            fields: 'bold,fontSize,foregroundColor'
          }
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: documentId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: documentId,
    url: `https://docs.google.com/document/d/${documentId}`
  };
}

async function createMarketingCampaignTracker() {
  // Create spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Cannabis Marketing Campaign Tracker - Formul8 Demo'
      },
      sheets: [
        {
          properties: {
            title: 'Campaign Overview',
            gridProperties: { rowCount: 50, columnCount: 12 }
          }
        },
        {
          properties: {
            title: 'Platform Performance',
            gridProperties: { rowCount: 30, columnCount: 15 }
          }
        },
        {
          properties: {
            title: 'Budget Tracking',
            gridProperties: { rowCount: 25, columnCount: 10 }
          }
        }
      ]
    }
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // Add marketing campaign data
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Campaign Overview!A1:L20',
          values: [
            ['Campaign ID', 'Campaign Name', 'Platform', 'Start Date', 'End Date', 'Status', 'Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'Conversions'],
            ['CAM001', 'Summer Flower Festival', 'Weedmaps', '2025-07-01', '2025-07-31', 'Active', '$5,000', '$2,350', '125,000', '3,875', '3.1%', '42'],
            ['CAM002', 'Premium Concentrates Launch', 'Leafly', '2025-07-05', '2025-07-25', 'Active', '$3,500', '$1,890', '85,000', '2,550', '3.0%', '31'],
            ['CAM003', 'Medical Monday Deals', 'Instagram', '2025-07-01', '2025-07-31', 'Active', '$2,000', '$1,200', '45,000', '1,125', '2.5%', '18'],
            ['CAM004', 'New Patient Welcome', 'Facebook', '2025-07-01', '2025-07-31', 'Active', '$1,500', '$890', '32,000', '640', '2.0%', '12'],
            ['CAM005', 'Terpene Education Series', 'YouTube', '2025-07-10', '2025-08-10', 'Active', '$4,000', '$1,600', '75,000', '2,250', '3.0%', '28'],
            ['CAM006', 'Wellness Wednesday', 'TikTok', '2025-07-01', '2025-07-31', 'Active', '$2,500', '$1,450', '95,000', '1,900', '2.0%', '22'],
            ['CAM007', 'Harvest Season Specials', 'Google Ads', '2025-07-15', '2025-08-15', 'Planned', '$6,000', '$0', '0', '0', '0%', '0'],
            ['CAM008', 'Veteran Discount Program', 'Local Radio', '2025-07-01', '2025-07-31', 'Active', '$3,000', '$1,800', '50,000', '500', '1.0%', '15'],
            ['CAM009', 'Cannabis & Wellness Expo', 'Event Sponsorship', '2025-07-20', '2025-07-22', 'Planned', '$8,000', '$4,000', '15,000', '450', '3.0%', '0'],
            ['CAM010', 'Back to School Safety', 'Billboard', '2025-08-01', '2025-08-31', 'Planned', '$5,500', '$0', '0', '0', '0%', '0'],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['TOTALS', '', '', '', '', '', '$41,000', '$15,180', '522,000', '13,290', '2.5%', '168']
          ]
        },
        {
          range: 'Platform Performance!A1:O15',
          values: [
            ['Platform', 'Campaigns', 'Total Budget', 'Spent', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'CPA', 'ROAS', 'Compliant', 'Restrictions', 'Performance', 'Notes'],
            ['Weedmaps', '1', '$5,000', '$2,350', '125,000', '3,875', '3.1%', '$0.61', '42', '$55.95', '4.2x', 'Yes', 'None', 'Excellent', 'Best performing platform'],
            ['Leafly', '1', '$3,500', '$1,890', '85,000', '2,550', '3.0%', '$0.74', '31', '$60.97', '3.8x', 'Yes', 'Medical focus', 'Good', 'Strong medical audience'],
            ['Instagram', '1', '$2,000', '$1,200', '45,000', '1,125', '2.5%', '$1.07', '18', '$66.67', '3.5x', 'Partial', 'Lifestyle only', 'Good', 'Creative content performs well'],
            ['Facebook', '1', '$1,500', '$890', '32,000', '640', '2.0%', '$1.39', '12', '$74.17', '3.2x', 'Partial', 'Wellness angle', 'Fair', 'Limited reach due to restrictions'],
            ['YouTube', '1', '$4,000', '$1,600', '75,000', '2,250', '3.0%', '$0.71', '28', '$57.14', '4.0x', 'Yes', 'Educational', 'Good', 'Educational content allowed'],
            ['TikTok', '1', '$2,500', '$1,450', '95,000', '1,900', '2.0%', '$0.76', '22', '$65.91', '3.6x', 'Limited', 'Lifestyle only', 'Good', 'Young demographic'],
            ['Google Ads', '1', '$6,000', '$0', '0', '0', '0%', '$0', '0', '$0', '0x', 'No', 'Cannabis prohibited', 'N/A', 'Campaign not launched'],
            ['Local Radio', '1', '$3,000', '$1,800', '50,000', '500', '1.0%', '$3.60', '15', '$120.00', '2.5x', 'Yes', 'Time restrictions', 'Fair', 'Brand awareness focus'],
            ['Event Sponsorship', '1', '$8,000', '$4,000', '15,000', '450', '3.0%', '$8.89', '0', '$0', '0x', 'Yes', 'None', 'Pending', 'Event not yet occurred'],
            ['Billboard', '1', '$5,500', '$0', '0', '0', '0%', '$0', '0', '$0', '0x', 'Yes', 'Location limits', 'N/A', 'Campaign not launched'],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['TOTALS', '10', '$41,000', '$15,180', '522,000', '13,290', '2.5%', '$1.14', '168', '$90.36', '3.6x', '', '', '', 'Overall performance good']
          ]
        },
        {
          range: 'Budget Tracking!A1:J15',
          values: [
            ['Month', 'Allocated Budget', 'Spent', 'Remaining', 'Variance', 'Campaigns Active', 'New Customers', 'Customer Acquisition Cost', 'Revenue Generated', 'ROI'],
            ['January 2025', '$15,000', '$14,200', '$800', '5.3%', '8', '156', '$91.03', '$52,000', '3.66x'],
            ['February 2025', '$18,000', '$16,800', '$1,200', '6.7%', '9', '189', '$88.89', '$67,500', '4.02x'],
            ['March 2025', '$20,000', '$19,100', '$900', '4.5%', '10', '210', '$90.95', '$78,000', '4.08x'],
            ['April 2025', '$22,000', '$20,850', '$1,150', '5.2%', '11', '245', '$85.10', '$89,250', '4.28x'],
            ['May 2025', '$25,000', '$23,400', '$1,600', '6.4%', '12', '280', '$83.57', '$105,000', '4.49x'],
            ['June 2025', '$28,000', '$26,200', '$1,800', '6.4%', '13', '315', '$83.17', '$118,000', '4.50x'],
            ['July 2025', '$30,000', '$15,180', '$14,820', '49.4%', '10', '168', '$90.36', '$60,480', '3.99x'],
            ['August 2025', '$32,000', '$0', '$32,000', '100%', '0', '0', '$0', '$0', '0x'],
            ['September 2025', '$35,000', '$0', '$35,000', '100%', '0', '0', '$0', '$0', '0x'],
            ['October 2025', '$38,000', '$0', '$38,000', '100%', '0', '0', '$0', '$0', '0x'],
            ['November 2025', '$40,000', '$0', '$40,000', '100%', '0', '0', '$0', '$0', '0x'],
            ['December 2025', '$42,000', '$0', '$42,000', '100%', '0', '0', '$0', '$0', '0x'],
            ['', '', '', '', '', '', '', '', '', ''],
            ['TOTALS', '$345,000', '$135,730', '$209,270', '60.7%', '73', '1,563', '$86.83', '$570,230', '4.20x']
          ]
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

async function createStrainDatabase() {
  // Create spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Cannabis Strain Database - Formul8 Demo'
      },
      sheets: [
        {
          properties: {
            title: 'Strain Profiles',
            gridProperties: { rowCount: 100, columnCount: 18 }
          }
        },
        {
          properties: {
            title: 'Terpene Data',
            gridProperties: { rowCount: 50, columnCount: 12 }
          }
        },
        {
          properties: {
            title: 'Breeding Records',
            gridProperties: { rowCount: 30, columnCount: 10 }
          }
        }
      ]
    }
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // Add comprehensive strain data
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Strain Profiles!A1:R30',
          values: [
            ['Strain Name', 'Type', 'Genetics', 'THC Min', 'THC Max', 'CBD Min', 'CBD Max', 'Dominant Terpene', 'Effects', 'Medical Uses', 'Flowering Time', 'Yield', 'Difficulty', 'Height', 'Aroma', 'Flavor', 'Awards', 'Notes'],
            ['Blue Dream', 'Sativa Hybrid', 'Blueberry x Haze', '17%', '24%', '0.1%', '2%', 'Myrcene', 'Uplifting, Creative, Relaxed', 'Pain, Depression, Nausea', '9-10 weeks', 'High', 'Easy', 'Medium-Tall', 'Berry, Sweet, Herbal', 'Blueberry, Vanilla, Herbal', 'High Times Top 10', 'Most popular strain in California'],
            ['OG Kush', 'Indica Hybrid', 'Chemdawg x Lemon Thai x Pakistani', '19%', '26%', '0.1%', '0.3%', 'Limonene', 'Euphoric, Relaxed, Happy', 'Stress, Pain, Insomnia', '8-9 weeks', 'Medium', 'Moderate', 'Short-Medium', 'Lemon, Pine, Earthy', 'Citrus, Pine, Spicy', 'Cannabis Cup Winner', 'Foundation of many modern strains'],
            ['Sour Diesel', 'Sativa', 'Chemdawg 91 x Super Skunk', '18%', '25%', '0.1%', '0.3%', 'Limonene', 'Energizing, Uplifting, Creative', 'Depression, Fatigue, Stress', '10-11 weeks', 'High', 'Moderate', 'Tall', 'Diesel, Citrus, Pungent', 'Sour, Diesel, Citrus', 'Multiple Awards', 'East Coast favorite'],
            ['White Widow', 'Balanced Hybrid', 'Brazilian x South Indian', '18%', '25%', '0.1%', '1%', 'Myrcene', 'Energetic, Euphoric, Creative', 'Stress, Depression, Pain', '8-9 weeks', 'High', 'Moderate', 'Medium', 'Woody, Spicy, Earthy', 'Woody, Spicy, Sweet', 'Cannabis Cup Winner', 'Classic Amsterdam coffee shop strain'],
            ['Green Crack', 'Sativa', 'Skunk #1 x Unknown Indica', '19%', '25%', '0.1%', '0.2%', 'Myrcene', 'Energetic, Focused, Uplifted', 'Depression, Fatigue, ADHD', '7-9 weeks', 'High', 'Easy', 'Medium-Tall', 'Citrus, Sweet, Earthy', 'Mango, Citrus, Sweet', 'Leafly Strain of Year', 'Renamed by Snoop Dogg'],
            ['Granddaddy Purple', 'Indica', 'Purple Urkle x Big Bud', '17%', '23%', '0.1%', '1%', 'Myrcene', 'Relaxed, Sleepy, Euphoric', 'Insomnia, Pain, Appetite', '8-11 weeks', 'High', 'Easy', 'Medium', 'Grape, Berry, Sweet', 'Grape, Berry, Sweet', 'High Times Top Strain', 'Famous for purple coloration'],
            ['Jack Herer', 'Sativa Hybrid', 'Haze x Northern Lights #5 x Shiva Skunk', '18%', '24%', '0.1%', '0.3%', 'Terpinolene', 'Energetic, Creative, Euphoric', 'Stress, Depression, Fatigue', '8-10 weeks', 'High', 'Moderate', 'Tall', 'Pine, Spicy, Woody', 'Pine, Spicy, Earthy', 'Cannabis Cup Winner', 'Named after cannabis activist'],
            ['Purple Kush', 'Indica', 'Purple Afghani x Hindu Kush', '17%', '22%', '0.1%', '1%', 'Myrcene', 'Relaxed, Sleepy, Happy', 'Insomnia, Pain, Stress', '8-9 weeks', 'Medium', 'Easy', 'Short', 'Grape, Earthy, Sweet', 'Grape, Earthy, Sweet', 'Cannabis Cup Winner', 'Pure indica landrace hybrid'],
            ['Amnesia Haze', 'Sativa', 'Jamaican x Afghani x Laos', '20%', '25%', '0.1%', '0.2%', 'Terpinolene', 'Euphoric, Creative, Energetic', 'Depression, Stress, Fatigue', '10-12 weeks', 'High', 'Difficult', 'Very Tall', 'Citrus, Earthy, Woody', 'Lemon, Earthy, Spicy', 'Cannabis Cup Winner', 'Potent sativa, longer flowering'],
            ['Bubba Kush', 'Indica', 'Bubble Gum x Kush', '15%', '22%', '0.1%', '1%', 'Myrcene', 'Relaxed, Sleepy, Happy', 'Insomnia, Pain, Stress', '8-9 weeks', 'Medium', 'Easy', 'Short', 'Earthy, Sweet, Pungent', 'Earthy, Sweet, Coffee', 'Multiple Awards', 'Stocky indica, great for SOG'],
            ['Girl Scout Cookies', 'Indica Hybrid', 'Durban Poison x OG Kush', '19%', '28%', '0.1%', '0.2%', 'Caryophyllene', 'Euphoric, Relaxed, Happy', 'Appetite, Pain, Nausea', '9-10 weeks', 'Medium', 'Moderate', 'Medium', 'Sweet, Earthy, Pungent', 'Sweet, Mint, Cherry', 'Cannabis Cup Winner', 'Also known as GSC'],
            ['Pineapple Express', 'Sativa Hybrid', 'Trainwreck x Hawaiian', '18%', '25%', '0.1%', '0.3%', 'Caryophyllene', 'Energetic, Creative, Euphoric', 'Depression, Stress, Fatigue', '8-9 weeks', 'High', 'Easy', 'Medium', 'Pineapple, Citrus, Cedar', 'Pineapple, Citrus, Pine', 'Featured in film', 'Made famous by movie'],
            ['Northern Lights', 'Indica', 'Afghani x Thai', '16%', '21%', '0.1%', '0.3%', 'Myrcene', 'Relaxed, Sleepy, Happy', 'Insomnia, Pain, Stress', '6-8 weeks', 'High', 'Easy', 'Short', 'Sweet, Spicy, Earthy', 'Sweet, Spicy, Earthy', 'Cannabis Cup Winner', 'Fast flowering indica'],
            ['Durban Poison', 'Sativa', 'African Landrace', '15%', '25%', '0.1%', '0.2%', 'Terpinolene', 'Energetic, Creative, Uplifted', 'Depression, Fatigue, Stress', '8-9 weeks', 'High', 'Easy', 'Tall', 'Sweet, Earthy, Pine', 'Sweet, Licorice, Pine', 'Landrace strain', 'Pure African sativa'],
            ['Zkittlez', 'Indica Hybrid', 'Grape Ape x Grapefruit', '18%', '24%', '0.1%', '1%', 'Limonene', 'Relaxed, Happy, Euphoric', 'Stress, Depression, Pain', '8-9 weeks', 'Medium', 'Easy', 'Medium', 'Fruity, Sweet, Tropical', 'Fruity, Sweet, Grape', 'Cannabis Cup Winner', 'Candy-like flavor profile'],
            ['Gelato', 'Indica Hybrid', 'Sunset Sherbet x Thin Mint GSC', '20%', '26%', '0.1%', '0.3%', 'Limonene', 'Euphoric, Creative, Relaxed', 'Stress, Depression, Pain', '8-9 weeks', 'Medium', 'Moderate', 'Medium', 'Sweet, Citrus, Lavender', 'Sweet, Citrus, Berry', 'Multiple Awards', 'Dessert strain category'],
            ['Wedding Cake', 'Indica Hybrid', 'Triangle Kush x Animal Mints', '22%', '27%', '0.1%', '0.2%', 'Limonene', 'Relaxed, Happy, Euphoric', 'Stress, Appetite, Pain', '8-9 weeks', 'High', 'Moderate', 'Medium', 'Sweet, Earthy, Vanilla', 'Sweet, Vanilla, Tangy', 'High Times Strain', 'Also known as Pink Cookies'],
            ['Runtz', 'Balanced Hybrid', 'Zkittlez x Gelato', '19%', '29%', '0.1%', '0.3%', 'Limonene', 'Euphoric, Creative, Relaxed', 'Stress, Anxiety, Depression', '8-9 weeks', 'Medium', 'Moderate', 'Medium', 'Fruity, Sweet, Tropical', 'Fruity, Sweet, Candy', 'Leafly Strain of Year', 'Candy-colored buds'],
            ['Godfather OG', 'Indica', 'Alpha OG x XXX OG', '25%', '34%', '0.1%', '0.2%', 'Myrcene', 'Relaxed, Sleepy, Euphoric', 'Insomnia, Pain, Stress', '8-9 weeks', 'High', 'Difficult', 'Medium', 'Grape, Pine, Earthy', 'Grape, Pine, Herbal', 'High THC strain', 'One of the strongest strains'],
            ['Strawberry Cough', 'Sativa', 'Strawberry Fields x Haze', '15%', '20%', '0.1%', '0.3%', 'Myrcene', 'Energetic, Creative, Euphoric', 'Stress, Depression, Fatigue', '9-10 weeks', 'Medium', 'Easy', 'Medium-Tall', 'Strawberry, Sweet, Earthy', 'Strawberry, Sweet, Berry', 'Cannabis Cup Winner', 'Distinctive strawberry flavor'],
            ['Gorilla Glue #4', 'Indica Hybrid', 'Chem Sister x Sour Dubb x Chocolate Diesel', '25%', '30%', '0.1%', '0.2%', 'Caryophyllene', 'Relaxed, Euphoric, Happy', 'Stress, Depression, Pain', '8-9 weeks', 'High', 'Moderate', 'Medium', 'Sour, Earthy, Pungent', 'Sour, Earthy, Pine', 'Cannabis Cup Winner', 'Extremely sticky resin'],
            ['Lemon Haze', 'Sativa Hybrid', 'Silver Haze x Lemon Skunk', '17%', '25%', '0.1%', '0.3%', 'Limonene', 'Energetic, Creative, Uplifted', 'Depression, Stress, Fatigue', '8-10 weeks', 'High', 'Moderate', 'Tall', 'Lemon, Citrus, Sweet', 'Lemon, Citrus, Sweet', 'Cannabis Cup Winner', 'Strong lemon scent'],
            ['Trainwreck', 'Sativa Hybrid', 'Mexican x Thai x Afghani', '18%', '25%', '0.1%', '0.3%', 'Terpinolene', 'Energetic, Creative, Euphoric', 'Depression, Stress, ADHD', '8-10 weeks', 'High', 'Moderate', 'Tall', 'Lemon, Pine, Earthy', 'Lemon, Pine, Spicy', 'Multiple Awards', 'Legendary California strain'],
            ['Cheese', 'Indica Hybrid', 'Skunk #1 phenotype', '15%', '20%', '0.1%', '1%', 'Myrcene', 'Relaxed, Happy, Euphoric', 'Stress, Pain, Insomnia', '8-9 weeks', 'Medium', 'Easy', 'Medium', 'Cheese, Earthy, Pungent', 'Cheese, Earthy, Skunk', 'UK Cannabis Cup', 'Distinctive cheese aroma'],
            ['Blueberry', 'Indica', 'Afghani x Thai x Purple Thai', '16%', '24%', '0.1%', '0.3%', 'Myrcene', 'Relaxed, Happy, Euphoric', 'Stress, Pain, Insomnia', '7-9 weeks', 'Medium', 'Easy', 'Short', 'Blueberry, Sweet, Fruity', 'Blueberry, Sweet, Vanilla', 'Cannabis Cup Winner', 'DJ Short creation'],
            ['Super Silver Haze', 'Sativa', 'Skunk #1 x Northern Lights x Haze', '18%', '23%', '0.1%', '0.3%', 'Terpinolene', 'Energetic, Creative, Euphoric', 'Depression, Stress, Fatigue', '9-11 weeks', 'High', 'Moderate', 'Tall', 'Citrus, Earthy, Sweet', 'Citrus, Spicy, Sweet', 'Multiple Cannabis Cups', 'Green House Seeds creation'],
            ['AK-47', 'Sativa Hybrid', 'Colombian x Mexican x Thai x Afghani', '17%', '25%', '0.1%', '0.3%', 'Terpinolene', 'Energetic, Creative, Relaxed', 'Stress, Depression, Pain', '8-9 weeks', 'High', 'Easy', 'Medium', 'Sour, Earthy, Sweet', 'Sour, Earthy, Floral', 'Cannabis Cup Winner', 'Serious Seeds classic'],
            ['Skunk #1', 'Indica Hybrid', 'Afghani x Acapulco Gold x Colombian Gold', '15%', '19%', '0.1%', '0.3%', 'Myrcene', 'Relaxed, Happy, Euphoric', 'Stress, Pain, Depression', '8-9 weeks', 'High', 'Easy', 'Medium', 'Skunk, Earthy, Sweet', 'Skunk, Earthy, Sweet', 'Cannabis Cup Winner', 'Foundation strain of many hybrids']
          ]
        },
        {
          range: 'Terpene Data!A1:L25',
          values: [
            ['Terpene', 'Aroma', 'Flavor', 'Effects', 'Boiling Point', 'Also Found In', 'Medical Properties', 'Common Strains', 'Concentration Range', 'Synergy With', 'Stability', 'Notes'],
            ['Myrcene', 'Earthy, Musky', 'Herbal, Spicy', 'Sedating, Relaxing', '166.7°C', 'Mangoes, Hops, Thyme', 'Muscle relaxant, Sedative', 'Blue Dream, OG Kush, Granddaddy Purple', '0.1-3.0%', 'THC, CBD', 'Moderate', 'Most abundant terpene in cannabis'],
            ['Limonene', 'Citrus, Fresh', 'Lemon, Orange', 'Uplifting, Anti-anxiety', '176°C', 'Citrus peels, Juniper', 'Antidepressant, Anxiolytic', 'Sour Diesel, White Widow, Zkittlez', '0.1-2.5%', 'THC, Linalool', 'High', 'Second most abundant terpene'],
            ['Pinene', 'Pine, Fresh', 'Pine, Woody', 'Alertness, Memory', '155°C', 'Pine needles, Rosemary', 'Bronchodilator, Memory aid', 'Jack Herer, Strawberry Cough, Cheese', '0.1-1.5%', 'THC, CBD', 'High', 'Most common terpene in nature'],
            ['Caryophyllene', 'Spicy, Woody', 'Pepper, Clove', 'Anti-inflammatory', '264°C', 'Black pepper, Cloves', 'Anti-inflammatory, Analgesic', 'Girl Scout Cookies, Gorilla Glue #4', '0.1-2.0%', 'CBD, THC', 'Very High', 'Only terpene that binds to CB2 receptors'],
            ['Linalool', 'Floral, Lavender', 'Floral, Sweet', 'Calming, Sedating', '198°C', 'Lavender, Coriander', 'Anxiolytic, Sedative', 'Amnesia Haze, Gelato, Runtz', '0.1-1.0%', 'THC, CBD', 'Low', 'Commonly destroyed during combustion'],
            ['Humulene', 'Woody, Earthy', 'Hoppy, Woody', 'Appetite suppressant', '198°C', 'Hops, Coriander', 'Anti-inflammatory, Appetite suppressant', 'White Widow, Headband, Sour Diesel', '0.1-1.2%', 'Caryophyllene', 'Moderate', 'Gives beer its hoppy aroma'],
            ['Terpinolene', 'Fresh, Piney', 'Floral, Herbal', 'Sedating, Antioxidant', '186°C', 'Nutmeg, Tea tree', 'Antioxidant, Sedative', 'Jack Herer, Amnesia Haze, Durban Poison', '0.1-1.8%', 'THC, Myrcene', 'Low', 'Less common but distinctive'],
            ['Ocimene', 'Sweet, Herbal', 'Woody, Fruity', 'Antiviral, Decongestant', '176°C', 'Mint, Parsley, Orchids', 'Antiviral, Antiseptic', 'Green Crack, Clementine, Sour Diesel', '0.1-1.5%', 'Limonene', 'Low', 'Contributes to uplifting effects'],
            ['Bisabolol', 'Floral, Sweet', 'Chamomile, Honey', 'Anti-inflammatory', '153°C', 'Chamomile, Candeia tree', 'Anti-inflammatory, Antimicrobial', 'Headband, Harle-Tsu, Pink Kush', '0.1-0.8%', 'CBD, Linalool', 'Low', 'Rare but therapeutically valuable'],
            ['Camphene', 'Woody, Piney', 'Herbal, Earthy', 'Antioxidant, Antimicrobial', '160°C', 'Cypress, Camphor', 'Antioxidant, Antimicrobial', 'Mendocino Purps, Strawberry Banana', '0.1-0.5%', 'Pinene', 'Moderate', 'Usually found in small amounts']
          ]
        },
        {
          range: 'Breeding Records!A1:J15',
          values: [
            ['Cross ID', 'Parent 1', 'Parent 2', 'Generation', 'Seeds Produced', 'Germination Rate', 'Phenotypes', 'Selection Criteria', 'Breeding Goal', 'Notes'],
            ['BR001', 'Blue Dream', 'OG Kush', 'F1', '200', '85%', '8', 'High THC, Blue Dream flavor', 'Combine potency with flavor', 'Promising phenotype #3 selected'],
            ['BR002', 'White Widow', 'Northern Lights', 'F1', '150', '90%', '6', 'Fast flowering, high yield', 'Reduce flowering time', 'Phenotype #2 shows 7-week flowering'],
            ['BR003', 'Sour Diesel', 'Granddaddy Purple', 'F1', '180', '78%', '10', 'Purple coloration, sour taste', 'Purple sativa hybrid', 'Unusual purple sativa achieved'],
            ['BR004', 'Girl Scout Cookies', 'Gelato', 'F1', '120', '88%', '7', 'Dessert flavors, high THC', 'Enhanced flavor profile', 'Exceptional terpene production'],
            ['BR005', 'Jack Herer', 'Amnesia Haze', 'F1', '160', '82%', '9', 'Energetic effects, high yield', 'Combine best sativa traits', 'Very tall plants, support needed'],
            ['BR006', 'Bubba Kush', 'Cheese', 'F1', '140', '92%', '5', 'Unique aroma, potent effects', 'Novel flavor combination', 'Interesting cheese-kush blend'],
            ['BR007', 'Trainwreck', 'Pineapple Express', 'F1', '190', '86%', '8', 'Tropical flavors, cerebral high', 'Tropical sativa hybrid', 'Excellent pineapple expression'],
            ['BR008', 'Gorilla Glue #4', 'Wedding Cake', 'F1', '110', '89%', '6', 'Extreme resin, sweet flavor', 'Maximum resin production', 'Incredibly sticky, handle with care'],
            ['BR009', 'Zkittlez', 'Runtz', 'F1', '130', '91%', '7', 'Candy flavors, bag appeal', 'Candy strain improvement', 'Vibrant colors, excellent bag appeal'],
            ['BR010', 'Durban Poison', 'Super Silver Haze', 'F1', '170', '84%', '9', 'Pure sativa, long flowering', 'Landrace sativa hybrid', 'Extended flowering but worth it']
          ]
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

async function createTrainingManual() {
  // Create document
  const doc = await docs.documents.create({
    requestBody: {
      title: 'Cannabis Employee Training Manual - Formul8 Demo'
    }
  });

  const documentId = doc.data.documentId;

  // Add comprehensive training content
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: 'CANNABIS EMPLOYEE TRAINING MANUAL\n\nTable of Contents\n\n1. Introduction to Cannabis Industry\n2. Legal and Regulatory Framework\n3. Product Knowledge and Education\n4. Safety and Security Protocols\n5. Customer Service Excellence\n6. Inventory Management\n7. Quality Control Procedures\n8. Emergency Procedures\n9. Continuing Education\n10. Appendices\n\nChapter 1: Introduction to Cannabis Industry\n\nWelcome to the Cannabis Industry\nWelcome to our cannabis operation. As a team member, you are now part of a rapidly growing, highly regulated industry that serves both medical patients and adult recreational consumers. This manual will provide you with essential knowledge to perform your duties safely, legally, and professionally.\n\nIndustry Overview\nThe legal cannabis industry has experienced unprecedented growth, with increasing acceptance and legalization across multiple jurisdictions. Our operation is committed to:\n• Compliance with all applicable laws and regulations\n• Providing safe, tested, high-quality products\n• Exceptional customer service and education\n• Maintaining the highest safety and security standards\n\nCompany Mission and Values\nOur mission is to provide premium cannabis products while maintaining the highest standards of safety, quality, and compliance. We are committed to:\n• Patient and customer wellness\n• Product quality and consistency\n• Regulatory compliance\n• Community responsibility\n• Employee safety and development\n\nChapter 2: Legal and Regulatory Framework\n\nFederal vs. State Laws\nCannabis remains federally illegal under the Controlled Substances Act. However, individual states have implemented their own legal frameworks for medical and/or recreational cannabis. Our operation must comply with:\n• State cannabis regulations\n• Local municipal ordinances\n• Federal banking and tax laws\n• Employment and safety regulations\n\nLicensing Requirements\nAll cannabis operations must maintain proper licensing:\n• Cultivation licenses\n• Manufacturing licenses\n• Distribution licenses\n• Retail licenses\n• Laboratory testing licenses\n\nKey Compliance Areas\n□ Seed-to-sale tracking\n□ Product testing requirements\n□ Packaging and labeling standards\n□ Security and surveillance\n□ Inventory management\n□ Financial record keeping\n□ Employee background checks\n□ Age verification procedures\n\nChapter 3: Product Knowledge and Education\n\nCannabis Plant Biology\nCannabis sativa L. is a complex plant containing over 100 cannabinoids and 200+ terpenes. Understanding plant biology is essential for:\n• Product selection and recommendations\n• Quality assessment\n• Customer education\n• Inventory management\n\nCannabinoids\nPrimary cannabinoids include:\n• THC (Delta-9-tetrahydrocannabinol): Psychoactive, euphoric effects\n• CBD (Cannabidiol): Non-psychoactive, therapeutic benefits\n• CBG (Cannabigerol): Minor cannabinoid, potential benefits\n• CBN (Cannabinol): Degradation product, sedating effects\n• CBC (Cannabichromene): Minor cannabinoid, anti-inflammatory\n\nTerpenes\nTerpenes contribute to aroma, flavor, and effects:\n• Myrcene: Sedating, muscle relaxant\n• Limonene: Uplifting, anti-anxiety\n• Pinene: Alertness, memory retention\n• Caryophyllene: Anti-inflammatory, pain relief\n• Linalool: Calming, anti-anxiety\n\nProduct Categories\n\nFlower Products\n• Indoor, outdoor, and greenhouse cultivation\n• Indica, sativa, and hybrid varieties\n• THC and CBD dominant strains\n• Packaging in various sizes (1g, 3.5g, 7g, 14g, 28g)\n\nConcentrates\n• Extraction methods: CO2, hydrocarbon, rosin\n• Product types: shatter, wax, live resin, distillate\n• Potency ranges: 60-90% cannabinoids\n• Consumption methods: vaporization, dabbing\n\nEdibles\n• Onset time: 30 minutes to 2 hours\n• Duration: 4-8 hours\n• Dosage guidelines: Start low, go slow\n• Product types: gummies, chocolates, beverages\n\nTopicals\n• Non-psychoactive application\n• Localized relief\n• Product types: lotions, balms, patches\n• CBD and THC formulations\n\nChapter 4: Safety and Security Protocols\n\nPersonal Safety\n• Proper lifting techniques\n• Chemical handling procedures\n• Personal protective equipment (PPE)\n• Emergency contact information\n• Incident reporting procedures\n\nFacility Security\n• Access control systems\n• Surveillance requirements\n• Alarm systems\n• Cash handling procedures\n• Product security measures\n\nEmergency Procedures\n• Fire evacuation plans\n• Medical emergencies\n• Security incidents\n• Natural disasters\n• Power outages\n\nChapter 5: Customer Service Excellence\n\nPatient and Customer Interaction\n• Professional communication\n• Product education and recommendations\n• Dosage guidance\n• Consumption methods\n• Responsible use advocacy\n\nAge Verification\n• Valid ID requirements\n• ID checking procedures\n• Expired ID policies\n• Suspicious document identification\n• Documentation requirements\n\nCompliance During Sales\n• Purchase limits\n• Product tracking\n• Receipt requirements\n• Tax collection\n• Prohibited sales\n\nChapter 6: Inventory Management\n\nSeed-to-Sale Tracking\n• RFID tag assignment\n• Plant tracking procedures\n• Harvest documentation\n• Processing records\n• Transfer manifests\n\nInventory Procedures\n• Receiving protocols\n• Storage requirements\n• Rotation procedures (FIFO)\n• Waste disposal\n• Theft prevention\n\nRecord Keeping\n• Daily inventory counts\n• Transaction records\n• Waste disposal logs\n• Transfer documentation\n• Audit preparation\n\nChapter 7: Quality Control Procedures\n\nProduct Testing\n• Potency analysis\n• Pesticide screening\n• Microbial testing\n• Heavy metals analysis\n• Residual solvents\n\nQuality Standards\n• Visual inspection criteria\n• Aroma and flavor assessment\n• Moisture content\n• Packaging integrity\n• Labeling accuracy\n\nBatch Tracking\n• Lot number assignment\n• Test result documentation\n• Expiration date monitoring\n• Recall procedures\n• Quality complaints\n\nChapter 8: Emergency Procedures\n\nMedical Emergencies\n1. Assess the situation\n2. Call 911 if necessary\n3. Provide first aid if trained\n4. Contact management\n5. Document the incident\n\nSecurity Incidents\n1. Ensure personal safety\n2. Activate alarm systems\n3. Contact law enforcement\n4. Notify management\n5. Preserve evidence\n\nProduct Recalls\n1. Identify affected products\n2. Quarantine inventory\n3. Notify regulatory authorities\n4. Contact customers\n5. Document actions taken\n\nChapter 9: Continuing Education\n\nRequired Training\n• Annual compliance updates\n• Safety refresher courses\n• Product knowledge updates\n• Customer service training\n• Emergency response drills\n\nProfessional Development\n• Industry certifications\n• Conference attendance\n• Online learning platforms\n• Peer learning opportunities\n• Career advancement paths\n\nAppendix A: Regulatory Contacts\n\nState Cannabis Control Board\nPhone: (555) 123-4567\nEmail: info@cannabiscontrol.gov\nWebsite: www.cannabiscontrol.gov\n\nLocal Municipal Office\nPhone: (555) 987-6543\nEmail: permits@cityname.gov\nWebsite: www.cityname.gov/cannabis\n\nAppendix B: Emergency Contacts\n\nEmergency Services: 911\nPoison Control: 1-800-222-1222\nFacility Manager: (555) 555-0123\nSecurity Company: (555) 555-0456\nLegal Counsel: (555) 555-0789\n\nAppendix C: Cannabis Conversion Chart\n\nWeight Conversions\n• 1 gram = 1000 milligrams\n• 1 ounce = 28.35 grams\n• 1 pound = 453.59 grams\n\nPotency Calculations\n• THC mg = (THC% × Product weight in mg) ÷ 100\n• CBD mg = (CBD% × Product weight in mg) ÷ 100\n\nConclusion\n\nThis training manual provides the foundation for working safely and effectively in the cannabis industry. Regular review and updates ensure continued compliance and professional development. Remember that cannabis laws and regulations continue to evolve, requiring ongoing education and adaptation.\n\nFor questions or clarifications, contact your supervisor or the training department.\n\n---\nDocument prepared using Formul8 AI Cannabis Operations Platform\nFor more information: https://formul8.ai\n\nTraining Record\nEmployee: ___________________\nDate Completed: ___________________\nSupervisor Signature: ___________________\nNext Review Date: ___________________'
          }
        },
        // Professional styling
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: 34 },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 18, unit: 'PT' },
              foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.5, blue: 0.2 } } }
            },
            fields: 'bold,fontSize,foregroundColor'
          }
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: documentId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: documentId,
    url: `https://docs.google.com/document/d/${documentId}`
  };
}

async function createTinctureFormulation() {
  // Create spreadsheet with professional formulation sheet
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'CBD Tincture Formulation Sheet - Formul8 Demo'
      },
      sheets: [
        {
          properties: {
            title: 'Formulation Recipe',
            gridProperties: { rowCount: 50, columnCount: 10 }
          }
        },
        {
          properties: {
            title: 'Terpene Profiles',
            gridProperties: { rowCount: 30, columnCount: 8 }
          }
        },
        {
          properties: {
            title: 'Quality Control',
            gridProperties: { rowCount: 25, columnCount: 6 }
          }
        },
        {
          properties: {
            title: 'Batch Records',
            gridProperties: { rowCount: 40, columnCount: 12 }
          }
        }
      ]
    }
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // Add comprehensive formulation data with beautiful styling
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Formulation Recipe!A1:J35',
          values: [
            ['🧪 CBD TINCTURE FORMULATION RECIPE', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['📋 BATCH INFORMATION', '', '', '', '', '', '', '', '', ''],
            ['Batch Number:', 'CBDTx-2025-001', '', 'Formulation Date:', '2025-07-14', '', 'Formulated By:', 'Master Formulator', '', ''],
            ['Product Name:', 'Premium CBD Wellness Tincture', '', 'Target Potency:', '1000mg CBD/30ml', '', 'Batch Size:', '1000 units', '', ''],
            ['Flavor Profile:', 'Citrus Mint Wellness', '', 'Bottle Size:', '30ml (1 fl oz)', '', 'Shelf Life:', '24 months', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['🌿 BASE INGREDIENTS', '', '', '', '', '', '', '', '', ''],
            ['Component', 'Supplier', 'Lot Number', 'Quantity per Unit', 'Total Quantity', 'Unit Cost', 'Total Cost', 'Potency', 'Notes', ''],
            ['CBD Isolate (99.9%)', 'Premium Extracts Co.', 'CBD-ISO-2025-045', '1000mg', '1000g', '$15.00/g', '$15,000', '999mg/g', 'COA verified, <0.3% THC', ''],
            ['MCT Oil (Fractionated)', 'Coconut Wellness LLC', 'MCT-FRC-2025-089', '28ml', '28L', '$0.45/ml', '$12,600', 'N/A', 'Organic certified', ''],
            ['Organic Glycerin', 'Natural Extracts Inc.', 'GLY-ORG-2025-012', '1ml', '1L', '$0.35/ml', '$350', 'N/A', 'USP grade', ''],
            ['Natural Flavoring', 'Flavor Masters Pro', 'FLV-CTM-2025-067', '0.5ml', '0.5L', '$2.50/ml', '$1,250', 'N/A', 'Citrus mint blend', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['🌱 TERPENE BLEND', '', '', '', '', '', '', '', '', ''],
            ['Terpene', 'Concentration', 'Volume per Unit', 'Total Volume', 'Supplier', 'Lot Number', 'Cost per ml', 'Total Cost', 'Effect Profile', ''],
            ['Limonene', '0.5%', '0.15ml', '150ml', 'Terpene Solutions', 'LIM-2025-034', '$125.00', '$18,750', 'Uplifting, Anti-anxiety', ''],
            ['Linalool', '0.3%', '0.09ml', '90ml', 'Terpene Solutions', 'LIN-2025-028', '$180.00', '$16,200', 'Calming, Relaxing', ''],
            ['Pinene', '0.2%', '0.06ml', '60ml', 'Terpene Solutions', 'PIN-2025-041', '$150.00', '$9,000', 'Alertness, Memory', ''],
            ['Myrcene', '0.1%', '0.03ml', '30ml', 'Terpene Solutions', 'MYR-2025-052', '$140.00', '$4,200', 'Sedating, Muscle relaxant', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['💡 FORMULATION INSTRUCTIONS', '', '', '', '', '', '', '', '', ''],
            ['Step', 'Process', 'Temperature', 'Time', 'Equipment', 'Notes', 'Quality Check', 'Operator', 'Timestamp', ''],
            ['1', 'Weigh CBD isolate accurately', 'Room temp', '5 min', 'Analytical scale', 'Use anti-static measures', 'Weight verification', 'Initials', 'Date/Time', ''],
            ['2', 'Heat MCT oil to optimal temp', '60°C', '10 min', 'Heating mantle', 'Gentle heating, no boiling', 'Temperature check', 'Initials', 'Date/Time', ''],
            ['3', 'Dissolve CBD in warm MCT oil', '60°C', '15 min', 'Magnetic stirrer', 'Stir until completely dissolved', 'Visual inspection', 'Initials', 'Date/Time', ''],
            ['4', 'Add terpene blend slowly', '50°C', '10 min', 'Micropipette', 'Add drop by drop while stirring', 'Homogeneity check', 'Initials', 'Date/Time', ''],
            ['5', 'Incorporate glycerin', '45°C', '5 min', 'Stirring rod', 'Mix thoroughly', 'Visual inspection', 'Initials', 'Date/Time', ''],
            ['6', 'Add natural flavoring', '40°C', '5 min', 'Micropipette', 'Final flavor adjustment', 'Taste test', 'Initials', 'Date/Time', ''],
            ['7', 'Cool to room temperature', '25°C', '30 min', 'Cooling rack', 'Allow natural cooling', 'Temperature check', 'Initials', 'Date/Time', ''],
            ['8', 'Final mixing and homogenization', 'Room temp', '10 min', 'High-speed mixer', 'Ensure complete blend', 'Homogeneity test', 'Initials', 'Date/Time', ''],
            ['9', 'Fill bottles with precision', 'Room temp', '45 min', 'Filling machine', '30ml ± 0.1ml per bottle', 'Volume check', 'Initials', 'Date/Time', ''],
            ['10', 'Cap and label bottles', 'Room temp', '30 min', 'Capping machine', 'Ensure proper seal', 'Seal integrity', 'Initials', 'Date/Time', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['📊 COST ANALYSIS', '', '', '', '', '', '', '', '', ''],
            ['Cost Category', 'Amount', 'Per Unit Cost', 'Notes', '', '', '', '', '', ''],
            ['Raw Materials', '$77,350', '$77.35', 'CBD, MCT oil, terpenes, flavoring', '', '', '', '', '', ''],
            ['Packaging', '$2,500', '$2.50', 'Bottles, caps, labels, boxes', '', '', '', '', '', ''],
            ['Labor', '$1,200', '$1.20', 'Formulation and packaging labor', '', '', '', '', '', ''],
            ['Overhead', '$800', '$0.80', 'Facility, utilities, equipment', '', '', '', '', '', ''],
            ['Total Cost', '$81,850', '$81.85', 'Complete cost per unit', '', '', '', '', '', '']
          ]
        },
        {
          range: 'Terpene Profiles!A1:H25',
          values: [
            ['🌿 TERPENE PROFILES & EFFECTS', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Terpene', 'Concentration', 'Aroma', 'Flavor', 'Effects', 'Synergy', 'Boiling Point', 'Notes'],
            ['Limonene', '0.5%', 'Citrus, Fresh', 'Lemon, Orange', 'Uplifting, Anti-anxiety', 'Enhances CBD absorption', '176°C', 'Dominant citrus character'],
            ['Linalool', '0.3%', 'Floral, Lavender', 'Floral, Sweet', 'Calming, Sleep aid', 'Potentiates CBD relaxation', '198°C', 'Fragile, add at low temp'],
            ['Pinene', '0.2%', 'Pine, Fresh', 'Pine, Woody', 'Alertness, Memory', 'Balances sedating effects', '155°C', 'Provides mental clarity'],
            ['Myrcene', '0.1%', 'Earthy, Musky', 'Herbal, Spicy', 'Sedating, Muscle relaxant', 'Enhances CBD bioavailability', '167°C', 'Minimal amount for balance'],
            ['', '', '', '', '', '', '', ''],
            ['🎯 DESIRED EFFECT PROFILE', '', '', '', '', '', '', ''],
            ['Primary Effects', 'Contribution', 'Onset Time', 'Duration', 'Intensity', 'User Feedback', 'Optimization Notes', ''],
            ['Stress Relief', 'Linalool + CBD', '15-45 min', '4-6 hours', 'Moderate', 'Positive responses', 'Perfect balance achieved'],
            ['Mood Enhancement', 'Limonene + CBD', '15-30 min', '4-6 hours', 'Mild-Moderate', 'Uplifting reports', 'Citrus notes appreciated'],
            ['Mental Clarity', 'Pinene balance', '20-40 min', '3-5 hours', 'Mild', 'Focused without drowsiness', 'Prevents couch lock'],
            ['Muscle Relaxation', 'Myrcene + CBD', '30-60 min', '5-7 hours', 'Moderate', 'Good for post-workout', 'Subtle but effective'],
            ['', '', '', '', '', '', '', ''],
            ['🧪 TERPENE STABILITY DATA', '', '', '', '', '', '', ''],
            ['Terpene', 'Stability at RT', 'Light Sensitivity', 'Heat Sensitivity', 'pH Sensitivity', 'Shelf Life', 'Storage Conditions', ''],
            ['Limonene', 'Stable', 'Moderate', 'Low', 'Stable 4-8', '18 months', 'Dark, cool, sealed'],
            ['Linalool', 'Moderate', 'High', 'High', 'Stable 4-8', '12 months', 'Amber bottles, refrigerated'],
            ['Pinene', 'Stable', 'Low', 'Low', 'Stable 4-8', '24 months', 'Standard conditions'],
            ['Myrcene', 'Moderate', 'Moderate', 'Moderate', 'Stable 4-8', '15 months', 'Dark, cool storage'],
            ['', '', '', '', '', '', '', ''],
            ['🌡️ TEMPERATURE CONSIDERATIONS', '', '', '', '', '', '', ''],
            ['Process Stage', 'Max Temperature', 'Optimal Range', 'Critical Points', 'Terpene Impact', 'Monitoring', 'Corrective Actions', ''],
            ['Initial heating', '60°C', '55-60°C', 'CBD dissolution', 'Minimal loss', 'Continuous', 'Reduce heat if needed'],
            ['Terpene addition', '50°C', '45-50°C', 'Volatilization risk', 'Moderate loss potential', 'Every 2 min', 'Cool immediately'],
            ['Final mixing', '40°C', '35-40°C', 'Flavor integration', 'Low loss risk', 'Every 5 min', 'Maintain range'],
            ['Cooling phase', '25°C', '20-25°C', 'Stabilization', 'Minimal impact', 'Every 10 min', 'Natural cooling']
          ]
        },
        {
          range: 'Quality Control!A1:F20',
          values: [
            ['🔬 QUALITY CONTROL SPECIFICATIONS', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Test Parameter', 'Specification', 'Method', 'Frequency', 'Acceptance Criteria', 'Notes'],
            ['CBD Potency', '1000mg ± 50mg', 'HPLC', 'Every batch', '950-1050mg per bottle', 'COA required'],
            ['THC Content', '<0.3%', 'HPLC', 'Every batch', 'Below federal limit', 'Compliance critical'],
            ['Terpene Profile', 'As specified', 'GC-MS', 'Every batch', 'Match target profile ±10%', 'Flavor consistency'],
            ['Microbial Testing', 'USP standards', 'Plate count', 'Every batch', 'Within USP limits', 'Safety requirement'],
            ['Heavy Metals', 'USP <232>', 'ICP-MS', 'Every lot', 'Below USP limits', 'Supplier verification'],
            ['Residual Solvents', '<5000ppm total', 'GC-MS', 'Every batch', 'ICH guidelines', 'Extraction residues'],
            ['Water Activity', '<0.65 aw', 'Water activity meter', 'Every batch', 'Stability requirement', 'Shelf life critical'],
            ['pH Level', '6.0-7.0', 'pH meter', 'Every batch', 'Stability range', 'Affects bioavailability'],
            ['Viscosity', '50-100 cP', 'Viscometer', 'Every batch', 'Dosing consistency', 'User experience'],
            ['Color', 'Light amber', 'Visual', 'Every batch', 'Consistent appearance', 'Quality indicator'],
            ['Clarity', 'Clear, no particles', 'Visual', 'Every batch', 'No visible particles', 'Filtration check'],
            ['', '', '', '', '', ''],
            ['🎯 TESTING SCHEDULE', '', '', '', '', ''],
            ['Test Phase', 'Timing', 'Responsible Party', 'Documentation', 'Pass/Fail Criteria', 'Next Steps'],
            ['Raw Material', 'Upon receipt', 'QC Lab', 'COA review', 'Meets specifications', 'Approve/Reject'],
            ['In-Process', 'During production', 'Production team', 'Batch record', 'Process parameters', 'Continue/Stop'],
            ['Final Product', 'Post-production', 'QC Lab', 'Final COA', 'All specs met', 'Release/Hold'],
            ['Stability', 'Time points', 'QC Lab', 'Stability report', 'Maintains specs', 'Shelf life confirmation']
          ]
        },
        {
          range: 'Batch Records!A1:L30',
          values: [
            ['📝 BATCH PRODUCTION RECORDS', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['Batch ID', 'Production Date', 'Batch Size', 'Operator', 'Supervisor', 'Start Time', 'End Time', 'Yield', 'Quality Status', 'Release Date', 'Expiry Date', 'Notes'],
            ['CBDTx-2025-001', '2025-07-14', '1000 units', 'J. Smith', 'M. Johnson', '08:00', '16:30', '998 units', 'Approved', '2025-07-16', '2027-07-16', 'Perfect batch'],
            ['CBDTx-2025-002', '2025-07-16', '1000 units', 'A. Davis', 'M. Johnson', '08:00', '16:45', '995 units', 'Approved', '2025-07-18', '2027-07-18', 'Minor terpene adjustment'],
            ['CBDTx-2025-003', '2025-07-18', '1000 units', 'J. Smith', 'R. Wilson', '08:00', '16:15', '1000 units', 'Approved', '2025-07-20', '2027-07-20', 'Excellent yield'],
            ['CBDTx-2025-004', '2025-07-20', '1000 units', 'S. Brown', 'M. Johnson', '08:00', '17:00', '992 units', 'Approved', '2025-07-22', '2027-07-22', 'Equipment maintenance delay'],
            ['CBDTx-2025-005', '2025-07-22', '1000 units', 'A. Davis', 'R. Wilson', '08:00', '16:30', '996 units', 'Approved', '2025-07-24', '2027-07-24', 'Standard production'],
            ['CBDTx-2025-006', '2025-07-24', '1000 units', 'J. Smith', 'M. Johnson', '08:00', '16:20', '999 units', 'Approved', '2025-07-26', '2027-07-26', 'Optimized process'],
            ['CBDTx-2025-007', '2025-07-26', '1000 units', 'S. Brown', 'R. Wilson', '08:00', '16:40', '997 units', 'Approved', '2025-07-28', '2027-07-28', 'New operator training'],
            ['CBDTx-2025-008', '2025-07-28', '1000 units', 'A. Davis', 'M. Johnson', '08:00', '16:25', '998 units', 'Approved', '2025-07-30', '2027-07-30', 'Consistent quality'],
            ['CBDTx-2025-009', '2025-07-30', '1000 units', 'J. Smith', 'R. Wilson', '08:00', '16:35', '1000 units', 'Approved', '2025-08-01', '2027-08-01', 'Perfect execution'],
            ['CBDTx-2025-010', '2025-08-01', '1000 units', 'S. Brown', 'M. Johnson', '08:00', '16:50', '994 units', 'Approved', '2025-08-03', '2027-08-03', 'Temperature variance'],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['📊 BATCH SUMMARY STATISTICS', '', '', '', '', '', '', '', '', '', '', ''],
            ['Metric', 'Value', 'Target', 'Variance', 'Trend', 'Action Required', '', '', '', '', '', ''],
            ['Average Yield', '997.2 units', '1000 units', '-0.28%', 'Stable', 'Monitor process', '', '', '', '', '', ''],
            ['Average Production Time', '8.45 hours', '8.0 hours', '+5.6%', 'Stable', 'Process optimization', '', '', '', '', '', ''],
            ['Quality Pass Rate', '100%', '100%', '0%', 'Excellent', 'Maintain standards', '', '', '', '', '', ''],
            ['CBD Potency Variance', '±2.1%', '±5%', 'Within spec', 'Stable', 'Continue monitoring', '', '', '', '', '', ''],
            ['Cost per Unit', '$81.85', '$80.00', '+2.3%', 'Stable', 'Cost reduction review', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['🔄 PROCESS IMPROVEMENTS', '', '', '', '', '', '', '', '', '', '', ''],
            ['Issue', 'Root Cause', 'Corrective Action', 'Implementation Date', 'Effectiveness', 'Follow-up Required', '', '', '', '', '', ''],
            ['Slight yield loss', 'Handling losses', 'Improved transfer procedures', '2025-07-20', 'Effective', 'Monthly review', '', '', '', '', '', ''],
            ['Production time variance', 'Setup variability', 'Standardized setup checklist', '2025-07-22', 'Effective', 'Weekly monitoring', '', '', '', '', '', ''],
            ['Terpene consistency', 'Addition method', 'Automated dosing system', '2025-07-25', 'Highly effective', 'Continue use', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['📈 QUALITY TRENDS', '', '', '', '', '', '', '', '', '', '', ''],
            ['Month', 'Batches Produced', 'Average Potency', 'Yield %', 'Quality Score', 'Customer Satisfaction', 'Improvement Notes', '', '', '', '', ''],
            ['June 2025', '25', '1002mg', '99.1%', '98.5', '4.8/5.0', 'Process optimization', '', '', '', '', ''],
            ['July 2025', '31', '1001mg', '99.7%', '99.2', '4.9/5.0', 'Terpene improvements', '', '', '', '', ''],
            ['August 2025', '28', '1000mg', '99.8%', '99.5', '4.9/5.0', 'Consistency achieved', '', '', '', '', '']
          ]
        }
      ]
    }
  });

  // Apply beautiful styling with colors, fonts, and formatting
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Style the main header
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            rows: [{
              values: [{
                userEnteredValue: { stringValue: '🧪 CBD TINCTURE FORMULATION RECIPE' },
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.5, blue: 0.3 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 18,
                    bold: true
                  },
                  horizontalAlignment: 'CENTER'
                }
              }]
            }],
            fields: 'userEnteredValue,userEnteredFormat'
          }
        },
        // Style section headers
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 2,
              endRowIndex: 3,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            rows: [{
              values: [{
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                    fontSize: 14,
                    bold: true
                  }
                }
              }]
            }],
            fields: 'userEnteredFormat'
          }
        },
        // Style ingredient headers
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: 7,
              endRowIndex: 8,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            rows: [{
              values: [{
                userEnteredFormat: {
                  backgroundColor: { red: 0.1, green: 0.6, blue: 0.2 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 12,
                    bold: true
                  }
                }
              }]
            }],
            fields: 'userEnteredFormat'
          }
        },
        // Merge cells for headers
        {
          mergeCells: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            mergeType: 'MERGE_ALL'
          }
        },
        // Add borders to tables
        {
          updateBorders: {
            range: {
              sheetId: 0,
              startRowIndex: 8,
              endRowIndex: 13,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            top: { style: 'SOLID', width: 1, color: { red: 0.6, green: 0.6, blue: 0.6 } },
            bottom: { style: 'SOLID', width: 1, color: { red: 0.6, green: 0.6, blue: 0.6 } },
            left: { style: 'SOLID', width: 1, color: { red: 0.6, green: 0.6, blue: 0.6 } },
            right: { style: 'SOLID', width: 1, color: { red: 0.6, green: 0.6, blue: 0.6 } }
          }
        }
      ]
    }
  });

  // Move to Cannabis workspace
  await drive.files.update({
    fileId: spreadsheetId,
    addParents: CANNABIS_WORKSPACE_ID,
    fields: 'id, parents'
  });

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

// Run the demo creation
createDemoArtifacts();