// Customer Management System
console.log('=== CUSTOMERS.JS LOADED ===');

// Real-time service instance
let realtimeService = null;

/**
 * Ensure DataService is initialized before use
 * This is a defensive check to handle race conditions
 */
async function ensureDataServiceInitialized() {
    if (!window.dataService) {
        throw new Error('DataService not available');
    }
    
    if (!window.dataService.isInitialized) {
        console.warn('⚠️ DataService not initialized yet, initializing now...');
        await window.dataService.initialize();
    }
}

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

// Load customers from Supabase only
async function loadCustomers() {
    console.log('=== LOAD CUSTOMERS FUNCTION CALLED ===');
    
    // Prevent multiple simultaneous calls
    if (window.loadingCustomers) {
        console.log('⚠️ Customer loading already in progress, skipping...');
        return;
    }
    
    window.loadingCustomers = true;
    
    try {
        // Ensure DataService is initialized
        await ensureDataServiceInitialized();
        
        // Load customers from Supabase
        const customers = await window.dataService.getCustomers();
        window.customers = customers || [];
        console.log(`✅ Loaded ${window.customers.length} customers from Supabase`);
        
        // Display customers in the UI
        displayCustomers();
        
        console.log('Customers loaded successfully');
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        
        // Use ErrorHandler for consistent error handling
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'loadCustomers');
        } else {
            showError('Failed to load customers. Please try again.');
        }
        
        // Initialize empty array on error
        window.customers = [];
        displayCustomers();
    } finally {
        window.loadingCustomers = false;
    }
}

// Note: Duplicate customer prevention is now handled at the database level
// through unique constraints on the customers table in Supabase.
// The database schema ensures that duplicate customers (by name and phone)
// cannot be created, eliminating the need for client-side merge logic.

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
        
        // Ensure DataService is initialized
        await ensureDataServiceInitialized();
        
        // Load current customers from database
        const customers = await window.dataService.getCustomers();
        window.customers = customers || [];
        
        // Check if customer already exists (by name or phone)
        const existingCustomer = window.customers.find(customer => 
            customer.name?.toLowerCase() === customerName.toLowerCase() ||
            customer.phone === vendorNumber
        );
        
        console.log('Existing customer found:', existingCustomer);

        if (existingCustomer) {
            console.log('Customer already exists:', existingCustomer.name);
            
            // Update booking count and last delivery date for existing customer
            const updatedCustomer = {
                ...existingCustomer,
                bookings_count: (existingCustomer.bookings_count || 0) + 1,
                last_delivery: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })
            };
            
            // Validate before saving
            if (window.DataValidator) {
                const validation = window.DataValidator.validateCustomer(updatedCustomer);
                if (!validation.isValid) {
                    console.warn('Customer validation failed:', validation.errors);
                    throw new Error(window.DataValidator.formatErrors(validation.errors));
                }
            }
            
            // Ensure DataService is initialized
            await ensureDataServiceInitialized();
            
            // Save updated customer to Supabase
            await window.dataService.saveCustomer(updatedCustomer);
            
            // Refresh customers view
            await loadCustomers();
            
            // Show update message
            showToast(`Customer "${customerName}" booking count updated in Customer Management!`);
            
            return updatedCustomer;
        }

        // Create new customer object with database schema field names
        const newCustomer = {
            id: 'CUST-' + String((window.customers.length || 0) + 1).padStart(3, '0'),
            name: customerName,
            contact_person: customerName,
            phone: vendorNumber,
            address: destination,
            account_type: 'Individual',
            email: '',
            status: 'active',
            notes: 'Auto-created from delivery booking',
            bookings_count: 1,
            last_delivery: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
        };

        // Validate before saving
        if (window.DataValidator) {
            const validation = window.DataValidator.validateCustomer(newCustomer);
            if (!validation.isValid) {
                console.warn('Customer validation failed:', validation.errors);
                throw new Error(window.DataValidator.formatErrors(validation.errors));
            }
        }

        // Ensure DataService is initialized
        await ensureDataServiceInitialized();
        
        // Save to Supabase
        await window.dataService.saveCustomer(newCustomer);
        console.log('New customer auto-created:', newCustomer.name);
        
        // Refresh customers view
        await loadCustomers();
        
        // Show success message
        showToast(`Customer "${customerName}" automatically added to Customer Management section!`);

        return newCustomer;
    } catch (error) {
        console.error('Error auto-creating customer:', error);
        
        // Use ErrorHandler for consistent error handling
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'autoCreateCustomer');
        } else {
            showError('Failed to auto-create customer. Booking will continue without customer record.');
        }
        
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
async function saveEditedCustomer() {
    console.log('Saving edited customer');
    
    try {
        const customerId = document.getElementById('editCustomerId').value;
        const customer = window.customers.find(c => c.id === customerId);
        
        if (!customer) {
            throw new Error('Customer not found: ' + customerId);
        }
        
        // Update customer data with database schema field names
        const updatedCustomer = {
            ...customer,
            name: document.getElementById('editCustomerName').value,
            contact_person: document.getElementById('editCustomerName').value,
            phone: document.getElementById('editCustomerPhone').value,
            email: document.getElementById('editCustomerEmail').value,
            address: document.getElementById('editCustomerAddress').value,
            account_type: document.getElementById('editCustomerAccountType').value,
            status: document.getElementById('editCustomerStatus').value,
            notes: document.getElementById('editNotes').value
        };
        
        // Validate before saving
        if (window.DataValidator) {
            const validation = window.DataValidator.validateCustomer(updatedCustomer);
            if (!validation.isValid) {
                throw new Error(window.DataValidator.formatErrors(validation.errors));
            }
        }
        
        // Ensure dataService is available
        if (!window.dataService || typeof window.dataService.saveCustomer !== 'function') {
            throw new Error('DataService not available');
        }
        
        // Ensure DataService is initialized
        await ensureDataServiceInitialized();
        
        // Save to Supabase
        await window.dataService.saveCustomer(updatedCustomer);
        
        // Refresh display
        await loadCustomers();
        
        // Hide modal
        const editCustomerModal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
        if (editCustomerModal) {
            editCustomerModal.hide();
        }
        
        // Show success message
        showToast('Customer updated successfully!');
    } catch (error) {
        console.error('Error saving edited customer:', error);
        
        // Use ErrorHandler for consistent error handling
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'saveEditedCustomer');
        } else {
            showError('Failed to update customer. Please try again.');
        }
    }
}

