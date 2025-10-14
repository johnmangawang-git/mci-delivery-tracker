/**
 * CRITICAL DATA PERSISTENCE FIX
 * Prevents loadActiveDeliveries from overwriting unsaved status changes
 * Root cause: loadActiveDeliveries() completely replaces window.activeDeliveries with fresh Supabase data
 */

console.log('🔧 Loading Data Persistence Fix...');

// Track pending status changes that haven't been saved to Supabase yet
window.pendingStatusChanges = new Map();

// Override the problematic loadActiveDeliveries function
const originalLoadActiveDeliveries = window.loadActiveDeliveries;

window.loadActiveDeliveries = async function(forceReload = false) {
    console.log('🛡️ DATA PERSISTENCE FIX: Intercepting loadActiveDeliveries call');
    console.log('🛡️ Force reload:', forceReload);
    console.log('🛡️ Pending changes:', window.pendingStatusChanges.size);
    
    // If we have pending changes and this isn't a forced reload, skip the data reload
    if (window.pendingStatusChanges.size > 0 && !forceReload) {
        console.log('🛡️ BLOCKING data reload - pending status changes detected');
        console.log('🛡️ Pending changes:', Array.from(window.pendingStatusChanges.entries()));
        
        // Just refresh the table display without reloading data
        if (typeof window.populateActiveDeliveriesTable === 'function') {
            window.populateActiveDeliveriesTable();
        } else if (typeof window.minimalLoadActiveDeliveries === 'function') {
            window.minimalLoadActiveDeliveries();
        }
        return;
    }
    
    console.log('🔄 ALLOWING data reload - no pending changes or forced reload');
    
    // Store current data before reload
    const currentData = window.activeDeliveries ? [...window.activeDeliveries] : [];
    
    // Call original function
    if (originalLoadActiveDeliveries) {
        await originalLoadActiveDeliveries();
    }
    
    // After reload, merge any pending changes back in
    if (window.pendingStatusChanges.size > 0) {
        console.log('🔄 Merging pending changes back into reloaded data');
        
        window.activeDeliveries = window.activeDeliveries.map(delivery => {
            const deliveryId = delivery.id;
            if (window.pendingStatusChanges.has(deliveryId)) {
                const pendingChange = window.pendingStatusChanges.get(deliveryId);
                console.log(`🔄 Restoring pending status for ${deliveryId}: ${pendingChange.status}`);
                return {
                    ...delivery,
                    status: pendingChange.status,
                    lastStatusUpdate: pendingChange.timestamp
                };
            }
            return delivery;
        });
        
        // Save merged data back to localStorage
        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
    }
};

// Enhanced updateDeliveryStatusById that tracks pending changes
const originalUpdateDeliveryStatusById = window.updateDeliveryStatusById;

window.updateDeliveryStatusById = async function(deliveryId, newStatus) {
    console.log(`🎯 PERSISTENCE FIX: Status update ${deliveryId} → ${newStatus}`);
    
    // Track this as a pending change
    window.pendingStatusChanges.set(deliveryId, {
        status: newStatus,
        timestamp: new Date().toISOString()
    });
    
    console.log(`📝 Added to pending changes: ${deliveryId} → ${newStatus}`);
    
    // Find and update the delivery locally first
    if (!window.activeDeliveries || window.activeDeliveries.length === 0) {
        console.error('❌ No active deliveries found');
        return;
    }
    
    const deliveryIndex = window.activeDeliveries.findIndex(d => 
        d.id === deliveryId || d.delivery_id === deliveryId || String(d.id) === String(deliveryId)
    );
    
    if (deliveryIndex === -1) {
        console.error(`❌ Delivery ${deliveryId} not found`);
        return;
    }
    
    // Update local data immediately
    const oldStatus = window.activeDeliveries[deliveryIndex].status;
    window.activeDeliveries[deliveryIndex].status = newStatus;
    window.activeDeliveries[deliveryIndex].lastStatusUpdate = new Date().toISOString();
    window.activeDeliveries[deliveryIndex].updated_at = new Date().toISOString();
    
    console.log(`📝 Local update: ${oldStatus} → ${newStatus}`);
    
    // Update localStorage immediately
    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
    
    // Update the UI immediately
    updateSingleTableRow(deliveryId, window.activeDeliveries[deliveryIndex]);
    
    // Close dropdown
    const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Now try to save to Supabase in the background
    try {
        if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
            console.log('💾 Attempting background Supabase save...');
            
            const deliveryToSave = {
                ...window.activeDeliveries[deliveryIndex],
                dr_number: window.activeDeliveries[deliveryIndex].dr_number || window.activeDeliveries[deliveryIndex].drNumber,
                customer_name: window.activeDeliveries[deliveryIndex].customer_name || window.activeDeliveries[deliveryIndex].customerName,
                vendor_number: window.activeDeliveries[deliveryIndex].vendor_number || window.activeDeliveries[deliveryIndex].vendorNumber,
                truck_type: window.activeDeliveries[deliveryIndex].truck_type || window.activeDeliveries[deliveryIndex].truckType,
                truck_plate_number: window.activeDeliveries[deliveryIndex].truck_plate_number || window.activeDeliveries[deliveryIndex].truckPlateNumber,
                created_date: window.activeDeliveries[deliveryIndex].created_date || window.activeDeliveries[deliveryIndex].deliveryDate
            };
            
            const result = await window.dataService.saveDelivery(deliveryToSave);
            console.log('✅ Supabase save successful:', result);
            
            // Remove from pending changes since it's now saved
            window.pendingStatusChanges.delete(deliveryId);
            console.log(`✅ Removed ${deliveryId} from pending changes`);
            
            showStatusUpdateNotification(
                deliveryToSave.dr_number || deliveryToSave.drNumber, 
                oldStatus, 
                newStatus, 
                true
            );
            
        } else {
            console.warn('⚠️ DataService not available - keeping in pending changes');
            showStatusUpdateNotification(
                window.activeDeliveries[deliveryIndex].dr_number || window.activeDeliveries[deliveryIndex].drNumber,
                oldStatus,
                newStatus,
                false
            );
        }
    } catch (error) {
        console.error('❌ Supabase save failed:', error);
        showStatusUpdateNotification(
            window.activeDeliveries[deliveryIndex].dr_number || window.activeDeliveries[deliveryIndex].drNumber,
            oldStatus,
            newStatus,
            false
        );
    }
};

