#!/bin/bash

# Setup script for Ollama and local LLMs for baseline testing

echo "🦙 Setting up Ollama for local LLM testing..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service in background
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Function to pull model with retry
pull_model() {
    local model=$1
    local description=$2
    echo "📥 Pulling $description ($model)..."
    
    max_retries=3
    retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if ollama pull $model; then
            echo "✅ Successfully pulled $model"
            return 0
        else
            retry_count=$((retry_count + 1))
            echo "❌ Failed to pull $model (attempt $retry_count/$max_retries)"
            if [ $retry_count -lt $max_retries ]; then
                echo "🔄 Retrying in 10 seconds..."
                sleep 10
            fi
        fi
    done
    
    echo "💔 Failed to pull $model after $max_retries attempts"
    return 1
}

# Pull local models for testing
echo "📚 Pulling local models for comparison testing..."

# Start with smallest model
pull_model "tinyllama" "TinyLlama (637MB)"

# Pull Llama 3.2 models
pull_model "llama3.2:1b" "Llama 3.2 1B (1.3GB)"
pull_model "llama3.2:3b" "Llama 3.2 3B (2.0GB)"

# Pull Phi-3 Mini
pull_model "phi3:mini" "Phi-3 Mini (2.3GB)"

echo "📋 Available local models:"
ollama list

echo "🎉 Local LLM setup complete!"
echo ""
echo "💡 Usage examples:"
echo "  python3 run_baseline_test_db.py --agent compliance-agent --model tinyllama"
echo "  python3 run_baseline_test_db.py --agent compliance-agent --model llama3.2-1b"
echo "  python3 run_baseline_test_db.py --agent compliance-agent --model phi3-mini"
echo ""
echo "🔍 To check model status:"
echo "  ollama list"
echo "  curl http://localhost:11434/api/tags"
echo ""
echo "⚡ To stop Ollama:"
echo "  kill $OLLAMA_PID"

# Keep Ollama running
wait $OLLAMA_PID