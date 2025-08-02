#!/usr/bin/env python3
"""
Cannabis Regulation Website Mirror Script - Simplified Version
Downloads regulatory content using direct HTTP requests
"""

import os
import json
import logging
import requests
import time
import re
from datetime import datetime
from typing import Dict, List
from urllib.parse import urljoin, urlparse, quote
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleRegulationMirror:
    def __init__(self, base_dir: str = "regulations"):
        self.base_dir = base_dir
        self.state_sites = self._get_state_regulatory_sites()
        self.session = requests.Session()

        # Set up session with realistic headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })

    def _get_state_regulatory_sites(self) -> Dict[str, Dict[str, str]]:
        """Define main regulatory websites for each state with direct regulation URLs"""
        return {
            "CA": {
                "name": "California",
                "agency": "Department of Cannabis Control",
                "main_url": "https://cannabis.ca.gov",
                "regulation_urls": [
                    "https://cannabis.ca.gov/laws-and-regulations/",
                    "https://cannabis.ca.gov/licensees/",
                    "https://cannabis.ca.gov/about-us/laws-and-regulations/"
                ]
            },
            "CO": {
                "name": "Colorado",
                "agency": "Marijuana Enforcement Division",
                "main_url": "https://sbg.colorado.gov/med-enforcement",
                "regulation_urls": [
                    "https://sbg.colorado.gov/med-enforcement",
                    "https://www.colorado.gov/pacific/enforcement/med-rules-regulations"
                ]
            },
            "WA": {
                "name": "Washington",
                "agency": "Liquor and Cannabis Board",
                "main_url": "https://lcb.wa.gov/cannabis",
                "regulation_urls": [
                    "https://lcb.wa.gov/cannabis/laws-and-rules",
                    "https://lcb.wa.gov/cannabis"
                ]
            },
            "NY": {
                "name": "New York",
                "agency": "Office of Cannabis Management",
                "main_url": "https://cannabis.ny.gov",
                "regulation_urls": [
                    "https://cannabis.ny.gov/regulations",
                    "https://cannabis.ny.gov/adult-use"
                ]
            },
            "OR": {
                "name": "Oregon",
                "agency": "Oregon Liquor and Cannabis Commission",
                "main_url": "https://www.oregon.gov/olcc/marijuana",
                "regulation_urls": [
                    "https://www.oregon.gov/olcc/marijuana/Pages/default.aspx"
                ]
            }
        }

    def download_url_content(self, url: str, max_retries: int = 3) -> tuple:
        """Download content from a URL with retries"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Downloading: {url} (attempt {attempt + 1})")

                # Add delay between requests to be respectful
                if attempt > 0:
                    time.sleep(2 * attempt)

                response = self.session.get(url, timeout=30, verify=False, allow_redirects=True)

                if response.status_code == 200:
                    logger.info(f"Successfully downloaded: {url} ({len(response.content)} bytes)")
                    return True, response.content, response.text
                elif response.status_code == 403:
                    logger.warning(f"Access forbidden for {url}, trying different user agent")
                    # Try with different user agent
                    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
                    response = self.session.get(url, headers=headers, timeout=30, verify=False)
                    if response.status_code == 200:
                        return True, response.content, response.text
                else:
                    logger.warning(f"HTTP {response.status_code} for {url}")

            except requests.exceptions.SSLError:
                logger.warning(f"SSL error for {url}, trying HTTP")
                try:
                    http_url = url.replace('https://', 'http://')
                    response = self.session.get(http_url, timeout=30, allow_redirects=True)
                    if response.status_code == 200:
                        return True, response.content, response.text
                except Exception as e:
                    logger.warning(f"HTTP fallback failed: {e}")

            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")

        logger.error(f"Failed to download {url} after {max_retries} attempts")
        return False, None, None

    def extract_regulation_links(self, html_content: str, base_url: str) -> List[str]:
        """Extract relevant regulation links from HTML content"""
        if not html_content:
            return []

        links = []

        # Patterns to find regulation-related links
        patterns = [
            r'href=["\']([^"\']*(?:regulation|rule|law|cannabis|marijuana|licensing|compliance)[^"\']*)["\']',
            r'href=["\']([^"\']*\.pdf)["\']',
            r'href=["\']([^"\']*(?:/rules?|/laws?|/regs?)[^"\']*)["\']'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                try:
                    full_url = urljoin(base_url, match)
                    parsed = urlparse(full_url)

                    # Only include links from the same domain
                    base_domain = urlparse(base_url).netloc
                    if parsed.netloc == base_domain and full_url not in links:
                        links.append(full_url)

                except Exception:
                    continue

        return links[:10]  # Limit to 10 additional links

    def safe_filename(self, url: str, index: int = 0) -> str:
        """Create a safe filename from URL"""
        parsed = urlparse(url)
        path = parsed.path.strip('/')

        if path:
            # Use the last part of the path
            filename = path.split('/')[-1]
            if not filename or filename == '/':
                filename = f"page_{index}"
        else:
            filename = f"index_{index}" if index > 0 else "index"

        # Clean filename
        filename = re.sub(r'[^\w\-_\.]', '_', filename)

        # Add .html if no extension
        if '.' not in filename:
            filename += '.html'

        return filename

    def mirror_state_simple(self, state_code: str) -> bool:
        """Mirror regulatory content for a state using simple HTTP requests"""
        if state_code not in self.state_sites:
            logger.error(f"Unknown state: {state_code}")
            return False

        state_info = self.state_sites[state_code]
        state_dir = Path(self.base_dir) / state_code
        state_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Mirroring {state_info['name']} ({state_code})")

        total_files = 0
        total_size = 0
        downloaded_urls = []

        # Download main page and regulation pages
        urls_to_download = [state_info['main_url']] + state_info.get('regulation_urls', [])

        for i, url in enumerate(urls_to_download):
            try:
                success, content, html = self.download_url_content(url)

                if success and content:
                    # Save the content
                    filename = self.safe_filename(url, i)
                    file_path = state_dir / filename

                    with open(file_path, 'wb') as f:
                        f.write(content)

                    total_files += 1
                    total_size += len(content)
                    downloaded_urls.append(url)

                    logger.info(f"Saved: {filename} ({len(content)} bytes)")

                    # Try to extract and download additional regulation links
                    if html and i == 0:  # Only from main page to avoid too many requests
                        additional_links = self.extract_regulation_links(html, url)
                        logger.info(f"Found {len(additional_links)} additional regulation links")

                        for j, link_url in enumerate(additional_links[:5]):  # Limit to 5 additional
                            try:
                                link_success, link_content, _ = self.download_url_content(link_url)
                                if link_success and link_content:
                                    link_filename = self.safe_filename(link_url, i + j + 10)
                                    link_path = state_dir / link_filename

                                    with open(link_path, 'wb') as f:
                                        f.write(link_content)

                                    total_files += 1
                                    total_size += len(link_content)
                                    downloaded_urls.append(link_url)

                                    logger.info(f"Saved additional: {link_filename}")

                                    # Be respectful - add delay
                                    time.sleep(1)

                            except Exception as e:
                                logger.warning(f"Failed to download additional link {link_url}: {e}")
                                continue

                # Be respectful - add delay between main requests
                time.sleep(2)

            except Exception as e:
                logger.error(f"Failed to download {url}: {e}")
                continue

        # Create metadata
        metadata = {
            "state": state_code,
            "name": state_info['name'],
            "agency": state_info['agency'],
            "main_url": state_info['main_url'],
            "downloaded_urls": downloaded_urls,
            "last_updated": datetime.now().isoformat(),
            "total_files": total_files,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "mirror_success": total_files > 0
        }

        metadata_path = state_dir / 'metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Mirror complete for {state_code}: {total_files} files, {metadata['total_size_mb']} MB")
        return total_files > 0

    def mirror_all_states(self) -> Dict[str, bool]:
        """Mirror all states with simple HTTP approach"""
        logger.info("Starting simplified mirroring for all states")

        base_path = Path(self.base_dir)
        base_path.mkdir(exist_ok=True)

        results = {}
        for state_code in self.state_sites.keys():
            try:
                results[state_code] = self.mirror_state_simple(state_code)
                logger.info(f"State {state_code}: {'✅ Success' if results[state_code] else '❌ Failed'}")
            except Exception as e:
                logger.error(f"Error mirroring {state_code}: {e}")
                results[state_code] = False

        # Create summary
        summary = {
            "mirror_date": datetime.now().isoformat(),
            "total_states": len(self.state_sites),
            "successful_mirrors": sum(results.values()),
            "failed_mirrors": len(self.state_sites) - sum(results.values()),
            "results": results,
            "method": "simple_http"
        }

        summary_path = base_path / 'mirror_summary.json'
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)

        successful = sum(results.values())
        total = len(results)
        logger.info(f"Mirroring complete: {successful}/{total} states successful")

        return results

def main():
    """Main function"""
    logger.info("🌐 Starting Simple Regulation Mirror")

    mirror = SimpleRegulationMirror()
    results = mirror.mirror_all_states()

    successful = sum(results.values())
    total = len(results)

    print(f"\n📊 Mirror Results:")
    print(f"✅ Successful: {successful}/{total}")
    print(f"❌ Failed: {total - successful}/{total}")

    if successful > 0:
        print(f"\n📁 Downloaded content saved to 'regulations/' directory")

    if successful < total:
        print(f"\n⚠️  Failed states:")
        for state, success in results.items():
            if not success:
                print(f"   - {state}")

if __name__ == "__main__":
    main()