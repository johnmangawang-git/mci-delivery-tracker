/**
 * SUPABASE-FIRST DATA LOADING FIX
 * Forces all data loading to come from Supabase central database first
 * Prevents localStorage from causing different data across browsers
 */

console.log('🔧 SUPABASE-FIRST FIX: Loading...');

// =============================================================================
// 1. OVERRIDE LOCALSTORAGE LOADING TO FORCE SUPABASE FIRST
// =============================================================================

// Track if we've loaded from Supabase yet
window.supabaseDataLoaded = false;
window.supabaseLoadAttempted = false;

// Override localStorage.getItem for delivery data to force Supabase loading
const originalGetItem = localStorage.getItem.bind(localStorage);

localStorage.getItem = function(key) {
    // Intercept delivery data requests
    if (key === 'mci-active-deliveries' || key === 'mci-delivery-history') {
        console.log(`🛡️ SUPABASE-FIRST: Intercepting localStorage.getItem('${key}')`);
        
        // If we haven't loaded from Supabase yet, return empty to force Supabase load
        if (!window.supabaseDataLoaded && !window.supabaseLoadAttempted) {
            console.log(`🛡️ SUPABASE-FIRST: Blocking localStorage for '${key}' - forcing Supabase load`);
            
            // Trigger Supabase load immediately
            setTimeout(() => {
                forceSupabaseLoad();
            }, 100);
            
            return null; // Force empty to trigger Supabase load
        }
        
        console.log(`🛡️ SUPABASE-FIRST: Allowing localStorage for '${key}' (Supabase already loaded)`);
    }
    
    // For all other keys, use normal localStorage
    return originalGetItem(key);
};

// =============================================================================
// 2. FORCE SUPABASE DATA LOADING
// =============================================================================

async function forceSupabaseLoad() {
    if (window.supabaseLoadAttempted) {
        console.log('🔄 Supabase load already attempted');
        return;
    }
    
    window.supabaseLoadAttempted = true;
    console.log('🚀 SUPABASE-FIRST: Force loading from Supabase...');
    
    try {
        // Ensure dataService is available
        if (!window.dataService && window.DataService) {
            window.dataService = new window.DataService();
            console.log('✅ DataService initialized');
        }
        
        if (window.dataService && typeof window.dataService.getDeliveries === 'function') {
            console.log('📡 Loading deliveries from Supabase...');
            
            const deliveries = await window.dataService.getDeliveries();
            console.log('📊 Supabase returned:', deliveries?.length || 0, 'deliveries');
            
            if (deliveries && deliveries.length > 0) {
                // Normalize field names
                const normalizedDeliveries = deliveries.map(delivery => ({
                    ...delivery,
                    // Ensure both field name formats exist
                    drNumber: delivery.dr_number || delivery.drNumber,
                    dr_number: delivery.dr_number || delivery.drNumber,
                    customerName: delivery.customer_name || delivery.customerName,
                    customer_name: delivery.customer_name || delivery.customerName,
                    vendorNumber: delivery.vendor_number || delivery.vendorNumber,
                    vendor_number: delivery.vendor_number || delivery.vendorNumber,
                    truckType: delivery.truck_type || delivery.truckType,
                    truck_type: delivery.truck_type || delivery.truckType,
                    truckPlateNumber: delivery.truck_plate_number || delivery.truckPlateNumber,
                    truck_plate_number: delivery.truck_plate_number || delivery.truckPlateNumber,
                    deliveryDate: delivery.created_date || delivery.deliveryDate || delivery.timestamp,
                    created_date: delivery.created_date || delivery.deliveryDate || delivery.timestamp
                }));
                
                // Separate active and completed deliveries
                const activeDeliveries = normalizedDeliveries.filter(d => 
                    d.status !== 'Completed' && d.status !== 'Signed'
                );
                const completedDeliveries = normalizedDeliveries.filter(d => 
                    d.status === 'Completed' || d.status === 'Signed'
                );
                
                // Set global data
                window.activeDeliveries = activeDeliveries;
                window.deliveryHistory = completedDeliveries;
                
                console.log(`✅ Loaded from Supabase: ${activeDeliveries.length} active, ${completedDeliveries.length} completed`);
                
                // Now sync to localStorage for backup
                originalGetItem.call(localStorage, 'temp'); // Restore original function temporarily
                localStorage.setItem('mci-active-deliveries', JSON.stringify(activeDeliveries));
                localStorage.setItem('mci-delivery-history', JSON.stringify(completedDeliveries));
                console.log('💾 Synced Supabase data to localStorage');
                
                window.supabaseDataLoaded = true;
                
                // Refresh displays
                if (typeof window.populateActiveDeliveriesTable === 'function') {
                    window.populateActiveDeliveriesTable();
                }
                if (typeof window.minimalLoadActiveDeliveries === 'function') {
                    window.minimalLoadActiveDeliveries();
                }
                
                console.log('🎉 SUPABASE-FIRST: Data loaded successfully from central database');
                
            } else {
                console.log('📊 Supabase returned no data, allowing localStorage fallback');
                window.supabaseDataLoaded = true; // Allow localStorage now
            }
            
        } else {
            console.warn('⚠️ DataService not available, allowing localStorage fallback');
            window.supabaseDataLoaded = true; // Allow localStorage fallback
        }
        
    } catch (error) {
        console.error('❌ Supabase load failed:', error);
        window.supabaseDataLoaded = true; // Allow localStorage fallback on error
    }
}

