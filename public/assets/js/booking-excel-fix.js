/**
 * BOOKING & EXCEL UPLOAD FIX
 * Ensures both manual booking and Excel upload work with Supabase
 */

console.log('🔧 BOOKING & EXCEL FIX: Loading...');

// =============================================================================
// ENHANCED: Cost categorization function for analytics
// =============================================================================

function categorizeCostDescription(description) {
    if (!description || typeof description !== 'string') {
        return 'Other';
    }

    const desc = description.toLowerCase().trim();

    // Fuel-related keywords
    if (desc.includes('gas') || desc.includes('fuel') ||
        desc.includes('gasoline') || desc.includes('petrol') ||
        desc.includes('diesel') || desc.includes('gasolina')) {
        return 'Fuel Surcharge';
    }

    // Toll-related keywords
    if (desc.includes('toll') || desc.includes('highway') ||
        desc.includes('expressway') || desc.includes('bridge') ||
        desc.includes('skyway') || desc.includes('slex') ||
        desc.includes('nlex') || desc.includes('cavitex')) {
        return 'Toll Fees';
    }

    // Helper/Labor-related keywords
    if (desc.includes('helper') || desc.includes('urgent') ||
        desc.includes('assist') || desc.includes('labor') ||
        desc.includes('manpower') || desc.includes('overtime') ||
        desc.includes('rush') || desc.includes('kasama')) {
        return 'Helper';
    }

    // Special handling keywords
    if (desc.includes('special') || desc.includes('handling') ||
        desc.includes('fragile') || desc.includes('careful') ||
        desc.includes('delicate') || desc.includes('premium')) {
        return 'Special Handling';
    }

    return 'Other';
}

// =============================================================================
// 1. ENSURE CONFIRM BOOKING BUTTON WORKS
// =============================================================================

function setupConfirmBookingButton() {
    console.log('🔧 Setting up confirm booking button...');

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (!confirmBtn) {
        console.log('⚠️ Confirm booking button not found');
        return;
    }

    // Remove existing listeners by cloning
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    // Add our definitive event listener
    newBtn.addEventListener('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('🔘 Confirm booking clicked - using definitive save');

        try {
            // Use our definitive booking save function
            if (typeof window.definitiveBookingSave === 'function') {
                await window.definitiveBookingSave();
            } else if (typeof window.saveBooking === 'function') {
                await window.saveBooking();
            } else {
                console.error('❌ No saveBooking function available');
                alert('Booking function not available. Please refresh the page.');
            }
        } catch (error) {
            console.error('❌ Booking save failed:', error);
            alert('Failed to save booking: ' + error.message);
        }
    });

    console.log('✅ Confirm booking button set up with definitive handler');
}

// =============================================================================
// 2. ENSURE EXCEL UPLOAD WORKS WITH SUPABASE
// =============================================================================

// Override the createBookingFromDR function to ensure Supabase saves
const originalCreateBookingFromDR = window.createBookingFromDR;

