/**
 * SUPABASE SCHEMA SANITIZER
 * Fixes delivery insert errors by sanitizing payloads and validating against schema
 * Prevents 400 Bad Request errors from invalid columns like 'additionalCostItems'
 */

console.log('🔧 Loading Supabase Schema Sanitizer...');

// Define the actual deliveries table schema based on Supabase
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
    additional_costs: { type: 'decimal', required: false, default: 0.00 },
    
    // Dates and metadata
    created_date: { type: 'date', required: false, default: 'CURRENT_DATE' },
    created_at: { type: 'timestamp', required: false, default: 'NOW()' },
    updated_at: { type: 'timestamp', required: false, default: 'NOW()' },
    created_by: { type: 'text', required: false, default: 'Manual' },
    user_id: { type: 'uuid', required: false, default: 'auth.uid()' },
    
    // Additional fields that might exist
    item_number: { type: 'text', required: false },
    mobile_number: { type: 'text', required: false },
    item_description: { type: 'text', required: false },
    serial_number: { type: 'text', required: false }
};

// Fields that are commonly sent but don't exist in schema
const INVALID_FIELDS = [
    'additionalCostItems',
    'additional_cost_items',
    'costItems',
    'cost_items',
    'deliveryDate', // This should be created_date
    'timestamp', // This should be created_at
    'bookedDate',
    'drNumber', // This should be dr_number
    'customerName', // This should be customer_name
    'vendorNumber', // This should be vendor_number
    'truckType', // This should be truck_type
    'truckPlateNumber', // This should be truck_plate_number
    'additionalCosts' // This should be additional_costs
];

// Field mappings for camelCase to snake_case conversion
const FIELD_MAPPINGS = {
    drNumber: 'dr_number',
    customerName: 'customer_name',
    vendorNumber: 'vendor_number',
    truckType: 'truck_type',
    truckPlateNumber: 'truck_plate_number',
    additionalCosts: 'additional_costs',
    deliveryDate: 'created_date',
    timestamp: 'created_at',
    bookedDate: 'created_date'
};

/**
 * Sanitize delivery payload for Supabase insert/upsert
 */
