# Manual Download Instructions for P. cubensis Genome Data

## Method 1: NCBI Assembly Pages

### GCA_000708925.1
1. Visit: https://www.ncbi.nlm.nih.gov/assembly/GCA_000708925.1
2. Click "Download Assemblies" 
3. Download these files:
   - Genomic FASTA (.fna.gz)
   - Protein FASTA (.faa.gz)
   - GFF annotations (.gff.gz)
   - GenBank format (.gbff.gz)

### GCA_001272575.2
1. Visit: https://www.ncbi.nlm.nih.gov/assembly/GCA_001272575.2
2. Click "Download Assemblies"
3. Download the same file types as above

## Method 2: NCBI Datasets Tool

Install the tool:
```bash
pip install ncbi-datasets
```

Download genomes:
```bash
datasets download genome accession GCA_000708925.1
datasets download genome accession GCA_001272575.2
```

## Method 3: Direct FTP (if available)

Try these URLs:
- ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCA/000/708/925/GCA_000708925.1_ASM70892v1/
- ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCA/001/272/575/GCA_001272575.2_ASM127257v2/

## File Organization

After downloading, organize files as:
```
genomes/p.cubensis/
├── GCA_000708925.1/
│   ├── GCA_000708925.1_genomic.fna
│   ├── GCA_000708925.1_protein.faa
│   ├── GCA_000708925.1_genomic.gff
│   └── metadata.json
└── GCA_001272575.2/
    ├── GCA_001272575.2_genomic.fna
    ├── GCA_001272575.2_protein.faa
    ├── GCA_001272575.2_genomic.gff
    └── metadata.json
```
