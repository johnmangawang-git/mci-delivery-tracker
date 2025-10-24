/**
 * SUPABASE 400 BAD REQUEST FIX
 * Fixes persistent "Could not find the 'additionalCosts' column" errors
 * 
 * Root Cause: Frontend sends camelCase field names but database expects snake_case
 * Solution: Comprehensive payload sanitization with field mapping
 */

console.log('🔧 Loading Supabase 400 Bad Request Fix...');

// ========================================
// 1. DELIVERIES TABLE SCHEMA DEFINITION
// ========================================

// Exact schema from supabase/schema.sql
const DELIVERIES_SCHEMA = {
    // Primary key and identifiers
    id: { type: 'uuid', required: false, generated: true },
    dr_number: { type: 'text', required: true, unique: true },
    
    // Customer and delivery info
    customer_name: { type: 'text', required: false },
    vendor_number: { type: 'text', required: false },
    origin: { type: 'text', required: false },
    destination: { type: 'text', required: false },
    
    // Truck info
    truck_type: { type: 'text', required: false },
    truck_plate_number: { type: 'text', required: false },
    
    // Status and costs
    status: { type: 'text', required: false, default: 'Active' },
    distance: { type: 'text', required: false },
    additional_costs: { type: 'decimal', required: false, default: 0.00 }, // ← CORRECT COLUMN NAME
    
    // Dates and metadata
    created_date: { type: 'date', required: false, default: 'CURRENT_DATE' },
    created_at: { type: 'timestamp', required: false, default: 'NOW()' },
    updated_at: { type: 'timestamp', required: false, default: 'NOW()' },
    created_by: { type: 'text', required: false, default: 'Manual' },
    user_id: { type: 'uuid', required: false, default: 'auth.uid()' }
};

// ========================================
// 2. FIELD MAPPING (camelCase → snake_case)
// ========================================

const FIELD_MAPPINGS = {
    // The problematic field causing 400 errors
    'additionalCosts': 'additional_costs',           // ← PRIMARY FIX
    'additionalCostItems': 'additional_costs',       // Convert array to total
    'additional_cost_items': 'additional_costs',     // Convert array to total
    
    // Other common camelCase → snake_case mappings
    'drNumber': 'dr_number',
    'customerName': 'customer_name',
    'vendorNumber': 'vendor_number',
    'truckType': 'truck_type',
    'truckPlateNumber': 'truck_plate_number',
    'createdDate': 'created_date',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'createdBy': 'created_by',
    'userId': 'user_id'
};

// Fields that should be completely removed (don't exist in schema)
const INVALID_FIELDS = [
    'additionalCostItems',      // Array field - convert to total
    'additional_cost_items',    // Array field - convert to total
    'costItems',
    'cost_items',
    'deliveryDate',
    'timestamp',
    'bookedDate'
];

// ========================================
// 3. PAYLOAD SANITIZATION FUNCTION
// ========================================

