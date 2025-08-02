#!/usr/bin/env python3
"""
FastAPI server entry point for Python deployment
This serves as an alternative entry point when deploying as a Python application
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# Initialize FastAPI app
app = FastAPI(
    title="Formul8 Platform",
    description="Advanced multi-agent AI platform for cannabis industry",
    version="1.0.0"
)

# Serve static files from dist/public if available
dist_public = Path("dist/public")
if dist_public.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_public / "assets")), name="assets")
    
    @app.get("/")
    async def serve_index():
        index_path = dist_public / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built")
else:
    @app.get("/")
    async def fallback_index():
        return {"message": "Formul8 Platform Python Server", "status": "running"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "server": "python-fastapi"}

# API endpoints can be added here for Python-specific functionality
@app.get("/api/python/info")
async def python_info():
    return {
        "python_version": "3.11+",
        "server_type": "FastAPI",
        "deployment_mode": "python"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )