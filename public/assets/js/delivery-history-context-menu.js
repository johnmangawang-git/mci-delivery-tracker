/**
 * Right-click context menu for delivery history items
 * Provides Print PDF and Delete options for individual delivery records
 */

(function() {
    let contextMenu = null;
    let selectedRow = null;

    // Create context menu HTML
    function createContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'delivery-history-context-menu';
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="print-pdf">
                <i class="bi bi-file-earmark-pdf"></i>
                <span>Print PDF</span>
            </div>
            <div class="context-menu-item" data-action="delete">
                <i class="bi bi-trash"></i>
                <span>Delete Record</span>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .context-menu {
                position: fixed;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10000;
                min-width: 150px;
                display: none;
            }
            
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .context-menu-item:hover {
                background-color: #f8f9fa;
            }
            
            .context-menu-item i {
                width: 16px;
            }
            
            .delivery-history-row {
                cursor: context-menu;
            }
            
            .delivery-history-row:hover {
                background-color: #f8f9fa;
            }
        `;
        
        if (!document.getElementById('context-menu-styles')) {
            style.id = 'context-menu-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(menu);
        return menu;
    }

    // Show context menu
    function showContextMenu(e, row) {
        e.preventDefault();
        
        if (!contextMenu) {
            contextMenu = createContextMenu();
        }
        
        selectedRow = row;
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        
        // Add click handlers for menu items
        const menuItems = contextMenu.querySelectorAll('.context-menu-item');
        menuItems.forEach(item => {
            item.onclick = handleContextMenuAction;
        });
    }

    // Hide context menu
    function hideContextMenu() {
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
        selectedRow = null;
    }

    // Handle context menu actions
    function handleContextMenuAction(e) {
        const action = e.currentTarget.getAttribute('data-action');
        
        if (!selectedRow) {
            hideContextMenu();
            return;
        }

        switch (action) {
            case 'print-pdf':
                handlePrintPDF();
                break;
            case 'delete':
                handleDeleteRecord();
                break;
        }
        
        hideContextMenu();
    }

    // Handle Print PDF action
    function handlePrintPDF() {
        if (!selectedRow) return;
        
        // Get the checkbox for this row and select it
        const checkbox = selectedRow.querySelector('.delivery-history-checkbox');
        if (checkbox) {
            // Clear all other selections
            const allCheckboxes = document.querySelectorAll('.delivery-history-checkbox');
            allCheckboxes.forEach(cb => cb.checked = false);
            
            // Select only this row
            checkbox.checked = true;
            
            // Trigger the existing PDF export function
            if (typeof exportDeliveryHistoryToPdf === 'function') {
                exportDeliveryHistoryToPdf();
            } else {
                console.error('PDF export function not found');
                alert('PDF export function is not available');
            }
        }
    }

    // Handle Delete Record action
    function handleDeleteRecord() {
        if (!selectedRow) return;
        
        // Get the checkbox for this row
        const checkbox = selectedRow.querySelector('.delivery-history-checkbox');
        if (checkbox) {
            // Confirm deletion
            const drNumber = selectedRow.cells[1]?.textContent || 'Unknown';
            if (confirm(`Are you sure you want to delete delivery record ${drNumber}?`)) {
                // Clear all other selections
                const allCheckboxes = document.querySelectorAll('.delivery-history-checkbox');
                allCheckboxes.forEach(cb => cb.checked = false);
                
                // Select only this row
                checkbox.checked = true;
                
                // Enable delete mode if not already enabled
                if (typeof window.toggleDeliveryHistoryDeleteMode === 'function') {
                    const deleteBtn = document.getElementById('toggleDeleteModeBtn');
                    if (deleteBtn && !deleteBtn.classList.contains('active')) {
                        window.toggleDeliveryHistoryDeleteMode();
                    }
                }
                
                // Trigger the existing delete function
                if (typeof window.deleteSelectedDeliveryHistory === 'function') {
                    window.deleteSelectedDeliveryHistory();
                } else {
                    console.error('Delete function not found');
                    alert('Delete function is not available');
                }
            }
        }
    }

    // Initialize context menu functionality
    function initializeContextMenu() {
        // Add right-click event listeners to delivery history rows
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    addContextMenuToRows();
                }
            });
        });

        // Start observing the delivery history table body
        const tableBody = document.getElementById('deliveryHistoryTableBody');
        if (tableBody) {
            observer.observe(tableBody, { childList: true, subtree: true });
            addContextMenuToRows(); // Add to existing rows
        }

        // Hide context menu when clicking elsewhere
        document.addEventListener('click', hideContextMenu);
        document.addEventListener('contextmenu', function(e) {
            if (!e.target.closest('#delivery-history-context-menu') && 
                !e.target.closest('.delivery-history-row')) {
                hideContextMenu();
            }
        });
    }

    // Add context menu to delivery history rows
    function addContextMenuToRows() {
        const rows = document.querySelectorAll('#deliveryHistoryTableBody tr');
        rows.forEach(row => {
            if (!row.classList.contains('delivery-history-row')) {
                row.classList.add('delivery-history-row');
                row.addEventListener('contextmenu', function(e) {
                    showContextMenu(e, row);
                });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContextMenu);
    } else {
        initializeContextMenu();
    }

})();