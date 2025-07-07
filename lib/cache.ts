// Simple in-memory cache implementation
interface CacheItem<T> {
  value: T
  timestamp: number
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map()
  private ttl: number // Time to live in milliseconds

  constructor(ttlMinutes = 60) {
    this.ttl = ttlMinutes * 60 * 1000
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  clear(): void {
    this.cache.clear()
  }
}

// Create a singleton instance for places cache
export const placesCache = new Cache<any>(60) // Cache for 60 minutes