// Delete customer function
async function deleteCustomer(customerId) {
    console.log('Deleting customer:', customerId);
    
    // Confirmation dialog before deletion
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Find the customer to delete
        const customerToDelete = window.customers.find(customer => customer.id === customerId);
        
        if (!customerToDelete) {
            throw new Error('Customer not found: ' + customerId);
        }
        
        // Ensure dataService is available
        if (!window.dataService || typeof window.dataService.deleteCustomer !== 'function') {
            throw new Error('DataService not available');
        }
        
        // Ensure DataService is initialized
        await ensureDataServiceInitialized();
        
        // Delete from Supabase
        await window.dataService.deleteCustomer(customerId);
        console.log('✅ Customer deleted from Supabase successfully');
        
        // Refresh display from database
        await loadCustomers();
        
        // Show success message
        showToast('Customer deleted successfully!');
    } catch (error) {
        console.error('Error deleting customer:', error);
        
        // Use ErrorHandler for consistent error handling
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, 'deleteCustomer');
        } else {
            showError('Failed to delete customer. Please try again.');
        }
    }
}

// Initialize real-time subscriptions for customers
// Requirement 4.1: Real-time updates across all connected clients
// Requirement 4.2: Use Supabase real-time features
// Requirement 4.3: Automatic UI updates on data changes
function initCustomerRealtimeSubscriptions() {
    console.log('=== INITIALIZING CUSTOMER REAL-TIME SUBSCRIPTIONS ===');
    
    try {
        // Check if RealtimeService and DataService are available
        if (!window.RealtimeService) {
            console.warn('RealtimeService not available. Real-time updates disabled.');
            return;
        }
        
        if (!window.dataService) {
            console.warn('DataService not available. Real-time updates disabled.');
            return;
        }
        
        // Create RealtimeService instance
        realtimeService = new window.RealtimeService(window.dataService);
        
        // Subscribe to customers table changes
        realtimeService.subscribeToTable('customers', handleCustomerChange);
        
        console.log('✅ Customer real-time subscriptions initialized successfully');
        
        // Show notification to user
        showCustomerRealtimeIndicator('connected');
        
    } catch (error) {
        console.error('❌ Failed to initialize customer real-time subscriptions:', error);
        showCustomerRealtimeIndicator('error');
    }
}

