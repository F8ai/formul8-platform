# Cannabis Compliance Data Collection

This directory contains comprehensive cannabis compliance data collected from official government sources across all cannabis-legal states.

## Structure

```
compliance_data/
├── state_sources.json          # Master list of official compliance sources
├── collection_status.json      # Real-time collection status tracking
├── states/
│   ├── california/
│   │   ├── regulations/         # Raw regulatory documents
│   │   ├── pdfs/               # Downloaded PDF documents
│   │   ├── processed/          # Processed and structured data
│   │   └── metadata.json      # Collection metadata
│   ├── colorado/
│   │   └── ... (same structure)
│   └── ... (all cannabis states)
└── scripts/
    ├── collect_compliance_data.py  # Main collection script
    ├── pdf_processor.py            # PDF text extraction
    └── data_validator.py           # Data validation and quality checks
```

## Data Sources

Each state directory contains compliance data from official government sources:

- **Regulatory Text**: Complete regulations and statutes
- **PDF Documents**: Official documents, forms, and guidance
- **Structured Data**: Processed and normalized compliance information
- **Metadata**: Collection timestamps, source URLs, and validation status

## Collection Process

1. **Source Identification**: Official government cannabis regulatory websites
2. **Comprehensive Scraping**: Full website traversal following all links
3. **PDF Collection**: Download all regulatory PDFs and documents
4. **Text Processing**: Extract and structure text from all sources
5. **Data Validation**: Ensure completeness and accuracy
6. **Regular Updates**: Daily monitoring for regulatory changes

## Quality Assurance

- All data sourced from official government websites
- Complete link traversal to ensure no documents are missed
- PDF text extraction for full-text search capability
- Automated validation and quality checks
- Change detection and update notifications