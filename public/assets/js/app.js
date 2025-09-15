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
                
                // Save to localStorage
                saveToLocalStorage();
            }
            
            loadActiveDeliveries();
            loadDeliveryHistory();
            showToast(`Delivery status updated to ${newStatus}`);
        }
    }

    // Placeholder function for showing E-Signature modal
    function showESignatureModal(drNumber) {
        console.log(`Showing E-Signature modal for DR: ${drNumber}`);
        
        // Ensure signature pad is initialized
        if (typeof ensureSignaturePadInitialized === 'function') {
            ensureSignaturePadInitialized();
        }
        
        // Set delivery details in modal
        document.getElementById('ePodDrNumber').value = drNumber;
        // In a real app, you would fetch these details from your data
        document.getElementById('ePodCustomerName').value = 'Customer Name';
        document.getElementById('ePodCustomerContact').value = '09123456789';
        document.getElementById('ePodTruckPlate').value = 'ABC123';
        document.getElementById('ePodDeliveryRoute').value = 'Origin to Destination';
        
        // Show modal
        const eSignatureModal = new bootstrap.Modal(document.getElementById('eSignatureModal'));
        eSignatureModal.show();
    }

    // Placeholder function for showing E-POD modal
    function showEPodModal(drNumber) {
        console.log(`Showing E-POD modal for DR: ${drNumber}`);
        // This would be implemented in another file
        alert(`E-POD functionality for ${drNumber} would be implemented here`);
    }

    // Save data to localStorage
    function saveToLocalStorage() {
        try {
            localStorage.setItem('mci-activeDeliveries', JSON.stringify(activeDeliveries));
            localStorage.setItem('mci-deliveryHistory', JSON.stringify(deliveryHistory));
            console.log('Data saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load data from localStorage
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

    function loadActiveDeliveries() {
        console.log('loadActiveDeliveries called');
        console.log('Current activeDeliveries:', activeDeliveries);
        console.log('Window activeDeliveries:', window.activeDeliveries);
        
        // Make sure we're using the correct activeDeliveries array
        const deliveriesToUse = window.activeDeliveries;
        console.log('Using deliveries array:', deliveriesToUse);
        
        const tableBody = document.getElementById('activeDeliveriesTableBody');
        if (!tableBody) {
            console.log('activeDeliveriesTableBody not found');
            return;
        }

        const deliveriesToShow = currentSearchTerm ? filteredDeliveries : deliveriesToUse;

        console.log('Deliveries to show:', deliveriesToShow);

        if (deliveriesToShow.length === 0) {
            const emptyMessage = currentSearchTerm ?
                `No deliveries found matching "${currentSearchTerm}"` :
                'No active deliveries at the moment';

            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-muted py-4">
                        <i class="bi bi-${currentSearchTerm ? 'search' : 'truck'}"></i><br>
                        ${emptyMessage}
                        ${currentSearchTerm ? '<br><small>Try adjusting your search term</small>' : ''}
                    </td>
                </tr>
            `;
            updateSearchResultsCount(0);
            return;
        }

        tableBody.innerHTML = deliveriesToShow.map(delivery => {
            const statusInfo = getStatusInfo(delivery.status);

            let bookedDate = 'N/A';
            if (delivery.deliveryDate) {
                try {
                    const date = new Date(delivery.deliveryDate);
                    bookedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    console.error('Error formatting delivery date:', e);
                    bookedDate = delivery.deliveryDate;
                }
            } else if (delivery.timestamp) {
                try {
                    const date = new Date(delivery.timestamp);
                    bookedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    console.error('Error formatting timestamp:', e);
                }
            }

            return `
                <tr>
                    <td><input type="checkbox" class="form-check-input delivery-checkbox" data-dr-number="${delivery.drNumber}"></td>
                    <td><strong>${delivery.drNumber || 'N/A'}</strong></td>
                    <td>${delivery.customerName || 'N/A'}</td>
                    <td>${delivery.customerNumber || 'N/A'}</td>
                    <td>${delivery.origin || 'N/A'}</td>
                    <td>${delivery.destination || 'N/A'}</td>
                    <td>${delivery.distance || 'N/A'}</td>
                    <td>${delivery.truckPlateNumber || 'N/A'}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge ${statusInfo.class}" style="min-width: 90px;">
                                <i class="${statusInfo.icon} me-1"></i>
                                ${delivery.status || 'Unknown'}
                            </span>
                        </div>
                    </td>
                    <td>${bookedDate}</td>
                </tr>
            `;
        }).join('');

        // Add event listeners for checkboxes to enable/disable E-Signature button
        document.querySelectorAll('.delivery-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const hasSelection = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox:checked').length > 0;
                const eSignatureBtn = document.getElementById('eSignatureBtn');
                if (eSignatureBtn) {
                    eSignatureBtn.disabled = !hasSelection;
                }
                
                // Update select all checkbox state
                const allCheckboxes = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox');
                const checkedCheckboxes = document.querySelectorAll('#activeDeliveriesTableBody tr input.delivery-checkbox:checked');
                const selectAllCheckbox = document.getElementById('selectAllActive');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
                    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
                }
            });
        });

        updateSearchResultsCount(deliveriesToShow.length);
    }

    function loadDeliveryHistory() {
        const tableBody = document.getElementById('deliveryHistoryTableBody');
        if (!tableBody) return;

        const historyToShow = currentHistorySearchTerm ? filteredHistory : window.deliveryHistory;

        if (historyToShow.length === 0) {
            const emptyMessage = currentHistorySearchTerm ?
                `No delivery history found matching "${currentHistorySearchTerm}"` :
                'No delivery history available';

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-${currentHistorySearchTerm ? 'search' : 'clipboard-check'}"></i><br>
                        ${emptyMessage}
                        ${currentHistorySearchTerm ? '<br><small>Try adjusting your search term</small>' : ''}
                    </td>
                </tr>
            `;
            updateHistorySearchResultsCount(0);
            return;
        }

        tableBody.innerHTML = historyToShow.map(delivery => `
            <tr>
                <td>${delivery.completedDate || 'N/A'}</td>
                <td><strong>${delivery.drNumber || 'N/A'}</strong></td>
                <td>${delivery.customerName || 'N/A'}</td>
                <td>${delivery.customerNumber || 'N/A'}</td>
                <td>${delivery.origin || 'N/A'}</td>
                <td>${delivery.destination || 'N/A'}</td>
                <td>${delivery.distance || 'N/A'}</td>
                <td>₱${delivery.additionalCosts ? delivery.additionalCosts.toFixed(2) : '0.00'}</td>
                <td>
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Completed
                    </span>
                    <span class="badge bg-warning text-dark ms-1">
                        <i class="bi bi-pen"></i> Signed
                    </span>
                </td>
            </tr>
        `).join('');

        updateHistorySearchResultsCount(historyToShow.length);
    }

    function initDRSearch() {
        const searchInput = document.getElementById('drSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');

        if (!searchInput || !clearBtn) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            performDRSearch(searchTerm);
        });

        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            performDRSearch('');
            searchInput.focus();
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = e.target.value.trim();
                performDRSearch(searchTerm);
            }
        });
    }

    function performDRSearch(searchTerm) {
        currentSearchTerm = searchTerm.toLowerCase();

        if (!currentSearchTerm) {
            filteredDeliveries = [];
            loadActiveDeliveries();
            return;
        }

        filteredDeliveries = activeDeliveries.filter(delivery => {
            const drNumber = delivery.drNumber ? delivery.drNumber.toLowerCase() : '';
            const id = delivery.id ? delivery.id.toString().toLowerCase() : '';
            return drNumber.includes(currentSearchTerm) || id.includes(currentSearchTerm);
        });

        loadActiveDeliveries();
        console.log(`DR Search: "${searchTerm}" - Found ${filteredDeliveries.length} results`);
    }

    function updateSearchResultsCount(count) {
        const searchInput = document.getElementById('drSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        const searchResultsInfo = document.getElementById('searchResultsInfo');

        if (!searchInput || !searchResultsInfo) return;

        if (currentSearchTerm) {
            searchResultsInfo.style.display = 'block';
            searchResultsInfo.innerHTML = `
                <i class="bi bi-search"></i>
                <strong>${count}</strong> ${count === 1 ? 'delivery' : 'deliveries'} found for "<strong>${currentSearchTerm}</strong>"
                ${count === 0 ? ' <span class="text-muted">- Try adjusting your search term</span>' : ''}
            `;

            searchInput.setAttribute('title', `Found ${count} deliveries matching "${currentSearchTerm}"`);

            if (count === 0) {
                searchInput.classList.add('is-invalid');
                searchInput.classList.remove('is-valid');
                if (clearBtn) {
                    clearBtn.classList.add('search-no-results');
                    clearBtn.classList.remove('search-has-results');
                }
                searchResultsInfo.className = 'search-results-info mb-3 text-warning';
            } else {
                searchInput.classList.add('is-valid');
                searchInput.classList.remove('is-invalid');
                if (clearBtn) {
                    clearBtn.classList.add('search-has-results');
                    clearBtn.classList.remove('search-no-results');
                }
                searchResultsInfo.className = 'search-results-info mb-3 text-success';
            }
        } else {
            searchResultsInfo.style.display = 'none';
            searchInput.classList.remove('is-valid', 'is-invalid');
            if (clearBtn) {
                clearBtn.classList.remove('search-has-results', 'search-no-results');
            }
            searchInput.removeAttribute('title');
        }
    }

    function initHistorySearch() {
        const searchInput = document.getElementById('drSearchHistoryInput');
        const clearBtn = document.getElementById('clearHistorySearchBtn');

        if (!searchInput || !clearBtn) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            performHistoryDRSearch(searchTerm);
        });

        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            performHistoryDRSearch('');
            searchInput.focus();
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = e.target.value.trim();
                performHistoryDRSearch(searchTerm);
            }
        });
    }

    function performHistoryDRSearch(searchTerm) {
        currentHistorySearchTerm = searchTerm.toLowerCase();

        if (!currentHistorySearchTerm) {
            filteredHistory = [];
            loadDeliveryHistory();
            return;
        }

        filteredHistory = deliveryHistory.filter(delivery => {
            const drNumber = delivery.drNumber ? delivery.drNumber.toLowerCase() : '';
            const id = delivery.id ? delivery.id.toString().toLowerCase() : '';
            return drNumber.includes(currentHistorySearchTerm) || id.includes(currentHistorySearchTerm);
        });

        loadDeliveryHistory();
        console.log(`History DR Search: "${searchTerm}" - Found ${filteredHistory.length} results`);
    }

    function updateHistorySearchResultsCount(count) {
        const searchInput = document.getElementById('drSearchHistoryInput');
        const clearBtn = document.getElementById('clearHistorySearchBtn');
        const searchResultsInfo = document.getElementById('historySearchResultsInfo');

        if (!searchInput || !searchResultsInfo) return;

        if (currentHistorySearchTerm) {
            searchResultsInfo.style.display = 'block';
            searchResultsInfo.innerHTML = `
                <i class="bi bi-search"></i>
                <strong>${count}</strong> ${count === 1 ? 'record' : 'records'} found for "<strong>${currentHistorySearchTerm}</strong>"
                ${count === 0 ? ' <span class="text-muted">- Try adjusting your search term</span>' : ''}
            `;

            searchInput.setAttribute('title', `Found ${count} records matching "${currentHistorySearchTerm}"`);

            if (count === 0) {
                searchInput.classList.add('is-invalid');
                searchInput.classList.remove('is-valid');
                if (clearBtn) {
                    clearBtn.classList.add('search-no-results');
                    clearBtn.classList.remove('search-has-results');
                }
                searchResultsInfo.className = 'search-results-info mb-3 text-warning';
            } else {
                searchInput.classList.add('is-valid');
                searchInput.classList.remove('is-invalid');
                if (clearBtn) {
                    clearBtn.classList.add('search-has-results');
                    clearBtn.classList.remove('search-no-results');
                }
                searchResultsInfo.className = 'search-results-info mb-3 text-success';
            }
        } else {
            searchResultsInfo.style.display = 'none';
            searchInput.classList.remove('is-valid', 'is-invalid');
            if (clearBtn) {
                clearBtn.classList.remove('search-has-results', 'search-no-results');
            }
            searchInput.removeAttribute('title');
        }
    }

    function initDeliveryManagement() {
        // Load data from localStorage
        loadFromLocalStorage();

        // If no data, populate with mock data
        if (activeDeliveries.length === 0 && deliveryHistory.length === 0) {
            console.log('No data found in localStorage. Populating with mock data.');
            activeDeliveries = [
                {
                    id: 'DEL-001',
                    drNumber: 'DR-8842',
                    customerName: 'John Doe',
                    customerNumber: '09171234567',
                    origin: 'SMEG Alabang warehouse',
                    destination: 'Makati City',
                    distance: '12.5 km',
                    truckPlateNumber: 'ABC-1234',
                    status: 'In Transit',
                    deliveryDate: '2023-10-26'
                },
                {
                    id: 'DEL-002',
                    drNumber: 'DR-8850',
                    customerName: 'Jane Smith',
                    customerNumber: '09187654321',
                    origin: 'SMEG Alabang warehouse',
                    destination: 'Sta. Rosa, Laguna',
                    distance: '24.7 km',
                    truckPlateNumber: 'XYZ-5678',
                    status: 'On Schedule',
                    deliveryDate: '2023-10-26'
                }
            ];
            deliveryHistory = [
                {
                    id: 'DEL-003',
                    drNumber: 'DR-8862',
                    customerName: 'MCI Davao',
                    customerNumber: 'N/A',
                    origin: 'SMEG Davao warehouse',
                    destination: '101 Corporate Center, Davao',
                    distance: '5.3 km',
                    additionalCosts: 32.00,
                    status: 'Completed',
                    completedDate: 'Oct 23, 2023'
                },
                {
                    id: 'DEL-004',
                    drNumber: 'DR-8870',
                    customerName: 'MCI Cebu',
                    customerNumber: 'N/A',
                    origin: 'SMEG Cebu warehouse',
                    destination: '202- Mall, Cebu City',
                    distance: '14.8 km',
                    additionalCosts: 58.00,
                    status: 'Completed',
                    completedDate: 'Oct 22, 2023'
                }
            ];
            saveToLocalStorage(); // Save the mock data
        }

        initDRSearch();
        initHistorySearch();
        loadActiveDeliveries();
        loadDeliveryHistory();
    }

    // New function to add test data for E-signature testing
    function addTestData() {
        // Add some additional fake deliveries for testing
        const testData = [
            {
                id: 'DEL-005',
                drNumber: 'DR-9001',
                customerName: 'Test Customer 1',
                customerNumber: '09123456789',
                origin: 'SMEG Alabang warehouse',
                destination: 'Taguig City',
                distance: '15.2 km',
                truckPlateNumber: 'TEST-001',
                status: 'In Transit',
                deliveryDate: new Date().toISOString()
            },
            {
                id: 'DEL-006',
                drNumber: 'DR-9002',
                customerName: 'Test Customer 2',
                customerNumber: '09987654321',
                origin: 'SMEG Alabang warehouse',
                destination: 'Pasig City',
                distance: '18.7 km',
                truckPlateNumber: 'TEST-002',
                status: 'On Schedule',
                deliveryDate: new Date().toISOString()
            }
        ];

        // Add test data to activeDeliveries
        activeDeliveries.push(...testData);
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Reload the view
        loadActiveDeliveries();
        
        console.log('Test data added successfully');
        showToast('Test data added for E-signature testing');
    }

    // Make functions globally accessible
    // Create getters to ensure we always access the current arrays
    Object.defineProperty(window, 'activeDeliveries', {
        get: function() { return activeDeliveries; },
        set: function(value) { activeDeliveries = value; }
    });
    
    Object.defineProperty(window, 'deliveryHistory', {
        get: function() { return deliveryHistory; },
        set: function(value) { deliveryHistory = value; }
    });
    window.saveToLocalStorage = saveToLocalStorage;
    window.loadActiveDeliveries = loadActiveDeliveries;
    window.loadDeliveryHistory = loadDeliveryHistory;
    window.initDeliveryManagement = initDeliveryManagement;
    window.addTestData = addTestData; // Add the new function
    window.showToast = showToast;
    
    // Expose the internal functions that might be needed by other modules
    window.getStatusInfo = getStatusInfo;
    window.handleStatusChange = handleStatusChange;

    // Initialize the application when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initDeliveryManagement();
    });
})();