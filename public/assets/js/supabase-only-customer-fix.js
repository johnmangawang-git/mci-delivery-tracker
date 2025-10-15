/**
 * SUPABASE-ONLY CUSTOMER FIX
 * Forces all customer data to come from Supabase only, no localStorage fallback or mock data
 * Fixes the issue where fake customers appear when Supabase is empty
 */

console.log('🔧 Loading Supabase-Only Customer Fix...');

(function() {
    'use strict';
    
    /**
     * Supabase-only customer loading function
     * Only loads data from Supabase, no localStorage fallback or mock data
     */
    async function supabaseOnlyLoadCustomers() {
        console.log('🔄 SUPABASE-ONLY customer loading...');
        
        // Prevent multiple simultaneous calls
        if (window.loadingCustomers) {
            console.log('⚠️ Customer loading already in progress, skipping...');
            return;
        }
        
        window.loadingCustomers = true;
        
        try {
            let customers = [];
            
            // ONLY try to load from Supabase - no localStorage fallback
            if (window.dataService && typeof window.dataService.getCustomers === 'function') {
                try {
                    console.log('📊 Loading customers from Supabase ONLY...');
                    const supabaseCustomers = await window.dataService.getCustomers();
                    
                    if (supabaseCustomers && Array.isArray(supabaseCustomers)) {
                        // Normalize all customer fields
                        customers = supabaseCustomers.map(customer => {
                            if (typeof window.normalizeCustomerFields === 'function') {
                                return window.normalizeCustomerFields(customer);
                            }
                            return customer;
                        });
                        console.log(`✅ Loaded ${customers.length} customers from Supabase`);
                    } else {
                        console.log('📊 Supabase returned empty or invalid customer list');
                        customers = []; // Explicitly set to empty array
                    }
                } catch (supabaseError) {
                    console.warn('⚠️ Supabase customer loading failed:', supabaseError.message);
                    customers = []; // Set to empty array on error
                }
            } else {
                console.warn('⚠️ DataService not available, cannot load from Supabase');
                customers = []; // Set to empty array if no dataService
            }
            
            // Update global customers array - NO MOCK DATA, NO LOCALSTORAGE FALLBACK
            window.customers = customers;
            
            // Clear localStorage to prevent confusion
            try {
                if (customers.length === 0) {
                    console.log('🗑️ Clearing localStorage customers to match empty Supabase state');
                    localStorage.removeItem('mci-customers');
                } else {
                    // Only save to localStorage if we have real Supabase data
                    localStorage.setItem('mci-customers', JSON.stringify(customers));
                    console.log('💾 Saved Supabase customers to localStorage for consistency');
                }
            } catch (storageError) {
                console.warn('⚠️ Error managing localStorage:', storageError);
            }
            
            console.log(`📊 Final customer count (Supabase-only): ${window.customers.length}`);
            
        } catch (error) {
            console.error('❌ Error in Supabase-only customer loading:', error);
            // Even on error, set to empty array - NO MOCK DATA
            window.customers = [];
        } finally {
            window.loadingCustomers = false;
        }
        
        // Display customers (will show empty state if no customers)
        if (typeof window.displayCustomers === 'function') {
            window.displayCustomers();
        } else if (typeof window.enhancedDisplayCustomers === 'function') {
            window.enhancedDisplayCustomers();
        }
        
        return window.customers;
    }
    
    /**
     * Supabase-only customer display function
     * Shows empty state when no customers, no mock data
     */
    function supabaseOnlyDisplayCustomers() {
        console.log('🎨 SUPABASE-ONLY customer display...');
        
        const customersContainer = document.getElementById('customersContainer');
        if (!customersContainer) {
            console.error('❌ Customers container not found');
            return;
        }
        
        // Ensure customers array exists
        if (!window.customers) {
            window.customers = [];
        }
        
        console.log(`📊 Displaying ${window.customers.length} customers (Supabase-only)`);
        
        // Apply search and filter logic (same as original)
        const searchInput = document.getElementById('customerSearchInput');
        const filterSelect = document.getElementById('customerFilterSelect');
        
        let filteredCustomers = [...window.customers];
        
        // Apply search filter
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer => 
                (customer.contactPerson || customer.name || '').toLowerCase().includes(searchTerm) ||
                (customer.phone || '').includes(searchTerm) ||
                (customer.address || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (filterSelect && filterSelect.value !== 'all') {
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.status === filterSelect.value
            );
        }
        
        // Display customers or empty message - NO MOCK DATA
        if (filteredCustomers.length === 0) {
            customersContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-person-x" style="font-size: 3rem; opacity: 0.3;"></i>
                    <h4 class="mt-3">No customers found</h4>
                    <p class="text-muted">
                        ${window.customers.length === 0 ? 
                            'No customers in database. Add customers by uploading Excel files or manually adding them.' : 
                            'Try adjusting your search or filter criteria'
                        }
                    </p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="if(typeof window.showModal === 'function') window.showModal('addCustomerModal'); else alert('Add customer functionality not available');">
                            <i class="bi bi-person-plus"></i> Add Customer
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Generate customer cards (same as enhanced version but ensuring no mock data)
        customersContainer.innerHTML = filteredCustomers.map(customer => {
            const isAutoCreated = customer.notes && customer.notes.includes('Auto-created from delivery booking');
            const accountTypeBadge = customer.accountType === 'Corporate' ? 
                '<span class="badge bg-primary">Corporate</span>' : 
                '<span class="badge bg-success">Individual</span>';
            
            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card customer-card h-100 ${isAutoCreated ? 'auto-created' : ''}" data-customer-id="${customer.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="card-title mb-1">${customer.contactPerson || customer.name || 'Unknown'}</h5>
                                    <p class="card-text text-muted small mb-0">${customer.id}</p>
                                </div>
                                ${isAutoCreated ? '<span class="badge bg-info">Auto-Created</span>' : ''}
                            </div>
                            
                            <div class="mb-3">
                                <p class="mb-1"><i class="bi bi-telephone me-2"></i>${customer.phone || 'No phone'}</p>
                                <p class="mb-1"><i class="bi bi-geo-alt me-2"></i>${customer.address || 'No address'}</p>
                                <p class="mb-0"><i class="bi bi-envelope me-2"></i>${customer.email || 'No email'}</p>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    ${accountTypeBadge}
                                    <span class="badge bg-secondary ms-1">${customer.status || 'active'}</span>
                                </div>
                                <div class="text-end">
                                    <p class="mb-0 small text-muted">Bookings: <strong>${customer.bookingsCount || customer.bookings_count || 0}</strong></p>
                                    <p class="mb-0 small text-muted">Last: ${customer.lastDelivery || customer.last_delivery || 'Never'}</p>
                                </div>
                            </div>
                            
                            <div class="mt-3 pt-3 border-top">
                                <p class="mb-0 text-muted small">${customer.notes || 'No notes'}</p>
                            </div>
                        </div>
                        
                        <div class="card-footer bg-transparent">
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-sm btn-outline-primary edit-customer-btn" data-customer-id="${customer.id}">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-customer-btn" data-customer-id="${customer.id}">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-customer-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const customerId = this.dataset.customerId;
                if (typeof window.editCustomer === 'function') {
                    window.editCustomer(customerId);
                }
            });
        });
        
        document.querySelectorAll('.delete-customer-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const customerId = this.dataset.customerId;
                if (typeof window.deleteCustomer === 'function') {
                    window.deleteCustomer(customerId);
                }
            });
        });
        
        console.log(`✅ Supabase-only customer display completed: ${filteredCustomers.length} customers shown`);
    }
    
    /**
     * Enhanced delete customer that also removes from Supabase
     */
    async function supabaseOnlyDeleteCustomer(customerId) {
        console.log('🗑️ SUPABASE-ONLY delete customer:', customerId);
        
        if (!confirm('Are you sure you want to delete this customer? This will remove it from the database permanently.')) {
            return;
        }
        
        try {
            // Delete from Supabase first
            if (window.dataService && typeof window.dataService.deleteCustomer === 'function') {
                console.log('🚀 Deleting customer from Supabase...');
                await window.dataService.deleteCustomer(customerId);
                console.log('✅ Customer deleted from Supabase');
            }
            
            // Remove from local array
            if (window.customers) {
                window.customers = window.customers.filter(customer => customer.id !== customerId);
            }
            
            // Update localStorage to match
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            // Refresh display
            supabaseOnlyDisplayCustomers();
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('Customer deleted successfully from database!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error deleting customer:', error);
            if (typeof showToast === 'function') {
                showToast('Error deleting customer. Please try again.', 'error');
            }
        }
    }
    
    /**
     * Clear all customer data (for testing)
     */
    async function clearAllCustomerData() {
        console.log('🗑️ Clearing ALL customer data...');
        
        if (!confirm('Are you sure you want to clear ALL customer data? This will remove all customers from both Supabase and localStorage.')) {
            return;
        }
        
        try {
            // Clear from Supabase by deleting each customer
            if (window.customers && window.customers.length > 0) {
                console.log(`🚀 Deleting ${window.customers.length} customers from Supabase...`);
                
                for (const customer of window.customers) {
                    if (window.dataService && typeof window.dataService.deleteCustomer === 'function') {
                        try {
                            await window.dataService.deleteCustomer(customer.id);
                            console.log(`✅ Deleted customer ${customer.id} from Supabase`);
                        } catch (error) {
                            console.error(`❌ Error deleting customer ${customer.id}:`, error);
                        }
                    }
                }
            }
            
            // Clear local data
            window.customers = [];
            localStorage.removeItem('mci-customers');
            
            // Refresh display
            supabaseOnlyDisplayCustomers();
            
            console.log('✅ All customer data cleared');
            if (typeof showToast === 'function') {
                showToast('All customer data cleared from database!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error clearing customer data:', error);
            if (typeof showToast === 'function') {
                showToast('Error clearing customer data. Please try again.', 'error');
            }
        }
    }
    
    // Override existing functions with Supabase-only versions
    console.log('🔄 Overriding customer functions with Supabase-only versions...');
    
    // Store originals as backup
    if (typeof window.loadCustomers === 'function') {
        window.originalLoadCustomers = window.loadCustomers;
    }
    if (typeof window.displayCustomers === 'function') {
        window.originalDisplayCustomers = window.displayCustomers;
    }
    if (typeof window.deleteCustomer === 'function') {
        window.originalDeleteCustomer = window.deleteCustomer;
    }
    
    // Override with Supabase-only versions
    window.loadCustomers = supabaseOnlyLoadCustomers;
    window.displayCustomers = supabaseOnlyDisplayCustomers;
    window.deleteCustomer = supabaseOnlyDeleteCustomer;
    
    // Add utility functions to window
    window.supabaseOnlyLoadCustomers = supabaseOnlyLoadCustomers;
    window.supabaseOnlyDisplayCustomers = supabaseOnlyDisplayCustomers;
    window.supabaseOnlyDeleteCustomer = supabaseOnlyDeleteCustomer;
    window.clearAllCustomerData = clearAllCustomerData;
    
    // Force reload customers on page load to ensure Supabase-only data
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('🔄 Force loading customers from Supabase on page load...');
            supabaseOnlyLoadCustomers();
        }, 2000); // Give time for other scripts to load
    });
    
    console.log('✅ Supabase-Only Customer Fix loaded successfully');
    
})();

// Export for external access
window.supabaseOnlyCustomerFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};