
#!/usr/bin/env python3
"""
Baseline Testing Script for Compliance Agent
Runs questions from baseline.json against the agent and saves results
"""

import json
import asyncio
import time
from datetime import datetime
from agent import create_compliance_agent

async def run_baseline_tests():
    """Run baseline tests and save results"""
    print("🧪 Starting baseline tests for compliance agent...")
    
    # Load baseline questions
    try:
        with open('baseline.json', 'r') as f:
            baseline = json.load(f)
    except FileNotFoundError:
        print("❌ baseline.json not found")
        return
    
    # Create agent
    agent = create_compliance_agent()
    
    results = {
        "agent": baseline["agent"],
        "description": baseline["description"],
        "timestamp": datetime.now().isoformat(),
        "results": []
    }
    
    total_questions = len(baseline["questions"])
    print(f"📝 Running {total_questions} baseline tests...")
    
    # Display question organization
    if "question_summary" in baseline:
        summary = baseline["question_summary"]
        print(f"\n📊 Question Organization:")
        print(f"   By Category: {summary.get('by_category', {})}")
        print(f"   By Difficulty: {summary.get('by_difficulty', {})}")
    
    for i, question_data in enumerate(baseline["questions"], 1):
        category = question_data.get('category', 'general')
        difficulty = question_data.get('difficulty', 'unknown')
        print(f"\n[{i}/{total_questions}] Testing question {question_data['id']} ({category.title()} - {difficulty.title()})...")
        
        start_time = time.time()
        
        try:
            # Process the question
            result = await agent.process_query(
                user_id="baseline_test",
                query=question_data["question"]
            )
            
            response_time = time.time() - start_time
            
            # Simple scoring logic (can be enhanced)
            response_text = result.get('response', '')
            confidence = result.get('confidence', 0)
            
            # Basic evaluation (replace with more sophisticated scoring)
            score = 0
            max_score = question_data.get("max_score", 10)
            passed = False
            
            if response_text and len(response_text) > 50:
                score = min(max_score, int(confidence * max_score))
                passed = score >= (max_score * 0.6)  # 60% threshold
            
            test_result = {
                "id": question_data["id"],
                "question": question_data["question"],
                "response": response_text,
                "score": score,
                "max_score": max_score,
                "confidence": confidence,
                "response_time": round(response_time, 2),
                "passed": passed,
                "timestamp": datetime.now().isoformat()
            }
            
            results["results"].append(test_result)
            
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"   {status} - Score: {score}/{max_score} - Time: {response_time:.2f}s")
            
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            test_result = {
                "id": question_data["id"],
                "question": question_data["question"],
                "response": f"Error: {str(e)}",
                "score": 0,
                "max_score": question_data.get("max_score", 10),
                "confidence": 0,
                "response_time": 0,
                "passed": False,
                "timestamp": datetime.now().isoformat()
            }
            results["results"].append(test_result)
    
    # Calculate summary statistics
    total_tests = len(results["results"])
    passed_tests = sum(1 for r in results["results"] if r["passed"])
    avg_score = sum(r["score"] for r in results["results"]) / total_tests if total_tests > 0 else 0
    avg_response_time = sum(r["response_time"] for r in results["results"]) / total_tests if total_tests > 0 else 0
    
    results["summary"] = {
        "total_tests": total_tests,
        "passed_tests": passed_tests,
        "failed_tests": total_tests - passed_tests,
        "pass_rate": round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0,
        "average_score": round(avg_score, 1),
        "average_response_time": round(avg_response_time, 2)
    }
    
    # Save results
    with open('baseline_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"\n📊 Baseline Testing Complete!")
    print(f"   Total Tests: {total_tests}")
    print(f"   Passed: {passed_tests}")
    print(f"   Failed: {total_tests - passed_tests}")
    print(f"   Pass Rate: {results['summary']['pass_rate']}%")
    print(f"   Average Score: {results['summary']['average_score']}")
    print(f"   Average Response Time: {results['summary']['average_response_time']}s")
    print(f"\n💾 Results saved to baseline_results.json")

if __name__ == "__main__":
    asyncio.run(run_baseline_tests())
