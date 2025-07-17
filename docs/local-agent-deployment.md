# Local Agent Deployment Architecture

## Overview

The Formul8 Platform supports hybrid deployment where individual AI agents can be deployed locally on a customer's LAN while maintaining secure communication with the central platform. This approach provides:

- **Data Sovereignty**: Sensitive data never leaves the customer's network
- **Compliance**: Meet regulatory requirements for data handling
- **Performance**: Reduced latency for local operations
- **Security**: Enhanced control over data access and processing

## Architecture Options

### Option 1: Local Agent with Cloud Orchestration

```
Customer LAN                    Formul8 Cloud
┌─────────────────────────┐    ┌─────────────────────────┐
│  Local Agent Instance  │◄──►│  Platform Orchestrator  │
│  - Compliance Agent     │    │  - Agent Management     │
│  - Local Data Storage   │    │  - Cross-Agent Verify   │
│  - Vector Database      │    │  - Dashboard & Analytics│
│  - Document Processing  │    │  - User Management      │
└─────────────────────────┘    └─────────────────────────┘
```

### Option 2: Fully Local Deployment

```
Customer LAN Only
┌───────────────────────────────────────────┐
│  Complete Formul8 Instance                │
│  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Web UI      │  │ Selected Agents     │ │
│  │ Dashboard   │  │ - Compliance        │ │
│  │ Analytics   │  │ - Formulation       │ │
│  └─────────────┘  │ - Operations        │ │
│                   └─────────────────────┘ │
│  ┌─────────────────────────────────────┐   │
│  │ Local Infrastructure               │   │
│  │ - PostgreSQL Database              │   │
│  │ - AstraDB/Vector Storage           │   │
│  │ - Document Management              │   │
│  └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

### Option 3: Edge Computing Hybrid

```
Customer LAN                 Edge Gateway              Formul8 Cloud
┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐
│ Local Agents    │◄───────►│ Sync Gateway    │◄─────►│ Central Platform│
│ - Real-time ops │         │ - Data sync     │       │ - Global insights│
│ - Local data    │         │ - Security      │       │ - Updates       │
│ - Fast response │         │ - Monitoring    │       │ - Coordination  │
└─────────────────┘         └─────────────────┘       └─────────────────┘
```

## Implementation Components

### Local Agent Container

**Docker Deployment:**
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy agent files
COPY agents/compliance-agent ./compliance-agent
COPY shared ./shared
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Set up local environment
ENV NODE_ENV=production
ENV AGENT_MODE=local
ENV PLATFORM_SYNC=enabled

EXPOSE 3000
CMD ["npm", "run", "start:local"]
```

**Key Features:**
- Standalone agent execution
- Local vector database (FAISS/ChromaDB)
- Document processing pipeline
- Secure API endpoints
- Health monitoring

### Data Synchronization

**Secure Sync Protocol:**
- Encrypted data transfer (TLS 1.3)
- Differential sync (only changes)
- Configurable sync frequency
- Audit logging
- Rollback capabilities

**Sync Components:**
```typescript
interface LocalAgentSync {
  // Outbound: Send insights to cloud
  sendInsights(data: AgentInsights): Promise<void>;
  
  // Inbound: Receive updates from cloud
  receiveUpdates(): Promise<PlatformUpdates>;
  
  // Configuration sync
  syncConfiguration(): Promise<AgentConfig>;
  
  // Knowledge base updates
  syncKnowledgeBase(): Promise<KnowledgeUpdate>;
}
```

### Security Framework

**Authentication:**
- mTLS certificate-based auth
- API key rotation
- JWT token validation
- Role-based access control

**Data Protection:**
- End-to-end encryption
- Local data encryption at rest
- Secure key management
- Compliance logging

## Deployment Models

### Model 1: Compliance-First Deployment

**Target:** Highly regulated environments
**Components:**
- Local compliance agent only
- Air-gapped option available
- Manual knowledge updates
- Local document generation

**Benefits:**
- Maximum data control
- Regulatory compliance
- No external dependencies
- Custom compliance rules

### Model 2: Hybrid Intelligence

**Target:** Enterprise customers
**Components:**
- 3-5 local agents
- Cloud orchestration
- Real-time sync
- Shared analytics

