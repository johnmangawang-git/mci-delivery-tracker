/**
 * SUPABASE CLIENT COMPREHENSIVE FIX
 * Fixes createClient function availability and 400 Bad Request issues
 * Ensures proper client initialization before any Supabase operations
 */

console.log('🔧 Loading Supabase Client Comprehensive Fix...');

// Configuration
const SUPABASE_CONFIG = {
    url: 'https://ntyvrezyhrmflswxefbk.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4',
    maxRetries: 15,
    retryDelay: 200
};

/**
 * Ensure createClient function is available
 */
function ensureCreateClientAvailable(retries = SUPABASE_CONFIG.maxRetries) {
    console.log(`🔍 Checking createClient availability (attempt ${SUPABASE_CONFIG.maxRetries - retries + 1}/${SUPABASE_CONFIG.maxRetries})...`);
    
    // Method 1: Check if window.supabase has createClient (UMD version)
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        console.log('✅ Found createClient in window.supabase (UMD)');
        window.createClient = window.supabase.createClient;
        return window.supabase.createClient;
    }
    
    // Method 2: Check if global createClient exists
    if (typeof window.createClient === 'function') {
        console.log('✅ Found global createClient function');
        return window.createClient;
    }
    
    // Method 3: Check if supabase global exists with createClient
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        console.log('✅ Found createClient in global supabase');
        window.createClient = supabase.createClient;
        return supabase.createClient;
    }
    
    // Method 4: Try to extract from window.supabase if it's a client instance
    if (window.supabase && typeof window.supabase.from === 'function') {
        console.log('✅ window.supabase is already a client instance');
        return null; // Client already exists, no need for createClient
    }
    
    // If not found and retries left, wait and try again
    if (retries > 0) {
        console.warn(`⏳ createClient not found, retrying in ${SUPABASE_CONFIG.retryDelay}ms... (${retries} attempts left)`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(ensureCreateClientAvailable(retries - 1));
            }, SUPABASE_CONFIG.retryDelay);
        });
    }
    
    console.error('❌ createClient function not available after all retries');
    return null;
}

/**
 * Initialize Supabase client with proper validation
 */
async function initializeSupabaseClient() {
    console.log('🚀 Initializing Supabase client...');
    
    try {
        // Check if client already exists and is valid
        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ Supabase client already initialized');
            return window.supabase;
        }
        
        // Ensure createClient is available
        const createClient = await ensureCreateClientAvailable();
        
        if (!createClient) {
            // If createClient not found but window.supabase exists, it might already be a client
            if (window.supabase && typeof window.supabase.from === 'function') {
                console.log('✅ Using existing Supabase client instance');
                return window.supabase;
            }
            throw new Error('createClient function not available and no existing client found');
        }
        
        // Create the client
        console.log('🔧 Creating new Supabase client...');
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
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                }
            }
        });
        
        // Validate the client
        if (!client || typeof client.from !== 'function') {
            throw new Error('Created client is invalid or missing required methods');
        }
        
        // Store globally
        window.supabase = client;
        window.supabaseClient = () => client;
        window.getSupabaseClient = () => client;
        window.supabaseGlobalClient = client;
        
        // Set flags
        window.supabaseClientInitialized = true;
        window.supabaseReady = true;
        
        console.log('✅ Supabase client initialized successfully');
        console.log('📊 Client methods:', Object.keys(client));
        
        return client;
        
    } catch (error) {
        console.error('❌ Supabase client initialization failed:', error);
        throw error;
    }
}

/**
 * Validate delivery record before insert/update
 */
