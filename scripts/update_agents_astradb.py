#!/usr/bin/env python3
"""
Update all agents to use AstraDB instead of FAISS
Updates agent.py files across all 9 cannabis AI agents
"""
import os
import sys
import re
from pathlib import Path
from typing import List, Dict, Any

# Agent types to update
AGENT_TYPES = [
    "compliance", "formulation", "marketing", 
    "operations", "sourcing", "patent", "spectra"
]

def update_agent_file(agent_type: str) -> Dict[str, Any]:
    """Update a single agent's Python file for AstraDB integration"""
    agent_dir = Path(f"{agent_type}-agent")
    agent_file = agent_dir / "agent.py"
    
    if not agent_file.exists():
        return {"status": "skipped", "reason": f"Agent file not found: {agent_file}"}
    
    try:
        # Read current file content
        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update BaseRetriever initialization
        old_pattern = r'self\.retriever = BaseRetriever\(rag_config_path\)'
        new_pattern = f'self.retriever = BaseRetriever(rag_config_path, agent_type="{agent_type}", use_astradb=True)'
        
        if re.search(old_pattern, content):
            content = re.sub(old_pattern, new_pattern, content)
        else:
            # Look for alternative patterns
            alt_pattern = r'self\.retriever = BaseRetriever\(([^)]+)\)'
            if re.search(alt_pattern, content):
                content = re.sub(
                    alt_pattern,
                    f'self.retriever = BaseRetriever(\\1, agent_type="{agent_type}", use_astradb=True)',
                    content
                )
        
        # Add AstraDB import if not present
        if "from .astradb_vector_store import" not in content:
            import_pattern = r'from retriever_utils import (.+)'
            if re.search(import_pattern, content):
                content = re.sub(
                    import_pattern,
                    r'from retriever_utils import \1\nfrom astradb_vector_store import AstraDBVectorStore',
                    content
                )
        
        # Write updated content
        with open(agent_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {"status": "updated", "file": str(agent_file)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

def update_requirements_files():
    """Update requirements.txt files to include AstraDB dependencies"""
    astradb_deps = [
        "astrapy>=2.0.0",
        "cassandra-driver>=3.29.0"
    ]
    
    results = {}
    
    for agent_type in AGENT_TYPES:
        agent_dir = Path(f"{agent_type}-agent")
        req_file = agent_dir / "requirements.txt"
        
        if not req_file.exists():
            continue
        
        try:
            with open(req_file, 'r', encoding='utf-8') as f:
                current_deps = f.read().strip().split('\n')
            
            # Add AstraDB dependencies if not present
            updated_deps = current_deps.copy()
            
            for dep in astradb_deps:
                dep_name = dep.split('>=')[0]
                if not any(dep_name in existing_dep for existing_dep in current_deps):
                    updated_deps.append(dep)
            
            # Write updated requirements
            with open(req_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(updated_deps) + '\n')
            
            results[agent_type] = {"status": "updated", "added_deps": astradb_deps}
            
        except Exception as e:
            results[agent_type] = {"status": "error", "error": str(e)}
    
    return results

def create_astradb_config_for_agent(agent_type: str) -> Dict[str, Any]:
    """Create AstraDB-specific configuration for each agent"""
    agent_dir = Path(f"{agent_type}-agent")
    config_file = agent_dir / "rag" / "astradb_config.yaml"
    
    # Ensure rag directory exists
    (agent_dir / "rag").mkdir(exist_ok=True)
    
    config_content = f"""# AstraDB Configuration for {agent_type.title()} Agent
astradb:
  collection_name: "cannabis_{agent_type}_vectors"
  vector_dimension: 1536
  distance_metric: "cosine"
  
  # Connection (loaded from environment)
  token_env: "ASTRA_DB_APPLICATION_TOKEN"
  endpoint_env: "ASTRA_DB_API_ENDPOINT"

# Embedding configuration
embedding:
  provider: "openai"
  model: "text-embedding-3-small"
  api_key_env: "OPENAI_API_KEY"

# Retrieval settings
retrieval:
  top_k: 5
  similarity_threshold: 0.7
  
# Agent-specific metadata schema
metadata_schema:
  required_fields:
    - agent_type
    - source
    - created_at
  
  optional_fields:
"""
    
    # Add agent-specific metadata fields
    agent_metadata = {
        "compliance": ["state", "regulation_type", "compliance_category", "citation"],
        "formulation": ["product_type", "cannabinoid_profile", "terpene_profile", "potency_range"],
        "marketing": ["campaign_type", "target_audience", "platform", "market_segment"],
        "operations": ["operation_type", "business_function", "process_category", "efficiency_metric"],
        "sourcing": ["vendor_type", "product_category", "quality_grade", "certification_level"],
        "patent": ["patent_type", "filing_date", "patent_status", "technology_area", "fto_risk_level"],
        "spectra": ["test_type", "analysis_method", "sample_type", "testing_facility"],
        "lms": ["training_type", "skill_level", "certification_level", "module_category"]
    }
    
    for field in agent_metadata.get(agent_type, []):
        config_content += f"    - {field}\n"
    
    config_content += """
# Performance settings
performance:
  batch_size: 50
  max_concurrent_queries: 5
  cache_ttl: 3600
"""
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        return {"status": "created", "file": str(config_file)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

def update_agent_config_yaml(agent_type: str) -> Dict[str, Any]:
    """Update agent_config.yaml to include AstraDB settings"""
    agent_dir = Path(f"{agent_type}-agent")
    config_file = agent_dir / "agent_config.yaml"
    
    if not config_file.exists():
        return {"status": "skipped", "reason": "agent_config.yaml not found"}
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add AstraDB configuration section
        astradb_config = f"""
# AstraDB Vector Storage Configuration
vector_storage:
  provider: "astradb"
  collection_name: "cannabis_{agent_type}_vectors"
  use_local_fallback: true
  
  # Migration settings
  migration:
    auto_migrate_from_faiss: true
    backup_faiss_index: true
    verify_migration: true
"""
        
        # Add the configuration if not already present
        if "vector_storage:" not in content:
            content += astradb_config
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {"status": "updated", "file": str(config_file)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

def create_astradb_test_script(agent_type: str) -> Dict[str, Any]:
    """Create test script for AstraDB integration"""
    agent_dir = Path(f"{agent_type}-agent")
    test_file = agent_dir / "test_astradb.py"
    
    test_content = f'''#!/usr/bin/env python3
"""
Test AstraDB integration for {agent_type.title()} Agent
"""
import os
import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.astradb_vector_store import AstraDBVectorStore

async def test_astradb_integration():
    """Test AstraDB integration for {agent_type} agent"""
    print(f"Testing AstraDB integration for {agent_type} agent...")
    
    # Initialize vector store
    vector_store = AstraDBVectorStore("{agent_type}")
    
    # Test document addition
    test_docs = [
        {{
            "content": "This is a test document for {agent_type} agent",
            "metadata": {{
                "agent_type": "{agent_type}",
                "source": "test",
                "category": "testing"
            }}
        }}
    ]
    
    try:
        # Add test documents
        doc_ids = vector_store.add_documents(test_docs)
        print(f"Added {{len(doc_ids)}} test documents")
        
        # Test search
        results = vector_store.similarity_search("test document", k=3)
        print(f"Search returned {{len(results)}} results")
        
        # Test statistics
        stats = vector_store.get_statistics()
        print(f"Vector store stats: {{stats}}")
        
        # Cleanup test documents
        for doc_id in doc_ids:
            vector_store.delete_document(doc_id)
        
        print("AstraDB integration test completed successfully!")
        return True
        
    except Exception as e:
        print(f"AstraDB integration test failed: {{e}}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_astradb_integration())
    sys.exit(0 if success else 1)
'''
    
    try:
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        # Make executable
        os.chmod(test_file, 0o755)
        
        return {"status": "created", "file": str(test_file)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

def main():
    """Main function to update all agents for AstraDB"""
    print("Updating all agents for AstraDB integration...")
    
    results = {
        "agent_updates": {},
        "requirements_updates": {},
        "config_creation": {},
        "yaml_updates": {},
        "test_creation": {}
    }
    
    # Update agent Python files
    for agent_type in AGENT_TYPES:
        print(f"Updating {agent_type} agent...")
        results["agent_updates"][agent_type] = update_agent_file(agent_type)
        results["config_creation"][agent_type] = create_astradb_config_for_agent(agent_type)
        results["yaml_updates"][agent_type] = update_agent_config_yaml(agent_type)
        results["test_creation"][agent_type] = create_astradb_test_script(agent_type)
    
    # Update requirements files
    print("Updating requirements files...")
    results["requirements_updates"] = update_requirements_files()
    
    # Print summary
    print("\n" + "="*50)
    print("AstraDB Integration Update Summary")
    print("="*50)
    
    for category, category_results in results.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for agent, result in category_results.items():
            status = result.get("status", "unknown")
            print(f"  {agent}: {status}")
    
    print("\nNext steps:")
    print("1. Run the migration script: python scripts/migrate_to_astradb.py")
    print("2. Test individual agents: python {agent}-agent/test_astradb.py")
    print("3. Update environment variables with AstraDB credentials")
    
    # Save detailed results
    import json
    with open("astradb_update_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\nDetailed results saved to astradb_update_results.json")

if __name__ == "__main__":
    main()