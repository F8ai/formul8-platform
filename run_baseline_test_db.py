#!/usr/bin/env python3
"""
Database-integrated baseline testing script.
Runs baseline tests and stores results directly in the PostgreSQL database.
"""

import os
import sys
import json
import time
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor
import openai
from openai import OpenAI

def get_db_connection():
    """Get database connection using environment variables."""
    try:
        return psycopg2.connect(
            host=os.getenv('PGHOST'),
            database=os.getenv('PGDATABASE'),
            user=os.getenv('PGUSER'),
            password=os.getenv('PGPASSWORD'),
            port=os.getenv('PGPORT', 5432)
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        sys.exit(1)

def load_models_config():
    """Load models configuration from agents/base-agent/models.json."""
    config_file = Path("agents/base-agent/models.json")
    if not config_file.exists():
        print("Models config file not found, using default models")
        return {
            "models": {
                "openai": {
                    "gpt-4o": {"name": "GPT-4o", "provider": "openai", "model_id": "gpt-4o"}
                }
            },
            "default_model": "gpt-4o"
        }
    
    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading models config: {e}")
        return {"models": {}, "default_model": "gpt-4o"}

def load_agent_prompts(agent_type):
    """Load prompts configuration for the specified agent."""
    prompts_file = Path(f"agents/{agent_type}/prompts.json")
    if not prompts_file.exists():
        return {"prompts": {"default": {"system_prompt": "You are a helpful AI assistant."}}}
    
    try:
        with open(prompts_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading prompts for {agent_type}: {e}")
        return {"prompts": {"default": {"system_prompt": "You are a helpful AI assistant."}}}

def save_agent_prompts(agent_type, prompts_data):
    """Save prompts configuration for the specified agent."""
    prompts_file = Path(f"agents/{agent_type}/prompts.json")
    prompts_file.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(prompts_file, 'w') as f:
            json.dump(prompts_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving prompts for {agent_type}: {e}")
        return False

def create_new_prompt(agent_type, prompt_name, prompt_text, description=""):
    """Create and save a new prompt for an agent."""
    prompts_data = load_agent_prompts(agent_type)
    
    new_prompt = {
        "name": prompt_name,
        "description": description,
        "system_prompt": prompt_text,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "created_by": "user"
    }
    
    prompts_data["prompts"][prompt_name.lower().replace(" ", "-")] = new_prompt
    
    if save_agent_prompts(agent_type, prompts_data):
        print(f"✓ Created new prompt '{prompt_name}' for {agent_type}")
        return True
    else:
        print(f"✗ Failed to save prompt '{prompt_name}' for {agent_type}")
        return False

def load_baseline_questions(agent_type):
    """Load baseline questions for the specified agent."""
    baseline_file = Path(f"agents/{agent_type}/baseline.json")
    if not baseline_file.exists():
        print(f"Baseline file not found: {baseline_file}")
        return None
    
    try:
        with open(baseline_file, 'r') as f:
            data = json.load(f)
        
        # Handle different baseline.json formats
        if isinstance(data, dict) and 'questions' in data:
            return data['questions']
        elif isinstance(data, list):
            return data
        else:
            print(f"Unexpected baseline.json format for {agent_type}")
            return None
    except Exception as e:
        print(f"Error loading baseline questions: {e}")
        return None

def substitute_state_placeholders(question_text, state):
    """Replace {{state}} placeholders with actual state abbreviation."""
    if state and "{{state}}" in question_text:
        return question_text.replace("{{state}}", state)
    return question_text

def get_model_client(model_config):
    """Get the appropriate client for the model provider."""
    provider = model_config.get("provider", "openai")
    
    if provider == "openai":
        return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    elif provider == "anthropic":
        try:
            import anthropic
            return anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        except ImportError:
            print("Anthropic package not installed, falling back to OpenAI")
            return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    elif provider == "xai":
        # xAI uses OpenAI-compatible API
        return OpenAI(
            api_key=os.getenv('XAI_API_KEY'),
            base_url="https://api.x.ai/v1"
        )
    elif provider == "google":
        print("Google models not yet implemented, falling back to OpenAI")
        return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    else:
        print(f"Unknown provider {provider}, falling back to OpenAI")
        return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def run_local_llm_question(question, model_config, custom_prompt=None, state=None):
    """Run a question using local LLM via Ollama"""
    import requests
    
    start_time = time.time()
    
    try:
        # Check if Ollama is running
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if not response.ok:
                raise Exception("Ollama is not running")
        except requests.exceptions.RequestException:
            raise Exception("Ollama is not running. Please start Ollama first.")
        
        # Substitute state placeholders
        question_text = substitute_state_placeholders(question.get('question', ''), state)
        
        # Convert model name to Ollama format
        model_name = model_config.get("name", "llama3.2-1b").lower()
        ollama_model = model_name.replace(" ", "").replace("llama3.2", "llama3.2").replace("phi-3", "phi3")
        
        # Prepare system prompt
        system_prompt = custom_prompt if custom_prompt else "You are a helpful AI assistant specializing in cannabis industry compliance and operations."
        
        # Enhanced prompt for confidence scoring
        enhanced_prompt = f"""{system_prompt}

Question: {question_text}

Please provide your answer followed by your confidence level (0-100%) in your response. Format your response as:

Answer: [your detailed answer]
Confidence: [percentage]%

Be specific about regulations, compliance requirements, and provide practical guidance for cannabis operators."""

        # Make request to Ollama
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": ollama_model,
                "prompt": enhanced_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 1000
                }
            },
            timeout=120  # Longer timeout for local models
        )
        
        if not response.ok:
            raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
        
        data = response.json()
        full_response = data.get("response", "")
        
        # Extract confidence using the same pattern as cloud models
        agent_response, response_confidence = extract_confidence_from_response(full_response)
        
        response_time = time.time() - start_time
        
        return {
            'response': agent_response,
            'confidence': response_confidence,
            'response_time': response_time,
            'error': None
        }
        
    except Exception as e:
        response_time = time.time() - start_time
        return {
            'response': f"Local LLM Error: {str(e)}",
            'confidence': 0,
            'response_time': response_time,
            'error': str(e)
        }

