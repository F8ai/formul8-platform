#!/usr/bin/env python3
"""
Compliance Agent with Real Regulatory Data Service
Downloads and maintains up-to-date cannabis regulations from all states with daily updates.
"""

import asyncio
import logging
from flask import Flask, request, jsonify
from api.regulatory_endpoints import app as regulatory_app
from services.regulatory_data_service import regulatory_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create main Flask app
app = Flask(__name__)

# Register regulatory endpoints
app.register_blueprint(regulatory_app, url_prefix='/api')

@app.route('/')
def index():
    """Main compliance agent endpoint"""
    return jsonify({
        'name': 'Compliance Agent',
        'version': '1.0.0',
        'description': 'AI-powered cannabis compliance consultant with real regulatory data',
        'features': [
            'Real-time regulatory data from all cannabis states',
            'Daily automatic updates',
            'Multi-state compliance analysis',
            'Regulatory change tracking',
            'Compliance advice generation'
        ],
        'endpoints': {
            'initialize': '/api/regulatory/initialize',
            'statistics': '/api/regulatory/statistics',
            'state_regulations': '/api/regulatory/state/<state_code>',
            'search': '/api/regulatory/search?q=<query>&state=<state>',
            'full_regulation': '/api/regulatory/regulation/<state_code>/<category>',
            'force_update': '/api/regulatory/update/<state_code>',
            'compliance_advice': '/api/regulatory/advice'
        },
        'data_sources': {
            'states_covered': 24,
            'regulation_categories': [
                'licensing', 'cultivation', 'manufacturing', 
                'retail', 'testing', 'transportation', 'general'
            ],
            'update_frequency': 'daily at 2:00 AM',
            'last_update': regulatory_service.get_statistics().get('last_update', 'never')
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        stats = regulatory_service.get_statistics()
        return jsonify({
            'status': 'healthy',
            'service': 'compliance-agent',
            'regulatory_data': {
                'total_states': stats.get('total_states', 0),
                'total_regulations': stats.get('total_regulations', 0),
                'last_update': stats.get('last_update', 'never')
            },
            'timestamp': asyncio.get_event_loop().time()
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/compliance/query', methods=['POST'])
def compliance_query():
    """Main compliance query endpoint"""
    try:
        data = request.get_json()
        question = data.get('question', '')
        state = data.get('state', '')
        business_type = data.get('business_type', '')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Search for relevant regulations
        relevant_regs = regulatory_service.search_regulations(question, state if state else None)
        
        # Generate response based on regulations
        response = {
            'question': question,
            'state': state or 'multi-state',
            'business_type': business_type,
            'response': _generate_compliance_response(question, relevant_regs, business_type),
            'confidence': _calculate_confidence(relevant_regs),
            'relevant_regulations': len(relevant_regs),
            'sources': [
                {
                    'state': reg.state_code,
                    'title': reg.title,
                    'category': reg.category,
                    'url': reg.url
                }
                for reg in relevant_regs[:3]  # Top 3 most relevant
            ],
            'disclaimer': 'This information is based on publicly available regulations and is not legal advice. Always consult with qualified legal counsel for compliance matters.'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing compliance query: {e}")
        return jsonify({'error': 'Failed to process compliance query'}), 500

def _generate_compliance_response(question: str, regulations: list, business_type: str = None) -> str:
    """Generate a compliance response based on regulations"""
    if not regulations:
        return ("I don't have specific regulatory information for your question. "
                "Cannabis regulations vary significantly by state and are frequently updated. "
                "I recommend consulting with a qualified cannabis compliance attorney for "
                "accurate, current information specific to your situation.")
    
    states_mentioned = set(reg.state_code for reg in regulations)
    categories = set(reg.category for reg in regulations)
    
    response = f"Based on current regulations from {len(states_mentioned)} state(s), here's what I found:\n\n"
    
    if business_type:
        response += f"For {business_type} operations:\n"
    
    # Summarize key findings
    if 'licensing' in categories:
        response += "• **Licensing Requirements**: Most states require specific licenses for cannabis operations. Check your state's licensing authority for current applications and requirements.\n"
    
    if 'cultivation' in categories:
        response += "• **Cultivation Compliance**: Review plant tracking, security, and facility requirements specific to your state.\n"
    
    if 'manufacturing' in categories:
        response += "• **Manufacturing Standards**: Ensure compliance with product testing, labeling, and facility standards.\n"
    
    if 'retail' in categories:
        response += "• **Retail Operations**: Check age verification, inventory tracking, and sales limits in your jurisdiction.\n"
    
    response += f"\n**States with relevant regulations**: {', '.join(sorted(states_mentioned))}\n"
    response += f"**Regulation categories covered**: {', '.join(sorted(categories))}\n\n"
    response += "**Important**: Regulations change frequently. Always verify current requirements with your state's cannabis regulatory agency and consult with legal counsel for compliance guidance."
    
    return response

def _calculate_confidence(regulations: list) -> float:
    """Calculate confidence score based on number and quality of regulations found"""
    if not regulations:
        return 0.0
    
    # Base confidence on number of regulations and states
    reg_count = len(regulations)
    state_count = len(set(reg.state_code for reg in regulations))
    
    # Calculate confidence (0.0 to 1.0)
    confidence = min(0.95, (reg_count * 0.1) + (state_count * 0.1) + 0.5)
    return round(confidence, 2)

if __name__ == '__main__':
    logger.info("🏛️ Starting Compliance Agent with Regulatory Data Service")
    logger.info("📋 Initializing daily regulatory update scheduler...")
    
    # Start the regulatory data service
    regulatory_service.start_daily_updates()
    
    logger.info("🚀 Compliance Agent is ready!")
    logger.info("📊 Use /api/regulatory/initialize to start downloading all state regulations")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=False)