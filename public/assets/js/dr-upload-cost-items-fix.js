/**
 * DR Upload Cost Items Fix
 * Ensures additional cost items from DR uploads are properly saved to Supabase
 */

console.log('🔧 Loading DR Upload Cost Items Fix...');

// Override the createBookingFromDR function to properly handle additional cost items
function fixDRUploadCostItems() {
    // Store the original function
    const originalCreateBookingFromDR = window.createBookingFromDR;
    
    if (!originalCreateBookingFromDR) {
        console.warn('⚠️ Original createBookingFromDR function not found, will retry...');
        setTimeout(fixDRUploadCostItems, 1000);
        return;
    }
    
    // Override with enhanced version
    window.createBookingFromDR = async function(bookingData) {
        console.log('🔧 Enhanced createBookingFromDR called with:', bookingData);
        
        try {
            // Get additional costs from DR modal
            const additionalCosts = getDRAdditionalCosts();
            const totalAdditionalCost = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
            
            console.log('💰 DR Additional Costs:', additionalCosts);
            console.log('💰 Total Additional Cost:', totalAdditionalCost);
            
            // Enhanced booking data with proper cost items mapping
            const enhancedBookingData = {
                ...bookingData,
                additionalCosts: totalAdditionalCost,
                additionalCostBreakdown: [...additionalCosts] // Keep original format for compatibility
            };
            
            console.log('🔧 Enhanced booking data:', enhancedBookingData);
            
            // Check if Supabase is available
            if (window.dataService && window.dataService.isSupabaseAvailable()) {
                console.log('☁️ Saving to Supabase with cost items...');
                
                // Prepare delivery data for Supabase with proper cost items mapping
                const newDelivery = {
                    dr_number: bookingData.drNumber,
                    customer_name: bookingData.customerName,
                    vendor_number: bookingData.vendorNumber,
                    origin: bookingData.origin,
                    destination: bookingData.destination,
                    truck_type: bookingData.truckType || '',
                    truck_plate_number: bookingData.truckPlateNumber || '',
                    status: 'Active',
                    distance: '',
                    additional_costs: parseFloat(totalAdditionalCost) || 0.00,
                    // FIXED: Map additional cost items properly for Supabase
                    additional_cost_items: additionalCosts.map(cost => ({
                        description: cost.description || 'Unknown Cost',
                        amount: parseFloat(cost.amount) || 0,
                        category: categorizeCostDescription(cost.description || '')
                    })),
                    created_date: bookingData.bookedDate || new Date().toISOString().split('T')[0],
                    created_by: 'Excel Upload',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                console.log('💾 Delivery data for Supabase:', newDelivery);
                console.log('💾 Cost items to save:', newDelivery.additional_cost_items);
                
                try {
                    const savedDelivery = await window.dataService.saveDelivery(newDelivery);
                    console.log('✅ Delivery with cost items saved to Supabase:', savedDelivery);
                    
                    // Also save to localStorage for immediate display
                    const localDelivery = {
                        id: savedDelivery.id || 'DEL-' + Date.now() + '-' + bookingData.drNumber,
                        drNumber: bookingData.drNumber,
                        customerName: bookingData.customerName,
                        vendorNumber: bookingData.vendorNumber,
                        origin: bookingData.origin,
                        destination: bookingData.destination,
                        truckType: bookingData.truckType,
                        truckPlateNumber: bookingData.truckPlateNumber,
                        status: 'On Schedule',
                        deliveryDate: bookingData.deliveryDate,
                        additionalCosts: totalAdditionalCost,
                        additionalCostItems: additionalCosts, // Keep for analytics
                        timestamp: new Date().toISOString()
                    };
                    
                    if (typeof window.activeDeliveries !== 'undefined') {
                        // Remove any existing delivery with same DR number
                        window.activeDeliveries = window.activeDeliveries.filter(d => d.drNumber !== bookingData.drNumber);
                        window.activeDeliveries.push(localDelivery);
                        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                        console.log('✅ Also saved to localStorage for immediate display');
                    }
                    
                    return savedDelivery;
                    
                } catch (supabaseError) {
                    console.error('❌ Supabase save failed:', supabaseError);
                    throw supabaseError;
                }
                
            } else {
                console.log('💾 Supabase not available, using localStorage fallback...');
                
                // Fallback to localStorage with cost items
                const localDelivery = {
                    id: 'DEL-' + Date.now() + '-' + bookingData.drNumber,
                    drNumber: bookingData.drNumber,
                    customerName: bookingData.customerName,
                    vendorNumber: bookingData.vendorNumber,
                    origin: bookingData.origin,
                    destination: bookingData.destination,
                    truckType: bookingData.truckType,
                    truckPlateNumber: bookingData.truckPlateNumber,
                    status: 'On Schedule',
                    deliveryDate: bookingData.deliveryDate,
                    additionalCosts: totalAdditionalCost,
                    additionalCostItems: additionalCosts, // Include cost items for analytics
                    timestamp: new Date().toISOString()
                };
                
                if (typeof window.activeDeliveries !== 'undefined') {
                    // Remove any existing delivery with same DR number
                    window.activeDeliveries = window.activeDeliveries.filter(d => d.drNumber !== bookingData.drNumber);
                    window.activeDeliveries.push(localDelivery);
                    localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                    console.log('✅ Saved to localStorage with cost items');
                }
                
                return localDelivery;
            }
            
        } catch (error) {
            console.error('❌ Error in enhanced createBookingFromDR:', error);
            
            // Fallback to original function
            console.log('🔄 Falling back to original function...');
            return await originalCreateBookingFromDR(bookingData);
        }
    };
    
    console.log('✅ DR Upload Cost Items Fix applied successfully');
}

// Enhanced cost categorization function (same as analytics.js)
function categorizeCostDescription(description) {
    const desc = description.toLowerCase().trim();
    
    // Fuel-related keywords
    if (desc.includes('gas') || desc.includes('fuel') || 
        desc.includes('gasoline') || desc.includes('petrol') ||
        desc.includes('diesel') || desc.includes('lng') || 
        desc.includes('cng') || desc.includes('gasolina')) {
        return 'Fuel Surcharge';
    }
    
    // Toll-related keywords
    if (desc.includes('toll') || desc.includes('highway') ||
        desc.includes('expressway') || desc.includes('bridge') ||
        desc.includes('skyway') || desc.includes('slex') ||
        desc.includes('nlex') || desc.includes('cavitex') ||
        desc.includes('tplex') || desc.includes('star tollway')) {
        return 'Toll Fees';
    }
    
    // Helper/Labor-related keywords
    if (desc.includes('helper') || desc.includes('urgent') ||
        desc.includes('labor') || desc.includes('labour') ||
        desc.includes('manpower') || desc.includes('assistant') ||
        desc.includes('extra hand') || desc.includes('loading') ||
        desc.includes('unloading')) {
        return 'Helper';
    }
    
    // Special handling keywords
    if (desc.includes('special') || desc.includes('handling') ||
        desc.includes('fragile') || desc.includes('careful') ||
        desc.includes('delicate') || desc.includes('premium') ||
        desc.includes('white glove') || desc.includes('installation')) {
        return 'Special Handling';
    }
    
    // Default category
    return 'Other';
}

// Also fix the confirmDRUpload function to ensure cost items are processed
function fixConfirmDRUpload() {
    const originalConfirmDRUpload = window.confirmDRUpload;
    
    if (!originalConfirmDRUpload) {
        console.warn('⚠️ Original confirmDRUpload function not found');
        return;
    }
    
    window.confirmDRUpload = async function() {
        console.log('🔧 Enhanced confirmDRUpload called');
        
        try {
            // Get additional costs before processing
            const additionalCosts = getDRAdditionalCosts();
            console.log('💰 Additional costs before upload:', additionalCosts);
            
            // Call original function
            const result = await originalConfirmDRUpload();
            
            console.log('✅ Enhanced confirmDRUpload completed');
            return result;
            
        } catch (error) {
            console.error('❌ Error in enhanced confirmDRUpload:', error);
            throw error;
        }
    };
}

// Ensure getDRAdditionalCosts function is available
function ensureGetDRAdditionalCosts() {
    if (typeof window.getDRAdditionalCosts !== 'function') {
        console.log('🔧 Creating getDRAdditionalCosts function...');
        
        window.getDRAdditionalCosts = function() {
            const costs = [];
            const costItems = document.querySelectorAll('.dr-cost-item');
            
            costItems.forEach(item => {
                const descriptionInput = item.querySelector('.dr-cost-description');
                const amountInput = item.querySelector('.dr-cost-amount');
                
                if (descriptionInput && amountInput) {
                    const description = descriptionInput.value.trim();
                    const amount = parseFloat(amountInput.value) || 0;
                    
                    if (description && amount > 0) {
                        costs.push({
                            description: description,
                            amount: amount,
                            category: categorizeCostDescription(description)
                        });
                    }
                }
            });
            
            console.log('💰 Retrieved DR additional costs:', costs);
            return costs;
        };
    }
}

// Initialize the fix (moved to end of file)

// Initialize the fix
function initDRUploadCostItemsFix() {
    console.log('🚀 Initializing DR Upload Cost Items Fix...');
    
    // Ensure required functions exist
    ensureGetDRAdditionalCosts();
    
    // Apply fixes
    fixDRUploadCostItems();
    fixConfirmDRUpload();
    
    // Expose functions globally for testing
    window.fixDRUploadCostItems = fixDRUploadCostItems;
    window.categorizeCostDescription = categorizeCostDescription;
    window.ensureGetDRAdditionalCosts = ensureGetDRAdditionalCosts;
    window.initDRUploadCostItemsFix = initDRUploadCostItemsFix;
    
    console.log('✅ DR Upload Cost Items Fix initialized');
    console.log('✅ Available functions:', {
        fixDRUploadCostItems: typeof window.fixDRUploadCostItems,
        categorizeCostDescription: typeof window.categorizeCostDescription,
        getDRAdditionalCosts: typeof window.getDRAdditionalCosts,
        ensureGetDRAdditionalCosts: typeof window.ensureGetDRAdditionalCosts
    });
}

// Auto-initialize with retries
setTimeout(initDRUploadCostItemsFix, 1000);
setTimeout(initDRUploadCostItemsFix, 3000);
setTimeout(initDRUploadCostItemsFix, 5000);

// Also expose immediately for early access
window.fixDRUploadCostItems = fixDRUploadCostItems;
window.categorizeCostDescription = categorizeCostDescription;

console.log('✅ DR Upload Cost Items Fix loaded');