/**
 * AUTO-SYNC SERVICE
 * Automatically syncs localStorage data with Supabase
 * Provides offline-first functionality with cloud backup
 */

console.log('🔄 AUTO-SYNC SERVICE: Loading...');

class AutoSyncService {
    constructor() {
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.syncInterval = null;
        this.retryAttempts = 3;
        this.syncDelay = 2000; // 2 seconds delay for batching
        
        this.init();
    }
    
    init() {
        console.log('🔄 Initializing Auto-Sync Service...');
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored - resuming sync');
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Connection lost - switching to offline mode');
            this.isOnline = false;
        });
        
        // Start periodic sync
        this.startPeriodicSync();
        
        // Initial sync on startup
        setTimeout(() => this.initialSync(), 3000);
        
        console.log('✅ Auto-Sync Service initialized');
    }
    
    /**
     * Main sync function - saves to localStorage first, then queues for Supabase
     */
    async syncData(operation, table, data, localStorageKey) {
        console.log(`🔄 SYNC: ${operation} on ${table}`, data);
        
        try {
            // 1. Save to localStorage first (immediate)
            await this.saveToLocalStorage(localStorageKey, data, operation);
            
            // 2. Queue for Supabase sync (background)
            this.queueForSupabaseSync({
                operation,
                table,
                data,
                localStorageKey,
                timestamp: new Date().toISOString(),
                attempts: 0
            });
            
            console.log(`✅ SYNC: ${operation} completed locally, queued for cloud sync`);
            return { success: true, local: true, cloud: 'queued' };
            
        } catch (error) {
            console.error(`❌ SYNC: ${operation} failed:`, error);
            throw error;
        }
    }
    
    /**
     * Save to localStorage with different operations
     */
    async saveToLocalStorage(key, data, operation) {
        try {
            let existingData = JSON.parse(localStorage.getItem(key) || '[]');
            
            switch (operation) {
                case 'create':
                case 'upsert':
                    if (Array.isArray(data)) {
                        // Batch insert/update
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
                        // Single item
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
                    
                case 'replace':
                    existingData = Array.isArray(data) ? data : [data];
                    break;
            }
            
            localStorage.setItem(key, JSON.stringify(existingData));
            console.log(`✅ LOCAL: Saved to ${key} (${existingData.length} items)`);
            
        } catch (error) {
            console.error('❌ LOCAL: Save failed:', error);
            throw error;
        }
    }
    
    /**
     * Queue item for Supabase sync
     */
    queueForSupabaseSync(syncItem) {
        // Check if similar item already in queue
        const existingIndex = this.syncQueue.findIndex(item => 
            item.table === syncItem.table && 
            item.operation === syncItem.operation &&
            JSON.stringify(item.data) === JSON.stringify(syncItem.data)
        );
        
        if (existingIndex >= 0) {
            // Update existing item
            this.syncQueue[existingIndex] = syncItem;
        } else {
            // Add new item
            this.syncQueue.push(syncItem);
        }
        
        console.log(`📋 QUEUE: Added ${syncItem.operation} for ${syncItem.table} (queue: ${this.syncQueue.length})`);
        
        // Process queue after delay (for batching)
        setTimeout(() => this.processSyncQueue(), this.syncDelay);
    }
    
    /**
     * Process the sync queue
     */
    async processSyncQueue() {
        if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
            return;
        }
        
        this.syncInProgress = true;
        console.log(`🔄 PROCESSING QUEUE: ${this.syncQueue.length} items`);
        
        // Process items one by one
        while (this.syncQueue.length > 0 && this.isOnline) {
            const item = this.syncQueue.shift();
            await this.syncToSupabase(item);
        }
        
        this.syncInProgress = false;
        console.log('✅ QUEUE: Processing complete');
    }
    
    /**
     * Sync individual item to Supabase
     */
    async syncToSupabase(syncItem) {
        if (!window.supabaseClient || !window.supabaseClient()) {
            console.warn('⚠️ SUPABASE: Client not available, keeping in queue');
            this.syncQueue.unshift(syncItem); // Put back at front
            return;
        }
        
        try {
            const supabase = window.supabaseClient();
            let result;
            
            console.log(`🌐 SUPABASE: ${syncItem.operation} on ${syncItem.table}`);
            
            switch (syncItem.operation) {
                case 'create':
                case 'upsert':
                    result = await supabase
                        .from(syncItem.table)
                        .upsert(syncItem.data)
                        .select();
                    break;
                    
                case 'update':
                    result = await supabase
                        .from(syncItem.table)
                        .update(syncItem.data)
                        .eq('id', syncItem.data.id)
                        .select();
                    break;
                    
                case 'delete':
                    result = await supabase
                        .from(syncItem.table)
                        .delete()
                        .eq('id', syncItem.data.id);
                    break;
            }
            
            if (result.error) {
                throw result.error;
            }
            
            console.log(`✅ SUPABASE: ${syncItem.operation} successful`);
            
        } catch (error) {
            console.error(`❌ SUPABASE: ${syncItem.operation} failed:`, error);
            
            // Retry logic
            syncItem.attempts = (syncItem.attempts || 0) + 1;
            if (syncItem.attempts < this.retryAttempts) {
                console.log(`🔄 RETRY: Attempt ${syncItem.attempts}/${this.retryAttempts}`);
                setTimeout(() => {
                    this.syncQueue.push(syncItem);
                }, 5000 * syncItem.attempts); // Exponential backoff
            } else {
                console.error(`❌ FAILED: Max retries exceeded for ${syncItem.operation}`);
            }
        }
    }
    
    /**
     * Initial sync - pull latest data from Supabase on startup
     */
    async initialSync() {
        if (!this.isOnline || !window.supabaseClient || !window.supabaseClient()) {
            console.log('⚠️ INITIAL SYNC: Skipped (offline or no Supabase)');
            return;
        }
        
        console.log('🔄 INITIAL SYNC: Starting...');
        
        try {
            const supabase = window.supabaseClient();
            
            // Sync deliveries
            await this.syncTableFromSupabase(supabase, 'deliveries', 'mci-active-deliveries');
            
            // Sync customers
            await this.syncTableFromSupabase(supabase, 'customers', 'mci-customers');
            
            // Sync delivery history
            await this.syncTableFromSupabase(supabase, 'delivery_history', 'mci-delivery-history');
            
            console.log('✅ INITIAL SYNC: Complete');
            
        } catch (error) {
            console.error('❌ INITIAL SYNC: Failed:', error);
        }
    }
    
    /**
     * Sync a specific table from Supabase to localStorage
     */
    async syncTableFromSupabase(supabase, tableName, localStorageKey) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Merge with local data (Supabase takes precedence for conflicts)
                const localData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
                const mergedData = this.mergeData(localData, data);
                
                localStorage.setItem(localStorageKey, JSON.stringify(mergedData));
                console.log(`✅ SYNC DOWN: ${tableName} -> ${localStorageKey} (${mergedData.length} items)`);
            }
            
        } catch (error) {
            console.warn(`⚠️ SYNC DOWN: ${tableName} failed:`, error.message);
        }
    }
    
    /**
     * Merge local and remote data (remote takes precedence)
     */
    mergeData(localData, remoteData) {
        const merged = [...localData];
        
        remoteData.forEach(remoteItem => {
            const localIndex = merged.findIndex(localItem => 
                localItem.id === remoteItem.id || 
                localItem.dr_number === remoteItem.dr_number
            );
            
            if (localIndex >= 0) {
                // Update existing (remote takes precedence)
                merged[localIndex] = remoteItem;
            } else {
                // Add new
                merged.push(remoteItem);
            }
        });
        
        return merged;
    }
    
    /**
     * Start periodic sync
     */
    startPeriodicSync() {
        // Sync every 30 seconds if online
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }, 30000);
        
        console.log('⏰ PERIODIC SYNC: Started (30s interval)');
    }
    
    /**
     * Force sync all local data to Supabase
     */
    async forceSyncAll() {
        console.log('🚀 FORCE SYNC: Starting...');
        
        // Sync active deliveries
        const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
        if (activeDeliveries.length > 0) {
            await this.syncData('upsert', 'deliveries', activeDeliveries, 'mci-active-deliveries');
        }
        
        // Sync customers
        const customers = JSON.parse(localStorage.getItem('mci-customers') || '[]');
        if (customers.length > 0) {
            await this.syncData('upsert', 'customers', customers, 'mci-customers');
        }
        
        // Sync delivery history
        const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
        if (deliveryHistory.length > 0) {
            await this.syncData('upsert', 'delivery_history', deliveryHistory, 'mci-delivery-history');
        }
        
        console.log('✅ FORCE SYNC: Queued all data');
    }
    
    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            online: this.isOnline,
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress,
            lastSync: this.lastSyncTime
        };
    }
}

// Create global instance
window.autoSyncService = new AutoSyncService();

// Enhanced wrapper functions for common operations
window.syncDelivery = async (delivery) => {
    return await window.autoSyncService.syncData('upsert', 'deliveries', delivery, 'mci-active-deliveries');
};

window.syncCustomer = async (customer) => {
    return await window.autoSyncService.syncData('upsert', 'customers', customer, 'mci-customers');
};

window.syncDeliveryHistory = async (historyItem) => {
    return await window.autoSyncService.syncData('upsert', 'delivery_history', historyItem, 'mci-delivery-history');
};

window.forceSyncAll = () => {
    return window.autoSyncService.forceSyncAll();
};

window.getSyncStatus = () => {
    return window.autoSyncService.getSyncStatus();
};

console.log('✅ AUTO-SYNC SERVICE: Loaded and ready');
console.log('🎯 Use syncDelivery(), syncCustomer(), syncDeliveryHistory() for auto-sync');
console.log('🚀 Use forceSyncAll() to sync all local data to Supabase');
console.log('📊 Use getSyncStatus() to check sync status');