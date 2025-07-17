# Compliance Agent - Real Regulatory Data Service

The Compliance Agent is a specialized AI consultant that downloads and maintains up-to-date cannabis regulations from all states with daily automatic updates. This ensures users always have access to the most current regulatory information for compliance decisions.

## 🏛️ Features

### Real Regulatory Data
- **All 24 Cannabis States**: Downloads regulations from every state with legal cannabis
- **Daily Updates**: Automatically checks for regulatory changes every day at 2:00 AM
- **Multiple Categories**: Covers licensing, cultivation, manufacturing, retail, testing, transportation, and general regulations
- **Change Tracking**: Monitors and logs all regulatory updates and changes
- **Content Hashing**: Detects even minor changes in regulation text

### Comprehensive Coverage
- **California**: CDPH manufacturing, CDFA cultivation, BCC retail regulations
- **Colorado**: Medical and retail cannabis rules
- **Washington**: LCB laws and rules
- **Oregon**: OLCC marijuana statutes and rules
- **Nevada**: Cannabis Compliance Board regulations
- **Arizona**: Medical marijuana rules and statutes
- **Massachusetts**: Cannabis Control Commission regulations
- **Illinois**: Cannabis Regulation and Tax Act
- **New York**: Cannabis regulations
- **New Jersey**: Cannabis laws and regulations
- **Connecticut**: Cannabis regulations
- **Michigan**: Cannabis Regulatory Agency rules
- **Florida**: Medical cannabis laws and rules
- **Pennsylvania**: Medical cannabis program regulations
- **Ohio**: Cannabis control program
- **Minnesota**: Cannabis control office
- **Maryland**: Cannabis administration
- **District of Columbia**: Medical cannabis regulations
- **Vermont**: Cannabis Control Board regulations
- **Maine**: Office of Cannabis Policy rules
- **Rhode Island**: Cannabis control
- **New Mexico**: Cannabis Control Division
- **Montana**: Cannabis Control Division
- **Alaska**: Marijuana Control Office
- **Hawaii**: Medical Cannabis Registry Program

## 🚀 Quick Start

### Initialize the Service
```bash
# Start the Compliance Agent
python app.py

# Initialize regulatory data download (first time)
curl -X POST http://localhost:5001/api/regulatory/initialize
```

### API Endpoints

#### Get Statistics
```bash
curl http://localhost:5001/api/regulatory/statistics
```

#### Get State Regulations
```bash
curl http://localhost:5001/api/regulatory/state/CA
```

#### Search Regulations
```bash
curl "http://localhost:5001/api/regulatory/search?q=licensing&state=CO"
```

#### Get Compliance Advice
```bash
curl -X POST http://localhost:5001/api/regulatory/advice \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the licensing requirements for cultivation?",
    "state_code": "CA",
    "business_type": "cultivation"
  }'
```

#### Force Update State
```bash
curl -X POST http://localhost:5001/api/regulatory/update/CA
```

## 📊 Data Architecture

### Database Schema
```sql
-- Regulations table
CREATE TABLE regulations (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    version TEXT NOT NULL,
    effective_date TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active'
);

-- Updates tracking
CREATE TABLE regulatory_updates (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    change_type TEXT NOT NULL,
    change_description TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    regulation_data TEXT NOT NULL
);
```

### Regulation Categories
- **Licensing**: Business licenses, application processes, renewal requirements
- **Cultivation**: Growing regulations, facility requirements, plant tracking
- **Manufacturing**: Processing rules, product standards, testing requirements
- **Retail**: Sales regulations, customer verification, inventory tracking
- **Testing**: Laboratory requirements, product testing standards
- **Transportation**: Distribution rules, vehicle requirements, tracking
- **General**: Overall framework, definitions, administrative rules

## 🔄 Daily Update Process

### Automatic Scheduling
1. **Daily Check**: Every day at 2:00 AM, the service checks all state regulation sources
2. **Content Comparison**: Uses SHA-256 hashing to detect any content changes
3. **Update Detection**: Identifies new, modified, or removed regulations
4. **Database Update**: Stores new versions and logs all changes
5. **Change Notification**: Logs detected changes for review

### Manual Updates
- Force update any state: `POST /api/regulatory/update/{state_code}`
- Full system update: `POST /api/regulatory/initialize`

## 🛡️ Data Quality

### Content Processing
- **HTML Parsing**: Extracts clean text from web pages using BeautifulSoup
- **Text Normalization**: Removes formatting, normalizes whitespace
- **Content Validation**: Verifies successful downloads and content quality
- **Error Handling**: Logs and handles failed downloads gracefully

### Change Detection
- **Hash Comparison**: SHA-256 hashes detect even minor text changes
- **Version Control**: Maintains version history of all regulations
- **Update Logging**: Tracks what changed, when, and in which state

## 📱 Integration

### Flask API Server
```python
from services.regulatory_data_service import regulatory_service

# Get regulations for a state
regulations = regulatory_service.get_state_regulations('CA')

# Search across all states
results = regulatory_service.search_regulations('licensing requirements')

# Check for updates
updates = await regulatory_service.check_for_updates()
```

### Daily Scheduler
```python
# Start daily updates
regulatory_service.start_daily_updates()

# Manual update check
updates = await regulatory_service.check_for_updates()
```

## 🔧 Configuration

### Environment Variables
```bash
# Data storage path
REGULATORY_DATA_PATH=./data/regulations

# Update schedule (default: 02:00)
UPDATE_TIME=02:00

# Log level
LOG_LEVEL=INFO
```

### Dependencies
```bash
pip install -r requirements.txt
```

## 📈 Performance Metrics

### Download Statistics
- **Initial Download**: ~30-45 minutes for all 24 states
- **Daily Updates**: ~5-10 minutes depending on changes
- **Storage**: ~100MB for complete regulatory database
- **API Response**: <100ms for most queries

### Reliability Features
- **Retry Logic**: Failed downloads are retried with exponential backoff
- **Rate Limiting**: Respectful 2-second delays between requests
- **Error Recovery**: Continues processing other states if one fails
- **Health Monitoring**: Endpoint to check service status

## 🏗️ Architecture

```
compliance-agent/
├── app.py                          # Main Flask application
├── services/
│   └── regulatory_data_service.py  # Core regulatory data service
├── api/
│   └── regulatory_endpoints.py     # API endpoint handlers
├── data/
│   ├── regulations/               # SQLite database storage
│   └── logs/                      # Update and error logs
├── requirements.txt               # Python dependencies
└── README.md                     # This file
```

## 🚨 Important Disclaimers

1. **Not Legal Advice**: This service provides information only, not legal advice
2. **Verify Current Rules**: Always verify current requirements with state agencies
3. **Consult Attorneys**: For compliance decisions, consult qualified legal counsel
4. **State Variations**: Local municipalities may have additional requirements
5. **Frequent Changes**: Cannabis regulations change frequently

## 🔍 Troubleshooting

### Common Issues
1. **Download Failures**: Check internet connection and state website availability
2. **Storage Issues**: Ensure write permissions for data directory
3. **Schedule Issues**: Verify system time and timezone settings

### Monitoring
```bash
# Check service health
curl http://localhost:5001/health

# View statistics
curl http://localhost:5001/api/regulatory/statistics

# Check logs
tail -f data/logs/compliance-agent.log
```

## 📞 Support

For issues with the Compliance Agent:
1. Check the health endpoint for service status
2. Review logs for error messages
3. Verify internet connectivity to state websites
4. Ensure proper file permissions for data storage

The Compliance Agent provides the most comprehensive and up-to-date regulatory data available, but always consult with qualified legal counsel for compliance decisions.