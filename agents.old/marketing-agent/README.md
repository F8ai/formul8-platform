# 📢 Marketing Agent

![Accuracy](https://img.shields.io/badge/Accuracy-88%25-yellow)
![Tests](https://img.shields.io/badge/Tests-9%2F10-blue)
![Confidence](https://img.shields.io/badge/Confidence-0.82-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![LangChain](https://img.shields.io/badge/LangChain-Enabled-blue)
![N8N](https://img.shields.io/badge/N8N-Integrated-purple)

## Overview

The Marketing Agent is a specialized AI system designed for cannabis industry marketing optimization, platform compliance, and automated workflow management. It combines advanced marketing intelligence with LangChain's conversational AI capabilities to provide expert guidance on compliant cannabis marketing strategies.

### Core Capabilities

- **Platform Compliance**: Automated compliance checking for Facebook, Google Ads, Instagram, Weedmaps, and Leafly
- **Creative Strategy Generation**: Compliant messaging and creative workarounds for restricted platforms
- **N8N Workflow Automation**: Marketing automation workflows with campaign optimization
- **Market Intelligence**: CPC analysis, audience insights, and campaign performance prediction
- **RAG Knowledge Base**: Retrieval-augmented generation from curated marketing research
- **RDF Knowledge Queries**: Structured knowledge base queries using SPARQL
- **Memory Management**: Conversation history and context tracking across sessions

## Technical Architecture

### LangChain Implementation
- **Agent Framework**: Custom LangChain agent with specialized marketing tools
- **Memory System**: ConversationBufferWindowMemory for session persistence
- **Tool Integration**: Platform compliance checking, market analysis, and N8N workflows
- **Prompt Engineering**: Optimized prompts for marketing and compliance expertise

### Marketing Intelligence
- **Platform Analysis**: Real-time platform policy monitoring and compliance verification
- **Creative Optimization**: A/B testing recommendations and performance prediction
- **Market Research**: Competitor analysis, trend identification, and opportunity assessment
- **Campaign Automation**: N8N workflow templates for common marketing tasks

### Dependencies
- **LangChain**: Conversational AI framework and memory management
- **FAISS**: Vector similarity search for RAG retrieval
- **rdflib**: RDF knowledge base queries and SPARQL processing
- **BeautifulSoup**: Web scraping for platform policy updates

## Usage

### Standalone Execution
```bash
# Interactive mode
python run_agent.py --interactive

# Single query
python run_agent.py --query "Create a compliant Facebook ad strategy for CBD products"

# Run baseline tests
python run_agent.py --test

# Show help
python run_agent.py --help
```

### Integration with Main Platform
```python
from agent import create_marketing_agent

# Create agent instance
agent = create_marketing_agent()

# Process query with user context
response = await agent.process_query(
    user_id="user123",
    query="Analyze marketing compliance for Google Ads",
    context={"platform": "google_ads", "product_type": "cbd"}
)

print(f"Response: {response['response']}")
print(f"Confidence: {response['confidence']}")
```

## Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Baseline Accuracy | 88% | >80% |
| Average Confidence | 0.82 | >0.70 |
| Response Time | <2.5s | <5s |
| Test Coverage | 9/10 | 10/10 |

### Test Categories
- Platform compliance verification
- Creative strategy development
- N8N workflow optimization
- Market intelligence analysis
- Campaign performance prediction
- Budget optimization recommendations
- Audience targeting strategies
- Regulatory compliance guidance

## Configuration

### Agent Configuration (`agent_config.yaml`)
```yaml
agent:
  name: "MarketingAgent"
  version: "1.0.0"
  description: "Cannabis marketing and platform compliance specialist"
  
llm:
  provider: "openai"
  model: "gpt-4o"
  temperature: 0.2
  max_tokens: 2048

rag:
  vectorstore_path: "./rag/vectorstore"
  corpus_path: "./rag/corpus.jsonl"
  chunk_size: 1000
  chunk_overlap: 200
  retrieval_k: 5

rdf:
  knowledge_base: "./knowledge_base.ttl"
  sparql_model: "microsoft/DialoGPT-medium"

tools:
  - name: "platform_compliance"
    description: "Marketing platform compliance verification"
  - name: "creative_strategy"
    description: "Compliant creative strategy generation"
  - name: "market_intelligence"
    description: "Market analysis and insights"
  - name: "n8n_workflow"
    description: "Marketing automation workflows"
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
AGENT_LOG_LEVEL=INFO
RAG_CACHE_SIZE=1000
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Platform Compliance Matrix

| Platform | Cannabis Policy | Workaround Strategy | CPC Range |
|----------|----------------|-------------------|-----------|
| Facebook | Hemp/Wellness Only | Lifestyle & Wellness Angle | $0.80-$2.50 |
| Instagram | Hemp/Wellness Only | Educational Content | $0.90-$3.00 |
| Google Ads | CBD Restricted | Informational Landing Pages | $1.20-$4.00 |
| Weedmaps | Cannabis Friendly | Direct Product Marketing | $0.40-$1.80 |
| Leafly | Cannabis Friendly | Strain & Product Focus | $0.35-$1.60 |

## N8N Workflow Templates

### Campaign Optimization Workflow
1. **Data Collection**: Gather campaign metrics from multiple platforms
2. **Performance Analysis**: Calculate ROI, CPC, and conversion rates
3. **Optimization Recommendations**: Generate data-driven suggestions
4. **Automated Adjustments**: Implement bid and budget optimizations
5. **Reporting**: Send performance summaries to stakeholders

### Compliance Monitoring Workflow
1. **Policy Monitoring**: Track platform policy changes
2. **Content Scanning**: Analyze existing ads for compliance violations
3. **Alert Generation**: Notify team of potential compliance issues
4. **Correction Suggestions**: Provide compliant alternative messaging
5. **Documentation**: Log all compliance actions and decisions

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/F8ai/marketing-agent.git
cd marketing-agent

# Install dependencies
pip install -r requirements.txt

# Run tests
python run_agent.py --test
```

### Directory Structure
```
marketing-agent/
├── agent.py                 # Main agent implementation
├── agent_config.yaml        # Configuration file
├── baseline.json           # Test questions and evaluation
├── run_agent.py            # Standalone execution script
├── requirements.txt        # Python dependencies
├── rag/                    # RAG system files
│   ├── corpus.jsonl        # Training corpus
│   ├── vectorstore/        # FAISS indices
│   └── config.yaml         # RAG configuration
├── knowledge_base.ttl      # RDF knowledge base
├── n8n_workflows/          # N8N workflow templates
├── platform_policies/     # Platform compliance data
└── .github/
    └── workflows/
        └── baseline-tests.yml  # CI/CD automation
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing
The agent includes comprehensive baseline testing covering:
- Platform compliance accuracy
- Creative strategy effectiveness
- Market intelligence precision
- N8N workflow functionality
- Response quality and relevance

## Marketing Intelligence

### Key Metrics Tracked
- **Cost Per Click (CPC)**: Platform-specific pricing analysis
- **Conversion Rates**: Industry benchmarks and optimization targets
- **Audience Insights**: Demographic and psychographic profiling
- **Competitive Analysis**: Market positioning and opportunity identification
- **Trend Analysis**: Emerging opportunities and market shifts

### Compliance Features
- **Real-time Policy Monitoring**: Automated tracking of platform policy changes
- **Content Compliance Scoring**: AI-powered compliance risk assessment
- **Creative Alternatives**: Automated generation of compliant messaging
- **Documentation**: Comprehensive compliance audit trails
- **Risk Assessment**: Predictive compliance risk modeling

## Research Foundation

### Platform Expertise
- **Facebook/Meta**: Wellness angle strategies, educational content approaches
- **Google Ads**: Informational campaigns, landing page optimization
- **Cannabis Platforms**: Direct marketing strategies, product positioning
- **Emerging Platforms**: TikTok, Pinterest, and influencer marketing
- **Email Marketing**: Compliance-focused drip campaigns and automation

### Industry Knowledge
- 300+ case studies of successful cannabis marketing campaigns
- Platform policy archives and change tracking
- Industry-specific creative assets and messaging libraries
- Compliance violation examples and prevention strategies
- ROI benchmarks across all major platforms

## License

Copyright (c) 2025 F8ai. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

## Support

For technical support or questions:
- GitHub Issues: [F8ai/marketing-agent/issues](https://github.com/F8ai/marketing-agent/issues)
- Email: support@f8ai.com
- Documentation: [F8ai Marketing Agent Docs](https://docs.f8ai.com/marketing-agent)

---

**Built with** ❤️ **by F8ai - Advanced AI for Cannabis Industry**