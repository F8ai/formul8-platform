# Comprehensive Metabolomics Dashboard

## Overview

The Comprehensive Metabolomics Dashboard has been successfully enhanced to integrate data from two major sources:

1. **Cannabis Database (cannabisdatabase.ca)** - Comprehensive cannabis compounds, enzymes, and pathways
2. **PlantCyc (plantcyc.org)** - Plant metabolic pathways and compounds database

## Data Integration

### Data Sources

- **Cannabis Database**: Provides cannabis-specific compounds including cannabinoids, terpenes, and flavonoids
- **PlantCyc**: Provides plant metabolic pathways, enzymes, and compounds from various plant species

### Integrated Dataset

The dashboard now includes:

- **12 Total Compounds**:
  - 4 Cannabinoids (THC, CBD, CBG, CBN)
  - 3 Terpenes (Myrcene, Limonene, Pinene)
  - 2 Flavonoids (Cannflavin A, Cannflavin B)
  - 2 Primary metabolites (Glucose, Pyruvate)
  - 1 Secondary metabolite (Caffeic acid)

- **7 Enzymes** from both sources
- **5 Metabolic Pathways** covering cannabinoid, terpene, and general plant metabolism
- **3 Species**: Cannabis sativa, Psilocybe cubensis, Arabidopsis thaliana

## Dashboard Features

### Enhanced UI

- **Dataset Overview**: Shows total compounds, enzymes, pathways, and species coverage
- **Data Source Indicators**: Visual badges showing whether data comes from Cannabis Database or PlantCyc
- **Comprehensive Species Selection**: Dynamic loading of available species with their data sources
- **Enhanced Network Visualization**: Improved Cytoscape.js integration with better node and edge styling

### API Endpoints

- `/api/summary` - Dashboard overview statistics
- `/api/species` - Available species with their data sources
- `/api/compounds` - All compounds with source filtering
- `/api/enzymes` - All enzymes from both sources
- `/api/pathways` - Metabolic pathways with source filtering
- `/api/network/<species>` - Comprehensive network data for a species
- `/api/metrics/<species>` - Network metrics including data sources
- `/api/data-sources` - Information about integrated data sources

### Network Analysis

For Cannabis sativa, the dashboard shows:
- **12 metabolites** (compounds)
- **7 enzymes** (proteins)
- **0 reactions** (currently no connected metabolic reactions)
- **Network density**: 0.0 (no connections between metabolites)
- **Data sources**: Cannabis Database + PlantCyc

## Technical Implementation

### Data Structure

The integrated data is organized in a hierarchical structure:

```json
{
  "cannabis_database": {
    "compounds": {...},
    "enzymes": {...},
    "pathways": {...}
  },
  "plantcyc": {
    "compounds": {...},
    "enzymes": {...},
    "pathways": {...}
  },
  "integrated_compounds": {...},
  "integrated_pathways": {...},
  "cross_references": {...}
}
```

### Key Files

1. **`agents/metabolomics-agent/scripts/download_comprehensive_data.py`** - Downloads and integrates data from both sources
2. **`dashboard/app.py`** - Enhanced Flask backend with comprehensive data integration
3. **`dashboard/templates/index.html`** - Updated UI reflecting data sources
4. **`dashboard/static/js/dashboard.js`** - Enhanced JavaScript for dynamic data loading

### Data Files

- `agents/metabolomics-agent/data/datasets/integrated_metabolomics_data.json` - Main integrated dataset
- `agents/metabolomics-agent/data/datasets/dashboard_summary.json` - Dashboard statistics
- `agents/metabolomics-agent/data/datasets/cannabis/comprehensive_cannabis_data.json` - Cannabis Database data
- `agents/metabolomics-agent/data/datasets/plantcyc/comprehensive_plantcyc_data.json` - PlantCyc data

## Usage

### Starting the Dashboard

```bash
cd dashboard
source venv/bin/activate
python3 app.py
```

The dashboard runs on `http://localhost:3000`

### Accessing Data

- **Main Dashboard**: `http://localhost:3000`
- **API Documentation**: Available through the dashboard interface
- **Data Export**: Network data can be exported in JSON format

## Future Enhancements

1. **Real-time Data Updates**: Integration with live APIs from Cannabis Database and PlantCyc
2. **Advanced Network Analysis**: More sophisticated network metrics and visualization
3. **Pathway Visualization**: Interactive pathway diagrams
4. **Compound Search**: Advanced search and filtering capabilities
5. **Comparative Analysis**: Side-by-side comparison of different species
6. **Machine Learning Integration**: Predictive modeling for metabolic networks

## Data Quality

The integrated dataset provides:

- **Comprehensive Coverage**: Both cannabis-specific and general plant metabolism
- **Cross-references**: Links to KEGG, PubChem, and UniProt databases
- **Source Attribution**: Clear indication of data origin
- **Structured Format**: Consistent JSON structure for easy processing

## Conclusion

The Comprehensive Metabolomics Dashboard now successfully reflects data from both the Cannabis Database and PlantCyc, providing researchers with a unified platform for exploring metabolic networks across different plant species. The integration maintains data integrity while providing enhanced visualization and analysis capabilities.

The dashboard serves as a foundation for further research into cannabis metabolism and plant metabolic networks, with the potential for expansion to include additional data sources and analysis tools. 