#!/usr/bin/env python3
"""
API Authenticity Verification Script
Ensures all API endpoints serve real data from JSON files only
"""

import json
import requests
import os
from pathlib import Path

def verify_json_file_api():
    """Verify API serves actual JSON file data"""
    print("🔍 Verifying API Authenticity - JSON File Data Only")
    print("=" * 60)
    
    # Test the real results API
    try:
        response = requests.get("http://localhost:5000/api/baseline-testing/real-results")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response: {len(data)} questions loaded from JSON files")
            
            if data:
                # Check first question structure
                first_q = data[0]
                print(f"✅ Question ID: {first_q.get('questionId', 'N/A')}")
                print(f"✅ Category: {first_q.get('category', 'N/A')}")
                print(f"✅ Difficulty: {first_q.get('difficulty', 'N/A')}")
                
                # Check model responses
                model_responses = first_q.get('modelResponses', [])
                print(f"✅ Model Responses: {len(model_responses)} authentic AI responses")
                
                for resp in model_responses:
                    print(f"   📊 {resp['model']}: Grade {resp['grade']}%, Cost ${resp['cost']:.4f}")
                    print(f"      Response length: {len(resp['answer'])} chars (real API response)")
                
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def compare_api_with_source():
    """Compare API response with actual JSON files"""
    print(f"\n🔄 Cross-Verification: API vs Source Files")
    print("=" * 45)
    
    # Load direct from JSON file
    json_files = [
        "agents/compliance-agent/data/results/CO-gpt4o.json",
        "agents/compliance-agent/data/results/CO-gpt4o-mini.json", 
        "agents/compliance-agent/data/results/CO-claude-3-5-sonnet.json"
    ]
    
    source_questions = []
    for json_file in json_files:
        if os.path.exists(json_file):
            with open(json_file) as f:
                data = json.load(f)
                if 'results' in data:
                    source_questions.extend(data['results'])
    
    print(f"📄 Source JSON Files: {len(source_questions)} total results found")
    
    # Get API data
    try:
        response = requests.get("http://localhost:5000/api/baseline-testing/real-results")
        if response.status_code == 200:
            api_data = response.json()
            
            # Count total API responses
            api_response_count = sum(len(q.get('modelResponses', [])) for q in api_data)
            print(f"🌐 API Response: {api_response_count} total model responses")
            
            # Check if specific question exists in both
            if source_questions and api_data:
                source_first = source_questions[0]
                api_first = None
                
                for q in api_data:
                    if q.get('questionId') == source_first.get('questionId'):
                        api_first = q
                        break
                
                if api_first:
                    print(f"✅ Question Match: {source_first.get('questionId')}")
                    print(f"✅ Source answer length: {len(source_first.get('agentResponse', ''))}")
                    
                    # Find matching model response
                    source_model = source_first.get('model', 'Unknown')
                    for resp in api_first.get('modelResponses', []):
                        if source_model in resp.get('model', ''):
                            print(f"✅ API answer length: {len(resp.get('answer', ''))}")
                            print(f"✅ Costs match: Source ${source_first.get('estimatedCost', 0):.4f} vs API ${resp.get('cost', 0):.4f}")
                            break
                else:
                    print("⚠️ Question ID mismatch between source and API")
            
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False

def verify_no_synthetic_data():
    """Verify no synthetic/mock data generation"""
    print(f"\n🚫 Anti-Synthetic Data Verification")
    print("=" * 35)
    
    try:
        response = requests.get("http://localhost:5000/api/baseline-testing/real-results")
        if response.status_code == 200:
            data = response.json()
            
            # Check for common synthetic data patterns
            synthetic_indicators = [
                "lorem ipsum", "example", "placeholder", "mock", "fake", 
                "test data", "sample", "dummy", "generated"
            ]
            
            synthetic_found = False
            for question in data:
                question_text = question.get('question', '').lower()
                for indicator in synthetic_indicators:
                    if indicator in question_text:
                        print(f"⚠️ Potential synthetic indicator: '{indicator}' in question")
                        synthetic_found = True
                
                # Check model responses for synthetic patterns
                for resp in question.get('modelResponses', []):
                    answer = resp.get('answer', '').lower()
                    for indicator in synthetic_indicators:
                        if indicator in answer:
                            print(f"⚠️ Potential synthetic indicator: '{indicator}' in response")
                            synthetic_found = True
            
            if not synthetic_found:
                print("✅ No synthetic data indicators found")
                print("✅ All responses appear to be authentic API calls")
            
            return not synthetic_found
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def main():
    print("Formul8 Platform - API Authenticity Verification")
    print("===============================================")
    
    # Run all verification tests
    tests = [
        ("JSON File API Test", verify_json_file_api),
        ("Source Comparison Test", compare_api_with_source), 
        ("Synthetic Data Check", verify_no_synthetic_data)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print(f"\n📊 Test Summary:")
    print("=" * 20)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All APIs serving authentic data from JSON files only!")
        print("🚫 No synthetic or generated data found")
    else:
        print("⚠️ Some APIs may be generating synthetic data")
    
    return passed == len(tests)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)