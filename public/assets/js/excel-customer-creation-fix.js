/**
 * EXCEL CUSTOMER CREATION FIX
 * Ensures Excel uploads properly create customers and save them to Supabase
 * Works with the Supabase-only customer fix to maintain data consistency
 */

console.log('🔧 Loading Excel Customer Creation Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced Excel customer creation that ensures Supabase saving
     */
    async function enhancedExcelCustomerCreation(customerName, vendorNumber, destination) {
        console.log('📊 ENHANCED Excel customer creation starting...');
        console.log('📝 Input:', { customerName, vendorNumber, destination });
        
        try {
            // Validate input
            if (!customerName || !vendorNumber || !destination) {
                console.error('❌ Missing required customer data');
                return null;
            }
            
            // Use the enhanced auto-create customer function if available
            let customer = null;
            
            if (typeof window.enhancedAutoCreateCustomer === 'function') {
                console.log('🔄 Using enhancedAutoCreateCustomer...');
                customer = await window.enhancedAutoCreateCustomer(customerName, vendorNumber, destination);
            } else if (typeof window.autoCreateCustomer === 'function') {
                console.log('🔄 Using standard autoCreateCustomer...');
                customer = await window.autoCreateCustomer(customerName, vendorNumber, destination);
            } else {
                console.error('❌ No autoCreateCustomer function available');
                return null;
            }
            
            if (!customer) {
                console.error('❌ Customer creation returned null');
                return null;
            }
            
            console.log('✅ Customer created:', customer.contactPerson || customer.name);
            
            // Ensure customer is saved to Supabase
            if (window.dataService && typeof window.dataService.saveCustomer === 'function') {
                try {
                    console.log('🚀 Ensuring customer is saved to Supabase...');
                    const savedCustomer = await window.dataService.saveCustomer(customer);
                    console.log('✅ Customer saved to Supabase successfully');
                    
                    // Update the customer object with any changes from Supabase
                    if (savedCustomer) {
                        customer = savedCustomer;
                    }
                } catch (supabaseError) {
                    console.warn('⚠️ Supabase save failed, but customer exists locally:', supabaseError);
                }
            } else {
                console.warn('⚠️ DataService not available, customer may only exist locally');
            }
            
            // Force refresh customer display
            if (typeof window.supabaseOnlyLoadCustomers === 'function') {
                console.log('🔄 Refreshing customer display...');
                setTimeout(async () => {
                    try {
                        await window.supabaseOnlyLoadCustomers();
                        console.log('✅ Customer display refreshed');
                    } catch (error) {
                        console.error('❌ Error refreshing customer display:', error);
                    }
                }, 1000);
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast(`Customer "${customerName}" added to Customer Management!`, 'success');
            }
            
            return customer;
            
        } catch (error) {
            console.error('❌ Error in enhanced Excel customer creation:', error);
            
            // Show error message
            if (typeof showToast === 'function') {
                showToast(`Error creating customer "${customerName}". Please try again.`, 'error');
            }
            
            return null;
        }
    }
    
    /**
     * Batch Excel customer creation for multiple customers
     */
    async function batchExcelCustomerCreation(customerDataArray) {
        console.log('📊 BATCH Excel customer creation starting...');
        console.log(`📝 Processing ${customerDataArray.length} customers`);
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < customerDataArray.length; i++) {
            const customerData = customerDataArray[i];
            console.log(`📝 Processing customer ${i + 1}/${customerDataArray.length}: ${customerData.customerName}`);
            
            try {
                const customer = await enhancedExcelCustomerCreation(
                    customerData.customerName,
                    customerData.vendorNumber,
                    customerData.destination
                );
                
                if (customer) {
                    results.push({
                        index: i,
                        customerName: customerData.customerName,
                        status: 'success',
                        customer: customer
                    });
                } else {
                    errors.push({
                        index: i,
                        customerName: customerData.customerName,
                        status: 'failed',
                        error: 'Customer creation returned null'
                    });
                }
            } catch (error) {
                errors.push({
                    index: i,
                    customerName: customerData.customerName,
                    status: 'error',
                    error: error.message
                });
            }
            
            // Small delay to prevent overwhelming the system
            if (i < customerDataArray.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`✅ Batch processing completed: ${results.length} successful, ${errors.length} errors`);
        
        // Show summary message
        if (typeof showToast === 'function') {
            if (errors.length === 0) {
                showToast(`Successfully created ${results.length} customers!`, 'success');
            } else {
                showToast(`Created ${results.length} customers, ${errors.length} failed. Check console for details.`, 'warning');
            }
        }
        
        // Log errors
        if (errors.length > 0) {
            console.warn('❌ Batch processing errors:', errors);
        }
        
        return { results, errors };
    }
    
    /**
     * Verify customer was saved to Supabase
     */
    async function verifyCustomerInSupabase(customerPhone) {
        console.log('🔍 Verifying customer in Supabase:', customerPhone);
        
        try {
            if (window.dataService && typeof window.dataService.getCustomers === 'function') {
                const customers = await window.dataService.getCustomers();
                const found = customers.find(c => c.phone === customerPhone);
                
                if (found) {
                    console.log('✅ Customer verified in Supabase:', found.name || found.contactPerson);
                    return found;
                } else {
                    console.warn('⚠️ Customer NOT found in Supabase');
                    return null;
                }
            } else {
                console.warn('⚠️ Cannot verify - DataService not available');
                return null;
            }
        } catch (error) {
            console.error('❌ Error verifying customer in Supabase:', error);
            return null;
        }
    }
    
    /**
     * Override the booking functions to use enhanced Excel customer creation
     */
    function enhanceBookingForExcelCustomers() {
        console.log('🔄 Enhancing booking functions for Excel customer creation...');
        
        // Store original autoCreateCustomer if it exists
        if (typeof window.autoCreateCustomer === 'function' && !window.originalAutoCreateCustomerForExcel) {
            window.originalAutoCreateCustomerForExcel = window.autoCreateCustomer;
            console.log('✅ Stored original autoCreateCustomer for Excel');
        }
        
        // Override with enhanced version
        window.autoCreateCustomer = enhancedExcelCustomerCreation;
        console.log('✅ Overrode autoCreateCustomer with enhanced Excel version');
        
        // Also override any batch processing functions if they exist
        if (typeof window.batchCreateCustomers === 'function') {
            window.originalBatchCreateCustomers = window.batchCreateCustomers;
        }
        window.batchCreateCustomers = batchExcelCustomerCreation;
        
        console.log('✅ Enhanced booking functions for Excel customer creation');
    }
    
    /**
     * Initialize the Excel customer creation fix
     */
    function initExcelCustomerCreationFix() {
        console.log('🔧 Initializing Excel customer creation fix...');
        
        // Wait for required functions to be available
        const checkRequiredFunctions = () => {
            const required = [
                typeof window.dataService !== 'undefined',
                typeof window.enhancedAutoCreateCustomer === 'function' || typeof window.autoCreateCustomer === 'function'
            ];
            
            if (required.every(Boolean)) {
                console.log('✅ Required functions available, enhancing booking...');
                enhanceBookingForExcelCustomers();
                return true;
            } else {
                console.log('⏳ Waiting for required functions...');
                return false;
            }
        };
        
        // Try immediately
        if (!checkRequiredFunctions()) {
            // If not available, retry every 500ms for up to 10 seconds
            let retries = 0;
            const maxRetries = 20;
            
            const retryInterval = setInterval(() => {
                retries++;
                
                if (checkRequiredFunctions()) {
                    clearInterval(retryInterval);
                } else if (retries >= maxRetries) {
                    console.error('❌ Timeout waiting for required functions for Excel customer creation');
                    clearInterval(retryInterval);
                }
            }, 500);
        }
    }
    
    // Add utility functions to window
    window.enhancedExcelCustomerCreation = enhancedExcelCustomerCreation;
    window.batchExcelCustomerCreation = batchExcelCustomerCreation;
    window.verifyCustomerInSupabase = verifyCustomerInSupabase;
    window.enhanceBookingForExcelCustomers = enhanceBookingForExcelCustomers;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExcelCustomerCreationFix);
    } else {
        // DOM is already ready
        setTimeout(initExcelCustomerCreationFix, 100);
    }
    
    console.log('✅ Excel Customer Creation Fix loaded successfully');
    
})();

// Export for external access
window.excelCustomerCreationFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};