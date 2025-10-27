/**
 * DELIVERY HISTORY DATE-TIME DISPLAY FIX
 * Ensures the "Date Delivered" column shows both date AND time
 * Fixes the issue where only date was shown without the actual completion time
 */

console.log('🕐 Loading Delivery History Date-Time Display Fix...');

(function() {
    'use strict';
    
    /**
     * Format delivery history date to include both date and time
     * This function replaces the basic date display with full date-time
     */
    function formatDeliveryHistoryDateTime(delivery) {
        console.log('🕐 Formatting delivery history date-time for:', delivery.drNumber || delivery.dr_number);
        
        // Priority order for timestamp fields
        const timestampFields = [
            'completedDateTime',
            'completed_date_time', 
            'signedAt',
            'signed_at',
            'completedDate',
            'completed_date'
        ];
        
        let timestamp = null;
        let timestampSource = 'unknown';
        
        // Find the best available timestamp
        for (const field of timestampFields) {
            if (delivery[field]) {
                timestamp = delivery[field];
                timestampSource = field;
                break;
            }
        }
        
        if (!timestamp) {
            console.warn('⚠️ No timestamp found for delivery:', delivery.drNumber || delivery.dr_number);
            return 'No completion time recorded';
        }
        
        console.log(`📅 Using timestamp from field '${timestampSource}':`, timestamp);
        
        try {
            let date;
            
            // Handle different timestamp formats
            if (typeof timestamp === 'string') {
                // Try to parse ISO format first
                if (timestamp.includes('T') || timestamp.includes('Z')) {
                    date = new Date(timestamp);
                } else if (timestamp.includes(',')) {
                    // Handle "Oct 27, 2025" format
                    date = new Date(timestamp);
                } else {
                    // Try direct parsing
                    date = new Date(timestamp);
                }
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                // Fallback to current time
                console.warn('⚠️ Invalid timestamp format, using current time');
                date = new Date();
            }
            
            // Validate the date
            if (isNaN(date.getTime())) {
                console.error('❌ Invalid date created from timestamp:', timestamp);
                return 'Invalid completion time';
            }
            
            // Format with both date and time
            const formattedDateTime = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            console.log(`✅ Formatted date-time: ${formattedDateTime}`);
            return formattedDateTime;
            
        } catch (error) {
            console.error('❌ Error formatting delivery history date-time:', error);
            return 'Error formatting time';
        }
    }
    
    /**
     * Enhanced format function that combines date and time from separate fields
     */
    function formatDeliveryHistoryDateTimeEnhanced(delivery) {
        console.log('🕐 Enhanced formatting for:', delivery.drNumber || delivery.dr_number);
        
        // Try the main formatting function first
        const mainResult = formatDeliveryHistoryDateTime(delivery);
        if (mainResult && !mainResult.includes('No completion') && !mainResult.includes('Invalid') && !mainResult.includes('Error')) {
            return mainResult;
        }
        
        // If main formatting failed, try to combine separate date and time fields
        const completedDate = delivery.completedDate || delivery.completed_date;
        const completedTime = delivery.completedTime || delivery.completed_time;
        
        if (completedDate && completedTime) {
            console.log(`📅 Combining separate date '${completedDate}' and time '${completedTime}'`);
            
            try {
                // Parse the date part
                let dateObj = new Date(completedDate);
                
                // If time is available, try to combine it
                if (completedTime) {
                    // Extract time components
                    const timeMatch = completedTime.match(/(\d{1,2}):(\d{2}):(\d{2})/);
                    if (timeMatch) {
                        const [, hours, minutes, seconds] = timeMatch;
                        dateObj.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
                    }
                }
                
                const combined = dateObj.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                
                console.log(`✅ Combined date-time: ${combined}`);
                return combined;
                
            } catch (error) {
                console.error('❌ Error combining date and time:', error);
            }
        }
        
        // Final fallback - just show the date if that's all we have
        if (completedDate) {
            console.log(`📅 Fallback to date only: ${completedDate}`);
            return completedDate + ' (time not recorded)';
        }
        
        return 'No completion time available';
    }
    
    /**
     * Override the global formatDeliveryHistoryDate function
     */
    function overrideDeliveryHistoryDateFormatting() {
        // Override the global function used by app.js
        window.formatDeliveryHistoryDate = function(delivery) {
            return formatDeliveryHistoryDateTimeEnhanced(delivery);
        };
        
        // Also provide alternative function names for compatibility
        window.formatDeliveryHistoryDateTime = formatDeliveryHistoryDateTime;
        window.formatDeliveryHistoryDateTimeEnhanced = formatDeliveryHistoryDateTimeEnhanced;
        
        console.log('✅ Delivery history date formatting functions overridden');
    }
    
    /**
     * Force refresh delivery history display with new formatting
     */
    function refreshDeliveryHistoryDisplay() {
        console.log('🔄 Refreshing delivery history display with new date-time formatting...');
        
        // Try to refresh using existing functions
        if (typeof window.loadDeliveryHistory === 'function') {
            window.loadDeliveryHistory();
        } else if (typeof window.forceRefreshDeliveryHistory === 'function') {
            window.forceRefreshDeliveryHistory();
        } else {
            console.log('⚠️ No refresh function available, display will update on next load');
        }
    }
    
    /**
     * Initialize the delivery history date-time display fix
     */
    function initDeliveryHistoryDateTimeDisplayFix() {
        console.log('🚀 Initializing Delivery History Date-Time Display Fix...');
        
        // Override the formatting functions
        overrideDeliveryHistoryDateFormatting();
        
        // Refresh the display after a short delay
        setTimeout(() => {
            refreshDeliveryHistoryDisplay();
        }, 1000);
        
        // Set up periodic refresh to ensure formatting is always applied
        setInterval(() => {
            // Re-override functions to ensure they're not replaced
            overrideDeliveryHistoryDateFormatting();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Delivery History Date-Time Display Fix initialized');
        console.log('📅 "Date Delivered" column will now show both date and time');
    }
    
    // Export functions globally
    window.formatDeliveryHistoryDateTime = formatDeliveryHistoryDateTime;
    window.formatDeliveryHistoryDateTimeEnhanced = formatDeliveryHistoryDateTimeEnhanced;
    window.initDeliveryHistoryDateTimeDisplayFix = initDeliveryHistoryDateTimeDisplayFix;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeliveryHistoryDateTimeDisplayFix);
    } else {
        initDeliveryHistoryDateTimeDisplayFix();
    }
    
    console.log('✅ Delivery History Date-Time Display Fix loaded successfully');
    
})();

// Export module info
window.deliveryHistoryDateTimeDisplayFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Shows both date and time in Delivery History Date Delivered column',
    timestamp: new Date().toISOString()
};