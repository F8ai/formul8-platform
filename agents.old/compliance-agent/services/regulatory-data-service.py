"""
Compliance Agent Regulatory Data Service
Downloads and maintains up-to-date cannabis regulations from all states with daily updates.
"""

import os
import json
import hashlib
import asyncio
import aiohttp
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import logging
from bs4 import BeautifulSoup
import sqlite3
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class StateRegulation:
    state: str
    state_code: str
    title: str
    url: str
    last_updated: str
    content: str
    content_hash: str
    version: str
    effective_date: Optional[str] = None
    category: str = 'general'  # licensing, cultivation, manufacturing, retail, testing, transportation, general
    status: str = 'active'  # active, pending, superseded

@dataclass
class RegulatoryUpdate:
    state: str
    change_type: str  # new, modified, removed
    regulation: StateRegulation
    change_description: str
    timestamp: str

# Comprehensive state cannabis regulation sources
STATE_REGULATION_SOURCES = {
    'CA': {
        'name': 'California',
        'sources': [
            {
                'url': 'https://www.cdph.ca.gov/Programs/CEH/DFDCS/MCSB/Pages/CannabisProgramRegulations.aspx',
                'category': 'manufacturing',
                'title': 'Manufacturing Regulations'
            },
            {
                'url': 'https://www.cdfa.ca.gov/calcannabis/regulations.html',
                'category': 'cultivation',
                'title': 'Cultivation Regulations'
            },
            {
                'url': 'https://bcc.ca.gov/law_regs/',
                'category': 'retail',
                'title': 'Retail and Distribution Regulations'
            }
        ]
    },
    'CO': {
        'name': 'Colorado',
        'sources': [
            {
                'url': 'https://sbg.colorado.gov/med-rules',
                'category': 'general',
                'title': 'Medical Cannabis Rules'
            },
            {
                'url': 'https://sbg.colorado.gov/retail-marijuana-rules',
                'category': 'retail',
                'title': 'Retail Cannabis Rules'
            }
        ]
    },
    'WA': {
        'name': 'Washington',
        'sources': [
            {
                'url': 'https://lcb.wa.gov/laws/laws-and-rules',
                'category': 'general',
                'title': 'Cannabis Laws and Rules'
            }
        ]
    },
    'OR': {
        'name': 'Oregon',
        'sources': [
            {
                'url': 'https://www.oregon.gov/olcc/marijuana/Pages/Statutes-Rules.aspx',
                'category': 'general',
                'title': 'Cannabis Statutes and Rules'
            }
        ]
    },
    'NV': {
        'name': 'Nevada',
        'sources': [
            {
                'url': 'https://ccb.nv.gov/about/cannabis-compliance-board-regulations/',
                'category': 'general',
                'title': 'Cannabis Compliance Board Regulations'
            }
        ]
    },
    'AZ': {
        'name': 'Arizona',
        'sources': [
            {
                'url': 'https://azdhs.gov/licensing/medical-marijuana/index.php#rules-statutes',
                'category': 'general',
                'title': 'Cannabis Rules and Statutes'
            }
        ]
    },
    'MA': {
        'name': 'Massachusetts',
        'sources': [
            {
                'url': 'https://mass-cannabis-control.com/regulations/',
                'category': 'general',
                'title': 'Cannabis Control Commission Regulations'
            }
        ]
    },
    'IL': {
        'name': 'Illinois',
        'sources': [
            {
                'url': 'https://www2.illinois.gov/Pages/news-item.aspx?ReleaseID=20862',
                'category': 'general',
                'title': 'Cannabis Regulation and Tax Act'
            }
        ]
    },
    'NY': {
        'name': 'New York',
        'sources': [
            {
                'url': 'https://cannabis.ny.gov/regulations',
                'category': 'general',
                'title': 'Cannabis Regulations'
            }
        ]
    },
    'NJ': {
        'name': 'New Jersey',
        'sources': [
            {
                'url': 'https://www.nj.gov/cannabis/businesses/laws-and-regulations/',
                'category': 'general',
                'title': 'Cannabis Laws and Regulations'
            }
        ]
    },
    'CT': {
        'name': 'Connecticut',
        'sources': [
            {
                'url': 'https://portal.ct.gov/DCP/Drug-Control-Division/Drug-Control-Division/Cannabis',
                'category': 'general',
                'title': 'Cannabis Regulations'
            }
        ]
    },
    'MI': {
        'name': 'Michigan',
        'sources': [
            {
                'url': 'https://www.michigan.gov/cra/rules-and-regulations',
                'category': 'general',
                'title': 'Cannabis Regulatory Agency Rules'
            }
        ]
    },
    'FL': {
        'name': 'Florida',
        'sources': [
            {
                'url': 'https://knowthefactsmmj.com/laws-rules/',
                'category': 'general',
                'title': 'Medical Cannabis Laws and Rules'
            }
        ]
    },
    'PA': {
        'name': 'Pennsylvania',
        'sources': [
            {
                'url': 'https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Medical%20Marijuana.aspx',
                'category': 'general',
                'title': 'Medical Cannabis Program Regulations'
            }
        ]
    },
    'OH': {
        'name': 'Ohio',
        'sources': [
            {
                'url': 'https://www.com.ohio.gov/divisions/cannabis',
                'category': 'general',
                'title': 'Cannabis Control Program'
            }
        ]
    },
    'MN': {
        'name': 'Minnesota',
        'sources': [
            {
                'url': 'https://www.health.state.mn.us/people/cannabis/index.html',
                'category': 'general',
                'title': 'Cannabis Control Office'
            }
        ]
    },
    'MD': {
        'name': 'Maryland',
        'sources': [
            {
                'url': 'https://cannabis.maryland.gov/Pages/home.aspx',
                'category': 'general',
                'title': 'Cannabis Administration'
            }
        ]
    },
    'DC': {
        'name': 'District of Columbia',
        'sources': [
            {
                'url': 'https://abra.dc.gov/page/medical-cannabis-regulations',
                'category': 'general',
                'title': 'Medical Cannabis Regulations'
            }
        ]
    },
    'VT': {
        'name': 'Vermont',
        'sources': [
            {
                'url': 'https://ccb.vermont.gov/regulations',
                'category': 'general',
                'title': 'Cannabis Control Board Regulations'
            }
        ]
    },
    'ME': {
        'name': 'Maine',
        'sources': [
            {
                'url': 'https://www.maine.gov/dafs/ocp/rules-regulations',
                'category': 'general',
                'title': 'Office of Cannabis Policy Rules'
            }
        ]
    },
    'RI': {
        'name': 'Rhode Island',
        'sources': [
            {
                'url': 'https://dbr.ri.gov/divisions/cannabis/',
                'category': 'general',
                'title': 'Cannabis Control'
            }
        ]
    },
    'NM': {
        'name': 'New Mexico',
        'sources': [
            {
                'url': 'https://www.rld.nm.gov/cannabis/',
                'category': 'general',
                'title': 'Cannabis Control Division'
            }
        ]
    },
    'MT': {
        'name': 'Montana',
        'sources': [
            {
                'url': 'https://mtrevenue.gov/cannabis/',
                'category': 'general',
                'title': 'Cannabis Control Division'
            }
        ]
    },
    'AK': {
        'name': 'Alaska',
        'sources': [
            {
                'url': 'https://www.commerce.alaska.gov/web/amco/marijuana.aspx',
                'category': 'general',
                'title': 'Marijuana Control Office'
            }
        ]
    },
    'HI': {
        'name': 'Hawaii',
        'sources': [
            {
                'url': 'https://health.hawaii.gov/medicalcannabis/',
                'category': 'general',
                'title': 'Medical Cannabis Registry Program'
            }
        ]
    }
}

