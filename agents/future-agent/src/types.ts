// Core types for Future Agent

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
}

export interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  processQuery(query: string, context?: any): Promise<AgentResponse>;
}

// Scraping types
export interface ForumPost {
  id: string;
  url: string;
  title: string;
  author: string;
  authorId: string;
  content: string;
  plainTextContent: string;
  timestamp: Date;
  replies: number;
  views: number;
  category: string;
  tags: string[];
  images: string[];
  attachments: string[];
  upvotes?: number;
  downvotes?: number;
}

export interface ForumThread {
  id: string;
  url: string;
  title: string;
  category: string;
  author: string;
  authorId: string;
  createdAt: Date;
  lastActivity: Date;
  posts: ForumPost[];
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  views: number;
  replies: number;
}

export interface ForumUser {
  id: string;
  username: string;
  profileUrl: string;
  joinDate: Date;
  postCount: number;
  reputation: number;
  badges: string[];
  expertise: string[];
  bio?: string;
  location?: string;
}

export interface ScrapingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalPages: number;
  scrapedPages: number;
  errors: string[];
  results: {
    threads: number;
    posts: number;
    users: number;
    images: number;
  };
}

// Indexing types
export interface IndexedContent {
  id: string;
  sourceUrl: string;
  title: string;
  content: string;
  contentType: 'post' | 'thread' | 'profile';
  category: string;
  topics: string[];
  author: string;
  timestamp: Date;
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url: string;
  relevanceScore: number;
  category: string;
  author: string;
  timestamp: Date;
  highlights: string[];
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  technique: string;
  description: string;
  steps: string[];
  equipment: string[];
  materials: string[];
  tips: string[];
  warnings: string[];
  sources: string[];
  confidence: number;
  lastUpdated: Date;
}

// Configuration types
export interface ScrapingConfig {
  baseUrl: string;
  userAgent: string;
  delayMs: number;
  maxConcurrentRequests: number;
  requestsPerMinute: number;
  dailyRequestLimit: number;
  respectRobotsTxt: boolean;
  categories: string[];
  maxPagesPerCategory: number;
}

export interface IndexingConfig {
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  vectorDimensions: number;
  batchSize: number;
  enableTopicModeling: boolean;
  topicModelThreshold: number;
}

export interface StorageConfig {
  databaseUrl: string;
  elasticsearchUrl?: string;
  vectorDbUrl?: string;
  localDataPath: string;
  backupEnabled: boolean;
  compressionEnabled: boolean;
}

export interface AgentConfig {
  scraping: ScrapingConfig;
  indexing: IndexingConfig;
  storage: StorageConfig;
  features: {
    realTimeMonitoring: boolean;
    expertIdentification: boolean;
    trendAnalysis: boolean;
    contentSummarization: boolean;
    crossReferencing: boolean;
  };
}

// Query types
export interface QueryContext {
  userExpertise: 'beginner' | 'intermediate' | 'expert';
  preferredSources: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  includeImages: boolean;
  maxResults: number;
}