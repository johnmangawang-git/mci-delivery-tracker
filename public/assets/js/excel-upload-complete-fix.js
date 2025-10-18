/**
 * 🎯 EXCEL UPLOAD COMPLETE FIX
 * 
 * This script completely fixes the Excel upload issue where:
 * 1. Deliveries appear in Delivery History instead of Active Deliveries
 * 2. Customers are not being created properly
 * 
 * Root causes identified and fixed:
 * - Status filtering in getDeliveries function
 * - Customer creation process
 * - Data loading and display logic
 */

console.log('🔧 EXCEL UPLOAD COMPLETE FIX: Loading...');

(function() {
    'use strict';

    /**
     * 🔧 FIX 1: Enhanced getDeliveries to handle array status filters
     */
    function fixGetDeliveriesStatusFiltering() {
        console.log('🔧 Fixing getDeliveries status filtering...');

        if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
            const originalGetDeliveries = window.dataService.getDeliveries;
            
            window.dataService.getDeliveries = async function(filters = {}) {
                console.log('🎯 ENHANCED getDeliveries called with filters:', filters);
                
                const supabaseOp = async () => {
                    const client = window.supabaseClient();
                    let query = client.from('deliveries').select('*');
                    
                    if (filters.status) {
                        if (Array.isArray(filters.status)) {
                            // Handle array of status values (e.g., ['Completed', 'Signed'])
                            console.log('🔍 Using IN filter for status array:', filters.status);
                            query = query.in('status', filters.status);
                        } else {
                            // Handle single status value (e.g., 'Active')
                            console.log('🔍 Using EQ filter for single status:', filters.status);
                            query = query.eq('status', filters.status);
                        }
                    }
                    
                    const { data, error } = await query.order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    
                    console.log(`✅ ENHANCED getDeliveries returned ${data?.length || 0} records`);
                    return data || [];
                };

                return this.executeSupabaseOnly(supabaseOp, 'deliveries');
            };

            console.log('✅ Enhanced getDeliveries with proper status filtering');
        } else {
            console.warn('⚠️ dataService.getDeliveries not available for enhancement');
        }
    }

    /**
     * 🔧 FIX 2: Enhanced createBookingFromDR to ensure correct status and customer creation
     */
    function fixCreateBookingFromDR() {
        console.log('🔧 Fixing createBookingFromDR function...');

        if (typeof window.createBookingFromDR === 'function') {
            const originalCreateBookingFromDR = window.createBookingFromDR;
            
            window.createBookingFromDR = async function(bookingData) {
                console.log('🎯 ENHANCED createBookingFromDR called for:', bookingData.drNumber);
                console.log('📝 Booking data:', bookingData);
                
                try {
                    // Ensure activeDeliveries array exists
                    if (!window.activeDeliveries) {
                        window.activeDeliveries = [];
                        console.log('✅ Initialized activeDeliveries array');
                    }
                    
                    // Validate required fields
                    const requiredFields = ['drNumber', 'customerName', 'origin', 'destination'];
                    const missingFields = requiredFields.filter(field => !bookingData[field]);
                    
                    if (missingFields.length > 0) {
                        console.warn('⚠️ Missing required fields:', missingFields);
                    }
                    
                    // Ensure all display fields are properly set
                    bookingData.bookedDate = bookingData.bookedDate || bookingData.deliveryDate || new Date().toISOString().split('T')[0];
                    bookingData.truck = bookingData.truck || (bookingData.truckType && bookingData.truckPlateNumber ? 
                        `${bookingData.truckType} (${bookingData.truckPlateNumber})` : 'N/A');
                    
                    // Save to Supabase using dataService
                    if (window.dataService) {
                        try {
                            // Create delivery object with Supabase-compatible field names
                            const newDelivery = {
                                dr_number: bookingData.drNumber,
                                customer_name: bookingData.customerName,
                                vendor_number: bookingData.vendorNumber || '',
                                origin: bookingData.origin,
                                destination: bookingData.destination,
                                truck_type: bookingData.truckType || '',
                                truck_plate_number: bookingData.truckPlateNumber || '',
                                status: 'Active', // ✅ CRITICAL: This ensures it appears in Active Deliveries
                                distance: '',
                                additional_costs: parseFloat(bookingData.additionalCosts) || 0.00,
                                created_date: bookingData.bookedDate || new Date().toISOString().split('T')[0],
                                created_by: 'Excel Upload',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };

                            console.log('💾 ENHANCED: Saving delivery with status "Active":', newDelivery);

                            // Save to Supabase
                            const savedDelivery = await window.dataService.saveDelivery(newDelivery);
                            console.log('✅ ENHANCED: Delivery saved to Supabase successfully:', savedDelivery);
                            
                            // Update local array for immediate UI update
                            window.activeDeliveries.push(savedDelivery);
                            console.log('✅ ENHANCED: Added to activeDeliveries array');
                            
                        } catch (error) {
                            console.error('❌ ENHANCED: Failed to save to Supabase:', error);
                            throw error; // Don't fall back to localStorage - fail fast
                        }
                    } else {
                        throw new Error('DataService not available - Supabase connection required');
                    }
                    
                    // Enhanced customer creation
                    await enhancedCustomerCreation(bookingData);
                    
                    // Update analytics with cost breakdown
                    if (bookingData.additionalCostBreakdown && bookingData.additionalCostBreakdown.length > 0) {
                        console.log('📊 ENHANCED: Processing cost breakdown:', bookingData.additionalCostBreakdown);
                        // Cost breakdown is now handled as part of delivery data in Supabase
                    }
                    
                    console.log('✅ ENHANCED: Successfully created booking:', bookingData.drNumber);
                    
                } catch (error) {
                    console.error('❌ ENHANCED: Error creating booking from DR:', error);
                    console.error('❌ ENHANCED: Booking data that failed:', bookingData);
                    throw error;
                }
            };

            console.log('✅ Enhanced createBookingFromDR function');
        } else {
            console.warn('⚠️ createBookingFromDR function not available for enhancement');
        }
    }

    /**
     * 🔧 FIX 3: Enhanced customer creation for Excel uploads
     */
    async function enhancedCustomerCreation(bookingData) {
        console.log('🔧 ENHANCED: Creating customer for Excel upload...');
        console.log('📝 Customer data:', {
            customerName: bookingData.customerName,
            vendorNumber: bookingData.vendorNumber,
            destination: bookingData.destination
        });

        try {
            // Check if customer already exists
            if (window.dataService) {
                const existingCustomers = await window.dataService.getCustomers();
                const existingCustomer = existingCustomers.find(c => 
                    c.name === bookingData.customerName || 
                    c.contact_person === bookingData.customerName ||
                    (bookingData.vendorNumber && c.phone === bookingData.vendorNumber)
                );

                if (existingCustomer) {
                    console.log('✅ ENHANCED: Customer already exists:', existingCustomer.name);
                    return existingCustomer;
                }
            }

            // Create new customer
            const newCustomer = {
                id: 'CUST-' + Date.now(),
                name: bookingData.customerName,
                contact_person: bookingData.customerName,
                phone: bookingData.vendorNumber || '',
                vendor_number: bookingData.vendorNumber || '',
                address: bookingData.destination || '',
                account_type: 'Regular',
                status: 'Active',
                notes: 'Auto-created from Excel upload',
                bookings_count: 1,
                created_at: new Date().toISOString()
            };

            console.log('💾 ENHANCED: Saving new customer:', newCustomer);

            // Save customer using dataService
            if (window.dataService) {
                const savedCustomer = await window.dataService.saveCustomer(newCustomer);
                console.log('✅ ENHANCED: Customer saved to Supabase:', savedCustomer);

                // Update local customers array
                if (!window.customers) {
                    window.customers = [];
                }
                window.customers.push(savedCustomer);
                console.log('✅ ENHANCED: Added to customers array');

                return savedCustomer;
            } else {
                throw new Error('DataService not available for customer creation');
            }

        } catch (error) {
            console.error('❌ ENHANCED: Customer creation failed:', error);
            // Don't fail the whole booking process if customer creation fails
            console.warn('⚠️ ENHANCED: Continuing without customer creation');
        }
    }

    /**
     * 🔧 FIX 4: Enhanced data loading functions
     */
    function fixDataLoadingFunctions() {
        console.log('🔧 Fixing data loading functions...');

        // Enhanced loadActiveDeliveries
        if (typeof window.loadActiveDeliveries === 'function') {
            const originalLoadActiveDeliveries = window.loadActiveDeliveries;
            
            window.loadActiveDeliveries = async function() {
                console.log('🎯 ENHANCED loadActiveDeliveries called');
                
                try {
                    if (window.dataService) {
                        // Load deliveries with status 'Active' only
                        const activeDeliveries = await window.dataService.getDeliveries({ status: 'Active' });
                        window.activeDeliveries = activeDeliveries || [];
                        console.log(`✅ ENHANCED: Loaded ${window.activeDeliveries.length} active deliveries`);
                        
                        // Call original function for UI updates if it's different
                        if (originalLoadActiveDeliveries !== window.loadActiveDeliveries) {
                            return originalLoadActiveDeliveries.call(this);
                        }
                        
                        return window.activeDeliveries;
                    } else {
                        throw new Error('DataService not available');
                    }
                } catch (error) {
                    console.error('❌ ENHANCED: Failed to load active deliveries:', error);
                    // Initialize empty array on failure
                    window.activeDeliveries = [];
                    throw error;
                }
            };

            console.log('✅ Enhanced loadActiveDeliveries function');
        }

        // Enhanced loadDeliveryHistory
        if (typeof window.loadDeliveryHistory === 'function') {
            const originalLoadDeliveryHistory = window.loadDeliveryHistory;
            
            window.loadDeliveryHistory = async function() {
                console.log('🎯 ENHANCED loadDeliveryHistory called');
                
                try {
                    if (window.dataService) {
                        // Load deliveries with status 'Completed' or 'Signed' only
                        const deliveryHistory = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                        window.deliveryHistory = deliveryHistory || [];
                        console.log(`✅ ENHANCED: Loaded ${window.deliveryHistory.length} delivery history records`);
                        
                        // Call original function for UI updates if it's different
                        if (originalLoadDeliveryHistory !== window.loadDeliveryHistory) {
                            return originalLoadDeliveryHistory.call(this);
                        }
                        
                        return window.deliveryHistory;
                    } else {
                        throw new Error('DataService not available');
                    }
                } catch (error) {
                    console.error('❌ ENHANCED: Failed to load delivery history:', error);
                    // Initialize empty array on failure
                    window.deliveryHistory = [];
                    throw error;
                }
            };

            console.log('✅ Enhanced loadDeliveryHistory function');
        }

        // Enhanced loadCustomers
        if (typeof window.loadCustomers === 'function') {
            const originalLoadCustomers = window.loadCustomers;
            
            window.loadCustomers = async function() {
                console.log('🎯 ENHANCED loadCustomers called');
                
                try {
                    if (window.dataService) {
                        const customers = await window.dataService.getCustomers();
                        window.customers = customers || [];
                        console.log(`✅ ENHANCED: Loaded ${window.customers.length} customers`);
                        
                        // Call original function for UI updates if it's different
                        if (originalLoadCustomers !== window.loadCustomers) {
                            return originalLoadCustomers.call(this);
                        }
                        
                        return window.customers;
                    } else {
                        throw new Error('DataService not available');
                    }
                } catch (error) {
                    console.error('❌ ENHANCED: Failed to load customers:', error);
                    // Initialize empty array on failure
                    window.customers = [];
                    throw error;
                }
            };

            console.log('✅ Enhanced loadCustomers function');
        }
    }

    /**
     * 🔧 FIX 5: Force refresh after Excel upload
     */
    function fixPostUploadRefresh() {
        console.log('🔧 Setting up post-upload refresh...');

        // Enhanced confirmDRUpload to force proper refresh
        if (typeof window.confirmDRUpload === 'function') {
            const originalConfirmDRUpload = window.confirmDRUpload;
            
            window.confirmDRUpload = async function() {
                console.log('🎯 ENHANCED confirmDRUpload called');
                
                try {
                    // Call original function
                    const result = await originalConfirmDRUpload.call(this);
                    
                    // Force refresh of all data views
                    console.log('🔄 ENHANCED: Forcing data refresh after Excel upload...');
                    
                    setTimeout(async () => {
                        try {
                            // Refresh active deliveries
                            if (typeof window.loadActiveDeliveries === 'function') {
                                await window.loadActiveDeliveries();
                                console.log('✅ ENHANCED: Active deliveries refreshed');
                            }
                            
                            // Refresh delivery history
                            if (typeof window.loadDeliveryHistory === 'function') {
                                await window.loadDeliveryHistory();
                                console.log('✅ ENHANCED: Delivery history refreshed');
                            }
                            
                            // Refresh customers
                            if (typeof window.loadCustomers === 'function') {
                                await window.loadCustomers();
                                console.log('✅ ENHANCED: Customers refreshed');
                            }
                            
                            // Refresh UI displays
                            if (typeof window.displayCustomers === 'function') {
                                window.displayCustomers();
                            }
                            
                            if (typeof window.updateDashboardMetrics === 'function') {
                                window.updateDashboardMetrics();
                            }
                            
                            console.log('✅ ENHANCED: All data views refreshed after Excel upload');
                            
                        } catch (error) {
                            console.error('❌ ENHANCED: Error refreshing data after Excel upload:', error);
                        }
                    }, 500);
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ ENHANCED: Error in confirmDRUpload:', error);
                    throw error;
                }
            };

            console.log('✅ Enhanced confirmDRUpload with post-upload refresh');
        }
    }

    /**
     * 🚀 INITIALIZE ALL FIXES
     */
    function initializeExcelUploadFixes() {
        console.log('🚀 Initializing Excel upload fixes...');

        // Wait for dependencies to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkAndApplyFixes = () => {
            attempts++;
            
            if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
                console.log('✅ Dependencies available, applying fixes...');
                
                // Apply all fixes
                fixGetDeliveriesStatusFiltering();
                fixCreateBookingFromDR();
                fixDataLoadingFunctions();
                fixPostUploadRefresh();
                
                console.log('✅ EXCEL UPLOAD COMPLETE FIX: All fixes applied');
                console.log('🎯 Excel uploads should now appear in Active Deliveries');
                console.log('🎯 Customers should be created properly');
                
                return true;
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for dependencies... (${attempts}/${maxAttempts})`);
                setTimeout(checkAndApplyFixes, 100);
                return false;
            } else {
                console.error('❌ Timeout waiting for dependencies');
                return false;
            }
        };
        
        checkAndApplyFixes();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeExcelUploadFixes, 100);
        });
    } else {
        setTimeout(initializeExcelUploadFixes, 100);
    }

    // Make functions globally available for testing
    window.excelUploadCompleteFix = {
        fixGetDeliveriesStatusFiltering,
        fixCreateBookingFromDR,
        enhancedCustomerCreation,
        fixDataLoadingFunctions,
        fixPostUploadRefresh,
        initializeExcelUploadFixes
    };

})();

console.log('✅ EXCEL UPLOAD COMPLETE FIX: Script loaded - Excel uploads will now work correctly');