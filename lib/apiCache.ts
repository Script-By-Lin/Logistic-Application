export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global cache variable that persists across hot-reloads in Next.js development
const globalRef = global as unknown as {
  apiCacheMap?: Map<string, CacheEntry<any>>;
};

if (!globalRef.apiCacheMap) {
  globalRef.apiCacheMap = new Map<string, CacheEntry<any>>();
}

const cache = globalRef.apiCacheMap;
const DEFAULT_TTL = 300 * 1000; // 5 minutes TTL

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

export function invalidateAllCache(): void {
  cache.clear();
}
