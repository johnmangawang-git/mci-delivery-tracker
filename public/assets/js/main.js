// Main application initialization
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all views
    const views = {
        booking: document.getElementById('bookingView'),
        analytics: document.getElementById('analyticsView'),
        'active-deliveries': document.getElementById('activeDeliveriesView'),
        'delivery-history': document.getElementById('deliveryHistoryView'),
        customers: document.getElementById('customersView'),
        'warehouse-map': document.getElementById('warehouseMapView'),
        settings: document.getElementById('settingsView'),
        'e-pod': document.getElementById('ePodView')
    };

    // Initialize sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Mobile sidebar toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }

    // Sidebar navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Update active state in sidebar
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Hide all views
            Object.values(views).forEach(view => {
                if (view) view.classList.remove('active');
            });

            // Show selected view
            const viewName = this.dataset.view;
            if (views[viewName]) {
                views[viewName].classList.add('active');

                // Special handling for analytics view
                if (viewName === 'analytics') {
                    // Initialize charts when analytics view is shown
                    initAnalyticsCharts();
                }

                // Special handling for active deliveries view
                if (viewName === 'active-deliveries') {
                    loadActiveDeliveries();
                    // Initialize E-POD functionality for E-Signature button
                    initEPod();
                }

                // Special handling for delivery history view
                if (viewName === 'delivery-history') {
                    loadDeliveryHistory();
                }

                // Special handling for customers view
                if (viewName === 'customers') {
                    loadCustomers();
                }

                // Special handling for warehouse map view
                if (viewName === 'warehouse-map') {
                    loadWarehouses();
                }
                
                // Special handling for E-POD view
                if (viewName === 'e-pod') {
                    loadEPodDeliveries();
                    initEPod(); // Initialize E-POD functionality when view is loaded
                }
            }

            // Close sidebar on mobile after selection
            if (window.innerWidth < 768) {
                sidebar.classList.remove('show');
            }
        });
    });

    // Initialize calendar
    initCalendar();

    // Initialize booking modal interactions
    initBookingModal();

    // Initialize settings panels
    if (window.initSettingsPanels) {
        initSettingsPanels();
    }

    // Initialize analytics charts (only if analytics view is visible initially)
    if (views.analytics.classList.contains('active')) {
        initAnalyticsCharts();
    }

    // Initialize user session
    initAuth();

    // Initialize customers data
    loadCustomers();

    // Initialize Supabase authentication
    initSupabaseAuth();

    // Initialize E-POD functionality (for initial load if E-POD view is active)
    if (document.getElementById('ePodView') && views['e-pod'].classList.contains('active')) {
        initEPod();
    }
    
    // Ensure signature pad is initialized for E-Signature functionality
    if (document.getElementById('signaturePad')) {
        ensureSignaturePadInitialized();
    }

    // Calendar view toggle buttons
    document.querySelectorAll('.calendar-controls .btn').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.calendar-controls .btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function () {
            const addCustomerModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
            
            // Properly handle modal events
            addCustomerModal._element.addEventListener('hidden.bs.modal', function () {
                // Reset form when modal is closed
                document.getElementById('addCustomerForm').reset();
                
                // Reset save button to default state
                const saveBtn = document.getElementById('saveCustomerBtn');
                saveBtn.textContent = 'Save Customer';
                saveBtn.onclick = function() {
                    saveCustomer();
                    addCustomerModal.hide();
                };
                
                // Force remove modal backdrop if it remains
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                
                // Re-enable body scrolling
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '0';
            });
            
            addCustomerModal.show();
        });
    }

    // Save customer button
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', function () {
            saveCustomer();
            const addCustomerModal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
            addCustomerModal.hide();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            // Use Supabase logout if available
            if (typeof window.logout === 'function') {
                window.logout().then(() => {
                    // Redirect to login page or refresh the page
                    window.location.reload();
                }).catch(error => {
                    console.error('Logout error:', error);
                    // Still redirect to login page or refresh the page
                    window.location.reload();
                });
            } else {
                // Fallback to current implementation
                logout();
            }
        });
    }
});

// Global functions
function showToast(message, type = 'success') {
    // In a real implementation, this would show a toast notification
    console.log(`Toast: ${message} [${type}]`);
}

function showError(message) {
    showToast(message, 'error');
}

// Global signature pad instance
let globalSignaturePad = null;

// Function to ensure signature pad is initialized
function ensureSignaturePadInitialized() {
    console.log('ensureSignaturePadInitialized called');
    
    // Check if SignaturePad library is loaded
    if (typeof SignaturePad === 'undefined') {
        console.error('SignaturePad library is not loaded');
        return null;
    }
    
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
        try {
            // Get canvas element
            const canvas = document.getElementById('signaturePad');
            if (!canvas) {
                console.error('Canvas element not found');
                return null;
            }
            
            // Set proper canvas dimensions
            const container = canvas.parentElement;
            const width = Math.min(container.offsetWidth, 600);
            const height = 300;
            canvas.width = width;
            canvas.height = height;
            
            // Destroy existing instance if it exists
            if (globalSignaturePad) {
                globalSignaturePad.off();
                globalSignaturePad = null;
            }
            
            // Create new SignaturePad instance with basic configuration
            globalSignaturePad = new SignaturePad(canvas);
            
            console.log('SignaturePad initialized successfully');
            
            // Setup clear button with fresh event listener
            const clearBtn = document.getElementById('clearSignatureBtn');
            if (clearBtn) {
                // Remove all existing listeners by cloning
                const freshClearBtn = clearBtn.cloneNode(true);
                clearBtn.parentNode.replaceChild(freshClearBtn, clearBtn);
                
                freshClearBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (globalSignaturePad) {
                        globalSignaturePad.clear();
                    }
                });
            }
            
            // Setup save button
            setupSaveSignatureButton();
            
        } catch (error) {
            console.error('Failed to initialize SignaturePad:', error);
        }
    }, 500);
    
    return globalSignaturePad;
}

