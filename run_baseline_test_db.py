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

def run_single_question(client, question, model, custom_prompt=None, state=None):
    """Run a single baseline question and return the result."""
    start_time = time.time()
    
    # Substitute state placeholders
    question_text = substitute_state_placeholders(question.get('question', ''), state)
    
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
        
        messages.append({"role": "user", "content": question_text})
        
        # Make API call
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.1,
            max_tokens=1000
        )
        
        response_time = time.time() - start_time
        agent_response = response.choices[0].message.content.strip()
        
        # Simple accuracy calculation (this could be enhanced with AI evaluation)
        expected_answer = question.get('expectedAnswer', '')
        accuracy = calculate_simple_accuracy(agent_response, expected_answer)
        
        return {
            'success': True,
            'agent_response': agent_response,
            'response_time': response_time,
            'accuracy': accuracy,
            'confidence': 75.0,  # Default confidence - could be enhanced
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

def save_test_result(conn, run_id, question, result):
    """Save individual test result to database."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO baseline_test_results 
            (run_id, question_id, question, expected_answer, agent_response, accuracy, 
             confidence, response_time, category, difficulty)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            question.get('difficulty', 'intermediate')
        ))
        conn.commit()

def run_baseline_test(agent_type, model='gpt-4o', state=None, rag_enabled=False, 
                     tools_enabled=False, kb_enabled=False, custom_prompt=None,
                     user_id=None, run_id=None):
    """Main function to run baseline test and store results in database."""
    
    # Load questions
    questions = load_baseline_questions(agent_type)
    if not questions:
        print(f"No questions found for agent: {agent_type}")
        return False
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    if not client.api_key:
        print("OPENAI_API_KEY not found in environment variables")
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
            
            result = run_single_question(client, question, model, custom_prompt, state)
            results.append(result)
            
            if result['success']:
                successful_tests += 1
            else:
                failed_tests += 1
                print(f"Question failed: {result.get('error', 'Unknown error')}")
            
            # Save individual result
            save_test_result(conn, run_id, question, result)
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
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
    parser = argparse.ArgumentParser(description='Run baseline tests with database integration')
    parser.add_argument('--agent', required=True, help='Agent type to test')
    parser.add_argument('--model', default='gpt-4o', help='Model to use')
    parser.add_argument('--state', help='State for {{state}} substitution')
    parser.add_argument('--rag', action='store_true', help='Enable RAG')
    parser.add_argument('--tools', action='store_true', help='Enable tools')
    parser.add_argument('--kb', action='store_true', help='Enable knowledge base')
    parser.add_argument('--custom-prompt', help='Custom system prompt')
    parser.add_argument('--user-id', help='User ID for the test run')
    parser.add_argument('--run-id', type=int, help='Existing run ID to update')
    
    args = parser.parse_args()
    
    success = run_baseline_test(
        agent_type=args.agent,
        model=args.model,
        state=args.state,
        rag_enabled=args.rag,
        tools_enabled=args.tools,
        kb_enabled=args.kb,
        custom_prompt=args.custom_prompt,
        user_id=args.user_id,
        run_id=args.run_id
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()