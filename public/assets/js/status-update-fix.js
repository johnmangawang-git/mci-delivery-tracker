/**
 * CRITICAL STATUS UPDATE FIX
 * Fixes two major issues:
 * 1. Status changes not persisting to Supabase (reverts on refresh)
 * 2. All items showing same status when one is changed
 */

console.log('🔧 Loading Status Update Fix...');

// Override the problematic updateDeliveryStatusById function
window.updateDeliveryStatusById = async function(deliveryId, newStatus) {
    console.log(`🎯 STATUS FIX: Updating delivery ${deliveryId} to ${newStatus}`);
    console.log(`📊 Current activeDeliveries:`, window.activeDeliveries?.length || 0);
    
    if (!window.activeDeliveries || window.activeDeliveries.length === 0) {
        console.error('❌ No active deliveries found');
        return;
    }
    
    // Find the specific delivery by ID (handle multiple ID formats)
    const deliveryIndex = window.activeDeliveries.findIndex(d => {
        const matches = d.id === deliveryId || 
                       d.delivery_id === deliveryId || 
                       String(d.id) === String(deliveryId);
        return matches;
    });
    
    if (deliveryIndex === -1) {
        console.error(`❌ Delivery with ID ${deliveryId} not found`);
        console.log('Available IDs:', window.activeDeliveries.map(d => ({
            id: d.id, 
            dr_number: d.dr_number || d.drNumber,
            status: d.status
        })));
        return;
    }
    
    console.log(`✅ Found delivery at index ${deliveryIndex}:`, window.activeDeliveries[deliveryIndex]);
    
    // Create a deep copy to avoid reference issues
    const updatedDelivery = JSON.parse(JSON.stringify(window.activeDeliveries[deliveryIndex]));
    const oldStatus = updatedDelivery.status;
    
    // Update the status
    updatedDelivery.status = newStatus;
    updatedDelivery.lastStatusUpdate = new Date().toISOString();
    updatedDelivery.updated_at = new Date().toISOString();
    
    console.log(`📝 Status change: "${oldStatus}" → "${newStatus}"`);
    
    // CRITICAL: Save to Supabase FIRST (central database)
    let supabaseSaveSuccess = false;
    
    try {
        // Check if dataService is available
        if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
            console.log('💾 Attempting Supabase save...');
            
            // Normalize delivery fields for Supabase
            const deliveryForSupabase = {
                ...updatedDelivery,
                // Ensure required fields are present
                dr_number: updatedDelivery.dr_number || updatedDelivery.drNumber,
                customer_name: updatedDelivery.customer_name || updatedDelivery.customerName,
                vendor_number: updatedDelivery.vendor_number || updatedDelivery.vendorNumber,
                truck_type: updatedDelivery.truck_type || updatedDelivery.truckType,
                truck_plate_number: updatedDelivery.truck_plate_number || updatedDelivery.truckPlateNumber,
                created_date: updatedDelivery.created_date || updatedDelivery.deliveryDate || updatedDelivery.timestamp
            };
            
            console.log('📤 Saving to Supabase:', deliveryForSupabase);
            
            const result = await window.dataService.saveDelivery(deliveryForSupabase);
            console.log('✅ Supabase save successful:', result);
            supabaseSaveSuccess = true;
            
            // Update the delivery with any returned data from Supabase
            if (result && result.id) {
                updatedDelivery.id = result.id;
            }
            
        } else {
            console.warn('⚠️ DataService not available - Supabase save skipped');
            console.log('Available window properties:', Object.keys(window).filter(k => k.includes('data') || k.includes('supabase')));
        }
    } catch (error) {
        console.error('❌ CRITICAL: Supabase save failed:', error);
        console.error('❌ Status will revert on page refresh!');
        supabaseSaveSuccess = false;
    }
    
    // Update the local array ONLY if Supabase save succeeded OR if Supabase is not available
    if (supabaseSaveSuccess || !window.dataService) {
        // Replace the specific delivery in the array
        window.activeDeliveries[deliveryIndex] = updatedDelivery;
        console.log(`✅ Updated local delivery at index ${deliveryIndex}`);
        
        // Save to localStorage as backup/sync
        try {
            localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
            console.log('✅ localStorage updated');
        } catch (error) {
            console.error('❌ localStorage save failed:', error);
        }
        
        // Update ONLY the specific table row to avoid refreshing all rows
        updateSingleTableRow(deliveryId, updatedDelivery);
        
        // Close the dropdown
        const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        console.log(`🎉 Status successfully updated: ${oldStatus} → ${newStatus}`);
        
        // Show success notification
        showStatusUpdateNotification(updatedDelivery.dr_number || updatedDelivery.drNumber, oldStatus, newStatus, supabaseSaveSuccess);
        
    } else {
        console.error('❌ Status update failed - Supabase save required but failed');
        alert('Failed to save status change. Please try again.');
    }
};

