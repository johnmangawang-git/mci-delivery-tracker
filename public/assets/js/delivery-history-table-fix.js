/**
 * DELIVERY HISTORY TABLE FIX
 * Updates Delivery History table to match Active Deliveries structure
 * Removes: Additional Costs, Status columns
 * Adds: Truck column
 * Reorders: Columns to match Active Deliveries layout
 */

console.log('📋 Loading Delivery History Table Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced delivery history data mapping
     */
    function enhanceDeliveryHistoryData(historyData) {
        if (!Array.isArray(historyData)) {
            return historyData;
        }
        
        return historyData.map(delivery => {
            // Ensure truck information is available
            const truckType = delivery.truckType || delivery.truck_type || '';
            const truckPlate = delivery.truckPlateNumber || delivery.truck_plate_number || '';
            const truckInfo = delivery.truck || 
                             (truckType && truckPlate ? `${truckType} (${truckPlate})` : truckPlate || 'N/A');
            
            return {
                ...delivery,
                // Ensure truck field is available
                truck: truckInfo,
                truckType: truckType,
                truckPlateNumber: truckPlate,
                // Ensure all new fields are available
                itemNumber: delivery.itemNumber || delivery.item_number || '',
                mobileNumber: delivery.mobileNumber || delivery.mobile_number || '',
                itemDescription: delivery.itemDescription || delivery.item_description || '',
                serialNumber: delivery.serialNumber || delivery.serial_number || ''
            };
        });
    }
    
    /**
     * Generate delivery history table row with new structure
     */
    function generateDeliveryHistoryRow(delivery, index) {
        // Use field mapper for consistent field access
        const getField = window.getFieldValue || ((obj, field) => obj[field]);
        
        const drNumber = getField(delivery, 'drNumber') || getField(delivery, 'dr_number') || 'N/A';
        const customerName = getField(delivery, 'customerName') || getField(delivery, 'customer_name') || 'N/A';
        const vendorNumber = getField(delivery, 'vendorNumber') || getField(delivery, 'vendor_number') || 'N/A';
        const origin = getField(delivery, 'origin') || 'N/A';
        const destination = getField(delivery, 'destination') || 'N/A';
        
        // Get truck information
        const truckInfo = delivery.truck || 'N/A';
        
        // Get status with proper formatting
        const status = delivery.status || 'Completed';
        const statusInfo = window.getStatusInfo ? window.getStatusInfo(status) : { class: 'bg-success', icon: 'bi-check-circle' };
        
        // Get date delivered
        const dateDelivered = delivery.completedDate || delivery.signedDate || 
                             delivery.movedToHistoryDate || delivery.created_at || 'N/A';
        
        // Format date delivered
        let formattedDateDelivered = 'N/A';
        if (dateDelivered && dateDelivered !== 'N/A') {
            try {
                const date = new Date(dateDelivered);
                if (!isNaN(date.getTime())) {
                    formattedDateDelivered = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            } catch (error) {
                formattedDateDelivered = dateDelivered;
            }
        }
        
        // Get new fields
        const itemNumber = getField(delivery, 'itemNumber') || getField(delivery, 'item_number') || '';
        const mobileNumber = getField(delivery, 'mobileNumber') || getField(delivery, 'mobile_number') || '';
        const itemDescription = getField(delivery, 'itemDescription') || getField(delivery, 'item_description') || '';
        const serialNumber = getField(delivery, 'serialNumber') || getField(delivery, 'serial_number') || '';
        
        return `
            <tr data-delivery-id="${delivery.id}">
                <td><input type="checkbox" class="form-check-input history-checkbox" data-delivery-id="${delivery.id}"></td>
                <td><strong>${drNumber}</strong></td>
                <td>${customerName}</td>
                <td>${vendorNumber}</td>
                <td>${origin}</td>
                <td>${destination}</td>
                <td>${truckInfo}</td>
                <td>
                    <span class="badge ${statusInfo.class}">
                        <i class="bi ${statusInfo.icon}"></i> ${status}
                    </span>
                </td>
                <td>${formattedDateDelivered}</td>
                <td>${itemNumber || '-'}</td>
                <td>${mobileNumber || '-'}</td>
                <td>${itemDescription || '-'}</td>
                <td>${serialNumber || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDeliveryHistory('${delivery.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
    
    /**
     * Override loadDeliveryHistory function
     */
    function overrideLoadDeliveryHistory() {
        if (typeof window.loadDeliveryHistory === 'function') {
            const originalLoadDeliveryHistory = window.loadDeliveryHistory;
            
            window.loadDeliveryHistory = function(...args) {
                console.log('📋 Enhanced loadDeliveryHistory with new table structure');
                
                // Call original function
                const result = originalLoadDeliveryHistory.apply(this, args);
                
                // Enhance the data after loading
                setTimeout(() => {
                    if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
                        window.deliveryHistory = enhanceDeliveryHistoryData(window.deliveryHistory);
                        
                        // Re-render table with new structure
                        renderEnhancedDeliveryHistoryTable();
                    }
                }, 100);
                
                return result;
            };
            
            console.log('✅ loadDeliveryHistory function overridden');
        }
    }
    
    /**
     * Render delivery history table with enhanced structure
     */
    function renderEnhancedDeliveryHistoryTable() {
        const tableBody = document.getElementById('deliveryHistoryTableBody');
        if (!tableBody) {
            console.warn('⚠️ Delivery history table body not found');
            return;
        }
        
        const deliveryHistory = window.deliveryHistory || [];
        
        if (deliveryHistory.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="14" class="text-center py-4">
                        <div class="text-muted">
                            <i class="bi bi-inbox display-4 d-block mb-3"></i>
                            <h5>No delivery history found</h5>
                            <p>Completed deliveries will appear here</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows with new structure
        tableBody.innerHTML = deliveryHistory.map((delivery, index) => 
            generateDeliveryHistoryRow(delivery, index)
        ).join('');
        
        console.log(`✅ Rendered ${deliveryHistory.length} delivery history records with enhanced structure`);
    }
    
    /**
     * Ensure data is preserved when moving from active to history
     */
    function enhanceActiveToHistoryTransfer() {
        // Override any function that moves deliveries to history
        const functionsToEnhance = [
            'moveToDeliveryHistory',
            'updateDeliveryStatus',
            'completeDelivery'
        ];
        
        functionsToEnhance.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                const originalFunc = window[funcName];
                
                window[funcName] = function(delivery, ...args) {
                    console.log(`📋 Enhanced ${funcName} - preserving all fields`);
                    
                    // Ensure delivery has all required fields before moving to history
                    if (delivery && typeof delivery === 'object') {
                        // Preserve truck information
                        const truckType = delivery.truckType || delivery.truck_type || '';
                        const truckPlate = delivery.truckPlateNumber || delivery.truck_plate_number || '';
                        delivery.truck = delivery.truck || 
                                        (truckType && truckPlate ? `${truckType} (${truckPlate})` : truckPlate || 'N/A');
                        
                        // Preserve new fields
                        delivery.itemNumber = delivery.itemNumber || delivery.item_number || '';
                        delivery.mobileNumber = delivery.mobileNumber || delivery.mobile_number || '';
                        delivery.itemDescription = delivery.itemDescription || delivery.item_description || '';
                        delivery.serialNumber = delivery.serialNumber || delivery.serial_number || '';
                    }
                    
                    return originalFunc.call(this, delivery, ...args);
                };
                
                console.log(`✅ Enhanced ${funcName} for field preservation`);
            }
        });
    }
    
    /**
     * Initialize delivery history table fix
     */
    function initDeliveryHistoryTableFix() {
        console.log('🚀 Initializing Delivery History Table Fix...');
        
        // Override functions
        overrideLoadDeliveryHistory();
        enhanceActiveToHistoryTransfer();
        
        // Initial render if data exists
        setTimeout(() => {
            if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
                window.deliveryHistory = enhanceDeliveryHistoryData(window.deliveryHistory);
                renderEnhancedDeliveryHistoryTable();
            }
        }, 1000);
        
        // Make functions available globally
        window.deliveryHistoryTableFix = {
            enhanceDeliveryHistoryData,
            generateDeliveryHistoryRow,
            renderEnhancedDeliveryHistoryTable
        };
        
        console.log('✅ Delivery History Table Fix initialized');
        console.log('📋 New structure matches Active Deliveries (minus Status, Booked Date, plus Date Delivered)');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeliveryHistoryTableFix);
    } else {
        initDeliveryHistoryTableFix();
    }
    
    console.log('✅ Delivery History Table Fix loaded');
    
})();