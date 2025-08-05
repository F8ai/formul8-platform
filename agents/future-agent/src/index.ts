import { OpenAI } from 'openai';
import { Future4200Scraper } from './scraper.js';
import { ContentIndexer } from './indexer.js';
import {
  Agent,
  AgentResponse,
  AgentConfig,
  QueryContext,
  SearchResult,
  KnowledgeEntry
} from './types.js';

export class FutureAgent implements Agent {
  name: string;
  description: string;
  capabilities: string[];
  
  private config: AgentConfig;
  private scraper: Future4200Scraper;
  private indexer: ContentIndexer;
  private openai: OpenAI;

  constructor(config?: Partial<AgentConfig>) {
    this.name = process.env.AGENT_NAME || 'Future Agent';
    this.description = 'AI agent specialized in scraping and indexing Future4200.com cannabis knowledge';
    this.capabilities = [
      'Web Scraping Future4200.com',
      'Content Indexing and Search',
      'Knowledge Extraction',
      'Expert Identification',
      'Trend Analysis',
      'Technique Documentation',
      'Equipment Recommendations',
      'Process Troubleshooting',
      'Community Insights'
    ];

    // Default configuration
    this.config = {
      scraping: {
        baseUrl: process.env.FUTURE4200_BASE_URL || 'https://future4200.com',
        userAgent: process.env.USER_AGENT || 'Future Agent Bot 1.0',
        delayMs: parseInt(process.env.SCRAPE_DELAY_MS || '1000'),
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3'),
        requestsPerMinute: parseInt(process.env.REQUESTS_PER_MINUTE || '30'),
        dailyRequestLimit: parseInt(process.env.DAILY_REQUEST_LIMIT || '10000'),
        respectRobotsTxt: true,
        categories: ['extraction', 'cultivation', 'processing', 'equipment'],
        maxPagesPerCategory: 50
      },
      indexing: {
        embeddingModel: 'text-embedding-3-small',
        chunkSize: 1000,
        chunkOverlap: 200,
        vectorDimensions: 1536,
        batchSize: 100,
        enableTopicModeling: true,
        topicModelThreshold: 0.7
      },
      storage: {
        databaseUrl: process.env.DATABASE_URL || '',
        elasticsearchUrl: process.env.ELASTICSEARCH_URL,
        vectorDbUrl: process.env.VECTOR_DB_URL,
        localDataPath: process.env.DATA_PATH || './data',
        backupEnabled: true,
        compressionEnabled: true
      },
      features: {
        realTimeMonitoring: true,
        expertIdentification: true,
        trendAnalysis: true,
        contentSummarization: true,
        crossReferencing: true
      },
      ...config
    };

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.scraper = new Future4200Scraper(this.config);
    this.indexer = new ContentIndexer(this.config, openaiApiKey);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Future Agent...');
    await this.scraper.initialize();
    await this.indexer.initialize();
    console.log('Future Agent initialized successfully');
  }

  async processQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    try {
      console.log(`Processing query: ${query}`);
      
      // Determine query type and route to appropriate handler
      const queryType = this.classifyQuery(query);
      
      switch (queryType) {
        case 'search':
          return await this.handleSearchQuery(query, context);
        case 'technique':
          return await this.handleTechniqueQuery(query, context);
        case 'equipment':
          return await this.handleEquipmentQuery(query, context);
        case 'expert':
          return await this.handleExpertQuery(query, context);
        case 'trend':
          return await this.handleTrendQuery(query, context);
        default:
          return await this.handleGeneralQuery(query, context);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        agent: this.name,
        response: 'I encountered an error while processing your request. Please try again or rephrase your question.',
        confidence: 0,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private classifyQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('search') || queryLower.includes('find') || queryLower.includes('look for')) {
      return 'search';
    }
    if (queryLower.includes('how to') || queryLower.includes('technique') || queryLower.includes('method')) {
      return 'technique';
    }
    if (queryLower.includes('equipment') || queryLower.includes('tool') || queryLower.includes('gear')) {
      return 'equipment';
    }
    if (queryLower.includes('expert') || queryLower.includes('who knows') || queryLower.includes('specialist')) {
      return 'expert';
    }
    if (queryLower.includes('trend') || queryLower.includes('popular') || queryLower.includes('latest')) {
      return 'trend';
    }
    
    return 'general';
  }

