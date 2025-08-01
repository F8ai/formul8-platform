import { lazy } from 'react';
import { Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-gray-300 h-4 w-4"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
        <div className="h-2 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Dynamic component wrapper
export const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// Lazy-loaded page components
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyAgents = lazy(() => import('../pages/Agents'));
export const LazyQueries = lazy(() => import('../pages/Queries'));
export const LazyVerifications = lazy(() => import('../pages/Verifications'));
export const LazySettings = lazy(() => import('../pages/Settings'));
export const LazyChat = lazy(() => import('../pages/Chat'));
export const LazyBaseline = lazy(() => import('../pages/Baseline'));
export const LazyNetworkVisualization = lazy(() => import('../pages/NetworkVisualization'));

// Lazy-loaded UI components (heavy ones)
export const LazyDataTable = lazy(() => import('../components/ui/data-table'));
export const LazyChart = lazy(() => import('../components/ui/chart'));
export const LazyFormBuilder = lazy(() => import('../components/ui/form-builder'));

// Preload critical routes
export const preloadCriticalRoutes = () => {
  // Preload dashboard since it's commonly accessed first
  import('../pages/Dashboard');
  // Preload chat since it's the primary interface
  import('../pages/Chat');
};
