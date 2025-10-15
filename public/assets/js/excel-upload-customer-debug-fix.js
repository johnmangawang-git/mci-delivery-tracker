/**
 * EXCEL UPLOAD CUSTOMER DEBUG FIX
 * Ensures customer creation works properly during Excel upload process
 * Adds comprehensive logging and fallback mechanisms
 */

console.log('🔧 Loading Excel Upload Customer Debug Fix...');

(function() {
    'use strict';
    
    /**
     * Debug the Excel upload customer creation process
     */
    function debugExcelCustomerCreation() {
        console.log('🔍 DEBUGGING Excel customer creation process...');
        
        // Check if autoCreateCustomer function exists
        console.log('autoCreateCustomer function available:', typeof window.autoCreateCustomer === 'function');
        console.log('enhancedAutoCreateCustomer function available:', typeof window.enhancedAutoCreateCustomer === 'function');
        console.log('dataService available:', typeof window.dataService !== 'undefined');
        console.log('supabaseClient available:', typeof window.supabaseClient === 'function');
        
        // Check current customers
        console.log('Current window.customers length:', window.customers ? window.customers.length : 'undefined');
        
        // Check localStorage
        try {
            const localCustomers = localStorage.getItem('mci-customers');
            console.log('localStorage customers length:', localCustomers ? JSON.parse(localCustomers).length : 'none');
        } catch (error) {
            console.log('Error reading localStorage customers:', error);
        }
    }
    
    /**
     * Enhanced createBookingFromDR function with better customer creation
     */
    function enhancedCreateBookingFromDR(originalFunction) {
        return async function(bookingData) {
            console.log('🔄 ENHANCED createBookingFromDR called for:', bookingData.drNumber);
            console.log('📝 Customer data:', {
                customerName: bookingData.customerName,
                vendorNumber: bookingData.vendorNumber,
                destination: bookingData.destination
            });
            
            try {
                // Call the original function first
                await originalFunction.call(this, bookingData);
                console.log('✅ Original createBookingFromDR completed');
                
                // Now ensure customer creation happens
                if (bookingData.customerName && bookingData.vendorNumber) {
                    console.log('🔄 Ensuring customer creation...');
                    
                    let customerCreated = false;
                    
                    // Try enhanced auto-create customer first
                    if (typeof window.enhancedAutoCreateCustomer === 'function') {
                        try {
                            console.log('🔄 Using enhancedAutoCreateCustomer...');
                            const customer = await window.enhancedAutoCreateCustomer(
                                bookingData.customerName,
                                bookingData.vendorNumber,
                                bookingData.destination
                            );
                            
                            if (customer) {
                                console.log('✅ Enhanced customer creation successful:', customer.contactPerson || customer.name);
                                customerCreated = true;
                            } else {
                                console.warn('⚠️ Enhanced customer creation returned null');
                            }
                        } catch (error) {
                            console.error('❌ Enhanced customer creation failed:', error);
                        }
                    }
                    
                    // Fallback to regular autoCreateCustomer
                    if (!customerCreated && typeof window.autoCreateCustomer === 'function') {
                        try {
                            console.log('🔄 Using fallback autoCreateCustomer...');
                            const customer = await window.autoCreateCustomer(
                                bookingData.customerName,
                                bookingData.vendorNumber,
                                bookingData.destination
                            );
                            
                            if (customer) {
                                console.log('✅ Fallback customer creation successful:', customer.contactPerson || customer.name);
                                customerCreated = true;
                            } else {
                                console.warn('⚠️ Fallback customer creation returned null');
                            }
                        } catch (error) {
                            console.error('❌ Fallback customer creation failed:', error);
                        }
                    }
                    
                    // Manual customer creation as last resort
                    if (!customerCreated) {
                        console.log('🔄 Using manual customer creation as last resort...');
                        try {
                            const manualCustomer = await createCustomerManually(
                                bookingData.customerName,
                                bookingData.vendorNumber,
                                bookingData.destination
                            );
                            
                            if (manualCustomer) {
                                console.log('✅ Manual customer creation successful:', manualCustomer.contactPerson || manualCustomer.name);
                                customerCreated = true;
                            }
                        } catch (error) {
                            console.error('❌ Manual customer creation failed:', error);
                        }
                    }
                    
                    if (customerCreated) {
                        console.log('✅ Customer creation completed for Excel upload');
                        
                        // Force refresh customers
                        if (typeof window.supabaseOnlyLoadCustomers === 'function') {
                            setTimeout(async () => {
                                try {
                                    await window.supabaseOnlyLoadCustomers();
                                    console.log('✅ Customers refreshed after Excel upload');
                                } catch (error) {
                                    console.error('❌ Error refreshing customers:', error);
                                }
                            }, 1000);
                        }
                        
                        // Show success message
                        if (typeof showToast === 'function') {
                            showToast(`Customer "${bookingData.customerName}" added to Customer Management!`, 'success');
                        }
                    } else {
                        console.error('❌ All customer creation methods failed');
                        
                        // Show warning message
                        if (typeof showToast === 'function') {
                            showToast(`Warning: Could not add customer "${bookingData.customerName}" to Customer Management`, 'warning');
                        }
                    }
                } else {
                    console.warn('⚠️ Missing customer data for creation:', {
                        customerName: bookingData.customerName,
                        vendorNumber: bookingData.vendorNumber
                    });
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced createBookingFromDR:', error);
                throw error;
            }
        };
    }
    
    /**
     * Manual customer creation as fallback
     */
    async function createCustomerManually(customerName, vendorNumber, destination) {
        console.log('🔄 Creating customer manually...');
        
        try {
            const customer = {
                id: 'CUST-' + Date.now(),
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
                    console.log('🚀 Saving manual customer to Supabase...');
                    const savedCustomer = await window.dataService.saveCustomer(customer);
                    console.log('✅ Manual customer saved to Supabase');
                    
                    // Update local arrays
                    if (!window.customers) {
                        window.customers = [];
                    }
                    window.customers.push(savedCustomer);
                    localStorage.setItem('mci-customers', JSON.stringify(window.customers));
                    
                    return savedCustomer;
                } catch (supabaseError) {
                    console.error('❌ Supabase save failed for manual customer:', supabaseError);
                }
            }
            
            // Fallback to localStorage
            console.log('💾 Saving manual customer to localStorage...');
            if (!window.customers) {
                window.customers = [];
            }
            window.customers.push(customer);
            localStorage.setItem('mci-customers', JSON.stringify(window.customers));
            
            return customer;
            
        } catch (error) {
            console.error('❌ Error in manual customer creation:', error);
            return null;
        }
    }
    
    /**
     * Override the createBookingFromDR function
     */
    function overrideCreateBookingFromDR() {
        console.log('🔄 Overriding createBookingFromDR function...');
        
        if (typeof window.createBookingFromDR === 'function') {
            const originalCreateBookingFromDR = window.createBookingFromDR;
            window.originalCreateBookingFromDR = originalCreateBookingFromDR;
            
            window.createBookingFromDR = enhancedCreateBookingFromDR(originalCreateBookingFromDR);
            console.log('✅ createBookingFromDR function overridden with enhanced version');
            return true;
        } else {
            console.error('❌ createBookingFromDR function not found');
            return false;
        }
    }
    
    /**
     * Initialize the Excel upload customer debug fix
     */
    function initExcelUploadCustomerDebugFix() {
        console.log('🔧 Initializing Excel upload customer debug fix...');
        
        // Debug current state
        debugExcelCustomerCreation();
        
        // Wait for functions to be available
        const checkFunctions = () => {
            if (typeof window.createBookingFromDR === 'function') {
                console.log('✅ createBookingFromDR function found, applying override...');
                overrideCreateBookingFromDR();
                return true;
            } else {
                console.log('⏳ Waiting for createBookingFromDR function...');
                return false;
            }
        };
        
        // Try immediately
        if (!checkFunctions()) {
            // Retry every 500ms for up to 10 seconds
            let retries = 0;
            const maxRetries = 20;
            
            const retryInterval = setInterval(() => {
                retries++;
                
                if (checkFunctions()) {
                    clearInterval(retryInterval);
                } else if (retries >= maxRetries) {
                    console.error('❌ Timeout waiting for createBookingFromDR function');
                    clearInterval(retryInterval);
                }
            }, 500);
        }
    }
    
    // Add utility functions to window
    window.debugExcelCustomerCreation = debugExcelCustomerCreation;
    window.createCustomerManually = createCustomerManually;
    window.overrideCreateBookingFromDR = overrideCreateBookingFromDR;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExcelUploadCustomerDebugFix);
    } else {
        // DOM is already ready
        setTimeout(initExcelUploadCustomerDebugFix, 100);
    }
    
    console.log('✅ Excel Upload Customer Debug Fix loaded successfully');
    
})();

// Export for external access
window.excelUploadCustomerDebugFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};