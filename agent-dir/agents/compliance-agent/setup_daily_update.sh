
#!/bin/bash
# Setup script for daily regulation updates

echo "🔧 Setting up daily regulation updates..."

# Make scripts executable
chmod +x download_regulations.py
chmod +x update_regulations_daily.py

# Create regulations directory
mkdir -p regulations

# Install required system packages
echo "📦 Installing wget and cron..."

# Check if wget is installed
if ! command -v wget &> /dev/null; then
    echo "Installing wget..."
    # This will be handled by Nix in Replit
    echo "wget" >> .replit-packages
fi

# Create cron job for daily updates (would need to be scheduled via Replit Scheduled Deployments)
echo "⏰ To set up daily updates, use Replit Scheduled Deployments:"
echo "   1. Go to Deployments in your workspace"
echo "   2. Create a Scheduled Deployment"  
echo "   3. Set schedule to: 'Every day at 2 AM'"
echo "   4. Set run command to: 'python update_regulations_daily.py'"

# Initial download
echo "🚀 Running initial regulation download..."
python download_regulations.py

echo "✅ Setup complete!"
echo "📁 Regulations will be stored in the 'regulations/' directory"
echo "📊 Check 'regulations/download_summary.json' for download status"
