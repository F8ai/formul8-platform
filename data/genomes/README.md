# Genome Data Directory

This directory contains genome annotations, FASTA files, and UniProtKB/SwissProt annotations for species used in metabolomics analysis.

## Structure

```
genomes/
├── c.sativa/                    # Cannabis sativa genome data
│   ├── c.sativa_assembly_report.txt
│   ├── c.sativa_genomic.fna     # Genome FASTA
│   ├── c.sativa_protein.faa     # Protein FASTA
│   ├── c.sativa_genomic.gff     # Gene annotations
│   ├── c.sativa_swissprot.fasta # SwissProt proteins
│   ├── c.sativa_swissprot.json  # SwissProt annotations
│   ├── c.sativa_trembl.fasta    # TrEMBL proteins
│   ├── c.sativa_blast_results.txt # BLAST vs SwissProt
│   └── c.sativa_download_summary.md
├── p.cubensis/                  # Psilocybe cubensis genome data
│   ├── p.cubensis_assembly_report.txt
│   ├── p.cubensis_genomic.fna   # Genome FASTA
│   ├── p.cubensis_protein.faa   # Protein FASTA
│   ├── p.cubensis_genomic.gff   # Gene annotations
│   ├── p.cubensis_swissprot.fasta # SwissProt proteins
│   ├── p.cubensis_swissprot.json # SwissProt annotations
│   ├── p.cubensis_trembl.fasta  # TrEMBL proteins
│   ├── p.cubensis_blast_results.txt # BLAST vs SwissProt
│   └── p.cubensis_download_summary.md
└── README.md                    # This file
```

## Species Information

### Cannabis sativa (c.sativa)
- **Taxonomy ID**: 3483
- **Assembly**: GCA_000230575.2 (CS10)
- **Genome Size**: ~828 MB
- **Chromosomes**: 10
- **Key Features**: 
  - Cannabinoid biosynthesis genes
  - Terpene synthase genes
  - Secondary metabolite pathways

### Psilocybe cubensis (p.cubensis)
- **Taxonomy ID**: 5341
- **Assembly**: GCA_000708925.1 (Pcubensis_v1.0)
- **Genome Size**: ~35 MB
- **Chromosomes**: 8
- **Key Features**:
  - Psilocybin biosynthesis genes
  - Tryptamine pathway enzymes
  - Fungal secondary metabolism

## Data Sources

### NCBI GenBank
- **Genome Assemblies**: Complete genome sequences
- **Protein Predictions**: Predicted protein sequences
- **Gene Annotations**: GFF format gene structures
- **Assembly Reports**: Quality metrics and statistics

### UniProtKB
- **SwissProt**: Manually curated, reviewed proteins
- **TrEMBL**: Automatically annotated, unreviewed proteins
- **Annotations**: Functional information, domains, pathways

### BLAST Analysis
- **Protein Similarity**: Genome proteins vs SwissProt
- **Functional Prediction**: Based on sequence similarity
- **E-value Threshold**: 1e-10 for high confidence

## Download Script

Use the `download_genomes.py` script to download fresh data:

```bash
python3 download_genomes.py
```

### Requirements
- Python 3.7+
- requests library
- BLAST+ tools (optional, for annotation)

### Installation
```bash
pip install requests
# For BLAST annotation (optional)
# brew install blast  # macOS
# apt-get install ncbi-blast+  # Ubuntu
```

## File Formats

### FASTA Files
- **Genome FASTA**: Complete DNA sequences
- **Protein FASTA**: Predicted protein sequences
- **SwissProt FASTA**: Curated protein sequences

### GFF Files
- **Gene Structure**: Exon/intron boundaries
- **CDS Features**: Coding sequences
- **Gene Names**: Locus tags and annotations

### BLAST Results
- **Tabular Format**: Query, subject, identity, coverage, E-value
- **Top Hits**: Best 5 matches per query
- **Functional Info**: SwissProt annotations

## Usage Examples

### Genome Analysis
```python
from Bio import SeqIO

# Load genome sequence
genome = SeqIO.read("c.sativa/c.sativa_genomic.fna", "fasta")
print(f"Genome length: {len(genome)} bp")
```

### Protein Analysis
```python
# Count proteins
with open("c.sativa/c.sativa_protein.faa") as f:
    protein_count = sum(1 for line in f if line.startswith(">"))
print(f"Protein count: {protein_count}")
```

### BLAST Results Analysis
```python
import pandas as pd

# Load BLAST results
blast_df = pd.read_csv("c.sativa/c.sativa_blast_results.txt", 
                       sep="\t", header=None)
blast_df.columns = ["query", "subject", "identity", "length", 
                   "mismatch", "gapopen", "qstart", "qend", 
                   "sstart", "send", "evalue", "bitscore", "stitle"]

# Filter high-confidence hits
high_conf = blast_df[blast_df["evalue"] < 1e-50]
print(f"High confidence hits: {len(high_conf)}")
```

## Metabolomics Applications

### Pathway Analysis
- Use protein sequences to identify metabolic enzymes
- Map genes to KEGG pathways
- Analyze secondary metabolite biosynthesis

### Comparative Genomics
- Compare gene families between species
- Identify species-specific metabolic pathways
- Analyze gene duplication and evolution

### Functional Annotation
- Predict protein functions from sequence similarity
- Identify catalytic domains and active sites
- Map proteins to metabolic networks

## Data Quality

### Assembly Quality
- **C. sativa**: High-quality reference assembly
- **P. cubensis**: Draft assembly, may have gaps

### Annotation Quality
- **SwissProt**: High-confidence functional annotations
- **TrEMBL**: Lower confidence, but more comprehensive
- **BLAST**: Functional predictions based on similarity

## Updates

Genome data is updated periodically:
- **NCBI**: New assemblies and annotations
- **UniProt**: New protein entries and annotations
- **Re-annotation**: Improved gene predictions

Check the download summary files for the latest update dates.

## Citation

When using this data, please cite:
- NCBI GenBank for genome assemblies
- UniProt Consortium for protein annotations
- Original genome papers for assemblies 