/**
 * SUPABASE SCHEMA VALIDATION FIX
 * Fixes all Supabase initialization and data schema validation errors:
 * 1. Supabase createClient not available
 * 2. 400 Bad Request when posting to /deliveries
 * 3. Null value in column "name" violates not-null constraint
 */

console.log('🔧 Loading Supabase Schema Validation Fix...');

// ========================================
// 1. ENHANCED SUPABASE INITIALIZATION
// ========================================

/**
 * Enhanced Supabase initialization with better error handling
 */
async function initializeSupabaseWithValidation() {
    console.log('🚀 Enhanced Supabase initialization starting...');

    // Prevent duplicate initialization
    if (window.supabaseValidatedClient) {
        console.log('✅ Supabase already initialized and validated');
        return window.supabaseValidatedClient;
    }

    try {
        // Wait for Supabase library to load
        let attempts = 0;
        const maxAttempts = 10;

        while (typeof window.supabase === 'undefined' && attempts < maxAttempts) {
            console.log(`⏳ Waiting for Supabase library... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library failed to load after 5 seconds');
            return null;
        }

        // Use the comprehensive client fix
        if (typeof window.initializeSupabaseClient === 'function') {
            try {
                const client = await window.initializeSupabaseClient();
                if (client && typeof client.from === 'function') {
                    console.log('✅ Using initialized Supabase client');
                    return client;
                }
            } catch (error) {
                console.error('❌ Failed to initialize client:', error);
            }
        }

        // Fallback: check if createClient is available
        if (typeof window.supabase.createClient !== 'function') {
            console.error('❌ Supabase createClient function not available');
            console.error('Available methods:', Object.keys(window.supabase));
            return null;
        }

        // Get and validate credentials
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseKey = window.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Supabase credentials missing');
            console.error('SUPABASE_URL:', supabaseUrl);
            console.error('SUPABASE_ANON_KEY:', supabaseKey ? '[PRESENT]' : '[MISSING]');
            return null;
        }

        // Validate URL format
        if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
            console.error('❌ Invalid Supabase URL format:', supabaseUrl);
            return null;
        }

        // Create client with enhanced configuration
        console.log('🔧 Creating validated Supabase client...');
        const client = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false,
                flowType: 'implicit'
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                }
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });

        // Test the client connection
        console.log('🧪 Testing Supabase client connection...');
        try {
            const { data, error } = await client.from('deliveries').select('count', { count: 'exact', head: true });
            if (error && error.code !== 'PGRST116') {
                console.warn('⚠️ Connection test warning:', error.message);
            } else {
                console.log('✅ Supabase connection test successful');
            }
        } catch (testError) {
            console.warn('⚠️ Connection test failed (may be expected):', testError.message);
        }

        // Store globally with validation flag
        window.supabaseValidatedClient = client;
        window.supabaseClientInitialized = true;

        // Create compatibility functions
        window.supabaseClient = () => client;
        window.getSupabaseClient = () => client;
        window.supabase = client; // Direct assignment for compatibility

        console.log('✅ Supabase client initialized and validated successfully');
        return client;

    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        return null;
    }
}

// ========================================
// 2. DELIVERY DATA VALIDATION
// ========================================

/**
 * Validate delivery data before sending to Supabase
 */
function validateDeliveryData(deliveryData) {
    console.log('🔍 Validating delivery data:', deliveryData);

    const errors = [];
    const warnings = [];

    // Required fields validation
    const requiredFields = {
        'dr_number': 'DR Number',
        'customer_name': 'Customer Name',
        'status': 'Status'
    };

    for (const [field, displayName] of Object.entries(requiredFields)) {
        if (!deliveryData[field] || deliveryData[field].toString().trim() === '') {
            errors.push(`${displayName} is required`);
        }
    }

    // Data type validation
    if (deliveryData.dr_number && typeof deliveryData.dr_number !== 'string') {
        deliveryData.dr_number = deliveryData.dr_number.toString();
        warnings.push('DR Number converted to string');
    }

    if (deliveryData.customer_name && typeof deliveryData.customer_name !== 'string') {
        deliveryData.customer_name = deliveryData.customer_name.toString();
        warnings.push('Customer Name converted to string');
    }

    // Timestamp validation
    if (!deliveryData.created_at) {
        deliveryData.created_at = new Date().toISOString();
        warnings.push('Created timestamp added');
    }

    if (!deliveryData.updated_at) {
        deliveryData.updated_at = new Date().toISOString();
        warnings.push('Updated timestamp added');
    }

    // Additional costs validation
    if (deliveryData.additional_costs && typeof deliveryData.additional_costs !== 'number') {
        const parsed = parseFloat(deliveryData.additional_costs);
        if (isNaN(parsed)) {
            deliveryData.additional_costs = 0;
            warnings.push('Invalid additional costs set to 0');
        } else {
            deliveryData.additional_costs = parsed;
            warnings.push('Additional costs converted to number');
        }
    }

    // Log validation results
    if (warnings.length > 0) {
        console.log('⚠️ Delivery validation warnings:', warnings);
    }

    if (errors.length > 0) {
        console.error('❌ Delivery validation errors:', errors);
        return { valid: false, errors, warnings, data: deliveryData };
    }

    console.log('✅ Delivery data validation passed');
    return { valid: true, errors: [], warnings, data: deliveryData };
}

/**
 * Safe delivery insert with validation
 */
async function safeInsertDelivery(deliveryData) {
    console.log('💾 Safe delivery insert starting...');

    try {
        // Get validated client
        const client = window.supabaseValidatedClient || await initializeSupabaseWithValidation();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Validate data
        const validation = validateDeliveryData(deliveryData);
        if (!validation.valid) {
            throw new Error('Validation failed: ' + validation.errors.join(', '));
        }

        console.log('📤 Sending delivery data to Supabase:', validation.data);

        // Try upsert first to handle duplicates
        const { data, error } = await client
            .from('deliveries')
            .upsert(validation.data, {
                onConflict: 'dr_number',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Supabase delivery insert error:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('✅ Delivery inserted successfully:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Safe delivery insert failed:', error);
        return { data: null, error };
    }
}

// ========================================
// 3. CUSTOMER DATA VALIDATION
// ========================================

/**
 * Validate customer data before sending to Supabase
 */
function validateCustomerData(customerData) {
    console.log('🔍 Validating customer data:', customerData);

    const errors = [];
    const warnings = [];

    // Handle different name field variations
    let customerName = customerData.name ||
        customerData.customer_name ||
        customerData.customerName ||
        customerData.Name ||
        customerData.CUSTOMER_NAME;

    if (!customerName || customerName.toString().trim() === '') {
        errors.push('Customer name is required and cannot be empty');
    } else {
        // Ensure name is properly formatted
        customerName = customerName.toString().trim();
        if (customerName.length < 2) {
            errors.push('Customer name must be at least 2 characters long');
        }
    }

    // Standardize the data structure
    const validatedData = {
        name: customerName,
        vendor_number: customerData.vendor_number || customerData.vendorNumber || '',
        contact_no: customerData.contact_no || customerData.contactNo || customerData.phone || '',
        email: customerData.email || '',
        address: customerData.address || customerData.destination || '',
        created_at: customerData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Additional validation
    if (validatedData.email && !isValidEmail(validatedData.email)) {
        warnings.push('Invalid email format, keeping as provided');
    }

    // Log validation results
    if (warnings.length > 0) {
        console.log('⚠️ Customer validation warnings:', warnings);
    }

    if (errors.length > 0) {
        console.error('❌ Customer validation errors:', errors);
        return { valid: false, errors, warnings, data: validatedData };
    }

    console.log('✅ Customer data validation passed');
    return { valid: true, errors: [], warnings, data: validatedData };
}

/**
 * Safe customer insert with validation
 */
async function safeInsertCustomer(customerData) {
    console.log('💾 Safe customer insert starting...');

    try {
        // Get validated client
        const client = window.supabaseValidatedClient || await initializeSupabaseWithValidation();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Validate data
        const validation = validateCustomerData(customerData);
        if (!validation.valid) {
            throw new Error('Validation failed: ' + validation.errors.join(', '));
        }

        console.log('📤 Sending customer data to Supabase:', validation.data);

        // Try upsert to handle duplicates
        const { data, error } = await client
            .from('customers')
            .upsert(validation.data, {
                onConflict: 'name,vendor_number',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Supabase customer insert error:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('✅ Customer inserted successfully:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Safe customer insert failed:', error);
        return { data: null, error };
    }
}

// ========================================
// 4. UTILITY FUNCTIONS
// ========================================

/**
 * Simple email validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Enhanced error logging for Supabase operations
 */
function logSupabaseError(operation, error, data = null) {
    console.error(`❌ Supabase ${operation} failed:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        data: data
    });

    // Provide helpful error messages
    if (error.code === '23502') {
        console.error('💡 Tip: This is a NOT NULL constraint violation. Check required fields.');
    } else if (error.code === '23505') {
        console.error('💡 Tip: This is a UNIQUE constraint violation. Consider using upsert.');
    } else if (error.code === '42P01') {
        console.error('💡 Tip: Table does not exist. Check your database schema.');
    }
}

// ========================================
// 5. INITIALIZATION AND EXPORTS
// ========================================

/**
 * Initialize the schema validation fix
 */
async function initializeSchemaValidationFix() {
    console.log('🚀 Initializing Supabase Schema Validation Fix...');

    // Initialize Supabase client
    const client = await initializeSupabaseWithValidation();

    if (client) {
        console.log('✅ Schema validation fix initialized successfully');

        // Override existing functions with safe versions
        if (window.dataService && window.dataService.saveDelivery) {
            const originalSaveDelivery = window.dataService.saveDelivery;
            window.dataService.saveDelivery = async function (deliveryData) {
                console.log('🔄 Using safe delivery insert...');
                return await safeInsertDelivery(deliveryData);
            };
        }

        // Export functions globally
        window.initializeSupabaseWithValidation = initializeSupabaseWithValidation;
        window.validateDeliveryData = validateDeliveryData;
        window.safeInsertDelivery = safeInsertDelivery;
        window.validateCustomerData = validateCustomerData;
        window.safeInsertCustomer = safeInsertCustomer;
        window.logSupabaseError = logSupabaseError;

    } else {
        console.error('❌ Schema validation fix initialization failed');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSchemaValidationFix);
} else {
    initializeSchemaValidationFix();
}

// Also try initialization after a delay to ensure all scripts are loaded
setTimeout(initializeSchemaValidationFix, 1000);

console.log('✅ Supabase Schema Validation Fix loaded');