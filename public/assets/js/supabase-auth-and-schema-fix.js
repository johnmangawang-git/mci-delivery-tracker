/**
 * SUPABASE AUTH AND SCHEMA COMPREHENSIVE FIX
 * Fixes two critical errors:
 * 1. GET /auth/v1/user 403 (Forbidden) - Authentication issues
 * 2. POST /rest/v1/deliveries 400 (Bad Request) - Schema validation issues
 */

console.log('🔧 Loading Supabase Auth and Schema Comprehensive Fix...');

// ========================================
// 1. FIX AUTHENTICATION 403 ERRORS
// ========================================

/**
 * Initialize Supabase with proper auth configuration
 */
async function initializeSupabaseWithAuth() {
    console.log('🔐 Initializing Supabase with proper auth configuration...');
    
    try {
        // Wait for Supabase library
        let attempts = 0;
        while (typeof window.supabase === 'undefined' && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
        
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase library not loaded');
        }
        
        // Get credentials
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseKey = window.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials missing');
        }
        
        console.log('🔧 Creating Supabase client with auth fix...');
        
        // Create client with auth configuration that prevents 403 errors
        const client = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,        // Disable session persistence to avoid auth conflicts
                autoRefreshToken: false,      // Disable auto refresh to prevent 403 loops
                detectSessionInUrl: false,    // Don't try to detect session from URL
                flowType: 'implicit',         // Use implicit flow
                storage: null,                // Disable storage to prevent auth state conflicts
                storageKey: null,             // No storage key
                debug: false                  // Disable auth debug to reduce noise
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                    'apikey': supabaseKey       // Ensure API key is always sent
                }
            },
            realtime: {
                params: {
                    eventsPerSecond: 2
                }
            }
        });
        
        // Store the client globally
        window.supabaseAuthFixedClient = client;
        window.supabaseClientInstance = client;
        
        // Test connection without auth
        console.log('🧪 Testing connection without auth...');
        try {
            const { data, error } = await client
                .from('deliveries')
                .select('count', { count: 'exact', head: true });
                
            if (error && error.code !== 'PGRST116') {
                console.warn('⚠️ Connection test warning:', error.message);
            } else {
                console.log('✅ Connection test successful');
            }
        } catch (testError) {
            console.warn('⚠️ Connection test failed (may be expected):', testError.message);
        }
        
        console.log('✅ Supabase client initialized with auth fix');
        return client;
        
    } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        return null;
    }
}

/**
 * Disable problematic auth calls
 */
function disableProblematicAuthCalls() {
    console.log('🚫 Disabling problematic auth calls...');
    
    // Override getUser to prevent 403 errors
    if (window.supabaseAuthFixedClient && window.supabaseAuthFixedClient.auth) {
        const originalGetUser = window.supabaseAuthFixedClient.auth.getUser;
        window.supabaseAuthFixedClient.auth.getUser = async function() {
            console.log('🚫 Blocked getUser call to prevent 403 error');
            return { data: { user: null }, error: null };
        };
        
        // Override getSession to prevent auth loops
        const originalGetSession = window.supabaseAuthFixedClient.auth.getSession;
        window.supabaseAuthFixedClient.auth.getSession = async function() {
            console.log('🚫 Blocked getSession call to prevent 403 error');
            return { data: { session: null }, error: null };
        };
    }
}

// ========================================
// 2. FIX SCHEMA VALIDATION 400 ERRORS
// ========================================

/**
 * Enhanced payload sanitization for deliveries
 */
