/**
 * SUPABASE 409 CONFLICT FIX
 * Fixes the 409 Conflict error when inserting deliveries
 * 
 * 409 Conflict occurs when:
 * 1. Duplicate dr_number (most common)
 * 2. Duplicate unique constraint violation
 * 3. Concurrent insert attempts
 */

console.log('🔧 Loading Supabase 409 Conflict Fix...');

/**
 * Handle 409 conflict by converting to upsert operation
 */
async function handle409Conflict(originalData, conflictError) {
    console.log('🔄 Handling 409 conflict...', { originalData, conflictError });
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Determine the conflict field from error details
        let conflictField = 'dr_number'; // Default assumption
        
        if (conflictError.details) {
            if (conflictError.details.includes('dr_number')) {
                conflictField = 'dr_number';
            } else if (conflictError.details.includes('id')) {
                conflictField = 'id';
            }
        }

        console.log(`🔍 Detected conflict on field: ${conflictField}`);

        // Try upsert operation
        const upsertData = { ...originalData };
        delete upsertData.id; // Remove ID to let Supabase handle it
        upsertData.updated_at = new Date().toISOString();

        console.log('🔄 Attempting upsert operation...', upsertData);
        
        const { data, error } = await client
            .from('deliveries')
            .upsert([upsertData], {
                onConflict: conflictField,
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Upsert also failed:', error);
            return { data: null, error };
        }

        console.log('✅ 409 conflict resolved via upsert:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Failed to handle 409 conflict:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Safe delivery insert with 409 conflict handling
 */
async function safeDeliveryInsertWith409Handling(deliveryData) {
    console.log('💾 Safe delivery insert with 409 handling...', deliveryData);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // First attempt: normal insert
        console.log('📤 Attempting normal insert...');
        
        const { data, error } = await client
            .from('deliveries')
            .insert([deliveryData])
            .select();

        if (error) {
            if (error.code === '409' || error.status === 409) {
                console.log('🔄 409 conflict detected, attempting resolution...');
                return await handle409Conflict(deliveryData, error);
            } else {
                console.error('❌ Insert failed with non-409 error:', error);
                return { data: null, error };
            }
        }

        console.log('✅ Normal insert successful:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Safe delivery insert with 409 handling failed:', error);
        
        // Check if it's a 409 conflict in the catch block
        if (error.message && error.message.includes('409')) {
            console.log('🔄 Caught 409 conflict, attempting resolution...');
            return await handle409Conflict(deliveryData, error);
        }
        
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Enhanced upsert that handles all conflict scenarios
 */
async function enhancedUpsertDelivery(deliveryData) {
    console.log('🔄 Enhanced upsert delivery...', deliveryData);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Prepare data for upsert
        const upsertData = { ...deliveryData };
        
        // Remove ID to let Supabase handle it
        delete upsertData.id;
        
        // Ensure timestamps
        if (!upsertData.created_at) {
            upsertData.created_at = new Date().toISOString();
        }
        upsertData.updated_at = new Date().toISOString();

        // Determine conflict resolution field
        const conflictField = upsertData.dr_number ? 'dr_number' : 'id';

        console.log(`🔄 Upserting with conflict resolution on: ${conflictField}`);
        
        const { data, error } = await client
            .from('deliveries')
            .upsert([upsertData], {
                onConflict: conflictField,
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Enhanced upsert failed:', error);
            return { data: null, error };
        }

        console.log('✅ Enhanced upsert successful:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Enhanced upsert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Check for existing delivery by DR number
 */
async function checkExistingDelivery(drNumber) {
    console.log('🔍 Checking for existing delivery:', drNumber);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        const { data, error } = await client
            .from('deliveries')
            .select('id, dr_number, created_at')
            .eq('dr_number', drNumber)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Error checking existing delivery:', error);
            return { exists: false, data: null, error: error.message };
        }

        if (data) {
            console.log('✅ Existing delivery found:', data);
            return { exists: true, data, error: null };
        } else {
            console.log('✅ No existing delivery found');
            return { exists: false, data: null, error: null };
        }

    } catch (error) {
        console.error('❌ Failed to check existing delivery:', error);
        return { exists: false, data: null, error: error.message };
    }
}

/**
 * Smart delivery save that chooses insert vs update
 */
async function smartDeliverySave(deliveryData) {
    console.log('🧠 Smart delivery save...', deliveryData);
    
    try {
        // Check if delivery already exists
        if (deliveryData.dr_number) {
            const existingCheck = await checkExistingDelivery(deliveryData.dr_number);
            
            if (existingCheck.exists) {
                console.log('📝 Delivery exists, updating...');
                
                const client = await window.getSafeSupabaseClient();
                if (!client) {
                    throw new Error('Supabase client not available');
                }

                const updateData = { ...deliveryData };
                delete updateData.id; // Remove ID to avoid conflicts
                updateData.updated_at = new Date().toISOString();

                const { data, error } = await client
                    .from('deliveries')
                    .update(updateData)
                    .eq('id', existingCheck.data.id)
                    .select();

                if (error) {
                    console.error('❌ Update failed:', error);
                    return { data: null, error };
                }

                console.log('✅ Delivery updated successfully:', data);
                return { data, error: null };
            }
        }

        // No existing delivery, try insert with 409 handling
        console.log('➕ No existing delivery, inserting...');
        return await safeDeliveryInsertWith409Handling(deliveryData);

    } catch (error) {
        console.error('❌ Smart delivery save failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Initialize the 409 conflict fix
 */
function initialize409ConflictFix() {
    console.log('🚀 Initializing 409 Conflict Fix...');
    
    // Export functions globally
    window.handle409Conflict = handle409Conflict;
    window.safeDeliveryInsertWith409Handling = safeDeliveryInsertWith409Handling;
    window.enhancedUpsertDelivery = enhancedUpsertDelivery;
    window.checkExistingDelivery = checkExistingDelivery;
    window.smartDeliverySave = smartDeliverySave;
    
    // Override existing functions with 409-aware versions
    if (window.safeUpsertDelivery) {
        window.original409SafeUpsertDelivery = window.safeUpsertDelivery;
        window.safeUpsertDelivery = enhancedUpsertDelivery;
    }
    
    if (window.safeInsertDelivery) {
        window.original409SafeInsertDelivery = window.safeInsertDelivery;
        window.safeInsertDelivery = smartDeliverySave;
    }
    
    console.log('✅ 409 Conflict Fix initialized successfully');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('conflict409FixReady', {
        detail: { 
            functions: [
                'safeDeliveryInsertWith409Handling',
                'enhancedUpsertDelivery',
                'smartDeliverySave'
            ]
        }
    }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize409ConflictFix);
} else {
    initialize409ConflictFix();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.conflict409FixInitialized) {
        console.log('🔄 Backup 409 Conflict Fix initialization...');
        initialize409ConflictFix();
        window.conflict409FixInitialized = true;
    }
});

console.log('✅ Supabase 409 Conflict Fix loaded');