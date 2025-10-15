/**
 * SIGNATURE COMPLETION FIX
 * Addresses the signature_pad.ts:136 error and ensures proper delivery movement to history
 */

// Enhanced updateDeliveryStatus function that ensures proper data handling
function enhancedUpdateDeliveryStatus(drNumber, newStatus) {
    console.log(`🔄 Enhanced updateDeliveryStatus: ${drNumber} -> ${newStatus}`);
    
    try {
        // Ensure global arrays exist
        if (!window.activeDeliveries) {
            window.activeDeliveries = [];
            console.log('⚠️ Initialized missing activeDeliveries array');
        }
        if (!window.deliveryHistory) {
            window.deliveryHistory = [];
            console.log('⚠️ Initialized missing deliveryHistory array');
        }
        
        // Find delivery in activeDeliveries
        const deliveryIndex = window.activeDeliveries.findIndex(d => d.drNumber === drNumber);
        console.log(`Delivery index found: ${deliveryIndex}`);
        
        if (deliveryIndex !== -1) {
            const delivery = window.activeDeliveries[deliveryIndex];
            delivery.status = newStatus;
            delivery.completedDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            delivery.completedTime = new Date().toLocaleTimeString();
            
            console.log(`✅ Updated delivery status: ${delivery.drNumber} -> ${newStatus}`);
            
            // If completed, move to history
            if (newStatus === 'Completed') {
                console.log('📦 Moving delivery to history...');
                
                // Create a clean copy for history
                const historyCopy = { ...delivery };
                delete historyCopy.signature; // Remove signature data to avoid conflicts
                
                // Add to history at the beginning
                window.deliveryHistory.unshift(historyCopy);
                console.log(`✅ Added to history. History length: ${window.deliveryHistory.length}`);
                
                // Remove from active deliveries
                window.activeDeliveries.splice(deliveryIndex, 1);
                console.log(`✅ Removed from active. Active length: ${window.activeDeliveries.length}`);
                
                // Save to localStorage immediately
                try {
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                    localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                    console.log('💾 Saved to localStorage successfully');
                } catch (storageError) {
                    console.error('❌ Error saving to localStorage:', storageError);
                }
                
                // Update UI immediately
                updateDeliveryUI(drNumber, newStatus);
                
                // Refresh views with delay to ensure data is saved
                setTimeout(() => {
                    refreshAllViews();
                }, 100);
                
                return true; // Success
            }
            
            // For non-completed status updates
            try {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                console.log('💾 Saved active deliveries to localStorage');
                updateDeliveryUI(drNumber, newStatus);
                setTimeout(() => {
                    refreshAllViews();
                }, 100);
                return true; // Success
            } catch (storageError) {
                console.error('❌ Error saving to localStorage:', storageError);
                return false; // Failure
            }
        } else {
            console.error(`❌ Delivery ${drNumber} not found in activeDeliveries`);
            console.log('Current activeDeliveries:', window.activeDeliveries.map(d => d.drNumber));
            return false; // Failure
        }
        
    } catch (error) {
        console.error('❌ Error in enhancedUpdateDeliveryStatus:', error);
        return false; // Failure
    }
}

// Update delivery UI immediately
function updateDeliveryUI(drNumber, newStatus) {
    console.log(`🎨 Updating UI for ${drNumber} -> ${newStatus}`);
    
    // Update active deliveries table
    const activeRows = document.querySelectorAll('#activeDeliveriesTableBody tr');
    activeRows.forEach(row => {
        const drCell = row.querySelector('td:nth-child(2)');
        if (drCell && drCell.textContent.trim() === drNumber) {
            const statusCell = row.querySelector('td:nth-child(9)');
            if (statusCell) {
                statusCell.innerHTML = `<span class="badge bg-success">
                    <i class="bi bi-check-circle"></i> ${newStatus}
                </span>`;
            }
            // Mark row as completed
            row.classList.add('table-success');
            // Fade out the row
            row.style.opacity = '0.5';
        }
    });
}

