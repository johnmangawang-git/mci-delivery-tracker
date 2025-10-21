// Enhanced Group Signature - DR-Only Mode: Complete ALL deliveries with same DR Number
console.log('=== ENHANCED GROUP SIGNATURE DR-ONLY MODE LOADED ===');

/**
 * Enhanced delivery completion that groups by DR Number ONLY
 * When signing one item, complete ALL items with same DR Number (regardless of customer/mobile/serial)
 * Perfect for scenarios where you have multiple identical DRs with different serial numbers
 */

// Store original updateDeliveryStatus function
let originalUpdateDeliveryStatus = null;

// Configuration: Choose grouping mode
const GROUPING_MODES = {
    DR_ONLY: 'dr_only',                    // Group by DR Number only
    DR_CUSTOMER_MOBILE: 'dr_customer_mobile'  // Group by DR + Customer + Mobile (original)
};

// Default mode: DR_ONLY for identical DRs with different serials
let currentGroupingMode = GROUPING_MODES.DR_ONLY;

// Initialize enhanced group signature
function initEnhancedGroupSignatureDROnly() {
    console.log('🖊️ Initializing Enhanced Group Signature (DR-Only Mode)...');
    
    // Store original function if it exists
    if (typeof window.updateDeliveryStatus === 'function') {
        originalUpdateDeliveryStatus = window.updateDeliveryStatus;
        console.log('✅ Original updateDeliveryStatus function stored');
    }
    
    // Override with enhanced version
    window.updateDeliveryStatus = enhancedUpdateDeliveryStatusDROnly;
    
    console.log(`✅ Enhanced Group Signature initialized (Mode: ${currentGroupingMode})`);
}

/**
 * Enhanced updateDeliveryStatus that completes all matching deliveries
 * Matches by: DR Number ONLY (for identical DRs with different serials)
 */
function enhancedUpdateDeliveryStatusDROnly(drNumber, newStatus) {
    console.log(`🖊️ ENHANCED GROUP (DR-ONLY): Updating DR ${drNumber} status to: ${newStatus}`);
    
    try {
        // If not completing, use original logic
        if (newStatus !== 'Completed') {
            if (originalUpdateDeliveryStatus) {
                return originalUpdateDeliveryStatus(drNumber, newStatus);
            }
            return;
        }
        
        // Find all deliveries with the same DR number
        const matchingDeliveries = findMatchingDeliveriesByDR(drNumber);
        
        if (matchingDeliveries.length === 0) {
            console.warn(`⚠️ No deliveries found for DR: ${drNumber}`);
            if (originalUpdateDeliveryStatus) {
                return originalUpdateDeliveryStatus(drNumber, newStatus);
            }
            return;
        }
        
        console.log(`🎯 Found ${matchingDeliveries.length} deliveries with DR: ${drNumber}`);
        
        // Log all deliveries that will be completed
        matchingDeliveries.forEach((delivery, index) => {
            const serialNumber = delivery.serialNumber || delivery.serial_number;
            const customerName = delivery.customerName || delivery.customer_name;
            console.log(`📋 Delivery ${index + 1}/${matchingDeliveries.length}: DR ${drNumber}, Serial: ${serialNumber}, Customer: ${customerName}`);
        });
        
        // Complete all matching deliveries
        matchingDeliveries.forEach((delivery, index) => {
            const serialNumber = delivery.serialNumber || delivery.serial_number;
            console.log(`✅ Completing delivery ${index + 1}/${matchingDeliveries.length}: DR ${drNumber} (Serial: ${serialNumber})`);
            
            // Update individual delivery
            updateSingleDeliveryStatusDROnly(delivery, newStatus);
        });
        
        // Remove all completed deliveries from active deliveries in one batch
        removeCompletedDeliveriesFromActive(matchingDeliveries);
        
        // Refresh UI
        refreshDeliveryViews();
        
        console.log(`🎉 Enhanced Group Signature (DR-Only) completed ${matchingDeliveries.length} deliveries with DR: ${drNumber}`);
        
        // Show completion summary
        showCompletionSummary(drNumber, matchingDeliveries.length);
        
    } catch (error) {
        console.error('❌ Error in enhanced group signature (DR-Only):', error);
        // Fallback to original function
        if (originalUpdateDeliveryStatus) {
            originalUpdateDeliveryStatus(drNumber, newStatus);
        }
    }
}

/**
 * Find all deliveries with the same DR number (regardless of customer/mobile/serial)
 */
function findMatchingDeliveriesByDR(drNumber) {
    if (!window.activeDeliveries || !Array.isArray(window.activeDeliveries)) {
        console.warn('⚠️ activeDeliveries array not available');
        return [];
    }
    
    const matchingDeliveries = window.activeDeliveries.filter(delivery => {
        const deliveryDR = delivery.drNumber || delivery.dr_number;
        const drMatch = deliveryDR === drNumber;
        
        if (drMatch) {
            const serialNumber = delivery.serialNumber || delivery.serial_number;
            const customerName = delivery.customerName || delivery.customer_name;
            console.log(`🔍 Found matching DR: ${deliveryDR}, Serial: ${serialNumber}, Customer: ${customerName}`);
        }
        
        return drMatch;
    });
    
    console.log(`📊 Matching criteria - DR: "${drNumber}" (DR-Only Mode)`);
    console.log(`📋 Found ${matchingDeliveries.length} matching deliveries`);
    
    return matchingDeliveries;
}

