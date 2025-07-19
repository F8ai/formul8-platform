#!/usr/bin/env python3
"""
Genome Download and Annotation Script for Metabolomics Data

Downloads genome annotations, FASTA files, and UniProtKB/SwissProt annotations
for C. sativa and P. cubensis.
"""

import os
import requests
import json
import time
import gzip
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin
import subprocess
import sys

class GenomeDownloader:
    """Download and annotate genomes from various sources."""
    
    def __init__(self, base_dir: str = "genomes"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # NCBI E-utilities base URL
        self.ncbi_base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        
        # UniProt API base URL
        self.uniprot_base = "https://rest.uniprot.org/"
        
        # Species information with genome assembly IDs
        self.species = {
            "c.sativa": {
                "taxid": "3483",
                "common_name": "Cannabis sativa",
                "assembly_accession": "GCA_000230575.2",  # CS10 assembly
                "assembly_name": "CS10",
                "genome_size_mb": 828,
                "chromosomes": 10
            },
            "p.cubensis": {
                "taxid": "5341", 
                "common_name": "Psilocybe cubensis",
                "assembly_accession": "GCA_000708925.1",  # Best available assembly
                "assembly_name": "Pcubensis_v1.0",
                "genome_size_mb": 35,
                "chromosomes": 8
            }
        }
        
        # Rate limiting
        self.delay = 0.1  # 100ms between requests
        
    def download_with_retry(self, url: str, output_path: Path, max_retries: int = 3) -> bool:
        """Download file with retry logic."""
        for attempt in range(max_retries):
            try:
                print(f"Downloading {url} to {output_path} (attempt {attempt + 1})")
                response = requests.get(url, stream=True, timeout=30)
                response.raise_for_status()
                
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"Successfully downloaded {output_path}")
                return True
                
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    print(f"Failed to download {url} after {max_retries} attempts")
                    return False
        
        return False
    
    def download_ncbi_genome(self, species: str) -> Dict[str, str]:
        """Download genome data from NCBI."""
        species_info = self.species[species]
        species_dir = self.base_dir / species
        species_dir.mkdir(exist_ok=True)
        
        results = {}
        
        # Download genome assembly report
        assembly_url = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{species_info['assembly_accession'][:3]}/{species_info['assembly_accession'][4:7]}/{species_info['assembly_accession'][8:10]}/{species_info['assembly_accession'][11:13]}/{species_info['assembly_accession']}/{species_info['assembly_accession']}_assembly_report.txt"
        
        assembly_report = species_dir / f"{species}_assembly_report.txt"
        if self.download_with_retry(assembly_url, assembly_report):
            results['assembly_report'] = str(assembly_report)
        
        # Download genome FASTA
        genome_url = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{species_info['assembly_accession'][:3]}/{species_info['assembly_accession'][4:7]}/{species_info['assembly_accession'][8:10]}/{species_info['assembly_accession'][11:13]}/{species_info['assembly_accession']}/{species_info['assembly_accession']}_genomic.fna.gz"
        
        genome_gz = species_dir / f"{species}_genomic.fna.gz"
        if self.download_with_retry(genome_url, genome_gz):
            # Extract gzipped file
            genome_fasta = species_dir / f"{species}_genomic.fna"
            with gzip.open(genome_gz, 'rb') as f_in:
                with open(genome_fasta, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            results['genome_fasta'] = str(genome_fasta)
            genome_gz.unlink()  # Remove compressed file
        
        # Download protein FASTA
        protein_url = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{species_info['assembly_accession'][:3]}/{species_info['assembly_accession'][4:7]}/{species_info['assembly_accession'][8:10]}/{species_info['assembly_accession'][11:13]}/{species_info['assembly_accession']}/{species_info['assembly_accession']}_protein.faa.gz"
        
        protein_gz = species_dir / f"{species}_protein.faa.gz"
        if self.download_with_retry(protein_url, protein_gz):
            # Extract gzipped file
            protein_fasta = species_dir / f"{species}_protein.faa"
            with gzip.open(protein_gz, 'rb') as f_in:
                with open(protein_fasta, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            results['protein_fasta'] = str(protein_fasta)
            protein_gz.unlink()  # Remove compressed file
        
        # Download GFF annotation
        gff_url = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{species_info['assembly_accession'][:3]}/{species_info['assembly_accession'][4:7]}/{species_info['assembly_accession'][8:10]}/{species_info['assembly_accession'][11:13]}/{species_info['assembly_accession']}/{species_info['assembly_accession']}_genomic.gff.gz"
        
        gff_gz = species_dir / f"{species}_genomic.gff.gz"
        if self.download_with_retry(gff_url, gff_gz):
            # Extract gzipped file
            gff_file = species_dir / f"{species}_genomic.gff"
            with gzip.open(gff_gz, 'rb') as f_in:
                with open(gff_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            results['gff_annotation'] = str(gff_file)
            gff_gz.unlink()  # Remove compressed file
        
        time.sleep(self.delay)
        return results
    
    def download_uniprot_annotations(self, species: str) -> Dict[str, str]:
        """Download UniProtKB/SwissProt annotations for the species."""
        species_info = self.species[species]
        species_dir = self.base_dir / species
        species_dir.mkdir(exist_ok=True)
        
        results = {}
        
        # Download SwissProt entries for the species
        swissprot_url = f"{self.uniprot_base}uniprotkb/stream?format=fasta&query=organism_id:{species_info['taxid']}%20AND%20reviewed:yes"
        
        swissprot_fasta = species_dir / f"{species}_swissprot.fasta"
        if self.download_with_retry(swissprot_url, swissprot_fasta):
            results['swissprot_fasta'] = str(swissprot_fasta)
        
        # Download SwissProt entries in JSON format for detailed annotations
        swissprot_json_url = f"{self.uniprot_base}uniprotkb/stream?format=json&query=organism_id:{species_info['taxid']}%20AND%20reviewed:yes"
        
        swissprot_json = species_dir / f"{species}_swissprot.json"
        if self.download_with_retry(swissprot_json_url, swissprot_json):
            results['swissprot_json'] = str(swissprot_json)
        
        # Download TrEMBL entries (unreviewed but still useful)
        trembl_url = f"{self.uniprot_base}uniprotkb/stream?format=fasta&query=organism_id:{species_info['taxid']}%20AND%20reviewed:no"
        
        trembl_fasta = species_dir / f"{species}_trembl.fasta"
        if self.download_with_retry(trembl_url, trembl_fasta):
            results['trembl_fasta'] = str(trembl_fasta)
        
        time.sleep(self.delay)
        return results
    
    def create_blast_database(self, species: str) -> bool:
        """Create BLAST database from protein sequences."""
        species_dir = self.base_dir / species
        protein_fasta = species_dir / f"{species}_protein.faa"
        
        if not protein_fasta.exists():
            print(f"Protein FASTA not found for {species}")
            return False
        
        try:
            # Create BLAST database
            cmd = [
                "makeblastdb",
                "-in", str(protein_fasta),
                "-dbtype", "prot",
                "-out", str(species_dir / f"{species}_blastdb"),
                "-title", f"{species} protein database"
            ]
            
            print(f"Creating BLAST database for {species}...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"BLAST database created successfully for {species}")
                return True
            else:
                print(f"Error creating BLAST database: {result.stderr}")
                return False
                
        except FileNotFoundError:
            print("BLAST+ tools not found. Please install BLAST+ to create databases.")
            return False
    
    def annotate_with_uniprot(self, species: str) -> Dict[str, str]:
        """Annotate genome proteins with UniProtKB/SwissProt using BLAST."""
        species_dir = self.base_dir / species
        protein_fasta = species_dir / f"{species}_protein.faa"
        swissprot_fasta = species_dir / f"{species}_swissprot.fasta"
        
        if not protein_fasta.exists() or not swissprot_fasta.exists():
            print(f"Required files not found for {species}")
            return {}
        
        results = {}
        
        try:
            # Create SwissProt BLAST database
            swissprot_db = species_dir / f"{species}_swissprot_blastdb"
            cmd_makedb = [
                "makeblastdb",
                "-in", str(swissprot_fasta),
                "-dbtype", "prot",
                "-out", str(swissprot_db),
                "-title", f"{species} SwissProt database"
            ]
            
            print(f"Creating SwissProt BLAST database for {species}...")
            subprocess.run(cmd_makedb, capture_output=True, text=True)
            
            # Run BLAST search
            blast_output = species_dir / f"{species}_blast_results.txt"
            cmd_blast = [
                "blastp",
                "-query", str(protein_fasta),
                "-db", str(swissprot_db),
                "-out", str(blast_output),
                "-outfmt", "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore stitle",
                "-evalue", "1e-10",
                "-max_target_seqs", "5"
            ]
            
            print(f"Running BLAST search for {species}...")
            result = subprocess.run(cmd_blast, capture_output=True, text=True)
            
            if result.returncode == 0:
                results['blast_results'] = str(blast_output)
                print(f"BLAST annotation completed for {species}")
            else:
                print(f"BLAST search failed: {result.stderr}")
                
        except FileNotFoundError:
            print("BLAST+ tools not found. Skipping annotation.")
        
        return results
    
    def create_summary_report(self, species: str, results: Dict[str, str]) -> str:
        """Create a summary report for the downloaded data."""
        species_info = self.species[species]
        species_dir = self.base_dir / species
        
        report = f"""# Genome Download Summary for {species_info['common_name']}

## Species Information
- **Taxonomy ID**: {species_info['taxid']}
- **Assembly**: {species_info['assembly_accession']} ({species_info['assembly_name']})
- **Genome Size**: {species_info['genome_size_mb']} MB
- **Chromosomes**: {species_info['chromosomes']}

## Downloaded Files
"""
        
        for file_type, file_path in results.items():
            if Path(file_path).exists():
                size_mb = Path(file_path).stat().st_size / (1024 * 1024)
                report += f"- **{file_type}**: {file_path} ({size_mb:.2f} MB)\n"
        
        report += f"""
## File Descriptions

### Genome Data
- **Assembly Report**: NCBI assembly information and statistics
- **Genome FASTA**: Complete genome sequence in FASTA format
- **Protein FASTA**: Predicted protein sequences in FASTA format
- **GFF Annotation**: Gene structure annotations in GFF format

### UniProt Annotations
- **SwissProt FASTA**: Reviewed protein sequences from UniProtKB/SwissProt
- **SwissProt JSON**: Detailed annotations in JSON format
- **TrEMBL FASTA**: Unreviewed protein sequences from UniProtKB/TrEMBL
- **BLAST Results**: Protein similarity search results against SwissProt

## Usage Notes
- Use the genome FASTA for sequence analysis
- Use the protein FASTA for functional annotation
- Use the GFF file for gene structure analysis
- Use BLAST results for functional predictions
- SwissProt annotations provide high-quality functional information

Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        report_file = species_dir / f"{species}_download_summary.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        return str(report_file)
    
    def download_all(self) -> Dict[str, Dict[str, str]]:
        """Download all genome data for both species."""
        all_results = {}
        
        for species in self.species.keys():
            print(f"\n{'='*60}")
            print(f"Processing {species} ({self.species[species]['common_name']})")
            print(f"{'='*60}")
            
            species_results = {}
            
            # Download NCBI genome data
            print(f"\n1. Downloading NCBI genome data for {species}...")
            ncbi_results = self.download_ncbi_genome(species)
            species_results.update(ncbi_results)
            
            # Download UniProt annotations
            print(f"\n2. Downloading UniProt annotations for {species}...")
            uniprot_results = self.download_uniprot_annotations(species)
            species_results.update(uniprot_results)
            
            # Create BLAST database
            print(f"\n3. Creating BLAST database for {species}...")
            self.create_blast_database(species)
            
            # Annotate with UniProt
            print(f"\n4. Annotating {species} with UniProtKB/SwissProt...")
            annotation_results = self.annotate_with_uniprot(species)
            species_results.update(annotation_results)
            
            # Create summary report
            print(f"\n5. Creating summary report for {species}...")
            summary_file = self.create_summary_report(species, species_results)
            species_results['summary_report'] = summary_file
            
            all_results[species] = species_results
            
            print(f"\nCompleted processing {species}")
            time.sleep(1)
        
        return all_results

def main():
    """Main function to run the genome downloader."""
    print("Genome Download and Annotation Script")
    print("=" * 50)
    
    downloader = GenomeDownloader()
    
    try:
        results = downloader.download_all()
        
        print(f"\n{'='*60}")
        print("DOWNLOAD SUMMARY")
        print(f"{'='*60}")
        
        for species, species_results in results.items():
            print(f"\n{species.upper()}:")
            for file_type, file_path in species_results.items():
                if Path(file_path).exists():
                    size_mb = Path(file_path).stat().st_size / (1024 * 1024)
                    print(f"  ✓ {file_type}: {size_mb:.2f} MB")
                else:
                    print(f"  ✗ {file_type}: Not downloaded")
        
        print(f"\nAll downloads completed! Check the summary reports for details.")
        
    except KeyboardInterrupt:
        print("\nDownload interrupted by user.")
    except Exception as e:
        print(f"\nError during download: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 