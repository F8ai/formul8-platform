import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory cache for quick access
const memoryCache = new Map<string, string>();

// Cache directory for persistent storage
const CACHE_DIR = path.join(process.cwd(), '.diagram-cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.warn('Failed to create diagram cache directory:', error);
  }
}

// Generate cache key from diagram content and type
function generateCacheKey(content: string, type: string): string {
  const hash = crypto.createHash('sha256')
    .update(`${type}:${content}`)
    .digest('hex');
  return hash.substring(0, 16); // Use first 16 chars for shorter keys
}

// Get cached diagram SVG
export async function getCachedDiagram(content: string, type: string): Promise<string | null> {
  const cacheKey = generateCacheKey(content, type);
  
  // Check memory cache first
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  
  // Check file cache
  try {
    const filePath = path.join(CACHE_DIR, `${cacheKey}.svg`);
    const cachedSvg = await fs.readFile(filePath, 'utf-8');
    
    // Store in memory cache for next time
    memoryCache.set(cacheKey, cachedSvg);
    
    return cachedSvg;
  } catch (error) {
    // Not found in cache
    return null;
  }
}

// Store diagram SVG in cache
export async function setCachedDiagram(content: string, type: string, svg: string): Promise<void> {
  const cacheKey = generateCacheKey(content, type);
  
  // Store in memory cache
  memoryCache.set(cacheKey, svg);
  
  // Store in file cache
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${cacheKey}.svg`);
    await fs.writeFile(filePath, svg, 'utf-8');
  } catch (error) {
    console.warn('Failed to write diagram to cache:', error);
  }
}

// Clear cache (useful for development/debugging)
export async function clearDiagramCache(): Promise<void> {
  // Clear memory cache
  memoryCache.clear();
  
  // Clear file cache
  try {
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files
        .filter(file => file.endsWith('.svg'))
        .map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );
  } catch (error) {
    console.warn('Failed to clear diagram cache:', error);
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  memoryCount: number;
  fileCount: number;
  totalSize: number;
}> {
  const memoryCount = memoryCache.size;
  
  let fileCount = 0;
  let totalSize = 0;
  
  try {
    const files = await fs.readdir(CACHE_DIR);
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    fileCount = svgFiles.length;
    
    for (const file of svgFiles) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
  } catch (error) {
    // Cache directory might not exist
  }
  
  return {
    memoryCount,
    fileCount,
    totalSize
  };
}

// Initialize cache directory on startup
ensureCacheDir().catch(console.warn);