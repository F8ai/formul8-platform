#!/usr/bin/env python3
"""
Compliance Integration System

Integrates all compliance data collection components with the main compliance agent,
providing a unified interface for regulatory data access with vector search and citations.
"""

import json
import logging
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import sys
import os

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from citation_system import CitationSystem
from vectorize_compliance import ComplianceVectorizer
from wget_mirror import WgetMirror
from data_validator import ComplianceDataValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComplianceIntegration:
    """Main integration class for compliance data system"""
    
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        
        # Initialize components
        self.citation_system = CitationSystem(base_dir)
        self.vectorizer = ComplianceVectorizer(base_dir)
        self.mirror = WgetMirror(base_dir)
        self.validator = ComplianceDataValidator(base_dir)
        
        # Integration status
        self.integration_status = {
            "initialized_at": datetime.now().isoformat(),
            "components": {
                "citation_system": "initialized",
                "vectorizer": "initialized", 
                "mirror": "initialized",
                "validator": "initialized"
            },
            "ready_for_queries": False
        }

    def get_regulatory_answer(self, query: str, state: Optional[str] = None, 
                            top_k: int = 5) -> Dict[str, Any]:
        """
        Get comprehensive regulatory answer with citations and vector search
        
        This is the main method that the compliance agent will call
        """
        logger.info(f"Processing regulatory query: '{query}'" + 
                   (f" for state: {state}" if state else ""))
        
        try:
            # Step 1: Vector search for relevant citations
            similar_citations = self.vectorizer.search_similar_citations(
                query, k=top_k * 2, state_filter=state
            )
            
            # Step 2: Filter high-relevance citations
            high_relevance_citations = [
                citation for citation in similar_citations 
                if citation["relevance"] in ["high", "medium"]
            ][:top_k]
            
            # Step 3: Get additional context from citation system
            keyword_results = self.citation_system.search_citations(
                query, state, limit=top_k
            )
            
            # Step 4: Combine and deduplicate results
            all_citations = []
            seen_citation_ids = set()
            
            # Add vector search results first (higher priority)
            for citation in high_relevance_citations:
                if citation["citation_id"] not in seen_citation_ids:
                    all_citations.append({
                        "source": "vector_search",
                        "similarity_score": citation["similarity_score"],
                        "citation_string": citation["citation_string"],
                        "state": citation["state"],
                        "section": citation["section"],
                        "document_type": citation["document_type"],
                        "text_content": citation["text_content"],
                        "relevance": citation["relevance"]
                    })
                    seen_citation_ids.add(citation["citation_id"])
            
            # Add keyword search results
            for result in keyword_results:
                citation = result["citation"]
                if citation["hash_id"] not in seen_citation_ids:
                    all_citations.append({
                        "source": "keyword_search",
                        "similarity_score": None,
                        "citation_string": result["citation_string"],
                        "state": citation["state"],
                        "section": citation["section"],
                        "document_type": citation["document_type"],
                        "text_content": citation["text_content"],
                        "relevance": "keyword_match"
                    })
                    seen_citation_ids.add(citation["hash_id"])
            
            # Step 5: Format response
            response = {
                "query": query,
                "state_filter": state,
                "total_citations": len(all_citations),
                "citations": all_citations,
                "search_metadata": {
                    "vector_results": len(high_relevance_citations),
                    "keyword_results": len(keyword_results),
                    "combined_results": len(all_citations)
                },
                "llm_prompt": self._create_llm_prompt(query, all_citations),
                "processed_at": datetime.now().isoformat()
            }
            
            logger.info(f"Found {len(all_citations)} relevant citations for query")
            return response
            
        except Exception as e:
            logger.error(f"Error processing regulatory query: {e}")
            return {
                "query": query,
                "error": str(e),
                "total_citations": 0,
                "citations": [],
                "processed_at": datetime.now().isoformat()
            }

    def _create_llm_prompt(self, query: str, citations: List[Dict]) -> str:
        """Create LLM prompt with citations and instructions"""
        
        prompt = f"""
REGULATORY QUERY: {query}

RELEVANT CITATIONS FOUND ({len(citations)} total):

"""
        
        for i, citation in enumerate(citations[:10], 1):  # Limit to top 10
            prompt += f"""
{i}. {citation['citation_string']}
   Source: {citation['source']} | Relevance: {citation['relevance']}
   {citation['state'].upper()} {citation['document_type']} - Section {citation['section']}
   Content: {citation['text_content'][:300]}...
   
"""
        
        prompt += f"""
INSTRUCTIONS FOR RESPONSE:
1. Provide a comprehensive answer to the query using the citations above
2. Include specific citation references in this format: [STATE REGULATION - TITLE - SECTION]
3. If multiple states have similar requirements, note variations
4. Include confidence level based on citation quality
5. Mention if additional research is needed for complete compliance

RESPONSE FORMAT:
- Start with direct answer to the query
- Include specific citations for each regulatory statement
- Note any state-specific variations
- Provide confidence level (High/Medium/Low)
- Suggest next steps if applicable

Remember: Every regulatory statement must include a specific citation reference.
"""
        
        return prompt

    def check_system_readiness(self) -> Dict[str, Any]:
        """Check if all components are ready for queries"""
        logger.info("Checking system readiness")
        
        readiness_check = {
            "overall_status": "checking",
            "components": {},
            "recommendations": []
        }
        
        # Check citation system
        citation_db_file = self.base_dir / "citations" / "citation_database.json"
        if citation_db_file.exists():
            with open(citation_db_file, 'r') as f:
                citation_data = json.load(f)
            
            readiness_check["components"]["citation_system"] = {
                "status": "ready",
                "total_citations": citation_data.get("total_citations", 0),
                "states_available": len(citation_data.get("states", {}))
            }
        else:
            readiness_check["components"]["citation_system"] = {
                "status": "not_ready",
                "issue": "Citation database not found"
            }
            readiness_check["recommendations"].append("Run citation system processing")
        
        # Check vector system
        vector_db_file = self.base_dir / "vectors" / "vector_database.json"
        faiss_index_file = self.base_dir / "vectors" / "compliance_faiss.index"
        
        if vector_db_file.exists() and faiss_index_file.exists():
            with open(vector_db_file, 'r') as f:
                vector_data = json.load(f)
            
            readiness_check["components"]["vectorizer"] = {
                "status": "ready",
                "total_vectors": vector_data.get("total_vectors", 0),
                "model_name": vector_data.get("model_name", "unknown")
            }
        else:
            readiness_check["components"]["vectorizer"] = {
                "status": "not_ready",
                "issue": "Vector database or FAISS index not found"
            }
            readiness_check["recommendations"].append("Run vectorization processing")
        
        # Check mirror system
        mirror_status_file = self.base_dir / "mirrors" / "mirror_status.json"
        if mirror_status_file.exists():
            with open(mirror_status_file, 'r') as f:
                mirror_data = json.load(f)
            
            readiness_check["components"]["mirror"] = {
                "status": "ready",
                "total_files": mirror_data.get("total_files", 0),
                "completed_mirrors": mirror_data.get("completed_mirrors", 0)
            }
        else:
            readiness_check["components"]["mirror"] = {
                "status": "not_ready",
                "issue": "Mirror status not found"
            }
            readiness_check["recommendations"].append("Run website mirroring")
        
        # Check validation system
        validation_file = self.base_dir / "validation_results.json"
        if validation_file.exists():
            with open(validation_file, 'r') as f:
                validation_data = json.load(f)
            
            readiness_check["components"]["validator"] = {
                "status": "ready",
                "overall_quality": validation_data.get("overall_status", "unknown"),
                "states_validated": len(validation_data.get("states", {}))
            }
        else:
            readiness_check["components"]["validator"] = {
                "status": "optional",
                "issue": "Validation results not found"
            }
        
        # Determine overall readiness
        critical_components = ["citation_system", "vectorizer"]
        all_critical_ready = all(
            readiness_check["components"][comp]["status"] == "ready"
            for comp in critical_components
            if comp in readiness_check["components"]
        )
        
        if all_critical_ready:
            readiness_check["overall_status"] = "ready"
            self.integration_status["ready_for_queries"] = True
        else:
            readiness_check["overall_status"] = "not_ready"
            self.integration_status["ready_for_queries"] = False
        
        logger.info(f"System readiness: {readiness_check['overall_status']}")
        return readiness_check

    def get_available_states(self) -> List[str]:
        """Get list of states with available compliance data"""
        try:
            citation_db_file = self.base_dir / "citations" / "citation_database.json"
            if citation_db_file.exists():
                with open(citation_db_file, 'r') as f:
                    citation_data = json.load(f)
                return list(citation_data.get("states", {}).keys())
            return []
        except Exception as e:
            logger.error(f"Error getting available states: {e}")
            return []

    def get_state_statistics(self, state: str) -> Dict[str, Any]:
        """Get statistics for a specific state"""
        try:
            stats = {
                "state": state,
                "citations": 0,
                "vectors": 0,
                "mirror_files": 0,
                "validation_score": None
            }
            
            # Citation stats
            citation_file = self.base_dir / "citations" / f"{state}_citations.json"
            if citation_file.exists():
                with open(citation_file, 'r') as f:
                    citation_data = json.load(f)
                stats["citations"] = citation_data.get("total_citations", 0)
            
            # Vector stats
            vector_file = self.base_dir / "vectors" / f"{state}_vectors.json"
            if vector_file.exists():
                with open(vector_file, 'r') as f:
                    vector_data = json.load(f)
                stats["vectors"] = vector_data.get("total_citations", 0)
            
            # Mirror stats
            mirror_dir = self.base_dir / "mirrors" / state
            if mirror_dir.exists():
                stats["mirror_files"] = sum(1 for _ in mirror_dir.rglob("*") if _.is_file())
            
            # Validation stats
            validation_file = self.base_dir / "validation_results.json"
            if validation_file.exists():
                with open(validation_file, 'r') as f:
                    validation_data = json.load(f)
                
                state_validation = validation_data.get("states", {}).get(state, {})
                stats["validation_score"] = state_validation.get("overall_score", None)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting state statistics: {e}")
            return {"state": state, "error": str(e)}

    def create_agent_config(self) -> Dict[str, Any]:
        """Create configuration for the compliance agent"""
        readiness = self.check_system_readiness()
        
        config = {
            "compliance_data_config": {
                "base_dir": str(self.base_dir),
                "system_ready": readiness["overall_status"] == "ready",
                "available_states": self.get_available_states(),
                "total_citations": 0,
                "total_vectors": 0,
                "vector_search_enabled": False,
                "citation_search_enabled": False
            },
            "search_parameters": {
                "default_top_k": 5,
                "similarity_threshold": 0.6,
                "relevance_filtering": True,
                "state_filtering_enabled": True
            },
            "llm_integration": {
                "prompt_template": self.citation_system.create_llm_citation_prompt(),
                "semantic_search_prompt": self.vectorizer.create_semantic_search_prompt(),
                "response_format": "structured_citations"
            }
        }
        
        # Add component-specific details
        for component, details in readiness["components"].items():
            if details["status"] == "ready":
                if component == "citation_system":
                    config["compliance_data_config"]["total_citations"] = details.get("total_citations", 0)
                    config["compliance_data_config"]["citation_search_enabled"] = True
                elif component == "vectorizer":
                    config["compliance_data_config"]["total_vectors"] = details.get("total_vectors", 0)
                    config["compliance_data_config"]["vector_search_enabled"] = True
        
        return config

def main():
    """Main entry point for testing integration"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Compliance integration system")
    parser.add_argument('--check-readiness', action='store_true', help='Check system readiness')
    parser.add_argument('--query', help='Test query processing')
    parser.add_argument('--state', help='Filter by state')
    parser.add_argument('--stats', help='Get statistics for state')
    parser.add_argument('--config', action='store_true', help='Generate agent configuration')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    integration = ComplianceIntegration()
    
    if args.check_readiness:
        readiness = integration.check_system_readiness()
        print(json.dumps(readiness, indent=2))
    elif args.query:
        response = integration.get_regulatory_answer(args.query, args.state)
        print(json.dumps(response, indent=2))
    elif args.stats:
        stats = integration.get_state_statistics(args.stats)
        print(json.dumps(stats, indent=2))
    elif args.config:
        config = integration.create_agent_config()
        print(json.dumps(config, indent=2))
    else:
        print("Please specify an action:")
        print("  --check-readiness  Check if system is ready")
        print("  --query 'text'     Test query processing")
        print("  --stats <state>    Get state statistics")
        print("  --config           Generate agent configuration")

if __name__ == "__main__":
    main()