function sanitizeDeliveryPayload(payload) {
    console.log('🧹 Sanitizing delivery payload for 400 error prevention...', payload);
    
    if (!payload || typeof payload !== 'object') {
        console.error('❌ Invalid payload provided to sanitizer');
        return { valid: false, sanitized: null, errors: ['Invalid payload'] };
    }
    
    const sanitized = {};
    const errors = [];
    const warnings = [];
    const removedFields = [];
    
    // Process each field in the payload
    Object.keys(payload).forEach(key => {
        const value = payload[key];
        
        // Check if field should be mapped
        const mappedKey = FIELD_MAPPINGS[key] || key;
        
        // Handle special case: additionalCostItems array → additional_costs total
        if (key === 'additionalCostItems' || key === 'additional_cost_items') {
            if (Array.isArray(value) && value.length > 0) {
                const total = value.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                sanitized.additional_costs = total;
                warnings.push(`✅ Converted ${key} array (${value.length} items) to additional_costs total: ${total}`);
            } else {
                sanitized.additional_costs = 0.00;
                warnings.push(`✅ Set additional_costs to 0.00 (empty ${key})`);
            }
            return;
        }
        
        // Check if field should be removed
        if (INVALID_FIELDS.includes(key)) {
            removedFields.push(key);
            warnings.push(`🗑️ Removed invalid field: ${key}`);
            return;
        }
        
        // Check if mapped field exists in schema
        if (!DELIVERIES_SCHEMA[mappedKey]) {
            removedFields.push(key);
            warnings.push(`🗑️ Removed unknown field: ${key} (mapped to ${mappedKey})`);
            return;
        }
        
        // Validate and convert value based on schema type
        const schemaField = DELIVERIES_SCHEMA[mappedKey];
        let sanitizedValue = value;
        
        try {
            switch (schemaField.type) {
                case 'text':
                    sanitizedValue = value ? String(value).trim() : null;
                    break;
                    
                case 'decimal':
                    sanitizedValue = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
                    break;
                    
                case 'date':
                    if (value) {
                        const date = new Date(value);
                        sanitizedValue = isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
                    } else {
                        sanitizedValue = new Date().toISOString().split('T')[0];
                    }
                    break;
                    
                case 'timestamp':
                    if (value) {
                        const date = new Date(value);
                        sanitizedValue = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
                    } else {
                        sanitizedValue = new Date().toISOString();
                    }
                    break;
                    
                case 'uuid':
                    // Don't modify UUIDs, let Supabase handle them
                    sanitizedValue = value;
                    break;
                    
                default:
                    sanitizedValue = value;
            }
            
            // Only add non-null values (except for required fields)
            if (sanitizedValue !== null && sanitizedValue !== undefined && sanitizedValue !== '') {
                sanitized[mappedKey] = sanitizedValue;
                if (key !== mappedKey) {
                    warnings.push(`🔄 Mapped ${key} → ${mappedKey}`);
                }
            } else if (schemaField.required) {
                errors.push(`❌ Required field ${mappedKey} is missing or empty`);
            }
            
        } catch (error) {
            errors.push(`❌ Failed to process field ${key}: ${error.message}`);
        }
    });
    
    // Ensure required fields are present
    Object.keys(DELIVERIES_SCHEMA).forEach(field => {
        const schemaField = DELIVERIES_SCHEMA[field];
        if (schemaField.required && !sanitized[field]) {
            errors.push(`❌ Required field ${field} is missing`);
        }
    });
    
    // Set default values for important fields
    if (!sanitized.status) {
        sanitized.status = 'Active';
    }
    
    if (!sanitized.additional_costs) {
        sanitized.additional_costs = 0.00;
    }
    
    if (!sanitized.created_at) {
        sanitized.created_at = new Date().toISOString();
    }
    
    if (!sanitized.updated_at) {
        sanitized.updated_at = new Date().toISOString();
    }
    
    if (!sanitized.created_by) {
        sanitized.created_by = 'Manual';
    }
    
    // Log results
    if (warnings.length > 0) {
        console.log('⚠️ Payload sanitization warnings:', warnings);
    }
    
    if (removedFields.length > 0) {
        console.log('🗑️ Removed invalid fields:', removedFields);
    }
    
    if (errors.length > 0) {
        console.error('❌ Payload sanitization errors:', errors);
        return { valid: false, sanitized: null, errors, warnings };
    }
    
    console.log('✅ Payload sanitized successfully - 400 errors prevented:', sanitized);
    return { valid: true, sanitized, errors: [], warnings };
}

// ========================================
// 4. SAFE DELIVERY INSERT WITH 400 PREVENTION
// ========================================

