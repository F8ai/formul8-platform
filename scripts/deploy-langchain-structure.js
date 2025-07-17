#!/usr/bin/env node

/**
 * Deploy LangChain directory structure to agent repositories
 */

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

const F8AI_ORG = 'F8ai';
const agents = [
  'compliance-agent',
  'formulation-agent', 
  'marketing-agent',
  'operations-agent'
];

// Agent configurations
const agentConfigs = {
  'compliance-agent': {
    description: 'Cannabis regulatory compliance and legal guidance',
    domain: 'Cannabis Regulatory Compliance',
    tools: ['regulatory_search', 'compliance_check', 'state_requirements']
  },
  'formulation-agent': {
    description: 'Molecular analysis and cannabis formulation design',
    domain: 'Cannabis Formulation & Chemistry', 
    tools: ['molecular_analysis', 'cannabinoid_analysis', 'extraction_recommendation']
  },
  'marketing-agent': {
    description: 'Cannabis industry marketing and advertising compliance',
    domain: 'Cannabis Marketing Intelligence',
    tools: ['platform_analysis', 'content_strategy', 'compliance_check']
  },
  'operations-agent': {
    description: 'Business operations and workflow optimization',
    domain: 'Cannabis Operations Management',
    tools: ['workflow_optimization', 'inventory_management', 'quality_control']
  }
};

async function createOrUpdateFile(owner, repo, path, content, message) {
  try {
    let sha = null;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner, repo, path
      });
      if ('sha' in existingFile) sha = existingFile.sha;
    } catch (error) {
      // File doesn't exist
    }
    
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
    
    return true;
  } catch (error) {
    console.error(`Error creating ${path}:`, error.message);
    return false;
  }
}

function generateAgentPy(agentName, config) {
  const className = agentName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Agent';
  
  return `"""
${className} with LangChain, RAG, and Memory Support
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

class ${className}:
    """
    ${config.description}
    Specializes in ${config.domain}
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
        for tool_name in ${JSON.stringify(config.tools)}:
            self.tools.append(self._create_tool(tool_name))
    
    def _create_rag_tool(self):
        """Create RAG search tool"""
        def rag_search(query: str) -> str:
            try:
                docs = self.retriever.get_relevant_documents(query)
                context = "\\n\\n".join([doc.page_content for doc in docs])
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
            ("system", f\"\"\"You are a specialized AI agent for {config.description}.
            
Domain Expertise: ${config.domain}
            
Provide expert guidance, analysis, and recommendations in this domain.
Use available tools to gather information and provide comprehensive responses.
Always cite sources and provide confidence scores.

Available tools: {[tool.name for tool in self.tools]}
\"\"\"),
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
            
            enhanced_query = f"Context: {context}\\n\\nQuery: {query}" if context else query
            
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
                "agent": "${agentName}",
                "user_id": user_id
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "response": f"Error processing query: {str(e)}",
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "agent": "${agentName}",
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

def create_${agentName.replace('-', '_')}(agent_path: str = ".") -> ${className}:
    """Create and return a configured ${agentName}"""
    return ${className}(agent_path)

if __name__ == "__main__":
    import asyncio
    
    async def main():
        agent = create_${agentName.replace('-', '_')}()
        result = await agent.process_query(
            user_id="test_user",
            query="Provide analysis of current ${config.domain.toLowerCase()} requirements"
        )
        print(f"Response: {result['response']}")
        print(f"Confidence: {result['confidence']}")

    asyncio.run(main())
`;
}

async function setupAgent(agentName) {
  console.log(`Setting up ${agentName}...`);
  
  const config = agentConfigs[agentName];
  if (!config) {
    console.log(`No configuration found for ${agentName}`);
    return false;
  }
  
  const files = {
    'agent.py': generateAgentPy(agentName, config),
    'requirements.txt': `# ${agentName} Dependencies
openai>=1.0.0
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-community>=0.0.20
faiss-cpu>=1.7.4
python-dotenv>=1.0.0
pydantic>=2.0.0
tiktoken>=0.5.0
numpy>=1.24.0
`,
    'agent_config.yaml': `# ${agentName} Configuration
agent:
  name: "${agentName}"
  description: "${config.description}"
  domain: "${config.domain}"

llm:
  provider: "openai"
  model: "gpt-4o"
  temperature: 0.1
  max_tokens: 2000

rag:
  enabled: true
  vectorstore_type: "faiss"
  embedding_model: "text-embedding-ada-002"

tools:
${config.tools.map(tool => `  - name: "${tool}"`).join('\n')}
`,
    'rag/config.yaml': `# RAG Configuration
vectorstore:
  type: "faiss"
  embedding_model: "text-embedding-ada-002"
  
corpus:
  chunk_size: 1000
  chunk_overlap: 200
`,
    'rag/corpus.jsonl': `{"text": "Sample ${config.domain} content", "source": "training", "category": "knowledge"}`,
    'knowledge_base.ttl': `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix kb: <http://formul8.ai/ontology/${agentName}#> .

# ${config.domain} Knowledge Base
kb:Agent rdf:type owl:Class ;
    rdfs:label "${agentName}" ;
    rdfs:comment "${config.description}" .
`,
    'baseline.json': `{
  "agent": "${agentName}",
  "description": "Baseline tests for ${config.description}",
  "questions": [
    {
      "id": "q001",
      "question": "What are the key requirements for ${config.domain.toLowerCase()}?",
      "expected_answer": "Key requirements include...",
      "max_score": 10
    }
  ]
}`
  };
  
  let success = 0;
  for (const [filePath, content] of Object.entries(files)) {
    const result = await createOrUpdateFile(
      F8AI_ORG,
      agentName,
      filePath,
      content,
      `Setup LangChain structure: ${filePath}`
    );
    
    if (result) {
      success++;
      console.log(`  ✅ ${filePath}`);
    } else {
      console.log(`  ❌ ${filePath}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return success === Object.keys(files).length;
}

async function main() {
  console.log('🏗️ Setting up LangChain structure for agents...');
  
  if (!process.env.GITHUB_PAT) {
    console.error('❌ GITHUB_PAT required');
    process.exit(1);
  }
  
  let successful = 0;
  for (const agent of agents) {
    const success = await setupAgent(agent);
    if (success) successful++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Summary: ${successful}/${agents.length} agents updated`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}