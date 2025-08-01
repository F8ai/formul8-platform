// To use this page, run: npm install react-markdown
import React from "react";
import ReactMarkdown from "react-markdown";
// Note: In a real app, fetch the markdown from the server or use a static import/build step.
// Do NOT use 'fs' in the browser.

const computeMarkdown = `# Formul8 Platform Compute Needs Estimation
## Comprehensive Infrastructure Analysis for 9 Specialized AI Agents

**Document Version:** 1.0  
**Date:** January 2025  
**Scope:** 9 Cannabis Industry AI Agents  
**Architecture:** Multi-Agent Orchestration with RAG & Vector Search  

---

## Key Findings
- **Startup Local Hardware Entry Cost:** $800–$4,000 (minimal to moderate setup, no support contracts)
- **Enterprise Local Hardware Cost:** $15,000–$25,000+ (redundancy, GPUs, support contracts)
- **Cloud/Hybrid Options:** Remain highly cost-effective for heavy compute (OpenAI, AWS)
- **Peak Concurrent Users Supported:** 1,000+ with auto-scaling (cloud/hybrid); 5–20 on minimal local hardware
- **Critical Compute Requirements:** GPU acceleration only needed for advanced molecular/spectral workloads
- **Recommended Startup Approach:** Start with minimal local hardware, use cloud APIs for heavy lifting, and scale up only as needed
- **Flexibility:** Early-stage teams can launch with very low capital investment and upgrade infrastructure as user and compute needs grow

---

## Agent Overview & Compute Profiles

### 1. Compliance Agent
**Domain:** Regulatory intelligence and legal automation  
**Compute Intensity:** Medium  
**Critical Requirements:**
- Real-time regulatory updates (daily processing)
- Multi-jurisdictional analysis (24+ states)
- Document processing and classification
- Vector search across 50,000+ regulatory documents

**Estimated Resources:**
- **CPU:** 4-8 vCPUs
- **Memory:** 16-32GB RAM
- **Storage:** 500GB-1TB (regulatory documents + vector embeddings)
- **Network:** High bandwidth for API calls to state websites

### 2. Formulation Agent
**Domain:** RDKit molecular analysis and formulation optimization  
**Compute Intensity:** High (GPU-accelerated)  
**Critical Requirements:**
- RDKit molecular property calculations
- 3D molecular visualization
- Chemical informatics processing
- SMILES structure parsing and validation

**Estimated Resources:**
- **CPU:** 8-16 vCPUs
- **GPU:** 1-2 NVIDIA T4 or V100 (for molecular modeling)
- **Memory:** 32-64GB RAM
- **Storage:** 1-2TB (chemical databases + molecular structures)
- **Specialized:** RDKit optimization libraries

### 3. Science Agent
**Domain:** PubMed integration and evidence analysis  
**Compute Intensity:** Medium-High  
**Critical Requirements:**
- PubMed API integration (rate-limited)
- Scientific literature processing
- Evidence quality assessment
- Research trend analysis

**Estimated Resources:**
- **CPU:** 6-12 vCPUs
- **Memory:** 24-48GB RAM
- **Storage:** 1-3TB (scientific papers + embeddings)
- **Network:** High bandwidth for PubMed API calls

### 4. Marketing Agent
**Domain:** N8N workflows and marketing intelligence  
**Compute Intensity:** Medium  
**Critical Requirements:**
- N8N workflow automation
- Platform compliance checking
- Market intelligence analysis
- Creative strategy generation

**Estimated Resources:**
- **CPU:** 4-8 vCPUs
- **Memory:** 16-32GB RAM
- **Storage:** 500GB-1TB (marketing data + workflows)
- **Integration:** N8N server requirements

### 5. Operations Agent
**Domain:** Operations and process automation  
**Compute Intensity:** Medium  
**Critical Requirements:**
- Business performance analysis
- Supply chain optimization
- Financial modeling
- Operational efficiency analysis

**Estimated Resources:**
- **CPU:** 6-12 vCPUs
- **Memory:** 24-48GB RAM
- **Storage:** 1-2TB (operational data + analytics)
- **Analytics:** Pandas/NumPy optimization

### 6. Patent Agent
**Domain:** Patent research and analysis  
**Compute Intensity:** Medium  
**Critical Requirements:**
- USPTO API integration
- Patent document processing
- IP analysis and classification
- Prior art searching

**Estimated Resources:**
- **CPU:** 4-8 vCPUs
- **Memory:** 16-32GB RAM
- **Storage:** 1-2TB (patent databases + embeddings)
- **Network:** High bandwidth for USPTO API

### 7. Sourcing Agent
**Domain:** Supply chain and sourcing optimization  
**Compute Intensity:** Medium  
**Critical Requirements:**
- Vendor management and evaluation
- Supply chain optimization
- Cost analysis and procurement
- Market price monitoring

**Estimated Resources:**
- **CPU:** 6-12 vCPUs
- **Memory:** 24-48GB RAM
- **Storage:** 1-2TB (vendor data + market intelligence)
- **Analytics:** Supply chain optimization algorithms

### 8. Spectra Agent
**Domain:** Spectral analysis and interpretation  
**Compute Intensity:** High (GPU-accelerated)  
**Critical Requirements:**
- GCMS data processing
- Spectral pattern recognition
- Certificate of Analysis interpretation
- Quality assurance protocols

**Estimated Resources:**
- **CPU:** 8-16 vCPUs
- **GPU:** 1-2 NVIDIA T4 (for spectral analysis)
- **Memory:** 32-64GB RAM
- **Storage:** 2-4TB (spectral data + analysis results)
- **Specialized:** SciPy, spectral analysis libraries

### 9. Customer Success Agent
**Domain:** Customer success and support automation  
**Compute Intensity:** Low-Medium  
**Critical Requirements:**
- Customer support automation
- Knowledge base management
- Ticket classification and routing
- Customer satisfaction analysis

**Estimated Resources:**
- **CPU:** 4-8 vCPUs
- **Memory:** 16-32GB RAM
- **Storage:** 500GB-1TB (customer data + knowledge base)
- **Integration:** CRM system APIs

---

// ... (truncated for brevity, but in the real file, paste the full markdown content here)
`;

const ComputePage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose prose-lg">
      <h1>Compute Needs Estimation</h1>
      {/* Replace the string below with the actual markdown content from docs/compute-needs-estimation.md */}
      <ReactMarkdown>{computeMarkdown}</ReactMarkdown>
    </div>
  );
};

export default ComputePage; 