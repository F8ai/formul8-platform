"""
Shared retrieval utilities for all agents
Enhanced with AstraDB vector storage for scalable cloud-native vector search
"""
import os
import json
import yaml
from typing import List, Dict, Any, Optional
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from .astradb_vector_store import AstraDBVectorStore, create_agent_vector_store


class BaseRetriever:
    """Base retriever class for all agents with AstraDB integration"""
    
    def __init__(self, config_path: str, agent_type: str = "generic", use_astradb: bool = True):
        self.config = self.load_config(config_path)
        self.agent_type = agent_type
        self.use_astradb = use_astradb
        self.embeddings = None
        self.vectorstore = None
        self.astradb_store = None
        self.text_splitter = None
        self._initialize()
    
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """Load RAG configuration from YAML file"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _initialize(self):
        """Initialize embeddings, text splitter, and vectorstore"""
        # Initialize embeddings
        embedding_config = self.config['embedding']
        if embedding_config['provider'] == 'openai':
            self.embeddings = OpenAIEmbeddings(
                model=embedding_config['model'],
                openai_api_key=os.getenv('OPENAI_API_KEY')
            )
        
        # Initialize text splitter
        chunking_config = self.config['chunking']
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunking_config['chunk_size'],
            chunk_overlap=chunking_config['chunk_overlap']
        )
        
        # Initialize vector storage (AstraDB or FAISS)
        if self.use_astradb:
            self.astradb_store = create_agent_vector_store(self.agent_type)
        else:
            self._load_or_create_vectorstore()
    
    def _load_or_create_vectorstore(self):
        """Load existing vectorstore or create new one"""
        retrieval_config = self.config['retrieval']
        index_path = retrieval_config['index_path']
        
        if os.path.exists(index_path):
            self.vectorstore = FAISS.load_local(index_path, self.embeddings)
        else:
            # Create new vectorstore from corpus
            self._create_vectorstore_from_corpus()
    
    def _create_vectorstore_from_corpus(self):
        """Create vectorstore from corpus.jsonl file"""
        retrieval_config = self.config['retrieval']
        corpus_path = retrieval_config['corpus_path']
        
        documents = []
        with open(corpus_path, 'r') as f:
            for line in f:
                data = json.loads(line)
                doc = Document(
                    page_content=data['chunk'],
                    metadata=data.get('metadata', {})
                )
                documents.append(doc)
        
        if documents:
            self.vectorstore = FAISS.from_documents(documents, self.embeddings)
            self.vectorstore.save_local(retrieval_config['index_path'])
    
    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[Document]:
        """Retrieve relevant documents for a query using AstraDB or FAISS"""
        retrieval_params = self.config['retrieval_params']
        k = top_k or retrieval_params['top_k']
        
        if self.use_astradb and self.astradb_store:
            # Use AstraDB for retrieval
            results = self.astradb_store.similarity_search(query, k=k)
            docs = []
            for result in results:
                doc = Document(
                    page_content=result['content'],
                    metadata=result['metadata']
                )
                docs.append(doc)
            return docs
        else:
            # Use FAISS for retrieval
            if not self.vectorstore:
                return []
            
            docs = self.vectorstore.similarity_search(
                query, 
                k=k,
                score_threshold=retrieval_params.get('similarity_threshold', 0.7)
            )
            return docs
    
    def add_documents(self, documents: List[Document]):
        """Add new documents to the vectorstore (AstraDB or FAISS)"""
        if self.use_astradb and self.astradb_store:
            # Convert LangChain Documents to AstraDB format
            astra_docs = []
            for doc in documents:
                astra_docs.append({
                    'content': doc.page_content,
                    'metadata': doc.metadata
                })
            self.astradb_store.add_documents(astra_docs)
        else:
            # Use FAISS
            if not self.vectorstore:
                self.vectorstore = FAISS.from_documents(documents, self.embeddings)
            else:
                self.vectorstore.add_documents(documents)
            
            # Save updated vectorstore
            retrieval_config = self.config['retrieval']
            self.vectorstore.save_local(retrieval_config['index_path'])


class AgentMemory:
    """Memory management for agent conversations"""
    
    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.conversations = {}  # user_id -> conversation history
    
    def add_message(self, user_id: str, role: str, content: str, metadata: Dict = None):
        """Add a message to user's conversation history"""
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        message = {
            "role": role,
            "content": content,
            "timestamp": import_datetime.datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.conversations[user_id].append(message)
        
        # Keep only last 50 messages per user
        if len(self.conversations[user_id]) > 50:
            self.conversations[user_id] = self.conversations[user_id][-50:]
    
    def get_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get recent conversation history for a user"""
        if user_id not in self.conversations:
            return []
        
        return self.conversations[user_id][-limit:]
    
    def clear_user_history(self, user_id: str):
        """Clear conversation history for a user"""
        if user_id in self.conversations:
            del self.conversations[user_id]
    
    def get_context_summary(self, user_id: str) -> str:
        """Generate a summary of recent conversation context"""
        history = self.get_conversation_history(user_id, limit=5)
        if not history:
            return "No previous conversation context."
        
        context_lines = []
        for msg in history:
            role = msg['role'].capitalize()
            content = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
            context_lines.append(f"{role}: {content}")
        
        return "\n".join(context_lines)


def load_agent_config(agent_path: str) -> Dict[str, Any]:
    """Load agent configuration from agent_config.yaml"""
    config_path = os.path.join(agent_path, 'agent_config.yaml')
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def load_baseline_questions(agent_path: str) -> Dict[str, Any]:
    """Load baseline questions from baseline.json"""
    baseline_path = os.path.join(agent_path, 'baseline.json')
    with open(baseline_path, 'r') as f:
        return json.load(f)