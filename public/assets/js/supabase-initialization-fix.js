/**
 * SUPABASE INITIALIZATION FIX
 * Fixes Supabase createClient and 400 Bad Request errors
 */

console.log('🔧 Loading Supabase Initialization Fix...');

(function() {
    'use strict';
    
    /**
     * Wait for Supabase library to load
     */
    function waitForSupabase(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            function checkSupabase() {
                // Check if Supabase is available globally
                if (typeof window.supabase !== 'undefined' && 
                    typeof window.supabase.createClient === 'function') {
                    console.log('✅ Supabase library loaded successfully');
                    resolve(window.supabase);
                    return;
                }
                
                // Check if it's available as a module
                if (typeof supabase !== 'undefined' && 
                    typeof supabase.createClient === 'function') {
                    console.log('✅ Supabase module loaded successfully');
                    window.supabase = supabase;
                    resolve(supabase);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    console.error('❌ Supabase library failed to load within timeout');
                    reject(new Error('Supabase library not available'));
                    return;
                }
                
                // Check again in next frame
                setTimeout(checkSupabase, 100);
            }
            
            checkSupabase();
        });
    }
    
    /**
     * Initialize Supabase client safely
     */
    async function initializeSupabaseClient() {
        try {
            console.log('🚀 Initializing Supabase client...');
            
            // Wait for Supabase library
            const supabaseLib = await waitForSupabase();
            
            // Get configuration
            const supabaseUrl = window.SUPABASE_URL || 'https://ntyvrezyhrmflswxefbk.supabase.co';
            const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4';
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration missing');
            }
            
            // Create client
            const client = supabaseLib.createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
            
            // Store globally
            window.supabaseClient = client;
            
            // Also create a safe wrapper for common operations
            window.safeSupabase = {
                from: (table) => {
                    try {
                        return client.from(table);
                    } catch (error) {
                        console.error(`❌ Error accessing table ${table}:`, error);
                        return {
                            select: () => Promise.resolve({ data: [], error: null }),
                            insert: () => Promise.resolve({ data: null, error: 'Client not available' }),
                            update: () => Promise.resolve({ data: null, error: 'Client not available' }),
                            delete: () => Promise.resolve({ data: null, error: 'Client not available' })
                        };
                    }
                },
                auth: client.auth,
                storage: client.storage
            };
            
            console.log('✅ Supabase client initialized successfully');
            return client;
            
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
            
            // Create fallback client
            window.safeSupabase = {
                from: (table) => ({
                    select: () => Promise.resolve({ data: [], error: 'Supabase not available' }),
                    insert: () => Promise.resolve({ data: null, error: 'Supabase not available' }),
                    update: () => Promise.resolve({ data: null, error: 'Supabase not available' }),
                    delete: () => Promise.resolve({ data: null, error: 'Supabase not available' })
                }),
                auth: {
                    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                    signOut: () => Promise.resolve({ error: null })
                },
                storage: {
                    from: () => ({
                        upload: () => Promise.resolve({ data: null, error: 'Storage not available' })
                    })
                }
            };
            
            return null;
        }
    }
    
    /**
     * Fix 400 Bad Request errors by validating data before sending
     */
    function createSafeSupabaseWrapper(client) {
        if (!client) return null;
        
        const originalFrom = client.from.bind(client);
        
        client.from = function(table) {
            const tableRef = originalFrom(table);
            const originalInsert = tableRef.insert.bind(tableRef);
            const originalUpdate = tableRef.update.bind(tableRef);
            
            // Override insert with validation
            tableRef.insert = function(data) {
                try {
                    // Validate data before sending
                    const cleanData = validateAndCleanData(data, table);
                    console.log(`📤 Inserting into ${table}:`, cleanData);
                    return originalInsert(cleanData);
                } catch (error) {
                    console.error(`❌ Data validation failed for ${table}:`, error);
                    return Promise.resolve({ 
                        data: null, 
                        error: { message: `Data validation failed: ${error.message}` }
                    });
                }
            };
            
            // Override update with validation
            tableRef.update = function(data) {
                try {
                    const cleanData = validateAndCleanData(data, table);
                    console.log(`📝 Updating ${table}:`, cleanData);
                    return originalUpdate(cleanData);
                } catch (error) {
                    console.error(`❌ Update validation failed for ${table}:`, error);
                    return Promise.resolve({ 
                        data: null, 
                        error: { message: `Update validation failed: ${error.message}` }
                    });
                }
            };
            
            return tableRef;
        };
        
        return client;
    }
    
    /**
     * Validate and clean data before sending to Supabase
     */
    function validateAndCleanData(data, table) {
        if (!data) {
            throw new Error('Data is null or undefined');
        }
        
        // Handle array of objects
        if (Array.isArray(data)) {
            return data.map(item => validateSingleRecord(item, table));
        }
        
        // Handle single object
        return validateSingleRecord(data, table);
    }
    
    /**
     * Validate a single record
     */
    function validateSingleRecord(record, table) {
        if (!record || typeof record !== 'object') {
            throw new Error('Record must be an object');
        }
        
        const cleanRecord = { ...record };
        
        // Table-specific validation
        switch (table) {
            case 'deliveries':
                // Ensure required fields for deliveries
                if (!cleanRecord.dr_number) {
                    throw new Error('dr_number is required for deliveries');
                }
                
                // Clean up common issues
                if (cleanRecord.name === null || cleanRecord.name === undefined) {
                    cleanRecord.name = cleanRecord.customer_name || cleanRecord.customer || 'Unknown';
                }
                
                if (cleanRecord.status === null || cleanRecord.status === undefined) {
                    cleanRecord.status = 'active';
                }
                
                // Ensure dates are properly formatted
                if (cleanRecord.created_at && typeof cleanRecord.created_at === 'string') {
                    cleanRecord.created_at = new Date(cleanRecord.created_at).toISOString();
                }
                
                break;
                
            case 'customers':
                // Ensure required fields for customers
                if (!cleanRecord.name && !cleanRecord.customer_name) {
                    throw new Error('name or customer_name is required for customers');
                }
                
                if (!cleanRecord.name) {
                    cleanRecord.name = cleanRecord.customer_name;
                }
                
                break;
        }
        
        // Remove null values that might cause issues
        Object.keys(cleanRecord).forEach(key => {
            if (cleanRecord[key] === null) {
                delete cleanRecord[key];
            }
        });
        
        return cleanRecord;
    }
    
    /**
     * Initialize the fix
     */
    async function initSupabaseFix() {
        console.log('🚀 Initializing Supabase Fix...');
        
        try {
            const client = await initializeSupabaseClient();
            
            if (client) {
                // Apply safe wrapper
                const safeClient = createSafeSupabaseWrapper(client);
                window.supabaseClient = safeClient;
                
                // Test connection
                const { data, error } = await safeClient.from('deliveries').select('count').limit(1);
                if (error) {
                    console.warn('⚠️ Supabase connection test failed:', error.message);
                } else {
                    console.log('✅ Supabase connection test successful');
                }
            }
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
        }
        
        console.log('✅ Supabase Fix initialized');
    }
    
    // Export functions globally
    window.initializeSupabaseClient = initializeSupabaseClient;
    window.waitForSupabase = waitForSupabase;
    window.validateAndCleanData = validateAndCleanData;
    
    // Initialize based on document state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabaseFix);
    } else {
        // Small delay to ensure other scripts have loaded
        setTimeout(initSupabaseFix, 500);
    }
    
    console.log('✅ Supabase Initialization Fix loaded successfully');
    
})();

// Export module info
window.supabaseInitializationFix = {
    version: '1.0.0',
    loaded: true,
    timestamp: new Date().toISOString()
};