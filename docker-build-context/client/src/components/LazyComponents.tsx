// Lazy loading components to reduce initial bundle size
import { lazy } from 'react';

// Dashboard components (largest)
export const DashboardWidgetCustomizer = lazy(() => import('./dashboard/DashboardWidgetCustomizer'));
export const DashboardWidget = lazy(() => import('./dashboard/DashboardWidget'));

// Chat interface
export const FormulaChatInterface = lazy(() => import('./FormulaChatInterface'));

// Large UI components
export const DataTable = lazy(() => import('./ui/data-table'));

// Complex forms and editors
export const BaselineQuestionsEditor = lazy(() => import('./ui/baseline-editor').then(module => ({ default: module.BaselineEditor })));

export const AgentToolsManager = lazy(() => 
  import('./ui/agent-tools-manager').then(module => ({ default: module.AgentToolsManager }))
);

// Chart components
export const LineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

export const BarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);