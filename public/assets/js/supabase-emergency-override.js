/**
 * SUPABASE EMERGENCY OVERRIDE
 * This script MUST load FIRST and will disable ALL other Supabase fixes
 * It completely takes over ALL Supabase operations to prevent 400 errors
 */

console.log('🚨 EMERGENCY OVERRIDE: Taking complete control of ALL Supabase operations');

// ========================================
// 1. IMMEDIATE OVERRIDE FLAGS
// ========================================

// Set flags to disable ALL other fixes IMMEDIATELY
window.EMERGENCY_SUPABASE_OVERRIDE = true;
window.DISABLE_ALL_SUPABASE_FIXES = true;

// Disable specific fixes
window.supabaseSchemaFixDisabled = true;
window.supabaseValidationFixDisabled = true;
window.supabaseAdditionalCostsFixDisabled = true;
window.supabaseConflictFixDisabled = true;
window.supabaseClientFixDisabled = true;
window.supabaseGlobalFixDisabled = true;
window.supabasePermanentFixDisabled = true;
window.supabaseRuntimeFixDisabled = true;
window.supabaseComprehensiveFixDisabled = true;
window.supabaseSchemaValidationFixDisabled = true;
window.supabaseConnectionDiagnosticDisabled = true;
window.supabaseSchemaSanitizerDisabled = true;

console.log('🛑 ALL Supabase fixes disabled by emergency override');

// ========================================
// 2. VALID COLUMNS ONLY
// ========================================

const VALID_DELIVERY_COLUMNS = [
    'id', 'dr_number', 'customer_name', 'vendor_number', 'origin', 'destination',
    'truck_type', 'truck_plate_number', 'status', 'distance', 'additional_costs',
    'created_date', 'created_at', 'updated_at', 'created_by', 'user_id',
    'item_number', 'mobile_number', 'item_description', 'serial_number'
];

// ========================================
// 3. EMERGENCY PAYLOAD SANITIZER
// ========================================

function emergencyPayloadSanitizer(payload) {
    console.log('🚨 EMERGENCY sanitization:', payload);
    
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload)) {
        return payload.map(item => emergencyPayloadSanitizer(item));
    }

    const sanitized = {};
    
    Object.keys(payload).forEach(key => {
        const value = payload[key];
        
        // Handle the problematic fields
        if (key === 'additionalCosts' || key === 'additionalCostItems' || key === 'additional_cost_items') {
            if (Array.isArray(value)) {
                const total = value.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                sanitized.additional_costs = total;
            } else {
                sanitized.additional_costs = parseFloat(value) || 0.00;
            }
            console.log(`🔄 EMERGENCY: Converted ${key} to additional_costs`);
            return;
        }
        
        // Map common camelCase fields
        const fieldMappings = {
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
            'itemNumber': 'item_number',
            'mobileNumber': 'mobile_number',
            'itemDescription': 'item_description',
            'serialNumber': 'serial_number'
        };
        
        const mappedKey = fieldMappings[key] || key;
        
        // Only include valid columns
        if (VALID_DELIVERY_COLUMNS.includes(mappedKey)) {
            sanitized[mappedKey] = value;
        } else {
            console.log(`🗑️ EMERGENCY: Removed invalid field ${key}`);
        }
    });
    
    // Ensure required fields
    if (!sanitized.created_at) sanitized.created_at = new Date().toISOString();
    if (!sanitized.updated_at) sanitized.updated_at = new Date().toISOString();
    if (!sanitized.additional_costs) sanitized.additional_costs = 0.00;
    if (!sanitized.status) sanitized.status = 'Active';
    
    console.log('✅ EMERGENCY sanitization complete:', sanitized);
    return sanitized;
}

// ========================================
// 4. EMERGENCY SUPABASE CLIENT
// ========================================

let emergencyClient = null;

