#!/usr/bin/env node

/**
 * Create GitHub Issues for Agent Training Data Acquisition
 * Generates comprehensive issues for each agent's training data requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Agent training data configurations
const agentTrainingConfigs = {
  'compliance-agent': {
    title: '🛡️ Compliance Agent Training Data Acquisition',
    priority: 'CRITICAL',
    estimatedEffort: '4-6 weeks',
    description: 'Collect comprehensive cannabis regulatory and compliance training data',
    dataSources: [
      {
        category: 'State Cannabis Regulations',
        priority: 'CRITICAL',
        sources: [
          'All 38+ legal cannabis states current regulations',
          'Municipal ordinances for major cannabis markets',
          'Federal guidance documents (Cole Memo, FinCEN)',
          'Weekly regulatory updates and bulletins'
        ],
        automation: 'Daily scraping of state cannabis control board websites'
      },
      {
        category: 'Packaging & Labeling Requirements',
        priority: 'HIGH',
        sources: [
          'State-specific labeling templates',
          'Child-resistant packaging standards',
          'Track-and-trace system manuals (METRC, BioTrackTHC)',
          'Sample collection and chain of custody procedures'
        ],
        automation: 'Weekly monitoring of packaging requirement updates'
      },
      {
        category: 'Testing & Safety Standards',
        priority: 'HIGH',
        sources: [
          'State testing requirements and limits',
          'Laboratory certification procedures',
          'Pesticide and contaminant limits',
          'Quality control protocols'
        ],
        automation: 'Monthly updates from testing standards organizations'
      }
    ],
    successCriteria: [
      'Complete regulatory coverage for all legal cannabis states',
      'Real-time compliance alerts for regulation changes',
      '95%+ accuracy in compliance guidance',
      'Automated daily regulatory monitoring system'
    ]
  },

  'formulation-agent': {
    title: '🧪 Formulation Agent Training Data Acquisition',
    priority: 'CRITICAL',
    estimatedEffort: '3-5 weeks',
    description: 'Collect chemical, molecular, and formulation training data',
    dataSources: [
      {
        category: 'Chemical & Molecular Data',
        priority: 'CRITICAL',
        sources: [
          'Cannabinoid and terpene molecular structures (SMILES, InChI)',
          'PubChem cannabis compound database',
          'Solubility and stability interaction data',
          'Extraction efficiency data by method'
        ],
        automation: 'Weekly PubChem and ChEMBL database updates'
      },
      {
        category: 'Formulation Recipes & Techniques',
        priority: 'HIGH',
        sources: [
          'Published extraction protocols and SOPs',
          'Encapsulation and emulsification techniques',
          'Dosage forms and delivery methods',
          'Stability testing and shelf-life data'
        ],
        automation: 'Monthly literature review and patent monitoring'
      },
      {
        category: 'Equipment & Process Parameters',
        priority: 'HIGH',
        sources: [
          'Extraction equipment specifications',
          'Processing temperature/pressure profiles',
          'Quality control testing procedures',
          'Equipment maintenance schedules'
        ],
        automation: 'Quarterly equipment manufacturer updates'
      }
    ],
    successCriteria: [
      'Complete molecular database for 200+ cannabis compounds',
      'Validated extraction and formulation protocols',
      '90%+ accuracy in molecular property predictions',
      'RDKit integration with real chemical data'
    ]
  },

  'marketing-agent': {
    title: '📢 Marketing Agent Training Data Acquisition',
    priority: 'HIGH',
    estimatedEffort: '3-4 weeks',
    description: 'Collect marketing compliance and strategy training data',
    dataSources: [
      {
        category: 'Platform Advertising Policies',
        priority: 'CRITICAL',
        sources: [
          'Facebook/Instagram cannabis advertising restrictions',
          'Google Ads cannabis policy documents',
          'Cannabis platform guidelines (Weedmaps, Leafly)',
          'State advertising restriction summaries'
        ],
        automation: 'Weekly platform policy monitoring'
      },
      {
        category: 'Market Research & Analytics',
        priority: 'HIGH',
        sources: [
          'Cannabis consumer behavior studies',
          'Market sizing and demographic data',
          'Pricing analysis and competitive intelligence',
          'Brand positioning case studies'
        ],
        automation: 'Monthly market research report updates'
      }
    ],
    successCriteria: [
      'Complete platform compliance database',
      'Real-time policy change alerts',
      '95%+ compliance rate for marketing recommendations',
      'Automated competitor analysis system'
    ]
  },

  'operations-agent': {
    title: '⚙️ Operations Agent Training Data Acquisition',
    priority: 'HIGH',
    estimatedEffort: '4-5 weeks',
    description: 'Collect facility management and operations training data',
    dataSources: [
      {
        category: 'Facility Design & Management',
        priority: 'CRITICAL',
        sources: [
          'Cannabis facility design standards',
          'HVAC and environmental control specs',
          'Security system requirements',
          'Workflow optimization case studies'
        ],
        automation: 'Quarterly facility standards updates'
      },
      {
        category: 'Production & Manufacturing',
        priority: 'HIGH',
        sources: [
          'Standard operating procedures',
          'Quality management documentation',
          'Batch record templates',
          'Equipment utilization metrics'
        ],
        automation: 'Monthly SOP and QMS updates'
      }
    ],
    successCriteria: [
      'Complete facility design database',
      'Optimized workflow recommendations',
      '90%+ operational efficiency improvements',
      'Automated equipment monitoring integration'
    ]
  },

  'sourcing-agent': {
    title: '🛒 Sourcing Agent Training Data Acquisition',
    priority: 'MEDIUM',
    estimatedEffort: '3-4 weeks',
    description: 'Collect vendor and procurement training data',
    dataSources: [
      {
        category: 'Vendor & Supplier Databases',
        priority: 'CRITICAL',
        sources: [
          'Cannabis industry vendor directories',
          'Equipment manufacturer catalogs',
          'Pricing databases and market rates',
          'Supplier qualification scorecards'
        ],
        automation: 'Weekly vendor database updates'
      },
      {
        category: 'Procurement Strategies',
        priority: 'HIGH',
        sources: [
          'Contract templates and negotiation strategies',
          'Cost optimization case studies',
          'Supply chain risk assessments',
          'Vendor performance metrics'
        ],
        automation: 'Monthly procurement best practices updates'
      }
    ],
    successCriteria: [
      'Comprehensive vendor database with 1000+ suppliers',
      'Cost optimization recommendations',
      '15%+ average procurement savings',
      'Automated vendor qualification system'
    ]
  },

  'patent-agent': {
    title: '⚖️ Patent Agent Training Data Acquisition',
    priority: 'MEDIUM',
    estimatedEffort: '4-6 weeks',
    description: 'Collect intellectual property and legal training data',
    dataSources: [
      {
        category: 'Patent Databases',
        priority: 'CRITICAL',
        sources: [
          'USPTO cannabis patent filings and grants',
          'International patent databases (WIPO, EPO)',
          'Patent classification systems',
          'Prior art search strategies'
        ],
        automation: 'Weekly patent database updates'
      },
      {
        category: 'IP Law & Regulations',
        priority: 'HIGH',
        sources: [
          'Cannabis-specific IP law developments',
          'Patent prosecution guidelines',
          'Trademark law and brand protection',
          'Trade secret protection practices'
        ],
        automation: 'Monthly IP law monitoring'
      }
    ],
    successCriteria: [
      'Complete cannabis patent landscape mapping',
      'Freedom to operate assessments',
      '95%+ accuracy in prior art searches',
      'Automated patent monitoring system'
    ]
  },

  'science-agent': {
    title: '🔬 Science Agent Training Data Acquisition',
    priority: 'HIGH',
    estimatedEffort: '3-4 weeks',
    description: 'Collect scientific research and evidence training data',
    dataSources: [
      {
        category: 'Research Literature',
        priority: 'CRITICAL',
        sources: [
          'PubMed cannabis and cannabinoid studies',
          'Clinical trial databases',
          'Peer-reviewed journal articles',
          'Research methodology guides'
        ],
        automation: 'Daily PubMed API integration'
      },
      {
        category: 'Scientific Databases',
        priority: 'HIGH',
        sources: [
          'Chemical and biological databases',
          'Clinical trial registries',
          'Adverse event reporting systems',
          'Drug interaction databases'
        ],
        automation: 'Weekly scientific database updates'
      }
    ],
    successCriteria: [
      'Complete cannabis research literature database',
      'Evidence-based recommendations',
      '90%+ citation accuracy',
      'Automated literature monitoring'
    ]
  },

  'spectra-agent': {
    title: '📊 Spectra Agent Training Data Acquisition',
    priority: 'MEDIUM',
    estimatedEffort: '3-4 weeks',
    description: 'Collect analytical chemistry and testing training data',
    dataSources: [
      {
        category: 'Analytical Methods',
        priority: 'CRITICAL',
        sources: [
          'AOAC Official Methods for cannabis',
          'ASTM standards for cannabis analysis',
          'Laboratory SOPs and protocols',
          'Method validation procedures'
        ],
        automation: 'Quarterly standards organization updates'
      },
      {
        category: 'Spectral Libraries',
        priority: 'HIGH',
        sources: [
          'Reference spectra for cannabinoids',
          'Contaminant and impurity spectra',
          'Instrument-specific calibration standards',
          'Quality control sample results'
        ],
        automation: 'Monthly spectral library updates'
      }
    ],
    successCriteria: [
      'Complete analytical methods database',
      'Spectral interpretation accuracy',
      '95%+ COA analysis accuracy',
      'Automated QC monitoring'
    ]
  },

  'customer-success-agent': {
    title: '🤝 Customer Success Agent Training Data Acquisition',
    priority: 'MEDIUM',
    estimatedEffort: '2-3 weeks',
    description: 'Collect customer success and support training data',
    dataSources: [
      {
        category: 'Customer Success Frameworks',
        priority: 'CRITICAL',
        sources: [
          'Customer journey mapping templates',
          'Success metrics and KPI systems',
          'Customer health scoring methodologies',
          'Retention and churn analysis'
        ],
        automation: 'Monthly customer success best practices updates'
      },
      {
        category: 'Cannabis Customer Behavior',
        priority: 'HIGH',
        sources: [
          'Cannabis customer behavior studies',
          'Product education materials',
          'Customer feedback templates',
          'Compliance considerations for interactions'
        ],
        automation: 'Quarterly cannabis customer research updates'
      }
    ],
    successCriteria: [
      'Comprehensive customer success framework',
      'Cannabis-specific customer insights',
      '90%+ customer satisfaction improvements',
      'Automated customer health monitoring'
    ]
  }
};

function generateIssueContent(agentId, config) {
  return `# ${config.title}

## 🎯 Objective
${config.description} to enable high-quality training question generation and improved agent performance.

## 📊 Priority: ${config.priority}
**Estimated Effort:** ${config.estimatedEffort}

## 📋 Data Sources Required

${config.dataSources.map((source, index) => `
### ${index + 1}. ${source.category} (${source.priority})

**Data Sources:**
${source.sources.map(s => `- ${s}`).join('\n')}

**Automation Plan:** ${source.automation}
`).join('\n')}

## ✅ Success Criteria

${config.successCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}

## 🔄 Implementation Plan

### Phase 1: Data Collection Setup (Week 1)
- [ ] Identify and catalog all data sources
- [ ] Set up automated data collection pipelines
- [ ] Establish data quality validation procedures
- [ ] Create initial corpus structure

### Phase 2: Core Data Acquisition (Week 2-3)
- [ ] Collect critical priority data sources
- [ ] Implement automated monitoring systems
- [ ] Validate data quality and completeness
- [ ] Begin initial Q&A generation testing

### Phase 3: Enhancement & Optimization (Week 4+)
- [ ] Add high and medium priority sources
- [ ] Optimize corpus for training effectiveness
- [ ] Implement real-time update systems
- [ ] Performance testing and validation

## 📈 Quality Metrics

### Data Quality Indicators:
- **Coverage:** % of domain knowledge areas covered
- **Freshness:** Average age of data sources
- **Accuracy:** Validation against ground truth
- **Completeness:** Missing information identification

### Training Performance:
- **Baseline Improvement:** Target 15-25% score increase
- **Response Confidence:** Target 85%+ confidence levels
- **User Satisfaction:** Target 90%+ satisfaction ratings
- **Expert Validation:** Target 95%+ accuracy from domain experts

## 🛠️ Technical Requirements

### Data Processing Infrastructure:
- [ ] Automated web scraping capabilities
- [ ] Database storage and indexing systems
- [ ] API integrations for real-time updates
- [ ] Quality control and validation pipelines

### Corpus Management:
- [ ] JSONL corpus file generation
- [ ] Vectorstore optimization for RAG
- [ ] Question generation templates
- [ ] Performance monitoring and analytics

## 💰 Budget Considerations

### Data Access Costs:
- Research database subscriptions: $1,000-3,000/year
- Legal/regulatory database access: $500-1,500/year
- Market research reports: $500-1,000/year
- Technical standards access: $200-500/year

### Resource Requirements:
- Data collection specialist: 0.5-1 FTE
- Domain expert validation: 0.25 FTE
- Technical implementation: 0.5 FTE

**Total Estimated Budget:** $5,000-15,000 initial + $2,000-5,000/year maintenance

## 🔗 Dependencies

### Internal Dependencies:
- [ ] Corpus Q&A generation system (shared/corpus-qa-generator.ts)
- [ ] Agent baseline testing framework
- [ ] RAG retrieval infrastructure
- [ ] Performance monitoring dashboard

### External Dependencies:
- [ ] Database access permissions
- [ ] API keys for data sources
- [ ] Legal clearance for data usage
- [ ] Domain expert availability

## 📝 Acceptance Criteria

### Minimum Viable Dataset:
- [ ] 1,000+ high-quality training questions
- [ ] 100+ unique data sources
- [ ] 90%+ domain coverage
- [ ] Automated update system operational

### Production Ready:
- [ ] 5,000+ training questions
- [ ] 500+ data sources
- [ ] 95%+ domain coverage
- [ ] Real-time monitoring and alerts
- [ ] Expert validation completed

## 🏷️ Labels
\`training-data\` \`${agentId}\` \`${config.priority.toLowerCase()}\` \`corpus-generation\` \`automation\`

## 🔄 Related Issues
- [ ] Link to baseline testing improvements
- [ ] Link to corpus Q&A system enhancements
- [ ] Link to agent performance optimization
- [ ] Link to domain expert validation

---

**Created by:** Formul8 Development Team  
**Due Date:** ${new Date(Date.now() + (parseInt(config.estimatedEffort.split('-')[1]) * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}  
**Assignee:** Data Acquisition Team
`;
}

function generateAllIssues() {
  const issuesDir = path.join(__dirname, '..', 'data', 'github-issues');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(issuesDir)) {
    fs.mkdirSync(issuesDir, { recursive: true });
  }

  // Generate individual issue files
  Object.entries(agentTrainingConfigs).forEach(([agentId, config]) => {
    const issueContent = generateIssueContent(agentId, config);
    const filename = `${agentId}-training-data-acquisition.md`;
    const filepath = path.join(issuesDir, filename);
    
    fs.writeFileSync(filepath, issueContent);
    console.log(`✅ Generated issue for ${agentId}: ${filename}`);
  });

  // Generate summary file
  const summaryContent = `# Training Data Acquisition Issues Summary

## Overview
This directory contains GitHub issue templates for training data acquisition across all 9 Formul8 AI agents.

## Generated Issues

${Object.entries(agentTrainingConfigs).map(([agentId, config]) => `
### ${config.title}
- **File:** ${agentId}-training-data-acquisition.md
- **Priority:** ${config.priority}
- **Effort:** ${config.estimatedEffort}
- **Data Sources:** ${config.dataSources.length} categories
`).join('\n')}

## Implementation Timeline

### Phase 1 (Week 1-2): Critical Agents
- Compliance Agent (regulatory data)
- Formulation Agent (chemical data)
- Science Agent (research literature)

### Phase 2 (Week 3-4): High Priority Agents
- Marketing Agent (platform policies)
- Operations Agent (facility standards)

### Phase 3 (Week 5-6): Remaining Agents
- Patent Agent (IP databases)
- Sourcing Agent (vendor data)
- Spectra Agent (analytical methods)
- Customer Success Agent (support frameworks)

## Total Budget Estimate
- **Initial Setup:** $40,000-75,000
- **Annual Maintenance:** $15,000-30,000
- **Personnel:** 3-5 FTE for 6 months

## Success Metrics
- 30,000+ total training questions generated
- 95%+ domain coverage across all agents
- 20%+ baseline performance improvement
- Automated monitoring for all data sources

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(issuesDir, 'README.md'), summaryContent);
  console.log(`✅ Generated summary: README.md`);
  console.log(`\n🎉 All training data acquisition issues generated successfully!`);
  console.log(`📁 Location: ${issuesDir}`);
}

// Run the script
generateAllIssues();

export { agentTrainingConfigs, generateIssueContent, generateAllIssues };