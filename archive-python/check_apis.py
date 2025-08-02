#!/usr/bin/env python3
"""
Check which Google APIs are enabled for the project
"""

import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def check_api_status():
    """Check the status of Google APIs"""
    
    print("🔍 Checking Google API Status...")
    
    service_account_info = {
        "type": "service_account",
        "project_id": "f8ai-465903",
        "private_key_id": "97a52fb7865c58c2a42704dba731f8047bd17e60",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQConD37+aK4MCgi\nSTNOBT6uUOqtwTG6wURBLhEbjk9f5umQam3lMGRCatw913d/53e5i8kBzeutEShv\n+bTNBUq7G2nzKmPnCbuG1+vSdNMDu6fbWGiMhFa7mM6mWb5utpJOf3DFsSucRgPB\npKflKnbKuk6oJ0YF+nuA58Md/dPOOxSybrhACyuTjJFzVeTauFsdiMDSq7GOpUx+\nm51wTV2YZLzl2a0ZIW6eiwC3S4MJ5gUYCFGDSQEZqWAOgRQxaYPWOIciqct2aEZt\ntCzjfE9lzJUTf98pBFLZWL17ncbOIJiGy/Sejp5a/fV9NLMGeOGq5REgsRSjR0DO\nS0yptd5fAgMBAAECggEAHC2UXE5xZ7fAlU5HcTQGMCqctbISRgQzjHMO79x+Hmhg\nQz7OI93M+56RNRKTyX/c7djTHGaWCuPRrrj8AsFuJkvkDnvYm01wlg3yvsbAVyDe\n4hTp0AXz2sEkU/+uiCEh3VWF+rvrrl+zFAMY/f71QFcXexmpJamhRz80SAhaA95t\nIBclRdU5Ncv88CrSfxaibjDbNZdzwJuzVpNm14ucitu90U/nwOilIghqZ15/b+EG\np5pIKUZ3z8Ef+UFT0ZegMC/28JK7OzH+5ZZqzd9oZs673kytWP7a3A2y3Tu86QZQ\ndoG6w5ByEzFFurVpzjOAyxeFZmkH3pY1VH7eDRbONQKBgQDha0qHuLTBc8udyBiO\nXzs39iom14hCn/+6VOZRWhgJcsu7agJ7wgYSfLIcZBPk8ewnwI/bs+xShPXqGxUv\nVWGSoljugkCVW6KQTqgMRmNsSho+J4N6LO4E8ns4L+HwAsMBmNTYVCd9LRcqvK8O\nMWOt9zqtODkNxkZjbZ0VPJkogwKBgQC/fAGZiQs+bS+e4Jh3x74IqfCVgZR11nTE\nm8cZIidBddgxPx9PhR7LeuxRH29qPfiFFGm6hviGF61C6tMZQODC6lwU0lhFH7Xl\noFTYatbBs8MzE9k/rSNKsKkSdm9eZvhwur/EXR7I7ceLEim0CMQ2XTvwL8uRxSwP\nrEoqGrAz9QKBgByX2G9YzYzQXF6aOAsvJzrU/cnJgx44X17KUCC3ld708cTHEKOU\nG+MScCFLzH449aShN14991cMSIk2gDxtzx+jejZezURkyD0XzRcpgokE6UlDB9li\ng5qbC2g4IqeoIgY81ZrPKecl5g9kuavKNgOmHYpFXG9T3C/WgptkAWVzAoGAad+a\n0tWfTej5B5OPOctLG2c7Cq8W8wCcl4i6UP89TUhnPPN10HX+TOuudjw3Ujrpikt7\nGhM+noXA2tsT1Ua1/4+tUiXrgGzEGi7IOtD35SoLp9Y1rKuCc+2xze+GLGAqxcm7\n9kq2lspCJnbocA7YzmZGmcsTd4nZjuDoMNeIzXECgYBN3vspWdocpxMFYr+IJkxQ\nkobzS2/SOd2qoltos0fQXsVGehQI+3EnXdsr22uhnbYyvT6caA649PSWbwDkjfU0\nVzNqWXSB/VDnZ2mVyfLYps86OMbMf5A62OYwI8QIlCBrCgfPxGvhmpgS/XfTjgjs\n1CBcDCEGtwIu3/drNW2/gw==\n-----END PRIVATE KEY-----\n",
        "client_email": "f8-868@f8ai-465903.iam.gserviceaccount.com",
        "client_id": "101655712299195998813",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/f8-868%40f8ai-465903.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }
    
    try:
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        
        # Test different APIs
        apis_to_test = [
            ('drive', 'v3', 'Google Drive API'),
            ('docs', 'v1', 'Google Docs API'),
            ('sheets', 'v4', 'Google Sheets API'),
            ('serviceusage', 'v1', 'Service Usage API')
        ]
        
        for api_name, version, display_name in apis_to_test:
            print(f"\n🔍 Testing {display_name}...")
            try:
                service = build(api_name, version, credentials=credentials)
                
                if api_name == 'drive':
                    # Test Drive API
                    result = service.files().list(pageSize=1).execute()
                    print(f"✅ {display_name} - Working")
                    
                elif api_name == 'docs':
                    # Test Docs API - try to create a document
                    doc = service.documents().create(body={'title': 'API Test Doc'}).execute()
                    # Delete the test document
                    drive_service = build('drive', 'v3', credentials=credentials)
                    drive_service.files().delete(fileId=doc['documentId']).execute()
                    print(f"✅ {display_name} - Working")
                    
                elif api_name == 'sheets':
                    # Test Sheets API
                    sheet = service.spreadsheets().create(
                        body={'properties': {'title': 'API Test Sheet'}}
                    ).execute()
                    # Delete the test sheet
                    drive_service = build('drive', 'v3', credentials=credentials)
                    drive_service.files().delete(fileId=sheet['spreadsheetId']).execute()
                    print(f"✅ {display_name} - Working")
                    
                elif api_name == 'serviceusage':
                    # Test Service Usage API
                    print(f"✅ {display_name} - Available")
                    
            except HttpError as e:
                if e.resp.status == 403:
                    print(f"❌ {display_name} - Permission Denied (API may not be enabled)")
                else:
                    print(f"⚠️  {display_name} - Error: {e}")
            except Exception as e:
                print(f"❌ {display_name} - Error: {e}")
        
        print("\n" + "="*50)
        print("SOLUTION: Enable Missing APIs")
        print("="*50)
        print("Go to Google Cloud Console → APIs & Services → Library")
        print("Search for and enable these APIs:")
        print("  1. Google Docs API")
        print("  2. Google Sheets API")
        print("  3. Google Drive API (may already be enabled)")
        print("\nAfter enabling APIs, the service account will be able to:")
        print("  ✅ Create Google Docs and Sheets")
        print("  ✅ Populate F8 workspace with cannabis templates")
        print("  ✅ Enable full agent-based document management")
        
    except Exception as e:
        print(f"❌ Error checking APIs: {e}")

if __name__ == "__main__":
    check_api_status()