// Function to setup the save signature button event listener
function setupSaveSignatureButton() {
    const saveSignatureBtn = document.getElementById('saveSignatureBtn');
    if (saveSignatureBtn && !saveSignatureBtn.hasAttribute('data-listener-added')) {
        saveSignatureBtn.addEventListener('click', () => {
            if (!globalSignaturePad || globalSignaturePad.isEmpty()) {
                showError('Please provide a signature before saving');
                return;
            }
            
            // Get signature data URL
            const signatureData = globalSignaturePad.toDataURL('image/png');
            
            // Get delivery details
            const drNumber = document.getElementById('ePodDrNumber').value;
            const customerName = document.getElementById('ePodCustomerName').value;
            const customerContact = document.getElementById('ePodCustomerContact').value;
            const truckPlate = document.getElementById('ePodTruckPlate').value;
            const deliveryRoute = document.getElementById('ePodDeliveryRoute').value;
            
            // Check if we're handling multiple DR numbers
            if (window.multipleDRNumbers && window.multipleDRNumbers.length > 0) {
                // Handle multiple DR numbers
                const drNumbers = window.multipleDRNumbers;
                
                // Create E-POD records for each DR number
                let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
                
                drNumbers.forEach(drNum => {
                    // In a real app, you would fetch the complete delivery details from your data source
                    // For now, we'll use placeholder data
                    const deliveryDetails = {
                        origin: deliveryRoute.split(' to ')[0] || 'Unknown Origin',
                        destination: deliveryRoute.split(' to ')[1] || 'Unknown Destination'
                    };
                    
                    // Create E-POD record with complete data
                    const ePodRecord = {
                        drNumber: drNum,
                        customerName,
                        customerContact,
                        truckPlate,
                        origin: deliveryDetails.origin,
                        destination: deliveryDetails.destination,
                        signature: signatureData, // Same signature for all DRs
                        status: 'Completed',
                        signedAt: new Date().toISOString(),
                        timestamp: new Date().toISOString()
                    };
                    
                    ePodRecords.push(ePodRecord);
                    
                    // Update delivery status in active deliveries
                    updateDeliveryStatus(drNum, 'Completed');
                });
                
                // Save all records to local storage
                localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
                
                // Show success message
                showToast(`${drNumbers.length} E-PODs saved successfully`, 'success');
            } else {
                // Handle single DR number (original functionality)
                // In a real app, you would fetch the complete delivery details from your data source
                // For now, we'll use placeholder data
                const deliveryDetails = {
                    origin: deliveryRoute.split(' to ')[0] || 'Unknown Origin',
                    destination: deliveryRoute.split(' to ')[1] || 'Unknown Destination'
                };
                
                // Create E-POD record with complete data
                const ePodRecord = {
                    drNumber,
                    customerName,
                    customerContact,
                    truckPlate,
                    origin: deliveryDetails.origin,
                    destination: deliveryDetails.destination,
                    signature: signatureData,
                    status: 'Completed',
                    signedAt: new Date().toISOString(),
                    timestamp: new Date().toISOString()
                };
                
                // Save to local storage (in a real app, this would be an API call)
                let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
                ePodRecords.push(ePodRecord);
                
                // Update delivery status in active deliveries
                updateDeliveryStatus(drNumber, 'Completed');
                
                // Save to local storage
                localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
                
                // Show success message
                showToast('E-POD saved successfully', 'success');
            }
            
            // Close the modal
            const eSignatureModal = bootstrap.Modal.getInstance(document.getElementById('eSignatureModal'));
            if (eSignatureModal) {
                eSignatureModal.hide();
            }
            
            // Refresh both views
            if (typeof loadActiveDeliveries === 'function') {
                loadActiveDeliveries();
            }
            if (typeof loadEPodDeliveries === 'function') {
                loadEPodDeliveries();
            }
        });
        
        // Mark that the listener has been added to prevent duplicates
        saveSignatureBtn.setAttribute('data-listener-added', 'true');
    }
}

// Public function to open the signature pad modal for single DR
function openSignaturePad(drNumber = '', customerName = '', customerContact = '', truckPlate = '', deliveryRoute = '') {
    console.log('openSignaturePad called with:', { drNumber, customerName, customerContact, truckPlate, deliveryRoute });
    
    // Set delivery details in modal
    document.getElementById('ePodDrNumber').value = drNumber || '';
    document.getElementById('ePodCustomerName').value = customerName || 'Customer Name';
    document.getElementById('ePodCustomerContact').value = customerContact || '09123456789';
    document.getElementById('ePodTruckPlate').value = truckPlate || 'ABC123';
    document.getElementById('ePodDeliveryRoute').value = deliveryRoute || 'Origin to Destination';
    
    // Clear any existing multiple DR data
    delete window.multipleDRNumbers;
    delete window.deliveryDetails;
    
    // Show modal
    const eSignatureModal = new bootstrap.Modal(document.getElementById('eSignatureModal'));
    eSignatureModal.show();
    
    // Initialize signature pad after modal is shown
    const modalElement = document.getElementById('eSignatureModal');
    
    const handleModalShown = function() {
        console.log('Modal shown event triggered');
        ensureSignaturePadInitialized();
        // Remove event listener to prevent duplicates
        modalElement.removeEventListener('shown.bs.modal', handleModalShown);
    };
    
    // Add event listener for when the modal is fully shown
    modalElement.addEventListener('shown.bs.modal', handleModalShown);
}

// Public function to open the signature pad modal for multiple DRs
function openSignaturePadMultiple(drNumber = '', customerName = '', customerContact = '', truckPlate = '', deliveryRoute = '', drNumbers = []) {
    console.log('openSignaturePadMultiple called with:', { drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers });
    
    // Set delivery details in modal
    document.getElementById('ePodDrNumber').value = drNumber || '';
    document.getElementById('ePodCustomerName').value = customerName || 'Customer Name';
    document.getElementById('ePodCustomerContact').value = customerContact || '09123456789';
    document.getElementById('ePodTruckPlate').value = truckPlate || 'ABC123';
    document.getElementById('ePodDeliveryRoute').value = deliveryRoute || 'Origin to Destination';
    
    // Store the multiple DR numbers for saving
    window.multipleDRNumbers = drNumbers;
    
    // Show modal
    const eSignatureModal = new bootstrap.Modal(document.getElementById('eSignatureModal'));
    eSignatureModal.show();
    
    // Initialize signature pad after modal is shown
    const modalElement = document.getElementById('eSignatureModal');
    
    const handleModalShown = function() {
        console.log('Modal shown event triggered');
        ensureSignaturePadInitialized();
        // Remove event listener to prevent duplicates
        modalElement.removeEventListener('shown.bs.modal', handleModalShown);
    };
    
    // Add event listener for when the modal is fully shown
    modalElement.addEventListener('shown.bs.modal', handleModalShown);
}

