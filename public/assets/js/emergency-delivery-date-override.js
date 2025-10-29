/**
 * Emergency Delivery Date Override
 * NUCLEAR OPTION: Forces delivery date display to use user input, overriding everything
 * 
 * PROBLEM: Date display still showing today's date despite all fixes
 * SOLUTION: Override at the display level, intercept all date rendering
 */

(function() {
    'use strict';
    
    console.log('🚨 Emergency Delivery Date Override - Loading...');
    
    /**
     * Get user's delivery date input with multiple fallbacks
     */
    function getEmergencyDeliveryDate() {
        // Try all possible sources
        const sources = [
            () => {
                const drInput = document.getElementById('drDeliveryDate');
                return drInput && drInput.value ? drInput.value : null;
            },
            () => window.userSelectedDeliveryDate || null,
            () => window.getUserSelectedDeliveryDate ? window.getUserSelectedDeliveryDate() : null,
            () => window.getUserDeliveryDateInput ? window.getUserDeliveryDateInput() : null,
            () => {
                // Check localStorage for last selected date
                const stored = localStorage.getItem('lastSelectedDeliveryDate');
                return stored && stored !== new Date().toISOString().split('T')[0] ? stored : null;
            }
        ];
        
        for (const source of sources) {
            try {
                const date = source();
                if (date && date !== new Date().toISOString().split('T')[0]) {
                    console.log('🚨 EMERGENCY: Found delivery date:', date);
                    return date;
                }
            } catch (error) {
                console.warn('🚨 EMERGENCY: Source failed:', error);
            }
        }
        
        console.warn('🚨 EMERGENCY: No delivery date found, using fallback');
        return null;
    }
    
    /**
     * Store delivery date when user selects it
     */
    function storeDeliveryDate() {
        const drInput = document.getElementById('drDeliveryDate');
        if (drInput) {
            drInput.addEventListener('change', function() {
                const selectedDate = this.value;
                console.log('🚨 EMERGENCY: Storing delivery date:', selectedDate);
                localStorage.setItem('lastSelectedDeliveryDate', selectedDate);
                window.userSelectedDeliveryDate = selectedDate;
                
                // Force refresh display
                setTimeout(() => {
                    forceRefreshActiveDeliveries();
                }, 100);
            });
        }
    }
    
    /**
     * Nuclear option: Override ALL date display functions
     */
    function overrideAllDateFunctions() {
        // Override formatActiveDeliveryDate with nuclear option
        window.formatActiveDeliveryDate = function(delivery) {
            console.log('🚨 EMERGENCY: Formatting delivery date for', delivery.drNumber);
            
            const emergencyDate = getEmergencyDeliveryDate();
            if (emergencyDate) {
                const currentTime = new Date();
                const combinedDateTime = new Date(emergencyDate + 'T' + currentTime.toTimeString().split(' ')[0]);
                const formatted = combinedDateTime.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                console.log('🚨 EMERGENCY: Forced display to:', formatted);
                return formatted;
            }
            
            // Fallback to original logic but with warning
            console.warn('🚨 EMERGENCY: No emergency date available, using delivery data');
            
            if (delivery.created_date && delivery.created_date !== new Date().toISOString().split('T')[0]) {
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
                return formatted;
            }
            
            // Last resort
            const now = new Date();
            return now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) + ', ' + now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // Override populateActiveDeliveriesTable to force date display
        const originalPopulateActiveDeliveriesTable = window.populateActiveDeliveriesTable;
        if (typeof originalPopulateActiveDeliveriesTable === 'function') {
            window.populateActiveDeliveriesTable = function(deliveries) {
                console.log('🚨 EMERGENCY: Intercepting populateActiveDeliveriesTable');
                
                const emergencyDate = getEmergencyDeliveryDate();
                if (emergencyDate && Array.isArray(deliveries)) {
                    // Force all deliveries to use emergency date
                    deliveries.forEach(delivery => {
                        delivery.created_date = emergencyDate;
                        delivery.deliveryDate = emergencyDate;
                        delivery.bookedDate = emergencyDate;
                        console.log('🚨 EMERGENCY: Forced dates for', delivery.drNumber || delivery.dr_number, 'to:', emergencyDate);
                    });
                }
                
                return originalPopulateActiveDeliveriesTable.call(this, deliveries);
            };
        }
        
        console.log('🚨 EMERGENCY: All date functions overridden');
    }
    
    /**
     * Force refresh Active Deliveries display
     */
    function forceRefreshActiveDeliveries() {
        console.log('🚨 EMERGENCY: Forcing Active Deliveries refresh');
        
        if (typeof window.loadActiveDeliveries === 'function') {
            window.loadActiveDeliveries(true);
        }
        
        // Also try to update existing table cells
        setTimeout(() => {
            const dateCells = document.querySelectorAll('#activeDeliveriesTableBody td');
            const emergencyDate = getEmergencyDeliveryDate();
            
            if (emergencyDate) {
                dateCells.forEach(cell => {
                    const text = cell.textContent;
                    // If cell contains today's date, replace it
                    const today = new Date();
                    const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    if (text.includes(todayStr) && text.includes('2024')) {
                        const currentTime = new Date();
                        const combinedDateTime = new Date(emergencyDate + 'T' + currentTime.toTimeString().split(' ')[0]);
                        const newDisplay = combinedDateTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }) + ', ' + combinedDateTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        cell.textContent = newDisplay;
                        console.log('🚨 EMERGENCY: Updated cell from', text, 'to', newDisplay);
                    }
                });
            }
        }, 500);
    }
    
    /**
     * Monitor for new data and force override
     */
    function monitorForNewData() {
        // Watch for changes in the Active Deliveries table
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.target.id === 'activeDeliveriesTableBody') {
                    console.log('🚨 EMERGENCY: Active Deliveries table updated, forcing date override');
                    setTimeout(() => {
                        forceRefreshActiveDeliveries();
                    }, 100);
                }
            });
        });
        
        const tableBody = document.getElementById('activeDeliveriesTableBody');
        if (tableBody) {
            observer.observe(tableBody, {
                childList: true,
                subtree: true
            });
        }
        
        // Also monitor for modal changes
        const drModal = document.getElementById('drUploadModal');
        if (drModal) {
            const modalObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (drModal.style.display !== 'none') {
                            console.log('🚨 EMERGENCY: DR Modal opened, setting up monitoring');
                            storeDeliveryDate();
                        }
                    }
                });
            });
            
            modalObserver.observe(drModal, {
                attributes: true
            });
        }
    }
    
    /**
     * Initialize emergency override
     */
    function initializeEmergencyOverride() {
        console.log('🚨 Initializing Emergency Delivery Date Override...');
        
        // Apply all overrides
        overrideAllDateFunctions();
        storeDeliveryDate();
        monitorForNewData();
        
        // Force immediate refresh if we have data
        setTimeout(() => {
            forceRefreshActiveDeliveries();
        }, 1000);
        
        console.log('🚨 Emergency Delivery Date Override - Active');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEmergencyOverride);
    } else {
        initializeEmergencyOverride();
    }
    
    console.log('🚨 Emergency Delivery Date Override - Loaded');
    
})();