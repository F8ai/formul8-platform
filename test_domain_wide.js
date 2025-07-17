import { google } from 'googleapis';
import fs from 'fs';

async function testDomainWideAccess() {
  console.log('🔍 Testing Domain-Wide Delegation Configuration');
  console.log('===============================================');
  
  try {
    // Load service account
    const serviceAccountKey = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
    console.log(`Service Account: ${serviceAccountKey.client_email}`);
    console.log(`Client ID: ${serviceAccountKey.client_id}`);
    console.log(`Project ID: ${serviceAccountKey.project_id}`);
    
    // Test with explicit subject (impersonation)
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: 'dan@syzygyx.com' // Try impersonating the domain user
    });

    console.log('\n🔐 Testing with domain user impersonation...');
    await auth.authorize();
    console.log('✅ Domain-wide delegation authorization: Success');

    // Test Docs API with impersonation
    const docs = google.docs({ version: 'v1', auth });
    try {
      const doc = await docs.documents.create({
        requestBody: {
          title: 'F8 Cannabis SOP - Domain Wide Test'
        }
      });
      console.log('✅ Docs API with impersonation: Working!');
      console.log(`Document ID: ${doc.data.documentId}`);
      
      // Clean up
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.delete({ fileId: doc.data.documentId });
      console.log('✅ Test document cleaned up');
      
    } catch (error) {
      console.log(`❌ Docs API with impersonation: ${error.message}`);
    }

    // Test Sheets API with impersonation
    const sheets = google.sheets({ version: 'v4', auth });
    try {
      const sheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: 'F8 Cannabis Test - Domain Wide'
          }
        }
      });
      console.log('✅ Sheets API with impersonation: Working!');
      console.log(`Spreadsheet ID: ${sheet.data.spreadsheetId}`);
      
      // Clean up
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.delete({ fileId: sheet.data.spreadsheetId });
      console.log('✅ Test spreadsheet cleaned up');
      
    } catch (error) {
      console.log(`❌ Sheets API with impersonation: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Domain-wide delegation error: ${error.message}`);
    
    console.log('\n💡 TROUBLESHOOTING STEPS:');
    console.log('1. Verify domain-wide delegation is enabled in Google Workspace Admin Console');
    console.log('2. Check that OAuth scopes match exactly:');
    console.log('   - https://www.googleapis.com/auth/drive');
    console.log('   - https://www.googleapis.com/auth/documents');  
    console.log('   - https://www.googleapis.com/auth/spreadsheets');
    console.log('3. Ensure Client ID matches: 101655712299195998813');
    console.log('4. Wait 15-30 minutes for domain-wide delegation to fully propagate');
  }

  console.log('\n🔍 Now testing without impersonation (service account only)...');
  
  try {
    // Test without impersonation
    const authNoImpersonation = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });

    await authNoImpersonation.authorize();
    console.log('✅ Service account authorization: Success');

    // Test Drive API (should work)
    const drive = google.drive({ version: 'v3', auth: authNoImpersonation });
    const driveTest = await drive.files.list({
      q: "'1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE' in parents",
      pageSize: 5
    });
    console.log(`✅ Drive API: Working (${driveTest.data.files.length} files)`);

    // Test Docs API (might fail)
    const docs = google.docs({ version: 'v1', auth: authNoImpersonation });
    try {
      const doc = await docs.documents.create({
        requestBody: {
          title: 'F8 Cannabis SOP - Service Account Test'
        }
      });
      console.log('✅ Docs API (service account): Working!');
      
      // Move to F8 workspace
      await drive.files.update({
        fileId: doc.data.documentId,
        addParents: '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE'
      });
      
      console.log(`📄 Created: https://docs.google.com/document/d/${doc.data.documentId}`);
      
    } catch (error) {
      console.log(`❌ Docs API (service account): ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Service account test error: ${error.message}`);
  }
}

testDomainWideAccess();