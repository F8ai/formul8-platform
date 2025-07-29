#!/bin/bash

echo "=== Data Submodule Initialization Script ==="
echo "This script will initialize all agent data repositories as Git submodules"
echo ""

cd /home/runner/workspace

# List of agents with data repositories
agents=("compliance-agent" "formulation-agent" "marketing-agent" "operations-agent" "sourcing-agent" "patent-agent" "science-agent" "spectra-agent" "customer-success-agent")

echo "=== Step 1: Remove existing data directories ==="
for agent in "${agents[@]}"; do
    if [ -d "agents/$agent/data" ]; then
        echo "Removing agents/$agent/data..."
        rm -rf "agents/$agent/data"
    fi
done

echo ""
echo "=== Step 2: Initialize data submodules ==="
for agent in "${agents[@]}"; do
    echo "Initializing $agent data submodule..."
    
    # Initialize the specific data submodule
    if git submodule update --init "agents/$agent/data" 2>/dev/null; then
        echo "  ✓ Successfully initialized agents/$agent/data"
    else
        echo "  → Attempting manual clone for agents/$agent/data"
        # Manual clone if submodule init fails
        git clone "https://github.com/F8ai/${agent%-agent}-data.git" "agents/$agent/data" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✓ Successfully cloned agents/$agent/data"
        else
            echo "  ✗ Failed to initialize agents/$agent/data"
        fi
    fi
done

echo ""
echo "=== Step 3: Verify data submodule status ==="
git submodule status | grep "/data"

echo ""
echo "=== Step 4: Check data directory contents ==="
for agent in "${agents[@]}"; do
    if [ -d "agents/$agent/data" ]; then
        file_count=$(find "agents/$agent/data" -type f | wc -l)
        echo "agents/$agent/data: $file_count files"
    else
        echo "agents/$agent/data: Directory not found"
    fi
done

echo ""
echo "=== Data Submodule Initialization Complete ==="
echo "All agent data repositories should now be properly initialized with Git LFS support"