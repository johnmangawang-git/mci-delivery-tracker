/**
 * SUPABASE DEBUG & FIX
 * Comprehensive debugging and fixing of Supabase connection issues
 * Addresses upload failures and cross-browser sync problems
 */

console.log('🔧 SUPABASE DEBUG FIX: Loading...');

// =============================================================================
// 1. COMPREHENSIVE SUPABASE CONNECTION DEBUGGING
// =============================================================================

function debugSupabaseConnection() {
    console.log('🔍 SUPABASE DEBUG: Checking connection status...');
    
    // Check if Supabase client exists
    console.log('🔍 window.supabase:', typeof window.supabase);
    console.log('🔍 window.supabaseClient:', typeof window.supabaseClient);
    console.log('🔍 window.dataService:', typeof window.dataService);
    console.log('🔍 window.isSupabaseOnline:', typeof window.isSupabaseOnline);
    
    // Check Supabase configuration
    console.log('🔍 SUPABASE_URL:', window.SUPABASE_URL);
    console.log('🔍 SUPABASE_ANON_KEY:', window.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    // Test Supabase client
    if (window.supabaseClient && typeof window.supabaseClient === 'function') {
        const client = window.supabaseClient();
        console.log('🔍 Supabase client instance:', client);
        
        if (client) {
            console.log('🔍 Client URL:', client.supabaseUrl);
            console.log('🔍 Client Key:', client.supabaseKey ? 'Present' : 'Missing');
        }
    }
    
    // Test dataService
    if (window.dataService) {
        console.log('🔍 DataService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.dataService)));
        console.log('🔍 DataService isSupabaseAvailable:', window.dataService.isSupabaseAvailable());
    }
}

// =============================================================================
// 2. FORCE SUPABASE INITIALIZATION
// =============================================================================

async function forceSupabaseInitialization() {
    console.log('🚀 FORCE SUPABASE INIT: Starting...');
    
    try {
        // Ensure Supabase client is initialized
        if (!window.supabaseClient && window.initSupabase) {
            console.log('🔧 Initializing Supabase client...');
            await window.initSupabase();
        }
        
        // Ensure DataService is initialized
        if (!window.dataService && window.DataService) {
            console.log('🔧 Initializing DataService...');
            window.dataService = new window.DataService();
        }
        
        // Test connection
        if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
            console.log('🧪 Testing Supabase connection...');
            try {
                const testResult = await window.dataService.getDeliveries();
                console.log('✅ Supabase connection test successful:', testResult?.length || 0, 'records');
                return true;
            } catch (error) {
                console.error('❌ Supabase connection test failed:', error);
                return false;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Force Supabase initialization failed:', error);
        return false;
    }
}

// =============================================================================
// 3. ENHANCED SAVE DELIVERY WITH DEBUGGING
// =============================================================================

window.debugSaveDelivery = async function(delivery) {
    console.log('🎯 DEBUG SAVE DELIVERY:', delivery);
    
    // Check prerequisites
    console.log('🔍 Prerequisites check:');
    console.log('  - window.dataService:', !!window.dataService);
    console.log('  - dataService.saveDelivery:', typeof window.dataService?.saveDelivery);
    console.log('  - supabaseClient:', typeof window.supabaseClient);
    console.log('  - isSupabaseOnline:', typeof window.isSupabaseOnline);
    
    if (!window.dataService) {
        console.log('🔧 DataService missing, attempting to initialize...');
        const initSuccess = await forceSupabaseInitialization();
        if (!initSuccess) {
            throw new Error('Failed to initialize Supabase connection');
        }
    }
    
    try {
        console.log('💾 Attempting Supabase save...');
        const result = await window.dataService.saveDelivery(delivery);
        console.log('✅ Supabase save successful:', result);
        return result;
    } catch (error) {
        console.error('❌ Supabase save failed:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            details: error.details
        });
        throw error;
    }
};

// =============================================================================
// 4. ENHANCED UPLOAD PROCESSING WITH SUPABASE RETRY
// =============================================================================

window.enhancedProcessUploadData = async function(data) {
    console.log('🚀 ENHANCED UPLOAD: Processing', data.length, 'records');
    
    // Ensure Supabase is ready
    const supabaseReady = await forceSupabaseInitialization();
    console.log('🔍 Supabase ready:', supabaseReady);
    
    let savedCount = 0;
    let errors = [];
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        console.log(`📝 Processing row ${i + 1}/${data.length}:`, row);
        
        try {
            // Create delivery object with proper field mapping
            const delivery = {
                // Supabase fields (snake_case)
                dr_number: row['DR Number'] || row['dr_number'] || `DR-${Date.now()}-${i}`,
                customer_name: row['Customer'] || row['customer_name'] || row['Customer Name'] || 'Unknown Customer',
                vendor_number: row['Vendor'] || row['vendor_number'] || row['Vendor Number'] || '',
                origin: row['Origin'] || row['origin'] || '',
                destination: row['Destination'] || row['destination'] || '',
                truck_type: row['Truck Type'] || row['truck_type'] || row['Truck'] || '',
                truck_plate_number: row['Truck Plate'] || row['truck_plate_number'] || row['Plate Number'] || '',
                status: 'Active',
                created_date: new Date().toISOString().split('T')[0],
                created_by: 'Excel Upload',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                
                // Display fields (camelCase) for compatibility
                drNumber: row['DR Number'] || row['dr_number'] || `DR-${Date.now()}-${i}`,
                customerName: row['Customer'] || row['customer_name'] || row['Customer Name'] || 'Unknown Customer',
                vendorNumber: row['Vendor'] || row['vendor_number'] || row['Vendor Number'] || '',
                truckType: row['Truck Type'] || row['truck_type'] || row['Truck'] || '',
                truckPlateNumber: row['Truck Plate'] || row['truck_plate_number'] || row['Plate Number'] || '',
                deliveryDate: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            console.log(`📦 Created delivery object:`, delivery);
            
            // Try to save to Supabase with retry
            let saveSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!saveSuccess && retryCount < maxRetries) {
                try {
                    retryCount++;
                    console.log(`💾 Save attempt ${retryCount}/${maxRetries} for ${delivery.dr_number}`);
                    
                    const result = await window.debugSaveDelivery(delivery);
                    console.log(`✅ Saved to Supabase: ${delivery.dr_number}`, result);
                    saveSuccess = true;
                    savedCount++;
                    
                } catch (error) {
                    console.error(`❌ Save attempt ${retryCount} failed for ${delivery.dr_number}:`, error);
                    
                    if (retryCount >= maxRetries) {
                        // Final fallback to localStorage
                        console.log(`💾 Fallback to localStorage for ${delivery.dr_number}`);
                        window.activeDeliveries = window.activeDeliveries || [];
                        window.activeDeliveries.push(delivery);
                        localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                        savedCount++;
                        errors.push(`${delivery.dr_number}: Saved to localStorage only (Supabase failed)`);
                    } else {
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    }
                }
            }
            
            // AUTO-CREATE CUSTOMER: Extract and save customer data
            if (delivery.customer_name && delivery.customer_name !== 'Unknown Customer') {
                try {
                    const customerName = delivery.customer_name;
                    const vendorNumber = delivery.vendor_number || '';
                    const destination = delivery.destination || '';
                    
                    // Call auto-create customer function if available
                    if (typeof window.autoCreateCustomer === 'function') {
                        await window.autoCreateCustomer(customerName, vendorNumber, destination);
                        console.log('✅ ENHANCED: Auto-created customer:', customerName);
                    } else if (typeof autoCreateCustomer === 'function') {
                        await autoCreateCustomer(customerName, vendorNumber, destination);
                        console.log('✅ ENHANCED: Auto-created customer:', customerName);
                    } else {
                        console.warn('⚠️ ENHANCED: autoCreateCustomer function not available');
                    }
                } catch (customerError) {
                    console.error('❌ ENHANCED: Error auto-creating customer:', delivery.customer_name, customerError);
                    // Don't fail the whole upload if customer creation fails
                }
            }
            
        } catch (error) {
            console.error(`❌ Error processing row ${i + 1}:`, error);
            errors.push(`Row ${i + 1}: ${error.message}`);
        }
    }
    
    console.log(`🎉 Upload complete: ${savedCount}/${data.length} deliveries saved`);
    
    // Show results
    let message = `Successfully processed ${savedCount}/${data.length} deliveries!`;
    if (errors.length > 0) {
        message += `\n\nWarnings:\n${errors.join('\n')}`;
    }
    
    alert(message);
    
    // Refresh data
    if (typeof window.loadActiveDeliveries === 'function') {
        setTimeout(() => {
            window.loadActiveDeliveries(true); // Force reload
        }, 1000);
    }
    
    return { savedCount, errors };
};

// =============================================================================
// 5. OVERRIDE UPLOAD FUNCTIONS
// =============================================================================

// Override the upload processing function
if (window.processUploadData) {
    console.log('🔧 Overriding processUploadData with enhanced version');
    window.processUploadData = window.enhancedProcessUploadData;
}

// =============================================================================
// 6. INITIALIZATION AND DEBUGGING
// =============================================================================

function initSupabaseDebugFix() {
    console.log('🔧 Initializing Supabase Debug Fix...');
    
    // Run initial debugging
    debugSupabaseConnection();
    
    // Force initialization
    setTimeout(async () => {
        console.log('🚀 Running delayed Supabase initialization...');
        await forceSupabaseInitialization();
        debugSupabaseConnection();
    }, 2000);
    
    console.log('✅ Supabase Debug Fix initialized');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseDebugFix);
} else {
    initSupabaseDebugFix();
}

// Export debug functions for console testing
window.debugSupabaseConnection = debugSupabaseConnection;
window.forceSupabaseInitialization = forceSupabaseInitialization;

console.log('🔧 SUPABASE DEBUG FIX: Loaded');
console.log('🎯 Available debug functions:');
console.log('  - debugSupabaseConnection()');
console.log('  - forceSupabaseInitialization()');
console.log('  - debugSaveDelivery(delivery)');
console.log('  - enhancedProcessUploadData(data)');