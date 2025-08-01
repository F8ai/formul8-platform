import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  position: { section: string; angle: number; radius: number };
  metrics: {
    confidence: number;
    baselineTasks: {
      total: number;
      passed: number;
      failed: number;
      active: number;
      completionRate: number;
    };
  };
  status: 'active' | 'dev' | 'inactive';
}

const orchestraAgents: Agent[] = [
  // Front Section (closest to conductor) - Core Operations
  {
    id: 'compliance',
    name: 'Compliance',
    emoji: '🛡️',
    position: { section: 'front', angle: -30, radius: 120 },
    metrics: { confidence: 78, baselineTasks: { total: 120, passed: 94, failed: 26, active: 8, completionRate: 78 } },
    status: 'active'
  },
  {
    id: 'operations',
    name: 'Operations',
    emoji: '⚙️',
    position: { section: 'front', angle: 0, radius: 120 },
    metrics: { confidence: 87, baselineTasks: { total: 110, passed: 96, failed: 14, active: 6, completionRate: 87 } },
    status: 'active'
  },
  {
    id: 'formulation',
    name: 'Formulation',
    emoji: '🧪',
    position: { section: 'front', angle: 30, radius: 120 },
    metrics: { confidence: 91, baselineTasks: { total: 140, passed: 127, failed: 13, active: 4, completionRate: 91 } },
    status: 'active'
  },

  // Middle Section - Specialized Services
  {
    id: 'patent',
    name: 'Patent',
    emoji: '⚖️',
    position: { section: 'middle', angle: -45, radius: 180 },
    metrics: { confidence: 82, baselineTasks: { total: 95, passed: 78, failed: 17, active: 3, completionRate: 82 } },
    status: 'active'
  },
  {
    id: 'science',
    name: 'Science',
    emoji: '🔬',
    position: { section: 'middle', angle: -15, radius: 180 },
    metrics: { confidence: 93, baselineTasks: { total: 130, passed: 121, failed: 9, active: 5, completionRate: 93 } },
    status: 'active'
  },
  {
    id: 'spectra',
    name: 'Spectra',
    emoji: '📊',
    position: { section: 'middle', angle: 15, radius: 180 },
    metrics: { confidence: 70, baselineTasks: { total: 90, passed: 63, failed: 27, active: 9, completionRate: 70 } },
    status: 'dev'
  },
  {
    id: 'sourcing',
    name: 'Sourcing',
    emoji: '🛒',
    position: { section: 'middle', angle: 45, radius: 180 },
    metrics: { confidence: 72, baselineTasks: { total: 85, passed: 61, failed: 24, active: 12, completionRate: 72 } },
    status: 'active'
  },

  // Back Section - External Facing
  {
    id: 'marketing',
    name: 'Marketing',
    emoji: '📢',
    position: { section: 'back', angle: -20, radius: 240 },
    metrics: { confidence: 88, baselineTasks: { total: 100, passed: 88, failed: 12, active: 2, completionRate: 88 } },
    status: 'active'
  },
  {
    id: 'customer',
    name: 'Customer',
    emoji: '🤝',
    position: { section: 'back', angle: 20, radius: 240 },
    metrics: { confidence: 84, baselineTasks: { total: 75, passed: 63, failed: 12, active: 7, completionRate: 84 } },
    status: 'active'
  }
];

function AgentNode({ agent }: { agent: Agent }) {
  // Convert polar to cartesian coordinates
  const x = Math.cos((agent.position.angle * Math.PI) / 180) * agent.position.radius;
  const y = Math.sin((agent.position.angle * Math.PI) / 180) * agent.position.radius;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'dev': return 'text-yellow-600';
      case 'inactive': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-blue-500';
    if (confidence >= 70) return 'bg-yellow-500';
    if (confidence >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Create circular progress arc
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (agent.metrics.confidence / 100) * circumference;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
      onClick={() => window.location.href = `/agent/${agent.id}`}
    >
      <div className="relative">
        {/* Circular Progress Background */}
        <svg width="60" height="60" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="rgb(229, 231, 235)"
            strokeWidth="3"
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-300 ${
              agent.metrics.confidence >= 90 ? 'text-green-500' :
              agent.metrics.confidence >= 80 ? 'text-blue-500' :
              agent.metrics.confidence >= 70 ? 'text-yellow-500' :
              agent.metrics.confidence >= 60 ? 'text-orange-500' :
              'text-red-500'
            }`}
          />
        </svg>
        
        {/* Agent Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg mb-0.5">{agent.emoji}</div>
          <div className={`text-xs font-medium ${getConfidenceColor(agent.metrics.confidence)} text-white px-1 rounded`}>
            {agent.metrics.confidence}%
          </div>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg min-w-48">
            <div className="font-semibold text-center mb-1">{agent.emoji} {agent.name}</div>
            <div className="space-y-1 text-left">
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{agent.metrics.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span>Baseline Tasks:</span>
                <span className="font-medium">{agent.metrics.baselineTasks.passed}/{agent.metrics.baselineTasks.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Tests:</span>
                <span className="font-medium">{agent.metrics.baselineTasks.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-400">{agent.metrics.baselineTasks.failed}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium capitalize ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrchestraAgentLayout() {
  const { data: agentStatus } = useQuery({
    queryKey: ["/api/agents/status"],
    retry: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Agent Orchestra</span>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">90%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">80-89%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">70-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">&lt;70%</span>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: '500px', minHeight: '500px' }}>
          {/* Orchestra sections background */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Back section arc */}
            <svg width="500" height="500" className="absolute">
              <path
                d="M 150 250 A 100 100 0 0 1 350 250"
                stroke="rgb(243, 244, 246)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>
            {/* Middle section arc */}
            <svg width="400" height="400" className="absolute">
              <path
                d="M 140 200 A 60 60 0 0 1 260 200"
                stroke="rgb(243, 244, 246)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>
            {/* Front section arc */}
            <svg width="300" height="300" className="absolute">
              <path
                d="M 120 150 A 30 30 0 0 1 180 150"
                stroke="rgb(243, 244, 246)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>
          </div>

          {/* Conductor position (center) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">🎼</span>
            </div>
            <div className="text-center mt-1 text-xs font-medium text-gray-600">Orchestrator</div>
          </div>

          {/* Section labels */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
            External Services
          </div>
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
            Specialized Agents
          </div>
          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
            Core Operations
          </div>

          {/* Agent nodes */}
          {orchestraAgents.map((agent) => (
            <AgentNode key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {orchestraAgents.filter(a => a.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600">Active Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(orchestraAgents.reduce((sum, a) => sum + a.metrics.confidence, 0) / orchestraAgents.length)}%
            </div>
            <div className="text-xs text-gray-600">Avg Confidence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {orchestraAgents.reduce((sum, a) => sum + a.metrics.baselineTasks.active, 0)}
            </div>
            <div className="text-xs text-gray-600">Active Tests</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {orchestraAgents.reduce((sum, a) => sum + a.metrics.baselineTasks.failed, 0)}
            </div>
            <div className="text-xs text-gray-600">Failed Tasks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}