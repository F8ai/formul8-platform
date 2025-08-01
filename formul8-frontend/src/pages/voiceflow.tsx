import React, { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import flowData from "./voiceflow-flow.json";

// Voiceflow-style icons (using Unicode symbols)
const getBlockIcon = (blockType: string) => {
  const icons = {
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
  };
  return icons[blockType as keyof typeof icons] || icons.default;
};

// Define the data structure for nodes
interface VoiceflowNodeData extends Record<string, unknown> {
  label: string;
  content?: string;
  blockType: string;
  isNote?: boolean;
}

// Custom Voiceflow-style node component
const VoiceflowNode = ({ data }: NodeProps) => {
  const nodeData = data as VoiceflowNodeData;
  const blockType = nodeData.blockType as string;
  const isNote = nodeData.isNote as boolean || false;
  
  // Voiceflow-style colors with exact styling
  const getNodeStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: "8px",
      padding: "12px 16px",
      minWidth: "200px",
      maxWidth: "300px",
      fontSize: "13px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      border: "2px solid #e0e0e0",
      color: "#333333",
      textAlign: "left",
      position: "relative",
      overflow: "hidden"
    };

    // Special styling for notes
    if (isNote) {
      return {
        ...baseStyle,
        background: "#fbbf24",
        borderColor: "#f59e0b",
        color: "white",
        minWidth: "200px",
        maxWidth: "280px",
        padding: "10px 12px",
        fontSize: "12px",
        opacity: "0.95",
        borderRadius: "6px"
      };
    }

    // Special styling for start block (oval shape)
    if (blockType === 'start') {
      return {
        ...baseStyle,
        background: "#10b981",
        borderColor: "#047857",
        color: "white",
        borderRadius: "20px",
        minWidth: "120px",
        maxWidth: "150px",
        padding: "12px 16px",
        textAlign: "center" as const
      };
    }

    const colors = {
      'start': {
        background: "#10b981",
        borderColor: "#047857",
        color: "white",
        borderRadius: "20px"
      },
      'message': {
        background: "#3b82f6",
        borderColor: "#1e40af", 
        color: "white",
        borderRadius: "8px"
      },
      'block': {
        background: "#8b5cf6",
        borderColor: "#6d28d9",
        color: "white",
        borderRadius: "8px"
      },
      'response-prompt': {
        background: "#f59e0b",
        borderColor: "#d97706",
        color: "white",
        borderRadius: "8px"
      },
      'capture-v3': {
        background: "#ef4444",
        borderColor: "#dc2626",
        color: "white",
        borderRadius: "8px"
      },
      'choice': {
        background: "#6b7280",
        borderColor: "#4b5563",
        color: "white",
        borderRadius: "8px"
      },
      'note': {
        background: "#fbbf24",
        borderColor: "#f59e0b",
        color: "white",
        borderRadius: "6px"
      },
      'set-v3': {
        background: "#6b7280",
        borderColor: "#4b5563",
        color: "white",
        borderRadius: "8px"
      },
      'kb-search': {
        background: "#8b5cf6",
        borderColor: "#6d28d9",
        color: "white",
        borderRadius: "8px"
      },
      'default': {
        background: "#f3f4f6",
        borderColor: "#d1d5db",
        color: "#374151",
        borderRadius: "8px"
      }
    };

    const colorScheme = colors[blockType as keyof typeof colors] || colors.default;
    return {
      ...baseStyle,
      ...colorScheme
    };
  };

  return (
    <div style={getNodeStyle()}>
      <Handle 
        type="target" 
        position={Position.Top}
        style={{
          background: "#fff",
          border: "2px solid #666",
          width: "12px",
          height: "12px"
        }}
      />
      
      {/* Icon and title */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: isNote ? "6px" : "8px",
        gap: "6px",
        justifyContent: blockType === 'start' ? "center" : "flex-start"
      }}>
        <span style={{ fontSize: blockType === 'start' ? "16px" : (isNote ? "12px" : "14px") }}>
          {getBlockIcon(blockType)}
        </span>
        <div style={{ 
          fontWeight: "600", 
          fontSize: blockType === 'start' ? "13px" : (isNote ? "11px" : "13px"),
          lineHeight: "1.2"
        }}>
          {nodeData.label}
        </div>
      </div>
      
      {/* Content */}
      {nodeData.content && blockType !== 'start' && (
        <div style={{ 
          fontSize: isNote ? "10px" : "12px", 
          opacity: 0.9,
          lineHeight: "1.3",
          wordBreak: "break-word" as const,
          maxHeight: isNote ? "60px" : "80px",
          overflow: "hidden",
          background: isNote ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)",
          padding: isNote ? "6px" : "8px",
          borderRadius: "4px",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          {nodeData.content && nodeData.content.length > (isNote ? 80 : 100)
            ? nodeData.content.substring(0, isNote ? 80 : 100) + "..." 
            : nodeData.content}
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{
          background: "#fff",
          border: "2px solid #666",
          width: "12px",
          height: "12px"
        }}
      />
    </div>
  );
};

