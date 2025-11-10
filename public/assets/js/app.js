/**
 * APP.JS - Main Application Logic
 * 
 * DATABASE-CENTRIC ARCHITECTURE PATTERNS:
 * 
 * 1. DATA LOADING:
 *    - All data is loaded from Supabase via DataService
 *    - NO localStorage reads for business data
 *    - Data is loaded fresh on page load and refreshed as needed
 * 
 * 2. DATA SAVING:
 *    - All saves go through DataService.saveDelivery()
 *    - NO localStorage writes for business data
 *    - UI is updated after successful database save
 * 
 * 3. DATA UPDATES:
 *    - Status updates go through DataService.updateDeliveryStatus()
 *    - Optimistic UI updates with rollback on error
 *    - Real-time updates via RealtimeService
 * 
 * 4. ERROR HANDLING:
 *    - Network errors detected and handled gracefully
 *    - User feedback via toast notifications
 *    - Errors logged via Logger service
 * 
 * 5. REAL-TIME SYNC:
 *    - RealtimeService subscribes to delivery table changes
 *    - UI automatically updates when data changes in database
 *    - Works across multiple browser tabs/windows
 * 
 * See docs/DATASERVICE-API.md for complete API documentation
 */

console.log('app.js loaded');
(function() {
    // CRITICAL: Use window.activeDeliveries directly instead of local variables
    // This ensures data synchronization between booking.js and app.js
    
    // Initialize global arrays if they don't exist
    // These arrays hold data loaded from Supabase for UI state only
    if (typeof window.activeDeliveries === 'undefined') {
        window.activeDeliveries = [];
    }
    if (typeof window.deliveryHistory === 'undefined') {
        window.deliveryHistory = [];
    }
    
    // Use references to global arrays (not local copies)
    // Data in these arrays comes from Supabase via DataService
    let activeDeliveries = window.activeDeliveries;
    let deliveryHistory = window.deliveryHistory;
    let refreshInterval = null;
    let filteredDeliveries = [];
    let filteredHistory = [];
    let currentSearchTerm = '';
    let currentHistorySearchTerm = '';
    
    // Real-time service instance
    let realtimeService = null;

    /**
     * Handle errors with network awareness
     * Requirement 9.2: Show appropriate error messages for offline operations
     */
    function handleNetworkAwareError(error, defaultMessage) {
        console.error('Error occurred:', error);
        
        // Check if it's a network error
        if (error.code === 'NETWORK_OFFLINE' || 
            error.message?.includes('network') || 
            error.message?.includes('internet connection')) {
            
            if (window.networkStatusService) {
                window.networkStatusService.showOfflineError();
            } else {
                showToast('No internet connection. Please check your network.', 'danger');
            }
        } else {
            // Show the default error message
            showToast(defaultMessage || 'An error occurred. Please try again.', 'danger');
        }
    }

    // Pagination state
    let paginationState = {
        active: {
            currentPage: 1,
            pageSize: 50,
            totalPages: 1,
            totalCount: 0,
            isLoading: false
        },
        history: {
            currentPage: 1,
            pageSize: 50,
            totalPages: 1,
            totalCount: 0,
            isLoading: false
        }
    };

    // Test function to check if modals are working
    function testModalFunctionality() {
        console.log('=== TESTING MODAL FUNCTIONALITY ===');
        
        // Check if Bootstrap is available
        console.log('Bootstrap available:', typeof bootstrap !== 'undefined');
        
        // Check if modal utility functions are available
        console.log('showModal available:', typeof window.showModal === 'function');
        console.log('hideModal available:', typeof window.hideModal === 'function');
        console.log('cleanupAllBackdrops available:', typeof window.cleanupAllBackdrops === 'function');
        
        // Test each modal
        const modals = ['bookingModal', 'addCustomerModal', 'editCustomerModal', 'eSignatureModal'];
        modals.forEach(modalId => {
            const modalElement = document.getElementById(modalId);
            console.log(`${modalId} exists:`, !!modalElement);
            if (modalElement) {
                console.log(`${modalId} Bootstrap instance:`, bootstrap.Modal.getInstance(modalElement));
            }
        });
        
        console.log('=== MODAL TEST COMPLETE ===');
    }

    // Make test function globally available
    window.testModalFunctionality = testModalFunctionality;

    // Functions
    function getStatusInfo(status) {
        switch (status) {
            case 'In Transit':
                return { class: 'bg-primary', icon: 'bi-truck', color: '#0d6efd' };
            case 'On Schedule':
                return { class: 'bg-success', icon: 'bi-check-circle', color: '#198754' };
            case 'Sold Undelivered':
                return { class: 'bg-warning', icon: 'bi-exclamation-triangle', color: '#ffc107' };
            case 'Active':
                return { class: 'bg-info', icon: 'bi-arrow-repeat', color: '#0dcaf0' };
            case 'Delayed':
                return { class: 'bg-danger', icon: 'bi-exclamation-circle', color: '#dc3545' };
            case 'Completed':
                return { class: 'bg-success', icon: 'bi-check-circle-fill', color: '#198754' };
            case 'Signed':
                return { class: 'bg-success', icon: 'bi-check-circle-fill', color: '#198754' };
            default:
                return { class: 'bg-secondary', icon: 'bi-question-circle', color: '#6c757d' };
        }
    }

    // Generate status options based on current status and business rules
    function generateStatusOptions(currentStatus, deliveryId) {
        const availableStatuses = ['In Transit', 'On Schedule', 'Sold Undelivered', 'Active'];
        
        // Don't allow changing from Completed or Signed status
        if (currentStatus === 'Completed' || currentStatus === 'Signed') {
            return `<div class="status-option disabled" style="padding: 10px; text-align: center; color: #6c757d;">Status cannot be changed</div>`;
        }
        
        return availableStatuses.map(status => {
            const isSelected = status === currentStatus ? 'selected' : '';
            const statusInfo = getStatusInfo(status);
            return `
                <div class="status-option ${isSelected}" 
                     data-delivery-id="${deliveryId}" 
                     data-status="${status}"
                     style="padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; border-left: 4px solid ${statusInfo.color};"
                     onmouseover="this.style.backgroundColor='${statusInfo.color}15'; this.style.paddingLeft='15px';"
                     onmouseout="this.style.backgroundColor=''; this.style.paddingLeft='10px';">
                    <span class="badge ${statusInfo.class}" style="min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                        <i class="bi ${statusInfo.icon}"></i>
                    </span>
                    <span style="font-weight: ${isSelected ? '600' : '400'}; color: ${isSelected ? statusInfo.color : '#212529'};">${status}</span>
                    ${isSelected ? '<i class="bi bi-check2 ms-auto" style="color: ' + statusInfo.color + ';"></i>' : ''}
                </div>
            `;
        }).join('');
    }

    // Toggle status dropdown visibility
    function toggleStatusDropdown(deliveryId) {
        console.log('🔄 toggleStatusDropdown called for delivery:', deliveryId);
        
        // Close all other dropdowns first
        document.querySelectorAll('.status-dropdown').forEach(dropdown => {
            if (dropdown.id !== `statusDropdown-${deliveryId}`) {
                dropdown.style.display = 'none';
                console.log('Closed dropdown:', dropdown.id);
            }
        });
        
        // Toggle current dropdown
        const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
        console.log('Found dropdown element:', dropdown);
        
        if (dropdown) {
            const newDisplay = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
            dropdown.style.display = newDisplay;
            console.log('Dropdown display changed to:', newDisplay);
            
            if (newDisplay === 'block') {
                console.log('Dropdown content:', dropdown.innerHTML);
            }
        } else {
            console.error('❌ Dropdown not found for delivery:', deliveryId);
        }
    }

    // Update delivery status by delivery ID (for dropdown)
    async function updateDeliveryStatusById(deliveryId, newStatus) {
        console.log(`🔄 updateDeliveryStatusById called - Delivery: ${deliveryId}, New Status: ${newStatus}`);
        console.log('Active deliveries count:', activeDeliveries.length);
        
        // Find the delivery and update its status (handle both id formats)
        const deliveryIndex = activeDeliveries.findIndex(d => 
            d.id === deliveryId || d.delivery_id === deliveryId || 
            String(d.id) === String(deliveryId));
        
        console.log('Found delivery at index:', deliveryIndex);
        
        if (deliveryIndex !== -1) {
            const delivery = activeDeliveries[deliveryIndex];
            const oldStatus = delivery.status;
            const drNumber = delivery.dr_number || delivery.drNumber;
            
            console.log('📦 Delivery before update:', {
                id: delivery.id,
                dr_number: drNumber,
                oldStatus: oldStatus,
                newStatus: newStatus
            });
            
            // Optimistic UI update
            delivery.status = newStatus;
            delivery.lastStatusUpdate = new Date().toISOString();
            
            // Update the global array immediately for UI responsiveness
            window.activeDeliveries[deliveryIndex] = delivery;
            
            // Update UI immediately
            if (typeof populateActiveDeliveriesTable === 'function') {
                populateActiveDeliveriesTable();
            }
            
            try {
                // Use DataService to update status
                if (!window.dataService) {
                    throw new Error('DataService not available');
                }
                
                console.log('💾 Updating status via DataService...');
                
                // Log the operation
                if (window.Logger) {
                    window.Logger.info('Updating delivery status', {
                        drNumber,
                        oldStatus,
                        newStatus,
                        deliveryId: delivery.id
                    });
                }
                
                // Use DataService update method
                await window.dataService.update('deliveries', delivery.id, {
                    status: newStatus,
                    updated_at: new Date().toISOString()
                });
                
                console.log('✅ Status saved to Supabase successfully - DR:', drNumber, 'Status:', newStatus);
                
                // Show success message
                showToast(`Status updated from "${oldStatus}" to "${newStatus}"`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save to Supabase:', error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, 'updateDeliveryStatusById');
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error('Failed to update delivery status', {
                        drNumber,
                        oldStatus,
                        newStatus,
                        error: error.message,
                        stack: error.stack
                    });
                }
                
                showToast('Failed to update status in database', 'danger');
                
                // Rollback the status change
                delivery.status = oldStatus;
                window.activeDeliveries[deliveryIndex] = delivery;
                
                // Refresh UI to show rollback
                if (typeof populateActiveDeliveriesTable === 'function') {
                    populateActiveDeliveriesTable();
                } else {
                    loadActiveDeliveries();
                }
                return;
            }
            
            // Update analytics dashboard stats
            if (typeof window.updateDashboardStats === 'function') {
                setTimeout(() => {
                    window.updateDashboardStats();
                }, 100);
            }
            
            // Close the dropdown
            const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    }

    // Update delivery status by DR number (for signature completion)
    async function updateDeliveryStatus(drNumber, newStatus) {
        console.log(`Updating DR ${drNumber} status to: ${newStatus}`);
        
        try {
            // Find delivery by DR number and update status
            const deliveryIndex = activeDeliveries.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
            if (deliveryIndex === -1) {
                console.warn(`Delivery with DR ${drNumber} not found in active deliveries`);
                showToast(`Delivery ${drNumber} not found`, 'warning');
                return;
            }
            
            const delivery = activeDeliveries[deliveryIndex];
            const oldStatus = delivery.status;
            
            // Optimistic UI update
            delivery.status = newStatus;
            delivery.lastStatusUpdate = window.getLocalSystemTimeISO ? window.getLocalSystemTimeISO() : new Date().toISOString();
            
            // If status is Completed, move to delivery history
            if (newStatus === 'Completed') {
                // Set completion timestamp ONLY if it doesn't exist
                if ((!delivery.completedDate || delivery.completedDate === '') && 
                    (!delivery.completedDateTime || delivery.completedDateTime === '') && 
                    (!delivery.signedAt || delivery.signedAt === '')) {
                    
                    const now = new Date();
                    delivery.completedDate = now.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    delivery.completedDateTime = now.toISOString();
                    delivery.signedAt = now.toISOString();
                    
                    console.log('🔒 Set completion timestamp:', {
                        dr: drNumber,
                        completedDate: delivery.completedDate,
                        completedDateTime: delivery.completedDateTime
                    });
                } else {
                    console.log('🔒 Completion date already exists, preserving original:', {
                        dr: drNumber,
                        completedDate: delivery.completedDate,
                        completedDateTime: delivery.completedDateTime
                    });
                }
                
                // Move to delivery history in memory
                if (!deliveryHistory) {
                    window.deliveryHistory = [];
                    deliveryHistory = window.deliveryHistory;
                }
                deliveryHistory.unshift(delivery);
                activeDeliveries.splice(deliveryIndex, 1);
                window.deliveryHistory = deliveryHistory;
                window.activeDeliveries = activeDeliveries;
                
                console.log(`✅ Moved DR ${drNumber} from active to history with preserved dates`);
            }
            
            try {
                // Save to Supabase using DataService
                if (!window.dataService) {
                    throw new Error('DataService not available');
                }
                
                // Log the operation
                if (window.Logger) {
                    window.Logger.info('Updating delivery status', {
                        drNumber,
                        oldStatus,
                        newStatus,
                        completedDate: delivery.completedDate,
                        completedDateTime: delivery.completedDateTime
                    });
                }
                
                await window.dataService.saveDelivery(delivery);
                console.log('✅ Delivery saved to Supabase with completion dates');
                
                // Refresh the display
                loadActiveDeliveries();
                loadDeliveryHistory();
                
                // Update analytics dashboard stats
                if (typeof window.updateDashboardStats === 'function') {
                    setTimeout(() => {
                        window.updateDashboardStats();
                    }, 100);
                }
                
                showToast(`Delivery ${drNumber} status updated to ${newStatus}`, 'success');
                console.log(`Successfully updated DR ${drNumber} from "${oldStatus}" to "${newStatus}"`);
                
            } catch (error) {
                console.error('❌ Error saving delivery to Supabase:', error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, 'updateDeliveryStatus');
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error('Failed to save delivery status update', {
                        drNumber,
                        oldStatus,
                        newStatus,
                        error: error.message,
                        stack: error.stack
                    });
                }
                
                // Rollback on error
                delivery.status = oldStatus;
                if (newStatus === 'Completed') {
                    // Move back to active deliveries
                    const historyIndex = deliveryHistory.findIndex(d => (d.drNumber || d.dr_number) === drNumber);
                    if (historyIndex !== -1) {
                        deliveryHistory.splice(historyIndex, 1);
                        activeDeliveries.push(delivery);
                        window.deliveryHistory = deliveryHistory;
                        window.activeDeliveries = activeDeliveries;
                    }
                }
                
                // Refresh display to show rollback
                loadActiveDeliveries();
                loadDeliveryHistory();
                
                showToast(`Failed to update delivery ${drNumber}`, 'danger');
                throw error;
            }
        } catch (error) {
            console.error('Error updating delivery status:', error);
            
            // Use ErrorHandler for consistent error processing
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'updateDeliveryStatus');
            }
            
            // Log the error
            if (window.Logger) {
                window.Logger.error('Error in updateDeliveryStatus function', {
                    drNumber,
                    newStatus,
                    error: error.message,
                    stack: error.stack
                });
            }
            
            showToast('Error updating delivery status', 'danger');
        }
    }

    // Event delegation for status clicks - using capture phase for better reliability
    document.addEventListener('click', function(event) {
        console.log('Click detected on:', event.target, 'Classes:', event.target.className);
        
        // Handle status badge clicks to toggle dropdown
        const statusBadge = event.target.closest('.status-clickable');
        if (statusBadge) {
            event.preventDefault();
            event.stopPropagation();
            const deliveryId = statusBadge.dataset.deliveryId;
            console.log('✅ Status badge clicked! Delivery ID:', deliveryId);
            if (deliveryId) {
                toggleStatusDropdown(deliveryId);
            }
            return;
        }
        
        // Handle status option clicks
        const statusOption = event.target.closest('.status-option');
        if (statusOption && !statusOption.classList.contains('disabled')) {
            event.preventDefault();
            event.stopPropagation();
            const deliveryId = statusOption.dataset.deliveryId;
            const newStatus = statusOption.dataset.status;
            
            console.log('✅ Status option clicked! Delivery ID:', deliveryId, 'New Status:', newStatus);
            
            if (deliveryId && newStatus) {
                updateDeliveryStatusById(deliveryId, newStatus);
            }
            return;
        }
        
        // Close dropdowns when clicking outside
        if (!event.target.closest('.status-dropdown-container')) {
            const dropdowns = document.querySelectorAll('.status-dropdown');
            if (dropdowns.length > 0) {
                console.log('Closing', dropdowns.length, 'dropdowns');
                dropdowns.forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
            }
        }
    }, true); // Use capture phase

    // REMOVED: checkAndCleanLocalStorage() - No longer needed with database-centric architecture

    // Make status functions globally accessible
    window.toggleStatusDropdown = toggleStatusDropdown;
    window.updateDeliveryStatusById = updateDeliveryStatusById;
    window.generateStatusOptions = generateStatusOptions;
    window.getStatusInfo = getStatusInfo;

    // Legacy function for status change handling (keeping for compatibility)
    async function handleStatusChange(e) {
        const deliveryId = e.target.dataset.deliveryId;
        const newStatus = e.target.value;
        console.log(`Status changed for delivery ${deliveryId} to ${newStatus}`);
        
        // Find the delivery and update its status
        const deliveryIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
        if (deliveryIndex !== -1) {
            const delivery = activeDeliveries[deliveryIndex];
            const oldStatus = delivery.status;
            
            // Optimistic UI update
            delivery.status = newStatus;
            
            // If status is changed to "Completed", move to history
            if (newStatus === 'Completed') {
                // COMPLETION TIMESTAMP (when DR is e-signed/completed)
                // Only set completion date if it doesn't already exist to preserve original completion time
                if ((!delivery.completedDate || delivery.completedDate === '') && 
                    (!delivery.completedDateTime || delivery.completedDateTime === '') && 
                    (!delivery.signedAt || delivery.signedAt === '')) {
                    if (window.createCompletionTimestamp) {
                        const completionData = window.createCompletionTimestamp();
                        Object.assign(delivery, completionData);
                    } else {
                        // Fallback for backward compatibility
                        delivery.completedDate = new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                        delivery.completedDateTime = new Date().toISOString();
                    }
                }
                
                // Move to history in memory
                deliveryHistory.unshift(delivery);
                activeDeliveries.splice(deliveryIndex, 1);
                window.deliveryHistory = deliveryHistory;
                window.activeDeliveries = activeDeliveries;
            }
            
            try {
                // Save to database using DataService
                if (!window.dataService) {
                    throw new Error('DataService not available');
                }
                
                // Log the operation
                if (window.Logger) {
                    window.Logger.info('Saving delivery status change', {
                        deliveryId,
                        oldStatus,
                        newStatus,
                        completedDate: delivery.completedDate
                    });
                }
                
                await window.dataService.saveDelivery(delivery);
                console.log('✅ Delivery saved to Supabase');
                
                // Refresh views
                loadActiveDeliveries();
                loadDeliveryHistory();
                
                // Update analytics dashboard stats
                if (typeof window.updateDashboardStats === 'function') {
                    setTimeout(() => {
                        window.updateDashboardStats();
                    }, 100);
                }
                
                showToast(`Delivery status updated to ${newStatus}`, 'success');
                
            } catch (error) {
                console.error('❌ Error saving delivery:', error);
                
                // Use ErrorHandler for consistent error processing
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, 'handleStatusChange');
                }
                
                // Log the error
                if (window.Logger) {
                    window.Logger.error('Failed to save delivery status change', {
                        deliveryId,
                        oldStatus,
                        newStatus,
                        error: error.message,
                        stack: error.stack
                    });
                }
                
                // Rollback on error
                delivery.status = oldStatus;
                if (newStatus === 'Completed') {
                    // Move back to active deliveries
                    const historyIndex = deliveryHistory.findIndex(d => d.id === deliveryId);
                    if (historyIndex !== -1) {
                        deliveryHistory.splice(historyIndex, 1);
                        activeDeliveries.push(delivery);
                        window.deliveryHistory = deliveryHistory;
                        window.activeDeliveries = activeDeliveries;
                    }
                }
                
                // Refresh views to show rollback
                loadActiveDeliveries();
                loadDeliveryHistory();
                
                showToast('Failed to update delivery status', 'danger');
            }
        }
    }

    // Placeholder function for showing E-Signature modal - now using robust implementation
    function showESignatureModal(drNumber) {
        console.log(`Showing E-Signature modal for DR: ${drNumber}`);
        
        // Use the new robust E-Signature implementation if available
        if (typeof window.openRobustSignaturePad === 'function') {
            // Try to get real delivery data from active deliveries
            let customerName = '';
            let customerContact = '';
            let truckPlate = '';
            let deliveryRoute = '';
            
            // Find the delivery in activeDeliveries array
            if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                const delivery = window.activeDeliveries.find(d => d.drNumber === drNumber);
                if (delivery) {
                    customerName = delivery.customerName || '';
                    customerContact = delivery.vendorNumber || '';
                    truckPlate = delivery.truckPlateNumber || '';
                    deliveryRoute = (delivery.origin && delivery.destination) ? 
                        `${delivery.origin} to ${delivery.destination}` : '';
                }
            }
            
            window.openRobustSignaturePad(drNumber, customerName, customerContact, truckPlate, deliveryRoute);
        } else {
            // Fallback to original implementation
            // Set delivery details in modal
            document.getElementById('ePodDrNumber').value = drNumber;
            // In a real app, you would fetch these details from your data
            document.getElementById('ePodCustomerName').value = '';
            document.getElementById('ePodCustomerContact').value = '';
            document.getElementById('ePodTruckPlate').value = '';
            document.getElementById('ePodDeliveryRoute').value = '';
            
            // Show modal using our utility function if available
            if (typeof window.showModal === 'function') {
                window.showModal('eSignatureModal');
            } else {
                // Fallback method
                const eSignatureModal = new bootstrap.Modal(document.getElementById('eSignatureModal'));
                eSignatureModal.show();
            }
        }
    }

    // Placeholder function for showing E-POD modal
    function showEPodModal(drNumber) {
        console.log(`Showing E-POD modal for DR: ${drNumber}`);
        // This would be implemented in another file
        alert(`E-POD functionality for ${drNumber} would be implemented here`);
    }

    // REMOVED: saveToDatabase() - No longer needed, using DataService directly
    // REMOVED: loadFromDatabase() - No longer needed, using DataService directly
    // REMOVED: preserveCompletionDates() - Dates are now managed in memory during session only
    // All localStorage operations have been removed per database-centric architecture requirements

    // Show toast notification
    function showToast(message, type = 'success') {
        // Create toast element if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Show the toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove the toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }

    // Export Active Deliveries to Excel
    function exportActiveDeliveriesToExcel() {
        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                showToast('Excel export library not loaded. Please try again.', 'error');
                return;
            }

            // Get data to export (filtered or all)
            const dataToExport = currentSearchTerm ? filteredDeliveries : activeDeliveries;
            
            if (dataToExport.length === 0) {
                showToast('No data to export', 'warning');
                return;
            }

            // Prepare data for export
            const exportData = dataToExport.map(delivery => ({
                'DR Number': delivery.drNumber || 'N/A',
                'Origin': delivery.origin || 'N/A',
                'Destination': delivery.destination || 'N/A',
                'Distance': delivery.distance || 'N/A',
                'Truck': delivery.truckPlateNumber || 'N/A',
                'Status': delivery.status || 'N/A',
                'Booked Date': window.formatExportDate ? window.formatExportDate(delivery.deliveryDate || delivery.timestamp) : (delivery.deliveryDate || delivery.timestamp || 'N/A'),
                'Additional Costs': delivery.additionalCosts ? `₱${delivery.additionalCosts.toFixed(2)}` : '₱0.00'
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            ws['!cols'] = [
                { wch: 15 }, // DR Number
                { wch: 25 }, // Origin
                { wch: 25 }, // Destination
                { wch: 12 }, // Distance
                { wch: 15 }, // Truck
                { wch: 15 }, // Status
                { wch: 15 }, // Booked Date
                { wch: 15 }  // Additional Costs
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Active Deliveries');
            
            // Generate filename with date
            const date = new Date().toISOString().split('T')[0];
            const searchTerm = currentSearchTerm ? `_${currentSearchTerm.replace(/\s+/g, '_')}` : '';
            const filename = `Active_Deliveries_${date}${searchTerm}.xlsx`;
            
            // Export to file
            XLSX.writeFile(wb, filename);
            
            showToast(`Exported ${dataToExport.length} delivery records to ${filename}`, 'success');
        } catch (error) {
            console.error('Error exporting Active Deliveries:', error);
            showToast('Error exporting data. Please try again.', 'error');
        }
    }

    // Export Delivery History to Excel
    function exportDeliveryHistoryToExcel() {
        try {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                showToast('Excel export library not loaded. Please try again.', 'error');
                return;
            }

            // Get data to export (filtered or all)
            const dataToExport = currentHistorySearchTerm ? filteredHistory : deliveryHistory;
            
            if (dataToExport.length === 0) {
                showToast('No data to export', 'warning');
                return;
            }

            // Prepare data for export
            const exportData = dataToExport.map(delivery => ({
                'Date': window.formatExportDate ? window.formatExportDate(delivery.completedDateTime || delivery.completedDate) : (delivery.completedDate || 'N/A'),
                'DR Number': delivery.drNumber || 'N/A',
                'Customer Name': delivery.customerName || 'N/A',
                'Vendor Number': delivery.vendorNumber || 'N/A',
                'Origin': delivery.origin || 'N/A',
                'Destination': delivery.destination || 'N/A',
                'Distance': delivery.distance || 'N/A',
                'Additional Costs': delivery.additionalCosts ? `₱${delivery.additionalCosts.toFixed(2)}` : '₱0.00',
                'Status': delivery.status || 'N/A'
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            ws['!cols'] = [
                { wch: 15 }, // Date
                { wch: 15 }, // DR Number
                { wch: 25 }, // Customer Name
                { wch: 25 }, // Customer Number
                { wch: 25 }, // Origin
                { wch: 25 }, // Destination
                { wch: 12 }, // Distance
                { wch: 15 }, // Additional Costs
                { wch: 15 }  // Status
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Delivery History');
            
            // Generate filename with date
            const date = new Date().toISOString().split('T')[0];
            const searchTerm = currentHistorySearchTerm ? `_${currentHistorySearchTerm.replace(/\s+/g, '_')}` : '';
            const filename = `Delivery_History_${date}${searchTerm}.xlsx`;
            
            // Export to file
            XLSX.writeFile(wb, filename);
            
            showToast(`Exported ${dataToExport.length} delivery records to ${filename}`, 'success');
        } catch (error) {
            console.error('Error exporting Delivery History:', error);
            showToast('Error exporting data. Please try again.', 'error');
        }
    }

    // Load active deliveries with pagination
    async function loadActiveDeliveriesWithPagination(page = null) {
        console.log('=== LOAD ACTIVE DELIVERIES WITH PAGINATION ===');
        
        // Use provided page or current page from state
        const targetPage = page !== null ? page : paginationState.active.currentPage;
        
        // Prevent multiple simultaneous loads
        if (paginationState.active.isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }
        
        paginationState.active.isLoading = true;
        
        // Show loading state
        const activeDeliveriesTableBody = document.getElementById('activeDeliveriesTableBody');
        if (activeDeliveriesTableBody) {
            activeDeliveriesTableBody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3 text-muted">Loading deliveries (Page ${targetPage})...</p>
                    </td>
                </tr>
            `;
        }
        
        try {
            // Load directly from DataService with pagination
            if (!window.dataService) {
                throw new Error('DataService not available');
            }
            
            const result = await window.dataService.getDeliveriesWithPagination({
                page: targetPage,
                pageSize: paginationState.active.pageSize,
                filters: {
                    status: ['In Transit', 'On Schedule', 'Sold Undelivered', 'Active']
                }
            });
            
            // Normalize field names
            const normalizedDeliveries = window.normalizeDeliveryArray ? 
                window.normalizeDeliveryArray(result.data) : result.data;
            
            // Update active deliveries
            activeDeliveries = normalizedDeliveries;
            window.activeDeliveries = activeDeliveries;
            
            // Update pagination state
            paginationState.active.currentPage = result.pagination.page;
            paginationState.active.totalPages = result.pagination.totalPages;
            paginationState.active.totalCount = result.pagination.totalCount;
            
            console.log('✅ Loaded from Supabase:', {
                page: result.pagination.page,
                pageSize: result.pagination.pageSize,
                totalPages: result.pagination.totalPages,
                totalCount: result.pagination.totalCount,
                deliveriesOnPage: activeDeliveries.length
            });
            
            // Log first few deliveries to see their status
            if (activeDeliveries.length > 0) {
                console.log('📊 Sample deliveries loaded:');
                activeDeliveries.slice(0, 3).forEach((d, i) => {
                    console.log(`  ${i + 1}. DR: ${d.dr_number || d.drNumber}, Status: ${d.status}`);
                });
            }
            
            // Populate table with fresh data from database
            populateActiveDeliveriesTable();
            
            // Update pagination controls
            updatePaginationControls('active');
            
        } catch (error) {
            console.error('❌ Error loading from Supabase:', error);
            
            // Use ErrorHandler for consistent error processing
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'loadActiveDeliveriesWithPagination');
            }
            
            // Log the error
            if (window.Logger) {
                window.Logger.error('Failed to load active deliveries with pagination', {
                    page: targetPage,
                    pageSize: paginationState.active.pageSize,
                    error: error.message,
                    stack: error.stack
                });
            }
            
            // Handle error with network awareness
            handleNetworkAwareError(error, 'Failed to load deliveries from database');
            
            // Show error message in table
            if (activeDeliveriesTableBody) {
                const isOffline = error.code === 'NETWORK_OFFLINE' || 
                                 error.message?.includes('network') || 
                                 error.message?.includes('internet connection');
                
                activeDeliveriesTableBody.innerHTML = `
                    <tr>
                        <td colspan="13" class="text-center py-5">
                            <i class="bi bi-${isOffline ? 'wifi-off' : 'exclamation-triangle'} text-danger" style="font-size: 3rem;"></i>
                            <h4 class="mt-3">${isOffline ? 'No Internet Connection' : 'Failed to load deliveries from database'}</h4>
                            <p class="text-muted">${isOffline ? 'Please check your internet connection and try again' : (error.message || 'Please try again')}</p>
                            <button class="btn btn-primary mt-3" onclick="window.loadActiveDeliveriesWithPagination()">
                                <i class="bi bi-arrow-clockwise"></i> Retry
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            showToast('Failed to load active deliveries', 'danger');
        } finally {
            paginationState.active.isLoading = false;
        }
    }

    // Load active deliveries (legacy function - now uses pagination)
    async function loadActiveDeliveries() {
        await loadActiveDeliveriesWithPagination(1);
    }

    // Separate function to populate the Active Deliveries table
    function populateActiveDeliveriesTable() {
        console.log('📊 Populating Active Deliveries table...');
        
        const activeDeliveriesTableBody = document.getElementById('activeDeliveriesTableBody');
        if (!activeDeliveriesTableBody) {
            console.error('❌ Active deliveries table body not found');
            return;
        }
        
        // Ensure we have the latest data and filter out completed deliveries
        activeDeliveries = (window.activeDeliveries || []).filter(delivery => 
            delivery.status !== 'Completed'
        );
        
        // Apply search filter using global field mapper
        filteredDeliveries = currentSearchTerm ? 
            activeDeliveries.filter(delivery => {
                const getField = window.getFieldValue || ((obj, field) => obj[field]);
                const drNumber = getField(delivery, 'drNumber') || getField(delivery, 'dr_number') || '';
                return drNumber.toLowerCase().includes(currentSearchTerm.toLowerCase());
            }) : 
            [...activeDeliveries];
    
        // Update search results info
        const searchResultsInfo = document.getElementById('searchResultsInfo');
        if (searchResultsInfo) {
            if (currentSearchTerm) {
                searchResultsInfo.innerHTML = `
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        Found ${filteredDeliveries.length} delivery${filteredDeliveries.length !== 1 ? 's' : ''} 
                        matching "${currentSearchTerm}"
                    </div>
                `;
                searchResultsInfo.style.display = 'block';
            } else {
                searchResultsInfo.style.display = 'none';
            }
        }
        
        // Debug logging
        console.log('📊 Active Deliveries Debug Info:');
        console.log('- Local activeDeliveries:', activeDeliveries.length);
        console.log('- Window activeDeliveries:', window.activeDeliveries ? window.activeDeliveries.length : 'undefined');
        console.log('- Filtered deliveries:', filteredDeliveries.length);
        console.log('- Current search term:', currentSearchTerm);
        
        if (filteredDeliveries.length > 0) {
            console.log('- Sample delivery:', filteredDeliveries[0]);
        }
        
        // Display deliveries
        if (filteredDeliveries.length === 0) {
            activeDeliveriesTableBody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-center py-5">
                        <i class="bi bi-truck" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No active deliveries found</h4>
                        <p class="text-muted">
                            ${currentSearchTerm ? 'Try adjusting your search criteria' : 'All deliveries are completed or there are no deliveries yet'}
                        </p>
                    </td>
                </tr>
            `;
            console.log('📊 Displayed empty state message');
            return;
        }
        
        // Generate table rows
        activeDeliveriesTableBody.innerHTML = filteredDeliveries.map((delivery, index) => {
            const statusInfo = getStatusInfo(delivery.status);
            
            // Debug logging for first few deliveries to identify field structure
            if (index < 3) {
                console.log(`🔍 Delivery ${index} structure:`, delivery);
                console.log(`🔍 Available fields:`, Object.keys(delivery));
                console.log(`🔍 Field values check:`, {
                    'delivery.dr_number': delivery.dr_number,
                    'delivery.drNumber': delivery.drNumber,
                    'delivery.customer_name': delivery.customer_name,
                    'delivery.customerName': delivery.customerName,
                    'delivery.origin': delivery.origin,
                    'delivery.destination': delivery.destination
                });
            }
            
            // Use global field mapper for consistent field access
            const getField = window.getFieldValue || ((obj, field) => {
                console.log(`⚠️ Field mapper not available, using fallback for field: ${field}`);
                return obj[field];
            });
            
            const drNumber = getField(delivery, 'drNumber') || getField(delivery, 'dr_number') || 'N/A';
            const customerName = getField(delivery, 'customerName') || getField(delivery, 'customer_name') || 'N/A';
            const vendorNumber = getField(delivery, 'vendorNumber') || getField(delivery, 'vendor_number') || 'N/A';
            const origin = getField(delivery, 'origin') || 'N/A';
            const destination = getField(delivery, 'destination') || 'N/A';
            
            const truckType = getField(delivery, 'truckType') || getField(delivery, 'truck_type') || '';
            const truckPlate = getField(delivery, 'truckPlateNumber') || getField(delivery, 'truck_plate_number') || '';
            const truckInfo = delivery.truck || 
                             (truckType && truckPlate ? `${truckType} (${truckPlate})` : truckPlate || 'N/A');
            
            // Use enhanced date formatting for Active Deliveries
            const deliveryDate = window.formatActiveDeliveryDate ? 
                window.formatActiveDeliveryDate(delivery) :
                getField(delivery, 'deliveryDate') || getField(delivery, 'created_date') || 
                getField(delivery, 'timestamp') || getField(delivery, 'created_at') || 'N/A';
            
            // Get new fields
            const itemNumber = getField(delivery, 'itemNumber') || getField(delivery, 'item_number') || '';
            const mobileNumber = getField(delivery, 'mobileNumber') || getField(delivery, 'mobile_number') || '';
            const itemDescription = getField(delivery, 'itemDescription') || getField(delivery, 'item_description') || '';
            const serialNumber = getField(delivery, 'serialNumber') || getField(delivery, 'serial_number') || '';
            
            return `
                <tr data-delivery-id="${delivery.id}">
                    <td><input type="checkbox" class="form-check-input delivery-checkbox" data-delivery-id="${delivery.id}"></td>
                    <td><strong>${drNumber}</strong></td>
                    <td>${customerName}</td>
                    <td>${vendorNumber}</td>
                    <td>${origin}</td>
                    <td>${destination}</td>
                    <td>${truckInfo}</td>
                    <td>
                        <div class="status-dropdown-container">
                            <span class="badge ${statusInfo.class} status-clickable" 
                                  data-delivery-id="${delivery.id}" 
                                  data-current-status="${delivery.status}">
                                <i class="bi ${statusInfo.icon}"></i> ${delivery.status}
                                <i class="bi bi-chevron-down ms-1" style="font-size: 0.8em;"></i>
                            </span>
                            <div class="status-dropdown" id="statusDropdown-${delivery.id}" style="display: none;">
                                ${generateStatusOptions(delivery.status, delivery.id)}
                            </div>
                        </div>
                    </td>
                    <td>${deliveryDate}</td>
                    <td>${itemNumber}</td>
                    <td>${mobileNumber}</td>
                    <td>${itemDescription}</td>
                    <td>${serialNumber}</td>
                </tr>
            `;
        }).join('');
        
        console.log(`✅ Successfully populated table with ${filteredDeliveries.length} deliveries`);
        
        // Update booking view dashboard with real data
        if (typeof window.updateBookingViewDashboard === 'function') {
            setTimeout(() => {
                window.updateBookingViewDashboard();
            }, 100);
        }
    }

    // Load delivery history with pagination
    async function loadDeliveryHistoryWithPagination(page = null) {
        console.log('=== LOAD DELIVERY HISTORY WITH PAGINATION ===');
        
        // Use provided page or current page from state
        const targetPage = page !== null ? page : paginationState.history.currentPage;
        
        // Prevent multiple simultaneous loads
        if (paginationState.history.isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }
        
        paginationState.history.isLoading = true;
        
        // Show loading state
        const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
        if (deliveryHistoryTableBody) {
            deliveryHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="15" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3 text-muted">Loading delivery history (Page ${targetPage})...</p>
                    </td>
                </tr>
            `;
        }
        
        try {
            // Load directly from DataService with pagination
            if (!window.dataService) {
                throw new Error('DataService not available');
            }
            
            const result = await window.dataService.getDeliveriesWithPagination({
                page: targetPage,
                pageSize: paginationState.history.pageSize,
                filters: {
                    status: ['Completed', 'Signed']
                }
            });
            
            // Normalize field names
            const normalizedDeliveries = window.normalizeDeliveryArray ? 
                window.normalizeDeliveryArray(result.data) : result.data;
            
            // Update delivery history
            deliveryHistory = normalizedDeliveries;
            window.deliveryHistory = deliveryHistory;
            
            // Update pagination state
            paginationState.history.currentPage = result.pagination.page;
            paginationState.history.totalPages = result.pagination.totalPages;
            paginationState.history.totalCount = result.pagination.totalCount;
            
            console.log('✅ Loaded from Supabase:', {
                page: result.pagination.page,
                pageSize: result.pagination.pageSize,
                totalPages: result.pagination.totalPages,
                totalCount: result.pagination.totalCount,
                deliveriesOnPage: deliveryHistory.length
            });
            
            // Populate table with fresh data from database
            await populateDeliveryHistoryTable();
            
            // Update pagination controls
            updatePaginationControls('history');
            
        } catch (error) {
            console.error('❌ Error loading from Supabase:', error);
            
            // Use ErrorHandler for consistent error processing
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'loadDeliveryHistoryWithPagination');
            }
            
            // Log the error
            if (window.Logger) {
                window.Logger.error('Failed to load delivery history with pagination', {
                    page: targetPage,
                    pageSize: paginationState.history.pageSize,
                    error: error.message,
                    stack: error.stack
                });
            }
            
            // Handle error with network awareness
            handleNetworkAwareError(error, 'Failed to load delivery history from database');
            
            // Show error message in table
            if (deliveryHistoryTableBody) {
                const isOffline = error.code === 'NETWORK_OFFLINE' || 
                                 error.message?.includes('network') || 
                                 error.message?.includes('internet connection');
                
                deliveryHistoryTableBody.innerHTML = `
                    <tr>
                        <td colspan="15" class="text-center py-5">
                            <i class="bi bi-${isOffline ? 'wifi-off' : 'exclamation-triangle'} text-danger" style="font-size: 3rem;"></i>
                            <h4 class="mt-3">${isOffline ? 'No Internet Connection' : 'Failed to load delivery history from database'}</h4>
                            <p class="text-muted">${isOffline ? 'Please check your internet connection and try again' : (error.message || 'Please try again')}</p>
                            <button class="btn btn-primary mt-3" onclick="window.loadDeliveryHistoryWithPagination()">
                                <i class="bi bi-arrow-clockwise"></i> Retry
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            showToast('Failed to load delivery history', 'danger');
        } finally {
            paginationState.history.isLoading = false;
        }
    }

    // Update pagination controls for a specific view
    function updatePaginationControls(view) {
        const state = paginationState[view];
        const containerId = view === 'active' ? 'activePaginationControls' : 'historyPaginationControls';
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Pagination container not found: ${containerId}`);
            return;
        }
        
        // Don't show pagination if there's only one page
        if (state.totalPages <= 1) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        
        const { currentPage, totalPages, totalCount, pageSize } = state;
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, totalCount);
        
        // Generate page numbers to display (show max 7 page buttons)
        let pageNumbers = [];
        if (totalPages <= 7) {
            // Show all pages
            pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Show first, last, current, and nearby pages
            if (currentPage <= 4) {
                pageNumbers = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (currentPage >= totalPages - 3) {
                pageNumbers = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }
        
        // Build pagination HTML
        let paginationHTML = `
            <div class="d-flex align-items-center gap-3 flex-wrap">
                <div class="text-muted small">
                    Showing ${startItem}-${endItem} of ${totalCount} deliveries
                </div>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-secondary" 
                            onclick="window.changePage('${view}', ${currentPage - 1})"
                            ${currentPage === 1 ? 'disabled' : ''}>
                        <i class="bi bi-chevron-left"></i> Previous
                    </button>
                    ${pageNumbers.map(pageNum => {
                        if (pageNum === '...') {
                            return '<button class="btn btn-sm btn-outline-secondary" disabled>...</button>';
                        }
                        return `
                            <button class="btn btn-sm ${pageNum === currentPage ? 'btn-primary' : 'btn-outline-secondary'}" 
                                    onclick="window.changePage('${view}', ${pageNum})"
                                    ${pageNum === currentPage ? 'disabled' : ''}>
                                ${pageNum}
                            </button>
                        `;
                    }).join('')}
                    <button class="btn btn-sm btn-outline-secondary" 
                            onclick="window.changePage('${view}', ${currentPage + 1})"
                            ${currentPage === totalPages ? 'disabled' : ''}>
                        Next <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
                <select class="form-select form-select-sm" style="width: auto;" 
                        onchange="window.changePageSize('${view}', this.value)">
                    <option value="25" ${pageSize === 25 ? 'selected' : ''}>25 per page</option>
                    <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 per page</option>
                    <option value="100" ${pageSize === 100 ? 'selected' : ''}>100 per page</option>
                    <option value="200" ${pageSize === 200 ? 'selected' : ''}>200 per page</option>
                </select>
            </div>
        `;
        
        container.innerHTML = paginationHTML;
    }

    // Change page for a specific view
    window.changePage = async function(view, page) {
        const state = paginationState[view];
        
        // Validate page number
        if (page < 1 || page > state.totalPages) {
            return;
        }
        
        // Load the requested page
        if (view === 'active') {
            await loadActiveDeliveriesWithPagination(page);
        } else {
            await loadDeliveryHistoryWithPagination(page);
        }
        
        // Scroll to top of table
        const viewElement = document.getElementById(view === 'active' ? 'activeDeliveriesView' : 'deliveryHistoryView');
        if (viewElement) {
            viewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Change page size for a specific view
    window.changePageSize = async function(view, newSize) {
        const state = paginationState[view];
        state.pageSize = parseInt(newSize);
        
        // Reset to page 1 when changing page size
        if (view === 'active') {
            await loadActiveDeliveriesWithPagination(1);
        } else {
            await loadDeliveryHistoryWithPagination(1);
        }
    };

    // Make pagination functions globally accessible
    window.loadActiveDeliveriesWithPagination = loadActiveDeliveriesWithPagination;
    window.loadDeliveryHistoryWithPagination = loadDeliveryHistoryWithPagination;
    window.updatePaginationControls = updatePaginationControls;

// Load delivery history (legacy function - now uses pagination)
async function loadDeliveryHistory() {
    await loadDeliveryHistoryWithPagination(1);
}

// Populate delivery history table (helper function)
async function populateDeliveryHistoryTable() {
    console.log('=== POPULATE DELIVERY HISTORY TABLE ===');
    
    const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
    if (!deliveryHistoryTableBody) {
        console.error('Delivery history table body not found');
        return;
    }
    
    try {
        // Apply search filter
        filteredHistory = currentHistorySearchTerm ? 
            deliveryHistory.filter(delivery => 
                (delivery.drNumber || delivery.dr_number || '').toLowerCase().includes(currentHistorySearchTerm.toLowerCase())
            ) : 
            [...deliveryHistory];
        
        console.log('📊 Filtered history:', filteredHistory.length, 'items');
        
        // Update search results info
        const historySearchResultsInfo = document.getElementById('historySearchResultsInfo');
        if (historySearchResultsInfo) {
            if (currentHistorySearchTerm) {
                historySearchResultsInfo.innerHTML = `
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        Found ${filteredHistory.length} delivery${filteredHistory.length !== 1 ? 's' : ''} 
                        matching "${currentHistorySearchTerm}"
                    </div>
                `;
                historySearchResultsInfo.style.display = 'block';
            } else {
                historySearchResultsInfo.style.display = 'none';
            }
        }
        
        // Display history
        if (filteredHistory.length === 0) {
            deliveryHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="15" class="text-center py-5">
                        <i class="bi bi-clipboard-check" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No delivery history found</h4>
                        <p class="text-muted">
                            ${currentHistorySearchTerm ? 'Try adjusting your search criteria' : 'No completed deliveries yet'}
                        </p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Get EPOD records from Supabase to check which deliveries are signed
        let ePodRecords = [];
        try {
            if (window.dataService && typeof window.dataService.getEPodRecords === 'function') {
                ePodRecords = await window.dataService.getEPodRecords() || [];
                console.log('📄 Loaded E-POD records from Supabase:', ePodRecords.length);
            }
        } catch (error) {
            console.error('Error loading EPOD records from Supabase:', error);
            
            // Use ErrorHandler for consistent error processing
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'populateDeliveryHistoryTable');
            }
            
            // Log the error
            if (window.Logger) {
                window.Logger.error('Failed to load EPOD records in populateDeliveryHistoryTable', {
                    error: error.message,
                    stack: error.stack
                });
            }
        }
        
        // Generate table rows
        deliveryHistoryTableBody.innerHTML = filteredHistory.map(delivery => {
            const statusInfo = getStatusInfo(delivery.status);
            
            // Check if this delivery has been signed - FIXED: Use correct field names for both delivery and EPOD records
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
            
            // Get fields - FIXED: Use the field mapper for consistency
            const getField = window.getFieldValue || ((obj, field) => obj[field]);
            
            // Get truck information
            const truckType = getField(delivery, 'truckType') || getField(delivery, 'truck_type') || '';
            const truckPlate = getField(delivery, 'truckPlateNumber') || getField(delivery, 'truck_plate_number') || '';
            const truckInfo = delivery.truck || 
                             (truckType && truckPlate ? `${truckPlate} (${truckType})` : truckPlate || truckType || 'N/A');
            
            // Get other fields
            const itemNumber = getField(delivery, 'itemNumber') || getField(delivery, 'item_number') || '';
            const mobileNumber = getField(delivery, 'mobileNumber') || getField(delivery, 'mobile_number') || '';
            const itemDescription = getField(delivery, 'itemDescription') || getField(delivery, 'item_description') || '';
            const serialNumber = getField(delivery, 'serialNumber') || getField(delivery, 'serial_number') || '';
            
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
                            // Preserve original date value if parsing fails
                            const originalDate = delivery.completedDate || delivery.completedDateTime || delivery.signedAt;
                            return originalDate || 'N/A';
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
                    <td>${truckInfo}</td>
                    <td style="display: none;">${delivery.additionalCosts ? `₱${delivery.additionalCosts.toFixed(2)}` : '₱0.00'}</td>
                    <td>
                        ${statusDisplay}
                    </td>
                    <td>${itemNumber}</td>
                    <td>${mobileNumber}</td>
                    <td>${itemDescription}</td>
                    <td>${serialNumber}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="showEPodModal('${deliveryDrNumber}')">
                            <i class="bi bi-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update booking view dashboard with real data
        if (typeof window.updateBookingViewDashboard === 'function') {
            setTimeout(() => {
                window.updateBookingViewDashboard();
            }, 100);
        }
        
        console.log('Delivery history table populated successfully');
        
    } catch (error) {
        console.error('❌ Error populating delivery history table:', error);
        
        // Show error message
        deliveryHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="15" class="text-center py-5">
                    <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                    <h4 class="mt-3">Failed to display delivery history</h4>
                    <p class="text-muted">${error.message || 'Please try again'}</p>
                </td>
            </tr>
        `;
    }
}

// Initialize the application
async function initApp() {
    console.log('=== INIT APP FUNCTION CALLED ===');
    
    // Initialize DataService first (CRITICAL - must be done before any data operations)
    if (window.dataService) {
        try {
            await window.dataService.initialize();
            console.log('✅ DataService initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize DataService:', error);
            showToast('Failed to initialize application. Please refresh the page.', 'danger');
            return; // Stop initialization if DataService fails
        }
    } else {
        console.error('❌ DataService not available');
        showToast('Application error. Please refresh the page.', 'danger');
        return;
    }
    
    // Initialize network status monitoring
    // Requirement 9.1: Display offline indicator when connection lost
    // Requirement 9.2: Show appropriate error messages for offline operations
    // Requirement 9.3: Automatic reconnection on network restore
    if (window.networkStatusService) {
        window.networkStatusService.initialize();
        
        // Add listener for network status changes
        window.networkStatusService.addListener((isOnline, wasOnline) => {
            console.log(`Network status changed: ${wasOnline ? 'online' : 'offline'} -> ${isOnline ? 'online' : 'offline'}`);
            
            if (isOnline && !wasOnline) {
                // Network restored - reload data
                console.log('Network restored, reloading data...');
                loadActiveDeliveries();
                loadDeliveryHistory();
            }
        });
        
        // Add reconnection callback for real-time service
        window.networkStatusService.addReconnectCallback(async () => {
            console.log('Reconnecting real-time subscriptions...');
            if (realtimeService) {
                // Cleanup old subscriptions
                realtimeService.cleanup();
                // Reinitialize
                initRealtimeSubscriptions();
            }
        });
        
        console.log('✅ Network status monitoring initialized');
    } else {
        console.warn('⚠️ NetworkStatusService not available');
    }
    
    // Load initial views (they will fetch from DataService directly)
    // IMPORTANT: Await these to ensure they complete before moving on
    try {
        await loadActiveDeliveries();
        await loadDeliveryHistory();
        console.log('✅ Initial data loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        showToast('Failed to load data. Please refresh the page.', 'danger');
    }
    
    // Update booking view dashboard with real data
    if (typeof window.updateBookingViewDashboard === 'function') {
        setTimeout(() => {
            window.updateBookingViewDashboard();
        }, 100);
    }
    
    // Initialize real-time subscriptions
    initRealtimeSubscriptions();
    
    console.log('✅ App initialized successfully');
}

// Initialize real-time subscriptions for deliveries
// Requirement 4.1: Real-time updates across all connected clients
// Requirement 4.2: Use Supabase real-time features
// Requirement 4.3: Automatic UI updates on data changes
function initRealtimeSubscriptions() {
    console.log('=== INITIALIZING REAL-TIME SUBSCRIPTIONS ===');
    
    try {
        // Check if RealtimeService and DataService are available
        if (!window.RealtimeService) {
            console.warn('RealtimeService not available. Real-time updates disabled.');
            return;
        }
        
        if (!window.dataService) {
            console.warn('DataService not available. Real-time updates disabled.');
            return;
        }
        
        // Create RealtimeService instance
        realtimeService = new window.RealtimeService(window.dataService);
        
        // Subscribe to deliveries table changes
        realtimeService.subscribeToTable('deliveries', handleDeliveryChange);
        
        console.log('✅ Real-time subscriptions initialized successfully');
        
        // Show notification to user
        showRealtimeIndicator('connected');
        
    } catch (error) {
        console.error('❌ Failed to initialize real-time subscriptions:', error);
        
        // Use ErrorHandler for consistent error processing
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'initRealtimeSubscriptions');
        }
        
        // Log the error
        if (window.Logger) {
            window.Logger.error('Failed to initialize real-time subscriptions', {
                error: error.message,
                stack: error.stack
            });
        }
        
        showRealtimeIndicator('error');
    }
}

// Handle real-time delivery changes
// Requirement 4.3: Automatic UI updates when data changes
function handleDeliveryChange(payload) {
    console.log('📡 Real-time delivery change detected:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Show visual indicator for real-time update
    showRealtimeIndicator('update');
    
    try {
        switch (eventType) {
            case 'INSERT':
                console.log('New delivery created:', newRecord);
                handleDeliveryInsert(newRecord);
                break;
                
            case 'UPDATE':
                console.log('Delivery updated:', newRecord);
                handleDeliveryUpdate(newRecord, oldRecord);
                break;
                
            case 'DELETE':
                console.log('Delivery deleted:', oldRecord);
                handleDeliveryDelete(oldRecord);
                break;
                
            default:
                console.warn('Unknown event type:', eventType);
        }
        
        // Update dashboard stats after any change
        if (typeof window.updateDashboardStats === 'function') {
            setTimeout(() => {
                window.updateDashboardStats();
            }, 100);
        }
        
        // Show toast notification
        showToast(`Delivery ${eventType.toLowerCase()}d by another user`, 'info');
        
    } catch (error) {
        console.error('Error handling real-time delivery change:', error);
    }
}

// Handle new delivery insertion
function handleDeliveryInsert(newRecord) {
    // Check if delivery is active or completed
    const isCompleted = newRecord.status === 'Completed' || newRecord.status === 'Signed';
    
    if (isCompleted) {
        // Add to delivery history if not already present
        const existsInHistory = deliveryHistory.some(d => d.id === newRecord.id);
        if (!existsInHistory) {
            deliveryHistory.unshift(newRecord);
            window.deliveryHistory = deliveryHistory;
            loadDeliveryHistory();
        }
    } else {
        // Add to active deliveries if not already present
        const existsInActive = activeDeliveries.some(d => d.id === newRecord.id);
        if (!existsInActive) {
            activeDeliveries.unshift(newRecord);
            window.activeDeliveries = activeDeliveries;
            loadActiveDeliveries();
        }
    }
}

// Handle delivery update
function handleDeliveryUpdate(newRecord, oldRecord) {
    const deliveryId = newRecord.id;
    
    // Check if status changed to/from Completed
    const wasCompleted = oldRecord.status === 'Completed' || oldRecord.status === 'Signed';
    const isCompleted = newRecord.status === 'Completed' || newRecord.status === 'Signed';
    
    if (!wasCompleted && isCompleted) {
        // Moved from active to completed
        const activeIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
        if (activeIndex !== -1) {
            activeDeliveries.splice(activeIndex, 1);
            window.activeDeliveries = activeDeliveries;
        }
        
        const historyIndex = deliveryHistory.findIndex(d => d.id === deliveryId);
        if (historyIndex === -1) {
            deliveryHistory.unshift(newRecord);
        } else {
            deliveryHistory[historyIndex] = newRecord;
        }
        window.deliveryHistory = deliveryHistory;
        
        loadActiveDeliveries();
        loadDeliveryHistory();
        
    } else if (wasCompleted && !isCompleted) {
        // Moved from completed to active
        const historyIndex = deliveryHistory.findIndex(d => d.id === deliveryId);
        if (historyIndex !== -1) {
            deliveryHistory.splice(historyIndex, 1);
            window.deliveryHistory = deliveryHistory;
        }
        
        const activeIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
        if (activeIndex === -1) {
            activeDeliveries.unshift(newRecord);
        } else {
            activeDeliveries[activeIndex] = newRecord;
        }
        window.activeDeliveries = activeDeliveries;
        
        loadActiveDeliveries();
        loadDeliveryHistory();
        
    } else if (isCompleted) {
        // Update in history
        const historyIndex = deliveryHistory.findIndex(d => d.id === deliveryId);
        if (historyIndex !== -1) {
            deliveryHistory[historyIndex] = newRecord;
            window.deliveryHistory = deliveryHistory;
            loadDeliveryHistory();
        }
        
    } else {
        // Update in active deliveries
        const activeIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
        if (activeIndex !== -1) {
            activeDeliveries[activeIndex] = newRecord;
            window.activeDeliveries = activeDeliveries;
            loadActiveDeliveries();
        }
    }
}

// Handle delivery deletion
function handleDeliveryDelete(oldRecord) {
    const deliveryId = oldRecord.id;
    
    // Remove from active deliveries
    const activeIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
    if (activeIndex !== -1) {
        activeDeliveries.splice(activeIndex, 1);
        window.activeDeliveries = activeDeliveries;
        loadActiveDeliveries();
    }
    
    // Remove from delivery history
    const historyIndex = deliveryHistory.findIndex(d => d.id === deliveryId);
    if (historyIndex !== -1) {
        deliveryHistory.splice(historyIndex, 1);
        window.deliveryHistory = deliveryHistory;
        loadDeliveryHistory();
    }
}

// Show real-time connection indicator
// Requirement 4.3: Add visual indicators for real-time updates
function showRealtimeIndicator(status) {
    let indicator = document.getElementById('realtimeIndicator');
    
    // Create indicator if it doesn't exist
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'realtimeIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    // Update indicator based on status
    switch (status) {
        case 'connected':
            indicator.innerHTML = '<i class="bi bi-wifi"></i> Real-time connected';
            indicator.style.backgroundColor = '#d1e7dd';
            indicator.style.color = '#0f5132';
            // Hide after 3 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 3000);
            break;
            
        case 'update':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-arrow-repeat"></i> Syncing...';
            indicator.style.backgroundColor = '#cfe2ff';
            indicator.style.color = '#084298';
            // Hide after 2 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 2000);
            break;
            
        case 'error':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Real-time unavailable';
            indicator.style.backgroundColor = '#f8d7da';
            indicator.style.color = '#842029';
            // Hide after 5 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 5000);
            break;
            
        case 'disconnected':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-wifi-off"></i> Real-time disconnected';
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#664d03';
            break;
    }
}

// Cleanup real-time subscriptions on page unload
window.addEventListener('beforeunload', function() {
    if (realtimeService) {
        console.log('Cleaning up real-time subscriptions...');
        realtimeService.cleanup();
    }
});

// Make functions globally available
window.loadActiveDeliveries = loadActiveDeliveries;
window.populateActiveDeliveriesTable = populateActiveDeliveriesTable;
window.loadDeliveryHistory = loadDeliveryHistory;
window.toggleStatusDropdown = toggleStatusDropdown;
window.updateDeliveryStatusById = updateDeliveryStatusById;
window.updateDeliveryStatus = updateDeliveryStatus;
window.generateStatusOptions = generateStatusOptions;
window.exportActiveDeliveriesToExcel = exportActiveDeliveriesToExcel;
window.exportDeliveryHistoryToExcel = exportDeliveryHistoryToExcel;
window.showESignatureModal = showESignatureModal;
window.showEPodModal = showEPodModal;
window.handleStatusChange = handleStatusChange;
window.testModalFunctionality = testModalFunctionality;

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('App.js: DOMContentLoaded event fired');
    
    // Initialize the app (await since it's now async)
    await initApp();
    
    // Add event listeners for search inputs
    const drSearchInput = document.getElementById('drSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const drSearchHistoryInput = document.getElementById('drSearchHistoryInput');
    const clearHistorySearchBtn = document.getElementById('clearHistorySearchBtn');
    const selectAllActive = document.getElementById('selectAllActive');
    const eSignatureBtn = document.getElementById('eSignatureBtn');
    const exportActiveDeliveriesBtn = document.getElementById('exportActiveDeliveriesBtn');
    const exportDeliveryHistoryBtn = document.getElementById('exportDeliveryHistoryBtn');
    
    if (drSearchInput) {
        drSearchInput.addEventListener('input', function() {
            currentSearchTerm = this.value;
            loadActiveDeliveries();
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (drSearchInput) {
                drSearchInput.value = '';
                currentSearchTerm = '';
                loadActiveDeliveries();
            }
        });
    }
    
    if (drSearchHistoryInput) {
        drSearchHistoryInput.addEventListener('input', function() {
            currentHistorySearchTerm = this.value;
            loadDeliveryHistory();
        });
    }
    
    if (clearHistorySearchBtn) {
        clearHistorySearchBtn.addEventListener('click', function() {
            if (drSearchHistoryInput) {
                drSearchHistoryInput.value = '';
                currentHistorySearchTerm = '';
                loadDeliveryHistory();
            }
        });
    }
    
    if (selectAllActive) {
        selectAllActive.addEventListener('change', function() {
            document.querySelectorAll('.delivery-checkbox').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            
            // Enable/disable E-Signature button based on selection
            if (eSignatureBtn) {
                eSignatureBtn.disabled = !this.checked;
            }
        });
    }
    
    // Add event delegation for delivery checkboxes
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('delivery-checkbox')) {
            // Update select all checkbox state
            if (selectAllActive) {
                const allCheckboxes = document.querySelectorAll('.delivery-checkbox');
                const checkedCheckboxes = document.querySelectorAll('.delivery-checkbox:checked');
                selectAllActive.checked = allCheckboxes.length === checkedCheckboxes.length;
            }
            
            // Enable/disable E-Signature button based on selection
            if (eSignatureBtn) {
                const anyChecked = document.querySelectorAll('.delivery-checkbox:checked').length > 0;
                eSignatureBtn.disabled = !anyChecked;
            }
        }
    });
    
    if (eSignatureBtn) {
        eSignatureBtn.addEventListener('click', function() {
            // Get selected deliveries
            const selectedDeliveries = Array.from(document.querySelectorAll('.delivery-checkbox:checked'))
                .map(checkbox => checkbox.dataset.deliveryId);
            
            if (selectedDeliveries.length === 0) {
                showToast('Please select at least one delivery', 'warning');
                return;
            }
            
            if (selectedDeliveries.length > 1) {
                showToast('Please select only one delivery for E-Signature', 'warning');
                return;
            }
            
            // Show E-Signature modal for the first selected delivery
            const deliveryId = selectedDeliveries[0];
            const delivery = activeDeliveries.find(d => d.id === deliveryId);
            if (delivery) {
                showESignatureModal(delivery.drNumber);
            }
        });
    }
    
    if (exportActiveDeliveriesBtn) {
        exportActiveDeliveriesBtn.addEventListener('click', exportActiveDeliveriesToExcel);
    }
    
    if (exportDeliveryHistoryBtn) {
        exportDeliveryHistoryBtn.addEventListener('click', exportDeliveryHistoryToExcel);
    }
    
    // Add event listener for Delivery History PDF export button
    const exportDeliveryHistoryPdfBtn = document.getElementById('exportDeliveryHistoryPdfBtn');
    if (exportDeliveryHistoryPdfBtn) {
        exportDeliveryHistoryPdfBtn.addEventListener('click', exportDeliveryHistoryToPdf);
    }
    
    // Add event listener for Delivery History select button
    const selectDeliveryHistoryBtn = document.getElementById('selectDeliveryHistoryBtn');
    if (selectDeliveryHistoryBtn) {
        selectDeliveryHistoryBtn.addEventListener('click', toggleDeliveryHistorySelection);
    }
    
    // Add event listener for select all history checkbox
    const selectAllHistory = document.getElementById('selectAllHistory');
    if (selectAllHistory) {
        selectAllHistory.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.delivery-history-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    console.log('App.js: Event listeners added');
});

// Add event delegation for delivery history checkboxes
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('delivery-history-checkbox')) {
        // Update select all checkbox state
        const selectAllHistory = document.getElementById('selectAllHistory');
        const allCheckboxes = document.querySelectorAll('.delivery-history-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.delivery-history-checkbox:checked');
        
        if (selectAllHistory) {
            selectAllHistory.checked = allCheckboxes.length === checkedCheckboxes.length;
            selectAllHistory.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
        }
    }
});

// Function to toggle selection mode in Delivery History
function toggleDeliveryHistorySelection() {
    const selectAllCheckbox = document.getElementById('selectAllHistory');
    const checkboxes = document.querySelectorAll('.delivery-history-checkbox');
    const selectBtn = document.getElementById('selectDeliveryHistoryBtn');
    const exportPdfBtn = document.getElementById('exportDeliveryHistoryPdfBtn');
    
    // Check if we're currently in selection mode by checking if selectAllCheckbox is visible
    const isSelectionMode = selectAllCheckbox.style.display === 'block';
    
    if (!isSelectionMode) {
        // Enable selection mode
        selectAllCheckbox.style.display = 'block';
        checkboxes.forEach(checkbox => {
            checkbox.style.display = 'block';
        });
        selectBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel';
        exportPdfBtn.style.display = 'inline-block';
    } else {
        // Disable selection mode
        selectAllCheckbox.style.display = 'none';
        checkboxes.forEach(checkbox => {
            checkbox.style.display = 'none';
            checkbox.checked = false;
        });
        selectBtn.innerHTML = '<i class="bi bi-printer"></i> Print';
        exportPdfBtn.style.display = 'none';
        
        // Uncheck select all
        selectAllCheckbox.checked = false;
    }
}

// Export Delivery History to PDF with signatures
async function exportDeliveryHistoryToPdf() {
    try {
        // Show loading state
        const exportBtn = document.getElementById('exportDeliveryHistoryPdfBtn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exporting...';
        exportBtn.disabled = true;

        // Get EPOD records from Supabase to find signatures
        let ePodRecords = [];
        try {
            if (window.dataService && typeof window.dataService.getEPodRecords === 'function') {
                ePodRecords = await window.dataService.getEPodRecords() || [];
                console.log('📄 Loaded E-POD records from Supabase:', ePodRecords.length);
            }
        } catch (error) {
            console.error('Error loading EPOD records from Supabase:', error);
            
            // Use ErrorHandler for consistent error processing
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'exportDeliveryHistoryToPdf');
            }
            
            // Log the error
            if (window.Logger) {
                window.Logger.error('Failed to load EPOD records in exportDeliveryHistoryToPdf', {
                    error: error.message,
                    stack: error.stack
                });
            }
        }

        // Get selected deliveries
        const selectedCheckboxes = document.querySelectorAll('#deliveryHistoryTableBody tr input.delivery-history-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            showToast('Please select at least one delivery to export', 'warning');
            resetExportButton(exportBtn, originalText);
            return;
        }

        // Get the delivery data for selected records
        const selectedDeliveries = [];
        selectedCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const drNumber = row.querySelector('td:nth-child(3) strong').textContent;
            
            // Find the delivery in window.deliveryHistory
            const delivery = window.deliveryHistory.find(d => d.drNumber === drNumber);
            if (delivery) {
                // ENHANCED: Find signature with multiple field name support
                // Original logic (commented but preserved)
                // const ePodRecord = ePodRecords.find(record => record.drNumber === drNumber);
                // selectedDeliveries.push({
                //     ...delivery,
                //     signature: ePodRecord ? ePodRecord.signature : null
                // });
                
                // ENHANCED: Support both field name variations and DR number variations
                const ePodRecord = ePodRecords.find(record => {
                    const recordDrNumber = record.dr_number || record.drNumber || '';
                    return recordDrNumber === drNumber;
                });
                
                let signatureData = null;
                if (ePodRecord) {
                    // Check for signature in multiple field names
                    signatureData = ePodRecord.signature_data || ePodRecord.signature || ePodRecord.signatureData || null;
                    console.log(`📄 Found E-POD record for DR ${drNumber}, signature available:`, !!signatureData);
                }
                
                selectedDeliveries.push({
                    ...delivery,
                    signature: signatureData
                });
            }
        });

        if (selectedDeliveries.length === 0) {
            showToast('No delivery records found to export', 'warning');
            resetExportButton(exportBtn, originalText);
            return;
        }

        // Create a new window for the PDF content
        const printWindow = window.open('', '_blank');
        
        // Generate HTML content for the PDF
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Delivery History Records</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    color: #333;
                }
                .record {
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .record-title {
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 3px;
                    margin: -15px -15px 15px -15px;
                    font-weight: bold;
                }
                .field {
                    margin-bottom: 10px;
                }
                .field-label {
                    font-weight: bold;
                    display: inline-block;
                    width: 150px;
                }
                .signature-container {
                    margin: 20px 0;
                    text-align: center;
                }
                .signature-image {
                    max-width: 300px;
                    max-height: 100px;
                    border: 1px solid #ccc;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 1px solid #ccc;
                    font-size: 12px;
                    color: #666;
                }
                .status-completed {
                    color: #198754;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Delivery History Records</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        // Add each selected record to the HTML content
        for (let i = 0; i < selectedDeliveries.length; i++) {
            const record = selectedDeliveries[i];
            const completedDate = record.completedDate || 'N/A';
            const signatureHtml = record.signature ? 
                `<img src="${record.signature}" class="signature-image" alt="Signature">` : 
                '<div>No signature available</div>';
                
            htmlContent += `
            <div class="record">
                <div class="record-title">Record #${i + 1}</div>
                <div class="field">
                    <span class="field-label">Date:</span>
                    <span>${completedDate}</span>
                </div>
                <div class="field">
                    <span class="field-label">DR Number:</span>
                    <span>${record.drNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Customer Name:</span>
                    <span>${record.customerName || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Vendor Number:</span>
                    <span>${record.vendorNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Origin:</span>
                    <span>${record.origin || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Destination:</span>
                    <span>${record.destination || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Distance:</span>
                    <span>${record.distance || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Additional Costs:</span>
                    <span>${record.additionalCosts ? `₱${record.additionalCosts.toFixed(2)}` : '₱0.00'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Status:</span>
                    <span>${record.status || 'N/A'}</span>
                </div>
                <div class="signature-container">
                    <div><strong>Signature:</strong></div>
                    ${signatureHtml}
                </div>
            </div>
            `;
        }

        htmlContent += `
            <div class="footer">
                <p>Document generated by MCI Delivery Tracker System</p>
            </div>
        </body>
        </html>
        `;

        // Write content to the new window
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then trigger print
        printWindow.onload = function() {
            // Give it a small delay to ensure everything is rendered
            setTimeout(() => {
                printWindow.print();
                // Reset export button
                resetExportButton(exportBtn, originalText);
            }, 500);
        };

        showToast(`Exporting ${selectedDeliveries.length} delivery records to PDF. Please check your print dialog to save as PDF.`, 'success');
    } catch (error) {
        console.error('Error exporting Delivery History records to PDF:', error);
        showToast('Error exporting delivery records to PDF. Please try again.', 'error');
        
        // Reset export button
        const exportBtn = document.getElementById('exportDeliveryHistoryPdfBtn');
        if (exportBtn) {
            const originalText = '<i class="bi bi-file-earmark-pdf"></i> Export PDF';
            resetExportButton(exportBtn, originalText);
        }
    }
}

/**
 * Reset the export button to its original state
 */
function resetExportButton(button, originalText) {
    if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Debug function to verify data flow for new fields
function debugNewFields() {
    console.log('=== DEBUG NEW FIELDS ===');
    
    // Check global arrays
    console.log('Global activeDeliveries:', window.activeDeliveries ? window.activeDeliveries.length : 0);
    if (window.activeDeliveries && window.activeDeliveries.length > 0) {
        const sample = window.activeDeliveries[0];
        console.log('Sample from global array:', {
            itemNumber: sample.itemNumber,
            item_number: sample.item_number,
            mobileNumber: sample.mobileNumber,
            mobile_number: sample.mobile_number,
            itemDescription: sample.itemDescription,
            item_description: sample.item_description,
            serialNumber: sample.serialNumber,
            serial_number: sample.serial_number
        });
    }
    
    // Check field mapper
    if (window.FIELD_MAPPINGS) {
        console.log('Field mappings for new fields:', {
            item_number: window.FIELD_MAPPINGS.item_number,
            mobile_number: window.FIELD_MAPPINGS.mobile_number,
            item_description: window.FIELD_MAPPINGS.item_description,
            serial_number: window.FIELD_MAPPINGS.serial_number
        });
    }
    
    console.log('=== END DEBUG ===');
}

// Make debug function globally available
window.debugNewFields = debugNewFields;

// Debug function to check data state
function debugActiveDeliveries() {
    console.log('=== ACTIVE DELIVERIES DEBUG ===');
    console.log('Local activeDeliveries:', activeDeliveries.length);
    console.log('Window activeDeliveries:', window.activeDeliveries ? window.activeDeliveries.length : 'undefined');
    console.log('Sample data:', activeDeliveries.length > 0 ? activeDeliveries[0] : 'No data');
    
    // Force refresh
    loadActiveDeliveries();
}

// Make functions globally accessible
window.loadActiveDeliveries = loadActiveDeliveries;
window.populateActiveDeliveriesTable = populateActiveDeliveriesTable;
window.loadDeliveryHistory = loadDeliveryHistory;
window.toggleStatusDropdown = toggleStatusDropdown;
window.updateDeliveryStatusById = updateDeliveryStatusById;
window.updateDeliveryStatus = updateDeliveryStatus;
window.generateStatusOptions = generateStatusOptions;
window.exportActiveDeliveriesToExcel = exportActiveDeliveriesToExcel;
window.exportDeliveryHistoryToExcel = exportDeliveryHistoryToExcel;
window.exportDeliveryHistoryToPdf = exportDeliveryHistoryToPdf;
window.toggleDeliveryHistorySelection = toggleDeliveryHistorySelection;
window.showESignatureModal = showESignatureModal;
window.showEPodModal = showEPodModal;
window.handleStatusChange = handleStatusChange;
window.testModalFunctionality = testModalFunctionality;
window.debugActiveDeliveries = debugActiveDeliveries;

console.log('=== APP.JS INITIALIZATION COMPLETE ===');
})();