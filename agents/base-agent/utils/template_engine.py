#!/usr/bin/env python3
"""
Template Engine for Agent Dashboards
Handles rendering of base and agent-specific dashboard templates
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, Template

class DashboardTemplateEngine:
    """Template engine for rendering agent dashboards"""
    
    def __init__(self, base_template_dir: str = None):
        """Initialize template engine"""
        if base_template_dir is None:
            base_template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        
        self.base_template_dir = Path(base_template_dir)
        
        # Ensure the template directory exists
        if not self.base_template_dir.exists():
            print(f"Warning: Template directory does not exist: {self.base_template_dir}")
            # Try alternative path
            alt_path = Path("base_agent/templates")
            if alt_path.exists():
                self.base_template_dir = alt_path
                print(f"Using alternative template directory: {self.base_template_dir}")
        
        self.env = Environment(
            loader=FileSystemLoader(str(self.base_template_dir)),
            autoescape=True
        )
    
    def render_base_dashboard(self, agent_name: str, context: Dict[str, Any] = None) -> str:
        """Render the base dashboard template"""
        if context is None:
            context = {}
        
        context['agent_name'] = agent_name
        
        template = self.env.get_template('base_dashboard.html')
        return template.render(**context)
    
    def render_agent_dashboard(self, agent_name: str, agent_type: str, 
                              context: Dict[str, Any] = None) -> str:
        """Render an agent-specific dashboard"""
        if context is None:
            context = {}
        
        context['agent_name'] = agent_name
        context['agent_type'] = agent_type
        
        # Try to load agent-specific template
        agent_template_path = f"{agent_type}_dashboard.html"
        
        if self.env.loader.searchpath and os.path.exists(os.path.join(self.env.loader.searchpath[0], agent_template_path)):
            template = self.env.get_template(agent_template_path)
        else:
            # Fallback to base template
            template = self.env.get_template('base_dashboard.html')
        
        return template.render(**context)
    
    def get_available_templates(self) -> list:
        """Get list of available dashboard templates"""
        templates = []
        if self.base_template_dir.exists():
            for file in self.base_template_dir.glob('*_dashboard.html'):
                templates.append(file.stem)
        return templates
    
    def create_agent_dashboard(self, agent_name: str, agent_type: str, 
                              output_path: str, context: Dict[str, Any] = None) -> bool:
        """Create a rendered dashboard file for a specific agent"""
        try:
            print(f"Rendering dashboard for agent: {agent_name} ({agent_type})")
            print(f"Template directory: {self.base_template_dir}")
            print(f"Available templates: {self.get_available_templates()}")
            
            html_content = self.render_agent_dashboard(agent_name, agent_type, context)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return True
            
        except Exception as e:
            print(f"Error creating dashboard: {e}")
            import traceback
            traceback.print_exc()
            return False

def create_compliance_dashboard(output_path: str = "dashboard.html") -> bool:
    """Create a compliance agent dashboard"""
    engine = DashboardTemplateEngine()
    
    # Compliance-specific context
    context = {
        'agent_name': 'Compliance Agent',
        'agent_type': 'compliance',
        'description': 'Cannabis Regulatory Compliance and Legal Guidance',
        'features': [
            'State-by-state regulation monitoring',
            'Compliance requirement analysis',
            'Regulatory update tracking',
            'Legal guidance generation'
        ]
    }
    
    return engine.create_agent_dashboard(
        agent_name='Compliance Agent',
        agent_type='compliance',
        output_path=output_path,
        context=context
    )

if __name__ == "__main__":
    # Example usage
    engine = DashboardTemplateEngine()
    
    # Create compliance dashboard
    success = create_compliance_dashboard()
    if success:
        print("✅ Compliance dashboard created successfully!")
    else:
        print("❌ Failed to create compliance dashboard") 