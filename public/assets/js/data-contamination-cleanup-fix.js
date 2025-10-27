/**
 * DATA CONTAMINATION CLEANUP FIX
 * Fixes issues where old localStorage data contaminates new DR bookings
 * Ensures new DR uploads have correct dates and Active status
 */

console.log('🧹 Loading Data Contamination Cleanup Fix...');

(function() {
    'use strict';
    
    /**
     * Clean and validate delivery data to prevent contamination
     */
    function cleanDeliveryData(deliveries, isNewBooking = false) {
        if (!Array.isArray(deliveries)) {
            return [];
        }
        
        console.log(`🧹 Cleaning ${deliveries.length} delivery records (new booking: ${isNewBooking})`);
        
        return deliveries.map(delivery => {
            const cleaned = { ...delivery };
            
            // If this is a new booking, ensure correct defaults
            if (isNewBooking) {
                // Force Active status for new bookings
                cleaned.status = 'Active';
                
                // Remove any completion-related fields that shouldn't exist for new bookings
                delete cleaned.completedDate;
                delete cleaned.completed_date;
                delete cleaned.completedDateTime;
                delete cleaned.completed_date_time;
                delete cleaned.completedTime;
                delete cleaned.completed_time;
                delete cleaned.signedAt;
                delete cleaned.signed_at;
                delete cleaned.signature;
                
                console.log(`🧹 Cleaned new booking ${cleaned.drNumber || cleaned.dr_number}: status set to Active`);
            }
            
            // Validate and clean dates
            if (cleaned.deliveryDate || cleaned.delivery_date) {
                const deliveryDate = cleaned.deliveryDate || cleaned.delivery_date;
                
                // Check if date looks suspicious (too old or invalid)
                try {
                    const dateObj = new Date(deliveryDate);
                    const now = new Date();
                    const daysDiff = (dateObj - now) / (1000 * 60 * 60 * 24);
                    
                    // If date is more than 30 days in the past, it might be contaminated
                    if (daysDiff < -30) {
                        console.warn(`⚠️ Suspicious old date detected for ${cleaned.drNumber || cleaned.dr_number}: ${deliveryDate}`);
                        
                        // For new bookings, use today's date as fallback
                        if (isNewBooking) {
                            const today = new Date().toISOString().split('T')[0];
                            cleaned.deliveryDate = today;
                            cleaned.delivery_date = today;
                            console.log(`🔧 Fixed suspicious date to today: ${today}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error validating date:', error);
                }
            }
            
            return cleaned;
        });
    }
    
    /**
     * Clear contaminated localStorage data
     */
    function clearContaminatedData() {
        console.log('🧹 Checking for contaminated localStorage data...');
        
        try {
            const activeData = localStorage.getItem('mci-active-deliveries');
            const historyData = localStorage.getItem('mci-delivery-history');
            
            let needsCleaning = false;
            
            // Check active deliveries for contamination
            if (activeData) {
                const active = JSON.parse(activeData);
                const contaminatedActive = active.filter(d => 
                    d.status === 'Completed' || d.status === 'Signed' ||
                    (d.deliveryDate && new Date(d.deliveryDate) < new Date('2025-10-20')) // Suspiciously old dates
                );
                
                if (contaminatedActive.length > 0) {
                    console.warn(`⚠️ Found ${contaminatedActive.length} contaminated active deliveries`);
                    needsCleaning = true;
                }
            }
            
            // Check history for suspicious patterns
            if (historyData) {
                const history = JSON.parse(historyData);
                const suspiciousHistory = history.filter(d => 
                    !d.completedDate && !d.completedDateTime && !d.signedAt // Missing completion data
                );
                
                if (suspiciousHistory.length > 0) {
                    console.warn(`⚠️ Found ${suspiciousHistory.length} suspicious history records`);
                    needsCleaning = true;
                }
            }
            
            if (needsCleaning) {
                console.log('🧹 Clearing contaminated localStorage data...');
                
                // Create backup before clearing
                const backup = {
                    active: activeData,
                    history: historyData,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('mci-data-backup', JSON.stringify(backup));
                
                // Clear contaminated data
                localStorage.removeItem('mci-active-deliveries');
                localStorage.removeItem('mci-delivery-history');
                
                console.log('✅ Contaminated data cleared, backup created');
                return true;
            } else {
                console.log('✅ No contaminated data found');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error checking contaminated data:', error);
            return false;
        }
    }
    
    /**
     * Override DR upload processing to ensure clean data
     */
    function overrideDRUploadProcessing() {
        // Store original functions
        if (typeof window.originalProcessDRUpload === 'undefined' && typeof window.processDRUpload === 'function') {
            window.originalProcessDRUpload = window.processDRUpload;
        }
        
        // Enhanced DR upload processing
        window.processDRUpload = function(data) {
            console.log('🧹 Enhanced processDRUpload with contamination cleanup');
            
            if (!Array.isArray(data)) {
                console.error('❌ Invalid DR upload data');
                return;
            }
            
            // Clean the data and mark as new booking
            const cleanedData = cleanDeliveryData(data, true);
            
            // Ensure all records have Active status and proper dates
            cleanedData.forEach(record => {
                record.status = 'Active'; // Force Active status
                
                // Use selected delivery date or today
                const selectedDate = getSelectedDeliveryDate();
                record.deliveryDate = selectedDate;
                record.delivery_date = selectedDate;
                record.bookedDate = selectedDate;
                record.booked_date = selectedDate;
                
                // Add creation timestamp
                record.created_at = new Date().toISOString();
                record.timestamp = new Date().toISOString();
                
                console.log(`✅ Processed clean DR upload: ${record.drNumber || record.dr_number} - Status: ${record.status}, Date: ${record.deliveryDate}`);
            });
            
            // Call original function with cleaned data
            if (typeof window.originalProcessDRUpload === 'function') {
                return window.originalProcessDRUpload(cleanedData);
            } else {
                console.warn('⚠️ Original processDRUpload function not found');
                return cleanedData;
            }
        };
        
        console.log('✅ DR upload processing overridden with contamination cleanup');
    }
    
    /**
     * Override data loading to prevent contamination
     */
    function overrideDataLoading() {
        // Store original localStorage loading function
        if (typeof window.originalLoadFromLocalStorage === 'undefined' && typeof window.loadFromLocalStorage === 'function') {
            window.originalLoadFromLocalStorage = window.loadFromLocalStorage;
        }
        
        // Enhanced localStorage loading with contamination prevention
        window.loadFromLocalStorage = function() {
            console.log('🧹 Enhanced loadFromLocalStorage with contamination prevention');
            
            try {
                const savedActive = localStorage.getItem('mci-active-deliveries');
                const savedHistory = localStorage.getItem('mci-delivery-history');
                
                if (savedActive) {
                    let parsedActive = JSON.parse(savedActive);
                    
                    // Clean and validate active deliveries
                    parsedActive = cleanDeliveryData(parsedActive, false);
                    
                    // Filter out any completed items that shouldn't be in active
                    parsedActive = parsedActive.filter(d => 
                        d.status !== 'Completed' && d.status !== 'Signed'
                    );
                    
                    window.activeDeliveries = parsedActive;
                    console.log(`✅ Loaded ${parsedActive.length} clean active deliveries`);
                }
                
                if (savedHistory) {
                    let parsedHistory = JSON.parse(savedHistory);
                    
                    // Clean and validate history
                    parsedHistory = cleanDeliveryData(parsedHistory, false);
                    
                    // Ensure only completed items are in history
                    parsedHistory = parsedHistory.filter(d => 
                        d.status === 'Completed' || d.status === 'Signed'
                    );
                    
                    window.deliveryHistory = parsedHistory;
                    console.log(`✅ Loaded ${parsedHistory.length} clean delivery history records`);
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced loadFromLocalStorage:', error);
                
                // Fallback to original function if available
                if (typeof window.originalLoadFromLocalStorage === 'function') {
                    window.originalLoadFromLocalStorage();
                }
            }
        };
        
        console.log('✅ Data loading overridden with contamination prevention');
    }
    
    /**
     * Get selected delivery date (from delivery date enhancement)
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
     * Force refresh all data to apply cleanup
     */
    function forceDataRefresh() {
        console.log('🔄 Forcing data refresh with cleanup...');
        
        // Clear contaminated data first
        const wasContaminated = clearContaminatedData();
        
        if (wasContaminated) {
            // Reload from clean sources
            if (typeof window.loadActiveDeliveries === 'function') {
                window.loadActiveDeliveries();
            }
            if (typeof window.loadDeliveryHistory === 'function') {
                window.loadDeliveryHistory();
            }
            
            console.log('✅ Data refreshed after contamination cleanup');
        }
    }
    
    /**
     * Initialize the data contamination cleanup fix
     */
    function initDataContaminationCleanupFix() {
        console.log('🚀 Initializing Data Contamination Cleanup Fix...');
        
        // Clear any existing contaminated data
        clearContaminatedData();
        
        // Override DR upload processing
        overrideDRUploadProcessing();
        
        // Override data loading
        overrideDataLoading();
        
        // Force refresh after a delay to ensure clean state
        setTimeout(() => {
            forceDataRefresh();
        }, 2000);
        
        // Set up periodic cleanup
        setInterval(() => {
            // Re-override functions to ensure they're not replaced
            overrideDRUploadProcessing();
            overrideDataLoading();
        }, 30000); // Every 30 seconds
        
        console.log('✅ Data Contamination Cleanup Fix initialized');
        console.log('🧹 New DR uploads will have Active status and correct dates');
        console.log('🛡️ Old contaminated data has been cleaned up');
    }
    
    // Export functions globally
    window.cleanDeliveryData = cleanDeliveryData;
    window.clearContaminatedData = clearContaminatedData;
    window.forceDataRefresh = forceDataRefresh;
    window.initDataContaminationCleanupFix = initDataContaminationCleanupFix;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDataContaminationCleanupFix);
    } else {
        initDataContaminationCleanupFix();
    }
    
    console.log('✅ Data Contamination Cleanup Fix loaded successfully');
    
})();

// Export module info
window.dataContaminationCleanupFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Prevents old localStorage data from contaminating new DR bookings',
    timestamp: new Date().toISOString()
};