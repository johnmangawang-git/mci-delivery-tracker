/**
 * DELIVERY HISTORY REAL-TIME INTEGRATION
 * Ensures Delivery History uses real system time when user e-signs DR items
 * Integrates with the existing real-time system integration for consistent timestamps
 */

console.log('🕐 Loading Delivery History Real-Time Integration...');

(function() {
    'use strict';
    
    /**
     * Create completion timestamp using real system time
     * This is called when user e-signs a DR item
     */
    function createCompletionTimestamp() {
        // Use the real-time integration functions if available
        if (typeof window.createRealTimeTimestamp === 'function') {
            const realTimestamp = window.createRealTimeTimestamp();
            
            console.log('🕐 Using real-time integration for completion timestamp:', realTimestamp);
            
            return {
                // ISO format for database storage
                completedDateTime: realTimestamp.toISOString(),
                completed_date_time: realTimestamp.toISOString(),
                signedAt: realTimestamp.toISOString(),
                signed_at: realTimestamp.toISOString(),
                
                // Formatted date for display
                completedDate: realTimestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                completed_date: realTimestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                
                // Formatted time for display
                completedTime: realTimestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                completed_time: realTimestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                
                // Action metadata
                action: 'e-signature_completion',
                actionTime: realTimestamp.toISOString().replace('T', ' ').substring(0, 19)
            };
        }
        
        // Fallback to regular system time if real-time integration not available
        const now = new Date();
        console.log('⚠️ Real-time integration not available, using fallback timestamp:', now);
        
        return {
            completedDateTime: now.toISOString(),
            completed_date_time: now.toISOString(),
            signedAt: now.toISOString(),
            signed_at: now.toISOString(),
            completedDate: now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            completed_date: now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            completedTime: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            completed_time: now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            action: 'e-signature_completion_fallback',
            actionTime: now.toISOString().replace('T', ' ').substring(0, 19)
        };
    }
    
    /**
     * Override the delivery status update function to use real-time timestamps
     */
    function overrideDeliveryStatusUpdate() {
        // Store original function if it exists
        if (typeof window.originalUpdateDeliveryStatus === 'undefined' && typeof window.updateDeliveryStatus === 'function') {
            window.originalUpdateDeliveryStatus = window.updateDeliveryStatus;
        }
        
        // Enhanced updateDeliveryStatus with real-time integration
        window.updateDeliveryStatus = function(drNumber, newStatus) {
            console.log(`🕐 Enhanced updateDeliveryStatus with real-time: ${drNumber} -> ${newStatus}`);
            
            try {
                // Ensure global arrays exist
                if (!window.activeDeliveries) {
                    window.activeDeliveries = [];
                    console.log('⚠️ Initialized missing activeDeliveries array');
                }
                if (!window.deliveryHistory) {
                    window.deliveryHistory = [];
                    console.log('⚠️ Initialized missing deliveryHistory array');
                }
                
                // Find delivery in activeDeliveries
                const deliveryIndex = window.activeDeliveries.findIndex(d => 
                    (d.drNumber || d.dr_number) === drNumber
                );
                console.log(`📍 Found delivery at index: ${deliveryIndex}`);
                
                if (deliveryIndex !== -1) {
                    const delivery = window.activeDeliveries[deliveryIndex];
                    
                    // Update delivery status
                    delivery.status = newStatus;
                    
                    // If completing the delivery, use real-time timestamp
                    if (newStatus === 'Completed') {
                        console.log('🕐 Creating real-time completion timestamp...');
                        
                        // Get real-time completion timestamp
                        const completionTimestamp = createCompletionTimestamp();
                        
                        // Apply all timestamp fields to the delivery
                        Object.assign(delivery, completionTimestamp);
                        
                        console.log('✅ Applied real-time completion timestamp:', completionTimestamp);
                        console.log(`📅 Completion Date: ${delivery.completedDate}`);
                        console.log(`🕐 Completion Time: ${delivery.completedTime}`);
                        console.log(`📝 Signed At: ${delivery.signedAt}`);
                        
                        // Move to history
                        console.log('📦 Moving delivery to history...');
                        
                        // Create clean copy for history with proper field names
                        const deliveryDrNumber = delivery.drNumber || delivery.dr_number || '';
                        const historyCopy = {
                            ...delivery,
                            id: delivery.id,
                            drNumber: deliveryDrNumber,
                            dr_number: deliveryDrNumber,
                            customerName: delivery.customerName || delivery.customer_name || '',
                            customer_name: delivery.customerName || delivery.customer_name || '',
                            vendorNumber: delivery.vendorNumber || delivery.vendor_number || '',
                            vendor_number: delivery.vendorNumber || delivery.vendor_number || '',
                            truckPlateNumber: delivery.truckPlateNumber || delivery.truck_plate_number || '',
                            truck_plate_number: delivery.truckPlateNumber || delivery.truck_plate_number || '',
                            truckType: delivery.truckType || delivery.truck_type || '',
                            truck_type: delivery.truckType || delivery.truck_type || '',
                            origin: delivery.origin || '',
                            destination: delivery.destination || '',
                            status: 'Completed'
                        };
                        
                        // Remove signature data to avoid conflicts
                        delete historyCopy.signature;
                        
                        // Add to history at the beginning
                        window.deliveryHistory.unshift(historyCopy);
                        console.log(`✅ Added to history. History length: ${window.deliveryHistory.length}`);
                        
                        // Remove from active deliveries
                        window.activeDeliveries.splice(deliveryIndex, 1);
                        console.log(`✅ Removed from active. Active length: ${window.activeDeliveries.length}`);
                        
                        // Force save to localStorage immediately
                        try {
                            localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                            localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                            console.log('💾 FORCED save to localStorage successful');
                            
                            // Verify save
                            const savedHistory = localStorage.getItem('mci-delivery-history');
                            const parsedHistory = JSON.parse(savedHistory);
                            console.log(`✅ Verified: ${parsedHistory.length} items in saved history`);
                            
                        } catch (storageError) {
                            console.error('❌ Error saving to localStorage:', storageError);
                        }
                        
                        // Update UI immediately
                        updateDeliveryUI(drNumber, newStatus);
                        
                        // Force refresh delivery history view
                        setTimeout(() => {
                            console.log('🔄 Force refreshing delivery history...');
                            if (typeof window.forceRefreshDeliveryHistory === 'function') {
                                window.forceRefreshDeliveryHistory();
                            } else if (typeof window.loadDeliveryHistory === 'function') {
                                window.loadDeliveryHistory();
                            }
                        }, 200);
                        
                        return true;
                    } else {
                        // For non-completed status updates, just update normally
                        console.log(`✅ Updated delivery status: ${delivery.drNumber || delivery.dr_number} -> ${newStatus}`);
                        
                        // Save to localStorage
                        try {
                            localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                            console.log('💾 Saved active deliveries to localStorage');
                        } catch (storageError) {
                            console.error('❌ Error saving to localStorage:', storageError);
                        }
                        
                        // Update UI
                        updateDeliveryUI(drNumber, newStatus);
                        
                        return true;
                    }
                } else {
                    console.error(`❌ Delivery ${drNumber} not found in activeDeliveries`);
                    console.log('Available deliveries:', window.activeDeliveries.map(d => d.drNumber || d.dr_number));
                    return false;
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced updateDeliveryStatus:', error);
                return false;
            }
        };
        
        console.log('✅ updateDeliveryStatus function overridden with real-time integration');
    }
    
    /**
     * Update delivery UI
     */
    function updateDeliveryUI(drNumber, newStatus) {
        console.log(`🎨 Updating UI for ${drNumber} -> ${newStatus}`);
        
        // Update active deliveries table
        const activeRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
        activeRows.forEach(row => {
            const drCell = row.querySelector('td:nth-child(2)');
            if (drCell && drCell.textContent.trim() === drNumber) {
                const statusCell = row.querySelector('td:nth-child(9)');
                if (statusCell) {
                    statusCell.innerHTML = `<span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> ${newStatus}
                    </span>`;
                }
                row.classList.add('table-success');
                row.style.opacity = '0.7';
            }
        });
    }
    
    /**
     * Override signature completion functions
     */
    function overrideSignatureCompletion() {
        // Override enhancedSignatureComplete if it exists
        if (typeof window.enhancedSignatureComplete === 'function') {
            const originalEnhancedSignatureComplete = window.enhancedSignatureComplete;
            window.enhancedSignatureComplete = function(drNumber) {
                console.log(`🖊️ Enhanced signature completion with real-time for: ${drNumber}`);
                
                // Use our enhanced updateDeliveryStatus
                const success = window.updateDeliveryStatus(drNumber, 'Completed');
                
                if (success) {
                    console.log('✅ Real-time signature completion successful');
                    
                    // Show success message
                    if (typeof showToast === 'function') {
                        showToast('E-POD saved successfully with real-time timestamp! Delivery moved to history.', 'success');
                    }
                    
                    // Refresh active deliveries view
                    if (typeof window.loadActiveDeliveries === 'function') {
                        setTimeout(() => {
                            window.loadActiveDeliveries();
                        }, 300);
                    }
                    
                    return true;
                } else {
                    console.error('❌ Real-time signature completion failed');
                    
                    if (typeof showToast === 'function') {
                        showToast('Failed to complete signature process. Please try again.', 'error');
                    }
                    
                    return false;
                }
            };
        }
        
        console.log('✅ Signature completion functions overridden with real-time integration');
    }
    
    /**
     * Initialize the delivery history real-time integration
     */
    function initDeliveryHistoryRealTimeIntegration() {
        console.log('🚀 Initializing Delivery History Real-Time Integration...');
        
        // Override delivery status update function
        overrideDeliveryStatusUpdate();
        
        // Override signature completion functions
        overrideSignatureCompletion();
        
        // Set up periodic override to ensure our functions are always used
        setInterval(() => {
            // Re-override functions to ensure they're not replaced
            overrideDeliveryStatusUpdate();
            overrideSignatureCompletion();
        }, 5000); // Every 5 seconds
        
        console.log('✅ Delivery History Real-Time Integration initialized');
        console.log('📅 When users e-sign DR items, completion timestamps will use real system time');
    }
    
    // Export functions globally
    window.createCompletionTimestamp = createCompletionTimestamp;
    window.initDeliveryHistoryRealTimeIntegration = initDeliveryHistoryRealTimeIntegration;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeliveryHistoryRealTimeIntegration);
    } else {
        initDeliveryHistoryRealTimeIntegration();
    }
    
    console.log('✅ Delivery History Real-Time Integration loaded successfully');
    
})();

// Export module info
window.deliveryHistoryRealTimeIntegration = {
    version: '1.0.0',
    loaded: true,
    description: 'Uses real system time for delivery completion timestamps when user e-signs DR items',
    timestamp: new Date().toISOString()
};