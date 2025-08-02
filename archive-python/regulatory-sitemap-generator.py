#!/usr/bin/env python3
"""
Regulatory Website Sitemap Generator for Cannabis Compliance Data Collection

This script generates comprehensive sitemaps for state cannabis regulatory websites
using xml-sitemaps.com API and creates structured data collection targets.
"""

import requests
import json
import time
import os
from datetime import datetime
from typing import Dict, List, Optional
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, urljoin

class RegulatorySitemapGenerator:
    """Generate sitemaps for cannabis regulatory websites"""
    
    def __init__(self):
        self.regulatory_sites = {
            'colorado': {
                'name': 'Colorado Marijuana Enforcement Division',
                'base_url': 'https://sbg.colorado.gov/med',
                'priority_paths': ['/rules', '/regulations', '/licensing', '/forms']
            },
            'california': {
                'name': 'California Cannabis Control Commission', 
                'base_url': 'https://cannabis.ca.gov',
                'priority_paths': ['/laws', '/regulations', '/licensing', '/resources']
            },
            'washington': {
                'name': 'Washington State Liquor and Cannabis Board',
                'base_url': 'https://lcb.wa.gov',
                'priority_paths': ['/laws', '/rules', '/licensing', '/marijuana']
            },
            'oregon': {
                'name': 'Oregon Liquor and Cannabis Commission',
                'base_url': 'https://www.oregon.gov/olcc',
                'priority_paths': ['/marijuana', '/rules', '/licensing', '/pages']
            },
            'nevada': {
                'name': 'Nevada Cannabis Compliance Board',
                'base_url': 'https://ccb.nv.gov',
                'priority_paths': ['/laws', '/regulations', '/licensing', '/resources']
            },
            'arizona': {
                'name': 'Arizona Department of Health Services',
                'base_url': 'https://www.azdhs.gov',
                'priority_paths': ['/licensing', '/marijuana', '/rules', '/documents']
            },
            'massachusetts': {
                'name': 'Massachusetts Cannabis Control Commission',
                'base_url': 'https://mass-cannabis-control.com',
                'priority_paths': ['/regulations', '/licensing', '/guidance', '/resources']
            },
            'illinois': {
                'name': 'Illinois Department of Financial and Professional Regulation',
                'base_url': 'https://idfpr.com',
                'priority_paths': ['/profs', '/cannabis', '/licensing', '/rules']
            },
            'new_york': {
                'name': 'New York State Office of Cannabis Management',
                'base_url': 'https://cannabis.ny.gov',
                'priority_paths': ['/regulations', '/licensing', '/resources', '/guidance']
            },
            'new_jersey': {
                'name': 'New Jersey Cannabis Regulatory Commission',
                'base_url': 'https://www.nj.gov/cannabis',
                'priority_paths': ['/businesses', '/rules', '/licensing', '/resources']
            }
        }
        
        self.xml_sitemaps_api = "https://www.xml-sitemaps.com"
        self.output_dir = os.path.join(os.path.dirname(__file__), 'sitemaps')
        self.ensure_output_directory()
    
    def ensure_output_directory(self):
        """Create output directory structure"""
        os.makedirs(self.output_dir, exist_ok=True)
        for state in self.regulatory_sites.keys():
            os.makedirs(os.path.join(self.output_dir, state), exist_ok=True)
    
    def generate_sitemap_via_service(self, state: str, base_url: str) -> Optional[str]:
        """
        Generate sitemap using xml-sitemaps.com service
        Note: This requires manual generation through their web interface
        """
        print(f"\n=== Generating sitemap for {state.upper()} ===")
        print(f"Base URL: {base_url}")
        print(f"Manual steps required:")
        print(f"1. Visit: https://www.xml-sitemaps.com/")
        print(f"2. Enter URL: {base_url}")
        print(f"3. Configure options:")
        print(f"   - Max pages: 5000")
        print(f"   - Max depth: 5 levels")
        print(f"   - Follow external links: No")
        print(f"   - Include images: Yes")
        print(f"   - Include PDFs: Yes")
        print(f"4. Download XML sitemap")
        print(f"5. Save as: {self.output_dir}/{state}/sitemap.xml")
        
        # Create placeholder sitemap structure
        return self.create_placeholder_sitemap(state, base_url)
    
    def create_placeholder_sitemap(self, state: str, base_url: str) -> str:
        """Create a basic sitemap structure for immediate use"""
        site_info = self.regulatory_sites[state]
        
        # Create basic sitemap XML structure
        root = ET.Element("urlset")
        root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
        
        # Add base URL
        url_elem = ET.SubElement(root, "url")
        ET.SubElement(url_elem, "loc").text = base_url
        ET.SubElement(url_elem, "lastmod").text = datetime.now().strftime("%Y-%m-%d")
        ET.SubElement(url_elem, "priority").text = "1.0"
        
        # Add priority paths
        for path in site_info['priority_paths']:
            url_elem = ET.SubElement(root, "url")
            full_url = urljoin(base_url, path)
            ET.SubElement(url_elem, "loc").text = full_url
            ET.SubElement(url_elem, "lastmod").text = datetime.now().strftime("%Y-%m-%d")
            ET.SubElement(url_elem, "priority").text = "0.8"
        
        # Save sitemap
        sitemap_path = os.path.join(self.output_dir, state, 'placeholder_sitemap.xml')
        tree = ET.ElementTree(root)
        tree.write(sitemap_path, encoding='utf-8', xml_declaration=True)
        
        return sitemap_path
    
    def analyze_sitemap(self, sitemap_path: str) -> Dict:
        """Analyze sitemap and extract key regulatory content URLs"""
        if not os.path.exists(sitemap_path):
            return {"error": "Sitemap file not found"}
        
        try:
            tree = ET.parse(sitemap_path)
            root = tree.getroot()
            
            # Define regulatory content patterns
            regulatory_patterns = [
                'rule', 'regulation', 'law', 'statute', 'code',
                'license', 'permit', 'application', 'form',
                'compliance', 'enforcement', 'violation',
                'guidance', 'advisory', 'bulletin',
                'cannabis', 'marijuana', 'hemp', 'cbd'
            ]
            
            urls = []
            regulatory_urls = []
            
            # Extract all URLs
            ns = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for url_elem in root.findall('.//sitemap:url', ns):
                loc_elem = url_elem.find('sitemap:loc', ns)
                if loc_elem is not None:
                    url = loc_elem.text
                    urls.append(url)
                    
                    # Check if URL contains regulatory keywords
                    url_lower = url.lower()
                    if any(pattern in url_lower for pattern in regulatory_patterns):
                        regulatory_urls.append(url)
            
            return {
                "total_urls": len(urls),
                "regulatory_urls": len(regulatory_urls),
                "priority_targets": regulatory_urls[:50],  # Top 50 regulatory URLs
                "all_urls": urls
            }
            
        except ET.ParseError as e:
            return {"error": f"XML parsing error: {e}"}
    
    def create_collection_manifest(self, state: str, analysis: Dict):
        """Create data collection manifest for regulatory content"""
        manifest = {
            "state": state,
            "regulatory_authority": self.regulatory_sites[state]['name'],
            "base_url": self.regulatory_sites[state]['base_url'],
            "generated_date": datetime.now().isoformat(),
            "sitemap_analysis": analysis,
            "collection_strategy": {
                "priority_urls": analysis.get("priority_targets", []),
                "collection_methods": [
                    "direct_download",
                    "web_scraping", 
                    "api_access",
                    "rss_feeds"
                ],
                "file_types": [
                    "html",
                    "pdf", 
                    "docx",
                    "xml",
                    "json"
                ],
                "update_frequency": "weekly"
            },
            "processing_pipeline": {
                "citation_extraction": True,
                "content_classification": True,
                "vector_embedding": True,
                "knowledge_graph": True
            }
        }
        
        # Save manifest
        manifest_path = os.path.join(self.output_dir, state, 'collection_manifest.json')
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest_path
    
    def generate_wget_script(self, state: str, analysis: Dict):
        """Generate wget script for systematic content collection"""
        script_content = f"""#!/bin/bash
# Regulatory Content Collection Script for {state.upper()}
# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

STATE="{state}"
BASE_URL="{self.regulatory_sites[state]['base_url']}"
OUTPUT_DIR="./collected_content/$STATE"

echo "=== Starting regulatory content collection for $STATE ==="
mkdir -p "$OUTPUT_DIR"

# Set wget options for comprehensive collection
WGET_OPTIONS="--recursive --level=3 --no-clobber --page-requisites --html-extension --convert-links --restrict-file-names=windows --domains=$(echo $BASE_URL | cut -d'/' -f3) --no-parent --timeout=30 --tries=3 --wait=1"

"""
        
        # Add priority URL downloads
        if "priority_targets" in analysis:
            script_content += "\n# Priority regulatory content URLs\n"
            for i, url in enumerate(analysis["priority_targets"][:20]):  # Limit to top 20
                script_content += f'echo "Downloading priority URL {i+1}: {url}"\n'
                script_content += f'wget $WGET_OPTIONS -P "$OUTPUT_DIR/priority" "{url}"\n\n'
        
        script_content += """
echo "=== Collection complete ==="
echo "Files saved to: $OUTPUT_DIR"
echo "Total files: $(find $OUTPUT_DIR -type f | wc -l)"
"""
        
        # Save script
        script_path = os.path.join(self.output_dir, state, 'collect_content.sh')
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        os.chmod(script_path, 0o755)  # Make executable
        return script_path
    
    def run_complete_generation(self):
        """Run complete sitemap generation for all regulatory sites"""
        print("=== Regulatory Sitemap Generation System ===")
        print(f"Processing {len(self.regulatory_sites)} state regulatory websites")
        
        results = {}
        
        for state, site_info in self.regulatory_sites.items():
            print(f"\n--- Processing {state.upper()} ---")
            
            # Generate sitemap (placeholder for now)
            sitemap_path = self.generate_sitemap_via_service(state, site_info['base_url'])
            
            # Analyze sitemap
            analysis = self.analyze_sitemap(sitemap_path)
            
            # Create collection manifest
            manifest_path = self.create_collection_manifest(state, analysis)
            
            # Generate wget script
            script_path = self.generate_wget_script(state, analysis)
            
            results[state] = {
                "sitemap_path": sitemap_path,
                "manifest_path": manifest_path,
                "script_path": script_path,
                "analysis": analysis
            }
            
            print(f"✓ Generated files for {state}:")
            print(f"  - Sitemap: {sitemap_path}")
            print(f"  - Manifest: {manifest_path}")
            print(f"  - Collection script: {script_path}")
        
        # Create summary report
        self.create_summary_report(results)
        
        return results
    
    def create_summary_report(self, results: Dict):
        """Create comprehensive summary report"""
        report = {
            "generation_date": datetime.now().isoformat(),
            "states_processed": len(results),
            "total_regulatory_urls": sum(r["analysis"].get("regulatory_urls", 0) for r in results.values()),
            "states": {}
        }
        
        for state, data in results.items():
            report["states"][state] = {
                "regulatory_authority": self.regulatory_sites[state]["name"],
                "base_url": self.regulatory_sites[state]["base_url"],
                "total_urls": data["analysis"].get("total_urls", 0),
                "regulatory_urls": data["analysis"].get("regulatory_urls", 0),
                "files_generated": 3  # sitemap, manifest, script
            }
        
        # Save report
        report_path = os.path.join(self.output_dir, 'generation_summary.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n=== Generation Complete ===")
        print(f"Summary report saved: {report_path}")
        print(f"States processed: {len(results)}")
        print(f"Total regulatory URLs identified: {report['total_regulatory_urls']}")

if __name__ == "__main__":
    generator = RegulatorySitemapGenerator()
    results = generator.run_complete_generation()