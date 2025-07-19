#!/bin/bash

# Setup script for all Formul8 agents with data submodules

AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "marketing-agent"
    "operations-agent"
    "sourcing-agent"
    "patent-agent"
    "science-agent"
    "spectra-agent"
    "customer-success-agent"
)

# Function to initialize data repository
init_data_repo() {
    local agent_name=$1
    local data_dir="agents/${agent_name}/data"
    
    echo "Setting up data repository for ${agent_name}..."
    
    # Create directory structure
    mkdir -p "${data_dir}"/{corpus,vectorstore,knowledge_base,models,datasets}
    
    # Create README
    cat > "${data_dir}/README.md" << EOF
# ${agent_name^} Data Repository

This repository contains training data, knowledge bases, and vector stores for the Formul8 ${agent_name^}.

## Directory Structure

\`\`\`
data/
├── corpus/           # Training corpus files (JSONL format)
├── vectorstore/      # FAISS vector indices
├── knowledge_base/   # RDF/TTL knowledge graphs
├── models/          # Local AI models (GGUF format)
└── datasets/        # Domain-specific datasets and documents
\`\`\`

## Git LFS Configuration

Large files are tracked with Git LFS:
- Vector stores (.faiss, .pkl)
- AI models (.gguf, .bin)
- Large datasets (.jsonl, .parquet)
- Database files (.sqlite, .db)

## Usage

This data repository is automatically included as a submodule in the ${agent_name} repository.
EOF

    # Create .gitattributes for Git LFS
    cat > "${data_dir}/.gitattributes" << 'EOF'
# Git LFS Configuration for Agent Data

# Vector stores and indices
*.faiss filter=lfs diff=lfs merge=lfs -text
*.pkl filter=lfs diff=lfs merge=lfs -text
*.index filter=lfs diff=lfs merge=lfs -text

# AI Models
*.gguf filter=lfs diff=lfs merge=lfs -text
*.bin filter=lfs diff=lfs merge=lfs -text
*.safetensors filter=lfs diff=lfs merge=lfs -text
*.pt filter=lfs diff=lfs merge=lfs -text
*.pth filter=lfs diff=lfs merge=lfs -text

# Large datasets
*.jsonl filter=lfs diff=lfs merge=lfs -text
*.parquet filter=lfs diff=lfs merge=lfs -text
*.feather filter=lfs diff=lfs merge=lfs -text
*.h5 filter=lfs diff=lfs merge=lfs -text
*.hdf5 filter=lfs diff=lfs merge=lfs -text

# Database files
*.sqlite filter=lfs diff=lfs merge=lfs -text
*.db filter=lfs diff=lfs merge=lfs -text
*.sqlite3 filter=lfs diff=lfs merge=lfs -text

# Archives and compressed files
*.tar.gz filter=lfs diff=lfs merge=lfs -text
*.tgz filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text

# Large text files
*corpus*.txt filter=lfs diff=lfs merge=lfs -text
*training*.txt filter=lfs diff=lfs merge=lfs -text

# Media files
*.pdf filter=lfs diff=lfs merge=lfs -text
*.epub filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text
EOF
}

# Function to commit data repository via GitHub API
commit_data_repo() {
    local agent_name=$1
    local data_repo="${agent_name//-/}-data"
    local data_dir="agents/${agent_name}/data"
    
    echo "Committing ${data_repo} repository..."
    
    # Commit README
    cd "${data_dir}"
    gh api "repos/F8ai/${data_repo}/contents/README.md" \
        --method PUT \
        --raw-field message="Initialize ${agent_name} data repository with Git LFS" \
        --raw-field content="$(base64 -w 0 README.md)" \
        --field sha="$(gh api repos/F8ai/${data_repo}/contents/README.md --jq '.sha' 2>/dev/null || echo '')" \
        >/dev/null 2>&1
    
    # Commit .gitattributes
    gh api "repos/F8ai/${data_repo}/contents/.gitattributes" \
        --method PUT \
        --raw-field message="Add Git LFS configuration for ${agent_name}" \
        --raw-field content="$(base64 -w 0 .gitattributes)" \
        --field sha="$(gh api repos/F8ai/${data_repo}/contents/.gitattributes --jq '.sha' 2>/dev/null || echo '')" \
        >/dev/null 2>&1
    
    cd - >/dev/null
}

# Main setup loop
for agent in "${AGENTS[@]}"; do
    echo "Processing ${agent}..."
    
    # Clone agent repository if not exists
    if [ ! -d "agents/${agent}" ]; then
        echo "Cloning ${agent}..."
        cd agents
        gh repo clone "F8ai/${agent}" "${agent}" >/dev/null 2>&1
        cd ..
    fi
    
    # Clone data repository
    if [ ! -d "agents/${agent}/data" ]; then
        echo "Setting up data for ${agent}..."
        cd "agents/${agent}"
        data_repo="${agent//-/}-data"
        gh repo clone "F8ai/${data_repo}" data >/dev/null 2>&1
        cd ../..
        
        # Initialize data structure
        init_data_repo "${agent}"
        
        # Commit to GitHub
        commit_data_repo "${agent}"
    fi
    
    echo "✅ ${agent} setup complete"
done

echo "🎉 All agents setup complete!"