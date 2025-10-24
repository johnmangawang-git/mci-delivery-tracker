/**
 * SUPABASE CLIENT INTERCEPTOR
 * Intercepts ALL Supabase operations to prevent 400 Bad Request errors
 * This fixes the issue where dataService and other modules bypass our sanitization
 */

console.log('🔧 Loading Supabase Client Interceptor...');

// ========================================
// 1. FIELD SANITIZATION FUNCTIONS
// ========================================

const FIELD_MAPPINGS = {
    'additionalCosts': 'additional_costs',
    'additionalCostItems': 'additional_costs',
    'additional_cost_items': 'additional_costs',
    'drNumber': 'dr_number',
    'customerName': 'customer_name',
    'vendorNumber': 'vendor_number',
    'truckType': 'truck_type',
    'truckPlateNumber': 'truck_plate_number',
    'createdDate': 'created_date',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'createdBy': 'created_by',
    'userId': 'user_id',
    'completedDate': 'completed_date',
    'completedTime': 'completed_time',
    'signedAt': 'signed_at',
    'deliveryDate': 'delivery_date'
};

const INVALID_FIELDS = [
    'additionalCostItems',
    'additional_cost_items',
    'costItems',
    'cost_items',
    'timestamp',
    'bookedDate'
];

function sanitizePayloadForIntercept(payload) {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload)) {
        return payload.map(item => sanitizePayloadForIntercept(item));
    }

    const sanitized = {};
    
    Object.keys(payload).forEach(key => {
        const value = payload[key];
        
        // Handle special cost fields
        if (key === 'additionalCostItems' || key === 'additional_cost_items') {
            if (Array.isArray(value) && value.length > 0) {
                const total = value.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                sanitized.additional_costs = total;
            } else {
                sanitized.additional_costs = 0.00;
            }
            return;
        }
        
        // Skip invalid fields
        if (INVALID_FIELDS.includes(key)) {
            return;
        }
        
        // Map field names
        const mappedKey = FIELD_MAPPINGS[key] || key;
        sanitized[mappedKey] = value;
    });
    
    // Ensure timestamps
    if (!sanitized.created_at && payload.created_at === undefined) {
        sanitized.created_at = new Date().toISOString();
    }
    if (!sanitized.updated_at) {
        sanitized.updated_at = new Date().toISOString();
    }
    
    return sanitized;
}

// ========================================
// 2. SUPABASE CLIENT WRAPPER
// ========================================

function createInterceptedSupabaseClient(originalClient) {
    if (!originalClient) return null;
    
    // Create a proxy that intercepts the 'from' method
    return new Proxy(originalClient, {
        get(target, prop) {
            if (prop === 'from') {
                return function(tableName) {
                    const table = target.from(tableName);
                    
                    // Intercept insert operations
                    const originalInsert = table.insert;
                    table.insert = function(data) {
                        console.log('🔄 Intercepting Supabase insert for table:', tableName);
                        const sanitizedData = sanitizePayloadForIntercept(data);
                        console.log('✅ Sanitized payload:', sanitizedData);
                        return originalInsert.call(this, sanitizedData);
                    };
                    
                    // Intercept upsert operations
                    const originalUpsert = table.upsert;
                    table.upsert = function(data, options) {
                        console.log('🔄 Intercepting Supabase upsert for table:', tableName);
                        const sanitizedData = sanitizePayloadForIntercept(data);
                        console.log('✅ Sanitized payload:', sanitizedData);
                        return originalUpsert.call(this, sanitizedData, options);
                    };
                    
                    // Intercept update operations
                    const originalUpdate = table.update;
                    table.update = function(data) {
                        console.log('🔄 Intercepting Supabase update for table:', tableName);
                        const sanitizedData = sanitizePayloadForIntercept(data);
                        console.log('✅ Sanitized payload:', sanitizedData);
                        return originalUpdate.call(this, sanitizedData);
                    };
                    
                    return table;
                };
            }
            
            return target[prop];
        }
    });
}

