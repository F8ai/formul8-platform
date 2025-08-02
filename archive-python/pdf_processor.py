#!/usr/bin/env python3
"""
PDF Processing System for Cannabis Compliance Documents

Extracts text from all downloaded PDFs and creates searchable,
structured data for compliance analysis.
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# PDF processing libraries
try:
    import PyPDF2
    import pdfplumber
    from PIL import Image
    import pytesseract
    import fitz  # PyMuPDF
except ImportError as e:
    print(f"Missing required library: {e}")
    print("Install with: pip install PyPDF2 pdfplumber pillow pytesseract PyMuPDF")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, base_dir: str = "compliance_data"):
        self.base_dir = Path(base_dir)
        self.states_dir = self.base_dir / "states"
        
        # Processing statistics
        self.stats = {
            "total_pdfs": 0,
            "processed_pdfs": 0,
            "failed_pdfs": 0,
            "total_pages": 0,
            "total_text_length": 0,
            "processing_errors": []
        }
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Text extraction methods priority order
        self.extraction_methods = [
            self.extract_with_pdfplumber,
            self.extract_with_pymupdf,
            self.extract_with_pypdf2,
            self.extract_with_ocr
        ]

    def extract_with_pdfplumber(self, pdf_path: Path) -> Optional[Dict]:
        """Extract text using pdfplumber (best for structured documents)"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text_content = []
                metadata = {
                    "pages": len(pdf.pages),
                    "method": "pdfplumber",
                    "tables_found": 0,
                    "images_found": 0
                }
                
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append({
                            "page": page_num + 1,
                            "text": page_text.strip(),
                            "char_count": len(page_text)
                        })
                    
                    # Extract tables if present
                    tables = page.extract_tables()
                    if tables:
                        metadata["tables_found"] += len(tables)
                        for table_num, table in enumerate(tables):
                            table_text = "\n".join(["\t".join(row) for row in table if row])
                            text_content.append({
                                "page": page_num + 1,
                                "type": "table",
                                "table_number": table_num + 1,
                                "text": table_text,
                                "char_count": len(table_text)
                            })
                
                return {
                    "text_content": text_content,
                    "metadata": metadata,
                    "success": True
                }
        
        except Exception as e:
            logger.debug(f"pdfplumber failed for {pdf_path}: {str(e)}")
            return None

    def extract_with_pymupdf(self, pdf_path: Path) -> Optional[Dict]:
        """Extract text using PyMuPDF (good for complex layouts)"""
        try:
            doc = fitz.open(pdf_path)
            text_content = []
            metadata = {
                "pages": len(doc),
                "method": "pymupdf",
                "images_found": 0
            }
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                if page_text.strip():
                    text_content.append({
                        "page": page_num + 1,
                        "text": page_text.strip(),
                        "char_count": len(page_text)
                    })
                
                # Count images
                image_list = page.get_images()
                metadata["images_found"] += len(image_list)
            
            doc.close()
            
            return {
                "text_content": text_content,
                "metadata": metadata,
                "success": True
            }
        
        except Exception as e:
            logger.debug(f"PyMuPDF failed for {pdf_path}: {str(e)}")
            return None

    def extract_with_pypdf2(self, pdf_path: Path) -> Optional[Dict]:
        """Extract text using PyPDF2 (fallback method)"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = []
                metadata = {
                    "pages": len(pdf_reader.pages),
                    "method": "pypdf2"
                }
                
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_content.append({
                            "page": page_num + 1,
                            "text": page_text.strip(),
                            "char_count": len(page_text)
                        })
                
                return {
                    "text_content": text_content,
                    "metadata": metadata,
                    "success": True
                }
        
        except Exception as e:
            logger.debug(f"PyPDF2 failed for {pdf_path}: {str(e)}")
            return None

    def extract_with_ocr(self, pdf_path: Path) -> Optional[Dict]:
        """Extract text using OCR (last resort for scanned documents)"""
        try:
            doc = fitz.open(pdf_path)
            text_content = []
            metadata = {
                "pages": len(doc),
                "method": "ocr",
                "ocr_confidence": []
            }
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Convert page to image
                mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                # Save temporary image
                temp_img_path = f"/tmp/temp_page_{page_num}.png"
                with open(temp_img_path, "wb") as img_file:
                    img_file.write(img_data)
                
                # Perform OCR
                try:
                    ocr_text = pytesseract.image_to_string(temp_img_path)
                    if ocr_text.strip():
                        text_content.append({
                            "page": page_num + 1,
                            "text": ocr_text.strip(),
                            "char_count": len(ocr_text)
                        })
                    
                    # Clean up temporary file
                    os.remove(temp_img_path)
                    
                except Exception as ocr_error:
                    logger.debug(f"OCR failed for page {page_num}: {str(ocr_error)}")
                    continue
            
            doc.close()
            
            return {
                "text_content": text_content,
                "metadata": metadata,
                "success": True
            }
        
        except Exception as e:
            logger.debug(f"OCR failed for {pdf_path}: {str(e)}")
            return None

    def process_pdf(self, pdf_path: Path, state_dir: Path) -> Dict:
        """Process a single PDF file with multiple extraction methods"""
        logger.info(f"Processing PDF: {pdf_path}")
        
        # Initialize result
        result = {
            "pdf_path": str(pdf_path),
            "filename": pdf_path.name,
            "file_size": pdf_path.stat().st_size,
            "processed_at": datetime.now().isoformat(),
            "success": False,
            "extraction_method": None,
            "text_content": [],
            "metadata": {},
            "errors": []
        }
        
        # Generate file hash for uniqueness
        with open(pdf_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        result["file_hash"] = file_hash
        
        # Try extraction methods in order of preference
        for method in self.extraction_methods:
            try:
                extraction_result = method(pdf_path)
                if extraction_result and extraction_result["success"]:
                    result.update(extraction_result)
                    result["extraction_method"] = extraction_result["metadata"]["method"]
                    result["success"] = True
                    break
            except Exception as e:
                error_msg = f"Method {method.__name__} failed: {str(e)}"
                result["errors"].append(error_msg)
                logger.debug(error_msg)
        
        if not result["success"]:
            logger.warning(f"All extraction methods failed for {pdf_path}")
            with self.lock:
                self.stats["failed_pdfs"] += 1
        else:
            # Calculate statistics
            total_chars = sum(page["char_count"] for page in result["text_content"])
            result["total_characters"] = total_chars
            result["total_pages"] = len(result["text_content"])
            
            with self.lock:
                self.stats["processed_pdfs"] += 1
                self.stats["total_pages"] += result["total_pages"]
                self.stats["total_text_length"] += total_chars
        
        # Save individual PDF result
        output_filename = f"{pdf_path.stem}_extracted.json"
        output_path = state_dir / "processed" / output_filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Completed processing: {pdf_path} -> {output_path}")
        return result

    def process_state_pdfs(self, state_key: str) -> Dict:
        """Process all PDFs for a single state"""
        logger.info(f"Processing PDFs for state: {state_key}")
        
        state_dir = self.states_dir / state_key
        pdfs_dir = state_dir / "pdfs"
        
        if not pdfs_dir.exists():
            logger.warning(f"PDFs directory not found for {state_key}")
            return {"state": state_key, "status": "no_pdfs", "processed": 0}
        
        # Find all PDF files
        pdf_files = list(pdfs_dir.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"No PDF files found for {state_key}")
            return {"state": state_key, "status": "no_pdfs", "processed": 0}
        
        logger.info(f"Found {len(pdf_files)} PDF files for {state_key}")
        
        # Process PDFs with thread pool
        processed_results = []
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all PDF processing tasks
            future_to_pdf = {
                executor.submit(self.process_pdf, pdf_path, state_dir): pdf_path
                for pdf_path in pdf_files
            }
            
            # Collect results
            for future in as_completed(future_to_pdf):
                pdf_path = future_to_pdf[future]
                try:
                    result = future.result()
                    processed_results.append(result)
                except Exception as e:
                    logger.error(f"Error processing {pdf_path}: {str(e)}")
                    self.stats["processing_errors"].append({
                        "pdf": str(pdf_path),
                        "error": str(e)
                    })
        
        # Create state summary
        state_summary = {
            "state": state_key,
            "total_pdfs": len(pdf_files),
            "processed_successfully": len([r for r in processed_results if r["success"]]),
            "processing_failures": len([r for r in processed_results if not r["success"]]),
            "total_pages": sum(r.get("total_pages", 0) for r in processed_results),
            "total_characters": sum(r.get("total_characters", 0) for r in processed_results),
            "processing_methods": {},
            "processed_at": datetime.now().isoformat()
        }
        
        # Count extraction methods used
        for result in processed_results:
            if result["success"]:
                method = result["extraction_method"]
                state_summary["processing_methods"][method] = \
                    state_summary["processing_methods"].get(method, 0) + 1
        
        # Save state summary
        summary_path = state_dir / "processed" / "pdf_processing_summary.json"
        with open(summary_path, 'w') as f:
            json.dump(state_summary, f, indent=2)
        
        logger.info(f"Completed PDF processing for {state_key}: "
                   f"{state_summary['processed_successfully']}/{state_summary['total_pdfs']} PDFs processed")
        
        return state_summary

    def process_all_states(self) -> Dict:
        """Process PDFs for all states"""
        logger.info("Starting PDF processing for all states")
        
        # Reset statistics
        self.stats = {
            "total_pdfs": 0,
            "processed_pdfs": 0,
            "failed_pdfs": 0,
            "total_pages": 0,
            "total_text_length": 0,
            "processing_errors": []
        }
        
        # Get all state directories
        state_dirs = [d for d in self.states_dir.iterdir() if d.is_dir()]
        
        if not state_dirs:
            logger.warning("No state directories found")
            return {"status": "no_states", "processed": 0}
        
        state_summaries = []
        
        # Process each state
        for state_dir in state_dirs:
            state_key = state_dir.name
            
            try:
                state_summary = self.process_state_pdfs(state_key)
                state_summaries.append(state_summary)
                
                # Update global statistics
                self.stats["total_pdfs"] += state_summary.get("total_pdfs", 0)
                
            except Exception as e:
                logger.error(f"Error processing state {state_key}: {str(e)}")
                self.stats["processing_errors"].append({
                    "state": state_key,
                    "error": str(e)
                })
        
        # Create overall summary
        overall_summary = {
            "processing_completed_at": datetime.now().isoformat(),
            "total_states_processed": len(state_summaries),
            "overall_statistics": self.stats,
            "state_summaries": state_summaries,
            "extraction_methods_used": {}
        }
        
        # Aggregate extraction methods
        for state_summary in state_summaries:
            for method, count in state_summary.get("processing_methods", {}).items():
                overall_summary["extraction_methods_used"][method] = \
                    overall_summary["extraction_methods_used"].get(method, 0) + count
        
        # Save overall summary
        summary_path = self.base_dir / "pdf_processing_summary.json"
        with open(summary_path, 'w') as f:
            json.dump(overall_summary, f, indent=2)
        
        logger.info("PDF processing completed for all states")
        logger.info(f"Total PDFs processed: {self.stats['processed_pdfs']}")
        logger.info(f"Total pages extracted: {self.stats['total_pages']}")
        logger.info(f"Total text characters: {self.stats['total_text_length']:,}")
        
        return overall_summary

    def search_text(self, query: str, state_key: Optional[str] = None) -> List[Dict]:
        """Search extracted text across all or specific state documents"""
        logger.info(f"Searching for: '{query}'" + (f" in state: {state_key}" if state_key else " in all states"))
        
        results = []
        search_dirs = [self.states_dir / state_key] if state_key else self.states_dir.iterdir()
        
        for state_dir in search_dirs:
            if not state_dir.is_dir():
                continue
                
            processed_dir = state_dir / "processed"
            if not processed_dir.exists():
                continue
            
            # Search in all extracted JSON files
            for json_file in processed_dir.glob("*_extracted.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    if not data.get("success", False):
                        continue
                    
                    # Search in text content
                    for page_data in data.get("text_content", []):
                        text = page_data.get("text", "")
                        if query.lower() in text.lower():
                            # Find context around the match
                            match_index = text.lower().find(query.lower())
                            context_start = max(0, match_index - 100)
                            context_end = min(len(text), match_index + len(query) + 100)
                            context = text[context_start:context_end]
                            
                            results.append({
                                "state": state_dir.name,
                                "pdf_filename": data["filename"],
                                "page": page_data["page"],
                                "match_context": context,
                                "match_position": match_index,
                                "file_path": str(json_file)
                            })
                
                except Exception as e:
                    logger.error(f"Error searching in {json_file}: {str(e)}")
        
        logger.info(f"Found {len(results)} matches for '{query}'")
        return results

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Process cannabis compliance PDFs")
    parser.add_argument('--state', help='Process PDFs for specific state only')
    parser.add_argument('--all', action='store_true', help='Process PDFs for all states')
    parser.add_argument('--search', help='Search text in processed documents')
    parser.add_argument('--search-state', help='Limit search to specific state')
    
    args = parser.parse_args()
    
    # Change to compliance_data directory
    os.chdir(Path(__file__).parent.parent)
    
    processor = PDFProcessor()
    
    if args.search:
        results = processor.search_text(args.search, args.search_state)
        print(f"\nFound {len(results)} matches:")
        for result in results[:10]:  # Show first 10 results
            print(f"\n{result['state']} - {result['pdf_filename']} (page {result['page']})")
            print(f"Context: ...{result['match_context']}...")
    elif args.state:
        processor.process_state_pdfs(args.state)
    elif args.all:
        processor.process_all_states()
    else:
        print("Please specify --state <state_name>, --all, or --search <query>")

if __name__ == "__main__":
    main()