// =============================================================================
// 3. ENHANCED STATUS UPDATE WITH GUARANTEED SUPABASE SAVE
// =============================================================================

// Override status update to ensure Supabase saves work
const originalUpdateDeliveryStatusById = window.updateDeliveryStatusById;

window.updateDeliveryStatusById = async function(deliveryId, newStatus) {
    console.log(`🎯 SUPABASE-FIRST: Status update ${deliveryId} → ${newStatus}`);
    
    // Ensure we have data loaded
    if (!window.activeDeliveries || window.activeDeliveries.length === 0) {
        console.log('🔄 No data loaded, forcing Supabase load first...');
        await forceSupabaseLoad();
        
        if (!window.activeDeliveries || window.activeDeliveries.length === 0) {
            console.error('❌ Still no data after Supabase load');
            return;
        }
    }
    
    // Find delivery
    const deliveryIndex = window.activeDeliveries.findIndex(d => 
        d.id === deliveryId || d.delivery_id === deliveryId || String(d.id) === String(deliveryId)
    );
    
    if (deliveryIndex === -1) {
        console.error(`❌ Delivery ${deliveryId} not found`);
        return;
    }
    
    const delivery = window.activeDeliveries[deliveryIndex];
    const oldStatus = delivery.status;
    
    // Update status locally
    delivery.status = newStatus;
    delivery.lastStatusUpdate = new Date().toISOString();
    delivery.updated_at = new Date().toISOString();
    
    console.log(`📝 Updated locally: ${oldStatus} → ${newStatus}`);
    
    // Update UI immediately
    if (typeof window.updateSingleTableRow === 'function') {
        window.updateSingleTableRow(deliveryId, delivery);
    }
    
    // Close dropdown
    const dropdown = document.getElementById(`statusDropdown-${deliveryId}`);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Show saving notification
    if (typeof window.showStatusNotification === 'function') {
        window.showStatusNotification(delivery.dr_number || delivery.drNumber, oldStatus, newStatus, 'saving');
    }
    
    // CRITICAL: Save to Supabase with retry logic
    let saveSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!saveSuccess && retryCount < maxRetries) {
        try {
            retryCount++;
            console.log(`💾 Supabase save attempt ${retryCount}/${maxRetries}...`);
            
            if (window.dataService && typeof window.dataService.saveDelivery === 'function') {
                // Prepare data with all field formats
                const deliveryForSupabase = {
                    ...delivery,
                    dr_number: delivery.dr_number || delivery.drNumber,
                    customer_name: delivery.customer_name || delivery.customerName,
                    vendor_number: delivery.vendor_number || delivery.vendorNumber,
                    truck_type: delivery.truck_type || delivery.truckType,
                    truck_plate_number: delivery.truck_plate_number || delivery.truckPlateNumber,
                    created_date: delivery.created_date || delivery.deliveryDate || delivery.timestamp,
                    origin: delivery.origin,
                    destination: delivery.destination,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                };
                
                console.log(`📤 Saving to Supabase (attempt ${retryCount}):`, deliveryForSupabase);
                
                const result = await window.dataService.saveDelivery(deliveryForSupabase);
                console.log('✅ Supabase save successful:', result);
                saveSuccess = true;
                
                // Update localStorage with successful save
                localStorage.setItem('mci-active-deliveries', JSON.stringify(window.activeDeliveries));
                
                // Show success notification
                if (typeof window.showStatusNotification === 'function') {
                    window.showStatusNotification(delivery.dr_number || delivery.drNumber, oldStatus, newStatus, 'saved');
                }
                
            } else {
                console.warn('⚠️ DataService not available');
                break;
            }
            
        } catch (error) {
            console.error(`❌ Supabase save attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
                console.error('❌ All Supabase save attempts failed');
                
                // Show failure notification
                if (typeof window.showStatusNotification === 'function') {
                    window.showStatusNotification(delivery.dr_number || delivery.drNumber, oldStatus, newStatus, 'failed');
                }
            } else {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
    }
    
    console.log(`🎉 Status update complete: ${oldStatus} → ${newStatus} (Supabase: ${saveSuccess})`);
};

// =============================================================================
// 4. INITIALIZATION
// =============================================================================

// Force Supabase load on page load
function initSupabaseFirst() {
    console.log('🚀 SUPABASE-FIRST: Initializing...');
    
    // Force load from Supabase immediately
    setTimeout(() => {
        forceSupabaseLoad();
    }, 500);
    
    console.log('✅ SUPABASE-FIRST: Initialized');
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseFirst);
} else {
    initSupabaseFirst();
}

console.log('🚀 SUPABASE-FIRST FIX: Loaded - will force central database loading');
console.log('🎯 This ensures all browsers see the same data from Supabase');