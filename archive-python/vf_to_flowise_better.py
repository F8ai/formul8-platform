import json
import sys
import re
from typing import Dict, List, Any, Optional

def extract_text_from_variants(vf_json: Dict, text_id: str) -> str:
    """Extract text content from Voiceflow text resources"""
    texts = vf_json.get('version', {}).get('programResources', {}).get('texts', {})
    if text_id not in texts:
        return ""
    
    text_data = texts[text_id]
    variants = text_data.get('variants', {})
    
    if 'default:en-us' not in variants:
        return ""
    
    text_parts = []
    for item in variants['default:en-us']:
        if 'data' in item and 'text' in item['data']:
            for text_item in item['data']['text']:
                if 'children' in text_item:
                    for child in text_item['children']:
                        if 'text' in child:
                            text_parts.append(child['text'])
    
    return " ".join(text_parts)

def get_block_type_and_style(block_type: str, block_data: Dict) -> Dict:
    """Determine block styling based on Voiceflow block type"""
    colors = {
        'start': {
            'background': "#10b981",
            'borderColor': "#047857",
            'color': "white",
            'borderRadius': "20px",
            'shape': 'oval'
        },
        'message': {
            'background': "#3b82f6",
            'borderColor': "#1e40af", 
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'block': {
            'background': "#8b5cf6",
            'borderColor': "#6d28d9",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'response-prompt': {
            'background': "#f59e0b",
            'borderColor': "#d97706",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'capture-v3': {
            'background': "#ef4444",
            'borderColor': "#dc2626",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'choice': {
            'background': "#6b7280",
            'borderColor': "#4b5563",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'note': {
            'background': "#fbbf24",
            'borderColor': "#f59e0b",
            'color': "white",
            'borderRadius': "6px",
            'shape': 'rectangle'
        },
        'set-v3': {
            'background': "#6b7280",
            'borderColor': "#4b5563",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'kb-search': {
            'background': "#8b5cf6",
            'borderColor': "#6d28d9",
            'color': "white",
            'borderRadius': "8px",
            'shape': 'rectangle'
        },
        'default': {
            'background': "#f3f4f6",
            'borderColor': "#d1d5db",
            'color': "#374151",
            'borderRadius': "8px",
            'shape': 'rectangle'
        }
    }
    
    return colors.get(block_type, colors['default'])

def get_block_icon(block_type: str) -> str:
    """Get icon for block type"""
    icons = {
        'start': '▶️',
        'message': '💬',
        'block': '📦',
        'response-prompt': '🤖',
        'capture-v3': '📝',
        'choice': '❓',
        'note': '📝',
        'set-v3': '⚙️',
        'kb-search': '🔍',
        'default': '⚙️'
    }
    return icons.get(block_type, icons['default'])

def analyze_vf_structure(vf_json: Dict) -> Dict:
    """Analyze the Voiceflow structure to understand the flow better"""
    diagrams = vf_json.get('diagrams', {})
    root_diagram = None
    
    for diagram_id, diagram in diagrams.items():
        if diagram.get('name') == 'ROOT':
            root_diagram = diagram
            break
    
    if not root_diagram:
        return {"nodes": [], "edges": []}
    
    # Get all nodes and their connections
    nodes = root_diagram.get('nodes', {})
    edges = []
    
    # Build a map of node connections
    connections = {}
    for node_id, node_data in nodes.items():
        data = node_data.get('data', {})
        ports = data.get('portsV2', {})
        
        connections[node_id] = {
            'next': [],
            'noMatch': [],
            'else': [],
            'fail': []
        }
        
        # Built-in connections
        for port_key, port_data in ports.get('builtIn', {}).items():
            if 'target' in port_data and port_data['target']:
                connections[node_id][port_key] = [port_data['target']]
        
        # By-key connections
        for port_key, port_data in ports.get('byKey', {}).items():
            if 'target' in port_data and port_data['target']:
                if port_key not in connections[node_id]:
                    connections[node_id][port_key] = []
                connections[node_id][port_key].append(port_data['target'])
    
    return {
        'nodes': nodes,
        'connections': connections
    }

def create_flow_layout(nodes: Dict, connections: Dict) -> List[Dict]:
    """Create a logical flow layout based on connections"""
    # Find the start node (usually has no incoming connections)
    start_nodes = []
    all_targets = set()
    
    for node_id, conns in connections.items():
        for port_type, targets in conns.items():
            all_targets.update(targets)
    
    for node_id in nodes.keys():
        if node_id not in all_targets:
            start_nodes.append(node_id)
    
    # If no clear start, use the first node
    if not start_nodes:
        start_nodes = [list(nodes.keys())[0]] if nodes else []
    
    # Build the flow sequence
    flow_sequence = []
    visited = set()
    
    def traverse(node_id: str, depth: int = 0):
        if node_id in visited or depth > 50:  # Prevent infinite loops
            return
        visited.add(node_id)
        flow_sequence.append(node_id)
        
        # Follow 'next' connections first
        next_nodes = connections.get(node_id, {}).get('next', [])
        for next_node in next_nodes:
            traverse(next_node, depth + 1)
    
    # Start from each start node
    for start_node in start_nodes:
        traverse(start_node)
    
    return flow_sequence

def convert_vf_to_reactflow(vf_json: Dict) -> Dict:
    """Convert Voiceflow JSON to React Flow format with better structure"""
    # Analyze the structure
    structure = analyze_vf_structure(vf_json)
    nodes = structure['nodes']
    connections = structure['connections']
    
    # Create flow layout
    flow_sequence = create_flow_layout(nodes, connections)
    
    # Convert to React Flow format
    reactflow_nodes = []
    reactflow_edges = []
    
    # Layout parameters
    horizontal_spacing = 350
    vertical_spacing = 150
    start_x = 200
    start_y = 300
    
    # Create nodes
    for i, node_id in enumerate(flow_sequence):
        if node_id not in nodes:
            continue
            
        node_data = nodes[node_id]
        data = node_data.get('data', {})
        block_type = node_data.get('type', 'default')
        
        # Extract text content
        text_content = ""
        if 'steps' in data and data['steps']:
            for step_id in data['steps']:
                step_text = extract_text_from_variants(vf_json, step_id)
                if step_text:
                    text_content += step_text + " "
        
        # Get block name
        block_name = data.get('name', f"{block_type.title()} Block")
        if not block_name and text_content:
            words = text_content.split()[:3]
            block_name = " ".join(words) + "..."
        
        # Get styling
        style_info = get_block_type_and_style(block_type, data)
        
        # Position
        if block_type == 'start':
            pos = {'x': start_x, 'y': start_y}
        else:
            base_x = start_x + (i * horizontal_spacing)
            base_y = start_y + (i % 3 - 1) * vertical_spacing * 0.2
            pos = {'x': base_x, 'y': base_y}
        
        # Create React Flow node
        reactflow_node = {
            "id": node_id,
            "type": "default",
            "data": {
                "label": block_name,
                "content": text_content.strip(),
                "blockType": block_type,
                "originalData": data
            },
            "position": pos,
            "style": {
                "background": style_info['background'],
                "color": style_info['color'],
                "border": f"2px solid {style_info['borderColor']}",
                "borderRadius": style_info['borderRadius'],
                "padding": "12px 16px",
                "minWidth": "200px",
                "maxWidth": "300px",
                "fontSize": "13px",
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                "position": "relative",
                "overflow": "hidden"
            }
        }
        reactflow_nodes.append(reactflow_node)
    
    # Create edges based on flow sequence
    for i in range(len(flow_sequence) - 1):
        source_id = flow_sequence[i]
        target_id = flow_sequence[i + 1]
        
        edge = {
            "id": f"e{source_id}-{target_id}",
            "source": source_id,
            "target": target_id,
            "type": "smoothstep",
            "style": { 
                "stroke": "#9ca3af", 
                "strokeWidth": 2
            }
        }
        reactflow_edges.append(edge)
    
    # Add explanatory notes
    example_notes = [
        {
            "id": "note_welcome",
            "content": "First, we welcome the user and ask for their question. We capture their response using a capture step.",
            "x": 200,
            "y": 100
        },
        {
            "id": "note_confirm",
            "content": "We summarize their problem using the prompt step, then ask the user to confirm if we're understanding their question correctly using a button step.",
            "x": 550,
            "y": 100
        },
        {
            "id": "note_simplify",
            "content": "We simplify the users question and store the simplified question using the set step.",
            "x": 900,
            "y": 100
        },
        {
            "id": "note_search",
            "content": "We then query the knowledge base for potential answers to their question.",
            "x": 1250,
            "y": 100
        },
        {
            "id": "note_answer",
            "content": "If we find an answer to the user's question in the knowledge base, we use AI to write a user-friendly reply containing it with the prompt step.",
            "x": 1600,
            "y": 100
        }
    ]
    
    for note in example_notes:
        note_node = {
            "id": note["id"],
            "type": "default",
            "data": {
                "label": "Note",
                "content": note["content"],
                "blockType": "note",
                "isNote": True
            },
            "position": {
                "x": note["x"],
                "y": note["y"]
            },
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
        reactflow_nodes.append(note_node)
    
    return { "nodes": reactflow_nodes, "edges": reactflow_edges }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/vf_to_flowise_better.py input.vf output.json")
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        vf = json.load(f)
    
    rf = convert_vf_to_reactflow(vf)
    
    with open(sys.argv[2], "w") as f:
        json.dump(rf, f, indent=2)
    
    print(f"Converted {sys.argv[1]} to {sys.argv[2]}")
    print(f"Found {len(rf['nodes'])} nodes and {len(rf['edges'])} edges") 