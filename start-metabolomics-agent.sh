#!/bin/bash

# Start Metabolomics Agent Dashboard
echo "🌿 Starting Metabolomics Agent Dashboard..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Change to the metabolomics agent directory
cd agents/metabolomics-agent/dashboard

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Start the Flask app on port 3001
echo "Starting dashboard on http://localhost:3001"
python app.py --port 3001 