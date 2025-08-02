#!/usr/bin/env python3
"""
Formul8 Demo Document Generator
Creates beautiful demo documents to showcase Google Drive integration capabilities
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import random

# Sample data for demo documents
DEMO_USER = {
    "id": "demo_user_001",
    "name": "Dr. Sarah Chen",
    "email": "sarah.chen@greenleaf.com", 
    "company": "GreenLeaf Cannabis Co.",
    "role": "Chief Science Officer",
    "location": "Denver, Colorado"
}

# Patent search demo data
PATENT_SEARCH_DATA = {
    "search_query": "cannabis extraction CO2 supercritical methods",
    "search_date": datetime.now().strftime("%Y-%m-%d"),
    "total_patents": 247,
    "relevant_patents": 34,
    "patents": [
        {
            "patent_number": "US10,123,456",
            "title": "Supercritical CO2 Cannabis Extraction System with Temperature Control",
            "inventors": ["Johnson, M.", "Smith, R.", "Davis, L."],
            "assignee": "ExtractTech Solutions LLC",
            "filing_date": "2021-03-15",
            "publication_date": "2022-09-20",
            "relevance_score": 0.94,
            "abstract": "A novel supercritical CO2 extraction system for cannabis that maintains precise temperature control throughout the extraction process, resulting in higher cannabinoid preservation and improved terpene retention.",
            "claims": 18,
            "forward_citations": 12,
            "backward_citations": 23
        },
        {
            "patent_number": "US10,234,567", 
            "title": "Multi-Stage Cannabis Extraction Process Using Variable Pressure",
            "inventors": ["Brown, K.", "Wilson, T."],
            "assignee": "Cannabis Innovation Corp",
            "filing_date": "2020-11-08",
            "publication_date": "2022-05-12",
            "relevance_score": 0.89,
            "abstract": "A multi-stage extraction process that varies pressure levels to selectively extract different cannabinoid and terpene compounds from cannabis plant material.",
            "claims": 15,
            "forward_citations": 8,
            "backward_citations": 19
        },
        {
            "patent_number": "US10,345,678",
            "title": "Automated Cannabis Processing System with Real-Time Quality Control",
            "inventors": ["Garcia, A.", "Martinez, C.", "Lopez, J."],
            "assignee": "AutoCanna Technologies",
            "filing_date": "2021-07-22",
            "publication_date": "2023-01-10",
            "relevance_score": 0.87,
            "abstract": "An automated system for processing cannabis that includes real-time quality control sensors and AI-driven optimization algorithms.",
            "claims": 22,
            "forward_citations": 5,
            "backward_citations": 31
        }
    ],
    "freedom_to_operate": {
        "risk_level": "Medium",
        "blocking_patents": 3,
        "expiring_patents": 7,
        "recommendations": [
            "Consider design-around strategies for US10,123,456",
            "Monitor expiration of US9,876,543 in 2025",
            "File continuation application for improved temperature control method"
        ]
    }
}

# SOP (Standard Operating Procedure) demo data
SOP_DATA = {
    "title": "Cannabis Extraction Quality Control Standard Operating Procedure",
    "document_id": "SOP-EXT-001",
    "version": "2.1",
    "effective_date": "2024-01-15",
    "review_date": "2024-07-15",
    "author": "Dr. Sarah Chen",
    "approver": "Michael Rodriguez, VP Operations",
    "scope": "This SOP covers quality control procedures for all cannabis extraction operations including CO2, ethanol, and hydrocarbon methods.",
    "procedures": [
        {
            "step": 1,
            "title": "Pre-Extraction Material Testing",
            "description": "Test incoming cannabis material for potency, moisture content, and contaminants",
            "duration": "30 minutes",
            "equipment": ["HPLC analyzer", "Moisture meter", "Scale"],
            "requirements": [
                "Cannabis material must be <12% moisture",
                "Minimum 15% total cannabinoids",
                "Pass pesticide and heavy metal screening"
            ]
        },
        {
            "step": 2,
            "title": "Equipment Calibration and Setup",
            "description": "Calibrate extraction equipment and verify operating parameters",
            "duration": "45 minutes",
            "equipment": ["CO2 extraction system", "Pressure gauges", "Temperature sensors"],
            "requirements": [
                "Pressure accuracy ±2 psi",
                "Temperature accuracy ±1°C",
                "All safety systems functional"
            ]
        },
        {
            "step": 3,
            "title": "Extraction Process Monitoring",
            "description": "Monitor extraction parameters and collect samples for testing",
            "duration": "2-4 hours",
            "equipment": ["Data logger", "Sample containers", "pH meter"],
            "requirements": [
                "Log parameters every 15 minutes",
                "Collect samples at 30%, 60%, and 90% completion",
                "Maintain extraction pressure within ±5% of target"
            ]
        },
        {
            "step": 4,
            "title": "Post-Extraction Quality Analysis",
            "description": "Analyze final extract for cannabinoid profile and contaminants",
            "duration": "60 minutes",
            "equipment": ["HPLC", "GC-MS", "Rotary evaporator"],
            "requirements": [
                "Cannabinoid recovery >85%",
                "Residual solvent <500 ppm",
                "Microbial limits within state requirements"
            ]
        }
    ],
    "quality_metrics": {
        "target_yield": "12-18%",
        "cannabinoid_recovery": ">85%",
        "terpene_retention": ">70%",
        "processing_time": "<4 hours"
    }
}

# Formulation sheet demo data
FORMULATION_DATA = {
    "product_name": "GreenLeaf Premium CBD Tincture",
    "batch_number": "GL-TIN-240115-001",
    "formulation_date": "2024-01-15",
    "formulator": "Dr. Sarah Chen",
    "target_specifications": {
        "cbd_concentration": "1000 mg/30ml",
        "thc_content": "<0.3%",
        "carrier_oil": "MCT Oil",
        "flavor": "Natural Hemp",
        "shelf_life": "24 months"
    },
    "ingredients": [
        {
            "ingredient": "CBD Isolate",
            "supplier": "Colorado Cannabinoid Co.",
            "lot_number": "CCC-CBD-231205",
            "purity": "99.8%",
            "quantity_mg": 1000,
            "percentage": "3.33%",
            "cost_per_gram": "$15.50"
        },
        {
            "ingredient": "MCT Oil (C8/C10)",
            "supplier": "Healthy Fats Inc.",
            "lot_number": "HFI-MCT-240110",
            "purity": "99.9%",
            "quantity_ml": 28.5,
            "percentage": "95.0%",
            "cost_per_liter": "$12.00"
        },
        {
            "ingredient": "Natural Hemp Terpenes",
            "supplier": "Terpene Solutions LLC",
            "lot_number": "TSL-HMP-240108",
            "purity": "100%",
            "quantity_ml": 0.5,
            "percentage": "1.67%",
            "cost_per_ml": "$3.25"
        }
    ],
    "manufacturing_process": [
        "Heat MCT oil to 60°C while stirring",
        "Slowly add CBD isolate until fully dissolved",
        "Add terpenes and mix for 10 minutes",
        "Cool to room temperature",
        "Filter through 0.2μm filter",
        "Fill into 30ml amber bottles",
        "Cap and label according to regulations"
    ],
    "testing_requirements": {
        "potency": "HPLC analysis for cannabinoid profile",
        "residual_solvents": "GC-MS analysis",
        "microbials": "Total yeast, mold, E.coli, Salmonella",
        "heavy_metals": "ICP-MS for Pb, Cd, Hg, As",
        "pesticides": "LC-MS/MS multi-residue screen"
    },
    "cost_analysis": {
        "material_cost": "$18.67",
        "labor_cost": "$5.25",
        "packaging_cost": "$3.50",
        "testing_cost": "$12.00",
        "total_cogs": "$39.42",
        "target_retail": "$89.99",
        "gross_margin": "56.2%"
    }
}

# Marketing expense data for 12 months
MARKETING_DATA = {
    "company": "GreenLeaf Cannabis Co.",
    "fiscal_year": "2024",
    "monthly_data": []
}

# Generate 12 months of marketing data
base_marketing_spend = 25000
base_sales = 150000
for month in range(1, 13):
    # Seasonal variations - higher in summer and around holidays
    seasonal_multiplier = 1.0
    if month in [6, 7, 8]:  # Summer peak
        seasonal_multiplier = 1.3
    elif month in [11, 12]:  # Holiday season
        seasonal_multiplier = 1.4
    elif month in [1, 2]:  # Post-holiday dip
        seasonal_multiplier = 0.8
    
    marketing_spend = base_marketing_spend * seasonal_multiplier * (1 + random.uniform(-0.2, 0.2))
    sales = base_sales * seasonal_multiplier * (1 + random.uniform(-0.15, 0.25))
    
    # Calculate channel breakdown
    digital_ads = marketing_spend * 0.45
    social_media = marketing_spend * 0.25
    events_trade = marketing_spend * 0.15
    content_creation = marketing_spend * 0.10
    traditional_ads = marketing_spend * 0.05
    
    month_data = {
        "month": month,
        "month_name": datetime(2024, month, 1).strftime("%B"),
        "total_marketing_spend": round(marketing_spend, 2),
        "channel_breakdown": {
            "digital_advertising": round(digital_ads, 2),
            "social_media": round(social_media, 2),
            "events_trade_shows": round(events_trade, 2),
            "content_creation": round(content_creation, 2),
            "traditional_advertising": round(traditional_ads, 2)
        },
        "sales_metrics": {
            "total_sales": round(sales, 2),
            "new_customers": round(sales / 45 * (1 + random.uniform(-0.3, 0.3))),
            "customer_acquisition_cost": round(marketing_spend / (sales / 45), 2),
            "return_on_ad_spend": round(sales / marketing_spend, 2)
        },
        "product_sales": {
            "flower": round(sales * 0.40, 2),
            "concentrates": round(sales * 0.25, 2),
            "edibles": round(sales * 0.20, 2),
            "topicals": round(sales * 0.10, 2),
            "accessories": round(sales * 0.05, 2)
        }
    }
    MARKETING_DATA["monthly_data"].append(month_data)

# Formul8 pitch presentation data
FORMUL8_PITCH_DATA = {
    "presentation_title": "Formul8: AI-Powered Cannabis Operations Platform",
    "presenter": "Formul8 Team",
    "audience": "Cannabis Industry Executives",
    "date": datetime.now().strftime("%B %d, %Y"),
    "slides": [
        {
            "slide_number": 1,
            "title": "The Cannabis Industry Challenge",
            "content": [
                "• $25B+ market with complex regulatory requirements",
                "• 80% of operators struggle with compliance documentation",
                "• Average 15 hours/week spent on manual research tasks",
                "• Limited access to specialized cannabis expertise",
                "• Fragmented information across multiple sources"
            ]
        },
        {
            "slide_number": 2,
            "title": "Introducing Formul8",
            "content": [
                "• AI-powered platform with 9 specialized agents",
                "• Compliance, Patent, Operations, Formulation expertise",
                "• Real-time regulatory updates and guidance", 
                "• Automated document generation and reporting",
                "• Integration with existing workflows"
            ]
        },
        {
            "slide_number": 3,
            "title": "Core AI Agents",
            "content": [
                "🛡️ Compliance Agent - Regulatory guidance and updates",
                "⚖️ Patent Agent - IP research and freedom-to-operate",
                "⚙️ Operations Agent - Process optimization",
                "🧪 Formulation Agent - Product development with RDKit",
                "🛒 Sourcing Agent - Supplier and vendor intelligence",
                "📢 Marketing Agent - Campaign optimization",
                "🔬 Science Agent - Research and literature analysis",
                "📊 Spectra Agent - Lab data analysis",
                "🤝 Customer Success Agent - Support optimization"
            ]
        },
        {
            "slide_number": 4,
            "title": "Proven Results",
            "content": [
                "• 75% reduction in compliance research time",
                "• 90% faster patent landscape analysis",
                "• $50K+ annual savings per facility",
                "• 95% accuracy in regulatory guidance",
                "• 24/7 expert-level assistance"
            ]
        },
        {
            "slide_number": 5,
            "title": "Customer Success: GreenLeaf Cannabis",
            "content": [
                "• Challenge: Multi-state compliance management",
                "• Solution: Deployed Formul8 across 5 facilities",
                "• Results:",
                "  - 60% faster new market entry",
                "  - Zero compliance violations in 12 months",
                "  - $125K cost savings in first year",
                "  - Streamlined SOPs across all locations"
            ]
        },
        {
            "slide_number": 6,
            "title": "Technology Platform",
            "content": [
                "• LangChain-powered multi-agent orchestration",
                "• Real-time RAG (Retrieval Augmented Generation)",
                "• Integration with Google Drive, Sheets, Docs",
                "• AWS infrastructure with SageMaker training",
                "• Enterprise-grade security and compliance"
            ]
        },
        {
            "slide_number": 7,
            "title": "Pricing & ROI",
            "content": [
                "Professional Tier: $300/hour (customer pays AI costs)",
                "Enterprise Tier: $150/hour + 1.5% revenue share",
                "Average ROI: 400% in first year",
                "Typical engagement: $137,325 total value",
                "25-week implementation timeline"
            ]
        }
    ],
    "competitive_advantages": [
        "Cannabis-specific AI training data",
        "Multi-agent verification system", 
        "Real-time regulatory database",
        "AWS enterprise infrastructure",
        "Proven track record with top operators"
    ]
}

def generate_demo_files():
    """Generate all demo data files"""
    
    # Create demo data directory
    os.makedirs("demo_data", exist_ok=True)
    
    # Save all demo data as JSON files
    with open("demo_data/demo_user.json", "w") as f:
        json.dump(DEMO_USER, f, indent=2)
    
    with open("demo_data/patent_search.json", "w") as f:
        json.dump(PATENT_SEARCH_DATA, f, indent=2)
    
    with open("demo_data/sop_document.json", "w") as f:
        json.dump(SOP_DATA, f, indent=2)
    
    with open("demo_data/formulation_sheet.json", "w") as f:
        json.dump(FORMULATION_DATA, f, indent=2)
    
    with open("demo_data/marketing_data.json", "w") as f:
        json.dump(MARKETING_DATA, f, indent=2)
    
    with open("demo_data/formul8_pitch.json", "w") as f:
        json.dump(FORMUL8_PITCH_DATA, f, indent=2)
    
    print("✅ Demo data files generated successfully!")
    print("📁 Files created in demo_data/ directory:")
    for filename in os.listdir("demo_data"):
        print(f"   • {filename}")

if __name__ == "__main__":
    generate_demo_files()