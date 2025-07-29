"""
Marketing Agent with LangChain, N8N Workflows, and Memory Support
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
class MarketingCampaign:
    platform: str
    campaign_type: str
    target_demographics: Dict[str, Any]
    budget_estimate: float
    cpc_estimate: float
    compliance_status: str
    creative_strategy: str
    estimated_reach: int
    roi_projection: float

class MarketingAgent:
    """
    Cannabis Marketing Agent with N8N Workflows, Platform Intelligence, and Memory
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
        
        # Platform compliance rules
        self.platform_rules = self._load_platform_compliance()
        
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
            # Load FAISS vectorstore if exists
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
        
        # Platform compliance checker
        tools.append(Tool(
            name="platform_compliance_check",
            description="Check marketing content compliance for specific platforms",
            func=self._check_platform_compliance
        ))
        
        # Creative strategy generator
        tools.append(Tool(
            name="creative_strategy_generator", 
            description="Generate compliant creative strategies for cannabis marketing",
            func=self._generate_creative_strategy
        ))
        
        # Market intelligence tool
        tools.append(Tool(
            name="market_intelligence",
            description="Analyze market data, CPC estimates, and audience insights",
            func=self._market_intelligence_analysis
        ))
        
        # N8N workflow simulator
        tools.append(Tool(
            name="n8n_workflow_simulator",
            description="Simulate N8N marketing automation workflows",
            func=self._simulate_n8n_workflow
        ))
        
        # RAG search tool
        if self.retriever:
            tools.append(Tool(
                name="marketing_knowledge_search",
                description="Search marketing knowledge base for strategies and case studies",
                func=self._rag_search
            ))
        
        # RDF SPARQL query tool
        if self.rdf_kb and self.sparql_generator:
            tools.append(Tool(
                name="structured_marketing_query",
                description="Query structured marketing knowledge using natural language",
                func=self._sparql_query
            ))
        
        self.tools = tools
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert cannabis marketing strategist with deep knowledge of:
            - Digital marketing platforms and their cannabis advertising policies
            - Compliance requirements across different jurisdictions
            - Creative workarounds for restricted platforms
            - N8N workflow automation for marketing
            - Market intelligence and CPC analysis
            - Cannabis industry trends and demographics
            
            Use the available tools to provide comprehensive marketing strategies.
            Always consider platform compliance and creative alternatives.
            Focus on wellness angles and educational content for restricted platforms.
            """),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create agent
        self.agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            return_intermediate_steps=True,
            max_iterations=5
        )
    
    def _load_platform_compliance(self) -> Dict[str, Any]:
        """Load platform-specific compliance rules"""
        return {
            "facebook": {
                "allowed": False,
                "restrictions": ["no_cannabis_content", "no_cbd_ads", "no_hemp_mention"],
                "workarounds": ["wellness_angle", "lifestyle_focus", "educational_content"],
                "creative_strategies": ["plant_based_wellness", "natural_remedies", "health_and_wellness"]
            },
            "instagram": {
                "allowed": False,
                "restrictions": ["no_cannabis_imagery", "no_product_promotion", "no_dispensary_ads"],
                "workarounds": ["brand_awareness", "educational_posts", "community_building"],
                "creative_strategies": ["lifestyle_branding", "wellness_education", "brand_storytelling"]
            },
            "google_ads": {
                "allowed": False,
                "restrictions": ["no_cannabis_keywords", "no_cbd_products", "no_dispensary_promotion"],
                "workarounds": ["wellness_keywords", "educational_content", "brand_terms"],
                "creative_strategies": ["health_and_wellness", "natural_products", "educational_focus"]
            },
            "weedmaps": {
                "allowed": True,
                "restrictions": ["age_verification", "licensed_operators_only", "compliant_imagery"],
                "best_practices": ["high_quality_photos", "detailed_descriptions", "customer_reviews"],
                "creative_strategies": ["product_showcase", "strain_education", "deals_and_promotions"]
            },
            "leafly": {
                "allowed": True,
                "restrictions": ["verified_dispensaries", "accurate_product_info", "professional_content"],
                "best_practices": ["educational_content", "strain_reviews", "dispensary_profiles"],
                "creative_strategies": ["expert_content", "strain_spotlights", "educational_series"]
            }
        }
    
    def _check_platform_compliance(self, platform_and_content: str) -> str:
        """Check marketing content compliance for specific platforms"""
        try:
            parts = platform_and_content.split(":", 1)
            if len(parts) != 2:
                return "Please format as 'platform:content'"
            
            platform = parts[0].strip().lower()
            content = parts[1].strip()
            
            if platform not in self.platform_rules:
                return f"Platform '{platform}' not recognized. Available: {list(self.platform_rules.keys())}"
            
            rules = self.platform_rules[platform]
            compliance_result = {
                "platform": platform,
                "allowed": rules["allowed"],
                "content_analysis": {},
                "recommendations": []
            }
            
            content_lower = content.lower()
            
            # Check for violations
            violations = []
            if "restrictions" in rules:
                for restriction in rules["restrictions"]:
                    if restriction == "no_cannabis_content" and any(word in content_lower for word in ["cannabis", "marijuana", "weed", "thc"]):
                        violations.append("Contains cannabis-related content")
                    elif restriction == "no_cbd_ads" and "cbd" in content_lower:
                        violations.append("Contains CBD references")
                    elif restriction == "no_hemp_mention" and "hemp" in content_lower:
                        violations.append("Contains hemp references")
            
            compliance_result["violations"] = violations
            
            # Provide recommendations
            if violations and "workarounds" in rules:
                compliance_result["recommendations"] = [
                    f"Try {workaround} approach" for workaround in rules["workarounds"]
                ]
            
            # Suggest creative strategies
            if "creative_strategies" in rules:
                compliance_result["creative_strategies"] = rules["creative_strategies"]
            
            return json.dumps(compliance_result, indent=2)
            
        except Exception as e:
            return f"Compliance check error: {str(e)}"
    
    def _generate_creative_strategy(self, brief: str) -> str:
        """Generate compliant creative strategies for cannabis marketing"""
        try:
            brief_lower = brief.lower()
            
            # Determine if targeting restricted platforms
            restricted_platforms = ["facebook", "instagram", "google"]
            is_restricted = any(platform in brief_lower for platform in restricted_platforms)
            
            creative_strategy = {
                "primary_approach": "",
                "messaging_framework": [],
                "visual_strategy": [],
                "content_themes": [],
                "compliance_notes": []
            }
            
            if is_restricted:
                creative_strategy["primary_approach"] = "Wellness and Lifestyle Focus"
                creative_strategy["messaging_framework"] = [
                    "Plant-based wellness solutions",
                    "Natural health and relaxation",
                    "Lifestyle enhancement and balance",
                    "Educational content about botanicals"
                ]
                creative_strategy["visual_strategy"] = [
                    "Nature and botanical imagery",
                    "Wellness lifestyle photography",
                    "Clean, minimalist design",
                    "Avoid cannabis leaf imagery"
                ]
                creative_strategy["content_themes"] = [
                    "Wellness Wednesday tips",
                    "Natural remedies education",
                    "Mindfulness and relaxation",
                    "Plant-based lifestyle content"
                ]
                creative_strategy["compliance_notes"] = [
                    "Focus on wellness benefits without cannabis mention",
                    "Use educational angle for content",
                    "Emphasize natural and organic aspects"
                ]
            else:
                creative_strategy["primary_approach"] = "Direct Cannabis Marketing"
                creative_strategy["messaging_framework"] = [
                    "Product quality and craftsmanship",
                    "Strain-specific benefits and effects",
                    "Expert cultivation and processing",
                    "Community and culture celebration"
                ]
                creative_strategy["visual_strategy"] = [
                    "High-quality product photography",
                    "Behind-the-scenes cultivation",
                    "Professional dispensary imagery",
                    "Cannabis culture celebration"
                ]
                creative_strategy["content_themes"] = [
                    "Strain spotlights and education",
                    "Cultivation process transparency",
                    "Customer testimonials and reviews",
                    "Industry news and trends"
                ]
                creative_strategy["compliance_notes"] = [
                    "Ensure age-gating on all content",
                    "Include required legal disclaimers",
                    "Verify licensing compliance"
                ]
            
            return json.dumps(creative_strategy, indent=2)
            
        except Exception as e:
            return f"Creative strategy error: {str(e)}"
    
    def _market_intelligence_analysis(self, query: str) -> str:
        """Analyze market data, CPC estimates, and audience insights"""
        try:
            # Simulated market intelligence data
            market_data = {
                "cannabis_market_size": {
                    "us_legal_market_2024": "$33.6B",
                    "projected_2028": "$57.8B",
                    "cagr": "14.8%"
                },
                "platform_cpc_estimates": {
                    "weedmaps": {"avg_cpc": "$2.50", "range": "$1.50-$4.00"},
                    "leafly": {"avg_cpc": "$3.20", "range": "$2.00-$5.50"},
                    "google_wellness": {"avg_cpc": "$4.80", "range": "$3.00-$8.00"},
                    "facebook_wellness": {"avg_cpc": "$2.10", "range": "$1.20-$3.50"}
                },
                "demographics": {
                    "primary_age_group": "25-44",
                    "gender_split": {"male": "52%", "female": "48%"},
                    "income_bracket": "$50K-$100K",
                    "education": "college_educated_majority"
                },
                "trending_products": [
                    "nano_emulsion_beverages",
                    "high_cbd_wellness_products",
                    "craft_cannabis_flower",
                    "precision_dose_edibles"
                ]
            }
            
            # Add query-specific insights
            query_lower = query.lower()
            if "cpc" in query_lower or "cost" in query_lower:
                market_data["cost_insights"] = {
                    "lowest_cpc_platform": "Facebook (wellness angle)",
                    "highest_quality_traffic": "Weedmaps/Leafly",
                    "best_roi_strategy": "Multi-platform wellness approach"
                }
            
            if "demographic" in query_lower or "audience" in query_lower:
                market_data["audience_insights"] = {
                    "peak_engagement_times": ["7-9pm weekdays", "12-3pm weekends"],
                    "top_interests": ["wellness", "natural_products", "lifestyle", "health"],
                    "content_preferences": ["educational", "behind_the_scenes", "product_reviews"]
                }
            
            return json.dumps(market_data, indent=2)
            
        except Exception as e:
            return f"Market intelligence error: {str(e)}"
    
    def _simulate_n8n_workflow(self, workflow_description: str) -> str:
        """Simulate N8N marketing automation workflows"""
        try:
            # Parse workflow type
            description_lower = workflow_description.lower()
            
            workflow_simulation = {
                "workflow_name": "",
                "trigger": "",
                "nodes": [],
                "expected_outcomes": [],
                "automation_benefits": []
            }
            
            if "content" in description_lower and "approval" in description_lower:
                workflow_simulation.update({
                    "workflow_name": "Content Approval & Distribution",
                    "trigger": "Webhook - Content Upload",
                    "nodes": [
                        {"node": "HTTP Request", "action": "Receive content upload"},
                        {"node": "OCR", "action": "Extract text from images"},
                        {"node": "GPT-4 Analysis", "action": "Compliance check"},
                        {"node": "Conditional", "action": "Route based on compliance"},
                        {"node": "Email", "action": "Send approval notification"},
                        {"node": "Social Media Posting", "action": "Auto-publish if approved"}
                    ],
                    "expected_outcomes": [
                        "Automated compliance checking",
                        "Reduced manual review time",
                        "Consistent brand messaging",
                        "Platform-specific content optimization"
                    ],
                    "automation_benefits": [
                        "85% reduction in review time",
                        "100% compliance checking",
                        "Multi-platform distribution",
                        "Audit trail for all content"
                    ]
                })
            
            elif "campaign" in description_lower and "optimization" in description_lower:
                workflow_simulation.update({
                    "workflow_name": "Campaign Performance Optimization",
                    "trigger": "Schedule - Daily at 9 AM",
                    "nodes": [
                        {"node": "API Call", "action": "Fetch campaign metrics"},
                        {"node": "Data Analysis", "action": "Calculate performance KPIs"},
                        {"node": "Conditional", "action": "Check performance thresholds"},
                        {"node": "Budget Adjustment", "action": "Auto-adjust spend allocation"},
                        {"node": "Slack Notification", "action": "Alert team of changes"},
                        {"node": "Report Generation", "action": "Create performance summary"}
                    ],
                    "expected_outcomes": [
                        "Automatic budget optimization",
                        "Real-time performance monitoring",
                        "Proactive campaign adjustments",
                        "Data-driven decision making"
                    ],
                    "automation_benefits": [
                        "24/7 campaign monitoring",
                        "Immediate response to performance changes",
                        "Optimized ad spend allocation",
                        "Improved ROI tracking"
                    ]
                })
            
            else:
                workflow_simulation.update({
                    "workflow_name": "Generic Marketing Automation",
                    "trigger": "Custom trigger based on requirements",
                    "nodes": [
                        {"node": "Data Input", "action": "Collect marketing data"},
                        {"node": "Processing", "action": "Analyze and transform data"},
                        {"node": "Decision Logic", "action": "Apply business rules"},
                        {"node": "Action Execution", "action": "Perform marketing actions"},
                        {"node": "Monitoring", "action": "Track results and performance"}
                    ],
                    "expected_outcomes": [
                        "Streamlined marketing processes",
                        "Consistent execution",
                        "Data-driven insights",
                        "Scalable operations"
                    ]
                })
            
            return json.dumps(workflow_simulation, indent=2)
            
        except Exception as e:
            return f"N8N workflow simulation error: {str(e)}"
    
    def _rag_search(self, query: str) -> str:
        """Search marketing knowledge base using RAG"""
        if not self.retriever:
            return "RAG retrieval not available"
        
        try:
            docs = self.retriever.get_relevant_documents(query)
            if not docs:
                return "No relevant marketing information found"
            
            return "\n\n".join([doc.page_content for doc in docs[:3]])
            
        except Exception as e:
            return f"RAG search error: {str(e)}"
    
    def _sparql_query(self, natural_language_query: str) -> str:
        """Query RDF knowledge base using natural language"""
        if not self.rdf_kb or not self.sparql_generator:
            return "RDF knowledge base not available"
        
        try:
            # Generate SPARQL query from natural language
            sparql_query = self.sparql_generator.generate_sparql(
                natural_language_query,
                domain="marketing"
            )
            
            # Execute query against RDF knowledge base
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
            # Get user memory
            memory = self._get_user_memory(user_id)
            
            # Add context if provided
            if context:
                query = f"Context: {json.dumps(context)}\n\nQuery: {query}"
            
            # Process with agent
            result = await asyncio.to_thread(
                self.agent_executor.invoke,
                {
                    "input": query,
                    "chat_history": memory.chat_memory.messages
                }
            )
            
            # Update memory
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
                "response": f"I encountered an error processing your marketing query: {str(e)}",
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
            "agent_type": "marketing",
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
            
            # Check for marketing-specific content
            marketing_terms = ["platform", "compliance", "strategy", "campaign", "audience", "creative"]
            marketing_score = sum(1 for term in marketing_terms if term in response_lower) / len(marketing_terms)
            
            length_score = min(len(response) / 200, 1.0)
            
            overall_score = (keyword_score * 0.4 + marketing_score * 0.4 + length_score * 0.2)
            
            return {
                "passed": overall_score >= 0.6,
                "confidence": overall_score,
                "keyword_matches": keyword_matches,
                "total_keywords": len(expected_keywords),
                "marketing_relevance": marketing_score,
                "response_length": len(response)
            }
            
        except Exception as e:
            return {
                "passed": False,
                "confidence": 0.0,
                "error": str(e)
            }

def create_marketing_agent(agent_path: str = ".") -> MarketingAgent:
    """Create and return a configured marketing agent"""
    return MarketingAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_marketing_agent()
        
        # Test query
        result = await agent.process_query(
            user_id="test_user",
            query="How can I market CBD products on Facebook without violating their policies?"
        )
        
        print("Agent Response:")
        print(result["response"])
        
        # Run baseline test
        baseline_results = await agent.run_baseline_test()
        print(f"\nBaseline Test Results: {baseline_results['passed']}/{baseline_results['total_questions']} passed")
    
    asyncio.run(main())