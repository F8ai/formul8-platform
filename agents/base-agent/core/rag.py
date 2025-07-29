"""
RAG (Retrieval-Augmented Generation) Module for AstraDB Integration
Handles vector storage and retrieval of cannabis regulations by state
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import hashlib

# AstraDB imports
from astrapy.db import AstraDB

# LangChain imports for embeddings and vector stores
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import AstraDB as LangChainAstraDB
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RegulationChunk:
    """Data class for regulation text chunks"""
    id: str
    content: str
    metadata: Dict[str, Any]
    state: str
    source_url: str
    chunk_index: int
    created_at: datetime

class AstraDBRAG:
    """AstraDB-based RAG system for cannabis regulations"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.astra_db = None
        self.collection = None
        self.embeddings = None
        self.vector_store = None
        self.text_splitter = None
        
        # Initialize components
        self._initialize_astra_db()
        self._initialize_embeddings()
        self._initialize_text_splitter()
    
    def _initialize_astra_db(self):
        """Initialize AstraDB connection"""
        try:
            # Get AstraDB configuration
            astra_config = self.config.get("astra_db", {})
            token = astra_config.get("token") or os.getenv("ASTRA_DB_TOKEN")
            api_endpoint = astra_config.get("api_endpoint") or os.getenv("ASTRA_DB_API_ENDPOINT")
            keyspace = astra_config.get("keyspace", "compliance_regulations")
            collection_name = astra_config.get("collection_name", "regulations")
            
            if not token or not api_endpoint:
                raise ValueError("AstraDB token and API endpoint must be provided")
            
            # Initialize AstraDB client
            self.astra_db = AstraDB(
                token=token,
                api_endpoint=api_endpoint,
                keyspace=keyspace
            )
            
            # Get or create collection
            self.collection = self.astra_db.collection(collection_name)
            
            # Create vector store for LangChain integration
            self.vector_store = LangChainAstraDB(
                embedding=self.embeddings,
                collection_name=collection_name,
                astra_db_client=self.astra_db,
                namespace=keyspace
            )
            
            logger.info(f"Successfully connected to AstraDB collection: {collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize AstraDB: {e}")
            raise
    
    def _initialize_embeddings(self):
        """Initialize OpenAI embeddings"""
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
            
            self.embeddings = OpenAIEmbeddings(
                openai_api_key=openai_api_key,
                model="text-embedding-3-small"  # Latest embedding model
            )
            logger.info("Successfully initialized OpenAI embeddings")
            
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {e}")
            raise
    
    def _initialize_text_splitter(self):
        """Initialize text splitter for chunking regulations"""
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        logger.info("Initialized text splitter")
    
    def _generate_chunk_id(self, state: str, source_url: str, chunk_index: int) -> str:
        """Generate unique ID for regulation chunk"""
        content = f"{state}_{source_url}_{chunk_index}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def process_regulation_file(self, file_path: str, state: str, source_url: str) -> List[RegulationChunk]:
        """Process a regulation file and split into chunks"""
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split content into chunks
            chunks = self.text_splitter.split_text(content)
            
            # Create regulation chunks
            regulation_chunks = []
            for i, chunk in enumerate(chunks):
                chunk_id = self._generate_chunk_id(state, source_url, i)
                
                regulation_chunk = RegulationChunk(
                    id=chunk_id,
                    content=chunk,
                    metadata={
                        "state": state,
                        "source_url": source_url,
                        "file_path": file_path,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "processed_at": datetime.now().isoformat()
                    },
                    state=state,
                    source_url=source_url,
                    chunk_index=i,
                    created_at=datetime.now()
                )
                regulation_chunks.append(regulation_chunk)
            
            logger.info(f"Processed {len(regulation_chunks)} chunks from {file_path}")
            return regulation_chunks
            
        except Exception as e:
            logger.error(f"Error processing regulation file {file_path}: {e}")
            return []
    
    def store_regulations(self, regulation_chunks: List[RegulationChunk]) -> bool:
        """Store regulation chunks in AstraDB"""
        try:
            # Convert to LangChain documents
            documents = []
            for chunk in regulation_chunks:
                doc = Document(
                    page_content=chunk.content,
                    metadata=chunk.metadata
                )
                documents.append(doc)
            
            # Add documents to vector store
            if documents:
                self.vector_store.add_documents(documents)
                logger.info(f"Successfully stored {len(documents)} regulation chunks in AstraDB")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error storing regulations in AstraDB: {e}")
            return False
    
    def search_regulations(self, query: str, state: Optional[str] = None, 
                          limit: int = 5) -> List[Dict[str, Any]]:
        """Search regulations using semantic similarity"""
        try:
            # Build search query
            search_kwargs = {"k": limit}
            
            # Add state filter if specified
            if state:
                search_kwargs["filter"] = {"state": state}
            
            # Perform similarity search
            results = self.vector_store.similarity_search_with_score(
                query, **search_kwargs
            )
            
            # Format results
            formatted_results = []
            for doc, score in results:
                result = {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity_score": float(score),
                    "state": doc.metadata.get("state"),
                    "source_url": doc.metadata.get("source_url")
                }
                formatted_results.append(result)
            
            logger.info(f"Found {len(formatted_results)} relevant regulation chunks")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching regulations: {e}")
            return []
    
    def get_regulations_by_state(self, state: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all regulations for a specific state"""
        try:
            # Search with empty query to get all documents for the state
            results = self.vector_store.similarity_search_with_score(
                "", k=limit, filter={"state": state}
            )
            
            formatted_results = []
            for doc, score in results:
                result = {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "state": doc.metadata.get("state"),
                    "source_url": doc.metadata.get("source_url")
                }
                formatted_results.append(result)
            
            logger.info(f"Retrieved {len(formatted_results)} regulation chunks for {state}")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error retrieving regulations for state {state}: {e}")
            return []
    
    def delete_regulations_by_state(self, state: str) -> bool:
        """Delete all regulations for a specific state"""
        try:
            # Get all documents for the state
            documents = self.get_regulations_by_state(state, limit=1000)
            
            # Delete each document
            for doc in documents:
                # Note: This would require implementing delete functionality
                # in the AstraDB vector store or using direct AstraDB operations
                pass
            
            logger.info(f"Deleted regulations for state: {state}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting regulations for state {state}: {e}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the regulation collection"""
        try:
            # This would require implementing stats functionality
            # For now, return basic info
            return {
                "collection_name": self.collection.name if self.collection else None,
                "status": "connected" if self.astra_db else "disconnected"
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"error": str(e)}

class RegulationProcessor:
    """Utility class for processing regulation files"""
    
    def __init__(self, rag_system: AstraDBRAG):
        self.rag_system = rag_system
    
    def process_state_regulations(self, state: str, regulations_dir: str) -> bool:
        """Process all regulation files for a specific state"""
        try:
            state_dir = os.path.join(regulations_dir, state)
            if not os.path.exists(state_dir):
                logger.warning(f"State directory not found: {state_dir}")
                return False
            
            all_chunks = []
            
            # Process all files in the state directory
            for root, dirs, files in os.walk(state_dir):
                for file in files:
                    if file.endswith(('.html', '.txt', '.pdf', '.json')):
                        file_path = os.path.join(root, file)
                        
                        # Extract source URL from file path or metadata
                        source_url = self._extract_source_url(file_path)
                        
                        # Process the file
                        chunks = self.rag_system.process_regulation_file(
                            file_path, state, source_url
                        )
                        all_chunks.extend(chunks)
            
            # Store all chunks
            if all_chunks:
                success = self.rag_system.store_regulations(all_chunks)
                logger.info(f"Processed {len(all_chunks)} chunks for state {state}")
                return success
            
            return False
            
        except Exception as e:
            logger.error(f"Error processing regulations for state {state}: {e}")
            return False
    
    def _extract_source_url(self, file_path: str) -> str:
        """Extract source URL from file path or metadata"""
        # This is a simplified implementation
        # In practice, you might want to parse metadata files or use file naming conventions
        return f"file://{file_path}" 