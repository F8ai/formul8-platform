#!/bin/bash

# Setup F8AI Cannabis Workspace with Service Account
echo "🔧 Setting up F8AI Cannabis Workspace with proper permissions..."

# Service account details
SERVICE_ACCOUNT_EMAIL="f8-868@f8ai-465903.iam.gserviceaccount.com"
PROJECT_ID="f8ai-465903"

echo "📋 Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "📋 Project: $PROJECT_ID"

# Required IAM roles for document creation
REQUIRED_ROLES=(
    "roles/drive.appdata"
    "roles/drive.file"
    "roles/drive.metadata"
    "roles/documentai.apiUser"
    "roles/sheets.editor"
    "roles/docs.editor"
)

echo "
🎯 DOMAIN-WIDE DELEGATION SETUP REQUIRED
=========================================

To enable cannabis industry document creation, you need to:

1. Enable Domain-Wide Delegation (if not already enabled)
2. Add these OAuth scopes in Google Workspace Admin Console:
   - https://www.googleapis.com/auth/drive
   - https://www.googleapis.com/auth/documents  
   - https://www.googleapis.com/auth/spreadsheets

3. Use Client ID: 101655712299195998813

📋 ALTERNATIVE: Add IAM Roles (if you have gcloud CLI)
==================================================="

for role in "${REQUIRED_ROLES[@]}"; do
    echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
    echo "    --member='serviceAccount:$SERVICE_ACCOUNT_EMAIL' \\"
    echo "    --role='$role'"
    echo
done

echo "
🎉 AFTER SETUP COMPLETE
=====================
Run: node test_permissions.js
Then: node demonstrate_templates.js

This will create:
✅ Professional cannabis SOPs
✅ Compliance tracking spreadsheets  
✅ Product development templates
✅ Lab results tracking systems
✅ Marketing campaign frameworks
✅ Complete agent-ready document management

🔗 F8 Cannabis Workspace: https://drive.google.com/drive/folders/1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE
"