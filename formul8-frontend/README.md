# Formul8 Frontend

The complete React frontend for the Formul8 AI cannabis platform, featuring intelligent chat interfaces, tabbed tool navigation, and PWA capabilities.

## Features

- **Intelligent Chat Interface**: AI-powered chat that automatically detects user intent and opens relevant tools in browser tabs
- **Tabbed Navigation**: Browser tab-based interface for seamless multitasking between tools
- **Progressive Web App**: Full PWA support with mobile optimization and offline capabilities
- **Desktop Workspace**: Window-based workspace with floating widgets and file management
- **Agent Integration**: Direct integration with 12+ specialized AI agents
- **Real-time Notifications**: Comprehensive notification system with desktop/mobile support
- **Formul8 Brand Styling**: Custom Tailwind CSS with Formul8.ai brand colors and typography

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom Formul8 brand styling
- **Shadcn/ui** component library built on Radix UI
- **TanStack Query** for data fetching and caching
- **Wouter** for client-side routing
- **PWA** capabilities with service worker support

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Key Components

### Chat Interface
- `FormulaChatInterface.tsx` - Main chat component with intelligent tool routing
- Intent detection automatically opens relevant tools based on conversation context
- Supports file attachments, document generation, and real-time responses

### Tool Integration
- Formulation Wizard (`/design`)
- Compliance Dashboard (`/ComplianceAgent`)
- Issue Tracker (`/roadmap`)
- Document Manager (`/artifacts`)
- Baseline Testing (`/BaselineAssessment`)
- Main Dashboard (`/dashboard`)
- File Workspace (`/workspace`)

### Desktop Experience
- `DesktopWorkspace.tsx` - Window-based workspace management
- `WindowManager.tsx` - Floating window system with drag/resize
- `LeftNavBar.tsx` - Navigation with Formul8 branding

## Architecture

This frontend is designed as an independent repository that integrates with the main Formul8 platform backend. Key architectural decisions:

- **Tabbed Interface**: Tools open in new browser tabs for better multitasking
- **Mobile-First**: Responsive design optimized for both desktop and mobile
- **PWA Ready**: Service worker, manifest, and offline support
- **Brand Consistency**: Custom CSS variables for Formul8 brand colors and fonts
- **Agent Communication**: REST API integration with specialized AI agents

## Integration Points

### Backend Communication
- REST APIs for agent interactions
- WebSocket connections for real-time features
- Session-based authentication via Replit Auth
- Notification system with real-time updates

### Shared Resources
- TypeScript types shared with backend
- Brand assets and styling guidelines
- PWA configuration and service worker

## Deployment

The frontend builds to a `dist/` directory and can be served statically or integrated with the main platform's Express server.