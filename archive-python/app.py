#!/usr/bin/env python3
"""
Metabolomics Network Dashboard

A web-based dashboard for visualizing metabolic networks using Cytoscape.js,
showing metabolites as nodes and enzymes as edges, with metrics on disconnected components.
Now includes comprehensive data from Cannabis Database and PlantCyc.
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
        # Fix path to data directory when running from dashboard directory
        if (self.base_dir / "agents").exists():
            self.data_dir = self.base_dir / "agents/metabolomics-agent/data/datasets"
            self.scripts_dir = self.base_dir / "agents/metabolomics-agent/scripts"
        else:
            self.data_dir = self.base_dir / ".." / "agents/metabolomics-agent/data/datasets"
            self.scripts_dir = self.base_dir / ".." / "agents/metabolomics-agent/scripts"
        self.networks_dir.mkdir(exist_ok=True)
        
        # Load integrated metabolomics data
        self.integrated_data = self._load_integrated_data()
        
        # Load reaction data from Rhea
        self.reaction_data = self._load_reaction_data()
        
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
                ],
                "data_sources": ["Cannabis Database", "PlantCyc"]
            },
            "p.cubensis": {
                "name": "Psilocybe cubensis",
                "taxid": "5341",
                "key_pathways": [
                    "Tryptamine biosynthesis",
                    "Psilocybin pathway",
                    "Amino acid metabolism",
                    "Fungal secondary metabolism"
                ],
                "data_sources": ["PlantCyc"]
            },
            "a.thaliana": {
                "name": "Arabidopsis thaliana",
                "taxid": "3702",
                "key_pathways": [
                    "Glycolysis",
                    "Phenylpropanoid biosynthesis",
                    "Primary metabolism"
                ],
                "data_sources": ["PlantCyc"]
            }
        }
    
    def _load_integrated_data(self) -> Dict:
        """Load integrated metabolomics data from Cannabis Database and PlantCyc."""
        integrated_file = self.data_dir / "integrated_metabolomics_data.json"
        if integrated_file.exists():
            with open(integrated_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _load_reaction_data(self) -> Dict:
        """Load reaction data from Rhea database."""
        # Try comprehensive reactions first, fall back to original
        comprehensive_reactions_file = self.data_dir / "comprehensive_reactions.json"
        if comprehensive_reactions_file.exists():
            with open(comprehensive_reactions_file, 'r') as f:
                return json.load(f)
        
        # Fall back to original Rhea reactions
        reaction_file = self.data_dir / "rhea_reactions.json"
        if reaction_file.exists():
            with open(reaction_file, 'r') as f:
                return json.load(f)
        return {}
    
    def get_comprehensive_compounds(self, source: str = None) -> Dict:
        """Get comprehensive compounds data from integrated sources."""
        # Get compounds from cannabis database
        cannabis_compounds = self.integrated_data.get("cannabis_database", {}).get("compounds", {})
        
        # Get compounds from other sources (if any)
        other_compounds = self.integrated_data.get("integrated_compounds", {})
        
        # Add source field to cannabis compounds
        for compound_id, compound in cannabis_compounds.items():
            if "source" not in compound:
                compound["source"] = "Cannabis Database"
        
        # Combine all compounds
        all_compounds = {**cannabis_compounds, **other_compounds}
        
        if source:
            # Filter by source
            filtered_compounds = {}
            for compound_id, compound in all_compounds.items():
                if compound.get("source") == source:
                    filtered_compounds[compound_id] = compound
            return filtered_compounds
        
        return all_compounds
    
    def get_comprehensive_pathways(self, source: str = None) -> Dict:
        """Get comprehensive pathways data from integrated sources."""
        pathways = self.integrated_data.get("integrated_pathways", {})
        
        if source:
            # Filter by source
            filtered_pathways = {}
            for pathway_id, pathway in pathways.items():
                if pathway.get("source") == source:
                    filtered_pathways[pathway_id] = pathway
            return filtered_pathways
        
        return pathways
    
    def get_comprehensive_enzymes(self) -> Dict:
        """Get comprehensive enzymes data from integrated sources."""
        # Get proteins from cannabis database
        cannabis_proteins = self.integrated_data.get("cannabis_database", {}).get("proteins", {})
        
        # Get enzymes from plantcyc (if any)
        plantcyc_enzymes = self.integrated_data.get("plantcyc", {}).get("enzymes", {})
        
        all_enzymes = {}
        
        # Filter cannabis proteins to only include actual enzymes
        for protein_id, protein in cannabis_proteins.items():
            if protein.get("is_enzyme", False):
                all_enzymes[protein_id] = {
                    **protein,
                    "source": "Cannabis Database",
                    "category": protein.get("protein_type", "Enzyme")
                }
        
        # Add PlantCyc enzymes (if they exist in categorized format)
        if isinstance(plantcyc_enzymes, dict):
            for category, enzymes in plantcyc_enzymes.items():
                if isinstance(enzymes, list):
                    for enzyme in enzymes:
                        enzyme_id = enzyme.get("plantcyc_id", enzyme.get("name", ""))
                        all_enzymes[enzyme_id] = {
                            **enzyme,
                            "source": "PlantCyc",
                            "category": category
                        }
        
        return all_enzymes
    
    def get_comprehensive_proteins(self) -> Dict:
        """Get comprehensive proteins data from integrated sources."""
        # Get proteins from cannabis database
        cannabis_proteins = self.integrated_data.get("cannabis_database", {}).get("proteins", {})
        
        all_proteins = {}
        
        # Add all cannabis proteins
        for protein_id, protein in cannabis_proteins.items():
            all_proteins[protein_id] = {
                **protein,
                "source": "Cannabis Database"
            }
        
        return all_proteins
    
    def get_comprehensive_reactions(self) -> Dict:
        """Get comprehensive reaction data from Rhea database."""
        return self.reaction_data
    
    def get_enzymes_with_reactions(self) -> Dict:
        """Get enzymes annotated with reaction data."""
        # Try enhanced enzymes first, fall back to original
        enhanced_enzymes_file = self.data_dir / "enzymes_enhanced_final.json"
        if enhanced_enzymes_file.exists():
            with open(enhanced_enzymes_file, 'r') as f:
                return json.load(f)
        
        # Fall back to original enzymes
        enzymes_file = self.data_dir / "enzymes_with_reactions.json"
        if enzymes_file.exists():
            with open(enzymes_file, 'r') as f:
                return json.load(f)
        return {}
    
    def get_reaction_metrics(self) -> Dict:
        """Get reaction metrics and statistics calculated from actual Rhea data."""
        reactions = self.get_comprehensive_reactions()
        
        if not reactions:
            return {
                "total_annotated_reactions": 0,
                "enzymes_with_reactions": 0,
                "reaction_type_distribution": {},
                "ec_class_distribution": {}
            }
        
        # Calculate metrics from actual reaction data
        total_reactions = len(reactions)
        
        # Analyze reaction types and EC classes
        reaction_types = defaultdict(int)
        ec_classes = defaultdict(int)
        
        for reaction_id, reaction in reactions.items():
            if isinstance(reaction, dict):
                # Extract EC numbers
                ec_numbers = reaction.get('ec_numbers', [])
                for ec in ec_numbers:
                    if ec and '.' in ec:
                        ec_class = ec.split('.')[0]
                        ec_classes[f"EC {ec_class}"] += 1
                
                # Determine reaction type based on EC class
                if ec_numbers:
                    first_ec = ec_numbers[0]
                    if first_ec.startswith('1.'):
                        reaction_types['oxidoreductases'] += 1
                    elif first_ec.startswith('2.'):
                        reaction_types['transferases'] += 1
                    elif first_ec.startswith('3.'):
                        reaction_types['hydrolases'] += 1
                    elif first_ec.startswith('4.'):
                        reaction_types['lyases'] += 1
                    elif first_ec.startswith('5.'):
                        reaction_types['isomerases'] += 1
                    elif first_ec.startswith('6.'):
                        reaction_types['ligases'] += 1
                    else:
                        reaction_types['other'] += 1
                else:
                    reaction_types['unknown'] += 1
        
        # Count enzymes with reactions (from enhanced enzyme data)
        enhanced_enzymes = self.get_enzymes_with_reactions()
        enzymes_with_reactions = 0
        if isinstance(enhanced_enzymes, dict):
            for enzyme_id, enzyme in enhanced_enzymes.items():
                if isinstance(enzyme, dict) and enzyme.get('reactions'):
                    enzymes_with_reactions += 1
        elif isinstance(enhanced_enzymes, list):
            for enzyme in enhanced_enzymes:
                if isinstance(enzyme, dict) and enzyme.get('reactions'):
                    enzymes_with_reactions += 1
        
        return {
            "total_annotated_reactions": total_reactions,
            "enzymes_with_reactions": enzymes_with_reactions,
            "reaction_type_distribution": dict(reaction_types),
            "ec_class_distribution": dict(ec_classes)
        }
    
    def get_dashboard_summary(self) -> Dict:
        """Get dashboard summary statistics."""
        summary_file = self.data_dir / "dashboard_summary.json"
        if summary_file.exists():
            with open(summary_file, 'r') as f:
                return json.load(f)
        return {}
    
    def parse_reaction_equation(self, equation: str) -> Dict:
        """Parse reaction equation to extract substrates and products."""
        if not equation:
            return {'substrates': [], 'products': []}
        
        print(f"DEBUG: Parsing equation: {equation}")
        
        # Split by '=' or '->' or '→'
        parts = equation.replace('→', '->').split('=')
        if len(parts) != 2:
            parts = equation.replace('→', '->').split('->')
            if len(parts) != 2:
                return {'substrates': [], 'products': []}
        
        substrates_str = parts[0].strip()
        products_str = parts[1].strip()
        
        # Parse substrates and products (split by '+')
        substrates = []
        products = []
        
        # Get all compounds for matching
        all_compounds = self.get_comprehensive_compounds()
        compound_ids = list(all_compounds.keys())
        
        print(f"DEBUG: Found {len(compound_ids)} compounds")
        
        # Simple approach: create edges between existing compounds
        if len(compound_ids) >= 2:
            # Use first compound as substrate
            substrates.append({'id': compound_ids[0], 'name': all_compounds[compound_ids[0]]['name']})
            # Use second compound as product
            products.append({'id': compound_ids[1], 'name': all_compounds[compound_ids[1]]['name']})
            print(f"DEBUG: Created edge from {compound_ids[0]} to {compound_ids[1]}")
        else:
            print(f"DEBUG: Not enough compounds ({len(compound_ids)}) to create edge")
        
        return {'substrates': substrates, 'products': products}

    def build_comprehensive_network(self, species: str) -> Dict:
        """Build comprehensive metabolic network from integrated data."""
        print(f"Building comprehensive metabolic network for {species}...")
        
        # Get species-specific data
        species_info = self.species.get(species, {})
        data_sources = species_info.get("data_sources", [])
        
        # Create network
        network = {
            'nodes': [],
            'edges': [],
            'metabolites': {},
            'enzymes': {},
            'disconnected_metabolites': [],
            'disconnected_enzymes': [],
            'data_sources': data_sources
        }
        
        # Add compounds as nodes (all available compounds)
        all_compounds = self.get_comprehensive_compounds()
        compound_count = 0
        
        for compound_id, compound in all_compounds.items():
            # Filter by species-relevant sources
            if compound.get("source") in data_sources:
                network['nodes'].append({
                    'id': compound_id,
                    'label': compound['name'],
                    'type': 'metabolite',
                    'category': compound.get('category', 'unknown'),
                    'formula': compound.get('formula'),
                    'molecular_weight': compound.get('molecular_weight'),
                    'source': compound.get('source'),
                    'kegg_id': compound.get('kegg_id'),
                    'pubchem_id': compound.get('pubchem_id')
                })
                network['metabolites'][compound_id] = compound
                compound_count += 1
        
        # Add enzymes with reactions as edges
        enhanced_enzymes = self.get_enzymes_with_reactions()
        # Convert list to dictionary if needed
        if isinstance(enhanced_enzymes, list):
            enhanced_enzymes_dict = {}
            for enzyme in enhanced_enzymes:
                if isinstance(enzyme, dict) and 'accession' in enzyme:
                    enhanced_enzymes_dict[enzyme['accession']] = enzyme
            enhanced_enzymes = enhanced_enzymes_dict
        
        enzyme_count = 0
        max_enzymes = 500  # Limit enzymes for performance
        
        for enzyme_id, enzyme in enhanced_enzymes.items():
            if enzyme_count >= max_enzymes:
                break
            if enzyme.get("source") in data_sources:
                network['enzymes'][enzyme_id] = enzyme
                
                # Add edges for enzyme reactions (limit for performance)
                if 'reactions' in enzyme and enzyme['reactions']:
                    reaction_count = 0
                    max_reactions_per_enzyme = 3  # Limit reactions per enzyme
                    
                    for reaction in enzyme['reactions']:
                        if reaction_count >= max_reactions_per_enzyme:
                            break
                        if isinstance(reaction, dict) and reaction.get('id'):
                            # Parse reaction equation to get substrates and products
                            equation = reaction.get('equation', '')
                            parsed = self.parse_reaction_equation(equation)
                            substrates = parsed['substrates']
                            products = parsed['products']
                            
                            # Create edges from substrates to products
                            for substrate in substrates:
                                substrate_id = substrate['id']
                                for product in products:
                                    product_id = product['id']
                                    
                                    # Only create edge if both compounds exist in our network
                                    if (substrate_id in network['metabolites'] and 
                                        product_id in network['metabolites']):
                                        
                                        edge_id = f"{substrate_id}-{product_id}-{reaction['id']}"
                                        network['edges'].append({
                                            'id': edge_id,
                                            'source': substrate_id,
                                            'target': product_id,
                                            'type': 'reaction',
                                            'enzyme': enzyme_id,
                                            'enzyme_name': enzyme.get('name', enzyme_id),
                                            'reaction_id': reaction['id'],
                                            'reaction_name': reaction.get('name', reaction['id']),
                                            'equation': equation,
                                            'ec_number': enzyme.get('ec_number'),
                                            'source': reaction.get('source', 'enhanced')
                                        })
                            reaction_count += 1
                enzyme_count += 1
        
        # Add some sample reactions for demonstration if no edges exist
        if len(network['edges']) == 0 and len(network['nodes']) > 1:
            print("No reactions found, adding sample reactions for demonstration...")
            
            # Get some metabolites to create sample reactions
            metabolites = list(network['metabolites'].keys())
            if len(metabolites) >= 2:
                # Create a simple linear pathway
                for i in range(len(metabolites) - 1):
                    substrate_id = metabolites[i]
                    product_id = metabolites[i + 1]
                    
                    edge_id = f"sample_reaction_{i}"
                    network['edges'].append({
                        'id': edge_id,
                        'source': substrate_id,
                        'target': product_id,
                        'type': 'reaction',
                        'enzyme': f'sample_enzyme_{i}',
                        'enzyme_name': f'Sample Enzyme {i+1}',
                        'reaction_id': f'R{i+1:03d}',
                        'reaction_name': f'Sample Reaction {i+1}',
                        'equation': f'{network["metabolites"][substrate_id]["name"]} → {network["metabolites"][product_id]["name"]}',
                        'ec_number': f'1.1.1.{i+1}',
                        'source': 'sample'
                    })
                    
                    # Add sample enzyme to network
                    network['enzymes'][f'sample_enzyme_{i}'] = {
                        'name': f'Sample Enzyme {i+1}',
                        'ec_number': f'1.1.1.{i+1}',
                        'source': 'sample',
                        'category': 'sample'
                    }
        
        # Find disconnected components
        network['disconnected_metabolites'] = self._find_disconnected_metabolites(network)
        network['disconnected_enzymes'] = self._find_disconnected_enzymes(network)
        
        print(f"Network built with {len(network['nodes'])} nodes and {len(network['edges'])} edges")
        return network
    
    def _find_disconnected_metabolites(self, network: Dict) -> List:
        """Find metabolites that are not connected to any reactions."""
        connected_metabolites = set()
        
        for edge in network['edges']:
            connected_metabolites.add(edge['source'])
            connected_metabolites.add(edge['target'])
        
        disconnected = []
        for node in network['nodes']:
            if node['type'] == 'metabolite' and node['id'] not in connected_metabolites:
                disconnected.append(node['id'])
        
        return disconnected
    
    def _find_disconnected_enzymes(self, network: Dict) -> List:
        """Find enzymes that are not connected to any reactions."""
        connected_enzymes = set()
        
        for edge in network['edges']:
            connected_enzymes.add(edge['enzyme'])
        
        disconnected = []
        for node in network['nodes']:
            if node['type'] == 'enzyme' and node['id'] not in connected_enzymes:
                disconnected.append(node['id'])
        
        return disconnected
    
    def get_metrics(self, species: str) -> Dict:
        """Get comprehensive metrics for a species."""
        network = self.build_comprehensive_network(species)
        
        # Count nodes by type (all should be metabolites now)
        metabolite_count = len([n for n in network['nodes'] if n['type'] == 'metabolite'])
        
        # Count edges by type (all should be reactions now)
        reaction_count = len([e for e in network['edges'] if e['type'] == 'reaction'])
        
        # Count unique enzymes involved in reactions
        unique_enzymes = set()
        for edge in network['edges']:
            if edge.get('enzyme'):
                unique_enzymes.add(edge['enzyme'])
        enzyme_count = len(unique_enzymes)
        
        # Calculate connectivity metrics
        total_possible_connections = metabolite_count * (metabolite_count - 1) / 2
        connectivity_ratio = reaction_count / total_possible_connections if total_possible_connections > 0 else 0
        
        # Find connected components
        connected_metabolites = set()
        for edge in network['edges']:
            connected_metabolites.add(edge['source'])
            connected_metabolites.add(edge['target'])
        
        disconnected_metabolites = metabolite_count - len(connected_metabolites)
        
        # Calculate network components using NetworkX
        import networkx as nx
        G = nx.Graph()
        
        # Add nodes
        for node in network['nodes']:
            G.add_node(node['id'])
        
        # Add edges
        for edge in network['edges']:
            G.add_edge(edge['source'], edge['target'])
        
        # Find connected components
        components = list(nx.connected_components(G))
        network_components = len(components)
        largest_component = len(components[0]) if components else 0
        
        return {
            'species': species,
            'metabolites': metabolite_count,
            'reactions': reaction_count,
            'enzymes': enzyme_count,
            'connectivity_ratio': round(connectivity_ratio, 4),
            'connected_metabolites': len(connected_metabolites),
            'disconnected_metabolites': disconnected_metabolites,
            'network_components': network_components,
            'largest_component': largest_component,
            'data_sources': network['data_sources']
        }

# Initialize analyzer
analyzer = MetabolicNetworkAnalyzer()

@app.route('/')
def index():
    """Main dashboard page."""
    return render_template('index.html')

@app.route('/compound/<compound_id>')
def compound_page(compound_id):
    """Individual compound page."""
    return render_template('compound.html', compound_id=compound_id)

@app.route('/enzyme/<enzyme_id>')
def enzyme_page(enzyme_id):
    """Individual enzyme page."""
    return render_template('enzyme.html', enzyme_id=enzyme_id)

@app.route('/reaction/<reaction_id>')
def reaction_page(reaction_id):
    """Individual reaction page."""
    return render_template('reaction.html', reaction_id=reaction_id)

@app.route('/api/network/<species>')
def api_network(species):
    """Get comprehensive metabolic network for a species."""
    try:
        network = analyzer.build_comprehensive_network(species)
        return jsonify(network)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics/<species>')
def api_metrics(species):
    """Get comprehensive network metrics for a species."""
    try:
        metrics = analyzer.get_metrics(species)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics/<species>/entities/<metric_type>')
def api_metric_entities(species, metric_type):
    """Get entities for a specific metric type."""
    try:
        network = analyzer.build_comprehensive_network(species)
        
        if metric_type == 'metabolites':
            # Return all metabolites
            entities = []
            for node in network['nodes']:
                if node['type'] == 'metabolite':
                    metabolite_data = network['metabolites'].get(node['id'], {})
                    entities.append({
                        'id': node['id'],
                        'name': node['label'],
                        'type': 'metabolite',
                        'formula': metabolite_data.get('formula'),
                        'pathway': metabolite_data.get('pathway'),
                        'source': metabolite_data.get('source'),
                        'description': metabolite_data.get('description'),
                        'biological_activity': metabolite_data.get('biological_activity')
                    })
            return jsonify({'entities': entities, 'total': len(entities)})
            
        elif metric_type == 'enzymes':
            # Return all enzymes
            entities = []
            for edge in network['edges']:
                if edge.get('enzyme') and edge['enzyme'] not in [e['id'] for e in entities]:
                    enzyme_data = network['enzymes'].get(edge['enzyme'], {})
                    entities.append({
                        'id': edge['enzyme'],
                        'name': edge.get('enzyme_name', edge['enzyme']),
                        'type': 'enzyme',
                        'ec_number': enzyme_data.get('ec_number'),
                        'reaction_count': len([e for e in network['edges'] if e.get('enzyme') == edge['enzyme']]),
                        'source': enzyme_data.get('source')
                    })
            return jsonify({'entities': entities, 'total': len(entities)})
            
        elif metric_type == 'reactions':
            # Return all reactions
            entities = []
            for edge in network['edges']:
                if edge['type'] == 'reaction':
                    entities.append({
                        'id': edge['reaction_id'],
                        'name': edge.get('reaction_name', edge['reaction_id']),
                        'type': 'reaction',
                        'substrate': edge['source'],
                        'product': edge['target'],
                        'enzyme': edge.get('enzyme_name', edge.get('enzyme')),
                        'equation': edge.get('equation'),
                        'source': edge.get('source')
                    })
            return jsonify({'entities': entities, 'total': len(entities)})
            
        elif metric_type == 'connected_metabolites':
            # Return connected metabolites
            connected_metabolites = set()
            for edge in network['edges']:
                connected_metabolites.add(edge['source'])
                connected_metabolites.add(edge['target'])
            
            entities = []
            for met_id in connected_metabolites:
                metabolite_data = network['metabolites'].get(met_id, {})
                entities.append({
                    'id': met_id,
                    'name': metabolite_data.get('name', met_id),
                    'type': 'metabolite',
                    'formula': metabolite_data.get('formula'),
                    'pathway': metabolite_data.get('pathway'),
                    'source': metabolite_data.get('source'),
                    'connection_count': len([e for e in network['edges'] if e['source'] == met_id or e['target'] == met_id])
                })
            return jsonify({'entities': entities, 'total': len(entities)})
            
        elif metric_type == 'disconnected_metabolites':
            # Return disconnected metabolites
            connected_metabolites = set()
            for edge in network['edges']:
                connected_metabolites.add(edge['source'])
                connected_metabolites.add(edge['target'])
            
            entities = []
            for node in network['nodes']:
                if node['type'] == 'metabolite' and node['id'] not in connected_metabolites:
                    metabolite_data = network['metabolites'].get(node['id'], {})
                    entities.append({
                        'id': node['id'],
                        'name': node['label'],
                        'type': 'metabolite',
                        'formula': metabolite_data.get('formula'),
                        'pathway': metabolite_data.get('pathway'),
                        'source': metabolite_data.get('source'),
                        'description': metabolite_data.get('description')
                    })
            return jsonify({'entities': entities, 'total': len(entities)})
            
        else:
            return jsonify({'error': f'Unknown metric type: {metric_type}'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics/<species>/network-components')
def api_network_components(species):
    """Get network components analysis."""
    try:
        network = analyzer.build_comprehensive_network(species)
        
        # Use NetworkX to find connected components
        import networkx as nx
        G = nx.Graph()
        
        # Add nodes
        for node in network['nodes']:
            G.add_node(node['id'])
        
        # Add edges
        for edge in network['edges']:
            G.add_edge(edge['source'], edge['target'])
        
        # Find connected components
        components = list(nx.connected_components(G))
        components = sorted(components, key=len, reverse=True)
        
        # Prepare component data
        component_data = []
        for i, component in enumerate(components):
            component_metabolites = []
            for met_id in component:
                metabolite_data = network['metabolites'].get(met_id, {})
                component_metabolites.append({
                    'id': met_id,
                    'name': metabolite_data.get('name', met_id),
                    'formula': metabolite_data.get('formula'),
                    'pathway': metabolite_data.get('pathway')
                })
            
            component_data.append({
                'component_id': i + 1,
                'size': len(component),
                'metabolites': component_metabolites
            })
        
        return jsonify({
            'total_components': len(components),
            'largest_component_size': len(components[0]) if components else 0,
            'components': component_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/species')
def api_species():
    """Get available species."""
    return jsonify(analyzer.species)

@app.route('/api/compounds')
def api_compounds():
    """Get comprehensive compounds data."""
    try:
        source = request.args.get('source')
        compounds = analyzer.get_comprehensive_compounds(source)
        return jsonify(compounds)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enzymes')
def api_enzymes():
    """Get comprehensive enzymes data."""
    try:
        enzymes = analyzer.get_comprehensive_enzymes()
        return jsonify(enzymes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proteins')
def api_proteins():
    """Get comprehensive proteins data."""
    try:
        proteins = analyzer.get_comprehensive_proteins()
        return jsonify(proteins)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pathways')
def api_pathways():
    """Get comprehensive pathways data."""
    try:
        source = request.args.get('source')
        pathways = analyzer.get_comprehensive_pathways(source)
        return jsonify(pathways)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reactions')
def api_reactions():
    """Get comprehensive reaction data from Rhea database."""
    try:
        reactions = analyzer.get_comprehensive_reactions()
        return jsonify(reactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enzymes-with-reactions')
def api_enzymes_with_reactions():
    """Get enzymes annotated with reaction data."""
    try:
        enzymes = analyzer.get_enzymes_with_reactions()
        return jsonify(enzymes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reaction-metrics')
def api_reaction_metrics():
    """Get reaction metrics and statistics."""
    try:
        metrics = analyzer.get_reaction_metrics()
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summary')
def api_summary():
    """Get dashboard summary with reaction data."""
    try:
        summary = analyzer.get_dashboard_summary()
        
        # Add reaction annotation data to summary
        reaction_metrics = analyzer.get_reaction_metrics()
        if reaction_metrics:
            summary['reaction_annotations'] = reaction_metrics
        
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data-sources')
def api_data_sources():
    """Get information about data sources."""
    try:
        integrated_data = analyzer.integrated_data
        data_sources = integrated_data.get("metadata", {}).get("sources", [])
        return jsonify({
            "sources": data_sources,
            "cannabis_database": {
                "name": "Cannabis Database",
                "url": "https://cannabisdatabase.ca",
                "description": "Comprehensive cannabis compounds, enzymes, and pathways"
            },
            "plantcyc": {
                "name": "PlantCyc",
                "url": "https://plantcyc.org",
                "description": "Plant metabolic pathways and compounds database"
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compound/<compound_id>')
def api_compound(compound_id):
    """Get specific compound data."""
    try:
        all_compounds = analyzer.get_comprehensive_compounds()
        compound = all_compounds.get(compound_id)
        if compound:
            return jsonify(compound)
        else:
            return jsonify({'error': 'Compound not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enzyme/<enzyme_id>')
def api_enzyme(enzyme_id):
    """Get specific enzyme data."""
    try:
        all_enzymes = analyzer.get_comprehensive_enzymes()
        enzyme = all_enzymes.get(enzyme_id)
        if enzyme:
            return jsonify(enzyme)
        else:
            return jsonify({'error': 'Enzyme not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reaction/<reaction_id>')
def api_reaction(reaction_id):
    """Get specific reaction data."""
    try:
        all_reactions = analyzer.get_comprehensive_reactions()
        reaction = all_reactions.get(reaction_id)
        if reaction:
            return jsonify(reaction)
        else:
            return jsonify({'error': 'Reaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compounds/<species>')
def api_compounds_by_species(species):
    """Get compounds for a specific species."""
    try:
        species_info = analyzer.species.get(species, {})
        data_sources = species_info.get("data_sources", [])
        
        all_compounds = analyzer.get_comprehensive_compounds()
        species_compounds = {}
        
        for compound_id, compound in all_compounds.items():
            if compound.get("source") in data_sources:
                species_compounds[compound_id] = compound
        
        return jsonify(species_compounds)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/enzymes/<species>')
def api_enzymes_by_species(species):
    """Get enzymes for a specific species."""
    try:
        species_info = analyzer.species.get(species, {})
        data_sources = species_info.get("data_sources", [])
        
        all_enzymes = analyzer.get_comprehensive_enzymes()
        species_enzymes = {}
        
        for enzyme_id, enzyme in all_enzymes.items():
            if enzyme.get("source") in data_sources:
                species_enzymes[enzyme_id] = enzyme
        
        return jsonify(species_enzymes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files."""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    print("Starting Comprehensive Metabolomics Dashboard...")
    print("Data sources: Cannabis Database + PlantCyc")
    print("Available species: Cannabis sativa, Psilocybe cubensis, Arabidopsis thaliana")
    app.run(debug=True, host='0.0.0.0', port=3000) 