// Customer Management System
console.log('=== CUSTOMERS.JS LOADED ===');

// Show toast notification
function showToast(message, type = 'success') {
    // Create toast element if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Show error notification
function showError(message) {
    showToast(message, 'danger');
}

// Global customers array
window.customers = [];

// Load customers from Supabase/localStorage
async function loadCustomers() {
    console.log('=== LOAD CUSTOMERS FUNCTION CALLED ===');
    
    // Prevent multiple simultaneous calls
    if (window.loadingCustomers) {
        console.log('⚠️ Customer loading already in progress, skipping...');
        return;
    }
    
    window.loadingCustomers = true;
    
    try {
        let customersLoaded = false;
        
        // Try to load from Supabase first
        if (window.dataService) {
            try {
                const customers = await window.dataService.getCustomers();
                if (customers && customers.length > 0) {
                    window.customers = customers;
                    customersLoaded = true;
                    console.log(`✅ Loaded ${customers.length} customers from Supabase`);
                } else {
                    console.log('📊 Supabase returned empty customer list, checking localStorage...');
                }
            } catch (supabaseError) {
                console.log('⚠️ Supabase customer loading failed:', supabaseError.message);
            }
        }
        
        // If Supabase didn't provide data, load from localStorage
        if (!customersLoaded) {
            const savedCustomers = localStorage.getItem('mci-customers');
            if (savedCustomers) {
                const parsed = JSON.parse(savedCustomers);
                if (parsed && parsed.length > 0) {
                    window.customers = parsed;
                    customersLoaded = true;
                    console.log(`✅ Loaded ${window.customers.length} customers from localStorage`);
                }
            }
        }
        
        // Initialize empty array if no data found
        if (!customersLoaded) {
            window.customers = window.customers || [];
            console.log('📊 No customer data found, initialized empty array');
        }
        
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        // Ensure we have an array even if loading fails
        window.customers = window.customers || [];
    } finally {
        window.loadingCustomers = false;
    }
    
    try {
        // Only merge duplicates if we have customers loaded
        if (window.customers && window.customers.length > 0) {
            console.log('Merging duplicate customers...');
            mergeDuplicateCustomers();
        } else {
            console.log('No customers to merge, initializing with mock data...');
            // Initialize with mock data if no data exists
            if (!window.customers || window.customers.length === 0) {
                window.customers = [
                    {
                        id: 'CUST-001',
                        contactPerson: 'John Doe',
                        phone: '+63 917 123 4567',
                        address: '123 Main Street, Makati City',
                        accountType: 'Individual',
                        email: '',
                        status: 'active',
                        notes: 'Regular customer',
                        bookingsCount: 3,
                        lastDelivery: 'Oct 24, 2023',
                        createdAt: new Date('2023-10-01')
                    },
                    {
                        id: 'CUST-002',
                        contactPerson: 'Jane Smith',
                        phone: '+63 918 765 4321',
                        address: '456 Oak Avenue, Quezon City',
                        accountType: 'Individual',
                        email: '',
                        status: 'active',
                        notes: 'Auto-created from delivery booking',
                        bookingsCount: 1,
                        lastDelivery: 'Oct 25, 2023',
                        createdAt: new Date('2023-10-25')
                    }
                ];
                console.log('Initialized with mock customer data');
            }
        }
        
        // Display customers in the UI
        displayCustomers();
        
        console.log('Customers loaded successfully');
    } catch (error) {
        console.error('Error loading customers:', error);
        // Initialize with empty array if there's an error
        window.customers = [
            {
                id: 'CUST-001',
                contactPerson: 'John Doe',
                phone: '+63 917 123 4567',
                address: '123 Main Street, Makati City',
                accountType: 'Individual',
                email: '',
                status: 'active',
                notes: 'Regular customer',
                bookingsCount: 3,
                lastDelivery: 'Oct 24, 2023',
                createdAt: new Date('2023-10-01')
            },
            {
                id: 'CUST-002',
                contactPerson: 'Jane Smith',
                phone: '+63 918 765 4321',
                address: '456 Oak Avenue, Quezon City',
                accountType: 'Individual',
                email: '',
                status: 'active',
                notes: 'Auto-created from delivery booking',
                bookingsCount: 1,
                lastDelivery: 'Oct 25, 2023',
                createdAt: new Date('2023-10-25')
            }
        ];
        displayCustomers();
    }
}

// Function to merge duplicate customers based on name and phone number
function mergeDuplicateCustomers() {
    console.log('=== MERGE DUPLICATE CUSTOMERS FUNCTION CALLED ===');
    console.log('Customers before merge:', window.customers.length);
    
    // Create a map to group customers by name and phone
    const customerGroups = new Map();
    
    // Group customers by name and phone number
    window.customers.forEach(customer => {
        const key = `${customer.contactPerson.toLowerCase()}|${customer.phone}`;
        if (!customerGroups.has(key)) {
            customerGroups.set(key, []);
        }
        customerGroups.get(key).push(customer);
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
            console.log(`Merging ${group.length} duplicate customers for: ${key}`);
            mergeCount += group.length - 1;
            
            // Sort by createdAt to get the most recent one as the primary
            group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Use the most recent customer as the base
            const primaryCustomer = { ...group[0] };
            
            // Merge data from all duplicates
            let totalBookings = 0;
            let latestDeliveryDate = null;
            
            group.forEach(customer => {
                totalBookings += customer.bookingsCount || 0;
                
                // Get the latest delivery date
                if (customer.lastDelivery) {
                    const customerDate = new Date(customer.lastDelivery);
                    if (!latestDeliveryDate || customerDate > latestDeliveryDate) {
                        latestDeliveryDate = customerDate;
                    }
                }
                
                // Merge notes
                if (customer.notes && !primaryCustomer.notes.includes(customer.notes)) {
                    primaryCustomer.notes = primaryCustomer.notes ? 
                        `${primaryCustomer.notes}; ${customer.notes}` : 
                        customer.notes;
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
            if (latestDeliveryDate) {
                primaryCustomer.lastDelivery = latestDeliveryDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            
            mergedCustomers.push(primaryCustomer);
        }
    });
    
    // Update the global customers array
    window.customers = mergedCustomers;
    
    // Save to localStorage
    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    
    console.log(`Merged ${mergeCount} duplicate customers`);
    console.log('Customers after merge:', window.customers.length);
    
    return mergeCount;
}

// Display customers in the UI
function displayCustomers() {
    console.log('=== DISPLAY CUSTOMERS FUNCTION CALLED ===');
    
    const customersContainer = document.getElementById('customersContainer');
    if (!customersContainer) {
        console.error('Customers container not found');
        return;
    }
    
    // Filter and search functionality
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
    
    // Generate customer cards
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
                                <p class="mb-0 small text-muted">Last: ${customer.lastDelivery}</p>
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
            editCustomer(customerId);
        });
    });
    
    document.querySelectorAll('.delete-customer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.customerId;
            deleteCustomer(customerId);
        });
    });
    
    console.log('Customers displayed successfully');
}

