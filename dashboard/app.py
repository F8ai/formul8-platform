#!/usr/bin/env python3
"""
Metabolomics Data Dashboard

A web-based dashboard for exploring and visualizing metabolomics data,
genome information, and download status.
"""

import os
import json
import pandas as pd
import plotly.graph_objs as go
import plotly.express as px
from plotly.subplots import make_subplots
from flask import Flask, render_template, jsonify, request, send_from_directory
from pathlib import Path
import datetime
from typing import Dict, List, Optional
import subprocess
import sys

app = Flask(__name__)

class DataAnalyzer:
    """Analyze and process metabolomics data for dashboard."""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.genomes_dir = self.base_dir / "genomes"
        
    def get_species_info(self) -> Dict:
        """Get information about available species."""
        species_info = {
            "c.sativa": {
                "name": "Cannabis sativa",
                "taxid": "3483",
                "assembly": "GCA_000230575.2",
                "genome_size_mb": 828,
                "chromosomes": 10,
                "key_features": ["Cannabinoid biosynthesis", "Terpene synthases", "Secondary metabolites"]
            },
            "p.cubensis": {
                "name": "Psilocybe cubensis", 
                "taxid": "5341",
                "assembly": "GCA_000708925.1",
                "genome_size_mb": 35,
                "chromosomes": 8,
                "key_features": ["Psilocybin biosynthesis", "Tryptamine pathways", "Fungal metabolism"]
            }
        }
        return species_info
    
    def get_file_status(self) -> Dict:
        """Check status of downloaded files."""
        status = {}
        species_info = self.get_species_info()
        
        for species, info in species_info.items():
            species_dir = self.genomes_dir / species
            status[species] = {
                "name": info["name"],
                "files": {},
                "total_size_mb": 0,
                "last_updated": None
            }
            
            if species_dir.exists():
                # Check for specific files
                expected_files = [
                    f"{species}_assembly_report.txt",
                    f"{species}_genomic.fna",
                    f"{species}_protein.faa", 
                    f"{species}_genomic.gff",
                    f"{species}_swissprot.fasta",
                    f"{species}_swissprot.json",
                    f"{species}_trembl.fasta",
                    f"{species}_blast_results.txt",
                    f"{species}_download_summary.md"
                ]
                
                for filename in expected_files:
                    file_path = species_dir / filename
                    if file_path.exists():
                        size_mb = file_path.stat().st_size / (1024 * 1024)
                        mtime = datetime.datetime.fromtimestamp(file_path.stat().st_mtime)
                        status[species]["files"][filename] = {
                            "exists": True,
                            "size_mb": round(size_mb, 2),
                            "modified": mtime.strftime("%Y-%m-%d %H:%M:%S")
                        }
                        status[species]["total_size_mb"] += size_mb
                        
                        if status[species]["last_updated"] is None or mtime > status[species]["last_updated"]:
                            status[species]["last_updated"] = mtime
                    else:
                        status[species]["files"][filename] = {
                            "exists": False,
                            "size_mb": 0,
                            "modified": None
                        }
            else:
                status[species]["files"] = {f"{species}_{f}": {"exists": False, "size_mb": 0, "modified": None} 
                                          for f in ["assembly_report.txt", "genomic.fna", "protein.faa", "genomic.gff"]}
        
        return status
    
    def get_genome_stats(self) -> Dict:
        """Calculate genome statistics."""
        stats = {}
        species_info = self.get_species_info()
        
        for species, info in species_info.items():
            species_dir = self.genomes_dir / species
            stats[species] = {
                "name": info["name"],
                "genome_size_mb": info["genome_size_mb"],
                "chromosomes": info["chromosomes"],
                "protein_count": 0,
                "gene_count": 0,
                "swissprot_hits": 0,
                "trembl_hits": 0
            }
            
            # Count proteins
            protein_file = species_dir / f"{species}_protein.faa"
            if protein_file.exists():
                with open(protein_file) as f:
                    stats[species]["protein_count"] = sum(1 for line in f if line.startswith(">"))
            
            # Count genes from GFF
            gff_file = species_dir / f"{species}_genomic.gff"
            if gff_file.exists():
                with open(gff_file) as f:
                    stats[species]["gene_count"] = sum(1 for line in f if line.startswith("#") == False and "gene" in line.split("\t")[2])
            
            # Count SwissProt entries
            swissprot_file = species_dir / f"{species}_swissprot.fasta"
            if swissprot_file.exists():
                with open(swissprot_file) as f:
                    stats[species]["swissprot_hits"] = sum(1 for line in f if line.startswith(">"))
            
            # Count TrEMBL entries
            trembl_file = species_dir / f"{species}_trembl.fasta"
            if trembl_file.exists():
                with open(trembl_file) as f:
                    stats[species]["trembl_hits"] = sum(1 for line in f if line.startswith(">"))
        
        return stats
    
    def create_genome_comparison_chart(self) -> str:
        """Create a comparison chart of genome statistics."""
        stats = self.get_genome_stats()
        
        # Prepare data for plotting
        species_names = [stats[s]["name"] for s in stats.keys()]
        genome_sizes = [stats[s]["genome_size_mb"] for s in stats.keys()]
        protein_counts = [stats[s]["protein_count"] for s in stats.keys()]
        gene_counts = [stats[s]["gene_count"] for s in stats.keys()]
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Genome Size (MB)', 'Protein Count', 'Gene Count', 'Data Coverage'),
            specs=[[{"type": "bar"}, {"type": "bar"}],
                   [{"type": "bar"}, {"type": "pie"}]]
        )
        
        # Genome size
        fig.add_trace(
            go.Bar(x=species_names, y=genome_sizes, name="Genome Size (MB)", marker_color='lightblue'),
            row=1, col=1
        )
        
        # Protein count
        fig.add_trace(
            go.Bar(x=species_names, y=protein_counts, name="Protein Count", marker_color='lightgreen'),
            row=1, col=2
        )
        
        # Gene count
        fig.add_trace(
            go.Bar(x=species_names, y=gene_counts, name="Gene Count", marker_color='lightcoral'),
            row=2, col=1
        )
        
        # Data coverage pie chart
        total_files = len(stats) * 9  # 9 expected files per species
        existing_files = sum(1 for s in stats.values() for f in s.values() if isinstance(f, dict) and f.get("exists", False))
        missing_files = total_files - existing_files
        
        fig.add_trace(
            go.Pie(labels=['Downloaded', 'Missing'], values=[existing_files, missing_files], 
                   marker_colors=['lightgreen', 'lightcoral']),
            row=2, col=2
        )
        
        fig.update_layout(height=600, title_text="Genome Data Overview")
        
        return fig.to_html(full_html=False)
    
    def create_file_status_chart(self) -> str:
        """Create a chart showing file download status."""
        status = self.get_file_status()
        
        # Prepare data
        file_types = ["Assembly Report", "Genome FASTA", "Protein FASTA", "GFF Annotation", 
                     "SwissProt FASTA", "SwissProt JSON", "TrEMBL FASTA", "BLAST Results", "Summary"]
        
        species_names = [status[s]["name"] for s in status.keys()]
        
        # Create heatmap data
        heatmap_data = []
        for species in status.keys():
            row = []
            for file_type in file_types:
                file_key = f"{species}_{file_type.lower().replace(' ', '_')}.txt"
                if file_key in status[species]["files"]:
                    row.append(1 if status[species]["files"][file_key]["exists"] else 0)
                else:
                    row.append(0)
            heatmap_data.append(row)
        
        fig = go.Figure(data=go.Heatmap(
            z=heatmap_data,
            x=file_types,
            y=species_names,
            colorscale='RdYlGn',
            showscale=True
        ))
        
        fig.update_layout(
            title="File Download Status",
            xaxis_title="File Types",
            yaxis_title="Species",
            height=400
        )
        
        return fig.to_html(full_html=False)
    
    def get_download_logs(self) -> List[Dict]:
        """Get recent download activity logs."""
        logs = []
        
        # Check for download summary files
        for species in ["c.sativa", "p.cubensis"]:
            summary_file = self.genomes_dir / species / f"{species}_download_summary.md"
            if summary_file.exists():
                mtime = datetime.datetime.fromtimestamp(summary_file.stat().st_mtime)
                logs.append({
                    "timestamp": mtime.strftime("%Y-%m-%d %H:%M:%S"),
                    "species": species,
                    "action": "Download completed",
                    "status": "Success"
                })
        
        # Sort by timestamp
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return logs[:10]  # Return last 10 entries

