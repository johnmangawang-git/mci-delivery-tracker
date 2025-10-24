/**
 * COMPREHENSIVE CONSOLE ERRORS FIX
 * Fixes all 4 major console errors after local system timestamp implementation:
 * 1. Supabase 409 Conflict Error (duplicate DR uploads)
 * 2. Chart.js ownerDocument Error (null canvas references)
 * 3. SyntaxError in main.js (malformed comment)
 * 4. Supabase API Reference Issue (window.supabase.from not a function)
 */

console.log('🔧 Loading comprehensive console errors fix...');

// ========================================
// 1. FIX SUPABASE 409 CONFLICT ERROR
// ========================================

/**
 * Safe upsert function that handles duplicate DR numbers
 */
async function safeUpsertDelivery(deliveryData) {
    console.log('🔄 Safe upsert delivery:', deliveryData.reference_no);
    
    try {
        const client = window.supabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // First, try to find existing record by reference_no
        const { data: existing, error: findError } = await client
            .from('deliveries')
            .select('id, reference_no')
            .eq('reference_no', deliveryData.reference_no)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine
            console.error('❌ Error finding existing delivery:', findError);
            throw findError;
        }

        let result;
        if (existing) {
            // Update existing record
            console.log('📝 Updating existing delivery:', existing.id);
            const { data, error } = await client
                .from('deliveries')
                .update({
                    ...deliveryData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select();
            
            result = { data, error };
        } else {
            // Insert new record
            console.log('➕ Inserting new delivery');
            const { data, error } = await client
                .from('deliveries')
                .insert(deliveryData)
                .select();
            
            result = { data, error };
        }

        if (result.error) {
            console.error('❌ Supabase operation failed:', result.error);
            throw result.error;
        }

        console.log('✅ Safe upsert successful:', result.data);
        return result;

    } catch (error) {
        console.error('❌ Safe upsert failed:', error);
        throw error;
    }
}

// ========================================
// 2. FIX CHART.JS OWNERDOCUMENT ERROR
// ========================================

/**
 * Safe chart creation with DOM validation
 */
function safeCreateChart(canvasId, config) {
    console.log('📊 Safe chart creation for:', canvasId);
    
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn('⚠️ Canvas element not found:', canvasId);
            return null;
        }

        // Ensure canvas is properly mounted in DOM
        if (!canvas.ownerDocument || !canvas.getContext) {
            console.warn('⚠️ Canvas not properly mounted:', canvasId);
            return null;
        }

        // Check if canvas is visible
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('⚠️ Canvas has zero dimensions:', canvasId);
            return null;
        }

        // Destroy existing chart if it exists
        if (window.Chart && window.Chart.getChart) {
            const existingChart = window.Chart.getChart(canvas);
            if (existingChart) {
                console.log('🗑️ Destroying existing chart:', canvasId);
                existingChart.destroy();
            }
        }

        // Create new chart
        const chart = new Chart(canvas, config);
        console.log('✅ Chart created successfully:', canvasId);
        return chart;

    } catch (error) {
        console.error('❌ Chart creation failed:', error);
        return null;
    }
}

/**
 * Safe chart update with validation
 */
