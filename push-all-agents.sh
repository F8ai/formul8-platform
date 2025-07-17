#!/bin/bash

# Push all agent repositories to GitHub
agents=("compliance" "formulation" "marketing" "operations" "science" "spectra" "sourcing" "patent" "customer-success")

for agent in "${agents[@]}"; do
  echo "=== Processing ${agent}-agent ==="
  cd "${agent}-agent" || continue
  
  # Check if git repo exists
  if [ ! -d ".git" ]; then
    echo "No git repository found for ${agent}-agent"
    cd ..
    continue
  fi
  
  # Show current status
  echo "Current branch:"
  git branch --show-current
  
  echo "Files to be pushed:"
  git log --oneline -1
  
  # Try to push with timeout
  timeout 30s git push origin main || echo "Push timed out or failed for ${agent}-agent"
  
  echo "=== Completed ${agent}-agent ==="
  echo ""
  cd ..
done

echo "All agent repositories processed."