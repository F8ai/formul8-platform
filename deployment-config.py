#!/usr/bin/env python3
"""
Deployment configuration helper for mixed Node.js/Python project
Handles the deployment fixes suggested for the platform
"""

import json
import os
from pathlib import Path

class DeploymentConfig:
    """Handle deployment configuration for both Node.js and Python environments"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.has_nodejs = (self.project_root / "package.json").exists()
        self.has_python = (self.project_root / "pyproject.toml").exists()
    
    def get_deployment_mode(self):
        """Determine the appropriate deployment mode"""
        # Check environment variables for deployment hints
        runtime = os.environ.get("DEPLOYMENT_RUNTIME", "").lower()
        if runtime == "python":
            return "python"
        elif runtime == "nodejs":
            return "nodejs"
        
        # Default to Node.js since it's the primary application
        return "nodejs"
    
    def get_start_command(self):
        """Get the appropriate start command based on deployment mode"""
        mode = self.get_deployment_mode()
        
        if mode == "python":
            return "python python_server.py"
        else:
            return "node dist/index.js"
    
    def get_build_command(self):
        """Get the appropriate build command based on deployment mode"""
        mode = self.get_deployment_mode()
        
        if mode == "python":
            return "python build-python.py"
        else:
            return "node build.js"
    
    def get_port(self):
        """Get the appropriate port for the application"""
        return int(os.environ.get("PORT", 5000))
    
    def create_deployment_info(self):
        """Create deployment information file"""
        info = {
            "deployment_mode": self.get_deployment_mode(),
            "build_command": self.get_build_command(),
            "start_command": self.get_start_command(),
            "port": self.get_port(),
            "has_nodejs": self.has_nodejs,
            "has_python": self.has_python,
            "fixes_applied": [
                "Configured setuptools to explicitly specify packages",
                "Excluded non-Python directories from Python package discovery",
                "Created Python server entry point for FastAPI application",
                "Added deployment mode detection",
                "Updated build commands for both environments"
            ]
        }
        
        with open(self.project_root / "deployment-info.json", "w") as f:
            json.dump(info, f, indent=2)
        
        return info

if __name__ == "__main__":
    config = DeploymentConfig()
    info = config.create_deployment_info()
    
    print("🚀 Deployment Configuration")
    print(f"Mode: {info['deployment_mode']}")
    print(f"Build: {info['build_command']}")
    print(f"Start: {info['start_command']}")
    print(f"Port: {info['port']}")
    print("\n✅ Fixes Applied:")
    for fix in info['fixes_applied']:
        print(f"  • {fix}")