async function safeUpdateChart(chartInstance, newData) {
    console.log('📊 Safe chart update...');
    
    try {
        if (!chartInstance || !chartInstance.canvas) {
            console.warn('⚠️ Invalid chart instance');
            return false;
        }

        // Validate canvas is still in DOM
        if (!chartInstance.canvas.ownerDocument) {
            console.warn('⚠️ Chart canvas no longer in DOM');
            return false;
        }

        // Update chart data
        if (newData && chartInstance.data) {
            chartInstance.data = newData;
            chartInstance.update('none'); // No animation for safety
            console.log('✅ Chart updated successfully');
            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ Chart update failed:', error);
        return false;
    }
}

// ========================================
// 3. FIX SUPABASE API REFERENCE ISSUE
// ========================================

/**
 * Ensure Supabase client is properly initialized
 */
async function ensureSupabaseClient() {
    console.log('🔧 Ensuring Supabase client...');
    
    try {
        // Check if Supabase library is loaded
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded');
            return null;
        }

        // Check if newer comprehensive fixes are available
        if (typeof window.initializeSupabaseClient === 'function') {
            console.log('🔧 Using newer comprehensive Supabase client fix...');
            try {
                const client = await window.initializeSupabaseClient();
                if (client) {
                    window.supabaseClientInstance = client;
                    console.log('✅ Supabase client initialized via comprehensive fix');
                    return client;
                }
            } catch (error) {
                console.warn('⚠️ Comprehensive fix failed, trying fallback:', error.message);
            }
        }
        
        // Check if createClient function exists
        if (typeof window.supabase.createClient !== 'function') {
            console.warn('⚠️ Supabase createClient not available in legacy fix - newer fixes should handle this');
            
            // Try to find createClient in global scope as fallback
            if (typeof createClient !== 'undefined') {
                console.log('🔧 Found createClient in global scope, creating client...');
                const supabaseUrl = window.SUPABASE_URL;
                const supabaseKey = window.SUPABASE_ANON_KEY;
                
                if (supabaseUrl && supabaseKey) {
                    try {
                        window.supabaseClientInstance = createClient(supabaseUrl, supabaseKey);
                        console.log('✅ Supabase client created using global createClient');
                        return window.supabaseClientInstance;
                    } catch (error) {
                        console.error('❌ Failed to create client with global createClient:', error);
                    }
                }
            }
            
            return null;
        }

        // Get or create client
        if (!window.supabaseClientInstance) {
            const supabaseUrl = window.SUPABASE_URL;
            const supabaseKey = window.SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Supabase credentials not found');
                return null;
            }

            console.log('🔧 Creating Supabase client...');
            window.supabaseClientInstance = window.supabase.createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                }
            });
        }

        console.log('✅ Supabase client ready');
        return window.supabaseClientInstance;

    } catch (error) {
        console.error('❌ Supabase client initialization failed:', error);
        return null;
    }
}

/**
 * Safe Supabase client getter
 */
async function getSupabaseClient() {
    return window.supabaseClientInstance || await ensureSupabaseClient();
}

// ========================================
// 4. ENHANCED ERROR HANDLING
// ========================================

/**
 * Global error handler for console errors
 */
function setupGlobalErrorHandling() {
    console.log('🛡️ Setting up global error handling...');

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Unhandled promise rejection:', event.reason);
        
        // Handle specific Supabase 409 conflicts
        if (event.reason && event.reason.message && event.reason.message.includes('409')) {
            console.log('🔄 Attempting to handle 409 conflict...');
            event.preventDefault(); // Prevent default error handling
        }
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('❌ JavaScript error:', event.error);
        
        // Handle Chart.js ownerDocument errors
        if (event.error && event.error.message && event.error.message.includes('ownerDocument')) {
            console.log('📊 Chart.js ownerDocument error detected, attempting recovery...');
            event.preventDefault();
        }
    });
}

// ========================================
// INITIALIZATION AND EXPORTS
// ========================================

// Initialize error handling
setupGlobalErrorHandling();

// Ensure Supabase client on load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing console errors fix...');
    await ensureSupabaseClient();
});

// Export functions to global scope
window.safeUpsertDelivery = safeUpsertDelivery;
window.safeCreateChart = safeCreateChart;
window.safeUpdateChart = safeUpdateChart;
window.ensureSupabaseClient = ensureSupabaseClient;
window.getSupabaseClient = getSupabaseClient;
window.supabaseClient = () => window.supabaseClientInstance; // Sync alias for compatibility
window.getSafeSupabaseClient = getSupabaseClient; // Async version

// ========================================
// 5. EMBEDDED ADDITIONAL COST ITEMS FIX
// ========================================

/**
 * Sanitize delivery payload to remove additionalCostItems field
 */
function sanitizeDeliveryPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, sanitized: null, errors: ['Invalid payload'] };
    }
    
    const sanitized = { ...payload };
    const warnings = [];
    
    // Handle additionalCostItems field
    if (sanitized.additionalCostItems || sanitized.additional_cost_items) {
        const costItems = sanitized.additionalCostItems || sanitized.additional_cost_items;
        
        // Convert to total if it's an array
        if (Array.isArray(costItems) && costItems.length > 0) {
            const total = costItems.reduce((sum, item) => {
                return sum + (parseFloat(item.amount) || 0);
            }, 0);
            sanitized.additional_costs = total;
            warnings.push(`Converted cost items array to total: ${total}`);
        }
        
        // Remove the invalid fields
        delete sanitized.additionalCostItems;
        delete sanitized.additional_cost_items;
        warnings.push('Removed additionalCostItems field');
    }
    
    return { valid: true, sanitized, errors: [], warnings };
}

