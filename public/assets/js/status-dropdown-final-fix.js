/**
 * FINAL STATUS DROPDOWN FIX
 * Eliminates duplicate "Canceled" entries and consolidates all status functionality
 */

console.log('🔧 Loading Final Status Dropdown Fix...');

(function() {
    'use strict';
    
    /**
     * Get status information (class and icon)
     */
    function getStatusInfo(status) {
        switch (status) {
            case 'Active':
                return { class: 'bg-success', icon: 'bi-check-circle' };
            case 'In Transit':
                return { class: 'bg-primary', icon: 'bi-truck' };
            case 'On Schedule':
                return { class: 'bg-info', icon: 'bi-clock' };
            case 'Delayed':
                return { class: 'bg-warning', icon: 'bi-exclamation-triangle' };
            case 'Sold Undelivered':
                return { class: 'bg-warning', icon: 'bi-exclamation-triangle' };
            case 'Completed':
                return { class: 'bg-success', icon: 'bi-check-circle-fill' };
            case 'Signed':
                return { class: 'bg-success', icon: 'bi-pen' };
            default:
                return { class: 'bg-secondary', icon: 'bi-question-circle' };
        }
    }
    
    /**
     * Generate status options for dropdown - FIXED VERSION
     */
    function generateStatusOptions(currentStatus, deliveryId) {
        console.log(`🔧 Generating status options for ${deliveryId}, current: ${currentStatus}`);
        
        // ONLY these statuses - no duplicates
        const availableStatuses = ['Active', 'In Transit', 'On Schedule', 'Delayed', 'Sold Undelivered'];
        
        // Don't allow changing from Completed or Signed status
        if (currentStatus === 'Completed' || currentStatus === 'Signed') {
            return `<div class="status-option disabled">Status cannot be changed</div>`;
        }
        
        const options = availableStatuses.map(status => {
            const isSelected = status === currentStatus ? 'selected' : '';
            const statusInfo = getStatusInfo(status);
            
            // Display text mapping - map statuses for display
            let displayText = status;
            if (status === 'Delayed') {
                displayText = 'Canceled';
            } else if (status === 'Sold Undelivered') {
                displayText = 'Sold Undelivered';
            }
            
            return `
                <div class="status-option ${isSelected}" 
                     onclick="updateDeliveryStatusById('${deliveryId}', '${status}')">
                    <i class="bi ${statusInfo.icon}"></i> ${displayText}
                </div>
            `;
        }).join('');
        
        console.log(`✅ Generated ${availableStatuses.length} status options (no duplicates)`);
        return options;
    }
    
    /**
     * Get display text for status
     */
    function getStatusDisplayText(status) {
        if (status === 'Delayed') {
            return 'Canceled';
        } else if (status === 'Sold Undelivered') {
            return 'Sold Undelivered';
        }
        return status;
    }
    
    /**
     * Toggle status dropdown visibility
     */
    function toggleStatusDropdown(deliveryId) {
        console.log(`🔧 Toggling dropdown for delivery: ${deliveryId}`);
        
        // Close all other dropdowns first
        document.querySelectorAll('.status-dropdown').forEach(dropdown => {
            if (dropdown.id !== `statusDropdown-${deliveryId}`) {
                dropdown.style.display = 'none';
            }
        });
        
        // Toggle current dropdown
        const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            console.log(`✅ Dropdown ${isVisible ? 'closed' : 'opened'}`);
        } else {
            console.error(`❌ Dropdown not found: statusDropdown-${deliveryId}`);
        }
    }
    
    /**
     * Update delivery status by ID
     */
    function updateDeliveryStatusById(deliveryId, newStatus) {
        console.log(`🔄 Updating delivery ${deliveryId} to status: ${newStatus}`);
        
        try {
            // Find the delivery in active deliveries
            const activeDeliveries = window.activeDeliveries || [];
            const deliveryIndex = activeDeliveries.findIndex(d => d.id === deliveryId);
            
            if (deliveryIndex !== -1) {
                // Update the status
                activeDeliveries[deliveryIndex].status = newStatus;
                
                // Save to localStorage
                localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
                
                // Update global reference
                window.activeDeliveries = activeDeliveries;
                
                // Update the UI immediately
                updateStatusInTable(deliveryId, newStatus);
                
                // Close the dropdown
                const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
                
                // Show success message
                if (typeof window.showToast === 'function') {
                    const displayStatus = getStatusDisplayText(newStatus);
                    window.showToast(`Status updated to "${displayStatus}"`, 'success');
                }
                
                console.log(`✅ Status updated successfully`);
                
            } else {
                console.error(`❌ Delivery not found: ${deliveryId}`);
            }
            
        } catch (error) {
            console.error('❌ Error updating delivery status:', error);
        }
    }
    
    /**
     * Update status in table without full refresh
     */
    function updateStatusInTable(deliveryId, newStatus) {
        const tableRow = document.querySelector(`tr[data-delivery-id="${deliveryId}"]`);
        if (!tableRow) {
            console.warn(`⚠️ Table row not found for delivery ${deliveryId}`);
            return;
        }
        
        const statusCell = tableRow.querySelector('.status-dropdown-container');
        if (!statusCell) {
            console.warn(`⚠️ Status cell not found for delivery ${deliveryId}`);
            return;
        }
        
        const statusInfo = getStatusInfo(newStatus);
        const statusBadge = statusCell.querySelector('.status-clickable');
        
        if (statusBadge) {
            // Update badge
            statusBadge.className = `badge ${statusInfo.class} status-clickable`;
            
            // Use display text mapping
            const displayText = getStatusDisplayText(newStatus);
            
            statusBadge.innerHTML = `
                <i class="bi ${statusInfo.icon}"></i> ${displayText}
                <i class="bi bi-chevron-down ms-1" style="font-size: 0.8em;"></i>
            `;
            
            // Update data attributes
            statusBadge.setAttribute('data-current-status', newStatus);
        }
        
        // Update dropdown options
        const dropdown = statusCell.querySelector('.status-dropdown');
        if (dropdown) {
            dropdown.innerHTML = generateStatusOptions(newStatus, deliveryId);
        }
        
        console.log(`✅ Table updated for delivery ${deliveryId}`);
    }
    
    /**
     * Initialize final status dropdown fix
     */
    function initFinalStatusDropdownFix() {
        console.log('🚀 Initializing Final Status Dropdown Fix...');
        
        // Override ALL global functions to prevent conflicts
        window.getStatusInfo = getStatusInfo;
        window.generateStatusOptions = generateStatusOptions;
        window.getStatusDisplayText = getStatusDisplayText;
        window.toggleStatusDropdown = toggleStatusDropdown;
        window.updateDeliveryStatusById = updateDeliveryStatusById;
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.status-dropdown-container')) {
                document.querySelectorAll('.status-dropdown').forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
            }
        });
        
        console.log('✅ Final Status Dropdown Fix initialized');
        console.log('🎯 All status dropdown functions consolidated - no more duplicates');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinalStatusDropdownFix);
    } else {
        initFinalStatusDropdownFix();
    }
    
    // Export for global access
    window.finalStatusDropdownFix = {
        getStatusInfo,
        generateStatusOptions,
        getStatusDisplayText,
        toggleStatusDropdown,
        updateDeliveryStatusById,
        updateStatusInTable
    };
    
    console.log('✅ Final Status Dropdown Fix loaded - duplicate "Canceled" issue resolved');
    
})();