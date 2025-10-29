/**
 * Simple Delivery Date Display
 * CLEAN SOLUTION: Only shows user's delivery date input, no system time mixing
 * 
 * REMOVES: All automatic system date/time functions
 * SHOWS: Only the user-selected delivery date
 */

(function() {
    'use strict';
    
    console.log('📅 Simple Delivery Date Display - Loading...');
    
    /**
     * Get user's delivery date input (simple, no fallbacks to system date)
     */
    function getUserDeliveryDate() {
        const drInput = document.getElementById('drDeliveryDate');
        if (drInput && drInput.value) {
            console.log('📅 SIMPLE: Found user delivery date:', drInput.value);
            return drInput.value;
        }
        
        // Check stored date
        const stored = localStorage.getItem('userDeliveryDate');
        if (stored) {
            console.log('📅 SIMPLE: Found stored delivery date:', stored);
            return stored;
        }
        
        console.log('📅 SIMPLE: No delivery date found');
        return null;
    }
    
    /**
     * Format delivery date for display (simple date only)
     */
    function formatDeliveryDateSimple(dateString) {
        if (!dateString) return 'No Date';
        
        try {
            const date = new Date(dateString);
            const formatted = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            console.log('📅 SIMPLE: Formatted', dateString, 'to', formatted);
            return formatted;
        } catch (error) {
            console.error('📅 SIMPLE: Error formatting date:', error);
            return dateString;
        }
    }
    
    /**
     * Override ALL date display functions with simple version (AGGRESSIVE)
     */
    function overrideWithSimpleDisplay() {
        console.log('📅 SIMPLE: AGGRESSIVELY overriding all date functions...');
        
        // Override formatActiveDeliveryDate - SIMPLE VERSION (FINAL)
        window.formatActiveDeliveryDate = function(delivery) {
            console.log('📅 SIMPLE: FINAL OVERRIDE - Formatting delivery date for', delivery.drNumber || delivery.dr_number);
            
            // Get user's delivery date
            const userDate = getUserDeliveryDate();
            if (userDate) {
                const formatted = formatDeliveryDateSimple(userDate);
                console.log('📅 SIMPLE: FINAL - Using user date:', formatted);
                return formatted;
            }
            
            // Try delivery data
            if (delivery.created_date) {
                const formatted = formatDeliveryDateSimple(delivery.created_date);
                console.log('📅 SIMPLE: FINAL - Using delivery created_date:', formatted);
                return formatted;
            }
            
            if (delivery.deliveryDate) {
                const formatted = formatDeliveryDateSimple(delivery.deliveryDate);
                console.log('📅 SIMPLE: FINAL - Using delivery deliveryDate:', formatted);
                return formatted;
            }
            
            console.log('📅 SIMPLE: FINAL - No date available');
            return 'No Date';
        };
        
        // AGGRESSIVE: Override any other date formatting functions that might exist
        const dateFormattingFunctions = [
            'formatActiveDeliveryDateFixed',
            'formatActiveDeliveryTimestamp',
            'formatDateWithTimestamp',
            'formatDeliveryDate'
        ];
        
        dateFormattingFunctions.forEach(funcName => {
            if (window[funcName]) {
                console.log('📅 SIMPLE: AGGRESSIVE - Overriding', funcName);
                window[funcName] = window.formatActiveDeliveryDate;
            }
        });
        
        // Override populateActiveDeliveriesTable to force simple dates
        const originalPopulateActiveDeliveriesTable = window.populateActiveDeliveriesTable;
        if (typeof originalPopulateActiveDeliveriesTable === 'function') {
            window.populateActiveDeliveriesTable = function(deliveries) {
                console.log('📅 SIMPLE: Intercepting populateActiveDeliveriesTable');
                
                const userDate = getUserDeliveryDate();
                if (userDate && Array.isArray(deliveries)) {
                    // Force all deliveries to use user's simple date
                    deliveries.forEach(delivery => {
                        delivery.created_date = userDate;
                        delivery.deliveryDate = userDate;
                        delivery.bookedDate = userDate;
                        console.log('📅 SIMPLE: Set simple date for', delivery.drNumber || delivery.dr_number, 'to:', userDate);
                    });
                }
                
                return originalPopulateActiveDeliveriesTable.call(this, deliveries);
            };
        }
        
        console.log('📅 SIMPLE: All date functions overridden with simple display');
    }
    
    /**
     * Store user's delivery date when selected
     */
    function monitorDeliveryDateInput() {
        const drInput = document.getElementById('drDeliveryDate');
        if (drInput) {
            drInput.addEventListener('change', function() {
                const selectedDate = this.value;
                console.log('📅 SIMPLE: User selected delivery date:', selectedDate);
                
                // Store for later use
                localStorage.setItem('userDeliveryDate', selectedDate);
                
                // Force refresh display
                setTimeout(() => {
                    if (typeof window.loadActiveDeliveries === 'function') {
                        window.loadActiveDeliveries(true);
                    }
                }, 100);
            });
            
            console.log('📅 SIMPLE: Monitoring delivery date input');
        } else {
            // Try again later if input not found
            setTimeout(() => {
                monitorDeliveryDateInput();
            }, 1000);
        }
    }
    
    /**
     * Remove/disable all system time functions
     */
    function disableSystemTimeFunctions() {
        // Disable functions that add system time
        const functionsToDisable = [
            'getInstantSystemTime',
            'createInstantDeliveryDisplay',
            'getLocalSystemTime',
            'getLocalSystemTimeISO',
            'createUserDateSystemTime'
        ];
        
        functionsToDisable.forEach(funcName => {
            if (window[funcName]) {
                console.log('📅 SIMPLE: Disabling', funcName);
                window[funcName] = function() {
                    console.log('📅 SIMPLE: Function', funcName, 'disabled - returning null');
                    return null;
                };
            }
        });
        
        console.log('📅 SIMPLE: System time functions disabled');
    }
    
    /**
     * Initialize simple delivery date display (AGGRESSIVE)
     */
    function initializeSimpleDisplay() {
        console.log('📅 AGGRESSIVE: Initializing Simple Delivery Date Display...');
        
        // Wait a bit to ensure all other scripts have loaded
        setTimeout(() => {
            console.log('📅 AGGRESSIVE: Applying final overrides...');
            
            // Apply simple overrides
            overrideWithSimpleDisplay();
            disableSystemTimeFunctions();
            monitorDeliveryDateInput();
            
            // Force immediate refresh
            setTimeout(() => {
                if (typeof window.loadActiveDeliveries === 'function') {
                    console.log('📅 AGGRESSIVE: Forcing Active Deliveries refresh...');
                    window.loadActiveDeliveries(true);
                }
            }, 500);
            
            console.log('✅ AGGRESSIVE: Simple Delivery Date Display - Active');
        }, 2000); // Wait 2 seconds to ensure all other scripts have loaded
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSimpleDisplay);
    } else {
        initializeSimpleDisplay();
    }
    
    console.log('📅 Simple Delivery Date Display - Loaded');
    
})();