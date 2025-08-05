import { OpenAI } from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { promises as fs } from 'fs';
import path from 'path';
import * as natural from 'natural';
import compromise from 'compromise';

import {
  ForumPost,
  ForumThread,
  IndexedContent,
  SearchResult,
  KnowledgeEntry,
  IndexingConfig,
  AgentConfig
} from './types.js';

export class ContentIndexer {
  private config: IndexingConfig;
  private embeddings: OpenAIEmbeddings;
  private vectorStore?: FaissStore;
  private textSplitter: RecursiveCharacterTextSplitter;
  private dataPath: string;
  private openai: OpenAI;

  constructor(config: AgentConfig, openaiApiKey: string) {
    this.config = config.indexing;
    this.dataPath = config.storage.localDataPath;
    
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: this.config.embeddingModel
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
  }

  async initialize(): Promise<void> {
    // Ensure index directories exist
    await fs.mkdir(path.join(this.dataPath, 'index'), { recursive: true });
    await fs.mkdir(path.join(this.dataPath, 'processed'), { recursive: true });

    // Load or create vector store
    await this.loadOrCreateVectorStore();
  }

  private async loadOrCreateVectorStore(): Promise<void> {
    const indexPath = path.join(this.dataPath, 'index', 'faiss_index');
    
    try {
      // Try to load existing index
      this.vectorStore = await FaissStore.load(indexPath, this.embeddings);
      console.log('Loaded existing vector store');
    } catch (error) {
      // Create new empty vector store
      this.vectorStore = new FaissStore(this.embeddings, {});
      console.log('Created new vector store');
    }
  }

  async indexThread(thread: ForumThread): Promise<void> {
    const indexedContents: IndexedContent[] = [];

    // Index the thread itself
    const threadContent: IndexedContent = {
      id: `thread_${thread.id}`,
      sourceUrl: thread.url,
      title: thread.title,
      content: thread.title,
      contentType: 'thread',
      category: thread.category,
      topics: await this.extractTopics(thread.title),
      author: thread.author,
      timestamp: thread.createdAt,
      metadata: {
        replies: thread.replies,
        views: thread.views,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        tags: thread.tags
      }
    };
    indexedContents.push(threadContent);

    // Index all posts in the thread
    for (const post of thread.posts) {
      const indexedPost = await this.indexPost(post);
      if (indexedPost) {
        indexedContents.push(indexedPost);
      }
    }

    // Add to vector store
    await this.addToVectorStore(indexedContents);

    // Extract and save knowledge entries
    const knowledgeEntries = await this.extractKnowledgeFromThread(thread);
    await this.saveKnowledgeEntries(knowledgeEntries);

    // Save processed thread
    await this.saveProcessedContent(thread, 'threads');
  }

  async indexPost(post: ForumPost): Promise<IndexedContent | null> {
    if (!post.plainTextContent.trim()) {
      return null;
    }

    const topics = await this.extractTopics(post.plainTextContent);
    const techniques = await this.extractTechniques(post.plainTextContent);

    const indexedContent: IndexedContent = {
      id: `post_${post.id}`,
      sourceUrl: post.url,
      title: post.title,
      content: post.plainTextContent,
      contentType: 'post',
      category: post.category,
      topics,
      author: post.author,
      timestamp: post.timestamp,
      metadata: {
        hasImages: post.images.length > 0,
        hasAttachments: post.attachments.length > 0,
        techniques,
        equipment: await this.extractEquipment(post.plainTextContent),
        materials: await this.extractMaterials(post.plainTextContent)
      }
    };

    return indexedContent;
  }

