/**
 * SUPABASE PERMANENT FIX
 * Permanently fixes all Supabase initialization and runtime errors
 * 
 * Fixes:
 * 1. window.supabase.from is not a function
 * 2. 406 (Not Acceptable) errors with proper filtering
 * 3. initEPod undefined function
 * 4. Duplicate initialization conflicts
 */

console.log('🔧 Loading Supabase Permanent Fix...');

// ========================================
// 1. CORE SUPABASE INITIALIZATION
// ========================================

/**
 * Initialize Supabase client once and make it globally available
 */
function initializeSupabaseClient() {
    console.log('🚀 Initializing Supabase client...');
    
    // Prevent duplicate initialization
    if (window.supabaseClientInitialized) {
        console.log('✅ Supabase already initialized, skipping');
        return window.supabaseGlobalClient;
    }
    
    try {
        // Check if Supabase library is loaded
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded from CDN');
            return null;
        }
        
        // Check if createClient is available
        if (typeof window.supabase.createClient !== 'function') {
            console.error('❌ Supabase createClient function not available');
            return null;
        }
        
        // Get credentials
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseKey = window.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Supabase credentials not found');
            console.error('SUPABASE_URL:', supabaseUrl);
            console.error('SUPABASE_ANON_KEY:', supabaseKey ? '[PRESENT]' : '[MISSING]');
            return null;
        }
        
        // Create the client
        console.log('🔧 Creating Supabase client with URL:', supabaseUrl);
        const client = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        });
        
        // Store globally
        window.supabaseGlobalClient = client;
        window.supabaseClientInitialized = true;
        
        // Create compatibility functions
        window.supabaseClient = () => client;
        window.getSupabaseClient = () => client;
        
        console.log('✅ Supabase client initialized successfully');
        console.log('📊 Client methods available:', Object.keys(client));
        
        return client;
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        return null;
    }
}

// ========================================
// 2. SAFE SUPABASE OPERATIONS
// ========================================

/**
 * Safe Supabase query with proper error handling and filtering
 */
async function safeSupabaseQuery(tableName, options = {}) {
    console.log(`🔍 Safe Supabase query: ${tableName}`, options);
    
    try {
        const client = window.supabaseGlobalClient || initializeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        let query = client.from(tableName);
        
        // Apply select
        if (options.select) {
            query = query.select(options.select);
        } else {
            query = query.select('*');
        }
        
        // Apply filters with proper data type handling
        if (options.filters) {
            for (const [column, value] of Object.entries(options.filters)) {
                // Handle different data types properly
                if (typeof value === 'string') {
                    query = query.eq(column, value);
                } else if (typeof value === 'number') {
                    // Convert number to string for text columns
                    query = query.eq(column, value.toString());
                } else {
                    query = query.eq(column, value);
                }
            }
        }
        
        // Apply ordering
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { 
                ascending: options.orderBy.ascending !== false 
            });
        }
        
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
            console.error(`❌ Supabase query failed for ${tableName}:`, error);
            
            // Handle specific error types
            if (error.code === 'PGRST116') {
                console.log('📝 No rows found (this is normal)');
                return { data: [], error: null };
            } else if (error.code === '406' || error.message.includes('Not Acceptable')) {
                console.error('❌ 406 Error - Invalid filter or column name');
                console.error('Query details:', { tableName, options });
            }
            
            throw error;
        }
        
        console.log(`✅ Query successful: ${tableName} returned ${data?.length || 0} rows`);
        return { data, error: null };
        
    } catch (error) {
        console.error(`❌ Safe query failed for ${tableName}:`, error);
        return { data: null, error };
    }
}

/**
 * Safe Supabase insert/upsert with conflict handling
 */
async function safeSupabaseUpsert(tableName, data, options = {}) {
    console.log(`💾 Safe Supabase upsert: ${tableName}`, data);
    
    try {
        const client = window.supabaseGlobalClient || initializeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        let query;
        
        if (options.upsert) {
            // Use upsert for conflict resolution
            query = client.from(tableName).upsert(data);
        } else {
            // Try insert first, handle conflicts
            query = client.from(tableName).insert(data);
        }
        
        if (options.select) {
            query = query.select(options.select);
        } else {
            query = query.select();
        }
        
        const result = await query;
        
        if (result.error) {
            // Handle 409 conflicts by switching to upsert
            if (result.error.code === '23505' || result.error.message.includes('duplicate')) {
                console.log('🔄 Conflict detected, switching to upsert...');
                const upsertResult = await client.from(tableName).upsert(data).select();
                return upsertResult;
            }
            
            console.error(`❌ Upsert failed for ${tableName}:`, result.error);
            throw result.error;
        }
        
        console.log(`✅ Upsert successful: ${tableName}`);
        return result;
        
    } catch (error) {
        console.error(`❌ Safe upsert failed for ${tableName}:`, error);
        return { data: null, error };
    }
}

// ========================================
// 3. EPOD INITIALIZATION FIX
// ========================================

/**
 * Initialize E-POD functionality
 */
