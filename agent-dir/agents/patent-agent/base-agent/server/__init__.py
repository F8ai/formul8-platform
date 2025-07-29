"""
Base Agent Server Module
Provides web server and API endpoints for agent monitoring
"""

from .app import create_agent_server
from .routes import setup_routes

__all__ = ['create_agent_server', 'setup_routes']