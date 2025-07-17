#!/usr/bin/env python3
"""
Test AstraDB integration for Compliance Agent
"""
import os
import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.astradb_vector_store import AstraDBVectorStore

async def test_astradb_integration():
    """Test AstraDB integration for compliance agent"""
    print(f"Testing AstraDB integration for compliance agent...")
    
    # Initialize vector store
    vector_store = AstraDBVectorStore("compliance")
    
    # Test document addition
    test_docs = [
        {
            "content": "This is a test document for compliance agent",
            "metadata": {
                "agent_type": "compliance",
                "source": "test",
                "category": "testing"
            }
        }
    ]
    
    try:
        # Add test documents
        doc_ids = vector_store.add_documents(test_docs)
        print(f"Added {len(doc_ids)} test documents")
        
        # Test search
        results = vector_store.similarity_search("test document", k=3)
        print(f"Search returned {len(results)} results")
        
        # Test statistics
        stats = vector_store.get_statistics()
        print(f"Vector store stats: {stats}")
        
        # Cleanup test documents
        for doc_id in doc_ids:
            vector_store.delete_document(doc_id)
        
        print("AstraDB integration test completed successfully!")
        return True
        
    except Exception as e:
        print(f"AstraDB integration test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_astradb_integration())
    sys.exit(0 if success else 1)
