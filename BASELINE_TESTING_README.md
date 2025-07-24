# Baseline Testing System with AI Grading

A comprehensive baseline testing framework for AI agents with database-backed result tracking, manual grading, and AI-powered automated grading.

## Features

### Core Testing Capabilities
- **Multi-Agent Support**: Test all 9 specialized agents (compliance, formulation, marketing, operations, sourcing, patent, science, spectra, customer-success)
- **Multi-Model Support**: OpenAI (GPT-4o, o3), Claude, Gemini models with automatic fallback
- **State Substitution**: Dynamic `{{state}}` placeholder replacement for location-specific questions
- **Configurable Testing Matrix**: Enable/disable RAG retrieval, agent tools, and knowledge base access
- **Custom Prompt Support**: Override default system prompts with custom prompts

### Database Integration
- **PostgreSQL Backend**: All test runs and results stored in database for persistence and analysis
- **Comprehensive Tracking**: Test configurations, execution metadata, and detailed results
- **Performance Metrics**: Accuracy scoring, confidence tracking, response time measurement
- **Category-Based Analysis**: Performance breakdowns by question category and difficulty

### AI-Powered Grading
- **Automated AI Grading**: Uses GPT-4o to grade agent responses against expected answers
- **Expert Evaluation Criteria**: 
  - Factual accuracy (40%)
  - Completeness of answer (30%)
  - Relevance to question (20%)
  - Clarity and professionalism (10%)
- **Confidence Scoring**: AI provides confidence levels for its grading decisions
- **Detailed Feedback**: Comprehensive explanations for grades assigned
- **Model Selection**: Choose different models for grading (default: GPT-4o)

### Manual Grading Interface
- **Human Review**: Manual grading capabilities with detailed feedback
- **Grade Comparison**: Side-by-side view of AI and manual grades
- **Quality Assurance**: Track grading consistency and identify discrepancies
- **User Attribution**: Track who performed manual grading with timestamps

## Usage

### Command Line Interface

#### Basic Test Execution
```bash
# Run basic baseline test for compliance agent
python3 run_baseline_test_db.py --agent compliance-agent

# Test with specific model and state
python3 run_baseline_test_db.py --agent compliance-agent --model gpt-4o --state CA

# Enable various configuration options
python3 run_baseline_test_db.py --agent compliance-agent --rag --tools --kb

# Use custom system prompt
python3 run_baseline_test_db.py --agent compliance-agent --custom-prompt "You are a cannabis compliance expert..."
```

#### AI Grading Options
```bash
# Enable AI grading (default)
python3 run_baseline_test_db.py --agent compliance-agent --enable-ai-grading

# Disable AI grading
python3 run_baseline_test_db.py --agent compliance-agent --disable-ai-grading

# Use specific model for grading
python3 run_baseline_test_db.py --agent compliance-agent --grading-model gpt-4o-mini

# Continue an existing test run
python3 run_baseline_test_db.py --agent compliance-agent --run-id 123
```

### Web Dashboard

Access the baseline testing dashboard at `/baseline-testing` in the web interface.

#### Dashboard Features
- **Test Creation**: Configure and create new baseline test runs
- **Results Monitoring**: View test execution progress and results
- **Manual Grading**: Review and grade individual test responses
- **AI Grading Controls**: Trigger AI grading for specific runs or all results
- **Filtering & Analysis**: Filter results by agent, model, status, etc.

#### Creating a Test Run
1. Navigate to "New Test" tab
2. Select agent, model, and optional state
3. Configure RAG, tools, and knowledge base settings
4. Add custom prompt if needed
5. Click "Create Test Run"

#### AI Grading
- **Automatic**: AI grading runs automatically during test execution (when enabled)
- **Manual Trigger**: Use "AI Grade All" button to grade existing results
- **Individual Grading**: Grade specific results through the results interface

## Database Schema

### Test Runs Table (`baseline_test_runs`)
- Configuration settings (agent, model, state, features enabled)
- Execution metadata (status, timing, statistics)
- Aggregate performance metrics

### Test Results Table (`baseline_test_results`)
- Individual question/answer pairs
- Agent responses and performance metrics
- Manual grading fields (grade, feedback, grader, timestamp)
- AI grading fields (grade, feedback, model, timestamp)

## AI Grading Process

1. **Question Analysis**: AI evaluates the original question and expected answer
2. **Response Assessment**: Compares agent response against expected answer
3. **Multi-Criteria Scoring**: Grades based on accuracy, completeness, relevance, clarity
4. **Confidence Estimation**: AI provides confidence level in its grading decision
5. **Detailed Feedback**: Explains reasoning behind the assigned grade
6. **Database Storage**: Results stored with model attribution and timestamps

## Performance Metrics

### Accuracy Metrics
- **Simple Accuracy**: Keyword-based matching between expected and actual answers
- **AI-Graded Accuracy**: Model-based evaluation of response quality
- **Category Performance**: Breakdown by question category and difficulty
- **Comparative Analysis**: AI vs manual grading correlation

### Execution Metrics
- **Response Time**: Time taken to generate each response
- **Success Rate**: Percentage of successfully completed questions
- **Model Performance**: Comparison across different models
- **Configuration Impact**: Performance variations with different settings

## Requirements

Install required Python dependencies:

```bash
pip install -r baseline_requirements.txt
```

### Core Dependencies
- `openai>=1.0.0` - OpenAI API integration
- `psycopg2-binary>=2.9.0` - PostgreSQL database connectivity
- `langchain>=0.1.0` - LangChain framework (optional)
- `python-dotenv>=1.0.0` - Environment variable management

### Environment Variables
- `OPENAI_API_KEY` - Required for AI grading functionality
- `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT` - Database connection

## Best Practices

### Test Configuration
- **Start Simple**: Begin with basic configuration, then add complexity
- **State Testing**: Use state substitution for compliance-related questions
- **Model Comparison**: Test same configuration across multiple models
- **Baseline Consistency**: Use consistent prompts for comparable results

### AI Grading
- **Model Selection**: Use appropriate grading model for question complexity
- **Human Validation**: Periodically validate AI grades with manual review
- **Confidence Thresholds**: Pay attention to low-confidence AI grades
- **Feedback Analysis**: Review AI feedback to identify common issues

### Quality Assurance
- **Regular Review**: Manually review random samples of AI-graded results
- **Grade Calibration**: Ensure AI and manual grades are reasonably aligned
- **Performance Tracking**: Monitor grading consistency over time
- **Continuous Improvement**: Update grading criteria based on insights

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify PostgreSQL credentials and connectivity
2. **API Rate Limits**: Implement appropriate delays between requests
3. **Missing Questions**: Ensure baseline.json files exist for all agents
4. **Grading Failures**: Check OpenAI API key and quota limits

### Error Handling
- All errors are logged with detailed context
- Failed tests are marked as such in the database
- Partial test runs can be resumed with `--run-id` parameter
- AI grading failures fall back to simple accuracy calculation

## Integration

The baseline testing system integrates with:
- **Main Platform**: Web dashboard accessible through navigation
- **Agent Repositories**: Reads baseline.json files from agent directories
- **Database**: PostgreSQL for persistent storage and analysis
- **OpenAI API**: For both agent responses and AI grading
- **Monitoring**: Real-time status updates and progress tracking

## Future Enhancements

Planned improvements include:
- **Advanced Analytics**: More sophisticated performance analysis
- **Batch Processing**: Queue-based background job processing
- **Model Comparison**: Side-by-side model performance comparison
- **Export Capabilities**: CSV/Excel export for external analysis
- **Notification System**: Email/Slack notifications for test completion
- **A/B Testing**: Compare different prompt strategies