/**
 * FORCE EXCEL CUSTOMER CREATION
 * Forces customer creation to happen during Excel upload regardless of function availability
 * Hooks into the Excel upload process at multiple points to ensure customers are created
 */

console.log('🔧 Loading Force Excel Customer Creation...');

(function() {
    'use strict';
    
    /**
     * Force customer creation from Excel data
     */
    async function forceCustomerCreationFromExcel(excelData) {
        console.log('🔄 FORCE customer creation from Excel data...');
        console.log('📊 Excel data received:', excelData.length, 'records');
        
        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
            console.warn('⚠️ No Excel data provided for customer creation');
            return;
        }
        
        const createdCustomers = [];
        const errors = [];
        
        // Extract unique customers from Excel data
        const uniqueCustomers = new Map();
        
        excelData.forEach((record, index) => {
            try {
                // Try different field name variations for customer data
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
                        console.log(`📝 Found customer: ${customerName} (${vendorNumber})`);
                    }
                } else {
                    console.warn(`⚠️ Incomplete customer data at record ${index + 1}:`, {
                        customerName, vendorNumber, destination
                    });
                }
            } catch (error) {
                console.error(`❌ Error processing record ${index + 1}:`, error);
            }
        });
        
        console.log(`📊 Found ${uniqueCustomers.size} unique customers to create`);
        
        // Create each unique customer
        for (const [key, customerData] of uniqueCustomers) {
            try {
                console.log(`🔄 Creating customer: ${customerData.customerName}`);
                
                let customer = null;
                
                // Try multiple customer creation methods
                if (typeof window.enhancedAutoCreateCustomer === 'function') {
                    console.log('🔄 Using enhancedAutoCreateCustomer...');
                    customer = await window.enhancedAutoCreateCustomer(
                        customerData.customerName,
                        customerData.vendorNumber,
                        customerData.destination
                    );
                } else if (typeof window.autoCreateCustomer === 'function') {
                    console.log('🔄 Using autoCreateCustomer...');
                    customer = await window.autoCreateCustomer(
                        customerData.customerName,
                        customerData.vendorNumber,
                        customerData.destination
                    );
                } else {
                    console.log('🔄 Using direct customer creation...');
                    customer = await createCustomerDirectly(
                        customerData.customerName,
                        customerData.vendorNumber,
                        customerData.destination
                    );
                }
                
                if (customer) {
                    createdCustomers.push(customer);
                    console.log(`✅ Customer created: ${customer.contactPerson || customer.name}`);
                } else {
                    errors.push({
                        customerName: customerData.customerName,
                        error: 'Customer creation returned null'
                    });
                    console.error(`❌ Failed to create customer: ${customerData.customerName}`);
                }
                
                // Small delay to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                errors.push({
                    customerName: customerData.customerName,
                    error: error.message
                });
                console.error(`❌ Error creating customer ${customerData.customerName}:`, error);
            }
        }
        
        console.log(`✅ Customer creation completed: ${createdCustomers.length} successful, ${errors.length} errors`);
        
        // Show summary message
        if (typeof showToast === 'function') {
            if (errors.length === 0) {
                showToast(`Successfully created ${createdCustomers.length} customers from Excel!`, 'success');
            } else {
                showToast(`Created ${createdCustomers.length} customers, ${errors.length} failed. Check console for details.`, 'warning');
            }
        }
        
        // Force refresh customers display
        if (typeof window.supabaseOnlyLoadCustomers === 'function') {
            setTimeout(async () => {
                try {
                    await window.supabaseOnlyLoadCustomers();
                    console.log('✅ Customers display refreshed after Excel upload');
                } catch (error) {
                    console.error('❌ Error refreshing customers display:', error);
                }
            }, 2000);
        }
        
        return { createdCustomers, errors };
    }
    
    /**
     * Direct customer creation method
     */
    async function createCustomerDirectly(customerName, vendorNumber, destination) {
        console.log('🔄 Creating customer directly...');
        
        try {
            const customer = {
                id: 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                contactPerson: customerName,
                name: customerName,
                phone: vendorNumber,
                email: '',
                address: destination,
                vendorNumber: vendorNumber,
                vendor_number: vendorNumber,
                accountType: 'Individual',
                account_type: 'Individual',
                status: 'active',
                notes: 'Auto-created from Excel upload',
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
            
            // Save to Supabase if available
            if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                try {
                    console.log('🚀 Saving direct customer to Supabase...');
                    const savedCustomer = await window.dataService.saveCustomer(customer);
                    console.log('✅ Direct customer saved to Supabase');
                    
                    // Update local arrays
                    if (!window.customers) {
                        window.customers = [];
                    }
                    window.customers.push(savedCustomer);
                    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                    
                    return savedCustomer;
                } catch (supabaseError) {
                    console.error('❌ Supabase save failed for direct customer:', supabaseError);
                }
            }
            
            // Fallback to localStorage
            console.log('💾 Saving direct customer to localStorage...');
            if (!window.customers) {
                window.customers = [];
            }
            window.customers.push(customer);
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            return customer;
            
        } catch (error) {
            console.error('❌ Error in direct customer creation:', error);
            return null;
        }
    }
    
    /**
     * Hook into Excel processing functions
     */
    function hookIntoExcelProcessing() {
        console.log('🔄 Hooking into Excel processing functions...');
        
        // Hook into processDRFile function
        if (typeof window.processDRFile === 'function') {
            const originalProcessDRFile = window.processDRFile;
            
            window.processDRFile = function(file) {
                console.log('🔄 HOOKED processDRFile called with file:', file.name);
                
                // Call original function
                const result = originalProcessDRFile.call(this, file);
                
                // Hook into the file reading process
                setTimeout(() => {
                    console.log('🔄 Checking for Excel data after processing...');
                    
                    // Try to get the processed data from global variables
                    if (window.pendingDRBookings && Array.isArray(window.pendingDRBookings) && window.pendingDRBookings.length > 0) {
                        console.log('📊 Found pendingDRBookings data:', window.pendingDRBookings.length, 'records');
                        forceCustomerCreationFromExcel(window.pendingDRBookings);
                    } else {
                        console.warn('⚠️ No pendingDRBookings data found');
                    }
                }, 2000);
                
                return result;
            };
            
            console.log('✅ Hooked into processDRFile function');
        }
        
        // Hook into confirmDRUpload function
        if (typeof window.confirmDRUpload === 'function') {
            const originalConfirmDRUpload = window.confirmDRUpload;
            
            window.confirmDRUpload = async function(...args) {
                console.log('🔄 HOOKED confirmDRUpload called');
                
                // Force customer creation before confirming upload
                if (window.pendingDRBookings && Array.isArray(window.pendingDRBookings) && window.pendingDRBookings.length > 0) {
                    console.log('🔄 Force creating customers before confirming upload...');
                    await forceCustomerCreationFromExcel(window.pendingDRBookings);
                }
                
                // Call original function
                return await originalConfirmDRUpload.apply(this, args);
            };
            
            console.log('✅ Hooked into confirmDRUpload function');
        }
    }
    
    /**
     * Initialize the force Excel customer creation
     */
    function initForceExcelCustomerCreation() {
        console.log('🔧 Initializing force Excel customer creation...');
        
        // Wait for Excel processing functions to be available
        const checkFunctions = () => {
            const functionsAvailable = [
                typeof window.processDRFile === 'function',
                typeof window.confirmDRUpload === 'function'
            ];
            
            if (functionsAvailable.some(Boolean)) {
                console.log('✅ Excel processing functions found, hooking in...');
                hookIntoExcelProcessing();
                return true;
            } else {
                console.log('⏳ Waiting for Excel processing functions...');
                return false;
            }
        };
        
        // Try immediately
        if (!checkFunctions()) {
            // Retry every 500ms for up to 15 seconds
            let retries = 0;
            const maxRetries = 30;
            
            const retryInterval = setInterval(() => {
                retries++;
                
                if (checkFunctions()) {
                    clearInterval(retryInterval);
                } else if (retries >= maxRetries) {
                    console.error('❌ Timeout waiting for Excel processing functions');
                    clearInterval(retryInterval);
                }
            }, 500);
        }
    }
    
    // Add utility functions to window
    window.forceCustomerCreationFromExcel = forceCustomerCreationFromExcel;
    window.createCustomerDirectly = createCustomerDirectly;
    window.hookIntoExcelProcessing = hookIntoExcelProcessing;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForceExcelCustomerCreation);
    } else {
        // DOM is already ready
        setTimeout(initForceExcelCustomerCreation, 100);
    }
    
    console.log('✅ Force Excel Customer Creation loaded successfully');
    
})();

// Export for external access
window.forceExcelCustomerCreation = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};