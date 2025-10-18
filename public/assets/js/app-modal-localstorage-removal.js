/**
 * 🎯 APP.JS MODAL - COMPLETE localStorage REMOVAL
 * 
 * This script removes ALL localStorage operations from app.js modal functions
 * and replaces them with Supabase-only operations via dataService.js
 */

console.log('🔧 APP MODAL: localStorage removal script loaded');

(function() {
    'use strict';

    /**
     * 🔄 ENHANCED STATUS CHANGE - SUPABASE ONLY
     */
    function createSupabaseOnlyStatusChange() {
        console.log('🔧 Creating Supabase-only status change functions...');

        // Override handleStatusChange function
        window.handleStatusChange = async function(drNumber, newStatus) {
            try {
                console.log('🎯 SUPABASE-ONLY: Handling status change:', drNumber, newStatus);
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for status change operations. Please check your internet connection.');
                }

                if (!drNumber || !newStatus) {
                    throw new Error('DR Number and status are required');
                }

                console.log('💾 Updating delivery status in Supabase...');
                
                // Find and update the delivery
                const deliveries = await window.dataService.getDeliveries();
                const delivery = deliveries.find(d => d.dr_number === drNumber);
                
                if (!delivery) {
                    throw new Error('Delivery not found: ' + drNumber);
                }

                // Update delivery status
                delivery.status = newStatus;
                delivery.updated_at = new Date().toISOString();

                // Save updated delivery
                const result = await window.dataService.saveDelivery(delivery);
                console.log('✅ SUPABASE-ONLY: Status updated successfully:', result);

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.setItem('mci-active-deliveries', ...)
                // ❌ OLD CODE: localStorage.setItem('mci-delivery-history', ...)

                // Update global arrays for immediate UI update
                if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                    const activeIndex = window.activeDeliveries.findIndex(d => d.dr_number === drNumber);
                    if (activeIndex !== -1) {
                        if (newStatus === 'Completed' || newStatus === 'Signed') {
                            // Move to history
                            const deliveryToMove = window.activeDeliveries.splice(activeIndex, 1)[0];
                            deliveryToMove.status = newStatus;
                            
                            if (!window.deliveryHistory) {
                                window.deliveryHistory = [];
                            }
                            window.deliveryHistory.unshift(deliveryToMove);
                        } else {
                            // Update in active
                            window.activeDeliveries[activeIndex].status = newStatus;
                        }
                    }
                }

                // Refresh displays
                if (typeof window.loadActiveDeliveries === 'function') {
                    setTimeout(() => window.loadActiveDeliveries(), 100);
                }
                if (typeof window.loadDeliveryHistory === 'function') {
                    setTimeout(() => window.loadDeliveryHistory(), 100);
                }
                if (typeof window.updateDashboardMetrics === 'function') {
                    setTimeout(() => window.updateDashboardMetrics(), 200);
                }

                return result;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Status change failed:', error);
                if (typeof showError === 'function') {
                    showError('Status change failed: ' + error.message);
                }
                throw error;
            }
        };

        console.log('✅ Enhanced handleStatusChange with Supabase-only operations');
    }

    /**
     * 🔄 ENHANCED E-POD MODAL - SUPABASE ONLY
     */
    function createSupabaseOnlyEPodModal() {
        console.log('🔧 Creating Supabase-only E-POD modal functions...');

        // Override showEPodModal function
        window.showEPodModal = async function(drNumber) {
            try {
                console.log('🎯 SUPABASE-ONLY: Showing E-POD modal for:', drNumber);
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for E-POD operations. Please check your internet connection.');
                }

                if (!drNumber) {
                    throw new Error('DR Number is required');
                }

                // Load E-POD records from Supabase
                console.log('💾 Loading E-POD records from Supabase...');
                
                let ePodRecords = [];
                try {
                    ePodRecords = await window.dataService.getEPodRecords({ dr_number: drNumber });
                    console.log('✅ SUPABASE-ONLY: E-POD records loaded:', ePodRecords.length);
                } catch (error) {
                    console.warn('E-POD records loading failed:', error);
                    ePodRecords = [];
                }

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.getItem('ePodRecords')

                // Populate modal with data
                const modal = document.getElementById('eSignatureModal');
                if (modal) {
                    const drNumberField = modal.querySelector('#ePodDrNumber');
                    if (drNumberField) {
                        drNumberField.value = drNumber;
                    }

                    // Clear previous data
                    const deliveryRouteField = modal.querySelector('#ePodDeliveryRoute');
                    if (deliveryRouteField) {
                        deliveryRouteField.value = '';
                    }

                    // Show modal
                    if (typeof window.showModal === 'function') {
                        window.showModal('eSignatureModal');
                    } else {
                        const bootstrapModal = new bootstrap.Modal(modal);
                        bootstrapModal.show();
                    }
                }

                return ePodRecords;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: E-POD modal failed:', error);
                if (typeof showError === 'function') {
                    showError('E-POD modal failed: ' + error.message);
                }
                throw error;
            }
        };

        console.log('✅ Enhanced showEPodModal with Supabase-only operations');
    }

    /**
     * 🔄 ENHANCED E-SIGNATURE MODAL - SUPABASE ONLY
     */
    function createSupabaseOnlyESignatureModal() {
        console.log('🔧 Creating Supabase-only E-Signature modal functions...');

        // Override showESignatureModal function
        window.showESignatureModal = async function(drNumber) {
            try {
                console.log('🎯 SUPABASE-ONLY: Showing E-Signature modal for:', drNumber);
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for E-Signature operations. Please check your internet connection.');
                }

                if (!drNumber) {
                    throw new Error('DR Number is required');
                }

                // Load delivery data from Supabase
                console.log('💾 Loading delivery data from Supabase...');
                
                let delivery = null;
                try {
                    const deliveries = await window.dataService.getDeliveries({ dr_number: drNumber });
                    delivery = deliveries.find(d => d.dr_number === drNumber);
                    console.log('✅ SUPABASE-ONLY: Delivery data loaded:', delivery);
                } catch (error) {
                    console.warn('Delivery data loading failed:', error);
                }

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.getItem('mci-active-deliveries')
                // ❌ OLD CODE: localStorage.getItem('mci-delivery-history')

                // Populate modal with data
                const modal = document.getElementById('eSignatureModal');
                if (modal) {
                    const drNumberField = modal.querySelector('#ePodDrNumber');
                    if (drNumberField) {
                        drNumberField.value = drNumber;
                    }

                    // Populate other fields if delivery data is available
                    if (delivery) {
                        const customerField = modal.querySelector('#ePodCustomerName');
                        if (customerField) {
                            customerField.value = delivery.customer_name || '';
                        }

                        const destinationField = modal.querySelector('#ePodDestination');
                        if (destinationField) {
                            destinationField.value = delivery.destination || '';
                        }
                    }

                    // Clear signature canvas if it exists
                    const signatureCanvas = modal.querySelector('#signatureCanvas');
                    if (signatureCanvas) {
                        const ctx = signatureCanvas.getContext('2d');
                        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                    }

                    // Show modal
                    if (typeof window.showModal === 'function') {
                        window.showModal('eSignatureModal');
                    } else {
                        const bootstrapModal = new bootstrap.Modal(modal);
                        bootstrapModal.show();
                    }
                }

                return delivery;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: E-Signature modal failed:', error);
                if (typeof showError === 'function') {
                    showError('E-Signature modal failed: ' + error.message);
                }
                throw error;
            }
        };

        console.log('✅ Enhanced showESignatureModal with Supabase-only operations');
    }

    /**
     * 🔄 REMOVE localStorage FROM SAVE FUNCTIONS
     */
    function removeLocalStorageSaveFunctions() {
        console.log('🔧 Removing localStorage from save functions...');

        // Override saveToLocalStorage function to do nothing
        window.saveToLocalStorage = function() {
            console.log('🚫 DISABLED: saveToLocalStorage function - using Supabase-only mode');
            // ✅ REMOVED: All localStorage operations
            // This function now does nothing - all saves go through dataService
        };

        // Override fallbackSaveToLocalStorage function to do nothing
        window.fallbackSaveToLocalStorage = function() {
            console.log('🚫 DISABLED: fallbackSaveToLocalStorage function - using Supabase-only mode');
            // ✅ REMOVED: All localStorage operations
            // This function now does nothing - all saves go through dataService
        };

        // Override saveToDatabase to be Supabase-only
        window.saveToDatabase = async function() {
            try {
                console.log('🎯 SUPABASE-ONLY: Saving to database...');
                
                if (!window.dataService) {
                    throw new Error('Supabase connection required for database operations');
                }

                // Save active deliveries
                if (window.activeDeliveries && Array.isArray(window.activeDeliveries)) {
                    for (const delivery of window.activeDeliveries) {
                        await window.dataService.saveDelivery(delivery);
                    }
                }

                // Save delivery history
                if (window.deliveryHistory && Array.isArray(window.deliveryHistory)) {
                    for (const delivery of window.deliveryHistory) {
                        await window.dataService.saveDelivery(delivery);
                    }
                }

                console.log('✅ SUPABASE-ONLY: Database save complete');

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Database save failed:', error);
                throw error;
            }
        };

        console.log('✅ Save functions updated to Supabase-only operations');
    }

    /**
     * 🚀 INITIALIZE SUPABASE-ONLY APP MODAL
     */
    function initializeSupabaseOnlyAppModal() {
        console.log('🚀 Initializing Supabase-only app modal...');

        // Wait for DOM and other scripts to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeSupabaseOnlyAppModal, 100);
            });
            return;
        }

        // Apply all fixes
        createSupabaseOnlyStatusChange();
        createSupabaseOnlyEPodModal();
        createSupabaseOnlyESignatureModal();
        removeLocalStorageSaveFunctions();

        console.log('✅ APP MODAL: Supabase-only initialization complete');
        console.log('✅ APP MODAL: All localStorage operations removed');
    }

    // Initialize immediately or on DOM ready
    initializeSupabaseOnlyAppModal();

})();

console.log('✅ APP MODAL: localStorage removal script complete');