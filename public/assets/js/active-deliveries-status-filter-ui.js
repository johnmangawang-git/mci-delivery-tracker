/**
 * ACTIVE DELIVERIES STATUS FILTER UI
 * Adds status filtering functionality to the Active Deliveries table
 */

console.log('🎛️ Loading Active Deliveries Status Filter UI...');

(function() {
    'use strict';
    
    /**
     * Create status filter dropdown for Active Deliveries table
     */
    function createStatusFilterDropdown() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'status-filter-container mb-3';
        filterContainer.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-6">
                    <label for="statusFilter" class="form-label">Filter by Status:</label>
                    <select id="statusFilter" class="form-select">
                        <option value="">All Active Statuses</option>
                        <option value="Active">Active</option>
                        <option value="In Transit">In Transit</option>
                        <option value="On Schedule">On Schedule</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Sold Undelivered">Sold Undelivered</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="filter-stats mt-2">
                        <small class="text-muted">
                            <span id="filteredCount">0</span> of <span id="totalCount">0</span> deliveries shown
                        </small>
                    </div>
                </div>
            </div>
        `;
        
        return filterContainer;
    }
    
    /**
     * Apply status filter to Active Deliveries table
     */
    function applyStatusFilter(selectedStatus) {
        const tableBody = document.querySelector('#activeDeliveriesTable tbody');
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(4)'); // Assuming status is 4th column
            if (!statusCell) return;
            
            const rowStatus = statusCell.textContent.trim();
            let shouldShow = false;
            
            if (!selectedStatus) {
                // Show all rows when no filter is selected
                shouldShow = true;
            } else if (selectedStatus === 'Delayed') {
                // Show rows with "Delayed" status (internal status)
                shouldShow = rowStatus === 'Delayed';
            } else if (selectedStatus === 'Sold Undelivered') {
                // Show rows with "SUD - Sold Undelivered" or similar display text
                shouldShow = rowStatus.includes('SUD') || rowStatus.includes('Sold Undelivered');
            } else {
                // Exact match for other statuses
                shouldShow = rowStatus === selectedStatus;
            }
            
            if (shouldShow) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update filter stats
        updateFilterStats(visibleCount, rows.length);
    }
    
    /**
     * Update filter statistics display
     */
    function updateFilterStats(filtered, total) {
        const filteredCountEl = document.getElementById('filteredCount');
        const totalCountEl = document.getElementById('totalCount');
        
        if (filteredCountEl) filteredCountEl.textContent = filtered;
        if (totalCountEl) totalCountEl.textContent = total;
    }
    
    /**
     * Initialize status filter UI
     */
    function initStatusFilterUI() {
        console.log('🚀 Initializing Active Deliveries Status Filter UI...');
        
        // Find Active Deliveries table container
        const tableContainer = document.querySelector('#activeDeliveriesTable')?.closest('.card-body') || 
                              document.querySelector('#activeDeliveriesTable')?.parentElement;
        
        if (!tableContainer) {
            console.warn('⚠️ Active Deliveries table container not found');
            return;
        }
        
        // Check if filter already exists
        if (tableContainer.querySelector('.status-filter-container')) {
            console.log('ℹ️ Status filter UI already exists');
            return;
        }
        
        // Create and insert filter dropdown
        const filterDropdown = createStatusFilterDropdown();
        tableContainer.insertBefore(filterDropdown, tableContainer.firstChild);
        
        // Add event listener for filter changes
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                applyStatusFilter(this.value);
            });
        }
        
        // Initial filter application
        setTimeout(() => {
            applyStatusFilter('');
        }, 500);
        
        console.log('✅ Active Deliveries Status Filter UI initialized');
    }
    
    /**
     * Refresh filter UI when table is updated
     */
    function refreshFilterUI() {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            applyStatusFilter(statusFilter.value);
        }
    }
    
    // Export functions globally
    window.activeDeliveriesStatusFilterUI = {
        init: initStatusFilterUI,
        refresh: refreshFilterUI,
        applyFilter: applyStatusFilter
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStatusFilterUI);
    } else {
        initStatusFilterUI();
    }
    
    // Re-initialize when Active Deliveries table is updated
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasTableUpdate = addedNodes.some(node => 
                    node.nodeType === 1 && 
                    (node.id === 'activeDeliveriesTable' || node.querySelector('#activeDeliveriesTable'))
                );
                
                if (hasTableUpdate) {
                    setTimeout(initStatusFilterUI, 100);
                    setTimeout(refreshFilterUI, 200);
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Active Deliveries Status Filter UI loaded');
    
})();