/**
 * DELIVERY HISTORY FIX
 * Ensures signed DR items are properly saved to Delivery History
 */

console.log('🔧 Loading Delivery History Fix...');

// Override the signature completion process to ensure delivery history works
(function() {
    'use strict';
    
    // Store original functions
    const originalUpdateDeliveryStatus = window.updateDeliveryStatus;
    const originalLoadDeliveryHistory = window.loadDeliveryHistory;
    
    // Enhanced delivery status update that guarantees history saving
    window.updateDeliveryStatus = function(drNumber, newStatus) {
        console.log(`🔄 FIXED updateDeliveryStatus: ${drNumber} -> ${newStatus}`);
        
        try {
            // Ensure arrays exist
            if (!window.activeDeliveries) {
                window.activeDeliveries = [];
                console.log('⚠️ Initialized activeDeliveries array');
            }
            if (!window.deliveryHistory) {
                window.deliveryHistory = [];
                console.log('⚠️ Initialized deliveryHistory array');
            }
            
            // Find delivery in active deliveries
            const deliveryIndex = window.activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            console.log(`📍 Found delivery at index: ${deliveryIndex}`);
            
            if (deliveryIndex !== -1) {
                const delivery = window.activeDeliveries[deliveryIndex];
                
                // Update delivery status
                delivery.status = newStatus;
                delivery.completedDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                delivery.completedTime = new Date().toLocaleTimeString();
                delivery.signedAt = new Date().toISOString();
                
                console.log(`✅ Updated delivery: ${delivery.drNumber || delivery.dr_number} -> ${newStatus}`);
                
                // If completed, move to history
                if (newStatus === 'Completed') {
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
                        status: 'Completed',
                        completedDate: delivery.completedDate,
                        completedTime: delivery.completedTime,
                        signedAt: delivery.signedAt,
                        createdDate: delivery.createdDate || delivery.created_date || delivery.timestamp || ''
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
                        forceRefreshDeliveryHistory();
                    }, 200);
                    
                    return true;
                }
            } else {
                console.error(`❌ Delivery ${drNumber} not found in activeDeliveries`);
                console.log('Available deliveries:', window.activeDeliveries.map(d => d.drNumber || d.dr_number));
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error in updateDeliveryStatus:', error);
            return false;
        }
    };
    
    // Update delivery UI
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
    
    // Force refresh delivery history without database interference
    function forceRefreshDeliveryHistory() {
        console.log('🔄 Force refreshing delivery history view...');
        
        const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
        if (!deliveryHistoryTableBody) {
            console.error('❌ Delivery history table body not found');
            return;
        }
        
        // Use current global delivery history
        const currentDeliveryHistory = window.deliveryHistory || [];
        console.log(`📊 Using ${currentDeliveryHistory.length} items from delivery history`);
        
        if (currentDeliveryHistory.length === 0) {
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
        
        // Generate table rows
        const tableRows = currentDeliveryHistory.map(delivery => {
            const statusInfo = getStatusInfo(delivery.status);
            
            // Check if this delivery has been signed - FIXED: Use correct field names
            const deliveryDrNumber = delivery.drNumber || delivery.dr_number || '';
            const isSigned = ePodRecords.some(record => (record.dr_number || record.drNumber || '') === deliveryDrNumber);
            
            // Build status display
            let statusDisplay = `
                <span class="badge ${statusInfo.class}">
                    <i class="bi ${statusInfo.icon}"></i> ${delivery.status}
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
                    <td>${delivery.completedDate || 'N/A'}</td>
                    <td><strong>${deliveryDrNumber}</strong></td>
                    <td>${delivery.customerName || delivery.customer_name || 'N/A'}</td>
                    <td>${delivery.vendorNumber || delivery.vendor_number || 'N/A'}</td>
                    <td>${delivery.origin || 'N/A'}</td>
                    <td>${delivery.destination || 'N/A'}</td>
                    <td>${delivery.truckPlateNumber || delivery.truck_plate_number || 'N/A'} (${delivery.truckType || delivery.truck_type || 'N/A'})</td>
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
        console.log(`✅ Delivery history table updated with ${currentDeliveryHistory.length} items`);
        
        // Update search results info if needed
        const historySearchResultsInfo = document.getElementById('historySearchResultsInfo');
        if (historySearchResultsInfo) {
            historySearchResultsInfo.style.display = 'none';
        }
    }
    
    // Helper function to get status info
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
    
    // Override loadDeliveryHistory to prevent database interference
    window.loadDeliveryHistory = function() {
        console.log('🔄 FIXED loadDeliveryHistory called');
        forceRefreshDeliveryHistory();
    };
    
    // Enhanced signature save process
    window.enhancedSignatureComplete = function(drNumber) {
        console.log(`🖊️ Enhanced signature completion for: ${drNumber}`);
        
        // Update status and move to history
        const success = window.updateDeliveryStatus(drNumber, 'Completed');
        
        if (success) {
            console.log('✅ Signature completion successful');
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('E-POD saved successfully! Delivery moved to history.', 'success');
            }
            
            // Refresh active deliveries view
            if (typeof window.loadActiveDeliveries === 'function') {
                setTimeout(() => {
                    window.loadActiveDeliveries();
                }, 300);
            }
            
            return true;
        } else {
            console.error('❌ Signature completion failed');
            
            if (typeof showToast === 'function') {
                showToast('Failed to complete signature process. Please try again.', 'error');
            }
            
            return false;
        }
    };
    
    console.log('✅ Delivery History Fix loaded successfully');
    
})();

// Add to window for external access
window.forceRefreshDeliveryHistory = function() {
    const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
    if (!deliveryHistoryTableBody) {
        console.error('❌ Delivery history table body not found');
        return;
    }
    
    const currentDeliveryHistory = window.deliveryHistory || [];
    console.log(`🔄 Force refresh: ${currentDeliveryHistory.length} items`);
    
    if (currentDeliveryHistory.length === 0) {
        deliveryHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <i class="bi bi-clipboard-check" style="font-size: 3rem; opacity: 0.3;"></i>
                    <h4 class="mt-3">No delivery history found</h4>
                    <p class="text-muted">No completed deliveries yet</p>
                </td>
            </tr>
        `;
    } else {
        window.loadDeliveryHistory();
    }
};