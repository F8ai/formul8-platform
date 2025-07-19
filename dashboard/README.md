# Metabolomics Data Dashboard

A modern, interactive web dashboard for exploring and monitoring metabolomics data, genome information, and download status.

## Features

### 📊 **Real-time Data Visualization**
- **Genome Comparison Charts**: Interactive charts comparing genome sizes, protein counts, and gene counts
- **File Status Heatmap**: Visual representation of download status for all data files
- **Data Coverage Metrics**: Pie charts showing overall data completeness

### 🔍 **Data Monitoring**
- **File Status Tracking**: Real-time monitoring of downloaded files with size and modification dates
- **Download Progress**: Live updates on genome data downloads
- **Activity Logs**: Recent download and processing activity

### 🎯 **Interactive Features**
- **One-click Downloads**: Trigger genome downloads directly from the dashboard
- **Auto-refresh**: Automatic data updates every 30 seconds
- **Export Functionality**: Export data in CSV or JSON formats
- **Search & Filter**: Find specific files or data quickly

### 📱 **Responsive Design**
- **Mobile-friendly**: Optimized for tablets and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Accessibility**: Keyboard shortcuts and screen reader support

## Quick Start

### Prerequisites
- Python 3.7+
- Flask
- Plotly
- Required dependencies (see requirements.txt)

### Installation

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Run the dashboard**:
```bash
cd dashboard
python app.py
```

3. **Access the dashboard**:
Open your browser and navigate to `http://localhost:5000`

## Dashboard Sections

### 1. **Overview Cards**
- **Species Information**: Quick stats for each species (C. sativa, P. cubensis)
- **Genome Metrics**: Genome size, chromosome count, protein count, gene count
- **Download Buttons**: One-click genome data downloads

### 2. **Genome Comparison Charts**
- **Bar Charts**: Compare genome sizes, protein counts, and gene counts across species
- **Data Coverage**: Pie chart showing overall download completion status
- **Interactive Elements**: Hover for detailed information, zoom capabilities

### 3. **File Status Visualization**
- **Heatmap**: Color-coded grid showing file download status
- **File Types**: Assembly reports, genome FASTA, protein FASTA, GFF annotations, etc.
- **Status Indicators**: Green (downloaded), Yellow (pending), Red (failed)

### 4. **Detailed File Tables**
- **Per-species Breakdown**: Detailed file information for each species
- **File Metadata**: Size, modification date, download status
- **Progress Tracking**: Real-time updates on download progress

### 5. **Activity Logs**
- **Recent Activity**: Timeline of recent downloads and processing
- **Status Tracking**: Success/failure status for each operation
- **Timestamp Information**: When each operation occurred

## API Endpoints

### Data Endpoints
- `GET /api/stats` - Get genome statistics
- `GET /api/status` - Get file download status
- `GET /api/charts/genome-comparison` - Get genome comparison chart
- `GET /api/charts/file-status` - Get file status heatmap

### Action Endpoints
- `POST /download/<species>` - Trigger download for specific species

## Configuration

### Environment Variables
```bash
# Dashboard configuration
FLASK_ENV=development
FLASK_DEBUG=True
DASHBOARD_PORT=5000
DASHBOARD_HOST=0.0.0.0

# Data paths
GENOMES_DIR=../genomes
DATA_BASE_DIR=..
```

### Customization
- **Chart Colors**: Modify CSS variables in `static/css/style.css`
- **Refresh Intervals**: Adjust auto-refresh timing in `static/js/dashboard.js`
- **Data Sources**: Update species information in `app.py`

## Usage Examples

### Basic Navigation
1. **View Overview**: Check the main dashboard for current status
2. **Monitor Downloads**: Watch the file status heatmap for progress
3. **Trigger Downloads**: Click download buttons for specific species
4. **Export Data**: Use keyboard shortcuts (Ctrl+E) or menu options

### Advanced Features
1. **Real-time Monitoring**: Dashboard auto-refreshes every 30 seconds
2. **Data Export**: Export statistics in CSV or JSON format
3. **Search & Filter**: Use search functionality to find specific files
4. **Keyboard Shortcuts**: 
   - `Ctrl+R`: Refresh data
   - `Ctrl+E`: Export data

## File Structure

```
dashboard/
├── app.py                 # Main Flask application
├── templates/
│   └── index.html        # Main dashboard template
├── static/
│   ├── css/
│   │   └── style.css     # Custom styles
│   └── js/
│       └── dashboard.js  # Interactive functionality
└── README.md             # This file
```

## Data Sources

The dashboard integrates with:
- **NCBI GenBank**: Genome assemblies and annotations
- **UniProtKB**: Protein sequence and functional data
- **Local Genome Data**: Downloaded genome files in `../genomes/`

## Troubleshooting

### Common Issues

1. **Dashboard won't start**:
   - Check Python version (3.7+ required)
   - Verify all dependencies are installed
   - Check port availability (default: 5000)

2. **Charts not loading**:
   - Verify Plotly.js is loading correctly
   - Check browser console for JavaScript errors
   - Ensure API endpoints are responding

3. **Data not updating**:
   - Check file permissions for genome directories
   - Verify data files exist in expected locations
   - Check auto-refresh settings

### Debug Mode
Enable debug mode for detailed error information:
```bash
export FLASK_DEBUG=True
python app.py
```

## Performance

### Optimization Tips
- **Caching**: Enable browser caching for static assets
- **Compression**: Use gzip compression for API responses
- **CDN**: Serve static files from CDN for better performance
- **Database**: Consider using a database for large datasets

### Monitoring
- **Performance Metrics**: Dashboard logs page load times
- **Error Tracking**: Console logs for debugging
- **Resource Usage**: Monitor memory and CPU usage

## Security

### Best Practices
- **HTTPS**: Use HTTPS in production
- **Authentication**: Add user authentication for sensitive data
- **Input Validation**: Validate all user inputs
- **Rate Limiting**: Implement API rate limiting

### Production Deployment
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Using Docker
docker build -t metabolomics-dashboard .
docker run -p 5000:5000 metabolomics-dashboard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Open an issue in the repository
- Check the troubleshooting section
- Review the API documentation 