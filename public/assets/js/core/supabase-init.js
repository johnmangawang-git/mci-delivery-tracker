/**
 * GLOBAL SUPABASE INITIALIZATION
 * Ensures Supabase client is always available before any dependent scripts run
 * Prevents all "createClient not available" and "Supabase client not available" errors
 */

console.log('🚀 Loading Global Supabase Initializer...');

// Global configuration
const SUPABASE_CONFIG = {
    url: 'https://ntyvrezyhrmflswxefbk.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4',
    maxRetries: 10,
    retryDelay: 300
};

/**
 * Ensure Supabase client is ready with comprehensive retry logic
 */
async function ensureSupabaseClientReady(retries = SUPABASE_CONFIG.maxRetries) {
    console.log(`🔍 Checking Supabase client (attempt ${SUPABASE_CONFIG.maxRetries - retries + 1}/${SUPABASE_CONFIG.maxRetries})...`);
    
    try {
        // If Supabase client already exists and is functional, return it
        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ Supabase client already initialized and functional');
            return window.supabase;
        }
        
        // Check multiple possible locations for createClient
        let createClient = null;
        
        // Method 1: Check window.supabase.createClient
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            createClient = window.supabase.createClient;
            console.log('📍 Found createClient at window.supabase.createClient');
        }
        // Method 2: Check global createClient
        else if (typeof window.createClient === 'function') {
            createClient = window.createClient;
            console.log('📍 Found createClient at window.createClient');
        }
        // Method 3: Check if supabase is available globally
        else if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            createClient = supabase.createClient;
            console.log('📍 Found createClient at global supabase.createClient');
        }
        // Method 4: Check if createClient is available globally
        else if (typeof createClient !== 'undefined') {
            console.log('📍 Found global createClient function');
            // createClient is already available
        }
        
        // If no createClient found, wait and retry
        if (!createClient) {
            if (retries > 0) {
                console.warn(`⏳ Supabase createClient not available yet, retrying in ${SUPABASE_CONFIG.retryDelay}ms... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, SUPABASE_CONFIG.retryDelay));
                return ensureSupabaseClientReady(retries - 1);
            } else {
                throw new Error('Supabase createClient not available after all retries');
            }
        }
        
        // Create the client
        console.log('🔧 Creating Supabase client...');
        const client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key, {
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
        
        // Validate the client
        if (!client || typeof client.from !== 'function') {
            throw new Error('Created client is invalid or missing required methods');
        }
        
        // Store globally with multiple access patterns
        window.supabase = client;
        window.supabaseClient = () => client;
        window.getSupabaseClient = () => client;
        window.supabaseGlobalClient = client;
        
        // Set initialization flags
        window.supabaseClientInitialized = true;
        window.supabaseReady = true;
        
        console.log('✅ Supabase client initialized globally and ready');
        console.log('📊 Available methods:', Object.keys(client));
        
        // Test the client
        try {
            const testQuery = client.from('deliveries').select('count', { count: 'exact', head: true });
            console.log('🧪 Client test query created successfully');
        } catch (testError) {
            console.warn('⚠️ Client test failed, but client appears functional:', testError.message);
        }
        
        return client;
        
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        
        if (retries > 0) {
            console.warn(`🔄 Retrying Supabase initialization in ${SUPABASE_CONFIG.retryDelay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, SUPABASE_CONFIG.retryDelay));
            return ensureSupabaseClientReady(retries - 1);
        } else {
            throw new Error(`Supabase initialization failed after ${SUPABASE_CONFIG.maxRetries} attempts: ${error.message}`);
        }
    }
}

/**
 * Safe Supabase client getter with automatic initialization
 */
async function getSafeSupabaseClient() {
    if (window.supabase && typeof window.supabase.from === 'function') {
        return window.supabase;
    }
    
    return await ensureSupabaseClientReady();
}

/**
 * Wait for Supabase to be ready (for use in other modules)
 */
function waitForSupabase(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkReady = () => {
            if (window.supabase && typeof window.supabase.from === 'function') {
                resolve(window.supabase);
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout waiting for Supabase to be ready'));
                return;
            }
            
            setTimeout(checkReady, 100);
        };
        
        checkReady();
    });
}

/**
 * Initialize Supabase immediately
 */
async function initializeSupabaseGlobally() {
    console.log('🚀 Starting global Supabase initialization...');
    
    try {
        const client = await ensureSupabaseClientReady();
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('supabaseReady', { 
            detail: { client } 
        }));
        
        console.log('🎉 Global Supabase initialization complete!');
        return client;
        
    } catch (error) {
        console.error('💥 Global Supabase initialization failed:', error);
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('supabaseError', { 
            detail: { error } 
        }));
        
        throw error;
    }
}

// Export functions globally
window.ensureSupabaseClientReady = ensureSupabaseClientReady;
window.getSafeSupabaseClient = getSafeSupabaseClient;
window.waitForSupabase = waitForSupabase;
window.initializeSupabaseGlobally = initializeSupabaseGlobally;

// Initialize immediately when script loads
(async () => {
    try {
        await initializeSupabaseGlobally();
    } catch (error) {
        console.error('❌ Failed to initialize Supabase on script load:', error);
    }
})();

// Also initialize on DOM ready as backup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.supabaseReady) {
            console.log('🔄 Backup Supabase initialization on DOM ready...');
            try {
                await initializeSupabaseGlobally();
            } catch (error) {
                console.error('❌ Backup initialization failed:', error);
            }
        }
    });
} else if (!window.supabaseReady) {
    // DOM already ready, initialize now
    setTimeout(async () => {
        console.log('🔄 Late Supabase initialization...');
        try {
            await initializeSupabaseGlobally();
        } catch (error) {
            console.error('❌ Late initialization failed:', error);
        }
    }, 100);
}

console.log('✅ Global Supabase Initializer loaded');