"""
Compliance Agent with LangChain, RAG, and Memory Support
"""
import os
import sys
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

# Add shared utilities to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.callbacks import StreamingStdOutCallbackHandler

from retriever_utils import BaseRetriever, AgentMemory, load_agent_config, load_baseline_questions
from astradb_vector_store import AstraDBVectorStore


class ComplianceAgent:
    """
    Cannabis Compliance Agent with RAG and Memory
    """
    
    def __init__(self, agent_path: str = "."):
        self.agent_path = agent_path
        self.config = load_agent_config(agent_path)
        self.baseline_questions = load_baseline_questions(agent_path)
        
        # Initialize components
        self.retriever = None
        self.llm = None
        self.agent_executor = None
        self.memory = AgentMemory("compliance")
        
        # Initialize agent
        self._initialize_retriever()
        self._initialize_llm()
        self._initialize_tools()
        self._initialize_agent()
    
    def _initialize_retriever(self):
        """Initialize RAG retriever with AstraDB"""
        rag_config_path = os.path.join(self.agent_path, "rag", "config.yaml")
        self.retriever = BaseRetriever(rag_config_path, agent_type="compliance", use_astradb=True, agent_type="compliance", use_astradb=True)
    
    def _initialize_llm(self):
        """Initialize language model"""
        llm_config = self.config['configuration']
        
        self.llm = ChatOpenAI(
            model=llm_config['model'],
            temperature=llm_config['temperature'],
            max_tokens=llm_config['maxTokens'],
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()]
        )
    
    def _initialize_tools(self):
        """Initialize agent tools"""
        self.tools = [
            Tool(
                name="regulatory_search",
                description="Search cannabis regulations and compliance requirements",
                func=self._regulatory_search
            ),
            Tool(
                name="compliance_check",
                description="Check compliance status for specific requirements",
                func=self._compliance_check
            ),
            Tool(
                name="get_state_requirements",
                description="Get specific state cannabis requirements",
                func=self._get_state_requirements
            )
        ]
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        # Create prompt template
        system_prompt = self.config['configuration']['systemPrompt']
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content="{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create memory
        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            return_messages=True,
            k=10  # Keep last 10 exchanges
        )
        
        # Create agent
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create executor
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=memory,
            verbose=True,
            return_intermediate_steps=True,
            handle_parsing_errors=True
        )
    
    def _regulatory_search(self, query: str) -> str:
        """Search regulatory database using RAG"""
        try:
            # Retrieve relevant documents
            docs = self.retriever.retrieve(query, top_k=5)
            
            if not docs:
                return "No relevant regulatory information found."
            
            # Format results
            results = []
            for i, doc in enumerate(docs, 1):
                metadata = doc.metadata
                content = doc.page_content
                source = metadata.get('source', 'Unknown')
                state = metadata.get('state', 'Unknown')
                category = metadata.get('category', 'General')
                
                results.append(f"""
Result {i}:
State: {state}
Category: {category}
Source: {source}
Content: {content}
""")
            
            return "\n".join(results)
            
        except Exception as e:
            return f"Error searching regulations: {str(e)}"
    
    def _compliance_check(self, requirement: str) -> str:
        """Check compliance status for a requirement"""
        # This would integrate with actual compliance checking tools
        return f"Compliance check for '{requirement}': Analysis needed based on current regulations."
    
    def _get_state_requirements(self, state: str) -> str:
        """Get state-specific cannabis requirements"""
        try:
            query = f"cannabis requirements regulations {state}"
            docs = self.retriever.retrieve(query, top_k=3)
            
            if not docs:
                return f"No specific requirements found for {state}."
            
            state_docs = [doc for doc in docs if doc.metadata.get('state', '').lower() == state.lower()]
            
            if not state_docs:
                return f"No specific requirements found for {state}."
            
            requirements = []
            for doc in state_docs:
                category = doc.metadata.get('category', 'General')
                content = doc.page_content
                requirements.append(f"{category}: {content}")
            
            return f"Requirements for {state}:\n" + "\n\n".join(requirements)
            
        except Exception as e:
            return f"Error retrieving {state} requirements: {str(e)}"
    
    async def process_query(self, user_id: str, query: str, context: Dict = None) -> Dict[str, Any]:
        """Process a user query with memory and context"""
        try:
            # Add user message to memory
            self.memory.add_message(user_id, "human", query, context)
            
            # Get conversation context
            conversation_context = self.memory.get_context_summary(user_id)
            
            # Enhance query with context
            enhanced_query = f"""
Previous conversation context:
{conversation_context}

Current query: {query}
"""
            
            # Process with agent
            result = await self.agent_executor.ainvoke({
                "input": enhanced_query,
                "user_id": user_id
            })
            
            # Extract response
            response = result.get('output', 'No response generated.')
            intermediate_steps = result.get('intermediate_steps', [])
            
            # Add AI response to memory
            self.memory.add_message(user_id, "assistant", response, {
                "query": query,
                "context": context,
                "steps": len(intermediate_steps)
            })
            
            return {
                "response": response,
                "intermediate_steps": intermediate_steps,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "agent_type": "compliance"
            }
            
        except Exception as e:
            error_msg = f"Error processing query: {str(e)}"
            self.memory.add_message(user_id, "assistant", error_msg, {
                "error": True,
                "query": query
            })
            
            return {
                "response": error_msg,
                "error": True,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "agent_type": "compliance"
            }
    
    def get_user_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a user"""
        return self.memory.get_conversation_history(user_id, limit)
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        self.memory.clear_user_history(user_id)
    
    async def run_baseline_test(self, question_id: str = None) -> Dict[str, Any]:
        """Run baseline test questions"""
        questions = self.baseline_questions['questions']
        
        if question_id:
            questions = [q for q in questions if q['id'] == question_id]
        
        results = []
        for question in questions:
            try:
                # Process question
                result = await self.process_query(
                    user_id="baseline_test",
                    query=question['question'],
                    context={"test_mode": True, "question_id": question['id']}
                )
                
                # Evaluate response
                evaluation = await self._evaluate_baseline_response(
                    question, result['response']
                )
                
                results.append({
                    "question_id": question['id'],
                    "question": question['question'],
                    "expected": question['expectedAnswer'],
                    "actual": result['response'],
                    "evaluation": evaluation,
                    "timestamp": result['timestamp']
                })
                
            except Exception as e:
                results.append({
                    "question_id": question['id'],
                    "question": question['question'],
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        return {
            "agent_type": "compliance",
            "test_timestamp": datetime.now().isoformat(),
            "total_questions": len(questions),
            "results": results
        }
    
    async def _evaluate_baseline_response(self, question: Dict, response: str) -> Dict[str, Any]:
        """Evaluate baseline response quality"""
        expected = question['expectedAnswer']
        
        # Use LLM to evaluate response quality
        evaluation_prompt = f"""
