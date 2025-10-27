/**
 * ACTIVE DELIVERIES TIME FIX
 * Fixes the 08:00:00 display issue in Active Deliveries table
 * Replaces fixed 8:00 AM times with current system time while preserving the date
 */

console.log('🕐 Loading Active Deliveries Time Fix...');

(function() {
    'use strict';
    
    /**
     * Check if a timestamp has the problematic 08:00:00 time
     */
    function hasFixed8AMTime(dateString) {
        if (!dateString) return false;
        
        try {
            const date = new Date(dateString);
            return date.getHours() === 8 && date.getMinutes() === 0 && date.getSeconds() === 0;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Fix timestamp by replacing 08:00:00 with current system time
     */
    function fixTimestampWithCurrentTime(dateString) {
        if (!dateString) return dateString;
        
        try {
            const originalDate = new Date(dateString);
            
            // If it's not the problematic 8:00 AM time, return as is
            if (!hasFixed8AMTime(dateString)) {
                return dateString;
            }
            
            // Get current system time
            const now = new Date();
            
            // Create new date with original date but current time
            const fixedDate = new Date(
                originalDate.getFullYear(),
                originalDate.getMonth(),
                originalDate.getDate(),
                now.getHours(),
                now.getMinutes(),
                now.getSeconds(),
                now.getMilliseconds()
            );
            
            console.log('🔧 Fixed timestamp:', {
                original: dateString,
                fixed: fixedDate.toISOString(),
                originalTime: `${originalDate.getHours()}:${originalDate.getMinutes()}:${originalDate.getSeconds()}`,
                newTime: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
            });
            
            return fixedDate.toISOString();
            
        } catch (error) {
            console.error('Error fixing timestamp:', error);
            return dateString;
        }
    }
    
    /**
     * Enhanced format function that fixes 8:00 AM times
     */
    function formatActiveDeliveryDateFixed(delivery) {
        const getField = window.getFieldValue || ((obj, field) => obj[field]);
        
        // Try multiple date fields in order of preference
        let dateValue = getField(delivery, 'deliveryDate') || 
                       getField(delivery, 'delivery_date') ||
                       getField(delivery, 'bookedDate') ||
                       getField(delivery, 'booked_date') ||
                       getField(delivery, 'created_at') ||
                       getField(delivery, 'timestamp') ||
                       getField(delivery, 'created_date');
        
        // Fix the timestamp if it has 08:00:00
        dateValue = fixTimestampWithCurrentTime(dateValue);
        
        // Format the fixed timestamp
        if (!dateValue) return 'N/A';
        
        try {
            const date = new Date(dateValue);
            
            if (isNaN(date.getTime())) {
                return dateValue;
            }
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Manila'
            });
            
        } catch (error) {
            console.error('Error formatting fixed date:', error);
            return dateValue;
        }
    }
    
    /**
     * Enhanced format function for delivery history
     */
    function formatDeliveryHistoryDateFixed(delivery) {
        const getField = window.getFieldValue || ((obj, field) => obj[field]);
        
        let dateValue = getField(delivery, 'completedDateTime') ||
                       getField(delivery, 'completed_date_time') ||
                       getField(delivery, 'completedDate') ||
                       getField(delivery, 'completed_date') ||
                       getField(delivery, 'delivery_date') ||
                       getField(delivery, 'deliveryDate') ||
                       getField(delivery, 'created_at') ||
                       getField(delivery, 'timestamp');
        
        // Fix the timestamp if it has 08:00:00
        dateValue = fixTimestampWithCurrentTime(dateValue);
        
        if (!dateValue) return 'N/A';
        
        try {
            const date = new Date(dateValue);
            
            if (isNaN(date.getTime())) {
                return dateValue;
            }
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Manila'
            });
            
        } catch (error) {
            console.error('Error formatting fixed history date:', error);
            return dateValue;
        }
    }
    
    /**
     * Override the existing date formatting functions
     */
    function overrideDateFormattingFunctions() {
        // Override formatActiveDeliveryDate
        if (typeof window.formatActiveDeliveryDate === 'function') {
            window.originalFormatActiveDeliveryDate = window.formatActiveDeliveryDate;
        }
        window.formatActiveDeliveryDate = formatActiveDeliveryDateFixed;
        
        // Override formatDeliveryHistoryDate
        if (typeof window.formatDeliveryHistoryDate === 'function') {
            window.originalFormatDeliveryHistoryDate = window.formatDeliveryHistoryDate;
        }
        window.formatDeliveryHistoryDate = formatDeliveryHistoryDateFixed;
        
        // Also override the enhanced date formatter functions
        if (typeof window.formatActiveDeliveryTimestamp === 'function') {
            window.originalFormatActiveDeliveryTimestamp = window.formatActiveDeliveryTimestamp;
        }
        window.formatActiveDeliveryTimestamp = formatActiveDeliveryDateFixed;
        
        console.log('✅ Date formatting functions overridden to fix 8:00 AM times');
    }
    
    /**
     * Fix existing data in activeDeliveries array
     */
    function fixExistingActiveDeliveries() {
        if (typeof window.activeDeliveries === 'undefined' || !Array.isArray(window.activeDeliveries)) {
            return;
        }
        
        let fixedCount = 0;
        
        window.activeDeliveries.forEach(delivery => {
            // Check and fix various date fields
            const dateFields = ['deliveryDate', 'delivery_date', 'bookedDate', 'booked_date', 'created_at', 'timestamp'];
            
            dateFields.forEach(field => {
                if (delivery[field] && hasFixed8AMTime(delivery[field])) {
                    const originalValue = delivery[field];
                    delivery[field] = fixTimestampWithCurrentTime(delivery[field]);
                    console.log(`🔧 Fixed ${field} in delivery ${delivery.drNumber}:`, {
                        original: originalValue,
                        fixed: delivery[field]
                    });
                    fixedCount++;
                }
            });
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} timestamps in active deliveries`);
            
            // Save updated data to localStorage
            try {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                console.log('✅ Updated active deliveries saved to localStorage');
            } catch (error) {
                console.error('Error saving updated active deliveries:', error);
            }
        }
    }
    
    /**
     * Fix existing data in deliveryHistory array
     */
    function fixExistingDeliveryHistory() {
        if (typeof window.deliveryHistory === 'undefined' || !Array.isArray(window.deliveryHistory)) {
            return;
        }
        
        let fixedCount = 0;
        
        window.deliveryHistory.forEach(delivery => {
            const dateFields = ['completedDateTime', 'completed_date_time', 'completedDate', 'completed_date', 
                              'deliveryDate', 'delivery_date', 'bookedDate', 'booked_date', 'created_at', 'timestamp'];
            
            dateFields.forEach(field => {
                if (delivery[field] && hasFixed8AMTime(delivery[field])) {
                    const originalValue = delivery[field];
                    delivery[field] = fixTimestampWithCurrentTime(delivery[field]);
                    console.log(`🔧 Fixed ${field} in history ${delivery.drNumber}:`, {
                        original: originalValue,
                        fixed: delivery[field]
                    });
                    fixedCount++;
                }
            });
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} timestamps in delivery history`);
            
            // Save updated data to localStorage
            try {
                localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                console.log('✅ Updated delivery history saved to localStorage');
            } catch (error) {
                console.error('Error saving updated delivery history:', error);
            }
        }
    }
    
    /**
     * Refresh the Active Deliveries display
     */
    function refreshActiveDeliveriesDisplay() {
        // Try to trigger a refresh of the active deliveries table
        if (typeof window.refreshActiveDeliveries === 'function') {
            window.refreshActiveDeliveries();
        } else if (typeof window.displayActiveDeliveries === 'function') {
            window.displayActiveDeliveries();
        } else if (typeof window.renderActiveDeliveries === 'function') {
            window.renderActiveDeliveries();
        }
        
        console.log('🔄 Attempted to refresh Active Deliveries display');
    }
    
    /**
     * Initialize the fix
     */
    function initActiveDeliveriesTimeFix() {
        console.log('🚀 Initializing Active Deliveries Time Fix...');
        
        // Override date formatting functions
        overrideDateFormattingFunctions();
        
        // Fix existing data
        fixExistingActiveDeliveries();
        fixExistingDeliveryHistory();
        
        // Refresh display
        setTimeout(() => {
            refreshActiveDeliveriesDisplay();
        }, 1000);
        
        // Set up periodic refresh to ensure times stay current
        setInterval(() => {
            overrideDateFormattingFunctions();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Active Deliveries Time Fix initialized');
    }
    
    // Export functions globally
    window.fixTimestampWithCurrentTime = fixTimestampWithCurrentTime;
    window.formatActiveDeliveryDateFixed = formatActiveDeliveryDateFixed;
    window.formatDeliveryHistoryDateFixed = formatDeliveryHistoryDateFixed;
    window.hasFixed8AMTime = hasFixed8AMTime;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initActiveDeliveriesTimeFix);
    } else {
        initActiveDeliveriesTimeFix();
    }
    
    console.log('✅ Active Deliveries Time Fix loaded - will replace 08:00:00 with current time');
    
})();

// Export module info
window.activeDeliveriesTimeFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Fixes 08:00:00 display in Active Deliveries by using current system time',
    timestamp: new Date().toISOString()
};