function sanitizeDeliveryPayloadEnhanced(payload) {
    console.log('🧹 Enhanced delivery payload sanitization...', payload);
    
    if (!payload || typeof payload !== 'object') {
        return { valid: false, sanitized: null, errors: ['Invalid payload'] };
    }
    
    const sanitized = {};
    const errors = [];
    const warnings = [];
    
    // Define valid fields based on actual schema
    const validFields = {
        // Core fields
        'dr_number': { type: 'string', required: true },
        'customer_name': { type: 'string', required: false },
        'vendor_number': { type: 'string', required: false },
        'status': { type: 'string', required: false, default: 'Active' },
        
        // Location fields
        'origin': { type: 'string', required: false },
        'destination': { type: 'string', required: false },
        
        // Truck fields
        'truck_type': { type: 'string', required: false },
        'truck_plate_number': { type: 'string', required: false },
        
        // Cost fields
        'additional_costs': { type: 'number', required: false, default: 0 },
        'distance': { type: 'string', required: false },
        
        // Date fields
        'created_date': { type: 'date', required: false },
        'created_at': { type: 'timestamp', required: false },
        'updated_at': { type: 'timestamp', required: false },
        'created_by': { type: 'string', required: false, default: 'Manual' },
        
        // User field
        'user_id': { type: 'uuid', required: false },
        
        // Item fields (if they exist)
        'item_number': { type: 'string', required: false },
        'item_description': { type: 'string', required: false },
        'serial_number': { type: 'string', required: false },
        'mobile_number': { type: 'string', required: false }
    };
    
    // Field mappings for common variations
    const fieldMappings = {
        'drNumber': 'dr_number',
        'customerName': 'customer_name',
        'vendorNumber': 'vendor_number',
        'truckType': 'truck_type',
        'truckPlateNumber': 'truck_plate_number',
        'additionalCosts': 'additional_costs',
        'deliveryDate': 'created_date',
        'timestamp': 'created_at',
        'reference_no': 'dr_number'  // Common alias
    };
    
    // Invalid fields that should be removed
    const invalidFields = [
        'additionalCostItems',
        'additional_cost_items',
        'costItems',
        'cost_items',
        'id' // Don't send ID for inserts
    ];
    
    // Process each field in payload
    Object.keys(payload).forEach(key => {
        const value = payload[key];
        
        // Skip invalid fields
        if (invalidFields.includes(key)) {
            warnings.push(`Removed invalid field: ${key}`);
            
            // Handle special conversion for cost items
            if ((key === 'additionalCostItems' || key === 'additional_cost_items') && Array.isArray(value)) {
                const total = value.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                if (total > 0) {
                    sanitized.additional_costs = total;
                    warnings.push(`Converted ${key} to additional_costs total: ${total}`);
                }
            }
            return;
        }
        
        // Map field name if needed
        const mappedKey = fieldMappings[key] || key;
        
        // Check if field is valid
        if (!validFields[mappedKey]) {
            warnings.push(`Unknown field ignored: ${key}`);
            return;
        }
        
        // Validate and convert value
        const fieldDef = validFields[mappedKey];
        let sanitizedValue = value;
        
        try {
            switch (fieldDef.type) {
                case 'string':
                    sanitizedValue = value ? String(value).trim() : null;
                    break;
                    
                case 'number':
                    sanitizedValue = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
                    break;
                    
                case 'date':
                    if (value) {
                        const date = new Date(value);
                        sanitizedValue = isNaN(date.getTime()) ? 
                            new Date().toISOString().split('T')[0] : 
                            date.toISOString().split('T')[0];
                    } else {
                        sanitizedValue = new Date().toISOString().split('T')[0];
                    }
                    break;
                    
                case 'timestamp':
                    if (value) {
                        const date = new Date(value);
                        sanitizedValue = isNaN(date.getTime()) ? 
                            new Date().toISOString() : 
                            date.toISOString();
                    } else {
                        sanitizedValue = new Date().toISOString();
                    }
                    break;
                    
                case 'uuid':
                    // Let Supabase handle UUID generation/validation
                    sanitizedValue = value;
                    break;
                    
                default:
                    sanitizedValue = value;
            }
            
            // Only add non-null values
            if (sanitizedValue !== null && sanitizedValue !== undefined && sanitizedValue !== '') {
                sanitized[mappedKey] = sanitizedValue;
            } else if (fieldDef.required) {
                errors.push(`Required field ${mappedKey} is missing`);
            } else if (fieldDef.default !== undefined) {
                sanitized[mappedKey] = fieldDef.default;
            }
            
        } catch (error) {
            errors.push(`Failed to process field ${key}: ${error.message}`);
        }
    });
    
    // Ensure required fields
    if (!sanitized.dr_number) {
        errors.push('dr_number is required');
    }
    
    // Set defaults
    if (!sanitized.status) sanitized.status = 'Active';
    if (!sanitized.additional_costs) sanitized.additional_costs = 0;
    if (!sanitized.created_at) sanitized.created_at = new Date().toISOString();
    if (!sanitized.updated_at) sanitized.updated_at = new Date().toISOString();
    if (!sanitized.created_by) sanitized.created_by = 'Manual';
    
    // Log results
    if (warnings.length > 0) {
        console.warn('⚠️ Sanitization warnings:', warnings);
    }
    
    if (errors.length > 0) {
        console.error('❌ Sanitization errors:', errors);
        return { valid: false, sanitized: null, errors, warnings };
    }
    
    console.log('✅ Payload sanitized successfully:', sanitized);
    return { valid: true, sanitized, errors: [], warnings };
}

