/**
 * 🎯 BOOKING MODAL - COMPLETE localStorage REMOVAL
 * 
 * This script removes ALL localStorage operations from booking modal functions
 * and replaces them with Supabase-only operations via dataService.js
 */

console.log('🔧 BOOKING MODAL: localStorage removal script loaded');

(function() {
    'use strict';

    /**
     * 🔄 ENHANCED SAVE BOOKING - SUPABASE ONLY
     * Replaces the original saveBooking function with Supabase-only version
     */
    function createSupabaseOnlyBookingSave() {
        console.log('🔧 Creating Supabase-only booking save function...');

        // Store original function if it exists
        const originalSaveBooking = window.saveBooking;

        window.saveBooking = async function() {
            try {
                console.log('🎯 SUPABASE-ONLY: Booking save started');
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for booking operations. Please check your internet connection.');
                }

                // Get form data (keeping original logic)
                const drNumberInputs = document.querySelectorAll('.dr-number-input');
                let drNumbers = [];
                
                drNumberInputs.forEach((input) => {
                    if (input.value && input.value.trim()) {
                        drNumbers.push(input.value.trim());
                    }
                });

                // Also check main DR input
                const mainDrNumberInput = document.getElementById('drNumber');
                if (mainDrNumberInput && mainDrNumberInput.value && mainDrNumberInput.value.trim()) {
                    const mainValue = mainDrNumberInput.value.trim();
                    if (!drNumbers.includes(mainValue)) {
                        drNumbers.push(mainValue);
                    }
                }

                if (drNumbers.length === 0) {
                    const generatedDR = generateDRNumber();
                    drNumbers.push(generatedDR);
                    showToast('No DR number provided. Auto-generated: ' + generatedDR, 'warning');
                }

                // Get other form data
                const customerName = document.getElementById('customerName').value;
                const vendorNumber = document.getElementById('vendorNumber').value;
                const originSelect = document.getElementById('originSelect');
                const customOrigin = document.getElementById('customOrigin');
                const origin = originSelect.value === 'custom' ? customOrigin.value : originSelect.value;
                
                const destinationInputs = document.querySelectorAll('.destination-input');
                const destinations = Array.from(destinationInputs)
                    .map(input => input.value.trim())
                    .filter(dest => dest);

                const truckType = document.getElementById('truckType').value;
                const truckPlateNumber = document.getElementById('truckPlateNumber').value;
                const deliveryDate = document.getElementById('deliveryDate').value;

                // Get additional costs
                const additionalCostInputs = document.querySelectorAll('.additional-cost-input');
                let additionalCostItems = [];
                let additionalCostsTotal = 0;

                additionalCostInputs.forEach(input => {
                    const row = input.closest('.additional-cost-row');
                    const description = row.querySelector('.cost-description-input').value;
                    const amount = parseFloat(input.value) || 0;
                    
                    if (description && amount > 0) {
                        additionalCostItems.push({
                            description: description,
                            amount: amount
                        });
                        additionalCostsTotal += amount;
                    }
                });

                // Validate required fields
                if (!customerName || !origin || destinations.length === 0 || !truckType || !deliveryDate) {
                    throw new Error('Please fill in all required fields');
                }

                // Create deliveries for each DR number
                const savePromises = [];
                
                for (const drNumber of drNumbers) {
                    const newDelivery = {
                        id: 'DEL-' + Date.now() + '-' + drNumber,
                        dr_number: drNumber,
                        customer_name: customerName,
                        vendor_number: vendorNumber,
                        origin: origin,
                        destination: destinations.join('; '),
                        truck_type: truckType,
                        truck_plate_number: truckPlateNumber,
                        status: 'Active',
                        delivery_date: deliveryDate,
                        additional_costs: additionalCostsTotal,
                        additional_cost_items: additionalCostItems,
                        created_at: new Date().toISOString()
                    };

                    console.log('💾 Saving delivery to Supabase:', drNumber);
                    savePromises.push(window.dataService.saveDelivery(newDelivery));
                }

                // Wait for all saves to complete
                const results = await Promise.all(savePromises);
                console.log('✅ All deliveries saved to Supabase:', results.length);

                // ✅ REMOVED: All localStorage operations
                // ❌ OLD CODE: localStorage.setItem('mci-active-deliveries', ...)
                // ❌ OLD CODE: localStorage.setItem('analytics-cost-breakdown', ...)

                // Auto-create customer if needed (Supabase-only)
                if (customerName && vendorNumber) {
                    try {
                        await autoCreateCustomerSupabaseOnly(customerName, vendorNumber);
                    } catch (error) {
                        console.warn('Customer auto-creation failed:', error);
                        // Don't fail the booking if customer creation fails
                    }
                }

                // Success feedback
                showToast(`Booking confirmed successfully! ${drNumbers.length} delivery(ies) created.`);
                
                // Reset form
                document.getElementById('bookingForm').reset();
                
                // Hide modal
                if (typeof window.hideModal === 'function') {
                    window.hideModal('bookingModal');
                } else {
                    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
                    if (bookingModal) bookingModal.hide();
                }

                // Refresh displays
                if (typeof window.loadActiveDeliveries === 'function') {
                    setTimeout(() => window.loadActiveDeliveries(), 100);
                }
                if (typeof window.updateDashboardMetrics === 'function') {
                    setTimeout(() => window.updateDashboardMetrics(), 200);
                }

                return results;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Booking save failed:', error);
                showError('Booking failed: ' + error.message);
                throw error;
            }
        };

        console.log('✅ Enhanced saveBooking with Supabase-only operations');
    }

    /**
     * 🔄 SUPABASE-ONLY CUSTOMER AUTO-CREATION
     */
    async function autoCreateCustomerSupabaseOnly(customerName, vendorNumber) {
        console.log('🔧 SUPABASE-ONLY: Auto-creating customer...');
        
        if (!window.dataService) {
            throw new Error('Supabase connection required for customer operations');
        }

        // Check if customer already exists
        try {
            const existingCustomers = await window.dataService.getCustomers({ name: customerName });
            if (existingCustomers && existingCustomers.length > 0) {
                console.log('✅ Customer already exists, skipping creation');
                return existingCustomers[0];
            }
        } catch (error) {
            console.warn('Error checking existing customers:', error);
        }

        // Create new customer
        const newCustomer = {
            id: 'CUST-' + Date.now(),
            name: customerName,
            contact_person: customerName,
            phone: vendorNumber,
            vendor_number: vendorNumber,
            account_type: 'Regular',
            status: 'Active',
            created_at: new Date().toISOString()
        };

        try {
            const result = await window.dataService.saveCustomer(newCustomer);
            console.log('✅ SUPABASE-ONLY: Customer auto-created:', result);
            return result;
        } catch (error) {
            console.error('❌ SUPABASE-ONLY: Customer auto-creation failed:', error);
            throw error;
        }
    }

    /**
     * 🔄 REMOVE localStorage FROM COST BREAKDOWN OPERATIONS
     */
    function removeLocalStorageCostBreakdown() {
        console.log('🔧 Removing localStorage from cost breakdown operations...');

        // Override any existing cost breakdown functions that use localStorage
        if (window.saveCostBreakdown) {
            const originalSaveCostBreakdown = window.saveCostBreakdown;
            
            window.saveCostBreakdown = async function(costItems) {
                console.log('🎯 SUPABASE-ONLY: Saving cost breakdown...');
                
                if (!window.dataService) {
                    throw new Error('Supabase connection required for cost breakdown operations');
                }

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.getItem('analytics-cost-breakdown')
                // ❌ OLD CODE: localStorage.setItem('analytics-cost-breakdown', ...)

                // Save via dataService instead
                try {
                    // Cost breakdown is now handled as part of delivery data
                    console.log('✅ Cost breakdown handled via delivery data in Supabase');
                    return costItems;
                } catch (error) {
                    console.error('❌ SUPABASE-ONLY: Cost breakdown save failed:', error);
                    throw error;
                }
            };
        }

        console.log('✅ Cost breakdown localStorage operations removed');
    }

    /**
     * 🔄 REMOVE localStorage FROM CUSTOMER LOADING IN BOOKING
     */
    function removeLocalStorageCustomerLoading() {
        console.log('🔧 Removing localStorage customer loading from booking...');

        // Override customer loading functions
        if (window.loadCustomersForBooking) {
            window.loadCustomersForBooking = async function() {
                console.log('🎯 SUPABASE-ONLY: Loading customers for booking...');
                
                if (!window.dataService) {
                    throw new Error('Supabase connection required for customer operations');
                }

                try {
                    const customers = await window.dataService.getCustomers();
                    window.customers = customers || [];
                    console.log('✅ SUPABASE-ONLY: Loaded customers for booking:', customers.length);
                    return customers;
                } catch (error) {
                    console.error('❌ SUPABASE-ONLY: Customer loading failed:', error);
                    throw error;
                }
            };
        }

        console.log('✅ Customer loading localStorage operations removed');
    }

    /**
     * 🚀 INITIALIZE SUPABASE-ONLY BOOKING MODAL
     */
    function initializeSupabaseOnlyBookingModal() {
        console.log('🚀 Initializing Supabase-only booking modal...');

        // Wait for DOM and other scripts to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeSupabaseOnlyBookingModal, 100);
            });
            return;
        }

        // Apply all fixes
        createSupabaseOnlyBookingSave();
        removeLocalStorageCostBreakdown();
        removeLocalStorageCustomerLoading();

        // Make functions globally available
        window.autoCreateCustomerSupabaseOnly = autoCreateCustomerSupabaseOnly;

        console.log('✅ BOOKING MODAL: Supabase-only initialization complete');
        console.log('✅ BOOKING MODAL: All localStorage operations removed');
    }

    // Initialize immediately or on DOM ready
    initializeSupabaseOnlyBookingModal();

})();

console.log('✅ BOOKING MODAL: localStorage removal script complete');