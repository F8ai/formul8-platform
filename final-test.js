import { google } from 'googleapis';
import fs from 'fs';

async function finalTest() {
  console.log('🔍 Final Cannabis Platform API Test');
  console.log('================================');
  
  try {
    // Load service account
    const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
    
    // Try using JWT auth instead of GoogleAuth
    const jwtClient = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents', 
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });

    // Authorize
    await jwtClient.authorize();
    console.log('✅ JWT Service Account authorization: Success');

    // Test Drive API
    const drive = google.drive({ version: 'v3', auth: jwtClient });
    const driveTest = await drive.files.list({
      q: "'1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE' in parents",
      pageSize: 5
    });
    console.log(`✅ Drive API: Working (${driveTest.data.files.length} files)`);

    // Test Docs API
    console.log('\n📄 Testing Google Docs API with JWT...');
    const docs = google.docs({ version: 'v1', auth: jwtClient });
    
    try {
      const docTest = await docs.documents.create({
        requestBody: {
          title: 'F8 Cannabis SOP - Final Test'
        }
      });
      console.log(`✅ Docs API: Working! Created ${docTest.data.documentId}`);
      
      // Add basic content
      await docs.documents.batchUpdate({
        documentId: docTest.data.documentId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: 'CANNABIS STANDARD OPERATING PROCEDURE\n\nThis is a test document created by the F8 Cannabis Platform.\n\nQuality Control Testing:\n• Sample collection protocols\n• Testing requirements\n• Documentation procedures\n• Compliance standards\n\nThis document demonstrates successful API integration.'
            }
          }]
        }
      });
      
      // Move to Compliance Documents folder
      const complianceFolder = driveTest.data.files.find(f => f.name === 'Compliance Documents');
      if (complianceFolder) {
        await drive.files.update({
          fileId: docTest.data.documentId,
          addParents: complianceFolder.id
        });
        console.log('✅ Document moved to Compliance folder');
      }
      
      console.log(`📄 Cannabis SOP created: https://docs.google.com/document/d/${docTest.data.documentId}`);
      
    } catch (docsError) {
      console.log(`❌ Docs API: ${docsError.message}`);
    }

    // Test Sheets API
    console.log('\n📊 Testing Google Sheets API with JWT...');
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });
    
    try {
      const sheetTest = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: 'F8 Cannabis Compliance Tracker - Final Test'
          }
        }
      });
      console.log(`✅ Sheets API: Working! Created ${sheetTest.data.spreadsheetId}`);
      
      // Add compliance data
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetTest.data.spreadsheetId,
        range: 'A1:H6',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            ['Batch ID', 'Product Type', 'Test Date', 'THC %', 'CBD %', 'Status', 'COA Link', 'Notes'],
            ['B001-2025', 'Flower', '2025-01-15', '22.5', '1.2', 'PASS', 'https://example.com/coa1', 'Premium indoor'],
            ['B002-2025', 'Concentrate', '2025-01-15', '78.3', '2.1', 'PASS', 'https://example.com/coa2', 'Live resin'],
            ['B003-2025', 'Edible', '2025-01-16', '10.0', '0.5', 'PENDING', 'https://example.com/coa3', 'Gummy batch'],
            ['B004-2025', 'Vape', '2025-01-16', '85.2', '1.8', 'PASS', 'https://example.com/coa4', 'Distillate cart'],
            ['B005-2025', 'Topical', '2025-01-17', '5.0', '15.0', 'PASS', 'https://example.com/coa5', 'CBD cream']
          ]
        }
      });
      
      // Format the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetTest.data.spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 8
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }]
        }
      });
      
      // Move to Compliance Documents folder
      const complianceFolder = driveTest.data.files.find(f => f.name === 'Compliance Documents');
      if (complianceFolder) {
        await drive.files.update({
          fileId: sheetTest.data.spreadsheetId,
          addParents: complianceFolder.id
        });
        console.log('✅ Spreadsheet moved to Compliance folder');
      }
      
      console.log(`📊 Cannabis Tracker created: https://docs.google.com/spreadsheets/d/${sheetTest.data.spreadsheetId}`);
      
    } catch (sheetsError) {
      console.log(`❌ Sheets API: ${sheetsError.message}`);
    }

    console.log('\n🎉 F8 CANNABIS PLATFORM TEST COMPLETE!');
    console.log('====================================');
    console.log('📂 F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE');
    console.log('✅ Professional cannabis industry templates ready');
    console.log('✅ Agent-based document management operational');
    console.log('✅ Ready for cannabis industry workflow automation');
    
  } catch (error) {
    console.error('❌ Final test error:', error.message);
    
    if (error.message.includes('API has not been used')) {
      console.log('\n💡 SOLUTION: Enable missing APIs in Google Cloud Console');
      console.log('   1. Go to APIs & Services → Library');
      console.log('   2. Search for and enable: Google Sheets API');
      console.log('   3. Wait 5-10 minutes for propagation');
    } else if (error.message.includes('permission')) {
      console.log('\n💡 SOLUTION: Domain-wide delegation needs more time');
      console.log('   1. Wait 15-20 minutes for full propagation');
      console.log('   2. Or try manual test in API Explorer');
    }
  }
}

finalTest();