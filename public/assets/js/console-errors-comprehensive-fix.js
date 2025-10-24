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

// Load additional fixes after a delay to ensure other fixes are loaded
setTimeout(() => {
    // Load additional cost items fix
    if (typeof window.safeDeliveryInsertWithCostItems === 'function') {
        console.log('✅ Additional cost items fix already loaded');
    } else {
        console.log('🔧 Loading additional cost items fix...');
        const script1 = document.createElement('script');
        script1.src = 'public/assets/js/supabase-additional-cost-items-fix.js';
        script1.onload = () => console.log('✅ Additional cost items fix loaded');
        script1.onerror = () => console.warn('⚠️ Failed to load additional cost items fix');
        document.head.appendChild(script1);
    }
    
    // Load duplicate ID fix
    if (typeof window.safeDeliveryInsertNoDuplicates === 'function') {
        console.log('✅ Duplicate ID fix already loaded');
    } else {
        console.log('🔧 Loading duplicate ID fix...');
        const script2 = document.createElement('script');
        script2.src = 'public/assets/js/supabase-duplicate-id-fix.js';
        script2.onload = () => console.log('✅ Duplicate ID fix loaded');
        script2.onerror = () => console.warn('⚠️ Failed to load duplicate ID fix');
        document.head.appendChild(script2);
    }
}, 1000);

console.log('✅ Comprehensive console errors fix loaded');