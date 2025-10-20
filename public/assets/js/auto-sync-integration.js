/**
 * AUTO-SYNC INTEGRATION
 * Integrates auto-sync functionality with existing code
 * Replaces manual save operations with auto-sync versions
 */

console.log('🔗 AUTO-SYNC INTEGRATION: Loading...');

// Wait for all services to be ready
function initAutoSyncIntegration() {
    console.log('🔗 Initializing auto-sync integration...');
    
    // Override existing save functions with auto-sync versions
    if (window.dataService && window.autoSyncService) {
        
        // Store original functions
        const originalSaveDelivery = window.saveDelivery;
        const originalSaveCustomer = window.saveCustomer;
        
        // Replace with auto-sync versions
        window.saveDelivery = async function(delivery) {
            console.log('🔄 OVERRIDE: saveDelivery -> auto-sync');
            try {
                return await window.dataService.saveDeliveryWithSync(delivery);
            } catch (error) {
                console.warn('⚠️ Auto-sync failed, using original method:', error);
                if (originalSaveDelivery) {
                    return await originalSaveDelivery(delivery);
                }
                throw error;
            }
        };
        
        window.saveCustomer = async function(customer) {
            console.log('🔄 OVERRIDE: saveCustomer -> auto-sync');
            try {
                return await window.dataService.saveCustomerWithSync(customer);
            } catch (error) {
                console.warn('⚠️ Auto-sync failed, using original method:', error);
                if (originalSaveCustomer) {
                    return await originalSaveCustomer(customer);
                }
                throw error;
            }
        };
        
        // Add new functions for delivery history
        window.saveDeliveryHistory = async function(historyItem) {
            console.log('🔄 NEW: saveDeliveryHistory -> auto-sync');
            return await window.dataService.saveDeliveryHistoryWithSync(historyItem);
        };
        
        // Add sync status to UI
        addSyncStatusToUI();
        
        console.log('✅ AUTO-SYNC INTEGRATION: Functions overridden');
        
    } else {
        console.warn('⚠️ AUTO-SYNC INTEGRATION: Services not ready, retrying...');
        setTimeout(initAutoSyncIntegration, 2000);
    }
}

/**
 * Add sync status indicator to the UI
 */
function addSyncStatusToUI() {
    // Add sync status to the top navigation
    const navbar = document.querySelector('.navbar-nav');
    if (navbar && !document.getElementById('syncStatus')) {
        const syncStatusHtml = `
            <li class="nav-item">
                <span class="nav-link" id="syncStatus" title="Data Sync Status">
                    <i class="bi bi-cloud-check text-success" id="syncIcon"></i>
                    <span id="syncText" class="d-none d-md-inline ms-1">Synced</span>
                </span>
            </li>
        `;
        navbar.insertAdjacentHTML('beforeend', syncStatusHtml);
        
        // Update sync status periodically
        setInterval(updateSyncStatusUI, 5000);
        console.log('✅ Sync status indicator added to UI');
    }
}

/**
 * Update sync status in the UI
 */
function updateSyncStatusUI() {
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    
    if (!syncIcon || !syncText) return;
    
    const status = window.dataService ? window.dataService.getSyncStatus() : null;
    
    if (!status) {
        syncIcon.className = 'bi bi-cloud-slash text-muted';
        syncText.textContent = 'Offline';
        return;
    }
    
    if (!status.online) {
        syncIcon.className = 'bi bi-cloud-slash text-warning';
        syncText.textContent = 'Offline';
    } else if (status.syncInProgress) {
        syncIcon.className = 'bi bi-cloud-arrow-up text-primary';
        syncText.textContent = 'Syncing...';
    } else if (status.queueLength > 0) {
        syncIcon.className = 'bi bi-cloud-arrow-up text-info';
        syncText.textContent = `Queue: ${status.queueLength}`;
    } else {
        syncIcon.className = 'bi bi-cloud-check text-success';
        syncText.textContent = 'Synced';
    }
}

/**
 * Add sync controls to settings page
 */
function addSyncControlsToSettings() {
    const settingsView = document.getElementById('settingsView');
    if (settingsView && !document.getElementById('syncControls')) {
        const syncControlsHtml = `
            <div class="card mt-3" id="syncControls">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="bi bi-cloud-arrow-up me-2"></i>
                        Data Synchronization
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Sync Status</h6>
                            <div id="syncStatusDetails">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi bi-wifi me-2"></i>
                                    <span>Connection: <span id="connectionStatus">Checking...</span></span>
                                </div>
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi bi-list-ul me-2"></i>
                                    <span>Queue: <span id="queueStatus">0 items</span></span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-arrow-repeat me-2"></i>
                                    <span>Status: <span id="syncStatusText">Ready</span></span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Sync Actions</h6>
                            <button class="btn btn-primary btn-sm me-2" onclick="forceSyncAll()">
                                <i class="bi bi-cloud-upload me-1"></i>
                                Force Sync All
                            </button>
                            <button class="btn btn-info btn-sm" onclick="showSyncDetails()">
                                <i class="bi bi-info-circle me-1"></i>
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        settingsView.insertAdjacentHTML('beforeend', syncControlsHtml);
        
        // Update sync details periodically
        setInterval(updateSyncDetails, 3000);
        console.log('✅ Sync controls added to settings');
    }
}

/**
 * Update sync details in settings
 */
function updateSyncDetails() {
    const status = window.dataService ? window.dataService.getSyncStatus() : null;
    
    if (!status) return;
    
    const connectionStatus = document.getElementById('connectionStatus');
    const queueStatus = document.getElementById('queueStatus');
    const syncStatusText = document.getElementById('syncStatusText');
    
    if (connectionStatus) {
        connectionStatus.textContent = status.online ? 'Online' : 'Offline';
        connectionStatus.className = status.online ? 'text-success' : 'text-warning';
    }
    
    if (queueStatus) {
        queueStatus.textContent = `${status.queueLength} items`;
    }
    
    if (syncStatusText) {
        if (status.syncInProgress) {
            syncStatusText.textContent = 'Syncing...';
            syncStatusText.className = 'text-primary';
        } else if (status.queueLength > 0) {
            syncStatusText.textContent = 'Pending';
            syncStatusText.className = 'text-info';
        } else {
            syncStatusText.textContent = 'Up to date';
            syncStatusText.className = 'text-success';
        }
    }
}

/**
 * Show sync details modal
 */
window.showSyncDetails = function() {
    const status = window.dataService ? window.dataService.getSyncStatus() : null;
    
    const details = `
        Connection: ${status?.online ? 'Online' : 'Offline'}
        Queue Length: ${status?.queueLength || 0}
        Sync In Progress: ${status?.syncInProgress ? 'Yes' : 'No'}
        Auto-sync Available: ${status?.autoSyncAvailable !== false ? 'Yes' : 'No'}
        Last Sync: ${status?.lastSync || 'Never'}
    `;
    
    alert('Sync Status Details:\n\n' + details);
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAutoSyncIntegration, 3000);
        setTimeout(addSyncControlsToSettings, 4000);
    });
} else {
    setTimeout(initAutoSyncIntegration, 3000);
    setTimeout(addSyncControlsToSettings, 4000);
}

console.log('✅ AUTO-SYNC INTEGRATION: Loaded');