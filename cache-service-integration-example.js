/**
 * CacheService Integration Example
 * 
 * This file demonstrates how to integrate CacheService with DataService
 * to improve performance by caching frequently accessed data.
 */

// Example 1: Basic DataService Integration
class DataServiceWithCache {
    constructor() {
        this.client = null;
        this.cache = new CacheService(60000); // 1 minute default TTL
        this.isInitialized = false;
    }

    async initialize() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        this.client = window.supabaseClient();
        this.isInitialized = true;
    }

    /**
     * Get deliveries with caching
     */
    async getDeliveries(filters = {}) {
        this._ensureInitialized();

        // Create cache key from filters
        const cacheKey = `deliveries:${JSON.stringify(filters)}`;
        
        // Try to get from cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log('✅ Cache hit for deliveries');
            return cached;
        }

        console.log('⚠️ Cache miss - fetching from database');

        // Fetch from database
        let query = this.client.from('deliveries').select('*');
        
        if (filters.status) {
            query = query.in('status', Array.isArray(filters.status) ? filters.status : [filters.status]);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;

        // Cache the result with 30 second TTL (deliveries change frequently)
        this.cache.set(cacheKey, data, 30000);
        
        return data;
    }

    /**
     * Save delivery and invalidate cache
     */
    async saveDelivery(delivery) {
        this._ensureInitialized();

        const { data, error } = await this.client
            .from('deliveries')
            .upsert(delivery)
            .select()
            .single();

        if (error) throw error;

        // Invalidate all delivery-related cache entries
        this.cache.invalidate(/^deliveries:/);
        console.log('🗑️ Invalidated delivery cache after save');

        return data;
    }

    /**
     * Get customers with caching
     */
    async getCustomers() {
        this._ensureInitialized();

        const cacheKey = 'customers:all';
        
        // Try cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log('✅ Cache hit for customers');
            return cached;
        }

        console.log('⚠️ Cache miss - fetching customers from database');

        // Fetch from database
        const { data, error } = await this.client
            .from('customers')
            .select('*')
            .order('name');

        if (error) throw error;

        // Cache with 5 minute TTL (customers change less frequently)
        this.cache.set(cacheKey, data, 300000);

        return data;
    }

    /**
     * Save customer and invalidate cache
     */
    async saveCustomer(customer) {
        this._ensureInitialized();

        const { data, error } = await this.client
            .from('customers')
            .upsert(customer)
            .select()
            .single();

        if (error) throw error;

        // Invalidate customer cache
        this.cache.invalidate(/^customers:/);
        console.log('🗑️ Invalidated customer cache after save');

        return data;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ All cache cleared');
    }

    _ensureInitialized() {
        if (!this.isInitialized || !this.client) {
            throw new Error('DataService not initialized. Call initialize() first.');
        }
    }
}

// Example 2: App.js Integration
async function loadActiveDeliveriesWithCache() {
    try {
        showLoadingState('Loading active deliveries...');

        // DataService now uses cache internally
        const deliveries = await dataService.getDeliveries({ 
            status: ['In Transit', 'On Schedule', 'Sold Undelivered', 'Active'] 
        });

        // First call: fetches from database
        // Subsequent calls within TTL: returns from cache
        
        appState.activeDeliveries = deliveries;
        populateActiveDeliveriesTable();

        // Show cache stats in console
        const stats = dataService.getCacheStats();
        console.log('Cache Stats:', stats);

    } catch (error) {
        handleError('Failed to load active deliveries', error);
    } finally {
        hideLoadingState();
    }
}

// Example 3: Real-time Integration with Cache Invalidation
class RealtimeServiceWithCache {
    constructor(dataService) {
        this.dataService = dataService;
        this.subscriptions = new Map();
    }

