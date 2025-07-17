#!/usr/bin/env node

/**
 * Setup proper LangChain directory structure for all agent repositories
 * Includes RAG, SPARQL/TTL, and baseline testing capabilities
 */

import { Octokit } from '@octokit/rest';
import { promises as fs } from 'fs';
import path from 'path';

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT
});

const F8AI_ORG = 'F8ai';

const agents = [
  'compliance-agent',
  'patent-agent', 
  'operations-agent',
  'formulation-agent',
  'sourcing-agent',
  'marketing-agent',
  'science-agent',
  'spectra-agent',
  'customer-success-agent'
];

// Generate agent-specific configuration
function getAgentConfig(agentName) {
  const configs = {
    'compliance-agent': {
      description: 'Cannabis regulatory compliance and legal guidance',
      domain: 'Cannabis Regulatory Compliance',
      tools: ['regulatory_search', 'compliance_check', 'state_requirements'],
      sparqlDomains: ['regulations', 'licenses', 'compliance_frameworks'],
      ragSources: ['state_regulations', 'federal_guidelines', 'compliance_docs']
    },
    'formulation-agent': {
      description: 'Molecular analysis and cannabis formulation design',
      domain: 'Cannabis Formulation & Chemistry',
      tools: ['molecular_analysis', 'cannabinoid_analysis', 'extraction_recommendation'],
      sparqlDomains: ['compounds', 'molecular_structures', 'extraction_methods'],
      ragSources: ['formulation_guides', 'chemistry_papers', 'extraction_protocols']
    },
    'marketing-agent': {
      description: 'Cannabis industry marketing and advertising compliance',
      domain: 'Cannabis Marketing Intelligence',
      tools: ['platform_analysis', 'content_strategy', 'compliance_check'],
      sparqlDomains: ['marketing_platforms', 'advertising_rules', 'content_guidelines'],
      ragSources: ['marketing_regulations', 'platform_policies', 'case_studies']
    },
    'operations-agent': {
      description: 'Business operations and workflow optimization',
      domain: 'Cannabis Operations Management',
      tools: ['workflow_optimization', 'inventory_management', 'quality_control'],
      sparqlDomains: ['business_processes', 'inventory_systems', 'quality_standards'],
      ragSources: ['sop_documents', 'best_practices', 'industry_standards']
    },
    'science-agent': {
      description: 'Scientific research and evidence analysis',
      domain: 'Cannabis Science & Research',
      tools: ['research_analysis', 'literature_search', 'evidence_validation'],
      sparqlDomains: ['research_papers', 'clinical_studies', 'scientific_evidence'],
      ragSources: ['pubmed_abstracts', 'research_databases', 'clinical_trials']
    },
    'patent-agent': {
      description: 'Intellectual property protection and patent analysis',
      domain: 'Cannabis IP & Patents',
      tools: ['patent_search', 'trademark_analysis', 'ip_strategy'],
      sparqlDomains: ['patents', 'trademarks', 'ip_classifications'],
      ragSources: ['patent_databases', 'trademark_records', 'ip_guidelines']
    },
    'sourcing-agent': {
      description: 'Supply chain management and vendor sourcing',
      domain: 'Cannabis Supply Chain',
      tools: ['vendor_analysis', 'supply_chain_optimization', 'cost_analysis'],
      sparqlDomains: ['suppliers', 'products', 'supply_chains'],
      ragSources: ['vendor_databases', 'market_reports', 'pricing_data']
    },
    'spectra-agent': {
      description: 'Laboratory analysis and analytical chemistry',
      domain: 'Cannabis Laboratory Analysis',
      tools: ['spectra_analysis', 'coa_validation', 'contaminant_detection'],
      sparqlDomains: ['analytical_methods', 'testing_standards', 'lab_equipment'],
      ragSources: ['testing_protocols', 'analytical_methods', 'lab_standards']
    },
    'customer-success-agent': {
      description: 'Customer relationship management and support',
      domain: 'Cannabis Industry Customer Success',
      tools: ['customer_analysis', 'satisfaction_tracking', 'retention_strategy'],
      sparqlDomains: ['customer_profiles', 'support_processes', 'success_metrics'],
      ragSources: ['support_documentation', 'best_practices', 'customer_feedback']
    }
  };
  
  return configs[agentName] || {
    description: 'Cannabis industry AI agent',
    domain: 'Cannabis Industry',
    tools: ['general_analysis'],
    sparqlDomains: ['general'],
    ragSources: ['industry_documents']
  };
}

