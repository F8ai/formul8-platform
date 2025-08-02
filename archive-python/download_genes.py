#!/usr/bin/env python3
"""
Gene Download Script for Metabolomics Agent

Downloads gene data for C. sativa and P. cubensis from various sources.
"""

import os
import requests
import json
from pathlib import Path
from typing import Dict, List, Optional
import time

class GeneDownloader:
    """Download gene data from various sources."""
    
    def __init__(self, base_dir: str = "data/corpora"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # NCBI E-utilities base URL
        self.ncbi_base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        
        # Species information
        self.species = {
            "c.sativa": {
                "taxid": "3483",  # Cannabis sativa
                "common_name": "Cannabis sativa",
                "databases": ["nucleotide", "protein", "gene"]
            },
            "p.cubensis": {
                "taxid": "5628",  # Psilocybe cubensis
                "common_name": "Psilocybe cubensis", 
                "databases": ["nucleotide", "protein", "gene"]
            }
        }
    
    def download_ncbi_genes(self, species: str, max_results: int = 1000) -> Dict:
        """Download gene data from NCBI for a specific species."""
        if species not in self.species:
            raise ValueError(f"Unknown species: {species}")
        
        species_info = self.species[species]
        species_dir = self.base_dir / species
        species_dir.mkdir(exist_ok=True)
        
        results = {}
        
        for database in species_info["databases"]:
            print(f"Downloading {database} data for {species_info['common_name']}...")
            
            # Search for genes in the database
            search_url = f"{self.ncbi_base}esearch.fcgi"
            search_params = {
                "db": database,
                "term": f"txid{species_info['taxid']}[Organism:exp]",
                "retmax": max_results,
                "retmode": "json"
            }
            
            try:
                response = requests.get(search_url, params=search_params)
                response.raise_for_status()
                search_data = response.json()
                
                if "esearchresult" in search_data:
                    id_list = search_data["esearchresult"].get("idlist", [])
                    
                    if id_list:
                        # Fetch detailed information for each ID
                        fetch_url = f"{self.ncbi_base}efetch.fcgi"
                        fetch_params = {
                            "db": database,
                            "id": ",".join(id_list[:100]),  # Limit to first 100 for testing
                            "retmode": "xml"
                        }
                        
                        fetch_response = requests.get(fetch_url, params=fetch_params)
                        fetch_response.raise_for_status()
                        
                        # Save the data
                        output_file = species_dir / f"{database}_genes.xml"
                        with open(output_file, 'w') as f:
                            f.write(fetch_response.text)
                        
                        results[database] = {
                            "count": len(id_list),
                            "file": str(output_file),
                            "ids": id_list[:100]
                        }
                        
                        print(f"  Downloaded {len(id_list)} {database} records")
                        
                        # Be nice to NCBI servers
                        time.sleep(1)
                    else:
                        print(f"  No {database} records found")
                        results[database] = {"count": 0, "file": None, "ids": []}
                
            except Exception as e:
                print(f"  Error downloading {database} data: {e}")
                results[database] = {"error": str(e)}
        
        return results
    
    def download_kegg_genes(self, species: str) -> Dict:
        """Download gene data from KEGG for a specific species."""
        if species not in self.species:
            raise ValueError(f"Unknown species: {species}")
        
        species_dir = self.base_dir / species
        species_dir.mkdir(exist_ok=True)
        
        # KEGG organism codes
        kegg_codes = {
            "c.sativa": "csat",  # Cannabis sativa
            "p.cubensis": "pcub"  # Psilocybe cubensis (if available)
        }
        
        results = {}
        
        if species in kegg_codes:
            kegg_code = kegg_codes[species]
            
            try:
                # Get gene list from KEGG
                kegg_url = f"http://rest.kegg.org/list/{kegg_code}"
                response = requests.get(kegg_url)
                response.raise_for_status()
                
                # Save the gene list
                output_file = species_dir / "kegg_genes.txt"
                with open(output_file, 'w') as f:
                    f.write(response.text)
                
                results["kegg"] = {
                    "file": str(output_file),
                    "count": len(response.text.strip().split('\n'))
                }
                
                print(f"Downloaded KEGG gene data for {species}")
                
            except Exception as e:
                print(f"Error downloading KEGG data for {species}: {e}")
                results["kegg"] = {"error": str(e)}
        
        return results
    
    def download_all_species(self) -> Dict:
        """Download gene data for all species."""
        all_results = {}
        
        for species in self.species.keys():
            print(f"\nProcessing {species}...")
            species_results = {
                "ncbi": self.download_ncbi_genes(species),
                "kegg": self.download_kegg_genes(species)
            }
            all_results[species] = species_results
        
        return all_results
    
    def create_summary(self, results: Dict) -> None:
        """Create a summary of downloaded data."""
        summary_file = self.base_dir / "download_summary.json"
        
        with open(summary_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nDownload summary saved to: {summary_file}")
        
        # Print summary
        print("\nDownload Summary:")
        print("=" * 50)
        
        for species, species_results in results.items():
            print(f"\n{species.upper()}:")
            print(f"  NCBI:")
            for db, db_results in species_results.get("ncbi", {}).items():
                if "count" in db_results:
                    print(f"    {db}: {db_results['count']} records")
                elif "error" in db_results:
                    print(f"    {db}: ERROR - {db_results['error']}")
            
            kegg_results = species_results.get("kegg", {})
            if "count" in kegg_results:
                print(f"  KEGG: {kegg_results['count']} records")
            elif "error" in kegg_results:
                print(f"  KEGG: ERROR - {kegg_results['error']}")

def main():
    """Main function to download gene data."""
    downloader = GeneDownloader()
    
    print("Gene Download Script for Metabolomics Agent")
    print("=" * 50)
    
    # Download data for all species
    results = downloader.download_all_species()
    
    # Create summary
    downloader.create_summary(results)
    
    print("\nDownload completed!")

if __name__ == "__main__":
    main() 