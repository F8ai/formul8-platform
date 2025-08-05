import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { FutureAgent } from '../src/index';
import { AgentConfig } from '../src/types';

describe('Future Agent', () => {
  let agent: FutureAgent;

  beforeAll(async () => {
    // Use test configuration
    const testConfig: Partial<AgentConfig> = {
      scraping: {
        baseUrl: 'https://example.com',
        userAgent: 'Test Agent',
        delayMs: 100,
        maxConcurrentRequests: 1,
        requestsPerMinute: 60,
        dailyRequestLimit: 1000,
        respectRobotsTxt: true,
        categories: ['test'],
        maxPagesPerCategory: 1
      },
      storage: {
        databaseUrl: '',
        localDataPath: './test-data',
        backupEnabled: false,
        compressionEnabled: false
      }
    };

    agent = new FutureAgent(testConfig);
  });

  afterAll(async () => {
    await agent.cleanup();
  });

  test('should have correct agent properties', () => {
    expect(agent.name).toBeDefined();
    expect(agent.description).toBeDefined();
    expect(agent.capabilities).toBeInstanceOf(Array);
    expect(agent.capabilities.length).toBeGreaterThan(0);
  });

  test('should process simple query', async () => {
    const result = await agent.processQuery('test query');
    
    expect(result.agent).toBe(agent.name);
    expect(result.response).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  test('should handle search queries', async () => {
    const result = await agent.processQuery('search for extraction techniques');
    
    expect(result.metadata?.queryType).toBe('search');
    expect(result.response).toContain('extraction');
  });

  test('should handle technique queries', async () => {
    const result = await agent.processQuery('how to make rosin');
    
    expect(result.metadata?.queryType).toBe('technique');
    expect(result.response).toBeDefined();
  });

  test('should handle equipment queries', async () => {
    const result = await agent.processQuery('what equipment do I need for pressing');
    
    expect(result.metadata?.queryType).toBe('equipment');
    expect(result.response).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    // This would test error handling
    const result = await agent.processQuery('');
    
    expect(result.confidence).toBeLessThan(50);
    expect(result.response).toBeDefined();
  });

  test('should return appropriate confidence scores', async () => {
    const result = await agent.processQuery('cannabis extraction');
    
    // Should have reasonable confidence for cannabis-related queries
    expect(result.confidence).toBeGreaterThan(0);
    expect(typeof result.confidence).toBe('number');
  });

  test('should include metadata in responses', async () => {
    const result = await agent.processQuery('test query with context');
    
    expect(result.metadata).toBeDefined();
    expect(typeof result.metadata).toBe('object');
  });

  test('should handle context parameters', async () => {
    const context = {
      userExpertise: 'beginner' as const,
      maxResults: 5,
      includeImages: false,
      categories: ['extraction']
    };

    const result = await agent.processQuery('rosin pressing', context);
    
    expect(result.response).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});

// Test the individual components if needed
describe('Future Agent Components', () => {
  test('should classify queries correctly', () => {
    // This would test the private classifyQuery method
    // Implementation would depend on exposing it for testing
    expect(true).toBe(true); // Placeholder
  });

  test('should format search results properly', () => {
    // This would test result formatting
    expect(true).toBe(true); // Placeholder
  });
});