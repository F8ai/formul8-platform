import json
import sys
import requests
import os
from typing import Dict, List, Any

def import_to_flowise(vf_file_path: str, flowise_url: str = "http://localhost:3050") -> Dict:
    """
    Import Voiceflow project into Flowise and get the flow data
    
    This is a simplified approach - in practice, you would:
    1. Use Flowise's UI to import the Voiceflow project
    2. Use Flowise's API to get the flow data
    3. Convert that to React Flow format
    """
    
    # For now, let's create a simple mock flow that looks like Voiceflow
    # In a real implementation, you would:
    # 1. Upload the .vf file to Flowise
    # 2. Use Flowise's API to get the parsed flow
    # 3. Convert Flowise's format to React Flow format
    
    mock_flow = {
        "nodes": [
            {
                "id": "start",
                "type": "default",
                "data": {
                    "label": "Start",
                    "content": "Welcome to Formul8 AI",
                    "blockType": "start",
                    "isNote": False
                },
                "position": {"x": 200, "y": 300},
                "style": {
                    "background": "#10b981",
                    "color": "white",
                    "border": "2px solid #047857",
                    "borderRadius": "20px",
                    "padding": "12px 16px",
                    "minWidth": "120px",
                    "maxWidth": "150px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "welcome",
                "type": "default",
                "data": {
                    "label": "Welcome Message",
                    "content": "Hello! I'm Formul8 AI, your dedicated cannabis industry assistant. How can I help you today?",
                    "blockType": "message",
                    "isNote": False
                },
                "position": {"x": 550, "y": 300},
                "style": {
                    "background": "#3b82f6",
                    "color": "white",
                    "border": "2px solid #1e40af",
                    "borderRadius": "8px",
                    "padding": "12px 16px",
                    "minWidth": "200px",
                    "maxWidth": "300px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "capture",
                "type": "default",
                "data": {
                    "label": "Capture User Input",
                    "content": "Capture the user's question or request",
                    "blockType": "capture-v3",
                    "isNote": False
                },
                "position": {"x": 900, "y": 300},
                "style": {
                    "background": "#ef4444",
                    "color": "white",
                    "border": "2px solid #dc2626",
                    "borderRadius": "8px",
                    "padding": "12px 16px",
                    "minWidth": "200px",
                    "maxWidth": "300px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "analyze",
                "type": "default",
                "data": {
                    "label": "Analyze Request",
                    "content": "Analyze the user's request and determine the best agent to handle it",
                    "blockType": "response-prompt",
                    "isNote": False
                },
                "position": {"x": 1250, "y": 300},
                "style": {
                    "background": "#f59e0b",
                    "color": "white",
                    "border": "2px solid #d97706",
                    "borderRadius": "8px",
                    "padding": "12px 16px",
                    "minWidth": "200px",
                    "maxWidth": "300px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "route",
                "type": "default",
                "data": {
                    "label": "Route to Agent",
                    "content": "Route the request to the appropriate specialized agent",
                    "blockType": "choice",
                    "isNote": False
                },
                "position": {"x": 1600, "y": 300},
                "style": {
                    "background": "#6b7280",
                    "color": "white",
                    "border": "2px solid #4b5563",
                    "borderRadius": "8px",
                    "padding": "12px 16px",
                    "minWidth": "200px",
                    "maxWidth": "300px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "response",
                "type": "default",
                "data": {
                    "label": "Generate Response",
                    "content": "Generate a comprehensive response using the selected agent",
                    "blockType": "response-prompt",
                    "isNote": False
                },
                "position": {"x": 1950, "y": 300},
                "style": {
                    "background": "#f59e0b",
                    "color": "white",
                    "border": "2px solid #d97706",
                    "borderRadius": "8px",
                    "padding": "12px 16px",
                    "minWidth": "200px",
                    "maxWidth": "300px",
                    "fontSize": "13px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden"
                }
            },
            {
                "id": "note_welcome",
                "type": "default",
                "data": {
                    "label": "Note",
                    "content": "First, we welcome the user and ask for their question. We capture their response using a capture step.",
                    "blockType": "note",
                    "isNote": True
                },
                "position": {"x": 200, "y": 100},
                "style": {
                    "background": "#fbbf24",
                    "color": "white",
                    "border": "2px solid #f59e0b",
                    "borderRadius": "6px",
                    "padding": "10px 12px",
                    "minWidth": "200px",
                    "maxWidth": "280px",
                    "fontSize": "12px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden",
                    "opacity": "0.95"
                }
            },
            {
                "id": "note_analyze",
                "type": "default",
                "data": {
                    "label": "Note",
                    "content": "We analyze the user's request and determine which specialized agent should handle it based on the content.",
                    "blockType": "note",
                    "isNote": True
                },
                "position": {"x": 1250, "y": 100},
                "style": {
                    "background": "#fbbf24",
                    "color": "white",
                    "border": "2px solid #f59e0b",
                    "borderRadius": "6px",
                    "padding": "10px 12px",
                    "minWidth": "200px",
                    "maxWidth": "280px",
                    "fontSize": "12px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden",
                    "opacity": "0.95"
                }
            },
            {
                "id": "note_response",
                "type": "default",
                "data": {
                    "label": "Note",
                    "content": "Finally, we generate a comprehensive response using the selected specialized agent's knowledge and capabilities.",
                    "blockType": "note",
                    "isNote": True
                },
                "position": {"x": 1950, "y": 100},
                "style": {
                    "background": "#fbbf24",
                    "color": "white",
                    "border": "2px solid #f59e0b",
                    "borderRadius": "6px",
                    "padding": "10px 12px",
                    "minWidth": "200px",
                    "maxWidth": "280px",
                    "fontSize": "12px",
                    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                    "position": "relative",
                    "overflow": "hidden",
                    "opacity": "0.95"
                }
            }
        ],
        "edges": [
            {
                "id": "e-start-welcome",
                "source": "start",
                "target": "welcome",
                "type": "smoothstep",
                "style": {"stroke": "#9ca3af", "strokeWidth": 2}
            },
            {
                "id": "e-welcome-capture",
                "source": "welcome",
                "target": "capture",
                "type": "smoothstep",
                "style": {"stroke": "#9ca3af", "strokeWidth": 2}
            },
            {
                "id": "e-capture-analyze",
                "source": "capture",
                "target": "analyze",
                "type": "smoothstep",
                "style": {"stroke": "#9ca3af", "strokeWidth": 2}
            },
            {
                "id": "e-analyze-route",
                "source": "analyze",
                "target": "route",
                "type": "smoothstep",
                "style": {"stroke": "#9ca3af", "strokeWidth": 2}
            },
            {
                "id": "e-route-response",
                "source": "route",
                "target": "response",
                "type": "smoothstep",
                "style": {"stroke": "#9ca3af", "strokeWidth": 2}
            }
        ]
    }
    
    return mock_flow

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/flowise_import.py input.vf [output.json]")
        sys.exit(1)
    
    vf_file_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "client/src/pages/voiceflow-flow.json"
    
    # Check if Flowise is running (on port 3050)
    flowise_url = "http://localhost:3050"
    try:
        response = requests.get(f"{flowise_url}/api/v1/flows", timeout=5)
        if response.status_code == 200:
            print("Flowise is running! You can import the Voiceflow project manually.")
            print("1. Open Flowise at http://localhost:3050")
            print("2. Import your Voiceflow project")
            print("3. Use Flowise's API to get the flow data")
        else:
            print("Flowise is not responding properly.")
    except requests.exceptions.RequestException:
        print("Flowise is not running. Starting with mock data for now.")
    
    # For now, use mock data that looks like a proper Voiceflow flow
    flow_data = import_to_flowise(vf_file_path, flowise_url)
    
    # Save to output file
    with open(output_path, "w") as f:
        json.dump(flow_data, f, indent=2)
    
    print(f"Created mock Voiceflow flow with {len(flow_data['nodes'])} nodes and {len(flow_data['edges'])} edges")
    print(f"Saved to {output_path}")
    print("\nTo get real data:")
    print("1. Start Flowise: docker run -d -p 3050:3000 flowiseai/flowise")
    print("2. Import your Voiceflow project into Flowise at http://localhost:3050")
    print("3. Use Flowise's API to get the actual flow data")

if __name__ == "__main__":
    main() 