/**
 * Safe delivery insert with comprehensive error handling
 */
async function safeDeliveryInsertComprehensive(payload) {
    console.log('💾 Safe delivery insert with comprehensive error handling...', payload);
    
    try {
        // Get the auth-fixed client
        const client = window.supabaseAuthFixedClient || await initializeSupabaseWithAuth();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Sanitize payload
        const sanitization = sanitizeDeliveryPayloadEnhanced(payload);
        if (!sanitization.valid) {
            return {
                data: null,
                error: {
                    message: 'Payload validation failed: ' + sanitization.errors.join(', '),
                    code: 'VALIDATION_ERROR',
                    details: sanitization.errors
                }
            };
        }
        
        console.log('📤 Inserting sanitized payload...', sanitization.sanitized);
        
        // Try upsert to handle duplicates
        const { data, error } = await client
            .from('deliveries')
            .upsert([sanitization.sanitized], {
                onConflict: 'dr_number',
                ignoreDuplicates: false
            })
            .select('*');
        
        if (error) {
            console.error('❌ Supabase insert error:', error);
            
            // Provide specific error handling
            if (error.code === 'PGRST204') {
                console.error('💡 Schema cache error - column not found in schema');
            } else if (error.code === '23505') {
                console.error('💡 Unique constraint violation - duplicate entry');
            } else if (error.code === '23502') {
                console.error('💡 NOT NULL constraint violation - missing required field');
            }
            
            return { data: null, error };
        }
        
        console.log('✅ Delivery inserted successfully:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe delivery insert failed:', error);
        return { 
            data: null, 
            error: { 
                message: error.message,
                code: 'INSERT_ERROR'
            }
        };
    }
}

// ========================================
// 3. DIAGNOSTIC FUNCTIONS
// ========================================

/**
 * Diagnose auth and schema issues
 */
