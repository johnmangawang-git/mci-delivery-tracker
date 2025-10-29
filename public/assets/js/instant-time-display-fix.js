/**
 * Instant Time Display Fix
 * ELIMINATES DELAYS: Provides immediate time display without waiting
 * 
 * PROBLEM: User has to wait several seconds to see correct system time
 * SOLUTION: Instant time calculation and display with real-time updates
 */

(function() {
    'use strict';
    
    console.log('⚡ Instant Time Display Fix - Loading...');
    
    /**
     * Get instant system time (no delays)
     */
    function getInstantSystemTime() {
        const now = new Date();
        return {
            time: now.toTimeString().split(' ')[0], // HH:mm:ss
            timestamp: now.toISOString(),
            formatted: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            display: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    }
    
    /**
     * Create instant delivery date + system time display
     */
    function createInstantDeliveryDisplay(deliveryDate) {
        const systemTime = getInstantSystemTime();
        
        if (!deliveryDate) {
            // PRIORITY 1: Get from DR input if available
            const drInput = document.getElementById('drDeliveryDate');
            if (drInput && drInput.value) {
                deliveryDate = drInput.value;
                console.log('⚡ INSTANT: Using drDeliveryDate input:', deliveryDate);
            } else {
                // PRIORITY 2: Try to get from force delivery date fix
                if (window.getUserSelectedDeliveryDate) {
                    deliveryDate = window.getUserSelectedDeliveryDate();
                    console.log('⚡ INSTANT: Using getUserSelectedDeliveryDate:', deliveryDate);
                } else {
                    // FALLBACK: Use today's date (but log warning)
                    deliveryDate = new Date().toISOString().split('T')[0];
                    console.warn('⚠️ INSTANT: Fallback to system date - delivery date input not found:', deliveryDate);
                }
            }
        }
        
        // Create combined datetime
        const combinedDateTime = new Date(deliveryDate + 'T' + systemTime.time);
        const displayFormat = combinedDateTime.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ', ' + systemTime.display;
        
        return {
            deliveryDate: deliveryDate,
            systemTime: systemTime.time,
            combinedDateTime: combinedDateTime.toISOString(),
            displayFormat: displayFormat,
            instant: true
        };
    }
    
    /**
     * Ensure delivery date from input is preserved in delivery data
     */
    function preserveDeliveryDateInput() {
        // Monitor DR upload process to ensure delivery date is captured
        const originalProcessDRData = window.processDRData;
        if (typeof originalProcessDRData === 'function') {
            window.processDRData = function(data) {
                console.log('⚡ INSTANT: Preserving delivery date input in DR data');
                
                // Get user-selected delivery date
                const drInput = document.getElementById('drDeliveryDate');
                const userDeliveryDate = drInput && drInput.value ? drInput.value : null;
                
                if (userDeliveryDate && Array.isArray(data)) {
                    data.forEach(item => {
                        // Ensure created_date uses user's delivery date
                        item.created_date = userDeliveryDate;
                        item.deliveryDate = userDeliveryDate;
                        console.log('⚡ INSTANT: Set delivery dates for', item.drNumber, 'to:', userDeliveryDate);
                    });
                }
                
                return originalProcessDRData.call(this, data);
            };
        }
    }
    
    /**
     * Override Active Deliveries display for INSTANT updates
     */
    function overrideForInstantDisplay() {
        // Override formatActiveDeliveryDate for instant display
        const originalFormatActiveDeliveryDate = window.formatActiveDeliveryDate;
        
        window.formatActiveDeliveryDate = function(delivery) {
            console.log('⚡ INSTANT: Formatting delivery date for', delivery.drNumber, 'Data:', delivery);
            
            try {
                // PRIORITY 1: Use created_date (should be user's delivery date)
                if (delivery.created_date && delivery.created_date !== new Date().toISOString().split('T')[0]) {
                    const instantDisplay = createInstantDeliveryDisplay(delivery.created_date);
                    console.log('⚡ INSTANT: Using created_date:', delivery.created_date, '→', instantDisplay.displayFormat);
                    return instantDisplay.displayFormat;
                }
                
                // PRIORITY 2: Use deliveryDate
                if (delivery.deliveryDate && delivery.deliveryDate !== new Date().toISOString().split('T')[0]) {
                    const instantDisplay = createInstantDeliveryDisplay(delivery.deliveryDate);
                    console.log('⚡ INSTANT: Using deliveryDate:', delivery.deliveryDate, '→', instantDisplay.displayFormat);
                    return instantDisplay.displayFormat;
                }
                
                // PRIORITY 3: Check if we have user input available
                const drInput = document.getElementById('drDeliveryDate');
                if (drInput && drInput.value && drInput.value !== new Date().toISOString().split('T')[0]) {
                    const instantDisplay = createInstantDeliveryDisplay(drInput.value);
                    console.log('⚡ INSTANT: Using drDeliveryDate input:', drInput.value, '→', instantDisplay.displayFormat);
                    return instantDisplay.displayFormat;
                }
                
                // Fallback to original function
                if (originalFormatActiveDeliveryDate) {
                    return originalFormatActiveDeliveryDate.call(this, delivery);
                }
                
                // Last resort: current time
                const now = new Date();
                return now.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) + ', ' + now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
            } catch (error) {
                console.error('❌ Error in instant display:', error);
                return 'Display Error';
            }
        };
        
        // Override loadActiveDeliveries to remove delays
        const originalLoadActiveDeliveries = window.loadActiveDeliveries;
        
        window.loadActiveDeliveries = function(forceReload = false) {
            console.log('⚡ INSTANT: Loading active deliveries without delays');
            
            // Call original function but don't wait for timeouts
            if (originalLoadActiveDeliveries) {
                const result = originalLoadActiveDeliveries.call(this, forceReload);
                
                // Force immediate display update
                setTimeout(() => {
                    updateActiveDeliveriesDisplay();
                }, 0); // Use 0ms timeout to run immediately after current execution
                
                return result;
            }
        };
    }
    
    /**
     * Force immediate update of Active Deliveries display
     */
    function updateActiveDeliveriesDisplay() {
        console.log('⚡ INSTANT: Forcing immediate display update');
        
        // Find all delivery date cells and update them instantly
        const deliveryDateCells = document.querySelectorAll('[data-delivery-date], .delivery-date, .date-display');
        
        deliveryDateCells.forEach(cell => {
            const deliveryData = cell.dataset;
            if (deliveryData.deliveryDate || deliveryData.createdDate) {
                const dateToUse = deliveryData.deliveryDate || deliveryData.createdDate;
                const instantDisplay = createInstantDeliveryDisplay(dateToUse);
                cell.textContent = instantDisplay.displayFormat;
                console.log('⚡ INSTANT: Updated cell display to:', instantDisplay.displayFormat);
            }
        });
        
        // Also update any table rows with delivery data
        const tableRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
        tableRows.forEach(row => {
            const dateCell = row.querySelector('.date-cell, [data-date]');
            if (dateCell) {
                // Try to extract delivery date from row data
                const rowData = row.dataset;
                if (rowData.deliveryDate || rowData.createdDate) {
                    const dateToUse = rowData.deliveryDate || rowData.createdDate;
                    const instantDisplay = createInstantDeliveryDisplay(dateToUse);
                    dateCell.textContent = instantDisplay.displayFormat;
                }
            }
        });
    }
    
    /**
     * Start real-time clock for instant updates
     */
    function startInstantClock() {
        // Update display every second for real-time system time
        setInterval(() => {
            updateActiveDeliveriesDisplay();
        }, 1000);
        
        console.log('⚡ INSTANT: Real-time clock started');
    }
    
    /**
     * Remove all setTimeout delays from other scripts
     */
    function removeDelays() {
        // Override setTimeout to reduce delays for display-related functions
        const originalSetTimeout = window.setTimeout;
        
        window.setTimeout = function(callback, delay, ...args) {
            // If delay is for display updates, make it instant
            if (delay > 100 && (
                callback.toString().includes('loadActiveDeliveries') ||
                callback.toString().includes('refreshActiveDeliveries') ||
                callback.toString().includes('displayActiveDeliveries') ||
                callback.toString().includes('formatActiveDeliveryDate')
            )) {
                console.log('⚡ INSTANT: Reducing delay from', delay, 'ms to 0ms');
                delay = 0;
            }
            
            return originalSetTimeout.call(this, callback, delay, ...args);
        };
        
        console.log('⚡ INSTANT: Delays reduced for display functions');
    }
    
    /**
     * Initialize instant display fix
     */
    function initializeInstantFix() {
        console.log('⚡ Initializing Instant Time Display Fix...');
        
        // Apply all optimizations
        preserveDeliveryDateInput(); // CRITICAL: Preserve user's delivery date input
        overrideForInstantDisplay();
        removeDelays();
        startInstantClock();
        
        // Force immediate update
        setTimeout(() => {
            updateActiveDeliveriesDisplay();
        }, 0);
        
        console.log('✅ Instant Time Display Fix - Active');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeInstantFix);
    } else {
        initializeInstantFix();
    }
    
    // Export functions for global access
    window.getInstantSystemTime = getInstantSystemTime;
    window.createInstantDeliveryDisplay = createInstantDeliveryDisplay;
    window.updateActiveDeliveriesDisplay = updateActiveDeliveriesDisplay;
    
    console.log('⚡ Instant Time Display Fix - Loaded');
    
})();