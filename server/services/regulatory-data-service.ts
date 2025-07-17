import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface StateRegulation {
  state: string;
  stateCode: string;
  title: string;
  url: string;
  lastUpdated: Date;
  content: string;
  hash: string;
  version: string;
  effectiveDate?: Date;
  category: 'licensing' | 'cultivation' | 'manufacturing' | 'retail' | 'testing' | 'transportation' | 'general';
  status: 'active' | 'pending' | 'superseded';
}

export interface RegulatoryUpdate {
  state: string;
  changeType: 'new' | 'modified' | 'removed';
  regulation: StateRegulation;
  changeDescription: string;
  timestamp: Date;
}

// Comprehensive state cannabis regulation sources
const STATE_REGULATION_SOURCES = {
  'CA': {
    name: 'California',
    sources: [
      {
        url: 'https://www.cdph.ca.gov/Programs/CEH/DFDCS/MCSB/Pages/CannabisProgramRegulations.aspx',
        category: 'manufacturing' as const,
        title: 'Manufacturing Regulations'
      },
      {
        url: 'https://www.cdfa.ca.gov/calcannabis/regulations.html',
        category: 'cultivation' as const,
        title: 'Cultivation Regulations'
      },
      {
        url: 'https://bcc.ca.gov/law_regs/',
        category: 'retail' as const,
        title: 'Retail and Distribution Regulations'
      }
    ]
  },
  'CO': {
    name: 'Colorado',
    sources: [
      {
        url: 'https://sbg.colorado.gov/med-rules',
        category: 'general' as const,
        title: 'Medical Cannabis Rules'
      },
      {
        url: 'https://sbg.colorado.gov/retail-marijuana-rules',
        category: 'retail' as const,
        title: 'Retail Cannabis Rules'
      }
    ]
  },
  'WA': {
    name: 'Washington',
    sources: [
      {
        url: 'https://lcb.wa.gov/laws/laws-and-rules',
        category: 'general' as const,
        title: 'Cannabis Laws and Rules'
      }
    ]
  },
  'OR': {
    name: 'Oregon',
    sources: [
      {
        url: 'https://www.oregon.gov/olcc/marijuana/Pages/Statutes-Rules.aspx',
        category: 'general' as const,
        title: 'Cannabis Statutes and Rules'
      }
    ]
  },
  'NV': {
    name: 'Nevada',
    sources: [
      {
        url: 'https://ccb.nv.gov/about/cannabis-compliance-board-regulations/',
        category: 'general' as const,
        title: 'Cannabis Compliance Board Regulations'
      }
    ]
  },
  'AZ': {
    name: 'Arizona',
    sources: [
      {
        url: 'https://azdhs.gov/licensing/medical-marijuana/index.php#rules-statutes',
        category: 'general' as const,
        title: 'Cannabis Rules and Statutes'
      }
    ]
  },
  'MA': {
    name: 'Massachusetts',
    sources: [
      {
        url: 'https://mass-cannabis-control.com/regulations/',
        category: 'general' as const,
        title: 'Cannabis Control Commission Regulations'
      }
    ]
  },
  'IL': {
    name: 'Illinois',
    sources: [
      {
        url: 'https://www2.illinois.gov/Pages/news-item.aspx?ReleaseID=20862',
        category: 'general' as const,
        title: 'Cannabis Regulation and Tax Act'
      }
    ]
  },
  'NY': {
    name: 'New York',
    sources: [
      {
        url: 'https://cannabis.ny.gov/regulations',
        category: 'general' as const,
        title: 'Cannabis Regulations'
      }
    ]
  },
  'NJ': {
    name: 'New Jersey',
    sources: [
      {
        url: 'https://www.nj.gov/cannabis/businesses/laws-and-regulations/',
        category: 'general' as const,
        title: 'Cannabis Laws and Regulations'
      }
    ]
  },
  'CT': {
    name: 'Connecticut',
    sources: [
      {
        url: 'https://portal.ct.gov/DCP/Drug-Control-Division/Drug-Control-Division/Cannabis',
        category: 'general' as const,
        title: 'Cannabis Regulations'
      }
    ]
  },
  'MI': {
    name: 'Michigan',
    sources: [
      {
        url: 'https://www.michigan.gov/cra/rules-and-regulations',
        category: 'general' as const,
        title: 'Cannabis Regulatory Agency Rules'
      }
    ]
  },
  'FL': {
    name: 'Florida',
    sources: [
      {
        url: 'https://knowthefactsmmj.com/laws-rules/',
        category: 'general' as const,
        title: 'Medical Cannabis Laws and Rules'
      }
    ]
  },
  'PA': {
    name: 'Pennsylvania',
    sources: [
      {
        url: 'https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Medical%20Marijuana.aspx',
        category: 'general' as const,
        title: 'Medical Cannabis Program Regulations'
      }
    ]
  },
  'OH': {
    name: 'Ohio',
    sources: [
      {
        url: 'https://www.com.ohio.gov/divisions/cannabis',
        category: 'general' as const,
        title: 'Cannabis Control Program'
      }
    ]
  },
  'MN': {
    name: 'Minnesota',
    sources: [
      {
        url: 'https://www.health.state.mn.us/people/cannabis/index.html',
        category: 'general' as const,
        title: 'Cannabis Control Office'
      }
    ]
  },
  'MD': {
    name: 'Maryland',
    sources: [
      {
        url: 'https://cannabis.maryland.gov/Pages/home.aspx',
        category: 'general' as const,
        title: 'Cannabis Administration'
      }
    ]
  },
  'DC': {
    name: 'District of Columbia',
    sources: [
      {
        url: 'https://abra.dc.gov/page/medical-cannabis-regulations',
        category: 'general' as const,
        title: 'Medical Cannabis Regulations'
      }
    ]
  },
  'VT': {
    name: 'Vermont',
    sources: [
      {
        url: 'https://ccb.vermont.gov/regulations',
        category: 'general' as const,
        title: 'Cannabis Control Board Regulations'
      }
    ]
  },
  'ME': {
    name: 'Maine',
    sources: [
      {
        url: 'https://www.maine.gov/dafs/ocp/rules-regulations',
        category: 'general' as const,
        title: 'Office of Cannabis Policy Rules'
      }
    ]
  },
  'RI': {
    name: 'Rhode Island',
    sources: [
      {
        url: 'https://dbr.ri.gov/divisions/cannabis/',
        category: 'general' as const,
        title: 'Cannabis Control'
      }
    ]
  },
  'NM': {
    name: 'New Mexico',
    sources: [
      {
        url: 'https://www.rld.nm.gov/cannabis/',
        category: 'general' as const,
        title: 'Cannabis Control Division'
      }
    ]
  },
  'MT': {
    name: 'Montana',
    sources: [
      {
        url: 'https://mtrevenue.gov/cannabis/',
        category: 'general' as const,
        title: 'Cannabis Control Division'
      }
    ]
  },
  'AK': {
    name: 'Alaska',
    sources: [
      {
        url: 'https://www.commerce.alaska.gov/web/amco/marijuana.aspx',
        category: 'general' as const,
        title: 'Marijuana Control Office'
      }
    ]
  },
  'HI': {
    name: 'Hawaii',
    sources: [
      {
        url: 'https://health.hawaii.gov/medicalcannabis/',
        category: 'general' as const,
        title: 'Medical Cannabis Registry Program'
      }
    ]
  }
};