async function safeDeliveryInsertNo400(deliveryData) {
    console.log('💾 Safe delivery insert with 400 error prevention...', deliveryData);
    
    try {
        // Get Supabase client
        const client = await window.getSafeSupabaseClient?.() || 
                      await window.initializeSupabaseClient?.() ||
                      window.supabaseClient?.() ||
                      window.getSupabaseClient?.();
        
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Sanitize payload to prevent 400 errors
        const sanitization = sanitizeDeliveryPayload(deliveryData);
        if (!sanitization.valid) {
            return {
                data: null,
                error: {
                    message: 'Payload validation failed: ' + sanitization.errors.join(', '),
                    details: sanitization.errors
                }
            };
        }
        
        // Log the sanitized payload for verification
        console.log('📤 Sending sanitized payload to Supabase (no 400 errors):', sanitization.sanitized);
        
        // Perform insert with sanitized payload
        const { data, error } = await client
            .from('deliveries')
            .insert([sanitization.sanitized])
            .select('*');
        
        if (error) {
            console.error('❌ Supabase insert error (after sanitization):', error);
            return { data: null, error };
        }
        
        console.log('✅ Delivery inserted successfully - no 400 errors:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe delivery insert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

// ========================================
// 5. SAFE DELIVERY UPSERT WITH 400 PREVENTION
// ========================================

async function safeDeliveryUpsertNo400(deliveryData) {
    console.log('🔄 Safe delivery upsert with 400 error prevention...', deliveryData);
    
    try {
        // Get Supabase client
        const client = await window.getSafeSupabaseClient?.() || 
                      await window.initializeSupabaseClient?.() ||
                      window.supabaseClient?.() ||
                      window.getSupabaseClient?.();
        
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Sanitize payload to prevent 400 errors
        const sanitization = sanitizeDeliveryPayload(deliveryData);
        if (!sanitization.valid) {
            return {
                data: null,
                error: {
                    message: 'Payload validation failed: ' + sanitization.errors.join(', '),
                    details: sanitization.errors
                }
            };
        }
        
        // Log the sanitized payload for verification
        console.log('🔄 Upserting sanitized payload to Supabase (no 400 errors):', sanitization.sanitized);
        
        // Perform upsert with sanitized payload
        const { data, error } = await client
            .from('deliveries')
            .upsert([sanitization.sanitized], {
                onConflict: 'dr_number',
                ignoreDuplicates: false
            })
            .select('*');
        
        if (error) {
            console.error('❌ Supabase upsert error (after sanitization):', error);
            return { data: null, error };
        }
        
        console.log('✅ Delivery upserted successfully - no 400 errors:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe delivery upsert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

// ========================================
// 6. INITIALIZATION AND EXPORTS
// ========================================

function initialize400BadRequestFix() {
    console.log('🚀 Initializing 400 Bad Request Fix...');
    
    // Export functions globally
    window.sanitizeDeliveryPayload = sanitizeDeliveryPayload;
    window.safeDeliveryInsertNo400 = safeDeliveryInsertNo400;
    window.safeDeliveryUpsertNo400 = safeDeliveryUpsertNo400;
    
    // Override existing functions with 400-safe versions
    if (window.safeInsertDelivery) {
        window.original400SafeInsertDelivery = window.safeInsertDelivery;
        window.safeInsertDelivery = safeDeliveryInsertNo400;
    }
    
    if (window.safeUpsertDelivery) {
        window.original400SafeUpsertDelivery = window.safeUpsertDelivery;
        window.safeUpsertDelivery = safeDeliveryUpsertNo400;
    }
    
    if (window.safeDeliveryInsert) {
        window.original400SafeDeliveryInsert = window.safeDeliveryInsert;
        window.safeDeliveryInsert = safeDeliveryInsertNo400;
    }
    
    if (window.safeDeliveryUpsert) {
        window.original400SafeDeliveryUpsert = window.safeDeliveryUpsert;
        window.safeDeliveryUpsert = safeDeliveryUpsertNo400;
    }
    
    console.log('✅ 400 Bad Request Fix initialized - additionalCosts errors prevented');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('badRequest400FixReady', {
        detail: { 
            functions: [
                'sanitizeDeliveryPayload',
                'safeDeliveryInsertNo400',
                'safeDeliveryUpsertNo400'
            ]
        }
    }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize400BadRequestFix);
} else {
    initialize400BadRequestFix();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.badRequest400FixInitialized) {
        console.log('🔄 Backup 400 Bad Request Fix initialization...');
        initialize400BadRequestFix();
        window.badRequest400FixInitialized = true;
    }
});

console.log('✅ Supabase 400 Bad Request Fix loaded - additionalCosts column errors prevented');