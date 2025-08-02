#!/usr/bin/env python3
"""
Regulatory Citation System for Cannabis Compliance

Creates a structured citation system that enables LLMs to provide precise
chapter and verse references for cannabis regulations across all states.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import re
from collections import defaultdict
import hashlib
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RegulatoryCitation:
    """Structured regulatory citation with precise references"""
    state: str
    document_type: str  # regulation, statute, guidance, etc.
    title: str
    section: str
    subsection: Optional[str] = None
    paragraph: Optional[str] = None
    chapter: Optional[str] = None
    part: Optional[str] = None
    rule_number: Optional[str] = None
    effective_date: Optional[str] = None
    source_url: str = ""
    page_number: Optional[int] = None
    text_content: str = ""
    hash_id: str = ""
    
    def __post_init__(self):
        """Generate unique hash ID for this citation"""
        content = f"{self.state}_{self.document_type}_{self.title}_{self.section}_{self.subsection}_{self.text_content}"
        self.hash_id = hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def get_citation_string(self) -> str:
        """Generate formatted citation string"""
        parts = [self.state.upper()]
        
        if self.document_type:
            parts.append(self.document_type.title())
        
        if self.title:
            parts.append(self.title)
        
        if self.chapter:
            parts.append(f"Chapter {self.chapter}")
        
        if self.part:
            parts.append(f"Part {self.part}")
        
        if self.section:
            parts.append(f"Section {self.section}")
        
        if self.subsection:
            parts.append(f"Subsection {self.subsection}")
        
        if self.paragraph:
            parts.append(f"Paragraph {self.paragraph}")
        
        if self.rule_number:
            parts.append(f"Rule {self.rule_number}")
        
        return " - ".join(parts)

class RegulatoryParser:
    """Parses regulatory documents to extract structured citations"""
    
    def __init__(self):
        # Common regulatory patterns across states
        self.section_patterns = [
            r'(?:Section|Sec\.|§)\s*(\d+(?:\.\d+)*)',
            r'(\d+(?:\.\d+)+)\s*(?:Section|Sec\.)',
            r'(?:^|\s)(\d+(?:\.\d+)+)(?:\s|$)',
        ]
        
        self.subsection_patterns = [
            r'(?:Subsection|Sub\.|§)\s*([a-zA-Z]|\d+)',
            r'\(([a-zA-Z]|\d+)\)',
            r'([a-zA-Z])\)',
        ]
        
        self.chapter_patterns = [
            r'(?:Chapter|Ch\.|Chap\.)\s*(\d+(?:\.\d+)*)',
            r'CHAPTER\s+(\d+(?:\.\d+)*)',
        ]
        
        self.part_patterns = [
            r'(?:Part|Pt\.)\s*(\d+(?:\.\d+)*)',
            r'PART\s+(\d+(?:\.\d+)*)',
        ]
        
        self.rule_patterns = [
            r'(?:Rule|R\.)\s*(\d+(?:\.\d+)*)',
            r'RULE\s+(\d+(?:\.\d+)*)',
        ]
        
        self.title_patterns = [
            r'(?:Title|Tit\.)\s*(\d+(?:\.\d+)*)',
            r'TITLE\s+(\d+(?:\.\d+)*)',
        ]

    def extract_citations_from_text(self, text: str, state: str, 
                                   document_info: Dict) -> List[RegulatoryCitation]:
        """Extract structured citations from regulatory text"""
        citations = []
        
        # Split text into logical sections
        sections = self._split_into_sections(text)
        
        for section_text in sections:
            citation = self._parse_section_text(section_text, state, document_info)
            if citation:
                citations.append(citation)
        
        return citations

    def _split_into_sections(self, text: str) -> List[str]:
        """Split text into logical regulatory sections"""
        # Look for section breaks
        section_breaks = []
        
        for pattern in self.section_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                section_breaks.append(match.start())
        
        # Sort breaks and split text
        section_breaks = sorted(set(section_breaks))
        
        if not section_breaks:
            return [text]
        
        sections = []
        for i, break_pos in enumerate(section_breaks):
            if i == 0:
                continue  # Skip first break
            
            start = section_breaks[i-1] if i > 0 else 0
            end = break_pos
            
            section = text[start:end].strip()
            if len(section) > 50:  # Minimum meaningful section length
                sections.append(section)
        
        # Add final section
        if section_breaks:
            final_section = text[section_breaks[-1]:].strip()
            if len(final_section) > 50:
                sections.append(final_section)
        
        return sections if sections else [text]

    def _parse_section_text(self, text: str, state: str, 
                           document_info: Dict) -> Optional[RegulatoryCitation]:
        """Parse a section of text to extract citation information"""
        
        # Extract section number
        section = self._extract_first_match(text, self.section_patterns)
        if not section:
            return None
        
        # Extract other components
        chapter = self._extract_first_match(text, self.chapter_patterns)
        part = self._extract_first_match(text, self.part_patterns)
        subsection = self._extract_first_match(text, self.subsection_patterns)
        rule_number = self._extract_first_match(text, self.rule_patterns)
        title = self._extract_first_match(text, self.title_patterns)
        
        # Clean up text content (remove excessive whitespace)
        clean_text = re.sub(r'\s+', ' ', text.strip())
        
        # Limit text length for citation
        if len(clean_text) > 2000:
            clean_text = clean_text[:2000] + "..."
        
        return RegulatoryCitation(
            state=state,
            document_type=document_info.get("document_type", "regulation"),
            title=title or document_info.get("title", ""),
            section=section,
            subsection=subsection,
            paragraph=None,  # Could be enhanced further
            chapter=chapter,
            part=part,
            rule_number=rule_number,
            effective_date=document_info.get("effective_date"),
            source_url=document_info.get("source_url", ""),
            page_number=document_info.get("page_number"),
            text_content=clean_text
        )

    def _extract_first_match(self, text: str, patterns: List[str]) -> Optional[str]:
        """Extract first match from text using list of patterns"""
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                return match.group(1)
        return None

class CitationSystem:
    """Main citation system that processes all compliance data"""
    
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.states_dir = self.base_dir / "states"
        self.citations_dir = self.base_dir / "citations"
        self.citations_dir.mkdir(exist_ok=True)
        
        self.parser = RegulatoryParser()
        
        # Citation database
        self.citation_database = {
            "created_at": datetime.now().isoformat(),
            "total_citations": 0,
            "states": {},
            "citation_index": {},  # For fast lookup
            "search_index": {}     # For full-text search
        }

    def process_state_citations(self, state_key: str) -> Dict:
        """Process all regulatory documents for a state to create citations"""
        logger.info(f"Processing citations for {state_key}")
        
        state_dir = self.states_dir / state_key
        processed_dir = state_dir / "processed"
        
        if not processed_dir.exists():
            logger.warning(f"No processed documents found for {state_key}")
            return {"state": state_key, "citations": 0}
        
        state_citations = []
        
        # Process all extracted documents
        for json_file in processed_dir.glob("*_extracted.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if not data.get("success", False):
                    continue
                
                # Extract document metadata
                document_info = {
                    "filename": data.get("filename", ""),
                    "document_type": self._determine_document_type(data.get("filename", "")),
                    "title": self._extract_document_title(data.get("filename", "")),
                    "source_url": data.get("source_url", ""),
                    "extraction_method": data.get("extraction_method", "")
                }
                
                # Process each page
                for page_data in data.get("text_content", []):
                    page_text = page_data.get("text", "")
                    if len(page_text.strip()) < 100:  # Skip short pages
                        continue
                    
                    document_info["page_number"] = page_data.get("page", 1)
                    
                    # Extract citations from this page
                    page_citations = self.parser.extract_citations_from_text(
                        page_text, state_key, document_info
                    )
                    
                    state_citations.extend(page_citations)
            
            except Exception as e:
                logger.error(f"Error processing {json_file}: {str(e)}")
        
        # Deduplicate citations
        unique_citations = self._deduplicate_citations(state_citations)
        
        # Create citation index for this state
        state_citation_data = {
            "state": state_key,
            "total_citations": len(unique_citations),
            "citations": [asdict(citation) for citation in unique_citations],
            "processed_at": datetime.now().isoformat()
        }
        
        # Save state citations
        state_citations_file = self.citations_dir / f"{state_key}_citations.json"
        with open(state_citations_file, 'w', encoding='utf-8') as f:
            json.dump(state_citation_data, f, indent=2, ensure_ascii=False)
        
        # Add to main database
        self.citation_database["states"][state_key] = {
            "total_citations": len(unique_citations),
            "citation_file": str(state_citations_file)
        }
        
        # Update citation index
        for citation in unique_citations:
            self.citation_database["citation_index"][citation.hash_id] = {
                "state": state_key,
                "citation_string": citation.get_citation_string(),
                "section": citation.section,
                "document_type": citation.document_type
            }
        
        # Update search index
        self._update_search_index(unique_citations)
        
        logger.info(f"Created {len(unique_citations)} citations for {state_key}")
        return state_citation_data

    def _determine_document_type(self, filename: str) -> str:
        """Determine document type from filename"""
        filename_lower = filename.lower()
        
        if any(word in filename_lower for word in ["regulation", "rule", "ccr", "administrative"]):
            return "regulation"
        elif any(word in filename_lower for word in ["statute", "law", "code", "title"]):
            return "statute"
        elif any(word in filename_lower for word in ["guidance", "guide", "policy", "advisory"]):
            return "guidance"
        elif any(word in filename_lower for word in ["form", "application", "worksheet"]):
            return "form"
        else:
            return "regulation"  # Default

    def _extract_document_title(self, filename: str) -> str:
        """Extract document title from filename"""
        # Remove file extension and common prefixes
        title = filename.replace(".pdf", "").replace(".html", "")
        title = re.sub(r'^[a-f0-9]+_', '', title)  # Remove hash prefix
        title = title.replace("_", " ").title()
        return title

    def _deduplicate_citations(self, citations: List[RegulatoryCitation]) -> List[RegulatoryCitation]:
        """Remove duplicate citations based on hash ID"""
        seen_hashes = set()
        unique_citations = []
        
        for citation in citations:
            if citation.hash_id not in seen_hashes:
                seen_hashes.add(citation.hash_id)
                unique_citations.append(citation)
        
        return unique_citations

    def _update_search_index(self, citations: List[RegulatoryCitation]):
        """Update search index with new citations"""
        for citation in citations:
            # Index by keywords
            text_content = citation.text_content.lower()
            words = re.findall(r'\b\w+\b', text_content)
            
            for word in words:
                if len(word) > 3:  # Skip short words
                    if word not in self.citation_database["search_index"]:
                        self.citation_database["search_index"][word] = []
                    
                    self.citation_database["search_index"][word].append({
                        "citation_id": citation.hash_id,
                        "state": citation.state,
                        "relevance": text_content.count(word)
                    })

    def create_llm_citation_prompt(self, state_key: Optional[str] = None) -> str:
        """Create a prompt for LLMs that includes citation instructions"""
        
        citation_instructions = f"""