function initEPod() {
    console.log('📋 Initializing E-POD functionality...');
    
    try {
        // Check if E-POD container exists
        const epodContainer = document.getElementById('e-pod');
        if (!epodContainer) {
            console.log('📋 E-POD container not found, skipping initialization');
            return;
        }
        
        // Initialize E-POD specific functionality
        console.log('📋 E-POD container found, setting up functionality...');
        
        // Load E-POD deliveries if function exists
        if (typeof window.loadEPodDeliveries === 'function') {
            window.loadEPodDeliveries();
        } else {
            console.log('📋 loadEPodDeliveries function not found, using fallback');
            // Fallback: load active deliveries for E-POD
            if (typeof window.loadActiveDeliveries === 'function') {
                window.loadActiveDeliveries();
            }
        }
        
        // Set up signature functionality
        if (typeof window.initSignaturePad === 'function') {
            window.initSignaturePad();
        }
        
        console.log('✅ E-POD initialization completed');
        
    } catch (error) {
        console.error('❌ E-POD initialization failed:', error);
    }
}

// ========================================
// 4. GLOBAL ERROR HANDLING
// ========================================

/**
 * Set up global error handling for Supabase operations
 */
function setupSupabaseErrorHandling() {
    console.log('🛡️ Setting up Supabase error handling...');
    
    // Handle unhandled promise rejections from Supabase
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message) {
            const message = event.reason.message;
            
            // Handle Supabase-specific errors
            if (message.includes('supabase') || message.includes('PGRST')) {
                console.error('🔥 Supabase unhandled error:', event.reason);
                
                // Handle 406 errors specifically
                if (message.includes('406') || message.includes('Not Acceptable')) {
                    console.error('❌ 406 Error detected - likely invalid filter or column name');
                    console.error('Check your Supabase queries for proper column names and data types');
                }
                
                // Prevent default error handling for known Supabase issues
                event.preventDefault();
            }
        }
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message) {
            const message = event.error.message;
            
            // Handle Supabase initialization errors
            if (message.includes('window.supabase.from is not a function')) {
                console.error('❌ Supabase client not properly initialized');
                console.log('🔄 Attempting to reinitialize Supabase client...');
                
                // Try to reinitialize
                setTimeout(() => {
                    initializeSupabaseClient();
                }, 1000);
                
                event.preventDefault();
            }
        }
    });
}

// ========================================
// 5. COMPATIBILITY LAYER
// ========================================

/**
 * Create compatibility functions for existing code
 */
function createCompatibilityLayer() {
    console.log('🔗 Creating compatibility layer...');
    
    // Ensure window.supabase points to our initialized client
    if (window.supabaseGlobalClient && !window.supabase.from) {
        window.supabase = window.supabaseGlobalClient;
    }
    
    // Create safe wrapper functions
    window.safeSupabaseQuery = safeSupabaseQuery;
    window.safeSupabaseUpsert = safeSupabaseUpsert;
    
    // Override problematic functions with safe versions
    if (window.supabaseGlobalClient) {
        const originalFrom = window.supabaseGlobalClient.from;
        window.supabaseGlobalClient.from = function(tableName) {
            try {
                return originalFrom.call(this, tableName);
            } catch (error) {
                console.error(`❌ Error accessing table ${tableName}:`, error);
                throw error;
            }
        };
    }
    
    console.log('✅ Compatibility layer created');
}

// ========================================
// 6. INITIALIZATION SEQUENCE
// ========================================

/**
 * Initialize everything in the correct order
 */
function initializeSupabasePermanentFix() {
    console.log('🚀 Starting Supabase Permanent Fix initialization...');
    
    // Step 1: Set up error handling first
    setupSupabaseErrorHandling();
    
    // Step 2: Initialize Supabase client
    const client = initializeSupabaseClient();
    
    // Step 3: Create compatibility layer
    if (client) {
        createCompatibilityLayer();
    }
    
    // Step 4: Make initEPod available globally
    window.initEPod = initEPod;
    
    // Step 5: Export all functions globally
    window.initializeSupabaseClient = initializeSupabaseClient;
    window.safeSupabaseQuery = safeSupabaseQuery;
    window.safeSupabaseUpsert = safeSupabaseUpsert;
    window.setupSupabaseErrorHandling = setupSupabaseErrorHandling;
    
    console.log('✅ Supabase Permanent Fix initialization completed');
    
    // Log current state
    console.log('📊 Current Supabase state:');
    console.log('- window.supabase available:', typeof window.supabase !== 'undefined');
    console.log('- window.supabase.from available:', typeof window.supabase?.from === 'function');
    console.log('- window.supabaseGlobalClient available:', typeof window.supabaseGlobalClient !== 'undefined');
    console.log('- window.initEPod available:', typeof window.initEPod === 'function');
}

// ========================================
// 7. AUTO-INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabasePermanentFix);
} else {
    // DOM already loaded
    initializeSupabasePermanentFix();
}

// Also initialize when Supabase library loads
window.addEventListener('load', () => {
    // Give a small delay to ensure all scripts are loaded
    setTimeout(() => {
        if (!window.supabaseClientInitialized) {
            console.log('🔄 Supabase not initialized yet, attempting initialization...');
            initializeSupabasePermanentFix();
        }
    }, 500);
});

console.log('✅ Supabase Permanent Fix loaded');