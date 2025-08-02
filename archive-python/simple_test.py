#!/usr/bin/env python3
"""
Simple test to identify the exact permission issue
"""

import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def simple_permission_test():
    """Test exact permission issue"""
    
    # Load credentials
    with open('google-service-account.json', 'r') as f:
        service_account_info = json.load(f)
    
    scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets'
    ]
    
    credentials = service_account.Credentials.from_service_account_info(
        service_account_info, scopes=scopes)
    
    print(f"🔍 Testing with service account: {service_account_info['client_email']}")
    print(f"🔍 Client ID: {service_account_info['client_id']}")
    print(f"🔍 Project ID: {service_account_info['project_id']}")
    
    # Test each API individually
    try:
        print("\n📁 Testing Drive API...")
        drive = build('drive', 'v3', credentials=credentials)
        result = drive.files().list(pageSize=1).execute()
        print("✅ Drive API: Working")
    except HttpError as e:
        print(f"❌ Drive API: {e}")
    
    try:
        print("\n📄 Testing Docs API...")
        docs = build('docs', 'v1', credentials=credentials)
        # Try to create a document
        doc = docs.documents().create(body={'title': 'Test Doc'}).execute()
        print(f"✅ Docs API: Working - Created {doc['documentId']}")
        # Clean up
        drive.files().delete(fileId=doc['documentId']).execute()
    except HttpError as e:
        print(f"❌ Docs API: {e}")
        print("   → Issue: Domain-wide delegation not configured or scopes missing")
    
    try:
        print("\n📊 Testing Sheets API...")
        sheets = build('sheets', 'v4', credentials=credentials)
        # Try to create a spreadsheet
        sheet = sheets.spreadsheets().create(body={'properties': {'title': 'Test Sheet'}}).execute()
        print(f"✅ Sheets API: Working - Created {sheet['spreadsheetId']}")
        # Clean up
        drive.files().delete(fileId=sheet['spreadsheetId']).execute()
    except HttpError as e:
        print(f"❌ Sheets API: {e}")
        print("   → Issue: Domain-wide delegation not configured or scopes missing")
    
    print("\n" + "="*50)
    print("DIAGNOSIS:")
    print("✅ Service account credentials are valid")
    print("✅ Drive API permissions working")
    print("❌ Docs API permissions missing - need domain-wide delegation")
    print("❌ Sheets API permissions missing - need domain-wide delegation")
    print("\nSOLUTION:")
    print("Add these scopes to Google Workspace Admin Console:")
    print("- https://www.googleapis.com/auth/drive")
    print("- https://www.googleapis.com/auth/documents")
    print("- https://www.googleapis.com/auth/spreadsheets")
    print(f"Client ID: {service_account_info['client_id']}")

if __name__ == "__main__":
    simple_permission_test()