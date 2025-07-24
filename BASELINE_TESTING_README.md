# Formul8 Platform Baseline Testing System

A comprehensive baseline testing framework for evaluating AI agents across different models, states, configurations, and capabilities.

## Features

- **Multi-Model Support**: Test with OpenAI (GPT-4o, o3), Anthropic Claude, Google Gemini
- **State Customization**: Dynamic `{{state}}` substitution for location-specific questions
- **Configurable Components**: Enable/disable RAG, tools, and knowledge bases
- **Custom Prompts**: Override default system prompts
- **Comprehensive Metrics**: Accuracy, confidence, response time, category breakdowns
- **Flexible Output**: JSON results with detailed test information

## Quick Start

### 1. Install Dependencies

```bash
pip install -r baseline_requirements.txt
```

### 2. Set API Keys

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"  # Optional
export GOOGLE_API_KEY="your-google-key"        # Optional
```

### 3. Run Basic Test

```bash
# Test compliance agent with default settings (GPT-4o)
python run_baseline_tests.py --agent compliance-agent

# Test with specific state
python run_baseline_tests.py --agent compliance-agent --state CA

# Test all agents
python run_baseline_tests.py --agent all --model gpt-4o
```

## Usage Examples

### Model Comparison
```bash
# Test with different models
python run_baseline_tests.py --agent compliance-agent --model gpt-4o --state CA
python run_baseline_tests.py --agent compliance-agent --model o3 --state CA
python run_baseline_tests.py --agent compliance-agent --model claude-3-sonnet --state CA
```

### Configuration Testing
```bash
# Test with RAG enabled
python run_baseline_tests.py --agent compliance-agent --rag --state CA

# Test with all features enabled
python run_baseline_tests.py --agent compliance-agent --rag --tools --kb --state NY

# Test with custom prompt
python run_baseline_tests.py --agent compliance-agent --prompt "custom_prompt.txt"
```

### Batch Testing
```bash
# Test all agents with specific configuration
python run_baseline_tests.py --agent all --model gpt-4o --rag --state CO
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--agent`, `-a` | Agent to test or "all" | compliance-agent |
| `--model`, `-m` | LLM model to use | gpt-4o |
| `--state`, `-s` | State for {{state}} substitution | None |
| `--prompt`, `-p` | Custom system prompt file/text | None |
| `--rag` | Enable RAG retrieval | False |
| `--tools` | Enable agent tools | False |
| `--kb` | Enable knowledge base access | False |
| `--verbose`, `-v` | Verbose logging | False |

## Supported Models

| Model | Provider | Description |
|-------|----------|-------------|
| `gpt-4o` | OpenAI | Default, balanced performance |
| `gpt-4o-mini` | OpenAI | Faster, cost-effective |
| `o3` | OpenAI | Latest reasoning model |
| `claude-3-sonnet` | Anthropic | High-quality responses |
| `claude-3-haiku` | Anthropic | Fast, efficient |
| `gemini-pro` | Google | Google's advanced model |

## Output Format

Results are saved as JSON files in the agent directory:

```
agents/compliance-agent/
├── baseline_results.json                    # Default configuration
├── baseline_results_state_CA.json          # State-specific
├── baseline_results_model_o3_state_CA.json # Model + state
└── baseline_results_rag_tools_kb.json      # Full configuration
```

### Result Structure

```json
{
  "agent": "compliance-agent",
  "timestamp": "2025-01-24T20:30:00",
  "model": "gpt-4o",
  "state": "CA",
  "configuration": {
    "rag_enabled": true,
    "tools_enabled": false,
    "kb_enabled": true,
    "custom_prompt": false
  },
  "summary": {
    "total_questions": 60,
    "successful_tests": 58,
    "failed_tests": 2,
    "avg_accuracy": 87.5,
    "avg_confidence": 91.2,
    "avg_response_time": 2.3
  },
  "category_breakdown": {
    "sop_documentation": {
      "count": 3,
      "avg_accuracy": 92.0,
      "avg_confidence": 95.0
    }
  },
  "detailed_results": [...]
}
```

## State Substitution

The system automatically replaces `{{state}}` placeholders in questions:

**Original Question:**
```
"Can you make me a compliant SOP for Cannabis Transport in {{state}}?"
```

**With --state CA:**
```
"Can you make me a compliant SOP for Cannabis Transport in CA?"
```

## RAG Configuration

When `--rag` is enabled, the system:

1. Loads `agents/{agent}/rag/corpus.jsonl`
2. Performs keyword-based retrieval
3. Adds relevant context to prompts

## Knowledge Base Integration

When `--kb` is enabled, the system:

1. Loads `agents/{agent}/knowledge_base.ttl`
2. Extracts relevant RDF triples
3. Adds structured knowledge to prompts

## Custom Prompts

Provide custom system prompts via:

```bash
# From file
python run_baseline_tests.py --agent compliance-agent --prompt my_prompt.txt

