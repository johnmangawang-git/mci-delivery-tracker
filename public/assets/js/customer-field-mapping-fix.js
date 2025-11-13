/**
 * CUSTOMER FIELD MAPPING FIX
 * Fixes field name mismatches between JavaScript code and Supabase schema
 * Ensures cross-browser customer data consistency
 */

console.log('🔧 Loading Customer Field Mapping Fix...');

(function() {
    'use strict';
    
    /**
     * Normalize customer fields to handle both JavaScript and Supabase field names
     */
    function normalizeCustomerFields(customer) {
        if (!customer) return customer;
        
        return {
            ...customer,
            
            // ID field (consistent)
            id: customer.id,
            
            // Name fields (JavaScript uses contactPerson, Supabase uses name)
            contactPerson: customer.contactPerson || customer.name || customer.contact_person || '',
            name: customer.contactPerson || customer.name || customer.contact_person || '',
            contact_person: customer.contactPerson || customer.name || customer.contact_person || '',
            
            // Contact fields (consistent)
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            
            // Vendor/Account type fields
            vendorNumber: customer.vendorNumber || customer.vendor_number || customer.phone || '',
            vendor_number: customer.vendorNumber || customer.vendor_number || customer.phone || '',
            // Note: accountType removed - not in Supabase schema
            
            // Status fields
            status: customer.status || 'active',
            
            // Notes fields
            notes: customer.notes || '',
            
            // Booking statistics
            bookingsCount: customer.bookingsCount || customer.bookings_count || 0,
            bookings_count: customer.bookingsCount || customer.bookings_count || 0,
            
            // Last delivery date
            lastDelivery: customer.lastDelivery || customer.last_delivery || '',
            last_delivery: customer.lastDelivery || customer.last_delivery || '',
            
            // Timestamps
            createdAt: customer.createdAt || customer.created_at || new Date().toISOString(),
            created_at: customer.createdAt || customer.created_at || new Date().toISOString(),
            updatedAt: customer.updatedAt || customer.updated_at || new Date().toISOString(),
            updated_at: customer.updatedAt || customer.updated_at || new Date().toISOString(),
            
            // User ID for Supabase RLS
            user_id: customer.user_id || customer.userId
        };
    }
    
    /**
     * Enhanced duplicate customer merging with field normalization
     */
    function mergeDuplicateCustomersEnhanced(customers) {
        console.log('🔄 Enhanced duplicate customer merging...');
        console.log('📊 Customers before merge:', customers.length);
        
        if (!customers || customers.length === 0) {
            return customers;
        }
        
        // Create a map to group customers by normalized name and phone
        const customerGroups = new Map();
        
        // Group customers by name and phone number
        customers.forEach(customer => {
            const normalizedCustomer = normalizeCustomerFields(customer);
            const key = `${normalizedCustomer.contactPerson.toLowerCase()}|${normalizedCustomer.phone}`;
            
            if (!customerGroups.has(key)) {
                customerGroups.set(key, []);
            }
            customerGroups.get(key).push(normalizedCustomer);
        });
        
        // Process groups to merge duplicates
        const mergedCustomers = [];
        let mergeCount = 0;
        
        customerGroups.forEach((group, key) => {
            if (group.length === 1) {
                // No duplicates, just add the customer
                mergedCustomers.push(group[0]);
            } else {
                // Merge duplicates
                console.log(`🔄 Merging ${group.length} duplicate customers for: ${key}`);
                mergeCount += group.length - 1;
                
                // Sort by createdAt to get the most recent one as the primary
                group.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
                
                // Use the most recent customer as the base
                const primaryCustomer = { ...group[0] };
                
                // Merge data from all duplicates
                let totalBookings = 0;
                let latestDeliveryDate = null;
                let mergedNotes = [];
                
                group.forEach(customer => {
                    totalBookings += customer.bookingsCount || customer.bookings_count || 0;
                    
                    // Get the latest delivery date
                    if (customer.lastDelivery || customer.last_delivery) {
                        const customerDate = new Date(customer.lastDelivery || customer.last_delivery);
                        if (!latestDeliveryDate || customerDate > latestDeliveryDate) {
                            latestDeliveryDate = customerDate;
                        }
                    }
                    
                    // Merge notes (avoid duplicates)
                    if (customer.notes && !mergedNotes.includes(customer.notes)) {
                        mergedNotes.push(customer.notes);
                    }
                    
                    // Keep the most complete address if available
                    if (customer.address && customer.address.length > (primaryCustomer.address?.length || 0)) {
                        primaryCustomer.address = customer.address;
                    }
                    
                    // Keep the most complete email if available
                    if (customer.email && customer.email.length > (primaryCustomer.email?.length || 0)) {
                        primaryCustomer.email = customer.email;
                    }
                });
                
                // Update the primary customer with merged data
                primaryCustomer.bookingsCount = totalBookings;
                primaryCustomer.bookings_count = totalBookings;
                
                if (latestDeliveryDate) {
                    primaryCustomer.lastDelivery = latestDeliveryDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    primaryCustomer.last_delivery = primaryCustomer.lastDelivery;
                }
                
                // Merge notes
                if (mergedNotes.length > 0) {
                    primaryCustomer.notes = mergedNotes.join('; ');
                }
                
                // Update timestamps
                primaryCustomer.updatedAt = new Date().toISOString();
                primaryCustomer.updated_at = primaryCustomer.updatedAt;
                
                mergedCustomers.push(primaryCustomer);
            }
        });
        
        console.log(`✅ Enhanced merge completed: ${mergeCount} duplicates merged`);
        console.log('📊 Customers after merge:', mergedCustomers.length);
        
        return mergedCustomers;
    }

    /**
     * Enhanced customer loading with field normalization
     */
    async function enhancedLoadCustomers() {
        console.log('🔄 Enhanced customer loading with field normalization...');
        
        // Prevent multiple simultaneous calls
        if (window.loadingCustomers) {
            console.log('⚠️ Customer loading already in progress, skipping...');
            return;
        }
        
        window.loadingCustomers = true;
        
        try {
            let customersLoaded = false;
            let customers = [];
            
            // Try to load from Supabase first
            if (window.dataService && typeof window.dataService.getCustomers === 'function') {
                try {
                    console.log('📊 Loading customers from Supabase...');
                    const supabaseCustomers = await window.dataService.getCustomers();
                    
                    if (supabaseCustomers && supabaseCustomers.length > 0) {
                        // Normalize all customer fields
                        customers = supabaseCustomers.map(customer => normalizeCustomerFields(customer));
                        customersLoaded = true;
                        console.log(`✅ Loaded ${customers.length} customers from Supabase`);
                    } else {
                        console.log('📊 Supabase returned empty customer list');
                    }
                } catch (supabaseError) {
                    console.warn('⚠️ Supabase customer loading failed:', supabaseError.message);
                }
            }
            
            // If Supabase didn't provide data, load from localStorage
            if (!customersLoaded) {
                try {
                    const savedCustomers = localStorage.getItem('mci-customers');
                    if (savedCustomers) {
                        const parsedCustomers = JSON.parse(savedCustomers);
                        if (parsedCustomers && parsedCustomers.length > 0) {
                            // Normalize all customer fields
                            customers = parsedCustomers.map(customer => normalizeCustomerFields(customer));
                            customersLoaded = true;
                            console.log(`✅ Loaded ${customers.length} customers from localStorage`);
                        }
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing localStorage customers:', parseError);
                }
            }
            
            // Merge duplicates before updating global array
            if (customers.length > 0) {
                console.log('🔄 Merging duplicate customers...');
                customers = mergeDuplicateCustomersEnhanced(customers);
            }
            
            // Update global customers array
            window.customers = customers;
            
            // Save normalized and merged data back to localStorage
            if (customers.length > 0) {
                try {
                    localStorage.setItem('mci-customers', JSON.stringify(customers));
                    console.log('💾 Saved normalized and merged customer data to localStorage');
                } catch (saveError) {
                    console.error('❌ Error saving normalized customers to localStorage:', saveError);
                }
            }
            
            console.log(`📊 Final customer count: ${window.customers.length}`);
            
        } catch (error) {
            console.error('❌ Error in enhanced customer loading:', error);
            window.customers = window.customers || [];
        } finally {
            window.loadingCustomers = false;
        }
        
        // Display customers
        if (typeof window.displayCustomers === 'function') {
            window.displayCustomers();
        }
        
        return window.customers;
    }
    
    /**
     * Enhanced customer saving with field normalization
     */
    async function enhancedSaveCustomer(customer) {
        console.log('💾 Enhanced customer saving with field normalization...');
        console.log('📝 Original customer data:', customer);
        
        try {
            // Normalize customer fields
            const normalizedCustomer = normalizeCustomerFields(customer);
            console.log('📝 Normalized customer data:', normalizedCustomer);
            
            // Save using dataService if available
            if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                try {
                    console.log('🚀 Saving customer to Supabase...');
                    const savedCustomer = await window.dataService.saveCustomer(normalizedCustomer);
                    console.log('✅ Customer saved to Supabase:', savedCustomer);
                    
                    // Update local array
                    if (!window.customers) {
                        window.customers = [];
                    }
                    
                    const existingIndex = window.customers.findIndex(c => c.id === normalizedCustomer.id);
                    if (existingIndex >= 0) {
                        window.customers[existingIndex] = normalizedCustomer;
                    } else {
                        window.customers.push(normalizedCustomer);
                    }
                    
                    // Save to localStorage as backup
                    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                    
                    return savedCustomer;
                    
                } catch (supabaseError) {
                    console.error('❌ Supabase customer save failed:', supabaseError);
                    // Fall through to localStorage save
                }
            }
            
            // Fallback to localStorage
            console.log('💾 Saving customer to localStorage...');
            if (!window.customers) {
                window.customers = [];
            }
            
            const existingIndex = window.customers.findIndex(c => c.id === normalizedCustomer.id);
            if (existingIndex >= 0) {
                window.customers[existingIndex] = normalizedCustomer;
            } else {
                window.customers.push(normalizedCustomer);
            }
            
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            console.log('✅ Customer saved to localStorage');
            
            return normalizedCustomer;
            
        } catch (error) {
            console.error('❌ Error in enhanced customer saving:', error);
            throw error;
        }
    }
    
    /**
     * Enhanced auto-create customer with field normalization
     */
    async function enhancedAutoCreateCustomer(customerName, vendorNumber, destination) {
        console.log('🔄 Enhanced auto-create customer with field normalization...');
        console.log('📝 Input:', { customerName, vendorNumber, destination });
        
        try {
            // Ensure customers array exists
            if (!window.customers) {
                window.customers = [];
            }
            
            // Check if customer already exists (normalized search)
            const existingCustomer = window.customers.find(customer => {
                const normalizedCustomer = normalizeCustomerFields(customer);
                return normalizedCustomer.contactPerson.toLowerCase() === customerName.toLowerCase() ||
                       normalizedCustomer.phone === vendorNumber;
            });
            
            if (existingCustomer) {
                console.log('✅ Customer already exists:', existingCustomer.contactPerson || existingCustomer.name);
                
                // Update booking count and last delivery date
                const normalizedExisting = normalizeCustomerFields(existingCustomer);
                normalizedExisting.bookingsCount = (normalizedExisting.bookingsCount || 0) + 1;
                normalizedExisting.bookings_count = normalizedExisting.bookingsCount;
                normalizedExisting.lastDelivery = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                normalizedExisting.last_delivery = normalizedExisting.lastDelivery;
                normalizedExisting.updatedAt = new Date().toISOString();
                normalizedExisting.updated_at = normalizedExisting.updatedAt;
                
                // Save updated customer
                await enhancedSaveCustomer(normalizedExisting);
                
                // Refresh display
                if (typeof window.displayCustomers === 'function') {
                    window.displayCustomers();
                }
                
                return normalizedExisting;
            }
            
            // Create new customer with normalized fields
            const newCustomer = {
                id: 'CUST-' + String((window.customers.length || 0) + 1).padStart(3, '0'),
                contactPerson: customerName,
                name: customerName,
                phone: vendorNumber,
                email: '',
                address: destination,
                vendorNumber: vendorNumber,
                vendor_number: vendorNumber,
                // Note: accountType removed - not in Supabase schema
                status: 'active',
                notes: 'Auto-created from delivery booking',
                bookingsCount: 1,
                bookings_count: 1,
                lastDelivery: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                last_delivery: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('📝 New customer to create:', newCustomer);
            
            // Save new customer
            const savedCustomer = await enhancedSaveCustomer(newCustomer);
            
            // Refresh display
            if (typeof window.displayCustomers === 'function') {
                window.displayCustomers();
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast(`Customer "${customerName}" automatically added to Customer Management!`);
            }
            
            console.log('✅ New customer auto-created successfully');
            return savedCustomer;
            
        } catch (error) {
            console.error('❌ Error in enhanced auto-create customer:', error);
            return null;
        }
    }
    
    /**
     * Enhanced customer display with normalized data
     */
    function enhancedDisplayCustomers() {
        console.log('🎨 Enhanced customer display with normalized data...');
        
        const customersContainer = document.getElementById('customersContainer');
        if (!customersContainer) {
            console.error('❌ Customers container not found');
            return;
        }
        
        // Ensure customers array exists and is normalized
        if (!window.customers) {
            window.customers = [];
        }
        
        // Normalize all customers before display
        window.customers = window.customers.map(customer => normalizeCustomerFields(customer));
        
        // Apply search and filter logic (same as original)
        const searchInput = document.getElementById('customerSearchInput');
        const filterSelect = document.getElementById('customerFilterSelect');
        
        let filteredCustomers = [...window.customers];
        
        // Apply search filter
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.contactPerson.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                customer.address.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (filterSelect && filterSelect.value !== 'all') {
            filteredCustomers = filteredCustomers.filter(customer => 
                customer.status === filterSelect.value
            );
        }
        
        // Display customers or empty message
        if (filteredCustomers.length === 0) {
            customersContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-person-x" style="font-size: 3rem; opacity: 0.3;"></i>
                    <h4 class="mt-3">No customers found</h4>
                    <p class="text-muted">Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }
        
        // Generate customer cards with normalized data
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
                                    <h5 class="card-title mb-1">${customer.contactPerson}</h5>
                                    <p class="card-text text-muted small mb-0">${customer.id}</p>
                                </div>
                                ${isAutoCreated ? '<span class="badge bg-info">Auto-Created</span>' : ''}
                            </div>
                            
                            <div class="mb-3">
                                <p class="mb-1"><i class="bi bi-telephone me-2"></i>${customer.phone}</p>
                                <p class="mb-1"><i class="bi bi-geo-alt me-2"></i>${customer.address}</p>
                                <p class="mb-0"><i class="bi bi-envelope me-2"></i>${customer.email || 'No email'}</p>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    ${accountTypeBadge}
                                    <span class="badge bg-secondary ms-1">${customer.status}</span>
                                </div>
                                <div class="text-end">
                                    <p class="mb-0 small text-muted">Bookings: <strong>${customer.bookingsCount}</strong></p>
                                    <p class="mb-0 small text-muted">Last: ${customer.lastDelivery || 'Never'}</p>
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
        
        console.log(`✅ Enhanced customer display completed: ${filteredCustomers.length} customers shown`);
    }
    
    // Override existing functions with enhanced versions
    if (typeof window.loadCustomers === 'function') {
        window.originalLoadCustomers = window.loadCustomers;
    }
    window.loadCustomers = enhancedLoadCustomers;
    
    if (typeof window.displayCustomers === 'function') {
        window.originalDisplayCustomers = window.displayCustomers;
    }
    window.displayCustomers = enhancedDisplayCustomers;
    
    if (typeof window.autoCreateCustomer === 'function') {
        window.originalAutoCreateCustomer = window.autoCreateCustomer;
    }
    window.autoCreateCustomer = enhancedAutoCreateCustomer;
    
    // Add utility functions to window
    window.normalizeCustomerFields = normalizeCustomerFields;
    window.mergeDuplicateCustomersEnhanced = mergeDuplicateCustomersEnhanced;
    window.enhancedLoadCustomers = enhancedLoadCustomers;
    window.enhancedSaveCustomer = enhancedSaveCustomer;
    window.enhancedAutoCreateCustomer = enhancedAutoCreateCustomer;
    window.enhancedDisplayCustomers = enhancedDisplayCustomers;
    
    console.log('✅ Customer Field Mapping Fix loaded successfully');
    
})();

// Export for external access
window.customerFieldMappingFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};