# Initialize analyzer
analyzer = DataAnalyzer()

@app.route('/')
def index():
    """Main dashboard page."""
    species_info = analyzer.get_species_info()
    file_status = analyzer.get_file_status()
    genome_stats = analyzer.get_genome_stats()
    download_logs = analyzer.get_download_logs()
    
    return render_template('index.html',
                         species_info=species_info,
                         file_status=file_status,
                         genome_stats=genome_stats,
                         download_logs=download_logs)

@app.route('/api/stats')
def api_stats():
    """API endpoint for genome statistics."""
    return jsonify(analyzer.get_genome_stats())

@app.route('/api/status')
def api_status():
    """API endpoint for file status."""
    return jsonify(analyzer.get_file_status())

@app.route('/api/charts/genome-comparison')
def api_genome_comparison():
    """API endpoint for genome comparison chart."""
    return analyzer.create_genome_comparison_chart()

@app.route('/api/charts/file-status')
def api_file_status():
    """API endpoint for file status chart."""
    return analyzer.create_file_status_chart()

@app.route('/download/<species>')
def download_species(species):
    """Trigger download for a specific species."""
    try:
        # Run the download script for the specific species
        result = subprocess.run([
            sys.executable, "download_genomes.py", "--species", species
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({"status": "success", "message": f"Download started for {species}"})
        else:
            return jsonify({"status": "error", "message": result.stderr})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files."""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 