// Auto-create customer from booking details
async function autoCreateCustomer(customerName, vendorNumber, destination) {
    try {
        console.log('=== AUTO CREATE CUSTOMER DEBUG ===');
        console.log('Customer Name:', customerName);
        console.log('Vendor Number:', vendorNumber);
        console.log('Destination:', destination);
        console.log('Window.customers exists:', !!window.customers);
        console.log('Window.customers array:', window.customers);
        
        // Ensure customers array exists
        if (!window.customers) {
            console.log('No customers array found, initializing...');
            window.customers = [];
        }
        
        // Check if customer already exists (by name or phone)
        const existingCustomer = window.customers?.find(customer => 
            customer.contactPerson.toLowerCase() === customerName.toLowerCase() ||
            customer.phone === vendorNumber
        );
        
        console.log('Existing customer found:', existingCustomer);

        if (existingCustomer) {
            console.log('Customer already exists:', existingCustomer.contactPerson);
            
            // Update booking count and last delivery date for existing customer
            existingCustomer.bookingsCount = (existingCustomer.bookingsCount || 0) + 1;
            existingCustomer.lastDelivery = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Save updated customer data to localStorage
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            // Always refresh customers view to ensure updated data is visible
            if (typeof window.loadCustomers === 'function') {
                window.loadCustomers();
            }
            
            // Show update message
            showToast(`Customer "${customerName}" booking count updated in Customer Management!`);
            
            return existingCustomer;
        }

        // Create new customer
        const newCustomer = {
            id: 'CUST-' + String((window.customers?.length || 0) + 1).padStart(3, '0'),
            contactPerson: customerName,
            phone: vendorNumber,
            address: destination, // Use destination as address
            accountType: 'Individual', // Default account type for individual customers
            email: '', // Empty email - can be filled later
            status: 'active',
            notes: 'Auto-created from delivery booking',
            bookingsCount: 1,
            lastDelivery: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            createdAt: new Date()
        };

        // Add to customers array
        window.customers.push(newCustomer);
        console.log('New customer auto-created:', newCustomer.contactPerson);
        console.log('Updated window.customers array:', window.customers);
        
        // Save to localStorage
        localStorage.setItem('mci-customers', JSON.stringify(window.customers));
        console.log('Saved to localStorage');
        
        // Always refresh customers view to ensure new customer is visible
        console.log('=== REFRESHING CUSTOMER DISPLAY ===');
        
        if (typeof window.loadCustomers === 'function') {
            console.log('Calling window.loadCustomers()');
            window.loadCustomers();
        } else {
            console.log('window.loadCustomers function not available');
        }
        
        // Force refresh by triggering a custom event
        const customerUpdateEvent = new CustomEvent('customerUpdated', {
            detail: { customer: newCustomer, action: 'created' }
        });
        window.dispatchEvent(customerUpdateEvent);
        console.log('Dispatched customerUpdated event');
        
        // Show success message
        showToast(`Customer "${customerName}" automatically added to Customer Management section!`);

        return newCustomer;
    } catch (error) {
        console.error('Error auto-creating customer:', error);
        // Don't fail the booking if customer creation fails
        return null;
    }
}