// Enhanced refresh function
function refreshAllViews() {
    console.log('🔄 Refreshing all views...');
    
    // Refresh active deliveries
    if (typeof window.loadActiveDeliveries === 'function') {
        try {
            window.loadActiveDeliveries();
            console.log('✅ Active deliveries refreshed');
        } catch (error) {
            console.error('❌ Error refreshing active deliveries:', error);
        }
    } else if (typeof window.minimalLoadActiveDeliveries === 'function') {
        try {
            window.minimalLoadActiveDeliveries();
            console.log('✅ Minimal active deliveries refreshed');
        } catch (error) {
            console.error('❌ Error refreshing minimal active deliveries:', error);
        }
    }
    
    // Refresh delivery history
    if (typeof window.loadDeliveryHistory === 'function') {
        try {
            window.loadDeliveryHistory();
            console.log('✅ Delivery history refreshed');
        } catch (error) {
            console.error('❌ Error refreshing delivery history:', error);
        }
    }
    
    // Update dashboard
    if (typeof window.updateBookingViewDashboard === 'function') {
        try {
            window.updateBookingViewDashboard();
            console.log('✅ Dashboard updated');
        } catch (error) {
            console.error('❌ Error updating dashboard:', error);
        }
    }
    
    // Update analytics dashboard stats
    if (typeof window.updateDashboardStats === 'function') {
        try {
            window.updateDashboardStats();
            console.log('✅ Analytics dashboard stats updated');
        } catch (error) {
            console.error('❌ Error updating analytics dashboard stats:', error);
        }
    }
}

// Enhanced signature save function
function enhancedSaveSignature(signatureInfo) {
    console.log('🖊️ Enhanced signature save process starting...');
    console.log('📝 Signature info received:', signatureInfo);
    
    try {
        const timestamp = new Date().toISOString();
        
        // Create E-POD record with field names matching Supabase schema exactly
        const ePodRecord = {
            dr_number: signatureInfo.drNumber,
            customer_name: signatureInfo.customerName,
            customer_contact: signatureInfo.customerContact,
            vendor_number: signatureInfo.customerContact,  // For compatibility
            truck_plate: signatureInfo.truckPlate,
            origin: signatureInfo.origin || 'Unknown Origin',
            destination: signatureInfo.destination || 'Unknown Destination',
            signature_data: signatureInfo.signatureData,
            status: 'Completed',
            signed_at: timestamp
        };
        
        console.log('📝 Created EPOD record:', ePodRecord);
        
        // Save EPOD record to localStorage
        try {
            console.log('📝 EPOD record to save:', ePodRecord);
            let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
            
            // Check if record already exists
            const existingIndex = ePodRecords.findIndex(r => r.dr_number === ePodRecord.dr_number);
            if (existingIndex >= 0) {
                ePodRecords[existingIndex] = ePodRecord;
                console.log('📝 Updated existing EPOD record');
            } else {
                ePodRecords.push(ePodRecord);
                console.log('📝 Added new EPOD record');
            }
            
            localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
            console.log(`💾 EPOD record saved. Total records: ${ePodRecords.length}`);
            
            // Also save to Supabase if dataService is available
            if (typeof window.dataService !== 'undefined' && window.dataService !== null) {
                console.log('🚀 Saving EPOD record to Supabase...');
                window.dataService.saveEPodRecord(ePodRecord)
                    .then(result => {
                        console.log('✅ EPOD record saved to Supabase:', result);
                    })
                    .catch(supabaseError => {
                        console.error('❌ Error saving EPOD record to Supabase:', supabaseError);
                    });
            } else {
                console.log('⚠️ dataService not available, skipping Supabase save');
            }
            
        } catch (ePodError) {
            console.error('❌ Error saving EPOD record:', ePodError);
        }
        
        // Update delivery status and move to history
        const success = enhancedUpdateDeliveryStatus(signatureInfo.drNumber, 'Completed');
        
        if (success) {
            console.log('✅ Signature completion process successful');
            return true;
        } else {
            console.error('❌ Failed to update delivery status');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error in enhanced signature save:', error);
        return false;
    }
}

// Override the existing updateDeliveryStatus function
if (typeof window.updateDeliveryStatus === 'function') {
    window.originalUpdateDeliveryStatus = window.updateDeliveryStatus;
}
window.updateDeliveryStatus = enhancedUpdateDeliveryStatus;

// Add enhanced functions to window
window.enhancedUpdateDeliveryStatus = enhancedUpdateDeliveryStatus;
window.enhancedSaveSignature = enhancedSaveSignature;
window.refreshAllViews = refreshAllViews;

console.log('✅ Signature completion fix loaded successfully');