# Google Service Account Setup for Formul8 Artifacts

## Quick Setup Guide

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Name it something like "Formul8-Artifacts"

### 2. Enable Required APIs
Enable these APIs in your project:
- Google Drive API
- Google Docs API  
- Google Sheets API
- Google Forms API

**Quick link**: [API Library](https://console.cloud.google.com/apis/library)

### 3. Create Service Account
1. Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click "Create Service Account"
3. Name: `formul8-artifacts-service`
4. Description: `Service account for Formul8 document management`
5. Click "Create and Continue"

### 4. Generate Private Key
1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 5. Extract Credentials
From the downloaded JSON file, you need:

```json
{
  "client_email": "formul8-artifacts-service@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
}
```

### 6. Set Environment Variables
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The `client_email` value
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: The `private_key` value (keep the \n characters)

### 7. Share Google Drive Folder (Optional)
If you want to organize documents:
1. Create a folder in Google Drive
2. Share it with the service account email
3. Give "Editor" permissions

## Security Notes
- Keep the private key secure and never commit to version control
- The service account will create documents in its own Google Drive
- Documents are automatically shared with user emails when created
- No OAuth flow required - seamless integration

## Testing
Once configured, the system will:
- Create Google Docs for cannabis SOPs
- Generate Google Sheets for marketing campaigns  
- Build Google Forms for compliance checklists
- Share all documents automatically with users
- Enable AI agents to read and modify documents

## Troubleshooting
- Ensure all required APIs are enabled
- Check service account has correct permissions
- Verify private key format includes \n line breaks
- Test with a simple document creation first