
"""
Base Agent Web Server
Provides dashboard and API endpoints for agent monitoring
"""

from flask import Flask, render_template, jsonify, request
import json
import os
from datetime import datetime
from typing import Dict, Any

class AgentServer:
    def __init__(self, agent_name: str = "base-agent", port: int = 5001):
        self.app = Flask(__name__, 
                        template_folder='templates',
                        static_folder='static')
        self.agent_name = agent_name
        self.port = port
        self.setup_routes()
    
    def setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/')
        def dashboard():
            """Main dashboard page"""
            return render_template('dashboard.html', agent_name=self.agent_name)
        
        @self.app.route('/api/metrics')
        def get_metrics():
            """Get agent performance metrics"""
            return jsonify(self.get_agent_metrics())
        
        @self.app.route('/api/baseline-results')
        def get_baseline_results():
            """Get baseline test results"""
            return jsonify(self.load_baseline_results())
        
        @self.app.route('/api/baseline-questions')
        def get_baseline_questions():
            """Get baseline questions from baseline.json"""
            return jsonify(self.load_baseline_questions())
        
        @self.app.route('/api/baseline-results-by-state')
        def get_baseline_results_by_state():
            """Get baseline results grouped by state with summary and details"""
            results = self.load_baseline_results().get('results', [])
            # Load expected answers from baseline.json
            try:
                with open('baseline.json', 'r') as f:
                    baseline_data = json.load(f)
            except Exception:
                baseline_data = {}
            expected_lookup = {q['id']: q for q in baseline_data.get('questions', [])}
            # Group by state
            state_results = {}
            for r in results:
                # Try to extract state code from id or from baseline.json
                qid = r['id']
                qinfo = expected_lookup.get(qid, {})
                # Prefer explicit state field, else parse from id
                state = None
                if 'state' in qinfo:
                    if isinstance(qinfo['state'], list):
                        # Multi-state: add to each
                        for st in qinfo['state']:
                            state_results.setdefault(st, []).append((r, qinfo))
                        continue
                    else:
                        state = qinfo['state']
                if not state:
                    # Try to parse from id (e.g., q001_ca)
                    parts = qid.split('_')
                    if len(parts) > 1 and len(parts[-1]) == 2:
                        state = parts[-1].upper()
                    else:
                        state = 'MULTI'
                state_results.setdefault(state, []).append((r, qinfo))
            # Build summary
            output = {}
            for state, qlist in state_results.items():
                total = len(qlist)
                correct = sum(1 for r, _ in qlist if r.get('passed'))
                avg_score = sum(r.get('score', 0) for r, _ in qlist) / total if total else 0
                details = []
                for r, q in qlist:
                    details.append({
                        'id': r['id'],
                        'question': r.get('question') or q.get('question'),
                        'expected': q.get('expected_answer', ''),
                        'actual': r.get('response', ''),
                        'score': r.get('score', 0),
                        'max_score': r.get('max_score', q.get('max_score', 10)),
                        'passed': r.get('passed', False)
                    })
                output[state] = {
                    'state': state,
                    'total': total,
                    'correct': correct,
                    'percent': (correct / total * 100) if total else 0,
                    'avg_score': avg_score,
                    'details': details
                }
            return jsonify(output)
        
        @self.app.route('/api/status')
        def get_status():
            """Get agent status"""
            return jsonify({
                'agent': self.agent_name,
                'status': 'running',
                'timestamp': datetime.now().isoformat()
            })
        
        @self.app.route('/chat')
        def chat():
            """Chat page for agent testing"""
            return render_template('chat.html', agent_name=self.agent_name)
        
        @self.app.route('/regulation_sizes.json')
        def get_regulation_sizes():
            """Serve regulation sizes data"""
            try:
                regulation_sizes_path = os.path.join('..', 'regulation_sizes.json')
                if os.path.exists(regulation_sizes_path):
                    with open(regulation_sizes_path, 'r') as f:
                        return jsonify(json.load(f))
                else:
                    return jsonify({"error": "Regulation sizes file not found"}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500
    
    def get_agent_metrics(self) -> Dict[str, Any]:
        """Load and return agent metrics"""
        try:
            # Try to load baseline results for metrics
            baseline_results = self.load_baseline_results()
            if baseline_results and 'results' in baseline_results:
                total_tests = len(baseline_results['results'])
                passed_tests = sum(1 for r in baseline_results['results'] if r.get('passed', False))
                avg_response_time = sum(r.get('response_time', 0) for r in baseline_results['results']) / total_tests if total_tests > 0 else 1.0
                accuracy = (passed_tests / total_tests * 100) if total_tests > 0 else 0
                
                return {
                    'accuracy': f"{accuracy:.0f}%",
                    'response_time': f"{avg_response_time:.1f}s",
                    'confidence': '62%',
                    'tests_passed': f"{passed_tests}/{total_tests}",
                    'status': 'running',
                    'last_updated': datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Error loading metrics: {e}")
        
        return {
            'accuracy': '0%',
            'response_time': '1.0s',
            'confidence': '62%',
            'tests_passed': '0/4',
            'status': 'needs setup',
            'last_updated': datetime.now().isoformat()
        }
    
    def load_baseline_results(self) -> Dict[str, Any]:
        """Load baseline test results"""
        # Try multiple paths for baseline results
        paths_to_try = [
            'baseline_results.json',
            os.path.join('..', 'baseline_results.json')
        ]
        
        for results_path in paths_to_try:
            if os.path.exists(results_path):
                try:
                    with open(results_path, 'r') as f:
                        return json.load(f)
                except Exception as e:
                    print(f"Error loading baseline results from {results_path}: {e}")
        return {}
    
    def load_baseline_questions(self) -> Dict[str, Any]:
        """Load baseline questions from baseline.json"""
        # Try multiple paths for baseline questions
        paths_to_try = [
            'baseline.json',
            os.path.join('..', 'baseline.json')
        ]
        
        for questions_path in paths_to_try:
            if os.path.exists(questions_path):
                try:
                    with open(questions_path, 'r') as f:
                        return json.load(f)
                except Exception as e:
                    print(f"Error loading baseline questions from {questions_path}: {e}")
        return {}
    
    def run(self, debug: bool = False):
        """Start the server"""
        print(f"Starting {self.agent_name} dashboard on http://0.0.0.0:{self.port}")
        self.app.run(host='0.0.0.0', port=self.port, debug=debug)

if __name__ == "__main__":
    server = AgentServer()
    server.run(debug=True)