// Edit customer function
function editCustomer(customerId) {
    console.log('Editing customer:', customerId);
    
    const customer = window.customers.find(c => c.id === customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Populate edit modal with customer data
    document.getElementById('editCustomerId').value = customer.id;
    document.getElementById('editCustomerName').value = customer.contactPerson;
    document.getElementById('editCustomerPhone').value = customer.phone;
    document.getElementById('editCustomerEmail').value = customer.email;
    document.getElementById('editCustomerAddress').value = customer.address;
    document.getElementById('editCustomerAccountType').value = customer.accountType;
    document.getElementById('editCustomerStatus').value = customer.status;
    document.getElementById('editNotes').value = customer.notes;
    
    // Show edit modal
    const editCustomerModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
    editCustomerModal.show();
}

// Save edited customer
function saveEditedCustomer() {
    console.log('Saving edited customer');
    
    const customerId = document.getElementById('editCustomerId').value;
    const customer = window.customers.find(c => c.id === customerId);
    
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Update customer data
    customer.contactPerson = document.getElementById('editCustomerName').value;
    customer.phone = document.getElementById('editCustomerPhone').value;
    customer.email = document.getElementById('editCustomerEmail').value;
    customer.address = document.getElementById('editCustomerAddress').value;
    customer.accountType = document.getElementById('editCustomerAccountType').value;
    customer.status = document.getElementById('editCustomerStatus').value;
    customer.notes = document.getElementById('editNotes').value;
    
    // Save to localStorage
    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    
    // Refresh display
    displayCustomers();
    
    // Hide modal
    const editCustomerModal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
    editCustomerModal.hide();
    
    // Show success message
    showToast('Customer updated successfully!');
}

// Delete customer function
function deleteCustomer(customerId) {
    console.log('Deleting customer:', customerId);
    
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }
    
    // Remove customer from array
    window.customers = window.customers.filter(customer => customer.id !== customerId);
    
    // Save to localStorage
    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
    
    // Refresh display
    displayCustomers();
    
    // Show success message
    showToast('Customer deleted successfully!');
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Customers.js: DOMContentLoaded event fired');
    
    // Make functions globally available
    window.loadCustomers = loadCustomers;
    window.displayCustomers = displayCustomers;
    window.autoCreateCustomer = autoCreateCustomer;
    window.editCustomer = editCustomer;
    window.saveEditedCustomer = saveEditedCustomer;
    window.deleteCustomer = deleteCustomer;
    window.mergeDuplicateCustomers = mergeDuplicateCustomers;
    
    // Add event listeners for search and filter
    const searchInput = document.getElementById('customerSearchInput');
    const filterSelect = document.getElementById('customerFilterSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            displayCustomers();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            displayCustomers();
        });
    }
    
    // Add event listener for save edited customer button
    const saveEditedCustomerBtn = document.getElementById('updateCustomerBtn');
    if (saveEditedCustomerBtn) {
        saveEditedCustomerBtn.addEventListener('click', saveEditedCustomer);
    }
    
    // Add event listener for add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            // Show add customer modal using our utility function if available
            if (typeof window.showModal === 'function') {
                window.showModal('addCustomerModal');
            } else {
                // Fallback to Bootstrap modal
                const addCustomerModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
                addCustomerModal.show();
            }
        });
    }
    
    // Add event listener for save customer button
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', function() {
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
                alert('Please fill in all required fields');
                return;
            }
            
            // Create new customer object
            const newCustomer = {
                id: 'CUST-' + String((window.customers?.length || 0) + 1).padStart(3, '0'),
                contactPerson: contactPerson,
                phone: phone,
                email: email,
                address: address,
                accountType: accountType,
                status: status,
                notes: notes,
                bookingsCount: 0,
                lastDelivery: '',
                createdAt: new Date()
            };
            
            // Save customer using dataService
            if (window.dataService) {
                window.dataService.saveCustomer(newCustomer).then(() => {
                    console.log('✅ Customer saved to Supabase successfully');
                    // Refresh display
                    displayCustomers();
                }).catch(error => {
                    console.error('❌ Failed to save customer to Supabase:', error);
                    // Fallback to localStorage
                    if (!window.customers) {
                        window.customers = [];
                    }
                    window.customers.push(newCustomer);
                    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                    displayCustomers();
                });
            } else {
                // Fallback to localStorage
                if (!window.customers) {
                    window.customers = [];
                }
                window.customers.push(newCustomer);
                localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                displayCustomers();
            }
            
            // Refresh display
            displayCustomers();
            
            // Hide modal using our utility function if available
            if (typeof window.hideModal === 'function') {
                window.hideModal('addCustomerModal');
            } else {
                // Fallback to Bootstrap modal
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
        });
    }
    
    console.log('Customers.js: Event listeners added');
});

// Initialize customers when the script loads
setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCustomers);
    } else {
        loadCustomers();
    }
}, 100);

console.log('=== CUSTOMERS.JS INITIALIZATION COMPLETE ===');