def run_single_question(client, question, model_config, custom_prompt=None, state=None):
    """Run a single baseline question and return the result."""
    
    # Check if this is a local model
    if model_config.get("provider") == "local":
        return run_local_llm_question(question, model_config, custom_prompt, state)
    
    start_time = time.time()
    
    # Substitute state placeholders
    question_text = substitute_state_placeholders(question.get('question', ''), state)
    # Get the correct model ID for API calls
    model_id = model_config.get("model_id", model_config.get("name", "gpt-4o"))
    # For OpenAI models, use the key as the model ID since that's the API identifier
    if model_config.get("provider") == "openai":
        model_id = model_id.lower()  # Ensure lowercase for API calls
    
    try:
        # Prepare the messages
        messages = []
        if custom_prompt:
            messages.append({"role": "system", "content": custom_prompt})
        else:
            messages.append({
                "role": "system", 
                "content": "You are a helpful AI assistant specializing in cannabis industry compliance and operations."
            })
        
        # Add confidence request to the question
        confidence_prompt = f"{question_text}\n\nPlease provide your answer followed by your confidence level (0-100%) in your response. Format your response as:\n\nAnswer: [your answer]\nConfidence: [percentage]%"
        messages.append({"role": "user", "content": confidence_prompt})
        
        # Make API call based on provider
        provider = model_config.get("provider", "openai")
        
        if provider == "openai" or provider == "xai":
            response = client.chat.completions.create(
                model=model_id,
                messages=messages,
                temperature=0.1,
                max_tokens=1000
            )
            full_response = response.choices[0].message.content.strip()
            agent_response, response_confidence = extract_confidence_from_response(full_response)
        elif provider == "anthropic":
            # For Anthropic, system prompt is separate
            system_prompt = custom_prompt if custom_prompt else "You are a helpful AI assistant specializing in cannabis industry compliance and operations."
            confidence_prompt = f"{question_text}\n\nPlease provide your answer followed by your confidence level (0-100%) in your response. Format your response as:\n\nAnswer: [your answer]\nConfidence: [percentage]%"
            response = client.messages.create(
                model=model_id,
                max_tokens=1000,
                temperature=0.1,
                system=system_prompt,
                messages=[{"role": "user", "content": confidence_prompt}]
            )
            full_response = response.content[0].text.strip()
            agent_response, response_confidence = extract_confidence_from_response(full_response)
        else:
            # Fallback to OpenAI format
            response = client.chat.completions.create(
                model=model_id,
                messages=messages,
                temperature=0.1,
                max_tokens=1000
            )
            full_response = response.choices[0].message.content.strip()
            agent_response, response_confidence = extract_confidence_from_response(full_response)
        
        response_time = time.time() - start_time
        
        # Simple accuracy calculation (this could be enhanced with AI evaluation)
        expected_answer = question.get('expectedAnswer', '')
        accuracy = calculate_simple_accuracy(agent_response, expected_answer)
        
        return {
            'success': True,
            'agent_response': agent_response,
            'response_time': response_time,
            'accuracy': accuracy,
            'confidence': response_confidence,
            'error': None
        }
        
    except Exception as e:
        response_time = time.time() - start_time
        return {
            'success': False,
            'agent_response': None,
            'response_time': response_time,
            'accuracy': 0.0,
            'confidence': 0.0,
            'error': str(e)
        }

