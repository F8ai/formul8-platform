#!/usr/bin/env python3
"""
Quick Pipeline Demo - Shows state-by-state processing in action
"""

import json
import asyncio
from pathlib import Path
from datetime import datetime
from state_pipeline import StatePipeline, MultiStatePipelineManager
import subprocess

async def demo_single_state():
    """Demonstrate single state processing"""
    print("=== DEMO: Single State Processing (Colorado) ===")
    
    # Create pipeline for Colorado
    pipeline = StatePipeline("co")
    
    print(f"✓ Created pipeline for Colorado")
    print(f"  State directory: {pipeline.state_dir}")
    print(f"  Mirrors directory: {pipeline.mirrors_dir}")
    print(f"  Citations directory: {pipeline.citations_dir}")
    print(f"  Vectors directory: {pipeline.vectors_dir}")
    
    # Show current status
    print(f"  Current phase: {pipeline.pipeline_status['current_phase']}")
    print(f"  Completed phases: {pipeline.pipeline_status['completed_phases']}")
    
    # Check if we have any mirrored files
    mirrored_files = list(pipeline.mirrors_dir.rglob("*.html"))
    print(f"  Files currently mirrored: {len(mirrored_files)}")
    
    if mirrored_files:
        print(f"  Example file: {mirrored_files[0]}")
        
        # Show file content sample
        with open(mirrored_files[0], 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()[:500]
            print(f"  Content preview: {content[:100]}...")
    
    print()
    
    # Run citation extraction phase only (skip mirroring since it's slow)
    print("=== Running Citation Extraction Phase ===")
    result = await pipeline.phase_2_extract_citations()
    
    print(f"✓ Citation extraction completed")
    print(f"  Status: {result.get('status', 'unknown')}")
    print(f"  Citations extracted: {result.get('total_citations', 0)}")
    print(f"  Files processed: {result.get('files_processed', 0)}")
    
    # Show some example citations
    if result.get('citations'):
        print(f"  Example citations:")
        for i, citation in enumerate(result['citations'][:3]):
            print(f"    {i+1}. State: {citation['state']}, Section: {citation['section']}")
    
    print()
    
    # Run vectorization phase
    print("=== Running Vectorization Phase ===")
    vector_result = await pipeline.phase_3_create_vectors()
    
    print(f"✓ Vectorization completed")
    print(f"  Status: {vector_result.get('status', 'unknown')}")
    print(f"  Vectors created: {vector_result.get('total_vectors', 0)}")
    print(f"  Embedding dimension: {vector_result.get('embedding_dimension', 0)}")
    
    print()
    
    # Run validation phase
    print("=== Running Validation Phase ===")
    validation_result = await pipeline.phase_4_validate_data()
    
    print(f"✓ Validation completed")
    print(f"  Data quality score: {validation_result.get('validation_metrics', {}).get('data_quality_score', 0):.2f}")
    print(f"  Completeness score: {validation_result.get('validation_metrics', {}).get('completeness_score', 0):.2f}")
    print(f"  Accuracy score: {validation_result.get('validation_metrics', {}).get('accuracy_score', 0):.2f}")
    print(f"  Validation passed: {validation_result.get('validation_passed', False)}")
    
    print()
    
    # Show final pipeline status
    print("=== Final Pipeline Status ===")
    print(f"  Completed phases: {pipeline.pipeline_status['completed_phases']}")
    print(f"  Failed phases: {pipeline.pipeline_status['failed_phases']}")
    print(f"  Total files mirrored: {pipeline.pipeline_status['metrics']['files_mirrored']}")
    print(f"  Total citations extracted: {pipeline.pipeline_status['metrics']['citations_extracted']}")
    print(f"  Total vectors created: {pipeline.pipeline_status['metrics']['vectors_created']}")
    
    return pipeline.pipeline_status

async def demo_directory_structure():
    """Show the directory structure created by the pipeline"""
    print("=== DEMO: Directory Structure ===")
    
    # Show the state directory structure
    states_dir = Path("states")
    if states_dir.exists():
        print(f"✓ States directory exists: {states_dir.absolute()}")
        
        # Show all state directories
        for state_dir in states_dir.iterdir():
            if state_dir.is_dir():
                print(f"  State: {state_dir.name}")
                
                # Show subdirectories
                for subdir in ["mirrors", "citations", "vectors", "validation"]:
                    subdir_path = state_dir / subdir
                    if subdir_path.exists():
                        file_count = len(list(subdir_path.rglob("*")))
                        print(f"    {subdir}/: {file_count} files")
                
                # Show status files
                status_file = state_dir / "pipeline_status.json"
                if status_file.exists():
                    with open(status_file, 'r') as f:
                        status = json.load(f)
                    print(f"    Status: {status['current_phase']} (phases: {len(status['completed_phases'])} complete)")
    
    print()

async def demo_parallel_processing():
    """Demonstrate parallel processing capabilities"""
    print("=== DEMO: Parallel Processing Capability ===")
    
    # Create manager
    manager = MultiStatePipelineManager()
    
    print(f"✓ Created pipeline manager")
    print(f"  Available states: {len(manager.available_states)}")
    print(f"  States: {', '.join(manager.available_states[:10])}...")
    
    # Show manager status
    print(f"  Manager started at: {manager.manager_status['started_at']}")
    print(f"  Total states to process: {manager.manager_status['total_states']}")
    
    # Simulate processing a few states (without actual processing)
    test_states = ["co", "ca", "wa"]
    print(f"  Would process states: {test_states}")
    print(f"  With parallel workers: 3")
    print(f"  Estimated time: {len(test_states) * 2} minutes")
    
    print()

async def demo_unified_search():
    """Demonstrate unified search index creation"""
    print("=== DEMO: Unified Search Index ===")
    
    # Create manager
    manager = MultiStatePipelineManager()
    
    # Create unified search index
    unified_index = manager.create_unified_search_index()
    
    print(f"✓ Created unified search index")
    print(f"  Total citations: {unified_index['total_citations']}")
    print(f"  Total vectors: {unified_index['total_vectors']}")
    print(f"  States included: {unified_index['states_included']}")
    
    # Show some example data
    if unified_index['citations']:
        print(f"  Example citations:")
        for i, citation in enumerate(unified_index['citations'][:3]):
            print(f"    {i+1}. {citation['state'].upper()}: {citation['section']}")
    
    print()
    
    # Show aggregated directory
    aggregated_dir = Path("aggregated")
    if aggregated_dir.exists():
        print(f"✓ Aggregated directory: {aggregated_dir.absolute()}")
        for file in aggregated_dir.glob("*.json"):
            print(f"  {file.name}: {file.stat().st_size} bytes")
    
    print()

async def main():
    """Run all demos"""
    print("🚀 STATE-BY-STATE PROCESSING PIPELINE DEMO")
    print("=" * 50)
    print()
    
    # Change to compliance_data directory
    import os
    os.chdir(Path(__file__).parent.parent)
    
    # Run demos
    await demo_directory_structure()
    await demo_single_state()
    await demo_parallel_processing()
    await demo_unified_search()
    
    print("✅ Demo completed successfully!")
    print()
    print("KEY BENEFITS:")
    print("- ✓ State isolation prevents confusion")
    print("- ✓ Parallel processing for speed")
    print("- ✓ Progressive deployment")
    print("- ✓ Fault tolerance")
    print("- ✓ Unified search across all states")
    print("- ✓ Easy debugging and maintenance")

if __name__ == "__main__":
    asyncio.run(main())