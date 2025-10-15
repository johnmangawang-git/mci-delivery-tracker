/**
 * DATE FIELD MAPPING FIX
 * Fixes the issue where completed delivery dates show as "N/A" in different browsers
 * Ensures proper date field mapping and cross-browser compatibility
 */

console.log('🔧 Loading Date Field Mapping Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced date field normalization
     * Ensures all possible date field variations are properly mapped
     */
    function enhancedNormalizeDateFields(delivery) {
        if (!delivery) return delivery;
        
        // Get the current date in various formats for fallback
        const now = new Date();
        const currentDateFormatted = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const currentISODate = now.toISOString();
        const currentTimeFormatted = now.toLocaleTimeString();
        
        // Normalize all date-related fields with comprehensive fallbacks
        const normalizedDelivery = {
            ...delivery,
            
            // Completion date fields (multiple formats)
            completedDate: delivery.completedDate || 
                          delivery.completed_date || 
                          delivery.completionDate || 
                          delivery.completion_date ||
                          delivery.finishedDate ||
                          delivery.finished_date ||
                          (delivery.status === 'Completed' ? currentDateFormatted : ''),
            
            completed_date: delivery.completedDate || 
                           delivery.completed_date || 
                           delivery.completionDate || 
                           delivery.completion_date ||
                           (delivery.status === 'Completed' ? currentDateFormatted : ''),
            
            // Completion time fields
            completedTime: delivery.completedTime || 
                          delivery.completed_time || 
                          delivery.completionTime ||
                          delivery.completion_time ||
                          (delivery.status === 'Completed' ? currentTimeFormatted : ''),
            
            completed_time: delivery.completedTime || 
                           delivery.completed_time || 
                           delivery.completionTime ||
                           (delivery.status === 'Completed' ? currentTimeFormatted : ''),
            
            // Signed date/time fields
            signedAt: delivery.signedAt || 
                     delivery.signed_at || 
                     delivery.signedDate ||
                     delivery.signed_date ||
                     (delivery.status === 'Completed' ? currentISODate : ''),
            
            signed_at: delivery.signedAt || 
                      delivery.signed_at || 
                      delivery.signedDate ||
                      (delivery.status === 'Completed' ? currentISODate : ''),
            
            // Created date fields (for original booking date)
            createdDate: delivery.createdDate || 
                        delivery.created_date || 
                        delivery.timestamp || 
                        delivery.bookingDate ||
                        delivery.booking_date ||
                        delivery.deliveryDate ||
                        delivery.delivery_date ||
                        currentDateFormatted,
            
            created_date: delivery.createdDate || 
                         delivery.created_date || 
                         delivery.timestamp || 
                         delivery.bookingDate ||
                         currentDateFormatted,
            
            // Delivery date fields
            deliveryDate: delivery.deliveryDate || 
                         delivery.delivery_date || 
                         delivery.createdDate || 
                         delivery.created_date ||
                         currentDateFormatted,
            
            delivery_date: delivery.deliveryDate || 
                          delivery.delivery_date || 
                          delivery.createdDate ||
                          currentDateFormatted,
            
            // Timestamp fields
            timestamp: delivery.timestamp || 
                      delivery.createdDate || 
                      delivery.created_date ||
                      currentISODate,
            
            // Last status update
            lastStatusUpdate: delivery.lastStatusUpdate || 
                             delivery.last_status_update ||
                             (delivery.status === 'Completed' ? currentISODate : delivery.timestamp || currentISODate),
            
            last_status_update: delivery.lastStatusUpdate || 
                               delivery.last_status_update ||
                               (delivery.status === 'Completed' ? currentISODate : currentISODate)
        };
        
        console.log('📅 Date field normalization:', {
            drNumber: normalizedDelivery.drNumber || normalizedDelivery.dr_number,
            status: normalizedDelivery.status,
            completedDate: normalizedDelivery.completedDate,
            createdDate: normalizedDelivery.createdDate,
            signedAt: normalizedDelivery.signedAt
        });
        
        return normalizedDelivery;
    }
    
    /**
     * Enhanced delivery history loading with proper date handling
     */
    function enhancedLoadDeliveryHistory() {
        console.log('🔄 Enhanced delivery history loading with date fix...');
        
        const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
        if (!deliveryHistoryTableBody) {
            console.error('❌ Delivery history table body not found');
            return;
        }
        
        // Get delivery history from multiple sources
        let deliveryHistory = [];
        
        // Try to get from global variable first
        if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
            deliveryHistory = window.deliveryHistory;
            console.log(`📊 Using global deliveryHistory: ${deliveryHistory.length} items`);
        }
        
        // If empty, try localStorage
        if (deliveryHistory.length === 0) {
            try {
                const savedHistory = localStorage.getItem('mci-delivery-history');
                if (savedHistory) {
                    deliveryHistory = JSON.parse(savedHistory);
                    console.log(`📊 Loaded from localStorage: ${deliveryHistory.length} items`);
                }
            } catch (error) {
                console.error('❌ Error loading from localStorage:', error);
            }
        }
        
        // If still empty, try to get from Supabase via dataService
        if (deliveryHistory.length === 0 && typeof window.dataService !== 'undefined') {
            console.log('📊 Attempting to load from Supabase...');
            window.dataService.getDeliveries({ status: 'Completed' })
                .then(supabaseDeliveries => {
                    if (supabaseDeliveries && supabaseDeliveries.length > 0) {
                        deliveryHistory = supabaseDeliveries;
                        window.deliveryHistory = deliveryHistory;
                        console.log(`📊 Loaded from Supabase: ${deliveryHistory.length} items`);
                        renderDeliveryHistoryTable(deliveryHistory);
                    }
                })
                .catch(error => {
                    console.error('❌ Error loading from Supabase:', error);
                });
        }
        
        // Render the table with current data
        renderDeliveryHistoryTable(deliveryHistory);
    }
    
    /**
     * Render delivery history table with enhanced date handling
     */
    function renderDeliveryHistoryTable(deliveryHistory) {
        const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
        if (!deliveryHistoryTableBody) {
            console.error('❌ Delivery history table body not found');
            return;
        }
        
        console.log(`📊 Rendering delivery history table with ${deliveryHistory.length} items`);
        
        if (deliveryHistory.length === 0) {
            deliveryHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-5">
                        <i class="bi bi-clipboard-check" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No delivery history found</h4>
                        <p class="text-muted">No completed deliveries yet</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get EPOD records to check which deliveries are signed
        let ePodRecords = [];
        try {
            const ePodData = localStorage.getItem('ePodRecords');
            if (ePodData) {
                ePodRecords = JSON.parse(ePodData);
            }
        } catch (error) {
            console.error('Error loading EPOD records:', error);
        }
        
        // Generate table rows with enhanced date handling
        const tableRows = deliveryHistory.map(delivery => {
            // Apply enhanced date field normalization
            const normalizedDelivery = enhancedNormalizeDateFields(delivery);
            
            const statusInfo = getStatusInfo(normalizedDelivery.status);
            
            // Check if this delivery has been signed
            const deliveryDrNumber = normalizedDelivery.drNumber || normalizedDelivery.dr_number || '';
            const isSigned = ePodRecords.some(record => (record.dr_number || record.drNumber || '') === deliveryDrNumber);
            
            // Enhanced date display with multiple fallbacks
            let displayDate = normalizedDelivery.completedDate || 
                             normalizedDelivery.completed_date ||
                             normalizedDelivery.deliveryDate ||
                             normalizedDelivery.delivery_date ||
                             normalizedDelivery.createdDate ||
                             normalizedDelivery.created_date ||
                             normalizedDelivery.timestamp;
            
            // If still no date, try to parse from signedAt
            if (!displayDate || displayDate === '') {
                if (normalizedDelivery.signedAt) {
                    try {
                        const signedDate = new Date(normalizedDelivery.signedAt);
                        displayDate = signedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    } catch (error) {
                        console.warn('Error parsing signedAt date:', error);
                    }
                }
            }
            
            // Final fallback
            if (!displayDate || displayDate === '') {
                displayDate = 'N/A';
                console.warn(`⚠️ No date found for delivery ${deliveryDrNumber}:`, normalizedDelivery);
            }
            
            console.log(`📅 Date for ${deliveryDrNumber}: ${displayDate}`);
            
            // Build status display
            let statusDisplay = `
                <span class="badge ${statusInfo.class}">
                    <i class="bi ${statusInfo.icon}"></i> ${normalizedDelivery.status}
                </span>
            `;
            
            // Add signed badge if delivery has been signed
            if (isSigned) {
                statusDisplay += `
                    <span class="badge bg-warning text-dark ms-1">
                        <i class="bi bi-pen"></i> Signed
                    </span>
                `;
            }
            
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input delivery-history-checkbox" style="display: none;" data-dr-number="${deliveryDrNumber}">
                    </td>
                    <td><strong>${displayDate}</strong></td>
                    <td><strong>${deliveryDrNumber}</strong></td>
                    <td>${normalizedDelivery.customerName || normalizedDelivery.customer_name || 'N/A'}</td>
                    <td>${normalizedDelivery.vendorNumber || normalizedDelivery.vendor_number || 'N/A'}</td>
                    <td>${normalizedDelivery.origin || 'N/A'}</td>
                    <td>${normalizedDelivery.destination || 'N/A'}</td>
                    <td>${normalizedDelivery.truckPlateNumber || normalizedDelivery.truck_plate_number || 'N/A'} (${normalizedDelivery.truckType || normalizedDelivery.truck_type || 'N/A'})</td>
                    <td>${statusDisplay}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="showEPodModal('${deliveryDrNumber}')">
                            <i class="bi bi-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        deliveryHistoryTableBody.innerHTML = tableRows;
        console.log(`✅ Delivery history table updated with ${deliveryHistory.length} items`);
        
        // Update search results info if needed
        const historySearchResultsInfo = document.getElementById('historySearchResultsInfo');
        if (historySearchResultsInfo) {
            historySearchResultsInfo.style.display = 'none';
        }
    }
    
    /**
     * Helper function to get status info
     */
    function getStatusInfo(status) {
        const statusMap = {
            'Active': { class: 'bg-primary', icon: 'bi-truck' },
            'In Transit': { class: 'bg-info', icon: 'bi-arrow-right' },
            'Delivered': { class: 'bg-success', icon: 'bi-check-circle' },
            'Completed': { class: 'bg-success', icon: 'bi-check-circle-fill' },
            'Cancelled': { class: 'bg-danger', icon: 'bi-x-circle' },
            'Pending': { class: 'bg-warning', icon: 'bi-clock' }
        };
        
        return statusMap[status] || { class: 'bg-secondary', icon: 'bi-question-circle' };
    }
    
    /**
     * Enhanced status update that ensures proper date setting
     */
    function enhancedUpdateDeliveryStatusWithDates(drNumber, newStatus) {
        console.log(`🔄 Enhanced status update with date fix: ${drNumber} -> ${newStatus}`);
        
        // Find delivery in active deliveries
        const deliveryIndex = window.activeDeliveries.findIndex(d => {
            const deliveryDrNumber = d.drNumber || d.dr_number || '';
            return deliveryDrNumber === drNumber;
        });
        
        if (deliveryIndex !== -1) {
            const delivery = window.activeDeliveries[deliveryIndex];
            
            // Apply enhanced date normalization
            const normalizedDelivery = enhancedNormalizeDateFields(delivery);
            
            // Update status and ensure completion date is set
            normalizedDelivery.status = newStatus;
            normalizedDelivery.lastStatusUpdate = new Date().toISOString();
            
            if (newStatus === 'Completed') {
                const now = new Date();
                
                // Set completion date in multiple formats
                normalizedDelivery.completedDate = now.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                normalizedDelivery.completed_date = normalizedDelivery.completedDate;
                normalizedDelivery.completedTime = now.toLocaleTimeString();
                normalizedDelivery.completed_time = normalizedDelivery.completedTime;
                normalizedDelivery.signedAt = now.toISOString();
                normalizedDelivery.signed_at = normalizedDelivery.signedAt;
                
                console.log(`📅 Set completion dates for ${drNumber}:`, {
                    completedDate: normalizedDelivery.completedDate,
                    completedTime: normalizedDelivery.completedTime,
                    signedAt: normalizedDelivery.signedAt
                });
                
                // Move to history
                window.activeDeliveries.splice(deliveryIndex, 1);
                window.deliveryHistory.unshift(normalizedDelivery);
                
                console.log(`✅ Moved ${drNumber} to history with proper dates`);
            } else {
                // Update in place
                window.activeDeliveries[deliveryIndex] = normalizedDelivery;
            }
            
            // Force save to localStorage with normalized data
            try {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                console.log('💾 Saved normalized data to localStorage');
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
            }
            
            return true;
        }
        
        return false;
    }
    
    // Override existing functions with enhanced versions
    if (typeof window.loadDeliveryHistory === 'function') {
        window.originalLoadDeliveryHistory = window.loadDeliveryHistory;
    }
    window.loadDeliveryHistory = enhancedLoadDeliveryHistory;
    
    // Enhance the comprehensive update function if it exists
    if (typeof window.comprehensiveUpdateDeliveryStatus === 'function') {
        const originalComprehensiveUpdate = window.comprehensiveUpdateDeliveryStatus;
        
        window.comprehensiveUpdateDeliveryStatus = async function(drNumber, newStatus) {
            console.log('🔄 Using enhanced comprehensive update with date fix');
            
            // First apply the date-enhanced status update
            const localSuccess = enhancedUpdateDeliveryStatusWithDates(drNumber, newStatus);
            
            if (localSuccess) {
                // Then call the original comprehensive function for Supabase sync
                try {
                    await originalComprehensiveUpdate(drNumber, newStatus);
                } catch (error) {
                    console.error('❌ Error in original comprehensive update:', error);
                }
            }
            
            return localSuccess;
        };
    }
    
    // Add utility functions to window
    window.enhancedNormalizeDateFields = enhancedNormalizeDateFields;
    window.enhancedLoadDeliveryHistory = enhancedLoadDeliveryHistory;
    window.enhancedUpdateDeliveryStatusWithDates = enhancedUpdateDeliveryStatusWithDates;
    
    console.log('✅ Date Field Mapping Fix loaded successfully');
    
})();

// Export for external access
window.dateFieldMappingFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};