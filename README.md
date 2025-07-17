# Formul8 Platform 🌿

> **Advanced AI-Powered Cannabis Operations Platform**
> 
> Comprehensive federated agent network delivering intelligent document management, compliance tracking, and collaborative workspace solutions with cutting-edge predictive analytics for the cannabis industry.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/F8ai/formul8-platform.git
cd formul8-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5000` to access the platform.

## 🏗️ Architecture Overview

### **Federated Agent Network**
- **Local Deployment**: `f8.company.com` - On-premises agents for data sovereignty
- **Cloud Platform**: `formul8.ai` - Global intelligence and cross-agent coordination
- **Hybrid Intelligence**: Secure agent-to-agent communication with mTLS encryption

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (Neon Serverless)
- **AI/ML**: OpenAI GPT-4o + LangGraph orchestration
- **Authentication**: Replit Auth (OpenID Connect)
- **Deployment**: Docker + GitHub Actions

## 🤖 Agent Ecosystem

### **Phase 1: Core Agents (Production Ready)**
| Agent | Specialty | Key Features |
|-------|-----------|--------------|
| **Compliance** | Regulatory Intelligence | 25-state cannabis law monitoring, real-time updates |
| **Formulation** | Molecular Analysis | RDKit integration, terpene profiling, stability analysis |
| **Marketing** | Campaign Optimization | Platform-specific compliance, N8N workflows |
| **Operations** | Process Efficiency | Facility optimization, workflow automation |
| **Sourcing** | Supply Chain | Vendor analysis, cost optimization, quality tracking |

### **Phase 2: Advanced Agents**
| Agent | Specialty | Key Features |
|-------|-----------|--------------|
| **Patent/FTO** | IP Analysis | Freedom-to-operate, patent landscape mapping |
| **Spectra** | Testing & QA | CoA analysis, GCMS interpretation, quality control |

### **Phase 3: Enterprise Agents**
| Agent | Specialty | Key Features |
|-------|-----------|--------------|
| **Science** | Research Validation | PubMed integration, evidence analysis |
| **Customer Success** | Support Automation | Intelligent ticketing, knowledge management |
| **LMS** | Training & Education | Compliance training, certification tracking |

## 🌐 Federated Deployment Options

### **Compliance-First Deployment**
```yaml
Local Agents: [Compliance, Operations]
Cloud Integration: [Patent, Marketing]
Data Classification: Highly Regulated
Price: $1,200/month
```

### **Hybrid Intelligence Deployment**
```yaml
Local Agents: [Compliance, Formulation, Operations]
Cloud Integration: [Patent, Marketing, Science, Spectra]
Data Classification: Mixed Sensitivity
Price: $2,400/month
```

### **Enterprise Scale Deployment**
```yaml
Local Agents: [All Local Agents]
Cloud Integration: [Global Intelligence, Analytics]
Data Classification: Enterprise Grade
Price: $4,800/month
```

## 🔐 Security Framework

- **mTLS Authentication**: Certificate-based agent communication
- **End-to-End Encryption**: TLS 1.3 for all data transmission
- **Local Data Sovereignty**: Sensitive data never leaves customer premises
- **Audit Logging**: Comprehensive activity tracking and compliance reporting

## 📁 Project Structure

```
formul8-platform/
├── agents/                    # All 10 specialized AI agents
│   ├── compliance-agent/
│   │   ├── rag/              # RAG corpus and vectorstore
│   │   ├── agent.py          # LangChain agent implementation
│   │   ├── baseline.json     # Performance baseline tests
│   │   └── agent_config.yaml # Agent configuration
│   ├── formulation-agent/    # RDKit molecular analysis
│   ├── marketing-agent/      # N8N workflow automation
│   └── ...
├── client/                   # React frontend application
│   ├── src/
│   │   ├── components/      # UI components (Shadcn/ui)
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utility functions
├── server/                  # Express.js backend API
│   ├── routes/             # API route handlers
│   ├── agents/             # Agent orchestration
│   └── services/           # Business logic
├── shared/                 # Common schemas & utilities
├── docs/                   # Documentation
└── local-deployment/       # Docker configurations
```

## 🎯 Key Features

### **Multi-Agent Orchestration**
- LangGraph-powered agent coordination
- Cross-agent verification and consensus
- Dynamic agent selection based on query complexity
- Human-in-the-loop workflows for critical decisions

### **Real-Time Performance Monitoring**
- Baseline assessment system with 90+ test questions
- Performance metrics: accuracy, confidence, response time
- Agent-specific KPI tracking and optimization
- Comprehensive dashboard with visual analytics

### **Google Workspace Integration**
- Automated document creation (SOPs, compliance forms)
- Cannabis industry templates and workflows
- F8 Cannabis Workspace with organized folder structure
- Professional document styling and branding

### **Cannabis Industry Specialization**
- Complete regulatory coverage (25 legal states)
- Industry-specific templates and workflows
- Compliance-first architecture with audit trails
- Professional cannabis document automation

## 🚀 Development

### **Local Agent Development**
```bash
# Run individual agent
python agents/compliance-agent/agent.py --interactive

# Execute baseline tests
python agents/compliance-agent/agent.py --test

# Query specific agent
python agents/compliance-agent/agent.py --query "CA cultivation regulations"
```

### **Frontend Development**
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

### **Database Operations**
```bash
# Push schema changes
npm run db:push

# Generate migrations
npm run db:generate

# View database studio
npm run db:studio
```

## 📊 Performance Metrics

- **Agent Accuracy**: 65-85% across all agents
- **Response Time**: <3 seconds average
- **Baseline Coverage**: 90 authentic test questions
- **State Compliance**: 25 states monitored in real-time
- **Document Automation**: 100+ cannabis industry templates

## 🔧 Environment Setup

### **Required Environment Variables**
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
GITHUB_PAT=ghp_...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...
```

### **Optional Configuration**
```bash
NODE_ENV=development
REPLIT_DOMAINS=your-domain.com
SESSION_SECRET=your-session-secret
```

## 📚 Documentation

- **[Federated Architecture](/docs/federated-agent-network.md)**: Complete federated deployment guide
- **[Agent Specifications](/docs/agent-specifications.md)**: Detailed agent capabilities and APIs
- **[API Documentation](/docs/api-reference.md)**: Complete REST API reference
- **[Security Framework](/docs/security.md)**: Security protocols and compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Platform**: [formul8.ai](https://formul8.ai)
- **Documentation**: [docs.formul8.ai](https://docs.formul8.ai)
- **Support**: [support@formul8.ai](mailto:support@formul8.ai)
- **GitHub**: [F8ai Organization](https://github.com/F8ai)

---

**Formul8 Platform** - Empowering the cannabis industry with intelligent automation and compliance solutions.