#!/bin/bash

# Formul8 Agent Launcher
# Usage: ./start-agent.sh [agent-name] [port]

AGENT_NAME=${1:-"metabolomics"}
PORT=${2:-""}

# Port assignments
declare -A AGENT_PORTS=(
    ["metabolomics"]="3001"
    ["compliance"]="3002"
    ["formulation"]="3003"
    ["marketing"]="3004"
    ["operations"]="3005"
    ["patent"]="3006"
    ["sourcing"]="3007"
    ["spectra"]="3008"
    ["customer-success"]="3009"
    ["science"]="3010"
)

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Use assigned port if not specified
if [ -z "$PORT" ]; then
    PORT=${AGENT_PORTS[$AGENT_NAME]}
    if [ -z "$PORT" ]; then
        echo "❌ Unknown agent: $AGENT_NAME"
        echo "Available agents: ${!AGENT_PORTS[*]}"
        exit 1
    fi
fi

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port $PORT is already in use"
    echo "Please stop the service on port $PORT or use a different port"
    exit 1
fi

echo "🚀 Starting $AGENT_NAME agent on port $PORT..."

# Agent-specific startup logic
case $AGENT_NAME in
    "metabolomics")
        cd agents/metabolomics-agent/dashboard
        if [ ! -d "venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt
        python app.py --port $PORT
        ;;
    "compliance")
        cd agents/compliance-agent
        if [ ! -d "venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt
        python app.py --port $PORT
        ;;
    "formulation")
        cd agents/formulation-agent
        if [ ! -d "venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt
        python app.py --port $PORT
        ;;
    *)
        echo "❌ Agent $AGENT_NAME not yet configured for startup"
        echo "Available agents: metabolomics, compliance, formulation"
        exit 1
        ;;
esac 