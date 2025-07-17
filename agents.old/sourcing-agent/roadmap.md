# Sourcing Agent Roadmap

## Overview
The Sourcing Agent connects cannabis operators with trusted equipment suppliers, consumables vendors, and packaging solutions while providing vendor reputation scoring and automated procurement workflows.

## Core Features

### 1. Equipment Sourcing Marketplace
**Priority: Critical**
- Connect to trusted sources with Supply the Brand Excel and EAG repository integration
- **Implementation:** Marketplace integration, Vendor database, Equipment catalog
- **APIs:** Supply the Brand API, EAG API, Vendor APIs
- **KPI:** Sourcing cost savings and vendor satisfaction

### 2. Vendor Reputation Scoring
**Priority: Critical**
- Calculate and display company reputation scores with recommendation filtering
- **Implementation:** Reputation algorithms, Score calculation, Review aggregation
- **APIs:** Review APIs, Business rating services

### 3. Auto-RFQ System
**Priority: High**
- Automatically submit RFQs with templated emails, specs, and NDAs to vendors
- **Implementation:** RFQ automation, Email templates, NDA integration
- **APIs:** Email APIs, Document management APIs

### 4. Consumables & Services Database
**Priority: High**
- Internal preferred vendors with contact forms and cost tracking
- **Implementation:** Vendor database, Contact management, Cost tracking
- **APIs:** Vendor APIs, Pricing services

### 5. Packaging Guidance System
**Priority: High**
- Compliance-aware packaging recommendations with regulatory validation
- **Implementation:** Packaging database, Compliance validation, Regulatory checking
- **APIs:** Packaging APIs, Compliance databases

### 6. Revenue Commission System
**Priority: Medium**
- Affiliate equipment spreadsheet with commission tracking and referral management
- **Implementation:** Commission tracking, Affiliate management, Revenue analytics
- **APIs:** Payment APIs, Affiliate tracking services

### 7. Lead Time Optimization
**Priority: Medium**
- Track and optimize supplier lead times with MOQ management
- **Implementation:** Lead time tracking, MOQ optimization, Supply chain analytics
- **APIs:** Supplier APIs, Logistics services

## Technical Architecture

### Database Integration
- PostgreSQL for vendor and equipment data storage
- Reputation scoring database with review aggregation
- Cost tracking and commission management systems

### API Integrations
- Vendor marketplace APIs for equipment sourcing
- Review and rating systems for reputation scoring
- Email and document management for RFQ automation

### LangChain Components
- RAG system for vendor and equipment information retrieval
- Memory management for sourcing preferences
- Tool integration for cost comparison and vendor evaluation

## Success Metrics
- **Cost Savings:** >15% reduction in equipment and supply costs
- **Vendor Satisfaction:** >4.5/5 average vendor rating
- **Procurement Speed:** >40% faster vendor selection process
- **Commission Revenue:** $10K+ monthly affiliate revenue

## Development Timeline
- **Phase 1 (Weeks 1-3):** Basic vendor search and reputation scoring
- **Phase 2 (Weeks 4-6):** Add RFQ automation and cost tracking
- **Phase 3 (Weeks 7-9):** Implement packaging compliance and lead time optimization
- **Phase 4 (Weeks 10-13):** Deploy full sourcing marketplace with commission system

## Repository Structure
```
sourcing-agent/
├── agent.py              # Main agent implementation
├── agent_config.yaml     # Agent configuration
├── baseline.json         # Test questions and scenarios
├── requirements.txt      # Python dependencies
├── rag/                  # RAG system components
│   ├── corpus.jsonl      # Training corpus
│   ├── vectorstore/      # FAISS index files
│   └── config.yaml       # RAG configuration
├── knowledge_base.ttl    # RDF knowledge base
├── test_cases/           # Test scenarios
└── dashboard.html        # Agent dashboard
```