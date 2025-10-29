/**
 * DR Upload Created Date Fix
 * CRITICAL FIX: Replace system date with user-selected delivery date for created_date
 * 
 * PROBLEM: created_date was using new Date() (system date)
 * SOLUTION: created_date now uses drDeliveryDate input value (user-selected delivery date)
 */

(function() {
    'use strict';
    
    console.log('🔧 DR Upload Created Date Fix - Loading...');
    
    /**
     * Get the user-selected delivery date from the DR upload modal
     */
    function getUserSelectedDeliveryDate() {
        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
        if (drDeliveryDateInput && drDeliveryDateInput.value) {
            console.log('📅 FIXED: Using user-selected delivery date:', drDeliveryDateInput.value);
            return drDeliveryDateInput.value;
        }
        
        // Fallback to today's date if no input found
        const fallbackDate = new Date().toISOString().split('T')[0];
        console.warn('⚠️ FALLBACK: No delivery date input found, using system date:', fallbackDate);
        return fallbackDate;
    }
    
    /**
     * Get system time in HH:mm:ss format
     */
    function getSystemTime() {
        const now = new Date();
        return now.toTimeString().split(' ')[0]; // Gets HH:mm:ss
    }
    
    /**
     * Create delivery date + system time combination for display
     */
    function createDeliveryDateTimeDisplay() {
        const deliveryDate = getUserSelectedDeliveryDate();
        const systemTime = getSystemTime();
        
        // Create combined datetime for display
        const combinedDateTime = new Date(deliveryDate + 'T' + systemTime);
        const displayFormat = combinedDateTime.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        console.log('📅 DISPLAY: Delivery Date + System Time:', displayFormat);
        return {
            deliveryDate: deliveryDate,
            systemTime: systemTime,
            combinedDateTime: combinedDateTime.toISOString(),
            displayFormat: displayFormat
        };
    }
    
    /**
     * Override the DR upload process to use delivery date for created_date
     */
    function overrideDRUploadCreatedDate() {
        // Store original functions
        const originalProcessDRData = window.processDRData;
        const originalConfirmDRUpload = window.confirmDRUpload;
        
        // Override processDRData if it exists
        if (typeof originalProcessDRData === 'function') {
            window.processDRData = function(data) {
                console.log('🔧 OVERRIDE: processDRData - Fixing created_date');
                
                // Get user-selected delivery date
                const deliveryDate = getUserSelectedDeliveryDate();
                
                // Process data and fix created_date
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (item.created_date) {
                            item.created_date = deliveryDate; // REPLACE system date with delivery date
                            console.log('✅ FIXED: created_date for', item.drNumber, 'set to:', deliveryDate);
                        }
                    });
                }
                
                return originalProcessDRData.call(this, data);
            };
        }
        
        // Override confirmDRUpload if it exists
        if (typeof originalConfirmDRUpload === 'function') {
            window.confirmDRUpload = function() {
                console.log('🔧 OVERRIDE: confirmDRUpload - Ensuring delivery date is used');
                
                // Ensure delivery date is captured before upload
                const deliveryDate = getUserSelectedDeliveryDate();
                
                // Store globally for other functions to use
                window.selectedDeliveryDate = deliveryDate;
                
                return originalConfirmDRUpload.call(this);
            };
        }
    }
    
    /**
     * Override Active Deliveries date display to show Delivery Date + System Time
     */
    function overrideActiveDeliveriesDisplay() {
        // Override formatActiveDeliveryDate if it exists
        if (typeof window.formatActiveDeliveryDate === 'function') {
            const originalFormatActiveDeliveryDate = window.formatActiveDeliveryDate;
            
            window.formatActiveDeliveryDate = function(delivery) {
                console.log('🔧 OVERRIDE: formatActiveDeliveryDate - Using Delivery Date + System Time');
                
                try {
                    // PRIORITY 1: Use created_date (now delivery date) + system time
                    if (delivery.created_date) {
                        const currentTime = new Date();
                        const combinedDateTime = new Date(delivery.created_date + 'T' + currentTime.toTimeString().split(' ')[0]);
                        const formatted = combinedDateTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        console.log('📅 DISPLAY: Using created_date (delivery date) + system time:', formatted);
                        return formatted;
                    }
                    
                    // PRIORITY 2: Use deliveryDate + system time
                    if (delivery.deliveryDate) {
                        const currentTime = new Date();
                        const combinedDateTime = new Date(delivery.deliveryDate + 'T' + currentTime.toTimeString().split(' ')[0]);
                        const formatted = combinedDateTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        console.log('📅 DISPLAY: Using deliveryDate + system time:', formatted);
                        return formatted;
                    }
                    
                    // FALLBACK: Use original function
                    return originalFormatActiveDeliveryDate.call(this, delivery);
                    
                } catch (error) {
                    console.error('❌ Error in formatActiveDeliveryDate override:', error);
                    return originalFormatActiveDeliveryDate.call(this, delivery);
                }
            };
        }
    }
    
    /**
     * Initialize the fix
     */
    function initializeFix() {
        console.log('🚀 Initializing DR Upload Created Date Fix...');
        
        // Apply overrides
        overrideDRUploadCreatedDate();
        overrideActiveDeliveriesDisplay();
        
        // Monitor for DR upload modal
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    const drModal = document.getElementById('drUploadModal');
                    if (drModal && drModal.style.display !== 'none') {
                        console.log('📅 DR Upload Modal detected - Ensuring delivery date is captured');
                        
                        // Ensure delivery date input has a value
                        const drDeliveryDateInput = document.getElementById('drDeliveryDate');
                        if (drDeliveryDateInput && !drDeliveryDateInput.value) {
                            // Set to today as default
                            drDeliveryDateInput.value = new Date().toISOString().split('T')[0];
                            console.log('📅 Set default delivery date to today');
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ DR Upload Created Date Fix - Initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFix);
    } else {
        initializeFix();
    }
    
    // Export functions for global access
    window.getUserSelectedDeliveryDate = getUserSelectedDeliveryDate;
    window.createDeliveryDateTimeDisplay = createDeliveryDateTimeDisplay;
    
})();