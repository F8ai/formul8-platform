import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, RefreshCw, Search, Filter, X, ExternalLink } from "lucide-react";
import { CostDisplay } from "@/components/ui/cost-display";
import { Link } from "wouter";

interface BaselineTestRun {
  id: number;
  agentType: string;
  model: string;
  state?: string;
  status: string;
  totalQuestions: number;
  successfulTests: number;
  avgAccuracy?: number;
  avgConfidence?: number;
  avgResponseTime?: number;
  totalCost?: number;
  createdAt: string;
}

interface BaselineResultsViewerProps {
  agentType: string;
}

export function BaselineResultsViewer({ agentType }: BaselineResultsViewerProps) {
  const [filterModel, setFilterModel] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: testRuns = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/baseline-testing/demo-runs', agentType],
    queryFn: async () => {
      const response = await fetch(`/api/baseline-testing/demo-runs?agentType=${agentType}`);
      if (!response.ok) throw new Error('Failed to fetch test runs');
      return response.json();
    }
  });

  const filteredRuns = testRuns.filter((run: BaselineTestRun) => {
    if (filterModel !== "all" && !run.model.toLowerCase().includes(filterModel.toLowerCase())) return false;
    if (filterState !== "all" && run.state !== filterState) return false;
    if (filterStatus !== "all" && run.status !== filterStatus) return false;
    if (searchQuery && !run.model.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const clearFilters = () => {
    setFilterModel("all");
    setFilterState("all");  
    setFilterStatus("all");
    setSearchQuery("");
  };

  const hasActiveFilters = filterModel !== "all" || filterState !== "all" || filterStatus !== "all" || searchQuery;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Baseline Test Results
          </CardTitle>
          <CardDescription>
            View and analyze baseline test results for the {agentType} agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="CO">Colorado</SelectItem>
                <SelectItem value="WA">Washington</SelectItem>
                <SelectItem value="OR">Oregon</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => refetch()}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading test results...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {hasActiveFilters ? "No test runs match the current filters" : "No baseline test runs found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run: BaselineTestRun) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.model}</TableCell>
                      <TableCell>
                        {run.state ? (
                          <Badge variant="outline">{run.state}</Badge>
                        ) : (
                          <span className="text-gray-400">All</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{run.successfulTests}</span>
                        <span className="text-gray-400">/{run.totalQuestions}</span>
                      </TableCell>
                      <TableCell>
                        {run.avgAccuracy ? (
                          <span className={`font-medium ${run.avgAccuracy >= 80 ? 'text-green-600' : run.avgAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {run.avgAccuracy.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {run.avgConfidence ? (
                          <span className="font-medium">
                            {run.avgConfidence.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {run.totalCost ? (
                          <CostDisplay cost={run.totalCost} />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(run.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/agent/${agentType}/baseline-${run.state || 'all'}-${run.model.replace(/[^a-zA-Z0-9]/g, '')}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}