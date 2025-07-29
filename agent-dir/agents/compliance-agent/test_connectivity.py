
#!/usr/bin/env python3
"""
Test connectivity to regulation websites
"""

import subprocess
import requests
from urllib.parse import urlparse

def test_domain(domain):
    """Test if we can reach a domain"""
    print(f"\nTesting {domain}:")
    
    # Test with curl
    try:
        result = subprocess.run(['curl', '-I', '--connect-timeout', '10', f'https://{domain}'], 
                              capture_output=True, text=True, timeout=15)
        if result.returncode == 0:
            print(f"  ✅ curl HTTPS: Success")
            print(f"     Headers: {result.stdout.split()[1] if result.stdout.split() else 'No status'}")
        else:
            print(f"  ❌ curl HTTPS: Failed - {result.stderr[:100]}")
            
            # Try HTTP
            result = subprocess.run(['curl', '-I', '--connect-timeout', '10', f'http://{domain}'], 
                                  capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                print(f"  ⚠️  curl HTTP: Success (no HTTPS)")
            else:
                print(f"  ❌ curl HTTP: Failed - {result.stderr[:100]}")
    except Exception as e:
        print(f"  ❌ curl error: {e}")
    
    # Test with Python requests
    try:
        response = requests.head(f'https://{domain}', timeout=10, verify=False)
        print(f"  ✅ requests HTTPS: {response.status_code}")
    except Exception as e:
        print(f"  ❌ requests HTTPS: {e}")
        try:
            response = requests.head(f'http://{domain}', timeout=10)
            print(f"  ⚠️  requests HTTP: {response.status_code}")
        except Exception as e2:
            print(f"  ❌ requests HTTP: {e2}")

def main():
    test_domains = [
        'cannabis.ca.gov',
        'sbg.colorado.gov',
        'lcb.wa.gov',
        'google.com'  # Control test
    ]
    
    print("🔍 Testing connectivity to regulation websites...")
    
    for domain in test_domains:
        test_domain(domain)
    
    print("\n📝 Summary:")
    print("   If google.com works but regulation sites don't, there may be")
    print("   network restrictions or the sites are blocking automated access.")

if __name__ == "__main__":
    main()
