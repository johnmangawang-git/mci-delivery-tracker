/**
 * ROW CLICK SELECTION
 * Adds functionality to toggle checkboxes by clicking anywhere on the table row
 * Works for both Active Deliveries and Delivery History tables
 */

console.log('🖱️ Loading Row Click Selection...');

function setupRowClickSelection() {
    console.log('🔧 Setting up row click selection functionality...');
    
    // Add event delegation for row clicks
    document.addEventListener('click', function(e) {
        // Handle Active Deliveries table rows
        const activeRow = e.target.closest('#activeDeliveriesTableBody tr[data-delivery-id]');
        if (activeRow) {
            // Don't trigger if clicking on checkbox directly or status dropdown
            if (!e.target.closest('input[type="checkbox"]') && 
                !e.target.closest('.status-dropdown-container') &&
                !e.target.closest('.status-clickable')) {
                
                const checkbox = activeRow.querySelector('.delivery-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    // Trigger change event to update E-Signature button and select all state
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Active Deliveries row clicked - checkbox toggled');
                }
            }
        }
        
        // Handle Delivery History table rows
        const historyRow = e.target.closest('#deliveryHistoryTableBody tr');
        if (historyRow) {
            const historyCheckbox = historyRow.querySelector('.delivery-history-checkbox');
            if (historyCheckbox && !e.target.closest('input[type="checkbox"]')) {
                historyCheckbox.checked = !historyCheckbox.checked;
                // Trigger change event to update select all state and export buttons
                historyCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Delivery History row clicked - checkbox toggled');
            }
        }
    });
    
    console.log('✅ Row click selection functionality enabled');
    console.log('📋 Features:');
    console.log('   - Click any Active Deliveries row to toggle checkbox');
    console.log('   - Click any Delivery History row to toggle checkbox');
    console.log('   - Excludes checkbox and status dropdown areas');
    console.log('   - Maintains existing checkbox functionality');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRowClickSelection);
} else {
    setupRowClickSelection();
}

// Export for external access
window.setupRowClickSelection = setupRowClickSelection;

console.log('✅ Row Click Selection loaded successfully');