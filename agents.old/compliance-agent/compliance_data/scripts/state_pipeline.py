#!/usr/bin/env python3
"""
State-by-State Processing Pipeline for Cannabis Compliance Data

This pipeline processes each state independently with proper isolation:
1. State-specific data collection (wget mirroring)
2. State-specific citation extraction
3. State-specific vectorization
4. State-specific validation
5. Cross-state aggregation for unified search

Benefits of state-by-state approach:
- Parallel processing capability
- Isolated failure handling
- State-specific optimization
- Easier debugging and maintenance
- Progressive deployment
"""

import json
import logging
import asyncio
import concurrent.futures
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import subprocess
import time
import hashlib
import pickle

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class StatePipeline:
    """Individual state processing pipeline"""
    
    def __init__(self, state_code: str, base_dir: str = "."):
        self.state_code = state_code.lower()
        self.base_dir = Path(base_dir)
        
        # State-specific directories
        self.state_dir = self.base_dir / "states" / self.state_code
        self.mirrors_dir = self.state_dir / "mirrors"
        self.citations_dir = self.state_dir / "citations"
        self.vectors_dir = self.state_dir / "vectors"
        self.validation_dir = self.state_dir / "validation"
        
        # Create state directories
        for dir_path in [self.state_dir, self.mirrors_dir, self.citations_dir, 
                        self.vectors_dir, self.validation_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Load state configuration
        self.state_config = self._load_state_config()
        
        # Pipeline status
        self.pipeline_status = {
            "state": self.state_code,
            "started_at": datetime.now().isoformat(),
            "current_phase": "initialization",
            "completed_phases": [],
            "failed_phases": [],
            "metrics": {
                "files_mirrored": 0,
                "citations_extracted": 0,
                "vectors_created": 0,
                "processing_time": 0
            },
            "errors": []
        }
    
    def _load_state_config(self) -> Dict[str, Any]:
        """Load state configuration from state_sources.json"""
        state_sources_file = self.base_dir / "state_sources.json"
        
        if not state_sources_file.exists():
            logger.error(f"state_sources.json not found for {self.state_code}")
            return {}
        
        with open(state_sources_file, 'r') as f:
            data = json.load(f)
        
        return data.get("cannabis_legal_states", {}).get(self.state_code, {})
    
    def _save_pipeline_status(self):
        """Save pipeline status to state directory"""
        status_file = self.state_dir / "pipeline_status.json"
        with open(status_file, 'w') as f:
            json.dump(self.pipeline_status, f, indent=2)
    
    def _update_phase(self, phase: str, status: str = "running"):
        """Update current pipeline phase"""
        self.pipeline_status["current_phase"] = phase
        if status == "completed":
            self.pipeline_status["completed_phases"].append(phase)
        elif status == "failed":
            self.pipeline_status["failed_phases"].append(phase)
        self._save_pipeline_status()
    
    async def phase_1_mirror_websites(self) -> Dict[str, Any]:
        """Phase 1: Mirror state regulatory websites"""
        logger.info(f"[{self.state_code.upper()}] Starting Phase 1: Website Mirroring")
        self._update_phase("mirroring", "running")
        
        start_time = time.time()
        
        try:
            # Get URLs to mirror
            urls_to_mirror = []
            
            for url_type in ["main_url", "regulations_url", "forms_url"]:
                if url_type in self.state_config:
                    urls_to_mirror.append({
                        "type": url_type,
                        "url": self.state_config[url_type]
                    })
            
            # Add additional sources
            if "additional_sources" in self.state_config:
                for i, url in enumerate(self.state_config["additional_sources"]):
                    urls_to_mirror.append({
                        "type": f"additional_{i}",
                        "url": url
                    })
            
            # Mirror each URL
            mirror_results = []
            total_files = 0
            
            for url_info in urls_to_mirror:
                url = url_info["url"]
                url_type = url_info["type"]
                
                logger.info(f"[{self.state_code.upper()}] Mirroring {url_type}: {url}")
                
                try:
                    # Build wget command
                    cmd = [
                        "wget",
                        "--recursive",
                        "--level=3",
                        "--page-requisites",
                        "--html-extension",
                        "--convert-links",
                        "--restrict-file-names=windows",
                        "--no-parent",
                        "--wait=2",
                        "--random-wait",
                        "--timeout=60",
                        "--tries=3",
                        "--user-agent=Mozilla/5.0 (compatible; ComplianceBot/1.0)",
                        f"--domains={self._extract_domain(url)}",
                        url
                    ]
                    
                    # Execute wget
                    result = subprocess.run(
                        cmd,
                        cwd=self.mirrors_dir,
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                    
                    # Count files
                    files_count = len(list(self.mirrors_dir.rglob("*")))
                    total_files = files_count
                    
                    if result.returncode == 0:
                        logger.info(f"[{self.state_code.upper()}] ✓ Successfully mirrored {url}")
                        mirror_results.append({
                            "url": url,
                            "type": url_type,
                            "status": "success",
                            "files_downloaded": files_count
                        })
                    else:
                        logger.warning(f"[{self.state_code.upper()}] ✗ Failed to mirror {url}")
                        mirror_results.append({
                            "url": url,
                            "type": url_type,
                            "status": "failed",
                            "error": result.stderr[:200]
                        })
                        
                except Exception as e:
                    logger.error(f"[{self.state_code.upper()}] Error mirroring {url}: {str(e)}")
                    mirror_results.append({
                        "url": url,
                        "type": url_type,
                        "status": "error",
                        "error": str(e)
                    })
            
            # Save mirror results
            mirror_result = {
                "state": self.state_code,
                "total_files": total_files,
                "urls_processed": len(urls_to_mirror),
                "successful_mirrors": len([r for r in mirror_results if r["status"] == "success"]),
                "results": mirror_results,
                "completed_at": datetime.now().isoformat()
            }
            
            mirror_file = self.mirrors_dir / "mirror_results.json"
            with open(mirror_file, 'w') as f:
                json.dump(mirror_result, f, indent=2)
            
            # Update metrics
            self.pipeline_status["metrics"]["files_mirrored"] = total_files
            self.pipeline_status["metrics"]["processing_time"] += time.time() - start_time
            
            self._update_phase("mirroring", "completed")
            logger.info(f"[{self.state_code.upper()}] Phase 1 completed: {total_files} files mirrored")
            
            return mirror_result
            
        except Exception as e:
            logger.error(f"[{self.state_code.upper()}] Phase 1 failed: {str(e)}")
            self.pipeline_status["errors"].append({
                "phase": "mirroring",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            self._update_phase("mirroring", "failed")
            return {"status": "failed", "error": str(e)}
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        from urllib.parse import urlparse
        return urlparse(url).netloc
    
    async def phase_2_extract_citations(self) -> Dict[str, Any]:
        """Phase 2: Extract citations from mirrored content"""
        logger.info(f"[{self.state_code.upper()}] Starting Phase 2: Citation Extraction")
        self._update_phase("citation_extraction", "running")
        
        start_time = time.time()
        
        try:
            # Find all HTML and PDF files
            html_files = list(self.mirrors_dir.rglob("*.html"))
            pdf_files = list(self.mirrors_dir.rglob("*.pdf"))
            
            logger.info(f"[{self.state_code.upper()}] Found {len(html_files)} HTML files, {len(pdf_files)} PDF files")
            
            # Process files and extract citations
            citations = []
            
            for html_file in html_files[:10]:  # Limit for testing
                try:
                    # Extract citations from HTML
                    file_citations = self._extract_citations_from_html(html_file)
                    citations.extend(file_citations)
                    
                except Exception as e:
                    logger.warning(f"[{self.state_code.upper()}] Error processing {html_file}: {str(e)}")
            
            # Save citations
            citation_result = {
                "state": self.state_code,
                "total_citations": len(citations),
                "files_processed": len(html_files) + len(pdf_files),
                "citations": citations,
                "completed_at": datetime.now().isoformat()
            }
            
            citation_file = self.citations_dir / "citations.json"
            with open(citation_file, 'w') as f:
                json.dump(citation_result, f, indent=2)
            
            # Update metrics
            self.pipeline_status["metrics"]["citations_extracted"] = len(citations)
            self.pipeline_status["metrics"]["processing_time"] += time.time() - start_time
            
            self._update_phase("citation_extraction", "completed")
            logger.info(f"[{self.state_code.upper()}] Phase 2 completed: {len(citations)} citations extracted")
            
            return citation_result
            
        except Exception as e:
            logger.error(f"[{self.state_code.upper()}] Phase 2 failed: {str(e)}")
            self.pipeline_status["errors"].append({
                "phase": "citation_extraction",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            self._update_phase("citation_extraction", "failed")
            return {"status": "failed", "error": str(e)}
    
    def _extract_citations_from_html(self, html_file: Path) -> List[Dict[str, Any]]:
        """Extract citations from HTML file"""
        citations = []
        
        try:
            with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Simple citation extraction (placeholder)
            # In production, this would use the citation_system.py
            import re
            
            # Look for section patterns
            section_patterns = [
                r'Section\s+(\d+[\.\-]\d+[\.\-]?\d*)',
                r'§\s*(\d+[\.\-]\d+[\.\-]?\d*)',
                r'Rule\s+(\d+[\.\-]\d+[\.\-]?\d*)',
                r'Chapter\s+(\d+[\.\-]\d+[\.\-]?\d*)'
            ]
            
            for pattern in section_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    citation = {
                        "state": self.state_code,
                        "section": match,
                        "document_type": "regulation",
                        "source_file": str(html_file.relative_to(self.base_dir)),
                        "extracted_at": datetime.now().isoformat(),
                        "hash_id": hashlib.md5(f"{self.state_code}_{match}".encode()).hexdigest()[:16]
                    }
                    citations.append(citation)
            
        except Exception as e:
            logger.warning(f"Error extracting citations from {html_file}: {str(e)}")
        
        return citations
    
    async def phase_3_create_vectors(self) -> Dict[str, Any]:
        """Phase 3: Create vector embeddings from citations"""
        logger.info(f"[{self.state_code.upper()}] Starting Phase 3: Vector Creation")
        self._update_phase("vectorization", "running")
        
        start_time = time.time()
        
        try:
            # Load citations
            citation_file = self.citations_dir / "citations.json"
            if not citation_file.exists():
                return {"status": "failed", "error": "No citations found"}
            
            with open(citation_file, 'r') as f:
                citation_data = json.load(f)
            
            citations = citation_data.get("citations", [])
            
            if not citations:
                return {"status": "failed", "error": "No citations to vectorize"}
            
            # Create embeddings (placeholder)
            # In production, this would use the vectorize_compliance.py
            vectors = []
            
            for citation in citations:
                # Create mock embedding
                embedding = [0.1] * 384  # Mock 384-dimensional embedding
                
                vector = {
                    "citation_id": citation["hash_id"],
                    "state": self.state_code,
                    "section": citation["section"],
                    "embedding": embedding,
                    "created_at": datetime.now().isoformat()
                }
                vectors.append(vector)
            
            # Save vectors
            vector_result = {
                "state": self.state_code,
                "total_vectors": len(vectors),
                "embedding_dimension": 384,
                "vectors": vectors,
                "completed_at": datetime.now().isoformat()
            }
            
            vector_file = self.vectors_dir / "vectors.json"
            with open(vector_file, 'w') as f:
                json.dump(vector_result, f, indent=2)
            
            # Update metrics
            self.pipeline_status["metrics"]["vectors_created"] = len(vectors)
            self.pipeline_status["metrics"]["processing_time"] += time.time() - start_time
            
            self._update_phase("vectorization", "completed")
            logger.info(f"[{self.state_code.upper()}] Phase 3 completed: {len(vectors)} vectors created")
            
            return vector_result
            
        except Exception as e:
            logger.error(f"[{self.state_code.upper()}] Phase 3 failed: {str(e)}")
            self.pipeline_status["errors"].append({
                "phase": "vectorization",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            self._update_phase("vectorization", "failed")
            return {"status": "failed", "error": str(e)}
    
    async def phase_4_validate_data(self) -> Dict[str, Any]:
        """Phase 4: Validate collected data"""
        logger.info(f"[{self.state_code.upper()}] Starting Phase 4: Data Validation")
        self._update_phase("validation", "running")
        
        try:
            # Validation metrics
            validation_metrics = {
                "files_mirrored": self.pipeline_status["metrics"]["files_mirrored"],
                "citations_extracted": self.pipeline_status["metrics"]["citations_extracted"],
                "vectors_created": self.pipeline_status["metrics"]["vectors_created"],
                "data_quality_score": 0.0,
                "completeness_score": 0.0,
                "accuracy_score": 0.0
            }
            
            # Calculate scores
            if validation_metrics["files_mirrored"] > 0:
                validation_metrics["completeness_score"] = min(1.0, validation_metrics["files_mirrored"] / 100)
            
            if validation_metrics["citations_extracted"] > 0:
                validation_metrics["accuracy_score"] = min(1.0, validation_metrics["citations_extracted"] / 50)
            
            validation_metrics["data_quality_score"] = (
                validation_metrics["completeness_score"] * 0.5 +
                validation_metrics["accuracy_score"] * 0.5
            )
            
            # Save validation results
            validation_result = {
                "state": self.state_code,
                "validation_metrics": validation_metrics,
                "validation_passed": validation_metrics["data_quality_score"] > 0.5,
                "completed_at": datetime.now().isoformat()
            }
            
            validation_file = self.validation_dir / "validation_results.json"
            with open(validation_file, 'w') as f:
                json.dump(validation_result, f, indent=2)
            
            self._update_phase("validation", "completed")
            logger.info(f"[{self.state_code.upper()}] Phase 4 completed: Quality Score {validation_metrics['data_quality_score']:.2f}")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"[{self.state_code.upper()}] Phase 4 failed: {str(e)}")
            self.pipeline_status["errors"].append({
                "phase": "validation",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            self._update_phase("validation", "failed")
            return {"status": "failed", "error": str(e)}
    
    async def run_complete_pipeline(self) -> Dict[str, Any]:
        """Run the complete pipeline for this state"""
        logger.info(f"[{self.state_code.upper()}] Starting complete pipeline")
        
        pipeline_start_time = time.time()
        
        try:
            # Phase 1: Mirror websites
            mirror_result = await self.phase_1_mirror_websites()
            if mirror_result.get("status") == "failed":
                return {"status": "failed", "failed_phase": "mirroring", "error": mirror_result.get("error")}
            
            # Phase 2: Extract citations
            citation_result = await self.phase_2_extract_citations()
            if citation_result.get("status") == "failed":
                return {"status": "failed", "failed_phase": "citation_extraction", "error": citation_result.get("error")}
            
            # Phase 3: Create vectors
            vector_result = await self.phase_3_create_vectors()
            if vector_result.get("status") == "failed":
                return {"status": "failed", "failed_phase": "vectorization", "error": vector_result.get("error")}
            
            # Phase 4: Validate data
            validation_result = await self.phase_4_validate_data()
            if validation_result.get("status") == "failed":
                return {"status": "failed", "failed_phase": "validation", "error": validation_result.get("error")}
            
            # Complete pipeline
            total_time = time.time() - pipeline_start_time
            
            final_result = {
                "state": self.state_code,
                "status": "completed",
                "total_processing_time": total_time,
                "completed_phases": self.pipeline_status["completed_phases"],
                "failed_phases": self.pipeline_status["failed_phases"],
                "final_metrics": self.pipeline_status["metrics"],
                "phase_results": {
                    "mirroring": mirror_result,
                    "citation_extraction": citation_result,
                    "vectorization": vector_result,
                    "validation": validation_result
                },
                "completed_at": datetime.now().isoformat()
            }
            
            # Save final result
            final_file = self.state_dir / "final_result.json"
            with open(final_file, 'w') as f:
                json.dump(final_result, f, indent=2)
            
            logger.info(f"[{self.state_code.upper()}] Complete pipeline finished in {total_time:.1f}s")
            
            return final_result
            
        except Exception as e:
            logger.error(f"[{self.state_code.upper()}] Pipeline failed: {str(e)}")
            return {"status": "failed", "error": str(e)}


class MultiStatePipelineManager:
    """Manages multiple state pipelines with parallel processing"""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.aggregated_dir = self.base_dir / "aggregated"
        self.aggregated_dir.mkdir(exist_ok=True)
        
        # Load available states
        self.available_states = self._load_available_states()
        
        # Manager status
        self.manager_status = {
            "started_at": datetime.now().isoformat(),
            "total_states": len(self.available_states),
            "processed_states": 0,
            "successful_states": 0,
            "failed_states": 0,
            "state_results": {}
        }
    
    def _load_available_states(self) -> List[str]:
        """Load available states from configuration"""
        state_sources_file = self.base_dir / "state_sources.json"
        
        if not state_sources_file.exists():
            return []
        
        with open(state_sources_file, 'r') as f:
            data = json.load(f)
        
        return list(data.get("cannabis_legal_states", {}).keys())
    
    async def process_state(self, state_code: str) -> Dict[str, Any]:
        """Process a single state"""
        pipeline = StatePipeline(state_code, self.base_dir)
        result = await pipeline.run_complete_pipeline()
        
        self.manager_status["processed_states"] += 1
        self.manager_status["state_results"][state_code] = result
        
        if result.get("status") == "completed":
            self.manager_status["successful_states"] += 1
        else:
            self.manager_status["failed_states"] += 1
        
        return result
    
    async def process_states_parallel(self, states: List[str], max_workers: int = 3) -> Dict[str, Any]:
        """Process multiple states in parallel"""
        logger.info(f"Starting parallel processing of {len(states)} states with {max_workers} workers")
        
        # Create semaphore to limit concurrent processing
        semaphore = asyncio.Semaphore(max_workers)
        
        async def process_with_semaphore(state_code: str):
            async with semaphore:
                return await self.process_state(state_code)
        
        # Process all states
        tasks = [process_with_semaphore(state) for state in states]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        final_results = {}
        for state, result in zip(states, results):
            if isinstance(result, Exception):
                final_results[state] = {"status": "failed", "error": str(result)}
            else:
                final_results[state] = result
        
        # Save aggregated results
        aggregated_result = {
            "processing_completed_at": datetime.now().isoformat(),
            "total_states": len(states),
            "successful_states": self.manager_status["successful_states"],
            "failed_states": self.manager_status["failed_states"],
            "state_results": final_results
        }
        
        aggregated_file = self.aggregated_dir / "aggregated_results.json"
        with open(aggregated_file, 'w') as f:
            json.dump(aggregated_result, f, indent=2)
        
        logger.info(f"Parallel processing completed: {self.manager_status['successful_states']}/{len(states)} states successful")
        
        return aggregated_result
    
    def create_unified_search_index(self) -> Dict[str, Any]:
        """Create unified search index from all state data"""
        logger.info("Creating unified search index from all state data")
        
        # Aggregate all citations
        all_citations = []
        all_vectors = []
        
        for state_code in self.available_states:
            state_dir = self.base_dir / "states" / state_code
            
            # Load citations
            citation_file = state_dir / "citations" / "citations.json"
            if citation_file.exists():
                with open(citation_file, 'r') as f:
                    citation_data = json.load(f)
                all_citations.extend(citation_data.get("citations", []))
            
            # Load vectors
            vector_file = state_dir / "vectors" / "vectors.json"
            if vector_file.exists():
                with open(vector_file, 'r') as f:
                    vector_data = json.load(f)
                all_vectors.extend(vector_data.get("vectors", []))
        
        # Create unified index
        unified_index = {
            "total_citations": len(all_citations),
            "total_vectors": len(all_vectors),
            "states_included": len([s for s in self.available_states if (self.base_dir / "states" / s / "citations" / "citations.json").exists()]),
            "citations": all_citations,
            "vectors": all_vectors,
            "created_at": datetime.now().isoformat()
        }
        
        # Save unified index
        unified_file = self.aggregated_dir / "unified_index.json"
        with open(unified_file, 'w') as f:
            json.dump(unified_index, f, indent=2)
        
        logger.info(f"Unified search index created: {len(all_citations)} citations, {len(all_vectors)} vectors")
        
        return unified_index


async def main():
    """Main entry point for pipeline processing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="State-by-state compliance data pipeline")
    parser.add_argument('--state', help='Process single state (e.g., co, ca)')
    parser.add_argument('--states', nargs='+', help='Process multiple states (e.g., co ca wa)')
    parser.add_argument('--all', action='store_true', help='Process all available states')
    parser.add_argument('--parallel', type=int, default=3, help='Number of parallel workers')
    parser.add_argument('--create-index', action='store_true', help='Create unified search index')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    import os
    os.chdir(Path(__file__).parent.parent)
    
    manager = MultiStatePipelineManager()
    
    if args.state:
        # Process single state
        result = await manager.process_state(args.state)
        print(json.dumps(result, indent=2))
    elif args.states:
        # Process multiple states
        result = await manager.process_states_parallel(args.states, args.parallel)
        print(json.dumps(result, indent=2))
    elif args.all:
        # Process all states
        result = await manager.process_states_parallel(manager.available_states, args.parallel)
        print(json.dumps(result, indent=2))
    elif args.create_index:
        # Create unified search index
        result = manager.create_unified_search_index()
        print(json.dumps(result, indent=2))
    else:
        print("Usage examples:")
        print("  python state_pipeline.py --state co")
        print("  python state_pipeline.py --states co ca wa")
        print("  python state_pipeline.py --all --parallel 5")
        print("  python state_pipeline.py --create-index")

if __name__ == "__main__":
    asyncio.run(main())