import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Design from "@/pages/design";
import Agents from "@/pages/agents";
import AgentsDynamic from "@/pages/agents-dynamic";
import AgentChat from "@/pages/agent-chat";
import AgentDetail from "@/pages/agent-detail";
import AgentRepo from "@/pages/agent-repo";
import Science from "@/pages/science";
import RealMetrics from "@/pages/real-metrics";
import Profile from "@/pages/profile";
import DevelopmentAgent from "@/pages/development-agent";
import AgentsDashboard from "@/pages/agents-dashboard";
import BaselineManagement from "@/pages/BaselineManagement";
import AgentDashboard from "@/pages/agent-dashboard";
import LangGraphDashboard from "@/pages/langgraph-dashboard";
import TestResults from "@/pages/test-results";
import CorpusQA from "@/pages/corpus-qa";
import MVP from "@/pages/mvp";
import PlanDetail from "@/pages/plan-detail";
import Artifacts from "@/pages/artifacts";
import UseCasesIndex from "@/pages/use/index";
import DMSOUseCase from "@/pages/use/dmso";
import GoodFORUseCase from "@/pages/use/goodfor";
import Roadmap from "@/pages/roadmap";
import ComplianceAgent from "@/pages/ComplianceAgent";
import BaselineAssessment from "@/pages/BaselineAssessment";
import BaselineTestingPage from "@/pages/BaselineTestingPage";
import BaselineResultPage from "@/pages/BaselineResultPage";
import Federated from "@/pages/Federated";
import ComputePage from "@/pages/compute";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/design" component={Design} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents-dynamic" component={AgentsDynamic} />
      <Route path="/real-metrics" component={RealMetrics} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/federated" component={Federated} />
      <Route path="/compute" component={ComputePage} />
      <Route path="/agent-detail/:id">
        {params => <AgentDetail agentId={params.id} />}
      </Route>
      <Route path="/repo/:id">
        {params => <AgentRepo agentId={params.id} />}
      </Route>
      <Route path="/agent/compliance" component={ComplianceAgent} />
      <Route path="/agent/:agentType/baseline-:resultId" component={BaselineResultPage} />
      <Route path="/agent/:agentType" component={AgentDashboard} />
      <Route path="/agent/:agentId/chat" component={AgentChat} />
      <Route path="/test-results/:agentId">
        {params => <TestResults agentId={params.agentId} />}
      </Route>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/science" component={Science} />
          <Route path="/development-agent" component={DevelopmentAgent} />
          <Route path="/agents-dashboard" component={AgentsDashboard} />
          <Route path="/baselines" component={BaselineManagement} />
          <Route path="/baseline-assessment" component={BaselineAssessment} />
          <Route path="/baseline-testing" component={BaselineTestingPage} />
          <Route path="/langgraph" component={LangGraphDashboard} />
          <Route path="/corpus-qa" component={CorpusQA} />
          <Route path="/mvp" component={MVP} />
          <Route path="/plan-detail/:type" component={PlanDetail} />
          <Route path="/artifacts" component={Artifacts} />
          <Route path="/use" component={UseCasesIndex} />
          <Route path="/use/dmso" component={DMSOUseCase} />
          <Route path="/use/goodfor" component={GoodFORUseCase} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