// Public function to get signature data
function getSignatureData() {
    if (globalSignaturePad && !globalSignaturePad.isEmpty()) {
        return globalSignaturePad.toDataURL('image/png');
    }
    return null;
}

// Public function to clear signature
function clearSignature() {
    if (globalSignaturePad) {
        globalSignaturePad.clear();
    }
}

// Public function to check if signature pad has content
function hasSignature() {
    return globalSignaturePad && !globalSignaturePad.isEmpty();
}

// Make signature pad functions globally accessible
window.openSignaturePad = openSignaturePad;
window.openSignaturePadMultiple = openSignaturePadMultiple;
window.getSignatureData = getSignatureData;
window.clearSignature = clearSignature;
window.hasSignature = hasSignature;
window.ensureSignaturePadInitialized = ensureSignaturePadInitialized;

// Function to update booking view dashboard cards with real data
function updateBookingViewDashboard() {
    try {
        // Get the actual data from global variables
        const activeDeliveries = window.activeDeliveries || [];
        const deliveryHistory = window.deliveryHistory || [];
        
        // Calculate metrics from actual data
        const totalBookings = activeDeliveries.length + deliveryHistory.length;
        const activeDeliveriesCount = activeDeliveries.length;
        
        // Calculate total distance
        let totalDistance = 0;
        [...activeDeliveries, ...deliveryHistory].forEach(delivery => {
            if (delivery.distance) {
                // Extract numeric value from distance string (e.g., "12.5 km" -> 12.5)
                const distanceMatch = delivery.distance.match(/(\d+\.?\d*)/);
                if (distanceMatch) {
                    totalDistance += parseFloat(distanceMatch[1]) || 0;
                }
            }
        });
        
        // Update the booking view dashboard cards
        const bookingView = document.getElementById('bookingView');
        if (bookingView) {
            // Booked Deliveries card (total bookings)
            const bookedDeliveriesCard = bookingView.querySelector('.dashboard-cards .card:nth-child(1) .stat-value');
            if (bookedDeliveriesCard) {
                bookedDeliveriesCard.textContent = totalBookings;
            }
            
            // Active Deliveries card
            const activeDeliveriesCard = bookingView.querySelector('.dashboard-cards .card:nth-child(2) .stat-value');
            if (activeDeliveriesCard) {
                activeDeliveriesCard.textContent = activeDeliveriesCount;
            }
            
            // Total Distance card
            const totalDistanceCard = bookingView.querySelector('.dashboard-cards .card:nth-child(3) .stat-value');
            if (totalDistanceCard) {
                totalDistanceCard.textContent = `${totalDistance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
            }
        }
        
        console.log('Booking view dashboard updated:', {
            totalBookings,
            activeDeliveriesCount,
            totalDistance
        });
    } catch (error) {
        console.error('Error updating booking view dashboard:', error);
    }
}

// Expose function globally
window.updateBookingViewDashboard = updateBookingViewDashboard;

// E-POD Module Functions
function initEPod() {
    // Setup save button (this will be a no-op if already set up)
    setupSaveSignatureButton();
    
    // Initialize export button
    initEPodExportButton();
    
    // Note: Signature pad initialization is handled by modal events, not here
    
    // E-Signature button in Active Deliveries view
    const eSignatureBtn = document.getElementById('eSignatureBtn');
    if (eSignatureBtn) {
        eSignatureBtn.addEventListener('click', () => {
            // Check if we're in Active Deliveries or E-POD view
            const activeDeliveriesView = document.getElementById('activeDeliveriesView');
            const ePodView = document.getElementById('ePodView');
            
            let selectedRows = [];
            if (activeDeliveriesView && activeDeliveriesView.classList.contains('active')) {
                // We're in Active Deliveries view
                selectedRows = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox:checked');
            } else if (ePodView && ePodView.classList.contains('active')) {
                // We're in E-POD view
                selectedRows = document.querySelectorAll('#ePodTableBody tr.selected');
            } else {
                // Check active deliveries as fallback
                selectedRows = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox:checked');
            }
            
            if (selectedRows.length === 0) {
                showError('Please select a delivery first');
                return;
            }
            
            // For Active Deliveries view, check if all selected rows belong to the same customer
            if (activeDeliveriesView && activeDeliveriesView.classList.contains('active')) {
                // Get customer details from first selected row
                const firstRow = selectedRows[0].closest('tr');
                const firstCustomerName = firstRow.querySelector('td:nth-child(3)').textContent;
                const firstCustomerContact = firstRow.querySelector('td:nth-child(4)').textContent;
                
                // Check if all selected rows belong to the same customer
                let sameCustomer = true;
                let drNumbers = [];
                let deliveryDetails = [];
                
                selectedRows.forEach((rowElement, index) => {
                    const row = rowElement.closest('tr');
                    const customerName = row.querySelector('td:nth-child(3)').textContent;
                    const customerContact = row.querySelector('td:nth-child(4)').textContent;
                    const drNumber = row.querySelector('td:nth-child(2)').textContent;
                    
                    // Collect DR numbers
                    drNumbers.push(drNumber);
                    
                    // Collect delivery details for display
                    const origin = row.querySelector('td:nth-child(5)').textContent;
                    const destination = row.querySelector('td:nth-child(6)').textContent;
                    const truckPlate = row.querySelector('td:nth-child(8)').textContent;
                    
                    deliveryDetails.push({
                        drNumber,
                        origin,
                        destination,
                        truckPlate
                    });
                    
                    // Check if customer details match
                    if (customerName !== firstCustomerName || customerContact !== firstCustomerContact) {
                        sameCustomer = false;
                    }
                });
                
                if (!sameCustomer) {
                    showError('All selected deliveries must belong to the same customer');
                    return;
                }
                
                // If all selected rows belong to the same customer, open signature pad with multiple DR numbers
                const drNumber = drNumbers.join(', '); // Display all DR numbers
                const customerName = firstCustomerName;
                const customerContact = firstCustomerContact;
                // For truck plate and route, use the first one as a representative
                const truckPlate = deliveryDetails[0].truckPlate;
                const deliveryRoute = `${deliveryDetails[0].origin} to ${deliveryDetails[0].destination}`;
                
                // Store the multiple DR numbers for saving
                window.multipleDRNumbers = drNumbers;
                window.deliveryDetails = deliveryDetails;
                
                // Open signature pad with delivery details
                openSignaturePadMultiple(drNumber, customerName, customerContact, truckPlate, deliveryRoute, drNumbers);
            } else {
                // For other views, use the original single DR functionality
                let drNumber = '';
                let customerName = '';
                let customerContact = '';
                let truckPlate = '';
                let deliveryRoute = '';
                
                const row = selectedRows[0].closest('tr');
                drNumber = row.querySelector('td:nth-child(2)').textContent;
                
                if (activeDeliveriesView && activeDeliveriesView.classList.contains('active')) {
                    customerName = row.querySelector('td:nth-child(3)').textContent;
                    customerContact = row.querySelector('td:nth-child(4)').textContent;
                    // Get truck plate from the appropriate column
                    truckPlate = row.querySelector('td:nth-child(8)').textContent;
                    // Get origin and destination for route
                    const origin = row.querySelector('td:nth-child(5)').textContent;
                    const destination = row.querySelector('td:nth-child(6)').textContent;
                    deliveryRoute = `${origin} to ${destination}`;
                }
                
                // Open signature pad with delivery details
                openSignaturePad(drNumber, customerName, customerContact, truckPlate, deliveryRoute);
            }
        });
    }
    
    // Checkbox selection in Active Deliveries table
    const activeDeliveriesTableBody = document.getElementById('activeDeliveriesTableBody');
    if (activeDeliveriesTableBody) {
        // Use event delegation for dynamically added rows
        activeDeliveriesTableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('delivery-checkbox')) {
                // Enable/disable E-Signature button based on selection
                const hasSelection = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox:checked').length > 0;
                const eSignatureBtn = document.getElementById('eSignatureBtn');
                if (eSignatureBtn) {
                    eSignatureBtn.disabled = !hasSelection;
                }
            }
        });
    }
    
    // Select all checkbox in Active Deliveries
    const selectAllActive = document.getElementById('selectAllActive');
    if (selectAllActive) {
        selectAllActive.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            
            // Enable/disable E-Signature button based on selection
            const eSignatureBtn = document.getElementById('eSignatureBtn');
            if (eSignatureBtn) {
                eSignatureBtn.disabled = !e.target.checked;
            }
        });
    }
}

// Initialize E-POD export button
function initEPodExportButton() {
    const exportEPodBtn = document.getElementById('exportEPodBtn');
    if (exportEPodBtn) {
        exportEPodBtn.addEventListener('click', exportEPodToPdf);
    }
}

function updateDeliveryStatus(drNumber, newStatus) {
    // In a real app, this would update the backend
    console.log(`Updating DR ${drNumber} to status: ${newStatus}`);
    
    // Update UI if the delivery is in the active deliveries view
    const activeDeliveriesRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
    activeDeliveriesRows.forEach(row => {
        const drCell = row.querySelector('td:nth-child(2)'); // DR Number is now in the second column (first is checkbox)
        if (drCell && drCell.textContent.trim() === drNumber) {
            const statusCell = row.querySelector('td:nth-child(9)'); // Status is now in the 9th column
            if (statusCell) {
                statusCell.innerHTML = `<span class="badge bg-success">
                    <i class="bi bi-check-circle"></i> ${newStatus}
                </span>`;
            }
            
            // Mark the row as signed
            row.classList.add('table-success');
        }
    });
    
    // Also update in the global activeDeliveries array if it exists
    console.log('Window activeDeliveries:', window.activeDeliveries);
    console.log('Window deliveryHistory:', window.deliveryHistory);
    
    if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
        const deliveryIndex = window.activeDeliveries.findIndex(d => d.drNumber === drNumber);
        console.log('Delivery index found:', deliveryIndex);
        if (deliveryIndex !== -1) {
            const delivery = window.activeDeliveries[deliveryIndex];
            delivery.status = newStatus;
            delivery.completedDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Move to history if completed
            if (newStatus === 'Completed') {
                console.log('Moving delivery to history');
                // Add to delivery history
                if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
                    // Add the completed delivery to history
                    window.deliveryHistory.unshift(delivery);
                    console.log('Added to history, new history length:', window.deliveryHistory.length);
                    
                    // Remove from active deliveries
                    window.activeDeliveries.splice(deliveryIndex, 1);
                    console.log('Removed from active, new active length:', window.activeDeliveries.length);
                    
                    // Save to localStorage
                    if (window.saveToLocalStorage && typeof window.saveToLocalStorage === 'function') {
                        console.log('Saving to localStorage');
                        window.saveToLocalStorage();
                    }
                    
                    // Refresh both views
                    if (window.loadActiveDeliveries && typeof window.loadActiveDeliveries === 'function') {
                        console.log('Loading active deliveries');
                        window.loadActiveDeliveries();
                    }
                    if (window.loadDeliveryHistory && typeof window.loadDeliveryHistory === 'function') {
                        console.log('Loading delivery history');
                        window.loadDeliveryHistory();
                    }
                    
                    // Update dashboard metrics
                    if (typeof window.updateDashboardMetrics === 'function') {
                        window.updateDashboardMetrics();
                    }
                }
            }
        }
    }
}

function loadEPodDeliveries() {
    // Use dataService to fetch E-POD records if available
    if (typeof window.dataService !== 'undefined') {
        window.dataService.getEPodRecords().then(records => {
            renderEPodDeliveries(records);
        }).catch(error => {
            console.error('Error loading E-POD records from dataService:', error);
            // Fallback to localStorage
            const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            renderEPodDeliveries(ePodRecords);
        });
    } else {
        // Fallback to localStorage
        const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        renderEPodDeliveries(ePodRecords);
    }
}

function renderEPodDeliveries(ePodRecords) {
    const container = document.getElementById('ePodCardsContainer');
    const paginationContainer = document.getElementById('ePodPagination');
    
    if (!container || !paginationContainer) return;
    
    // Clear existing content
    container.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    if (ePodRecords.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
                <p class="mt-3">No signed deliveries found</p>
            </div>
        `;
        return;
    }
    
    // Sort by signed date (newest first)
    const sortedRecords = [...ePodRecords].sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt));
    
    // Pagination settings
    const recordsPerPage = 10;
    const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
    const currentPage = 1; // In a real app, you would track this state
    
    // Get records for current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, sortedRecords.length);
    const recordsToShow = sortedRecords.slice(startIndex, endIndex);
    
    // Add "Select All" checkbox at the top
    const selectAllContainer = document.createElement('div');
    selectAllContainer.className = 'col-12 mb-3';
    selectAllContainer.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="selectAllEPod">
            <label class="form-check-label" for="selectAllEPod">
                Select All E-POD Records
            </label>
        </div>
    `;
    container.appendChild(selectAllContainer);
    
    // Add event listener for select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllEPod');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = container.querySelectorAll('.e-pod-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    // Add cards for each signed delivery
    recordsToShow.forEach((record, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${record.drNumber}</h6>
                        <div class="form-check">
                            <input class="form-check-input e-pod-checkbox" type="checkbox" id="ePodCheckbox${startIndex + index}" data-record-index="${startIndex + index}">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <small class="text-muted">Customer</small>
                        <p class="mb-1">${record.customerName}</p>
                        <small class="text-muted">Contact</small>
                        <p class="mb-1">${record.customerContact}</p>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">Route</small>
                        <p class="mb-1">${record.origin} to ${record.destination}</p>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">Truck</small>
                        <p class="mb-1">${record.truckPlate}</p>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">Signed Date</small>
                        <p class="mb-1">${new Date(record.signedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="text-center">
                        <img src="${record.signature}" alt="Signature" class="img-fluid border" style="max-height: 100px; object-fit: contain;">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Add event listeners for individual checkboxes to update select all state
    const individualCheckboxes = container.querySelectorAll('.e-pod-checkbox');
    individualCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckboxState();
        });
    });
    
    // Add pagination controls if needed
    if (totalPages > 1) {
        let paginationHtml = `
            <nav>
                <ul class="pagination">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
                    </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHtml += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
                    </li>
                </ul>
            </nav>
        `;
        
        paginationContainer.innerHTML = paginationHtml;
        
        // Add event listeners to pagination links
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    // In a real app, you would update the currentPage and reload the data
                    console.log(`Loading page ${page}`);
                }
            });
        });
    }
}

// Helper function to update the state of the "Select All" checkbox
function updateSelectAllCheckboxState() {
    const container = document.getElementById('ePodCardsContainer');
    if (!container) return;
    
    const selectAllCheckbox = document.getElementById('selectAllEPod');
    const individualCheckboxes = container.querySelectorAll('.e-pod-checkbox');
    const checkedCheckboxes = container.querySelectorAll('.e-pod-checkbox:checked');
    
    if (selectAllCheckbox) {
        if (checkedCheckboxes.length === 0) {
            // No checkboxes selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === individualCheckboxes.length) {
            // All checkboxes selected
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            // Some but not all checkboxes selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

// Export E-POD records to Excel
function exportEPodToExcel() {
    try {
        // Check if XLSX library is available
        if (typeof XLSX === 'undefined') {
            showToast('Excel export library not loaded. Please try again.', 'error');
            return;
        }

        // Get E-POD records from localStorage
        const ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        
        if (ePodRecords.length === 0) {
            showToast('No E-POD records to export', 'warning');
            return;
        }

        // Prepare data for export
        const exportData = ePodRecords.map(record => ({
            'DR Number': record.drNumber || 'N/A',
            'Customer Name': record.customerName || 'N/A',
            'Customer Contact': record.customerContact || 'N/A',
            'Truck Plate': record.truckPlate || 'N/A',
            'Origin': record.origin || 'N/A',
            'Destination': record.destination || 'N/A',
            'Signed Date': record.signedAt ? new Date(record.signedAt).toLocaleDateString() : 'N/A',
            'Status': record.status || 'N/A'
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // DR Number
            { wch: 25 }, // Customer Name
            { wch: 20 }, // Customer Contact
            { wch: 15 }, // Truck Plate
            { wch: 25 }, // Origin
            { wch: 25 }, // Destination
            { wch: 15 }, // Signed Date
            { wch: 15 }  // Status
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'E-POD Records');
        
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        const filename = `E_POD_Records_${date}.xlsx`;
        
        // Export to file
        XLSX.writeFile(wb, filename);
        
        showToast(`Exported ${ePodRecords.length} E-POD records to ${filename}`, 'success');
    } catch (error) {
        console.error('Error exporting E-POD records:', error);
        showToast('Error exporting E-POD data. Please try again.', 'error');
    }
}

// Export E-POD records as PDF
function exportEPodToPdf() {
    try {
        // Get E-POD records from localStorage
        let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
        
        // Check if any checkboxes are selected
        const selectedCheckboxes = document.querySelectorAll('.e-pod-checkbox:checked');
        
        // If checkboxes are selected, filter records to only include selected ones
        if (selectedCheckboxes.length > 0) {
            const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.recordIndex));
            ePodRecords = ePodRecords.filter((record, index) => selectedIndices.includes(index));
        } else if (document.getElementById('selectAllEPod') && document.getElementById('selectAllEPod').checked) {
            // If "Select All" is checked, export all records (no filtering needed)
            // This is already the default behavior
        } else {
            // If no checkboxes are selected and "Select All" is not checked, export all records by default
            // Or show a message if you prefer to require selection
            // For now, we'll export all records if none are specifically selected
        }
        
        if (ePodRecords.length === 0) {
            showToast('No E-POD records to export', 'warning');
            return;
        }

        // Create a new window for the PDF content
        const printWindow = window.open('', '_blank');
        
        // Generate HTML content for the PDF
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>E-POD Records</title>
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
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>E-POD Records</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        // Add each record to the HTML content
        for (let i = 0; i < ePodRecords.length; i++) {
            const record = ePodRecords[i];
            const signedDate = record.signedAt ? new Date(record.signedAt).toLocaleString() : 'N/A';
            const signatureHtml = record.signature ? 
                `<img src="${record.signature}" class="signature-image" alt="Signature">` : 
                '<div>No signature available</div>';
                
            // Format status with animation if completed
            let statusHtml = record.status || 'N/A';
            if (record.status === 'Completed') {
                statusHtml = `<span class="status-completed">${record.status}</span>`;
            }
                
            htmlContent += `
            <div class="record">
                <div class="record-title">Record #${i + 1}</div>
                <div class="field">
                    <span class="field-label">DR Number:</span>
                    <span>${record.drNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Customer Name:</span>
                    <span>${record.customerName || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Customer Contact:</span>
                    <span>${record.customerContact || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="field-label">Truck Plate:</span>
                    <span>${record.truckPlate || 'N/A'}</span>
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
                    <span class="field-label">Signed Date:</span>
                    <span>${signedDate}</span>
                </div>
                <div class="field">
                    <span class="field-label">Status:</span>
                    <span>${statusHtml}</span>
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
                // Close the window after printing (optional)
                // printWindow.close();
            }, 500);
        };

        showToast(`Exporting ${ePodRecords.length} E-POD records to PDF. Please check your print dialog to save as PDF.`, 'success');
    } catch (error) {
        console.error('Error exporting E-POD records to PDF:', error);
        showToast('Error exporting E-POD records to PDF. Please try again.', 'error');
    }
}

