"""
SPARQL Query Generation and RDF Knowledge Base Utilities
"""
import os
import re
from typing import Dict, List, Any, Optional, Tuple
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.plugins.sparql import prepareQuery
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline


class SPARQLQueryGenerator:
    """
    Phi-2 based SPARQL query generation from natural language questions
    """
    
    def __init__(self, model_path: str = "microsoft/phi-2"):
        self.model_path = model_path
        self.tokenizer = None
        self.model = None
        self.pipeline = None
        self._initialize_model()
        
        # Common SPARQL patterns and templates
        self.query_templates = {
            "list": "SELECT DISTINCT ?item ?label WHERE { ?item a {entity_type} . ?item rdfs:label ?label . }",
            "describe": "DESCRIBE ?item WHERE { ?item rdfs:label ?label . FILTER(CONTAINS(LCASE(?label), LCASE('{search_term}'))) }",
            "properties": "SELECT ?property ?value WHERE { {entity} ?property ?value . }",
            "count": "SELECT (COUNT(?item) as ?count) WHERE { ?item a {entity_type} . }",
            "filter": "SELECT ?item ?label WHERE { ?item a {entity_type} . ?item rdfs:label ?label . {filters} }"
        }
        
        # Domain-specific ontology namespaces
        self.namespaces = {
            'compliance': 'http://formul8.ai/ontology/compliance#',
            'cannabis': 'http://formul8.ai/ontology/cannabis#',
            'formul': 'http://formul8.ai/ontology/formulation#',
            'marketing': 'http://formul8.ai/ontology/marketing#',
            'ops': 'http://formul8.ai/ontology/operations#',
            'patent': 'http://formul8.ai/ontology/patent#',
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'owl': 'http://www.w3.org/2002/07/owl#'
        }
    
    def _initialize_model(self):
        """Initialize Phi-2 model for SPARQL generation"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=200,
                temperature=0.1,
                do_sample=True
            )
            
        except Exception as e:
            print(f"Warning: Could not load Phi-2 model: {e}")
            print("Falling back to template-based query generation")
    
    def generate_sparql_query(self, question: str, domain: str = "compliance") -> str:
        """
        Generate SPARQL query from natural language question
        """
        # Try Phi-2 generation first if available
        if self.pipeline:
            try:
                return self._generate_with_phi2(question, domain)
            except Exception as e:
                print(f"Phi-2 generation failed: {e}, falling back to templates")
        
        # Fallback to template-based generation
        return self._generate_with_templates(question, domain)
    
    def _generate_with_phi2(self, question: str, domain: str) -> str:
        """Generate SPARQL using Phi-2 model"""
        # Create training prompt with examples
        prompt = self._create_training_prompt(question, domain)
        
        # Generate with Phi-2
        result = self.pipeline(prompt, max_new_tokens=150, temperature=0.1)
        generated_text = result[0]['generated_text']
        
        # Extract SPARQL query from generated text
        sparql_query = self._extract_sparql_from_generation(generated_text)
        
        # Validate and clean the query
        return self._validate_and_clean_query(sparql_query, domain)
    
    def _create_training_prompt(self, question: str, domain: str) -> str:
        """Create few-shot training prompt for Phi-2"""
        examples = self._get_domain_examples(domain)
        
        prompt = f"""Task: Convert natural language questions to SPARQL queries for cannabis industry knowledge base.

Domain: {domain}
Namespaces:
PREFIX compliance: <{self.namespaces['compliance']}>
PREFIX cannabis: <{self.namespaces['cannabis']}>
PREFIX formul: <{self.namespaces['formul']}>
PREFIX rdfs: <{self.namespaces['rdfs']}>

Examples:
{examples}

Question: {question}
SPARQL Query:"""
        
        return prompt
    
    def _get_domain_examples(self, domain: str) -> str:
        """Get domain-specific training examples"""
        examples = {
            'compliance': """
Q: What are the licensing requirements in California?
A: SELECT ?requirement ?description WHERE { 
    ?license compliance:issuedBy compliance:CaliforniaDCC . 
    ?license compliance:requiresBackgroundCheck ?requirement . 
    ?license rdfs:label ?description . 
}

Q: List all regulatory bodies
A: SELECT ?body ?jurisdiction WHERE { 
    ?body a compliance:RegulatoryBody . 
    ?body compliance:jurisdiction ?jurisdiction . 
}""",
            
            'formulation': """
Q: What are the properties of THC?
A: SELECT ?property ?value WHERE { 
    chem:THC ?property ?value . 
}

Q: List all cannabinoids
A: SELECT ?cannabinoid ?label WHERE { 
    ?cannabinoid a chem:Cannabinoid . 
    ?cannabinoid rdfs:label ?label . 
}""",
            
            'marketing': """
