"""
Base Agent Flask Application
Provides standardized web server for all agents
"""

from flask import Flask, render_template_string
from flask_cors import CORS
import os
from .routes import setup_routes


def create_agent_server(agent, port: int = 5000) -> Flask:
    """Create Flask application for agent"""
    app = Flask(__name__)
    CORS(app)
    
    # Setup routes with agent instance
    setup_routes(app, agent)
    
    return app


# Basic dashboard template (can be overridden by individual agents)
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ agent.agent_type|title }} Agent Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold; }
        .status-operational { background: #d4edda; color: #155724; }
        .status-limited { background: #fff3cd; color: #856404; }
        .model-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .model-tag { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ agent.agent_type|title }} Agent</h1>
            <p>{{ agent.description }}</p>
            <span class="status-badge status-{{ 'operational' if agent.models else 'limited' }}">
                {{ 'Operational' if agent.models else 'Limited (No API Keys)' }}
            </span>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">{{ agent.get_baseline_question_count() }}</div>
                <div class="metric-label">Baseline Questions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ agent.get_available_models()|length }}</div>
                <div class="metric-label">Available Models</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ agent.domain }}</div>
                <div class="metric-label">Specialization</div>
            </div>
        </div>
        
        <div class="section">
            <h3>Available Models</h3>
            <div class="model-list">
                {% for model in agent.get_available_models() %}
                <span class="model-tag">{{ model }}</span>
                {% endfor %}
                {% if not agent.get_available_models() %}
                <p>No models available. Please configure API keys.</p>
                {% endif %}
            </div>
        </div>
        
        <div class="section">
            <h3>API Endpoints</h3>
            <ul>
                <li><code>GET /api/status</code> - Agent status</li>
                <li><code>GET /api/metrics</code> - Performance metrics</li>
                <li><code>GET /api/baseline-questions</code> - Baseline questions</li>
                <li><code>GET /api/baseline-results</code> - Test results</li>
                <li><code>POST /api/query</code> - Process query</li>
                <li><code>POST /api/test/:model</code> - Run baseline test</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""