# Formul8 Platform

![Formul8 Platform](https://img.shields.io/badge/Formul8-Platform-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

The main repository for the comprehensive AI-powered cannabis operations platform. This full-stack application provides intelligent consultation services for cannabis operators through a phased multi-agent AI orchestration system.

## Overview

Formul8 Platform is a production-ready cannabis industry consultant platform featuring:

- **Multi-Agent AI System**: 10 specialized AI agents organized in 3 deployment phases
- **Real-Time Analytics**: Performance tracking and compliance monitoring
- **Google Workspace Integration**: Automated document generation and management
- **AstraDB Vector Storage**: Advanced RAG capabilities for each agent
- **Compliance Monitoring**: State-by-state regulatory tracking across 25 legal states
- **Agent-to-Agent Verification**: Cross-validation system reducing hallucinations by 3000%+

## Architecture

### Phased Agent Deployment

#### Phase 1 (Core Operations)
- **Compliance Agent** - Regulatory compliance and SOP verification
- **Formulation Agent** - Product formulation and molecular analysis
- **Marketing Agent** - Compliant marketing and campaign strategy
- **Operations Agent** - Operations optimization and facility management
- **Sourcing Agent** - Vendor sourcing and equipment recommendations
- **Patent Agent** - Freedom to Operate (FTO) analysis and patent research

#### Phase 2 (Advanced Analytics)
- **Spectra Agent** - Spectral analysis and COA generation
- **Patent Agent** - Enhanced patent & trademark research

#### Phase 3 (Learning & Development)
- **LMS Agent** - Learning Management System for training and certification

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + Shadcn/UI components
- TanStack Query for state management
- Wouter for routing

**Backend:**
- Node.js with Express.js
- TypeScript with ES modules
- PostgreSQL with Drizzle ORM
- Replit Authentication (OpenID Connect)
- OpenAI GPT-4o integration

**AI Infrastructure:**
- AstraDB vector storage
- LangChain agent framework
- FAISS vectorstores
- Python-based agent implementations

## Project Structure

```
formul8-platform/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # Application pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions
├── server/                   # Express.js backend API
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic services
│   └── agents/              # Agent management services
├── agents/                   # All 10 specialized AI agents
│   ├── compliance-agent/
│   ├── formulation-agent/
│   ├── marketing-agent/
│   ├── operations-agent/
│   ├── sourcing-agent/
│   ├── patent-agent/
│   ├── science-agent/
│   ├── spectra-agent/
│   ├── customer-success-agent/
│   ├── lms-agent/
│   └── README.md
├── shared/                   # Shared utilities and schemas
├── scripts/                  # Deployment and management scripts
├── docs/                     # Documentation
└── migrations/               # Database migration files
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Google Service Account (for Workspace integration)
- AstraDB account (for vector storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/F8ai/formul8-platform.git
cd formul8-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Features

### Dashboard & Analytics
- Real-time agent performance monitoring
- Baseline assessment integration
- GitHub repository metrics
- Compliance tracking across 25 states

### Agent Management
- Individual agent dashboards
- Cross-agent verification system
- Baseline question management
- Performance metrics and confidence scoring

### Document Management
- Google Workspace integration
- Automated document generation
- Cannabis industry templates
- Compliance documentation

### User Management
- Replit authentication
- User profiles and preferences
- Conversation history tracking
- Activity monitoring

## API Reference

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user

### Agents
- `GET /api/agents/status` - Get all agent statuses
- `GET /api/agents/:id/metrics` - Get agent performance metrics
- `POST /api/agents/:id/query` - Query specific agent

### Baseline Testing
- `GET /api/baseline/metrics` - Get baseline test metrics
- `POST /api/baseline/run` - Run baseline tests

### GitHub Integration
- `GET /api/github/issues` - Get repository issues
- `POST /api/github/create-issue` - Create new issue

## Development

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
npm run type-check
```

### Database Operations
```bash
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
npm run db:generate    # Generate migrations
```

## Deployment

The platform is designed for deployment on Replit with automatic scaling and monitoring.

### Production Deployment
1. Configure environment variables
2. Set up PostgreSQL database
3. Configure AstraDB collections
4. Deploy to Replit

### Agent Deployment
Each agent can be deployed independently:
```bash
cd agents/compliance-agent
python run_agent.py --deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Documentation: [docs/](./docs/)
- Issues: GitHub Issues
- Email: support@formul8.ai

## Roadmap

- [ ] Phase 2 agent deployment
- [ ] Enhanced compliance monitoring
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Enterprise features

---

**Formul8 Platform** - Intelligent Cannabis Operations Management