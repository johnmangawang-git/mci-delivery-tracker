/**
 * STORAGE PRIORITY CONFIGURATION
 * Configuration for Supabase-primary with offline resilience approach
 */

console.log('🔧 Loading Storage Priority Configuration...');

// Storage priority configuration
window.storagePriorityConfig = {
    // Primary storage: Supabase (cloud-first approach)
    primaryStorage: 'supabase',
    
    // Fallback storage: localStorage (offline resilience)
    fallbackStorage: 'localStorage',
    
    // Conflict resolution strategy: 'cloudWins' or 'localWins'
    conflictResolution: 'cloudWins',
    
    // Sync behavior
    sync: {
        // Attempt immediate sync to primary storage
        immediateSync: true,
        
        // Queue operations for background sync when offline
        queueOfflineOperations: true,
        
        // Sync interval in milliseconds (30 seconds)
        syncInterval: 30000,
        
        // Maximum retry attempts for failed operations
        maxRetryAttempts: 3,
        
        // Exponential backoff factor
        backoffFactor: 2
    },
    
    // Offline behavior
    offline: {
        // Enable offline mode
        enableOfflineMode: true,
        
        // Show offline indicator
        showOfflineIndicator: true,
        
        // Persist data locally when offline
        persistWhileOffline: true
    },
    
    // Data consistency
    consistency: {
        // Validate data before saving
        validateBeforeSave: true,
        
        // Check for conflicts before sync
        checkConflicts: true,
        
        // Resolve conflicts automatically
        autoResolveConflicts: true
    }
};

// Storage priority service
class StoragePriorityService {
    constructor() {
        this.config = window.storagePriorityConfig;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.syncInProgress = false;
    }
    
    /**
     * Execute operation with storage priority
     */
    async executeWithPriority(operation, tableName, data) {
        console.log(`🔄 STORAGE PRIORITY: ${operation} on ${tableName}`);
        
        // Try primary storage first (Supabase)
        if (this.config.primaryStorage === 'supabase' && this.isSupabaseAvailable()) {
            try {
                console.log('🎯 Attempting operation on primary storage (Supabase)');
                const result = await this.executeOnSupabase(operation, tableName, data);
                
                // Save to fallback storage as backup
                if (this.config.fallbackStorage === 'localStorage') {
                    try {
                        await this.saveToLocalStorage(tableName, data, operation);
                        console.log('✅ Saved to fallback storage as backup');
                    } catch (localStorageError) {
                        console.warn('⚠️ Failed to save to fallback storage:', localStorageError);
                    }
                }
                
                return { success: true, storage: 'supabase', data: result };
            } catch (supabaseError) {
                console.warn('⚠️ Primary storage operation failed:', supabaseError);
            }
        }
        
        // Fallback to localStorage when Supabase is not available or fails
        if (this.config.fallbackStorage === 'localStorage') {
            try {
                console.log('🔄 Falling back to localStorage');
                const result = await this.executeOnLocalStorage(tableName, data, operation);
                
                // Queue for Supabase sync when connection is restored
                if (this.config.sync.queueOfflineOperations && this.isOnline) {
                    this.queueForSync(operation, tableName, data);
                }
                
                return { success: true, storage: 'localStorage', data: result };
            } catch (localStorageError) {
                console.error('❌ Fallback storage operation failed:', localStorageError);
                throw localStorageError;
            }
        }
        
        throw new Error('No available storage option');
    }
    
    /**
     * Check if Supabase is available
     */
    isSupabaseAvailable() {
        return this.isOnline && 
               window.supabaseClient && 
               typeof window.supabaseClient === 'function' && 
               window.supabaseClient();
    }
    
