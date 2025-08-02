#!/usr/bin/env python3
"""
Streamlit runner for the Formulation Agent
Integrates with the main Formul8 platform while providing specialized chemical analysis tools
"""

import sys
import os
import subprocess
import signal
import threading
import time
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

def run_streamlit():
    """Run the Streamlit application"""
    app_path = Path(__file__).parent / "streamlit_app.py"
    
    # Streamlit configuration
    config = {
        "server.port": 8501,
        "server.address": "0.0.0.0",
        "server.baseUrlPath": "/formulation",
        "server.enableCORS": True,
        "server.enableXsrfProtection": False,
        "browser.gatherUsageStats": False,
        "logger.level": "info"
    }
    
    # Build command
    cmd = ["streamlit", "run", str(app_path)]
    
    # Add config options
    for key, value in config.items():
        cmd.extend([f"--{key}", str(value)])
    
    print(f"🧪 Starting Formulation Agent Streamlit Dashboard...")
    print(f"📊 Dashboard will be available at: http://localhost:8501/formulation")
    print(f"🔬 Features: Molecular analysis, potency calculations, stability testing")
    
    try:
        # Run Streamlit
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Handle graceful shutdown
        def signal_handler(signum, frame):
            print("\n🛑 Shutting down Formulation Agent dashboard...")
            process.terminate()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Monitor output
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        return_code = process.poll()
        if return_code != 0:
            error_output = process.stderr.read()
            print(f"❌ Streamlit process failed with return code {return_code}")
            print(f"Error output: {error_output}")
        
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"❌ Error running Streamlit: {e}")

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = ['streamlit', 'rdkit', 'plotly', 'pandas', 'numpy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install streamlit rdkit-pypi plotly pandas numpy")
        return False
    
    return True

def main():
    print("🧪 Formul8 Formulation Agent - Streamlit Dashboard")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check if running in development mode
    if "--dev" in sys.argv:
        print("🔧 Development mode enabled")
        os.environ["STREAMLIT_SERVER_ENABLE_STATIC_SERVING"] = "true"
    
    # Run Streamlit
    run_streamlit()

if __name__ == "__main__":
    main()