def extract_confidence_from_response(full_response):
    """Extract confidence percentage from model response."""
    import re
    
    # Look for confidence pattern
    confidence_pattern = r'confidence:\s*(\d+(?:\.\d+)?)%?'
    confidence_match = re.search(confidence_pattern, full_response.lower())
    
    if confidence_match:
        confidence = float(confidence_match.group(1))
        # Remove confidence line from response
        response_lines = full_response.split('\n')
        clean_lines = []
        for line in response_lines:
            if not re.search(confidence_pattern, line.lower()):
                clean_lines.append(line)
        
        # Also remove "Answer:" prefix if present
        clean_response = '\n'.join(clean_lines)
        clean_response = re.sub(r'^answer:\s*', '', clean_response.strip(), flags=re.IGNORECASE)
        
        return clean_response.strip(), min(100.0, max(0.0, confidence))
    else:
        # No confidence found, return original response with default confidence
        return full_response, 75.0

def calculate_simple_accuracy(agent_response, expected_answer):
    """Simple accuracy calculation based on keyword matching."""
    if not expected_answer or not agent_response:
        return 0.0
    
    # Convert to lowercase for comparison
    agent_lower = agent_response.lower()
    expected_lower = expected_answer.lower()
    
    # Count matching words (simple approach)
    expected_words = set(expected_lower.split())
    agent_words = set(agent_lower.split())
    
    if not expected_words:
        return 0.0
    
    matching_words = expected_words.intersection(agent_words)
    accuracy = (len(matching_words) / len(expected_words)) * 100
    
    return min(accuracy, 100.0)

