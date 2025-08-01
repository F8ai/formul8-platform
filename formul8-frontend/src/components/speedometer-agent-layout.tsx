import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Agent configuration only - no mock data
const agentConfig = [
  { id: 'compliance', name: 'Compliance', emoji: '🛡️' },
  { id: 'patent', name: 'Patent', emoji: '⚖️' },
  { id: 'operations', name: 'Operations', emoji: '⚙️' },
  { id: 'formulation', name: 'Formulation', emoji: '🧪' },
  { id: 'sourcing', name: 'Sourcing', emoji: '🛒' },
  { id: 'marketing', name: 'Marketing', emoji: '📢' },
  { id: 'science', name: 'Science', emoji: '🔬' },
  { id: 'spectra', name: 'Spectra', emoji: '📊' },
  { id: 'customer-success', name: 'Customer Success', emoji: '🤝' }
];

function SpeedometerGauge({ agent }: { agent: any }) {
  // Fetch real agent metrics
  const { data: agentMetrics } = useQuery({
    queryKey: [`/api/agents/${agent.id}/metrics`],
    enabled: !!agent.id
  });

  const confidence = agentMetrics?.accuracy || 0;
  
  // Speedometer arc parameters
  const radius = 45;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Create speedometer arc (180 degrees)
  const arcLength = circumference * 0.75; // 3/4 of circle for speedometer look
  const progressLength = (confidence / 100) * arcLength;
  
  const getSpeedometerColor = (value: number) => {
    if (value >= 90) return '#10b981'; // green
    if (value >= 80) return '#3b82f6'; // blue
    if (value >= 70) return '#f59e0b'; // yellow
    if (value >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-4 hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={() => window.location.href = `/agent/${agent.id}`}
    >
      <div className="flex flex-col items-center">
        {/* Agent Header - Compact */}
        <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
          <span className="text-sm md:text-xl">{agent.emoji}</span>
          <span className="font-medium text-gray-900 text-xs md:text-sm truncate">{agent.name}</span>
        </div>
        
        {/* Speedometer - Responsive */}
        <div className="relative mb-2 md:mb-3">
          <svg 
            width="80" 
            height="50" 
            className="transform md:w-[120px] md:h-[80px]"
            viewBox="0 0 120 80"
          >
            {/* Background arc */}
            <path
              d="M 20 60 A 40 40 0 0 1 100 60"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d="M 20 60 A 40 40 0 0 1 100 60"
              stroke={getSpeedometerColor(confidence)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcLength - progressLength}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Center value */}
            <text
              x="60"
              y="50"
              textAnchor="middle"
              className="text-sm md:text-lg font-bold fill-gray-900"
            >
              {confidence}%
            </text>
          </svg>
        </div>
        
        {/* Test Results Badge */}
        <Badge variant="outline" className="text-xs">
          {agentMetrics ? 
            `${agentMetrics.baselineTasks?.passed || 0}/${agentMetrics.baselineTasks?.total || 0}` : 
            'Loading'
          }
        </Badge>
      </div>
    </div>
  );
}

export default function SpeedometerAgentLayout() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (statsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Agent Performance Overview</span>
          <Badge className="bg-blue-100 text-blue-800">
            {agentConfig.length} Agents
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Agent Speedometers Grid */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2 md:gap-4">
          {agentConfig.map((agent) => (
            <SpeedometerGauge key={agent.id} agent={agent} />
          ))}
        </div>
        
        {/* System Health Overview */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">System Health Overview</h4>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs md:text-sm text-green-700">
                  {agentConfig.length} Agents
                </span>
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Overall: <span className="font-bold text-gray-900">Loading...</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}