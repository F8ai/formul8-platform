#!/usr/bin/env python3
"""
Automated Sitemap Collection and Processing for Cannabis Regulatory Sites

This script provides automated collection, processing, and analysis of regulatory
website sitemaps with integration to xml-sitemaps.com functionality.
"""

import requests
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, urljoin, quote
import subprocess
import re

class AutomatedSitemapCollector:
    """Automated sitemap collection and processing system"""
    
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.sitemaps_dir = os.path.join(self.base_dir, 'sitemaps')
        self.collected_dir = os.path.join(self.base_dir, 'collected_content')
        
        # Cannabis regulatory sites with comprehensive details
        self.regulatory_sites = {
            'colorado': {
                'name': 'Colorado Marijuana Enforcement Division',
                'base_url': 'https://sbg.colorado.gov/med',
                'sitemap_url': 'https://sbg.colorado.gov/sitemap.xml',
                'robots_url': 'https://sbg.colorado.gov/robots.txt',
                'key_sections': ['rules', 'regulations', 'licensing', 'forms', 'enforcement']
            },
            'california': {
                'name': 'California Cannabis Control Commission',
                'base_url': 'https://cannabis.ca.gov',
                'sitemap_url': 'https://cannabis.ca.gov/sitemap.xml',
                'robots_url': 'https://cannabis.ca.gov/robots.txt',
                'key_sections': ['laws', 'regulations', 'licensing', 'resources', 'rulemaking']
            },
            'washington': {
                'name': 'Washington State Liquor and Cannabis Board',
                'base_url': 'https://lcb.wa.gov',
                'sitemap_url': 'https://lcb.wa.gov/sitemap.xml',
                'robots_url': 'https://lcb.wa.gov/robots.txt',
                'key_sections': ['laws', 'rules', 'licensing', 'marijuana', 'enforcement']
            },
            'oregon': {
                'name': 'Oregon Liquor and Cannabis Commission',
                'base_url': 'https://www.oregon.gov/olcc',
                'sitemap_url': 'https://www.oregon.gov/olcc/sitemap.xml',
                'robots_url': 'https://www.oregon.gov/olcc/robots.txt',
                'key_sections': ['marijuana', 'rules', 'licensing', 'pages', 'recreational']
            },
            'nevada': {
                'name': 'Nevada Cannabis Compliance Board',
                'base_url': 'https://ccb.nv.gov',
                'sitemap_url': 'https://ccb.nv.gov/sitemap.xml',
                'robots_url': 'https://ccb.nv.gov/robots.txt',
                'key_sections': ['laws', 'regulations', 'licensing', 'resources', 'compliance']
            }
        }
        
        self.ensure_directories()
    
    def ensure_directories(self):
        """Create necessary directory structure"""
        os.makedirs(self.sitemaps_dir, exist_ok=True)
        os.makedirs(self.collected_dir, exist_ok=True)
        
        for state in self.regulatory_sites.keys():
            os.makedirs(os.path.join(self.sitemaps_dir, state), exist_ok=True)
            os.makedirs(os.path.join(self.collected_dir, state), exist_ok=True)
    
    def fetch_existing_sitemap(self, state: str) -> Optional[str]:
        """Attempt to fetch existing XML sitemap from regulatory site"""
        site_info = self.regulatory_sites[state]
        
        print(f"Checking for existing sitemap: {site_info['sitemap_url']}")
        
        try:
            response = requests.get(site_info['sitemap_url'], timeout=30)
            if response.status_code == 200 and 'xml' in response.headers.get('content-type', ''):
                # Save the sitemap
                sitemap_path = os.path.join(self.sitemaps_dir, state, 'official_sitemap.xml')
                with open(sitemap_path, 'w', encoding='utf-8') as f:
                    f.write(response.text)
                
                print(f"✓ Official sitemap saved: {sitemap_path}")
                return sitemap_path
            else:
                print(f"→ No official sitemap found (HTTP {response.status_code})")
                return None
                
        except requests.RequestException as e:
            print(f"→ Error fetching sitemap: {e}")
            return None
    
    def generate_comprehensive_sitemap(self, state: str) -> str:
        """Generate comprehensive sitemap through crawling and discovery"""
        site_info = self.regulatory_sites[state]
        base_url = site_info['base_url']
        
        print(f"Generating comprehensive sitemap for {state.upper()}")
        
        # Use multiple discovery methods
        discovered_urls = set()
        
        # Method 1: Check robots.txt
        robots_urls = self.discover_from_robots(state)
        discovered_urls.update(robots_urls)
        
        # Method 2: Crawl key sections
        section_urls = self.crawl_key_sections(state)
        discovered_urls.update(section_urls)
        
        # Method 3: Search for common regulatory patterns
        pattern_urls = self.discover_regulatory_patterns(state)
        discovered_urls.update(pattern_urls)
        
        # Create comprehensive sitemap XML
        sitemap_path = self.create_sitemap_xml(state, discovered_urls)
        
        print(f"✓ Comprehensive sitemap created: {sitemap_path}")
        print(f"  Total URLs discovered: {len(discovered_urls)}")
        
        return sitemap_path
    
    def discover_from_robots(self, state: str) -> List[str]:
        """Discover URLs from robots.txt file"""
        site_info = self.regulatory_sites[state]
        robots_url = site_info['robots_url']
        
        urls = []
        try:
            response = requests.get(robots_url, timeout=15)
            if response.status_code == 200:
                robots_content = response.text
                
                # Extract sitemap URLs from robots.txt
                sitemap_matches = re.findall(r'Sitemap:\s*(.+)', robots_content, re.IGNORECASE)
                urls.extend(sitemap_matches)
                
                # Extract disallowed paths (often contain important regulatory content)
                disallow_matches = re.findall(r'Disallow:\s*(.+)', robots_content)
                base_url = site_info['base_url']
                for path in disallow_matches:
                    if path.strip() and path != '/':
                        full_url = urljoin(base_url, path.strip())
                        urls.append(full_url)
                
                print(f"  Discovered {len(urls)} URLs from robots.txt")
        
        except requests.RequestException as e:
            print(f"  Error fetching robots.txt: {e}")
        
        return urls
    
    def crawl_key_sections(self, state: str) -> List[str]:
        """Crawl key regulatory sections to discover URLs"""
        site_info = self.regulatory_sites[state]
        base_url = site_info['base_url']
        key_sections = site_info['key_sections']
        
        urls = []
        
        for section in key_sections:
            section_url = urljoin(base_url, f"/{section}")
            try:
                print(f"  Crawling section: {section_url}")
                response = requests.get(section_url, timeout=20)
                if response.status_code == 200:
                    # Extract links from HTML content
                    html_content = response.text
                    
                    # Simple regex to find href links
                    link_matches = re.findall(r'href=[\'"]([^\'"]+)[\'"]', html_content, re.IGNORECASE)
                    
                    for link in link_matches:
                        # Convert relative URLs to absolute
                        if link.startswith('/'):
                            full_url = urljoin(base_url, link)
                        elif link.startswith('http'):
                            # Only include URLs from the same domain
                            if urlparse(link).netloc == urlparse(base_url).netloc:
                                full_url = link
                            else:
                                continue
                        else:
                            full_url = urljoin(section_url, link)
                        
                        # Filter for regulatory content
                        if self.is_regulatory_content(full_url):
                            urls.append(full_url)
                
                time.sleep(1)  # Be respectful to servers
                
            except requests.RequestException as e:
                print(f"  Error crawling {section}: {e}")
        
        print(f"  Discovered {len(urls)} URLs from key sections")
        return list(set(urls))  # Remove duplicates
    
    def discover_regulatory_patterns(self, state: str) -> List[str]:
        """Discover URLs matching regulatory content patterns"""
        site_info = self.regulatory_sites[state]
        base_url = site_info['base_url']
        
        # Common regulatory URL patterns
        patterns = [
            '/rules', '/regulations', '/laws', '/statutes',
            '/licensing', '/permits', '/applications', '/forms',
            '/compliance', '/enforcement', '/violations',
            '/guidance', '/advisories', '/bulletins',
            '/cannabis', '/marijuana', '/hemp',
            '/administrative-rules', '/emergency-rules',
            '/proposed-rules', '/final-rules'
        ]
        
        urls = []
        for pattern in patterns:
            test_url = urljoin(base_url, pattern)
            try:
                response = requests.head(test_url, timeout=10)
                if response.status_code == 200:
                    urls.append(test_url)
                    print(f"  Found regulatory section: {test_url}")
            except requests.RequestException:
                pass  # URL doesn't exist, continue
        
        return urls
    
    def is_regulatory_content(self, url: str) -> bool:
        """Check if URL likely contains regulatory content"""
        regulatory_keywords = [
            'rule', 'regulation', 'law', 'statute', 'code',
            'license', 'permit', 'application', 'form',
            'compliance', 'enforcement', 'violation',
            'guidance', 'advisory', 'bulletin',
            'cannabis', 'marijuana', 'hemp', 'cbd',
            'administrative', 'emergency', 'proposed', 'final'
        ]
        
        url_lower = url.lower()
        return any(keyword in url_lower for keyword in regulatory_keywords)
    
    def create_sitemap_xml(self, state: str, urls: List[str]) -> str:
        """Create XML sitemap from discovered URLs"""
        root = ET.Element("urlset")
        root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
        
        # Sort URLs by priority (regulatory content first)
        regulatory_urls = [url for url in urls if self.is_regulatory_content(url)]
        other_urls = [url for url in urls if not self.is_regulatory_content(url)]
        
        # Add regulatory URLs with high priority
        for url in regulatory_urls:
            url_elem = ET.SubElement(root, "url")
            ET.SubElement(url_elem, "loc").text = url
            ET.SubElement(url_elem, "lastmod").text = datetime.now().strftime("%Y-%m-%d")
            ET.SubElement(url_elem, "priority").text = "0.9"
            ET.SubElement(url_elem, "changefreq").text = "weekly"
        
        # Add other URLs with normal priority
        for url in other_urls:
            url_elem = ET.SubElement(root, "url")
            ET.SubElement(url_elem, "loc").text = url
            ET.SubElement(url_elem, "lastmod").text = datetime.now().strftime("%Y-%m-%d")
            ET.SubElement(url_elem, "priority").text = "0.5"
            ET.SubElement(url_elem, "changefreq").text = "monthly"
        
        # Save sitemap
        sitemap_path = os.path.join(self.sitemaps_dir, state, 'comprehensive_sitemap.xml')
        tree = ET.ElementTree(root)
        tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
        
        return sitemap_path
    
    def create_collection_instructions(self, state: str, sitemap_path: str):
        """Create detailed instructions for using xml-sitemaps.com"""
        site_info = self.regulatory_sites[state]
        
        instructions = f"""
# XML-Sitemaps.com Collection Instructions for {state.upper()}

## Regulatory Authority
**{site_info['name']}**
Base URL: {site_info['base_url']}

## Automated XML-Sitemaps.com Process

### Step 1: Visit XML-Sitemaps.com
1. Go to: https://www.xml-sitemaps.com/
2. Enter starting URL: {site_info['base_url']}

### Step 2: Configure Crawling Options
- **Max pages to crawl**: 5000
- **Max crawling depth**: 5 levels
- **Follow external links**: No
- **Include images**: Yes
- **Include PDF files**: Yes
- **Include change frequency**: Yes
- **Include priority**: Yes

### Step 3: Advanced Settings
- **Exclude URL patterns**: Add these if needed:
  - */admin/*
  - */login/*
  - */search/*
  - *.jpg, *.gif, *.png (if too many images)

### Step 4: Start Crawling
1. Click "Start" button
2. Wait for crawling to complete (may take 5-30 minutes)
3. Monitor progress and any error messages

### Step 5: Download Results
1. Download XML sitemap file
2. Save as: `{os.path.join(self.sitemaps_dir, state, 'xmlsitemaps_full.xml')}`
3. Download broken links report (if available)
4. Download statistics report

### Step 6: Manual Enhancement
Review the generated sitemap and add any missing regulatory URLs:

**Priority URLs to verify inclusion:**
"""
        
        # Add priority URLs discovered by our crawler
        if os.path.exists(sitemap_path):
            try:
                tree = ET.parse(sitemap_path)
                root = tree.getroot()
                ns = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                
                priority_urls = []
                for url_elem in root.findall('.//sitemap:url', ns):
                    priority_elem = url_elem.find('sitemap:priority', ns)
                    if priority_elem is not None and float(priority_elem.text) >= 0.9:
                        loc_elem = url_elem.find('sitemap:loc', ns)
                        if loc_elem is not None:
                            priority_urls.append(loc_elem.text)
                
                for url in priority_urls[:20]:  # Show top 20
                    instructions += f"- {url}\n"
                    
            except ET.ParseError:
                pass
        
        instructions += f"""

## Next Steps After Collection
1. Process sitemap with regulatory-sitemap-generator.py
2. Run content collection scripts
3. Perform citation extraction and analysis
4. Update compliance agent knowledge base

## Files Generated
- Comprehensive sitemap: {sitemap_path}
- Collection manifest: {os.path.join(self.sitemaps_dir, state, 'collection_manifest.json')}
- wget script: {os.path.join(self.sitemaps_dir, state, 'collect_content.sh')}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        # Save instructions
        instructions_path = os.path.join(self.sitemaps_dir, state, 'xml_sitemaps_instructions.md')
        with open(instructions_path, 'w') as f:
            f.write(instructions)
        
        return instructions_path
    
    def run_full_collection(self):
        """Run complete sitemap collection for all states"""
        print("=== Automated Regulatory Sitemap Collection ===")
        print(f"Processing {len(self.regulatory_sites)} regulatory websites")
        
        results = {}
        
        for state, site_info in self.regulatory_sites.items():
            print(f"\n--- Processing {state.upper()} ---")
            print(f"Authority: {site_info['name']}")
            
            # Try to fetch official sitemap first
            official_sitemap = self.fetch_existing_sitemap(state)
            
            # Generate comprehensive sitemap through crawling
            comprehensive_sitemap = self.generate_comprehensive_sitemap(state)
            
            # Create xml-sitemaps.com instructions
            instructions_path = self.create_collection_instructions(state, comprehensive_sitemap)
            
            results[state] = {
                "official_sitemap": official_sitemap,
                "comprehensive_sitemap": comprehensive_sitemap,
                "instructions": instructions_path,
                "status": "ready_for_xml_sitemaps"
            }
            
            print(f"✓ Completed {state}")
            print(f"  Instructions: {instructions_path}")
        
        self.create_master_report(results)
        return results
    
    def create_master_report(self, results: Dict):
        """Create master collection report"""
        report = {
            "collection_date": datetime.now().isoformat(),
            "states_processed": len(results),
            "next_steps": [
                "Use xml-sitemaps.com with provided instructions",
                "Download comprehensive sitemaps for each state",
                "Run regulatory content collection scripts",
                "Process content for compliance agent training"
            ],
            "states": {}
        }
        
        for state, data in results.items():
            report["states"][state] = {
                "regulatory_authority": self.regulatory_sites[state]["name"],
                "base_url": self.regulatory_sites[state]["base_url"],
                "has_official_sitemap": data["official_sitemap"] is not None,
                "comprehensive_sitemap_urls": 0,  # Will be updated after XML parsing
                "status": data["status"],
                "instructions_path": data["instructions"]
            }
            
            # Count URLs in comprehensive sitemap
            if data["comprehensive_sitemap"] and os.path.exists(data["comprehensive_sitemap"]):
                try:
                    tree = ET.parse(data["comprehensive_sitemap"])
                    url_count = len(tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url'))
                    report["states"][state]["comprehensive_sitemap_urls"] = url_count
                except ET.ParseError:
                    pass
        
        # Save master report
        report_path = os.path.join(self.sitemaps_dir, 'master_collection_report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n=== Collection Preparation Complete ===")
        print(f"Master report: {report_path}")
        print(f"States ready for xml-sitemaps.com: {len(results)}")
        print("\nNext: Follow instructions in each state's directory to complete sitemap generation")

if __name__ == "__main__":
    collector = AutomatedSitemapCollector()
    results = collector.run_full_collection()