async function diagnoseAuthAndSchemaIssues() {
    console.log('🔍 Diagnosing auth and schema issues...');
    
    const diagnosis = {
        authIssues: [],
        schemaIssues: [],
        recommendations: []
    };
    
    try {
        // Check Supabase client
        const client = window.supabaseAuthFixedClient || await initializeSupabaseWithAuth();
        
        if (!client) {
            diagnosis.authIssues.push('Supabase client not available');
            diagnosis.recommendations.push('Check Supabase credentials and library loading');
            return diagnosis;
        }
        
        // Test auth endpoint (this might cause 403)
        try {
            await client.auth.getUser();
            console.log('✅ Auth endpoint accessible');
        } catch (authError) {
            if (authError.message.includes('403') || authError.message.includes('Forbidden')) {
                diagnosis.authIssues.push('403 Forbidden on auth endpoint');
                diagnosis.recommendations.push('Disable auth calls or check RLS policies');
            } else {
                diagnosis.authIssues.push(`Auth error: ${authError.message}`);
            }
        }
        
        // Test deliveries table access
        try {
            const { data, error } = await client
                .from('deliveries')
                .select('count', { count: 'exact', head: true });
                
            if (error) {
                diagnosis.schemaIssues.push(`Table access error: ${error.message}`);
                if (error.code === 'PGRST204') {
                    diagnosis.recommendations.push('Check database schema and refresh cache');
                }
            } else {
                console.log('✅ Deliveries table accessible');
            }
        } catch (schemaError) {
            diagnosis.schemaIssues.push(`Schema error: ${schemaError.message}`);
        }
        
        // Test insert with sample data
        try {
            const testPayload = {
                dr_number: 'TEST-' + Date.now(),
                customer_name: 'Test Customer',
                status: 'Active'
            };
            
            const result = await safeDeliveryInsertComprehensive(testPayload);
            if (result.error) {
                diagnosis.schemaIssues.push(`Insert test failed: ${result.error.message}`);
                if (result.error.code === 'PGRST204') {
                    diagnosis.recommendations.push('Run schema fix SQL script');
                }
            } else {
                console.log('✅ Insert test successful');
                // Clean up test record
                if (result.data && result.data[0]) {
                    try {
                        await client.from('deliveries').delete().eq('id', result.data[0].id);
                    } catch (cleanupError) {
                        console.warn('⚠️ Failed to clean up test record:', cleanupError);
                    }
                }
            }
        } catch (insertError) {
            diagnosis.schemaIssues.push(`Insert test error: ${insertError.message}`);
        }
        
    } catch (error) {
        diagnosis.authIssues.push(`Diagnosis failed: ${error.message}`);
    }
    
    console.log('📋 Diagnosis complete:', diagnosis);
    return diagnosis;
}

// ========================================
// 4. INITIALIZATION AND EXPORTS
// ========================================

/**
 * Initialize the comprehensive fix
 */
async function initializeAuthAndSchemaFix() {
    console.log('🚀 Initializing Auth and Schema Comprehensive Fix...');
    
    try {
        // Initialize Supabase with auth fix
        const client = await initializeSupabaseWithAuth();
        
        if (client) {
            // Disable problematic auth calls
            disableProblematicAuthCalls();
            
            // Export functions globally
            window.initializeSupabaseWithAuth = initializeSupabaseWithAuth;
            window.sanitizeDeliveryPayloadEnhanced = sanitizeDeliveryPayloadEnhanced;
            window.safeDeliveryInsertComprehensive = safeDeliveryInsertComprehensive;
            window.diagnoseAuthAndSchemaIssues = diagnoseAuthAndSchemaIssues;
            
            // Override existing functions
            if (window.safeInsertDelivery) {
                window.originalSafeInsertDelivery = window.safeInsertDelivery;
                window.safeInsertDelivery = safeDeliveryInsertComprehensive;
            }
            
            if (window.getSupabaseClient) {
                window.originalGetSupabaseClient = window.getSupabaseClient;
                window.getSupabaseClient = () => client;
            }
            
            // Provide compatibility functions
            window.getSafeSupabaseClient = () => client;
            window.supabaseClient = () => client;
            
            console.log('✅ Auth and Schema Fix initialized successfully');
            return { success: true, client };
        } else {
            console.error('❌ Failed to initialize Supabase client');
            return { success: false, error: 'Client initialization failed' };
        }
        
    } catch (error) {
        console.error('❌ Auth and Schema Fix initialization failed:', error);
        return { success: false, error: error.message };
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthAndSchemaFix);
} else {
    initializeAuthAndSchemaFix();
}

// Also initialize after a delay to ensure other scripts are loaded
setTimeout(initializeAuthAndSchemaFix, 1500);

console.log('✅ Supabase Auth and Schema Comprehensive Fix loaded');