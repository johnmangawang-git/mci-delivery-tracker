/**
 * Delivery Date Input Preservation Fix
 * CRITICAL: Ensures user's delivery date input is NEVER overridden with today's date
 * 
 * PROBLEM: Instant display fix was showing today's date instead of user input
 * SOLUTION: Force preservation of user's delivery date input throughout the system
 */

(function() {
    'use strict';
    
    console.log('📅 Delivery Date Input Preservation Fix - Loading...');
    
    /**
     * Get user's delivery date input (NEVER fallback to system date)
     */
    function getUserDeliveryDateInput() {
        // PRIORITY 1: Check manual booking delivery date input
        const manualDeliveryInput = document.getElementById('deliveryDate');
        if (manualDeliveryInput && manualDeliveryInput.value) {
            console.log('📅 PRESERVE: Found manual booking delivery date input:', manualDeliveryInput.value);
            return manualDeliveryInput.value;
        }
        
        // PRIORITY 2: Check DR upload delivery date input
        const drInput = document.getElementById('drDeliveryDate');
        if (drInput && drInput.value) {
            console.log('📅 PRESERVE: Found DR upload delivery date input:', drInput.value);
            return drInput.value;
        }
        
        // PRIORITY 3: Check if force delivery date fix has captured it
        if (window.getUserSelectedDeliveryDate) {
            const userDate = window.getUserSelectedDeliveryDate();
            if (userDate && userDate !== new Date().toISOString().split('T')[0]) {
                console.log('📅 PRESERVE: Found user date from force fix:', userDate);
                return userDate;
            }
        }
        
        console.warn('⚠️ PRESERVE: No user delivery date input found!');
        return null;
    }
    
    /**
     * Override formatActiveDeliveryDate to ALWAYS use user input
     */
    function overrideFormatActiveDeliveryDate() {
        const originalFormatActiveDeliveryDate = window.formatActiveDeliveryDate;
        
        window.formatActiveDeliveryDate = function(delivery) {
            console.log('📅 PRESERVE: Formatting delivery date for', delivery.drNumber);
            console.log('📅 PRESERVE: Delivery data:', {
                created_date: delivery.created_date,
                deliveryDate: delivery.deliveryDate,
                drNumber: delivery.drNumber
            });
            
            try {
                let dateToUse = null;
                
                // PRIORITY 1: Use created_date if it's NOT today's date
                if (delivery.created_date) {
                    const todayDate = new Date().toISOString().split('T')[0];
                    if (delivery.created_date !== todayDate) {
                        dateToUse = delivery.created_date;
                        console.log('📅 PRESERVE: Using created_date (not today):', dateToUse);
                    }
                }
                
                // PRIORITY 2: Use deliveryDate if it's NOT today's date
                if (!dateToUse && delivery.deliveryDate) {
                    const todayDate = new Date().toISOString().split('T')[0];
                    if (delivery.deliveryDate !== todayDate) {
                        dateToUse = delivery.deliveryDate;
                        console.log('📅 PRESERVE: Using deliveryDate (not today):', dateToUse);
                    }
                }
                
                // PRIORITY 3: Get from user input
                if (!dateToUse) {
                    dateToUse = getUserDeliveryDateInput();
                    if (dateToUse) {
                        console.log('📅 PRESERVE: Using user input:', dateToUse);
                    }
                }
                
                // If we have a valid date, format it with system time
                if (dateToUse) {
                    const currentTime = new Date();
                    const combinedDateTime = new Date(dateToUse + 'T' + currentTime.toTimeString().split(' ')[0]);
                    const formatted = combinedDateTime.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    console.log('📅 PRESERVE: Final display format:', formatted);
                    return formatted;
                }
                
                // Last resort: use original function
                if (originalFormatActiveDeliveryDate) {
                    console.log('📅 PRESERVE: Falling back to original function');
                    return originalFormatActiveDeliveryDate.call(this, delivery);
                }
                
                // Absolute last resort
                console.error('❌ PRESERVE: No date source available!');
                return 'Date Error';
                
            } catch (error) {
                console.error('❌ PRESERVE: Error formatting date:', error);
                return 'Date Error';
            }
        };
        
        console.log('✅ PRESERVE: formatActiveDeliveryDate overridden');
    }
    
    /**
     * Monitor DR upload to ensure delivery date is preserved
     */
    function monitorDRUpload() {
        // Watch for DR upload modal
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    const drModal = document.getElementById('drUploadModal');
                    if (drModal && drModal.style.display !== 'none') {
                        console.log('📅 PRESERVE: DR Upload Modal detected');
                        
                        // Ensure delivery date input is monitored
                        const drInput = document.getElementById('drDeliveryDate');
                        if (drInput) {
                            drInput.addEventListener('change', function() {
                                console.log('📅 PRESERVE: User changed delivery date to:', this.value);
                                // Store globally for other functions
                                window.userSelectedDeliveryDate = this.value;
                            });
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ PRESERVE: DR upload monitoring active');
    }
    
    /**
     * Override data processing to preserve delivery date
     */
    function overrideDataProcessing() {
        // Override any function that might set created_date to system date
        const originalDate = Date;
        let dateOverrideActive = false;
        
        // Monitor when DR processing is happening
        const originalProcessDRData = window.processDRData;
        if (typeof originalProcessDRData === 'function') {
            window.processDRData = function(data) {
                console.log('📅 PRESERVE: Processing DR data - ensuring delivery date preservation');
                
                const userDeliveryDate = getUserDeliveryDateInput();
                if (userDeliveryDate && Array.isArray(data)) {
                    data.forEach(item => {
                        // Force created_date to use user's delivery date
                        item.created_date = userDeliveryDate;
                        item.deliveryDate = userDeliveryDate;
                        console.log('📅 PRESERVE: Set dates for', item.drNumber, 'to:', userDeliveryDate);
                    });
                }
                
                return originalProcessDRData.call(this, data);
            };
        }
        
        console.log('✅ PRESERVE: Data processing overridden');
    }
    
    /**
     * Initialize preservation fix
     */
    function initializePreservationFix() {
        console.log('📅 Initializing Delivery Date Input Preservation Fix...');
        
        // Apply all preservation measures
        overrideFormatActiveDeliveryDate();
        monitorDRUpload();
        overrideDataProcessing();
        
        // Force immediate check
        setTimeout(() => {
            const userDate = getUserDeliveryDateInput();
            if (userDate) {
                console.log('📅 PRESERVE: User delivery date confirmed:', userDate);
            } else {
                console.warn('⚠️ PRESERVE: No user delivery date found on initialization');
            }
        }, 1000);
        
        console.log('✅ Delivery Date Input Preservation Fix - Active');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePreservationFix);
    } else {
        initializePreservationFix();
    }
    
    // Export functions for global access
    window.getUserDeliveryDateInput = getUserDeliveryDateInput;
    
    console.log('📅 Delivery Date Input Preservation Fix - Loaded');
    
})();