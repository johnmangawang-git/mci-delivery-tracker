/**
 * DIRECT EXCEL CUSTOMER INTEGRATION
 * Directly integrates customer creation into the Excel upload process
 * Bypasses all existing function dependencies and creates customers directly
 */

console.log('🔧 Loading Direct Excel Customer Integration...');

(function() {
    'use strict';
    
    /**
     * Direct customer creation that bypasses all other functions
     */
    async function createCustomerDirectly(customerName, vendorNumber, destination) {
        console.log('🔄 DIRECT customer creation:', { customerName, vendorNumber, destination });
        
        try {
            // Create customer object with all field variations
            const customer = {
                id: 'CUST-DIRECT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                contactPerson: customerName,
                name: customerName,
                contact_person: customerName,
                phone: vendorNumber,
                email: '',
                address: destination,
                vendorNumber: vendorNumber,
                vendor_number: vendorNumber,
                // Note: accountType removed - not in Supabase schema
                status: 'active',
                notes: 'Auto-created from Excel upload (Direct Integration)',
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
            
            console.log('📝 Created customer object:', customer);
            
            // Initialize global customers array if it doesn't exist
            if (!window.customers) {
                window.customers = [];
                console.log('✅ Initialized window.customers array');
            }
            
            // Check if customer already exists
            const existingCustomer = window.customers.find(c => 
                (c.phone === vendorNumber) || 
                (c.contactPerson && c.contactPerson.toLowerCase() === customerName.toLowerCase())
            );
            
            if (existingCustomer) {
                console.log('⚠️ Customer already exists, updating booking count');
                existingCustomer.bookingsCount = (existingCustomer.bookingsCount || 0) + 1;
                existingCustomer.bookings_count = existingCustomer.bookingsCount;
                existingCustomer.lastDelivery = customer.lastDelivery;
                existingCustomer.last_delivery = customer.last_delivery;
                existingCustomer.updatedAt = customer.updatedAt;
                existingCustomer.updated_at = customer.updated_at;
                
                // Save updated customer
                await saveCustomerToSupabase(existingCustomer);
                return existingCustomer;
            }
            
            // Add to global array
            window.customers.push(customer);
            console.log('✅ Added customer to window.customers array');
            
            // Save to localStorage
            try {
                localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                console.log('✅ Saved customers to localStorage');
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
            }
            
            // Save to Supabase
            await saveCustomerToSupabase(customer);
            
            // Force refresh customer display
            setTimeout(() => {
                forceRefreshCustomerDisplay();
            }, 1000);
            
            return customer;
            
        } catch (error) {
            console.error('❌ Error in direct customer creation:', error);
            return null;
        }
    }
    
    /**
     * Save customer to Supabase directly
     */
    async function saveCustomerToSupabase(customer) {
        console.log('🚀 Saving customer to Supabase directly...');
        
        try {
            // Check if Supabase client is available
            if (typeof window.supabaseClient === 'function') {
                const client = window.supabaseClient();
                if (client) {
                    console.log('✅ Supabase client available, saving customer...');
                    
                    // Prepare data for Supabase (use 'name' field as required by schema)
                    const supabaseData = {
                        name: customer.contactPerson || customer.name,
                        phone: customer.phone,
                        email: customer.email || '',
                        address: customer.address || '',
                        vendor_number: customer.vendorNumber || customer.vendor_number || customer.phone,
                        created_at: customer.createdAt || customer.created_at,
                        updated_at: customer.updatedAt || customer.updated_at
                    };
                    
                    console.log('📝 Supabase data prepared:', supabaseData);
                    
                    // Check if customer already exists in Supabase
                    const { data: existingData } = await client
                        .from('customers')
                        .select('*')
                        .eq('phone', customer.phone)
                        .single();
                    
                    if (existingData) {
                        console.log('⚠️ Customer exists in Supabase, updating...');
                        const { data, error } = await client
                            .from('customers')
                            .update(supabaseData)
                            .eq('phone', customer.phone)
                            .select();
                        
                        if (error) {
                            console.error('❌ Supabase update error:', error);
                        } else {
                            console.log('✅ Customer updated in Supabase:', data);
                        }
                    } else {
                        console.log('📝 Creating new customer in Supabase...');
                        const { data, error } = await client
                            .from('customers')
                            .insert(supabaseData)
                            .select();
                        
                        if (error) {
                            console.error('❌ Supabase insert error:', error);
                        } else {
                            console.log('✅ Customer created in Supabase:', data);
                        }
                    }
                } else {
                    console.warn('⚠️ Supabase client not initialized');
                }
            } else {
                console.warn('⚠️ Supabase client function not available');
            }
        } catch (error) {
            console.error('❌ Error saving to Supabase:', error);
        }
    }
    
    /**
     * Force refresh customer display
     */
    function forceRefreshCustomerDisplay() {
        console.log('🔄 Force refreshing customer display...');
        
        try {
            // Find the customers container
            const customersContainer = document.getElementById('customersContainer');
            if (!customersContainer) {
                console.warn('⚠️ Customers container not found');
                return;
            }
            
            // Clear and rebuild customer display
            if (window.customers && window.customers.length > 0) {
                console.log(`📊 Displaying ${window.customers.length} customers`);
                
                let customersHtml = '';
                window.customers.forEach(customer => {
                    const isAutoCreated = customer.notes && customer.notes.includes('Auto-created');
                    
                    customersHtml += `
                        <div class="col-md-6 col-lg-4">
                            <div class="card customer-card h-100 ${isAutoCreated ? 'auto-created' : ''}" data-customer-id="${customer.id}">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 class="card-title mb-1">${customer.contactPerson || customer.name}</h5>
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
                                            <span class="badge bg-success">Individual</span>
                                            <span class="badge bg-secondary ms-1">${customer.status || 'active'}</span>
                                        </div>
                                        <div class="text-end">
                                            <p class="mb-0 small text-muted">Bookings: <strong>${customer.bookingsCount || 0}</strong></p>
                                            <p class="mb-0 small text-muted">Last: ${customer.lastDelivery || 'Never'}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3 pt-3 border-top">
                                        <p class="mb-0 text-muted small">${customer.notes || 'No notes'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                customersContainer.innerHTML = customersHtml;
                console.log('✅ Customer display updated');
                
                // Show success message
                if (typeof showToast === 'function') {
                    showToast('Customers updated from Excel upload!', 'success');
                }
            } else {
                customersContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-person-x" style="font-size: 3rem; opacity: 0.3;"></i>
                        <h4 class="mt-3">No customers found</h4>
                        <p class="text-muted">Upload Excel files to automatically create customers</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error refreshing customer display:', error);
        }
    }
    
    /**
     * Monitor for Excel data and create customers
     */
    function monitorForExcelData() {
        console.log('🔄 Starting Excel data monitoring...');
        
        // Monitor global variables for Excel data
        const checkForData = () => {
            const dataVariables = ['pendingDRBookings', 'excelData', 'uploadedData', 'drData'];
            
            dataVariables.forEach(varName => {
                if (window[varName] && Array.isArray(window[varName]) && window[varName].length > 0) {
                    const data = window[varName];
                    console.log(`📊 Found Excel data in ${varName}:`, data.length, 'records');
                    
                    // Process the data for customer creation
                    processExcelDataForCustomers(data, varName);
                }
            });
        };
        
        // Check immediately
        checkForData();
        
        // Check every 2 seconds
        setInterval(checkForData, 2000);
        
        // Also monitor for changes in the arrays
        const originalPush = Array.prototype.push;
        Array.prototype.push = function(...items) {
            const result = originalPush.apply(this, items);
            
            // Check if this is one of our monitored arrays
            if (this === window.pendingDRBookings || this === window.excelData || 
                this === window.uploadedData || this === window.drData) {
                console.log('📊 Array updated, checking for customer data...');
                setTimeout(() => {
                    processExcelDataForCustomers(this, 'monitored_array');
                }, 500);
            }
            
            return result;
        };
    }
    
    /**
     * Process Excel data for customer creation
     */
    async function processExcelDataForCustomers(data, source) {
        console.log(`🔄 Processing Excel data from ${source} for customer creation...`);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('⚠️ No valid data to process');
            return;
        }
        
        // Track processed data to avoid duplicates
        const processedKey = `processed_${source}_${data.length}`;
        if (window[processedKey]) {
            console.log('⚠️ Data already processed, skipping...');
            return;
        }
        window[processedKey] = true;
        
        console.log('📝 Sample data record:', data[0]);
        
        // Extract unique customers
        const uniqueCustomers = new Map();
        
        data.forEach((record, index) => {
            try {
                // Try multiple field name variations
                const customerName = record.customerName || record.customer_name || record['Customer Name'] || 
                                   record.Customer || record.client || record.Client || '';
                
                const vendorNumber = record.vendorNumber || record.vendor_number || record['Vendor Number'] || 
                                   record.phone || record.Phone || record.contact || record.Contact || '';
                
                const destination = record.destination || record.Destination || record.address || 
                                  record.Address || record.location || record.Location || '';
                
                if (customerName && vendorNumber) {
                    const key = `${customerName.toLowerCase()}_${vendorNumber}`;
                    if (!uniqueCustomers.has(key)) {
                        uniqueCustomers.set(key, {
                            customerName: customerName.trim(),
                            vendorNumber: vendorNumber.trim(),
                            destination: destination.trim() || 'Unknown Location'
                        });
                        console.log(`📝 Extracted customer: ${customerName} (${vendorNumber})`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error processing record ${index}:`, error);
            }
        });
        
        console.log(`📊 Found ${uniqueCustomers.size} unique customers to create`);
        
        if (uniqueCustomers.size === 0) {
            console.warn('⚠️ No customer data found in Excel records');
            return;
        }
        
        // Create each customer
        let successCount = 0;
        let errorCount = 0;
        
        for (const [key, customerData] of uniqueCustomers) {
            try {
                console.log(`🔄 Creating customer: ${customerData.customerName}`);
                const customer = await createCustomerDirectly(
                    customerData.customerName,
                    customerData.vendorNumber,
                    customerData.destination
                );
                
                if (customer) {
                    successCount++;
                    console.log(`✅ Customer created: ${customer.contactPerson || customer.name}`);
                } else {
                    errorCount++;
                    console.error(`❌ Failed to create customer: ${customerData.customerName}`);
                }
                
                // Small delay to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Error creating customer ${customerData.customerName}:`, error);
            }
        }
        
        console.log(`✅ Customer creation completed: ${successCount} successful, ${errorCount} errors`);
        
        // Show summary message
        if (typeof showToast === 'function') {
            if (errorCount === 0) {
                showToast(`Successfully created ${successCount} customers from Excel!`, 'success');
            } else {
                showToast(`Created ${successCount} customers, ${errorCount} failed. Check console for details.`, 'warning');
            }
        }
    }
    
    // Add functions to window for external access
    window.createCustomerDirectly = createCustomerDirectly;
    window.saveCustomerToSupabase = saveCustomerToSupabase;
    window.forceRefreshCustomerDisplay = forceRefreshCustomerDisplay;
    window.processExcelDataForCustomers = processExcelDataForCustomers;
    
    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(monitorForExcelData, 2000);
        });
    } else {
        setTimeout(monitorForExcelData, 2000);
    }
    
    console.log('✅ Direct Excel Customer Integration loaded successfully');
    
})();

// Export for external access
window.directExcelCustomerIntegration = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};