    /**
     * Execute operation on Supabase
     */
    async executeOnSupabase(operation, tableName, data) {
        if (!this.isSupabaseAvailable()) {
            throw new Error('Supabase not available');
        }
        
        const supabase = window.supabaseClient();
        let result;
        
        switch (operation) {
            case 'create':
            case 'upsert':
                result = await supabase.from(tableName).upsert(data).select();
                break;
            case 'update':
                result = await supabase.from(tableName).update(data).eq('id', data.id).select();
                break;
            case 'delete':
                result = await supabase.from(tableName).delete().eq('id', data.id);
                break;
            case 'select':
                result = await supabase.from(tableName).select(data || '*');
                break;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
        
        if (result.error) {
            throw result.error;
        }
        
        return result.data;
    }
    
    /**
     * Execute operation on localStorage
     */
    async executeOnLocalStorage(tableName, data, operation) {
        const localStorageKey = this.getTableLocalStorageKey(tableName);
        let existingData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        
        switch (operation) {
            case 'create':
            case 'upsert':
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        const existingIndex = existingData.findIndex(existing => 
                            existing.id === item.id || existing.dr_number === item.dr_number
                        );
                        if (existingIndex >= 0) {
                            existingData[existingIndex] = { ...existingData[existingIndex], ...item };
                        } else {
                            existingData.push(item);
                        }
                    });
                } else {
                    const existingIndex = existingData.findIndex(existing => 
                        existing.id === data.id || existing.dr_number === data.dr_number
                    );
                    if (existingIndex >= 0) {
                        existingData[existingIndex] = { ...existingData[existingIndex], ...data };
                    } else {
                        existingData.push(data);
                    }
                }
                break;
                
            case 'update':
                if (data.id) {
                    const index = existingData.findIndex(item => item.id === data.id);
                    if (index >= 0) {
                        existingData[index] = { ...existingData[index], ...data };
                    }
                }
                break;
                
            case 'delete':
                if (data.id) {
                    existingData = existingData.filter(item => item.id !== data.id);
                }
                break;
                
            case 'select':
                return existingData;
        }
        
        localStorage.setItem(localStorageKey, JSON.stringify(existingData));
        return existingData;
    }
    
    /**
     * Get localStorage key for table
     */
    getTableLocalStorageKey(tableName) {
        const keyMap = {
            'deliveries': 'mci-active-deliveries',
            'customers': 'mci-customers',
            'delivery_history': 'mci-delivery-history',
            'epod_records': 'ePodRecords',
            'user_profiles': 'mci-user-profile'
        };
        
        return keyMap[tableName] || tableName;
    }
    
    /**
     * Queue operation for sync
     */
    queueForSync(operation, tableName, data) {
        this.syncQueue.push({
            operation,
            tableName,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        });
        
        console.log(`📋 Queued ${operation} for ${tableName} (queue: ${this.syncQueue.length})`);
    }
    
    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }
        
        this.syncInProgress = true;
        console.log(`🔄 Processing sync queue: ${this.syncQueue.length} items`);
        
        const processedItems = [];
        
        for (const item of this.syncQueue) {
            try {
                await this.executeOnSupabase(item.operation, item.tableName, item.data);
                console.log(`✅ Synced ${item.operation} for ${item.tableName}`);
                processedItems.push(item);
            } catch (error) {
                console.warn(`⚠️ Failed to sync ${item.operation} for ${item.tableName}:`, error);
                item.attempts++;
                
                if (item.attempts >= this.config.sync.maxRetryAttempts) {
                    console.error(`❌ Max retries exceeded for ${item.operation} on ${item.tableName}`);
                    processedItems.push(item);
                }
            }
        }
        
        // Remove processed items from queue
        this.syncQueue = this.syncQueue.filter(item => 
            !processedItems.includes(item)
        );
        
        this.syncInProgress = false;
        console.log(`✅ Sync queue processing complete (${processedItems.length} items processed)`);
    }
}

// Create global instance
window.storagePriorityService = new StoragePriorityService();

// Expose configuration
window.getStoragePriorityConfig = () => window.storagePriorityConfig;
window.getStoragePriorityService = () => window.storagePriorityService;

console.log('✅ Storage Priority Configuration loaded');
console.log('🎯 Supabase-primary with offline resilience approach enabled');