    subscribeToTable(table, callback) {
        const subscription = this.dataService.client
            .channel(`public:${table}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: table },
                (payload) => {
                    // Invalidate cache when data changes
                    this.dataService.cache.invalidate(new RegExp(`^${table}:`));
                    console.log(`🗑️ Cache invalidated for ${table} due to real-time update`);
                    
                    // Call the original callback
                    callback(payload);
                }
            )
            .subscribe();
        
        this.subscriptions.set(table, subscription);
    }
}

// Example 4: Periodic Cache Cleanup
function setupCacheCleanup(cacheService) {
    // Clean expired entries every 5 minutes
    setInterval(() => {
        const removed = cacheService.clearExpired();
        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} expired cache entries`);
        }
    }, 300000); // 5 minutes
}

// Example 5: Cache Warming Strategy
async function warmCache() {
    console.log('🔥 Warming cache with frequently accessed data...');
    
    try {
        // Pre-load active deliveries
        await dataService.getDeliveries({ status: ['Active', 'In Transit'] });
        
        // Pre-load customers
        await dataService.getCustomers();
        
        console.log('✅ Cache warmed successfully');
        console.log('Cache Stats:', dataService.getCacheStats());
    } catch (error) {
        console.error('Failed to warm cache:', error);
    }
}

// Example 6: Smart Cache Key Generation
function generateCacheKey(table, filters = {}) {
    // Sort keys for consistent cache keys
    const sortedFilters = Object.keys(filters)
        .sort()
        .reduce((acc, key) => {
            acc[key] = filters[key];
            return acc;
        }, {});
    
    return `${table}:${JSON.stringify(sortedFilters)}`;
}

// Example 7: Cache Monitoring Dashboard
function displayCacheMonitor() {
    const stats = dataService.getCacheStats();
    
    console.log('═══════════════════════════════════');
    console.log('📊 Cache Performance Monitor');
    console.log('═══════════════════════════════════');
    console.log(`Cache Size: ${stats.size} entries`);
    console.log(`Cache Hits: ${stats.hits}`);
    console.log(`Cache Misses: ${stats.misses}`);
    console.log(`Hit Rate: ${stats.hitRate}`);
    console.log(`Total Sets: ${stats.sets}`);
    console.log(`Total Clears: ${stats.clears}`);
    console.log('═══════════════════════════════════');
    
    // Show cache keys
    const keys = dataService.cache.getKeys();
    if (keys.length > 0) {
        console.log('Cached Keys:');
        keys.forEach(key => console.log(`  - ${key}`));
    }
}

// Example 8: Conditional Caching
async function getDeliveriesConditional(filters, useCache = true) {
    if (!useCache) {
        // Bypass cache for fresh data
        return await fetchDeliveriesFromDatabase(filters);
    }
    
    // Use cached version
    return await dataService.getDeliveries(filters);
}

// Example 9: Cache Invalidation Strategies
const CacheInvalidationStrategies = {
    // Invalidate specific delivery
    invalidateDelivery(drNumber) {
        dataService.cache.delete(`delivery:${drNumber}`);
    },
    
    // Invalidate all deliveries
    invalidateAllDeliveries() {
        dataService.cache.invalidate(/^deliveries:/);
    },
    
    // Invalidate by status
    invalidateDeliveriesByStatus(status) {
        dataService.cache.invalidate(new RegExp(`deliveries:.*"status":"${status}"`));
    },
    
    // Invalidate everything
    invalidateAll() {
        dataService.cache.clear();
    }
};

// Example 10: Usage in Event Handlers
async function handleDeliveryUpdate(deliveryId, updates) {
    try {
        // Update in database
        await dataService.updateDelivery(deliveryId, updates);
        
        // Invalidate related cache
        CacheInvalidationStrategies.invalidateAllDeliveries();
        
        // Reload data (will fetch fresh from database)
        await loadActiveDeliveries();
        
        showToast('Delivery updated successfully', 'success');
    } catch (error) {
        handleError('Failed to update delivery', error);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataServiceWithCache,
        RealtimeServiceWithCache,
        setupCacheCleanup,
        warmCache,
        generateCacheKey,
        displayCacheMonitor,
        CacheInvalidationStrategies
    };
}
