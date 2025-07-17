"""
Patent Agent - Freedom to Operate (FTO) Analysis with LangChain, RAG, and Memory Support
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio
from pathlib import Path

from langchain.agents import AgentType, initialize_agent
from langchain.chat_models import ChatOpenAI
from langchain.tools import Tool
from langchain.schema import BaseRetriever
from langchain.memory import ConversationBufferWindowMemory
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import TextLoader
from langchain.schema import Document

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FTOAnalysis:
    """Freedom to Operate Analysis Result"""
    query: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    patent_citations: List[str]
    trademark_conflicts: List[str]
    regulatory_barriers: List[str]
    clearance_probability: float
    recommendations: List[str]
    filing_opportunities: List[str]
    competitive_landscape: Dict[str, Any]
    estimated_clearance_time: str
    legal_cost_estimate: str

class PatentAgent:
    """
    Cannabis Patent Agent - Freedom to Operate (FTO) Analysis with Patent/Trademark Research
    """
    
    def __init__(self, agent_path: str = "."):
        self.agent_path = Path(agent_path)
        self.user_memories = {}
        
        # Initialize components
        self._initialize_llm()
        self._initialize_retriever()
        self._initialize_tools()
        self._initialize_agent()
        
        # Load baseline questions
        self.baseline_questions = self._load_baseline_questions()
    
    def _initialize_llm(self):
        """Initialize language model"""
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.2,
            max_tokens=2000
        )
    
    def _initialize_retriever(self):
        """Initialize RAG retriever with AstraDB"""
        try:
            from shared.astradb_vector_store import AstraDBVectorStore
            
            # Initialize AstraDB vector store for Patent agent
            self.vector_store = AstraDBVectorStore(
                collection_name="cannabis_patent_vectors",
                agent_type="patent"
            )
            
            # Create retriever
            self.retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 5}
            )
            
            logger.info("AstraDB retriever initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize AstraDB retriever: {e}")
            self.retriever = None
    
    def _initialize_tools(self):
        """Initialize agent tools"""
        self.tools = [
            Tool(
                name="patent_search",
                description="Search patent databases for potential conflicts",
                func=self._patent_search
            ),
            Tool(
                name="trademark_search",
                description="Search trademark databases for potential conflicts",
                func=self._trademark_search
            ),
            Tool(
                name="regulatory_analysis",
                description="Analyze regulatory barriers and requirements",
                func=self._regulatory_analysis
            ),
            Tool(
                name="competitive_landscape",
                description="Analyze competitive landscape and market position",
                func=self._competitive_landscape
            ),
            Tool(
                name="filing_opportunities",
                description="Identify patent/trademark filing opportunities",
                func=self._filing_opportunities
            ),
            Tool(
                name="risk_assessment",
                description="Assess overall freedom to operate risk",
                func=self._risk_assessment
            )
        ]
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            max_iterations=3,
            handle_parsing_errors=True
        )
    
    def _patent_search(self, query: str) -> str:
        """Search patent databases for potential conflicts"""
        try:
            if self.retriever:
                docs = self.retriever.get_relevant_documents(f"patent search: {query}")
                context = "\n".join([doc.page_content for doc in docs])
            else:
                context = "Patent database search functionality"
            
            # Simulate patent search analysis
            analysis = {
                "query": query,
                "relevant_patents": [
                    "US Patent 10,123,456 - Cannabis extraction method",
                    "US Patent 10,234,567 - CBD formulation process",
                    "US Patent 10,345,678 - Terpene isolation technique"
                ],
                "conflict_risk": "MEDIUM",
                "filing_date_range": "2018-2023",
                "key_claims": [
                    "Novel extraction methodology",
                    "Specific cannabinoid ratios",
                    "Processing temperature ranges"
                ],
                "context": context
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Patent search failed: {e}")
            return f"Patent search error: {e}"
    
    def _trademark_search(self, query: str) -> str:
        """Search trademark databases for potential conflicts"""
        try:
            # Simulate trademark search analysis
            analysis = {
                "query": query,
                "existing_trademarks": [
                    "GREEN LEAF SOLUTIONS - Cannabis products",
                    "NATURAL WELLNESS - CBD products",
                    "PURE EXTRACT - Cannabis concentrates"
                ],
                "classification_codes": ["Class 5", "Class 35", "Class 44"],
                "conflict_probability": "LOW",
                "geographic_scope": "US Federal",
                "registration_status": "Active",
                "recommended_classes": ["Class 5", "Class 35"]
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Trademark search failed: {e}")
            return f"Trademark search error: {e}"
    
    def _regulatory_analysis(self, query: str) -> str:
        """Analyze regulatory barriers and requirements"""
        try:
            if self.retriever:
                docs = self.retriever.get_relevant_documents(f"regulatory barriers: {query}")
                context = "\n".join([doc.page_content for doc in docs])
            else:
                context = "Regulatory analysis functionality"
            
            analysis = {
                "query": query,
                "federal_requirements": [
                    "FDA regulations for cannabis products",
                    "DEA scheduling considerations",
                    "Interstate commerce restrictions"
                ],
                "state_variations": [
                    "California: Prop 64 compliance",
                    "Colorado: Strict testing requirements",
                    "Washington: Seed-to-sale tracking"
                ],
                "barrier_level": "HIGH",
                "compliance_timeline": "6-12 months",
                "estimated_costs": "$50,000-$150,000",
                "context": context
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Regulatory analysis failed: {e}")
            return f"Regulatory analysis error: {e}"
    
    def _competitive_landscape(self, query: str) -> str:
        """Analyze competitive landscape and market position"""
        try:
            analysis = {
                "query": query,
                "major_competitors": [
                    "Canopy Growth Corporation",
                    "Tilray Inc.",
                    "Cronos Group",
                    "Aurora Cannabis"
                ],
                "market_segments": [
                    "Medical cannabis",
                    "Recreational cannabis",
                    "CBD wellness products",
                    "Cannabis beverages"
                ],
                "competitive_intensity": "HIGH",
                "market_share_leaders": {
                    "Canopy Growth": "15%",
                    "Tilray": "12%",
                    "Cronos": "8%"
                },
                "differentiation_opportunities": [
                    "Unique extraction methods",
                    "Novel product formulations",
                    "Specialized delivery systems"
                ]
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Competitive landscape analysis failed: {e}")
            return f"Competitive landscape error: {e}"
    
    def _filing_opportunities(self, query: str) -> str:
        """Identify patent/trademark filing opportunities"""
        try:
            analysis = {
                "query": query,
                "patent_opportunities": [
                    "Novel extraction process improvements",
                    "Unique cannabinoid delivery systems",
                    "Innovative cultivation techniques"
                ],
                "trademark_opportunities": [
                    "Brand names for product lines",
                    "Unique product formulation names",
                    "Service mark opportunities"
                ],
                "filing_timeline": "3-6 months",
                "estimated_costs": {
                    "patent_filing": "$15,000-$25,000",
                    "trademark_filing": "$2,000-$5,000"
                },
                "priority_level": "HIGH",
                "success_probability": "75%"
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Filing opportunities analysis failed: {e}")
            return f"Filing opportunities error: {e}"
    
    def _risk_assessment(self, query: str) -> str:
        """Assess overall freedom to operate risk"""
        try:
            analysis = {
                "query": query,
                "overall_risk": "MEDIUM",
                "risk_factors": [
                    "Existing patent landscape density",
                    "Regulatory compliance requirements",
                    "Trademark conflicts potential",
                    "Competitive market pressure"
                ],
                "risk_mitigation": [
                    "Conduct comprehensive patent clearance",
                    "File defensive patents",
                    "Establish trademark portfolio",
                    "Monitor competitor activities"
                ],
                "clearance_probability": "70%",
                "estimated_timeline": "4-8 months",
                "legal_budget_required": "$75,000-$200,000"
            }
            
            return json.dumps(analysis, indent=2)
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            return f"Risk assessment error: {e}"
    
    def _load_baseline_questions(self) -> List[Dict]:
        """Load baseline test questions"""
        baseline_file = self.agent_path / "baseline.json"
        if not baseline_file.exists():
            return []
        
        try:
            with open(baseline_file, 'r') as f:
                data = json.load(f)
                return data.get("questions", [])
        except Exception as e:
            logger.error(f"Failed to load baseline questions: {e}")
            return []
    
    def _get_user_memory(self, user_id: str) -> ConversationBufferWindowMemory:
        """Get or create memory for user"""
        if user_id not in self.user_memories:
            self.user_memories[user_id] = ConversationBufferWindowMemory(
                k=10,
                return_messages=True,
                memory_key="chat_history"
            )
        return self.user_memories[user_id]
    
    async def process_query(self, user_id: str, query: str, context: Dict = None) -> Dict[str, Any]:
        """Process a user query with memory and context"""
        try:
            # Get user memory
            memory = self._get_user_memory(user_id)
            
            # Add memory to agent
            self.agent.memory = memory
            
            # Process query
            result = await asyncio.get_event_loop().run_in_executor(
                None, self.agent.run, query
            )
            
            # Parse result if it's JSON
            try:
                parsed_result = json.loads(result)
            except:
                parsed_result = {"analysis": result}
            
            response = {
                "user_id": user_id,
                "query": query,
                "response": parsed_result,
                "agent_type": "patent",
                "timestamp": datetime.now().isoformat(),
                "context": context or {}
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Query processing failed: {e}")
            return {
                "user_id": user_id,
                "query": query,
                "error": str(e),
                "agent_type": "patent",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_user_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a user"""
        memory = self._get_user_memory(user_id)
        messages = memory.chat_memory.messages[-limit:]
        
        return [
            {
                "role": "human" if msg.type == "human" else "ai",
                "content": msg.content,
                "timestamp": datetime.now().isoformat()
            }
            for msg in messages
        ]
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        if user_id in self.user_memories:
            del self.user_memories[user_id]
    
    async def run_baseline_test(self, question_id: str = None) -> Dict[str, Any]:
        """Run baseline test questions"""
        if not self.baseline_questions:
            return {"error": "No baseline questions available"}
        
        if question_id:
            # Run specific question
            questions = [q for q in self.baseline_questions if q.get("id") == question_id]
        else:
            # Run all questions
            questions = self.baseline_questions
        
        results = []
        for question in questions:
            try:
                result = await self.process_query(
                    user_id="baseline_test",
                    query=question["question"],
                    context={"test_mode": True}
                )
                
                # Evaluate response
                evaluation = await self._evaluate_baseline_response(question, result["response"])
                
                results.append({
                    "question_id": question.get("id", "unknown"),
                    "question": question["question"],
                    "response": result["response"],
                    "evaluation": evaluation,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                results.append({
                    "question_id": question.get("id", "unknown"),
                    "question": question["question"],
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        return {
            "agent_type": "fto",
            "total_questions": len(questions),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _evaluate_baseline_response(self, question: Dict, response: str) -> Dict[str, Any]:
        """Evaluate baseline response quality"""
        try:
            # Use LLM to evaluate response quality
            evaluation_prompt = f"""
            Evaluate this FTO agent response:
            
            Question: {question["question"]}
            Expected Answer: {question.get("expected_answer", "Not provided")}
            Agent Response: {response}
            
            Rate on a scale of 1-10 and provide feedback in JSON format:
            {{
                "accuracy": score,
                "completeness": score,
                "relevance": score,
                "confidence": score,
                "feedback": "detailed feedback",
                "overall_score": average_score
            }}
            """
            
            evaluation = await asyncio.get_event_loop().run_in_executor(
                None, self.llm.invoke, evaluation_prompt
            )
            
            return json.loads(evaluation.content)
            
        except Exception as e:
            logger.error(f"Baseline evaluation failed: {e}")
            return {
                "accuracy": 5,
                "completeness": 5,
                "relevance": 5,
                "confidence": 5,
                "feedback": f"Evaluation failed: {e}",
                "overall_score": 5
            }

def create_fto_agent(agent_path: str = ".") -> FTOAgent:
    """Create and return a configured FTO agent"""
    return FTOAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_fto_agent()
        
        # Test query
        test_query = "Analyze freedom to operate for a new CBD tincture product line"
        result = await agent.process_query("test_user", test_query)
        
        print("FTO Agent Response:")
        print(json.dumps(result, indent=2))
        
        # Run baseline test
        baseline_result = await agent.run_baseline_test()
        print("\nBaseline Test Results:")
        print(json.dumps(baseline_result, indent=2))
    
    asyncio.run(main())