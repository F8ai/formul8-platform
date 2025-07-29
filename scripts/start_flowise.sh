#!/bin/bash

echo "Starting Flowise on port 3050..."
echo "Your platform is running on port 3000"
echo "Flowise will be available at http://localhost:3050"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Flowise container already exists
if docker ps -a --format "table {{.Names}}" | grep -q "^flowise$"; then
    echo "Removing existing Flowise container..."
    docker rm -f flowise
fi

# Start Flowise
echo "Starting Flowise container..."
docker run -d -p 3050:3000 --name flowise flowiseai/flowise

# Wait a moment for it to start
sleep 3

# Check if it's running
if docker ps --format "table {{.Names}}" | grep -q "^flowise$"; then
    echo "✅ Flowise is now running at http://localhost:3050"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:3050 in your browser"
    echo "2. Import your Voiceflow project (.vf file)"
    echo "3. Use the API to get the flow data"
else
    echo "❌ Failed to start Flowise"
    exit 1
fi 