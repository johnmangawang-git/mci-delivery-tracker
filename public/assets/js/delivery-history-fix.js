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
                
                // Only set completion date if it doesn't already exist to preserve original completion time
                if (!delivery.completedDate && !delivery.completedDateTime && !delivery.signedAt) {
                    delivery.completedDate = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    delivery.completedTime = new Date().toLocaleTimeString();
                    delivery.signedAt = new Date().toISOString();
                }
                
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
                    <td>${(() => {
                        // FORCE MMDDYYYYHHmmss format for delivery history
                        let date = null;
                        const dateSources = [
                            delivery.completedDateTime,
                            delivery.completed_date_time,
                            delivery.signedAt,
                            delivery.signed_at,
                            delivery.completedDate,
                            delivery.completed_date,
                            delivery.lastStatusUpdate,
                            delivery.timestamp,
                            delivery.created_at
                        ];
                        
                        // Find first valid date
                        for (const dateSource of dateSources) {
                            if (dateSource) {
                                if (typeof dateSource === 'string' && /^\d{14}$/.test(dateSource)) {
                                    return dateSource; // Already in correct format
                                }
                                try {
                                    date = new Date(dateSource);
                                    if (!isNaN(date.getTime())) break;
                                } catch (e) { continue; }
                            }
                        }
                        
                        if (!date || isNaN(date.getTime())) {
                            date = new Date(); // Use current time if no valid date found
                        }
                        
                        // Format to MMDDYYYYHHmmss
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const seconds = String(date.getSeconds()).padStart(2, '0');
                        
                        return `${month}${day}${year}${hours}${minutes}${seconds}`;
                    })()}</td>
                    <td><strong>${deliveryDrNumber}</strong></td>
                    <td>${delivery.customerName || delivery.customer_name || 'N/A'}</td>
                    <td>${delivery.vendorNumber || delivery.vendor_number || 'N/A'}</td>
                    <td>${delivery.origin || 'N/A'}</td>
                    <td>${delivery.destination || 'N/A'}</td>
                    <td>${delivery.additionalCosts ? `₱${delivery.additionalCosts.toFixed(2)}` : '₱0.00'}</td>
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