function validateDeliveryRecord(record) {
    console.log('🔍 Validating delivery record...', record);
    
    const errors = [];
    
    // Required fields validation
    if (!record.dr_number || typeof record.dr_number !== 'string' || record.dr_number.trim() === '') {
        errors.push('dr_number is required and must be a non-empty string');
    }
    
    if (!record.customer_name || typeof record.customer_name !== 'string' || record.customer_name.trim() === '') {
        errors.push('customer_name is required and must be a non-empty string');
    }
    
    // Optional but validated fields
    if (record.status && typeof record.status !== 'string') {
        errors.push('status must be a string if provided');
    }
    
    if (record.additional_costs !== undefined && (isNaN(record.additional_costs) || record.additional_costs < 0)) {
        errors.push('additional_costs must be a non-negative number if provided');
    }
    
    // Date validation
    if (record.created_at && !isValidDate(record.created_at)) {
        errors.push('created_at must be a valid ISO date string if provided');
    }
    
    if (record.updated_at && !isValidDate(record.updated_at)) {
        errors.push('updated_at must be a valid ISO date string if provided');
    }
    
    // Clean up the record
    const cleanRecord = {
        ...record,
        dr_number: record.dr_number?.toString().trim(),
        customer_name: record.customer_name?.toString().trim(),
        status: record.status || 'Active',
        additional_costs: parseFloat(record.additional_costs) || 0,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    if (errors.length > 0) {
        console.error('❌ Delivery record validation failed:', errors);
        return { valid: false, errors, record: null };
    }
    
    console.log('✅ Delivery record validation passed');
    return { valid: true, errors: [], record: cleanRecord };
}

/**
 * Safe delivery insert with validation
 */
async function safeInsertDelivery(record) {
    console.log('💾 Safe delivery insert...', record);
    
    try {
        // Ensure client is ready
        const client = await initializeSupabaseClient();
        
        // Validate record
        const validation = validateDeliveryRecord(record);
        if (!validation.valid) {
            return { 
                data: null, 
                error: { 
                    message: 'Validation failed: ' + validation.errors.join(', '),
                    details: validation.errors 
                } 
            };
        }
        
        // Perform insert
        console.log('📤 Inserting validated record...', validation.record);
        const { data, error } = await client
            .from('deliveries')
            .insert([validation.record])
            .select('*');
        
        if (error) {
            console.error('❌ Supabase insert error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Delivery inserted successfully:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe insert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Safe delivery upsert with validation
 */
async function safeUpsertDelivery(record) {
    console.log('🔄 Safe delivery upsert...', record);
    
    try {
        // Ensure client is ready
        const client = await initializeSupabaseClient();
        
        // Validate record
        const validation = validateDeliveryRecord(record);
        if (!validation.valid) {
            return { 
                data: null, 
                error: { 
                    message: 'Validation failed: ' + validation.errors.join(', '),
                    details: validation.errors 
                } 
            };
        }
        
        // Perform upsert
        console.log('🔄 Upserting validated record...', validation.record);
        const { data, error } = await client
            .from('deliveries')
            .upsert([validation.record], { 
                onConflict: 'dr_number',
                ignoreDuplicates: false 
            })
            .select('*');
        
        if (error) {
            console.error('❌ Supabase upsert error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Delivery upserted successfully:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe upsert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Utility function to validate date strings
 */
function isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Initialize everything
 */
async function initializeSupabaseClientFix() {
    console.log('🚀 Initializing Supabase Client Fix...');
    
    try {
        // Initialize client
        await initializeSupabaseClient();
        
        // Export functions globally
        window.initializeSupabaseClient = initializeSupabaseClient;
        window.safeInsertDelivery = safeInsertDelivery;
        window.safeUpsertDelivery = safeUpsertDelivery;
        window.validateDeliveryRecord = validateDeliveryRecord;
        window.ensureCreateClientAvailable = ensureCreateClientAvailable;
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('supabaseClientReady', {
            detail: { client: window.supabase }
        }));
        
        console.log('✅ Supabase Client Fix initialized successfully');
        
    } catch (error) {
        console.error('❌ Supabase Client Fix initialization failed:', error);
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('supabaseClientError', {
            detail: { error }
        }));
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseClientFix);
} else {
    initializeSupabaseClientFix();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.supabaseClientInitialized) {
        console.log('🔄 Backup Supabase Client Fix initialization...');
        initializeSupabaseClientFix();
    }
});

console.log('✅ Supabase Client Comprehensive Fix loaded');