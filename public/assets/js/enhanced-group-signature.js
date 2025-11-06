// Enhanced Group Signature - Complete deliveries by DR + Customer + Mobile matching
console.log('=== ENHANCED GROUP SIGNATURE LOADED ===');

/**
 * Enhanced delivery completion that groups by DR + Customer + Mobile
 * When signing one item, complete all items with same DR, Customer Name, and Mobile Number
 */

// Store original updateDeliveryStatus function
let originalUpdateDeliveryStatus = null;

// Initialize enhanced group signature
function initEnhancedGroupSignature() {
    console.log('🖊️ Initializing Enhanced Group Signature...');
    
    // Store original function if it exists
    if (typeof window.updateDeliveryStatus === 'function') {
        originalUpdateDeliveryStatus = window.updateDeliveryStatus;
        console.log('✅ Original updateDeliveryStatus function stored');
    }
    
    // Override with enhanced version
    window.updateDeliveryStatus = enhancedUpdateDeliveryStatus;
    
    console.log('✅ Enhanced Group Signature initialized');
}

/**
 * Enhanced updateDeliveryStatus that completes all matching deliveries
 * Matches by: DR Number + Customer Name + Mobile Number
 */
function enhancedUpdateDeliveryStatus(drNumber, newStatus) {
    console.log(`🖊️ ENHANCED GROUP: Updating DR ${drNumber} status to: ${newStatus}`);
    
    try {
        // If not completing, use original logic
        if (newStatus !== 'Completed') {
            if (originalUpdateDeliveryStatus) {
                return originalUpdateDeliveryStatus(drNumber, newStatus);
            }
            return;
        }
        
        // Find the delivery being signed to get customer info
        const signingDelivery = findDeliveryByDR(drNumber);
        if (!signingDelivery) {
            console.warn(`⚠️ Delivery not found for DR: ${drNumber}`);
            if (originalUpdateDeliveryStatus) {
                return originalUpdateDeliveryStatus(drNumber, newStatus);
            }
            return;
        }
        
        console.log('🔍 Found signing delivery:', {
            drNumber: signingDelivery.drNumber || signingDelivery.dr_number,
            customerName: signingDelivery.customerName || signingDelivery.customer_name,
            mobileNumber: signingDelivery.mobileNumber || signingDelivery.mobile_number
        });
        
        // Find all matching deliveries (same DR + Customer + Mobile)
        const matchingDeliveries = findMatchingDeliveries(
            drNumber,
            signingDelivery.customerName || signingDelivery.customer_name,
            signingDelivery.mobileNumber || signingDelivery.mobile_number
        );
        
        console.log(`🎯 Found ${matchingDeliveries.length} matching deliveries to complete`);
        
        // Complete all matching deliveries
        matchingDeliveries.forEach((delivery, index) => {
            const deliveryDR = delivery.drNumber || delivery.dr_number;
            console.log(`✅ Completing delivery ${index + 1}/${matchingDeliveries.length}: ${deliveryDR} (Serial: ${delivery.serialNumber || delivery.serial_number})`);
            
            // Update individual delivery
            updateSingleDeliveryStatus(delivery, newStatus);
        });
        
        // Refresh UI
        refreshDeliveryViews();
        
        console.log(`🎉 Enhanced Group Signature completed ${matchingDeliveries.length} deliveries`);
        
    } catch (error) {
        console.error('❌ Error in enhanced group signature:', error);
        // Fallback to original function
        if (originalUpdateDeliveryStatus) {
            originalUpdateDeliveryStatus(drNumber, newStatus);
        }
    }
}

/**
 * Find delivery by DR number in active deliveries
 */
function findDeliveryByDR(drNumber) {
    if (!window.activeDeliveries || !Array.isArray(window.activeDeliveries)) {
        console.warn('⚠️ activeDeliveries array not available');
        return null;
    }
    
    return window.activeDeliveries.find(delivery => {
        const deliveryDR = delivery.drNumber || delivery.dr_number;
        return deliveryDR === drNumber;
    });
}

/**
 * Find all deliveries matching DR + Customer + Mobile
 */
