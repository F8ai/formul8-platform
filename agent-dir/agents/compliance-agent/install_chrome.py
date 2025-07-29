
#!/usr/bin/env python3
"""
Install Chrome and ChromeDriver for Selenium automation
"""

import os
import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_chrome():
    """Install Chrome browser and ChromeDriver"""
    try:
        # Update package list
        logger.info("Updating package list...")
        subprocess.run(['sudo', 'apt-get', 'update'], check=True)
        
        # Install dependencies
        logger.info("Installing dependencies...")
        deps = [
            'wget', 'gnupg2', 'software-properties-common',
            'apt-transport-https', 'ca-certificates', 'curl'
        ]
        subprocess.run(['sudo', 'apt-get', 'install', '-y'] + deps, check=True)
        
        # Add Google's signing key
        logger.info("Adding Google signing key...")
        subprocess.run([
            'wget', '-q', '-O', '-', 
            'https://dl.google.com/linux/linux_signing_key.pub'
        ], stdout=subprocess.PIPE, check=True)
        
        # Add Google Chrome repository
        logger.info("Adding Chrome repository...")
        with open('/tmp/google-chrome.list', 'w') as f:
            f.write('deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main\n')
        subprocess.run(['sudo', 'mv', '/tmp/google-chrome.list', '/etc/apt/sources.list.d/'], check=True)
        
        # Update package list again
        subprocess.run(['sudo', 'apt-get', 'update'], check=True)
        
        # Install Chrome
        logger.info("Installing Google Chrome...")
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'google-chrome-stable'], check=True)
        
        # Install ChromeDriver
        logger.info("Installing ChromeDriver...")
        
        # Get Chrome version
        result = subprocess.run(['google-chrome', '--version'], capture_output=True, text=True)
        chrome_version = result.stdout.strip().split()[-1].split('.')[0]
        
        # Download matching ChromeDriver
        chromedriver_url = f"https://chromedriver.storage.googleapis.com/LATEST_RELEASE_{chrome_version}"
        result = subprocess.run(['curl', '-s', chromedriver_url], capture_output=True, text=True)
        driver_version = result.stdout.strip()
        
        download_url = f"https://chromedriver.storage.googleapis.com/{driver_version}/chromedriver_linux64.zip"
        subprocess.run(['wget', '-O', '/tmp/chromedriver.zip', download_url], check=True)
        
        # Extract and install
        subprocess.run(['unzip', '/tmp/chromedriver.zip', '-d', '/tmp/'], check=True)
        subprocess.run(['sudo', 'mv', '/tmp/chromedriver', '/usr/local/bin/'], check=True)
        subprocess.run(['sudo', 'chmod', '+x', '/usr/local/bin/chromedriver'], check=True)
        
        logger.info("Chrome and ChromeDriver installed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Installation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = install_chrome()
    sys.exit(0 if success else 1)
