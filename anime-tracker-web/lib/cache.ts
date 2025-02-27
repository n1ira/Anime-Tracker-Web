import { promises as fs } from 'fs';
import path from 'path';

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

interface ParsedTitleCache {
  [title: string]: CacheEntry<unknown>;
}

// Cache expiration time in milliseconds (default: 7 days)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// In-memory cache
let memoryCache: ParsedTitleCache = {};

// Path to the cache file
const CACHE_FILE_PATH = path.join(process.cwd(), '.cache', 'parsed-titles.json');

/**
 * Initialize the cache by loading from disk
 */
export async function initCache(): Promise<void> {
  try {
    // Ensure cache directory exists
    await fs.mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true });
    
    // Try to read the cache file
    try {
      const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
      memoryCache = JSON.parse(data);
      
      // Clean expired entries
      const now = Date.now();
      let hasExpired = false;
      
      for (const key in memoryCache) {
        if (now - memoryCache[key].timestamp > CACHE_EXPIRATION) {
          delete memoryCache[key];
          hasExpired = true;
        }
      }
      
      // Save cleaned cache if needed
      if (hasExpired) {
        await saveCache();
      }
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty cache
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error reading cache file:', error);
      }
      memoryCache = {};
      await saveCache();
    }
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    // Fallback to in-memory only cache
    memoryCache = {};
  }
}

/**
 * Save the cache to disk
 */
async function saveCache(): Promise<void> {
  try {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(memoryCache, null, 2));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

/**
 * Get an item from the cache
 */
export function getCacheItem<T>(key: string): T | null {
  const entry = memoryCache[key];
  
  if (!entry) {
    return null;
  }
  
  // Check if entry has expired
  if (Date.now() - entry.timestamp > CACHE_EXPIRATION) {
    delete memoryCache[key];
    saveCache().catch(console.error);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set an item in the cache
 */
export function setCacheItem<T>(key: string, data: T): void {
  memoryCache[key] = {
    timestamp: Date.now(),
    data,
  };
  
  // Save to disk asynchronously
  saveCache().catch(console.error);
}

/**
 * Clear the entire cache
 */
export async function clearCache(): Promise<void> {
  memoryCache = {};
  await saveCache();
} 