/**
 * MULTI-ITEM DR UPLOAD FIX
 * Fixes issue where only the last record from Excel upload appears in Active Deliveries
 * Ensures all 4 items are properly saved and displayed
 */

console.log('🔧 Loading Multi-Item DR Upload Fix...');

(function() {
    'use strict';
    
    /**
     * Enhanced createBookingFromDR that ensures all items are saved
     */
    function enhancedCreateBookingFromDR(bookingData) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`🔧 Enhanced createBookingFromDR for: ${bookingData.drNumber}`);
                console.log(`📊 Current activeDeliveries count BEFORE: ${window.activeDeliveries ? window.activeDeliveries.length : 0}`);
                
                // Ensure activeDeliveries array exists
                if (!window.activeDeliveries) {
                    window.activeDeliveries = [];
                    console.log('✅ Initialized activeDeliveries array');
                }
                
                // Create unique ID to prevent overwrites
                const uniqueId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + bookingData.drNumber;
                
                // Create normalized delivery object
                const normalizedDelivery = {
                    id: uniqueId,
                    drNumber: bookingData.drNumber,
                    dr_number: bookingData.drNumber,
                    customerName: bookingData.customerName,
                    customer_name: bookingData.customerName,
                    vendorNumber: bookingData.vendorNumber || '',
                    vendor_number: bookingData.vendorNumber || '',
                    origin: bookingData.origin || '',
                    destination: bookingData.destination || '',
                    truckType: bookingData.truckType || '',
                    truck_type: bookingData.truckType || '',
                    truckPlateNumber: bookingData.truckPlateNumber || '',
                    truck_plate_number: bookingData.truckPlateNumber || '',
                    status: 'Active',
                    deliveryDate: bookingData.deliveryDate || bookingData.bookedDate,
                    delivery_date: bookingData.deliveryDate || bookingData.bookedDate,
                    bookedDate: bookingData.bookedDate || bookingData.deliveryDate,
                    booked_date: bookingData.bookedDate || bookingData.deliveryDate,
                    additionalCosts: parseFloat(bookingData.additionalCosts) || 0,
                    additional_costs: parseFloat(bookingData.additionalCosts) || 0,
                    itemNumber: bookingData.itemNumber || '',
                    item_number: bookingData.itemNumber || '',
                    mobileNumber: bookingData.mobileNumber || '',
                    mobile_number: bookingData.mobileNumber || '',
                    itemDescription: bookingData.itemDescription || '',
                    item_description: bookingData.itemDescription || '',
                    serialNumber: bookingData.serialNumber || '',
                    serial_number: bookingData.serialNumber || '',
                    timestamp: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: 'Excel Upload'
                };
                
                console.log(`📝 Created normalized delivery:`, normalizedDelivery);
                
                // Add to activeDeliveries array IMMEDIATELY
                window.activeDeliveries.push(normalizedDelivery);
                console.log(`📊 Added to activeDeliveries. New count: ${window.activeDeliveries.length}`);
                
                // Save to localStorage IMMEDIATELY
                try {
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                    console.log(`💾 Saved to localStorage. Total items: ${window.activeDeliveries.length}`);
                } catch (storageError) {
                    console.error('❌ Error saving to localStorage:', storageError);
                }
                
                // Try to save to Supabase (but don't let it fail the whole process)
                try {
                    if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
                        const supabaseResult = await window.dataService.saveDelivery(normalizedDelivery);
                        console.log(`✅ Saved to Supabase: ${bookingData.drNumber}`, supabaseResult);
                    } else {
                        console.log('⚠️ Supabase dataService not available, using localStorage only');
                    }
                } catch (supabaseError) {
                    console.error(`❌ Supabase save failed for ${bookingData.drNumber}:`, supabaseError);
                    // Don't fail the whole process - localStorage save already succeeded
                }
                
                // AUTO-CREATE CUSTOMER: Extract and save customer data
                if (normalizedDelivery.customerName && normalizedDelivery.customerName !== 'Unknown Customer') {
                    try {
                        const customerName = normalizedDelivery.customerName;
                        const vendorNumber = normalizedDelivery.vendorNumber || '';
                        const destination = normalizedDelivery.destination || '';
                        
                        // Call auto-create customer function if available
                        if (typeof window.autoCreateCustomer === 'function') {
                            await window.autoCreateCustomer(customerName, vendorNumber, destination);
                            console.log('✅ MULTI-ITEM: Auto-created customer:', customerName);
                        } else if (typeof autoCreateCustomer === 'function') {
                            await autoCreateCustomer(customerName, vendorNumber, destination);
                            console.log('✅ MULTI-ITEM: Auto-created customer:', customerName);
                        } else {
                            console.warn('⚠️ MULTI-ITEM: autoCreateCustomer function not available');
                        }
                    } catch (customerError) {
                        console.error('❌ MULTI-ITEM: Error auto-creating customer:', normalizedDelivery.customerName, customerError);
                        // Don't fail the whole process if customer creation fails
                    }
                }
                
                console.log(`✅ Successfully processed: ${bookingData.drNumber}`);
                resolve(normalizedDelivery);
                
            } catch (error) {
                console.error(`❌ Error in enhancedCreateBookingFromDR for ${bookingData.drNumber}:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * Enhanced processInlineBookings that processes items sequentially
     */
    function enhancedProcessInlineBookings(bookings) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`🚀 Enhanced processInlineBookings starting with ${bookings.length} items`);
                console.log(`📊 Initial activeDeliveries count: ${window.activeDeliveries ? window.activeDeliveries.length : 0}`);
                
                const createdBookings = [];
                
                // Process bookings SEQUENTIALLY to avoid race conditions
                for (let i = 0; i < bookings.length; i++) {
                    const booking = bookings[i];
                    console.log(`🔄 Processing booking ${i + 1}/${bookings.length}: ${booking.drNumber}`);
                    
                    try {
                        const result = await enhancedCreateBookingFromDR(booking);
                        createdBookings.push(result);
                        console.log(`✅ Successfully processed ${i + 1}/${bookings.length}: ${booking.drNumber}`);
                        
                        // Small delay to ensure proper processing
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        console.error(`❌ Failed to process booking ${i + 1}: ${booking.drNumber}`, error);
                        // Continue with other bookings even if one fails
                    }
                }
                
                console.log(`🎉 Enhanced processInlineBookings completed!`);
                console.log(`📊 Final activeDeliveries count: ${window.activeDeliveries ? window.activeDeliveries.length : 0}`);
                console.log(`✅ Successfully created: ${createdBookings.length} bookings`);
                
                // Force refresh Active Deliveries view
                setTimeout(() => {
                    if (typeof window.loadActiveDeliveries === 'function') {
                        console.log('🔄 Refreshing Active Deliveries view...');
                        window.loadActiveDeliveries();
                    }
                }, 500);
                
                resolve(createdBookings);
                
            } catch (error) {
                console.error('❌ Error in enhancedProcessInlineBookings:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Override the original functions with enhanced versions
     */
    function overrideUploadFunctions() {
        // Store original functions
        if (typeof window.originalCreateBookingFromDR === 'undefined' && typeof window.createBookingFromDR === 'function') {
            window.originalCreateBookingFromDR = window.createBookingFromDR;
        }
        
        if (typeof window.originalProcessInlineBookings === 'undefined' && typeof window.processInlineBookings === 'function') {
            window.originalProcessInlineBookings = window.processInlineBookings;
        }
        
        // Override with enhanced versions
        window.createBookingFromDR = enhancedCreateBookingFromDR;
        window.processInlineBookings = enhancedProcessInlineBookings;
        
        console.log('✅ Upload functions overridden with enhanced versions');
    }
    
    /**
     * Diagnostic function to check activeDeliveries state
     */
    function diagnoseActiveDeliveries() {
        console.log('🔍 DIAGNOSTIC: Active Deliveries State');
        console.log('window.activeDeliveries exists:', typeof window.activeDeliveries !== 'undefined');
        console.log('window.activeDeliveries length:', window.activeDeliveries ? window.activeDeliveries.length : 0);
        
        if (window.activeDeliveries && window.activeDeliveries.length > 0) {
            console.log('Sample items:');
            window.activeDeliveries.slice(0, 3).forEach((item, index) => {
                console.log(`  [${index}]: ${item.drNumber || item.dr_number} - ${item.customerName || item.customer_name}`);
            });
        }
        
        // Check localStorage
        try {
            const stored = localStorage.getItem('mci-active-deliveries');
            if (stored) {
                const parsed = JSON.parse(stored);
                console.log('localStorage mci-active-deliveries length:', parsed.length);
            } else {
                console.log('No mci-active-deliveries in localStorage');
            }
        } catch (error) {
            console.error('Error reading localStorage:', error);
        }
    }
    
    /**
     * Initialize the multi-item DR upload fix
     */
    function initMultiItemDRUploadFix() {
        console.log('🚀 Initializing Multi-Item DR Upload Fix...');
        
        // Override upload functions
        overrideUploadFunctions();
        
        // Set up periodic diagnostics
        setInterval(() => {
            // Re-override functions to ensure they're not replaced
            overrideUploadFunctions();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Multi-Item DR Upload Fix initialized');
        console.log('🔧 All 4 items should now be saved to Active Deliveries');
    }
    
    // Export functions globally
    window.enhancedCreateBookingFromDR = enhancedCreateBookingFromDR;
    window.enhancedProcessInlineBookings = enhancedProcessInlineBookings;
    window.diagnoseActiveDeliveries = diagnoseActiveDeliveries;
    window.initMultiItemDRUploadFix = initMultiItemDRUploadFix;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMultiItemDRUploadFix);
    } else {
        initMultiItemDRUploadFix();
    }
    
    console.log('✅ Multi-Item DR Upload Fix loaded successfully');
    
})();

// Export module info
window.multiItemDRUploadFix = {
    version: '1.0.0',
    loaded: true,
    description: 'Fixes issue where only last record appears in Active Deliveries',
    timestamp: new Date().toISOString()
};