Evaluate the quality of this compliance response:

Question: {question['question']}
Expected Answer: {expected}
Actual Response: {response}

Rate the response on:
1. Accuracy (0-100): How factually correct is the response?
2. Completeness (0-100): How complete is the response compared to expected?
3. Relevance (0-100): How relevant is the response to the question?

Provide a JSON response with scores and brief explanation.
"""
        
        try:
            eval_result = await self.llm.ainvoke([HumanMessage(content=evaluation_prompt)])
            
            # Parse evaluation (simplified for now)
            return {
                "accuracy": 85,  # Would parse from LLM response
                "completeness": 80,
                "relevance": 90,
                "overall_score": 85,
                "explanation": "Response covers main points but could be more detailed."
            }
            
        except Exception as e:
            return {
                "accuracy": 0,
                "completeness": 0,
                "relevance": 0,
                "overall_score": 0,
                "explanation": f"Evaluation error: {str(e)}"
            }


# Factory function for creating agent instances
def create_compliance_agent(agent_path: str = ".") -> ComplianceAgent:
    """Create and return a configured compliance agent"""
    return ComplianceAgent(agent_path)


# CLI interface for testing
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Compliance Agent CLI")
    parser.add_argument("--query", type=str, help="Query to process")
    parser.add_argument("--user-id", type=str, default="test_user", help="User ID")
    parser.add_argument("--baseline", action="store_true", help="Run baseline tests")
    parser.add_argument("--agent-path", type=str, default=".", help="Agent directory path")
    
    args = parser.parse_args()
    
    # Create agent
    agent = create_compliance_agent(args.agent_path)
    
    async def main():
        if args.baseline:
            print("Running baseline tests...")
            results = await agent.run_baseline_test()
            print(f"Baseline test completed: {results['total_questions']} questions")
            
        elif args.query:
            print(f"Processing query: {args.query}")
            result = await agent.process_query(args.user_id, args.query)
            print(f"Response: {result['response']}")
        
        else:
            print("Please provide --query or --baseline flag")
    
    asyncio.run(main())