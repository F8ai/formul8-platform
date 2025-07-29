
#!/usr/bin/env python3
"""
Setup script for compliance-agent with base-agent submodule
"""

import os
import subprocess
import sys

def setup_submodule():
    """Initialize and update git submodules"""
    try:
        # Check if base_agent directory exists
        if not os.path.exists('base_agent'):
            print("Initializing git submodules...")
            subprocess.run(['git', 'submodule', 'init'], check=True)
            subprocess.run(['git', 'submodule', 'update'], check=True)
        
        # Install base_agent dependencies
        if os.path.exists('base_agent/requirements.txt'):
            print("Installing base-agent dependencies...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'base_agent/requirements.txt'], check=True)
        
        print("Setup completed successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_submodule()
