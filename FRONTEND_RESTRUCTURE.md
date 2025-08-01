# Frontend Restructure - Independent Development

## Overview

The Formul8.ai frontend has been restructured as an independent repository and submodule to enable separate development, versioning, and deployment.

## New Structure

```
formul8-platform/
├── formul8-frontend/          # Independent frontend repository (submodule)
│   ├── src/                   # React + TypeScript source
│   ├── package.json           # Frontend-specific dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── README.md              # Frontend documentation
├── server/                    # Backend Express.js API
├── agents/                    # AI agent submodules
├── shared/                    # Shared types and utilities
└── README.md                  # Main project documentation
```

## Frontend Repository Details

**Repository**: `formul8-frontend/`
**Technology**: React 18 + TypeScript + Vite
**UI Framework**: Shadcn/ui with Radix UI
**Styling**: Tailwind CSS with authentic Formul8.ai dark theme
**Features**:
- Official Formul8.ai logo integration
- Dark theme with turquoise/teal gradients
- Chat interface as primary interaction
- Cannabis industry-specific features
- Mobile-first responsive design

## Development Workflow

### Local Development

```bash
# Main platform development
npm run dev

# Frontend-only development
npm run dev:frontend

# Full stack development
npm run dev:full
```

### Building

```bash
# Build frontend and backend
npm run build

# Frontend only
npm run build:frontend

# Backend only  
npm run build:server
```

### Submodule Management

```bash
# Initialize submodules (first time)
git submodule update --init --recursive

# Update submodules
git submodule update --remote

# Install dependencies for all components
npm run install:all
```

## Benefits

1. **Independent Development**: Frontend team can work independently
2. **Separate Versioning**: Frontend releases don't require backend changes
3. **Deployment Flexibility**: Frontend can be deployed to CDN/static hosting
4. **Technology Independence**: Frontend can use different build tools/frameworks
5. **Team Collaboration**: Better separation of concerns for different teams

## API Integration

The frontend communicates with the backend via:
- Development: Vite proxy to `localhost:5000`
- Production: Same origin API calls to `/api/*`

## Deployment Options

### Frontend Deployment
- **Static Hosting**: Vercel, Netlify, AWS S3 + CloudFront
- **Integrated**: Served by Express.js backend

### Backend Deployment
- **Replit Deployments** (primary)
- **Google Cloud Run**
- **AWS App Runner**
- **Docker containers**

## Configuration

### Environment Variables

**Frontend** (`.env` in `formul8-frontend/`):
```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=Formul8.ai
```

**Backend** (`.env` in root):
```env
DATABASE_URL=...
OPENAI_API_KEY=...
NODE_ENV=development
```

## Migration Notes

- All frontend code moved from `client/` to `formul8-frontend/`
- Build scripts updated to reference new directory
- Vite configuration includes API proxy for development
- TypeScript paths configured for proper imports
- Tailwind and PostCSS configurations included

## Next Steps

1. Set up CI/CD for independent frontend deployments
2. Configure frontend-specific environment variables
3. Set up automated testing for frontend components
4. Consider micro-frontend architecture for agent-specific UIs

## Rollback Plan

If issues arise, the frontend can be moved back to `client/` directory and integrated builds can be restored by reverting the package.json script changes.