// Function to update single table row
function updateSingleTableRow(deliveryId, updatedDelivery) {
    console.log(`🔄 Updating table row for ${deliveryId}`);
    
    const tableRow = document.querySelector(`tr[data-delivery-id="${deliveryId}"]`);
    if (!tableRow) {
        console.warn(`⚠️ Table row not found for ${deliveryId}`);
        return;
    }
    
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
        }
        
        const dropdown = statusCell.querySelector('.status-dropdown');
        if (dropdown) {
            dropdown.innerHTML = generateStatusOptions(updatedDelivery.status, deliveryId);
        }
    }
}

// Status notification function
function showStatusUpdateNotification(drNumber, oldStatus, newStatus, saved) {
    const notification = document.createElement('div');
    notification.className = `alert ${saved ? 'alert-success' : 'alert-warning'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${saved ? 'bi-check-circle-fill' : 'bi-clock-fill'} me-2"></i>
            <div>
                <strong>DR ${drNumber}</strong><br>
                ${oldStatus} → ${newStatus}
                <br><small class="text-muted">
                    ${saved ? '✅ Saved to database' : '⏳ Saving to database...'}
                </small>
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, saved ? 3000 : 5000);
}

// Status info function
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

// Status options generator
function generateStatusOptions(currentStatus, deliveryId) {
    const availableStatuses = ['Active', 'In Transit', 'On Schedule', 'Delayed'];
    
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

// Function to force save all pending changes
window.savePendingChanges = async function() {
    if (window.pendingStatusChanges.size === 0) {
        console.log('✅ No pending changes to save');
        return;
    }
    
    console.log(`💾 Saving ${window.pendingStatusChanges.size} pending changes...`);
    
    for (const [deliveryId, change] of window.pendingStatusChanges.entries()) {
        try {
            const delivery = window.activeDeliveries.find(d => 
                d.id === deliveryId || d.delivery_id === deliveryId || String(d.id) === String(deliveryId)
            );
            
            if (delivery && window.dataService) {
                await window.dataService.saveDelivery(delivery);
                console.log(`✅ Saved pending change for ${deliveryId}`);
            }
        } catch (error) {
            console.error(`❌ Failed to save pending change for ${deliveryId}:`, error);
        }
    }
    
    // Clear pending changes
    window.pendingStatusChanges.clear();
    console.log('✅ All pending changes processed');
};

// Auto-save pending changes every 30 seconds
setInterval(() => {
    if (window.pendingStatusChanges.size > 0) {
        console.log('🔄 Auto-saving pending changes...');
        window.savePendingChanges();
    }
}, 30000);

// Save pending changes before page unload
window.addEventListener('beforeunload', () => {
    if (window.pendingStatusChanges.size > 0) {
        // Try to save synchronously (limited time)
        navigator.sendBeacon('/api/save-pending', JSON.stringify({
            changes: Array.from(window.pendingStatusChanges.entries()),
            activeDeliveries: window.activeDeliveries
        }));
    }
});

// Override global functions
window.getStatusInfo = getStatusInfo;
window.generateStatusOptions = generateStatusOptions;

console.log('✅ Data Persistence Fix loaded - status changes will now persist!');