/**
 * DELIVERY HISTORY DATE PRESERVATION FIX
 * Prevents completion dates from being overwritten with today's date
 * Preserves original completion timestamps in delivery history
 */

console.log('🛡️ Loading Delivery History Date Preservation Fix...');

(function() {
    'use strict';
    
    /**
     * Safe completion timestamp creation that preserves existing dates
     */
    function createSafeCompletionTimestamp(existingDelivery) {
        console.log('🛡️ Creating safe completion timestamp for:', existingDelivery.drNumber || existingDelivery.dr_number);
        
        // Check if delivery already has completion data - PRESERVE IT!
        const existingTimestamps = {
            completedDate: existingDelivery.completedDate,
            completed_date: existingDelivery.completed_date,
            completedDateTime: existingDelivery.completedDateTime,
            completed_date_time: existingDelivery.completed_date_time,
            completedTime: existingDelivery.completedTime,
            completed_time: existingDelivery.completed_time,
            signedAt: existingDelivery.signedAt,
            signed_at: existingDelivery.signed_at
        };
        
        // Check if we have any existing completion data
        const hasExistingData = Object.values(existingTimestamps).some(value => 
            value && value !== 'N/A' && value !== ''
        );
        
        if (hasExistingData) {
            console.log('✅ Preserving existing completion timestamps:', existingTimestamps);
            return existingTimestamps; // Return existing data unchanged
        }
        
        // Only create new timestamp if no existing data
        console.log('📅 No existing completion data, creating new timestamp');
        
        // Try to use the real-time integration if available
        if (typeof window.createCompletionTimestamp === 'function') {
            try {
                const newTimestamp = window.createCompletionTimestamp();
                console.log('✅ Created new completion timestamp using real-time integration');
                return newTimestamp;
            } catch (error) {
                console.error('❌ Error creating completion timestamp:', error);
            }
        }
        
        // Safe fallback that uses current time but doesn't override existing data
        const now = new Date();
        const safeTimestamp = {
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
            })
        };
        
        console.log('⚠️ Using safe fallback timestamp (no existing data found)');
        return safeTimestamp;
    }
    
    /**
     * Override the problematic completion timestamp logic in app.js
     */
    function overrideCompletionTimestampLogic() {
        // Store original updateDeliveryStatus if it exists
        if (typeof window.originalAppUpdateDeliveryStatus === 'undefined' && typeof window.updateDeliveryStatus === 'function') {
            window.originalAppUpdateDeliveryStatus = window.updateDeliveryStatus;
        }
        
        // Enhanced updateDeliveryStatus that preserves existing dates
        window.updateDeliveryStatus = function(drNumber, newStatus) {
            console.log(`🛡️ Safe updateDeliveryStatus: ${drNumber} -> ${newStatus}`);
            
            try {
                // Ensure global arrays exist
                if (!window.activeDeliveries) {
                    window.activeDeliveries = [];
                }
                if (!window.deliveryHistory) {
                    window.deliveryHistory = [];
                }
                
                // Find delivery in activeDeliveries
                const deliveryIndex = window.activeDeliveries.findIndex(d => 
                    (d.drNumber || d.dr_number) === drNumber
                );
                
                if (deliveryIndex !== -1) {
                    const delivery = window.activeDeliveries[deliveryIndex];
                    
                    // Update status
                    delivery.status = newStatus;
                    
                    // If completing the delivery, handle timestamps safely
                    if (newStatus === 'Completed') {
                        console.log('🛡️ Safely handling completion timestamps...');
                        
                        // Use safe completion timestamp that preserves existing data
                        const completionData = createSafeCompletionTimestamp(delivery);
                        
                        // Only apply new data if no existing data exists
                        Object.keys(completionData).forEach(key => {
                            if (!delivery[key] || delivery[key] === 'N/A' || delivery[key] === '') {
                                delivery[key] = completionData[key];
                            } else {
                                console.log(`🛡️ Preserving existing ${key}:`, delivery[key]);
                            }
                        });
                        
                        // Move to history
                        console.log('📦 Moving delivery to history with preserved dates...');
                        
                        // Create clean copy for history
                        const deliveryDrNumber = delivery.drNumber || delivery.dr_number || '';
                        const historyCopy = {
                            ...delivery,
                            id: delivery.id,
                            drNumber: deliveryDrNumber,
                            dr_number: deliveryDrNumber,
                            customerName: delivery.customerName || delivery.customer_name || '',
                            customer_name: delivery.customerName || delivery.customer_name || '',
                            status: 'Completed'
                        };
                        
                        // Remove signature data to avoid conflicts
                        delete historyCopy.signature;
                        
                        // Add to history
                        window.deliveryHistory.unshift(historyCopy);
                        console.log(`✅ Added to history with preserved dates. History length: ${window.deliveryHistory.length}`);
                        
                        // Remove from active deliveries
                        window.activeDeliveries.splice(deliveryIndex, 1);
                        
                        // Save to localStorage
                        try {
                            localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                            localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                            console.log('💾 Saved to localStorage with preserved dates');
                        } catch (storageError) {
                            console.error('❌ Error saving to localStorage:', storageError);
                        }
                        
                        // Refresh views
                        setTimeout(() => {
                            if (typeof window.loadDeliveryHistory === 'function') {
                                window.loadDeliveryHistory();
                            }
                            if (typeof window.loadActiveDeliveries === 'function') {
                                window.loadActiveDeliveries();
                            }
                        }, 200);
                        
                        return true;
                    }
                    
                    // For non-completed status updates
                    try {
                        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                        return true;
                    } catch (storageError) {
                        console.error('❌ Error saving to localStorage:', storageError);
                        return false;
                    }
                } else {
                    console.error(`❌ Delivery ${drNumber} not found in activeDeliveries`);
                    return false;
                }
                
            } catch (error) {
                console.error('❌ Error in safe updateDeliveryStatus:', error);
                return false;
            }
        };
        
        console.log('✅ Completion timestamp logic overridden with date preservation');
    }
    
    /**
     * Fix existing delivery history items that may have wrong dates
     */
    function fixExistingDeliveryHistoryDates() {
        console.log('🔧 Checking existing delivery history for date issues...');
        
        if (!window.deliveryHistory || window.deliveryHistory.length === 0) {
            console.log('📋 No delivery history to fix');
            return;
        }
        
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let fixedCount = 0;
        
        window.deliveryHistory.forEach((delivery, index) => {
            // Check if completion date is today's date (suspicious)
            if (delivery.completedDate === today) {
                console.log(`🔍 Found suspicious date for ${delivery.drNumber || delivery.dr_number}: ${delivery.completedDate}`);
                
                // Try to find a better timestamp
                const betterTimestamp = delivery.completedDateTime || 
                                      delivery.completed_date_time || 
                                      delivery.signedAt || 
                                      delivery.signed_at ||
                                      delivery.timestamp ||
                                      delivery.created_at;
                
                if (betterTimestamp && betterTimestamp !== today) {
                    try {
                        const originalDate = new Date(betterTimestamp);
                        if (!isNaN(originalDate.getTime())) {
                            const correctedDate = originalDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                            
                            if (correctedDate !== today) {
                                console.log(`🔧 Correcting date for ${delivery.drNumber || delivery.dr_number}: ${today} → ${correctedDate}`);
                                delivery.completedDate = correctedDate;
                                delivery.completed_date = correctedDate;
                                fixedCount++;
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error correcting date:', error);
                    }
                }
            }
        });
        
        if (fixedCount > 0) {
            console.log(`✅ Fixed ${fixedCount} delivery history dates`);
            
            // Save corrected data
            try {
                localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                console.log('💾 Saved corrected delivery history');
                
                // Refresh display
                setTimeout(() => {
                    if (typeof window.loadDeliveryHistory === 'function') {
                        window.loadDeliveryHistory();
                    }
                }, 500);
            } catch (error) {
                console.error('❌ Error saving corrected data:', error);
            }
        } else {
            console.log('✅ No delivery history dates needed correction');
        }
    }
    
    /**
     * Initialize the delivery history date preservation fix
     */
    function initDeliveryHistoryDatePreservationFix() {
        console.log('🚀 Initializing Delivery History Date Preservation Fix...');
        
        // Override the problematic completion timestamp logic
        overrideCompletionTimestampLogic();
        
        // Fix existing delivery history dates after a delay
        setTimeout(() => {
            fixExistingDeliveryHistoryDates();
        }, 2000);
        
        // Set up periodic override to ensure our functions are always used
        setInterval(() => {
            overrideCompletionTimestampLogic();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Delivery History Date Preservation Fix initialized');
        console.log('🛡️ Existing completion dates will be preserved, not overwritten with today\'s date');
    }
    
    // Export functions globally
    window.createSafeCompletionTimestamp = createSafeCompletionTimestamp;
    window.fixExistingDeliveryHistoryDates = fixExistingDeliveryHistoryDates;
    window.initDeliveryHistoryDatePreservationFix = initDeliveryHistoryDatePreservationFix;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeliveryHistoryDatePreservationFix);
    } else {
        initDeliveryHistoryDatePreservationFix();
    }
    
    console.log('✅ Delivery History Date Preservation Fix loaded successfully');
    
})();

// Export module info
window.deliveryHistoryDatePreservationFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Prevents completion dates from being overwritten with today\'s date',
    timestamp: new Date().toISOString()
};