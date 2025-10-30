/**
 * FORCE NEW COLUMNS FIX
 * Aggressively ensures new columns are populated in Active Deliveries table
 */

console.log('🔧 Loading Force New Columns Fix...');

(function() {
    'use strict';
    
    /**
     * Force populate new columns in existing table
     */
    function forcePopulateNewColumns() {
        console.log('🔄 Force populating new columns...');
        
        const tableBody = document.querySelector('#activeDeliveriesTable tbody');
        if (!tableBody) {
            console.warn('⚠️ Active deliveries table not found');
            return;
        }
        
        const rows = tableBody.querySelectorAll('tr');
        console.log(`📊 Found ${rows.length} rows to process`);
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            
            // Skip if not enough columns (should have at least 13 columns)
            if (cells.length < 13) {
                console.warn(`⚠️ Row ${index} has only ${cells.length} columns, skipping`);
                return;
            }
            
            // Get delivery ID
            const deliveryId = row.getAttribute('data-delivery-id');
            if (!deliveryId) {
                console.warn(`⚠️ Row ${index} has no delivery ID`);
                return;
            }
            
            // Find delivery data
            const activeDeliveries = window.activeDeliveries || [];
            const delivery = activeDeliveries.find(d => d.id === deliveryId);
            
            if (!delivery) {
                console.warn(`⚠️ No delivery data found for ID: ${deliveryId}`);
                return;
            }
            
            console.log(`🔍 Processing delivery ${deliveryId}:`, delivery);
            
            // Force update columns (indices based on table structure)
            // Booked Date (column 9)
            if (cells[9]) {
                const bookedDate = delivery.bookedDate || delivery.booked_date || 
                                 delivery.deliveryDate || delivery.delivery_date || 
                                 delivery.created_date || 'N/A';
                cells[9].textContent = formatDate(bookedDate);
                console.log(`📅 Set booked date: ${cells[9].textContent}`);
            }
            
            // Item Number (column 10)
            if (cells[10]) {
                const itemNumber = delivery.itemNumber || delivery.item_number || 
                                 delivery.Item_Number || delivery.ItemNumber || '-';
                cells[10].textContent = itemNumber;
                console.log(`🏷️ Set item number: ${cells[10].textContent}`);
            }
            
            // Mobile Number (column 11)
            if (cells[11]) {
                const mobileNumber = delivery.mobileNumber || delivery.mobile_number || 
                                   delivery.Mobile_Number || delivery.MobileNumber || 
                                   delivery.phone || delivery.contact || '-';
                cells[11].textContent = mobileNumber;
                console.log(`📱 Set mobile number: ${cells[11].textContent}`);
            }
            
            // Item Description (column 12)
            if (cells[12]) {
                const itemDescription = delivery.itemDescription || delivery.item_description || 
                                      delivery.Item_Description || delivery.ItemDescription || 
                                      delivery.description || '-';
                cells[12].textContent = itemDescription;
                console.log(`📝 Set item description: ${cells[12].textContent}`);
            }
            
            // Serial Number (column 13)
            if (cells[13]) {
                const serialNumber = delivery.serialNumber || delivery.serial_number || 
                                   delivery.Serial_Number || delivery.SerialNumber || 
                                   delivery.serial || '-';
                cells[13].textContent = serialNumber;
                console.log(`🔢 Set serial number: ${cells[13].textContent}`);
            }
        });
        
        console.log('✅ Force population completed');
    }
    
    /**
     * Format date for display
     */
    function formatDate(dateValue) {
        if (!dateValue || dateValue === 'N/A') return 'N/A';
        
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return dateValue;
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateValue;
        }
    }
    
    /**
     * Override the loadActiveDeliveries function to force populate after loading
     */
    function overrideLoadActiveDeliveries() {
        if (typeof window.loadActiveDeliveries === 'function') {
            const originalLoadActiveDeliveries = window.loadActiveDeliveries;
            
            window.loadActiveDeliveries = async function(...args) {
                console.log('🔄 Enhanced loadActiveDeliveries called');
                
                // Call original function
                const result = await originalLoadActiveDeliveries.apply(this, args);
                
                // Force populate new columns after a short delay
                setTimeout(() => {
                    forcePopulateNewColumns();
                }, 200);
                
                return result;
            };
            
            console.log('✅ loadActiveDeliveries function overridden');
        }
    }
    
    /**
     * Add manual trigger button for testing
     */
    function addManualTrigger() {
        // Add a floating button for manual testing
        const button = document.createElement('button');
        button.innerHTML = '🔄 Fix Columns';
        button.className = 'btn btn-warning btn-sm';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            font-size: 12px;
        `;
        button.onclick = forcePopulateNewColumns;
        
        document.body.appendChild(button);
        console.log('✅ Manual trigger button added');
    }
    
    /**
     * Monitor for table changes and auto-fix
     */
    function monitorTableChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasTableRows = addedNodes.some(node => 
                        node.nodeType === 1 && 
                        (node.tagName === 'TR' || node.querySelector('tr'))
                    );
                    
                    if (hasTableRows) {
                        console.log('📊 Table rows added, triggering column fix...');
                        setTimeout(forcePopulateNewColumns, 100);
                    }
                }
            });
        });
        
        const tableBody = document.querySelector('#activeDeliveriesTable tbody');
        if (tableBody) {
            observer.observe(tableBody, { childList: true, subtree: true });
            console.log('✅ Table change monitor activated');
        }
    }
    
    /**
     * Initialize force new columns fix
     */
    function initForceNewColumnsFix() {
        console.log('🚀 Initializing Force New Columns Fix...');
        
        // Override functions
        overrideLoadActiveDeliveries();
        
        // Add manual trigger
        addManualTrigger();
        
        // Monitor table changes
        monitorTableChanges();
        
        // Initial force population
        setTimeout(() => {
            forcePopulateNewColumns();
        }, 1000);
        
        // Periodic check every 5 seconds
        setInterval(() => {
            const tableBody = document.querySelector('#activeDeliveriesTable tbody');
            if (tableBody && tableBody.children.length > 0) {
                forcePopulateNewColumns();
            }
        }, 5000);
        
        console.log('✅ Force New Columns Fix initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForceNewColumnsFix);
    } else {
        initForceNewColumnsFix();
    }
    
    // Export for global access
    window.forceNewColumnsFix = {
        forcePopulateNewColumns,
        formatDate
    };
    
    console.log('✅ Force New Columns Fix loaded');
    
})();