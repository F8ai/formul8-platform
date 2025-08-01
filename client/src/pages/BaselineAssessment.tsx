import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface BaselineQuestion {
  id: string;
  category: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  question: string;
  expected_answer?: string;
  expectedAnswer?: string;
  tags?: string[];
  keywords?: string[];
}

interface AgentBaseline {
  agentType: string;
  description: string;
  questions: BaselineQuestion[];
}

interface CategoryDifficultyMetric {
  category: string;
  difficulty: string;
  total: number;
  passed: number;
  passRate: number;
  questions: BaselineQuestion[];
}

interface AssessmentData {
  agentName: string;
  categories: string[];
  difficulties: string[];
  metrics: CategoryDifficultyMetric[];
  overallStats: {
    totalQuestions: number;
    overallPassRate: number;
    categoryCounts: Record<string, number>;
    difficultyDistribution: Record<string, number>;
  };
}

export default function BaselineAssessment() {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Fetch baseline assessment data
  const { data: assessmentData, isLoading, refetch } = useQuery({
    queryKey: ['/api/baseline/assessment', selectedAgent],
    refetchInterval: 30000,
  });

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 85) return 'bg-green-500 text-white';
    if (passRate >= 70) return 'bg-green-400 text-white';
    if (passRate >= 60) return 'bg-yellow-500 text-white';
    if (passRate >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getPassRateStatus = (passRate: number) => {
    if (passRate >= 85) return { icon: CheckCircle, label: 'Excellent', color: 'text-green-600' };
    if (passRate >= 70) return { icon: TrendingUp, label: 'Good', color: 'text-green-500' };
    if (passRate >= 60) return { icon: Target, label: 'Acceptable', color: 'text-yellow-500' };
    if (passRate >= 40) return { icon: TrendingDown, label: 'Needs Improvement', color: 'text-orange-500' };
    return { icon: AlertTriangle, label: 'Critical', color: 'text-red-500' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading baseline assessment...</span>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Baseline Assessment Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load baseline question performance data.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Assessment
          </Button>
        </div>
      </div>
    );
  }

  const data = assessmentData as AssessmentData[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Baseline Assessment Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Performance analysis of baseline questions by category and difficulty
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              {data.reduce((sum, agent) => sum + agent.overallStats.totalQuestions, 0)} Total Questions
            </Badge>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
            <TabsTrigger value="agents">By Agent</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {data.map((agent) => {
                const status = getPassRateStatus(agent.overallStats.overallPassRate);
                const Icon = status.icon;
                
                return (
                  <Card key={agent.agentName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium capitalize">
                        {agent.agentName.replace('-agent', '')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">
                          {agent.overallStats.overallPassRate.toFixed(1)}%
                        </div>
                        <Icon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {agent.overallStats.totalQuestions} questions
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Number of questions by category across all agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(() => {
                    const allCategories = new Set<string>();
                    const categoryCounts: Record<string, number> = {};
                    
                    data.forEach(agent => {
                      Object.entries(agent.overallStats.categoryCounts).forEach(([category, count]) => {
                        allCategories.add(category);
                        categoryCounts[category] = (categoryCounts[category] || 0) + count;
                      });
                    });

                    return Array.from(allCategories).map(category => (
                      <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {categoryCounts[category]}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {category.replace('_', ' ')}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            {/* Performance Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Heatmap</CardTitle>
                <CardDescription>
                  Pass rates by category and difficulty - darker colors indicate higher pass rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.map((agent) => (
                  <div key={agent.agentName} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 capitalize">
                      {agent.agentName.replace('-agent', '')} Agent
                    </h3>
                    
                    {/* Heatmap Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800 text-left">
                              Category
                            </th>
                            {['basic', 'intermediate', 'advanced'].map(difficulty => (
                              <th key={difficulty} className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800 text-center capitalize">
                                {difficulty}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {agent.categories.map(category => (
                            <tr key={category}>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium capitalize">
                                {category.replace('_', ' ')}
                              </td>
                              {['basic', 'intermediate', 'advanced'].map(difficulty => {
                                const metric = agent.metrics.find(m => 
                                  m.category === category && m.difficulty === difficulty
                                );
                                
                                if (!metric || metric.total === 0) {
                                  return (
                                    <td key={difficulty} className="border border-gray-300 dark:border-gray-600 p-2 text-center bg-gray-100 dark:bg-gray-700">
                                      <span className="text-gray-400">-</span>
                                    </td>
                                  );
                                }

                                return (
                                  <td key={difficulty} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                    <div className={`px-2 py-1 rounded text-sm font-medium ${getPassRateColor(metric.passRate)}`}>
                                      {metric.passRate.toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {metric.passed}/{metric.total}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                {/* Legend */}
                <div className="mt-6 flex items-center space-x-4">
                  <span className="text-sm font-medium">Pass Rate:</span>
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 rounded text-xs bg-red-500 text-white">0-39%</div>
                    <div className="px-2 py-1 rounded text-xs bg-orange-500 text-white">40-59%</div>
                    <div className="px-2 py-1 rounded text-xs bg-yellow-500 text-white">60-69%</div>
                    <div className="px-2 py-1 rounded text-xs bg-green-400 text-white">70-84%</div>
                    <div className="px-2 py-1 rounded text-xs bg-green-500 text-white">85%+</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            {/* Individual Agent Analysis */}
            {data.map((agent) => (
              <Card key={agent.agentName}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {agent.agentName.replace('-agent', '')} Agent Performance
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of {agent.overallStats.totalQuestions} baseline questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Agent Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {agent.overallStats.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {agent.overallStats.overallPassRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overall Pass Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {agent.categories.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                      </div>
                    </div>

                    {/* Performance by Category */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Performance by Category</h4>
                      {agent.categories.map(category => {
                        const categoryMetrics = agent.metrics.filter(m => m.category === category);
                        const totalInCategory = categoryMetrics.reduce((sum, m) => sum + m.total, 0);
                        const passedInCategory = categoryMetrics.reduce((sum, m) => sum + m.passed, 0);
                        const categoryPassRate = totalInCategory > 0 ? (passedInCategory / totalInCategory) * 100 : 0;

                        return (
                          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium capitalize">{category.replace('_', ' ')}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {passedInCategory}/{totalInCategory} questions passed
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPassRateColor(categoryPassRate)}>
                                {categoryPassRate.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
                <CardDescription>
                  Areas for improvement based on baseline assessment analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.map((agent) => {
                    const criticalAreas = agent.metrics.filter(m => m.passRate < 60);
                    const needsImprovement = agent.metrics.filter(m => m.passRate >= 60 && m.passRate < 85);
                    
                    return (
                      <div key={agent.agentName} className="border-l-4 border-l-blue-500 pl-4">
                        <h3 className="text-lg font-semibold capitalize mb-3">
                          {agent.agentName.replace('-agent', '')} Agent
                        </h3>
                        
                        {criticalAreas.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Critical Areas ({"<"}60% pass rate)
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {criticalAreas.map((area, idx) => (
                                <li key={idx} className="text-gray-600 dark:text-gray-400">
                                  • {area.category.replace('_', ' ')} ({area.difficulty}): {area.passRate.toFixed(0)}% ({area.passed}/{area.total})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {needsImprovement.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Areas for Improvement (60-84% pass rate)
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {needsImprovement.slice(0, 3).map((area, idx) => (
                                <li key={idx} className="text-gray-600 dark:text-gray-400">
                                  • {area.category.replace('_', ' ')} ({area.difficulty}): {area.passRate.toFixed(0)}% ({area.passed}/{area.total})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {criticalAreas.length === 0 && needsImprovement.length === 0 && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">All areas performing well (≥85% pass rate)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* General Recommendations */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      General Recommendations
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• Focus improvement efforts on categories with {"<"}60% pass rates</li>
                      <li>• Review and update expected answers for failing questions</li>
                      <li>• Consider adding more training data for weak categories</li>
                      <li>• Implement regular baseline testing to track improvements</li>
                      <li>• Analyze question difficulty distribution for balance</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}