// ========================================
// 3. CLIENT INTERCEPTION SETUP
// ========================================

function interceptSupabaseClients() {
    console.log('🚀 Setting up Supabase client interception...');
    
    // Intercept the main client getter functions
    const originalSupabaseClient = window.supabaseClient;
    if (originalSupabaseClient) {
        window.supabaseClient = function() {
            const client = originalSupabaseClient();
            return createInterceptedSupabaseClient(client);
        };
    }
    
    const originalGetSupabaseClient = window.getSupabaseClient;
    if (originalGetSupabaseClient) {
        window.getSupabaseClient = function() {
            const client = originalGetSupabaseClient();
            return createInterceptedSupabaseClient(client);
        };
    }
    
    const originalGetSafeSupabaseClient = window.getSafeSupabaseClient;
    if (originalGetSafeSupabaseClient) {
        window.getSafeSupabaseClient = async function() {
            const client = await originalGetSafeSupabaseClient();
            return createInterceptedSupabaseClient(client);
        };
    }
    
    // Also intercept any existing client instances
    if (window.supabaseClientInstance) {
        window.supabaseClientInstance = createInterceptedSupabaseClient(window.supabaseClientInstance);
    }
    
    console.log('✅ Supabase client interception setup complete');
}

// ========================================
// 4. DATASERVICE OVERRIDE
// ========================================

function overrideDataService() {
    console.log('🔄 Overriding dataService with sanitized operations...');
    
    if (window.dataService && window.dataService.saveToSupabase) {
        const originalSaveToSupabase = window.dataService.saveToSupabase;
        
        window.dataService.saveToSupabase = async function(tableName, data, localStorageKey) {
            console.log('🔄 DataService saveToSupabase intercepted:', tableName);
            
            // Sanitize the data before passing to original function
            const sanitizedData = sanitizePayloadForIntercept(data);
            console.log('✅ DataService payload sanitized:', sanitizedData);
            
            return await originalSaveToSupabase.call(this, tableName, sanitizedData, localStorageKey);
        };
    }
    
    if (window.dataService && window.dataService.saveDelivery) {
        const originalSaveDelivery = window.dataService.saveDelivery;
        
        window.dataService.saveDelivery = async function(deliveryData) {
            console.log('🔄 DataService saveDelivery intercepted');
            
            // Sanitize the delivery data
            const sanitizedData = sanitizePayloadForIntercept(deliveryData);
            console.log('✅ DataService delivery payload sanitized:', sanitizedData);
            
            return await originalSaveDelivery.call(this, sanitizedData);
        };
    }
    
    console.log('✅ DataService override complete');
}

// ========================================
// 5. INITIALIZATION
// ========================================

function initializeClientInterceptor() {
    console.log('🚀 Initializing Supabase Client Interceptor...');
    
    // Set up client interception
    interceptSupabaseClients();
    
    // Override dataService
    overrideDataService();
    
    // Export sanitization function
    window.sanitizePayloadForIntercept = sanitizePayloadForIntercept;
    window.createInterceptedSupabaseClient = createInterceptedSupabaseClient;
    
    console.log('✅ Supabase Client Interceptor initialized - ALL operations now sanitized');
    
    // Mark as initialized
    window.supabaseClientInterceptorInitialized = true;
}

// ========================================
// 6. AUTO-INITIALIZATION
// ========================================

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClientInterceptor);
} else {
    initializeClientInterceptor();
}

// Also initialize after a delay to ensure it overrides everything
setTimeout(() => {
    if (!window.supabaseClientInterceptorInitialized) {
        console.log('🔄 Backup Client Interceptor initialization...');
        initializeClientInterceptor();
    }
}, 2000);

console.log('✅ Supabase Client Interceptor loaded - Ready to prevent ALL 400 errors');