function sanitizeDeliveryPayload(payload) {
    console.log('🧹 Sanitizing delivery payload...', payload);
    
    if (!payload || typeof payload !== 'object') {
        console.error('❌ Invalid payload provided to sanitizer');
        return { valid: false, sanitized: null, errors: ['Invalid payload'] };
    }
    
    const sanitized = {};
    const errors = [];
    const warnings = [];
    
    // Process each field in the payload
    Object.keys(payload).forEach(key => {
        const value = payload[key];
        
        // Check if field is invalid
        if (INVALID_FIELDS.includes(key)) {
            warnings.push(`Removed invalid field: ${key}`);
            
            // Handle special cases for invalid fields
            if (key === 'additionalCostItems' || key === 'additional_cost_items') {
                // Convert additionalCostItems to additional_costs total
                if (Array.isArray(value) && value.length > 0) {
                    const total = value.reduce((sum, item) => {
                        return sum + (parseFloat(item.amount) || 0);
                    }, 0);
                    sanitized.additional_costs = total;
                    warnings.push(`Converted ${key} array to additional_costs total: ${total}`);
                }
            }
            return;
        }
        
        // Check if field needs mapping
        const mappedKey = FIELD_MAPPINGS[key] || key;
        
        // Check if mapped field exists in schema
        if (!DELIVERIES_SCHEMA[mappedKey]) {
            warnings.push(`Unknown field: ${key} (mapped to ${mappedKey})`);
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
            } else if (schemaField.required) {
                errors.push(`Required field ${mappedKey} is missing or empty`);
            }
            
        } catch (error) {
            errors.push(`Failed to process field ${key}: ${error.message}`);
        }
    });
    
    // Ensure required fields are present
    Object.keys(DELIVERIES_SCHEMA).forEach(field => {
        const schemaField = DELIVERIES_SCHEMA[field];
        if (schemaField.required && !sanitized[field]) {
            errors.push(`Required field ${field} is missing`);
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
        console.warn('⚠️ Payload sanitization warnings:', warnings);
    }
    
    if (errors.length > 0) {
        console.error('❌ Payload sanitization errors:', errors);
        return { valid: false, sanitized: null, errors, warnings };
    }
    
    console.log('✅ Payload sanitized successfully:', sanitized);
    return { valid: true, sanitized, errors: [], warnings };
}

/**
 * Safe delivery insert with schema validation
 */
async function safeDeliveryInsert(payload) {
    console.log('💾 Safe delivery insert with schema validation...', payload);
    
    try {
        // Sanitize payload
        const sanitization = sanitizeDeliveryPayload(payload);
        if (!sanitization.valid) {
            return {
                data: null,
                error: {
                    message: 'Payload validation failed: ' + sanitization.errors.join(', '),
                    details: sanitization.errors
                }
            };
        }
        
        // Get Supabase client
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Perform insert
        console.log('📤 Inserting sanitized payload...', sanitization.sanitized);
        const { data, error } = await client
            .from('deliveries')
            .insert([sanitization.sanitized])
            .select('*');
        
        if (error) {
            console.error('❌ Supabase insert error:', error);
            return { data: null, error };
        }
        
        console.log('✅ Delivery inserted successfully:', data);
        return { data, error: null };
        
    } catch (error) {
        console.error('❌ Safe delivery insert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Safe delivery upsert with schema validation
 */
async function safeDeliveryUpsert(payload) {
    console.log('🔄 Safe delivery upsert with schema validation...', payload);
    
    try {
        // Sanitize payload
        const sanitization = sanitizeDeliveryPayload(payload);
        if (!sanitization.valid) {
            return {
                data: null,
                error: {
                    message: 'Payload validation failed: ' + sanitization.errors.join(', '),
                    details: sanitization.errors
                }
            };
        }
        
        // Get Supabase client
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Perform upsert
        console.log('🔄 Upserting sanitized payload...', sanitization.sanitized);
        const { data, error } = await client
            .from('deliveries')
            .upsert([sanitization.sanitized], {
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
        console.error('❌ Safe delivery upsert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Handle additionalCostItems separately
 */
async function handleAdditionalCostItems(deliveryId, additionalCostItems) {
    console.log('💰 Handling additional cost items separately...', { deliveryId, additionalCostItems });
    
    if (!additionalCostItems || !Array.isArray(additionalCostItems) || additionalCostItems.length === 0) {
        console.log('📝 No additional cost items to handle');
        return { success: true, items: [] };
    }
    
    try {
        // Use the additional costs Supabase fix if available
        if (typeof window.saveAdditionalCostItems === 'function') {
            const savedItems = await window.saveAdditionalCostItems(deliveryId, additionalCostItems);
            console.log('✅ Additional cost items saved separately:', savedItems);
            return { success: true, items: savedItems };
        } else {
            console.warn('⚠️ saveAdditionalCostItems function not available, cost items not saved separately');
            return { success: false, items: [] };
        }
    } catch (error) {
        console.error('❌ Failed to save additional cost items:', error);
        return { success: false, items: [], error: error.message };
    }
}

/**
 * Complete delivery save with schema validation and cost items handling
 */
async function completeDeliverySave(payload) {
    console.log('🚀 Complete delivery save with schema validation...', payload);
    
    try {
        // Extract additionalCostItems before sanitization
        const additionalCostItems = payload.additionalCostItems || payload.additional_cost_items;
        
        // Save delivery with sanitized payload
        const deliveryResult = await safeDeliveryUpsert(payload);
        if (deliveryResult.error) {
            return deliveryResult;
        }
        
        const savedDelivery = deliveryResult.data[0];
        
        // Handle additional cost items separately if they exist
        if (additionalCostItems && savedDelivery) {
            const costItemsResult = await handleAdditionalCostItems(savedDelivery.id, additionalCostItems);
            if (costItemsResult.success) {
                // Add cost items back to the delivery object for compatibility
                savedDelivery.additionalCostItems = costItemsResult.items;
            }
        }
        
        console.log('✅ Complete delivery save successful:', savedDelivery);
        return { data: [savedDelivery], error: null };
        
    } catch (error) {
        console.error('❌ Complete delivery save failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Initialize schema sanitizer
 */
function initializeSchemasanitizer() {
    console.log('🚀 Initializing Supabase Schema Sanitizer...');
    
    // Export functions globally
    window.sanitizeDeliveryPayload = sanitizeDeliveryPayload;
    window.safeDeliveryInsert = safeDeliveryInsert;
    window.safeDeliveryUpsert = safeDeliveryUpsert;
    window.completeDeliverySave = completeDeliverySave;
    window.handleAdditionalCostItems = handleAdditionalCostItems;
    
    // Override existing safe functions with schema-aware versions
    if (window.safeInsertDelivery) {
        window.originalSafeInsertDelivery = window.safeInsertDelivery;
        window.safeInsertDelivery = safeDeliveryInsert;
    }
    
    if (window.safeUpsertDelivery) {
        window.originalSafeUpsertDelivery = window.safeUpsertDelivery;
        window.safeUpsertDelivery = safeDeliveryUpsert;
    }
    
    console.log('✅ Schema Sanitizer initialized successfully');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('schemaSanitizerReady', {
        detail: { schema: DELIVERIES_SCHEMA }
    }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSchemanitizer);
} else {
    initializeSchemanitizer();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.schemaSanitizerInitialized) {
        console.log('🔄 Backup Schema Sanitizer initialization...');
        initializeSchemanitizer();
        window.schemaSanitizerInitialized = true;
    }
});

console.log('✅ Supabase Schema Sanitizer loaded');