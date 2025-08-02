#!/usr/bin/env python3
"""
Formulation Agent PubMed Integration
Integrates cannabis research from PubMed into the formulation agent's knowledge base.
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

try:
    from scripts.pubmed_cannabis_curator import PubMedCannabisResearchCurator
except ImportError:
    print("Error: Cannot import PubMedCannabisResearchCurator")
    print("Make sure you're running from the project root directory")
    sys.exit(1)

class FormulationAgentPubMedIntegrator:
    """Integrates PubMed cannabis research specifically for formulation agent."""
    
    def __init__(self, agent_dir: str = None):
        if agent_dir is None:
            agent_dir = Path(__file__).parent
        
        self.agent_dir = Path(agent_dir)
        self.rag_dir = self.agent_dir / "rag"
        self.rag_dir.mkdir(exist_ok=True)
        
        # Formulation-specific research priorities
        self.formulation_priorities = {
            "cannabinoids": {
                "priority": "critical",
                "focus": ["bioavailability", "stability", "solubility", "chemical properties"],
                "keywords": ["formulation", "delivery", "stability", "solubility", "bioavailability"]
            },
            "terpenes": {
                "priority": "high", 
                "focus": ["entourage effect", "volatility", "stability", "synergy"],
                "keywords": ["entourage", "synergy", "volatile", "stability", "preservation"]
            },
            "extraction": {
                "priority": "high",
                "focus": ["yield optimization", "purity", "residual solvents", "quality"],
                "keywords": ["extraction efficiency", "purification", "contamination", "quality control"]
            },
            "formulation": {
                "priority": "critical",
                "focus": ["delivery systems", "bioavailability", "manufacturing", "quality"],
                "keywords": ["nanoemulsion", "liposome", "transdermal", "oral delivery", "manufacturing"]
            },
            "pharmacokinetics": {
                "priority": "critical",
                "focus": ["absorption", "metabolism", "bioavailability", "first-pass effect"],
                "keywords": ["ADME", "pharmacokinetics", "bioavailability", "metabolism"]
            },
            "stability": {
                "priority": "high",
                "focus": ["degradation", "shelf life", "storage conditions", "packaging"],
                "keywords": ["degradation", "oxidation", "storage", "shelf life", "packaging"]
            }
        }
    
    def curate_formulation_research(self, max_per_category: int = 100, include_scihub: bool = True) -> Dict[str, Any]:
        """Curate cannabis research specifically for formulation applications."""
        
        print("🧪 Starting formulation-focused research curation...")
        print(f"Agent directory: {self.agent_dir}")
        print()
        
        curator = PubMedCannabisResearchCurator()
        
        # Curate research with formulation focus
        research_data = curator.curate_cannabis_research(
            max_per_category=max_per_category,
            days_back=730,  # 2 years for comprehensive coverage
            include_scihub=include_scihub,
            output_dir=str(self.agent_dir / "research_data")
        )
        
        # Process and prioritize for formulation
        processed_data = self._process_for_formulation(research_data)
        
        # Update RAG corpus
        self._update_rag_corpus(processed_data)
        
        # Create formulation knowledge base
        self._create_formulation_kb(processed_data)
        
        return processed_data
    
    def _process_for_formulation(self, research_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Process research data with formulation-specific analysis."""
        
        processed = {
            "metadata": {
                "processed_date": datetime.now().isoformat(),
                "total_articles": sum(len(articles) for articles in research_data.values()),
                "formulation_relevance_scoring": True,
                "categories_processed": list(research_data.keys())
            },
            "formulation_insights": {},
            "prioritized_articles": [],
            "research_gaps": [],
            "formulation_applications": {}
        }
        
        all_articles = []
        
        for category, articles in research_data.items():
            if category not in self.formulation_priorities:
                continue
                
            category_priority = self.formulation_priorities[category]
            
            # Score articles for formulation relevance
            scored_articles = []
            for article in articles:
                score = self._calculate_formulation_relevance(article, category_priority)
                article['formulation_relevance_score'] = score
                article['formulation_priority'] = category_priority['priority']
                scored_articles.append(article)
                all_articles.append(article)
            
            # Sort by relevance
            scored_articles.sort(key=lambda x: x['formulation_relevance_score'], reverse=True)
            
            processed['formulation_insights'][category] = {
                "total_articles": len(scored_articles),
                "high_relevance": len([a for a in scored_articles if a['formulation_relevance_score'] >= 7]),
                "with_full_text": len([a for a in scored_articles if a.get('has_full_text', False)]),
                "top_articles": scored_articles[:5],  # Top 5 most relevant
                "key_insights": self._extract_category_insights(scored_articles, category)
            }
        
        # Overall prioritization
        all_articles.sort(key=lambda x: x.get('formulation_relevance_score', 0), reverse=True)
        processed['prioritized_articles'] = all_articles[:50]  # Top 50 overall
        
        # Identify research gaps
        processed['research_gaps'] = self._identify_formulation_gaps(research_data)
        
        # Map to formulation applications
        processed['formulation_applications'] = self._map_to_applications(all_articles)
        
        return processed
    
    def _calculate_formulation_relevance(self, article: Dict[str, Any], category_config: Dict[str, Any]) -> float:
        """Calculate formulation relevance score (0-10) for an article."""
        if not article:
            return 0.0
            
        score = 0.0
        
        # Base score from category priority
        priority_scores = {"critical": 3.0, "high": 2.0, "medium": 1.0, "low": 0.5}
        score += priority_scores.get(category_config['priority'], 0)
        
        # Check for formulation keywords in title (high weight)
        title = article.get('title') or ''
        title = title.lower() if title else ''
        for keyword in category_config['keywords']:
            if keyword.lower() in title:
                score += 1.5
        
        # Check for formulation keywords in abstract (medium weight)
        abstract = article.get('abstract') or ''
        abstract = abstract.lower() if abstract else ''
        for keyword in category_config['keywords']:
            if keyword.lower() in abstract:
                score += 1.0
        
        # Check for formulation focus areas (medium weight)
        for focus_area in category_config['focus']:
            if focus_area.lower() in title:
                score += 1.2
            if focus_area.lower() in abstract:
                score += 0.8
        
        # Bonus for having full text
        if article.get('has_full_text', False):
            score += 1.0
        
        # Bonus for recent publication
        pub_date = article.get('publication_date', '')
        if pub_date and '2024' in pub_date or '2025' in pub_date:
            score += 0.5
        
        # Cap at 10
        return min(score, 10.0)
    
    def _extract_category_insights(self, articles: List[Dict[str, Any]], category: str) -> List[str]:
        """Extract key insights for a research category."""
        insights = []
        
        if not articles:
            return insights
        
        # Common patterns in high-scoring articles
        high_relevance = [a for a in articles if a.get('formulation_relevance_score', 0) >= 7]
        
        if high_relevance:
            insights.append(f"Found {len(high_relevance)} highly relevant {category} studies")
            
            # Analyze keywords
            all_keywords = []
            for article in high_relevance:
                all_keywords.extend(article.get('keywords', []))
            
            # Find most common formulation-related keywords
            keyword_counts = {}
            formulation_terms = ['formulation', 'delivery', 'bioavailability', 'stability', 'extraction', 'nanoemulsion']
            
            for keyword in all_keywords:
                if any(term in keyword.lower() for term in formulation_terms):
                    keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
            
            if keyword_counts:
                top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                insights.append(f"Key formulation themes: {', '.join([k for k, v in top_keywords])}")
        
        return insights
    
    def _identify_formulation_gaps(self, research_data: Dict[str, List[Dict]]) -> List[str]:
        """Identify potential research gaps in formulation science."""
        gaps = []
        
        # Check coverage of key formulation areas
        formulation_areas = {
            "nanoemulsion": 0,
            "liposome": 0,
            "transdermal": 0,
            "sustained release": 0,
            "bioavailability enhancement": 0,
            "stability testing": 0,
            "quality control": 0
        }
        
        for articles in research_data.values():
            for article in articles:
                content = f"{article.get('title', '')} {article.get('abstract', '')}".lower()
                for area in formulation_areas:
                    if area in content:
                        formulation_areas[area] += 1
        
        # Identify under-researched areas
        total_articles = sum(len(articles) for articles in research_data.values())
        for area, count in formulation_areas.items():
            if total_articles > 0 and count / total_articles < 0.1:  # Less than 10% coverage
                gaps.append(f"Limited research on {area} ({count} articles)")
        
        return gaps
    
    def _map_to_applications(self, articles: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Map research to specific formulation applications."""
        applications = {
            "oral_delivery": [],
            "topical_delivery": [], 
            "inhalation": [],
            "extraction_optimization": [],
            "stability_enhancement": [],
            "quality_control": []
        }
        
        for article in articles:
            content = f"{article.get('title', '')} {article.get('abstract', '')}".lower()
            pmid = article.get('pmid', 'Unknown')
            
            if any(term in content for term in ['oral', 'ingestion', 'edible', 'tablet', 'capsule']):
                applications['oral_delivery'].append(pmid)
            
            if any(term in content for term in ['topical', 'transdermal', 'skin', 'cream', 'gel']):
                applications['topical_delivery'].append(pmid)
            
            if any(term in content for term in ['inhalation', 'smoking', 'vaping', 'aerosol']):
                applications['inhalation'].append(pmid)
            
            if any(term in content for term in ['extraction', 'purification', 'isolation']):
                applications['extraction_optimization'].append(pmid)
            
            if any(term in content for term in ['stability', 'degradation', 'shelf life', 'storage']):
                applications['stability_enhancement'].append(pmid)
            
            if any(term in content for term in ['quality control', 'testing', 'analysis', 'assay']):
                applications['quality_control'].append(pmid)
        
        return applications
    
    def _update_rag_corpus(self, processed_data: Dict[str, Any]) -> None:
        """Update the RAG corpus with formulation-focused research."""
        
        corpus_file = self.rag_dir / "corpus.jsonl"
        
        # Create formulation-focused corpus entries
        corpus_entries = []
        
        for article in processed_data['prioritized_articles']:
            if article.get('formulation_relevance_score', 0) >= 5:  # Only high-relevance articles
                
                # Create comprehensive corpus entry
                entry = {
                    "id": f"pubmed_{article.get('pmid', 'unknown')}",
                    "source": "PubMed Cannabis Research",
                    "type": "research_article",
                    "category": article.get('category', 'general'),
                    "title": article.get('title', ''),
                    "content": f"""
TITLE: {article.get('title', '')}

ABSTRACT: {article.get('abstract', '')}

AUTHORS: {', '.join(article.get('authors', []))}

JOURNAL: {article.get('journal', '')}

PUBLICATION DATE: {article.get('publication_date', '')}

KEYWORDS: {', '.join(article.get('keywords', []))}

FORMULATION RELEVANCE: {article.get('formulation_relevance_score', 0)}/10

DOI: {article.get('doi', 'Not available')}

FULL TEXT AVAILABLE: {'Yes' if article.get('has_full_text', False) else 'No'}
""".strip(),
                    "metadata": {
                        "pmid": article.get('pmid'),
                        "doi": article.get('doi'),
                        "formulation_relevance": article.get('formulation_relevance_score'),
                        "has_full_text": article.get('has_full_text', False),
                        "scihub_url": article.get('scihub_url'),
                        "pubmed_url": article.get('pubmed_url')
                    }
                }
                
                corpus_entries.append(entry)
        
        # Write to corpus file
        with open(corpus_file, 'w') as f:
            for entry in corpus_entries:
                f.write(json.dumps(entry) + '\n')
        
        print(f"✅ Updated RAG corpus with {len(corpus_entries)} formulation-relevant articles")
        print(f"   Corpus saved to: {corpus_file}")
    
    def _create_formulation_kb(self, processed_data: Dict[str, Any]) -> None:
        """Create formulation-specific knowledge base file."""
        
        kb_file = self.agent_dir / "formulation_research_kb.json"
        
        # Create comprehensive knowledge base
        knowledge_base = {
            "metadata": processed_data['metadata'],
            "formulation_categories": {
                category: {
                    "research_count": data['total_articles'],
                    "high_relevance_count": data['high_relevance'],
                    "full_text_available": data['with_full_text'],
                    "key_insights": data['key_insights'],
                    "top_articles": [
                        {
                            "pmid": article.get('pmid'),
                            "title": article.get('title'),
                            "relevance_score": article.get('formulation_relevance_score'),
                            "pubmed_url": article.get('pubmed_url'),
                            "has_full_text": article.get('has_full_text', False)
                        }
                        for article in data['top_articles']
                    ]
                }
                for category, data in processed_data['formulation_insights'].items()
            },
            "research_gaps": processed_data['research_gaps'],
            "formulation_applications": processed_data['formulation_applications'],
            "usage_guide": {
                "description": "Cannabis formulation research knowledge base",
                "categories": list(self.formulation_priorities.keys()),
                "relevance_scoring": "Articles scored 0-10 based on formulation relevance",
                "full_text_access": "Use SciHub URLs when available for complete research access"
            }
        }
        
        with open(kb_file, 'w') as f:
            json.dump(knowledge_base, f, indent=2)
        
        print(f"✅ Created formulation knowledge base: {kb_file}")
        
        # Update agent config
        self._update_agent_config(knowledge_base)
    
    def _update_agent_config(self, knowledge_base: Dict[str, Any]) -> None:
        """Update agent configuration with research capabilities."""
        
        config_file = self.agent_dir / "agent_config.yaml"
        
        if config_file.exists():
            # Read existing config
            import yaml
            with open(config_file, 'r') as f:
                config = yaml.safe_load(f)
        else:
            config = {}
        
        # Add research integration
        config['research_integration'] = {
            'pubmed_enabled': True,
            'scihub_enabled': True,
            'research_categories': list(self.formulation_priorities.keys()),
            'total_articles': knowledge_base['metadata']['total_articles'],
            'last_updated': knowledge_base['metadata']['processed_date'],
            'knowledge_base_file': 'formulation_research_kb.json',
            'corpus_file': 'rag/corpus.jsonl'
        }
        
        # Update agent description
        config['agent'] = config.get('agent', {})
        config['agent']['description'] = (
            "Cannabis formulation specialist with integrated PubMed research database. "
            f"Access to {knowledge_base['metadata']['total_articles']} curated research articles "
            "covering cannabinoids, terpenes, extraction, formulation science, pharmacokinetics, and stability."
        )
        
        # Save updated config
        import yaml
        with open(config_file, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        print(f"✅ Updated agent configuration: {config_file}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Integrate PubMed cannabis research into formulation agent")
    parser.add_argument("--max-per-category", type=int, default=100, help="Maximum articles per category")
    parser.add_argument("--no-scihub", action="store_true", help="Disable SciHub full-text attempts")
    parser.add_argument("--agent-dir", help="Formulation agent directory (default: current directory)")
    
    args = parser.parse_args()
    
    integrator = FormulationAgentPubMedIntegrator(args.agent_dir)
    
    print("🧪 Formulation Agent PubMed Integration")
    print("=" * 50)
    
    result = integrator.curate_formulation_research(
        max_per_category=args.max_per_category,
        include_scihub=not args.no_scihub
    )
    
    print("\n📊 Integration Summary:")
    print(f"  Total articles processed: {result['metadata']['total_articles']}")
    print(f"  High-priority articles: {len(result['prioritized_articles'])}")
    print(f"  Research gaps identified: {len(result['research_gaps'])}")
    print(f"  Formulation applications mapped: {sum(len(apps) for apps in result['formulation_applications'].values())}")
    
    print("\n✅ Formulation agent research integration complete!")

if __name__ == "__main__":
    main()