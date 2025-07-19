# Gene Corpora

This directory contains gene data for different species used in metabolomics analysis.

## Structure

```
corpora/
├── c.sativa/          # Cannabis sativa gene data
│   ├── gene_genes.xml
│   ├── nucleotide_genes.xml
│   ├── protein_genes.xml
│   └── kegg_genes.txt
├── p.cubensis/        # Psilocybe cubensis gene data
│   ├── gene_genes.xml
│   ├── nucleotide_genes.xml
│   ├── protein_genes.xml
│   └── kegg_genes.txt
└── download_summary.json
```

## Data Sources

### NCBI Databases
- **Gene**: Gene records with annotations
- **Nucleotide**: DNA/RNA sequences
- **Protein**: Protein sequences

### KEGG
- Gene lists and pathway information

## Download Script

Use the `download_genes.py` script to download fresh data:

```bash
python download_genes.py
```

## Species Information

### Cannabis sativa (c.sativa)
- **Taxonomy ID**: 3483
- **Common Name**: Cannabis sativa
- **Relevance**: Primary focus for cannabinoid biosynthesis genes

### Psilocybe cubensis (p.cubensis)
- **Taxonomy ID**: 5628
- **Common Name**: Psilocybe cubensis
- **Relevance**: Focus for psilocybin biosynthesis genes

## Usage

The gene data is used by the metabolomics agent for:
- Pathway analysis
- Gene expression correlation
- Metabolite-gene associations
- Comparative genomics 