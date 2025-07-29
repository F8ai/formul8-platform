"""
Science Agent with LangChain, PubMed Integration, and Memory Support
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
class EvidenceAnalysis:
    study_type: str
    sample_size: int
    evidence_quality: str
    findings: List[str]
    limitations: List[str]
    clinical_relevance: str
    citation_count: int
    publication_date: str

class ScienceAgent:
    """
    Cannabis Science Agent with PubMed Integration, Evidence Analysis, and Memory
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
        
        # PubMed literature search
        tools.append(Tool(
            name="pubmed_literature_search",
            description="Search PubMed for cannabis-related scientific literature",
            func=self._pubmed_search
        ))
        
        # Evidence quality assessment
        tools.append(Tool(
            name="evidence_quality_assessment",
            description="Assess the quality and strength of scientific evidence",
            func=self._assess_evidence_quality
        ))
        
        # Research trend analysis
        tools.append(Tool(
            name="research_trend_analysis",
            description="Analyze research trends and publication patterns",
            func=self._analyze_research_trends
        ))
        
        # Scientific claim validation
        tools.append(Tool(
            name="scientific_claim_validation",
            description="Validate scientific claims against peer-reviewed evidence",
            func=self._validate_scientific_claim
        ))
        
        # Meta-analysis synthesis
        tools.append(Tool(
            name="meta_analysis_synthesis",
            description="Synthesize findings from multiple studies",
            func=self._synthesize_meta_analysis
        ))
        
        # RAG search tool
        if self.retriever:
            tools.append(Tool(
                name="scientific_knowledge_search",
                description="Search scientific knowledge base for research findings",
                func=self._rag_search
            ))
        
        # RDF SPARQL query tool
        if self.rdf_kb and self.sparql_generator:
            tools.append(Tool(
                name="structured_science_query",
                description="Query structured scientific knowledge using natural language",
                func=self._sparql_query
            ))
        
        self.tools = tools
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert cannabis research scientist with deep knowledge of:
            - Cannabis pharmacology and biochemistry
            - Clinical research methodologies
            - Evidence-based medicine principles
            - PubMed literature analysis
            - Research quality assessment
            - Statistical analysis and meta-analysis
            
            Use the available tools to provide scientifically accurate, evidence-based responses.
            Always cite peer-reviewed sources and assess evidence quality.
            Distinguish between preliminary and established findings.
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
    
    def _pubmed_search(self, query: str) -> str:
        """Search PubMed for cannabis-related scientific literature"""
        try:
            # Simulated PubMed search results
            search_results = {
                "total_results": 1247,
                "search_query": query,
                "top_results": [
                    {
                        "pmid": "35123456",
                        "title": "Cannabidiol for treatment-resistant epilepsy: A systematic review",
                        "authors": "Smith J, Johnson A, Williams B",
                        "journal": "Epilepsia",
                        "year": 2023,
                        "abstract": "Background: CBD has shown promise in treating epilepsy. Methods: Systematic review of 15 RCTs...",
                        "study_type": "systematic_review",
                        "evidence_level": "high"
                    },
                    {
                        "pmid": "34987654",
                        "title": "Effects of THC on chronic pain: A randomized controlled trial",
                        "authors": "Brown M, Davis C, Wilson R",
                        "journal": "Pain Medicine",
                        "year": 2023,
                        "abstract": "Objective: To evaluate THC efficacy for chronic pain. Design: Double-blind RCT...",
                        "study_type": "randomized_controlled_trial",
                        "evidence_level": "high"
                    },
                    {
                        "pmid": "33876543",
                        "title": "Cannabis terpenes and the entourage effect: A review",
                        "authors": "Green K, Taylor L, Anderson P",
                        "journal": "Frontiers in Plant Science",
                        "year": 2022,
                        "abstract": "The entourage effect suggests synergistic interactions between cannabis compounds...",
                        "study_type": "narrative_review",
                        "evidence_level": "moderate"
                    }
                ]
            }
            
            # Add query-specific results
            query_lower = query.lower()
            if "cbd" in query_lower and "epilepsy" in query_lower:
                search_results["focused_findings"] = [
                    "CBD significantly reduced seizure frequency in treatment-resistant epilepsy",
                    "Epidiolex (pharmaceutical CBD) approved by FDA for specific epilepsy syndromes",
                    "Most common side effects: drowsiness, elevated liver enzymes"
                ]
            
            if "thc" in query_lower and "pain" in query_lower:
                search_results["focused_findings"] = [
                    "THC showed modest efficacy for neuropathic pain",
                    "Risk-benefit ratio varies by individual patient factors",
                    "Psychoactive effects limit therapeutic window"
                ]
            
            return json.dumps(search_results, indent=2)
            
        except Exception as e:
            return f"PubMed search error: {str(e)}"
    
    def _assess_evidence_quality(self, study_description: str) -> str:
        """Assess the quality and strength of scientific evidence"""
        try:
            description_lower = study_description.lower()
            
            evidence_assessment = {
                "study_type": "",
                "evidence_level": "",
                "quality_score": 0,
                "strengths": [],
                "limitations": [],
                "bias_risk": "",
                "clinical_applicability": ""
            }
            
            # Determine study type and evidence level
            if "systematic review" in description_lower or "meta-analysis" in description_lower:
                evidence_assessment["study_type"] = "Systematic Review/Meta-analysis"
                evidence_assessment["evidence_level"] = "Very High"
                evidence_assessment["quality_score"] = 9
            elif "randomized controlled trial" in description_lower or "rct" in description_lower:
                evidence_assessment["study_type"] = "Randomized Controlled Trial"
                evidence_assessment["evidence_level"] = "High"
                evidence_assessment["quality_score"] = 8
            elif "cohort study" in description_lower:
                evidence_assessment["study_type"] = "Cohort Study"
                evidence_assessment["evidence_level"] = "Moderate"
                evidence_assessment["quality_score"] = 6
            elif "case-control" in description_lower:
                evidence_assessment["study_type"] = "Case-Control Study"
                evidence_assessment["evidence_level"] = "Moderate"
                evidence_assessment["quality_score"] = 5
            elif "cross-sectional" in description_lower:
                evidence_assessment["study_type"] = "Cross-sectional Study"
                evidence_assessment["evidence_level"] = "Low"
                evidence_assessment["quality_score"] = 4
            else:
                evidence_assessment["study_type"] = "Other/Unclear"
                evidence_assessment["evidence_level"] = "Very Low"
                evidence_assessment["quality_score"] = 3
            
            # Assess bias risk
            if "double-blind" in description_lower and "placebo" in description_lower:
                evidence_assessment["bias_risk"] = "Low"
                evidence_assessment["strengths"].append("Double-blind placebo-controlled design")
            elif "single-blind" in description_lower:
                evidence_assessment["bias_risk"] = "Moderate"
                evidence_assessment["limitations"].append("Single-blind design may introduce bias")
            else:
                evidence_assessment["bias_risk"] = "High"
                evidence_assessment["limitations"].append("Open-label design increases bias risk")
            
            # Clinical applicability
            if "clinical trial" in description_lower:
                evidence_assessment["clinical_applicability"] = "High - direct clinical evidence"
            elif "animal study" in description_lower or "in vitro" in description_lower:
                evidence_assessment["clinical_applicability"] = "Low - preclinical evidence only"
            else:
                evidence_assessment["clinical_applicability"] = "Moderate - observational evidence"
            
            return json.dumps(evidence_assessment, indent=2)
            
        except Exception as e:
            return f"Evidence assessment error: {str(e)}"
    
    def _analyze_research_trends(self, topic: str) -> str:
        """Analyze research trends and publication patterns"""
        try:
            # Simulated research trend analysis
            trend_analysis = {
                "topic": topic,
                "publication_trends": {
                    "2020": 234,
                    "2021": 312,
                    "2022": 445,
                    "2023": 567,
                    "2024": 398  # Partial year
                },
                "research_focus_areas": [
                    {"area": "Clinical Applications", "percentage": 45, "growth": "+23%"},
                    {"area": "Pharmacology", "percentage": 30, "growth": "+15%"},
                    {"area": "Safety Studies", "percentage": 15, "growth": "+35%"},
                    {"area": "Cultivation/Chemistry", "percentage": 10, "growth": "+8%"}
                ],
                "emerging_topics": [
                    "Minor cannabinoids (CBG, CBN, CBC)",
                    "Cannabis and sleep disorders",
                    "Pediatric cannabis applications",
                    "Cannabis-drug interactions"
                ],
                "research_gaps": [
                    "Long-term safety studies",
                    "Standardized dosing protocols",
                    "Optimal delivery methods",
                    "Personalized medicine approaches"
                ],
                "geographical_distribution": {
                    "North America": "52%",
                    "Europe": "28%",
                    "Australia/NZ": "12%",
                    "Other": "8%"
                }
            }
            
            return json.dumps(trend_analysis, indent=2)
            
        except Exception as e:
            return f"Research trend analysis error: {str(e)}"
    
    def _validate_scientific_claim(self, claim: str) -> str:
        """Validate scientific claims against peer-reviewed evidence"""
        try:
            claim_lower = claim.lower()
            
            validation_result = {
                "claim": claim,
                "evidence_status": "",
                "confidence_level": "",
                "supporting_studies": [],
                "contradicting_studies": [],
                "evidence_summary": "",
                "clinical_significance": "",
                "recommendations": []
            }
            
            # Analyze specific claims
            if "cbd" in claim_lower and "epilepsy" in claim_lower:
                validation_result.update({
                    "evidence_status": "Strong Evidence",
                    "confidence_level": "High",
                    "supporting_studies": ["Epidiolex trials", "Cochrane systematic review"],
                    "evidence_summary": "Multiple high-quality RCTs demonstrate CBD efficacy for treatment-resistant epilepsy",
                    "clinical_significance": "FDA-approved indication with established efficacy",
                    "recommendations": ["Consider as adjunct therapy", "Monitor liver function", "Start with low doses"]
                })
            
            elif "thc" in claim_lower and "cancer" in claim_lower:
                validation_result.update({
                    "evidence_status": "Limited Evidence",
                    "confidence_level": "Low",
                    "supporting_studies": ["Preclinical studies", "Case reports"],
                    "contradicting_studies": ["Limited clinical trials"],
                    "evidence_summary": "Preclinical evidence promising but clinical data insufficient",
                    "clinical_significance": "Research stage - not established therapy",
                    "recommendations": ["More research needed", "Not recommended as primary treatment"]
                })
            
            elif "cannabis" in claim_lower and "addiction" in claim_lower:
                validation_result.update({
                    "evidence_status": "Mixed Evidence",
                    "confidence_level": "Moderate",
                    "supporting_studies": ["Observational studies showing dependence risk"],
                    "contradicting_studies": ["Studies showing low addiction potential vs other substances"],
                    "evidence_summary": "Risk exists but lower than many other substances",
                    "clinical_significance": "Important consideration for clinical use",
                    "recommendations": ["Screen for addiction risk", "Monitor for dependence", "Use lowest effective dose"]
                })
            
            else:
                validation_result.update({
                    "evidence_status": "Insufficient Data",
                    "confidence_level": "Very Low",
                    "evidence_summary": "Limited peer-reviewed evidence available",
                    "recommendations": ["Requires systematic literature review", "Consider consulting recent meta-analyses"]
                })
            
            return json.dumps(validation_result, indent=2)
            
        except Exception as e:
            return f"Claim validation error: {str(e)}"
    
    def _synthesize_meta_analysis(self, studies_description: str) -> str:
        """Synthesize findings from multiple studies"""
        try:
            # Simulated meta-analysis synthesis
            synthesis = {
                "analysis_type": "Meta-analysis Synthesis",
                "included_studies": 12,
                "total_participants": 2847,
                "primary_outcomes": {
                    "efficacy": {
                        "effect_size": 0.68,
                        "confidence_interval": "0.42-0.94",
                        "p_value": 0.003,
                        "interpretation": "Moderate to large effect"
                    },
                    "safety": {
                        "adverse_events": "15.3%",
                        "serious_adverse_events": "2.1%",
                        "discontinuation_rate": "8.7%"
                    }
                },
                "heterogeneity": {
                    "i_squared": 67,
                    "interpretation": "Moderate heterogeneity between studies"
                },
                "subgroup_analyses": [
                    {"subgroup": "Dosage", "finding": "Higher doses more effective but increased side effects"},
                    {"subgroup": "Duration", "finding": "Benefits plateau after 8 weeks"},
                    {"subgroup": "Age", "finding": "Similar efficacy across age groups"}
                ],
                "limitations": [
                    "Short-term studies only",
                    "Variable outcome measures",
                    "Limited diversity in study populations"
                ],
                "clinical_implications": [
                    "Evidence supports therapeutic use with monitoring",
                    "Individual response varies significantly",
                    "Long-term studies needed"
                ]
            }
            
            return json.dumps(synthesis, indent=2)
            
        except Exception as e:
            return f"Meta-analysis synthesis error: {str(e)}"
    
    def _rag_search(self, query: str) -> str:
        """Search scientific knowledge base using RAG"""
        if not self.retriever:
            return "RAG retrieval not available"
        
        try:
            docs = self.retriever.get_relevant_documents(query)
            if not docs:
                return "No relevant scientific information found"
            
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
                domain="science"
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
                "response": f"I encountered an error processing your science query: {str(e)}",
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
            "agent_type": "science",
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
            
            # Check for science-specific content
            science_terms = ["study", "research", "evidence", "clinical", "trial", "analysis"]
            science_score = sum(1 for term in science_terms if term in response_lower) / len(science_terms)
            
            length_score = min(len(response) / 200, 1.0)
            
            overall_score = (keyword_score * 0.4 + science_score * 0.4 + length_score * 0.2)
            
            return {
                "passed": overall_score >= 0.6,
                "confidence": overall_score,
                "keyword_matches": keyword_matches,
                "total_keywords": len(expected_keywords),
                "science_relevance": science_score,
                "response_length": len(response)
            }
            
        except Exception as e:
            return {
                "passed": False,
                "confidence": 0.0,
                "error": str(e)
            }

def create_science_agent(agent_path: str = ".") -> ScienceAgent:
    """Create and return a configured science agent"""
    return ScienceAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_science_agent()
        
        result = await agent.process_query(
            user_id="test_user",
            query="What does the research say about CBD for treating epilepsy?"
        )
        
        print("Agent Response:")
        print(result["response"])
        
        baseline_results = await agent.run_baseline_test()
        print(f"\nBaseline Test Results: {baseline_results['passed']}/{baseline_results['total_questions']} passed")
    
    asyncio.run(main())