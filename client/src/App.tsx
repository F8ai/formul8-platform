import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import React, { Suspense, lazy } from "react";

// Import only essential pages immediately
import Workspace from "@/pages/workspace";

// Only load needed lazy imports
const LangGraphDashboard = lazy(() => import("@/pages/langgraph-dashboard"));
const FormulationChatPage = lazy(() => import("@/pages/FormulationChatPage"));

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
  try {

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>

        {/* Main routes */}
        <Route path="/" component={Workspace} />
        <Route path="/formulation-chat" component={FormulationChatPage} />
        <Route path="/langgraph-dashboard" component={LangGraphDashboard} />
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
  } catch (error) {
    console.error('Router error:', error);
    return (
      <div style={{ 
        background: '#1a1a1a', 
        color: 'white', 
        minHeight: '100vh', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Router Error</h1>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
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

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    // Log to external service in production for debugging
    if (import.meta.env.MODE === 'production') {
      console.error('Production App Error:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
    return (
      <div style={{ 
        background: '#1a1a1a', 
        color: 'white', 
        minHeight: '100vh', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>App Error</h1>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <details style={{ marginTop: '20px' }}>
          <summary>Debug Information</summary>
          <pre style={{ fontSize: '12px', marginTop: '10px' }}>
            URL: {window.location.href}{'\n'}
            Environment: {import.meta.env.MODE}{'\n'}
            {error instanceof Error && error.stack ? `Stack: ${error.stack}` : ''}
          </pre>
        </details>
      </div>
    );
  }
}

export default App;