  private async handleSearchQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    const searchResults = await this.indexer.search(query, {
      maxResults: context?.maxResults || 10,
      category: context?.categories?.[0],
      timeRange: context?.timeRange
    });

    if (searchResults.length === 0) {
      return {
        agent: this.name,
        response: `I couldn't find any content matching "${query}" in the Future4200 knowledge base. This might be because the content hasn't been scraped yet, or the topic isn't covered in the forums.`,
        confidence: 10,
        sources: [],
        metadata: { queryType: 'search', resultsFound: 0 }
      };
    }

    const response = this.formatSearchResults(searchResults, query);
    const sources = searchResults.map(r => r.url);

    return {
      agent: this.name,
      response,
      confidence: 85,
      sources,
      metadata: {
        queryType: 'search',
        resultsFound: searchResults.length,
        topCategories: this.getTopCategories(searchResults)
      }
    };
  }

  private async handleTechniqueQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    // Search for relevant techniques
    const searchResults = await this.indexer.search(query, {
      maxResults: 5,
      category: context?.categories?.[0]
    });

    // Use AI to synthesize technique information
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a cannabis processing and cultivation expert. Based on the forum discussions provided, 
          give detailed, practical advice about techniques. Include step-by-step instructions when possible,
          mention required equipment and materials, and include any tips or warnings from the community.
          Always cite the original forum sources.`
        },
        {
          role: 'user',
          content: `User question: ${query}\n\nRelevant forum discussions:\n${this.formatSearchResultsForAI(searchResults)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Unable to generate technique guidance.';
    const sources = searchResults.map(r => r.url);

    return {
      agent: this.name,
      response: aiResponse,
      confidence: 88,
      sources,
      metadata: {
        queryType: 'technique',
        relatedResults: searchResults.length,
        aiGenerated: true
      }
    };
  }

  private async handleEquipmentQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    const searchResults = await this.indexer.search(`equipment ${query}`, {
      maxResults: 8
    });

    // Extract equipment mentions and recommendations
    const equipmentMentions = new Map<string, { count: number; contexts: string[] }>();
    
    for (const result of searchResults) {
      // This would be enhanced with better equipment extraction
      const equipment = result.content.match(/\b(press|rosin press|bubble bag|trim bin|scissors|hygrometer|pH meter|scale|LED|HPS|fan|filter)\b/gi) || [];
      
      for (const item of equipment) {
        const normalized = item.toLowerCase();
        if (!equipmentMentions.has(normalized)) {
          equipmentMentions.set(normalized, { count: 0, contexts: [] });
        }
        const entry = equipmentMentions.get(normalized)!;
        entry.count++;
        entry.contexts.push(result.content.slice(0, 200));
      }
    }

    const topEquipment = Array.from(equipmentMentions.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    let response = `Based on Future4200 community discussions about "${query}", here are the most commonly mentioned equipment items:\n\n`;
    
    for (const [equipment, data] of topEquipment) {
      response += `**${equipment}** (mentioned ${data.count} times)\n`;
      response += `Context: ${data.contexts[0]}...\n\n`;
    }

    if (topEquipment.length === 0) {
      response = `I couldn't find specific equipment recommendations for "${query}" in the Future4200 discussions. You might want to try a more specific search or ask the community directly.`;
    }

    return {
      agent: this.name,
      response,
      confidence: 75,
      sources: searchResults.map(r => r.url),
      metadata: {
        queryType: 'equipment',
        equipmentFound: topEquipment.length,
        searchResults: searchResults.length
      }
    };
  }

  private async handleExpertQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    // This would require user profile analysis
    return {
      agent: this.name,
      response: 'Expert identification feature is being developed. I can search for content related to your topic instead.',
      confidence: 20,
      requiresHumanVerification: true,
      metadata: { queryType: 'expert', featureStatus: 'in_development' }
    };
  }

  private async handleTrendQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    // This would require temporal analysis of content
    return {
      agent: this.name,
      response: 'Trend analysis feature is being developed. I can search for recent content related to your topic instead.',
      confidence: 20,
      requiresHumanVerification: true,
      metadata: { queryType: 'trend', featureStatus: 'in_development' }
    };
  }

  private async handleGeneralQuery(query: string, context?: QueryContext): Promise<AgentResponse> {
    const searchResults = await this.indexer.search(query, {
      maxResults: 8,
      category: context?.categories?.[0]
    });

    if (searchResults.length === 0) {
      return {
        agent: this.name,
        response: `I don't have information about "${query}" in my current Future4200 knowledge base. This might be a good question to ask directly on the Future4200 forums.`,
        confidence: 15,
        metadata: { queryType: 'general', suggestion: 'ask_community' }
      };
    }

    // Use AI to provide comprehensive answer
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable cannabis expert drawing from Future4200 community discussions. 
          Provide helpful, accurate information based on the forum content provided. 
          Always mention that the information comes from Future4200 community discussions.
          Be practical and specific in your advice.`
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nRelevant Future4200 discussions:\n${this.formatSearchResultsForAI(searchResults)}`
        }
      ],
      max_tokens: 1200,
      temperature: 0.4
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Unable to generate response.';
    const sources = searchResults.map(r => r.url);

    return {
      agent: this.name,
      response: aiResponse,
      confidence: 82,
      sources,
      metadata: {
        queryType: 'general',
        sourceCount: searchResults.length,
        aiGenerated: true
      }
    };
  }

  private formatSearchResults(results: SearchResult[], query: string): string {
    let response = `Found ${results.length} relevant discussions on Future4200 about "${query}":\n\n`;
    
    for (const result of results.slice(0, 5)) {
      response += `**${result.title}** (by ${result.author})\n`;
      if (result.highlights.length > 0) {
        response += `"${result.highlights[0]}"\n`;
      }
      response += `[View Discussion](${result.url})\n\n`;
    }

    if (results.length > 5) {
      response += `...and ${results.length - 5} more results.\n`;
    }

    return response;
  }

  private formatSearchResultsForAI(results: SearchResult[]): string {
    return results.map((result, index) => 
      `[${index + 1}] ${result.title} by ${result.author}\n${result.content.slice(0, 500)}...\nURL: ${result.url}\n`
    ).join('\n---\n');
  }

  private getTopCategories(results: SearchResult[]): string[] {
    const categories = new Map<string, number>();
    
    for (const result of results) {
      const cat = result.category || 'General';
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }

    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  }

  // Utility methods for manual operations
  async scrapeLatestContent(): Promise<void> {
    console.log('Starting content scraping...');
    const categories = await this.scraper.scrapeCategories();
    
    for (const category of categories.slice(0, 3)) { // Limit for testing
      console.log(`Scraping category: ${category}`);
      const threads = await this.scraper.scrapeThreads(category, 5);
      
      for (const thread of threads) {
        console.log(`Indexing thread: ${thread.title}`);
        await this.indexer.indexThread(thread);
      }
    }
    
    console.log('Content scraping completed');
  }

  async getAgentStats(): Promise<object> {
    return await this.indexer.getStats();
  }

  async cleanup(): Promise<void> {
    await this.scraper.cleanup();
  }
}

// Export default instance
const agent = new FutureAgent();

export default agent;

// Also export the class for custom configurations
export { FutureAgent };