# Inline text
python run_baseline_tests.py --agent compliance-agent --prompt "You are a specialized cannabis expert..."
```

## Performance Benchmarking

### Accuracy Calculation
- Keyword overlap between expected and actual answers
- Filtered common words (the, a, and, etc.)
- Scored 0-100% based on coverage

### Confidence Scoring
- Agent's self-assessed confidence
- Based on response characteristics
- Reported 0-100%

### Response Time
- Measured from query to response
- Includes model processing time
- Reported in seconds

## Error Handling

The system gracefully handles:
- Missing API keys (falls back to OpenAI)
- Unavailable models (falls back to GPT-4o)
- Missing RAG/KB files (continues without)
- Network timeouts (retries with delays)
- Rate limiting (automatic delays)

## Integration with Existing Systems

### GitHub Actions
Integrate with existing workflows:

```yaml
- name: Run Baseline Tests
  run: |
    python run_baseline_tests.py --agent compliance-agent --model gpt-4o --state CA
    python run_baseline_tests.py --agent all --rag --tools
```

### Automated Testing
Schedule regular testing:

```bash
# Daily testing with different configurations
0 2 * * * cd /path/to/formul8 && python run_baseline_tests.py --agent all --model gpt-4o
0 3 * * * cd /path/to/formul8 && python run_baseline_tests.py --agent all --model o3 --rag
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   export OPENAI_API_KEY="your-key-here"
   ```

2. **Missing Dependencies**
   ```bash
   pip install -r baseline_requirements.txt
   ```

3. **Model Unavailable**
   - System automatically falls back to GPT-4o
   - Check provider API key is set

4. **No Baseline Questions**
   - Ensure `agents/{agent}/baseline.json` exists
   - Check JSON format is valid

### Debug Mode

Enable verbose logging:
```bash
python run_baseline_tests.py --agent compliance-agent --verbose
```

## Development

### Adding New Models

1. Add model configuration:
```python
self.model_configs["new-model"] = {
    "provider": "provider-name",
    "model": "model-id",
    "temperature": 0.3
}
```

2. Add provider initialization logic
3. Update CLI choices

### Custom Metrics

Extend `_calculate_accuracy()` method for domain-specific scoring.

### Agent-Specific Features

Override methods in agent implementations for specialized testing.

## Best Practices

1. **Systematic Testing**: Test models systematically across configurations
2. **State Coverage**: Test major cannabis states (CA, CO, NY, etc.)
3. **Configuration Matrix**: Test RAG, tools, KB combinations
4. **Regular Scheduling**: Run tests on code changes and daily
5. **Result Analysis**: Compare trends over time
6. **Documentation**: Keep test configurations documented

## Contributing

1. Add new baseline questions to `agents/{agent}/baseline.json`
2. Follow existing JSON structure
3. Use `{{state}}` for location-specific content
4. Test with multiple configurations
5. Update documentation as needed

---

For questions or issues, refer to the main Formul8 platform documentation or create an issue in the repository.