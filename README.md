# Metabolomics Agent

AI-powered metabolomics data analysis and interpretation agent for the Formul8 platform.

## Overview

The Metabolomics Agent specializes in analyzing metabolomics data, interpreting gene expression patterns, and providing insights into metabolic pathways and compound biosynthesis. It integrates with genomic data from the metabolomics-data repository to provide comprehensive analysis.

## Features

- **Gene Expression Analysis**: Analyze gene expression patterns and identify differentially expressed genes
- **Pathway Analysis**: Map genes to metabolic pathways and identify pathway enrichment
- **Compound Biosynthesis**: Identify and analyze biosynthesis pathways for secondary metabolites
- **Comparative Genomics**: Compare gene families and metabolic pathways across species
- **Functional Annotation**: Predict protein functions and identify catalytic domains
- **Data Integration**: Seamlessly integrate with metabolomics-data repository

## Data Integration

This agent works with data from the `metabolomics-data` repository, which contains:

- **Genome Data**: Complete genome sequences and annotations for C. sativa and P. cubensis
- **Gene Corpora**: Curated gene data for analysis and interpretation
- **Protein Annotations**: UniProtKB/SwissProt annotations for functional analysis
- **BLAST Results**: Protein similarity searches for functional predictions

## Installation

```bash
pip install -r requirements.txt
```

## Dependencies

- Python 3.7+
- RDKit for molecular analysis
- Pandas and NumPy for data manipulation
- OpenAI API for AI-powered analysis
- LangChain for agent framework

## Usage

### Basic Analysis

```python
from agent import MetabolomicsAgent

agent = MetabolomicsAgent()

# Analyze gene expression data
results = agent.analyze_gene_expression("path/to/expression_data.csv")

# Identify metabolic pathways
pathways = agent.identify_pathways("gene_list.txt")

# Predict compound biosynthesis
biosynthesis = agent.predict_biosynthesis("compound_name")
```

### Data Integration

The agent automatically integrates with the metabolomics-data repository:

```python
# Access genome data
genome_data = agent.get_genome_data("c.sativa")

# Get protein annotations
annotations = agent.get_protein_annotations("p.cubensis")

# Perform comparative analysis
comparison = agent.compare_species(["c.sativa", "p.cubensis"])
```

## Configuration

Set up your environment variables:

```bash
export OPENAI_API_KEY="your_openai_api_key"
export METABOLOMICS_DATA_PATH="path/to/metabolomics-data"
```

## Data Sources

- **NCBI GenBank**: Genome assemblies and annotations
- **UniProtKB**: Protein sequence and functional data
- **KEGG**: Metabolic pathway information
- **Custom Corpora**: Curated gene and pathway data

## Architecture

```
metabolomics-agent/
├── agent.py              # Main agent implementation
├── base-agent/           # Base agent submodule
├── data/                 # Local data storage
│   ├── corpora/         # Gene corpora
│   └── datasets/        # Analysis datasets
├── requirements.txt      # Python dependencies
└── README.md           # This file
```

## Integration with metabolomics-data

The agent integrates with the metabolomics-data repository for:

- **Genome Access**: Direct access to genome sequences and annotations
- **Protein Analysis**: Integration with UniProtKB annotations
- **Pathway Mapping**: KEGG pathway integration
- **Comparative Studies**: Cross-species analysis capabilities

## Development

### Adding New Analysis Methods

```python
class MetabolomicsAgent(BaseAgent):
    def analyze_new_feature(self, data):
        """Add new analysis method."""
        # Implementation here
        pass
```

### Extending Data Integration

```python
def get_new_data_source(self, source_name):
    """Integrate with new data sources."""
    # Implementation here
    pass
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For questions and support, please open an issue in the repository.