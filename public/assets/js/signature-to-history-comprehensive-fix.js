/**
 * COMPREHENSIVE SIGNATURE TO HISTORY FIX
 * Addresses all issues with moving signed DR items from Active Deliveries to Delivery History
 * This fix ensures proper field name handling, async operation coordination, and Supabase integration
 */

console.log('🔧 Loading Comprehensive Signature to History Fix...');

(function() {
    'use strict';
    
    // Store original functions to avoid conflicts
    const originalUpdateDeliveryStatus = window.updateDeliveryStatus;
    const originalSaveSingleSignature = window.saveSingleSignature;
    
    /**
     * Enhanced field name normalization
     * Ensures consistent field names across all operations
     */
    function normalizeDeliveryFields(delivery) {
        if (!delivery) return delivery;
        
        return {
            ...delivery,
            // Ensure both field name formats exist
            id: delivery.id,
            drNumber: delivery.drNumber || delivery.dr_number || '',
            dr_number: delivery.drNumber || delivery.dr_number || '',
            customerName: delivery.customerName || delivery.customer_name || '',
            customer_name: delivery.customerName || delivery.customer_name || '',
            vendorNumber: delivery.vendorNumber || delivery.vendor_number || '',
            vendor_number: delivery.vendorNumber || delivery.vendor_number || '',
            truckPlateNumber: delivery.truckPlateNumber || delivery.truck_plate_number || '',
            truck_plate_number: delivery.truckPlateNumber || delivery.truck_plate_number || '',
            truckType: delivery.truckType || delivery.truck_type || '',
            truck_type: delivery.truckType || delivery.truck_type || '',
            origin: delivery.origin || '',
            destination: delivery.destination || '',
            status: delivery.status || 'Active',
            distance: delivery.distance || '',
            additionalCosts: delivery.additionalCosts || 0,
            createdDate: delivery.createdDate || delivery.created_date || delivery.timestamp || '',
            created_date: delivery.createdDate || delivery.created_date || delivery.timestamp || '',
            timestamp: delivery.createdDate || delivery.created_date || delivery.timestamp || ''
        };
    }
    
    /**
     * Enhanced delivery status update with proper Supabase integration
     */
    async function comprehensiveUpdateDeliveryStatus(drNumber, newStatus) {
        console.log(`🔄 COMPREHENSIVE updateDeliveryStatus: ${drNumber} -> ${newStatus}`);
        
        try {
            // Ensure arrays exist
            if (!window.activeDeliveries) {
                window.activeDeliveries = [];
                console.log('⚠️ Initialized activeDeliveries array');
            }
            if (!window.deliveryHistory) {
                window.deliveryHistory = [];
                console.log('⚠️ Initialized deliveryHistory array');
            }
            
            // Find delivery using both field name formats
            const deliveryIndex = window.activeDeliveries.findIndex(d => {
                const deliveryDrNumber = d.drNumber || d.dr_number || '';
                return deliveryDrNumber === drNumber;
            });
            
            console.log(`📍 Found delivery at index: ${deliveryIndex} for DR: ${drNumber}`);
            
            if (deliveryIndex === -1) {
                console.error(`❌ Delivery ${drNumber} not found in activeDeliveries`);
                console.log('Available DRs:', window.activeDeliveries.map(d => d.drNumber || d.dr_number));
                return false;
            }
            
            const delivery = window.activeDeliveries[deliveryIndex];
            const normalizedDelivery = normalizeDeliveryFields(delivery);
            
            // Update delivery status and timestamps
            normalizedDelivery.status = newStatus;
            normalizedDelivery.lastStatusUpdate = new Date().toISOString();
            
            if (newStatus === 'Completed') {
                normalizedDelivery.completedDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                normalizedDelivery.completedTime = new Date().toLocaleTimeString();
                normalizedDelivery.signedAt = new Date().toISOString();
            }
            
            console.log(`✅ Updated delivery: ${normalizedDelivery.drNumber} -> ${newStatus}`);
            
            // Step 1: Update in Supabase first if available
            let supabaseUpdateSuccess = false;
            if (typeof window.dataService !== 'undefined' && window.dataService.updateDeliveryStatusInSupabase) {
                try {
                    console.log('🚀 Updating status in Supabase...');
                    await window.dataService.updateDeliveryStatusInSupabase(drNumber, newStatus);
                    console.log('✅ Supabase status update successful');
                    supabaseUpdateSuccess = true;
                } catch (supabaseError) {
                    console.error('❌ Supabase status update failed:', supabaseError);
                    // Continue with local update as fallback
                }
            }
            
            // Step 2: Update local arrays
            if (newStatus === 'Completed') {
                console.log('📦 Moving delivery to history...');
                
                // Remove from active deliveries
                window.activeDeliveries.splice(deliveryIndex, 1);
                console.log(`✅ Removed from active. Active length: ${window.activeDeliveries.length}`);
                
                // Add to history at the beginning
                window.deliveryHistory.unshift(normalizedDelivery);
                console.log(`✅ Added to history. History length: ${window.deliveryHistory.length}`);
                
                // Step 3: Save the completed delivery to Supabase deliveries table
                if (supabaseUpdateSuccess && typeof window.dataService !== 'undefined' && window.dataService.saveDelivery) {
                    try {
                        console.log('🚀 Saving completed delivery to Supabase...');
                        await window.dataService.saveDelivery(normalizedDelivery);
                        console.log('✅ Completed delivery saved to Supabase');
                    } catch (saveError) {
                        console.error('❌ Error saving completed delivery to Supabase:', saveError);
                    }
                }
            } else {
                // For non-completed status, just update in place
                window.activeDeliveries[deliveryIndex] = normalizedDelivery;
                
                // Save to Supabase if available
                if (supabaseUpdateSuccess && typeof window.dataService !== 'undefined' && window.dataService.saveDelivery) {
                    try {
                        await window.dataService.saveDelivery(normalizedDelivery);
                        console.log('✅ Updated delivery saved to Supabase');
                    } catch (saveError) {
                        console.error('❌ Error saving updated delivery to Supabase:', saveError);
                    }
                }
            }
            
            // Step 4: Force save to localStorage as backup
            try {
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                localStorage.setItem('mci-delivery-history', JSON.stringify(window.deliveryHistory));
                console.log('💾 FORCED save to localStorage successful');
                
                // Verify save
                const savedHistory = localStorage.getItem('mci-delivery-history');
                const parsedHistory = JSON.parse(savedHistory);
                console.log(`✅ Verified: ${parsedHistory.length} items in saved history`);
                
            } catch (storageError) {
                console.error('❌ Error saving to localStorage:', storageError);
            }
            
            // Step 5: Update UI immediately
            updateDeliveryUI(drNumber, newStatus);
            
            // Step 6: Refresh views with delay to ensure data consistency
            setTimeout(() => {
                console.log('🔄 Force refreshing views...');
                refreshAllDeliveryViews();
            }, 300);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error in comprehensiveUpdateDeliveryStatus:', error);
            return false;
        }
    }
    
    /**
     * Enhanced signature save with proper async coordination
     */
    async function comprehensiveSaveSignature(signatureInfo) {
        console.log('🖊️ COMPREHENSIVE signature save process starting...');
        console.log('📝 Signature info received:', signatureInfo);
        
        try {
            const timestamp = new Date().toISOString();
            
            // Parse route information
            const [origin, destination] = (signatureInfo.deliveryRoute || '').split(' to ');
            
            // Create E-POD record with normalized field names
            const ePodRecord = {
                dr_number: signatureInfo.drNumber,
                customer_name: signatureInfo.customerName,
                customer_contact: signatureInfo.customerContact,
                vendor_number: signatureInfo.customerContact,
                truck_plate: signatureInfo.truckPlate,
                origin: origin || 'Unknown Origin',
                destination: destination || 'Unknown Destination',
                signature_data: signatureInfo.signatureData,
                status: 'Completed',
                signed_at: timestamp
            };
            
            console.log('📝 Created EPOD record:', ePodRecord);
            
            // Step 1: Save E-POD record first
            let epodSaveSuccess = false;
            
            // Save to Supabase if available
            if (typeof window.dataService !== 'undefined' && window.dataService.saveEPodRecord) {
                try {
                    console.log('🚀 Saving EPOD record to Supabase...');
                    const epodResult = await window.dataService.saveEPodRecord(ePodRecord);
                    console.log('✅ EPOD record saved to Supabase:', epodResult);
                    epodSaveSuccess = true;
                } catch (epodError) {
                    console.error('❌ Error saving EPOD record to Supabase:', epodError);
                    // Continue with localStorage fallback
                }
            }
            
            // Save to localStorage as backup/fallback
            try {
                let ePodRecords = JSON.parse(localStorage.getItem('ePodRecords') || '[]');
                const existingIndex = ePodRecords.findIndex(r => r.dr_number === ePodRecord.dr_number);
                
                if (existingIndex >= 0) {
                    ePodRecords[existingIndex] = ePodRecord;
                    console.log('📝 Updated existing EPOD record in localStorage');
                } else {
                    ePodRecords.push(ePodRecord);
                    console.log('📝 Added new EPOD record to localStorage');
                }
                
                localStorage.setItem('ePodRecords', JSON.stringify(ePodRecords));
                console.log(`💾 EPOD record saved to localStorage. Total records: ${ePodRecords.length}`);
                
            } catch (localStorageError) {
                console.error('❌ Error saving EPOD record to localStorage:', localStorageError);
            }
            
            // Step 2: Update delivery status and move to history
            console.log('🔄 Updating delivery status to Completed...');
            const statusUpdateSuccess = await comprehensiveUpdateDeliveryStatus(signatureInfo.drNumber, 'Completed');
            
            if (statusUpdateSuccess) {
                console.log('✅ Comprehensive signature completion process successful');
                
                // Show success message
                if (typeof showToast === 'function') {
                    showToast('E-POD saved and delivery moved to history successfully!', 'success');
                }
                
                return true;
            } else {
                console.error('❌ Failed to update delivery status');
                
                if (typeof showToast === 'function') {
                    showToast('E-POD saved but failed to move delivery to history. Please check manually.', 'warning');
                }
                
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error in comprehensive signature save:', error);
            
            if (typeof showToast === 'function') {
                showToast('Failed to complete signature process. Please try again.', 'error');
            }
            
            return false;
        }
    }
    
    /**
     * Update delivery UI immediately
     */
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
                row.classList.add('table-success');
                row.style.opacity = '0.7';
            }
        });
    }
    
    /**
     * Refresh all delivery views
     */
    function refreshAllDeliveryViews() {
        console.log('🔄 Refreshing all delivery views...');
        
        // Refresh active deliveries view
        if (typeof window.loadActiveDeliveries === 'function') {
            try {
                window.loadActiveDeliveries();
                console.log('✅ Active deliveries view refreshed');
            } catch (error) {
                console.error('❌ Error refreshing active deliveries view:', error);
            }
        }
        
        // Refresh delivery history view
        if (typeof window.loadDeliveryHistory === 'function') {
            try {
                window.loadDeliveryHistory();
                console.log('✅ Delivery history view refreshed');
            } catch (error) {
                console.error('❌ Error refreshing delivery history view:', error);
            }
        }
        
        // Refresh E-POD view
        if (typeof window.loadEPodDeliveries === 'function') {
            try {
                window.loadEPodDeliveries();
                console.log('✅ E-POD view refreshed');
            } catch (error) {
                console.error('❌ Error refreshing E-POD view:', error);
            }
        }
        
        // Update dashboard
        if (typeof window.updateBookingViewDashboard === 'function') {
            try {
                setTimeout(() => {
                    window.updateBookingViewDashboard();
                    console.log('✅ Booking view dashboard updated');
                }, 100);
            } catch (error) {
                console.error('❌ Error updating booking view dashboard:', error);
            }
        }
        
        // Update analytics dashboard stats
        if (typeof window.updateDashboardStats === 'function') {
            try {
                setTimeout(() => {
                    window.updateDashboardStats();
                    console.log('✅ Analytics dashboard stats updated');
                }, 200);
            } catch (error) {
                console.error('❌ Error updating analytics dashboard stats:', error);
            }
        }
    }
    
    // Override existing functions with comprehensive versions
    window.updateDeliveryStatus = comprehensiveUpdateDeliveryStatus;
    
    // Override the saveSingleSignature function in e-signature.js
    if (typeof window.saveSingleSignature === 'function') {
        window.originalSaveSingleSignature = window.saveSingleSignature;
        
        window.saveSingleSignature = async function(signatureInfo, saveBtn = null, originalText = '<i class="bi bi-save me-2"></i>Save Signature') {
            console.log('🖊️ Using comprehensive saveSingleSignature override');
            
            try {
                const success = await comprehensiveSaveSignature(signatureInfo);
                
                if (success) {
                    console.log('✅ Comprehensive signature save successful');
                } else {
                    console.error('❌ Comprehensive signature save failed');
                }
                
                return success;
                
            } catch (error) {
                console.error('❌ Error in saveSingleSignature override:', error);
                return false;
            } finally {
                // Always close modal and reset button
                if (typeof window.closeESignatureModal === 'function') {
                    window.closeESignatureModal();
                }
                
                if (saveBtn && typeof window.resetSaveButton === 'function') {
                    window.resetSaveButton(saveBtn, originalText);
                }
            }
        };
    }
    
    // Add utility functions to window
    window.comprehensiveUpdateDeliveryStatus = comprehensiveUpdateDeliveryStatus;
    window.comprehensiveSaveSignature = comprehensiveSaveSignature;
    window.normalizeDeliveryFields = normalizeDeliveryFields;
    window.refreshAllDeliveryViews = refreshAllDeliveryViews;
    
    console.log('✅ Comprehensive Signature to History Fix loaded successfully');
    
})();

// Export for external access
window.comprehensiveSignatureToHistoryFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};