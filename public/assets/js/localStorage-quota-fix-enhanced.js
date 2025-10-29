/**
 * Enhanced localStorage Quota Fix
 * Prevents QuotaExceededError by managing localStorage size and cleaning up large data
 * Specifically addresses EPOD signature data quota issues
 */

console.log('🧹 Loading Enhanced localStorage Quota Fix...');

window.localStorageQuotaFixEnhanced = {
    
    // Maximum size for localStorage (5MB in most browsers)
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
    
    /**
     * Check current localStorage usage
     */
    getStorageUsage() {
        let totalSize = 0;
        const usage = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length;
                usage[key] = size;
                totalSize += size;
            }
        }
        
        return {
            total: totalSize,
            breakdown: usage,
            percentage: (totalSize / this.MAX_STORAGE_SIZE) * 100
        };
    },
    
    /**
     * CRITICAL: Clean up EPOD records with large signature data
     */
    cleanupEPODRecords() {
        try {
            const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            
            if (ePodRecords.length === 0) {
                return;
            }
            
            console.log(`🧹 Found ${ePodRecords.length} EPOD records in localStorage`);
            
            // Calculate total size of EPOD data
            const ePodDataSize = JSON.stringify(ePodRecords).length;
            console.log(`EPOD data size: ${(ePodDataSize / 1024 / 1024).toFixed(2)}MB`);
            
            if (ePodDataSize > 1 * 1024 * 1024) { // If > 1MB
                console.log('🚨 EPOD data is too large for localStorage. Switching to Supabase-only mode.');
                
                // Remove all EPOD records from localStorage
                localStorage.removeItem('ePodRecords');
                
                console.log('✅ Removed all EPOD records from localStorage - using Supabase only');
                
                // Show user notification
                if (typeof window.showToast === 'function') {
                    window.showToast(
                        'Storage optimized: Signatures now saved directly to database for better performance',
                        'info'
                    );
                }
            }
            
        } catch (error) {
            console.error('❌ Error cleaning up EPOD records:', error);
            // If there's an error, just remove all EPOD records from localStorage
            localStorage.removeItem('ePodRecords');
            console.log('🚨 Removed all EPOD records from localStorage due to error');
        }
    },
    
    /**
     * Clean up large items from localStorage - ENHANCED for EPOD data
     */
    cleanupLargeItems() {
        try {
            console.log('🧹 Cleaning up large localStorage items...');
            
            const usage = this.getStorageUsage();
            console.log(`Current localStorage usage: ${(usage.total / 1024 / 1024).toFixed(2)}MB (${usage.percentage.toFixed(1)}%)`);
            
            // CRITICAL: Clean up EPOD records first (largest data)
            this.cleanupEPODRecords();
            
            // Items to clean up (large data that should be in database)
            const itemsToClean = [
                'ePodRecords', // Main culprit - signature images
                'signature-cache',
                'large-delivery-data',
                'temp-upload-cache',
                'bulk-import-data',
                'cached-signatures',
                'temp-signature-data'
            ];
            
            let cleanedSize = 0;
            
            itemsToClean.forEach(key => {
                if (localStorage.getItem(key)) {
                    const size = localStorage.getItem(key).length;
                    localStorage.removeItem(key);
                    cleanedSize += size;
                    console.log(`Removed ${key} (${(size / 1024).toFixed(1)}KB)`);
                }
            });
            
            // Clean up old delivery data (keep only recent)
            this.cleanupOldDeliveryData();
            
            console.log(`✅ Cleaned up ${(cleanedSize / 1024 / 1024).toFixed(2)}MB from localStorage`);
            
            const newUsage = this.getStorageUsage();
            console.log(`New localStorage usage: ${(newUsage.total / 1024 / 1024).toFixed(2)}MB (${newUsage.percentage.toFixed(1)}%)`);
            
        } catch (error) {
            console.error('❌ Error during localStorage cleanup:', error);
        }
    },
    
    /**
     * Clean up old delivery data, keep only recent items
     */
    cleanupOldDeliveryData() {
        try {
            // Clean up active deliveries - keep only last 30 (reduced for quota)
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            if (activeDeliveries.length > 30) {
                const recentActive = activeDeliveries.slice(-30);
                localStorage.setItem('mci-active-deliveries', JSON.stringify(recentActive));
                console.log(`Reduced active deliveries from ${activeDeliveries.length} to ${recentActive.length}`);
            }
            
            // Clean up delivery history - keep only last 50 (reduced for quota)
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            if (deliveryHistory.length > 50) {
                const recentHistory = deliveryHistory.slice(-50);
                localStorage.setItem('mci-delivery-history', JSON.stringify(recentHistory));
                console.log(`Reduced delivery history from ${deliveryHistory.length} to ${recentHistory.length}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error cleaning up delivery data:', error);
        }
    },
    
    /**
     * Safe localStorage setItem with quota checking - ENHANCED
     */
    safeSetItem(key, value) {
        try {
            // CRITICAL: Block saving large EPOD data to localStorage
            if (key === 'ePodRecords') {
                const dataSize = value.length;
                console.log(`🚫 Blocking EPOD data (${(dataSize / 1024 / 1024).toFixed(2)}MB) from localStorage - using Supabase instead`);
                
                // Show user notification
                if (typeof window.showToast === 'function') {
                    window.showToast(
                        'Signature saved to database (not local storage) for better performance',
                        'info'
                    );
                }
                
                return false; // Don't save to localStorage
            }
            
            // Check if adding this item would exceed quota
            const currentUsage = this.getStorageUsage();
            const newItemSize = value.length;
            const projectedUsage = currentUsage.total + newItemSize;
            
            if (projectedUsage > this.MAX_STORAGE_SIZE * 0.7) { // 70% threshold
                console.warn(`⚠️ localStorage approaching quota limit. Cleaning up before saving ${key}`);
                this.cleanupLargeItems();
            }
            
            localStorage.setItem(key, value);
            return true;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error(`❌ localStorage quota exceeded when saving ${key}. Attempting cleanup...`);
                
                // Emergency cleanup
                this.emergencyCleanup();
                
                // For EPOD records, don't retry - use Supabase instead
                if (key === 'ePodRecords') {
                    console.log('🔄 EPOD quota exceeded - switching to Supabase-only mode');
                    
                    if (typeof window.showToast === 'function') {
                        window.showToast(
                            'Storage full - signatures now saved directly to database',
                            'warning'
                        );
                    }
                    
                    return false;
                }
                
                // Try again after cleanup for other data
                try {
                    localStorage.setItem(key, value);
                    console.log(`✅ Successfully saved ${key} after cleanup`);
                    return true;
                } catch (retryError) {
                    console.error(`❌ Still failed to save ${key} after cleanup:`, retryError);
                    return false;
                }
            } else {
                console.error(`❌ Error saving to localStorage:`, error);
                return false;
            }
        }
    },
    
    /**
     * Emergency cleanup when quota is exceeded - ENHANCED
     */
    emergencyCleanup() {
        try {
            console.log('🚨 Emergency localStorage cleanup...');
            
            // FIRST: Remove all EPOD records (largest data)
            localStorage.removeItem('ePodRecords');
            console.log('🚨 Removed all EPOD records');
            
            // Remove all non-essential data
            const essentialKeys = [
                'mci-active-deliveries',
                'mci-delivery-history',
                'user-settings',
                'auth-token'
            ];
            
            const keysToRemove = [];
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && !essentialKeys.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`🚨 Emergency cleanup removed ${keysToRemove.length} non-essential items`);
            
            // Also trim essential data aggressively
            this.aggressiveCleanupEssentialData();
            
        } catch (error) {
            console.error('❌ Error during emergency cleanup:', error);
        }
    },
    
    /**
     * Aggressive cleanup of essential data during emergency
     */
    aggressiveCleanupEssentialData() {
        try {
            // Keep only last 10 active deliveries
            const activeDeliveries = JSON.parse(localStorage.getItem('mci-active-deliveries') || '[]');
            if (activeDeliveries.length > 10) {
                const recentActive = activeDeliveries.slice(-10);
                localStorage.setItem('mci-active-deliveries', JSON.stringify(recentActive));
                console.log(`🚨 Emergency: Reduced active deliveries to ${recentActive.length}`);
            }
            
            // Keep only last 20 history items
            const deliveryHistory = JSON.parse(localStorage.getItem('mci-delivery-history') || '[]');
            if (deliveryHistory.length > 20) {
                const recentHistory = deliveryHistory.slice(-20);
                localStorage.setItem('mci-delivery-history', JSON.stringify(recentHistory));
                console.log(`🚨 Emergency: Reduced delivery history to ${recentHistory.length}`);
            }
            
        } catch (error) {
            console.error('❌ Error during aggressive cleanup:', error);
        }
    },
    
    /**
     * Initialize quota management - ENHANCED
     */
    initialize() {
        console.log('🚀 Initializing enhanced localStorage quota management...');
        
        // Immediate aggressive cleanup
        this.cleanupLargeItems();
        
        // Override localStorage.setItem globally with enhanced protection
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            return this.safeSetItem(key, value);
        };
        
        // Show current usage
        const usage = this.getStorageUsage();
        console.log(`📊 localStorage usage after cleanup: ${(usage.total / 1024 / 1024).toFixed(2)}MB (${usage.percentage.toFixed(1)}%)`);
        
        console.log('✅ Enhanced localStorage quota management initialized');
    }
};

// Initialize immediately when script loads
window.localStorageQuotaFixEnhanced.initialize();

console.log('✅ Enhanced localStorage Quota Fix loaded');