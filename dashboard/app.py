#!/usr/bin/env python3
"""
Metabolomics Network Dashboard

A web-based dashboard for visualizing metabolic networks using Cytoscape.js,
showing metabolites as nodes and enzymes as edges, with metrics on disconnected components.
"""

import os
import json
import networkx as nx
from flask import Flask, render_template, jsonify, request, send_from_directory
from pathlib import Path
import datetime
from typing import Dict, List, Optional, Tuple
import subprocess
import sys
import re
from collections import defaultdict

app = Flask(__name__)

class MetabolicNetworkAnalyzer:
    """Analyze and process metabolic networks for dashboard visualization."""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.genomes_dir = self.base_dir / "genomes"
        self.networks_dir = self.base_dir / "networks"
        self.networks_dir.mkdir(exist_ok=True)
        
        # Species information
        self.species = {
            "c.sativa": {
                "name": "Cannabis sativa",
                "taxid": "3483",
                "key_pathways": [
                    "Cannabinoid biosynthesis",
                    "Terpene biosynthesis", 
                    "Fatty acid metabolism",
                    "Secondary metabolite pathways"
                ]
            },
            "p.cubensis": {
                "name": "Psilocybe cubensis",
                "taxid": "5341",
                "key_pathways": [
                    "Tryptamine biosynthesis",
                    "Psilocybin pathway",
                    "Amino acid metabolism",
                    "Fungal secondary metabolism"
                ]
            }
        }
    
    def parse_gff_annotations(self, species: str) -> Dict:
        """Parse GFF annotations to extract gene information."""
        gff_file = self.genomes_dir / species / f"{species}_genomic.gff"
        genes = {}
        
        if not gff_file.exists():
            return genes
        
        with open(gff_file) as f:
            for line in f:
                if line.startswith('#'):
                    continue
                
                parts = line.strip().split('\t')
                if len(parts) < 9:
                    continue
                
                feature_type = parts[2]
                if feature_type == 'gene':
                    attributes = parts[8]
                    gene_id = self._extract_attribute(attributes, 'ID')
                    gene_name = self._extract_attribute(attributes, 'Name')
                    
                    if gene_id:
                        genes[gene_id] = {
                            'name': gene_name or gene_id,
                            'chromosome': parts[0],
                            'start': int(parts[3]),
                            'end': int(parts[4]),
                            'strand': parts[6],
                            'type': feature_type
                        }
        
        return genes
    
    def _extract_attribute(self, attributes: str, key: str) -> Optional[str]:
        """Extract attribute value from GFF attributes string."""
        pattern = rf'{key}=([^;]+)'
        match = re.search(pattern, attributes)
        return match.group(1) if match else None
    
    def parse_protein_annotations(self, species: str) -> Dict:
        """Parse protein FASTA to extract protein information."""
        protein_file = self.genomes_dir / species / f"{species}_protein.faa"
        proteins = {}
        
        if not protein_file.exists():
            return proteins
        
        current_protein = None
        with open(protein_file) as f:
            for line in f:
                if line.startswith('>'):
                    # Parse header line
                    header = line.strip()[1:]  # Remove '>'
                    parts = header.split(' ')
                    protein_id = parts[0]
                    
                    # Extract description
                    description = ' '.join(parts[1:]) if len(parts) > 1 else ''
                    
                    proteins[protein_id] = {
                        'id': protein_id,
                        'description': description,
                        'sequence': ''
                    }
                    current_protein = protein_id
                elif current_protein:
                    proteins[current_protein]['sequence'] += line.strip()
        
        return proteins
    
    def parse_blast_results(self, species: str) -> Dict:
        """Parse BLAST results to get protein annotations."""
        blast_file = self.genomes_dir / species / f"{species}_blast_results.txt"
        annotations = {}
        
        if not blast_file.exists():
            return annotations
        
        with open(blast_file) as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) >= 13:
                    query_id = parts[0]
                    subject_id = parts[1]
                    identity = float(parts[2])
                    evalue = float(parts[10])
                    subject_title = parts[12]
                    
                    if query_id not in annotations:
                        annotations[query_id] = []
                    
                    annotations[query_id].append({
                        'subject_id': subject_id,
                        'identity': identity,
                        'evalue': evalue,
                        'title': subject_title
                    })
        
        return annotations
    
    def build_metabolic_network(self, species: str) -> Dict:
        """Build metabolic network from genome data."""
        print(f"Building metabolic network for {species}...")
        
        # Load data
        genes = self.parse_gff_annotations(species)
        proteins = self.parse_protein_annotations(species)
        blast_annotations = self.parse_blast_results(species)
        
        # Create network
        network = {
            'nodes': [],
            'edges': [],
            'metabolites': {},
            'enzymes': {},
            'disconnected_metabolites': [],
            'disconnected_enzymes': []
        }
        
        # Add metabolite nodes (from KEGG pathways)
        metabolites = self._get_kegg_metabolites(species)
        for met_id, met_info in metabolites.items():
            network['nodes'].append({
                'id': met_id,
                'label': met_info['name'],
                'type': 'metabolite',
                'kegg_id': met_info.get('kegg_id'),
                'formula': met_info.get('formula'),
                'mass': met_info.get('mass'),
                'pathway': met_info.get('pathway')
            })
            network['metabolites'][met_id] = met_info
        
        # Add enzyme nodes and edges
        enzyme_count = 0
        for protein_id, protein_info in proteins.items():
            # Check if protein has metabolic annotations
            if protein_id in blast_annotations:
                best_hit = blast_annotations[protein_id][0]  # Best hit
                
                # Extract enzyme information from annotation
                enzyme_info = self._extract_enzyme_info(best_hit['title'])
                
                if enzyme_info:
                    enzyme_id = f"enzyme_{enzyme_count}"
                    enzyme_count += 1
                    
                    # Add enzyme node
                    network['nodes'].append({
                        'id': enzyme_id,
                        'label': enzyme_info['name'],
                        'type': 'enzyme',
                        'protein_id': protein_id,
                        'ec_number': enzyme_info.get('ec_number'),
                        'reaction': enzyme_info.get('reaction'),
                        'pathway': enzyme_info.get('pathway')
                    })
                    
                    # Add edges to metabolites
                    if enzyme_info.get('substrates'):
                        for substrate in enzyme_info['substrates']:
                            if substrate in metabolites:
                                network['edges'].append({
                                    'id': f"{enzyme_id}_{substrate}",
                                    'source': substrate,
                                    'target': enzyme_id,
                                    'type': 'substrate',
                                    'reaction': enzyme_info.get('reaction')
                                })
                    
                    if enzyme_info.get('products'):
                        for product in enzyme_info['products']:
                            if product in metabolites:
                                network['edges'].append({
                                    'id': f"{enzyme_id}_{product}",
                                    'source': enzyme_id,
                                    'target': product,
                                    'type': 'product',
                                    'reaction': enzyme_info.get('reaction')
                                })
                    
                    network['enzymes'][enzyme_id] = enzyme_info
        
        # Identify disconnected components
        network['disconnected_metabolites'] = self._find_disconnected_metabolites(network)
        network['disconnected_enzymes'] = self._find_disconnected_enzymes(network)
        
        # Save network
        network_file = self.networks_dir / f"{species}_network.json"
        with open(network_file, 'w') as f:
            json.dump(network, f, indent=2)
        
        return network
    
    def _get_kegg_metabolites(self, species: str) -> Dict:
        """Get KEGG metabolites for the species."""
        metabolites = {}
        
        if species == "c.sativa":
            # Load cannabis compounds from our database
            cannabis_file = self.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "compounds" / "cannabis_compounds.json"
            if cannabis_file.exists():
                with open(cannabis_file) as f:
                    cannabis_data = json.load(f)
                    for compound in cannabis_data.get('compounds', []):
                        metabolites[compound['id']] = {
                            "name": compound['name'],
                            "kegg_id": compound.get('kegg_id'),
                            "formula": compound['formula'],
                            "mass": compound['mass'],
                            "pathway": compound['pathway'],
                            "description": compound.get('description'),
                            "biological_activity": compound.get('biological_activity'),
                            "concentration_range": compound.get('concentration_range')
                        }
            else:
                # Fallback to example metabolites
                metabolites = {
                    "met_001": {"name": "THCA", "kegg_id": "C16514", "formula": "C22H30O4", "mass": 358.45, "pathway": "Cannabinoid biosynthesis"},
                    "met_002": {"name": "CBDA", "kegg_id": "C16515", "formula": "C22H30O4", "mass": 358.45, "pathway": "Cannabinoid biosynthesis"},
                    "met_003": {"name": "Geranyl pyrophosphate", "kegg_id": "C00235", "formula": "C10H20O7P2", "mass": 314.21, "pathway": "Terpene biosynthesis"},
                    "met_004": {"name": "Farnesyl pyrophosphate", "kegg_id": "C00448", "formula": "C15H28O7P2", "mass": 382.33, "pathway": "Terpene biosynthesis"},
                    "met_005": {"name": "Olivetolic acid", "kegg_id": "C16516", "formula": "C12H16O4", "mass": 224.26, "pathway": "Cannabinoid biosynthesis"}
                }
        elif species == "p.cubensis":
            return {
                "met_001": {"name": "Psilocybin", "kegg_id": "C16517", "formula": "C12H17N2O4P", "mass": 284.25, "pathway": "Tryptamine biosynthesis"},
                "met_002": {"name": "Psilocin", "kegg_id": "C16518", "formula": "C12H16N2O", "mass": 204.27, "pathway": "Tryptamine biosynthesis"},
                "met_003": {"name": "Tryptophan", "kegg_id": "C00078", "formula": "C11H12N2O2", "mass": 204.23, "pathway": "Amino acid metabolism"},
                "met_004": {"name": "Tryptamine", "kegg_id": "C00398", "formula": "C10H12N2", "mass": 160.22, "pathway": "Tryptamine biosynthesis"},
                "met_005": {"name": "Serotonin", "kegg_id": "C00780", "formula": "C10H12N2O", "mass": 176.22, "pathway": "Tryptamine biosynthesis"}
            }
        return metabolites
    
    def _extract_enzyme_info(self, annotation: str) -> Optional[Dict]:
        """Extract enzyme information from BLAST annotation."""
        # Load cannabis enzymes from our database
        cannabis_file = self.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "enzymes" / "cannabis_enzymes.json"
        if cannabis_file.exists():
            with open(cannabis_file) as f:
                cannabis_data = json.load(f)
                for enzyme in cannabis_data.get('enzymes', []):
                    # Check if annotation contains enzyme name or EC number
                    if (enzyme['name'].lower() in annotation.lower() or 
                        enzyme['ec_number'] in annotation or
                        enzyme['id'].lower() in annotation.lower()):
                        return {
                            "name": enzyme['name'],
                            "ec_number": enzyme['ec_number'],
                            "reaction": enzyme['reaction'],
                            "pathway": enzyme['pathway'],
                            "substrates": [enzyme['substrate']],
                            "products": [enzyme['product']],
                            "uniprot_id": enzyme.get('uniprot_id'),
                            "kegg_id": enzyme.get('kegg_id')
                        }
        
        # Fallback to generic parsing
        if "transferase" in annotation.lower():
            return {
                "name": "Transferase",
                "ec_number": "2.x.x.x",
                "reaction": "Transfer of functional group",
                "pathway": "Metabolism",
                "substrates": ["met_001"],
                "products": ["met_002"]
            }
        elif "synthase" in annotation.lower():
            return {
                "name": "Synthase",
                "ec_number": "4.x.x.x",
                "reaction": "Synthesis reaction",
                "pathway": "Biosynthesis",
                "substrates": ["met_003"],
                "products": ["met_004"]
            }
        elif "reductase" in annotation.lower():
            return {
                "name": "Reductase",
                "ec_number": "1.x.x.x",
                "reaction": "Reduction reaction",
                "pathway": "Metabolism",
                "substrates": ["met_005"],
                "products": ["met_001"]
            }
        return None
    
    def _find_disconnected_metabolites(self, network: Dict) -> List:
        """Find metabolites that are not connected to the main network."""
        connected_metabolites = set()
        
        for edge in network['edges']:
            if edge['source'] in network['metabolites']:
                connected_metabolites.add(edge['source'])
            if edge['target'] in network['metabolites']:
                connected_metabolites.add(edge['target'])
        
        disconnected = []
        for met_id, met_info in network['metabolites'].items():
            if met_id not in connected_metabolites:
                disconnected.append({
                    'id': met_id,
                    'name': met_info['name'],
                    'pathway': met_info.get('pathway'),
                    'formula': met_info.get('formula')
                })
        
        return disconnected
    
    def _find_disconnected_enzymes(self, network: Dict) -> List:
        """Find enzymes that are not connected to metabolites."""
        connected_enzymes = set()
        
        for edge in network['edges']:
            if edge['source'] in network['enzymes']:
                connected_enzymes.add(edge['source'])
            if edge['target'] in network['enzymes']:
                connected_enzymes.add(edge['target'])
        
        disconnected = []
        for enzyme_id, enzyme_info in network['enzymes'].items():
            if enzyme_id not in connected_enzymes:
                disconnected.append({
                    'id': enzyme_id,
                    'name': enzyme_info['name'],
                    'ec_number': enzyme_info.get('ec_number'),
                    'pathway': enzyme_info.get('pathway')
                })
        
        return disconnected
    
    def get_network_metrics(self, species: str) -> Dict:
        """Get comprehensive metrics for the metabolic network."""
        network_file = self.networks_dir / f"{species}_network.json"
        
        if not network_file.exists():
            # Build network if it doesn't exist
            network = self.build_metabolic_network(species)
        else:
            with open(network_file) as f:
                network = json.load(f)
        
        # Calculate metrics
        total_metabolites = len(network['metabolites'])
        total_enzymes = len(network['enzymes'])
        total_edges = len(network['edges'])
        
        # Network analysis using NetworkX
        G = nx.DiGraph()
        for edge in network['edges']:
            G.add_edge(edge['source'], edge['target'])
        
        # Calculate network metrics
        metrics = {
            'total_metabolites': total_metabolites,
            'total_enzymes': total_enzymes,
            'total_edges': total_edges,
            'connected_metabolites': total_metabolites - len(network['disconnected_metabolites']),
            'connected_enzymes': total_enzymes - len(network['disconnected_enzymes']),
            'disconnected_metabolites': len(network['disconnected_metabolites']),
            'disconnected_enzymes': len(network['disconnected_enzymes']),
            'network_density': nx.density(G) if G.number_of_edges() > 0 else 0,
            'average_degree': sum(dict(G.degree()).values()) / G.number_of_nodes() if G.number_of_nodes() > 0 else 0,
            'number_of_components': nx.number_strongly_connected_components(G),
            'largest_component_size': len(max(nx.strongly_connected_components(G), key=len)) if G.number_of_nodes() > 0 else 0
        }
        
        return metrics

