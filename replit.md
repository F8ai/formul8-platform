# Formul8 Platform

## Overview

The Formul8 Platform is a comprehensive AI-powered cannabis operations platform. It provides AI consultation services through a full-stack web application featuring a multi-agent AI orchestration system. This system includes specialized agents deployed across three phases: Phase 1 (Compliance, Formulation, Marketing, Operations, Sourcing, Patent), Phase 2 (Spectra, FTO), and Phase 3 (LMS Agent). The platform ensures high-quality, production-ready answers through agent-to-agent verification and offers extensive cannabis industry expertise to support business operations.

## User Preferences

- **Communication style**: Simple, everyday language
- **Background**: PhD in computational biology, 30 years expertise in software and AI
- **Pricing structure**: $300/hour (contractor pays AI costs) OR $150/hour + 1.5% revenue share
- **Data Policy**: Never use mock data - always fetch real data from authentic sources (GitHub, APIs, databases)
- **Data Integrity**: Grey out and clearly label any simulated/generated data to distinguish from real API responses

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with custom Formul8 brand colors
- **State Management**: TanStack Query
- **Routing**: Wouter with desktop workspace available at `/desktop` and `/workspace`
- **Authentication**: Session-based with Replit Auth

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Authentication**: Replit OpenID Connect with Passport.js, PostgreSQL-backed sessions
- **AI Integration**: OpenAI GPT-4o for agent responses
- **Agent System**: LangChain agents, RAG with FAISS vectorstores, SPARQL knowledge bases (TTL/RDF ontologies), multi-model support (OpenAI, Anthropic, Google), and agent-to-agent verification.
- **Federated Architecture**: Designed for hybrid cloud deployments, allowing local agents to communicate with cloud agents via secure mTLS authentication, enabling data sovereignty and local intelligence.
- **Repository Structure**: Monorepo (`formul8-platform`) with `client/` (React frontend - prepared as independent submodule), `server/` (Express backend), `agents/` (specialized AI agents as Git submodules), `shared/` (utilities/schemas), `scripts/`, `docs/`, and `migrations/`. Each agent has a dedicated data repository as a submodule with Git LFS for large files (vector stores, models, training data). Frontend is being extracted to enable independent development.

### Deployment Architecture (Mixed Runtime Support - Aug 2, 2025)
- **Multi-Runtime Support**: Fixed deployment conflicts between Node.js and Python configurations
- **Python Packaging Fixed**: Configured setuptools to explicitly specify packages, excluded Node.js directories from Python discovery
- **Deployment Modes**: 
  - Node.js (default): Full-stack Express/React application (`node build.js`, `node dist/index.js`)
  - Python FastAPI: Alternative deployment with FastAPI serving pre-built assets (`python python_server.py`)
- **Build Optimization**: Frontend bundle optimized to 734KB, total build 2.6MB (2.0MB frontend + 604KB backend)
- **Docker Strategy**: Minimal Docker context (8.0MB) with pre-built production assets
- **Configuration Files**: 
  - `pyproject.toml`: Explicit package specification with comprehensive exclusions
  - `python_server.py`: FastAPI entry point for Python deployments
  - `deployment-config.py`: Automatic deployment mode detection
- **Platform Support**: Replit Deployments, Docker, Cloud Run, App Runner (both Node.js and Python runtimes)
- **Documentation**: Complete deployment fixes documented in `DEPLOYMENT-FIXES-APPLIED.md`

### Core Features and Design Patterns
- **Desktop Workspace**: Window-based multi-agent interface with floating, resizable widgets accessible at `/desktop` route
- **PWA Support**: Full Progressive Web App with iOS "Add to Home Screen", desktop notifications, and offline capabilities
- **Notification System**: Comprehensive notification menu with bell icon, unread badges, desktop/mobile PWA notifications
- **User Interface**: Chat-focused interface with Google Drive integration for document artifacts, responsive design (mobile-first), and persistent conversation memory
- **Brand Typography**: Consistent Formul8.ai font styling across all tab labels and UI components using Inter/SF Pro Display font stack with advanced typography features
- **Agent Ecosystem**: 12 specialized AI agents (Compliance, Formulation, Marketing, Operations, Sourcing, Patent, Science, Spectra, Customer Success, LMS, Metabolomics) designed for specific cannabis industry domains
- **Baseline Testing System**: Comprehensive AI-powered system for evaluating agent performance with authentic question sets, multi-model comparison, and detailed metrics (accuracy, confidence, cost)
- **Configuration Management**: Comprehensive agent configuration including model selection, RAG settings, and operational parameters via API
- **Data Management Platform**: Interface for corpus access, document upload, RAG generation, and SPARQL knowledge base management
- **Google Workspace Integration**: Automated document creation and management (SOPs, formulation sheets, compliance trackers) in Google Drive with service accounts and domain-wide delegation
- **Regulatory Data Service**: Automated daily collection and tracking of cannabis regulations from 24 states with change detection and vector search capabilities
- **Iterative Development**: Progressive enhancement approach starting with baseline AI, adding tools, knowledge bases, and RAG

## External Dependencies

### Database & Storage
- **Neon**: Serverless PostgreSQL hosting.
- **Drizzle**: Type-safe ORM.
- **connect-pg-simple**: PostgreSQL session store.
- **Git LFS**: For managing large files in agent data repositories.

### AI & Authentication
- **OpenAI**: GPT-4o and other models.
- **Anthropic**: Claude models.
- **Google**: Gemini models.
- **Replit Auth**: OAuth 2.0 / OpenID Connect provider.
- **Passport.js**: Authentication middleware.

### Frontend Libraries
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Data fetching and caching.
- **React Hook Form**: Form validation and management.

### Integrations
- **Google Drive / Docs / Sheets API**: For Google Workspace integration and document generation.
- **PubMed API**: For Science Agent's research analysis.
- **RDKit**: For Formulation Agent's molecular analysis.
- **N8N**: For Marketing Agent workflows.
- **GitHub API**: For project management, issue tracking, and agent development.