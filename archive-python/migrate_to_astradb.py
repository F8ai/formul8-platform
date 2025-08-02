#!/usr/bin/env python3
"""
Migration script to move all agents from FAISS to AstraDB
Migrates existing corpus data and vectorstores for all 9 cannabis AI agents
"""
import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.astradb_vector_store import AstraDBVectorStore, CannabisKnowledgeBase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AstraDBMigrator:
    """Migrates agent data from FAISS to AstraDB"""
    
    def __init__(self):
        self.agent_types = [
            "compliance", "formulation", "marketing", 
            "operations", "sourcing", "patent", "spectra", "lms"
        ]
        self.knowledge_base = CannabisKnowledgeBase()
        self.migration_stats = {}
    
    def migrate_agent(self, agent_type: str) -> Dict[str, Any]:
        """Migrate a single agent's data to AstraDB"""
        logger.info(f"Starting migration for {agent_type} agent...")
        
        agent_dir = Path(f"{agent_type}-agent")
        if not agent_dir.exists():
            logger.warning(f"Agent directory {agent_dir} not found, skipping...")
            return {"status": "skipped", "reason": "directory not found"}
        
        # Get vector store for this agent
        vector_store = self.knowledge_base.get_agent_store(agent_type)
        
        # Load documents from corpus.jsonl
        corpus_path = agent_dir / "rag" / "corpus.jsonl"
        documents = []
        
        if corpus_path.exists():
            logger.info(f"Loading corpus from {corpus_path}")
            with open(corpus_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        data = json.loads(line.strip())
                        documents.append({
                            'content': data.get('chunk', data.get('content', '')),
                            'metadata': data.get('metadata', {
                                'source': f"corpus_line_{line_num}",
                                'agent_type': agent_type
                            })
                        })
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing line {line_num} in {corpus_path}: {e}")
                        continue
        
        # Load documents from baseline.json if available
        baseline_path = agent_dir / "baseline.json"
        if baseline_path.exists():
            logger.info(f"Loading baseline questions from {baseline_path}")
            with open(baseline_path, 'r', encoding='utf-8') as f:
                try:
                    baseline_data = json.load(f)
                    questions = baseline_data.get('questions', [])
                    
                    for i, question in enumerate(questions):
                        if isinstance(question, dict):
                            content = question.get('question', '')
                            if question.get('expected_answer'):
                                content += f"\n\nExpected Answer: {question['expected_answer']}"
                            
                            documents.append({
                                'content': content,
                                'metadata': {
                                    'source': 'baseline_questions',
                                    'agent_type': agent_type,
                                    'question_id': i,
                                    'category': question.get('category', 'general'),
                                    'difficulty': question.get('difficulty', 'intermediate')
                                }
                            })
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing baseline.json for {agent_type}: {e}")
        
        # Load any additional knowledge from knowledge_base.ttl
        ttl_path = agent_dir / "rag" / "knowledge_base.ttl"
        if ttl_path.exists():
            logger.info(f"Loading TTL knowledge base from {ttl_path}")
            with open(ttl_path, 'r', encoding='utf-8') as f:
                ttl_content = f.read()
                if ttl_content.strip():
                    documents.append({
                        'content': ttl_content,
                        'metadata': {
                            'source': 'knowledge_base_ttl',
                            'agent_type': agent_type,
                            'format': 'turtle_rdf'
                        }
                    })
        
        # Upload documents to AstraDB
        total_docs = len(documents)
        if total_docs > 0:
            logger.info(f"Uploading {total_docs} documents to AstraDB for {agent_type}")
            try:
                # Clear existing documents for this agent first
                vector_store.delete_all_documents()
                
                # Upload in batches to avoid memory issues
                batch_size = 50
                uploaded_count = 0
                
                for i in range(0, total_docs, batch_size):
                    batch = documents[i:i + batch_size]
                    vector_store.add_documents(batch)
                    uploaded_count += len(batch)
                    logger.info(f"Uploaded batch {i//batch_size + 1}: {uploaded_count}/{total_docs} documents")
                
                # Verify upload
                final_count = vector_store.get_document_count()
                logger.info(f"Migration completed for {agent_type}: {final_count} documents in AstraDB")
                
                return {
                    "status": "success",
                    "documents_migrated": final_count,
                    "sources": ["corpus.jsonl", "baseline.json", "knowledge_base.ttl"]
                }
                
            except Exception as e:
                logger.error(f"Error uploading documents for {agent_type}: {e}")
                return {"status": "error", "error": str(e)}
        else:
            logger.warning(f"No documents found for {agent_type}")
            return {"status": "skipped", "reason": "no documents found"}
    
    def migrate_all_agents(self) -> Dict[str, Any]:
        """Migrate all agents to AstraDB"""
        logger.info("Starting migration of all agents to AstraDB...")
        
        results = {}
        total_migrated = 0
        
        for agent_type in self.agent_types:
            try:
                result = self.migrate_agent(agent_type)
                results[agent_type] = result
                
                if result["status"] == "success":
                    total_migrated += result["documents_migrated"]
                    
            except Exception as e:
                logger.error(f"Failed to migrate {agent_type}: {e}")
                results[agent_type] = {"status": "error", "error": str(e)}
        
        # Generate migration summary
        summary = {
            "total_agents": len(self.agent_types),
            "successful_migrations": sum(1 for r in results.values() if r["status"] == "success"),
            "total_documents_migrated": total_migrated,
            "agents": results,
            "migration_timestamp": str(pd.Timestamp.now())
        }
        
        logger.info(f"Migration completed: {summary['successful_migrations']}/{summary['total_agents']} agents migrated")
        logger.info(f"Total documents migrated: {summary['total_documents_migrated']}")
        
        return summary
    
    def verify_migration(self) -> Dict[str, Any]:
        """Verify that all agents have been successfully migrated"""
        logger.info("Verifying migration status...")
        
        verification_results = {}
        
        for agent_type in self.agent_types:
            try:
                vector_store = self.knowledge_base.get_agent_store(agent_type)
                stats = vector_store.get_statistics()
                
                verification_results[agent_type] = {
                    "status": "verified",
                    "document_count": stats["total_documents"],
                    "metadata_categories": stats["metadata_categories"],
                    "collection_name": stats["collection_name"]
                }
                
                # Test search functionality
                test_results = vector_store.similarity_search("cannabis", k=3)
                verification_results[agent_type]["search_test"] = {
                    "results_count": len(test_results),
                    "search_working": len(test_results) > 0
                }
                
            except Exception as e:
                verification_results[agent_type] = {
                    "status": "error",
                    "error": str(e)
                }
        
        return verification_results
    
    def generate_migration_report(self) -> str:
        """Generate a comprehensive migration report"""
        kb_stats = self.knowledge_base.get_knowledge_base_statistics()
        
        report = f"""
AstraDB Migration Report
=======================

Migration Summary:
- Total Agents: {kb_stats['total_agents']}
- Total Documents: {kb_stats['total_documents']}
- Migration Date: {kb_stats['last_updated']}

Agent Details:
"""
        
        for agent_type, stats in kb_stats['agents'].items():
            report += f"""
{agent_type.title()} Agent:
  - Documents: {stats['total_documents']}
  - Collection: {stats['collection_name']}
  - Metadata Categories: {', '.join(stats['metadata_categories'])}
  - Vector Dimension: {stats['vector_dimension']}
"""
        
        return report

def main():
    """Main migration function"""
    logger.info("Starting AstraDB migration for Cannabis AI Platform...")
    
    # Check environment variables
    required_vars = ["ASTRA_DB_APPLICATION_TOKEN", "ASTRA_DB_API_ENDPOINT", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        sys.exit(1)
    
    # Initialize migrator
    migrator = AstraDBMigrator()
    
    # Perform migration
    try:
        # Migrate all agents
        migration_results = migrator.migrate_all_agents()
        
        # Verify migration
        verification_results = migrator.verify_migration()
        
        # Generate report
        report = migrator.generate_migration_report()
        
        # Save results
        with open("migration_results.json", "w") as f:
            json.dump({
                "migration": migration_results,
                "verification": verification_results
            }, f, indent=2)
        
        with open("migration_report.txt", "w") as f:
            f.write(report)
        
        logger.info("Migration completed successfully!")
        logger.info("Results saved to migration_results.json")
        logger.info("Report saved to migration_report.txt")
        
        print(report)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()