# Initialize analyzer
analyzer = MetabolicNetworkAnalyzer()

@app.route('/')
def index():
    """Main dashboard page."""
    species_info = analyzer.species
    networks = {}
    metrics = {}
    
    for species in species_info.keys():
        try:
            networks[species] = analyzer.build_metabolic_network(species)
            metrics[species] = analyzer.get_network_metrics(species)
        except Exception as e:
            print(f"Error processing {species}: {e}")
            networks[species] = {'nodes': [], 'edges': [], 'metabolites': {}, 'enzymes': {}}
            metrics[species] = {}
    
    return render_template('index.html',
                         species_info=species_info,
                         networks=networks,
                         metrics=metrics)

@app.route('/api/network/<species>')
def api_network(species):
    """API endpoint for network data."""
    try:
        network = analyzer.build_metabolic_network(species)
        return jsonify(network)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics/<species>')
def api_metrics(species):
    """API endpoint for network metrics."""
    try:
        metrics = analyzer.get_network_metrics(species)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/species')
def api_species():
    """API endpoint for species information."""
    return jsonify(analyzer.species)

@app.route('/api/cannabis/compounds')
def api_cannabis_compounds():
    """API endpoint for cannabis compounds."""
    try:
        cannabis_file = analyzer.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "compounds" / "cannabis_compounds.json"
        if cannabis_file.exists():
            with open(cannabis_file) as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'Cannabis compounds data not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cannabis/enzymes')
def api_cannabis_enzymes():
    """API endpoint for cannabis enzymes."""
    try:
        cannabis_file = analyzer.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "enzymes" / "cannabis_enzymes.json"
        if cannabis_file.exists():
            with open(cannabis_file) as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'Cannabis enzymes data not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cannabis/pathways')
def api_cannabis_pathways():
    """API endpoint for cannabis pathways."""
    try:
        cannabis_file = analyzer.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "pathways" / "cannabis_pathways.json"
        if cannabis_file.exists():
            with open(cannabis_file) as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'Cannabis pathways data not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cannabis/network')
def api_cannabis_network():
    """API endpoint for cannabis metabolic network."""
    try:
        cannabis_file = analyzer.base_dir / ".." / "agents" / "metabolomics-agent" / "data" / "cannabis" / "cannabis_network.json"
        if cannabis_file.exists():
            with open(cannabis_file) as f:
                return jsonify(json.load(f))
        else:
            return jsonify({'error': 'Cannabis network data not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files."""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000) 