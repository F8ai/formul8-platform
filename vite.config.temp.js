
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          'router': ['wouter'],
          
          // UI Library chunks (split Radix UI into smaller pieces)
          'ui-core': [
            '@radix-ui/react-slot', 
            '@radix-ui/react-label',
            '@radix-ui/react-separator'
          ],
          'ui-overlays': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-tooltip'
          ],
          'ui-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group', 
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group'
          ],
          'ui-layout': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-menubar'
          ],
          'ui-feedback': [
            '@radix-ui/react-toast',
            '@radix-ui/react-progress',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-aspect-ratio'
          ],
          
          // Data & Charts (largest libraries)
          'data-table': ['@tanstack/react-table'],
          'charts': ['recharts'],
          'query': ['@tanstack/react-query'],
          
          // Heavy visualization libraries
          'graphs': ['@xyflow/react', 'react-cytoscapejs', 'cytoscape'],
          
          // Animation
          'animation': ['framer-motion'],
          
          // Form handling  
          'forms': ['react-hook-form', '@hookform/resolvers'],
          
          // Icons
          'icons': ['lucide-react', 'react-icons'],
          
          // Utils
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 300,
    minify: true
  }
});
