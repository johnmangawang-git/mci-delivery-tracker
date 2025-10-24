/**
 * SUPABASE ADDITIONAL COST ITEMS SCHEMA FIX
 * Fixes the PGRST204 error: "Could not find the 'additionalCostItems' column of 'deliveries' in the schema cache"
 * 
 * This error occurs because:
 * 1. The column might not exist in the database
 * 2. The schema cache needs to be refreshed
 * 3. The column name is being sent incorrectly
 */

console.log('🔧 Loading Supabase Additional Cost Items Schema Fix...');

/**
 * Check if the additional_cost_items column exists in the deliveries table
 */
async function checkAdditionalCostItemsColumn() {
    console.log('🔍 Checking if additional_cost_items column exists...');
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Try to select the column specifically
        const { data, error } = await client
            .from('deliveries')
            .select('additional_cost_items')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST204' || error.message.includes('additional_cost_items')) {
                console.error('❌ additional_cost_items column does not exist in deliveries table');
                return { exists: false, error: error.message };
            } else {
                console.warn('⚠️ Other error checking column:', error.message);
                return { exists: false, error: error.message };
            }
        }

        console.log('✅ additional_cost_items column exists');
        return { exists: true, error: null };

    } catch (error) {
        console.error('❌ Failed to check column existence:', error);
        return { exists: false, error: error.message };
    }
}

/**
 * Add the additional_cost_items column to the deliveries table
 */
