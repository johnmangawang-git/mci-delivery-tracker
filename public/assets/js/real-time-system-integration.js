/**
 * REAL-TIME SYSTEM INTEGRATION
 * Ensures the system ALWAYS uses your laptop's current system time
 * User selects DATE only, system automatically gets CURRENT TIME
 */

console.log('🕐 Loading Real-Time System Integration...');

(function() {
    'use strict';
    
    /**
     * Get REAL current system time (not fixed 8:00 AM)
     * This function reads your laptop's actual current time
     */
    function getRealCurrentTime() {
        const now = new Date();
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            milliseconds: now.getMilliseconds()
        };
    }
    
    /**
     * Create timestamp using selected DATE + REAL current TIME
     */
    function createRealTimeTimestamp() {
        // Get selected delivery date (YYYY-MM-DD format)
        const selectedDate = getSelectedDeliveryDate();
        
        // Get REAL current system time
        const currentTime = getRealCurrentTime();
        
        // Parse the selected date
        const [year, month, day] = selectedDate.split('-');
        
        // Create new Date object with selected date + current time
        const timestamp = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            currentTime.hours,
            currentTime.minutes,
            currentTime.seconds,
            currentTime.milliseconds
        );
        
        console.log('🕐 Created real-time timestamp:', {
            selectedDate: selectedDate,
            currentTime: `${currentTime.hours}:${currentTime.minutes}:${currentTime.seconds}`,
            finalTimestamp: timestamp.toLocaleString()
        });
        
        return timestamp;
    }
    
    /**
     * Format timestamp for display (Selected Date + Current Time)
     */
    function formatRealTimeDisplay(includeSeconds = true) {
        const timestamp = createRealTimeTimestamp();
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        if (includeSeconds) {
            options.second = '2-digit';
        }
        
        return timestamp.toLocaleString('en-US', options);
    }
    
    /**
     * Get ISO string with selected date + current time
     */
    function getRealTimeISO() {
        const timestamp = createRealTimeTimestamp();
        return timestamp.toISOString();
    }
    
    /**
     * Get selected delivery date (fallback to today if none selected)
     */
    function getSelectedDeliveryDate() {
        // Try to get from delivery date input
        const deliveryDateInput = document.getElementById('drDeliveryDate');
        if (deliveryDateInput && deliveryDateInput.value) {
            return deliveryDateInput.value;
        }
        
        // Try to get from global function
        if (typeof window.getSelectedDeliveryDate === 'function') {
            const selected = window.getSelectedDeliveryDate();
            if (selected) return selected;
        }
        
        // Fallback to today
        return new Date().toISOString().split('T')[0];
    }
    
    /**
     * Override all timestamp functions to use real-time
     */
    function overrideTimestampFunctions() {
        // Override getLocalSystemTime
        window.getLocalSystemTime = function() {
            const timestamp = createRealTimeTimestamp();
            return timestamp.toISOString().replace('T', ' ').substring(0, 19);
        };
        
        // Override getLocalSystemTimeISO
        window.getLocalSystemTimeISO = function() {
            return getRealTimeISO();
        };
        
        // Override formatLocalSystemTime
        window.formatLocalSystemTime = function(includeSeconds = true) {
            return formatRealTimeDisplay(includeSeconds);
        };
        
        // Override createDeliveryTimestamp
        window.createDeliveryTimestamp = function() {
            const timestamp = createRealTimeTimestamp();
            const selectedDate = getSelectedDeliveryDate();
            
            return {
                timestamp: timestamp.toISOString(),
                deliveryDate: selectedDate,
                bookedDate: selectedDate,
                displayTime: formatRealTimeDisplay(true),
                localTime: timestamp.toISOString().replace('T', ' ').substring(0, 19),
                createdAt: timestamp.toISOString(),
                updatedAt: timestamp.toISOString()
            };
        };
        
        // Override createBookingTimestamp
        window.createBookingTimestamp = function() {
            const timestamp = createRealTimeTimestamp();
            const selectedDate = getSelectedDeliveryDate();
            
            return {
                deliveryDate: selectedDate,
                bookedDate: selectedDate,
                timestamp: timestamp.toISOString(),
                created_at: timestamp.toISOString(),
                displayTime: formatRealTimeDisplay(true),
                action: 'booking',
                actionTime: timestamp.toISOString().replace('T', ' ').substring(0, 19)
            };
        };
        
        // Override createCompletionTimestamp
        window.createCompletionTimestamp = function() {
            const timestamp = createRealTimeTimestamp();
            
            return {
                completedDateTime: timestamp.toISOString(),
                completed_date_time: timestamp.toISOString(),
                completedDate: timestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                signedAt: timestamp.toISOString(),
                displayTime: formatRealTimeDisplay(true),
                action: 'completion',
                actionTime: timestamp.toISOString().replace('T', ' ').substring(0, 19)
            };
        };
        
        console.log('✅ All timestamp functions overridden to use real system time');
    }
    
    /**
     * Test function to show current behavior
     */
    function testRealTimeIntegration() {
        console.log('🧪 Testing Real-Time Integration:');
        console.log('Selected Date:', getSelectedDeliveryDate());
        console.log('Current Time:', getRealCurrentTime());
        console.log('Combined Timestamp:', formatRealTimeDisplay(true));
        console.log('ISO Format:', getRealTimeISO());
    }
    
    /**
     * Initialize real-time integration
     */
    function initRealTimeIntegration() {
        console.log('🚀 Initializing Real-Time System Integration...');
        
        // Override all timestamp functions
        overrideTimestampFunctions();
        
        // Set up periodic refresh to ensure time is always current
        setInterval(() => {
            // Re-override functions to ensure they're not replaced
            overrideTimestampFunctions();
        }, 5000); // Every 5 seconds
        
        // Test the integration
        testRealTimeIntegration();
        
        console.log('✅ Real-Time System Integration initialized');
        console.log('📅 You select the DATE, system automatically uses your laptop\'s CURRENT TIME');
    }
    
    // Export functions globally
    window.getRealCurrentTime = getRealCurrentTime;
    window.createRealTimeTimestamp = createRealTimeTimestamp;
    window.formatRealTimeDisplay = formatRealTimeDisplay;
    window.getRealTimeISO = getRealTimeISO;
    window.testRealTimeIntegration = testRealTimeIntegration;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRealTimeIntegration);
    } else {
        initRealTimeIntegration();
    }
    
    console.log('✅ Real-Time System Integration loaded - no more fixed 8:00 AM!');
    
})();

// Export module info
window.realTimeSystemIntegration = {
    version: '1.0.0',
    loaded: true,
    description: 'Uses selected date + real current system time',
    timestamp: new Date().toISOString()
};