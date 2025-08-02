#!/usr/bin/env python3
"""
Wget-based Website Mirroring System for Cannabis Compliance Sites

Uses recursive wget to download entire state regulatory websites,
preserving directory structure and enabling change detection.
"""

import os
import subprocess
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('wget_mirror.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class WgetMirror:
    """Wget-based website mirroring system"""
    
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.mirrors_dir = self.base_dir / "mirrors"
        self.mirrors_dir.mkdir(exist_ok=True)
        
        # Load state sources
        with open(self.base_dir / "state_sources.json", 'r') as f:
            self.state_sources = json.load(f)
        
        # Mirror configuration
        self.wget_config = {
            "max_depth": 4,
            "wait_time": 2,  # seconds between requests
            "timeout": 30,
            "retries": 3,
            "user_agent": "Mozilla/5.0 (compatible; ComplianceBot/1.0; +https://formul8.ai/bot)",
            "accept_extensions": [
                "html", "htm", "pdf", "doc", "docx", "xls", "xlsx", 
                "txt", "xml", "json", "csv", "zip", "rtf"
            ],
            "reject_extensions": [
                "jpg", "jpeg", "png", "gif", "svg", "ico", "css", "js",
                "mp3", "mp4", "avi", "mov", "wmv", "flv", "swf"
            ]
        }
        
        # Mirror status tracking
        self.mirror_status = {
            "started_at": datetime.now().isoformat(),
            "states": {},
            "total_mirrors": 0,
            "completed_mirrors": 0,
            "failed_mirrors": 0,
            "total_files": 0,
            "total_size": 0
        }
        
        # Thread safety
        self.lock = threading.Lock()

    def create_wget_command(self, url: str, output_dir: Path, domain_limit: bool = True) -> List[str]:
        """Create wget command with appropriate options"""
        
        # Base wget command
        cmd = [
            "wget",
            "--recursive",
            "--no-clobber",
            "--page-requisites",
            "--html-extension",
            "--convert-links",
            "--restrict-file-names=windows",
            "--no-parent",
            "--timestamping",
            "--mirror",
            f"--level={self.wget_config['max_depth']}",
            f"--wait={self.wget_config['wait_time']}",
            f"--timeout={self.wget_config['timeout']}",
            f"--tries={self.wget_config['retries']}",
            f"--user-agent={self.wget_config['user_agent']}",
            f"--directory-prefix={output_dir}",
            "--continue",
            "--progress=bar:force",
            "--show-progress"
        ]
        
        # Domain restrictions
        if domain_limit:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            cmd.extend([
                f"--domains={domain}",
                "--span-hosts"
            ])
        
        # Accept/reject file types
        accept_list = ",".join(self.wget_config["accept_extensions"])
        reject_list = ",".join(self.wget_config["reject_extensions"])
        
        cmd.extend([
            f"--accept={accept_list}",
            f"--reject={reject_list}"
        ])
        
        # Additional options for compliance sites
        cmd.extend([
            "--ignore-case",
            "--follow-ftp",
            "--adjust-extension",
            "--backup-converted",
            "--execute", "robots=off",  # Ignore robots.txt for compliance data
            "--header", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "--header", "Accept-Language: en-US,en;q=0.5",
            "--header", "Accept-Encoding: gzip, deflate",
            "--header", "Connection: keep-alive",
            "--header", "Upgrade-Insecure-Requests: 1"
        ])
        
        # Add the URL
        cmd.append(url)
        
        return cmd

    def mirror_state_website(self, state_key: str, state_data: Dict) -> Dict:
        """Mirror a single state's regulatory website"""
        logger.info(f"Starting mirror for {state_data['state_name']}")
        
        # Create state mirror directory
        state_mirror_dir = self.mirrors_dir / state_key
        state_mirror_dir.mkdir(exist_ok=True)
        
        # Initialize state status
        state_status = {
            "state": state_key,
            "state_name": state_data['state_name'],
            "started_at": datetime.now().isoformat(),
            "status": "in_progress",
            "urls_mirrored": [],
            "files_downloaded": 0,
            "total_size": 0,
            "errors": [],
            "warnings": []
        }
        
        # Get all URLs to mirror
        urls_to_mirror = []
        
        # Primary URLs
        if state_data.get('main_url'):
            urls_to_mirror.append(state_data['main_url'])
        
        if state_data.get('regulations_url'):
            urls_to_mirror.append(state_data['regulations_url'])
        
        # Additional sources
        for url in state_data.get('additional_sources', []):
            if url and url not in urls_to_mirror:
                urls_to_mirror.append(url)
        
        # Mirror each URL
        for url in urls_to_mirror:
            try:
                logger.info(f"Mirroring {url}")
                
                # Create subdirectory for this URL
                from urllib.parse import urlparse
                domain = urlparse(url).netloc.replace('.', '_')
                url_dir = state_mirror_dir / domain
                url_dir.mkdir(exist_ok=True)
                
                # Create wget command
                wget_cmd = self.create_wget_command(url, url_dir)
                
                # Log the command (for debugging)
                logger.debug(f"Wget command: {' '.join(wget_cmd)}")
                
                # Execute wget
                result = subprocess.run(
                    wget_cmd,
                    capture_output=True,
                    text=True,
                    timeout=3600  # 1 hour timeout
                )
                
                if result.returncode == 0:
                    logger.info(f"Successfully mirrored {url}")
                    state_status["urls_mirrored"].append(url)
                    
                    # Count downloaded files
                    file_count = sum(1 for _ in url_dir.rglob("*") if _.is_file())
                    state_status["files_downloaded"] += file_count
                    
                    # Calculate total size
                    total_size = sum(f.stat().st_size for f in url_dir.rglob("*") if f.is_file())
                    state_status["total_size"] += total_size
                    
                else:
                    error_msg = f"Wget failed for {url}: {result.stderr}"
                    logger.error(error_msg)
                    state_status["errors"].append(error_msg)
                
                # Brief pause between URLs
                time.sleep(5)
                
            except subprocess.TimeoutExpired:
                error_msg = f"Wget timeout for {url}"
                logger.error(error_msg)
                state_status["errors"].append(error_msg)
                
            except Exception as e:
                error_msg = f"Error mirroring {url}: {str(e)}"
                logger.error(error_msg)
                state_status["errors"].append(error_msg)
        
        # Finalize state status
        state_status["completed_at"] = datetime.now().isoformat()
        state_status["status"] = "completed" if not state_status["errors"] else "completed_with_errors"
        
        # Save state mirror metadata
        metadata_file = state_mirror_dir / "mirror_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(state_status, f, indent=2)
        
        # Update global status
        with self.lock:
            self.mirror_status["completed_mirrors"] += 1
            self.mirror_status["total_files"] += state_status["files_downloaded"]
            self.mirror_status["total_size"] += state_status["total_size"]
            
            if state_status["errors"]:
                self.mirror_status["failed_mirrors"] += 1
        
        logger.info(f"Mirror completed for {state_data['state_name']}: "
                   f"{state_status['files_downloaded']} files, "
                   f"{state_status['total_size'] / 1024 / 1024:.1f} MB")
        
        return state_status

    def mirror_all_states(self, max_workers: int = 3) -> Dict:
        """Mirror all state regulatory websites"""
        logger.info("Starting comprehensive website mirroring for all states")
        
        states = self.state_sources['cannabis_legal_states']
        self.mirror_status["total_mirrors"] = len(states)
        
        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all mirroring tasks
            future_to_state = {
                executor.submit(self.mirror_state_website, state_key, state_data): state_key
                for state_key, state_data in states.items()
            }
            
            # Collect results
            for future in as_completed(future_to_state):
                state_key = future_to_state[future]
                try:
                    state_status = future.result()
                    self.mirror_status["states"][state_key] = state_status
                    
                    logger.info(f"Completed mirror for {state_key}")
                    
                except Exception as e:
                    logger.error(f"Error mirroring {state_key}: {str(e)}")
                    self.mirror_status["states"][state_key] = {
                        "status": "failed",
                        "error": str(e)
                    }
        
        # Save overall mirror status
        self.mirror_status["completed_at"] = datetime.now().isoformat()
        status_file = self.mirrors_dir / "mirror_status.json"
        with open(status_file, 'w') as f:
            json.dump(self.mirror_status, f, indent=2)
        
        logger.info("Website mirroring completed")
        logger.info(f"Total files downloaded: {self.mirror_status['total_files']}")
        logger.info(f"Total size: {self.mirror_status['total_size'] / 1024 / 1024:.1f} MB")
        
        return self.mirror_status

    def mirror_single_state(self, state_key: str) -> Dict:
        """Mirror a single state's website"""
        if state_key not in self.state_sources['cannabis_legal_states']:
            raise ValueError(f"Unknown state: {state_key}")
        
        state_data = self.state_sources['cannabis_legal_states'][state_key]
        return self.mirror_state_website(state_key, state_data)

    def check_for_changes(self, state_key: str) -> Dict:
        """Check for changes in a state's mirrored content"""
        logger.info(f"Checking for changes in {state_key}")
        
        state_mirror_dir = self.mirrors_dir / state_key
        
        if not state_mirror_dir.exists():
            return {"status": "no_mirror", "message": "No previous mirror found"}
        
        # Initialize Git repository if not exists
        git_dir = state_mirror_dir / ".git"
        if not git_dir.exists():
            self._init_git_repo(state_mirror_dir)
        
        # Check Git status
        try:
            # Get current status
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=state_mirror_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return {"status": "error", "message": "Git status check failed"}
            
            changes = result.stdout.strip()
            
            if not changes:
                return {"status": "no_changes", "message": "No changes detected"}
            
            # Parse changes
            change_summary = {
                "status": "changes_detected",
                "modified_files": [],
                "new_files": [],
                "deleted_files": [],
                "total_changes": 0
            }
            
            for line in changes.split('\n'):
                if line.strip():
                    status = line[:2]
                    filename = line[3:]
                    
                    if status.startswith('M'):
                        change_summary["modified_files"].append(filename)
                    elif status.startswith('A') or status.startswith('??'):
                        change_summary["new_files"].append(filename)
                    elif status.startswith('D'):
                        change_summary["deleted_files"].append(filename)
                    
                    change_summary["total_changes"] += 1
            
            # Commit changes
            self._commit_changes(state_mirror_dir, change_summary)
            
            return change_summary
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _init_git_repo(self, repo_dir: Path):
        """Initialize Git repository in mirror directory"""
        logger.info(f"Initializing Git repository in {repo_dir}")
        
        try:
            # Initialize repo
            subprocess.run(["git", "init"], cwd=repo_dir, check=True)
            
            # Configure Git
            subprocess.run(["git", "config", "user.name", "Compliance Bot"], cwd=repo_dir, check=True)
            subprocess.run(["git", "config", "user.email", "compliance@formul8.ai"], cwd=repo_dir, check=True)
            
            # Create .gitignore
            gitignore_path = repo_dir / ".gitignore"
            with open(gitignore_path, 'w') as f:
                f.write("# Ignore log files\n")
                f.write("*.log\n")
                f.write("# Ignore temporary files\n")
                f.write("*.tmp\n")
                f.write("*.temp\n")
                f.write("# Ignore system files\n")
                f.write(".DS_Store\n")
                f.write("Thumbs.db\n")
            
            # Initial commit
            subprocess.run(["git", "add", "."], cwd=repo_dir, check=True)
            subprocess.run(["git", "commit", "-m", "Initial mirror"], cwd=repo_dir, check=True)
            
            logger.info("Git repository initialized successfully")
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Error initializing Git repository: {e}")
            raise

    def _commit_changes(self, repo_dir: Path, change_summary: Dict):
        """Commit changes to Git repository"""
        try:
            # Add all changes
            subprocess.run(["git", "add", "."], cwd=repo_dir, check=True)
            
            # Create commit message
            commit_msg = f"Regulatory update: {change_summary['total_changes']} changes\n\n"
            
            if change_summary["new_files"]:
                commit_msg += f"New files ({len(change_summary['new_files'])}):\n"
                for f in change_summary["new_files"][:10]:  # Limit to first 10
                    commit_msg += f"  + {f}\n"
                if len(change_summary["new_files"]) > 10:
                    commit_msg += f"  ... and {len(change_summary['new_files']) - 10} more\n"
                commit_msg += "\n"
            
            if change_summary["modified_files"]:
                commit_msg += f"Modified files ({len(change_summary['modified_files'])}):\n"
                for f in change_summary["modified_files"][:10]:
                    commit_msg += f"  ~ {f}\n"
                if len(change_summary["modified_files"]) > 10:
                    commit_msg += f"  ... and {len(change_summary['modified_files']) - 10} more\n"
                commit_msg += "\n"
            
            if change_summary["deleted_files"]:
                commit_msg += f"Deleted files ({len(change_summary['deleted_files'])}):\n"
                for f in change_summary["deleted_files"][:10]:
                    commit_msg += f"  - {f}\n"
                if len(change_summary["deleted_files"]) > 10:
                    commit_msg += f"  ... and {len(change_summary['deleted_files']) - 10} more\n"
            
            # Commit changes
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=repo_dir, check=True)
            
            logger.info(f"Changes committed: {change_summary['total_changes']} files")
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Error committing changes: {e}")

    def generate_change_report(self, state_key: str, days_back: int = 30) -> Dict:
        """Generate change report for a state over specified time period"""
        state_mirror_dir = self.mirrors_dir / state_key
        
        if not (state_mirror_dir / ".git").exists():
            return {"status": "no_git", "message": "No Git history found"}
        
        try:
            # Get commit history
            result = subprocess.run([
                "git", "log", "--oneline", "--since", f"{days_back} days ago"
            ], cwd=state_mirror_dir, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {"status": "error", "message": "Git log failed"}
            
            commits = result.stdout.strip().split('\n') if result.stdout.strip() else []
            
            # Get file change statistics
            stats_result = subprocess.run([
                "git", "diff", "--stat", f"HEAD~{len(commits)}", "HEAD"
            ], cwd=state_mirror_dir, capture_output=True, text=True)
            
            return {
                "status": "success",
                "period_days": days_back,
                "total_commits": len(commits),
                "recent_commits": commits[:5],  # Last 5 commits
                "change_statistics": stats_result.stdout if stats_result.returncode == 0 else None
            }
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Wget-based website mirroring for compliance data")
    parser.add_argument('--state', help='Mirror specific state only')
    parser.add_argument('--all', action='store_true', help='Mirror all states')
    parser.add_argument('--check-changes', help='Check for changes in specific state')
    parser.add_argument('--report', help='Generate change report for specific state')
    parser.add_argument('--days', type=int, default=30, help='Days back for change report')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    # Check if wget is available
    if not shutil.which('wget'):
        print("Error: wget is not installed. Please install wget first.")
        print("Ubuntu/Debian: sudo apt-get install wget")
        print("macOS: brew install wget")
        print("CentOS/RHEL: sudo yum install wget")
        return
    
    mirror = WgetMirror()
    
    if args.state:
        result = mirror.mirror_single_state(args.state)
        print(f"Mirror result: {result}")
    elif args.all:
        result = mirror.mirror_all_states()
        print(f"Mirror result: {result}")
    elif args.check_changes:
        result = mirror.check_for_changes(args.check_changes)
        print(f"Change check result: {result}")
    elif args.report:
        result = mirror.generate_change_report(args.report, args.days)
        print(f"Change report: {result}")
    else:
        print("Please specify --state <state_name>, --all, --check-changes <state>, or --report <state>")
        print("Available states:")
        for state_key in mirror.state_sources['cannabis_legal_states'].keys():
            print(f"  {state_key}")

if __name__ == "__main__":
    main()