const nodeTypes = {
  voiceflow: VoiceflowNode,
};

export default function VoiceflowDashboard() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const nodesWithTypes = flowData.nodes.map(node => ({
      ...node,
      type: "voiceflow",
      data: {
        ...node.data,
        label: node.data.label || "",
        content: node.data.content || "",
        blockType: node.data.blockType || "default",
        isNote: node.data.isNote || false
      }
    })) as Node<VoiceflowNodeData>[];
    setNodes(nodesWithTypes);
    setEdges(flowData.edges);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Voiceflow-style header */}
      <div style={{ 
        padding: "0 24px", 
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Voiceflow-style logo */}
          <div style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            F8
          </div>
          
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: "20px", 
              fontWeight: "600",
              color: "#111827"
            }}>
              Formul8 AI
            </h1>
            <p style={{ 
              margin: "2px 0 0 0", 
              fontSize: "13px",
              color: "#6b7280"
            }}>
              Voiceflow Orchestration
            </p>
          </div>
        </div>
        
        {/* Voiceflow-style action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{
            padding: "8px 16px",
            background: "#f9fafb",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            color: "#374151",
            transition: "all 0.2s"
          }}>
            Share
          </button>
          <button style={{
            padding: "8px 16px",
            background: "#f9fafb", 
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            color: "#374151",
            transition: "all 0.2s"
          }}>
            Call
          </button>
          <button style={{
            padding: "8px 16px",
            background: "#10b981",
            border: "1px solid #059669",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            color: "white",
            transition: "all 0.2s"
          }}>
            ► Run
          </button>
        </div>
      </div>

      {/* Main canvas area */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ 
            padding: 0.2,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 2
          }}
          style={{
            background: "#fafafa"
          }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls 
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          />
          <MiniMap 
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
            nodeColor="#3b82f6"
            maskColor="rgba(0,0,0,0.1)"
          />
        </ReactFlow>

        {/* Floating block details panel */}
        {selectedNode && (
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "300px",
            maxWidth: "400px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000
          }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "600",
              color: "#111827"
            }}>
              Block Details
            </h3>
            <div style={{ marginBottom: "12px" }}>
              <strong>Type:</strong> {(selectedNode.data as VoiceflowNodeData).blockType}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Label:</strong> {(selectedNode.data as VoiceflowNodeData).label}
            </div>
            {(selectedNode.data as VoiceflowNodeData).content && (
              <div>
                <strong>Content:</strong>
                <div style={{ 
                  marginTop: "8px",
                  padding: "12px",
                  background: "#f9fafb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  maxHeight: "200px",
                  overflow: "auto"
                }}>
                  {(selectedNode.data as VoiceflowNodeData).content}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 