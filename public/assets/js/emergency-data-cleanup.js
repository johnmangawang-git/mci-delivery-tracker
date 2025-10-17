/**
 * EMERGENCY DATA CLEANUP
 * Quick functions to clean all data from browser console
 * Use when you need immediate cleanup without opening separate pages
 */

console.log('🧹 Emergency Data Cleanup Functions Loaded');

/**
 * Clean all localStorage data
 */
window.emergencyCleanLocalStorage = function() {
    console.log('🧹 Emergency: Cleaning localStorage...');
    
    const keysToRemove = [
        'mci-active-deliveries',
        'mci-delivery-history',
        'mci-customers',
        'mci-user',
        'ePodRecords',
        'analytics-cost-breakdown',
        'mci-settings'
    ];
    
    let removedCount = 0;
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
            console.log(`  ✅ Removed: ${key}`);
        }
    });
    
    console.log(`🎉 localStorage cleaned: ${removedCount} items removed`);
    return removedCount;
};

/**
 * Clean all global variables
 */
window.emergencyCleanGlobals = function() {
    console.log('🧹 Emergency: Cleaning global variables...');
    
    try {
        if (window.activeDeliveries) {
            window.activeDeliveries = [];
            console.log('  ✅ Cleared: window.activeDeliveries');
        }
        
        if (window.deliveryHistory) {
            window.deliveryHistory = [];
            console.log('  ✅ Cleared: window.deliveryHistory');
        }
        
        if (window.customers) {
            window.customers = [];
            console.log('  ✅ Cleared: window.customers');
        }
        
        console.log('🎉 Global variables cleaned');
        return true;
    } catch (error) {
        console.error('❌ Error cleaning globals:', error);
        return false;
    }
};

/**
 * Clean all Supabase data
 */
window.emergencyCleanSupabase = async function() {
    console.log('🧹 Emergency: Cleaning Supabase data...');
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        const client = window.supabaseClient();
        
        // Clear in correct order (foreign key constraints)
        console.log('  🗑️ Clearing additional_cost_items...');
        const { error: costError } = await client
            .from('additional_cost_items')
            .delete()
            .neq('id', 0);
        
        if (costError) console.warn('⚠️ Cost items error:', costError.message);
        else console.log('  ✅ Cleared: additional_cost_items');
        
        console.log('  🗑️ Clearing epod_records...');
        const { error: epodError } = await client
            .from('epod_records')
            .delete()
            .neq('id', 0);
        
        if (epodError) console.warn('⚠️ E-POD error:', epodError.message);
        else console.log('  ✅ Cleared: epod_records');
        
        console.log('  🗑️ Clearing deliveries...');
        const { error: deliveriesError } = await client
            .from('deliveries')
            .delete()
            .neq('id', 0);
        
        if (deliveriesError) throw deliveriesError;
        console.log('  ✅ Cleared: deliveries');
        
        console.log('  🗑️ Clearing customers...');
        const { error: customersError } = await client
            .from('customers')
            .delete()
            .neq('id', 0);
        
        if (customersError) throw customersError;
        console.log('  ✅ Cleared: customers');
        
        console.log('  🗑️ Clearing user_profiles...');
        const { error: profilesError } = await client
            .from('user_profiles')
            .delete()
            .neq('id', 0);
        
        if (profilesError) console.warn('⚠️ Profiles error:', profilesError.message);
        else console.log('  ✅ Cleared: user_profiles');
        
        console.log('🎉 Supabase data cleaned');
        return true;
        
    } catch (error) {
        console.error('❌ Error cleaning Supabase:', error);
        return false;
    }
};

/**
 * NUCLEAR OPTION - Clean everything
 */
window.emergencyNuclearCleanup = async function() {
    const confirmed = confirm(
        '🚨 NUCLEAR CLEANUP WARNING 🚨\n\n' +
        'This will PERMANENTLY DELETE:\n' +
        '• All Supabase database records\n' +
        '• All localStorage data\n' +
        '• All global variables\n\n' +
        'THIS CANNOT BE UNDONE!\n\n' +
        'Type "DELETE EVERYTHING" to confirm:'
    );
    
    if (confirmed !== 'DELETE EVERYTHING') {
        console.log('❌ Nuclear cleanup cancelled');
        return false;
    }
    
    console.log('💥 NUCLEAR CLEANUP INITIATED...');
    
    try {
        // Step 1: Clean localStorage
        console.log('Step 1/3: localStorage...');
        window.emergencyCleanLocalStorage();
        
        // Step 2: Clean globals
        console.log('Step 2/3: Global variables...');
        window.emergencyCleanGlobals();
        
        // Step 3: Clean Supabase
        console.log('Step 3/3: Supabase database...');
        await window.emergencyCleanSupabase();
        
        console.log('🎉 NUCLEAR CLEANUP COMPLETED - ALL DATA DELETED');
        console.log('🔄 Refresh the page to see clean state');
        
        return true;
        
    } catch (error) {
        console.error('❌ Nuclear cleanup failed:', error);
        return false;
    }
};

/**
 * Quick status check
 */
window.emergencyCheckStatus = async function() {
    console.log('🔍 Emergency: Checking data status...');
    
    try {
        // Check localStorage
        const localKeys = ['mci-active-deliveries', 'mci-delivery-history', 'mci-customers'];
        let localCount = 0;
        localKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    localCount += Array.isArray(parsed) ? parsed.length : 1;
                } catch {
                    localCount += 1;
                }
            }
        });
        console.log(`💾 localStorage items: ${localCount}`);
        
        // Check globals
        const globalCount = (window.activeDeliveries?.length || 0) + 
                           (window.deliveryHistory?.length || 0) + 
                           (window.customers?.length || 0);
        console.log(`🔄 Global variables items: ${globalCount}`);
        
        // Check Supabase
        if (window.supabaseClient) {
            const client = window.supabaseClient();
            
            const { count: deliveriesCount } = await client
                .from('deliveries')
                .select('*', { count: 'exact', head: true });
            
            const { count: customersCount } = await client
                .from('customers')
                .select('*', { count: 'exact', head: true });
            
            console.log(`📦 Supabase deliveries: ${deliveriesCount || 0}`);
            console.log(`👥 Supabase customers: ${customersCount || 0}`);
        } else {
            console.log('❌ Supabase client not available');
        }
        
        const totalItems = localCount + globalCount + (deliveriesCount || 0) + (customersCount || 0);
        console.log(`📊 Total data items: ${totalItems}`);
        
        return {
            localStorage: localCount,
            globals: globalCount,
            supabaseDeliveries: deliveriesCount || 0,
            supabaseCustomers: customersCount || 0,
            total: totalItems
        };
        
    } catch (error) {
        console.error('❌ Error checking status:', error);
        return null;
    }
};

// Show available functions
console.log('🔧 Available Emergency Functions:');
console.log('  emergencyCleanLocalStorage() - Clean browser storage');
console.log('  emergencyCleanGlobals() - Clean memory variables');
console.log('  emergencyCleanSupabase() - Clean database');
console.log('  emergencyNuclearCleanup() - Clean EVERYTHING');
console.log('  emergencyCheckStatus() - Check current data');
console.log('');
console.log('💡 Example usage:');
console.log('  await emergencyCheckStatus()');
console.log('  emergencyCleanLocalStorage()');
console.log('  await emergencyNuclearCleanup()');