REGULATORY CITATION SYSTEM INSTRUCTIONS:

When providing cannabis compliance information, you must cite specific regulatory sources using this format:

FORMAT: [STATE] [DOCUMENT_TYPE] - [TITLE] - [CHAPTER/PART] - [SECTION] - [SUBSECTION]

EXAMPLES:
- CALIFORNIA Regulation - Cannabis Control - Chapter 1 - Section 5001 - Subsection (a)
- COLORADO Statute - Title 44 - Article 10 - Section 44-10-203
- WASHINGTON Administrative Code - WAC 314-55 - Section 314-55-077

CITATION RULES:
1. Always provide the most specific citation possible
2. Include state name in ALL CAPS
3. Use the exact section and subsection numbers
4. If multiple sections apply, cite all relevant ones
5. When paraphrasing, still provide the exact citation
6. If unsure about citation, state "Citation pending verification"

AVAILABLE CITATIONS:
You have access to processed regulatory citations from the following states:
{', '.join(self.citation_database['states'].keys())}

For each state, citations are structured with:
- Document type (regulation, statute, guidance, form)
- Title/Chapter information
- Section and subsection numbers
- Full text content for context

SEARCH CAPABILITY:
You can search citations by:
- Keywords in regulatory text
- Section numbers
- Document types
- Specific topics (licensing, testing, packaging, etc.)

