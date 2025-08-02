#!/usr/bin/env python3
"""
Data Validation System for Cannabis Compliance Collection

Validates completeness and quality of collected compliance data,
ensuring comprehensive coverage of all regulatory requirements.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Optional, Tuple
import re
from collections import defaultdict
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComplianceDataValidator:
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.states_dir = self.base_dir / "states"
        
        # Load state sources for validation
        with open(self.base_dir / "state_sources.json", 'r') as f:
            self.state_sources = json.load(f)
        
        # Critical compliance topics that must be covered
        self.critical_topics = {
            "licensing": [
                "license", "permit", "authorization", "registration",
                "application", "renewal", "transfer", "amendment"
            ],
            "cultivation": [
                "cultivation", "growing", "plant", "seed", "clone",
                "harvest", "trim", "cure", "canopy", "flowering"
            ],
            "manufacturing": [
                "manufacturing", "processing", "extraction", "infusion",
                "concentrate", "edible", "topical", "tincture", "oil"
            ],
            "testing": [
                "testing", "laboratory", "analysis", "potency", "contamination",
                "pesticide", "residual", "solvent", "microbial", "heavy metal"
            ],
            "packaging": [
                "packaging", "labeling", "label", "container", "childproof",
                "tamper", "batch", "lot", "expiration", "ingredients"
            ],
            "transportation": [
                "transportation", "transport", "delivery", "manifest",
                "vehicle", "route", "tracking", "chain of custody"
            ],
            "retail": [
                "retail", "dispensary", "sale", "customer", "purchase",
                "inventory", "point of sale", "transaction", "receipt"
            ],
            "security": [
                "security", "surveillance", "camera", "alarm", "access",
                "storage", "vault", "safe", "monitoring", "tracking"
            ],
            "compliance": [
                "compliance", "inspection", "audit", "violation", "penalty",
                "fine", "enforcement", "reporting", "record", "documentation"
            ],
            "taxation": [
                "tax", "excise", "revenue", "fee", "assessment",
                "collection", "payment", "exemption", "rate"
            ]
        }
        
        # Validation results
        self.validation_results = {
            "validated_at": datetime.now().isoformat(),
            "overall_status": "unknown",
            "states": {},
            "summary": {},
            "recommendations": []
        }

    def validate_state_structure(self, state_key: str) -> Dict:
        """Validate directory structure and file presence for a state"""
        state_dir = self.states_dir / state_key
        
        validation = {
            "state": state_key,
            "structure_valid": True,
            "required_directories": {
                "regulations": state_dir / "regulations",
                "pdfs": state_dir / "pdfs", 
                "processed": state_dir / "processed",
                "logs": state_dir / "logs"
            },
            "missing_directories": [],
            "file_counts": {},
            "metadata_present": False,
            "issues": []
        }
        
        # Check directory structure
        for dir_name, dir_path in validation["required_directories"].items():
            if not dir_path.exists():
                validation["missing_directories"].append(dir_name)
                validation["structure_valid"] = False
            else:
                # Count files in each directory
                file_count = len(list(dir_path.glob("*")))
                validation["file_counts"][dir_name] = file_count
        
        # Check for metadata file
        metadata_path = state_dir / "metadata.json"
        if metadata_path.exists():
            validation["metadata_present"] = True
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                validation["metadata"] = metadata
            except Exception as e:
                validation["issues"].append(f"Invalid metadata.json: {str(e)}")
        else:
            validation["issues"].append("metadata.json not found")
        
        return validation

    def validate_content_coverage(self, state_key: str) -> Dict:
        """Validate content coverage for critical compliance topics"""
        state_dir = self.states_dir / state_key
        processed_dir = state_dir / "processed"
        
        coverage = {
            "state": state_key,
            "topic_coverage": {},
            "total_documents": 0,
            "total_text_length": 0,
            "coverage_score": 0.0,
            "missing_topics": [],
            "well_covered_topics": [],
            "document_types": defaultdict(int)
        }
        
        if not processed_dir.exists():
            coverage["issues"] = ["No processed documents found"]
            return coverage
        
        # Collect all text content
        all_text = ""
        document_count = 0
        
        for json_file in processed_dir.glob("*_extracted.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if data.get("success", False):
                    document_count += 1
                    
                    # Determine document type
                    filename = data.get("filename", "")
                    if "regulation" in filename.lower():
                        coverage["document_types"]["regulation"] += 1
                    elif "form" in filename.lower():
                        coverage["document_types"]["form"] += 1
                    elif "guidance" in filename.lower():
                        coverage["document_types"]["guidance"] += 1
                    elif "statute" in filename.lower():
                        coverage["document_types"]["statute"] += 1
                    else:
                        coverage["document_types"]["other"] += 1
                    
                    # Collect text
                    for page_data in data.get("text_content", []):
                        text = page_data.get("text", "")
                        all_text += " " + text.lower()
            
            except Exception as e:
                logger.debug(f"Error reading {json_file}: {str(e)}")
        
        coverage["total_documents"] = document_count
        coverage["total_text_length"] = len(all_text)
        
        # Analyze topic coverage
        topics_found = 0
        total_topics = len(self.critical_topics)
        
        for topic_name, keywords in self.critical_topics.items():
            matches = 0
            matched_keywords = []
            
            for keyword in keywords:
                if keyword in all_text:
                    matches += 1
                    matched_keywords.append(keyword)
            
            coverage_percentage = (matches / len(keywords)) * 100
            coverage["topic_coverage"][topic_name] = {
                "coverage_percentage": coverage_percentage,
                "matched_keywords": matched_keywords,
                "total_keywords": len(keywords),
                "matches": matches
            }
            
            if coverage_percentage >= 70:
                coverage["well_covered_topics"].append(topic_name)
                topics_found += 1
            elif coverage_percentage < 30:
                coverage["missing_topics"].append(topic_name)
        
        coverage["coverage_score"] = (topics_found / total_topics) * 100
        
        return coverage

    def validate_data_quality(self, state_key: str) -> Dict:
        """Validate data quality metrics"""
        state_dir = self.states_dir / state_key
        processed_dir = state_dir / "processed"
        
        quality = {
            "state": state_key,
            "processing_success_rate": 0.0,
            "average_document_length": 0,
            "extraction_methods": defaultdict(int),
            "processing_errors": [],
            "duplicate_detection": {},
            "text_quality_score": 0.0,
            "recommendations": []
        }
        
        if not processed_dir.exists():
            quality["issues"] = ["No processed documents found"]
            return quality
        
        # Analyze processing results
        successful_extractions = 0
        failed_extractions = 0
        total_text_length = 0
        document_lengths = []
        file_hashes = set()
        duplicates = []
        
        for json_file in processed_dir.glob("*_extracted.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if data.get("success", False):
                    successful_extractions += 1
                    
                    # Track extraction method
                    method = data.get("extraction_method", "unknown")
                    quality["extraction_methods"][method] += 1
                    
                    # Document length analysis
                    doc_length = data.get("total_characters", 0)
                    document_lengths.append(doc_length)
                    total_text_length += doc_length
                    
                    # Duplicate detection
                    file_hash = data.get("file_hash", "")
                    if file_hash in file_hashes:
                        duplicates.append(data.get("filename", "unknown"))
                    else:
                        file_hashes.add(file_hash)
                
                else:
                    failed_extractions += 1
                    errors = data.get("errors", [])
                    quality["processing_errors"].extend(errors)
            
            except Exception as e:
                logger.debug(f"Error analyzing {json_file}: {str(e)}")
                failed_extractions += 1
        
        total_documents = successful_extractions + failed_extractions
        
        if total_documents > 0:
            quality["processing_success_rate"] = (successful_extractions / total_documents) * 100
        
        if document_lengths:
            quality["average_document_length"] = sum(document_lengths) / len(document_lengths)
        
        quality["duplicate_detection"] = {
            "total_duplicates": len(duplicates),
            "duplicate_files": duplicates,
            "unique_documents": len(file_hashes)
        }
        
        # Text quality assessment
        if total_text_length > 0:
            # Simple quality metrics
            avg_length = quality["average_document_length"]
            if avg_length > 5000:  # Good length documents
                quality["text_quality_score"] += 30
            elif avg_length > 1000:  # Moderate length
                quality["text_quality_score"] += 20
            
            # Processing method quality
            if quality["extraction_methods"].get("pdfplumber", 0) > 0:
                quality["text_quality_score"] += 25
            if quality["extraction_methods"].get("pymupdf", 0) > 0:
                quality["text_quality_score"] += 20
            if quality["extraction_methods"].get("pypdf2", 0) > 0:
                quality["text_quality_score"] += 15
            if quality["extraction_methods"].get("ocr", 0) > 0:
                quality["text_quality_score"] += 10
            
            # Success rate impact
            if quality["processing_success_rate"] >= 90:
                quality["text_quality_score"] += 25
            elif quality["processing_success_rate"] >= 70:
                quality["text_quality_score"] += 15
            elif quality["processing_success_rate"] >= 50:
                quality["text_quality_score"] += 10
        
        # Generate recommendations
        if quality["processing_success_rate"] < 70:
            quality["recommendations"].append("Low processing success rate - consider recollecting data")
        
        if quality["average_document_length"] < 1000:
            quality["recommendations"].append("Short documents detected - may indicate incomplete extraction")
        
        if len(duplicates) > 0:
            quality["recommendations"].append(f"Found {len(duplicates)} duplicate documents")
        
        if quality["extraction_methods"].get("ocr", 0) > quality["extraction_methods"].get("pdfplumber", 0):
            quality["recommendations"].append("High OCR usage - documents may be scanned images")
        
        return quality

    def validate_regulatory_completeness(self, state_key: str) -> Dict:
        """Validate completeness of regulatory coverage"""
        state_dir = self.states_dir / state_key
        
        completeness = {
            "state": state_key,
            "source_urls_collected": 0,
            "expected_urls": 0,
            "url_coverage": 0.0,
            "regulatory_categories": {
                "statutes": False,
                "regulations": False,
                "guidance": False,
                "forms": False,
                "applications": False
            },
            "missing_categories": [],
            "collection_gaps": [],
            "completeness_score": 0.0
        }
        
        # Get expected URLs from state sources
        state_data = self.state_sources["cannabis_legal_states"].get(state_key, {})
        expected_urls = [
            state_data.get("main_url", ""),
            state_data.get("regulations_url", "")
        ] + state_data.get("additional_sources", [])
        
        expected_urls = [url for url in expected_urls if url]
        completeness["expected_urls"] = len(expected_urls)
        
        # Check metadata for collected URLs
        metadata_path = state_dir / "metadata.json"
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                collected_urls = metadata.get("urls_processed", [])
                completeness["source_urls_collected"] = len(collected_urls)
                
                if len(expected_urls) > 0:
                    completeness["url_coverage"] = (len(collected_urls) / len(expected_urls)) * 100
            
            except Exception as e:
                logger.debug(f"Error reading metadata for {state_key}: {str(e)}")
        
        # Analyze document categories
        processed_dir = state_dir / "processed"
        if processed_dir.exists():
            all_filenames = []
            
            for json_file in processed_dir.glob("*_extracted.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    if data.get("success", False):
                        filename = data.get("filename", "").lower()
                        all_filenames.append(filename)
                
                except Exception as e:
                    logger.debug(f"Error reading {json_file}: {str(e)}")
            
            # Check for regulatory categories
            for category, keywords in {
                "statutes": ["statute", "law", "code", "title"],
                "regulations": ["regulation", "rule", "ccr", "administrative"],
                "guidance": ["guidance", "guide", "policy", "advisory"],
                "forms": ["form", "application", "worksheet"],
                "applications": ["application", "license", "permit"]
            }.items():
                found = any(any(keyword in filename for keyword in keywords) for filename in all_filenames)
                completeness["regulatory_categories"][category] = found
                
                if not found:
                    completeness["missing_categories"].append(category)
        
        # Calculate completeness score
        score = 0
        
        # URL coverage (40% of score)
        score += (completeness["url_coverage"] / 100) * 40
        
        # Category coverage (60% of score)
        categories_found = sum(1 for found in completeness["regulatory_categories"].values() if found)
        total_categories = len(completeness["regulatory_categories"])
        score += (categories_found / total_categories) * 60
        
        completeness["completeness_score"] = score
        
        # Generate collection gaps
        if completeness["url_coverage"] < 100:
            completeness["collection_gaps"].append("Not all source URLs were processed")
        
        for category in completeness["missing_categories"]:
            completeness["collection_gaps"].append(f"Missing {category} documents")
        
        return completeness

    def validate_single_state(self, state_key: str) -> Dict:
        """Perform comprehensive validation for a single state"""
        logger.info(f"Validating compliance data for {state_key}")
        
        state_validation = {
            "state": state_key,
            "validated_at": datetime.now().isoformat(),
            "overall_score": 0.0,
            "status": "unknown",
            "validations": {}
        }
        
        # Run all validation checks
        validations = {
            "structure": self.validate_state_structure(state_key),
            "content_coverage": self.validate_content_coverage(state_key),
            "data_quality": self.validate_data_quality(state_key),
            "regulatory_completeness": self.validate_regulatory_completeness(state_key)
        }
        
        state_validation["validations"] = validations
        
        # Calculate overall score
        scores = []
        
        # Structure score (20%)
        if validations["structure"]["structure_valid"]:
            scores.append(100 * 0.2)
        else:
            scores.append(50 * 0.2)  # Partial credit if some structure exists
        
        # Content coverage score (30%)
        coverage_score = validations["content_coverage"].get("coverage_score", 0)
        scores.append(coverage_score * 0.3)
        
        # Data quality score (30%)
        quality_score = validations["data_quality"].get("text_quality_score", 0)
        scores.append(quality_score * 0.3)
        
        # Regulatory completeness score (20%)
        completeness_score = validations["regulatory_completeness"].get("completeness_score", 0)
        scores.append(completeness_score * 0.2)
        
        state_validation["overall_score"] = sum(scores)
        
        # Determine status
        if state_validation["overall_score"] >= 80:
            state_validation["status"] = "excellent"
        elif state_validation["overall_score"] >= 60:
            state_validation["status"] = "good"
        elif state_validation["overall_score"] >= 40:
            state_validation["status"] = "needs_improvement"
        else:
            state_validation["status"] = "poor"
        
        # Save individual state validation
        validation_path = self.states_dir / state_key / "validation_report.json"
        with open(validation_path, 'w') as f:
            json.dump(state_validation, f, indent=2)
        
        logger.info(f"Validation completed for {state_key}: {state_validation['status']} "
                   f"({state_validation['overall_score']:.1f}%)")
        
        return state_validation

    def validate_all_states(self) -> Dict:
        """Validate compliance data for all states"""
        logger.info("Starting comprehensive validation of all states")
        
        # Get all state directories
        state_dirs = [d for d in self.states_dir.iterdir() if d.is_dir()]
        
        if not state_dirs:
            logger.warning("No state directories found for validation")
            return {"status": "no_states", "validated": 0}
        
        # Validate each state
        for state_dir in state_dirs:
            state_key = state_dir.name
            
            try:
                state_validation = self.validate_single_state(state_key)
                self.validation_results["states"][state_key] = state_validation
                
            except Exception as e:
                logger.error(f"Error validating {state_key}: {str(e)}")
                self.validation_results["states"][state_key] = {
                    "status": "validation_failed",
                    "error": str(e)
                }
        
        # Generate overall summary
        self.generate_validation_summary()
        
        # Save overall validation results
        results_path = self.base_dir / "validation_results.json"
        with open(results_path, 'w') as f:
            json.dump(self.validation_results, f, indent=2)
        
        logger.info("Validation completed for all states")
        return self.validation_results

    def generate_validation_summary(self):
        """Generate summary of validation results"""
        states = self.validation_results["states"]
        total_states = len(states)
        
        if total_states == 0:
            return
        
        # Status distribution
        status_counts = defaultdict(int)
        score_sum = 0
        
        for state_data in states.values():
            if isinstance(state_data, dict) and "status" in state_data:
                status_counts[state_data["status"]] += 1
                score_sum += state_data.get("overall_score", 0)
        
        # Calculate averages
        avg_score = score_sum / total_states if total_states > 0 else 0
        
        # Generate recommendations
        recommendations = []
        
        if status_counts["poor"] > 0:
            recommendations.append(f"{status_counts['poor']} states need significant data improvement")
        
        if status_counts["needs_improvement"] > 0:
            recommendations.append(f"{status_counts['needs_improvement']} states need moderate improvements")
        
        if avg_score < 60:
            recommendations.append("Overall data quality is below acceptable threshold")
        
        if status_counts["excellent"] > total_states * 0.7:
            recommendations.append("Most states have excellent data quality")
        
        # Set overall status
        if avg_score >= 80:
            overall_status = "excellent"
        elif avg_score >= 60:
            overall_status = "good"
        elif avg_score >= 40:
            overall_status = "needs_improvement"
        else:
            overall_status = "poor"
        
        self.validation_results["overall_status"] = overall_status
        self.validation_results["summary"] = {
            "total_states": total_states,
            "average_score": avg_score,
            "status_distribution": dict(status_counts),
            "excellent_states": status_counts["excellent"],
            "good_states": status_counts["good"],
            "needs_improvement_states": status_counts["needs_improvement"],
            "poor_states": status_counts["poor"]
        }
        self.validation_results["recommendations"] = recommendations

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate cannabis compliance data")
    parser.add_argument('--state', help='Validate specific state only')
    parser.add_argument('--all', action='store_true', help='Validate all states')
    parser.add_argument('--report', action='store_true', help='Generate validation report')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    validator = ComplianceDataValidator()
    
    if args.state:
        validator.validate_single_state(args.state)
    elif args.all:
        validator.validate_all_states()
    elif args.report:
        # Load existing validation results
        results_path = validator.base_dir / "validation_results.json"
        if results_path.exists():
            with open(results_path, 'r') as f:
                results = json.load(f)
            
            print("\n" + "="*60)
            print("COMPLIANCE DATA VALIDATION REPORT")
            print("="*60)
            
            summary = results.get("summary", {})
            print(f"Total States: {summary.get('total_states', 0)}")
            print(f"Average Score: {summary.get('average_score', 0):.1f}%")
            print(f"Overall Status: {results.get('overall_status', 'unknown').upper()}")
            print()
            
            print("Status Distribution:")
            for status, count in summary.get("status_distribution", {}).items():
                print(f"  {status.replace('_', ' ').title()}: {count}")
            
            print("\nRecommendations:")
            for rec in results.get("recommendations", []):
                print(f"  • {rec}")
        else:
            print("No validation results found. Run --all first.")
    else:
        print("Please specify --state <state_name>, --all, or --report")

if __name__ == "__main__":
    main()