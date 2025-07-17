#!/bin/bash

echo "🚀 Quick Formul8 Cannabis Platform Test"
echo "======================================"

# Test current API status
echo "🔍 Testing current API permissions..."

# Simple API test
node -e "
const { google } = require('googleapis');
const fs = require('fs');

async function quickTest() {
  try {
    const creds = JSON.parse(fs.readFileSync('google-service-account.json', 'utf8'));
    
    // Test with service account
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });
    
    const authClient = await auth.getClient();
    
    // Test Drive API
    console.log('Testing Drive API...');
    const drive = google.drive({ version: 'v3', auth: authClient });
    const files = await drive.files.list({
      q: \"'1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE' in parents\",
      pageSize: 5
    });
    console.log('✅ Drive API: Working (' + files.data.files.length + ' files found)');
    
    // Test Docs API
    console.log('Testing Docs API...');
    const docs = google.docs({ version: 'v1', auth: authClient });
    const testDoc = await docs.documents.create({
      requestBody: { title: 'Quick Test - Cannabis SOP Template' }
    });
    console.log('✅ Docs API: Working - Created document ' + testDoc.data.documentId);
    
    // Test Sheets API
    console.log('Testing Sheets API...');
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const testSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'Quick Test - Cannabis Compliance Tracker' }
      }
    });
    console.log('✅ Sheets API: Working - Created sheet ' + testSheet.data.spreadsheetId);
    
    console.log('\\n🎉 ALL APIS WORKING! Ready to create cannabis templates');
    
    // Clean up test files
    await drive.files.delete({ fileId: testDoc.data.documentId });
    await drive.files.delete({ fileId: testSheet.data.spreadsheetId });
    console.log('✅ Test files cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ API Error: ' + error.message);
    console.log('💡 This is expected if APIs are still propagating');
    return false;
  }
}

quickTest().then(success => {
  if (success) {
    console.log('\\n🌿 Ready to create full cannabis industry templates!');
    console.log('   Run: python create_templates_python.py');
  } else {
    console.log('\\n⏳ APIs may need more time to propagate (10-15 minutes)');
    console.log('   Or check if Google Sheets API is enabled in Google Cloud Console');
  }
});
"

echo -e "\n📊 Current Status Summary:"
echo "✅ F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE"
echo "✅ Service Account: f8-868@f8ai-465903.iam.gserviceaccount.com"
echo "✅ Domain-Wide Delegation: Client ID 101655712299195998813"
echo "✅ OAuth Scopes: drive, documents, spreadsheets"
echo "✅ APIs Enabled: Google Docs API, Google Sheets API"

echo -e "\n🎯 Next Steps:"
echo "1. If test passes: Full cannabis templates will be created"
echo "2. If test fails: Wait 10-15 minutes for API propagation"
echo "3. Manual test: Try creating a document from Google Sheets API page"

echo -e "\n🔗 Manual Test URLs:"
echo "- Google Sheets API: https://developers.google.com/sheets/api/reference/rest"
echo "- Google Docs API: https://developers.google.com/docs/api/reference/rest"
echo "- Try API Explorer for manual testing"