// DELETE FUNCTIONALITY FOR DELIVERY HISTORY
// Add delete functionality with admin password protection
(function() {
    'use strict';
    
    let deleteMode = false;
    
    // Function to toggle delete mode
    window.toggleDeliveryHistoryDeleteMode = function() {
        deleteMode = !deleteMode;
        const checkboxes = document.querySelectorAll('.delivery-history-checkbox');
        const deleteButton = document.getElementById('deleteSelectedHistoryBtn');
        const toggleDeleteBtn = document.getElementById('toggleDeleteModeBtn');
        
        if (deleteMode) {
            // Show checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'block';
            });
            
            // Update button text
            if (toggleDeleteBtn) {
                toggleDeleteBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel Delete';
                toggleDeleteBtn.className = 'btn btn-secondary btn-sm';
            }
            
            // Show delete button
            if (deleteButton) {
                deleteButton.style.display = 'inline-block';
            }
            
            console.log('🗑️ Delete mode activated');
        } else {
            // Hide checkboxes and uncheck all
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
                checkbox.checked = false;
            });
            
            // Update button text
            if (toggleDeleteBtn) {
                toggleDeleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete Records';
                toggleDeleteBtn.className = 'btn btn-danger btn-sm';
            }
            
            // Hide delete button
            if (deleteButton) {
                deleteButton.style.display = 'none';
            }
            
            console.log('🗑️ Delete mode deactivated');
        }
    };
    
    // Function to delete selected delivery history records
    window.deleteSelectedDeliveryHistory = function() {
        const selectedCheckboxes = document.querySelectorAll('.delivery-history-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Please select at least one record to delete.', 'warning');
            } else {
                alert('Please select at least one record to delete.');
            }
            return;
        }
        
        // Get selected DR numbers
        const selectedDrNumbers = Array.from(selectedCheckboxes).map(checkbox => 
            checkbox.getAttribute('data-dr-number')
        );
        
        console.log('🗑️ Selected DR numbers for deletion:', selectedDrNumbers);
        
        // Show admin password confirmation modal
        showAdminPasswordModal(selectedDrNumbers);
    };
    
    // Function to show admin password confirmation modal
    function showAdminPasswordModal(drNumbers) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="adminPasswordModal" tabindex="-1" aria-labelledby="adminPasswordModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="adminPasswordModalLabel">
                                <i class="bi bi-shield-exclamation"></i> Admin Authentication Required
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle"></i>
                                <strong>Warning:</strong> You are about to permanently delete ${drNumbers.length} delivery record${drNumbers.length > 1 ? 's' : ''}.
                                This action cannot be undone.
                            </div>
                            <div class="mb-3">
                                <strong>Records to be deleted:</strong>
                                <ul class="mt-2">
                                    ${drNumbers.map(dr => `<li>DR Number: <strong>${dr}</strong></li>`).join('')}
                                </ul>
                            </div>
                            <div class="mb-3">
                                <!-- SECURITY: Hidden fake fields to confuse browser auto-fill -->
                                <input type="text" style="display: none;" autocomplete="username">
                                <input type="password" style="display: none;" autocomplete="current-password">
                                
                                <label for="adminPassword" class="form-label">
                                    <i class="bi bi-key"></i> Admin Password:
                                </label>
                                <input type="password" class="form-control" id="adminPassword" placeholder="Enter admin password" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-form-type="other" readonly onfocus="this.removeAttribute('readonly');">
                                <div class="invalid-feedback" id="passwordError" style="display: none;">
                                    Incorrect admin password. Please try again.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle"></i> Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                                <i class="bi bi-trash"></i> Delete Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('adminPasswordModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Initialize modal
        const modal = new bootstrap.Modal(document.getElementById('adminPasswordModal'));
        const passwordInput = document.getElementById('adminPassword');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const passwordError = document.getElementById('passwordError');
        
        // Focus on password input when modal is shown and ensure it's always empty
        document.getElementById('adminPasswordModal').addEventListener('shown.bs.modal', function() {
            // SECURITY: Aggressively clear password field to prevent auto-fill
            passwordInput.value = '';
            passwordInput.setAttribute('value', '');
            
            // Clear multiple times with timeouts to override browser auto-fill
            setTimeout(() => {
                passwordInput.value = '';
                passwordInput.setAttribute('value', '');
            }, 10);
            
            setTimeout(() => {
                passwordInput.value = '';
                passwordInput.setAttribute('value', '');
            }, 50);
            
            setTimeout(() => {
                passwordInput.value = '';
                passwordInput.setAttribute('value', '');
                passwordInput.focus();
            }, 100);
            
            // Also clear any validation states
            passwordInput.classList.remove('is-invalid');
            passwordError.style.display = 'none';
        });
        
        // Handle focus event to remove readonly and clear field
        passwordInput.addEventListener('focus', function() {
            this.removeAttribute('readonly');
            this.value = '';
            this.setAttribute('value', '');
        });
        
        // Handle Enter key in password input
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });
        
        // Handle confirm delete button
        confirmBtn.addEventListener('click', function() {
            const password = passwordInput.value;
            
            // Check admin password
            if (password === 'adminadmin') {
                // SECURITY: Clear password immediately after successful authentication
                passwordInput.value = '';
                // Password correct, proceed with deletion
                performDeletion(drNumbers);
                modal.hide();
            } else {
                // Password incorrect, show error
                passwordInput.classList.add('is-invalid');
                passwordError.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
        
        // Clean up modal when hidden
        document.getElementById('adminPasswordModal').addEventListener('hidden.bs.modal', function() {
            // SECURITY: Clear password field before removing modal
            const passwordField = document.getElementById('adminPassword');
            if (passwordField) {
                passwordField.value = '';
            }
            this.remove();
        });
        
        // Show modal
        modal.show();
    }
    
    // Function to perform the actual deletion
    function performDeletion(drNumbers) {
        console.log('🗑️ Performing deletion of DR numbers:', drNumbers);
        
        try {
            // Get current delivery history
            let currentDeliveryHistory = window.deliveryHistory || [];
            
            // Filter out the selected records
            const originalCount = currentDeliveryHistory.length;
            currentDeliveryHistory = currentDeliveryHistory.filter(delivery => {
                const deliveryDrNumber = delivery.drNumber || delivery.dr_number || '';
                return !drNumbers.includes(deliveryDrNumber);
            });
            
            const deletedCount = originalCount - currentDeliveryHistory.length;
            
            // Update global delivery history
            window.deliveryHistory = currentDeliveryHistory;
            
            // Save to localStorage
            localStorage.setItem('mci-delivery-history', JSON.stringify(currentDeliveryHistory));
            
            // Also delete from EPOD records if they exist
            try {
                let ePodRecords = [];
                const ePodData = localStorage.getItem('ePodRecords');
                if (ePodData) {
                    ePodRecords = JSON.parse(ePodData);
                    
                    // Filter out deleted records from EPOD
                    const originalEPodCount = ePodRecords.length;
                    ePodRecords = ePodRecords.filter(record => {
                        const recordDrNumber = record.dr_number || record.drNumber || '';
                        return !drNumbers.includes(recordDrNumber);
                    });
                    
                    // Save updated EPOD records
                    localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
                    
                    const deletedEPodCount = originalEPodCount - ePodRecords.length;
                    if (deletedEPodCount > 0) {
                        console.log(`🗑️ Also deleted ${deletedEPodCount} EPOD record(s)`);
                    }
                }
            } catch (epodError) {
                console.error('Error cleaning up EPOD records:', epodError);
            }
            
            // Refresh the delivery history display
            if (typeof window.loadDeliveryHistory === 'function') {
                window.loadDeliveryHistory();
            } else if (typeof window.forceRefreshDeliveryHistory === 'function') {
                window.forceRefreshDeliveryHistory();
            }
            
            // Turn off delete mode
            window.toggleDeliveryHistoryDeleteMode();
            
            // Show success message
            const message = `Successfully deleted ${deletedCount} delivery record${deletedCount > 1 ? 's' : ''}.`;
            if (typeof showToast === 'function') {
                showToast(message, 'success');
            } else {
                alert(message);
            }
            
            console.log(`✅ Successfully deleted ${deletedCount} delivery records`);
            
        } catch (error) {
            console.error('❌ Error during deletion:', error);
            
            const errorMessage = 'Failed to delete records. Please try again.';
            if (typeof showToast === 'function') {
                showToast(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        }
    }
    
    console.log('✅ Delivery History Delete functionality loaded');
    
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
                <td colspan="11" class="text-center py-5">
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