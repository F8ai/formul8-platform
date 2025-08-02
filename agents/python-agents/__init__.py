"""
Formul8 Platform Python Agents

This package contains the Python-based AI agents for the Formul8 platform.
"""

__version__ = "0.1.0"
__author__ = "Formul8 Team"

# Export main agent classes
from .base_agent import BaseAgent
from .sourcing_agent import SourcingAgent

__all__ = ["BaseAgent", "SourcingAgent"]