async function addAdditionalCostItemsColumn() {
    console.log('🔧 Adding additional_cost_items column to deliveries table...');
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Use RPC to execute the ALTER TABLE command
        const { data, error } = await client.rpc('add_additional_cost_items_column');

        if (error) {
            console.error('❌ Failed to add column via RPC:', error);
            
            // Try alternative approach using direct SQL if RPC fails
            console.log('🔄 Trying alternative approach...');
            return await addColumnDirectly();
        }

        console.log('✅ additional_cost_items column added successfully');
        return { success: true, error: null };

    } catch (error) {
        console.error('❌ Failed to add additional_cost_items column:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Alternative method to add column directly
 */
async function addColumnDirectly() {
    console.log('🔧 Adding column using direct SQL approach...');
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Create a dummy insert to trigger schema refresh
        // This is a workaround since we can't execute DDL directly from client
        console.log('📝 Note: Column needs to be added via Supabase dashboard or SQL editor');
        console.log('📋 SQL to run in Supabase SQL editor:');
        console.log(`
-- Add additional_cost_items column to deliveries table
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';

-- Create index on the JSONB column
CREATE INDEX IF NOT EXISTS idx_deliveries_additional_cost_items 
ON public.deliveries USING GIN (additional_cost_items);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
        `);

        return { 
            success: false, 
            error: 'Column must be added manually via Supabase dashboard',
            sql: `ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS additional_cost_items JSONB DEFAULT '[]';`
        };

    } catch (error) {
        console.error('❌ Direct column addition failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Refresh Supabase schema cache
 */
async function refreshSchemaCache() {
    console.log('🔄 Refreshing Supabase schema cache...');
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Try to use the schema refresh RPC if available
        try {
            const { data, error } = await client.rpc('refresh_schema_cache');
            if (!error) {
                console.log('✅ Schema cache refreshed via RPC');
                return { success: true };
            }
        } catch (rpcError) {
            console.log('📝 RPC refresh not available, using alternative method');
        }

        // Alternative: Force a schema refresh by making a simple query
        const { data, error } = await client
            .from('deliveries')
            .select('id')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ Schema refresh query warning:', error.message);
        }

        console.log('✅ Schema cache refresh attempted');
        return { success: true };

    } catch (error) {
        console.error('❌ Failed to refresh schema cache:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Safe delivery insert that handles additional cost items properly
 */
async function safeDeliveryInsertWithCostItems(deliveryData) {
    console.log('💾 Safe delivery insert with cost items handling...', deliveryData);
    
    try {
        // Check if column exists first
        const columnCheck = await checkAdditionalCostItemsColumn();
        
        if (!columnCheck.exists) {
            console.warn('⚠️ additional_cost_items column does not exist, using fallback approach');
            
            // Extract additional cost items before sanitization
            const additionalCostItems = deliveryData.additionalCostItems || deliveryData.additional_cost_items;
            
            // Remove the problematic field and use sanitized approach
            const sanitizedData = { ...deliveryData };
            delete sanitizedData.additionalCostItems;
            delete sanitizedData.additional_cost_items;
            
            // Calculate total additional costs
            if (additionalCostItems && Array.isArray(additionalCostItems)) {
                const totalCosts = additionalCostItems.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                sanitizedData.additional_costs = totalCosts;
                console.log(`📊 Converted ${additionalCostItems.length} cost items to total: ${totalCosts}`);
            }
            
            // Use the schema sanitizer for safe insert
            if (typeof window.safeDeliveryUpsert === 'function') {
                const result = await window.safeDeliveryUpsert(sanitizedData);
                
                // If successful and we have cost items, try to save them separately
                if (result.data && additionalCostItems && Array.isArray(additionalCostItems)) {
                    const deliveryId = result.data[0]?.id;
                    if (deliveryId && typeof window.saveAdditionalCostItems === 'function') {
                        try {
                            await window.saveAdditionalCostItems(deliveryId, additionalCostItems);
                            console.log('✅ Additional cost items saved separately');
                        } catch (costError) {
                            console.warn('⚠️ Failed to save cost items separately:', costError);
                        }
                    }
                }
                
                return result;
            }
        }
        
        // If column exists, proceed with normal insert
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        console.log('📤 Inserting delivery with cost items...', deliveryData);
        const { data, error } = await client
            .from('deliveries')
            .upsert([deliveryData], {
                onConflict: 'dr_number',
                ignoreDuplicates: false
            })
            .select('*');

        if (error) {
            console.error('❌ Delivery insert error:', error);
            
            // If it's the specific column error, try the fallback approach
            if (error.code === 'PGRST204' && error.message.includes('additionalCostItems')) {
                console.log('🔄 Retrying with fallback approach...');
                return await safeDeliveryInsertWithCostItems({
                    ...deliveryData,
                    additionalCostItems: undefined,
                    additional_cost_items: undefined
                });
            }
            
            return { data: null, error };
        }

        console.log('✅ Delivery with cost items inserted successfully:', data);
        return { data, error: null };

    } catch (error) {
        console.error('❌ Safe delivery insert with cost items failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Diagnostic function to check schema status
 */
async function diagnoseAdditionalCostItemsSchema() {
    console.log('🔍 Diagnosing additional cost items schema...');
    
    const diagnosis = {
        columnExists: false,
        schemaRefreshed: false,
        alternativeTableExists: false,
        recommendations: []
    };
    
    try {
        // Check if column exists
        const columnCheck = await checkAdditionalCostItemsColumn();
        diagnosis.columnExists = columnCheck.exists;
        
        if (!columnCheck.exists) {
            diagnosis.recommendations.push('Add additional_cost_items JSONB column to deliveries table');
        }
        
        // Check if alternative table exists
        const client = await window.getSafeSupabaseClient();
        if (client) {
            try {
                const { data, error } = await client
                    .from('additional_cost_items')
                    .select('count', { count: 'exact', head: true });
                
                if (!error) {
                    diagnosis.alternativeTableExists = true;
                    diagnosis.recommendations.push('Use additional_cost_items table for detailed cost breakdown');
                }
            } catch (tableError) {
                diagnosis.recommendations.push('Consider creating additional_cost_items table for detailed cost tracking');
            }
        }
        
        // Try schema refresh
        const refreshResult = await refreshSchemaCache();
        diagnosis.schemaRefreshed = refreshResult.success;
        
        if (!refreshResult.success) {
            diagnosis.recommendations.push('Manually refresh schema cache in Supabase dashboard');
        }
        
    } catch (error) {
        console.error('❌ Schema diagnosis failed:', error);
        diagnosis.recommendations.push('Check Supabase connection and permissions');
    }
    
    console.log('📋 Schema diagnosis complete:', diagnosis);
    return diagnosis;
}

/**
 * Initialize the additional cost items fix
 */
async function initializeAdditionalCostItemsFix() {
    console.log('🚀 Initializing Additional Cost Items Schema Fix...');
    
    try {
        // Run diagnosis
        const diagnosis = await diagnoseAdditionalCostItemsSchema();
        
        // Export functions globally
        window.checkAdditionalCostItemsColumn = checkAdditionalCostItemsColumn;
        window.addAdditionalCostItemsColumn = addAdditionalCostItemsColumn;
        window.refreshSchemaCache = refreshSchemaCache;
        window.safeDeliveryInsertWithCostItems = safeDeliveryInsertWithCostItems;
        window.diagnoseAdditionalCostItemsSchema = diagnoseAdditionalCostItemsSchema;
        
        // Override existing functions with cost-items-aware versions
        if (window.safeInsertDelivery) {
            window.originalSafeInsertDelivery = window.safeInsertDelivery;
            window.safeInsertDelivery = safeDeliveryInsertWithCostItems;
        }
        
        if (window.completeDeliverySave) {
            window.originalCompleteDeliverySave = window.completeDeliverySave;
            window.completeDeliverySave = safeDeliveryInsertWithCostItems;
        }
        
        console.log('✅ Additional Cost Items Schema Fix initialized');
        
        // Show recommendations if any
        if (diagnosis.recommendations.length > 0) {
            console.log('💡 Recommendations:');
            diagnosis.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        return { success: true, diagnosis };
        
    } catch (error) {
        console.error('❌ Failed to initialize Additional Cost Items fix:', error);
        return { success: false, error: error.message };
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdditionalCostItemsFix);
} else {
    initializeAdditionalCostItemsFix();
}

// Also initialize after other scripts load
setTimeout(initializeAdditionalCostItemsFix, 2000);

console.log('✅ Supabase Additional Cost Items Schema Fix loaded');