class RegulatoryDataService:
    def __init__(self, data_path: str = "./data/regulations"):
        self.data_path = Path(data_path)
        self.db_path = self.data_path / "regulations.db"
        self.last_update_check = datetime.min
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Ensure data directory exists
        self.data_path.mkdir(parents=True, exist_ok=True)
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database for storing regulations"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS regulations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    state TEXT NOT NULL,
                    state_code TEXT NOT NULL,
                    title TEXT NOT NULL,
                    url TEXT NOT NULL,
                    last_updated TEXT NOT NULL,
                    content TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    version TEXT NOT NULL,
                    effective_date TEXT,
                    category TEXT DEFAULT 'general',
                    status TEXT DEFAULT 'active',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(state_code, category, url)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS regulatory_updates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    state TEXT NOT NULL,
                    change_type TEXT NOT NULL,
                    change_description TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    regulation_data TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_state_code ON regulations(state_code);
                CREATE INDEX IF NOT EXISTS idx_category ON regulations(category);
                CREATE INDEX IF NOT EXISTS idx_content_hash ON regulations(content_hash);
            """)
    
    @contextmanager
    def get_db_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; Formul8 Compliance Bot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
            self.session = aiohttp.ClientSession(timeout=timeout, headers=headers)
        return self.session
    
    async def _fetch_regulation_content(self, url: str) -> str:
        """Fetch regulation content from URL"""
        try:
            session = await self._get_session()
            logger.info(f"Fetching regulation from: {url}")
            
            async with session.get(url) as response:
                if response.status != 200:
                    raise aiohttp.ClientError(f"HTTP {response.status}: {response.reason}")
                
                content = await response.text()
                return content
                
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return f"Error fetching regulation: {str(e)}"
    
    def _extract_text_from_html(self, html: str) -> str:
        """Extract meaningful text from HTML content"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text
    
    def _generate_hash(self, content: str) -> str:
        """Generate content hash for change detection"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    async def download_state_regulations(self, state_code: str) -> List[StateRegulation]:
        """Download regulations for a specific state"""
        state_info = STATE_REGULATION_SOURCES.get(state_code)
        if not state_info:
            logger.warning(f"No regulation sources found for state: {state_code}")
            return []
        
        regulations = []
        
        for source in state_info['sources']:
            try:
                content = await self._fetch_regulation_content(source['url'])
                clean_content = self._extract_text_from_html(content)
                content_hash = self._generate_hash(clean_content)
                
                regulation = StateRegulation(
                    state=state_info['name'],
                    state_code=state_code,
                    title=source['title'],
                    url=source['url'],
                    last_updated=datetime.now().isoformat(),
                    content=clean_content,
                    content_hash=content_hash,
                    version=datetime.now().isoformat(),
                    category=source['category'],
                    status='active'
                )
                
                regulations.append(regulation)
                await self._save_regulation(regulation)
                
                logger.info(f"Downloaded regulation: {state_code} - {source['title']}")
                
                # Add delay between requests to be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error downloading regulation for {state_code} - {source['title']}: {e}")
        
        return regulations
    
    async def _save_regulation(self, regulation: StateRegulation):
        """Save regulation to database"""
        with self.get_db_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO regulations 
                (state, state_code, title, url, last_updated, content, content_hash, 
                 version, effective_date, category, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                regulation.state, regulation.state_code, regulation.title,
                regulation.url, regulation.last_updated, regulation.content,
                regulation.content_hash, regulation.version, regulation.effective_date,
                regulation.category, regulation.status
            ))
            conn.commit()
    
    async def download_all_state_regulations(self):
        """Download regulations for all states"""
        logger.info("Starting download of all state regulations...")
        
        states = list(STATE_REGULATION_SOURCES.keys())
        completed = 0
        
        for state_code in states:
            try:
                logger.info(f"Downloading regulations for {state_code} ({completed + 1}/{len(states)})")
                regulations = await self.download_state_regulations(state_code)
                completed += 1
                
                # Save update log
                update = RegulatoryUpdate(
                    state=state_code,
                    change_type='new',
                    regulation=regulations[0] if regulations else StateRegulation('', '', '', '', '', '', '', ''),
                    change_description=f"Downloaded {len(regulations)} regulations",
                    timestamp=datetime.now().isoformat()
                )
                await self._save_update_log(update)
                
                logger.info(f"Completed {state_code}: {len(regulations)} regulations downloaded")
                
            except Exception as e:
                logger.error(f"Failed to download regulations for {state_code}: {e}")
        
        self.last_update_check = datetime.now()
        logger.info(f"Regulation download completed: {completed}/{len(states)} states processed")
    
    async def _save_update_log(self, update: RegulatoryUpdate):
        """Save update log to database"""
        with self.get_db_connection() as conn:
            conn.execute("""
                INSERT INTO regulatory_updates 
                (state, change_type, change_description, timestamp, regulation_data)
                VALUES (?, ?, ?, ?, ?)
            """, (
                update.state, update.change_type, update.change_description,
                update.timestamp, json.dumps(asdict(update.regulation))
            ))
            conn.commit()
    
    def get_state_regulations(self, state_code: str) -> List[StateRegulation]:
        """Get regulations for a specific state"""
        with self.get_db_connection() as conn:
            rows = conn.execute("""
                SELECT * FROM regulations WHERE state_code = ? ORDER BY last_updated DESC
            """, (state_code,)).fetchall()
            
            return [StateRegulation(**dict(row)) for row in rows]
    
    def search_regulations(self, query: str, state_code: Optional[str] = None) -> List[StateRegulation]:
        """Search regulations by content"""
        sql = """
            SELECT * FROM regulations 
            WHERE (title LIKE ? OR content LIKE ?)
        """
        params = [f"%{query}%", f"%{query}%"]
        
        if state_code:
            sql += " AND state_code = ?"
            params.append(state_code)
        
        sql += " ORDER BY last_updated DESC LIMIT 50"
        
        with self.get_db_connection() as conn:
            rows = conn.execute(sql, params).fetchall()
            return [StateRegulation(**dict(row)) for row in rows]
    
    async def check_for_updates(self) -> List[RegulatoryUpdate]:
        """Check for updates in regulations"""
        updates = []
        
        for state_code in STATE_REGULATION_SOURCES.keys():
            try:
                # Get existing regulations
                existing_regulations = self.get_state_regulations(state_code)
                existing_by_url = {reg.url: reg for reg in existing_regulations}
                
                # Download current regulations
                new_regulations = await self.download_state_regulations(state_code)
                
                for new_reg in new_regulations:
                    existing_reg = existing_by_url.get(new_reg.url)
                    
                    if not existing_reg:
                        update = RegulatoryUpdate(
                            state=state_code,
                            change_type='new',
                            regulation=new_reg,
                            change_description='New regulation added',
                            timestamp=datetime.now().isoformat()
                        )
                        updates.append(update)
                        await self._save_update_log(update)
                        
                    elif existing_reg.content_hash != new_reg.content_hash:
                        update = RegulatoryUpdate(
                            state=state_code,
                            change_type='modified',
                            regulation=new_reg,
                            change_description='Regulation content updated',
                            timestamp=datetime.now().isoformat()
                        )
                        updates.append(update)
                        await self._save_update_log(update)
                        
            except Exception as e:
                logger.error(f"Error checking updates for {state_code}: {e}")
        
        return updates
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get regulation statistics"""
        with self.get_db_connection() as conn:
            # Total counts
            total_regulations = conn.execute("SELECT COUNT(*) FROM regulations").fetchone()[0]
            total_states = conn.execute("SELECT COUNT(DISTINCT state_code) FROM regulations").fetchone()[0]
            
            # By category
            category_counts = dict(conn.execute("""
                SELECT category, COUNT(*) FROM regulations GROUP BY category
            """).fetchall())
            
            # By state
            state_counts = dict(conn.execute("""
                SELECT state_code, COUNT(*) FROM regulations GROUP BY state_code
            """).fetchall())
            
            return {
                'total_states': total_states,
                'total_regulations': total_regulations,
                'last_update': self.last_update_check.isoformat(),
                'regulations_by_category': category_counts,
                'regulations_by_state': state_counts
            }
    
    def start_daily_updates(self):
        """Start daily update scheduler"""
        def run_daily_update():
            asyncio.run(self._daily_update_task())
        
        # Schedule daily updates at 2 AM
        schedule.every().day.at("02:00").do(run_daily_update)
        logger.info("Daily regulatory update scheduler started - updates at 2:00 AM")
        
        # Run scheduler in background
        def scheduler_loop():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        import threading
        scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
        scheduler_thread.start()
    
    async def _daily_update_task(self):
        """Daily update task"""
        logger.info("🏛️ Starting daily compliance regulatory update...")
        
        try:
            updates = await self.check_for_updates()
            logger.info(f"📋 Daily compliance update completed: {len(updates)} changes detected")
            
            if updates:
                states_with_updates = list(set(update.state for update in updates))
                logger.info(f"📊 Regulatory changes detected in states: {', '.join(states_with_updates)}")
                
        except Exception as e:
            logger.error(f"❌ Error during daily compliance update: {e}")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session and not self.session.closed:
            await self.session.close()

# Create singleton instance
regulatory_service = RegulatoryDataService()

# Initialize daily updates when module is imported
regulatory_service.start_daily_updates()

if __name__ == "__main__":
    # For testing and manual runs
    async def main():
        service = RegulatoryDataService()
        await service.download_all_state_regulations()
        stats = service.get_statistics()
        print(f"Downloaded regulations from {stats['total_states']} states")
        print(f"Total regulations: {stats['total_regulations']}")
        await service.cleanup()
    
    asyncio.run(main())