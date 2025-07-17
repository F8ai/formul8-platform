"""
AstraDB Vector Storage for Cannabis AI Agents
Replaces FAISS with scalable cloud-native vector storage
"""
import os
import json
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from astrapy import DataAPIClient
from astrapy.collection import Collection
from astrapy.exceptions import InsertManyException
import openai
from datetime import datetime

@dataclass
class VectorDocument:
    """Document structure for AstraDB vector storage"""
    id: str
    content: str
    metadata: Dict[str, Any]
    vector: List[float]
    agent_type: str
    created_at: str
    updated_at: str

class AstraDBVectorStore:
    """AstraDB-powered vector storage for cannabis AI agents"""
    
    def __init__(self, 
                 agent_type: str,
                 collection_name: str = None,
                 embedding_model: str = "text-embedding-3-small"):
        """
        Initialize AstraDB vector store
        
        Args:
            agent_type: Type of agent (compliance, formulation, etc.)
            collection_name: Custom collection name (optional)
            embedding_model: OpenAI embedding model to use
        """
        self.agent_type = agent_type
        self.embedding_model = embedding_model
        self.collection_name = collection_name or f"cannabis_{agent_type}_vectors"
        
        # Initialize AstraDB client
        self.client = DataAPIClient(token=os.getenv("ASTRA_DB_APPLICATION_TOKEN"))
        self.database = self.client.get_database(
            api_endpoint=os.getenv("ASTRA_DB_API_ENDPOINT")
        )
        
        # Initialize OpenAI client for embeddings
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Create or get collection
        self.collection = self._get_or_create_collection()
    
    def _get_or_create_collection(self) -> Collection:
        """Get existing collection or create new one"""
        try:
            # Try to get existing collection
            collection = self.database.get_collection(self.collection_name)
            return collection
        except Exception:
            # Create new collection with vector indexing
            collection = self.database.create_collection(
                name=self.collection_name,
                dimension=1536,  # OpenAI text-embedding-3-small dimension
                metric="cosine",
                check_exists=False
            )
            return collection
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI API"""
        response = self.openai_client.embeddings.create(
            input=text,
            model=self.embedding_model
        )
        return response.data[0].embedding
    
    def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Add documents to AstraDB vector store
        
        Args:
            documents: List of documents with 'content' and 'metadata' keys
            
        Returns:
            List of document IDs
        """
        vector_docs = []
        document_ids = []
        
        for doc in documents:
            doc_id = str(uuid.uuid4())
            document_ids.append(doc_id)
            
            # Generate embedding
            embedding = self._generate_embedding(doc['content'])
            
            # Create vector document
            vector_doc = VectorDocument(
                id=doc_id,
                content=doc['content'],
                metadata=doc.get('metadata', {}),
                vector=embedding,
                agent_type=self.agent_type,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
            )
            
            vector_docs.append(asdict(vector_doc))
        
        # Insert documents into AstraDB
        try:
            self.collection.insert_many(vector_docs)
            return document_ids
        except InsertManyException as e:
            print(f"Error inserting documents: {e}")
            raise
    
    def similarity_search(self, 
                         query: str, 
                         k: int = 5,
                         filter_metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Perform similarity search using vector embeddings
        
        Args:
            query: Search query text
            k: Number of results to return
            filter_metadata: Optional metadata filters
            
        Returns:
            List of similar documents with scores
        """
        # Generate query embedding
        query_embedding = self._generate_embedding(query)
        
        # Build filter
        filter_dict = {"agent_type": self.agent_type}
        if filter_metadata:
            filter_dict.update(filter_metadata)
        
        # Perform vector search
        results = self.collection.vector_find(
            vector=query_embedding,
            limit=k,
            filter=filter_dict,
            include_similarity=True
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "id": result["id"],
                "content": result["content"],
                "metadata": result["metadata"],
                "score": result.get("$similarity", 0.0)
            })
        
        return formatted_results
    
    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        result = self.collection.find_one({"id": doc_id})
        return result
    
    def update_document(self, doc_id: str, content: str = None, metadata: Dict[str, Any] = None):
        """Update existing document"""
        update_data = {"updated_at": datetime.now().isoformat()}
        
        if content:
            update_data["content"] = content
            update_data["vector"] = self._generate_embedding(content)
        
        if metadata:
            update_data["metadata"] = metadata
        
        self.collection.update_one(
            {"id": doc_id},
            {"$set": update_data}
        )
    
    def delete_document(self, doc_id: str):
        """Delete document by ID"""
        self.collection.delete_one({"id": doc_id})
    
    def delete_all_documents(self):
        """Delete all documents for this agent"""
        self.collection.delete_many({"agent_type": self.agent_type})
    
    def get_document_count(self) -> int:
        """Get total number of documents for this agent"""
        result = self.collection.count_documents({"agent_type": self.agent_type})
        return result
    
    def get_all_documents(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all documents for this agent"""
        results = self.collection.find(
            {"agent_type": self.agent_type},
            limit=limit
        )
        return list(results)
    
    def search_by_metadata(self, 
                          metadata_filter: Dict[str, Any],
                          limit: int = 10) -> List[Dict[str, Any]]:
        """Search documents by metadata"""
        filter_dict = {"agent_type": self.agent_type}
        filter_dict.update(metadata_filter)
        
        results = self.collection.find(filter_dict, limit=limit)
        return list(results)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        total_docs = self.get_document_count()
        
        # Get sample documents to analyze metadata
        sample_docs = self.get_all_documents(limit=10)
        
        # Analyze metadata categories
        metadata_categories = set()
        for doc in sample_docs:
            if doc.get("metadata"):
                metadata_categories.update(doc["metadata"].keys())
        
        return {
            "agent_type": self.agent_type,
            "collection_name": self.collection_name,
            "total_documents": total_docs,
            "metadata_categories": list(metadata_categories),
            "embedding_model": self.embedding_model,
            "vector_dimension": 1536,
            "last_updated": datetime.now().isoformat()
        }

class CannabisKnowledgeBase:
    """Cannabis-specific knowledge base with multiple agents"""
    
    def __init__(self):
        """Initialize multi-agent knowledge base"""
        self.agents = {}
        self.agent_types = [
            "compliance", "formulation", "marketing", "science", 
            "operations", "sourcing", "patent", "spectra", "customer-success"
        ]
        
        # Initialize vector stores for each agent
        for agent_type in self.agent_types:
            self.agents[agent_type] = AstraDBVectorStore(agent_type)
    
    def get_agent_store(self, agent_type: str) -> AstraDBVectorStore:
        """Get vector store for specific agent"""
        if agent_type not in self.agents:
            raise ValueError(f"Unknown agent type: {agent_type}")
        return self.agents[agent_type]
    
    def cross_agent_search(self, 
                          query: str, 
                          agent_types: List[str] = None,
                          k_per_agent: int = 3) -> Dict[str, List[Dict[str, Any]]]:
        """Search across multiple agents"""
        if agent_types is None:
            agent_types = self.agent_types
        
        results = {}
        for agent_type in agent_types:
            if agent_type in self.agents:
                agent_results = self.agents[agent_type].similarity_search(
                    query, k=k_per_agent
                )
                results[agent_type] = agent_results
        
        return results
    
    def get_knowledge_base_statistics(self) -> Dict[str, Any]:
        """Get statistics for entire knowledge base"""
        stats = {
            "total_agents": len(self.agents),
            "agents": {}
        }
        
        total_documents = 0
        for agent_type, agent_store in self.agents.items():
            agent_stats = agent_store.get_statistics()
            stats["agents"][agent_type] = agent_stats
            total_documents += agent_stats["total_documents"]
        
        stats["total_documents"] = total_documents
        stats["last_updated"] = datetime.now().isoformat()
        
        return stats

# Helper functions for agent integration
def create_agent_vector_store(agent_type: str) -> AstraDBVectorStore:
    """Create vector store for specific agent"""
    return AstraDBVectorStore(agent_type)

def migrate_from_faiss(agent_type: str, faiss_index_path: str, corpus_path: str):
    """Migrate existing FAISS index to AstraDB"""
    vector_store = AstraDBVectorStore(agent_type)
    
    # Load documents from corpus
    documents = []
    with open(corpus_path, 'r') as f:
        for line in f:
            data = json.loads(line)
            documents.append({
                'content': data['chunk'],
                'metadata': data.get('metadata', {})
            })
    
    # Add to AstraDB
    if documents:
        vector_store.add_documents(documents)
        print(f"Migrated {len(documents)} documents for {agent_type} to AstraDB")
    
    return vector_store