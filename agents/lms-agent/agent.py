"""
LMS (Learning Management System) Agent with LangChain, RAG, and Memory Support
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
class TrainingModule:
    """Training Module Structure"""
    module_id: str
    title: str
    description: str
    difficulty_level: str  # BEGINNER, INTERMEDIATE, ADVANCED
    duration_hours: float
    topics: List[str]
    prerequisites: List[str]
    learning_objectives: List[str]
    assessment_criteria: List[str]
    compliance_requirements: List[str]

@dataclass
class LearningPath:
    """Learning Path Structure"""
    path_id: str
    title: str
    description: str
    target_role: str
    estimated_duration: str
    modules: List[TrainingModule]
    certification_available: bool
    regulatory_compliance: List[str]

class LMSAgent:
    """
    Cannabis Learning Management System Agent
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
        
        # Initialize training content
        self._initialize_training_content()
    
    def _initialize_llm(self):
        """Initialize language model"""
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,
            max_tokens=2000
        )
    
    def _initialize_retriever(self):
        """Initialize RAG retriever with AstraDB"""
        try:
            from shared.astradb_vector_store import AstraDBVectorStore
            
            # Initialize AstraDB vector store for LMS agent
            self.vector_store = AstraDBVectorStore(
                collection_name="cannabis_lms_vectors",
                agent_type="lms"
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
                name="create_training_module",
                description="Create custom training modules for cannabis operations",
                func=self._create_training_module
            ),
            Tool(
                name="assess_learning_needs",
                description="Assess employee training needs and skill gaps",
                func=self._assess_learning_needs
            ),
            Tool(
                name="track_progress",
                description="Track employee learning progress and completion",
                func=self._track_progress
            ),
            Tool(
                name="compliance_training",
                description="Generate compliance-specific training content",
                func=self._compliance_training
            ),
            Tool(
                name="skill_certification",
                description="Manage skill certifications and assessments",
                func=self._skill_certification
            ),
            Tool(
                name="onboarding_program",
                description="Create comprehensive onboarding programs",
                func=self._onboarding_program
            ),
            Tool(
                name="upskilling_recommendations",
                description="Provide upskilling recommendations based on role and performance",
                func=self._upskilling_recommendations
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
    
    def _initialize_training_content(self):
        """Initialize default training content"""
        self.learning_paths = {
            "new_hire": LearningPath(
                path_id="new_hire_001",
                title="New Employee Onboarding",
                description="Comprehensive onboarding for cannabis industry newcomers",
                target_role="All Employees",
                estimated_duration="40 hours",
                modules=[],
                certification_available=True,
                regulatory_compliance=["State Cannabis Laws", "Safety Protocols", "GMP Standards"]
            ),
            "cultivation": LearningPath(
                path_id="cultivation_001",
                title="Cannabis Cultivation Mastery",
                description="Advanced cultivation techniques and best practices",
                target_role="Cultivation Team",
                estimated_duration="80 hours",
                modules=[],
                certification_available=True,
                regulatory_compliance=["Cultivation Regulations", "Pesticide Use", "Quality Control"]
            ),
            "extraction": LearningPath(
                path_id="extraction_001",
                title="Cannabis Extraction & Processing",
                description="Extraction methods, safety, and quality control",
                target_role="Extraction Team",
                estimated_duration="60 hours",
                modules=[],
                certification_available=True,
                regulatory_compliance=["Extraction Safety", "Solvent Handling", "Product Testing"]
            ),
            "management": LearningPath(
                path_id="management_001",
                title="Cannabis Operations Management",
                description="Leadership and operational excellence in cannabis",
                target_role="Management",
                estimated_duration="50 hours",
                modules=[],
                certification_available=True,
                regulatory_compliance=["Regulatory Compliance", "Team Management", "Quality Assurance"]
            )
        }
    
    def _create_training_module(self, query: str) -> str:
        """Create custom training modules"""
        try:
            if self.retriever:
                docs = self.retriever.get_relevant_documents(f"training module: {query}")
                context = "\n".join([doc.page_content for doc in docs])
            else:
                context = "Training module creation functionality"
            
            # Parse requirements from query
            module_data = {
                "module_id": f"custom_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "title": f"Custom Training: {query}",
                "description": f"Custom training module for {query}",
                "difficulty_level": "INTERMEDIATE",
                "duration_hours": 4.0,
                "topics": [
                    "Cannabis regulations and compliance",
                    "Safety protocols and procedures",
                    "Quality control standards",
                    "Best practices implementation"
                ],
                "prerequisites": ["Basic cannabis knowledge", "Safety orientation"],
                "learning_objectives": [
                    "Understand regulatory requirements",
                    "Implement safety protocols",
                    "Apply quality control measures",
                    "Demonstrate competency in assigned tasks"
                ],
                "assessment_criteria": [
                    "Written examination (80% passing)",
                    "Practical demonstration",
                    "Compliance checklist completion"
                ],
                "compliance_requirements": [
                    "State cannabis regulations",
                    "Federal safety standards",
                    "Industry best practices"
                ],
                "context": context
            }
            
            return json.dumps(module_data, indent=2)
        except Exception as e:
            logger.error(f"Training module creation failed: {e}")
            return f"Training module creation error: {e}"
    
    def _assess_learning_needs(self, query: str) -> str:
        """Assess employee training needs"""
        try:
            assessment = {
                "assessment_id": f"needs_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "employee_role": query,
                "skill_gaps": [
                    "Regulatory compliance knowledge",
                    "Safety protocol implementation",
                    "Quality control procedures",
                    "Equipment operation proficiency"
                ],
                "priority_areas": [
                    "Compliance training (HIGH)",
                    "Safety protocols (HIGH)",
                    "Technical skills (MEDIUM)",
                    "Soft skills (LOW)"
                ],
                "recommended_training": [
                    "Cannabis regulations overview",
                    "Safety and emergency procedures",
                    "Quality assurance protocols",
                    "Communication and teamwork"
                ],
                "estimated_training_hours": 25,
                "completion_timeline": "4-6 weeks",
                "certification_requirements": [
                    "State cannabis worker permit",
                    "Safety certification",
                    "Role-specific competency certification"
                ]
            }
            
            return json.dumps(assessment, indent=2)
        except Exception as e:
            logger.error(f"Learning needs assessment failed: {e}")
            return f"Learning needs assessment error: {e}"
    
    def _track_progress(self, query: str) -> str:
        """Track employee learning progress"""
        try:
            progress = {
                "employee_id": query,
                "current_modules": [
                    {
                        "module": "Cannabis Regulations 101",
                        "progress": "85%",
                        "status": "In Progress",
                        "due_date": "2025-01-25"
                    },
                    {
                        "module": "Safety Protocols",
                        "progress": "100%",
                        "status": "Completed",
                        "completion_date": "2025-01-15"
                    }
                ],
                "completed_modules": 3,
                "total_modules": 8,
                "overall_progress": "62%",
                "certifications_earned": [
                    "Basic Safety Certification",
                    "Cannabis Worker Permit"
                ],
                "upcoming_deadlines": [
                    "Quality Control Assessment - Due: 2025-01-30",
                    "Compliance Quiz - Due: 2025-02-05"
                ],
                "performance_metrics": {
                    "average_quiz_score": "87%",
                    "module_completion_rate": "95%",
                    "time_to_completion": "Within target"
                }
            }
            
            return json.dumps(progress, indent=2)
        except Exception as e:
            logger.error(f"Progress tracking failed: {e}")
            return f"Progress tracking error: {e}"
    
    def _compliance_training(self, query: str) -> str:
        """Generate compliance-specific training content"""
        try:
            if self.retriever:
                docs = self.retriever.get_relevant_documents(f"compliance training: {query}")
                context = "\n".join([doc.page_content for doc in docs])
            else:
                context = "Compliance training functionality"
            
            training_content = {
                "training_type": "Compliance Training",
                "topic": query,
                "regulatory_framework": [
                    "State cannabis regulations",
                    "Federal compliance requirements",
                    "Local municipal laws",
                    "Industry standards"
                ],
                "key_learning_points": [
                    "Legal requirements and obligations",
                    "Documentation and record keeping",
                    "Audit preparation procedures",
                    "Violation consequences and prevention"
                ],
                "practical_exercises": [
                    "Compliance checklist completion",
                    "Regulation interpretation scenarios",
                    "Documentation review exercises",
                    "Mock audit simulations"
                ],
                "assessment_methods": [
                    "Regulatory knowledge test",
                    "Compliance scenario analysis",
                    "Documentation accuracy review",
                    "Practical demonstration"
                ],
                "update_frequency": "Monthly",
                "mandatory_refresh": "Annually",
                "context": context
            }
            
            return json.dumps(training_content, indent=2)
        except Exception as e:
            logger.error(f"Compliance training failed: {e}")
            return f"Compliance training error: {e}"
    
    def _skill_certification(self, query: str) -> str:
        """Manage skill certifications"""
        try:
            certification = {
                "certification_name": f"{query} Certification",
                "certification_id": f"cert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "requirements": [
                    "Complete required training modules",
                    "Pass written examination (80% minimum)",
                    "Demonstrate practical skills",
                    "Maintain continuing education credits"
                ],
                "assessment_components": [
                    "Written exam (40%)",
                    "Practical demonstration (40%)",
                    "Project or case study (20%)"
                ],
                "validity_period": "2 years",
                "renewal_requirements": [
                    "20 hours continuing education",
                    "Refresher training completion",
                    "Performance review"
                ],
                "industry_recognition": "State-approved certification",
                "career_advancement": [
                    "Salary increase eligibility",
                    "Promotion opportunities",
                    "Specialization pathways"
                ]
            }
            
            return json.dumps(certification, indent=2)
        except Exception as e:
            logger.error(f"Skill certification failed: {e}")
            return f"Skill certification error: {e}"
    
    def _onboarding_program(self, query: str) -> str:
        """Create comprehensive onboarding programs"""
        try:
            onboarding = {
                "program_name": f"Onboarding Program: {query}",
                "duration": "4 weeks",
                "phase_breakdown": {
                    "week_1": {
                        "focus": "Company orientation and compliance",
                        "activities": [
                            "Company culture and values",
                            "Cannabis industry overview",
                            "Safety protocols training",
                            "Compliance requirements"
                        ]
                    },
                    "week_2": {
                        "focus": "Role-specific training",
                        "activities": [
                            "Job-specific procedures",
                            "Equipment familiarization",
                            "Quality standards",
                            "Documentation requirements"
                        ]
                    },
                    "week_3": {
                        "focus": "Hands-on practice",
                        "activities": [
                            "Supervised task execution",
                            "Skill development exercises",
                            "Problem-solving scenarios",
                            "Team collaboration"
                        ]
                    },
                    "week_4": {
                        "focus": "Assessment and integration",
                        "activities": [
                            "Competency assessments",
                            "Performance evaluations",
                            "Feedback sessions",
                            "Career development planning"
                        ]
                    }
                },
                "success_metrics": [
                    "Knowledge retention rate",
                    "Skill proficiency level",
                    "Compliance understanding",
                    "Cultural integration"
                ],
                "support_resources": [
                    "Mentor assignment",
                    "Resource library access",
                    "Help desk support",
                    "Peer learning groups"
                ]
            }
            
            return json.dumps(onboarding, indent=2)
        except Exception as e:
            logger.error(f"Onboarding program creation failed: {e}")
            return f"Onboarding program error: {e}"
    
    def _upskilling_recommendations(self, query: str) -> str:
        """Provide upskilling recommendations"""
        try:
            recommendations = {
                "employee_profile": query,
                "current_skill_level": "Intermediate",
                "growth_opportunities": [
                    "Advanced cultivation techniques",
                    "Extraction method optimization",
                    "Quality control leadership",
                    "Regulatory compliance expertise"
                ],
                "recommended_courses": [
                    {
                        "course": "Advanced Cannabis Chemistry",
                        "duration": "20 hours",
                        "priority": "HIGH",
                        "benefit": "Enhanced product development skills"
                    },
                    {
                        "course": "Leadership in Cannabis Operations",
                        "duration": "15 hours",
                        "priority": "MEDIUM",
                        "benefit": "Career advancement preparation"
                    },
                    {
                        "course": "Emerging Technologies in Cannabis",
                        "duration": "10 hours",
                        "priority": "MEDIUM",
                        "benefit": "Industry trend awareness"
                    }
                ],
                "career_pathways": [
                    "Senior Cultivation Specialist",
                    "Operations Manager",
                    "Quality Assurance Director",
                    "Compliance Officer"
                ],
                "timeline": "6-12 months",
                "roi_projection": "25-40% salary increase potential"
            }
            
            return json.dumps(recommendations, indent=2)
        except Exception as e:
            logger.error(f"Upskilling recommendations failed: {e}")
            return f"Upskilling recommendations error: {e}"
    
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
                "agent_type": "lms",
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
                "agent_type": "lms",
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
            "agent_type": "lms",
            "total_questions": len(questions),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _evaluate_baseline_response(self, question: Dict, response: str) -> Dict[str, Any]:
        """Evaluate baseline response quality"""
        try:
            # Use LLM to evaluate response quality
            evaluation_prompt = f"""
            Evaluate this LMS agent response:
            
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

def create_lms_agent(agent_path: str = ".") -> LMSAgent:
    """Create and return a configured LMS agent"""
    return LMSAgent(agent_path)

if __name__ == "__main__":
    async def main():
        agent = create_lms_agent()
        
        # Test query
        test_query = "Create a comprehensive onboarding program for new cannabis cultivation employees"
        result = await agent.process_query("test_user", test_query)
        
        print("LMS Agent Response:")
        print(json.dumps(result, indent=2))
        
        # Run baseline test
        baseline_result = await agent.run_baseline_test()
        print("\nBaseline Test Results:")
        print(json.dumps(baseline_result, indent=2))
    
    asyncio.run(main())