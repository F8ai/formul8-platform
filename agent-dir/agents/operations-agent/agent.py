"""
Operations Agent with LangChain, Business Analytics, and Memory Support
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool, BaseTool
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# RDF and SPARQL imports
import sys
sys.path.append('../shared')
from sparql_utils import SPARQLQueryGenerator, RDFKnowledgeBase

@dataclass
class OperationalMetrics:
    revenue: float
    profit_margin: float
    inventory_turnover: float
    customer_acquisition_cost: float
    employee_productivity: float
    compliance_score: float
    operational_efficiency: float

class OperationsAgent:
    """
    Cannabis Operations Agent with Business Analytics, Process Optimization, and Memory
    """
    
    def __init__(self, agent_path: str = "."):
        self.agent_path = agent_path
        self.memory_store = {}  # User-specific conversation memory
        
        # Initialize components
        self._initialize_llm()
        self._initialize_retriever()
        self._initialize_rdf_knowledge()
        self._initialize_tools()
        self._initialize_agent()
        
        # Load test questions
        self.baseline_questions = self._load_baseline_questions()
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def _initialize_llm(self):
        """Initialize language model"""
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.2,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
    
    def _initialize_retriever(self):
        """Initialize RAG retriever"""
        try:
            vectorstore_path = os.path.join(self.agent_path, "rag", "vectorstore")
            if os.path.exists(vectorstore_path):
                embeddings = OpenAIEmbeddings()
                self.vectorstore = FAISS.load_local(vectorstore_path, embeddings)
                self.retriever = self.vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 5}
                )
            else:
                self.retriever = None
                self.logger.warning("Vectorstore not found, RAG retrieval disabled")
        except Exception as e:
            self.logger.error(f"Failed to initialize retriever: {e}")
            self.retriever = None
    
    def _initialize_rdf_knowledge(self):
        """Initialize RDF knowledge base"""
        try:
            knowledge_base_path = os.path.join(self.agent_path, "rag", "knowledge_base.ttl")
            if os.path.exists(knowledge_base_path):
                self.rdf_kb = RDFKnowledgeBase(knowledge_base_path)
                self.sparql_generator = SPARQLQueryGenerator()
            else:
                self.rdf_kb = None
                self.sparql_generator = None
                self.logger.warning("RDF knowledge base not found")
        except Exception as e:
            self.logger.error(f"Failed to initialize RDF knowledge base: {e}")
            self.rdf_kb = None
            self.sparql_generator = None
    
    def _initialize_tools(self):
        """Initialize agent tools"""
        tools = []
        
        # Business performance analysis
        tools.append(Tool(
            name="business_performance_analysis",
            description="Analyze business KPIs and operational metrics",
            func=self._analyze_business_performance
        ))
        
        # Supply chain optimization
        tools.append(Tool(
            name="supply_chain_optimization",
            description="Optimize supply chain and inventory management",
            func=self._optimize_supply_chain
        ))
        
        # Financial modeling and forecasting
        tools.append(Tool(
            name="financial_modeling",
            description="Create financial models and forecasts",
            func=self._financial_modeling
        ))
        
        # Operational efficiency analysis
        tools.append(Tool(
            name="operational_efficiency_analysis",
            description="Analyze and improve operational efficiency",
            func=self._analyze_operational_efficiency
        ))
        
        # Staff management optimization
        tools.append(Tool(
            name="staff_management_optimization",
            description="Optimize staffing levels and productivity",
            func=self._optimize_staff_management
        ))
        
        # Compliance monitoring
        tools.append(Tool(
            name="compliance_monitoring",
            description="Monitor and ensure regulatory compliance",
            func=self._monitor_compliance
        ))
        
        # RAG search tool
        if self.retriever:
            tools.append(Tool(
                name="operations_knowledge_search",
                description="Search operations knowledge base for best practices",
                func=self._rag_search
            ))
        
        # RDF SPARQL query tool
        if self.rdf_kb and self.sparql_generator:
            tools.append(Tool(
                name="structured_operations_query",
                description="Query structured operations knowledge using natural language",
                func=self._sparql_query
            ))
        
        self.tools = tools
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert cannabis operations consultant with deep knowledge of:
            - Business operations and process optimization
            - Financial analysis and forecasting
            - Supply chain management
            - Inventory optimization
            - Staff management and productivity
            - Regulatory compliance
            - Cannabis industry best practices
            
            Use the available tools to provide comprehensive operational guidance.
            Focus on data-driven insights and practical recommendations.
            Consider regulatory requirements in all operational decisions.
            """),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            return_intermediate_steps=True,
            max_iterations=5
        )
    
    def _analyze_business_performance(self, metrics_data: str) -> str:
        """Analyze business KPIs and operational metrics"""
        try:
            # Simulated business performance analysis
            performance_analysis = {
                "current_metrics": {
                    "revenue": "$2.3M",
                    "profit_margin": "18.5%",
                    "inventory_turnover": "6.2x",
                    "customer_acquisition_cost": "$47",
                    "employee_productivity": "85%",
                    "compliance_score": "94%"
                },
                "benchmark_comparison": {
                    "revenue_growth": "+23% vs industry avg +15%",
                    "profit_margin": "Above industry avg (15-20%)",
                    "inventory_turnover": "Below industry avg (8-12x)",
                    "cac_efficiency": "Good (<$50 target)"
                },
                "key_insights": [
                    "Revenue growth exceeding industry average",
                    "Inventory turnover needs improvement",
                    "Profit margins healthy but room for optimization",
                    "Customer acquisition costs well controlled"
                ],
                "improvement_opportunities": [
                    {
                        "area": "Inventory Management",
                        "impact": "High",
                        "recommendation": "Implement just-in-time ordering",
                        "potential_savings": "$150K annually"
                    },
                    {
                        "area": "Operational Efficiency",
                        "impact": "Medium",
                        "recommendation": "Automate routine processes",
                        "potential_savings": "$75K annually"
                    }
                ],
                "action_priorities": [
                    "1. Optimize inventory turnover",
                    "2. Implement process automation",
                    "3. Enhance staff productivity tracking",
                    "4. Improve supplier relationships"
                ]
            }
            
            return json.dumps(performance_analysis, indent=2)
            
        except Exception as e:
            return f"Business performance analysis error: {str(e)}"
    
    def _optimize_supply_chain(self, supply_chain_data: str) -> str:
        """Optimize supply chain and inventory management"""
        try:
            supply_chain_optimization = {
                "current_state": {
                    "suppliers": 8,
                    "inventory_value": "$425K",
                    "stockout_rate": "3.2%",
                    "carrying_cost": "22%",
                    "lead_times": "7-14 days average"
                },
                "optimization_recommendations": [
                    {
                        "area": "Supplier Consolidation",
                        "action": "Reduce to 5 key suppliers",
                        "benefit": "Better pricing, improved relationships",
                        "cost_savings": "8-12%"
                    },
                    {
                        "area": "Inventory Optimization",
                        "action": "Implement ABC analysis",
                        "benefit": "Focus on high-value items",
                        "inventory_reduction": "15-20%"
                    },
                    {
                        "area": "Demand Forecasting",
                        "action": "Use predictive analytics",
                        "benefit": "Reduce stockouts and overstock",
                        "accuracy_improvement": "25%"
                    }
                ],
                "implementation_timeline": {
                    "Phase 1 (Month 1-2)": "Supplier evaluation and consolidation",
                    "Phase 2 (Month 2-3)": "Inventory classification and optimization",
                    "Phase 3 (Month 3-4)": "Forecasting system implementation",
                    "Phase 4 (Month 4-6)": "Process refinement and monitoring"
                },
                "expected_outcomes": {
                    "cost_reduction": "15-20%",
                    "inventory_turnover": "Increase to 8-10x",
                    "stockout_reduction": "Below 1%",
                    "cash_flow_improvement": "$85K"
                }
            }
            
            return json.dumps(supply_chain_optimization, indent=2)
            
        except Exception as e:
            return f"Supply chain optimization error: {str(e)}"
    
    def _financial_modeling(self, financial_data: str) -> str:
        """Create financial models and forecasts"""
        try:
            financial_model = {
                "revenue_forecast": {
                    "current_annual": "$2.3M",
                    "year_1_projection": "$2.9M (+26%)",
                    "year_2_projection": "$3.6M (+24%)",
                    "year_3_projection": "$4.3M (+19%)"
                },
                "cost_structure": {
                    "cogs": "45%",
                    "labor": "28%",
                    "rent_utilities": "12%",
                    "compliance_testing": "3%",
                    "marketing": "5%",
                    "other_expenses": "7%"
                },
                "profitability_analysis": {
                    "gross_margin": "55%",
                    "operating_margin": "18.5%",
                    "net_margin": "15.2%",
                    "break_even_point": "$1.8M annual revenue"
                },
                "cash_flow_projection": {
                    "operating_cash_flow": "+$348K annually",
                    "investment_requirements": "$150K equipment",
                    "working_capital_needs": "$75K"
                },
                "financial_ratios": {
                    "current_ratio": 2.1,
                    "quick_ratio": 1.6,
                    "debt_to_equity": 0.3,
                    "return_on_assets": "22%"
                },
                "sensitivity_analysis": {
                    "revenue_impact": {
                        "10% increase": "+$230K profit",
                        "10% decrease": "-$230K profit"
                    },
                    "cost_impact": {
                        "5% cost reduction": "+$115K profit",
                        "5% cost increase": "-$115K profit"
                    }
                }
            }
            
            return json.dumps(financial_model, indent=2)
            
        except Exception as e:
            return f"Financial modeling error: {str(e)}"
    
    def _analyze_operational_efficiency(self, efficiency_data: str) -> str:
        """Analyze and improve operational efficiency"""
        try:
            efficiency_analysis = {
                "current_efficiency_metrics": {
                    "overall_efficiency": "78%",
                    "processing_time": "24 hours average",
                    "waste_percentage": "4.2%",
                    "equipment_utilization": "82%",
                    "quality_control_pass_rate": "96.8%"
                },
                "bottleneck_analysis": [
                    {
                        "process": "Trimming and Processing",
                        "utilization": "95%",
                        "bottleneck_severity": "High",
                        "impact": "Limits overall throughput"
                    },
                    {
                        "process": "Packaging",
                        "utilization": "88%",
                        "bottleneck_severity": "Medium",
                        "impact": "Occasional delays"
                    }
                ],
                "improvement_recommendations": [
                    {
                        "area": "Process Automation",
                        "recommendation": "Automate trimming process",
                        "efficiency_gain": "25%",
                        "investment": "$85K",
                        "payback_period": "14 months"
                    },
                    {
                        "area": "Workflow Optimization",
                        "recommendation": "Implement lean manufacturing",
                        "efficiency_gain": "15%",
                        "investment": "$15K training",
                        "payback_period": "6 months"
                    }
                ],
                "quality_improvements": [
                    "Implement statistical process control",
                    "Enhanced testing protocols",
                    "Real-time monitoring systems"
                ],
                "expected_outcomes": {
                    "efficiency_increase": "20-25%",
                    "throughput_improvement": "30%",
                    "waste_reduction": "To 2.5%",
                    "cost_savings": "$125K annually"
                }
            }
            
            return json.dumps(efficiency_analysis, indent=2)
            
        except Exception as e:
            return f"Operational efficiency analysis error: {str(e)}"
    
    def _optimize_staff_management(self, staff_data: str) -> str:
        """Optimize staffing levels and productivity"""
        try:
            staff_optimization = {
                "current_staffing": {
                    "total_employees": 18,
                    "cultivation_staff": 6,
                    "processing_staff": 4,
                    "quality_control": 2,
                    "administration": 3,
                    "sales_marketing": 3
                },
                "productivity_metrics": {
                    "revenue_per_employee": "$128K",
                    "industry_benchmark": "$115K",
                    "productivity_variance": "+11.3%"
                },
                "staffing_recommendations": [
                    {
                        "department": "Processing",
                        "current": 4,
                        "recommended": 5,
                        "rationale": "Eliminate bottleneck",
                        "cost": "+$45K annually"
                    },
                    {
                        "department": "Quality Control",
                        "current": 2,
                        "recommended": 3,
                        "rationale": "Support growth, reduce testing delays",
                        "cost": "+$55K annually"
                    }
                ],
                "training_needs": [
                    "Cross-training for flexibility",
                    "Advanced processing techniques",
                    "Quality control certification",
                    "Compliance and safety updates"
                ],
                "performance_improvement": [
                    "Implement performance bonuses",
                    "Regular training programs",
                    "Clear advancement paths",
                    "Employee feedback systems"
                ],
                "cost_benefit_analysis": {
                    "additional_staff_cost": "$100K annually",
                    "productivity_increase": "25%",
                    "additional_revenue": "$575K",
                    "net_benefit": "$475K annually"
                }
            }
            
            return json.dumps(staff_optimization, indent=2)
            
        except Exception as e:
            return f"Staff management optimization error: {str(e)}"
    
    def _monitor_compliance(self, compliance_data: str) -> str:
        """Monitor and ensure regulatory compliance"""
        try:
            compliance_monitoring = {
                "compliance_score": "94%",
                "compliance_areas": {
                    "licensing": {
                        "status": "Compliant",
                        "next_renewal": "2024-08-15",
                        "score": "100%"
                    },
                    "testing_requirements": {
                        "status": "Mostly Compliant",
                        "issues": "2 minor testing delays",
                        "score": "92%"
                    },
                    "tracking_systems": {
                        "status": "Compliant",
                        "system": "Seed-to-sale tracking active",
                        "score": "98%"
                    },
                    "security_requirements": {
                        "status": "Compliant",
                        "last_audit": "2024-02-15",
                        "score": "96%"
                    }
                },
                "risk_assessment": [
                    {
                        "risk": "Testing delays",
                        "probability": "Medium",
                        "impact": "Medium",
                        "mitigation": "Backup testing lab relationship"
                    },
                    {
                        "risk": "Regulatory changes",
                        "probability": "High",
                        "impact": "High",
                        "mitigation": "Regular regulatory monitoring"
                    }
                ],
                "improvement_actions": [
                    "Establish relationships with multiple testing labs",
                    "Implement automated compliance monitoring",
                    "Regular staff compliance training",
                    "Enhanced documentation systems"
                ],
                "compliance_costs": {
                    "testing": "$25K annually",
                    "licensing_fees": "$15K annually",
                    "compliance_staff": "$65K annually",
                    "total": "$105K annually (4.6% of revenue)"
                }
            }
            
            return json.dumps(compliance_monitoring, indent=2)
            
        except Exception as e:
            return f"Compliance monitoring error: {str(e)}"
    
    def _rag_search(self, query: str) -> str:
        """Search operations knowledge base using RAG"""
        if not self.retriever:
            return "RAG retrieval not available"
        
        try:
            docs = self.retriever.get_relevant_documents(query)
            if not docs:
                return "No relevant operations information found"
            
            return "\n\n".join([doc.page_content for doc in docs[:3]])
            
        except Exception as e:
            return f"RAG search error: {str(e)}"
    
    def _sparql_query(self, natural_language_query: str) -> str:
        """Query RDF knowledge base using natural language"""
        if not self.rdf_kb or not self.sparql_generator:
            return "RDF knowledge base not available"
        
        try:
            sparql_query = self.sparql_generator.generate_sparql(
                natural_language_query,
                domain="operations"
            )
            
            results = self.rdf_kb.query(sparql_query)
            
            if not results:
                return "No results found in structured knowledge base"
            
            return f"SPARQL Query: {sparql_query}\n\nResults:\n" + "\n".join([str(result) for result in results[:5]])
            
        except Exception as e:
            return f"SPARQL query error: {str(e)}"
    
    def _load_baseline_questions(self) -> List[Dict]:
        """Load baseline test questions"""
        try:
            baseline_path = os.path.join(self.agent_path, "baseline.json")
            if os.path.exists(baseline_path):
                with open(baseline_path, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            self.logger.error(f"Failed to load baseline questions: {e}")
            return []
    
    def _get_user_memory(self, user_id: str) -> ConversationBufferWindowMemory:
        """Get or create memory for user"""
        if user_id not in self.memory_store:
            self.memory_store[user_id] = ConversationBufferWindowMemory(
                k=10,
                return_messages=True,
                memory_key="chat_history"
            )
        return self.memory_store[user_id]
    
    async def process_query(self, user_id: str, query: str, context: Dict = None) -> Dict[str, Any]:
        """Process a user query with memory and context"""
        try:
            memory = self._get_user_memory(user_id)
            
            if context:
                query = f"Context: {json.dumps(context)}\n\nQuery: {query}"
            
            result = await asyncio.to_thread(
                self.agent_executor.invoke,
                {
                    "input": query,
                    "chat_history": memory.chat_memory.messages
                }
            )
            
            memory.chat_memory.add_user_message(query)
            memory.chat_memory.add_ai_message(result["output"])
            
            return {
                "response": result["output"],
                "intermediate_steps": result.get("intermediate_steps", []),
                "confidence": 0.85,
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id
            }
            
        except Exception as e:
            self.logger.error(f"Query processing error: {e}")
            return {
                "response": f"I encountered an error processing your operations query: {str(e)}",
                "error": str(e),
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id
            }
    
    def get_user_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a user"""
        if user_id not in self.memory_store:
            return []
        
        memory = self.memory_store[user_id]
        messages = memory.chat_memory.messages[-limit*2:]
        
        history = []
        for i in range(0, len(messages), 2):
            if i + 1 < len(messages):
                history.append({
                    "user_message": messages[i].content,
                    "agent_response": messages[i + 1].content,
                    "timestamp": datetime.now().isoformat()
                })
        
        return history
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        if user_id in self.memory_store:
            del self.memory_store[user_id]
    
    async def run_baseline_test(self, question_id: str = None) -> Dict[str, Any]:
        """Run baseline test questions"""
        if not self.baseline_questions:
            return {"error": "No baseline questions available"}
        
        questions = self.baseline_questions
        if question_id:
            questions = [q for q in questions if q.get("id") == question_id]
        
        results = []
        for question in questions[:5]:
            try:
                response = await self.process_query(
                    user_id="baseline_test",
                    query=question["question"],
                    context={"test_mode": True}
                )
                
                evaluation = await self._evaluate_baseline_response(question, response["response"])
                
                results.append({
                    "question_id": question.get("id", "unknown"),
                    "question": question["question"],
                    "expected": question.get("expected_answer", ""),
                    "actual": response["response"],
                    "passed": evaluation["passed"],
                    "confidence": evaluation["confidence"],
                    "evaluation": evaluation
                })
                
            except Exception as e:
                results.append({
                    "question_id": question.get("id", "unknown"),
                    "question": question["question"],
                    "error": str(e),
                    "passed": False,
                    "confidence": 0.0
                })
        
        self.clear_user_memory("baseline_test")
        
        return {
            "agent_type": "operations",
            "total_questions": len(results),
            "passed": sum(1 for r in results if r.get("passed", False)),
            "average_confidence": sum(r.get("confidence", 0) for r in results) / len(results) if results else 0,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _evaluate_baseline_response(self, question: Dict, response: str) -> Dict[str, Any]:
        """Evaluate baseline response quality"""
        try:
            expected_keywords = question.get("keywords", [])
            response_lower = response.lower()
            
            keyword_matches = sum(1 for keyword in expected_keywords if keyword.lower() in response_lower)
            keyword_score = keyword_matches / len(expected_keywords) if expected_keywords else 0.5
            
            # Check for operations-specific content
            operations_terms = ["efficiency", "process", "optimization", "metrics", "kpi", "improvement"]
            operations_score = sum(1 for term in operations_terms if term in response_lower) / len(operations_terms)
            
            length_score = min(len(response) / 200, 1.0)
            
            overall_score = (keyword_score * 0.4 + operations_score * 0.4 + length_score * 0.2)
            
            return {
                "passed": overall_score >= 0.6,
                "confidence": overall_score,
                "keyword_matches": keyword_matches,
                "total_keywords": len(expected_keywords),
                "operations_relevance": operations_score,
                "response_length": len(response)
            }
            
        except Exception as e:
            return {
                "passed": False,
                "confidence": 0.0,
                "error": str(e)
            }

def create_operations_agent(agent_path: str = ".") -> OperationsAgent:
    """Create and return a configured operations agent"""
    return OperationsAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_operations_agent()
        
        result = await agent.process_query(
            user_id="test_user",
            query="How can I improve my cannabis business operational efficiency and reduce costs?"
        )
        
        print("Agent Response:")
        print(result["response"])
        
        baseline_results = await agent.run_baseline_test()
        print(f"\nBaseline Test Results: {baseline_results['passed']}/{baseline_results['total_questions']} passed")
    
    asyncio.run(main())