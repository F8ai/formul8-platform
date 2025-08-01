# Formul8.ai Frontend

A modern React-based frontend for the Formul8.ai cannabis industry AI platform.

## Overview

This is the standalone frontend application for Formul8.ai, designed to provide an authentic cannabis industry interface with dark theme aesthetics and comprehensive AI-powered tools.

## Features

- **Dark Theme Design**: Authentic Formul8.ai branding with turquoise/teal gradients
- **Official Logo Integration**: Real Formul8.ai logo from official website
- **Chat Interface**: Primary AI consultation interface
- **Cannabis OS Features**: State compliance, formulation design, extraction optimization
- **Responsive Design**: Mobile-first approach with modern UI components
- **Component Library**: Shadcn/ui with Radix UI primitives

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Framer Motion** for animations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Shadcn/ui components
│   ├── Formul8Logo.tsx
│   └── FormulaChatInterface.tsx
├── pages/            # Route components
│   ├── chat.tsx
│   └── dashboard.tsx
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
└── assets/           # Static assets
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=Formul8.ai
```

## Backend Integration

This frontend is designed to work with the Formul8.ai backend API. When running in development, it proxies API requests to `localhost:5000`.

## Deployment

The frontend can be deployed independently to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

Build the project and deploy the `dist` folder.

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Maintain responsive design principles
4. Keep components modular and reusable

## License

MIT License - see LICENSE file for details.