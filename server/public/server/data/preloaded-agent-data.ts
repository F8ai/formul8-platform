/**
 * Preloaded Agent Data - Comprehensive questions and features for all agents
 * This ensures all agents have meaningful content regardless of GitHub repository status
 */

export const preloadedAgentData = {
  'customer-success-agent': {
    baselineQuestions: [
      {
        id: "cs_001",
        question: "How do you measure customer satisfaction for a cannabis dispensary?",
        expected_answer: "Use Net Promoter Score (NPS), Customer Satisfaction Score (CSAT), customer retention rate, repeat purchase frequency, average order value growth, and qualitative feedback on product quality, staff knowledge, and overall experience.",
        keywords: ["NPS", "CSAT", "retention rate", "repeat purchase", "average order value", "customer feedback"],
        category: "metrics",
        difficulty: "intermediate"
      },
      {
        id: "cs_002", 
        question: "What are the key onboarding steps for new cannabis customers?",
        expected_answer: "Compliance verification, medical card validation, product education, dosage guidance, consumption method explanation, safety protocols, legal requirements, and establishing purchase preferences and medical needs.",
        keywords: ["compliance verification", "medical card", "product education", "dosage guidance", "safety protocols"],
        category: "onboarding",
        difficulty: "basic"
      },
      {
        id: "cs_003",
        question: "How do you handle customer complaints about cannabis product quality?",
        expected_answer: "Document the issue with photos, test results review, batch tracking, immediate replacement or refund, investigate with cultivator/manufacturer, implement quality control improvements, and follow up with customer satisfaction.",
        keywords: ["documentation", "batch tracking", "replacement", "refund", "quality control", "follow up"],
        category: "complaint_resolution",
        difficulty: "intermediate"
      },
      {
        id: "cs_004",
        question: "What retention strategies work best for cannabis customers?",
        expected_answer: "Loyalty rewards programs, personalized product recommendations, educational content, exclusive member events, early access to new products, referral incentives, and consistent quality assurance.",
        keywords: ["loyalty programs", "personalized recommendations", "educational content", "member events", "referral incentives"],
        category: "retention",
        difficulty: "advanced"
      },
      {
        id: "cs_005",
        question: "How do you identify at-risk customers before they churn?",
        expected_answer: "Monitor decreased purchase frequency, reduced order values, negative feedback scores, reduced engagement with communications, complaints not resolved satisfactorily, and longer gaps between visits.",
        keywords: ["purchase frequency", "order values", "negative feedback", "reduced engagement", "complaint patterns"],
        category: "churn_prevention",
        difficulty: "advanced"
      },
      {
        id: "cs_006",
        question: "What customer education topics are most important for cannabis users?",
        expected_answer: "Dosage guidelines, consumption methods, strain effects, terpene profiles, drug interactions, legal compliance, storage best practices, tolerance management, and responsible use protocols.",
        keywords: ["dosage guidelines", "consumption methods", "strain effects", "terpenes", "drug interactions", "legal compliance"],
        category: "education",
        difficulty: "intermediate"
      },
      {
        id: "cs_007",
        question: "How do you segment cannabis customers for personalized service?",
        expected_answer: "By medical vs recreational use, consumption preferences, potency tolerance, purchase frequency, price sensitivity, product categories, experience level, and specific medical conditions or wellness goals.",
        keywords: ["medical vs recreational", "consumption preferences", "potency tolerance", "purchase frequency", "experience level"],
        category: "segmentation",
        difficulty: "advanced"
      },
      {
        id: "cs_008",
        question: "What escalation procedures should cannabis businesses have?",
        expected_answer: "Clear escalation hierarchy from budtender to manager to owner, documented complaint tracking, regulatory compliance officer involvement, legal counsel consultation for serious issues, and customer advocacy protocols.",
        keywords: ["escalation hierarchy", "complaint tracking", "compliance officer", "legal counsel", "customer advocacy"],
        category: "escalation",
        difficulty: "intermediate"
      },
      {
        id: "cs_009",
        question: "How do you track customer lifetime value in cannabis retail?",
        expected_answer: "Calculate total revenue per customer over relationship duration, factor in acquisition costs, retention rates, referral value, average order frequency, seasonal patterns, and product category preferences.",
        keywords: ["lifetime value", "acquisition costs", "retention rates", "referral value", "order frequency", "seasonal patterns"],
        category: "analytics",
        difficulty: "advanced"
      },
      {
        id: "cs_010",
        question: "What customer success metrics matter most for cannabis subscription services?",
        expected_answer: "Monthly recurring revenue (MRR), churn rate, customer acquisition cost (CAC), average revenue per user (ARPU), product satisfaction scores, delivery success rate, and subscription renewal rates.",
        keywords: ["MRR", "churn rate", "CAC", "ARPU", "satisfaction scores", "delivery success", "renewal rates"],
        category: "subscription_metrics",
        difficulty: "advanced"
      }
    ],
    features: [
      {
        title: "📊 Customer Satisfaction Analytics Dashboard",
        description: "Build comprehensive customer satisfaction analytics with NPS tracking, CSAT scores, retention analysis, and customer health scoring for cannabis businesses.",
        labels: ["enhancement", "priority-high", "analytics", "customer-success"]
      },
      {
        title: "🎯 Personalized Customer Onboarding Engine",
        description: "Create intelligent onboarding system that personalizes the customer experience based on cannabis use goals, experience level, and medical needs.",
        labels: ["enhancement", "priority-high", "onboarding", "personalization"]
      },
      {
        title: "🔄 Automated Customer Retention Workflows",
        description: "Develop automated retention workflows that identify at-risk customers and execute targeted retention strategies.",
        labels: ["enhancement", "priority-critical", "automation", "retention"]
      }
    ]
  },

  'patent-agent': {
    baselineQuestions: [
      {
        id: "pat_001",
        question: "What types of cannabis-related intellectual property can be protected?",
        expected_answer: "Plant patents for new cannabis cultivars, utility patents for extraction methods and devices, trademarks for brand names and logos, trade secrets for proprietary formulations, and copyrights for marketing materials and software.",
        keywords: ["plant patents", "utility patents", "trademarks", "trade secrets", "copyrights", "cultivars", "extraction methods"],
        category: "ip_types",
        difficulty: "basic"
      },
      {
        id: "pat_002",
        question: "How do you conduct a patent search for cannabis extraction methods?",
        expected_answer: "Search USPTO, international patent databases, use keywords like 'cannabis extraction', 'cannabinoid isolation', 'CO2 extraction', 'hydrocarbon extraction', check classification codes, review prior art, and analyze competitor patents.",
        keywords: ["USPTO", "patent databases", "cannabis extraction", "cannabinoid isolation", "prior art", "classification codes"],
        category: "patent_search",
        difficulty: "intermediate"
      },
      {
        id: "pat_003",
        question: "What are the patentability requirements for cannabis innovations?",
        expected_answer: "Novelty (new and not disclosed), non-obviousness (inventive step beyond prior art), utility (useful purpose), enabling disclosure (sufficient detail for reproduction), and compliance with federal patent law despite state legality issues.",
        keywords: ["novelty", "non-obviousness", "utility", "enabling disclosure", "federal patent law", "prior art"],
        category: "patentability",
        difficulty: "advanced"
      },
      {
        id: "pat_004",
        question: "How do you trademark a cannabis brand name?",
        expected_answer: "Ensure federal legality compliance, conduct trademark search, file application with USPTO, specify goods/services classes, demonstrate use in commerce, respond to office actions, and maintain registration with periodic renewals.",
        keywords: ["federal legality", "trademark search", "USPTO", "goods classes", "use in commerce", "office actions"],
        category: "trademarks",
        difficulty: "intermediate"
      },
      {
        id: "pat_005",
        question: "What are common patent infringement issues in the cannabis industry?",
        expected_answer: "Extraction method patents, vaporizer design patents, cultivation technique patents, product formulation patents, packaging innovations, and genetic marker patents for plant breeding programs.",
        keywords: ["extraction patents", "vaporizer patents", "cultivation patents", "formulation patents", "packaging patents", "genetic markers"],
        category: "infringement",
        difficulty: "advanced"
      },
      {
        id: "pat_006",
        question: "How do you protect proprietary cannabis genetics and breeding?",
        expected_answer: "Plant patents for new cultivars, trade secret protection for breeding methods, genetic fingerprinting documentation, controlled access to parent plants, licensing agreements, and non-disclosure agreements with growers.",
        keywords: ["plant patents", "trade secrets", "genetic fingerprinting", "parent plants", "licensing agreements", "NDAs"],
        category: "genetics_protection",
        difficulty: "advanced"
      },
      {
        id: "pat_007",
        question: "What international IP considerations exist for cannabis companies?",
        expected_answer: "Varying legality across jurisdictions, Patent Cooperation Treaty (PCT) applications, Madrid Protocol for trademarks, country-specific filing strategies, and enforcement challenges in prohibited territories.",
        keywords: ["international legality", "PCT applications", "Madrid Protocol", "country-specific filing", "enforcement challenges"],
        category: "international_ip",
        difficulty: "advanced"
      },
      {
        id: "pat_008",
        question: "How do you value cannabis intellectual property for licensing?",
        expected_answer: "Market size assessment, competitive landscape analysis, technical superiority evaluation, manufacturing cost savings, royalty rate benchmarking, risk assessment, and future revenue projections.",
        keywords: ["market size", "competitive landscape", "technical superiority", "cost savings", "royalty rates", "revenue projections"],
        category: "ip_valuation",
        difficulty: "advanced"
      },
      {
        id: "pat_009",
        question: "What are the key elements of a cannabis IP strategy?",
        expected_answer: "Patent portfolio development, trademark protection plan, trade secret protocols, freedom to operate analysis, competitive intelligence, licensing strategy, and enforcement procedures.",
        keywords: ["patent portfolio", "trademark protection", "trade secrets", "freedom to operate", "competitive intelligence", "licensing strategy"],
        category: "ip_strategy",
        difficulty: "intermediate"
      },
      {
        id: "pat_010",
        question: "How do you handle IP disputes in the cannabis industry?",
        expected_answer: "Pre-litigation negotiations, patent invalidity challenges, prior art searches, alternative dispute resolution, licensing negotiations, design-around strategies, and federal court litigation considerations.",
        keywords: ["pre-litigation", "invalidity challenges", "prior art", "alternative dispute resolution", "licensing negotiations", "design-around"],
        category: "ip_disputes",
        difficulty: "advanced"
      }
    ],
    features: [
      {
        title: "🔍 Cannabis IP Prior Art Search Engine",
        description: "Build comprehensive prior art search engine specifically designed for cannabis intellectual property research.",
        labels: ["enhancement", "priority-critical", "patent-search", "automation"]
      },
      {
        title: "📋 Cannabis Brand Trademark Portfolio Manager",
        description: "Create intelligent trademark portfolio management system for cannabis brands navigating complex legal landscapes.",
        labels: ["enhancement", "priority-high", "trademark", "brand-protection"]
      },
      {
        title: "⚖️ Cannabis IP Valuation and Licensing Platform",
        description: "Develop platform for valuing cannabis intellectual property and managing licensing agreements.",
        labels: ["enhancement", "priority-medium", "valuation", "licensing"]
      }
    ]
  },

  'spectra-agent': {
    baselineQuestions: [
      {
        id: "spec_001",
        question: "What analytical methods are used for cannabis potency testing?",
        expected_answer: "High-Performance Liquid Chromatography (HPLC) for cannabinoids, Gas Chromatography-Mass Spectrometry (GC-MS) for terpenes, Ultra-Performance Liquid Chromatography (UPLC) for rapid analysis, and Near-Infrared Spectroscopy (NIR) for screening.",
        keywords: ["HPLC", "GC-MS", "UPLC", "NIR", "cannabinoids", "terpenes", "potency testing"],
        category: "analytical_methods",
        difficulty: "intermediate"
      },
      {
        id: "spec_002",
        question: "How do you interpret a Certificate of Analysis (COA) for cannabis products?",
        expected_answer: "Review cannabinoid profiles (THC, CBD, CBG, etc.), terpene concentrations, contaminant results (pesticides, heavy metals, microbials), moisture content, and ensure all values meet regulatory limits and label claims.",
        keywords: ["COA", "cannabinoid profiles", "terpene concentrations", "contaminants", "pesticides", "heavy metals", "regulatory limits"],
        category: "coa_interpretation",
        difficulty: "basic"
      },
      {
        id: "spec_003",
        question: "What are the key parameters in HPLC analysis of cannabinoids?",
        expected_answer: "Mobile phase composition (typically acetonitrile/water with modifiers), column selection (C18 reversed-phase), detection wavelength (220-280nm), injection volume, flow rate, temperature control, and gradient elution program.",
        keywords: ["mobile phase", "acetonitrile", "C18 column", "detection wavelength", "gradient elution", "temperature control"],
        category: "hplc_parameters",
        difficulty: "advanced"
      },
      {
        id: "spec_004",
        question: "How do you validate analytical methods for cannabis testing?",
        expected_answer: "Establish linearity, accuracy, precision, specificity, detection/quantification limits, robustness, range, and system suitability according to ICH guidelines and regulatory requirements.",
        keywords: ["linearity", "accuracy", "precision", "specificity", "detection limits", "ICH guidelines", "system suitability"],
        category: "method_validation",
        difficulty: "advanced"
      },
      {
        id: "spec_005",
        question: "What spectroscopic techniques identify cannabis terpene profiles?",
        expected_answer: "Gas Chromatography-Mass Spectrometry (GC-MS) for identification and quantification, Fourier Transform Infrared (FTIR) for functional group analysis, and Nuclear Magnetic Resonance (NMR) for structural confirmation.",
        keywords: ["GC-MS", "FTIR", "NMR", "terpene profiles", "identification", "quantification", "structural confirmation"],
        category: "terpene_analysis",
        difficulty: "intermediate"
      },
      {
        id: "spec_006",
        question: "How do you detect pesticide residues in cannabis using LC-MS/MS?",
        expected_answer: "Sample extraction with QuEChERS method, chromatographic separation, multiple reaction monitoring (MRM), matrix-matched calibration, internal standards, and quantification against regulatory action levels.",
        keywords: ["QuEChERS", "LC-MS/MS", "MRM", "matrix-matched calibration", "internal standards", "action levels"],
        category: "pesticide_analysis",
        difficulty: "advanced"
      },
      {
        id: "spec_007",
        question: "What are the challenges in cannabis sample preparation for spectral analysis?",
        expected_answer: "Matrix complexity, cannabinoid degradation prevention, homogenization of heterogeneous samples, extraction efficiency optimization, interference removal, and maintaining chain of custody.",
        keywords: ["matrix complexity", "cannabinoid degradation", "homogenization", "extraction efficiency", "interference removal", "chain of custody"],
        category: "sample_preparation",
        difficulty: "intermediate"
      },
      {
        id: "spec_008",
        question: "How do you perform quantitative analysis of cannabis concentrates?",
        expected_answer: "Accurate weighing of small samples, appropriate dilution factors, solvent selection for complete dissolution, standard addition method for matrix effects, and correction for moisture content.",
        keywords: ["accurate weighing", "dilution factors", "solvent selection", "standard addition", "matrix effects", "moisture correction"],
        category: "concentrate_analysis",
        difficulty: "advanced"
      },
      {
        id: "spec_009",
        question: "What quality control measures ensure reliable cannabis spectral data?",
        expected_answer: "Reference standards, control samples, blank analysis, duplicate measurements, instrument calibration verification, proficiency testing participation, and statistical process control.",
        keywords: ["reference standards", "control samples", "blank analysis", "duplicate measurements", "calibration verification", "proficiency testing"],
        category: "quality_control",
        difficulty: "intermediate"
      },
      {
        id: "spec_010",
        question: "How do you use spectral data for cannabis strain identification?",
        expected_answer: "Chemometric analysis of cannabinoid and terpene profiles, principal component analysis (PCA), discriminant analysis, spectral fingerprinting, database comparison, and multivariate pattern recognition.",
        keywords: ["chemometric analysis", "PCA", "discriminant analysis", "spectral fingerprinting", "database comparison", "pattern recognition"],
        category: "strain_identification",
        difficulty: "advanced"
      }
    ],
    features: [
      {
        title: "🧪 Cannabis Spectral Analysis Automation Platform",
        description: "Build comprehensive automation platform for cannabis spectral analysis including HPLC, GC-MS, and COA interpretation.",
        labels: ["enhancement", "priority-critical", "automation", "analytics"]
      },
      {
        title: "📊 Cannabis Strain Fingerprinting and Authentication",
        description: "Develop advanced strain fingerprinting system using chemometric analysis of cannabinoid and terpene profiles.",
        labels: ["enhancement", "priority-high", "fingerprinting", "authentication"]
      },
      {
        title: "⚡ Real-time Cannabis Quality Control Monitoring",
        description: "Create real-time quality control monitoring system for cannabis testing laboratories.",
        labels: ["enhancement", "priority-high", "quality-control", "monitoring"]
      }
    ]
  },

  'sourcing-agent': {
    baselineQuestions: [
      {
        id: "src_001",
        question: "What are the key criteria for selecting cannabis cultivators as suppliers?",
        expected_answer: "Licensing compliance, cultivation track record, quality consistency, testing results, production capacity, pricing competitiveness, delivery reliability, pest management practices, and sustainable growing methods.",
        keywords: ["licensing compliance", "cultivation track record", "quality consistency", "production capacity", "delivery reliability", "sustainable growing"],
        category: "supplier_selection",
        difficulty: "basic"
      },
      {
        id: "src_002",
        question: "How do you evaluate cannabis product quality before purchasing?",
        expected_answer: "Review Certificate of Analysis (COA), visual inspection for mold/pests, trichome density assessment, aroma evaluation, cannabinoid and terpene profiles, moisture content, and batch consistency records.",
        keywords: ["COA", "visual inspection", "trichome density", "aroma evaluation", "cannabinoid profiles", "moisture content"],
        category: "quality_evaluation",
        difficulty: "intermediate"
      },
      {
        id: "src_003",
        question: "What supply chain risks should cannabis retailers consider?",
        expected_answer: "Regulatory changes, crop failures, contamination issues, transportation delays, price volatility, supplier bankruptcy, compliance violations, and seasonal availability fluctuations.",
        keywords: ["regulatory changes", "crop failures", "contamination", "transportation delays", "price volatility", "compliance violations"],
        category: "supply_chain_risks",
        difficulty: "intermediate"
      },
      {
        id: "src_004",
        question: "How do you negotiate pricing contracts with cannabis suppliers?",
        expected_answer: "Market price analysis, volume-based discounts, quality incentives, payment terms negotiation, exclusive product arrangements, price protection clauses, and seasonal adjustment mechanisms.",
        keywords: ["market price analysis", "volume discounts", "quality incentives", "payment terms", "exclusive products", "price protection"],
        category: "pricing_negotiation",
        difficulty: "advanced"
      },
      {
        id: "src_005",
        question: "What inventory management strategies work best for cannabis procurement?",
        expected_answer: "Just-in-time delivery for flower, safety stock for fast-moving products, ABC analysis for category prioritization, seasonal demand forecasting, and expiration date tracking with FIFO rotation.",
        keywords: ["just-in-time", "safety stock", "ABC analysis", "demand forecasting", "expiration tracking", "FIFO rotation"],
        category: "inventory_management",
        difficulty: "advanced"
      },
      {
        id: "src_006",
        question: "How do you source rare or specialty cannabis genetics?",
        expected_answer: "Breeding program partnerships, exclusive licensing agreements, genetic preservation initiatives, seed bank relationships, clone trading networks, and international legal acquisition channels.",
        keywords: ["breeding partnerships", "licensing agreements", "genetic preservation", "seed banks", "clone trading", "international acquisition"],
        category: "specialty_sourcing",
        difficulty: "advanced"
      },
      {
        id: "src_007",
        question: "What due diligence is required for new cannabis suppliers?",
        expected_answer: "License verification, financial stability assessment, facility inspection, reference checks, insurance coverage review, compliance history evaluation, and quality system audit.",
        keywords: ["license verification", "financial stability", "facility inspection", "reference checks", "insurance coverage", "compliance history"],
        category: "supplier_due_diligence",
        difficulty: "intermediate"
      },
      {
        id: "src_008",
        question: "How do you optimize cannabis procurement costs while maintaining quality?",
        expected_answer: "Supplier diversification, bulk purchasing agreements, direct producer relationships, vertical integration opportunities, group purchasing cooperatives, and automated procurement systems.",
        keywords: ["supplier diversification", "bulk purchasing", "direct relationships", "vertical integration", "group purchasing", "automated systems"],
        category: "cost_optimization",
        difficulty: "advanced"
      },
      {
        id: "src_009",
        question: "What tracking systems are essential for cannabis supply chain management?",
        expected_answer: "Seed-to-sale tracking integration, batch tracking systems, temperature monitoring for transport, chain of custody documentation, inventory management software, and compliance reporting tools.",
        keywords: ["seed-to-sale tracking", "batch tracking", "temperature monitoring", "chain of custody", "inventory software", "compliance reporting"],
        category: "tracking_systems",
        difficulty: "intermediate"
      },
      {
        id: "src_010",
        question: "How do you manage seasonal sourcing challenges in cannabis procurement?",
        expected_answer: "Harvest cycle planning, greenhouse vs outdoor sourcing strategies, storage capacity optimization, preservation techniques for flower, alternative product sourcing, and price hedging mechanisms.",
        keywords: ["harvest cycle", "greenhouse sourcing", "storage optimization", "preservation techniques", "alternative sourcing", "price hedging"],
        category: "seasonal_management",
        difficulty: "advanced"
      }
    ],
    features: [
      {
        title: "🌱 Cannabis Supplier Discovery and Evaluation Engine",
        description: "Build intelligent supplier discovery platform that identifies, evaluates, and ranks cannabis suppliers based on comprehensive criteria.",
        labels: ["enhancement", "priority-critical", "supplier-discovery", "evaluation"]
      },
      {
        title: "📦 Cannabis Inventory Optimization and Demand Forecasting",
        description: "Develop advanced inventory optimization system with predictive demand forecasting for cannabis products.",
        labels: ["enhancement", "priority-high", "inventory", "forecasting"]
      },
      {
        title: "🔗 Cannabis Supply Chain Risk Management Platform",
        description: "Create comprehensive risk management platform for cannabis supply chain operations.",
        labels: ["enhancement", "priority-medium", "risk-management", "supply-chain"]
      }
    ]
  }
};

export default preloadedAgentData;