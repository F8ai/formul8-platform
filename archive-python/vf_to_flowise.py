import json
import sys
import re

def extract_text_from_variants(vf_json, text_id):
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

def get_block_type_and_style(block_type, block_data):
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

def get_block_icon(block_type):
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

def convert_vf_to_reactflow(vf_json):
    nodes = []
    edges = []
    
    # Get the main ROOT diagram
    diagrams = vf_json.get('diagrams', {})
    root_diagram = None
    
    for diagram_id, diagram in diagrams.items():
        if diagram.get('name') == 'ROOT':
            root_diagram = diagram
            break
    
    if not root_diagram:
        return {"nodes": [], "edges": []}
    
    # Process nodes from the ROOT diagram - only main flow blocks
    diagram_nodes = root_diagram.get('nodes', {})
    
    # Filter to only include main flow blocks (not every single node)
    main_flow_blocks = []
    for node_id, node_data in diagram_nodes.items():
        data = node_data.get('data', {})
        block_type = node_data.get('type', 'default')
        
        # Only include blocks that are part of the main flow
        # Skip very small or utility nodes
        if (block_type in ['start', 'message', 'block', 'response-prompt', 'capture-v3', 'choice', 'set-v3', 'kb-search'] and
            data.get('name') and 
            len(data.get('steps', [])) > 0):
            main_flow_blocks.append({
                'id': node_id,
                'data': data,
                'block_type': block_type,
                'coords': node_data.get('coords', [0, 0])
            })
    
    # Sort by x-coordinate for horizontal flow
    main_flow_blocks.sort(key=lambda x: x['coords'][0])
    
    # Create a simplified horizontal layout
    horizontal_spacing = 300
    vertical_spacing = 150
    start_x = 200
    start_y = 300
    
    for i, block_info in enumerate(main_flow_blocks):
        node_id = block_info['id']
        data = block_info['data']
        block_type = block_info['block_type']
        
        # Extract text content from steps
        text_content = ""
        if 'steps' in data and data['steps']:
            for step_id in data['steps']:
                step_text = extract_text_from_variants(vf_json, step_id)
                if step_text:
                    text_content += step_text + " "
        
        # Get block name/label
        block_name = data.get('name', f"{block_type.title()} Block")
        if not block_name and text_content:
            # Use first few words of content as name
            words = text_content.split()[:3]
            block_name = " ".join(words) + "..."
        
        # Get block styling
        style_info = get_block_type_and_style(block_type, data)
        
        # Position blocks horizontally with slight vertical variation
        if block_type == 'start':
            pos = {'x': start_x, 'y': start_y}
        else:
            # Create horizontal flow with slight vertical variation
            base_x = start_x + (i * horizontal_spacing)
            base_y = start_y + (i % 3 - 1) * vertical_spacing * 0.2
            pos = {'x': base_x, 'y': base_y}
        
        # Create node with Voiceflow styling
        node = {
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
        nodes.append(node)
        
        # Create connections between consecutive blocks
        if i > 0:
            prev_node_id = main_flow_blocks[i-1]['id']
            edge = {
                "id": f"e{prev_node_id}-{node_id}",
                "source": prev_node_id,
                "target": node_id,
                "type": "smoothstep",
                "style": { 
                    "stroke": "#9ca3af", 
                    "strokeWidth": 2
                }
            }
            edges.append(edge)
    
    # Add Voiceflow-style explanatory notes
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
            "x": 500,
            "y": 100
        },
        {
            "id": "note_simplify",
            "content": "We simplify the users question and store the simplified question using the set step.",
            "x": 800,
            "y": 100
        },
        {
            "id": "note_search",
            "content": "We then query the knowledge base for potential answers to their question.",
            "x": 1100,
            "y": 100
        },
        {
            "id": "note_answer",
            "content": "If we find an answer to the user's question in the knowledge base, we use AI to write a user-friendly reply containing it with the prompt step.",
            "x": 1400,
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
        nodes.append(note_node)
    
    return { "nodes": nodes, "edges": edges }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/vf_to_flowise.py input.vf output.json")
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        vf = json.load(f)
    
    rf = convert_vf_to_reactflow(vf)
    
    with open(sys.argv[2], "w") as f:
        json.dump(rf, f, indent=2)
    
    print(f"Converted {sys.argv[1]} to {sys.argv[2]}")
    print(f"Found {len(rf['nodes'])} nodes and {len(rf['edges'])} edges") 