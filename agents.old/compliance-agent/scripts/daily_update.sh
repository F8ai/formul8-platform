#!/bin/bash

# Daily Cannabis Compliance Data Update Script
# This script runs daily to collect fresh regulatory data from state websites

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$PROJECT_DIR/dashboard"
DATA_DIR="$PROJECT_DIR/compliance_data"

echo "🌐 Starting daily cannabis compliance data collection..."
echo "📅 $(date)"
echo "📂 Project directory: $PROJECT_DIR"

# Create directories if they don't exist
mkdir -p "$DATA_DIR"
mkdir -p "$DASHBOARD_DIR"

# Run the state metrics collection script
echo "🔄 Collecting real data from state cannabis regulatory websites..."
cd "$PROJECT_DIR"

python3 "$DASHBOARD_DIR/state_metrics.py" \
    --output "$DASHBOARD_DIR/dashboard_metrics.json" \
    --max-states 10 \
    --states ca co wa or nv az ma il ny nj

# Check if data was collected successfully
if [ -f "$DASHBOARD_DIR/dashboard_metrics.json" ]; then
    echo "✅ Dashboard metrics generated successfully"
    
    # Display basic stats
    TOTAL_CITATIONS=$(python3 -c "
import json
with open('$DASHBOARD_DIR/dashboard_metrics.json', 'r') as f:
    data = json.load(f)
print(data['summary_metrics']['total_citations'])
")
    
    STATES_COMPLETED=$(python3 -c "
import json
with open('$DASHBOARD_DIR/dashboard_metrics.json', 'r') as f:
    data = json.load(f)
print(data['summary_metrics']['states_completed'])
")
    
    echo "📊 Summary:"
    echo "   • States completed: $STATES_COMPLETED"
    echo "   • Total citations: $TOTAL_CITATIONS"
    echo "   • Data source: real_state_websites"
    echo "   • Collection method: live_web_scraping"
else
    echo "❌ Failed to generate dashboard metrics"
    exit 1
fi

# Create a backup of the collected data
BACKUP_FILE="$DATA_DIR/daily_backup_$(date +%Y%m%d_%H%M%S).json"
if [ -f "$DASHBOARD_DIR/dashboard_metrics.json" ]; then
    cp "$DASHBOARD_DIR/dashboard_metrics.json" "$BACKUP_FILE"
    echo "💾 Backup created: $BACKUP_FILE"
fi

echo "🎉 Daily cannabis compliance data collection completed!"
echo "📊 Dashboard data ready for Formul8 platform"