function findMatchingDeliveries(drNumber, customerName, mobileNumber) {
    if (!window.activeDeliveries || !Array.isArray(window.activeDeliveries)) {
        console.warn('⚠️ activeDeliveries array not available');
        return [];
    }
    
    const matchingDeliveries = window.activeDeliveries.filter(delivery => {
        const deliveryDR = delivery.drNumber || delivery.dr_number;
        const deliveryCustomer = delivery.customerName || delivery.customer_name;
        const deliveryMobile = delivery.mobileNumber || delivery.mobile_number;
        
        // Match criteria: same DR + same customer + same mobile
        const drMatch = deliveryDR === drNumber;
        const customerMatch = deliveryCustomer === customerName;
        const mobileMatch = deliveryMobile === mobileNumber;
        
        console.log(`🔍 Checking delivery ${deliveryDR}:`, {
            drMatch,
            customerMatch,
            mobileMatch,
            serialNumber: delivery.serialNumber || delivery.serial_number
        });
        
        return drMatch && customerMatch && mobileMatch;
    });
    
    console.log(`📊 Matching criteria - DR: "${drNumber}", Customer: "${customerName}", Mobile: "${mobileNumber}"`);
    console.log(`📋 Found ${matchingDeliveries.length} matching deliveries`);
    
    return matchingDeliveries;
}

/**
 * Update status for a single delivery
 */
function updateSingleDeliveryStatus(delivery, newStatus) {
    const deliveryDR = delivery.drNumber || delivery.dr_number;
    const serialNumber = delivery.serialNumber || delivery.serial_number;
    
    console.log(`🔄 Updating single delivery: ${deliveryDR} (Serial: ${serialNumber})`);
    
    try {
        // Update UI - find the specific row by DR and Serial Number
        updateDeliveryRowInUI(deliveryDR, serialNumber, newStatus);
        
        // Update delivery object
        delivery.status = newStatus;
        
        // Only set completion date if it doesn't already exist to preserve original completion time
        if (!delivery.completedDate && !delivery.completedDateTime && !delivery.signedAt) {
            delivery.completedDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Move to history if completed
        if (newStatus === 'Completed') {
            moveDeliveryToHistory(delivery);
        }
        
        console.log(`✅ Updated delivery: ${deliveryDR} (Serial: ${serialNumber})`);
        
    } catch (error) {
        console.error(`❌ Error updating delivery ${deliveryDR}:`, error);
    }
}

/**
 * Update delivery row in UI table
 */
function updateDeliveryRowInUI(drNumber, serialNumber, newStatus) {
    const activeDeliveriesRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
    
    activeDeliveriesRows.forEach(row => {
        const drCell = row.querySelector('td:nth-child(2)'); // DR Number column
        const serialCell = row.querySelector('td:nth-child(12)'); // Serial Number column (adjust index as needed)
        
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
                
                // Mark row as completed
                row.classList.add('table-success');
                
                console.log(`✅ UI updated for DR: ${drNumber}, Serial: ${serialNumber}`);
            }
        }
    });
}

/**
 * Move delivery to history
 */
function moveDeliveryToHistory(delivery) {
    const deliveryDR = delivery.drNumber || delivery.dr_number;
    
    try {
        // Initialize history array if needed
        if (!window.deliveryHistory) {
            window.deliveryHistory = [];
        }
        
        // Add to delivery history
        window.deliveryHistory.unshift(delivery);
        console.log(`📚 Added to history: ${deliveryDR}`);
        
        // Remove from active deliveries
        if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
            const deliveryIndex = window.activeDeliveries.findIndex(d => {
                const dDR = d.drNumber || d.dr_number;
                const dSerial = d.serialNumber || d.serial_number;
                const deliverySerial = delivery.serialNumber || delivery.serial_number;
                return dDR === deliveryDR && dSerial === deliverySerial;
            });
            
            if (deliveryIndex !== -1) {
                window.activeDeliveries.splice(deliveryIndex, 1);
                console.log(`🗑️ Removed from active: ${deliveryDR}`);
            }
        }
        
        // Save to storage
        saveDeliveryData(delivery);
        
    } catch (error) {
        console.error(`❌ Error moving delivery to history: ${deliveryDR}`, error);
    }
}

/**
 * Save delivery data to storage
 */
function saveDeliveryData(delivery) {
    try {
        // Save to localStorage
        if (typeof window.saveToLocalStorage === 'function') {
            window.saveToLocalStorage();
        }
        
        // Save to Supabase
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initEnhancedGroupSignature();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedGroupSignature);
} else {
    initEnhancedGroupSignature();
}

// Make functions globally available for testing
window.enhancedUpdateDeliveryStatus = enhancedUpdateDeliveryStatus;
window.findMatchingDeliveries = findMatchingDeliveries;
window.initEnhancedGroupSignature = initEnhancedGroupSignature;

console.log('✅ Enhanced Group Signature module loaded successfully');