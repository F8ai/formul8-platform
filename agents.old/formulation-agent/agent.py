"""
Formulation Agent with LangChain, RAG, RDKit, and Memory Support
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

# RDKit imports (if available)
try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, Crippen
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

# RDF and SPARQL imports
import sys
sys.path.append('../shared')
from sparql_utils import SPARQLQueryGenerator, RDFKnowledgeBase

@dataclass
class FormulationAnalysis:
    formula: str
    molecular_weight: float
    logp: float
    cannabinoid_profile: Dict[str, float]
    terpene_profile: Dict[str, float]
    extraction_method: str
    potency: float
    stability_score: float
    recommendations: List[str]

class FormulationAgent:
    """
    Cannabis Formulation Agent with RDKit, RDF, and Memory
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
            temperature=0.1,
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
        
        # RDKit molecular analysis tool
        if RDKIT_AVAILABLE:
            tools.append(Tool(
                name="molecular_analysis",
                description="Analyze molecular properties using RDKit",
                func=self._molecular_analysis
            ))
        
        # RAG search tool
        if self.retriever:
            tools.append(Tool(
                name="formulation_search",
                description="Search formulation knowledge base for relevant information",
                func=self._rag_search
            ))
        
        # RDF SPARQL query tool
        if self.rdf_kb and self.sparql_generator:
            tools.append(Tool(
                name="structured_knowledge_query",
                description="Query structured formulation knowledge using natural language",
                func=self._sparql_query
            ))
        
        # Cannabinoid analysis tool
        tools.append(Tool(
            name="cannabinoid_analysis",
            description="Analyze cannabinoid profiles and interactions",
            func=self._cannabinoid_analysis
        ))
        
        # Extraction method recommendation tool
        tools.append(Tool(
            name="extraction_recommendation",
            description="Recommend extraction methods based on target compounds",
            func=self._extraction_recommendation
        ))
        
        self.tools = tools
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert cannabis formulation scientist with deep knowledge of:
            - Cannabinoid and terpene chemistry
            - Extraction and processing methods
            - Molecular analysis and RDKit
            - Formulation optimization
            - Stability and potency testing
            
            Use the available tools to provide comprehensive formulation advice.
            Always provide molecular-level insights when possible.
            Consider extraction methods, cannabinoid profiles, and stability factors.
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
    
    def _molecular_analysis(self, smiles: str) -> str:
        """Analyze molecular properties using RDKit"""
        if not RDKIT_AVAILABLE:
            return "RDKit not available for molecular analysis"
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return f"Invalid SMILES: {smiles}"
            
            # Calculate properties
            mw = Descriptors.MolWt(mol)
            logp = Crippen.MolLogP(mol)
            hbd = Descriptors.NumHDonors(mol)
            hba = Descriptors.NumHAcceptors(mol)
            tpsa = Descriptors.TPSA(mol)
            
            analysis = {
                "molecular_weight": round(mw, 2),
                "logp": round(logp, 2),
                "h_bond_donors": hbd,
                "h_bond_acceptors": hba,
                "topological_polar_surface_area": round(tpsa, 2),
                "lipinski_violations": sum([mw > 500, logp > 5, hbd > 5, hba > 10])
            }
            
            return json.dumps(analysis, indent=2)
            
        except Exception as e:
            return f"Molecular analysis error: {str(e)}"
    
    def _rag_search(self, query: str) -> str:
        """Search formulation knowledge base using RAG"""
        if not self.retriever:
            return "RAG retrieval not available"
        
        try:
            docs = self.retriever.get_relevant_documents(query)
            if not docs:
                return "No relevant formulation information found"
            
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
                domain="formulation"
            )
            
            # Execute query against RDF knowledge base
            results = self.rdf_kb.query(sparql_query)
            
            if not results:
                return "No results found in structured knowledge base"
            
            return f"SPARQL Query: {sparql_query}\n\nResults:\n" + "\n".join([str(result) for result in results[:5]])
            
        except Exception as e:
            return f"SPARQL query error: {str(e)}"
    
    def _cannabinoid_analysis(self, compounds: str) -> str:
        """Analyze cannabinoid profiles and interactions"""
        try:
            # Parse compound list
            compound_list = [c.strip() for c in compounds.split(",")]
            
            # Known cannabinoid properties
            cannabinoid_data = {
                "THC": {"psychoactive": True, "boiling_point": 157, "therapeutic": ["pain", "appetite"]},
                "CBD": {"psychoactive": False, "boiling_point": 160, "therapeutic": ["anxiety", "inflammation"]},
                "CBG": {"psychoactive": False, "boiling_point": 52, "therapeutic": ["antibacterial", "appetite"]},
                "CBN": {"psychoactive": True, "boiling_point": 185, "therapeutic": ["sleep", "sedation"]},
                "THCA": {"psychoactive": False, "boiling_point": 105, "therapeutic": ["anti-inflammatory"]},
                "CBDA": {"psychoactive": False, "boiling_point": 120, "therapeutic": ["nausea", "anxiety"]}
            }
            
            analysis = {"compounds": {}, "interactions": [], "recommendations": []}
            
            for compound in compound_list:
                compound = compound.upper()
                if compound in cannabinoid_data:
                    analysis["compounds"][compound] = cannabinoid_data[compound]
            
            # Add interaction analysis
            if "THC" in analysis["compounds"] and "CBD" in analysis["compounds"]:
                analysis["interactions"].append("CBD may modulate THC psychoactivity")
            
            if "CBN" in analysis["compounds"]:
                analysis["recommendations"].append("CBN presence suggests aged material or high-temperature extraction")
            
            return json.dumps(analysis, indent=2)
            
        except Exception as e:
            return f"Cannabinoid analysis error: {str(e)}"
    
    def _extraction_recommendation(self, target_compounds: str) -> str:
        """Recommend extraction methods based on target compounds"""
        try:
            targets = [c.strip().upper() for c in target_compounds.split(",")]
            
            recommendations = {
                "method": "",
                "temperature": "",
                "solvent": "",
                "considerations": []
            }
            
            # Method selection logic
            if "THCA" in targets or "CBDA" in targets:
                recommendations["method"] = "CO2 extraction or cold ethanol"
                recommendations["temperature"] = "< 40°C to preserve acids"
                recommendations["considerations"].append("Avoid decarboxylation")
            
            elif "THC" in targets and "CBD" in targets:
                recommendations["method"] = "Hydrocarbon extraction or CO2"
                recommendations["temperature"] = "40-60°C for optimal yield"
                recommendations["considerations"].append("Balanced cannabinoid extraction")
            
            elif any(terp in target_compounds.lower() for terp in ["limonene", "pinene", "myrcene"]):
                recommendations["method"] = "Steam distillation or low-temp extraction"
                recommendations["temperature"] = "< 50°C to preserve terpenes"
                recommendations["considerations"].append("Terpene preservation priority")
            
            else:
                recommendations["method"] = "CO2 extraction"
                recommendations["temperature"] = "Standard extraction parameters"
                recommendations["considerations"].append("General purpose extraction")
            
            return json.dumps(recommendations, indent=2)
            
        except Exception as e:
            return f"Extraction recommendation error: {str(e)}"
    
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
                "confidence": 0.85,  # Would be calculated based on tool usage
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id
            }
            
        except Exception as e:
            self.logger.error(f"Query processing error: {e}")
            return {
                "response": f"I encountered an error processing your formulation query: {str(e)}",
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
        messages = memory.chat_memory.messages[-limit*2:]  # Get last N exchanges
        
        history = []
        for i in range(0, len(messages), 2):
            if i + 1 < len(messages):
                history.append({
                    "user_message": messages[i].content,
                    "agent_response": messages[i + 1].content,
                    "timestamp": datetime.now().isoformat()  # Would store actual timestamps
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
        
        # Filter to specific question if provided
        questions = self.baseline_questions
        if question_id:
            questions = [q for q in questions if q.get("id") == question_id]
        
        results = []
        for question in questions[:5]:  # Limit for testing
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
        
        # Clear test memory
        self.clear_user_memory("baseline_test")
        
        return {
            "agent_type": "formulation",
            "total_questions": len(results),
            "passed": sum(1 for r in results if r.get("passed", False)),
            "average_confidence": sum(r.get("confidence", 0) for r in results) / len(results) if results else 0,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _evaluate_baseline_response(self, question: Dict, response: str) -> Dict[str, Any]:
        """Evaluate baseline response quality"""
        try:
            # Simple evaluation criteria
            expected_keywords = question.get("keywords", [])
            response_lower = response.lower()
            
            keyword_matches = sum(1 for keyword in expected_keywords if keyword.lower() in response_lower)
            keyword_score = keyword_matches / len(expected_keywords) if expected_keywords else 0.5
            
            # Check for formulation-specific content
            formulation_terms = ["cannabinoid", "terpene", "extraction", "molecular", "concentration", "dosage"]
            formulation_score = sum(1 for term in formulation_terms if term in response_lower) / len(formulation_terms)
            
            # Length check (reasonable response length)
            length_score = min(len(response) / 200, 1.0)  # Optimal around 200 chars
            
            overall_score = (keyword_score * 0.4 + formulation_score * 0.4 + length_score * 0.2)
            
            return {
                "passed": overall_score >= 0.6,
                "confidence": overall_score,
                "keyword_matches": keyword_matches,
                "total_keywords": len(expected_keywords),
                "formulation_relevance": formulation_score,
                "response_length": len(response)
            }
            
        except Exception as e:
            return {
                "passed": False,
                "confidence": 0.0,
                "error": str(e)
            }

def create_formulation_agent(agent_path: str = ".") -> FormulationAgent:
    """Create and return a configured formulation agent"""
    return FormulationAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_formulation_agent()
        
        # Test query
        result = await agent.process_query(
            user_id="test_user",
            query="What's the best extraction method for preserving terpenes in a high-CBD strain?"
        )
        
        print("Agent Response:")
        print(result["response"])
        
        # Run baseline test
        baseline_results = await agent.run_baseline_test()
        print(f"\nBaseline Test Results: {baseline_results['passed']}/{baseline_results['total_questions']} passed")
    
    asyncio.run(main())