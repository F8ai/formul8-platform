# Science Agent Data Repository

This repository contains training data, knowledge bases, and vector stores for the science agent.

## Contents

- `corpus/` - Training corpus files (JSONL format)
- `vectorstore/` - FAISS vector indices and embeddings
- `knowledge_base/` - Structured knowledge files (TTL, RDF)
- `models/` - Local model files (GGUF format)
- `datasets/` - Training and evaluation datasets

## Git LFS

This repository uses Git LFS for large files. Supported file types:
- Vector stores (*.faiss, *.index)
- Model files (*.gguf, *.model, *.bin)
- Training data (*.jsonl, *.parquet)
- Databases (*.db, *.sqlite)

## Usage

```bash
# Clone with LFS
git lfs clone https://github.com/F8ai/science-data.git

# Pull LFS files
git lfs pull
```