// Initialize auth
function initAuth() {
    // Clear any existing user data to force recreation with new name
    localStorage.removeItem('mci-user');
    
    // Check if user is logged in
    let user = localStorage.getItem('mci-user');
    
    // For testing purposes, create mock user data if none exists
    if (!user) {
        const mockUser = {
            name: 'SMEG warehouse',
            role: 'Administrator',
            email: 'admin@mci.com'
        };
        localStorage.setItem('mci-user', JSON.stringify(mockUser));
        user = JSON.stringify(mockUser);
        console.log('Created mock user for testing');
    }
    
    if (user) {
        const userData = JSON.parse(user);
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');
        const profileNameEl = document.getElementById('profileName');
        const profileRoleEl = document.getElementById('profileRole');
        const firstNameEl = document.getElementById('firstName');
        const lastNameEl = document.getElementById('lastName');
        const emailEl = document.getElementById('email');
        
        if (userNameEl) userNameEl.textContent = userData.name;
        if (userRoleEl) userRoleEl.textContent = userData.role;
        if (userAvatarEl) userAvatarEl.textContent = userData.name.charAt(0) + (userData.name.split(' ')[1] ? userData.name.split(' ')[1].charAt(0) : '');
        if (profileNameEl) profileNameEl.textContent = userData.name;
        if (profileRoleEl) profileRoleEl.textContent = userData.role;
        if (firstNameEl) firstNameEl.value = userData.name.split(' ')[0];
        if (lastNameEl) lastNameEl.value = userData.name.split(' ')[1] || '';
        if (emailEl) emailEl.value = userData.email;
    }
}

