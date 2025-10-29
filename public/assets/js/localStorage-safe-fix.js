/**
 * Safe localStorage Fix
 * Fixes the recursive call stack issue and prevents localStorage quota errors
 */

console.log('🔧 Loading Safe localStorage Fix...');

window.localStorageSafeFix = {
    
    // Store original localStorage methods to prevent recursion
    originalSetItem: null,
    originalGetItem: null,
    
    // Flag to prevent recursive calls
    isProcessing: false,
    
    /**
     * Initialize safe localStorage handling
     */
    initialize() {
        try {
            console.log('🚀 Initializing safe localStorage handling...');
            
            // Store original methods
            this.originalSetItem = localStorage.setItem.bind(localStorage);
            this.originalGetItem = localStorage.getItem.bind(localStorage);
            
            // Clean up immediately
            this.emergencyCleanup();
            
            // Override setItem safely
            this.overrideSetItem();
            
            console.log('✅ Safe localStorage handling initialized');
            
        } catch (error) {
            console.error('❌ Error initializing safe localStorage:', error);
        }
    },
    
    /**
     * Emergency cleanup to prevent quota issues
     */
    emergencyCleanup() {
        try {
            console.log('🚨 Emergency localStorage cleanup...');
            
            // Remove problematic large data immediately
            const problematicKeys = [
                'ePodRecords',
                'signature-cache',
                'large-delivery-data',
                'temp-upload-cache',
                'bulk-import-data',
                'cached-signatures',
                'temp-signature-data'
            ];
            
            problematicKeys.forEach(key => {
                try {
                    if (this.originalGetItem(key)) {
                        localStorage.removeItem(key);
                        console.log(`Removed ${key}`);
                    }
                } catch (error) {
                    console.warn(`Error removing ${key}:`, error);
                }
            });
            
            // Trim delivery data
            this.trimDeliveryData();
            
            console.log('✅ Emergency cleanup completed');
            
        } catch (error) {
            console.error('❌ Error during emergency cleanup:', error);
        }
    },
    
    /**
     * Trim delivery data to essential items only
     */
    trimDeliveryData() {
        try {
            // Keep only last 20 active deliveries
            const activeDeliveries = JSON.parse(this.originalGetItem('mci-active-deliveries') || '[]');
            if (activeDeliveries.length > 20) {
                const trimmed = activeDeliveries.slice(-20);
                this.originalSetItem('mci-active-deliveries', JSON.stringify(trimmed));
                console.log(`Trimmed active deliveries to ${trimmed.length}`);
            }
            
            // Keep only last 30 history items
            const deliveryHistory = JSON.parse(this.originalGetItem('mci-delivery-history') || '[]');
            if (deliveryHistory.length > 30) {
                const trimmed = deliveryHistory.slice(-30);
                this.originalSetItem('mci-delivery-history', JSON.stringify(trimmed));
                console.log(`Trimmed delivery history to ${trimmed.length}`);
            }
            
        } catch (error) {
            console.warn('Error trimming delivery data:', error);
        }
    },
    
    /**
     * Safe setItem override that prevents recursion
     */
    overrideSetItem() {
        const self = this;
        
        localStorage.setItem = function(key, value) {
            // Prevent recursion
            if (self.isProcessing) {
                return self.originalSetItem(key, value);
            }
            
            try {
                self.isProcessing = true;
                
                // Block problematic keys entirely
                if (key === 'ePodRecords') {
                    console.log('🚫 Blocked EPOD data from localStorage - using Supabase only');
                    return;
                }
                
                // Check size for other keys
                const dataSize = value.length;
                if (dataSize > 500 * 1024) { // 500KB limit
                    console.warn(`🚫 Blocked large data (${(dataSize / 1024).toFixed(1)}KB) for key: ${key}`);
                    return;
                }
                
                // Try to save
                return self.originalSetItem(key, value);
                
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.error('❌ localStorage quota exceeded, performing cleanup...');
                    self.emergencyCleanup();
                    
                    // Don't retry - just log the failure
                    console.warn(`Failed to save ${key} due to quota limits`);
                } else {
                    console.error('❌ localStorage error:', error);
                }
            } finally {
                self.isProcessing = false;
            }
        };
    },
    
    /**
     * Get current localStorage usage safely
     */
    getUsage() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            return {
                total: total,
                mb: (total / 1024 / 1024).toFixed(2)
            };
        } catch (error) {
            return { total: 0, mb: '0.00' };
        }
    }
};

// Initialize immediately to prevent issues
try {
    window.localStorageSafeFix.initialize();
    
    // Show usage after cleanup
    const usage = window.localStorageSafeFix.getUsage();
    console.log(`📊 localStorage usage after safe fix: ${usage.mb}MB`);
    
} catch (error) {
    console.error('❌ Critical error in localStorage safe fix:', error);
}

console.log('✅ Safe localStorage Fix loaded');