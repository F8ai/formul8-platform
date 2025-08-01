import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CostDisplay, TokenBreakdown } from "@/components/ui/cost-display";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BaselineTestResult {
  id: number;
  runId: number;
  questionId: string;
  question: string;
  expectedAnswer?: string;
  agentResponse?: string;
  accuracy?: number;
  confidence?: number;
  responseTime?: number;
  category?: string;
  difficulty?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  aiGrade?: number;
  aiGradingModel?: string;
  aiGradingInputTokens?: number;
  aiGradingOutputTokens?: number;
  aiGradingTotalTokens?: number;
  aiGradingEstimatedCost?: number;
  createdAt: string;
}

interface ComparisonMetric {
  label: string;
  valueA: number | string;
  valueB: number | string;
  format: 'number' | 'percentage' | 'currency' | 'tokens' | 'time' | 'text';
  higherIsBetter?: boolean;
}

interface ResultComparisonProps {
  results: BaselineTestResult[];
  selectedResultA?: BaselineTestResult;
  selectedResultB?: BaselineTestResult;
  onResultAChange: (result: BaselineTestResult) => void;
  onResultBChange: (result: BaselineTestResult) => void;
}

export function ResultComparison({ 
  results, 
  selectedResultA, 
  selectedResultB, 
  onResultAChange, 
  onResultBChange 
}: ResultComparisonProps) {
  const formatValue = (value: number | string, format: string): string => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (format) {
      case 'percentage':
        return `${typeof value === 'number' ? value.toFixed(1) : value}%`;
      case 'currency':
        const cost = typeof value === 'number' ? value : parseFloat(value.toString());
        if (cost === 0) return 'FREE';
        if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}‰`;
        return `$${cost.toFixed(4)}`;
      case 'tokens':
        const tokens = typeof value === 'number' ? value : parseInt(value.toString());
        if (tokens < 1000) return tokens.toString();
        if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
        return `${(tokens / 1000000).toFixed(1)}M`;
      case 'time':
        return `${typeof value === 'number' ? value.toFixed(2) : value}s`;
      case 'number':
        return typeof value === 'number' ? value.toFixed(1) : value.toString();
      default:
        return value.toString();
    }
  };

  const getComparisonIcon = (valueA: number | string, valueB: number | string, higherIsBetter: boolean = true) => {
    if (valueA === undefined || valueB === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const numA = typeof valueA === 'number' ? valueA : parseFloat(valueA.toString());
    const numB = typeof valueB === 'number' ? valueB : parseFloat(valueB.toString());
    
    if (numA === numB) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const aIsBetter = higherIsBetter ? numA > numB : numA < numB;
    return aIsBetter ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getMetrics = (): ComparisonMetric[] => {
    if (!selectedResultA || !selectedResultB) return [];

    return [
      {
        label: 'AI Grade',
        valueA: selectedResultA.aiGrade || 0,
        valueB: selectedResultB.aiGrade || 0,
        format: 'number',
        higherIsBetter: true
      },
      {
        label: 'Accuracy',
        valueA: selectedResultA.accuracy || 0,
        valueB: selectedResultB.accuracy || 0,
        format: 'percentage',
        higherIsBetter: true
      },
      {
        label: 'Confidence',
        valueA: selectedResultA.confidence || 0,
        valueB: selectedResultB.confidence || 0,
        format: 'percentage',
        higherIsBetter: true
      },
      {
        label: 'Response Time',
        valueA: selectedResultA.responseTime || 0,
        valueB: selectedResultB.responseTime || 0,
        format: 'time',
        higherIsBetter: false
      },
      {
        label: 'Total Tokens',
        valueA: selectedResultA.totalTokens || 0,
        valueB: selectedResultB.totalTokens || 0,
        format: 'tokens',
        higherIsBetter: false
      },
      {
        label: 'Input Tokens',
        valueA: selectedResultA.inputTokens || 0,
        valueB: selectedResultB.inputTokens || 0,
        format: 'tokens',
        higherIsBetter: false
      },
      {
        label: 'Output Tokens',
        valueA: selectedResultA.outputTokens || 0,
        valueB: selectedResultB.outputTokens || 0,
        format: 'tokens',
        higherIsBetter: false
      },
      {
        label: 'Response Cost',
        valueA: selectedResultA.estimatedCost || 0,
        valueB: selectedResultB.estimatedCost || 0,
        format: 'currency',
        higherIsBetter: false
      },
      {
        label: 'AI Grading Tokens',
        valueA: selectedResultA.aiGradingTotalTokens || 0,
        valueB: selectedResultB.aiGradingTotalTokens || 0,
        format: 'tokens',
        higherIsBetter: false
      },
      {
        label: 'AI Grading Cost',
        valueA: selectedResultA.aiGradingEstimatedCost || 0,
        valueB: selectedResultB.aiGradingEstimatedCost || 0,
        format: 'currency',
        higherIsBetter: false
      }
    ];
  };

  const getTotalCost = (result: BaselineTestResult): number => {
    return (result.estimatedCost || 0) + (result.aiGradingEstimatedCost || 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Result Comparison
          </CardTitle>
          <CardDescription>
            Compare two baseline test results side by side to analyze performance, costs, and accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Result A Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Result A</label>
                <Select 
                  value={selectedResultA?.id.toString() || ""} 
                  onValueChange={(value) => {
                    const result = results.find(r => r.id.toString() === value);
                    if (result) onResultAChange(result);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select first result" />
                  </SelectTrigger>
                  <SelectContent>
                    {results.map((result) => (
                      <SelectItem key={result.id} value={result.id.toString()}>
                        {result.questionId} - Grade: {result.aiGrade || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedResultA && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{selectedResultA.category}</Badge>
                        <Badge variant="secondary">{selectedResultA.difficulty}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Question:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{selectedResultA.question}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Cost:</span>
                        <CostDisplay cost={getTotalCost(selectedResultA)} showTokens={false} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Result B Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Result B</label>
                <Select 
                  value={selectedResultB?.id.toString() || ""} 
                  onValueChange={(value) => {
                    const result = results.find(r => r.id.toString() === value);
                    if (result) onResultBChange(result);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second result" />
                  </SelectTrigger>
                  <SelectContent>
                    {results.map((result) => (
                      <SelectItem key={result.id} value={result.id.toString()}>
                        {result.questionId} - Grade: {result.aiGrade || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedResultB && (
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{selectedResultB.category}</Badge>
                        <Badge variant="secondary">{selectedResultB.difficulty}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Question:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{selectedResultB.question}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Cost:</span>
                        <CostDisplay cost={getTotalCost(selectedResultB)} showTokens={false} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Metrics */}
      {selectedResultA && selectedResultB && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>
              Side-by-side metrics comparison with performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getMetrics().map((metric, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    {getComparisonIcon(metric.valueA, metric.valueB, metric.higherIsBetter)}
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-blue-600 font-medium">
                        {formatValue(metric.valueA, metric.format)}
                      </div>
                      <div className="text-xs text-gray-500">Result A</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        {formatValue(metric.valueB, metric.format)}
                      </div>
                      <div className="text-xs text-gray-500">Result B</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Comparison */}
      {selectedResultA && selectedResultB && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Result A Response</CardTitle>
              <CardDescription>
                Model: {selectedResultA.aiGradingModel || 'Unknown'} • 
                Grade: {selectedResultA.aiGrade || 'N/A'}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Agent Response:</p>
                  <div className="bg-blue-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedResultA.agentResponse || 'No response available'}
                  </div>
                </div>
                {(selectedResultA.inputTokens || selectedResultA.outputTokens) && (
                  <TokenBreakdown
                    inputTokens={selectedResultA.inputTokens || 0}
                    outputTokens={selectedResultA.outputTokens || 0}
                    totalTokens={selectedResultA.totalTokens || 0}
                    estimatedCost={selectedResultA.estimatedCost || 0}
                    model={selectedResultA.aiGradingModel}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Result B Response</CardTitle>
              <CardDescription>
                Model: {selectedResultB.aiGradingModel || 'Unknown'} • 
                Grade: {selectedResultB.aiGrade || 'N/A'}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Agent Response:</p>
                  <div className="bg-green-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedResultB.agentResponse || 'No response available'}
                  </div>
                </div>
                {(selectedResultB.inputTokens || selectedResultB.outputTokens) && (
                  <TokenBreakdown
                    inputTokens={selectedResultB.inputTokens || 0}
                    outputTokens={selectedResultB.outputTokens || 0}
                    totalTokens={selectedResultB.totalTokens || 0}
                    estimatedCost={selectedResultB.estimatedCost || 0}
                    model={selectedResultB.aiGradingModel}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}