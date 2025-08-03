import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import React, { Suspense, lazy } from "react";

// Import only essential pages immediately (critical path)
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Workspace from "@/pages/workspace";

// Lazy load all other pages for better performance
const ChatLanding = lazy(() => import("@/pages/chat-landing"));
const Chat = lazy(() => import("@/pages/chat"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Design = lazy(() => import("@/pages/design"));
const Agents = lazy(() => import("@/pages/agents"));
const AgentsDynamic = lazy(() => import("@/pages/agents-dynamic"));
const AgentChat = lazy(() => import("@/pages/agent-chat"));
const AgentDetail = lazy(() => import("@/pages/agent-detail"));
const AgentRepo = lazy(() => import("@/pages/agent-repo"));
const Science = lazy(() => import("@/pages/science"));
const RealMetrics = lazy(() => import("@/pages/real-metrics"));
const Profile = lazy(() => import("@/pages/profile"));
const DevelopmentAgent = lazy(() => import("@/pages/development-agent"));
const AgentsDashboard = lazy(() => import("@/pages/agents-dashboard"));
const BaselineManagement = lazy(() => import("@/pages/BaselineManagement"));
const AgentDashboard = lazy(() => import("@/pages/agent-dashboard"));
const LangGraphDashboard = lazy(() => import("@/pages/langgraph-dashboard"));
const TestResults = lazy(() => import("@/pages/test-results"));
const CorpusQA = lazy(() => import("@/pages/corpus-qa"));
const MVP = lazy(() => import("@/pages/mvp"));
const PlanDetail = lazy(() => import("@/pages/plan-detail"));
const Artifacts = lazy(() => import("@/pages/artifacts"));
const UseCasesIndex = lazy(() => import("@/pages/use/index"));
const DMSOUseCase = lazy(() => import("@/pages/use/dmso"));
const GoodFORUseCase = lazy(() => import("@/pages/use/goodfor"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const ComplianceAgent = lazy(() => import("@/pages/ComplianceAgent"));
const BaselineAssessment = lazy(() => import("@/pages/BaselineAssessment"));
const BaselineEditor = lazy(() => import("@/pages/BaselineEditor"));
const Federated = lazy(() => import("@/pages/Federated"));
const ComputePage = lazy(() => import("@/pages/compute"));
const VoiceflowDashboard = lazy(() => import("@/pages/voiceflow"));
const BaselineTableViewer = lazy(() => import("@/pages/BaselineTableViewer"));
const ChatTool = lazy(() => import("@/pages/chat-tool"));
const ChatToolSimple = lazy(() => import("@/pages/chat-tool-simple"));
const Settings = lazy(() => import("@/pages/Settings"));
const Desktop = lazy(() => import("@/pages/desktop"));

// Fast, minimal loading component for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-formul8-bg-dark">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-8 h-8 border-2 border-formul8-teal border-t-transparent rounded-full animate-spin"></div>
      <p className="text-formul8-text-gray text-sm">Loading...</p>
    </div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Only the root route - everything happens here */}
        <Route path="/" component={Workspace} />
        {/* All other routes redirect to root */}
        <Route>
          {() => {
            window.location.href = '/';
            return null;
          }}
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  // Remove initial loading screen when React mounts and ensure dark mode
  React.useEffect(() => {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.remove();
    }
    
    // Ensure dark mode is always applied
    document.documentElement.classList.add('dark');
  }, []);

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