// Generate directory structure files
function generateAgentFiles(agentName) {
  const config = getAgentConfig(agentName);
  const agentClassName = agentName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') + 'Agent';
  
  return {
    // Main agent implementation
    'agent.py': `"""
${agentClassName} with LangChain, RAG, and Memory Support
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document

@dataclass
class ${agentClassName}Analysis:
    """Data structure for ${config.description} analysis results"""
    query: str
    confidence: float
    analysis: str
    recommendations: List[str]
    sources: List[str]

class ${agentClassName}:
    """
    ${config.description}
    Specializes in ${config.domain}
    """
    
    def __init__(self, agent_path: str = "."):
        self.agent_path = agent_path
        self.user_memories = {}
        
        # Initialize components
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
            # Load existing vectorstore if available
            vectorstore_path = os.path.join(self.agent_path, "rag", "vectorstore")
            if os.path.exists(vectorstore_path):
                embeddings = OpenAIEmbeddings()
                self.vectorstore = FAISS.load_local(vectorstore_path, embeddings)
                self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
            else:
                self.retriever = None
                print(f"No vectorstore found at {vectorstore_path}")
        except Exception as e:
            print(f"Error loading vectorstore: {e}")
            self.retriever = None
    
    def _initialize_tools(self):
        """Initialize agent tools"""
        self.tools = []
        
        # Add RAG search tool if retriever is available
        if self.retriever:
            self.tools.append(self._create_rag_tool())
        
        # Add agent-specific tools
        ${self._generate_tool_methods(config.tools)}
    
    def _create_rag_tool(self):
        """Create RAG search tool"""
        from langchain.tools import Tool
        
        def rag_search(query: str) -> str:
            \"\"\"Search ${config.domain} knowledge base using RAG\"\"\"
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
    
    ${self._generate_tool_implementations(config.tools)}
    
    def _initialize_agent(self):
        """Initialize the LangChain agent"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", f\"\"\"You are a specialized AI agent for {config.description}.
            
Domain Expertise: {config.domain}
            
Your role is to provide expert guidance, analysis, and recommendations in this domain.
Use the available tools to gather information and provide comprehensive, accurate responses.
Always cite your sources and provide confidence scores for your recommendations.

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
                k=10,
                return_messages=True
            )
        return self.user_memories[user_id]
    
    async def process_query(self, user_id: str, query: str, context: Dict = None) -> Dict[str, Any]:
        """Process a user query with memory and context"""
        try:
            memory = self._get_user_memory(user_id)
            
            # Add context to query if provided
            if context:
                enhanced_query = f"Context: {context}\\n\\nQuery: {query}"
            else:
                enhanced_query = query
            
            # Process with agent
            result = await self.agent_executor.ainvoke({
                "input": enhanced_query,
                "chat_history": memory.chat_memory.messages
            })
            
            # Calculate confidence score
            confidence = self._calculate_confidence(result.get("output", ""))
            
            # Save to memory
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
                "response": f"I encountered an error processing your query: {str(e)}",
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "agent": "${agentName}",
                "user_id": user_id
            }
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score for response"""
        # Basic confidence calculation based on response characteristics
        if not response or len(response) < 50:
            return 0.3
        
        confidence_indicators = [
            "research shows" in response.lower(),
            "studies indicate" in response.lower(),
            "according to" in response.lower(),
            "evidence suggests" in response.lower(),
            len(response) > 200,
            "recommendation" in response.lower(),
            "analysis" in response.lower()
        ]
        
        base_confidence = sum(confidence_indicators) / len(confidence_indicators)
        return min(0.95, max(0.4, base_confidence))
    
    def get_user_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a user"""
        if user_id not in self.user_memories:
            return []
        
        memory = self.user_memories[user_id]
        messages = memory.chat_memory.messages[-limit*2:]  # Get last N exchanges
        
        history = []
        for i in range(0, len(messages), 2):
            if i + 1 < len(messages):
                history.append({
                    "query": messages[i].content,
                    "response": messages[i + 1].content,
                    "timestamp": datetime.now().isoformat()  # Would need to track real timestamps
                })
        
        return history
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        if user_id in self.user_memories:
            del self.user_memories[user_id]

def create_${agentName.replace('-', '_')}(agent_path: str = ".") -> ${agentClassName}:
    """Create and return a configured ${agentName}"""
    return ${agentClassName}(agent_path)

if __name__ == "__main__":
    import asyncio
    
    async def main():
        agent = create_${agentName.replace('-', '_')}()
        
        # Example usage
        result = await agent.process_query(
            user_id="test_user",
            query="Provide an analysis of current ${config.domain.lower()} requirements"
        )
        
        print(f"Response: {result['response']}")
        print(f"Confidence: {result['confidence']}")

    asyncio.run(main())
`,

    // Agent configuration
    'agent_config.yaml': `# ${agentClassName} Configuration
agent:
  name: "${agentName}"
  version: "1.0.0"
  description: "${config.description}"
  domain: "${config.domain}"

llm:
  provider: "openai"
  model: "gpt-4o"
  temperature: 0.1
  max_tokens: 2000
  
memory:
  type: "conversation_buffer_window"
  k: 10
  return_messages: true

rag:
  enabled: true
  vectorstore_type: "faiss"
  embedding_model: "text-embedding-ada-002"
  chunk_size: 1000
  chunk_overlap: 200
  search_kwargs:
    k: 5

sparql:
  enabled: true
  knowledge_base: "knowledge_base.ttl"
  query_generation_model: "phi-2"

tools:
  ${config.tools.map(tool => `- name: "${tool}"`).join('\n  ')}

baseline:
  enabled: true
  test_file: "baseline.json"
  categories:
    ${config.sparqlDomains.map(domain => `- "${domain}"`).join('\n    ')}
`,

    // RAG configuration
    'rag/config.yaml': `# RAG Configuration for ${agentClassName}
vectorstore:
  type: "faiss"
  embedding_model: "text-embedding-ada-002"
  index_name: "${agentName}_index"

corpus:
  sources:
    ${config.ragSources.map(source => `- name: "${source}"`).join('\n    ')}
  
  processing:
    chunk_size: 1000
    chunk_overlap: 200
    text_splitter: "recursive_character"
    
embeddings:
  model: "text-embedding-ada-002"
  batch_size: 100
  max_retries: 3

retrieval:
  search_type: "similarity"
  k: 5
  score_threshold: 0.7
`,

    // Sample corpus file
    'rag/corpus.jsonl': `{"text": "Sample ${config.domain} document content for RAG training", "source": "training_data", "category": "${config.sparqlDomains[0]}"}
{"text": "Additional training content for ${config.description}", "source": "knowledge_base", "category": "${config.sparqlDomains[1] || config.sparqlDomains[0]}"}
`,

    // SPARQL knowledge base
    'knowledge_base.ttl': `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ${agentName.replace('-', '')}: <http://formul8.ai/ontology/${agentName}#> .

# ${config.domain} Ontology for ${agentClassName}

${agentName.replace('-', '')}:Agent rdf:type owl:Class ;
    rdfs:label "${agentClassName}" ;
    rdfs:comment "${config.description}" .

${config.sparqlDomains.map((domain, index) => `
${agentName.replace('-', '')}:${domain.replace(/[^a-zA-Z0-9]/g, '')} rdf:type owl:Class ;
    rdfs:label "${domain}" ;
    rdfs:comment "Knowledge domain for ${domain}" .
`).join('')}

# Sample knowledge entries
${agentName.replace('-', '')}:knowledge_entry_001 rdf:type ${agentName.replace('-', '')}:${config.sparqlDomains[0].replace(/[^a-zA-Z0-9]/g, '')} ;
    rdfs:label "Sample Knowledge Entry" ;
    ${agentName.replace('-', '')}:description "Sample knowledge entry for ${config.domain}" ;
    ${agentName.replace('-', '')}:confidence "0.85"^^xsd:float .
`,

    // Baseline test questions
    'baseline.json': `{
  "agent": "${agentName}",
  "version": "1.0.0",
  "description": "Baseline test questions for ${config.description}",
  "categories": ${JSON.stringify(config.sparqlDomains)},
  "questions": [
    {
      "id": "q001",
      "category": "${config.sparqlDomains[0]}",
      "difficulty": "basic",
      "question": "What are the key requirements for ${config.domain.toLowerCase()}?",
      "expected_answer": "Key requirements include...",
      "evaluation_criteria": [
        "Mentions relevant regulations",
        "Provides specific requirements",
        "Demonstrates domain knowledge"
      ],
      "max_score": 10
    },
    {
      "id": "q002", 
      "category": "${config.sparqlDomains[1] || config.sparqlDomains[0]}",
      "difficulty": "intermediate",
      "question": "How would you approach ${config.description.toLowerCase()} in a complex scenario?",
      "expected_answer": "A comprehensive approach would involve...",
      "evaluation_criteria": [
        "Shows analytical thinking",
        "Considers multiple factors", 
        "Provides actionable recommendations"
      ],
      "max_score": 15
    }
  ]
}`,

    // Standalone runner
    'run_agent.py': `#!/usr/bin/env python3
"""
Standalone runner for ${agentClassName}
Usage: python run_agent.py [--test] [--query "your question"] [--interactive]
"""

import argparse
import asyncio
import json
import sys
import os
from agent import create_${agentName.replace('-', '_')}

async def run_baseline_test(agent):
    """Run baseline test questions"""
    try:
        with open('baseline.json', 'r') as f:
            baseline_data = json.load(f)
        
        print(f"\\n🧪 Running baseline tests for {baseline_data['agent']}...")
        print(f"Description: {baseline_data['description']}")
        
        total_score = 0
        max_total_score = 0
        
        for question in baseline_data['questions']:
            print(f"\\n📝 Question {question['id']} ({question['difficulty']}):")
            print(f"   {question['question']}")
            
            result = await agent.process_query(
                user_id="baseline_test",
                query=question['question']
            )
            
            print(f"\\n💭 Agent Response:")
            print(f"   {result['response']}")
            print(f"   Confidence: {result['confidence']:.2f}")
            
            # Simple scoring based on response length and confidence
            score = min(question['max_score'], 
                       int(result['confidence'] * question['max_score']))
            total_score += score
            max_total_score += question['max_score']
            
            print(f"   Score: {score}/{question['max_score']}")
        
        accuracy = (total_score / max_total_score) * 100 if max_total_score > 0 else 0
        print(f"\\n📊 Baseline Test Results:")
        print(f"   Total Score: {total_score}/{max_total_score}")
        print(f"   Accuracy: {accuracy:.1f}%")
        
        return {
            "total_score": total_score,
            "max_score": max_total_score,
            "accuracy": accuracy,
            "test_count": len(baseline_data['questions'])
        }
        
    except FileNotFoundError:
        print("❌ baseline.json not found")
        return None
    except Exception as e:
        print(f"❌ Error running baseline test: {e}")
        return None

async def interactive_mode(agent):
    """Run in interactive mode"""
    print(f"\\n🤖 ${agentClassName} Interactive Mode")
    print("Type 'quit' to exit, 'clear' to clear memory, 'history' to see conversation history\\n")
    
    user_id = "interactive_user"
    
    while True:
        try:
            query = input("💬 You: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("Goodbye! 👋")
                break
            elif query.lower() == 'clear':
                agent.clear_user_memory(user_id)
                print("🧹 Memory cleared")
                continue
            elif query.lower() == 'history':
                history = agent.get_user_conversation_history(user_id)
                if history:
                    print("\\n📚 Conversation History:")
                    for i, exchange in enumerate(history[-5:], 1):
                        print(f"   {i}. Q: {exchange['query'][:60]}...")
                        print(f"      A: {exchange['response'][:60]}...")
                else:
                    print("No conversation history found")
                continue
            elif not query:
                continue
            
            print("🤔 Thinking...")
            result = await agent.process_query(user_id, query)
            
            print(f"\\n🤖 Agent ({result['confidence']:.0%} confident): {result['response']}\\n")
            
        except KeyboardInterrupt:
            print("\\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

async def main():
    parser = argparse.ArgumentParser(description="${agentClassName} Runner")
    parser.add_argument('--test', action='store_true', help='Run baseline tests')
    parser.add_argument('--query', type=str, help='Run a single query')
    parser.add_argument('--interactive', action='store_true', help='Start interactive mode')
    
    args = parser.parse_args()
    
    # Initialize agent
    print(f"🚀 Initializing ${agentClassName}...")
    agent = create_${agentName.replace('-', '_')}()
    
    if args.test:
        await run_baseline_test(agent)
    elif args.query:
        result = await agent.process_query("cli_user", args.query)
        print(f"\\n🤖 Response: {result['response']}")
        print(f"💪 Confidence: {result['confidence']:.0%}")
    elif args.interactive:
        await interactive_mode(agent)
    else:
        print("No mode specified. Use --help for options.")

if __name__ == "__main__":
    asyncio.run(main())
`,

    // Requirements file
    'requirements.txt': `# ${agentClassName} Dependencies
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

    // README template will be generated by the README update script
    };
}

// Helper methods for generating tool code
function _generate_tool_methods(tools) {
  return tools.map(tool => `        self.tools.append(self._create_${tool}_tool())`).join('\n        ');
}

function _generate_tool_implementations(tools) {
  return tools.map(tool => `
    def _create_${tool}_tool(self):
        \"\"\"Create ${tool} tool\"\"\"
        from langchain.tools import Tool
        
        def ${tool}(query: str) -> str:
            \"\"\"${tool.replace('_', ' ').title()} functionality\"\"\"
            # Implement ${tool} logic here
            return f"${tool.replace('_', ' ').title()} result for: {query}"
        
        return Tool(
            name="${tool}",
            description="${tool.replace('_', ' ').title()} for specialized analysis",
            func=${tool}
        )`).join('\n');
}

async function createOrUpdateFile(owner, repo, path, content, message) {
  try {
    // Try to get existing file
    let sha = null;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo,
        path
      });
      
      if ('sha' in existingFile) {
        sha = existingFile.sha;
      }
    } catch (error) {
      // File doesn't exist, will create new
    }
    
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
    
    return true;
  } catch (error) {
    console.error(`Error creating/updating ${path}:`, error.message);
    return false;
  }
}

async function setupAgentRepository(agentName) {
  console.log(`\\n🚀 Setting up ${agentName} repository structure...`);
  
  try {
    const files = generateAgentFiles(agentName);
    const config = getAgentConfig(agentName);
    
    let successCount = 0;
    let totalFiles = Object.keys(files).length;
    
    // Create directory structure by creating files
    const directories = [
      'rag/',
      'test_cases/',
      'docs/'
    ];
    
    // Create files
    for (const [filePath, content] of Object.entries(files)) {
      const success = await createOrUpdateFile(
        F8AI_ORG,
        agentName,
        filePath,
        content,
        `Setup LangChain structure: ${filePath}`
      );
      
      if (success) {
        successCount++;
        console.log(`  ✅ ${filePath}`);
      } else {
        console.log(`  ❌ ${filePath}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Create empty directories by adding .gitkeep files
    for (const dir of directories) {
      if (!Object.keys(files).some(path => path.startsWith(dir))) {
        await createOrUpdateFile(
          F8AI_ORG,
          agentName,
          `${dir}.gitkeep`,
          `# Directory for ${dir.replace('/', '')}\\n`,
          `Setup directory structure: ${dir}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\\n📊 ${agentName} Summary:`);
    console.log(`   ✅ Created: ${successCount}/${totalFiles} files`);
    console.log(`   🧬 Domain: ${config.domain}`);
    console.log(`   🛠️  Tools: ${config.tools.length}`);
    console.log(`   📚 RAG Sources: ${config.ragSources.length}`);
    console.log(`   🔍 SPARQL Domains: ${config.sparqlDomains.length}`);
    
    return successCount === totalFiles;
    
  } catch (error) {
    console.error(`❌ Error setting up ${agentName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🏗️  Setting up LangChain directory structure for all agents...');
  
  if (!process.env.GITHUB_PAT) {
    console.error('❌ GITHUB_PAT environment variable is required');
    process.exit(1);
  }
  
  let successful = 0;
  let failed = 0;
  
  for (const agent of agents) {
    const success = await setupAgentRepository(agent);
    if (success) {
      successful++;
    } else {
      failed++;
    }
    
    // Longer delay between repositories
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\\n🎯 Final Summary:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${agents.length}`);
  
  if (successful === agents.length) {
    console.log('\\n🎉 All agent repositories now have proper LangChain structure!');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}