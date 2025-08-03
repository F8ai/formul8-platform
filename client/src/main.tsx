import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize performance monitoring (dev mode only for detailed logging)
if (import.meta.env.DEV) {
  import('./utils/performance').then(({ performanceMonitor }) => {
    // Log performance metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor.logMetrics();
      }, 1000);
    });
  });
}

// Register service worker for PWA functionality and performance caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