  private async addToVectorStore(contents: IndexedContent[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    for (const content of contents) {
      // Split content into chunks if too large
      const chunks = await this.textSplitter.splitText(content.content);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${content.id}_chunk_${i}`;
        const metadata = {
          ...content.metadata,
          sourceId: content.id,
          sourceUrl: content.sourceUrl,
          title: content.title,
          contentType: content.contentType,
          category: content.category,
          author: content.author,
          timestamp: content.timestamp.toISOString(),
          topics: content.topics,
          chunkIndex: i,
          totalChunks: chunks.length
        };

        await this.vectorStore.addDocuments([{
          pageContent: chunks[i],
          metadata
        }]);
      }
    }

    // Save updated index
    await this.saveVectorStore();
  }

  async search(query: string, options: {
    maxResults?: number;
    category?: string;
    contentType?: string;
    timeRange?: { start: Date; end: Date };
  } = {}): Promise<SearchResult[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const { maxResults = 10, category, contentType, timeRange } = options;

    // Perform vector similarity search
    const results = await this.vectorStore.similaritySearchWithScore(query, maxResults * 2);

    // Filter and format results
    const searchResults: SearchResult[] = [];

    for (const [document, score] of results) {
      const metadata = document.metadata;

      // Apply filters
      if (category && metadata.category !== category) continue;
      if (contentType && metadata.contentType !== contentType) continue;
      if (timeRange) {
        const docTime = new Date(metadata.timestamp);
        if (docTime < timeRange.start || docTime > timeRange.end) continue;
      }

      // Generate highlights
      const highlights = this.generateHighlights(document.pageContent, query);

      const searchResult: SearchResult = {
        id: metadata.sourceId,
        title: metadata.title,
        content: document.pageContent,
        url: metadata.sourceUrl,
        relevanceScore: 1 - score, // Convert distance to relevance
        category: metadata.category,
        author: metadata.author,
        timestamp: new Date(metadata.timestamp),
        highlights
      };

      searchResults.push(searchResult);

      if (searchResults.length >= maxResults) break;
    }

    return searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async extractTopics(text: string): Promise<string[]> {
    if (!this.config.enableTopicModeling) {
      return [];
    }

    // Use compromise for basic NLP
    const doc = compromise(text);
    const topics: Set<string> = new Set();

    // Extract cannabis-related terms
    const cannabisTerms = [
      'cultivation', 'extraction', 'processing', 'curing', 'drying',
      'trimming', 'harvest', 'flowering', 'vegetative', 'clone',
      'mother plant', 'seed', 'strain', 'phenotype', 'genetics',
      'nutrient', 'feeding', 'watering', 'pH', 'EC', 'PPM',
      'light', 'LED', 'HPS', 'temperature', 'humidity', 'ventilation',
      'CO2', 'training', 'LST', 'HST', 'SCROG', 'SOG',
      'rosin', 'hash', 'bubble hash', 'distillate', 'live resin',
      'shatter', 'wax', 'crumble', 'oil', 'tincture', 'edible'
    ];

    for (const term of cannabisTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        topics.add(term);
      }
    }

    // Extract noun phrases that might be topics
    const nouns = doc.match('#Noun+').out('array');
    for (const noun of nouns) {
      if (noun.length > 3 && noun.length < 30) {
        topics.add(noun.toLowerCase());
      }
    }

    return Array.from(topics).slice(0, 10); // Limit to top 10 topics
  }

  private async extractTechniques(text: string): Promise<string[]> {
    const techniques: Set<string> = new Set();
    
    // Common cannabis techniques
    const techniquePatterns = [
      /(?:how to|technique for|method of|process of)\s+([^.!?]+)/gi,
      /(?:step\s+\d+[:.]\s*)([^.!?]+)/gi,
      /(training|trimming|curing|drying|extracting|pressing|washing)\s+([^.!?]+)/gi
    ];

    for (const pattern of techniquePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const technique = match[1]?.trim();
        if (technique && technique.length > 5 && technique.length < 100) {
          techniques.add(technique.toLowerCase());
        }
      }
    }

    return Array.from(techniques).slice(0, 5);
  }

  private async extractEquipment(text: string): Promise<string[]> {
    const equipment: Set<string> = new Set();
    
    const equipmentTerms = [
      'press', 'rosin press', 'bubble bag', 'trim bin', 'scissors',
      'hygrometer', 'pH meter', 'EC meter', 'scale', 'microscope',
      'LED light', 'HPS light', 'ballast', 'reflector', 'timer',
      'fan', 'carbon filter', 'ducting', 'tent', 'jar', 'boveda',
      'parchment paper', 'silicone mat', 'dabber', 'torch',
      'extraction tube', 'vacuum pump', 'heat gun', 'magnetic stirrer'
    ];

    for (const term of equipmentTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        equipment.add(term);
      }
    }

    return Array.from(equipment).slice(0, 10);
  }

  private async extractMaterials(text: string): Promise<string[]> {
    const materials: Set<string> = new Set();
    
    const materialTerms = [
      'flower', 'trim', 'shake', 'kief', 'ice', 'dry ice',
      'ethanol', 'isopropyl', 'butane', 'propane', 'solventless',
      'nitrogen', 'argon', 'mason jar', 'turkey bag', 'vacuum bag'
    ];

    for (const term of materialTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        materials.add(term);
      }
    }

    return Array.from(materials).slice(0, 8);
  }

  private async extractKnowledgeFromThread(thread: ForumThread): Promise<KnowledgeEntry[]> {
    const knowledgeEntries: KnowledgeEntry[] = [];
    
    // Use AI to extract structured knowledge
    const threadText = thread.posts.map(p => p.plainTextContent).join('\n\n');
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract structured cannabis knowledge from forum discussions. 
            Identify techniques, processes, tips, and warnings. 
            Focus on actionable information related to cultivation, extraction, and processing.
            Return results as JSON array with fields: topic, technique, description, steps, equipment, materials, tips, warnings.`
          },
          {
            role: 'user',
            content: `Extract knowledge from this cannabis forum thread titled "${thread.title}":\n\n${threadText.slice(0, 8000)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const result = completion.choices[0]?.message?.content;
      if (result) {
        const extractedKnowledge = JSON.parse(result);
        
        for (const entry of extractedKnowledge) {
          const knowledgeEntry: KnowledgeEntry = {
            id: `knowledge_${Date.now()}_${Math.random()}`,
            topic: entry.topic || 'General',
            technique: entry.technique || 'Unknown Technique',
            description: entry.description || '',
            steps: Array.isArray(entry.steps) ? entry.steps : [],
            equipment: Array.isArray(entry.equipment) ? entry.equipment : [],
            materials: Array.isArray(entry.materials) ? entry.materials : [],
            tips: Array.isArray(entry.tips) ? entry.tips : [],
            warnings: Array.isArray(entry.warnings) ? entry.warnings : [],
            sources: [thread.url],
            confidence: 0.8, // Based on forum source
            lastUpdated: new Date()
          };
          
          knowledgeEntries.push(knowledgeEntry);
        }
      }
    } catch (error) {
      console.error('Error extracting knowledge with AI:', error);
    }

    return knowledgeEntries;
  }

  private generateHighlights(text: string, query: string): string[] {
    const highlights: string[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = queryTerms.some(term => lowerSentence.includes(term));
      
      if (hasMatch && sentence.trim().length > 20) {
        highlights.push(sentence.trim());
      }
      
      if (highlights.length >= 3) break;
    }

    return highlights;
  }

  private async saveVectorStore(): Promise<void> {
    if (!this.vectorStore) return;
    
    const indexPath = path.join(this.dataPath, 'index', 'faiss_index');
    await this.vectorStore.save(indexPath);
  }

  private async saveKnowledgeEntries(entries: KnowledgeEntry[]): Promise<void> {
    const knowledgePath = path.join(this.dataPath, 'processed', 'knowledge_entries.json');
    
    let existingEntries: KnowledgeEntry[] = [];
    try {
      const data = await fs.readFile(knowledgePath, 'utf8');
      existingEntries = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }

    existingEntries.push(...entries);
    await fs.writeFile(knowledgePath, JSON.stringify(existingEntries, null, 2));
  }

  private async saveProcessedContent(content: any, type: string): Promise<void> {
    const filename = `${type}_${Date.now()}.json`;
    const filepath = path.join(this.dataPath, 'processed', filename);
    await fs.writeFile(filepath, JSON.stringify(content, null, 2));
  }

  async getStats(): Promise<{
    totalDocuments: number;
    categories: Record<string, number>;
    contentTypes: Record<string, number>;
    topTopics: string[];
  }> {
    // This would query the vector store and processed files for statistics
    // Implementation would depend on the specific vector store capabilities
    return {
      totalDocuments: 0,
      categories: {},
      contentTypes: {},
      topTopics: []
    };
  }
}