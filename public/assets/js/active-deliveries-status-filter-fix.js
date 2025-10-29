/**
 * ACTIVE DELIVERIES STATUS FILTER FIX
 * Ensures ONLY non-completed items appear in Active Deliveries
 * Completed items should ONLY be in Delivery History
 */

console.log('🔧 Loading Active Deliveries Status Filter Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced filtering function that ensures proper status separation
     */
    function filterActiveDeliveriesOnly(deliveries) {
        if (!Array.isArray(deliveries)) {
            console.warn('⚠️ filterActiveDeliveriesOnly: Input is not an array:', deliveries);
            return [];
        }
        
        // CRITICAL: Filter out ALL completed statuses
        const completedStatuses = ['Completed', 'Signed', 'Delivered', 'Finished', 'Done'];
        
        const filtered = deliveries.filter(delivery => {
            if (!delivery || typeof delivery !== 'object') {
                console.warn('⚠️ Invalid delivery object:', delivery);
                return false;
            }
            
            const status = delivery.status || '';
            const isCompleted = completedStatuses.includes(status);
            
            if (isCompleted) {
                console.log(`🚫 Filtering out completed delivery: ${delivery.drNumber || delivery.dr_number} (Status: ${status})`);
                return false; // Exclude from Active Deliveries
            }
            
            return true; // Include in Active Deliveries
        });
        
        console.log(`✅ Filtered ${deliveries.length} deliveries → ${filtered.length} active deliveries`);
        return filtered;
    }
    
    /**
     * Enhanced filtering function for delivery history
     */
    function filterDeliveryHistoryOnly(deliveries) {
        if (!Array.isArray(deliveries)) {
            console.warn('⚠️ filterDeliveryHistoryOnly: Input is not an array:', deliveries);
            return [];
        }
        
        // CRITICAL: Include ONLY completed statuses
        const completedStatuses = ['Completed', 'Signed', 'Delivered', 'Finished', 'Done'];
        
        const filtered = deliveries.filter(delivery => {
            if (!delivery || typeof delivery !== 'object') {
                console.warn('⚠️ Invalid delivery object:', delivery);
                return false;
            }
            
            const status = delivery.status || '';
            const isCompleted = completedStatuses.includes(status);
            
            if (isCompleted) {
                console.log(`✅ Including in delivery history: ${delivery.drNumber || delivery.dr_number} (Status: ${status})`);
                return true; // Include in Delivery History
            }
            
            return false; // Exclude from Delivery History
        });
        
        console.log(`✅ Filtered ${deliveries.length} deliveries → ${filtered.length} history deliveries`);
        return filtered;
    }
    
    /**
     * Override the problematic filtering logic in app.js
     */
    function overrideFilteringLogic() {
        // Store original window references
        if (typeof window.originalActiveDeliveries === 'undefined') {
            window.originalActiveDeliveries = window.activeDeliveries;
        }
        if (typeof window.originalDeliveryHistory === 'undefined') {
            window.originalDeliveryHistory = window.deliveryHistory;
        }
        
        // Create enhanced property setters that automatically filter
        let _activeDeliveries = window.activeDeliveries || [];
        let _deliveryHistory = window.deliveryHistory || [];
        
        // Override window.activeDeliveries with automatic filtering
        Object.defineProperty(window, 'activeDeliveries', {
            get: function() {
                return _activeDeliveries;
            },
            set: function(value) {
                console.log('🔧 Setting activeDeliveries with automatic filtering...');
                _activeDeliveries = filterActiveDeliveriesOnly(value || []);
                console.log(`📊 Active deliveries set to ${_activeDeliveries.length} items`);
                
                // Also update localStorage
                try {
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(_activeDeliveries));
                } catch (error) {
                    console.error('❌ Error saving filtered active deliveries to localStorage:', error);
                }
            },
            configurable: true,
            enumerable: true
        });
        
        // Override window.deliveryHistory with automatic filtering
        Object.defineProperty(window, 'deliveryHistory', {
            get: function() {
                return _deliveryHistory;
            },
            set: function(value) {
                console.log('🔧 Setting deliveryHistory with automatic filtering...');
                _deliveryHistory = filterDeliveryHistoryOnly(value || []);
                console.log(`📊 Delivery history set to ${_deliveryHistory.length} items`);
                
                // Also update localStorage
                try {
                    localStorage.setItem('mci-delivery-history', JSON.stringify(_deliveryHistory));
                } catch (error) {
                    console.error('❌ Error saving filtered delivery history to localStorage:', error);
                }
            },
            configurable: true,
            enumerable: true
        });
        
        console.log('✅ Enhanced filtering logic applied to window.activeDeliveries and window.deliveryHistory');
    }
    
    /**
     * Clean up existing data to ensure proper separation
     */
    function cleanupExistingData() {
        console.log('🧹 Cleaning up existing data to ensure proper status separation...');
        
        // Get current data
        const currentActive = window.activeDeliveries || [];
        const currentHistory = window.deliveryHistory || [];
        
        // Combine all data
        const allDeliveries = [...currentActive, ...currentHistory];
        
        // Remove duplicates based on DR number
        const uniqueDeliveries = [];
        const seenDRNumbers = new Set();
        
        allDeliveries.forEach(delivery => {
            const drNumber = delivery.drNumber || delivery.dr_number;
            if (drNumber && !seenDRNumbers.has(drNumber)) {
                seenDRNumbers.add(drNumber);
                uniqueDeliveries.push(delivery);
            }
        });
        
        console.log(`🔍 Found ${allDeliveries.length} total deliveries, ${uniqueDeliveries.length} unique`);
        
        // Properly separate active and history
        const cleanActive = filterActiveDeliveriesOnly(uniqueDeliveries);
        const cleanHistory = filterDeliveryHistoryOnly(uniqueDeliveries);
        
        // Update global arrays (this will trigger our enhanced setters)
        window.activeDeliveries = cleanActive;
        window.deliveryHistory = cleanHistory;
        
        console.log(`✅ Data cleanup complete: ${cleanActive.length} active, ${cleanHistory.length} history`);
    }
    
    /**
     * Initialize the status filter fix
     */
    function initActiveDeliveriesStatusFilterFix() {
        console.log('🚀 Initializing Active Deliveries Status Filter Fix...');
        
        // Apply enhanced filtering logic
        overrideFilteringLogic();
        
        // Clean up existing data
        setTimeout(() => {
            cleanupExistingData();
        }, 1000);
        
        // Set up periodic cleanup to ensure data integrity
        setInterval(() => {
            // Re-apply filtering logic
            overrideFilteringLogic();
            
            // Check for any completed items that slipped into active deliveries
            const currentActive = window.activeDeliveries || [];
            const completedInActive = currentActive.filter(d => 
                ['Completed', 'Signed', 'Delivered', 'Finished', 'Done'].includes(d.status)
            );
            
            if (completedInActive.length > 0) {
                console.warn(`⚠️ Found ${completedInActive.length} completed items in Active Deliveries - cleaning up...`);
                cleanupExistingData();
            }
        }, 30000); // Every 30 seconds
        
        console.log('✅ Active Deliveries Status Filter Fix initialized');
        console.log('🚫 Completed items will be automatically filtered out of Active Deliveries');
    }
    
    // Export functions globally
    window.filterActiveDeliveriesOnly = filterActiveDeliveriesOnly;
    window.filterDeliveryHistoryOnly = filterDeliveryHistoryOnly;
    window.cleanupExistingData = cleanupExistingData;
    window.initActiveDeliveriesStatusFilterFix = initActiveDeliveriesStatusFilterFix;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initActiveDeliveriesStatusFilterFix);
    } else {
        initActiveDeliveriesStatusFilterFix();
    }
    
    console.log('✅ Active Deliveries Status Filter Fix loaded successfully');
    
})();

// Export module info
window.activeDeliveriesStatusFilterFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Ensures ONLY non-completed items appear in Active Deliveries',
    timestamp: new Date().toISOString()
};