/**
 * Update status for a single delivery (DR-Only mode)
 */
function updateSingleDeliveryStatusDROnly(delivery, newStatus) {
    const deliveryDR = delivery.drNumber || delivery.dr_number;
    const serialNumber = delivery.serialNumber || delivery.serial_number;
    
    console.log(`🔄 Updating single delivery: ${deliveryDR} (Serial: ${serialNumber})`);
    
    try {
        // Update UI - find the specific row by DR and Serial Number
        updateDeliveryRowInUIDROnly(deliveryDR, serialNumber, newStatus);
        
        // Update delivery object
        delivery.status = newStatus;
        delivery.completedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Add e-signature timestamp
        delivery.eSignatureDate = new Date().toISOString();
        delivery.completionMethod = 'Enhanced Group Signature (DR-Only)';
        
        // Move to history if completed (but don't remove from active yet - batch removal later)
        if (newStatus === 'Completed') {
            moveDeliveryToHistoryDROnly(delivery);
        }
        
        console.log(`✅ Updated delivery: ${deliveryDR} (Serial: ${serialNumber})`);
        
    } catch (error) {
        console.error(`❌ Error updating delivery ${deliveryDR}:`, error);
    }
}

/**
 * Update delivery row in UI table (DR-Only mode)
 */
function updateDeliveryRowInUIDROnly(drNumber, serialNumber, newStatus) {
    const activeDeliveriesRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
    
    activeDeliveriesRows.forEach(row => {
        const drCell = row.querySelector('td:nth-child(2)'); // DR Number column
        const serialCell = row.querySelector('td:nth-child(12)'); // Serial Number column
        
        if (drCell && serialCell) {
            const rowDR = drCell.textContent.trim();
            const rowSerial = serialCell.textContent.trim();
            
            // Match by both DR and Serial Number for precision
            if (rowDR === drNumber && rowSerial === serialNumber) {
                console.log(`🎨 Updating UI for DR: ${drNumber}, Serial: ${serialNumber}`);
                
                // Update status cell
                const statusCell = row.querySelector('td:nth-child(8)'); // Status column
                if (statusCell) {
                    statusCell.innerHTML = `<span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> ${newStatus}
                    </span>`;
                }
                
                // Mark row as completed with animation
                row.classList.add('table-success');
                row.style.transition = 'all 0.3s ease';
                row.style.backgroundColor = '#d1e7dd';
                
                console.log(`✅ UI updated for DR: ${drNumber}, Serial: ${serialNumber}`);
            }
        }
    });
}

/**
 * Move delivery to history (DR-Only mode)
 */
function moveDeliveryToHistoryDROnly(delivery) {
    const deliveryDR = delivery.drNumber || delivery.dr_number;
    const serialNumber = delivery.serialNumber || delivery.serial_number;
    
    try {
        // Initialize history array if needed
        if (!window.deliveryHistory) {
            window.deliveryHistory = [];
        }
        
        // Create a deep copy to avoid reference issues and ensure all fields are preserved
        const historyEntry = {
            ...JSON.parse(JSON.stringify(delivery)),
            // Enhanced Group Signature metadata
            movedToHistoryDate: new Date().toISOString(),
            completionMethod: 'Enhanced Group Signature (DR-Only)',
            groupedWithDR: deliveryDR,
            completedDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            // Enhanced timestamp with date and time for precise tracking
            completedDateTime: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }),
            // ISO timestamp for precise sorting and data integrity
            completedTimestamp: new Date().toISOString(),
            // Ensure critical fields are preserved with both naming conventions
            itemNumber: delivery.itemNumber || delivery.item_number || '',
            item_number: delivery.item_number || delivery.itemNumber || '',
            mobileNumber: delivery.mobileNumber || delivery.mobile_number || '',
            mobile_number: delivery.mobile_number || delivery.mobileNumber || '',
            itemDescription: delivery.itemDescription || delivery.item_description || '',
            item_description: delivery.item_description || delivery.itemDescription || '',
            serialNumber: delivery.serialNumber || delivery.serial_number || '',
            serial_number: delivery.serial_number || delivery.serialNumber || '',
            // Preserve other important fields
            drNumber: delivery.drNumber || delivery.dr_number || '',
            dr_number: delivery.dr_number || delivery.drNumber || '',
            customerName: delivery.customerName || delivery.customer_name || '',
            customer_name: delivery.customer_name || delivery.customerName || '',
            vendorNumber: delivery.vendorNumber || delivery.vendor_number || '',
            vendor_number: delivery.vendor_number || delivery.vendorNumber || ''
        };
        
        // Check if already in history to prevent duplicates
        const alreadyInHistory = window.deliveryHistory.some(h => {
            const hDR = h.drNumber || h.dr_number;
            const hSerial = h.serialNumber || h.serial_number;
            return hDR === deliveryDR && hSerial === serialNumber;
        });
        
        if (!alreadyInHistory) {
            window.deliveryHistory.unshift(historyEntry);
            console.log(`📚 Added to history: ${deliveryDR} (Serial: ${serialNumber})`);
            
            // Log preserved fields for verification
            console.log(`🔍 Preserved fields for ${deliveryDR}:`, {
                itemNumber: historyEntry.itemNumber,
                mobileNumber: historyEntry.mobileNumber,
                itemDescription: historyEntry.itemDescription,
                serialNumber: historyEntry.serialNumber,
                customerName: historyEntry.customerName,
                completionMethod: historyEntry.completionMethod,
                completedDateTime: historyEntry.completedDateTime,
                completedTimestamp: historyEntry.completedTimestamp
            });
            
            // Save to storage immediately
            saveDeliveryDataDROnly(historyEntry);
        } else {
            console.log(`⚠️ Already in history: ${deliveryDR} (Serial: ${serialNumber})`);
        }
        
    } catch (error) {
        console.error(`❌ Error moving delivery to history: ${deliveryDR}`, error);
    }
}

