console.log('app.js loaded');
(function() {
    // Global variables
    let activeDeliveries = [];
    let deliveryHistory = [];
    let refreshInterval = null;
    let filteredDeliveries = [];
    let filteredHistory = [];
    let currentSearchTerm = '';
    let currentHistorySearchTerm = '';

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
            case 'On Schedule':
                return { class: 'bg-success', icon: 'bi-check-circle' };
            case 'In Transit':
                return { class: 'bg-primary', icon: 'bi-truck' };
            case 'Delayed':
                return { class: 'bg-warning', icon: 'bi-exclamation-triangle' };
            case 'Completed':
                return { class: 'bg-success', icon: 'bi-check-circle' };
            default:
                return { class: 'bg-secondary', icon: 'bi-question-circle' };
        }
    }

    // Placeholder function for status change handling
    function handleStatusChange(e) {
        const deliveryId = e.target.dataset.deliveryId;
        const newStatus = e.target.value;
        console.log(`Status changed for delivery ${deliveryId} to ${newStatus}`);
        
        // Find the delivery and update its status
        const deliveryIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
        if (deliveryIndex !== -1) {
            activeDeliveries[deliveryIndex].status = newStatus;
            
            // If status is changed to "Completed", move to history
            if (newStatus === 'Completed') {
                const completedDelivery = activeDeliveries[deliveryIndex];
                completedDelivery.completedDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                // Move to history
                deliveryHistory.unshift(completedDelivery);
                activeDeliveries.splice(deliveryIndex, 1);
                
                // Save to database
                saveToDatabase();
            } else {
                // Save to database
                saveToDatabase();
            }
            
            loadActiveDeliveries();
            loadDeliveryHistory();
            showToast(`Delivery status updated to ${newStatus}`);
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
                    customerContact = delivery.customerNumber || '';
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

    // Save data to database
    async function saveToDatabase() {
        try {
            // Save active deliveries
            for (const delivery of activeDeliveries) {
                await window.saveDelivery(delivery);
            }
            
            // Save delivery history
            for (const delivery of deliveryHistory) {
                await window.saveDelivery(delivery);
            }
            
            console.log('Data saved to database');
        } catch (error) {
            console.error('Error saving to database:', error);
            // Fallback to localStorage
            saveToLocalStorage();
        }
    }

    // Save data to localStorage (fallback)
    function saveToLocalStorage() {
        // Use dataService to save deliveries if available
        if (typeof window.dataService !== 'undefined') {
            // Save each active delivery
            activeDeliveries.forEach(delivery => {
                window.dataService.saveDelivery(delivery).catch(error => {
                    console.error('Error saving delivery to dataService:', error);
                    // Fallback to localStorage
                    fallbackSaveToLocalStorage();
                });
            });
            
            // Save each delivery history item
            deliveryHistory.forEach(delivery => {
                window.dataService.saveDelivery(delivery).catch(error => {
                    console.error('Error saving delivery history to dataService:', error);
                    // Fallback to localStorage
                    fallbackSaveToLocalStorage();
                });
            });
            
            console.log('Data saved using dataService');
        } else {
            // Fallback to localStorage
            fallbackSaveToLocalStorage();
        }
    }

    function fallbackSaveToLocalStorage() {
        try {
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-deliveryHistory', JSON.stringify(deliveryHistory));
            console.log('Data saved to localStorage (fallback)');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load data from database
    async function loadFromDatabase() {
        try {
            // Use dataService to load deliveries if available
            if (typeof window.dataService !== 'undefined') {
                const deliveries = await window.dataService.getDeliveries();
                activeDeliveries = deliveries.filter(d => d.status !== 'Completed');
                deliveryHistory = deliveries.filter(d => d.status === 'Completed');
                
                console.log('Active deliveries loaded from dataService:', activeDeliveries.length);
                console.log('Delivery history loaded from dataService:', deliveryHistory.length);
                
                // Update global references
                window.activeDeliveries = activeDeliveries;
                window.deliveryHistory = deliveryHistory;
                
                return true;
            } else {
                // Fallback to current implementation
                return await fallbackLoadFromDatabase();
            }
        } catch (error) {
            console.error('Error loading from dataService:', error);
            // Fallback to current implementation
            return await fallbackLoadFromDatabase();
        }
    }

    // Fallback implementation for loading from database
    async function fallbackLoadFromDatabase() {
        try {
            // Load active deliveries
            const getDeliveries = typeof window.getDeliveries === 'function' ? window.getDeliveries : null;
            if (getDeliveries) {
                const deliveries = await getDeliveries();
                activeDeliveries = deliveries.filter(d => d.status !== 'Completed');
                deliveryHistory = deliveries.filter(d => d.status === 'Completed');
                
                console.log('Active deliveries loaded from database:', activeDeliveries.length);
                console.log('Delivery history loaded from database:', deliveryHistory.length);
                
                // Update global references
                window.activeDeliveries = activeDeliveries;
                window.deliveryHistory = deliveryHistory;
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error loading from database:', error);
            return false;
        }
    }

    // Load data from localStorage (fallback)
    function loadFromLocalStorage() {
        try {
            const savedActive = localStorage.getItem('mci-activeDeliveries');
            const savedHistory = localStorage.getItem('mci-deliveryHistory');
            
            if (savedActive) {
                activeDeliveries = JSON.parse(savedActive);
                console.log('Active deliveries loaded from localStorage:', activeDeliveries.length);
            }
            
            if (savedHistory) {
                deliveryHistory = JSON.parse(savedHistory);
                console.log('Delivery history loaded from localStorage:', deliveryHistory.length);
            }
            
            // Update global references
            window.activeDeliveries = activeDeliveries;
            window.deliveryHistory = deliveryHistory;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

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
                'Booked Date': delivery.deliveryDate || delivery.timestamp || 'N/A',
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
                'Date': delivery.completedDate || 'N/A',
                'DR Number': delivery.drNumber || 'N/A',
                'Customer Name': delivery.customerName || 'N/A',
                'Customer Number': delivery.customerNumber || 'N/A',
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

    // Load active deliveries
    function loadActiveDeliveries() {
        console.log('=== LOAD ACTIVE DELIVERIES FUNCTION CALLED ===');
        
        // Load from database or localStorage
        loadFromDatabase().then(success => {
            if (!success) {
                loadFromLocalStorage();
            }
            
            const activeDeliveriesTableBody = document.getElementById('activeDeliveriesTableBody');
            if (!activeDeliveriesTableBody) {
                console.error('Active deliveries table body not found');
                return;
            }
            
            // Apply search filter
            filteredDeliveries = currentSearchTerm ? 
                activeDeliveries.filter(delivery => 
                    delivery.drNumber.toLowerCase().includes(currentSearchTerm.toLowerCase())
                ) : 
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
        
        // Display deliveries
        if (filteredDeliveries.length === 0) {
            activeDeliveriesTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-5">
                        <i class="bi bi-truck" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No active deliveries found</h4>
                        <p class="text-muted">
                            ${currentSearchTerm ? 'Try adjusting your search criteria' : 'All deliveries are completed or there are no deliveries yet'}
                        </p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows
        activeDeliveriesTableBody.innerHTML = filteredDeliveries.map(delivery => {
            const statusInfo = getStatusInfo(delivery.status);
            return `
                <tr data-delivery-id="${delivery.id}">
                    <td><input type="checkbox" class="form-check-input delivery-checkbox" data-delivery-id="${delivery.id}"></td>
                    <td><strong>${delivery.drNumber}</strong></td>
                    <td>${delivery.customerName}</td>
                    <td>${delivery.customerNumber}</td>
                    <td>${delivery.origin}</td>
                    <td>${delivery.destination}</td>
                    <td>${delivery.distance}</td>
                    <td>${delivery.truckPlateNumber}</td>
                    <td>
                        <span class="badge ${statusInfo.class}">
                            <i class="bi ${statusInfo.icon}"></i> ${delivery.status}
                        </span>
                    </td>
                    <td>${delivery.deliveryDate || delivery.timestamp || 'N/A'}</td>
                </tr>
            `;
        }).join('');
        
        // Update booking view dashboard with real data
        if (typeof window.updateBookingViewDashboard === 'function') {
            setTimeout(() => {
                window.updateBookingViewDashboard();
            }, 100);
        }
        
        console.log('Active deliveries loaded successfully');
    }).catch(error => {
        console.error('Error loading active deliveries:', error);
    });
}

// Load delivery history
function loadDeliveryHistory() {
    console.log('=== LOAD DELIVERY HISTORY FUNCTION CALLED ===');
    
    // Load from database or localStorage
    loadFromDatabase().then(success => {
        if (!success) {
            loadFromLocalStorage();
        }
        
        const deliveryHistoryTableBody = document.getElementById('deliveryHistoryTableBody');
        if (!deliveryHistoryTableBody) {
            console.error('Delivery history table body not found');
            return;
        }
        
        // Apply search filter
        filteredHistory = currentHistorySearchTerm ? 
            deliveryHistory.filter(delivery => 
                delivery.drNumber.toLowerCase().includes(currentHistorySearchTerm.toLowerCase())
            ) : 
            [...deliveryHistory];
        
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
                    <td colspan="10" class="text-center py-5">
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
        deliveryHistoryTableBody.innerHTML = filteredHistory.map(delivery => {
            const statusInfo = getStatusInfo(delivery.status);
            
            // Check if this delivery has been signed
            const isSigned = ePodRecords.some(record => record.drNumber === delivery.drNumber);
            
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
                        <input type="checkbox" class="form-check-input delivery-history-checkbox" style="display: none;" data-dr-number="${delivery.drNumber}">
                    </td>
                    <td>${delivery.completedDate || 'N/A'}</td>
                    <td><strong>${delivery.drNumber}</strong></td>
                    <td>${delivery.customerName}</td>
                    <td>${delivery.customerNumber}</td>
                    <td>${delivery.origin}</td>
                    <td>${delivery.destination}</td>
                    <td>${delivery.distance}</td>
                    <td>${delivery.additionalCosts ? `₱${delivery.additionalCosts.toFixed(2)}` : '₱0.00'}</td>
                    <td>
                        ${statusDisplay}
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
        
        console.log('Delivery history loaded successfully');
    }).catch(error => {
        console.error('Error loading delivery history:', error);
    });
}

// Initialize the application
function initApp() {
    console.log('=== INIT APP FUNCTION CALLED ===');
    
    // Load initial data
    loadFromDatabase().then(success => {
        if (!success) {
            loadFromLocalStorage();
        }
        
        // Load initial views
        loadActiveDeliveries();
        loadDeliveryHistory();
        
        // Update booking view dashboard with real data
        if (typeof window.updateBookingViewDashboard === 'function') {
            setTimeout(() => {
                window.updateBookingViewDashboard();
            }, 100);
        }
        
        console.log('App initialized successfully');
    }).catch(error => {
        console.error('Error initializing app:', error);
    });
}

// Make functions globally available
window.loadActiveDeliveries = loadActiveDeliveries;
window.loadDeliveryHistory = loadDeliveryHistory;
window.saveToLocalStorage = saveToLocalStorage;
window.exportActiveDeliveriesToExcel = exportActiveDeliveriesToExcel;
window.exportDeliveryHistoryToExcel = exportDeliveryHistoryToExcel;
window.showESignatureModal = showESignatureModal;
window.showEPodModal = showEPodModal;
window.handleStatusChange = handleStatusChange;
window.testModalFunctionality = testModalFunctionality;

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js: DOMContentLoaded event fired');
    
    // Initialize the app
    initApp();
    
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
function exportDeliveryHistoryToPdf() {
    try {
        // Show loading state
        const exportBtn = document.getElementById('exportDeliveryHistoryPdfBtn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exporting...';
        exportBtn.disabled = true;

        // Get EPOD records from localStorage to find signatures
        let ePodRecords = [];
        try {
            const ePodData = localStorage.getItem('ePodRecords');
            if (ePodData) {
                ePodRecords = JSON.parse(ePodData);
            }
        } catch (error) {
            console.error('Error loading EPOD records:', error);
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
                // Find signature if available
                const ePodRecord = ePodRecords.find(record => record.drNumber === drNumber);
                selectedDeliveries.push({
                    ...delivery,
                    signature: ePodRecord ? ePodRecord.signature : null
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
                    <span class="field-label">Customer Number:</span>
                    <span>${record.customerNumber || 'N/A'}</span>
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

// Make functions globally accessible
window.loadActiveDeliveries = loadActiveDeliveries;
window.loadDeliveryHistory = loadDeliveryHistory;
window.saveToLocalStorage = saveToLocalStorage;
window.exportActiveDeliveriesToExcel = exportActiveDeliveriesToExcel;
window.exportDeliveryHistoryToExcel = exportDeliveryHistoryToExcel;
window.exportDeliveryHistoryToPdf = exportDeliveryHistoryToPdf;
window.toggleDeliveryHistorySelection = toggleDeliveryHistorySelection;
window.showESignatureModal = showESignatureModal;
window.showEPodModal = showEPodModal;
window.handleStatusChange = handleStatusChange;
window.testModalFunctionality = testModalFunctionality;

console.log('=== APP.JS INITIALIZATION COMPLETE ===');
})();