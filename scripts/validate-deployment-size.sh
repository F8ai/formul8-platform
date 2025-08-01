#!/bin/bash

# Deployment size validation script
echo "📊 Validating deployment size for Cloud Run..."

# Function to format bytes in human readable format
format_size() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(($bytes / 1073741824))GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(($bytes / 1048576))MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(($bytes / 1024))KB"
    else
        echo "${bytes}B"
    fi
}

# Get directory sizes
get_dir_size() {
    if [ -d "$1" ]; then
        du -sb "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Calculate what's included in build
echo "📦 Included in Docker build:"
echo "├── dist/: $(format_size $(get_dir_size "dist"))"
echo "├── server/: $(format_size $(get_dir_size "server"))"
echo "├── shared/: $(format_size $(get_dir_size "shared"))"
echo "├── package files: $(format_size $(du -sb package*.json 2>/dev/null | awk '{sum+=$1} END {print sum+0}'))"

total_included=0
for dir in dist server shared; do
    if [ -d "$dir" ]; then
        size=$(get_dir_size "$dir")
        total_included=$((total_included + size))
    fi
done

# Add package files
package_size=$(du -sb package*.json 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
total_included=$((total_included + package_size))

echo "└── Total included: $(format_size $total_included)"

# Calculate what's excluded via .dockerignore
echo ""
echo "🚫 Excluded via .dockerignore:"
excluded_dirs="attached_assets docs agents.old data datasets __pycache__ dashboard flowise local-deployment agents node_modules"
total_excluded=0

for dir in $excluded_dirs; do
    if [ -d "$dir" ]; then
        size=$(get_dir_size "$dir")
        total_excluded=$((total_excluded + size))
        echo "├── $dir/: $(format_size $size)"
    fi
done

echo "└── Total excluded: $(format_size $total_excluded)"

# Cloud Run size limits
cloud_run_limit=8589934592  # 8GB in bytes
echo ""
echo "📏 Cloud Run Analysis:"
echo "├── Size limit: $(format_size $cloud_run_limit)"
echo "├── Estimated build size: $(format_size $total_included)"

if [ $total_included -lt $cloud_run_limit ]; then
    percentage=$((total_included * 100 / cloud_run_limit))
    echo "├── Usage: ${percentage}% of limit"
    echo "└── ✅ Under Cloud Run 8GB limit"
else
    echo "└── ❌ Exceeds Cloud Run 8GB limit"
    exit 1
fi

echo ""
echo "💾 Space saved by optimization: $(format_size $total_excluded)"
echo "📈 Size reduction: $((total_excluded * 100 / (total_excluded + total_included)))%"