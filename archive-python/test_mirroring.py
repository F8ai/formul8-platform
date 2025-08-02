
#!/usr/bin/env python3
"""
Test and debug the mirroring functionality
"""

import os
import json
import logging
from datetime import datetime
from download_regulations import RegulationMirror

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_single_state(state_code: str):
    """Test mirroring for a single state"""
    logger.info(f"Testing mirror for state: {state_code}")
    
    mirror = RegulationMirror()
    success = mirror.mirror_state_website(state_code)
    
    # Check results
    metadata_path = os.path.join("regulations", state_code, "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        logger.info(f"Mirror results for {state_code}:")
        logger.info(f"  Success: {success}")
        logger.info(f"  Total files: {metadata.get('total_files', 0)}")
        logger.info(f"  Total size: {metadata.get('total_size_mb', 0)} MB")
        
        for domain, result in metadata.get('domain_results', {}).items():
            logger.info(f"  Domain {domain}: {result['status']} ({result['files']} files)")
    
    return success

def test_connectivity():
    """Test basic connectivity to regulation sites"""
    import requests
    import subprocess
    
    test_sites = [
        "cannabis.ca.gov",
        "lcb.wa.gov", 
        "sbg.colorado.gov",
        "cannabis.ny.gov"
    ]
    
    logger.info("Testing connectivity to regulation sites...")
    
    for site in test_sites:
        try:
            # Test with curl
            result = subprocess.run(['curl', '-I', '--connect-timeout', '10', f'https://{site}'], 
                                 capture_output=True, text=True)
            curl_success = result.returncode == 0
            
            # Test with requests
            try:
                response = requests.get(f'https://{site}', timeout=10, verify=False)
                requests_success = response.status_code < 400
                status_code = response.status_code
            except:
                requests_success = False
                status_code = "Error"
            
            logger.info(f"{site}: curl={curl_success}, requests={requests_success} (HTTP {status_code})")
            
        except Exception as e:
            logger.warning(f"Failed to test {site}: {e}")

def analyze_mirror_quality():
    """Analyze the quality of existing mirrors"""
    logger.info("Analyzing mirror quality...")
    
    summary_path = os.path.join("regulations", "mirror_summary.json")
    if not os.path.exists(summary_path):
        logger.warning("No mirror summary found")
        return
    
    with open(summary_path, 'r') as f:
        summary = json.load(f)
    
    logger.info(f"Mirror Summary (from {summary.get('mirror_date', 'unknown')}):")
    logger.info(f"  Successful: {summary.get('successful_mirrors', 0)}/{summary.get('total_states', 0)}")
    
    # Analyze each state
    good_mirrors = []
    partial_mirrors = []
    failed_mirrors = []
    
    for state_code in summary.get('results', {}):
        metadata_path = os.path.join("regulations", state_code, "metadata.json")
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            total_files = metadata.get('total_files', 0)
            if total_files >= 10:
                good_mirrors.append(state_code)
            elif total_files > 0:
                partial_mirrors.append(state_code)
            else:
                failed_mirrors.append(state_code)
        else:
            failed_mirrors.append(state_code)
    
    logger.info(f"Quality breakdown:")
    logger.info(f"  Good mirrors ({len(good_mirrors)}): {', '.join(good_mirrors)}")
    logger.info(f"  Partial mirrors ({len(partial_mirrors)}): {', '.join(partial_mirrors)}")
    logger.info(f"  Failed mirrors ({len(failed_mirrors)}): {', '.join(failed_mirrors)}")

def main():
    """Main test function"""
    logger.info("Starting mirroring diagnostics...")
    
    # Test connectivity first
    test_connectivity()
    
    # Analyze existing mirror quality
    analyze_mirror_quality()
    
    # Test a few key states
    test_states = ["CA", "CO", "WA"]
    
    for state in test_states:
        logger.info(f"\n{'='*50}")
        test_single_state(state)
    
    logger.info("\nDiagnostics complete!")

if __name__ == "__main__":
    main()
