# Sourcing-agent Data Repository

This repository contains training data, knowledge bases, and vector stores for the Formul8 Sourcing-agent.

## Directory Structure

```
data/
├── corpus/           # Training corpus files (JSONL format)
├── vectorstore/      # FAISS vector indices
├── knowledge_base/   # RDF/TTL knowledge graphs
├── models/          # Local AI models (GGUF format)
└── datasets/        # Domain-specific datasets and documents
```

## Git LFS Configuration

Large files are tracked with Git LFS:
- Vector stores (.faiss, .pkl)
- AI models (.gguf, .bin)
- Large datasets (.jsonl, .parquet)
- Database files (.sqlite, .db)

## Usage

This data repository is automatically included as a submodule in the sourcing-agent repository.
