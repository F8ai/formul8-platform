#!/usr/bin/env python3
"""
Python build script for deployment as a Python application
This script builds the frontend and prepares the application for Python deployment
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and handle errors"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        print(f"✅ {cmd}")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running: {cmd}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def main():
    print("🐍 Building Formul8 Platform for Python deployment...")
    
    # Step 1: Build frontend assets using the optimized build script
    print("\n📦 Step 1: Building frontend assets...")
    run_command("node build.js")
    
    # Step 2: Ensure Python packages exist
    print("\n🔧 Step 2: Setting up Python environment...")
    
    # Create __init__.py files if they don't exist
    python_agents_dir = Path("agents/python-agents")
    if python_agents_dir.exists():
        init_file = python_agents_dir / "__init__.py"
        if not init_file.exists():
            init_file.write_text('"""Formul8 Python Agents Package"""\n')
    
    # Step 3: Copy necessary files for Python deployment
    print("\n📂 Step 3: Preparing Python deployment structure...")
    
    # Ensure dist directory has the Python server
    dist_dir = Path("dist")
    if dist_dir.exists():
        shutil.copy2("python_server.py", dist_dir / "python_server.py")
    
    print("\n✅ Python build completed!")
    print("\n🚀 To run Python server:")
    print("   python python_server.py")
    print("\n🐳 For Python Docker deployment:")
    print("   Use python_server.py as the entry point")

if __name__ == "__main__":
    main()