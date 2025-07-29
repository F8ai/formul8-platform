"""
FormulationAgentAgent with LangChain, RAG, and Memory Support
"""

import os
import json
from typing import Dict, List, Any
from datetime import datetime

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.tools import BaseTool, Tool
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate

class FormulationAgentAgent:
    """
    Molecular analysis and cannabis formulation design
    Specializes in Cannabis Formulation & Chemistry
    """
    
    def __init__(self, agent_path: str = "."):
        self.agent_path = agent_path
        self.user_memories = {}
        
        self._initialize_llm()
        self._initialize_retriever()
        self._initialize_tools()
        self._initialize_agent()
    
    def _initialize_llm(self):
        """Initialize language model"""
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.1,
            max_tokens=2000
        )
    
    def _initialize_retriever(self):
        """Initialize RAG retriever"""
        try:
            vectorstore_path = os.path.join(self.agent_path, "rag", "vectorstore")
            if os.path.exists(vectorstore_path):
                embeddings = OpenAIEmbeddings()
                self.vectorstore = FAISS.load_local(vectorstore_path, embeddings)
                self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
            else:
                self.retriever = None
        except Exception as e:
            print(f"Error loading vectorstore: {e}")
            self.retriever = None
    
    def _initialize_tools(self):
        """Initialize agent tools"""
        self.tools = []
        
        if self.retriever:
            self.tools.append(self._create_rag_tool())
        
        # Add agent-specific tools
        for tool_name in ["molecular_analysis","cannabinoid_analysis","extraction_recommendation"]:
            self.tools.append(self._create_tool(tool_name))
    
    def _create_rag_tool(self):
        """Create RAG search tool"""
        def rag_search(query: str) -> str:
            try:
                docs = self.retriever.get_relevant_documents(query)
                context = "\n\n".join([doc.page_content for doc in docs])
                return f"Relevant information: {context}"
            except Exception as e:
                return f"Error searching knowledge base: {str(e)}"
        
        return Tool(
            name="rag_search",
            description=f"Search {config.domain} knowledge base for relevant information",
            func=rag_search
        )
    
    def _create_tool(self, tool_name: str):
        """Create a tool dynamically"""
        def tool_func(query: str) -> str:
            return f"{tool_name.replace('_', ' ').title()} result for: {query}"
        
        return Tool(
            name=tool_name,
            description=f"{tool_name.replace('_', ' ').title()} for specialized analysis",
            func=tool_func
        )
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are a specialized AI agent for {config.description}.
            
Domain Expertise: Cannabis Formulation & Chemistry
            
Provide expert guidance, analysis, and recommendations in this domain.
Use available tools to gather information and provide comprehensive responses.
Always cite sources and provide confidence scores.

Available tools: {[tool.name for tool in self.tools]}
"""),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        
        agent = create_openai_tools_agent(self.llm, self.tools, prompt)
        self.agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)
    
    def _get_user_memory(self, user_id: str) -> ConversationBufferWindowMemory:
        """Get or create memory for user"""
        if user_id not in self.user_memories:
            self.user_memories[user_id] = ConversationBufferWindowMemory(
                k=10, return_messages=True
            )
        return self.user_memories[user_id]
    
    async def process_query(self, user_id: str, query: str, context: Dict = None) -> Dict[str, Any]:
        """Process a user query with memory and context"""
        try:
            memory = self._get_user_memory(user_id)
            
            enhanced_query = f"Context: {context}\n\nQuery: {query}" if context else query
            
            result = await self.agent_executor.ainvoke({
                "input": enhanced_query,
                "chat_history": memory.chat_memory.messages
            })
            
            confidence = self._calculate_confidence(result.get("output", ""))
            memory.save_context({"input": query}, {"output": result["output"]})
            
            return {
                "response": result["output"],
                "confidence": confidence,
                "timestamp": datetime.now().isoformat(),
                "agent": "formulation-agent",
                "user_id": user_id
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "response": f"Error processing query: {str(e)}",
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "agent": "formulation-agent",
                "user_id": user_id
            }
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score for response"""
        if not response or len(response) < 50:
            return 0.3
        
        indicators = [
            "research shows" in response.lower(),
            "studies indicate" in response.lower(),
            "according to" in response.lower(),
            len(response) > 200,
            "recommendation" in response.lower()
        ]
        
        base_confidence = sum(indicators) / len(indicators)
        return min(0.95, max(0.4, base_confidence))
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        if user_id in self.user_memories:
            del self.user_memories[user_id]

def create_formulation_agent(agent_path: str = ".") -> FormulationAgentAgent:
    """Create and return a configured formulation-agent"""
    return FormulationAgentAgent(agent_path)

if __name__ == "__main__":
    import asyncio
    
    async def main():
        agent = create_formulation_agent()
        result = await agent.process_query(
            user_id="test_user",
            query="Provide analysis of current cannabis formulation & chemistry requirements"
        )
        print(f"Response: {result['response']}")
        print(f"Confidence: {result['confidence']}")

    asyncio.run(main())
