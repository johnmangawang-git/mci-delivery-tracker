/**
 * Global Field Mapping System
 * Automatically syncs between snake_case and camelCase field names
 * Ensures data compatibility across all components
 */

// Global field mapping configuration
window.FIELD_MAPPINGS = {
    // snake_case -> camelCase mappings
    'dr_number': 'drNumber',
    'customer_name': 'customerName', 
    'vendor_number': 'vendorNumber',
    'truck_type': 'truckType',
    'truck_plate_number': 'truckPlateNumber',
    'created_date': 'deliveryDate',
    'created_at': 'timestamp',
    'updated_at': 'updatedAt',
    'additional_costs': 'additionalCosts'
};

// Reverse mapping (camelCase -> snake_case)
window.REVERSE_FIELD_MAPPINGS = {};
Object.keys(window.FIELD_MAPPINGS).forEach(snakeCase => {
    const camelCase = window.FIELD_MAPPINGS[snakeCase];
    window.REVERSE_FIELD_MAPPINGS[camelCase] = snakeCase;
});

/**
 * Normalize delivery object to have both snake_case and camelCase fields
 * @param {Object} delivery - The delivery object to normalize
 * @returns {Object} - Normalized delivery object with both field formats
 */
window.normalizeDeliveryFields = function(delivery) {
    if (!delivery || typeof delivery !== 'object') {
        return delivery;
    }
    
    const normalized = { ...delivery };
    
    // Add camelCase fields based on snake_case fields
    Object.keys(window.FIELD_MAPPINGS).forEach(snakeField => {
        const camelField = window.FIELD_MAPPINGS[snakeField];
        
        // If snake_case field exists but camelCase doesn't, copy it
        if (delivery[snakeField] !== undefined && normalized[camelField] === undefined) {
            normalized[camelField] = delivery[snakeField];
        }
        
        // If camelCase field exists but snake_case doesn't, copy it
        if (delivery[camelField] !== undefined && normalized[snakeField] === undefined) {
            normalized[snakeField] = delivery[camelField];
        }
    });
    
    return normalized;
};

/**
 * Normalize an array of delivery objects
 * @param {Array} deliveries - Array of delivery objects
 * @returns {Array} - Array of normalized delivery objects
 */
window.normalizeDeliveryArray = function(deliveries) {
    if (!Array.isArray(deliveries)) {
        return deliveries;
    }
    
    return deliveries.map(delivery => window.normalizeDeliveryFields(delivery));
};

/**
 * Auto-sync fields when setting properties on delivery objects
 * Creates a Proxy that automatically maintains both field formats
 * @param {Object} delivery - The delivery object to wrap
 * @returns {Proxy} - Proxied delivery object with auto-sync
 */
window.createSyncedDelivery = function(delivery) {
    const normalized = window.normalizeDeliveryFields(delivery);
    
    return new Proxy(normalized, {
        set(target, property, value) {
            // Set the requested property
            target[property] = value;
            
            // Auto-sync the corresponding field
            if (window.FIELD_MAPPINGS[property]) {
                // snake_case -> camelCase
                target[window.FIELD_MAPPINGS[property]] = value;
            } else if (window.REVERSE_FIELD_MAPPINGS[property]) {
                // camelCase -> snake_case
                target[window.REVERSE_FIELD_MAPPINGS[property]] = value;
            }
            
            return true;
        }
    });
};

/**
 * Utility function to get field value regardless of format
 * @param {Object} obj - The object to search
 * @param {String} fieldName - Field name in either format
 * @returns {*} - The field value or undefined
 */
window.getFieldValue = function(obj, fieldName) {
    if (!obj || typeof obj !== 'object') {
        return undefined;
    }
    
    // Try direct access first
    if (obj[fieldName] !== undefined) {
        return obj[fieldName];
    }
    
    // Try mapped field name
    const mappedField = window.FIELD_MAPPINGS[fieldName] || window.REVERSE_FIELD_MAPPINGS[fieldName];
    if (mappedField && obj[mappedField] !== undefined) {
        return obj[mappedField];
    }
    
    return undefined;
};

console.log('✅ Field Mapper loaded - Global field synchronization active');
console.log('📋 Field mappings:', window.FIELD_MAPPINGS);