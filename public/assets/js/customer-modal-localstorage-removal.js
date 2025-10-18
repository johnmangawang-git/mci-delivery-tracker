/**
 * 🎯 CUSTOMER MODAL - COMPLETE localStorage REMOVAL
 * 
 * This script removes ALL localStorage operations from customer modal functions
 * and replaces them with Supabase-only operations via dataService.js
 */

console.log('🔧 CUSTOMER MODAL: localStorage removal script loaded');

(function() {
    'use strict';

    /**
     * 🔄 ENHANCED SAVE EDITED CUSTOMER - SUPABASE ONLY
     */
    function createSupabaseOnlySaveEditedCustomer() {
        console.log('🔧 Creating Supabase-only saveEditedCustomer function...');

        window.saveEditedCustomer = async function() {
            try {
                console.log('🎯 SUPABASE-ONLY: Saving edited customer...');
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for customer operations. Please check your internet connection.');
                }

                const customerId = document.getElementById('editCustomerId').value;
                if (!customerId) {
                    throw new Error('Customer ID not found');
                }

                // Get updated customer data from form
                const updatedCustomer = {
                    id: customerId,
                    contact_person: document.getElementById('editCustomerName').value,
                    phone: document.getElementById('editCustomerPhone').value,
                    email: document.getElementById('editCustomerEmail').value,
                    address: document.getElementById('editCustomerAddress').value,
                    account_type: document.getElementById('editCustomerAccountType').value,
                    status: document.getElementById('editCustomerStatus').value,
                    notes: document.getElementById('editNotes').value,
                    updated_at: new Date().toISOString()
                };

                // Validate required fields
                if (!updatedCustomer.contact_person || !updatedCustomer.phone || !updatedCustomer.address) {
                    throw new Error('Please fill in all required fields');
                }

                console.log('💾 Saving customer to Supabase:', updatedCustomer);
                
                // Save to Supabase via dataService
                const result = await window.dataService.saveCustomer(updatedCustomer);
                console.log('✅ SUPABASE-ONLY: Customer updated successfully:', result);

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.setItem('mci-customers', JSON.stringify(window.customers));

                // Update local array for immediate UI update
                if (window.customers && Array.isArray(window.customers)) {
                    const customerIndex = window.customers.findIndex(c => c.id === customerId);
                    if (customerIndex !== -1) {
                        window.customers[customerIndex] = { ...window.customers[customerIndex], ...updatedCustomer };
                    }
                }

                // Refresh display
                if (typeof window.displayCustomers === 'function') {
                    window.displayCustomers();
                }

                // Hide modal
                const editCustomerModal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
                if (editCustomerModal) {
                    editCustomerModal.hide();
                }

                // Show success message
                if (typeof showToast === 'function') {
                    showToast('Customer updated successfully!');
                }

                return result;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Customer update failed:', error);
                if (typeof showError === 'function') {
                    showError('Customer update failed: ' + error.message);
                } else {
                    alert('Customer update failed: ' + error.message);
                }
                throw error;
            }
        };

        console.log('✅ Enhanced saveEditedCustomer with Supabase-only operations');
    }

    /**
     * 🔄 ENHANCED DELETE CUSTOMER - SUPABASE ONLY
     */
    function createSupabaseOnlyDeleteCustomer() {
        console.log('🔧 Creating Supabase-only deleteCustomer function...');

        window.deleteCustomer = async function(customerId) {
            try {
                console.log('🎯 SUPABASE-ONLY: Deleting customer:', customerId);
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for customer operations. Please check your internet connection.');
                }

                if (!customerId) {
                    throw new Error('Customer ID is required');
                }

                // Confirm deletion
                if (!confirm('Are you sure you want to delete this customer?')) {
                    return;
                }

                console.log('💾 Deleting customer from Supabase:', customerId);
                
                // Delete from Supabase via dataService
                await window.dataService.deleteCustomer(customerId);
                console.log('✅ SUPABASE-ONLY: Customer deleted successfully');

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.setItem('mci-customers', JSON.stringify(window.customers));

                // Update local array for immediate UI update
                if (window.customers && Array.isArray(window.customers)) {
                    window.customers = window.customers.filter(customer => customer.id !== customerId);
                }

                // Refresh display
                if (typeof window.displayCustomers === 'function') {
                    window.displayCustomers();
                }

                // Show success message
                if (typeof showToast === 'function') {
                    showToast('Customer deleted successfully!');
                }

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Customer deletion failed:', error);
                if (typeof showError === 'function') {
                    showError('Customer deletion failed: ' + error.message);
                } else {
                    alert('Customer deletion failed: ' + error.message);
                }
                throw error;
            }
        };

        console.log('✅ Enhanced deleteCustomer with Supabase-only operations');
    }

    /**
     * 🔄 ENHANCED ADD CUSTOMER - SUPABASE ONLY
     */
    function createSupabaseOnlyAddCustomer() {
        console.log('🔧 Creating Supabase-only add customer function...');

        // Override the add customer button event listener
        function enhanceAddCustomerModal() {
            const saveCustomerBtn = document.getElementById('saveCustomerBtn');
            if (saveCustomerBtn) {
                // Remove existing event listeners
                const newSaveBtn = saveCustomerBtn.cloneNode(true);
                saveCustomerBtn.parentNode.replaceChild(newSaveBtn, saveCustomerBtn);

                // Add new Supabase-only event listener
                newSaveBtn.addEventListener('click', async function() {
                    try {
                        console.log('🎯 SUPABASE-ONLY: Adding new customer...');
                        
                        // Validate dataService availability
                        if (!window.dataService) {
                            throw new Error('Supabase connection required for customer operations. Please check your internet connection.');
                        }

                        // Get form data
                        const contactPerson = document.getElementById('contactPerson').value;
                        const phone = document.getElementById('phone').value;
                        const email = document.getElementById('email').value;
                        const address = document.getElementById('address').value;
                        const accountType = document.getElementById('accountType').value;
                        const status = document.getElementById('customerStatus').value;
                        const notes = document.getElementById('notes').value;
                        
                        // Validate required fields
                        if (!contactPerson || !phone || !address || !accountType) {
                            throw new Error('Please fill in all required fields');
                        }

                        // Create new customer object
                        const newCustomer = {
                            id: 'CUST-' + Date.now(),
                            contact_person: contactPerson,
                            phone: phone,
                            email: email,
                            address: address,
                            account_type: accountType,
                            status: status,
                            notes: notes,
                            bookings_count: 0,
                            last_delivery: '',
                            created_at: new Date().toISOString()
                        };

                        console.log('💾 Saving new customer to Supabase:', newCustomer);
                        
                        // Save to Supabase via dataService
                        const result = await window.dataService.saveCustomer(newCustomer);
                        console.log('✅ SUPABASE-ONLY: Customer added successfully:', result);

                        // ✅ REMOVED: localStorage operations
                        // ❌ OLD CODE: localStorage.setItem('mci-customers', JSON.stringify(window.customers));

                        // Update local array for immediate UI update
                        if (!window.customers) {
                            window.customers = [];
                        }
                        window.customers.push(result);

                        // Refresh display
                        if (typeof window.displayCustomers === 'function') {
                            window.displayCustomers();
                        }

                        // Hide modal
                        if (typeof window.hideModal === 'function') {
                            window.hideModal('addCustomerModal');
                        } else {
                            const addCustomerModal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
                            if (addCustomerModal) {
                                addCustomerModal.hide();
                            }
                        }

                        // Show success message
                        if (typeof showToast === 'function') {
                            showToast('Customer added successfully!');
                        }

                        // Reset form
                        document.getElementById('addCustomerForm').reset();

                    } catch (error) {
                        console.error('❌ SUPABASE-ONLY: Customer addition failed:', error);
                        if (typeof showError === 'function') {
                            showError('Customer addition failed: ' + error.message);
                        } else {
                            alert('Customer addition failed: ' + error.message);
                        }
                    }
                });

                console.log('✅ Enhanced add customer modal with Supabase-only operations');
            }
        }

        // Apply enhancement when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', enhanceAddCustomerModal);
        } else {
            enhanceAddCustomerModal();
        }
    }

    /**
     * 🔄 ENHANCED LOAD CUSTOMERS - SUPABASE ONLY
     */
    function createSupabaseOnlyLoadCustomers() {
        console.log('🔧 Creating Supabase-only loadCustomers function...');

        window.loadCustomers = async function() {
            try {
                console.log('🎯 SUPABASE-ONLY: Loading customers...');
                
                // Validate dataService availability
                if (!window.dataService) {
                    throw new Error('Supabase connection required for customer operations. Please check your internet connection.');
                }

                console.log('💾 Loading customers from Supabase...');
                
                // Load from Supabase via dataService
                const customers = await window.dataService.getCustomers();
                console.log('✅ SUPABASE-ONLY: Customers loaded successfully:', customers.length);

                // ✅ REMOVED: localStorage operations
                // ❌ OLD CODE: localStorage.getItem('mci-customers')

                // Update global array
                window.customers = customers || [];

                // Refresh display
                if (typeof window.displayCustomers === 'function') {
                    window.displayCustomers();
                }

                return customers;

            } catch (error) {
                console.error('❌ SUPABASE-ONLY: Customer loading failed:', error);
                
                // Initialize empty array on failure
                window.customers = [];
                
                if (typeof showError === 'function') {
                    showError('Customer loading failed: ' + error.message);
                }
                
                throw error;
            }
        };

        console.log('✅ Enhanced loadCustomers with Supabase-only operations');
    }

    /**
     * 🚀 INITIALIZE SUPABASE-ONLY CUSTOMER MODAL
     */
    function initializeSupabaseOnlyCustomerModal() {
        console.log('🚀 Initializing Supabase-only customer modal...');

        // Wait for DOM and other scripts to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeSupabaseOnlyCustomerModal, 100);
            });
            return;
        }

        // Apply all fixes
        createSupabaseOnlySaveEditedCustomer();
        createSupabaseOnlyDeleteCustomer();
        createSupabaseOnlyAddCustomer();
        createSupabaseOnlyLoadCustomers();

        console.log('✅ CUSTOMER MODAL: Supabase-only initialization complete');
        console.log('✅ CUSTOMER MODAL: All localStorage operations removed');
    }

    // Initialize immediately or on DOM ready
    initializeSupabaseOnlyCustomerModal();

})();

console.log('✅ CUSTOMER MODAL: localStorage removal script complete');