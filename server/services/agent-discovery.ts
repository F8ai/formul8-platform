import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export interface DiscoveredAgent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  repositoryUrl: string;
  hasInterface: boolean;
  category: string;
  capabilities: string[];
  lastUpdated: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export class AgentDiscoveryService {
  private orgName = "F8ai";
  private cache: DiscoveredAgent[] = [];
  private lastFetch = 0;
  private cacheTimeout = 30 * 1000; // 30 seconds for development

  constructor() {
    // No longer need Octokit, using local filesystem
  }

  async discoverAgents(): Promise<DiscoveredAgent[]> {
    const now = Date.now();
    
    // Return cached results if still valid
    if (this.cache.length > 0 && (now - this.lastFetch) < this.cacheTimeout) {
      console.log(`Returning ${this.cache.length} cached agents`);
      return this.cache;
    }

    console.log('Discovering agents from local submodules...');

    try {
      // Scan for agent directories in the /agents directory
      const agentsPath = join(process.cwd(), 'agents');
      
      // Check if agents directory exists
      try {
        await stat(agentsPath);
      } catch (error) {
        console.log('No /agents directory found, returning empty array');
        this.cache = [];
        this.lastFetch = now;
        return [];
      }
      
      const entries = await readdir(agentsPath, { withFileTypes: true });
      
      // Filter for all directories in /agents (not just ending with -agent)
      const agentDirs = entries.filter(entry => 
        entry.isDirectory() && 
        !entry.name.startsWith('.')
      );

      console.log(`Found ${agentDirs.length} agent directories:`, agentDirs.map(d => d.name));

      const agents: DiscoveredAgent[] = [];

      for (const agentDir of agentDirs) {
        try {
          console.log(`Processing agent directory: ${agentDir.name}`);
          const agentInfo = await this.parseAgentDirectory(agentDir.name);
          if (agentInfo) {
            agents.push(agentInfo);
            console.log(`✅ Successfully processed ${agentDir.name}`);
          }
        } catch (error) {
          console.warn(`Failed to parse agent ${agentDir.name}:`, error);
          
          // Fallback agent info from /agents directory
          const fallbackAgent = {
            id: agentDir.name.replace('-agent', ''),
            name: agentDir.name,
            displayName: this.formatDisplayName(agentDir.name),
            description: `${this.formatDisplayName(agentDir.name)} for cannabis operations`,
            repositoryUrl: `https://github.com/${this.orgName}/${agentDir.name}`,
            hasInterface: true,
            category: this.categorizeAgent(agentDir.name),
            capabilities: this.getDefaultCapabilities(agentDir.name),
            lastUpdated: new Date().toISOString(),
            status: 'active' as const
          };
          agents.push(fallbackAgent);
          console.log(`⚠️ Added fallback info for ${agentDir.name}`);
        }
      }

      console.log(`Successfully discovered ${agents.length} agents`);
      this.cache = agents;
      this.lastFetch = now;
      
      return agents;
    } catch (error) {
      console.error('Error discovering agents:', error);
      
      // Return fallback agents if local scan fails
      console.log('Returning fallback agents due to local scan error');
      return this.getFallbackAgents();
    }
  }

  private async parseAgentDirectory(agentName: string): Promise<DiscoveredAgent | null> {
    try {
      const agentPath = join(process.cwd(), 'agents', agentName);
      
      // Try to get README for detailed information
      let readmeContent = '';
      try {
        readmeContent = await readFile(join(agentPath, 'README.md'), 'utf8');
      } catch {
        // README not found, continue with basic info
      }

      // Try to get package.json for capabilities (for Node.js agents)
      let packageInfo: any = {};
      try {
        const packageContent = await readFile(join(agentPath, 'package.json'), 'utf8');
        packageInfo = JSON.parse(packageContent);
      } catch {
        // package.json not found, might be Python agent
      }

      // Try to get requirements.txt for Python agents
      let requirementsContent = '';
      try {
        requirementsContent = await readFile(join(agentPath, 'requirements.txt'), 'utf8');
      } catch {
        // requirements.txt not found
      }

      // Get directory stats for last modified time
      let lastModified = new Date();
      try {
        const stats = await stat(agentPath);
        lastModified = stats.mtime;
      } catch {
        // Use current time if stats fail
      }

      const agentId = agentName.replace('-agent', '');
      
      // Extract description from README first line or package.json
      let description = this.extractDescription(readmeContent, packageInfo);
      
      // If no good description found, use a meaningful default based on agent type
      if (!description || description.length < 10) {
        const agentDescriptions: Record<string, string> = {
          'compliance-agent': 'Cannabis regulatory compliance agent with real-time regulatory data from 24 states',
          'formulation-agent': 'Advanced molecular analysis and formulation design agent with RDKit integration',
          'marketing-agent': 'Cannabis marketing automation with N8N workflows and platform compliance intelligence',
          'operations-agent': 'Cannabis operations management and business analytics optimization agent',
          'sourcing-agent': 'Vendor management and supply chain optimization agent with procurement intelligence',
          'patent-agent': 'Patent research and intellectual property analysis agent with comprehensive database access',
          'spectra-agent': 'Analytical testing and chemical spectra analysis agent with CoA and GCMS integration',
          'customer-success-agent': 'Customer support and success management agent with relationship intelligence',
          'science-agent': 'Evidence-based research agent with PubMed integration and scientific validation',
          'github-tester-agent': 'Automated testing and quality assurance agent for continuous integration'
        };
        description = agentDescriptions[agentName] || `${this.formatDisplayName(agentName)} for cannabis operations`;
      }
      
      return {
        id: agentId,
        name: agentName,
        displayName: this.formatDisplayName(agentName),
        description,
        repositoryUrl: `https://github.com/${this.orgName}/${agentName}`,
        hasInterface: true,
        category: this.categorizeAgent(agentName),
        capabilities: this.extractCapabilities(readmeContent, packageInfo, requirementsContent),
        lastUpdated: lastModified.toISOString(),
        status: this.determineLocalStatus(readmeContent, lastModified)
      };
    } catch (error) {
      console.error(`Error parsing local agent directory ${agentName}:`, error);
      return null;
    }
  }

  private formatDisplayName(repoName: string): string {
    return repoName
      .replace('-agent', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Agent';
  }

  private categorizeAgent(repoName: string): string {
    const categoryMap: Record<string, string> = {
      'science': 'Research & Development',
      'compliance': 'Regulatory & Legal',
      'formulation': 'Product Development',
      'marketing': 'Business & Marketing',
      'operations': 'Operations & Management',
      'patent': 'Intellectual Property',
      'sourcing': 'Supply Chain',
      'spectra': 'Quality & Testing',
      'customer-success': 'Customer Relations',
      'base': 'Core Infrastructure'
    };

    const agentType = repoName.replace('-agent', '');
    return categoryMap[agentType] || 'General';
  }

  private extractDescription(readmeContent: string, packageInfo: any): string | null {
    // Extract description from package.json first
    if (packageInfo.description && packageInfo.description.length > 10) {
      return packageInfo.description;
    }

    // Temporarily disable README parsing to force fallback descriptions
    // This will prevent the box drawing characters from being picked up
    console.log('Skipping README parsing, will use fallback descriptions');
    return null;
  }

  private extractCapabilities(readmeContent: string, packageInfo: any, requirementsContent: string = ''): string[] {
    const capabilities: string[] = [];
    
    // Extract from README
    if (readmeContent) {
      if (readmeContent.includes('PubMed')) capabilities.push('Scientific Research');
      if (readmeContent.includes('RDKit')) capabilities.push('Molecular Analysis');
      if (readmeContent.includes('N8N')) capabilities.push('Workflow Automation');
      if (readmeContent.includes('compliance')) capabilities.push('Regulatory Compliance');
      if (readmeContent.includes('GCMS') || readmeContent.includes('CoA')) capabilities.push('Analytical Testing');
      if (readmeContent.includes('patent')) capabilities.push('Patent Research');
      if (readmeContent.includes('sourcing') || readmeContent.includes('vendor')) capabilities.push('Supply Chain Management');
      if (readmeContent.includes('marketing')) capabilities.push('Marketing Automation');
      if (readmeContent.includes('operations')) capabilities.push('Operations Management');
      if (readmeContent.includes('customer')) capabilities.push('Customer Support');
    }

    // Extract from package.json dependencies
    if (packageInfo.dependencies) {
      if (packageInfo.dependencies.openai) capabilities.push('AI Processing');
      if (packageInfo.dependencies.axios) capabilities.push('API Integration');
      if (packageInfo.dependencies.cheerio) capabilities.push('Data Extraction');
      if (packageInfo.dependencies.express) capabilities.push('Web Services');
    }

    // Extract from requirements.txt (Python dependencies)
    if (requirementsContent) {
      if (requirementsContent.includes('openai')) capabilities.push('AI Processing');
      if (requirementsContent.includes('requests')) capabilities.push('API Integration');
      if (requirementsContent.includes('streamlit')) capabilities.push('Interactive Dashboard');
      if (requirementsContent.includes('rdkit')) capabilities.push('Molecular Analysis');
      if (requirementsContent.includes('biopython')) capabilities.push('Scientific Research');
    }

    return capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(packageInfo.name);
  }

  private getDefaultCapabilities(repoName: string): string[] {
    const defaultCapabilities: Record<string, string[]> = {
      'science-agent': ['Scientific Research', 'Literature Analysis', 'Evidence Validation'],
      'compliance-agent': ['Regulatory Compliance', 'Risk Assessment', 'Documentation'],
      'formulation-agent': ['Product Formulation', 'Chemical Analysis', 'Quality Control'],
      'marketing-agent': ['Marketing Strategy', 'Campaign Management', 'Compliance Marketing'],
      'operations-agent': ['Facility Management', 'Process Optimization', 'Operations Planning'],
      'patent-agent': ['Patent Research', 'IP Analysis', 'Legal Documentation'],
      'sourcing-agent': ['Vendor Management', 'Supply Chain', 'Procurement'],
      'spectra-agent': ['Analytical Testing', 'Data Interpretation', 'Quality Assurance'],
      'customer-success-agent': ['Customer Support', 'Success Planning', 'Relationship Management'],
      'base-agent': ['Core Functionality', 'Agent Infrastructure', 'Common Services']
    };

    return defaultCapabilities[repoName] || ['General Consultation', 'AI Processing'];
  }

  private determineLocalStatus(readmeContent: string, lastModified: Date): 'active' | 'inactive' | 'maintenance' {
    const daysSinceUpdate = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
    
    if (readmeContent.includes('maintenance') || readmeContent.includes('deprecated')) {
      return 'maintenance';
    }
    
    if (daysSinceUpdate > 30) {
      return 'inactive';
    }
    
    return 'active';
  }

  private getFallbackAgents(): DiscoveredAgent[] {
    console.log('Returning fallback agents');
    return [
      {
        id: 'compliance',
        name: 'compliance-agent',
        displayName: 'Compliance Agent',
        description: 'Cannabis regulatory compliance agent with multi-state support',
        repositoryUrl: 'https://github.com/F8ai/compliance-agent',
        hasInterface: true,
        category: 'Regulatory & Legal',
        capabilities: ['Regulatory Compliance', 'Risk Assessment', 'Documentation'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'formulation',
        name: 'formulation-agent',
        displayName: 'Formulation Agent',
        description: 'Molecular analysis and formulation design agent with RDKit',
        repositoryUrl: 'https://github.com/F8ai/formulation-agent',
        hasInterface: true,
        category: 'Product Development',
        capabilities: ['Product Formulation', 'Chemical Analysis', 'Quality Control'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'marketing',
        name: 'marketing-agent',
        displayName: 'Marketing Agent',
        description: 'Cannabis marketing automation with N8N workflow orchestration',
        repositoryUrl: 'https://github.com/F8ai/marketing-agent',
        hasInterface: true,
        category: 'Business & Marketing',
        capabilities: ['Marketing Strategy', 'Campaign Management', 'Compliance Marketing'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'operations',
        name: 'operations-agent',
        displayName: 'Operations Agent',
        description: 'Cannabis operations management and optimization agent',
        repositoryUrl: 'https://github.com/F8ai/operations-agent',
        hasInterface: true,
        category: 'Operations & Management',
        capabilities: ['Facility Management', 'Process Optimization', 'Operations Planning'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'sourcing',
        name: 'sourcing-agent',
        displayName: 'Sourcing Agent',
        description: 'Vendor management and supply chain optimization agent',
        repositoryUrl: 'https://github.com/F8ai/sourcing-agent',
        hasInterface: true,
        category: 'Supply Chain',
        capabilities: ['Vendor Management', 'Supply Chain', 'Procurement'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'patent',
        name: 'patent-agent',
        displayName: 'Patent Agent',
        description: 'Patent research and intellectual property analysis agent',
        repositoryUrl: 'https://github.com/F8ai/patent-agent',
        hasInterface: true,
        category: 'Intellectual Property',
        capabilities: ['Patent Research', 'IP Analysis', 'Legal Documentation'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'spectra',
        name: 'spectra-agent',
        displayName: 'Spectra Agent',
        description: 'Analytical testing and spectra analysis agent',
        repositoryUrl: 'https://github.com/F8ai/spectra-agent',
        hasInterface: true,
        category: 'Quality & Testing',
        capabilities: ['Analytical Testing', 'Data Interpretation', 'Quality Assurance'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'customer-success',
        name: 'customer-success-agent',
        displayName: 'Customer Success Agent',
        description: 'Customer support and success management agent',
        repositoryUrl: 'https://github.com/F8ai/customer-success-agent',
        hasInterface: true,
        category: 'Customer Relations',
        capabilities: ['Customer Support', 'Success Planning', 'Relationship Management'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'science',
        name: 'science-agent',
        displayName: 'Science Agent',
        description: 'Evidence-based research agent with PubMed integration',
        repositoryUrl: 'https://github.com/F8ai/science-agent',
        hasInterface: true,
        category: 'Research & Development',
        capabilities: ['Scientific Research', 'Literature Analysis', 'Evidence Validation'],
        lastUpdated: new Date().toISOString(),
        status: 'active'
      }
    ];
  }

  async getAgentById(agentId: string): Promise<DiscoveredAgent | null> {
    const agents = await this.discoverAgents();
    return agents.find(agent => agent.id === agentId) || null;
  }

  async refreshCache(): Promise<void> {
    this.cache = [];
    this.lastFetch = 0;
    await this.discoverAgents();
  }

  // Force refresh method for internal use
  async forceRefresh(): Promise<DiscoveredAgent[]> {
    this.cache = [];
    this.lastFetch = 0;
    return await this.discoverAgents();
  }
}

export const agentDiscovery = new AgentDiscoveryService();