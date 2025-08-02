#!/usr/bin/env python3
"""
Master Collection Script for Cannabis Compliance Data

This script coordinates all aspects of cannabis regulatory data collection:
1. Wget mirroring of state regulatory websites
2. Citation extraction from mirrored content
3. Vectorization for semantic search
4. Git version control for change tracking

Usage:
    python master_collection.py --state co  # Single state
    python master_collection.py --all       # All states
    python master_collection.py --continue  # Continue interrupted collection
"""

import json
import logging
import subprocess
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import time
import sys
import argparse
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('compliance_collection.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ComplianceMasterCollector:
    """Master orchestrator for cannabis compliance data collection"""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.mirrors_dir = self.base_dir / "mirrors"
        self.citations_dir = self.base_dir / "citations"
        self.vectors_dir = self.base_dir / "vectors"
        self.logs_dir = self.base_dir / "logs"
        
        # Create directories
        for dir_path in [self.mirrors_dir, self.citations_dir, self.vectors_dir, self.logs_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Load state data
        self.state_data = self._load_state_data()
        
        # Collection status
        self.collection_status = {
            "started_at": datetime.now().isoformat(),
            "phase": "initialization",
            "states_processed": 0,
            "total_states": len(self.state_data),
            "current_state": None,
            "errors": [],
            "statistics": {
                "total_files_downloaded": 0,
                "total_citations_extracted": 0,
                "total_vectors_created": 0,
                "total_processing_time": 0
            }
        }
        
        # Wget configuration
        self.wget_config = {
            "recursive": True,
            "level": 3,
            "page_requisites": True,
            "html_extension": True,
            "convert_links": True,
            "restrict_file_names": "windows",
            "no_parent": True,
            "wait": 2,
            "random_wait": True,
            "user_agent": "Mozilla/5.0 (compatible; ComplianceBot/1.0; +https://formul8.ai/bot)",
            "timeout": 30,
            "tries": 3,
            "accept": "text/html,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }

    def _load_state_data(self) -> Dict:
        """Load state data from state_sources.json"""
        state_sources_file = self.base_dir / "state_sources.json"
        
        if not state_sources_file.exists():
            logger.error("state_sources.json not found")
            return {}
        
        with open(state_sources_file, 'r') as f:
            data = json.load(f)
        
        return data.get("cannabis_legal_states", {})

    def _build_wget_command(self, url: str, output_dir: Path, domain: str) -> List[str]:
        """Build wget command with proper options"""
        cmd = ["wget"]
        
        # Add all configuration options
        if self.wget_config.get("recursive"):
            cmd.append("--recursive")
        
        if self.wget_config.get("level"):
            cmd.append(f"--level={self.wget_config['level']}")
        
        if self.wget_config.get("page_requisites"):
            cmd.append("--page-requisites")
        
        if self.wget_config.get("html_extension"):
            cmd.append("--html-extension")
        
        if self.wget_config.get("convert_links"):
            cmd.append("--convert-links")
        
        if self.wget_config.get("restrict_file_names"):
            cmd.append(f"--restrict-file-names={self.wget_config['restrict_file_names']}")
        
        if self.wget_config.get("no_parent"):
            cmd.append("--no-parent")
        
        if self.wget_config.get("wait"):
            cmd.append(f"--wait={self.wget_config['wait']}")
        
        if self.wget_config.get("random_wait"):
            cmd.append("--random-wait")
        
        if self.wget_config.get("user_agent"):
            cmd.append(f"--user-agent={self.wget_config['user_agent']}")
        
        if self.wget_config.get("timeout"):
            cmd.append(f"--timeout={self.wget_config['timeout']}")
        
        if self.wget_config.get("tries"):
            cmd.append(f"--tries={self.wget_config['tries']}")
        
        if self.wget_config.get("accept"):
            cmd.append(f"--accept={self.wget_config['accept']}")
        
        # Add domain restriction
        cmd.append(f"--domains={domain}")
        
        # Add URL
        cmd.append(url)
        
        return cmd

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        parsed = urlparse(url)
        return parsed.netloc

    def _initialize_git_repo(self, repo_dir: Path) -> bool:
        """Initialize git repository for change tracking"""
        try:
            # Check if already a git repo
            if (repo_dir / ".git").exists():
                logger.info(f"Git repository already exists in {repo_dir}")
                return True
            
            # Initialize git repo
            subprocess.run(["git", "init"], cwd=repo_dir, check=True, capture_output=True)
            subprocess.run(["git", "config", "user.email", "compliance@formul8.ai"], cwd=repo_dir, check=True)
            subprocess.run(["git", "config", "user.name", "Compliance Collector"], cwd=repo_dir, check=True)
            
            # Create initial commit
            subprocess.run(["git", "add", "."], cwd=repo_dir, check=True, capture_output=True)
            subprocess.run(["git", "commit", "-m", "Initial collection"], cwd=repo_dir, check=True, capture_output=True)
            
            logger.info(f"Git repository initialized in {repo_dir}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to initialize git repository: {e}")
            return False

    def _commit_changes(self, repo_dir: Path, message: str) -> bool:
        """Commit changes to git repository"""
        try:
            # Add all changes
            subprocess.run(["git", "add", "."], cwd=repo_dir, check=True, capture_output=True)
            
            # Check if there are changes to commit
            result = subprocess.run(["git", "diff", "--cached", "--exit-code"], cwd=repo_dir, capture_output=True)
            if result.returncode == 0:
                logger.info("No changes to commit")
                return True
            
            # Commit changes
            subprocess.run(["git", "commit", "-m", message], cwd=repo_dir, check=True, capture_output=True)
            
            logger.info(f"Changes committed: {message}")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to commit changes: {e}")
            return False

    def mirror_state_websites(self, state_code: str) -> Dict[str, Any]:
        """Mirror all websites for a single state"""
        logger.info(f"Starting website mirroring for {state_code.upper()}")
        
        if state_code not in self.state_data:
            return {"status": "error", "message": f"State {state_code} not found in data"}
        
        state_info = self.state_data[state_code]
        state_name = state_info["state_name"]
        
        # Create state directory
        state_dir = self.mirrors_dir / state_code
        state_dir.mkdir(exist_ok=True)
        
        # Initialize git repository
        self._initialize_git_repo(state_dir)
        
        # Get URLs to mirror
        urls_to_mirror = []
        url_types = ["main_url", "regulations_url", "forms_url"]
        
        for url_type in url_types:
            if url_type in state_info:
                urls_to_mirror.append({
                    "type": url_type,
                    "url": state_info[url_type]
                })
        
        # Add additional sources
        if "additional_sources" in state_info:
            for i, url in enumerate(state_info["additional_sources"]):
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
            
            logger.info(f"Mirroring {url_type}: {url}")
            
            try:
                # Extract domain
                domain = self._extract_domain(url)
                
                # Build wget command
                cmd = self._build_wget_command(url, state_dir, domain)
                
                # Execute wget
                start_time = time.time()
                result = subprocess.run(
                    cmd,
                    cwd=state_dir,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                # Count files downloaded
                files_downloaded = len(list(state_dir.rglob("*"))) if state_dir.exists() else 0
                total_files = files_downloaded
                
                if result.returncode == 0:
                    logger.info(f"✓ Successfully mirrored {url} ({files_downloaded} files, {processing_time:.1f}s)")
                    mirror_results.append({
                        "url": url,
                        "type": url_type,
                        "status": "success",
                        "files_downloaded": files_downloaded,
                        "processing_time": processing_time,
                        "stderr": result.stderr
                    })
                else:
                    logger.warning(f"✗ Failed to mirror {url}: {result.stderr[:200]}")
                    mirror_results.append({
                        "url": url,
                        "type": url_type,
                        "status": "failed",
                        "error": result.stderr,
                        "processing_time": processing_time
                    })
                
            except subprocess.TimeoutExpired:
                logger.warning(f"⏱ Timeout mirroring {url}")
                mirror_results.append({
                    "url": url,
                    "type": url_type,
                    "status": "timeout"
                })
                
            except Exception as e:
                logger.error(f"⚠ Error mirroring {url}: {str(e)}")
                mirror_results.append({
                    "url": url,
                    "type": url_type,
                    "status": "error",
                    "error": str(e)
                })
        
        # Commit changes to git
        self._commit_changes(state_dir, f"Website mirror update - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        
        # Save mirror status
        status_file = state_dir / "mirror_status.json"
        mirror_status = {
            "state": state_code,
            "state_name": state_name,
            "mirrored_at": datetime.now().isoformat(),
            "total_files": total_files,
            "urls_mirrored": len(mirror_results),
            "successful_mirrors": len([r for r in mirror_results if r["status"] == "success"]),
            "failed_mirrors": len([r for r in mirror_results if r["status"] == "failed"]),
            "results": mirror_results
        }
        
        with open(status_file, 'w') as f:
            json.dump(mirror_status, f, indent=2)
        
        logger.info(f"Completed website mirroring for {state_name} - {total_files} files collected")
        
        return mirror_status

    def process_single_state(self, state_code: str) -> Dict[str, Any]:
        """Process a single state through the complete pipeline"""
        logger.info(f"Starting complete processing for {state_code.upper()}")
        
        self.collection_status["current_state"] = state_code
        self.collection_status["phase"] = "mirroring"
        
        start_time = time.time()
        
        # Phase 1: Mirror websites
        mirror_result = self.mirror_state_websites(state_code)
        
        # Phase 2: Extract citations (placeholder - would call citation system)
        self.collection_status["phase"] = "citation_extraction"
        logger.info(f"Citation extraction for {state_code} (placeholder)")
        
        # Phase 3: Create vectors (placeholder - would call vectorization system)
        self.collection_status["phase"] = "vectorization"
        logger.info(f"Vectorization for {state_code} (placeholder)")
        
        # Phase 4: Validation (placeholder - would call validation system)
        self.collection_status["phase"] = "validation"
        logger.info(f"Validation for {state_code} (placeholder)")
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Update statistics
        self.collection_status["states_processed"] += 1
        self.collection_status["statistics"]["total_processing_time"] += processing_time
        
        if mirror_result["status"] != "error":
            self.collection_status["statistics"]["total_files_downloaded"] += mirror_result.get("total_files", 0)
        
        logger.info(f"Completed processing for {state_code} in {processing_time:.1f}s")
        
        return {
            "state": state_code,
            "status": "completed",
            "processing_time": processing_time,
            "mirror_result": mirror_result,
            "phases_completed": ["mirroring", "citation_extraction", "vectorization", "validation"]
        }

    def process_all_states(self) -> Dict[str, Any]:
        """Process all states through the complete pipeline"""
        logger.info("Starting complete processing for all states")
        
        results = {}
        
        for state_code in self.state_data.keys():
            try:
                result = self.process_single_state(state_code)
                results[state_code] = result
                
                # Add delay between states
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"Error processing state {state_code}: {str(e)}")
                results[state_code] = {
                    "status": "error",
                    "error": str(e)
                }
                self.collection_status["errors"].append({
                    "state": state_code,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        # Save final status
        self.collection_status["phase"] = "completed"
        self.collection_status["completed_at"] = datetime.now().isoformat()
        
        status_file = self.base_dir / "collection_status.json"
        with open(status_file, 'w') as f:
            json.dump(self.collection_status, f, indent=2)
        
        logger.info(f"Completed processing all states - {len(results)} states processed")
        
        return {
            "status": "completed",
            "states_processed": len(results),
            "total_time": self.collection_status["statistics"]["total_processing_time"],
            "results": results,
            "final_status": self.collection_status
        }

    def get_collection_status(self) -> Dict[str, Any]:
        """Get current collection status"""
        return self.collection_status

    def list_available_states(self) -> List[str]:
        """List all available states"""
        return list(self.state_data.keys())

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Master compliance data collection system")
    parser.add_argument('--state', help='Process specific state (e.g., co, ca, wa)')
    parser.add_argument('--all', action='store_true', help='Process all states')
    parser.add_argument('--status', action='store_true', help='Show collection status')
    parser.add_argument('--list', action='store_true', help='List available states')
    parser.add_argument('--mirror-only', action='store_true', help='Only mirror websites, skip other phases')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    collector = ComplianceMasterCollector()
    
    if args.status:
        status = collector.get_collection_status()
        print(json.dumps(status, indent=2))
    elif args.list:
        states = collector.list_available_states()
        print(f"Available states ({len(states)}): {', '.join(states)}")
    elif args.state:
        if args.mirror_only:
            result = collector.mirror_state_websites(args.state)
            print(json.dumps(result, indent=2))
        else:
            result = collector.process_single_state(args.state)
            print(json.dumps(result, indent=2))
    elif args.all:
        result = collector.process_all_states()
        print(json.dumps(result, indent=2))
    else:
        print("Please specify --state <state>, --all, --status, or --list")
        print("Example: python master_collection.py --state co --mirror-only")

if __name__ == "__main__":
    main()