// Handle real-time customer changes
// Requirement 4.3: Automatic UI updates when data changes
function handleCustomerChange(payload) {
    console.log('📡 Real-time customer change detected:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Show visual indicator for real-time update
    showCustomerRealtimeIndicator('update');
    
    try {
        switch (eventType) {
            case 'INSERT':
                console.log('New customer created:', newRecord);
                handleCustomerInsert(newRecord);
                break;
                
            case 'UPDATE':
                console.log('Customer updated:', newRecord);
                handleCustomerUpdate(newRecord);
                break;
                
            case 'DELETE':
                console.log('Customer deleted:', oldRecord);
                handleCustomerDelete(oldRecord);
                break;
                
            default:
                console.warn('Unknown event type:', eventType);
        }
        
        // Show toast notification
        showToast(`Customer ${eventType.toLowerCase()}d by another user`, 'info');
        
    } catch (error) {
        console.error('Error handling real-time customer change:', error);
    }
}

// Handle new customer insertion
function handleCustomerInsert(newRecord) {
    // Add to customers array if not already present
    const exists = window.customers.some(c => c.id === newRecord.id);
    if (!exists) {
        window.customers.push(newRecord);
        displayCustomers();
    }
}

// Handle customer update
function handleCustomerUpdate(newRecord) {
    // Update customer in array
    const index = window.customers.findIndex(c => c.id === newRecord.id);
    if (index !== -1) {
        window.customers[index] = newRecord;
        displayCustomers();
    } else {
        // Customer not in local array, add it
        window.customers.push(newRecord);
        displayCustomers();
    }
}

// Handle customer deletion
function handleCustomerDelete(oldRecord) {
    // Remove from customers array
    const index = window.customers.findIndex(c => c.id === oldRecord.id);
    if (index !== -1) {
        window.customers.splice(index, 1);
        displayCustomers();
    }
}

// Show real-time connection indicator for customers
// Requirement 4.3: Add visual indicators for real-time updates
function showCustomerRealtimeIndicator(status) {
    let indicator = document.getElementById('customerRealtimeIndicator');
    
    // Create indicator if it doesn't exist
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'customerRealtimeIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    // Update indicator based on status
    switch (status) {
        case 'connected':
            indicator.innerHTML = '<i class="bi bi-wifi"></i> Real-time connected';
            indicator.style.backgroundColor = '#d1e7dd';
            indicator.style.color = '#0f5132';
            // Hide after 3 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 3000);
            break;
            
        case 'update':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-arrow-repeat"></i> Syncing...';
            indicator.style.backgroundColor = '#cfe2ff';
            indicator.style.color = '#084298';
            // Hide after 2 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 2000);
            break;
            
        case 'error':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Real-time unavailable';
            indicator.style.backgroundColor = '#f8d7da';
            indicator.style.color = '#842029';
            // Hide after 5 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 5000);
            break;
            
        case 'disconnected':
            indicator.style.display = 'flex';
            indicator.style.opacity = '1';
            indicator.innerHTML = '<i class="bi bi-wifi-off"></i> Real-time disconnected';
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#664d03';
            break;
    }
}

// Cleanup real-time subscriptions on page unload
window.addEventListener('beforeunload', function() {
    if (realtimeService) {
        console.log('Cleaning up customer real-time subscriptions...');
        realtimeService.cleanup();
    }
});

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
    
    // Initialize real-time subscriptions
    initCustomerRealtimeSubscriptions();
    
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
        saveCustomerBtn.addEventListener('click', async function() {
            try {
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
                    showError('Please fill in all required fields');
                    return;
                }
                
                // Create new customer object with database schema field names
                const newCustomer = {
                    id: 'CUST-' + String((window.customers?.length || 0) + 1).padStart(3, '0'),
                    name: contactPerson,
                    contact_person: contactPerson,
                    phone: phone,
                    email: email,
                    address: address,
                    account_type: accountType,
                    status: status,
                    notes: notes,
                    bookings_count: 0,
                    last_delivery: ''
                };
                
                // Validate before saving
                if (window.DataValidator) {
                    const validation = window.DataValidator.validateCustomer(newCustomer);
                    if (!validation.isValid) {
                        throw new Error(window.DataValidator.formatErrors(validation.errors));
                    }
                }
                
                // Ensure dataService is available
                if (!window.dataService || typeof window.dataService.saveCustomer !== 'function') {
                    throw new Error('DataService not available');
                }
                
                // Ensure DataService is initialized
                await ensureDataServiceInitialized();
                
                // Save customer to Supabase
                await window.dataService.saveCustomer(newCustomer);
                console.log('✅ Customer saved to Supabase successfully');
                
                // Refresh display
                await loadCustomers();
                
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
                showToast('Customer added successfully!');
                
                // Reset form
                document.getElementById('addCustomerForm').reset();
            } catch (error) {
                console.error('❌ Failed to save customer:', error);
                
                // Use ErrorHandler for consistent error handling
                if (window.ErrorHandler) {
                    window.ErrorHandler.handle(error, 'saveCustomer');
                } else {
                    showError('Failed to save customer. Please try again.');
                }
            }
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