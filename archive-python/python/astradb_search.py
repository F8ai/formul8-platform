#!/usr/bin/env python3
"""
AstraDB Search Backend for Cannabis AI Platform
Handles vector search, document management, and cross-agent queries
"""
import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.astradb_vector_store import AstraDBVectorStore, CannabisKnowledgeBase

def vector_search(params: Dict[str, Any]) -> Dict[str, Any]:
    """Perform vector search on specific agent"""
    try:
        agent_type = params["agent_type"]
        query = params["query"]
        top_k = params.get("top_k", 5)
        filter_metadata = params.get("filter_metadata")
        
        # Initialize vector store
        vector_store = AstraDBVectorStore(agent_type)
        
        # Perform search
        results = vector_store.similarity_search(
            query=query,
            k=top_k,
            filter_metadata=filter_metadata
        )
        
        return {
            "status": "success",
            "agent_type": agent_type,
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "agent_type": params.get("agent_type", "unknown")
        }

def cross_agent_search(params: Dict[str, Any]) -> Dict[str, Any]:
    """Perform search across multiple agents"""
    try:
        query = params["query"]
        agent_types = params.get("agent_types")
        top_k_per_agent = params.get("top_k_per_agent", 3)
        
        # Initialize knowledge base
        knowledge_base = CannabisKnowledgeBase()
        
        # Perform cross-agent search
        results = knowledge_base.cross_agent_search(
            query=query,
            agent_types=agent_types,
            k_per_agent=top_k_per_agent
        )
        
        # Calculate total results
        total_results = sum(len(agent_results) for agent_results in results.values())
        
        return {
            "status": "success",
            "query": query,
            "results": results,
            "total_results": total_results,
            "agents_searched": list(results.keys())
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "query": params.get("query", "unknown")
        }

def add_documents(params: Dict[str, Any]) -> Dict[str, Any]:
    """Add documents to agent's vector store"""
    try:
        agent_type = params["agent_type"]
        documents = params["documents"]
        
        # Initialize vector store
        vector_store = AstraDBVectorStore(agent_type)
        
        # Add documents
        doc_ids = vector_store.add_documents(documents)
        
        return {
            "status": "success",
            "agent_type": agent_type,
            "documents_added": len(doc_ids),
            "document_ids": doc_ids
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "agent_type": params.get("agent_type", "unknown")
        }

def get_agent_stats(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get statistics for specific agent"""
    try:
        agent_type = params["agent_type"]
        
        # Initialize vector store
        vector_store = AstraDBVectorStore(agent_type)
        
        # Get statistics
        stats = vector_store.get_statistics()
        
        return {
            "status": "success",
            "agent_type": agent_type,
            "stats": stats
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "agent_type": params.get("agent_type", "unknown")
        }

def get_knowledge_base_stats() -> Dict[str, Any]:
    """Get statistics for entire knowledge base"""
    try:
        # Initialize knowledge base
        knowledge_base = CannabisKnowledgeBase()
        
        # Get statistics
        stats = knowledge_base.get_knowledge_base_statistics()
        
        return {
            "status": "success",
            "knowledge_base_stats": stats
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def health_check() -> Dict[str, Any]:
    """Check health of AstraDB connection"""
    try:
        # Check environment variables
        token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
        endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        if not token:
            return {
                "status": "unhealthy",
                "error": "Missing ASTRA_DB_APPLICATION_TOKEN"
            }
        
        if not endpoint:
            return {
                "status": "unhealthy",
                "error": "Missing ASTRA_DB_API_ENDPOINT"
            }
        
        if not openai_key:
            return {
                "status": "unhealthy",
                "error": "Missing OPENAI_API_KEY"
            }
        
        # Test connection with a simple operation
        test_store = AstraDBVectorStore("health_test")
        test_count = test_store.get_document_count()
        
        return {
            "status": "healthy",
            "astradb_connected": True,
            "openai_configured": True,
            "test_collection_docs": test_count
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description="AstraDB Search Backend")
    parser.add_argument("command", choices=[
        "search", "cross-search", "add-documents", "stats", 
        "knowledge-base", "health", "migrate"
    ])
    parser.add_argument("params", nargs="?", help="JSON parameters")
    
    args = parser.parse_args()
    
    # Parse parameters
    params = {}
    if args.params:
        try:
            params = json.loads(args.params)
        except json.JSONDecodeError:
            print(json.dumps({"status": "error", "error": "Invalid JSON parameters"}))
            sys.exit(1)
    
    # Execute command
    try:
        if args.command == "search":
            result = vector_search(params)
        elif args.command == "cross-search":
            result = cross_agent_search(params)
        elif args.command == "add-documents":
            result = add_documents(params)
        elif args.command == "stats":
            result = get_agent_stats(params)
        elif args.command == "knowledge-base":
            result = get_knowledge_base_stats()
        elif args.command == "health":
            result = health_check()
        elif args.command == "migrate":
            # Import migration functionality
            from scripts.migrate_to_astradb import AstraDBMigrator
            migrator = AstraDBMigrator()
            
            if params.get("verify_only"):
                result = migrator.verify_migration()
            elif params.get("agent_type"):
                result = migrator.migrate_agent(params["agent_type"])
            else:
                result = migrator.migrate_all_agents()
        else:
            result = {"status": "error", "error": f"Unknown command: {args.command}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "status": "error", 
            "error": str(e),
            "command": args.command
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()