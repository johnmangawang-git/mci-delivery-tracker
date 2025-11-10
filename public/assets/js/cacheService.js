/**
 * CacheService - In-memory caching with TTL support
 * 
 * Provides temporary caching of frequently accessed data to improve performance.
 * Cache is session-only and does not persist across page reloads.
 * 
 * Requirements: 5.3, 8.1
 */
class CacheService {
    /**
     * Initialize cache service
     * @param {number} ttl - Time to live in milliseconds (default: 60000 = 1 minute)
     */
    constructor(ttl = 60000) {
        this.cache = new Map();
        this.ttl = ttl;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            clears: 0
        };
    }

    /**
     * Store data in cache with timestamp
     * @param {string} key - Cache key
     * @param {any} value - Data to cache
     * @param {number} customTTL - Optional custom TTL for this entry (in milliseconds)
     */
    set(key, value, customTTL = null) {
        if (!key) {
            console.warn('CacheService.set: key is required');
            return;
        }

        const ttl = customTTL !== null ? customTTL : this.ttl;
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });

        this.stats.sets++;
        
        console.debug(`CacheService: Cached "${key}" with TTL ${ttl}ms`);
    }

    /**
     * Retrieve data from cache if not expired
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        if (!key) {
            console.warn('CacheService.get: key is required');
            return null;
        }

        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            console.debug(`CacheService: Cache miss for "${key}"`);
            return null;
        }

        // Check if expired
        const age = Date.now() - item.timestamp;
        if (age > item.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            console.debug(`CacheService: Cache expired for "${key}" (age: ${age}ms, TTL: ${item.ttl}ms)`);
            return null;
        }

        this.stats.hits++;
        console.debug(`CacheService: Cache hit for "${key}" (age: ${age}ms)`);
        return item.value;
    }

    /**
     * Check if a key exists in cache and is not expired
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is valid
     */
    has(key) {
        const value = this.get(key);
        return value !== null;
    }

    /**
     * Remove a specific key from cache
     * @param {string} key - Cache key to remove
     * @returns {boolean} True if key was removed
     */
    delete(key) {
        if (!key) {
            console.warn('CacheService.delete: key is required');
            return false;
        }

        const deleted = this.cache.delete(key);
        if (deleted) {
            console.debug(`CacheService: Deleted cache entry "${key}"`);
        }
        return deleted;
    }

    /**
     * Clear all cached data
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.clears++;
        console.debug(`CacheService: Cleared ${size} cache entries`);
    }

    /**
     * Clear expired entries from cache
     * @returns {number} Number of entries removed
     */
    clearExpired() {
        let removed = 0;
        const now = Date.now();

        for (const [key, item] of this.cache.entries()) {
            const age = now - item.timestamp;
            if (age > item.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.debug(`CacheService: Cleared ${removed} expired entries`);
        }

        return removed;
    }

    /**
     * Invalidate cache entries matching a pattern
     * Useful for invalidating related data after updates
     * @param {string|RegExp} pattern - Pattern to match keys against
     * @returns {number} Number of entries invalidated
     */
    invalidate(pattern) {
        let invalidated = 0;
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                invalidated++;
            }
        }

        if (invalidated > 0) {
            console.debug(`CacheService: Invalidated ${invalidated} entries matching pattern "${pattern}"`);
        }

        return invalidated;
    }

    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            clears: 0
        };
        console.debug('CacheService: Statistics reset');
    }

    /**
     * Get all cache keys
     * @returns {string[]} Array of cache keys
     */
    getKeys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size
     * @returns {number} Number of entries in cache
     */
    getSize() {
        return this.cache.size;
    }

    /**
     * Update TTL for the cache service
     * @param {number} newTTL - New TTL in milliseconds
     */
    setTTL(newTTL) {
        if (typeof newTTL !== 'number' || newTTL <= 0) {
            console.warn('CacheService.setTTL: TTL must be a positive number');
            return;
        }
        this.ttl = newTTL;
        console.debug(`CacheService: TTL updated to ${newTTL}ms`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheService;
}
