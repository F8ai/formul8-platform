"""
Compliance Agent API Endpoints for Regulatory Data Access
"""

from flask import Flask, request, jsonify
from datetime import datetime
import asyncio
import json
from services.regulatory_data_service import regulatory_service, StateRegulation
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/regulatory/initialize', methods=['POST'])
def initialize_regulatory_data():
    """Initialize compliance agent with regulatory data download"""
    try:
        # Start the initial download in background
        asyncio.create_task(regulatory_service.download_all_state_regulations())
        
        return jsonify({
            'message': 'Compliance agent initialization started',
            'status': 'downloading',
            'estimated_time': '30-45 minutes for full download'
        })
    except Exception as e:
        logger.error(f"Error initializing compliance agent: {e}")
        return jsonify({'error': 'Failed to initialize compliance agent'}), 500

@app.route('/regulatory/statistics', methods=['GET'])
def get_regulatory_statistics():
    """Get regulatory data statistics"""
    try:
        stats = regulatory_service.get_statistics()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching compliance statistics: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@app.route('/regulatory/state/<state_code>', methods=['GET'])
def get_state_regulations(state_code):
    """Get regulations for a specific state"""
    try:
        regulations = regulatory_service.get_state_regulations(state_code.upper())
        
        if not regulations:
            return jsonify({
                'error': 'No regulations found for this state',
                'suggestion': 'Try initializing the compliance agent first'
            }), 404
        
        return jsonify({
            'state': state_code.upper(),
            'regulation_count': len(regulations),
            'regulations': [
                {
                    'title': reg.title,
                    'category': reg.category,
                    'last_updated': reg.last_updated,
                    'url': reg.url,
                    'status': reg.status,
                    'content_preview': reg.content[:500] + '...' if len(reg.content) > 500 else reg.content
                }
                for reg in regulations
            ]
        })
    except Exception as e:
        logger.error(f"Error fetching state regulations: {e}")
        return jsonify({'error': 'Failed to fetch state regulations'}), 500

@app.route('/regulatory/search', methods=['GET'])
def search_regulations():
    """Search regulations across all states"""
    try:
        query = request.args.get('q')
        state = request.args.get('state')
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        results = regulatory_service.search_regulations(
            query, 
            state.upper() if state else None
        )
        
        return jsonify({
            'query': query,
            'state': state or 'all',
            'result_count': len(results),
            'results': [
                {
                    'state': reg.state_code,
                    'title': reg.title,
                    'category': reg.category,
                    'last_updated': reg.last_updated,
                    'url': reg.url,
                    'relevant_excerpt': _extract_relevant_excerpt(reg.content, query)
                }
                for reg in results
            ]
        })
    except Exception as e:
        logger.error(f"Error searching regulations: {e}")
        return jsonify({'error': 'Failed to search regulations'}), 500

@app.route('/regulatory/regulation/<state_code>/<category>', methods=['GET'])
def get_full_regulation(state_code, category):
    """Get full regulation content"""
    try:
        state_regulations = regulatory_service.get_state_regulations(state_code.upper())
        regulation = next((reg for reg in state_regulations if reg.category == category), None)
        
        if not regulation:
            return jsonify({'error': 'Regulation not found'}), 404
        
        return jsonify({
            'regulation': {
                'state': regulation.state,
                'state_code': regulation.state_code,
                'title': regulation.title,
                'category': regulation.category,
                'url': regulation.url,
                'last_updated': regulation.last_updated,
                'content': regulation.content,
                'content_length': len(regulation.content),
                'word_count': len(regulation.content.split()),
                'status': regulation.status,
                'version': regulation.version
            }
        })
    except Exception as e:
        logger.error(f"Error fetching full regulation: {e}")
        return jsonify({'error': 'Failed to fetch regulation'}), 500

@app.route('/regulatory/update/<state_code>', methods=['POST'])
def force_update_state(state_code):
    """Force update regulations for a specific state"""
    try:
        async def update_state():
            return await regulatory_service.download_state_regulations(state_code.upper())
        
        regulations = asyncio.run(update_state())
        
        return jsonify({
            'message': f'Successfully updated regulations for {state_code.upper()}',
            'regulation_count': len(regulations),
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error updating state regulations: {e}")
        return jsonify({'error': 'Failed to update state regulations'}), 500

@app.route('/regulatory/advice', methods=['POST'])
def get_compliance_advice():
    """Get compliance advice based on regulations"""
    try:
        data = request.get_json()
        question = data.get('question')
        state_code = data.get('state_code')
        business_type = data.get('business_type')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Search for relevant regulations
        relevant_regulations = regulatory_service.search_regulations(question, state_code)
        
        if not relevant_regulations:
            return jsonify({
                'advice': 'No specific regulations found for your question. Please consult with a cannabis attorney for personalized legal advice.',
                'disclaimer': 'This is not legal advice. Consult with qualified legal counsel.',
                'relevant_regulations': []
            })
        
        # Generate compliance advice
        advice = _generate_compliance_advice(question, relevant_regulations, business_type)
        
        return jsonify({
            'question': question,
            'state_code': state_code or 'multi-state',
            'business_type': business_type,
            'advice': advice,
            'relevant_regulations': [
                {
                    'state': reg.state_code,
                    'title': reg.title,
                    'category': reg.category,
                    'excerpt': _extract_relevant_excerpt(reg.content, question)
                }
                for reg in relevant_regulations[:5]
            ],
            'disclaimer': 'This information is based on publicly available regulations and is not legal advice. Always consult with qualified legal counsel for compliance matters.',
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error generating compliance advice: {e}")
        return jsonify({'error': 'Failed to generate compliance advice'}), 500

def _extract_relevant_excerpt(content: str, query: str) -> str:
    """Extract relevant excerpts from regulation content"""
    query_terms = query.lower().split()
    query_terms = [term for term in query_terms if len(term) > 2]
    
    sentences = content.split('.')
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(term in sentence_lower for term in query_terms):
            return sentence.strip()[:300] + '...'
    
    return content[:300] + '...'

def _generate_compliance_advice(question: str, regulations: list, business_type: str = None) -> str:
    """Generate compliance advice based on regulations"""
    state_count = len(set(reg.state_code for reg in regulations))
    categories = set(reg.category for reg in regulations)
    
    advice = f"Based on analysis of {len(regulations)} relevant regulations across {state_count} state(s), "
    
    if business_type:
        advice += f"for {business_type} operations, "
    
    advice += "here are the key compliance considerations:\n\n"
    
    # Group regulations by category
    regulations_by_category = {}
    for reg in regulations:
        if reg.category not in regulations_by_category:
            regulations_by_category[reg.category] = []
        regulations_by_category[reg.category].append(reg)
    
    for category, regs in regulations_by_category.items():
        advice += f"**{category.capitalize()} Requirements:**\n"
        states = ', '.join(set(reg.state_code for reg in regs))
        advice += f"- Applicable in: {states}\n"
        advice += f"- Key considerations: Review licensing requirements, operational standards, and reporting obligations\n"
        advice += f"- Recent updates: {len(regs)} regulation(s) found\n\n"
    
    advice += "**Important Notes:**\n"
    advice += "- Regulations change frequently - verify current requirements\n"
    advice += "- State-specific variations exist - review each jurisdiction\n"
    advice += "- Consider local municipal requirements in addition to state laws\n"
    advice += "- Consult with cannabis compliance attorney for implementation guidance\n"
    
    return advice

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)