window.createBookingFromDR = async function (bookingData) {
    console.log('🎯 ENHANCED createBookingFromDR:', bookingData.drNumber);
    
    // NOTE: Cost assignment logic is handled in confirmDRUpload() function in booking.js
    // This function processes individual bookings that already have costs assigned (Option C: first DR only)

    try {
        // Ensure we have a definitive data service
        if (!window.dataService && window.DefinitiveDataService) {
            window.dataService = new window.DefinitiveDataService();
            console.log('✅ Created DefinitiveDataService for Excel upload');
        }

        // ENHANCED: Capture individual cost items from DR upload modal
        const additionalCostItems = [];
        let totalAdditionalCosts = 0;

        // Collect individual cost items from DR modal (dr-cost-description + dr-cost-amount)
        try {
            const costDescriptions = document.querySelectorAll('.dr-cost-description');
            const costAmounts = document.querySelectorAll('.dr-cost-amount');

            console.log('📊 Collecting cost items from DR modal...', {
                descriptions: costDescriptions.length,
                amounts: costAmounts.length
            });

            for (let i = 0; i < Math.min(costDescriptions.length, costAmounts.length); i++) {
                const description = costDescriptions[i].value?.trim();
                const amount = parseFloat(costAmounts[i].value) || 0;

                if (description && amount > 0) {
                    additionalCostItems.push({
                        description: description,
                        amount: amount,
                        category: categorizeCostDescription(description) // Auto-categorize for analytics
                    });
                    totalAdditionalCosts += amount;
                    console.log(`✅ Added cost item: ${description} = ₱${amount}`);
                }
            }

            console.log('📊 Total cost items collected:', additionalCostItems.length, 'Total amount:', totalAdditionalCosts);
        } catch (error) {
            console.warn('⚠️ Could not collect cost items from modal:', error.message);
            // Fallback to original method
            totalAdditionalCosts = parseFloat(bookingData.additionalCosts) || 0.00;
        }

        // Create delivery object with proper Supabase field mapping
        const delivery = {
            dr_number: bookingData.drNumber,
            customer_name: bookingData.customerName,
            vendor_number: bookingData.vendorNumber || '',
            origin: bookingData.origin || '',
            destination: bookingData.destination || '',
            truck_type: bookingData.truckType || '',
            truck_plate_number: bookingData.truckPlateNumber || '',
            status: 'Active',
            created_date: bookingData.bookedDate || new Date().toISOString().split('T')[0],
            created_by: 'Excel Upload',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // ORIGINAL: additional_costs: parseFloat(bookingData.additionalCosts) || 0.00
            additional_costs: totalAdditionalCosts, // ENHANCED: Use calculated total from individual items
            additional_cost_items: additionalCostItems // ENHANCED: Store individual cost items for analytics
        };

        console.log('📦 Prepared delivery for Supabase:', delivery);

        // Save to Supabase with retry logic
        let saveSuccess = false;
        let retryCount = 0;

        while (!saveSuccess && retryCount < 3) {
            try {
                retryCount++;
                console.log(`💾 Supabase save attempt ${retryCount}/3 for ${delivery.dr_number}`);

                if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
                    const result = await window.dataService.saveDelivery(delivery);
                    console.log('✅ Excel booking saved to Supabase:', result);
                    saveSuccess = true;
                } else {
                    throw new Error('DataService not available');
                }

            } catch (error) {
                console.error(`❌ Save attempt ${retryCount} failed:`, error);

                if (retryCount >= 3) {
                    console.log('💾 Falling back to localStorage for', delivery.dr_number);

                    // Fallback to localStorage
                    window.activeDeliveries = window.activeDeliveries || [];

                    const localDelivery = {
                        id: `DEL-${Date.now()}-${delivery.dr_number}`,
                        drNumber: delivery.dr_number,
                        customerName: delivery.customer_name,
                        vendorNumber: delivery.vendor_number,
                        origin: delivery.origin,
                        destination: delivery.destination,
                        truckType: delivery.truck_type,
                        truckPlateNumber: delivery.truck_plate_number,
                        status: delivery.status,
                        deliveryDate: delivery.created_date,
                        timestamp: delivery.created_at,
                        source: 'Excel Upload (Fallback)'
                    };

                    window.activeDeliveries.push(localDelivery);
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));

                    console.log('✅ Saved to localStorage as fallback');
                } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        console.log(`🎉 Excel booking processed: ${delivery.dr_number} (Supabase: ${saveSuccess})`);

    } catch (error) {
        console.error('❌ Enhanced createBookingFromDR failed:', error);

        // Final fallback - call original function if it exists
        if (originalCreateBookingFromDR) {
            console.log('🔄 Falling back to original createBookingFromDR');
            return await originalCreateBookingFromDR(bookingData);
        } else {
            throw error;
        }
    }
};

// =============================================================================
// 3. ENSURE PENDING DR BOOKINGS ARE HANDLED
// =============================================================================

// Monitor pendingDRBookings to help debug Excel upload issues
function monitorPendingBookings() {
    if (typeof window.pendingDRBookings !== 'undefined') {
        console.log('📊 Current pendingDRBookings:', window.pendingDRBookings?.length || 0);

        if (window.pendingDRBookings && window.pendingDRBookings.length > 0) {
            console.log('📋 Sample pending booking:', window.pendingDRBookings[0]);
        }
    } else {
        console.log('⚠️ pendingDRBookings not defined yet');
    }
}

// =============================================================================
// 4. ENHANCED ERROR HANDLING FOR EXCEL UPLOADS
// =============================================================================

// Override showError to provide better feedback
const originalShowError = window.showError;

window.showError = function (message) {
    console.error('🚨 Error shown to user:', message);

    // If it's the "No bookings to create" error, provide more helpful info
    if (message.includes('No bookings to create')) {
        console.log('🔍 Debugging "No bookings to create" error...');
        monitorPendingBookings();

        // Check if Excel file was processed
        const drFileInput = document.getElementById('drFileInput');
        if (drFileInput && drFileInput.files.length > 0) {
            console.log('📁 Excel file selected:', drFileInput.files[0].name);
            message += '\n\nDebugging info:\n- Excel file is selected\n- Check console for processing details\n- Try uploading the file again';
        } else {
            message += '\n\nPlease select an Excel file first using the "Select DR File" button.';
        }
    }

    // Call original showError or use alert
    if (originalShowError) {
        originalShowError(message);
    } else {
        alert(message);
    }
};

// =============================================================================
// 5. INITIALIZATION
// =============================================================================

function initBookingExcelFix() {
    console.log('🔧 Initializing Booking & Excel Fix...');

    // Setup confirm booking button
    setupConfirmBookingButton();

    // Monitor for Excel upload issues
    setInterval(monitorPendingBookings, 5000);

    console.log('✅ Booking & Excel Fix initialized');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookingExcelFix);
} else {
    initBookingExcelFix();
}

// Also initialize after a delay to ensure all other scripts are loaded
setTimeout(initBookingExcelFix, 3000);

console.log('🔧 BOOKING & EXCEL FIX: Loaded');
console.log('🎯 This fix ensures:');
console.log('   ✅ Confirm booking button works with Supabase');
console.log('   ✅ Excel uploads save to Supabase with retry logic');
console.log('   ✅ Better error handling and debugging');
console.log('   ✅ Fallback to localStorage when Supabase fails');