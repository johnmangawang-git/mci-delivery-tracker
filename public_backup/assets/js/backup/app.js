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

    function loadActiveDeliveries() {
        console.log('loadActiveDeliveries called');
        console.log('Current activeDeliveries:', activeDeliveries);
        const tableBody = document.getElementById('activeDeliveriesTableBody');
        if (!tableBody) {
            console.log('activeDeliveriesTableBody not found');
            return;
        }

        const deliveriesToShow = currentSearchTerm ? filteredDeliveries : activeDeliveries;

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
                    <td><strong>${delivery.drNumber}</strong></td>
                    <td>${delivery.customerName || 'N/A'}</td>
                    <td>${delivery.customerNumber || 'N/A'}</td>
                    <td>${delivery.origin}</td>
                    <td>${delivery.destination}</td>
                    <td>${delivery.distance}</td>
                    <td>${delivery.truckPlateNumber || 'N/A'}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge ${statusInfo.class}" style="min-width: 90px;">
                                <i class="${statusInfo.icon} me-1"></i>
                                ${delivery.status}
                            </span>
                            <select class="form-select form-select-sm status-selector"
                                    data-delivery-id="${delivery.id}"
                                    style="min-width: 120px; max-width: 140px;">
                                <option value="On Schedule" ${delivery.status === 'On Schedule' ? 'selected' : ''}>
                                    📅 On Schedule
                                </option>
                                <option value="In Transit" ${delivery.status === 'In Transit' ? 'selected' : ''}>
                                    🚛 In Transit
                                </option>
                                <option value="Delayed" ${delivery.status === 'Delayed' ? 'selected' : ''}>
                                    ⚠️ Delayed
                                </option>
                                <option value="Completed" ${delivery.status === 'Completed' ? 'selected' : ''}>
                                    ✅ Completed
                                </option>
                            </select>
                        </div>
                    </td>
                    <td>${bookedDate}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary e-signature-btn" data-dr-number="${delivery.drNumber}">
                            <i class="bi bi-pencil"></i> E-Signature
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.status-selector').forEach(selector => {
            selector.addEventListener('change', handleStatusChange);
        });

        document.querySelectorAll('.e-signature-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const drNumber = this.dataset.drNumber;
                showESignatureModal(drNumber);
            });
        });

        updateSearchResultsCount(deliveriesToShow.length);
    }

    function loadDeliveryHistory() {
        const tableBody = document.getElementById('deliveryHistoryTableBody');
        if (!tableBody) return;

        const historyToShow = currentHistorySearchTerm ? filteredHistory : deliveryHistory;

        if (historyToShow.length === 0) {
            const emptyMessage = currentHistorySearchTerm ?
                `No delivery history found matching "${currentHistorySearchTerm}"` :
                'No delivery history available';

            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-muted py-4">
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
                <td>${delivery.completedDate}</td>
                <td><strong>${delivery.drNumber}</strong></td>
                <td>${delivery.customerName || 'N/A'}</td>
                <td>${delivery.customerNumber || 'N/A'}</td>
                <td>${delivery.origin}</td>
                <td>${delivery.destination}</td>
                <td>${delivery.distance}</td>
                <td>$${delivery.additionalCosts.toFixed(2)}</td>
                <td>
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Completed
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-e-pod-btn" data-dr-number="${delivery.drNumber}">
                        <i class="bi bi-eye"></i> View E-POD
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.view-e-pod-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const drNumber = this.dataset.drNumber;
                showEPodModal(drNumber);
            });
        });

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
            return delivery.drNumber.toLowerCase().includes(currentSearchTerm) ||
                delivery.id.toLowerCase().includes(currentSearchTerm);
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
            return delivery.drNumber.toLowerCase().includes(currentHistorySearchTerm) ||
                delivery.id.toLowerCase().includes(currentHistorySearchTerm);
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
        initDRSearch();
        initHistorySearch();
        loadActiveDeliveries();
        loadDeliveryHistory();
    }

    // Make functions globally accessible
    window.loadActiveDeliveries = loadActiveDeliveries;
    window.loadDeliveryHistory = loadDeliveryHistory;
    window.initDeliveryManagement = initDeliveryManagement;

    // Initialize the application when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initDeliveryManagement();
    });
})();