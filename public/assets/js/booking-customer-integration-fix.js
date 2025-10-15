/**
 * BOOKING CUSTOMER INTEGRATION FIX
 * Ensures booking.js uses the enhanced customer functions for proper cross-browser sync
 * Fixes the issue where customers created from Excel uploads don't sync to other browsers
 */

console.log('🔧 Loading Booking Customer Integration Fix...');

(function() {
    'use strict';
    
    /**
     * Override the autoCreateCustomer function in booking.js with the enhanced version
     */
    function overrideBookingAutoCreateCustomer() {
        console.log('🔄 Overriding booking autoCreateCustomer function...');
        
        // Check if the enhanced function is available
        if (typeof window.enhancedAutoCreateCustomer !== 'function') {
            console.error('❌ Enhanced autoCreateCustomer function not available');
            return false;
        }
        
        // Store the original function as backup
        if (typeof window.autoCreateCustomer === 'function') {
            window.originalBookingAutoCreateCustomer = window.autoCreateCustomer;
            console.log('✅ Stored original booking autoCreateCustomer as backup');
        }
        
        // Override with enhanced version
        window.autoCreateCustomer = async function(customerName, vendorNumber, destination) {
            console.log('🔄 Using ENHANCED autoCreateCustomer from booking integration fix');
            console.log('📝 Input:', { customerName, vendorNumber, destination });
            
            try {
                // Use the enhanced auto-create customer function
                const result = await window.enhancedAutoCreateCustomer(customerName, vendorNumber, destination);
                
                if (result) {
                    console.log('✅ Enhanced autoCreateCustomer successful:', result.contactPerson || result.name);
                    
                    // Ensure the customer is also saved to Supabase
                    if (typeof window.dataService !== 'undefined' && window.dataService.saveCustomer) {
                        try {
                            console.log('🚀 Ensuring customer is saved to Supabase...');
                            await window.dataService.saveCustomer(result);
                            console.log('✅ Customer saved to Supabase successfully');
                        } catch (supabaseError) {
                            console.warn('⚠️ Supabase save failed, but localStorage save succeeded:', supabaseError);
                        }
                    }
                    
                    // Force refresh customer display
                    if (typeof window.loadCustomers === 'function') {
                        setTimeout(() => {
                            window.loadCustomers();
                        }, 500);
                    }
                    
                    return result;
                } else {
                    console.error('❌ Enhanced autoCreateCustomer returned null');
                    return null;
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced autoCreateCustomer:', error);
                
                // Fallback to original function if available
                if (typeof window.originalBookingAutoCreateCustomer === 'function') {
                    console.log('🔄 Falling back to original autoCreateCustomer...');
                    return await window.originalBookingAutoCreateCustomer(customerName, vendorNumber, destination);
                }
                
                throw error;
            }
        };
        
        console.log('✅ Successfully overrode booking autoCreateCustomer function');
        return true;
    }
    
    /**
     * Enhanced booking save function that ensures proper customer creation
     */
    function enhanceBookingSave() {
        console.log('🔄 Enhancing booking save functions...');
        
        // Override the saveBooking function if it exists
        if (typeof window.saveBooking === 'function') {
            const originalSaveBooking = window.saveBooking;
            
            window.saveBooking = async function(...args) {
                console.log('🔄 Using enhanced saveBooking with customer integration');
                
                try {
                    // Call the original save booking function
                    const result = await originalSaveBooking.apply(this, args);
                    
                    // Force refresh customers after booking save
                    if (typeof window.loadCustomers === 'function') {
                        setTimeout(() => {
                            console.log('🔄 Force refreshing customers after booking save...');
                            window.loadCustomers();
                        }, 1000);
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Error in enhanced saveBooking:', error);
                    throw error;
                }
            };
            
            console.log('✅ Enhanced saveBooking function');
        }
        
        // Override the confirmDrUpload function if it exists (for Excel uploads)
        if (typeof window.confirmDrUpload === 'function') {
            const originalConfirmDrUpload = window.confirmDrUpload;
            
            window.confirmDrUpload = async function(...args) {
                console.log('🔄 Using enhanced confirmDrUpload with customer integration');
                
                try {
                    // Call the original confirm DR upload function
                    const result = await originalConfirmDrUpload.apply(this, args);
                    
                    // Force refresh customers after DR upload
                    if (typeof window.loadCustomers === 'function') {
                        setTimeout(() => {
                            console.log('🔄 Force refreshing customers after DR upload...');
                            window.loadCustomers();
                        }, 1500);
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Error in enhanced confirmDrUpload:', error);
                    throw error;
                }
            };
            
            console.log('✅ Enhanced confirmDrUpload function');
        }
    }
    
    /**
     * Force customer sync function
     */
    async function forceCustomerSync() {
        console.log('🔄 Force syncing customers...');
        
        try {
            // Load customers using enhanced function
            if (typeof window.enhancedLoadCustomers === 'function') {
                await window.enhancedLoadCustomers();
                console.log('✅ Force customer sync completed');
            } else if (typeof window.loadCustomers === 'function') {
                await window.loadCustomers();
                console.log('✅ Force customer sync completed (fallback)');
            } else {
                console.warn('⚠️ No customer loading function available');
            }
        } catch (error) {
            console.error('❌ Error in force customer sync:', error);
        }
    }
    
    /**
     * Initialize the booking customer integration fix
     */
    function initBookingCustomerIntegrationFix() {
        console.log('🔧 Initializing booking customer integration fix...');
        
        // Wait for enhanced customer functions to be available
        const checkEnhancedFunctions = () => {
            if (typeof window.enhancedAutoCreateCustomer === 'function') {
                console.log('✅ Enhanced customer functions available, applying overrides...');
                
                // Override the booking functions
                overrideBookingAutoCreateCustomer();
                enhanceBookingSave();
                
                // Add event listeners for customer sync
                document.addEventListener('bookingCompleted', forceCustomerSync);
                document.addEventListener('drUploadCompleted', forceCustomerSync);
                
                console.log('✅ Booking customer integration fix initialized successfully');
                return true;
            } else {
                console.log('⏳ Waiting for enhanced customer functions...');
                return false;
            }
        };
        
        // Try immediately
        if (!checkEnhancedFunctions()) {
            // If not available, retry every 500ms for up to 10 seconds
            let retries = 0;
            const maxRetries = 20;
            
            const retryInterval = setInterval(() => {
                retries++;
                
                if (checkEnhancedFunctions()) {
                    clearInterval(retryInterval);
                } else if (retries >= maxRetries) {
                    console.error('❌ Timeout waiting for enhanced customer functions');
                    clearInterval(retryInterval);
                }
            }, 500);
        }
    }
    
    /**
     * Debug function to check customer sync status
     */
    function debugCustomerSync() {
        console.log('🔍 CUSTOMER SYNC DEBUG INFO:');
        console.log('Window.customers length:', window.customers ? window.customers.length : 'undefined');
        console.log('LocalStorage customers:', localStorage.getItem('mci-customers') ? JSON.parse(localStorage.getItem('mci-customers')).length : 'none');
        console.log('Enhanced functions available:', {
            enhancedAutoCreateCustomer: typeof window.enhancedAutoCreateCustomer === 'function',
            enhancedLoadCustomers: typeof window.enhancedLoadCustomers === 'function',
            enhancedSaveCustomer: typeof window.enhancedSaveCustomer === 'function'
        });
        console.log('DataService available:', typeof window.dataService !== 'undefined');
        console.log('Supabase client available:', typeof window.supabaseClient === 'function');
        
        // Check if customers exist in localStorage
        try {
            const localCustomers = localStorage.getItem('mci-customers');
            if (localCustomers) {
                const customers = JSON.parse(localCustomers);
                console.log('LocalStorage customers details:', customers.map(c => ({
                    id: c.id,
                    name: c.contactPerson || c.name,
                    phone: c.phone,
                    notes: c.notes
                })));
            }
        } catch (error) {
            console.error('Error reading localStorage customers:', error);
        }
    }
    
    // Add utility functions to window
    window.forceCustomerSync = forceCustomerSync;
    window.debugCustomerSync = debugCustomerSync;
    window.overrideBookingAutoCreateCustomer = overrideBookingAutoCreateCustomer;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBookingCustomerIntegrationFix);
    } else {
        // DOM is already ready
        setTimeout(initBookingCustomerIntegrationFix, 100);
    }
    
    console.log('✅ Booking Customer Integration Fix loaded successfully');
    
})();

// Export for external access
window.bookingCustomerIntegrationFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};