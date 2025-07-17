# Federated Agent Deployment Guide

## Overview

Formul8's federated architecture allows customers to deploy agents locally at `f8.company.com` while maintaining communication with cloud agents on `formul8.ai`. This ensures data sovereignty while accessing full platform intelligence.

## Deployment Models

### 1. Compliance-First Deployment
- **Local Agents**: Compliance, Operations
- **Cloud Agents**: Patent, Marketing, Science, Spectra
- **Monthly Cost**: $1,200
- **Use Case**: Maximum data control for highly regulated environments

### 2. Hybrid Intelligence Deployment
- **Local Agents**: Compliance, Formulation, Operations
- **Cloud Agents**: Patent, Marketing, Science, Spectra
- **Monthly Cost**: $2,400
- **Use Case**: Balanced approach with local processing and cloud insights

### 3. Enterprise Scale Deployment
- **Local Agents**: All agents locally deployed
- **Cloud Agents**: Global intelligence and analytics only
- **Monthly Cost**: $4,800
- **Use Case**: Full local deployment with cloud orchestration

## Prerequisites

1. **Docker Environment**: Docker and Docker Compose installed
2. **SSL Certificates**: Valid SSL certificates for your domain
3. **Network Access**: Outbound HTTPS access to formul8.ai
4. **Hardware Requirements**: 
   - 16GB RAM minimum
   - 8 CPU cores recommended
   - 500GB SSD storage

## Step 1: Download Deployment Package

```bash
# Download the federated deployment package
curl -O https://releases.formul8.ai/federated-agents-v1.tar.gz
tar -xzf federated-agents-v1.tar.gz
cd federated-agents
```

## Step 2: Configuration

### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Federated Node Configuration
FEDERATION_NODE_ID=your-company-f8-node
FEDERATION_ENDPOINT=https://f8.company.com
CLOUD_ENDPOINT=https://formul8.ai

# Local Agents Configuration
LOCAL_AGENTS=compliance,operations,formulation
POSTGRES_URL=postgresql://user:pass@localhost:5432/f8local

# SSL Configuration
SSL_CERT_PATH=/certs/f8.company.com.crt
SSL_KEY_PATH=/certs/f8.company.com.key

# Authentication
FEDERATION_SECRET=your-federation-secret
CLOUD_API_KEY=your-cloud-api-key
```

### Agent Selection Configuration
```yaml
# agents-config.yaml
federation:
  nodeId: "company-f8-node"
  cloudEndpoint: "https://formul8.ai"
  
localAgents:
  - name: "compliance"
    repository: "https://github.com/F8ai/compliance-agent"
    dataRepository: "https://github.com/F8ai/compliance-data"
    
  - name: "operations"
    repository: "https://github.com/F8ai/operations-agent"
    dataRepository: "https://github.com/F8ai/operations-data"

cloudAgents:
  - "patent"
  - "marketing"
  - "science"
  - "spectra"
```

## Step 3: Deploy with Docker Compose

```bash
# Start federated agent deployment
docker-compose up -d

# Check deployment status
docker-compose ps

# View logs
docker-compose logs -f
```

## Step 4: Register with Cloud

The deployment will automatically register with the cloud federation:

```bash
# Manual registration (if needed)
curl -X POST https://formul8.ai/api/federation/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLOUD_API_KEY" \
  -d '{
    "endpoint": "https://f8.company.com",
    "agents": ["compliance", "operations"],
    "type": "local",
    "certificateFingerprint": "your-cert-fingerprint"
  }'
```

## Step 5: Verify Federation

Test the federated setup:

```bash
# Test local agent
curl https://f8.company.com/api/agents/compliance/health

# Test federation communication
curl https://f8.company.com/api/federation/nodes

# Test cross-agent query
curl -X POST https://f8.company.com/api/federation/query \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "patent",
    "query": "Check patent status for CBD extraction method",
    "sourceNode": "company-f8-node"
  }'
```

## Security Configuration

### mTLS Setup
1. Generate client certificates for federation authentication
2. Configure certificate validation in `docker-compose.yml`
3. Set up certificate rotation schedule

### Network Security
- All federation communication uses TLS 1.3
- Certificate-based mutual authentication
- API key validation for all requests
- Rate limiting and DDoS protection

## Monitoring and Maintenance

### Health Checks
- Automated health monitoring for all local agents
- Federation heartbeat every 30 seconds
- Cloud connectivity verification

### Updates
```bash
# Update local agents
docker-compose pull
docker-compose up -d

# Update federation configuration
./scripts/update-federation-config.sh
```

### Backup
```bash
# Backup local data and configurations
./scripts/backup-federation.sh
```

## Troubleshooting

### Common Issues

1. **Federation Connection Failed**
   - Check SSL certificates
   - Verify API keys
   - Confirm network connectivity

2. **Agent Not Responding**
   - Check Docker container status
   - Verify environment variables
   - Review application logs

3. **Cloud Communication Issues**
   - Verify outbound HTTPS access
   - Check federation credentials
   - Confirm cloud endpoint availability

### Support
For deployment support:
- Email: federation-support@formul8.ai
- Documentation: https://docs.formul8.ai/federation
- Status Page: https://status.formul8.ai

## Cost Optimization

### Resource Management
- Scale agents based on usage
- Use spot instances for development
- Implement auto-scaling for production

### License Management
- Monitor agent usage metrics
- Optimize local vs cloud agent distribution
- Regular cost analysis and optimization