/**
 * Remove completed deliveries from active deliveries in batch
 */
function removeCompletedDeliveriesFromActive(completedDeliveries) {
    if (!window.activeDeliveries || !Array.isArray(window.activeDeliveries)) {
        console.warn('⚠️ activeDeliveries array not available for batch removal');
        return;
    }
    
    console.log(`🗑️ Batch removing ${completedDeliveries.length} completed deliveries from active list`);
    
    // Create a set of completed delivery identifiers for fast lookup
    const completedIdentifiers = new Set(
        completedDeliveries.map(d => {
            const dr = d.drNumber || d.dr_number;
            const serial = d.serialNumber || d.serial_number;
            return `${dr}|${serial}`;
        })
    );
    
    // Filter out completed deliveries
    const originalCount = window.activeDeliveries.length;
    window.activeDeliveries = window.activeDeliveries.filter(delivery => {
        const dr = delivery.drNumber || delivery.dr_number;
        const serial = delivery.serialNumber || delivery.serial_number;
        const identifier = `${dr}|${serial}`;
        
        const shouldKeep = !completedIdentifiers.has(identifier);
        if (!shouldKeep) {
            console.log(`🗑️ Removing from active: ${dr} (Serial: ${serial})`);
        }
        return shouldKeep;
    });
    
    const removedCount = originalCount - window.activeDeliveries.length;
    console.log(`✅ Batch removal complete: ${removedCount} deliveries removed from active list`);
}

/**
 * Save delivery data to storage (DR-Only mode)
 */
function saveDeliveryDataDROnly(delivery) {
    try {
        // Save to localStorage
        if (typeof window.saveToLocalStorage === 'function') {
            window.saveToLocalStorage();
        }
        
        // Save to Supabase with enhanced metadata
        if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
            window.dataService.saveDelivery(delivery).catch(error => {
                console.error('Error saving to Supabase:', error);
            });
        }
        
    } catch (error) {
        console.error('Error saving delivery data:', error);
    }
}

/**
 * Show completion summary notification
 */
function showCompletionSummary(drNumber, completedCount) {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-2" style="font-size: 1.2em;"></i>
                <div>
                    <strong>Group Signature Complete!</strong><br>
                    <small>Completed ${completedCount} deliveries with DR: ${drNumber}</small>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
    } catch (error) {
        console.error('Error showing completion summary:', error);
    }
}

/**
 * Refresh delivery views
 */
function refreshDeliveryViews() {
    try {
        // Refresh Active Deliveries
        if (typeof window.loadActiveDeliveries === 'function') {
            window.loadActiveDeliveries();
        }
        
        // Refresh Delivery History
        if (typeof window.loadDeliveryHistory === 'function') {
            window.loadDeliveryHistory();
        }
        
        console.log('🔄 Delivery views refreshed');
        
    } catch (error) {
        console.error('Error refreshing delivery views:', error);
    }
}

/**
 * Switch grouping mode
 */
function setGroupingMode(mode) {
    if (Object.values(GROUPING_MODES).includes(mode)) {
        currentGroupingMode = mode;
        console.log(`🔄 Grouping mode changed to: ${mode}`);
        return true;
    }
    console.error(`❌ Invalid grouping mode: ${mode}`);
    return false;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initEnhancedGroupSignatureDROnly();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedGroupSignatureDROnly);
} else {
    initEnhancedGroupSignatureDROnly();
}

// Make functions globally available for testing
window.enhancedUpdateDeliveryStatusDROnly = enhancedUpdateDeliveryStatusDROnly;
window.findMatchingDeliveriesByDR = findMatchingDeliveriesByDR;
window.setGroupingMode = setGroupingMode;
window.GROUPING_MODES = GROUPING_MODES;
window.removeCompletedDeliveriesFromActive = removeCompletedDeliveriesFromActive;

console.log('✅ Enhanced Group Signature (DR-Only Mode) module loaded successfully');