export class RegulatoryDataService {
  private dataPath: string;
  private updateInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private regulations: Map<string, StateRegulation[]> = new Map();
  private lastUpdateCheck: Date = new Date(0);

  constructor(dataPath = './data/regulations') {
    this.dataPath = dataPath;
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
      await fs.mkdir(path.join(this.dataPath, 'states'), { recursive: true });
      await fs.mkdir(path.join(this.dataPath, 'updates'), { recursive: true });
    } catch (error) {
      console.error('Error creating data directories:', error);
    }
  }

  // Fetch regulation content using built-in fetch
  private async fetchRegulationContent(url: string): Promise<string> {
    try {
      console.log(`Fetching regulation from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Formul8 Compliance Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      return content;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return `Error fetching regulation: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Extract meaningful text from HTML content
  private extractTextFromHtml(html: string): string {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags but preserve structure
    text = text.replace(/<br[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    
    // Clean up whitespace
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Normalize line breaks and spaces
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();
    
    return text;
  }

  // Generate content hash for change detection
  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  // Download regulations for a specific state
  async downloadStateRegulations(stateCode: string): Promise<StateRegulation[]> {
    const stateInfo = STATE_REGULATION_SOURCES[stateCode as keyof typeof STATE_REGULATION_SOURCES];
    if (!stateInfo) {
      console.warn(`No regulation sources found for state: ${stateCode}`);
      return [];
    }

    const regulations: StateRegulation[] = [];

    for (const source of stateInfo.sources) {
      try {
        const content = await this.fetchRegulationContent(source.url);
        const cleanContent = this.extractTextFromHtml(content);
        const hash = this.generateHash(cleanContent);

        const regulation: StateRegulation = {
          state: stateInfo.name,
          stateCode,
          title: source.title,
          url: source.url,
          lastUpdated: new Date(),
          content: cleanContent,
          hash,
          version: new Date().toISOString(),
          category: source.category,
          status: 'active'
        };

        regulations.push(regulation);
        
        // Save individual regulation file
        const filename = `${stateCode}_${source.category}_${Date.now()}.json`;
        await this.saveRegulation(regulation, filename);
        
        console.log(`Downloaded regulation: ${stateCode} - ${source.title}`);
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error downloading regulation for ${stateCode} - ${source.title}:`, error);
      }
    }

    return regulations;
  }

  // Save regulation to file
  private async saveRegulation(regulation: StateRegulation, filename: string): Promise<void> {
    try {
      const filePath = path.join(this.dataPath, 'states', filename);
      await fs.writeFile(filePath, JSON.stringify(regulation, null, 2));
    } catch (error) {
      console.error('Error saving regulation:', error);
    }
  }

  // Load all regulations from disk
  async loadRegulations(): Promise<void> {
    try {
      const statesDir = path.join(this.dataPath, 'states');
      const files = await fs.readdir(statesDir);
      
      this.regulations.clear();
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(statesDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const regulation: StateRegulation = JSON.parse(content);
            
            if (!this.regulations.has(regulation.stateCode)) {
              this.regulations.set(regulation.stateCode, []);
            }
            this.regulations.get(regulation.stateCode)!.push(regulation);
          } catch (error) {
            console.error(`Error loading regulation file ${file}:`, error);
          }
        }
      }
      
      console.log(`Loaded regulations for ${this.regulations.size} states`);
    } catch (error) {
      console.error('Error loading regulations:', error);
    }
  }

  // Download regulations for all states
  async downloadAllStateRegulations(): Promise<void> {
    console.log('Starting download of all state regulations...');
    
    const states = Object.keys(STATE_REGULATION_SOURCES);
    let completed = 0;
    
    for (const stateCode of states) {
      try {
        console.log(`Downloading regulations for ${stateCode} (${completed + 1}/${states.length})`);
        const regulations = await this.downloadStateRegulations(stateCode);
        this.regulations.set(stateCode, regulations);
        completed++;
        
        // Save progress
        await this.saveUpdateLog({
          state: stateCode,
          changeType: 'new',
          regulation: regulations[0] || {} as StateRegulation,
          changeDescription: `Downloaded ${regulations.length} regulations`,
          timestamp: new Date()
        });
        
        console.log(`Completed ${stateCode}: ${regulations.length} regulations downloaded`);
        
      } catch (error) {
        console.error(`Failed to download regulations for ${stateCode}:`, error);
      }
    }
    
    this.lastUpdateCheck = new Date();
    console.log(`Regulation download completed: ${completed}/${states.length} states processed`);
  }

  // Check for updates in regulations
  async checkForUpdates(): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    for (const [stateCode, existingRegulations] of this.regulations) {
      try {
        const newRegulations = await this.downloadStateRegulations(stateCode);
        
        for (const newReg of newRegulations) {
          const existingReg = existingRegulations.find(r => 
            r.url === newReg.url && r.category === newReg.category
          );
          
          if (!existingReg) {
            updates.push({
              state: stateCode,
              changeType: 'new',
              regulation: newReg,
              changeDescription: 'New regulation added',
              timestamp: new Date()
            });
          } else if (existingReg.hash !== newReg.hash) {
            updates.push({
              state: stateCode,
              changeType: 'modified',
              regulation: newReg,
              changeDescription: 'Regulation content updated',
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error(`Error checking updates for ${stateCode}:`, error);
      }
    }
    
    return updates;
  }

  // Save update log
  private async saveUpdateLog(update: RegulatoryUpdate): Promise<void> {
    try {
      const filename = `update_${Date.now()}_${update.state}.json`;
      const filePath = path.join(this.dataPath, 'updates', filename);
      await fs.writeFile(filePath, JSON.stringify(update, null, 2));
    } catch (error) {
      console.error('Error saving update log:', error);
    }
  }

  // Get regulations for a specific state
  getStateRegulations(stateCode: string): StateRegulation[] {
    return this.regulations.get(stateCode) || [];
  }

  // Get all regulations
  getAllRegulations(): Map<string, StateRegulation[]> {
    return this.regulations;
  }

  // Search regulations by content
  searchRegulations(query: string, stateCode?: string): StateRegulation[] {
    const results: StateRegulation[] = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    const statesToSearch = stateCode ? [stateCode] : Array.from(this.regulations.keys());
    
    for (const state of statesToSearch) {
      const stateRegulations = this.regulations.get(state) || [];
      
      for (const regulation of stateRegulations) {
        const content = (regulation.title + ' ' + regulation.content).toLowerCase();
        
        if (searchTerms.every(term => content.includes(term))) {
          results.push(regulation);
        }
      }
    }
    
    return results;
  }

  // Start daily update scheduler
  startDailyUpdates(): void {
    // Initial load
    this.loadRegulations();
    
    // Schedule daily updates at 2 AM
    const scheduleNextUpdate = () => {
      const now = new Date();
      const tomorrow2AM = new Date(now);
      tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
      tomorrow2AM.setHours(2, 0, 0, 0);
      
      const msUntil2AM = tomorrow2AM.getTime() - now.getTime();
      
      setTimeout(async () => {
        console.log('Starting daily regulation update...');
        
        try {
          const updates = await this.checkForUpdates();
          console.log(`Daily update completed: ${updates.length} changes detected`);
          
          for (const update of updates) {
            await this.saveUpdateLog(update);
          }
        } catch (error) {
          console.error('Error during daily update:', error);
        }
        
        // Schedule next update
        scheduleNextUpdate();
      }, msUntil2AM);
      
      console.log(`Next regulation update scheduled for: ${tomorrow2AM.toLocaleString()}`);
    };
    
    scheduleNextUpdate();
  }

  // Get regulation statistics
  getStatistics(): {
    totalStates: number;
    totalRegulations: number;
    lastUpdate: Date;
    regulationsByCategory: Record<string, number>;
    regulationsByState: Record<string, number>;
  } {
    let totalRegulations = 0;
    const regulationsByCategory: Record<string, number> = {};
    const regulationsByState: Record<string, number> = {};
    
    for (const [stateCode, regulations] of this.regulations) {
      totalRegulations += regulations.length;
      regulationsByState[stateCode] = regulations.length;
      
      for (const regulation of regulations) {
        regulationsByCategory[regulation.category] = 
          (regulationsByCategory[regulation.category] || 0) + 1;
      }
    }
    
    return {
      totalStates: this.regulations.size,
      totalRegulations,
      lastUpdate: this.lastUpdateCheck,
      regulationsByCategory,
      regulationsByState
    };
  }
}

// Create singleton instance
export const regulatoryDataService = new RegulatoryDataService();