import { createRoot } from "react-dom/client";
import App from "./App";
import SimpleApp from "./simple-app";
import "./index.css";

// Initialize performance monitoring (dev mode only for detailed logging)
if (import.meta.env.DEV) {
  try {
    import('./utils/performance').then(({ performanceMonitor }) => {
      // Log performance metrics after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          performanceMonitor.logMetrics();
        }, 1000);
      });
    }).catch(err => {
      console.warn('Performance monitoring failed to load:', err);
    });
  } catch (err) {
    console.warn('Performance monitoring not available:', err);
  }
}

// Register service worker for PWA functionality and performance caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  } catch (err) {
    console.warn('Service worker not available:', err);
  }
}

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  
  // Enhanced error handling for production deployment
  const isProduction = import.meta.env.PROD;
  const forceSimple = window.location.search.includes('simple=true');
  
  // Only use SimpleApp when explicitly requested via URL parameter
  if (forceSimple) {
    console.log("Using Safari-compatible SimpleApp (explicitly requested)");
    root.render(<SimpleApp />);
  } else {
    console.log("Using main App");
    root.render(<App />);
  }

} catch (error) {
  console.error("Failed to mount React app:", error);
  
  // Enhanced error reporting for production debugging
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  // Log detailed error information
  console.error("React Mount Error Details:", errorDetails);
  
  document.body.innerHTML = `
    <div style="background: #1a1a1a; color: white; padding: 20px; font-family: Arial; min-height: 100vh;">
      <h1>🚨 Application Failed to Load</h1>
      <p>The Formul8 application encountered an error during initialization.</p>
      <p><strong>Error:</strong> ${errorDetails.message}</p>
      
      <details style="margin-top: 20px;">
        <summary style="cursor: pointer; color: #00ff88;">🔧 Debug Information (Click to expand)</summary>
        <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; margin-top: 10px; font-size: 12px; overflow-x: auto;">
URL: ${errorDetails.url}
Time: ${errorDetails.timestamp}
User Agent: ${errorDetails.userAgent}
${errorDetails.stack ? `\nStack Trace:\n${errorDetails.stack}` : ''}
        </pre>
      </details>
      
      <div style="margin-top: 30px; padding: 15px; background: #2a2a2a; border-left: 4px solid #00ff88; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #00ff88;">💡 Troubleshooting</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)</li>
          <li>Clear browser cache and reload</li>
          <li>Check browser console for additional error details</li>
          <li>Ensure JavaScript is enabled</li>
        </ul>
      </div>
    </div>
  `;
}