Q: Which platforms allow cannabis advertising?
A: SELECT ?platform ?allows WHERE { 
    ?platform a platform:AdvertisingPlatform . 
    ?platform platform:allowsCannabis ?allows . 
}

Q: What are the marketing restrictions on Facebook?
A: SELECT ?restriction WHERE { 
    platform:Facebook platform:restrictions ?restriction . 
}"""
        }
        
        return examples.get(domain, examples['compliance'])
    
    def _extract_sparql_from_generation(self, generated_text: str) -> str:
        """Extract SPARQL query from Phi-2 generation"""
        # Look for SPARQL query patterns
        sparql_pattern = r'SELECT.*?}(?:\s*ORDER BY.*?)?(?:\s*LIMIT.*?)?'
        matches = re.search(sparql_pattern, generated_text, re.DOTALL | re.IGNORECASE)
        
        if matches:
            return matches.group(0).strip()
        
        # Fallback: look for anything that looks like a query
        lines = generated_text.split('\n')
        query_lines = []
        in_query = False
        
        for line in lines:
            if 'SELECT' in line.upper():
                in_query = True
            if in_query:
                query_lines.append(line)
                if '}' in line and 'WHERE' in ''.join(query_lines):
                    break
        
        return '\n'.join(query_lines)
    
    def _generate_with_templates(self, question: str, domain: str) -> str:
        """Generate SPARQL using template-based approach"""
        question_lower = question.lower()
        
        # Determine query type
        if any(word in question_lower for word in ['list', 'show', 'what are']):
            query_type = 'list'
        elif any(word in question_lower for word in ['describe', 'tell me about']):
            query_type = 'describe'
        elif any(word in question_lower for word in ['properties', 'attributes']):
            query_type = 'properties'
        elif any(word in question_lower for word in ['how many', 'count']):
            query_type = 'count'
        else:
            query_type = 'filter'
        
        # Extract entities and filters
        entity_type, search_term, filters = self._extract_query_components(question, domain)
        
        # Build SPARQL query
        template = self.query_templates[query_type]
        
        if query_type == 'list' or query_type == 'count':
            query = template.format(entity_type=entity_type)
        elif query_type == 'describe':
            query = template.format(search_term=search_term)
        elif query_type == 'filter':
            query = template.format(entity_type=entity_type, filters=filters)
        else:
            query = template
        
        # Add namespace prefixes
        prefixes = self._get_namespace_prefixes(domain)
        return f"{prefixes}\n\n{query}"
    
    def _extract_query_components(self, question: str, domain: str) -> Tuple[str, str, str]:
        """Extract entity types, search terms, and filters from question"""
        question_lower = question.lower()
        
        # Domain-specific entity mappings
        entity_mappings = {
            'compliance': {
                'license': 'compliance:LicenseType',
                'requirement': 'compliance:Requirement',
                'regulation': 'compliance:Regulation',
                'test': 'compliance:LabTest'
            },
            'formulation': {
                'cannabinoid': 'chem:Cannabinoid',
                'terpene': 'chem:Terpene',
                'extraction': 'formul:ExtractionMethod',
                'product': 'formul:ProductType'
            },
            'marketing': {
                'platform': 'platform:AdvertisingPlatform',
                'strategy': 'marketing:Strategy',
                'campaign': 'marketing:CampaignType'
            }
        }
        
        # Find entity type
        entity_type = 'owl:Thing'  # default
        domain_entities = entity_mappings.get(domain, {})
        
        for keyword, entity in domain_entities.items():
            if keyword in question_lower:
                entity_type = entity
                break
        
        # Extract search term
        search_term = ''
        for word in question.split():
            if word.lower() not in ['what', 'are', 'the', 'list', 'show', 'me']:
                search_term = word
                break
        
        # Build filters (simplified)
        filters = ''
        if 'california' in question_lower:
            filters = 'FILTER(CONTAINS(LCASE(?label), "california"))'
        elif 'thc' in question_lower:
            filters = 'FILTER(CONTAINS(LCASE(?label), "thc"))'
        
        return entity_type, search_term, filters
    
    def _get_namespace_prefixes(self, domain: str) -> str:
        """Get namespace prefixes for SPARQL query"""
        prefixes = [
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
            "PREFIX owl: <http://www.w3.org/2002/07/owl#>"
        ]
        
        domain_prefixes = {
            'compliance': [
                "PREFIX compliance: <http://formul8.ai/ontology/compliance#>",
                "PREFIX cannabis: <http://formul8.ai/ontology/cannabis#>"
            ],
            'formulation': [
                "PREFIX formul: <http://formul8.ai/ontology/formulation#>",
                "PREFIX chem: <http://formul8.ai/ontology/chemistry#>"
            ],
            'marketing': [
                "PREFIX marketing: <http://formul8.ai/ontology/marketing#>",
                "PREFIX platform: <http://formul8.ai/ontology/platform#>"
            ]
        }
        
        if domain in domain_prefixes:
            prefixes.extend(domain_prefixes[domain])
        
        return '\n'.join(prefixes)
    
    def _validate_and_clean_query(self, query: str, domain: str) -> str:
        """Validate and clean generated SPARQL query"""
        # Basic syntax validation
        if 'SELECT' not in query.upper():
            return self._generate_with_templates("Show me information", domain)
        
        # Ensure proper braces
        if query.count('{') != query.count('}'):
            # Try to fix simple brace issues
            open_braces = query.count('{')
            close_braces = query.count('}')
            if open_braces > close_braces:
                query += ' }' * (open_braces - close_braces)
        
        # Clean up whitespace
        query = re.sub(r'\s+', ' ', query).strip()
        
        return query


class RDFKnowledgeBase:
    """
    RDF Knowledge Base management for agents
    """
    
    def __init__(self, ttl_file_path: str):
        self.ttl_file_path = ttl_file_path
        self.graph = Graph()
        self.query_generator = SPARQLQueryGenerator()
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Load RDF knowledge base from TTL file"""
        try:
            self.graph.parse(self.ttl_file_path, format="turtle")
            print(f"Loaded {len(self.graph)} triples from {self.ttl_file_path}")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
    
    def query_with_sparql(self, sparql_query: str) -> List[Dict]:
        """Execute SPARQL query against knowledge base"""
        try:
            results = self.graph.query(sparql_query)
            
            # Convert results to list of dictionaries
            result_list = []
            for row in results:
                result_dict = {}
                for var, value in zip(results.vars, row):
                    result_dict[str(var)] = str(value)
                result_list.append(result_dict)
            
            return result_list
            
        except Exception as e:
            print(f"SPARQL query error: {e}")
            return []
    
    def query_with_natural_language(self, question: str, domain: str) -> List[Dict]:
        """Query knowledge base using natural language"""
        # Generate SPARQL from natural language
        sparql_query = self.query_generator.generate_sparql_query(question, domain)
        print(f"Generated SPARQL: {sparql_query}")
        
        # Execute query
        return self.query_with_sparql(sparql_query)
    
    def get_entity_properties(self, entity_uri: str) -> Dict[str, Any]:
        """Get all properties of a specific entity"""
        sparql_query = f"""
        SELECT ?property ?value WHERE {{
            <{entity_uri}> ?property ?value .
        }}
        """
        
        results = self.query_with_sparql(sparql_query)
        
        properties = {}
        for result in results:
            prop = result['property'].split('#')[-1] if '#' in result['property'] else result['property']
            properties[prop] = result['value']
        
        return properties
    
    def search_entities(self, search_term: str, entity_type: str = None) -> List[Dict]:
        """Search for entities by label or description"""
        type_filter = f"?entity a <{entity_type}> ." if entity_type else ""
        
        sparql_query = f"""
        SELECT ?entity ?label ?description WHERE {{
            {type_filter}
            ?entity rdfs:label ?label .
            OPTIONAL {{ ?entity rdfs:comment ?description }}
            FILTER(CONTAINS(LCASE(?label), LCASE("{search_term}")))
        }}
        """
        
        return self.query_with_sparql(sparql_query)
    
    def add_triple(self, subject: str, predicate: str, object_value: str):
        """Add a new triple to the knowledge base"""
        try:
            subject_uri = URIRef(subject)
            predicate_uri = URIRef(predicate)
            
            # Determine if object is URI or literal
            if object_value.startswith('http'):
                object_node = URIRef(object_value)
            else:
                object_node = Literal(object_value)
            
            self.graph.add((subject_uri, predicate_uri, object_node))
            
        except Exception as e:
            print(f"Error adding triple: {e}")
    
    def save_knowledge_base(self):
        """Save updated knowledge base back to TTL file"""
        try:
            self.graph.serialize(destination=self.ttl_file_path, format="turtle")
        except Exception as e:
            print(f"Error saving knowledge base: {e}")
    
    def get_statistics(self) -> Dict[str, int]:
        """Get knowledge base statistics"""
        stats = {
            'total_triples': len(self.graph),
            'unique_subjects': len(set(self.graph.subjects())),
            'unique_predicates': len(set(self.graph.predicates())),
            'unique_objects': len(set(self.graph.objects()))
        }
        
        return stats