def ai_grade_response(client, question, expected_answer, agent_response, grading_model="gpt-4o"):
    """Use AI to grade the agent's response against expected answer."""
    if not agent_response or not expected_answer:
        return {"grade": 0, "feedback": "Missing response or expected answer", "confidence": 0.0}
    
    grading_prompt = f"""You are an expert evaluator for AI agents in the cannabis industry. Grade the agent's response on a scale of 0-10.

QUESTION: {question}

EXPECTED ANSWER: {expected_answer}

AGENT'S RESPONSE: {agent_response}

Evaluate based on:
1. Factual accuracy (40%)
2. Completeness of answer (30%) 
3. Relevance to question (20%)
4. Clarity and professionalism (10%)

Provide your response in this exact JSON format:
{{
    "grade": <integer from 0-10>,
    "feedback": "<detailed explanation of grade>",
    "confidence": <float from 0.0-1.0>
}}"""

    try:
        response = client.chat.completions.create(
            model=grading_model,
            messages=[
                {"role": "system", "content": "You are an expert AI evaluator. Always respond with valid JSON only."},
                {"role": "user", "content": grading_prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON response
        import json
        try:
            result = json.loads(result_text)
            return {
                "grade": max(0, min(10, int(result.get("grade", 0)))),
                "feedback": result.get("feedback", "No feedback provided"),
                "confidence": max(0.0, min(1.0, float(result.get("confidence", 0.5))))
            }
        except json.JSONDecodeError:
            # Fallback: extract grade from text
            import re
            grade_match = re.search(r'"grade":\s*(\d+)', result_text)
            grade = int(grade_match.group(1)) if grade_match else 5
            return {
                "grade": max(0, min(10, grade)),
                "feedback": result_text[:500],
                "confidence": 0.7
            }
            
    except Exception as e:
        print(f"AI grading failed: {e}")
        return {
            "grade": 5,
            "feedback": f"AI grading failed: {str(e)}",
            "confidence": 0.0
        }

def create_test_run(conn, agent_type, model, state, rag_enabled, tools_enabled, kb_enabled, custom_prompt, user_id=None):
    """Create a new test run record in the database."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO baseline_test_runs 
            (agent_type, model, state, rag_enabled, tools_enabled, kb_enabled, custom_prompt, user_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'running')
            RETURNING id
        """, (agent_type, model, state, rag_enabled, tools_enabled, kb_enabled, custom_prompt, user_id))
        
        run_id = cur.fetchone()[0]
        conn.commit()
        return run_id

def update_test_run(conn, run_id, status, stats=None):
    """Update test run with final statistics."""
    with conn.cursor() as cur:
        if stats:
            cur.execute("""
                UPDATE baseline_test_runs 
                SET status = %s, total_questions = %s, successful_tests = %s, failed_tests = %s,
                    avg_accuracy = %s, avg_confidence = %s, avg_response_time = %s, completed_at = NOW()
                WHERE id = %s
            """, (status, stats['total'], stats['successful'], stats['failed'],
                  stats['avg_accuracy'], stats['avg_confidence'], stats['avg_response_time'], run_id))
        else:
            cur.execute("""
                UPDATE baseline_test_runs 
                SET status = %s, completed_at = NOW()
                WHERE id = %s
            """, (status, run_id))
        conn.commit()

def save_test_result(conn, run_id, question, result, ai_grading=None):
    """Save individual test result to database."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO baseline_test_results 
            (run_id, question_id, question, expected_answer, agent_response, accuracy, 
             confidence, response_time, category, difficulty, ai_grade, ai_feedback, 
             ai_graded_at, ai_grading_model)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            run_id,
            question.get('id', f"q_{question.get('question', '')[:20]}"),
            question.get('question', ''),
            question.get('expectedAnswer', ''),
            result.get('agent_response', ''),
            result.get('accuracy', 0.0),
            result.get('confidence', 0.0),
            result.get('response_time', 0.0),
            question.get('category', 'general'),
            question.get('difficulty', 'intermediate'),
            ai_grading.get('grade') if ai_grading else None,
            ai_grading.get('feedback') if ai_grading else None,
            datetime.now() if ai_grading else None,
            ai_grading.get('model') if ai_grading else None
        ))
        conn.commit()

def run_baseline_test(agent_type, model='gpt-4o', state=None, rag_enabled=False, 
                     tools_enabled=False, kb_enabled=False, custom_prompt=None,
                     user_id=None, run_id=None, enable_ai_grading=True, grading_model="gpt-4o",
                     prompt_name=None, new_prompt=None, new_prompt_description=""):
    """Main function to run baseline test and store results in database."""
    
    # Load models and prompts configuration
    models_config = load_models_config()
    prompts_data = load_agent_prompts(agent_type)
    
    # Handle new prompt creation
    if new_prompt:
        if not prompt_name:
            prompt_name = f"custom-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        create_new_prompt(agent_type, prompt_name, new_prompt, new_prompt_description)
        custom_prompt = new_prompt
    elif prompt_name and prompt_name in prompts_data.get("prompts", {}):
        custom_prompt = prompts_data["prompts"][prompt_name]["system_prompt"]
        print(f"Using prompt: {prompts_data['prompts'][prompt_name].get('name', prompt_name)}")
    
    # Find model configuration
    model_config = None
    for provider_models in models_config.get("models", {}).values():
        if model in provider_models:
            model_config = provider_models[model]
            break
    
    if not model_config:
        print(f"Model {model} not found in configuration, using default")
        model_config = {"name": model, "provider": "openai", "model_id": model}
    
    print(f"Using model: {model_config.get('name', model)} ({model_config.get('provider', 'openai')})")
    
    # Load questions
    questions = load_baseline_questions(agent_type)
    if not questions:
        print(f"No questions found for agent: {agent_type}")
        return False
    
    # Initialize model client
    client = get_model_client(model_config)
    if not client:
        print("Failed to initialize model client")
        return False
    
    # Connect to database
    conn = get_db_connection()
    
    try:
        # Create test run if not provided
        if not run_id:
            run_id = create_test_run(conn, agent_type, model, state, rag_enabled, 
                                   tools_enabled, kb_enabled, custom_prompt, user_id)
        
        print(f"Starting baseline test for {agent_type} (Run ID: {run_id})")
        print(f"Model: {model}, Questions: {len(questions)}")
        
        results = []
        successful_tests = 0
        failed_tests = 0
        
        for i, question in enumerate(questions, 1):
            print(f"Processing question {i}/{len(questions)}: {question.get('id', 'unknown')}")
            
            result = run_single_question(client, question, model_config, custom_prompt, state)
            results.append(result)
            
            if result['success']:
                successful_tests += 1
            else:
                failed_tests += 1
                print(f"Question failed: {result.get('error', 'Unknown error')}")
            
            # AI grading if enabled and successful
            ai_grading = None
            if enable_ai_grading and result['success'] and result.get('agent_response'):
                print(f"  AI grading question {i}...")
                ai_grading = ai_grade_response(
                    client, 
                    question.get('question', ''), 
                    question.get('expectedAnswer', ''), 
                    result['agent_response'],
                    grading_model
                )
                ai_grading['model'] = grading_model
                print(f"  AI Grade: {ai_grading['grade']}/10 (confidence: {ai_grading['confidence']:.2f})")
            
            # Save individual result with AI grading
            save_test_result(conn, run_id, question, result, ai_grading)
            
            # Small delay to avoid rate limiting
            time.sleep(0.8 if enable_ai_grading else 0.5)
        
        # Calculate final statistics
        total_accuracy = sum(r['accuracy'] for r in results if r['success'])
        total_confidence = sum(r['confidence'] for r in results if r['success'])
        total_response_time = sum(r['response_time'] for r in results)
        
        stats = {
            'total': len(questions),
            'successful': successful_tests,
            'failed': failed_tests,
            'avg_accuracy': total_accuracy / max(successful_tests, 1),
            'avg_confidence': total_confidence / max(successful_tests, 1),
            'avg_response_time': total_response_time / len(questions)
        }
        
        # Update test run with final stats
        update_test_run(conn, run_id, 'completed', stats)
        
        print(f"\nBaseline test completed!")
        print(f"Successful: {successful_tests}/{len(questions)}")
        print(f"Average accuracy: {stats['avg_accuracy']:.1f}%")
        print(f"Average response time: {stats['avg_response_time']:.2f}s")
        
        return True
        
    except Exception as e:
        print(f"Test execution failed: {e}")
        if run_id:
            update_test_run(conn, run_id, 'failed')
        return False
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Run baseline tests with multi-model and prompt management support')
    parser.add_argument('--agent', required=True, help='Agent type to test')
    parser.add_argument('--model', default='gpt-4o', help='Model to use (see --list-models)')
    parser.add_argument('--state', help='State for {{state}} substitution')
    parser.add_argument('--rag', action='store_true', help='Enable RAG')
    parser.add_argument('--tools', action='store_true', help='Enable tools')
    parser.add_argument('--kb', action='store_true', help='Enable knowledge base')
    parser.add_argument('--custom-prompt', help='Custom system prompt')
    parser.add_argument('--prompt-name', help='Use named prompt from prompts.json')
    parser.add_argument('--new-prompt', help='Create new prompt with this text')
    parser.add_argument('--new-prompt-name', help='Name for the new prompt')
    parser.add_argument('--new-prompt-description', help='Description for the new prompt')
    parser.add_argument('--user-id', help='User ID for the test run')
    parser.add_argument('--run-id', type=int, help='Existing run ID to update')
    parser.add_argument('--enable-ai-grading', action='store_true', default=True, help='Enable AI grading of responses')
    parser.add_argument('--disable-ai-grading', action='store_true', help='Disable AI grading of responses')
    parser.add_argument('--grading-model', default='gpt-4o', help='Model to use for AI grading')
    parser.add_argument('--list-models', action='store_true', help='List available models and exit')
    parser.add_argument('--list-prompts', action='store_true', help='List available prompts for agent and exit')
    
    args = parser.parse_args()
    
    # Handle list commands
    if args.list_models:
        models_config = load_models_config()
        print("\nAvailable models:")
        for provider, models in models_config.get("models", {}).items():
            print(f"\n{provider.upper()}:")
            for model_id, config in models.items():
                print(f"  {model_id} - {config.get('name', model_id)}")
                print(f"    {config.get('description', 'No description')}")
                print(f"    Context: {config.get('context_window', 'Unknown')} tokens")
                print(f"    Cost: ${config.get('cost_per_1k_tokens', 0)}/1k tokens")
        return
    
    if args.list_prompts:
        prompts_data = load_agent_prompts(args.agent)
        print(f"\nAvailable prompts for {args.agent}:")
        for prompt_id, prompt_data in prompts_data.get("prompts", {}).items():
            print(f"  {prompt_id} - {prompt_data.get('name', prompt_id)}")
            print(f"    {prompt_data.get('description', 'No description')}")
            print(f"    Created: {prompt_data.get('created_at', 'Unknown')}")
        return
    
    # Determine AI grading setting
    enable_ai_grading = args.enable_ai_grading and not args.disable_ai_grading
    
    success = run_baseline_test(
        agent_type=args.agent,
        model=args.model,
        state=args.state,
        rag_enabled=args.rag,
        tools_enabled=args.tools,
        kb_enabled=args.kb,
        custom_prompt=args.custom_prompt,
        user_id=args.user_id,
        run_id=args.run_id,
        enable_ai_grading=enable_ai_grading,
        grading_model=args.grading_model,
        prompt_name=args.prompt_name,
        new_prompt=args.new_prompt,
        new_prompt_description=args.new_prompt_description or ""
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()