/**
 * Active Deliveries Date Display Fix
 * Ensures user-selected delivery date is displayed instead of system timestamp
 * Fixes the display priority to show deliveryDate over timestamp
 */

console.log('📅 Loading Active Deliveries Date Display Fix...');

window.activeDeliveriesDateDisplayFix = {
    
    /**
     * Format delivery date for Active Deliveries display
     */
    formatActiveDeliveryDate(delivery) {
        try {
            // Priority order for date fields (user date + system time first)
            const dateFields = [
                'deliveryDateTime',    // Combined user date + system time (highest priority)
                'formattedDeliveryDateTime', // Pre-formatted combined date-time
                'deliveryDate',        // User-selected delivery date only
                'bookedDate',          // Alternative user-selected date
                'formattedDeliveryDate', // Pre-formatted delivery date
                'created_date',        // Database creation date
                'timestamp',           // System timestamp (lowest priority)
                'created_at'           // Database timestamp
            ];
            
            let selectedDate = null;
            let dateSource = 'unknown';
            
            // Find the first available date field
            for (const field of dateFields) {
                if (delivery[field]) {
                    selectedDate = delivery[field];
                    dateSource = field;
                    break;
                }
            }
            
            if (!selectedDate) {
                console.warn('⚠️ No date found for delivery:', delivery.drNumber);
                return 'No Date';
            }
            
            // If it's already formatted, return as-is
            if (dateSource === 'formattedDeliveryDate') {
                return selectedDate;
            }
            
            // Format the date
            let formattedDate;
            
            try {
                const date = new Date(selectedDate);
                
                // Check if it's a valid date
                if (isNaN(date.getTime())) {
                    console.warn('⚠️ Invalid date for delivery:', delivery.drNumber, selectedDate);
                    return 'Invalid Date';
                }
                
                // Format based on date source
                if (dateSource === 'deliveryDate' || dateSource === 'bookedDate') {
                    // User-selected dates - show date only (no time, as time comes from deliveryDateTime)
                    formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } else if (dateSource === 'deliveryDateTime') {
                    // Combined user date + system time - show both
                    formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) + ', ' + date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    // System timestamps - show as-is
                    formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) + ', ' + date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                
                console.log(`📅 Formatted date for ${delivery.drNumber}: ${formattedDate} (source: ${dateSource})`);
                return formattedDate;
                
            } catch (error) {
                console.error('❌ Error formatting date:', error, selectedDate);
                return 'Format Error';
            }
            
        } catch (error) {
            console.error('❌ Error in formatActiveDeliveryDate:', error);
            return 'Error';
        }
    },
    
    /**
     * Override the date display logic in Active Deliveries
     */
    overrideDateDisplay() {
        // Make the function globally available
        window.formatActiveDeliveryDate = this.formatActiveDeliveryDate;
        
        // Override any existing date formatting functions
        if (typeof window.getField === 'function') {
            const originalGetField = window.getField;
            
            window.getField = function(delivery, fieldName) {
                // If requesting date-related fields, use our enhanced logic
                if (fieldName === 'deliveryDate' || fieldName === 'bookedDate') {
                    return window.activeDeliveriesDateDisplayFix.formatActiveDeliveryDate(delivery);
                }
                
                // For other fields, use original logic
                return originalGetField(delivery, fieldName);
            };
        }
        
        console.log('✅ Date display logic overridden');
    },
    
    /**
     * Fix existing Active Deliveries data to prioritize delivery date
     */
    fixExistingDeliveryDates() {
        try {
            if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                let fixedCount = 0;
                
                window.activeDeliveries.forEach(delivery => {
                    // If delivery has both deliveryDate and timestamp, ensure deliveryDate takes priority
                    if (delivery.deliveryDate && delivery.timestamp) {
                        // Create a formatted version for display
                        delivery.formattedDeliveryDate = this.formatActiveDeliveryDate(delivery);
                        fixedCount++;
                    }
                });
                
                if (fixedCount > 0) {
                    console.log(`📅 Fixed date display for ${fixedCount} deliveries`);
                    
                    // Save updated data
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                }
            }
        } catch (error) {
            console.error('❌ Error fixing existing delivery dates:', error);
        }
    },
    
    /**
     * Monitor for new deliveries and fix their date display
     */
    monitorNewDeliveries() {
        // Override array push to fix dates on new deliveries
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            const originalPush = window.activeDeliveries.push;
            
            window.activeDeliveries.push = function(...deliveries) {
                // Fix date display for new deliveries
                deliveries.forEach(delivery => {
                    if (delivery.deliveryDate) {
                        delivery.formattedDeliveryDate = window.activeDeliveriesDateDisplayFix.formatActiveDeliveryDate(delivery);
                        console.log(`📅 Fixed date display for new delivery: ${delivery.drNumber}`);
                    }
                });
                
                // Call original push
                return originalPush.apply(this, deliveries);
            };
        }
        
        // Listen for delivery updates
        window.addEventListener('deliveriesUpdated', () => {
            this.fixExistingDeliveryDates();
        });
        
        console.log('✅ New delivery monitoring enabled');
    },
    
    /**
     * Force refresh Active Deliveries display
     */
    refreshActiveDeliveriesDisplay() {
        try {
            // Refresh the display if functions are available
            if (typeof window.populateActiveDeliveriesTable === 'function') {
                window.populateActiveDeliveriesTable();
            } else if (typeof window.loadActiveDeliveries === 'function') {
                window.loadActiveDeliveries();
            }
            
            // Trigger view refresh
            const event = new CustomEvent('activeDeliveriesRefresh');
            window.dispatchEvent(event);
            
            console.log('🔄 Active Deliveries display refreshed');
        } catch (error) {
            console.error('❌ Error refreshing Active Deliveries display:', error);
        }
    },
    
    /**
     * Initialize the fix
     */
    initialize() {
        console.log('🚀 Initializing Active Deliveries Date Display Fix...');
        
        // Override date display logic
        this.overrideDateDisplay();
        
        // Fix existing delivery dates
        this.fixExistingDeliveryDates();
        
        // Monitor for new deliveries
        this.monitorNewDeliveries();
        
        // Refresh display after a short delay
        setTimeout(() => {
            this.refreshActiveDeliveriesDisplay();
        }, 2000);
        
        // Periodic refresh to ensure dates are displayed correctly
        setInterval(() => {
            this.fixExistingDeliveryDates();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Active Deliveries Date Display Fix initialized');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.activeDeliveriesDateDisplayFix.initialize();
        }, 3000);
    });
} else {
    setTimeout(() => {
        window.activeDeliveriesDateDisplayFix.initialize();
    }, 3000);
}

// Also initialize when Active Deliveries view is shown
document.addEventListener('click', function(event) {
    if (event.target && event.target.textContent && event.target.textContent.includes('Active Deliveries')) {
        setTimeout(() => {
            window.activeDeliveriesDateDisplayFix.refreshActiveDeliveriesDisplay();
        }, 1000);
    }
});

console.log('✅ Active Deliveries Date Display Fix loaded');