EXAMPLE RESPONSE:
"Cannabis products must be tested for pesticide residues before sale. [CALIFORNIA Regulation - Cannabis Control - Chapter 1 - Section 5714 - Testing Requirements]. The testing must be conducted by a licensed laboratory [CALIFORNIA Regulation - Cannabis Control - Chapter 1 - Section 5700 - Laboratory Requirements]."

Remember: Every regulatory statement must include a specific citation. This enables users to verify information and ensures compliance accuracy.
"""
        
        return citation_instructions

    def search_citations(self, query: str, state_key: Optional[str] = None, 
                        limit: int = 10) -> List[Dict]:
        """Search citations by query"""
        logger.info(f"Searching citations for: '{query}'" + 
                   (f" in {state_key}" if state_key else ""))
        
        results = []
        query_words = re.findall(r'\b\w+\b', query.lower())
        
        # Search in index
        for word in query_words:
            if word in self.citation_database["search_index"]:
                for match in self.citation_database["search_index"][word]:
                    if not state_key or match["state"] == state_key:
                        citation_id = match["citation_id"]
                        
                        # Get full citation info
                        if citation_id in self.citation_database["citation_index"]:
                            citation_info = self.citation_database["citation_index"][citation_id]
                            
                            # Load full citation from state file
                            state_file = self.citations_dir / f"{match['state']}_citations.json"
                            if state_file.exists():
                                with open(state_file, 'r') as f:
                                    state_data = json.load(f)
                                
                                # Find matching citation
                                for citation in state_data["citations"]:
                                    if citation["hash_id"] == citation_id:
                                        results.append({
                                            "citation": citation,
                                            "relevance": match["relevance"],
                                            "citation_string": citation_info["citation_string"]
                                        })
                                        break
        
        # Sort by relevance and deduplicate
        results = sorted(results, key=lambda x: x["relevance"], reverse=True)
        seen_ids = set()
        unique_results = []
        
        for result in results:
            citation_id = result["citation"]["hash_id"]
            if citation_id not in seen_ids:
                seen_ids.add(citation_id)
                unique_results.append(result)
        
        return unique_results[:limit]

    def process_all_states(self) -> Dict:
        """Process citations for all states"""
        logger.info("Processing citations for all states")
        
        # Reset database
        self.citation_database = {
            "created_at": datetime.now().isoformat(),
            "total_citations": 0,
            "states": {},
            "citation_index": {},
            "search_index": {}
        }
        
        # Get all state directories
        state_dirs = [d for d in self.states_dir.iterdir() if d.is_dir()]
        
        for state_dir in state_dirs:
            state_key = state_dir.name
            
            try:
                state_data = self.process_state_citations(state_key)
                self.citation_database["total_citations"] += state_data["total_citations"]
                
            except Exception as e:
                logger.error(f"Error processing citations for {state_key}: {str(e)}")
        
        # Save master database
        database_file = self.citations_dir / "citation_database.json"
        with open(database_file, 'w', encoding='utf-8') as f:
            json.dump(self.citation_database, f, indent=2, ensure_ascii=False)
        
        # Create LLM prompt file
        prompt_file = self.citations_dir / "llm_citation_prompt.txt"
        with open(prompt_file, 'w', encoding='utf-8') as f:
            f.write(self.create_llm_citation_prompt())
        
        logger.info(f"Citation processing complete. Total citations: {self.citation_database['total_citations']}")
        return self.citation_database

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Process regulatory citations")
    parser.add_argument('--state', help='Process citations for specific state')
    parser.add_argument('--all', action='store_true', help='Process all states')
    parser.add_argument('--search', help='Search citations')
    parser.add_argument('--search-state', help='Limit search to specific state')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    citation_system = CitationSystem()
    
    if args.search:
        results = citation_system.search_citations(args.search, args.search_state)
        print(f"\nFound {len(results)} citations for '{args.search}':")
        for result in results:
            citation = result["citation"]
            print(f"\n{result['citation_string']}")
            print(f"Content: {citation['text_content'][:200]}...")
    elif args.state:
        citation_system.process_state_citations(args.state)
    elif args.all:
        citation_system.process_all_states()
    else:
        print("Please specify --state <state_name>, --all, or --search <query>")

if __name__ == "__main__":
    main()