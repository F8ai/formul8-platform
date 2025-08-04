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
  
  // Only use SimpleApp when explicitly requested via URL parameter
  if (window.location.search.includes('simple=true')) {
    console.log("Using Safari-compatible SimpleApp");
    root.render(<SimpleApp />);
  } else {
    root.render(<App />);
  }

} catch (error) {
  console.error("Failed to mount React app:", error);
  document.body.innerHTML = `
    <div style="background: #1a1a1a; color: white; padding: 20px; font-family: Arial;">
      <h1>React Mount Error</h1>
      <p>Failed to initialize the application.</p>
      <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
