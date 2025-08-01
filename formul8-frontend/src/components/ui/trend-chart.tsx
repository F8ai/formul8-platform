import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendChartProps {
  data: {
    dates: string[];
    accuracy: number[];
    confidence: number[];
    baselineConfidence: number[];
    testsPassed: number[];
  } | null;
  agentType: string;
  isLoading?: boolean;
  showProjections?: boolean;
}

export function TrendChart({ data, agentType, isLoading, showProjections = true }: TrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historical Trends - {agentType}
          </CardTitle>
          <CardDescription>Performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading trend data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.dates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historical Trends - {agentType}
          </CardTitle>
          <CardDescription>Performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No historical data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate projected improvement timeline based on 4-phase approach
  const generateProjections = () => {
    const currentDate = new Date();
    const projectedDates: string[] = [];
    const projectedAccuracy: number[] = [];
    const projectedConfidence: number[] = [];
    const projectedBaselineConfidence: number[] = [];
    
    // Get current values or use defaults
    const currentAccuracy = data.accuracy[data.accuracy.length - 1] || 45;
    const currentConfidence = data.confidence[data.confidence.length - 1] || 0.55;
    const currentBaselineConfidence = data.baselineConfidence[data.baselineConfidence.length - 1] || 0.50;
    
    // 4-phase improvement timeline (90 days / ~13 weeks total)
    const phases = [
      { weeks: 3, accuracyTarget: 55, confidenceTarget: 0.60, baselineTarget: 0.70 }, // Phase 1: OpenAI baseline (3 weeks)
      { weeks: 6, accuracyTarget: 70, confidenceTarget: 0.75, baselineTarget: 0.80 }, // Phase 2: Tools/functions (3 weeks)
      { weeks: 9, accuracyTarget: 80, confidenceTarget: 0.85, baselineTarget: 0.90 }, // Phase 3: Advanced prompting (3 weeks) 
      { weeks: 13, accuracyTarget: 85, confidenceTarget: 0.90, baselineTarget: 0.95 }, // Phase 4: SPARQL/RAG (4 weeks)
    ];
    
    let weekCounter = 0;
    phases.forEach((phase, phaseIndex) => {
      const weeksInPhase = phase.weeks - (phaseIndex > 0 ? phases[phaseIndex - 1].weeks : 0);
      const startAccuracy = phaseIndex === 0 ? currentAccuracy : phases[phaseIndex - 1].accuracyTarget;
      const startConfidence = phaseIndex === 0 ? currentConfidence : phases[phaseIndex - 1].confidenceTarget;
      const startBaseline = phaseIndex === 0 ? currentBaselineConfidence : phases[phaseIndex - 1].baselineTarget;
      
      for (let week = 1; week <= weeksInPhase; week++) {
        weekCounter++;
        const progress = week / weeksInPhase;
        const projectedDate = new Date(currentDate);
        projectedDate.setDate(projectedDate.getDate() + weekCounter * 7);
        
        projectedDates.push(projectedDate.toLocaleDateString());
        projectedAccuracy.push(
          startAccuracy + (phase.accuracyTarget - startAccuracy) * progress
        );
        projectedConfidence.push(
          startConfidence + (phase.confidenceTarget - startConfidence) * progress
        );
        projectedBaselineConfidence.push(
          startBaseline + (phase.baselineTarget - startBaseline) * progress
        );
      }
    });
    
    return {
      dates: projectedDates,
      accuracy: projectedAccuracy,
      confidence: projectedConfidence,
      baselineConfidence: projectedBaselineConfidence,
    };
  };

  const projections = showProjections ? generateProjections() : null;

  // Transform data for recharts - combine historical and projected
  const historicalData = data.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(),
    accuracy: data.accuracy[index],
    confidence: data.confidence[index] * 100,
    baselineConfidence: data.baselineConfidence[index] * 100,
    testsPassed: data.testsPassed[index],
    isProjected: false,
  }));

  const projectedData = projections ? projections.dates.map((date, index) => ({
    date,
    projectedAccuracy: projections.accuracy[index],
    projectedConfidence: projections.confidence[index] * 100,
    projectedBaselineConfidence: projections.baselineConfidence[index] * 100,
    isProjected: true,
  })) : [];

  const chartData = [...historicalData, ...projectedData];

  // Calculate trends
  const latestAccuracy = data.accuracy[data.accuracy.length - 1];
  const previousAccuracy = data.accuracy[data.accuracy.length - 2];
  const accuracyTrend = latestAccuracy > previousAccuracy ? 'up' : 
                       latestAccuracy < previousAccuracy ? 'down' : 'stable';

  const latestConfidence = data.confidence[data.confidence.length - 1] * 100;
  const previousConfidence = data.confidence[data.confidence.length - 2] * 100;
  const confidenceTrend = latestConfidence > previousConfidence ? 'up' : 
                         latestConfidence < previousConfidence ? 'down' : 'stable';

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historical Trends - {agentType}
        </CardTitle>
        <CardDescription>
          Current performance vs 90-day improvement projections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {getTrendIcon(accuracyTrend)}
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className={`text-lg font-bold ${getTrendColor(accuracyTrend)}`}>
              {latestAccuracy.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {getTrendIcon(confidenceTrend)}
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <div className={`text-lg font-bold ${getTrendColor(confidenceTrend)}`}>
              {latestConfidence.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Latest Tests</span>
            <div className="text-lg font-bold text-blue-600">
              {data.testsPassed[data.testsPassed.length - 1]}/100
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Data Points</span>
            <div className="text-lg font-bold text-gray-600">
              {data.dates.length}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                fontSize={10}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                fontSize={10}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend fontSize={12} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Accuracy (%)"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Confidence (%)"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="baselineConfidence" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Baseline Quality (%)"
                connectNulls={false}
              />
              {showProjections && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="projectedAccuracy" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Projected Accuracy (%)"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectedConfidence" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Projected Confidence (%)"
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectedBaselineConfidence" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Projected Baseline (%)"
                    connectNulls={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ── Accuracy: Test performance
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ── Confidence: Response reliability
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            ── Baseline Quality: Test question quality
          </Badge>
          {showProjections && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              ┅┅ Projected: 4-phase improvement plan
            </Badge>
          )}
        </div>

        {/* Phase Timeline */}
        {showProjections && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">90-Day Development Timeline</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-blue-100 p-2 rounded">
                <div className="font-medium">Phase 1 (Days 1-21)</div>
                <div className="text-gray-600">OpenAI Baseline: 55% accuracy</div>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <div className="font-medium">Phase 2 (Days 22-42)</div>
                <div className="text-gray-600">Tools & Functions: 70% accuracy</div>
              </div>
              <div className="bg-orange-100 p-2 rounded">
                <div className="font-medium">Phase 3 (Days 43-63)</div>
                <div className="text-gray-600">Advanced Prompting: 80% accuracy</div>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <div className="font-medium">Phase 4 (Days 64-90)</div>
                <div className="text-gray-600">SPARQL/RAG: 85% accuracy</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <strong>Target by Day 90:</strong> 80% performance via prompt engineering + tools, 90%+ baseline confidence
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}