// Customer Management Functions
// Note: customers array is declared in HTML file

// Load customers data
async function loadCustomers() {
    console.log('Loading customers...');
    
    // Use the existing customers array from HTML
    if (typeof window.customers === 'undefined') {
        window.customers = [];
    }
    
    // Use dataService to load customers if available
    if (typeof window.dataService !== 'undefined') {
        try {
            const customers = await window.dataService.getCustomers();
            // Update the global customers array
            window.customers.length = 0; // Clear existing
            window.customers.push(...customers);
            
            // Merge duplicate customers based on name and phone number
            await mergeDuplicateCustomers();
        } catch (error) {
            console.error('Error loading customers from dataService:', error);
            // Fallback to current implementation
            await fallbackLoadCustomers();
        }
    } else {
        // Fallback to current implementation
        await fallbackLoadCustomers();
    }
    
    // If no customers, create some mock customers for demo
    if (window.customers.length === 0) {
        const mockCustomers = [
            {
                id: 'CUST-001',
                contactPerson: 'Juan Dela Cruz',
                phone: '+63 917 123 4567',
                address: '123 Main St, Makati City',
                accountType: 'Individual',
                email: 'juan@email.com',
                status: 'active',
                notes: 'Regular customer',
                bookingsCount: 5,
                lastDelivery: 'Dec 15, 2024',
                createdAt: new Date('2024-01-15')
            },
            {
                id: 'CUST-002',
                contactPerson: 'Maria Santos',
                phone: '+63 918 987 6543',
                address: '456 Business Ave, BGC, Taguig',
                accountType: 'Corporate',
                email: 'maria@company.com',
                status: 'active',
                notes: 'Corporate account',
                bookingsCount: 12,
                lastDelivery: 'Dec 20, 2024',
                createdAt: new Date('2024-02-10')
            }
        ];
        window.customers.push(...mockCustomers);
        
        // Save to dataService or localStorage
        if (typeof window.dataService !== 'undefined') {
            for (const customer of mockCustomers) {
                await window.dataService.saveCustomer(customer);
            }
        } else if (typeof window.saveCustomer === 'function') {
            for (const customer of mockCustomers) {
                await window.saveCustomer(customer);
            }
        } else {
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    }
    
    // Make loadCustomers globally accessible
    window.loadCustomers = loadCustomers;
    window.mergeDuplicateCustomers = mergeDuplicateCustomers;
    
    // Call the existing displayCustomers function if it exists
    if (typeof displayCustomers === 'function') {
        displayCustomers();
    } else if (typeof window.displayCustomers === 'function') {
        window.displayCustomers();
    }
}

// Fallback implementation for loading customers
async function fallbackLoadCustomers() {
    // Load from database or localStorage
    if (typeof window.getCustomers === 'function') {
        try {
            const customers = await window.getCustomers();
            // Update the global customers array
            window.customers.length = 0; // Clear existing
            window.customers.push(...customers);
            
            // Merge duplicate customers based on name and phone number
            await mergeDuplicateCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            // Fallback to localStorage
            const savedCustomers = localStorage.getItem('mci-customers');
            if (savedCustomers) {
                const parsedCustomers = JSON.parse(savedCustomers);
                // Update the global customers array
                window.customers.length = 0; // Clear existing
                window.customers.push(...parsedCustomers);
                
                // Merge duplicate customers based on name and phone number
                await mergeDuplicateCustomers();
            }
        }
    } else {
        // Fallback to localStorage
        const savedCustomers = localStorage.getItem('mci-customers');
        if (savedCustomers) {
            const parsedCustomers = JSON.parse(savedCustomers);
            // Update the global customers array
            window.customers.length = 0; // Clear existing
            window.customers.push(...parsedCustomers);
            
            // Merge duplicate customers based on name and phone number
            await mergeDuplicateCustomers();
        }
    }
}

// Function to merge duplicate customers based on name and phone number
async function mergeDuplicateCustomers() {
    console.log('=== MERGE DUPLICATE CUSTOMERS FUNCTION CALLED ===');
    console.log('Customers before merge:', window.customers.length);
    
    // Create a map to group customers by name and phone
    const customerGroups = new Map();
    
    // Group customers by name and phone number
    window.customers.forEach(customer => {
        const key = `${customer.contactPerson.toLowerCase()}|${customer.phone}`;
        if (!customerGroups.has(key)) {
            customerGroups.set(key, []);
        }
        customerGroups.get(key).push(customer);
    });
    
    // Process groups to merge duplicates
    const mergedCustomers = [];
    let mergeCount = 0;
    
    customerGroups.forEach((group, key) => {
        if (group.length === 1) {
            // No duplicates, just add the customer
            mergedCustomers.push(group[0]);
        } else {
            // Merge duplicates
            console.log(`Merging ${group.length} duplicate customers for: ${key}`);
            mergeCount += group.length - 1;
            
            // Sort by createdAt to get the most recent one as the primary
            group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Use the most recent customer as the base
            const primaryCustomer = { ...group[0] };
            
            // Merge data from all duplicates
            let totalBookings = 0;
            let latestDeliveryDate = null;
            
            group.forEach(customer => {
                totalBookings += customer.bookingsCount || 0;
                
                // Get the latest delivery date
                if (customer.lastDelivery) {
                    const customerDate = new Date(customer.lastDelivery);
                    if (!latestDeliveryDate || customerDate > latestDeliveryDate) {
                        latestDeliveryDate = customerDate;
                    }
                }
                
                // Merge notes
                if (customer.notes && !primaryCustomer.notes.includes(customer.notes)) {
                    primaryCustomer.notes = primaryCustomer.notes ? 
                        `${primaryCustomer.notes}; ${customer.notes}` : 
                        customer.notes;
                }
                
                // Keep the most complete address if available
                if (customer.address && customer.address.length > (primaryCustomer.address?.length || 0)) {
                    primaryCustomer.address = customer.address;
                }
                
                // Keep the most complete email if available
                if (customer.email && customer.email.length > (primaryCustomer.email?.length || 0)) {
                    primaryCustomer.email = customer.email;
                }
            });
            
            // Update the primary customer with merged data
            primaryCustomer.bookingsCount = totalBookings;
            if (latestDeliveryDate) {
                primaryCustomer.lastDelivery = latestDeliveryDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            
            mergedCustomers.push(primaryCustomer);
        }
    });
    
    // Update the global customers array
    window.customers = mergedCustomers;
    
    // Save to database or localStorage
    if (typeof window.saveCustomer === 'function') {
        try {
            // Save all merged customers
            for (const customer of mergedCustomers) {
                await window.saveCustomer(customer);
            }
        } catch (error) {
            console.error('Error saving merged customers:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else {
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    }
    
    console.log(`Merged ${mergeCount} duplicate customers`);
    console.log('Customers after merge:', window.customers.length);
    
    return mergeCount;
}

// Display customers in the card layout
function displayCustomers() {
    const customersContainer = document.getElementById('customersContainer');
    if (!customersContainer) {
        console.error('Customers container not found');
        return;
    }

    customersContainer.innerHTML = '';

    window.customers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">${customer.contactPerson}</h5>
                            <p class="card-text text-muted">${customer.accountType} Account</p>
                        </div>
                        <span class="badge bg-${customer.status === 'active' ? 'success' : customer.status === 'pending' ? 'warning text-dark' : 'secondary'}">
                            ${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                    </div>
                    <div class="mt-3">
                        <div class="d-flex mb-2">
                            <i class="bi bi-geo-alt text-secondary me-2"></i>
                            <span class="small">${customer.address}</span>
                        </div>
                        <div class="d-flex mb-2">
                            <i class="bi bi-telephone text-secondary me-2"></i>
                            <span class="small">${customer.phone}</span>
                        </div>
                        <div class="d-flex">
                            <i class="bi bi-envelope text-secondary me-2"></i>
                            <span class="small">${customer.email || 'No email'}</span>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-4">
                        <div>
                            <span class="text-muted small">Bookings:</span>
                            <strong>${customer.bookingsCount || 0}</strong>
                        </div>
                        <div>
                            <span class="text-muted small">Last Delivery:</span>
                            <strong class="small">${customer.lastDelivery || 'Never'}</strong>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="editCustomer('${customer.id}')">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${customer.id}')">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        customersContainer.appendChild(card);
    });

    console.log(`Displayed ${window.customers.length} customers`);
}

// Save new customer
async function saveCustomer() {
    const contactPerson = document.getElementById('contactPerson').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const accountType = document.getElementById('accountType').value;
    const email = document.getElementById('email').value.trim(); // Fixed: was 'email2'
    const notes = document.getElementById('notes').value.trim();

    if (!contactPerson || !phone || !address) {
        showError('Please fill in all required fields');
        return;
    }

    const newCustomer = {
        id: 'CUST-' + String(window.customers.length + 1).padStart(3, '0'),
        contactPerson,
        phone,
        address,
        accountType,
        email,
        status: 'active',
        notes,
        bookingsCount: 0,
        lastDelivery: null,
        createdAt: new Date()
    };

    window.customers.push(newCustomer);
    
    // Save to dataService or localStorage
    if (typeof window.dataService !== 'undefined') {
        try {
            await window.dataService.saveCustomer(newCustomer);
        } catch (error) {
            console.error('Error saving customer to dataService:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else if (typeof window.saveCustomer === 'function') {
        try {
            await window.saveCustomer(newCustomer);
        } catch (error) {
            console.error('Error saving customer:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else {
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    }

    // Clear form
    document.getElementById('addCustomerForm').reset();

    // Refresh display
    displayCustomers();

    showToast('Customer added successfully!');
}

// Edit customer
function editCustomer(customerId) {
    const customer = window.customers.find(c => c.id === customerId);
    if (!customer) return;

    // Populate form with customer data
    document.getElementById('contactPerson').value = customer.contactPerson;
    document.getElementById('phone').value = customer.phone;
    document.getElementById('address').value = customer.address;
    document.getElementById('accountType').value = customer.accountType;
    document.getElementById('email').value = customer.email || ''; // Fixed: was 'email2'
    document.getElementById('notes').value = customer.notes || '';

    // Show modal
    const addCustomerModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    addCustomerModal.show();

    // Change save button to update
    const saveBtn = document.getElementById('saveCustomerBtn');
    saveBtn.textContent = 'Update Customer';
    saveBtn.onclick = function() {
        updateCustomer(customerId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
    };
}

// Update customer
async function updateCustomer(customerId) {
    const customerIndex = window.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;

    window.customers[customerIndex] = {
        ...window.customers[customerIndex],
        contactPerson: document.getElementById('contactPerson').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        accountType: document.getElementById('accountType').value,
        email: document.getElementById('email').value.trim(), // Fixed: was 'email2'
        notes: document.getElementById('notes').value.trim()
    };

    // Save to dataService or localStorage
    if (typeof window.dataService !== 'undefined') {
        try {
            await window.dataService.saveCustomer(window.customers[customerIndex]);
        } catch (error) {
            console.error('Error updating customer in dataService:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else if (typeof window.saveCustomer === 'function') {
        try {
            await window.saveCustomer(window.customers[customerIndex]);
        } catch (error) {
            console.error('Error updating customer:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else {
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    }

    // Reset save button
    const saveBtn = document.getElementById('saveCustomerBtn');
    saveBtn.textContent = 'Save Customer';
    saveBtn.onclick = function() {
        saveCustomer();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
    };

    // Clear form
    document.getElementById('addCustomerForm').reset();

    // Refresh display
    displayCustomers();

    showToast('Customer updated successfully!');
}

// Delete customer
async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    const customerIndex = window.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;

    window.customers.splice(customerIndex, 1);
    
    // Delete from dataService or localStorage
    if (typeof window.dataService !== 'undefined') {
        try {
            await window.dataService.deleteCustomer(customerId);
        } catch (error) {
            console.error('Error deleting customer from dataService:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else if (typeof window.deleteCustomer === 'function') {
        try {
            await window.deleteCustomer(customerId);
        } catch (error) {
            console.error('Error deleting customer:', error);
            // Fallback to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        }
    } else {
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    }

    displayCustomers();
    showToast('Customer deleted successfully!');
}

// View customer history
function viewCustomerHistory(customerId) {
    const customer = window.customers.find(c => c.id === customerId);
    if (!customer) return;

    showToast(`Viewing history for ${customer.contactPerson}`);
}

// Initialize Supabase authentication
function initSupabaseAuth() {
    // Check if Supabase is available
    if (typeof window.initSupabase === 'function') {
        window.initSupabase();
        
        // Set up auth state change listener
        if (typeof window.onAuthStateChange === 'function') {
            window.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                if (event === 'SIGNED_OUT') {
                    // Redirect to login or update UI
                    console.log('User signed out');
                    // Refresh the page to reset the UI
                    window.location.reload();
                } else if (event === 'SIGNED_IN') {
                    // Update UI with user info
                    console.log('User signed in');
                    updateUserInfo();
                }
            });
        }
        
        // Update user info on load
        updateUserInfo();
    } else {
        console.log('Supabase not available, using mock authentication');
    }
}

// Update user info in the UI
async function updateUserInfo() {
    if (typeof window.getCurrentUser === 'function') {
        const user = await window.getCurrentUser();
        if (user) {
            // Update UI elements with user info
            const userNameElements = document.querySelectorAll('#userName, #profileName');
            userNameElements.forEach(el => {
                if (el) el.textContent = user.name || 'User';
            });
            
            const userRoleElements = document.querySelectorAll('#userRole, #profileRole');
            userRoleElements.forEach(el => {
                if (el) el.textContent = user.role || 'User';
            });
            
            // Update avatar
            const avatarElement = document.getElementById('userAvatar');
            if (avatarElement) {
                avatarElement.textContent = user.name ? user.name.charAt(0) : 'U';
            }
            
            // Update profile settings form
            const firstNameEl = document.getElementById('profileFirstName');
            const lastNameEl = document.getElementById('profileLastName');
            const emailEl = document.getElementById('profileEmail');
            
            if (firstNameEl && lastNameEl && emailEl) {
                if (user.name) {
                    const nameParts = user.name.split(' ');
                    firstNameEl.value = nameParts[0] || '';
                    lastNameEl.value = nameParts.slice(1).join(' ') || '';
                }
                if (user.email) {
                    emailEl.value = user.email;
                }
            }
        }
    }
}

// Enhanced logout function
async function logout() {
    // Use Supabase logout if available
    if (typeof window.logout === 'function') {
        try {
            await window.logout();
            // Clear any local data
            localStorage.removeItem('mci-user');
            localStorage.removeItem('mci-activeDeliveries');
            localStorage.removeItem('mci-deliveryHistory');
            localStorage.removeItem('mci-customers');
            localStorage.removeItem('ePodRecords');
            
            // Redirect to login page or refresh
            window.location.reload();
        } catch (error) {
            console.error('Error during logout:', error);
            // Still clear local data and redirect
            localStorage.removeItem('mci-user');
            localStorage.removeItem('mci-activeDeliveries');
            localStorage.removeItem('mci-deliveryHistory');
            localStorage.removeItem('mci-customers');
            localStorage.removeItem('ePodRecords');
            window.location.reload();
        }
    } else {
        // Fallback to current implementation
        localStorage.removeItem('mci-user');
        localStorage.removeItem('mci-activeDeliveries');
        localStorage.removeItem('mci-deliveryHistory');
        localStorage.removeItem('mci-customers');
        localStorage.removeItem('ePodRecords');
        window.location.reload();
    }
}

// Make export functions globally accessible
window.exportEPodToExcel = exportEPodToExcel;
window.exportEPodToPdf = exportEPodToPdf;

// Make auth functions globally accessible
window.initSupabaseAuth = initSupabaseAuth;
window.updateUserInfo = updateUserInfo;
