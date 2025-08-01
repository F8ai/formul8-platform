import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'development';
  performance: number;
  confidence: number;
}

interface AgentInteraction {
  source: string;
  target: string;
  type: 'verification' | 'collaboration' | 'data_flow' | 'escalation';
  frequency: number;
}

interface NetworkGraphProps {
  className?: string;
}

export default function AgentNetworkGraph({ className = "" }: NetworkGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Agent data
  const agents: AgentNode[] = [
    { id: 'compliance', name: '🛡️ Compliance', type: 'Regulatory', status: 'active', performance: 85, confidence: 92 },
    { id: 'patent', name: '⚖️ Patent/Trademark', type: 'Legal', status: 'active', performance: 78, confidence: 88 },
    { id: 'operations', name: '⚙️ Operations', type: 'Business', status: 'active', performance: 90, confidence: 95 },
    { id: 'formulation', name: '🧪 Formulation', type: 'Science', status: 'active', performance: 82, confidence: 87 },
    { id: 'sourcing', name: '🛒 Sourcing', type: 'Supply Chain', status: 'active', performance: 76, confidence: 82 },
    { id: 'marketing', name: '📢 Marketing', type: 'Business', status: 'active', performance: 88, confidence: 90 },
    { id: 'science', name: '🔬 Science', type: 'Research', status: 'active', performance: 93, confidence: 96 },
    { id: 'spectra', name: '📊 Spectra', type: 'Analytics', status: 'development', performance: 70, confidence: 75 },
    { id: 'customer', name: '🤝 Customer Success', type: 'Support', status: 'active', performance: 84, confidence: 89 }
  ];

  const interactions: AgentInteraction[] = [
    { source: 'compliance', target: 'operations', type: 'verification', frequency: 15 },
    { source: 'compliance', target: 'marketing', type: 'verification', frequency: 12 },
    { source: 'formulation', target: 'science', type: 'collaboration', frequency: 20 },
    { source: 'formulation', target: 'spectra', type: 'data_flow', frequency: 18 },
    { source: 'operations', target: 'sourcing', type: 'collaboration', frequency: 14 },
    { source: 'marketing', target: 'customer', type: 'data_flow', frequency: 16 },
    { source: 'patent', target: 'formulation', type: 'verification', frequency: 8 },
    { source: 'science', target: 'compliance', type: 'escalation', frequency: 6 },
  ];

  // Responsive layout calculations
  const isMobile = window.innerWidth < 768;
  const centerX = isMobile ? 180 : 300;
  const centerY = isMobile ? 150 : 200;
  const radius = isMobile ? 80 : 120;
  const nodeRadius = isMobile ? 18 : 25;
  
  const agentPositions = agents.map((agent, index) => {
    const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...agent,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const getStatusColor = (status: string, confidence: number) => {
    if (status === 'development') return '#f59e0b';
    if (confidence >= 90) return '#10b981';
    if (confidence >= 80) return '#3b82f6';
    return '#ef4444';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'development': return <Clock className="h-3 w-3" />;
      case 'inactive': return <AlertCircle className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'verification': return '#3b82f6';
      case 'collaboration': return '#10b981';
      case 'data_flow': return '#8b5cf6';
      case 'escalation': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const selectedAgent = selectedNode ? agentPositions.find(a => a.id === selectedNode) : null;

  return (
    <div className={`relative w-full h-full bg-white rounded-lg border ${className}`}>
      <svg 
        viewBox={isMobile ? "0 0 360 300" : "0 0 600 400"} 
        className="w-full h-full"
        style={{ minHeight: isMobile ? '300px' : '400px' }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render connections */}
        {interactions.map((interaction, index) => {
          const sourceAgent = agentPositions.find(a => a.id === interaction.source);
          const targetAgent = agentPositions.find(a => a.id === interaction.target);
          
          if (!sourceAgent || !targetAgent) return null;

          const strokeWidth = Math.max(1, interaction.frequency / 3);
          const color = getInteractionColor(interaction.type);

          return (
            <g key={index}>
              <line
                x1={sourceAgent.x}
                y1={sourceAgent.y}
                x2={targetAgent.x}
                y2={targetAgent.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={interaction.type === 'escalation' ? '5,5' : 'none'}
                opacity={0.6}
              />
              {/* Connection label */}
              {!isMobile && (
                <text
                  x={(sourceAgent.x + targetAgent.x) / 2}
                  y={(sourceAgent.y + targetAgent.y) / 2 - 5}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {interaction.frequency}
                </text>
              )}
            </g>
          );
        })}

        {/* Render agent nodes */}
        {agentPositions.map((agent) => {
          const color = getStatusColor(agent.status, agent.confidence);
          const isSelected = selectedNode === agent.id;

          return (
            <g key={agent.id}>
              {/* Node shadow */}
              <circle
                cx={agent.x + 2}
                cy={agent.y + 2}
                r={nodeRadius}
                fill="rgba(0,0,0,0.1)"
              />
              
              {/* Outer ring (status) */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r={nodeRadius}
                fill={color}
                stroke={isSelected ? '#007BFF' : '#fff'}
                strokeWidth={isSelected ? 4 : 2}
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => setSelectedNode(agent.id)}
              />
              
              {/* Inner circle (confidence) */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r={nodeRadius * 0.7}
                fill="white"
                opacity={0.9}
              />
              
              {/* Confidence indicator */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r={nodeRadius * 0.5}
                fill={color}
                opacity={agent.confidence / 100}
              />

              {/* Agent icon */}
              <foreignObject
                x={agent.x - 8}
                y={agent.y - 8}
                width="16"
                height="16"
                className="pointer-events-none"
              >
                <div className="flex items-center justify-center w-full h-full text-white">
                  <Bot className="h-4 w-4" />
                </div>
              </foreignObject>

              {/* Agent label */}
              <text
                x={agent.x}
                y={agent.y + nodeRadius + (isMobile ? 12 : 15)}
                fontSize={isMobile ? "10" : "12"}
                fontWeight="600"
                fill="#374151"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {isMobile ? agent.name.split(' ')[0] : agent.name}
              </text>
              
              {/* Performance text */}
              {!isMobile && (
                <text
                  x={agent.x}
                  y={agent.y + nodeRadius + 28}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {agent.confidence}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {!isMobile && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
          <h4 className="text-sm font-semibold mb-2">Network Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Data Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
              <span>Escalation</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected agent info */}
      {selectedAgent && (
        <div className={`absolute ${isMobile ? 'bottom-4 left-4 right-4' : 'top-4 right-4'} bg-white/95 backdrop-blur-sm rounded-lg p-3 border shadow-sm ${isMobile ? 'max-w-none' : 'max-w-xs'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(selectedAgent.status)}
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>{selectedAgent.name}</span>
            </div>
          </div>
          <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-1'} text-xs`}>
            <div className="flex justify-between">
              <span>Type:</span>
              <Badge variant="outline" className="text-xs">{selectedAgent.type}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge 
                variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {selectedAgent.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Performance:</span>
              <span className="font-medium">{selectedAgent.performance}%</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">{selectedAgent.confidence}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}