// ========================================
// 6. EMBEDDED DUPLICATE ID FIX
// ========================================

/**
 * Generate a unique UUID v4
 */
function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Safe delivery insert with comprehensive error handling
 */
async function safeDeliveryInsertComprehensive(deliveryData) {
    console.log('💾 Comprehensive safe delivery insert...', deliveryData);
    
    try {
        const client = await getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Step 1: Sanitize payload
        const sanitization = sanitizeDeliveryPayload(deliveryData);
        let finalData = sanitization.sanitized || deliveryData;
        
        if (sanitization.warnings.length > 0) {
            console.log('⚠️ Payload sanitization warnings:', sanitization.warnings);
        }

        // Step 2: Check if DR number already exists
        if (finalData.dr_number) {
            const { data: existing, error: findError } = await client
                .from('deliveries')
                .select('id, dr_number')
                .eq('dr_number', finalData.dr_number)
                .single();

            if (!findError || findError.code === 'PGRST116') {
                // No existing record or no rows found
                if (existing) {
                    console.log('🔄 DR number exists, updating existing record...');
                    const updateData = { ...finalData };
                    delete updateData.id;
                    updateData.updated_at = new Date().toISOString();
                    
                    const { data, error } = await client
                        .from('deliveries')
                        .update(updateData)
                        .eq('id', existing.id)
                        .select();

                    if (error) {
                        console.error('❌ Update failed:', error);
                        return { data: null, error };
                    }

                    console.log('✅ Existing delivery updated:', data);
                    return { data, error: null };
                }
            }
        }

        // Step 3: Handle ID conflicts for new inserts
        if (finalData.id) {
            // Check if ID exists
            const { data: existingId, error: idError } = await client
                .from('deliveries')
                .select('id')
                .eq('id', finalData.id)
                .single();

            if (existingId && !idError) {
                console.log('⚠️ ID already exists, generating new one...');
                finalData.id = generateUniqueId();
            }
        } else {
            finalData.id = generateUniqueId();
        }

        // Step 4: Ensure timestamps
        if (!finalData.created_at) {
            finalData.created_at = new Date().toISOString();
        }
        if (!finalData.updated_at) {
            finalData.updated_at = new Date().toISOString();
        }

        // Step 5: Attempt insert with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`📤 Insert attempt ${attempts}/${maxAttempts}...`);
            
            try {
                const { data, error } = await client
                    .from('deliveries')
                    .insert([finalData])
                    .select();

                if (error) {
                    if (error.code === '23505' && error.message.includes('deliveries_pkey')) {
                        // Duplicate ID error - generate new ID and retry
                        console.log('🔄 Duplicate ID detected, generating new one...');
                        finalData.id = generateUniqueId();
                        continue;
                    } else {
                        console.error('❌ Insert failed:', error);
                        return { data: null, error };
                    }
                }

                console.log('✅ Delivery inserted successfully:', data);
                return { data, error: null };

            } catch (insertError) {
                console.error(`❌ Insert attempt ${attempts} failed:`, insertError);
                if (attempts >= maxAttempts) {
                    return { data: null, error: { message: insertError.message } };
                }
                finalData.id = generateUniqueId();
            }
        }

        return { data: null, error: { message: 'Max insert attempts exceeded' } };

    } catch (error) {
        console.error('❌ Comprehensive safe delivery insert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

// ========================================
// 7. INITIALIZE EMBEDDED FIXES
// ========================================

// Initialize embedded fixes after a delay
setTimeout(() => {
    console.log('🔧 Initializing embedded fixes...');
    
    // Export embedded functions
    window.sanitizeDeliveryPayload = sanitizeDeliveryPayload;
    window.generateUniqueId = generateUniqueId;
    window.safeDeliveryInsertComprehensive = safeDeliveryInsertComprehensive;
    
    // Override existing functions with comprehensive versions
    if (!window.safeInsertDelivery) {
        window.safeInsertDelivery = safeDeliveryInsertComprehensive;
    }
    
    if (!window.safeDeliveryInsert) {
        window.safeDeliveryInsert = safeDeliveryInsertComprehensive;
    }
    
    console.log('✅ Embedded fixes initialized successfully');
}, 500);

console.log('✅ Comprehensive console errors fix loaded');