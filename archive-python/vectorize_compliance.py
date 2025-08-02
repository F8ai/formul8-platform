#!/usr/bin/env python3
"""
Vectorization System for Cannabis Compliance Data

Creates vector embeddings for regulatory citations and documents to enable
semantic search and precise regulatory reference retrieval for LLMs.
"""

import json
import logging
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union
import pickle
import hashlib
from dataclasses import dataclass, asdict
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Vector processing libraries
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    import torch
    from transformers import AutoTokenizer, AutoModel
except ImportError as e:
    print(f"Missing required libraries: {e}")
    print("Install with: pip install faiss-cpu sentence-transformers torch transformers")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class VectorizedCitation:
    """Vectorized citation with embeddings and metadata"""
    citation_id: str
    state: str
    citation_string: str
    section: str
    document_type: str
    title: str
    text_content: str
    embedding: np.ndarray
    embedding_hash: str
    created_at: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['embedding'] = self.embedding.tolist()  # Convert numpy array to list
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'VectorizedCitation':
        """Create from dictionary"""
        data['embedding'] = np.array(data['embedding'])  # Convert list back to numpy array
        return cls(**data)

class ComplianceVectorizer:
    """Main vectorization system for compliance data"""
    
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.citations_dir = self.base_dir / "citations"
        self.vectors_dir = self.base_dir / "vectors"
        self.vectors_dir.mkdir(exist_ok=True)
        
        # Initialize embedding model
        self.embedding_model = None
        self.embedding_dimension = None
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"  # Fast, good quality
        
        # FAISS index
        self.faiss_index = None
        self.citation_metadata = {}  # Maps index position to citation metadata
        
        # Vector database
        self.vector_db = {
            "created_at": datetime.now().isoformat(),
            "model_name": self.model_name,
            "total_vectors": 0,
            "states": {},
            "index_metadata": {}
        }
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Batch processing
        self.batch_size = 100
        self.max_text_length = 512  # Token limit for embeddings

    def initialize_embedding_model(self):
        """Initialize the sentence transformer model"""
        logger.info(f"Initializing embedding model: {self.model_name}")
        
        try:
            self.embedding_model = SentenceTransformer(self.model_name)
            
            # Get embedding dimension
            test_embedding = self.embedding_model.encode(["test"])
            self.embedding_dimension = test_embedding.shape[1]
            
            logger.info(f"Embedding model initialized. Dimension: {self.embedding_dimension}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            raise

    def preprocess_text(self, text: str) -> str:
        """Preprocess text for embedding"""
        # Remove excessive whitespace
        text = " ".join(text.split())
        
        # Truncate if too long (approximate token limit)
        if len(text) > self.max_text_length * 4:  # Rough estimate: 4 chars per token
            text = text[:self.max_text_length * 4]
        
        return text

    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings for a list of texts"""
        if not self.embedding_model:
            self.initialize_embedding_model()
        
        # Preprocess texts
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # Create embeddings
        embeddings = self.embedding_model.encode(
            processed_texts,
            batch_size=self.batch_size,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        return embeddings

    def vectorize_state_citations(self, state_key: str) -> Dict:
        """Vectorize all citations for a single state"""
        logger.info(f"Vectorizing citations for {state_key}")
        
        # Load state citations
        state_citations_file = self.citations_dir / f"{state_key}_citations.json"
        
        if not state_citations_file.exists():
            logger.warning(f"No citations file found for {state_key}")
            return {"state": state_key, "status": "no_citations"}
        
        with open(state_citations_file, 'r', encoding='utf-8') as f:
            state_data = json.load(f)
        
        citations = state_data.get("citations", [])
        
        if not citations:
            logger.warning(f"No citations found for {state_key}")
            return {"state": state_key, "status": "no_citations"}
        
        logger.info(f"Processing {len(citations)} citations for {state_key}")
        
        # Prepare texts for embedding
        texts = []
        citation_objects = []
        
        for citation_data in citations:
            # Combine citation string and text content for embedding
            citation_text = f"{citation_data.get('document_type', '')} {citation_data.get('title', '')} Section {citation_data.get('section', '')} {citation_data.get('text_content', '')}"
            
            texts.append(citation_text)
            citation_objects.append(citation_data)
        
        # Create embeddings in batches
        embeddings = self.create_embeddings(texts)
        
        # Create vectorized citations
        vectorized_citations = []
        
        for i, (citation_data, embedding) in enumerate(zip(citation_objects, embeddings)):
            # Create embedding hash for uniqueness
            embedding_hash = hashlib.sha256(embedding.tobytes()).hexdigest()[:16]
            
            vectorized_citation = VectorizedCitation(
                citation_id=citation_data.get('hash_id', ''),
                state=state_key,
                citation_string=f"{state_key.upper()} {citation_data.get('document_type', '')} - {citation_data.get('title', '')} - Section {citation_data.get('section', '')}",
                section=citation_data.get('section', ''),
                document_type=citation_data.get('document_type', ''),
                title=citation_data.get('title', ''),
                text_content=citation_data.get('text_content', ''),
                embedding=embedding,
                embedding_hash=embedding_hash,
                created_at=datetime.now().isoformat()
            )
            
            vectorized_citations.append(vectorized_citation)
        
        # Save vectorized citations
        state_vectors_file = self.vectors_dir / f"{state_key}_vectors.json"
        
        # Convert to serializable format
        serializable_citations = [citation.to_dict() for citation in vectorized_citations]
        
        state_vector_data = {
            "state": state_key,
            "total_citations": len(vectorized_citations),
            "model_name": self.model_name,
            "embedding_dimension": self.embedding_dimension,
            "vectorized_citations": serializable_citations,
            "created_at": datetime.now().isoformat()
        }
        
        with open(state_vectors_file, 'w', encoding='utf-8') as f:
            json.dump(state_vector_data, f, indent=2, ensure_ascii=False)
        
        # Update vector database
        self.vector_db["states"][state_key] = {
            "total_vectors": len(vectorized_citations),
            "vectors_file": str(state_vectors_file),
            "processed_at": datetime.now().isoformat()
        }
        
        logger.info(f"Vectorized {len(vectorized_citations)} citations for {state_key}")
        
        return {
            "state": state_key,
            "status": "completed",
            "total_vectors": len(vectorized_citations),
            "vectorized_citations": vectorized_citations
        }

    def build_faiss_index(self) -> Dict:
        """Build FAISS index from all vectorized citations"""
        logger.info("Building FAISS index from vectorized citations")
        
        if not self.embedding_dimension:
            self.initialize_embedding_model()
        
        # Collect all embeddings and metadata
        all_embeddings = []
        all_metadata = []
        
        # Load all state vectors
        for state_key, state_info in self.vector_db["states"].items():
            vectors_file = Path(state_info["vectors_file"])
            
            if vectors_file.exists():
                with open(vectors_file, 'r', encoding='utf-8') as f:
                    state_data = json.load(f)
                
                for citation_data in state_data.get("vectorized_citations", []):
                    embedding = np.array(citation_data["embedding"])
                    all_embeddings.append(embedding)
                    
                    # Store metadata
                    metadata = {
                        "citation_id": citation_data["citation_id"],
                        "state": citation_data["state"],
                        "citation_string": citation_data["citation_string"],
                        "section": citation_data["section"],
                        "document_type": citation_data["document_type"],
                        "title": citation_data["title"],
                        "text_content": citation_data["text_content"][:500] + "..." if len(citation_data["text_content"]) > 500 else citation_data["text_content"]
                    }
                    all_metadata.append(metadata)
        
        if not all_embeddings:
            logger.warning("No embeddings found for FAISS index")
            return {"status": "no_embeddings"}
        
        # Convert to numpy array
        embeddings_matrix = np.array(all_embeddings).astype('float32')
        
        logger.info(f"Building FAISS index with {len(all_embeddings)} vectors")
        
        # Create FAISS index
        self.faiss_index = faiss.IndexFlatIP(self.embedding_dimension)  # Inner product for similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings_matrix)
        
        # Add to index
        self.faiss_index.add(embeddings_matrix)
        
        # Store metadata
        self.citation_metadata = {i: metadata for i, metadata in enumerate(all_metadata)}
        
        # Save FAISS index
        faiss_index_file = self.vectors_dir / "compliance_faiss.index"
        faiss.write_index(self.faiss_index, str(faiss_index_file))
        
        # Save metadata
        metadata_file = self.vectors_dir / "citation_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.citation_metadata, f, indent=2, ensure_ascii=False)
        
        # Update vector database
        self.vector_db["total_vectors"] = len(all_embeddings)
        self.vector_db["faiss_index_file"] = str(faiss_index_file)
        self.vector_db["metadata_file"] = str(metadata_file)
        
        logger.info(f"FAISS index built with {len(all_embeddings)} vectors")
        
        return {
            "status": "completed",
            "total_vectors": len(all_embeddings),
            "embedding_dimension": self.embedding_dimension,
            "index_file": str(faiss_index_file)
        }

    def search_similar_citations(self, query: str, k: int = 10, state_filter: Optional[str] = None) -> List[Dict]:
        """Search for similar citations using vector similarity"""
        logger.info(f"Searching for similar citations: '{query}'")
        
        if not self.faiss_index:
            self.load_faiss_index()
        
        if not self.embedding_model:
            self.initialize_embedding_model()
        
        # Create query embedding
        query_embedding = self.embedding_model.encode([query])
        query_embedding = query_embedding.astype('float32')
        faiss.normalize_L2(query_embedding)
        
        # Search FAISS index
        similarities, indices = self.faiss_index.search(query_embedding, k * 2)  # Get more results for filtering
        
        # Process results
        results = []
        
        for i, (similarity, index) in enumerate(zip(similarities[0], indices[0])):
            if index < 0:  # Invalid index
                continue
            
            metadata = self.citation_metadata.get(index, {})
            
            # Apply state filter if specified
            if state_filter and metadata.get("state") != state_filter:
                continue
            
            result = {
                "rank": len(results) + 1,
                "similarity_score": float(similarity),
                "citation_id": metadata.get("citation_id", ""),
                "state": metadata.get("state", ""),
                "citation_string": metadata.get("citation_string", ""),
                "section": metadata.get("section", ""),
                "document_type": metadata.get("document_type", ""),
                "title": metadata.get("title", ""),
                "text_content": metadata.get("text_content", ""),
                "relevance": "high" if similarity > 0.8 else "medium" if similarity > 0.6 else "low"
            }
            
            results.append(result)
            
            if len(results) >= k:
                break
        
        logger.info(f"Found {len(results)} similar citations")
        return results

    def load_faiss_index(self):
        """Load existing FAISS index"""
        faiss_index_file = self.vectors_dir / "compliance_faiss.index"
        metadata_file = self.vectors_dir / "citation_metadata.json"
        
        if not faiss_index_file.exists():
            logger.error("FAISS index not found. Please build index first.")
            return False
        
        if not metadata_file.exists():
            logger.error("Citation metadata not found. Please build index first.")
            return False
        
        try:
            # Load FAISS index
            self.faiss_index = faiss.read_index(str(faiss_index_file))
            
            # Load metadata
            with open(metadata_file, 'r', encoding='utf-8') as f:
                raw_metadata = json.load(f)
            
            # Convert string keys to integers
            self.citation_metadata = {int(k): v for k, v in raw_metadata.items()}
            
            logger.info(f"Loaded FAISS index with {self.faiss_index.ntotal} vectors")
            return True
            
        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}")
            return False

    def vectorize_all_states(self) -> Dict:
        """Vectorize citations for all states"""
        logger.info("Vectorizing citations for all states")
        
        # Load existing vector database if available
        vector_db_file = self.vectors_dir / "vector_database.json"
        if vector_db_file.exists():
            with open(vector_db_file, 'r') as f:
                self.vector_db = json.load(f)
        
        # Get all citation files
        citation_files = list(self.citations_dir.glob("*_citations.json"))
        
        if not citation_files:
            logger.warning("No citation files found")
            return {"status": "no_citations"}
        
        # Process each state
        results = {}
        
        for citation_file in citation_files:
            state_key = citation_file.stem.replace("_citations", "")
            
            try:
                result = self.vectorize_state_citations(state_key)
                results[state_key] = result
                
            except Exception as e:
                logger.error(f"Error vectorizing {state_key}: {e}")
                results[state_key] = {"status": "failed", "error": str(e)}
        
        # Build FAISS index
        faiss_result = self.build_faiss_index()
        
        # Save vector database
        self.vector_db["built_at"] = datetime.now().isoformat()
        
        with open(vector_db_file, 'w') as f:
            json.dump(self.vector_db, f, indent=2)
        
        logger.info("Vectorization completed for all states")
        
        return {
            "status": "completed",
            "states_processed": len(results),
            "total_vectors": self.vector_db["total_vectors"],
            "faiss_index": faiss_result,
            "results": results
        }

    def create_semantic_search_prompt(self) -> str:
        """Create prompt for LLM with semantic search instructions"""
        
        prompt = f"""
SEMANTIC REGULATORY SEARCH SYSTEM

You have access to a vectorized database of cannabis regulatory citations with semantic search capabilities.

SEARCH CAPABILITIES:
- Vector similarity search across {self.vector_db['total_vectors']} regulatory citations
- Semantic understanding of regulatory queries
- State-specific filtering available
- Relevance scoring (high/medium/low)

AVAILABLE STATES:
{', '.join(self.vector_db['states'].keys())}

SEARCH EXAMPLES:
- "testing requirements for cannabis products"
- "packaging and labeling regulations"
- "license application procedures"
- "cultivation facility security requirements"
- "transportation and delivery rules"

SEARCH RESPONSE FORMAT:
For each query, provide:
1. The most relevant regulatory citations (top 5)
2. Exact citation strings for verification
3. Relevance score and confidence level
4. State-specific variations if applicable

EXAMPLE RESPONSE:
"Cannabis products must undergo mandatory testing for potency and contaminants before sale.

**Primary Citation:**
CALIFORNIA Regulation - Cannabis Control - Section 5714 (High Relevance: 0.89)

**Supporting Citations:**
- COLORADO Statute - Title 44 - Section 44-10-501 (High Relevance: 0.85)
- WASHINGTON Administrative Code - WAC 314-55-102 (Medium Relevance: 0.72)

**State Variations:**
California requires testing within 24 hours of harvest, while Colorado allows 48 hours."

SEARCH INTEGRATION:
The system automatically searches the vector database for relevant citations when you receive compliance questions. Always provide specific citations with confidence scores.

QUALITY ASSURANCE:
- Verify citation accuracy against source documents
- Provide multiple supporting citations when available
- Indicate confidence levels for all regulatory statements
- Flag any potential inconsistencies between states
"""
        
        return prompt

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Vectorize cannabis compliance citations")
    parser.add_argument('--state', help='Vectorize specific state only')
    parser.add_argument('--all', action='store_true', help='Vectorize all states')
    parser.add_argument('--build-index', action='store_true', help='Build FAISS index')
    parser.add_argument('--search', help='Search for similar citations')
    parser.add_argument('--search-state', help='Limit search to specific state')
    parser.add_argument('--k', type=int, default=10, help='Number of results to return')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    vectorizer = ComplianceVectorizer()
    
    if args.search:
        results = vectorizer.search_similar_citations(args.search, args.k, args.search_state)
        print(f"\nFound {len(results)} similar citations for '{args.search}':")
        for result in results:
            print(f"\n{result['rank']}. {result['citation_string']} (Score: {result['similarity_score']:.3f})")
            print(f"   State: {result['state']} | Type: {result['document_type']} | Relevance: {result['relevance']}")
            print(f"   Content: {result['text_content'][:200]}...")
    elif args.state:
        result = vectorizer.vectorize_state_citations(args.state)
        print(f"Vectorization result: {result}")
    elif args.all:
        result = vectorizer.vectorize_all_states()
        print(f"Vectorization result: {result}")
    elif args.build_index:
        result = vectorizer.build_faiss_index()
        print(f"FAISS index result: {result}")
    else:
        print("Please specify --state <state_name>, --all, --build-index, or --search <query>")

if __name__ == "__main__":
    main()