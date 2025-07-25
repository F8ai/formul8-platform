# Local LLM Setup for Baseline Testing

This guide explains how to set up and use local LLMs for comparison testing alongside cloud models.

## Overview

The baseline testing system now supports local LLMs via Ollama, providing cost-free comparison testing with models that run entirely on your machine. This is perfect for:

- ✅ Cost-free baseline testing  
- ✅ Privacy-focused testing (no data sent to cloud)
- ✅ Offline development and testing
- ✅ Performance comparison with cloud models
- ✅ Rapid iteration without API costs

## Available Local Models

| Model | Size | Description | Best For |
|-------|------|-------------|----------|
| TinyLlama | 637MB | Ultra-small, fast responses | Quick testing, rapid iteration |
| Llama 3.2 1B | 1.3GB | Small but capable | General testing, low resource usage |
| Llama 3.2 3B | 2.0GB | Balanced performance | Quality testing, good responses |
| Phi-3 Mini | 2.3GB | Microsoft's efficient model | Technical questions, reasoning |

## Quick Setup

### 1. Automatic Setup (Recommended)

```bash
# Run the automated setup script
./scripts/setup-ollama.sh
```

This script will:
- Install Ollama if not present
- Start the Ollama service
- Pull all available local models
- Display usage examples

### 2. Manual Setup

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Pull models individually
ollama pull tinyllama
ollama pull llama3.2:1b
ollama pull llama3.2:3b
ollama pull phi3:mini
```

## Usage Examples

### Baseline Testing with Local Models

```bash
# Test with TinyLlama (fastest, smallest)
python3 run_baseline_test_db.py --agent compliance-agent --model tinyllama

# Test with Llama 3.2 1B (balanced)
python3 run_baseline_test_db.py --agent compliance-agent --model llama3.2-1b

# Test with Phi-3 Mini (good reasoning)
python3 run_baseline_test_db.py --agent formulation-agent --model phi3-mini

# Enable AI grading with local model
python3 run_baseline_test_db.py --agent compliance-agent --model llama3.2-3b --enable-ai-grading
```

### Web Interface Usage

1. Go to the Baseline Testing Dashboard
2. Select "New Test" tab
3. Choose your agent and a local model (marked with green/red dot for availability)
4. Local models show "FREE" badge and model size
5. Run the test - responses will be generated locally

## Model Performance Comparison

### Response Quality
- **Cloud Models**: Generally higher quality, more consistent
- **Local Models**: Variable quality, good for specific domains

### Speed
- **TinyLlama**: ~2-5 seconds per response
- **Llama 3.2 1B**: ~5-10 seconds per response  
- **Llama 3.2 3B**: ~10-20 seconds per response
- **Phi-3 Mini**: ~8-15 seconds per response

### Cost
- **Cloud Models**: $0.00015-$0.025 per 1K tokens
- **Local Models**: $0.00 (only hardware costs)

## Confidence Scoring

Local models support the same confidence scoring system as cloud models:

1. **Model Confidence**: Local models provide 0-100% confidence in their answers
2. **AI Grading**: Can use any model (local or cloud) to grade responses
3. **Comparison**: Direct confidence comparison between local and cloud models

## Troubleshooting

### Ollama Not Running
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve &
```

### Model Not Available
```bash
# List available models
ollama list

# Pull missing model
ollama pull tinyllama
```

### Performance Issues
- **Memory**: Ensure sufficient RAM (4GB+ recommended for 3B models)
- **CPU**: Models run faster on newer CPUs with more cores
- **Storage**: Ensure sufficient disk space for model files

## Integration Details

### Database Storage
Local model results are stored alongside cloud model results with:
- Full response text and confidence scores
- Response time measurements
- Error handling and fallback support

### API Integration
- Local models integrate seamlessly with existing baseline testing API
- Models endpoint shows local availability status
- Automatic fallback to cloud models if local unavailable

### Frontend Integration
- Models dropdown shows local model status (green/red dot)
- Model size displayed for resource planning
- FREE badge for zero-cost models

## Best Practices

1. **Start Small**: Begin with TinyLlama for quick testing
2. **Compare Results**: Run same tests with cloud and local models
3. **Monitor Resources**: Watch CPU/memory usage during tests
4. **Use for Development**: Perfect for iterating on prompts and tests
5. **Hybrid Approach**: Use local for development, cloud for production

## Future Enhancements

- [ ] GPU acceleration support
- [ ] Custom model fine-tuning
- [ ] Batch processing optimization  
- [ ] Model performance benchmarking
- [ ] Automatic model recommendation based on task

## Support

For issues with local LLM setup:
1. Check Ollama service status
2. Verify model availability with `ollama list`
3. Check system resources (RAM, CPU, disk)
4. Review error logs in baseline test output