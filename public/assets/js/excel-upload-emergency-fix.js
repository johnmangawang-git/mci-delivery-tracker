/**
 * 🚨 EXCEL UPLOAD EMERGENCY FIX
 * 
 * This script directly intercepts and fixes the Excel upload process
 * to ensure deliveries appear in Active Deliveries, not Delivery History
 */

console.log('🚨 EXCEL UPLOAD EMERGENCY FIX: Loading...');

(function() {
    'use strict';

    let originalCreateBookingFromDR = null;
    let originalConfirmDRUpload = null;
    let originalLoadActiveDeliveries = null;
    let originalLoadDeliveryHistory = null;

    /**
     * 🔧 EMERGENCY FIX: Override createBookingFromDR completely
     */
    function emergencyFixCreateBookingFromDR() {
        console.log('🚨 EMERGENCY: Overriding createBookingFromDR...');

        // Store original function
        if (typeof window.createBookingFromDR === 'function') {
            originalCreateBookingFromDR = window.createBookingFromDR;
        }

        // Create completely new function
        window.createBookingFromDR = async function(bookingData) {
            console.log('🚨 EMERGENCY createBookingFromDR called for:', bookingData.drNumber);
            console.log('🚨 EMERGENCY booking data:', bookingData);

            try {
                // Ensure we have dataService
                if (!window.dataService) {
                    throw new Error('DataService not available - cannot save to Supabase');
                }

                // Create delivery with EXPLICIT Active status
                const deliveryToSave = {
                    dr_number: bookingData.drNumber,
                    customer_name: bookingData.customerName,
                    vendor_number: bookingData.vendorNumber || '',
                    origin: bookingData.origin,
                    destination: bookingData.destination,
                    truck_type: bookingData.truckType || '',
                    truck_plate_number: bookingData.truckPlateNumber || '',
                    status: 'Active', // 🚨 CRITICAL: Force Active status
                    distance: '',
                    additional_costs: parseFloat(bookingData.additionalCosts) || 0.00,
                    created_date: bookingData.bookedDate || new Date().toISOString().split('T')[0],
                    created_by: 'Excel Upload',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                console.log('🚨 EMERGENCY: Saving delivery with FORCED Active status:', deliveryToSave);

                // Save to Supabase
                const savedDelivery = await window.dataService.saveDelivery(deliveryToSave);
                console.log('🚨 EMERGENCY: Delivery saved to Supabase:', savedDelivery);

                // FORCE update local arrays immediately
                if (!window.activeDeliveries) {
                    window.activeDeliveries = [];
                }

                // Add to activeDeliveries and ensure it's NOT in deliveryHistory
                window.activeDeliveries.push(savedDelivery);
                console.log('🚨 EMERGENCY: Added to activeDeliveries array, total:', window.activeDeliveries.length);

                // Remove from deliveryHistory if it somehow got there
                if (window.deliveryHistory) {
                    window.deliveryHistory = window.deliveryHistory.filter(d => d.dr_number !== bookingData.drNumber);
                    console.log('🚨 EMERGENCY: Ensured NOT in deliveryHistory, total:', window.deliveryHistory.length);
                }

                // Create customer
                await emergencyCreateCustomer(bookingData);

                console.log('🚨 EMERGENCY: createBookingFromDR completed successfully');
                return savedDelivery;

            } catch (error) {
                console.error('🚨 EMERGENCY: createBookingFromDR failed:', error);
                throw error;
            }
        };

        console.log('✅ EMERGENCY: createBookingFromDR overridden');
    }

    /**
     * 🔧 EMERGENCY CUSTOMER CREATION
     */
    async function emergencyCreateCustomer(bookingData) {
        console.log('🚨 EMERGENCY: Creating customer...');

        try {
            if (!window.dataService) {
                console.warn('🚨 EMERGENCY: No dataService for customer creation');
                return;
            }

            // Check if customer exists
            const existingCustomers = await window.dataService.getCustomers();
            const existingCustomer = existingCustomers.find(c => 
                c.name === bookingData.customerName || 
                c.contact_person === bookingData.customerName
            );

            if (existingCustomer) {
                console.log('🚨 EMERGENCY: Customer already exists:', existingCustomer.name);
                return existingCustomer;
            }

            // Create new customer
            const newCustomer = {
                name: bookingData.customerName,
                contact_person: bookingData.customerName,
                phone: bookingData.vendorNumber || '',
                vendor_number: bookingData.vendorNumber || '',
                address: bookingData.destination || '',
                account_type: 'Regular',
                status: 'Active',
                notes: 'Auto-created from Excel upload (Emergency Fix)',
                bookings_count: 1,
                created_at: new Date().toISOString()
            };

            const savedCustomer = await window.dataService.saveCustomer(newCustomer);
            console.log('🚨 EMERGENCY: Customer created:', savedCustomer);

            // Update local array
            if (!window.customers) {
                window.customers = [];
            }
            window.customers.push(savedCustomer);

            return savedCustomer;

        } catch (error) {
            console.error('🚨 EMERGENCY: Customer creation failed:', error);
            // Don't fail the whole process
        }
    }

    /**
     * 🔧 EMERGENCY FIX: Override confirmDRUpload
     */
    function emergencyFixConfirmDRUpload() {
        console.log('🚨 EMERGENCY: Overriding confirmDRUpload...');

        if (typeof window.confirmDRUpload === 'function') {
            originalConfirmDRUpload = window.confirmDRUpload;
        }

        window.confirmDRUpload = async function() {
            console.log('🚨 EMERGENCY confirmDRUpload called');

            try {
                // Call original function first
                if (originalConfirmDRUpload) {
                    await originalConfirmDRUpload.call(this);
                }

                // FORCE refresh data after upload
                console.log('🚨 EMERGENCY: Forcing data refresh after upload...');
                
                setTimeout(async () => {
                    try {
                        // Force reload active deliveries
                        if (window.dataService) {
                            const activeDeliveries = await window.dataService.getDeliveries({ status: 'Active' });
                            window.activeDeliveries = activeDeliveries || [];
                            console.log('🚨 EMERGENCY: Reloaded active deliveries:', window.activeDeliveries.length);

                            const deliveryHistory = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                            window.deliveryHistory = deliveryHistory || [];
                            console.log('🚨 EMERGENCY: Reloaded delivery history:', window.deliveryHistory.length);

                            const customers = await window.dataService.getCustomers();
                            window.customers = customers || [];
                            console.log('🚨 EMERGENCY: Reloaded customers:', window.customers.length);
                        }

                        // Force UI refresh
                        if (typeof window.loadActiveDeliveries === 'function') {
                            window.loadActiveDeliveries();
                        }
                        if (typeof window.loadDeliveryHistory === 'function') {
                            window.loadDeliveryHistory();
                        }
                        if (typeof window.displayCustomers === 'function') {
                            window.displayCustomers();
                        }

                        console.log('🚨 EMERGENCY: Data refresh completed');

                    } catch (error) {
                        console.error('🚨 EMERGENCY: Data refresh failed:', error);
                    }
                }, 1000);

            } catch (error) {
                console.error('🚨 EMERGENCY: confirmDRUpload failed:', error);
                throw error;
            }
        };

        console.log('✅ EMERGENCY: confirmDRUpload overridden');
    }

    /**
     * 🔧 EMERGENCY FIX: Override data loading functions
     */
    function emergencyFixDataLoading() {
        console.log('🚨 EMERGENCY: Overriding data loading functions...');

        // Override loadActiveDeliveries
        if (typeof window.loadActiveDeliveries === 'function') {
            originalLoadActiveDeliveries = window.loadActiveDeliveries;
        }

        window.loadActiveDeliveries = async function() {
            console.log('🚨 EMERGENCY loadActiveDeliveries called');

            try {
                if (window.dataService) {
                    // FORCE load only Active status deliveries
                    const activeDeliveries = await window.dataService.getDeliveries({ status: 'Active' });
                    window.activeDeliveries = activeDeliveries || [];
                    console.log('🚨 EMERGENCY: Loaded ONLY Active deliveries:', window.activeDeliveries.length);

                    // Log sample data
                    if (window.activeDeliveries.length > 0) {
                        console.log('🚨 EMERGENCY: Sample active delivery:', window.activeDeliveries[0]);
                    }

                    // Call original function for UI updates
                    if (originalLoadActiveDeliveries && originalLoadActiveDeliveries !== window.loadActiveDeliveries) {
                        return originalLoadActiveDeliveries.call(this);
                    }

                    return window.activeDeliveries;
                } else {
                    throw new Error('DataService not available');
                }
            } catch (error) {
                console.error('🚨 EMERGENCY: loadActiveDeliveries failed:', error);
                window.activeDeliveries = [];
                throw error;
            }
        };

        // Override loadDeliveryHistory
        if (typeof window.loadDeliveryHistory === 'function') {
            originalLoadDeliveryHistory = window.loadDeliveryHistory;
        }

        window.loadDeliveryHistory = async function() {
            console.log('🚨 EMERGENCY loadDeliveryHistory called');

            try {
                if (window.dataService) {
                    // FORCE load only Completed/Signed status deliveries
                    const deliveryHistory = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                    window.deliveryHistory = deliveryHistory || [];
                    console.log('🚨 EMERGENCY: Loaded ONLY Completed/Signed deliveries:', window.deliveryHistory.length);

                    // Log sample data
                    if (window.deliveryHistory.length > 0) {
                        console.log('🚨 EMERGENCY: Sample history delivery:', window.deliveryHistory[0]);
                    }

                    // Call original function for UI updates
                    if (originalLoadDeliveryHistory && originalLoadDeliveryHistory !== window.loadDeliveryHistory) {
                        return originalLoadDeliveryHistory.call(this);
                    }

                    return window.deliveryHistory;
                } else {
                    throw new Error('DataService not available');
                }
            } catch (error) {
                console.error('🚨 EMERGENCY: loadDeliveryHistory failed:', error);
                window.deliveryHistory = [];
                throw error;
            }
        };

        console.log('✅ EMERGENCY: Data loading functions overridden');
    }

    /**
     * 🔧 EMERGENCY DIAGNOSTIC
     */
    function emergencyDiagnostic() {
        console.log('🚨 EMERGENCY DIAGNOSTIC: Checking system state...');

        // Check dataService
        console.log('DataService available:', typeof window.dataService !== 'undefined');
        if (window.dataService) {
            console.log('DataService.getDeliveries:', typeof window.dataService.getDeliveries === 'function');
            console.log('DataService.saveDelivery:', typeof window.dataService.saveDelivery === 'function');
        }

        // Check Excel functions
        console.log('createBookingFromDR:', typeof window.createBookingFromDR === 'function');
        console.log('confirmDRUpload:', typeof window.confirmDRUpload === 'function');

        // Check data arrays
        console.log('activeDeliveries length:', window.activeDeliveries?.length || 0);
        console.log('deliveryHistory length:', window.deliveryHistory?.length || 0);
        console.log('customers length:', window.customers?.length || 0);

        // Test getDeliveries with different filters
        if (window.dataService) {
            setTimeout(async () => {
                try {
                    console.log('🚨 TESTING: getDeliveries with Active filter...');
                    const activeTest = await window.dataService.getDeliveries({ status: 'Active' });
                    console.log('🚨 TESTING: Active deliveries found:', activeTest.length);

                    console.log('🚨 TESTING: getDeliveries with array filter...');
                    const historyTest = await window.dataService.getDeliveries({ status: ['Completed', 'Signed'] });
                    console.log('🚨 TESTING: History deliveries found:', historyTest.length);

                    console.log('🚨 TESTING: getDeliveries with no filter...');
                    const allTest = await window.dataService.getDeliveries();
                    console.log('🚨 TESTING: All deliveries found:', allTest.length);

                } catch (error) {
                    console.error('🚨 TESTING: getDeliveries test failed:', error);
                }
            }, 2000);
        }
    }

    /**
     * 🚀 INITIALIZE EMERGENCY FIXES
     */
    function initializeEmergencyFixes() {
        console.log('🚨 EMERGENCY: Initializing all fixes...');

        let attempts = 0;
        const maxAttempts = 50;

        const applyFixes = () => {
            attempts++;

            // Check if we have the minimum required functions
            const hasMinimumRequirements = (
                (typeof window.createBookingFromDR === 'function' || window.pendingDRBookings) ||
                typeof window.dataService !== 'undefined'
            );

            if (hasMinimumRequirements || attempts >= maxAttempts) {
                console.log('🚨 EMERGENCY: Applying all fixes...');

                emergencyFixCreateBookingFromDR();
                emergencyFixConfirmDRUpload();
                emergencyFixDataLoading();
                emergencyDiagnostic();

                console.log('✅ EMERGENCY: All fixes applied');
                console.log('🎯 EMERGENCY: Excel uploads should now work correctly');

                // Set up monitoring
                setInterval(() => {
                    const activeCount = window.activeDeliveries?.length || 0;
                    const historyCount = window.deliveryHistory?.length || 0;
                    const customerCount = window.customers?.length || 0;
                    
                    if (activeCount > 0 || historyCount > 0 || customerCount > 0) {
                        console.log(`🚨 MONITOR: Active: ${activeCount}, History: ${historyCount}, Customers: ${customerCount}`);
                    }
                }, 5000);

            } else {
                console.log(`🚨 EMERGENCY: Waiting for dependencies... (${attempts}/${maxAttempts})`);
                setTimeout(applyFixes, 100);
            }
        };

        applyFixes();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeEmergencyFixes, 100);
        });
    } else {
        setTimeout(initializeEmergencyFixes, 100);
    }

    // Make functions globally available for testing
    window.emergencyExcelFix = {
        emergencyFixCreateBookingFromDR,
        emergencyFixConfirmDRUpload,
        emergencyFixDataLoading,
        emergencyDiagnostic,
        initializeEmergencyFixes
    };

})();

console.log('✅ EXCEL UPLOAD EMERGENCY FIX: Script loaded - will intercept and fix Excel uploads');