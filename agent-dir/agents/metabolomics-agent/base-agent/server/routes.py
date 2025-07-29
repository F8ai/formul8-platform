"""
Base Agent API Routes
Standardized endpoints for all agents
"""

from flask import jsonify, request, render_template_string
from datetime import datetime
import asyncio
import os
from ..core.testing import BaselineTestRunner
from .app import DASHBOARD_TEMPLATE


def setup_routes(app, agent):
    """Setup Flask routes for agent"""
    
    @app.route('/')
    def dashboard():
        """Agent dashboard"""
        return render_template_string(DASHBOARD_TEMPLATE, agent=agent)
    
    @app.route('/api/status')
    def get_status():
        """Get agent status"""
        return jsonify({
            'agent': agent.agent_type,
            'domain': agent.domain,
            'status': 'operational' if agent.models else 'limited',
            'available_models': agent.get_available_models(),
            'baseline_questions': agent.get_baseline_question_count(),
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/api/metrics')
    def get_metrics():
        """Get agent performance metrics"""
        # Try to load recent test results for metrics
        test_runner = BaselineTestRunner(agent)
        available_results = test_runner.get_available_results()
        
        if available_results:
            # Load most recent result file
            latest_file = sorted(available_results)[-1]
            model = latest_file.replace('CO-', '').replace('.json', '')
            results = test_runner.load_results('CO', model)
            
            if results and 'testRun' in results:
                run_data = results['testRun']
                return jsonify({
                    'accuracy': f"{run_data.get('avg_accuracy', 0):.1f}%",
                    'confidence': f"{run_data.get('avg_confidence', 0):.1f}%",
                    'response_time': f"{run_data.get('avg_response_time', 0):.1f}s",
                    'tests_passed': f"{run_data.get('successful_tests', 0)}/{run_data.get('total_questions', 0)}",
                    'total_cost': f"${run_data.get('total_cost', 0):.4f}",
                    'last_test': run_data.get('created_at', 'Never'),
                    'model': run_data.get('model', 'Unknown')
                })
        
        # Default metrics when no results available
        return jsonify({
            'accuracy': '0%',
            'confidence': '0%', 
            'response_time': '0s',
            'tests_passed': '0/0',
            'total_cost': '$0.00',
            'last_test': 'Never',
            'model': 'None'
        })
    
    @app.route('/api/baseline-questions')
    def get_baseline_questions():
        """Get baseline questions"""
        return jsonify({
            'agent': agent.agent_type,
            'total_questions': len(agent.baseline_questions),
            'questions': agent.baseline_questions
        })
    
    @app.route('/api/baseline-results')
    def get_baseline_results():
        """Get all baseline test results"""
        test_runner = BaselineTestRunner(agent)
        available_results = test_runner.get_available_results()
        
        all_results = []
        for filename in available_results:
            # Extract state and model from filename
            parts = filename.replace('.json', '').split('-')
            if len(parts) >= 2:
                state = parts[0]
                model = '-'.join(parts[1:])
                
                results = test_runner.load_results(state, model)
                if results:
                    all_results.append({
                        'filename': filename,
                        'state': state,
                        'model': model,
                        'data': results
                    })
        
        return jsonify({
            'agent': agent.agent_type,
            'available_results': len(all_results),
            'results': all_results
        })
    
    @app.route('/api/query', methods=['POST'])
    def process_query():
        """Process a user query"""
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        query = data['query']
        model = data.get('model', agent.default_model)
        context = data.get('context')
        
        # Run async query processing
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(
                agent.process_query(query, model=model, context=context)
            )
            return jsonify(response.to_dict())
        finally:
            loop.close()
    
    @app.route('/api/test/<model>', methods=['POST'])
    def run_baseline_test(model):
        """Run baseline test with specified model"""
        state = request.args.get('state', 'CO')
        
        if model not in agent.get_available_models():
            return jsonify({
                'error': f'Model {model} not available',
                'available_models': agent.get_available_models()
            }), 400
        
        # Run async baseline test
        test_runner = BaselineTestRunner(agent)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(
                test_runner.run_test_suite(state=state, model=model)
            )
            return jsonify(results)
        except Exception as e:
            return jsonify({'error': f'Test failed: {str(e)}'}), 500
        finally:
            loop.close()
    
    @app.route('/api/test-results/<state>/<model>')
    def get_test_results(state, model):
        """Get specific test results"""
        test_runner = BaselineTestRunner(agent)
        results = test_runner.load_results(state, model)
        
        if not results:
            return jsonify({'error': 'Results not found'}), 404
        
        return jsonify(results)