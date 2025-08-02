#!/usr/bin/env python3
"""
Comprehensive Cannabis Compliance Data Collection System

This script performs deep web scraping of official government cannabis compliance websites
for all legal states, downloading complete regulatory documents and PDFs.
"""

import asyncio
import aiohttp
import json
import os
import logging
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import requests
from datetime import datetime
import hashlib
import mimetypes
import re
from typing import Dict, List, Set, Optional
import time
from concurrent.futures import ThreadPoolExecutor
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('compliance_collection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComplianceDataCollector:
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.states_dir = self.base_dir / "states"
        self.states_dir.mkdir(parents=True, exist_ok=True)
        
        # Load state sources
        with open(self.base_dir / "state_sources.json", 'r') as f:
            self.state_sources = json.load(f)
        
        # Collection status tracking
        self.collection_status = {
            "last_updated": datetime.now().isoformat(),
            "states": {},
            "total_pages": 0,
            "total_pdfs": 0,
            "total_errors": 0
        }
        
        # Rate limiting
        self.request_delay = 2.0  # 2 seconds between requests
        self.max_concurrent = 5   # Maximum concurrent requests
        self.session_timeout = 30 # Request timeout in seconds
        
        # File tracking
        self.downloaded_files = set()
        self.visited_urls = set()
        self.failed_urls = set()
        
        # Thread-safe counters
        self.lock = threading.Lock()
        self.page_count = 0
        self.pdf_count = 0
        self.error_count = 0

    def create_state_directory(self, state_key: str) -> Path:
        """Create directory structure for a state"""
        state_dir = self.states_dir / state_key
        
        # Create subdirectories
        subdirs = ['regulations', 'pdfs', 'processed', 'logs']
        for subdir in subdirs:
            (state_dir / subdir).mkdir(parents=True, exist_ok=True)
        
        return state_dir

    def is_valid_url(self, url: str, base_domain: str) -> bool:
        """Check if URL is valid and within the same domain"""
        try:
            parsed = urlparse(url)
            base_parsed = urlparse(base_domain)
            
            # Must be same domain or subdomain
            if not (parsed.netloc == base_parsed.netloc or 
                   parsed.netloc.endswith('.' + base_parsed.netloc)):
                return False
            
            # Skip certain file types and fragments
            skip_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.ico']
            if any(url.lower().endswith(ext) for ext in skip_extensions):
                return False
            
            # Skip fragments and mailto links
            if parsed.fragment or url.startswith('mailto:'):
                return False
            
            return True
        except Exception:
            return False

    def is_pdf_url(self, url: str) -> bool:
        """Check if URL points to a PDF file"""
        return url.lower().endswith('.pdf') or 'pdf' in url.lower()

    def sanitize_filename(self, filename: str) -> str:
        """Create a safe filename from URL or title"""
        # Remove invalid characters
        filename = re.sub(r'[^\w\-_\. ]', '', filename)
        filename = re.sub(r'\s+', '_', filename)
        filename = filename[:100]  # Limit length
        return filename

    async def download_file(self, session: aiohttp.ClientSession, url: str, 
                          filepath: Path, file_type: str = "html") -> bool:
        """Download a file asynchronously"""
        try:
            logger.info(f"Downloading {file_type}: {url}")
            
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=self.session_timeout)) as response:
                if response.status == 200:
                    content = await response.read()
                    
                    # Create directory if it doesn't exist
                    filepath.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Write file
                    with open(filepath, 'wb') as f:
                        f.write(content)
                    
                    # Update counters
                    with self.lock:
                        if file_type == "pdf":
                            self.pdf_count += 1
                        else:
                            self.page_count += 1
                    
                    logger.info(f"Successfully downloaded: {filepath}")
                    return True
                else:
                    logger.warning(f"Failed to download {url}: HTTP {response.status}")
                    return False
        
        except Exception as e:
            logger.error(f"Error downloading {url}: {str(e)}")
            with self.lock:
                self.error_count += 1
            return False

    async def scrape_page(self, session: aiohttp.ClientSession, url: str, 
                         state_dir: Path, depth: int = 0) -> List[str]:
        """Scrape a single page and return found links"""
        if depth > 3 or url in self.visited_urls:  # Limit recursion depth
            return []
        
        self.visited_urls.add(url)
        
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=self.session_timeout)) as response:
                if response.status != 200:
                    return []
                
                content = await response.text()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Save HTML content
                url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
                filename = f"{url_hash}_{self.sanitize_filename(soup.title.string if soup.title else 'page')}.html"
                html_path = state_dir / "regulations" / filename
                
                with open(html_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Extract metadata
                metadata = {
                    "url": url,
                    "title": soup.title.string if soup.title else "",
                    "scraped_at": datetime.now().isoformat(),
                    "depth": depth,
                    "file_path": str(html_path)
                }
                
                # Save metadata
                metadata_path = state_dir / "processed" / f"{url_hash}_metadata.json"
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                # Find all links
                links = []
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    absolute_url = urljoin(url, href)
                    
                    if self.is_valid_url(absolute_url, url):
                        links.append(absolute_url)
                
                logger.info(f"Scraped {url}: found {len(links)} links")
                return links
        
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return []

    async def collect_state_data(self, state_key: str, state_data: Dict) -> Dict:
        """Collect all compliance data for a single state"""
        logger.info(f"Starting collection for {state_data['state_name']}")
        
        state_dir = self.create_state_directory(state_key)
        
        # Initialize state status
        state_status = {
            "state_name": state_data['state_name'],
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "status": "in_progress",
            "pages_collected": 0,
            "pdfs_collected": 0,
            "errors": 0,
            "urls_processed": []
        }
        
        # Collect all URLs to process
        urls_to_process = [
            state_data['main_url'],
            state_data['regulations_url']
        ] + state_data.get('additional_sources', [])
        
        # Remove duplicates
        urls_to_process = list(set(urls_to_process))
        
        async with aiohttp.ClientSession() as session:
            # Process each URL
            for url in urls_to_process:
                try:
                    logger.info(f"Processing URL: {url}")
                    
                    # Scrape the page and get links
                    links = await self.scrape_page(session, url, state_dir)
                    
                    # Process PDFs immediately
                    pdf_links = [link for link in links if self.is_pdf_url(link)]
                    for pdf_url in pdf_links:
                        if pdf_url not in self.downloaded_files:
                            pdf_filename = self.sanitize_filename(os.path.basename(pdf_url))
                            if not pdf_filename.endswith('.pdf'):
                                pdf_filename += '.pdf'
                            
                            pdf_path = state_dir / "pdfs" / pdf_filename
                            
                            if await self.download_file(session, pdf_url, pdf_path, "pdf"):
                                self.downloaded_files.add(pdf_url)
                    
                    # Process regular links (depth-first traversal)
                    semaphore = asyncio.Semaphore(self.max_concurrent)
                    
                    async def process_link(link):
                        async with semaphore:
                            await asyncio.sleep(self.request_delay)
                            return await self.scrape_page(session, link, state_dir, depth=1)
                    
                    # Process links in batches
                    regular_links = [link for link in links if not self.is_pdf_url(link)]
                    tasks = [process_link(link) for link in regular_links[:50]]  # Limit to 50 links per page
                    
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    # Process second-level links for PDFs
                    for result in results:
                        if isinstance(result, list):
                            second_level_pdfs = [link for link in result if self.is_pdf_url(link)]
                            for pdf_url in second_level_pdfs:
                                if pdf_url not in self.downloaded_files:
                                    pdf_filename = self.sanitize_filename(os.path.basename(pdf_url))
                                    if not pdf_filename.endswith('.pdf'):
                                        pdf_filename += '.pdf'
                                    
                                    pdf_path = state_dir / "pdfs" / pdf_filename
                                    
                                    if await self.download_file(session, pdf_url, pdf_path, "pdf"):
                                        self.downloaded_files.add(pdf_url)
                    
                    state_status["urls_processed"].append(url)
                    
                except Exception as e:
                    logger.error(f"Error processing {url}: {str(e)}")
                    state_status["errors"] += 1
        
        # Finalize state status
        state_status["completed_at"] = datetime.now().isoformat()
        state_status["status"] = "completed"
        state_status["pages_collected"] = self.page_count
        state_status["pdfs_collected"] = self.pdf_count
        
        # Save state metadata
        metadata_path = state_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(state_status, f, indent=2)
        
        logger.info(f"Completed collection for {state_data['state_name']}: "
                   f"{self.page_count} pages, {self.pdf_count} PDFs")
        
        return state_status

    async def collect_all_states(self):
        """Collect compliance data for all states"""
        logger.info("Starting comprehensive compliance data collection")
        
        states = self.state_sources['cannabis_legal_states']
        
        # Prioritize adult-use states
        adult_use_states = {k: v for k, v in states.items() if v['status'] == 'legal_adult_use'}
        medical_states = {k: v for k, v in states.items() if v['status'] == 'medical_only'}
        
        # Process adult-use states first
        for state_key, state_data in adult_use_states.items():
            try:
                # Reset counters for each state
                self.page_count = 0
                self.pdf_count = 0
                self.error_count = 0
                
                state_status = await self.collect_state_data(state_key, state_data)
                self.collection_status["states"][state_key] = state_status
                
                # Update global counters
                self.collection_status["total_pages"] += state_status["pages_collected"]
                self.collection_status["total_pdfs"] += state_status["pdfs_collected"]
                self.collection_status["total_errors"] += state_status["errors"]
                
                # Save progress
                await self.save_collection_status()
                
                # Brief pause between states
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Failed to collect data for {state_key}: {str(e)}")
                self.collection_status["states"][state_key] = {
                    "status": "failed",
                    "error": str(e)
                }
        
        # Process medical states
        for state_key, state_data in medical_states.items():
            try:
                # Reset counters for each state
                self.page_count = 0
                self.pdf_count = 0
                self.error_count = 0
                
                state_status = await self.collect_state_data(state_key, state_data)
                self.collection_status["states"][state_key] = state_status
                
                # Update global counters
                self.collection_status["total_pages"] += state_status["pages_collected"]
                self.collection_status["total_pdfs"] += state_status["pdfs_collected"]
                self.collection_status["total_errors"] += state_status["errors"]
                
                # Save progress
                await self.save_collection_status()
                
                # Brief pause between states
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Failed to collect data for {state_key}: {str(e)}")
                self.collection_status["states"][state_key] = {
                    "status": "failed",
                    "error": str(e)
                }
        
        # Final status update
        self.collection_status["completed_at"] = datetime.now().isoformat()
        await self.save_collection_status()
        
        logger.info("Compliance data collection completed")
        logger.info(f"Total pages collected: {self.collection_status['total_pages']}")
        logger.info(f"Total PDFs collected: {self.collection_status['total_pdfs']}")
        logger.info(f"Total errors: {self.collection_status['total_errors']}")

    async def save_collection_status(self):
        """Save collection status to file"""
        status_path = self.base_dir / "collection_status.json"
        with open(status_path, 'w') as f:
            json.dump(self.collection_status, f, indent=2)

    async def collect_single_state(self, state_key: str):
        """Collect data for a single state"""
        if state_key not in self.state_sources['cannabis_legal_states']:
            logger.error(f"Unknown state: {state_key}")
            return
        
        state_data = self.state_sources['cannabis_legal_states'][state_key]
        state_status = await self.collect_state_data(state_key, state_data)
        
        self.collection_status["states"][state_key] = state_status
        await self.save_collection_status()

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Collect cannabis compliance data")
    parser.add_argument('--state', help='Collect data for specific state only')
    parser.add_argument('--all', action='store_true', help='Collect data for all states')
    parser.add_argument('--resume', action='store_true', help='Resume previous collection')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    collector = ComplianceDataCollector()
    
    if args.state:
        asyncio.run(collector.collect_single_state(args.state))
    elif args.all:
        asyncio.run(collector.collect_all_states())
    else:
        print("Please specify --state <state_name> or --all")
        print("Available states:")
        for state_key in collector.state_sources['cannabis_legal_states'].keys():
            print(f"  {state_key}")

if __name__ == "__main__":
    main()