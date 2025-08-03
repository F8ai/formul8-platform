# Formul8 Frontend

An advanced React frontend for the Formul8 AI cannabis platform, featuring intelligent chat interfaces, tabbed tool navigation, and PWA capabilities.

## Features

- **Intelligent Chat Interface**: AI-powered chat that automatically detects user intent and opens relevant tools
- **Tabbed Navigation**: Browser tab-based interface for seamless multitasking between tools
- **Progressive Web App**: Full PWA support with mobile optimization
- **Desktop Workspace**: Window-based workspace with floating widgets and file management
- **Agent Integration**: Direct integration with 12+ specialized AI agents
- **Real-time Notifications**: Comprehensive notification system with desktop/mobile support

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom Formul8 brand styling
- **Shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing
- **PWA** capabilities with service worker

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Architecture

This frontend is designed to work with the Formul8 platform backend and can be developed independently as a submodule. It features:

- Intelligent tool routing based on conversation context
- Tabbed interface for multi-tool workflows
- Mobile-first responsive design
- Real-time agent communication
- Document preview and management
- Baseline testing interfaces
- Compliance dashboards

## Integration

The frontend communicates with the main Formul8 platform via REST APIs and integrates with specialized agent submodules for domain-specific functionality.