// Function to update only a single table row (prevents all rows from changing)
function updateSingleTableRow(deliveryId, updatedDelivery) {
    console.log(`🔄 Updating single table row for delivery ${deliveryId}`);
    
    const tableRow = document.querySelector(`tr[data-delivery-id="${deliveryId}"]`);
    if (!tableRow) {
        console.warn(`⚠️ Table row not found for delivery ${deliveryId}, refreshing entire table`);
        // Fallback to full table refresh
        if (typeof window.populateActiveDeliveriesTable === 'function') {
            window.populateActiveDeliveriesTable();
        }
        return;
    }
    
    // Find the status cell and update it
    const statusCell = tableRow.querySelector('.status-dropdown-container');
    if (statusCell) {
        const statusInfo = getStatusInfo(updatedDelivery.status);
        const statusBadge = statusCell.querySelector('.status-clickable');
        
        if (statusBadge) {
            statusBadge.className = `badge ${statusInfo.class} status-clickable`;
            statusBadge.innerHTML = `
                <i class="bi ${statusInfo.icon}"></i> ${updatedDelivery.status}
                <i class="bi bi-chevron-down ms-1" style="font-size: 0.8em;"></i>
            `;
            statusBadge.setAttribute('data-current-status', updatedDelivery.status);
            
            console.log(`✅ Updated status badge for ${deliveryId} to ${updatedDelivery.status}`);
        }
        
        // Update the dropdown options
        const dropdown = statusCell.querySelector('.status-dropdown');
        if (dropdown) {
            dropdown.innerHTML = generateStatusOptions(updatedDelivery.status, deliveryId);
        }
    }
}

// Function to show status update notification
function showStatusUpdateNotification(drNumber, oldStatus, newStatus, supabaseSaved) {
    const notification = document.createElement('div');
    notification.className = `alert ${supabaseSaved ? 'alert-success' : 'alert-warning'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${supabaseSaved ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
            <div>
                <strong>DR ${drNumber}</strong><br>
                Status: ${oldStatus} → ${newStatus}
                ${supabaseSaved ? 
                    '<br><small class="text-muted">✅ Saved to database</small>' : 
                    '<br><small class="text-muted">⚠️ Local only - may revert on refresh</small>'
                }
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Enhanced status info function
function getStatusInfo(status) {
    switch (status) {
        case 'In Transit':
            return { class: 'bg-warning text-dark', icon: 'bi-truck' };
        case 'On Schedule':
            return { class: 'bg-success', icon: 'bi-check-circle' };
        case 'Delayed':
            return { class: 'bg-danger', icon: 'bi-exclamation-triangle' };
        case 'Completed':
            return { class: 'bg-success', icon: 'bi-check-circle-fill' };
        case 'Signed':
            return { class: 'bg-primary', icon: 'bi-pen-fill' };
        case 'Active':
        default:
            return { class: 'bg-secondary', icon: 'bi-clock' };
    }
}

// Enhanced status options generator
function generateStatusOptions(currentStatus, deliveryId) {
    const availableStatuses = ['Active', 'In Transit', 'On Schedule', 'Delayed'];
    
    // Don't allow changing from Completed or Signed status
    if (currentStatus === 'Completed' || currentStatus === 'Signed') {
        return '<div class="status-option disabled text-muted">Status cannot be changed</div>';
    }
    
    return availableStatuses.map(status => {
        const isSelected = status === currentStatus ? 'selected' : '';
        const statusInfo = getStatusInfo(status);
        return `
            <div class="status-option ${isSelected}" 
                 onclick="event.stopPropagation(); updateDeliveryStatusById('${deliveryId}', '${status}')">
                <i class="bi ${statusInfo.icon}"></i> ${status}
            </div>
        `;
    }).join('');
}

// Initialize dataService if not available
function initializeDataService() {
    if (!window.dataService && window.DataService) {
        console.log('🔧 Initializing DataService...');
        window.dataService = new window.DataService();
        console.log('✅ DataService initialized');
    }
}

// Setup function
function setupStatusUpdateFix() {
    console.log('🔧 Setting up Status Update Fix...');
    
    // Initialize dataService
    initializeDataService();
    
    // Override global functions
    window.getStatusInfo = getStatusInfo;
    window.generateStatusOptions = generateStatusOptions;
    
    console.log('✅ Status Update Fix ready');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupStatusUpdateFix);
} else {
    setupStatusUpdateFix();
}

// Also initialize when window loads
window.addEventListener('load', setupStatusUpdateFix);

console.log('✅ Status Update Fix loaded');