async function getEmergencyClient() {
    if (emergencyClient) return emergencyClient;
    
    // Wait for Supabase library
    let attempts = 0;
    while (typeof window.supabase === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (typeof window.supabase === 'undefined') {
        console.error('🚨 EMERGENCY: Supabase library not loaded');
        return null;
    }
    
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('🚨 EMERGENCY: Supabase credentials missing');
        return null;
    }
    
    emergencyClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    
    console.log('✅ EMERGENCY client initialized');
    return emergencyClient;
}

// ========================================
// 5. EMERGENCY DELIVERY OPERATIONS
// ========================================

async function emergencyDeliveryOperation(deliveryData) {
    console.log('🚨 EMERGENCY delivery operation:', deliveryData);
    
    try {
        const client = await getEmergencyClient();
        if (!client) throw new Error('Emergency client not available');
        
        const sanitizedData = emergencyPayloadSanitizer(deliveryData);
        
        // Try insert first
        const { data, error } = await client
            .from('deliveries')
            .insert([sanitizedData])
            .select();
        
        if (!error) {
            console.log('✅ EMERGENCY insert successful');
            return { data, error: null };
        }
        
        // Handle conflicts with upsert
        if (error.code === '23505' || error.code === '409') {
            console.log('🔄 EMERGENCY conflict, trying upsert...');
            const upsertData = { ...sanitizedData };
            delete upsertData.id;
            
            const { data: upsertResult, error: upsertError } = await client
                .from('deliveries')
                .upsert([upsertData], { onConflict: 'dr_number', ignoreDuplicates: false })
                .select();
            
            if (!upsertError) {
                console.log('✅ EMERGENCY upsert successful');
                return { data: upsertResult, error: null };
            }
        }
        
        console.error('🚨 EMERGENCY operation failed:', error);
        return { data: null, error };
        
    } catch (error) {
        console.error('🚨 EMERGENCY operation exception:', error);
        return { data: null, error: { message: error.message } };
    }
}

// ========================================
// 6. IMMEDIATE FUNCTION OVERRIDES
// ========================================

function emergencyOverrideAllFunctions() {
    console.log('🚨 EMERGENCY: Overriding ALL Supabase functions immediately');
    
    // Override ALL possible function names
    const functionNames = [
        'safeInsertDelivery', 'safeDeliveryInsert', 'safeUpsertDelivery', 'safeDeliveryUpsert',
        'safeDeliveryInsertComprehensive', 'safeDeliveryInsertWithConflictHandling',
        'safeDeliveryInsertWith409', 'safeDeliveryInsertNoDuplicates',
        'safeDeliveryInsertWithCostItems', 'safeDeliveryInsertNo400',
        'completeDeliverySave', 'smartDeliverySave', 'ultimateDeliveryInsert'
    ];
    
    functionNames.forEach(funcName => {
        window[funcName] = emergencyDeliveryOperation;
    });
    
    // Override client functions
    window.supabaseClient = () => emergencyClient;
    window.getSupabaseClient = () => emergencyClient;
    window.getSafeSupabaseClient = async () => await getEmergencyClient();
    window.initializeSupabaseClient = getEmergencyClient;
    
    // Override dataService
    if (window.dataService) {
        window.dataService.saveDelivery = emergencyDeliveryOperation;
    }
    
    console.log('✅ EMERGENCY: All functions overridden');
}

// ========================================
// 7. IMMEDIATE INITIALIZATION
// ========================================

// Override functions immediately
emergencyOverrideAllFunctions();

// Keep overriding every 100ms to catch late-loading scripts
const overrideInterval = setInterval(() => {
    emergencyOverrideAllFunctions();
}, 100);

// Stop after 10 seconds
setTimeout(() => {
    clearInterval(overrideInterval);
    console.log('✅ EMERGENCY override monitoring stopped');
}, 10000);

// Initialize client
getEmergencyClient();

console.log('🚨 EMERGENCY OVERRIDE ACTIVE - All Supabase operations controlled');

// Export for debugging
window.emergencyPayloadSanitizer = emergencyPayloadSanitizer;
window.emergencyDeliveryOperation = emergencyDeliveryOperation;