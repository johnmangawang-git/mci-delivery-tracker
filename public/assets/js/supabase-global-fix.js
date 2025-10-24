/**
 * SUPABASE GLOBAL FIX
 * Updates all existing modules to use the global Supabase initialization
 * Prevents "createClient not available" errors across all files
 */

console.log('🔧 Loading Supabase Global Fix...');

/**
 * Patch existing functions to wait for Supabase
 */
async function patchSupabaseDependentFunctions() {
    console.log('🔄 Patching Supabase-dependent functions...');
    
    // Wait for Supabase to be ready
    try {
        await window.waitForSupabase(15000); // 15 second timeout
        console.log('✅ Supabase is ready, applying patches...');
    } catch (error) {
        console.error('❌ Supabase not ready, applying fallback patches:', error);
    }
    
    // Patch console-errors-comprehensive-fix.js functions
    if (window.ensureSupabaseClient) {
        const originalEnsureSupabaseClient = window.ensureSupabaseClient;
        window.ensureSupabaseClient = async function() {
            try {
                return await window.getSafeSupabaseClient();
            } catch (error) {
                console.warn('⚠️ Falling back to original ensureSupabaseClient');
                return originalEnsureSupabaseClient();
            }
        };
    }
    
    // Patch dataService functions
    if (window.dataService && window.dataService.saveDelivery) {
        const originalSaveDelivery = window.dataService.saveDelivery;
        window.dataService.saveDelivery = async function(deliveryData) {
            try {
                await window.getSafeSupabaseClient();
                return await originalSaveDelivery.call(this, deliveryData);
            } catch (error) {
                console.error('❌ DataService saveDelivery failed:', error);
                throw error;
            }
        };
    }
    
    // Patch any other Supabase-dependent functions
    const supabaseDependentFunctions = [
        'loadActiveDeliveries',
        'loadDeliveryHistory',
        'loadCustomers',
        'updateDeliveryStatus'
    ];
    
    supabaseDependentFunctions.forEach(funcName => {
        if (window[funcName] && typeof window[funcName] === 'function') {
            const originalFunc = window[funcName];
            window[funcName] = async function(...args) {
                try {
                    await window.getSafeSupabaseClient();
                    return await originalFunc.apply(this, args);
                } catch (error) {
                    console.error(`❌ ${funcName} failed:`, error);
                    throw error;
                }
            };
        }
    });
    
    console.log('✅ Supabase-dependent functions patched');
}

/**
 * Override problematic Supabase access patterns
 */
function overrideSupabaseAccessPatterns() {
    console.log('🔄 Overriding Supabase access patterns...');
    
    // Ensure window.supabaseClient always returns the global client
    window.supabaseClient = function() {
        if (window.supabase && typeof window.supabase.from === 'function') {
            return window.supabase;
        }
        console.warn('⚠️ Supabase client not ready, attempting to initialize...');
        window.getSafeSupabaseClient().then(client => {
            console.log('✅ Supabase client initialized asynchronously');
        }).catch(error => {
            console.error('❌ Failed to initialize Supabase client:', error);
        });
        return null;
    };
    
    // Ensure getSupabaseClient is available
    if (!window.getSupabaseClient) {
        window.getSupabaseClient = function() {
            return window.supabase;
        };
    }
    
    // Create safe async wrapper for Supabase operations
    window.withSupabase = async function(operation) {
        try {
            const client = await window.getSafeSupabaseClient();
            return await operation(client);
        } catch (error) {
            console.error('❌ Supabase operation failed:', error);
            throw error;
        }
    };
    
    console.log('✅ Supabase access patterns overridden');
}

/**
 * Add global error handling for Supabase operations
 */
function addGlobalSupabaseErrorHandling() {
    console.log('🛡️ Adding global Supabase error handling...');
    
    // Listen for Supabase ready event
    window.addEventListener('supabaseReady', (event) => {
        console.log('🎉 Supabase ready event received:', event.detail);
        
        // Trigger any pending operations
        if (window.pendingSupabaseOperations) {
            window.pendingSupabaseOperations.forEach(operation => {
                try {
                    operation();
                } catch (error) {
                    console.error('❌ Pending Supabase operation failed:', error);
                }
            });
            window.pendingSupabaseOperations = [];
        }
    });
    
    // Listen for Supabase error event
    window.addEventListener('supabaseError', (event) => {
        console.error('💥 Supabase error event received:', event.detail);
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast('Database connection issue. Please refresh the page.', 'error');
        }
    });
    
    // Queue for operations that need to wait for Supabase
    window.pendingSupabaseOperations = window.pendingSupabaseOperations || [];
    
    // Helper function to queue operations
    window.queueSupabaseOperation = function(operation) {
        if (window.supabase && typeof window.supabase.from === 'function') {
            // Supabase is ready, execute immediately
            operation();
        } else {
            // Queue for later execution
            window.pendingSupabaseOperations.push(operation);
        }
    };
    
    console.log('✅ Global Supabase error handling added');
}

/**
 * Initialize all fixes
 */
async function initializeSupabaseGlobalFix() {
    console.log('🚀 Initializing Supabase Global Fix...');
    
    try {
        // Step 1: Override access patterns
        overrideSupabaseAccessPatterns();
        
        // Step 2: Add error handling
        addGlobalSupabaseErrorHandling();
        
        // Step 3: Wait a bit for other scripts to load, then patch
        setTimeout(async () => {
            await patchSupabaseDependentFunctions();
        }, 1000);
        
        console.log('✅ Supabase Global Fix initialized');
        
    } catch (error) {
        console.error('❌ Supabase Global Fix initialization failed:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseGlobalFix);
} else {
    initializeSupabaseGlobalFix();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.supabaseGlobalFixInitialized) {
        console.log('🔄 Backup Supabase Global Fix initialization...');
        initializeSupabaseGlobalFix();
        window.supabaseGlobalFixInitialized = true;
    }
});

console.log('✅ Supabase Global Fix loaded');