**Benefits:**
- Best of both worlds
- Scalable performance
- Global insights
- Local data control

### Model 3: Edge Computing

**Target:** Multi-location enterprises
**Components:**
- Regional agent clusters
- Edge synchronization
- Load balancing
- Failover capabilities

**Benefits:**
- Geographic distribution
- High availability
- Performance optimization
- Disaster recovery

## Technical Specifications

### Hardware Requirements

**Minimum Configuration:**
- CPU: 4 cores, 2.4GHz
- RAM: 16GB
- Storage: 500GB SSD
- Network: 100Mbps

**Recommended Configuration:**
- CPU: 8 cores, 3.2GHz
- RAM: 32GB
- Storage: 1TB NVMe SSD
- Network: 1Gbps
- GPU: Optional for ML acceleration

### Software Stack

**Container Platform:**
- Docker or Podman
- Kubernetes (optional)
- Docker Compose for orchestration

**Database Options:**
- PostgreSQL (local)
- SQLite (lightweight)
- ChromaDB (vector storage)

**Monitoring:**
- Prometheus metrics
- Grafana dashboards
- Health check endpoints
- Log aggregation

## Installation Process

### Quick Start (Docker)

```bash
# Download Formul8 Local Agent
curl -sSL https://get.formul8.ai/local | bash

# Configure environment
./formul8-local configure

# Deploy selected agents
./formul8-local deploy --agents compliance,formulation

# Start services
./formul8-local start
```

### Custom Installation

```bash
# Clone repository
git clone https://github.com/F8ai/formul8-local.git
cd formul8-local

# Configure deployment
cp config/local.example.yaml config/local.yaml
vi config/local.yaml

# Deploy infrastructure
docker-compose up -d database vector-db

# Deploy agents
docker-compose up -d compliance-agent formulation-agent

# Configure networking
./scripts/setup-networking.sh
```

## Configuration Options

### Agent Selection
```yaml
agents:
  enabled:
    - compliance
    - formulation
    - operations
  disabled:
    - marketing
    - sourcing
    
sync:
  frequency: "hourly"
  method: "differential"
  encryption: true
  
security:
  tls_version: "1.3"
  certificate_path: "/certs"
  key_rotation: "monthly"
```

### Network Configuration
```yaml
network:
  internal_port: 3000
  external_port: 8080
  allowed_ips:
    - "192.168.1.0/24"
    - "10.0.0.0/8"
  
platform:
  sync_endpoint: "https://sync.formul8.ai"
  api_version: "v1"
  timeout: 30
```

## Pricing Model

### Local Agent Licensing

**Per-Agent Pricing:**
- Compliance Agent: $500/month
- Formulation Agent: $400/month
- Operations Agent: $300/month
- Additional agents: $200/month each

**Bundle Options:**
- 3-Agent Bundle: $1,000/month (17% savings)
- 5-Agent Bundle: $1,500/month (25% savings)
- Enterprise Bundle: All agents $2,000/month (33% savings)

**Additional Services:**
- Setup & Installation: $2,500 one-time
- Training & Support: $1,000/month
- Custom Integration: $5,000-15,000
- Managed Updates: $500/month

## Support & Maintenance

### Included Support
- Remote monitoring
- Automated updates
- 24/7 health checks
- Email support

### Premium Support
- Phone support
- On-site installation
- Custom configuration
- Dedicated account manager
- SLA guarantees

## Use Cases

### Cannabis Cultivation Facility
**Deployment:** Compliance + Operations agents locally
**Benefits:** Real-time compliance monitoring, local data control
**ROI:** 40% reduction in compliance violations

### Manufacturing Operation
**Deployment:** Formulation + Quality Control agents
**Benefits:** Faster product development, local IP protection
**ROI:** 25% faster time-to-market

### Multi-State Operator
**Deployment:** Regional compliance agents per state
**Benefits:** State-specific compliance, centralized oversight
**ROI:** 60% reduction in regulatory overhead

## Getting Started

1. **Assessment Call:** Discuss requirements and deployment options
2. **Technical Planning:** Design custom architecture
3. **Pilot Deployment:** Start with single agent
4. **Full Rollout:** Deploy complete solution
5. **Training & Support:** User training and ongoing support

Contact: enterprise@formul8.ai for local deployment consultation