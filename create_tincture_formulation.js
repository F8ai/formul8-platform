import { google } from 'googleapis';
import fs from 'fs';

// Load service account credentials
const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));

// Initialize Google APIs with service account
const auth = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
  'dan@syzygyx.com' // Domain-wide delegation
);

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const CANNABIS_WORKSPACE_ID = '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE';

async function createTinctureFormulation() {
  console.log('🧪 Creating CBD Tincture Formulation Sheet...');
  
  try {
    // Create spreadsheet with professional formulation sheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'CBD Tincture Formulation Sheet - Professional Demo'
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
    console.log(`📊 Created spreadsheet: ${spreadsheetId}`);

    // Add comprehensive formulation data
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
              ['Cost per Unit', '$81.85', '$80.00', '+2.3%', 'Stable', 'Cost reduction review', '', '', '', '', '', '']
            ]
          }
        ]
      }
    });

    console.log('📝 Added formulation data');

    // Apply beautiful styling with colors and formatting
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
                values: Array(10).fill({
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.5, blue: 0.3 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 18,
                      bold: true
                    },
                    horizontalAlignment: 'CENTER'
                  }
                })
              }],
              fields: 'userEnteredFormat'
            }
          },
          // Merge the header cells
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
                values: Array(10).fill({
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: {
                      foregroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                      fontSize: 14,
                      bold: true
                    }
                  }
                })
              }],
              fields: 'userEnteredFormat'
            }
          },
          // Style ingredient table headers
          {
            updateCells: {
              range: {
                sheetId: 0,
                startRowIndex: 8,
                endRowIndex: 9,
                startColumnIndex: 0,
                endColumnIndex: 10
              },
              rows: [{
                values: Array(10).fill({
                  userEnteredFormat: {
                    backgroundColor: { red: 0.1, green: 0.6, blue: 0.2 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 12,
                      bold: true
                    }
                  }
                })
              }],
              fields: 'userEnteredFormat'
            }
          }
        ]
      }
    });

    console.log('🎨 Applied beautiful styling');

    // Move to Cannabis workspace
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: CANNABIS_WORKSPACE_ID,
      fields: 'id, parents'
    });

    console.log('📁 Moved to Cannabis workspace');

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log(`✅ CBD Tincture Formulation Sheet created successfully!`);
    console.log(`🔗 URL: ${url}`);
    
    return {
      id: spreadsheetId,
      url: url
    };
    
  } catch (error) {
    console.error('❌ Error creating CBD Tincture Formulation Sheet:', error);
    throw error;
  }
}

// Run the creation
createTinctureFormulation();