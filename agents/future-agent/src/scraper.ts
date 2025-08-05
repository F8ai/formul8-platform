import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { promises as fs } from 'fs';
import path from 'path';

import {
  ForumPost,
  ForumThread,
  ForumUser,
  ScrapingJob,
  ScrapingConfig,
  AgentConfig
} from './types.js';

export class Future4200Scraper {
  private config: ScrapingConfig;
  private rateLimiter: RateLimiterMemory;
  private browser?: Browser;
  private dataPath: string;

  constructor(config: AgentConfig) {
    this.config = config.scraping;
    this.dataPath = config.storage.localDataPath;
    
    // Rate limiting setup
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: () => 'future4200-scraper',
      points: this.config.requestsPerMinute,
      duration: 60, // per minute
    });
  }

  async initialize(): Promise<void> {
    // Launch browser for JavaScript-heavy pages
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Ensure data directories exist
    await fs.mkdir(path.join(this.dataPath, 'scraped'), { recursive: true });
    await fs.mkdir(path.join(this.dataPath, 'processed'), { recursive: true });
    await fs.mkdir(path.join(this.dataPath, 'images'), { recursive: true });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeCategories(): Promise<string[]> {
    try {
      await this.rateLimiter.consume('request');
      
      const response = await axios.get(this.config.baseUrl, {
        headers: { 'User-Agent': this.config.userAgent },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const categories: string[] = [];

      // Extract category links - this would need to be adapted to actual Future4200 structure
      $('.category-item a, .forum-category a, [class*="category"] a').each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && this.isValidCategory(text)) {
          categories.push(text);
        }
      });

      return categories;
    } catch (error) {
      console.error('Error scraping categories:', error);
      return [];
    }
  }

  async scrapeThreads(category: string, maxPages: number = 10): Promise<ForumThread[]> {
    const threads: ForumThread[] = [];
    
    try {
      for (let page = 1; page <= maxPages; page++) {
        await this.rateLimiter.consume('request');
        
        const categoryUrl = this.buildCategoryUrl(category, page);
        const response = await axios.get(categoryUrl, {
          headers: { 'User-Agent': this.config.userAgent },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const pageThreads = this.parseThreadsFromPage($);
        
        if (pageThreads.length === 0) {
          break; // No more threads on this page
        }
        
        threads.push(...pageThreads);
        
        // Respect rate limiting
        await this.delay(this.config.delayMs);
      }
    } catch (error) {
      console.error(`Error scraping threads for category ${category}:`, error);
    }

    return threads;
  }

  async scrapeThread(threadUrl: string): Promise<ForumThread | null> {
    try {
      await this.rateLimiter.consume('request');
      
      const page = await this.browser!.newPage();
      await page.goto(threadUrl, { waitUntil: 'networkidle' });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const thread = this.parseThreadDetails($, threadUrl);
      
      await page.close();
      return thread;
    } catch (error) {
      console.error(`Error scraping thread ${threadUrl}:`, error);
      return null;
    }
  }

  async scrapePost(postUrl: string): Promise<ForumPost | null> {
    try {
      await this.rateLimiter.consume('request');
      
      const response = await axios.get(postUrl, {
        headers: { 'User-Agent': this.config.userAgent },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      return this.parsePostDetails($, postUrl);
    } catch (error) {
      console.error(`Error scraping post ${postUrl}:`, error);
      return null;
    }
  }

  async scrapeUser(userUrl: string): Promise<ForumUser | null> {
    try {
      await this.rateLimiter.consume('request');
      
      const response = await axios.get(userUrl, {
        headers: { 'User-Agent': this.config.userAgent },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      return this.parseUserProfile($, userUrl);
    } catch (error) {
      console.error(`Error scraping user ${userUrl}:`, error);
      return null;
    }
  }

  private parseThreadsFromPage($: cheerio.CheerioAPI): ForumThread[] {
    const threads: ForumThread[] = [];
    
    // This would need to be adapted to Future4200's actual HTML structure
    $('.thread-item, .topic-item, [class*="thread"]').each((_, element) => {
      const threadEl = $(element);
      const titleEl = threadEl.find('.thread-title a, .topic-title a, h3 a').first();
      const authorEl = threadEl.find('.thread-author, .topic-author, .author').first();
      
      const title = titleEl.text().trim();
      const url = titleEl.attr('href');
      const author = authorEl.text().trim();
      
      if (title && url) {
        const thread: ForumThread = {
          id: this.extractIdFromUrl(url) || `thread_${Date.now()}_${Math.random()}`,
          url: this.resolveUrl(url),
          title,
          category: '', // Would be extracted from context
          author: author || 'Unknown',
          authorId: '', // Would need separate extraction
          createdAt: new Date(), // Would parse from page
          lastActivity: new Date(), // Would parse from page
          posts: [],
          isPinned: threadEl.hasClass('pinned') || threadEl.find('.pinned').length > 0,
          isLocked: threadEl.hasClass('locked') || threadEl.find('.locked').length > 0,
          tags: [],
          views: 0, // Would parse from page
          replies: 0 // Would parse from page
        };
        
        threads.push(thread);
      }
    });
    
    return threads;
  }

  private parseThreadDetails($: cheerio.CheerioAPI, url: string): ForumThread {
    const title = $('h1, .thread-title, .topic-title').first().text().trim();
    const posts: ForumPost[] = [];
    
    // Parse all posts in thread
    $('.post, .message, [class*="post-"]').each((_, element) => {
      const post = this.parsePostFromElement($(element), url);
      if (post) {
        posts.push(post);
      }
    });

    return {
      id: this.extractIdFromUrl(url) || `thread_${Date.now()}`,
      url,
      title,
      category: '', // Extract from breadcrumbs or page context
      author: posts[0]?.author || 'Unknown',
      authorId: posts[0]?.authorId || '',
      createdAt: posts[0]?.timestamp || new Date(),
      lastActivity: posts[posts.length - 1]?.timestamp || new Date(),
      posts,
      isPinned: $('.pinned').length > 0,
      isLocked: $('.locked').length > 0,
      tags: this.extractTags($),
      views: this.extractNumber($('.views, .view-count').text()) || 0,
      replies: posts.length - 1
    };
  }

  private parsePostDetails($: cheerio.CheerioAPI, url: string): ForumPost | null {
    const post = $('.post, .message').first();
    if (!post.length) return null;
    
    return this.parsePostFromElement(post, url);
  }

  private parsePostFromElement(postEl: cheerio.Cheerio<cheerio.Element>, sourceUrl: string): ForumPost | null {
    const title = postEl.find('.post-title, .message-title').text().trim();
    const author = postEl.find('.post-author, .message-author, .username').text().trim();
    const content = postEl.find('.post-content, .message-content, .post-body').html() || '';
    const plainTextContent = postEl.find('.post-content, .message-content, .post-body').text().trim();
    
    if (!plainTextContent) return null;

    return {
      id: `post_${Date.now()}_${Math.random()}`,
      url: sourceUrl,
      title: title || 'Untitled Post',
      author: author || 'Unknown',
      authorId: '', // Would extract from author link
      content,
      plainTextContent,
      timestamp: new Date(), // Would parse from post timestamp
      replies: 0,
      views: 0,
      category: '',
      tags: [],
      images: this.extractImages(postEl),
      attachments: this.extractAttachments(postEl)
    };
  }

  private parseUserProfile($: cheerio.CheerioAPI, url: string): ForumUser {
    return {
      id: this.extractIdFromUrl(url) || `user_${Date.now()}`,
      username: $('.username, .profile-username, h1').first().text().trim(),
      profileUrl: url,
      joinDate: new Date(), // Would parse from profile
      postCount: this.extractNumber($('.post-count').text()) || 0,
      reputation: this.extractNumber($('.reputation').text()) || 0,
      badges: this.extractBadges($),
      expertise: [],
      bio: $('.bio, .profile-bio').text().trim(),
      location: $('.location').text().trim()
    };
  }

  private extractImages(element: cheerio.Cheerio<cheerio.Element>): string[] {
    const images: string[] = [];
    element.find('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src) {
        images.push(this.resolveUrl(src));
      }
    });
    return images;
  }

  private extractAttachments(element: cheerio.Cheerio<cheerio.Element>): string[] {
    const attachments: string[] = [];
    element.find('a[href*="attachment"], .attachment a').each((_, link) => {
      const href = $(link).attr('href');
      if (href) {
        attachments.push(this.resolveUrl(href));
      }
    });
    return attachments;
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    $('.tag, .label, [class*="tag"]').each((_, tag) => {
      const tagText = $(tag).text().trim();
      if (tagText) {
        tags.push(tagText);
      }
    });
    return tags;
  }

  private extractBadges($: cheerio.CheerioAPI): string[] {
    const badges: string[] = [];
    $('.badge, .award, [class*="badge"]').each((_, badge) => {
      const badgeText = $(badge).text().trim();
      if (badgeText) {
        badges.push(badgeText);
      }
    });
    return badges;
  }

  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private extractIdFromUrl(url: string): string | null {
    const match = url.match(/\/(\d+)(?:\/|$)/);
    return match ? match[1] : null;
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.config.baseUrl}${url}`;
    }
    return `${this.config.baseUrl}/${url}`;
  }

  private buildCategoryUrl(category: string, page: number = 1): string {
    // This would need to be adapted to Future4200's URL structure
    return `${this.config.baseUrl}/category/${encodeURIComponent(category)}?page=${page}`;
  }

  private isValidCategory(categoryName: string): boolean {
    const validCategories = [
      'extraction', 'cultivation', 'processing', 'equipment',
      'techniques', 'recipes', 'troubleshooting', 'general'
    ];
    
    return validCategories.some(valid => 
      categoryName.toLowerCase().includes(valid.toLowerCase())
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveScrapingResults(data: any, filename: string): Promise<void> {
    const filepath = path.join(this.dataPath, 'scraped', filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadScrapingResults(filename: string): Promise<any> {
    const filepath = path.join(this.dataPath, 'scraped', filename);
    try {
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }
}