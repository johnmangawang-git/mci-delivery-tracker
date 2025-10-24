/**
 * SUPABASE DUPLICATE ID FIX
 * Fixes the 23505 error: "duplicate key value violates unique constraint 'deliveries_pkey'"
 * 
 * This error occurs when:
 * 1. The same UUID is being reused for multiple inserts
 * 2. Client-side generated IDs conflict with existing records
 * 3. Multiple rapid insert attempts with the same data
 */

console.log('🔧 Loading Supabase Duplicate ID Fix...');

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
 * Check if a delivery ID already exists
 */
async function checkDeliveryIdExists(id) {
    console.log('🔍 Checking if delivery ID exists:', id);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        const { data, error } = await client
            .from('deliveries')
            .select('id')
            .eq('id', id)
            .single();

        if (error && error.code === 'PGRST116') {
            // No rows found - ID is available
            console.log('✅ ID is available:', id);
            return { exists: false, error: null };
        } else if (error) {
            console.error('❌ Error checking ID:', error);
            return { exists: false, error: error.message };
        } else {
            console.log('⚠️ ID already exists:', id);
            return { exists: true, error: null };
        }

    } catch (error) {
        console.error('❌ Failed to check ID existence:', error);
        return { exists: false, error: error.message };
    }
}

/**
 * Check if a DR number already exists
 */
async function checkDrNumberExists(drNumber) {
    console.log('🔍 Checking if DR number exists:', drNumber);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        const { data, error } = await client
            .from('deliveries')
            .select('id, dr_number')
            .eq('dr_number', drNumber)
            .single();

        if (error && error.code === 'PGRST116') {
            // No rows found - DR number is available
            console.log('✅ DR number is available:', drNumber);
            return { exists: false, existingId: null, error: null };
        } else if (error) {
            console.error('❌ Error checking DR number:', error);
            return { exists: false, existingId: null, error: error.message };
        } else {
            console.log('⚠️ DR number already exists:', drNumber, 'with ID:', data.id);
            return { exists: true, existingId: data.id, error: null };
        }

    } catch (error) {
        console.error('❌ Failed to check DR number existence:', error);
        return { exists: false, existingId: null, error: error.message };
    }
}

/**
 * Safe delivery insert that handles duplicate IDs and DR numbers
 */
async function safeDeliveryInsertNoDuplicates(deliveryData) {
    console.log('💾 Safe delivery insert with duplicate prevention...', deliveryData);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Step 1: Check if DR number already exists
        if (deliveryData.dr_number) {
            const drCheck = await checkDrNumberExists(deliveryData.dr_number);
            if (drCheck.exists) {
                console.log('🔄 DR number exists, updating existing record...');
                
                // Update existing record instead of inserting
                const updateData = { ...deliveryData };
                delete updateData.id; // Remove ID to avoid conflicts
                updateData.updated_at = new Date().toISOString();
                
                const { data, error } = await client
                    .from('deliveries')
                    .update(updateData)
                    .eq('id', drCheck.existingId)
                    .select();

                if (error) {
                    console.error('❌ Update failed:', error);
                    return { data: null, error };
                }

                console.log('✅ Existing delivery updated:', data);
                return { data, error: null };
            }
        }

        // Step 2: Handle ID conflicts
        let finalData = { ...deliveryData };
        
        if (finalData.id) {
            // Check if the provided ID already exists
            const idCheck = await checkDeliveryIdExists(finalData.id);
            if (idCheck.exists) {
                console.log('⚠️ Provided ID already exists, generating new one...');
                finalData.id = generateUniqueId();
                console.log('🆔 Generated new ID:', finalData.id);
            }
        } else {
            // Generate new ID if none provided
            finalData.id = generateUniqueId();
            console.log('🆔 Generated ID for new delivery:', finalData.id);
        }

        // Step 3: Ensure timestamps
        if (!finalData.created_at) {
            finalData.created_at = new Date().toISOString();
        }
        if (!finalData.updated_at) {
            finalData.updated_at = new Date().toISOString();
        }

        // Step 4: Attempt insert with retry logic
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
                        console.log('🆔 New ID generated:', finalData.id);
                        continue;
                    } else if (error.code === '23505' && error.message.includes('dr_number')) {
                        // Duplicate DR number - this shouldn't happen as we checked above
                        console.error('❌ Unexpected duplicate DR number:', error);
                        return { data: null, error };
                    } else {
                        // Other error
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
                // Generate new ID for retry
                finalData.id = generateUniqueId();
            }
        }

        return { data: null, error: { message: 'Max insert attempts exceeded' } };

    } catch (error) {
        console.error('❌ Safe delivery insert failed:', error);
        return { data: null, error: { message: error.message } };
    }
}

/**
 * Safe delivery upsert that handles duplicates properly
 */
async function safeDeliveryUpsertNoDuplicates(deliveryData) {
    console.log('🔄 Safe delivery upsert with duplicate prevention...', deliveryData);
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Prepare data for upsert
        let finalData = { ...deliveryData };
        
        // Remove ID for upsert to let Supabase handle it
        delete finalData.id;
        
        // Ensure timestamps
        if (!finalData.created_at) {
            finalData.created_at = new Date().toISOString();
        }
        finalData.updated_at = new Date().toISOString();

        // Use upsert with dr_number as conflict resolution
        console.log('🔄 Upserting with dr_number conflict resolution...');
        const { data, error } = await client
            .from('deliveries')
            .upsert([finalData], {
                onConflict: 'dr_number',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Upsert failed:', error);
            
            // If upsert fails due to ID conflict, try insert with new ID
            if (error.code === '23505' && error.message.includes('deliveries_pkey')) {
                console.log('🔄 Upsert failed due to ID conflict, trying insert...');
                return await safeDeliveryInsertNoDuplicates(deliveryData);
            }
            
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
 * Clean up duplicate deliveries (utility function)
 */
async function cleanupDuplicateDeliveries() {
    console.log('🧹 Cleaning up duplicate deliveries...');
    
    try {
        const client = await window.getSafeSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }

        // Find duplicate DR numbers
        const { data: duplicates, error } = await client
            .from('deliveries')
            .select('dr_number, id, created_at')
            .order('dr_number')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Failed to fetch duplicates:', error);
            return { cleaned: 0, error: error.message };
        }

        // Group by DR number and keep only the latest
        const drGroups = {};
        duplicates.forEach(delivery => {
            if (!drGroups[delivery.dr_number]) {
                drGroups[delivery.dr_number] = [];
            }
            drGroups[delivery.dr_number].push(delivery);
        });

        let cleanedCount = 0;
        for (const [drNumber, deliveries] of Object.entries(drGroups)) {
            if (deliveries.length > 1) {
                // Keep the first (latest) and delete the rest
                const toDelete = deliveries.slice(1);
                console.log(`🗑️ Removing ${toDelete.length} duplicates for DR: ${drNumber}`);
                
                for (const duplicate of toDelete) {
                    const { error: deleteError } = await client
                        .from('deliveries')
                        .delete()
                        .eq('id', duplicate.id);
                    
                    if (deleteError) {
                        console.error('❌ Failed to delete duplicate:', deleteError);
                    } else {
                        cleanedCount++;
                    }
                }
            }
        }

        console.log(`✅ Cleanup complete. Removed ${cleanedCount} duplicate deliveries`);
        return { cleaned: cleanedCount, error: null };

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        return { cleaned: 0, error: error.message };
    }
}

/**
 * Initialize the duplicate ID fix
 */
function initializeDuplicateIdFix() {
    console.log('🚀 Initializing Duplicate ID Fix...');
    
    // Export functions globally
    window.generateUniqueId = generateUniqueId;
    window.checkDeliveryIdExists = checkDeliveryIdExists;
    window.checkDrNumberExists = checkDrNumberExists;
    window.safeDeliveryInsertNoDuplicates = safeDeliveryInsertNoDuplicates;
    window.safeDeliveryUpsertNoDuplicates = safeDeliveryUpsertNoDuplicates;
    window.cleanupDuplicateDeliveries = cleanupDuplicateDeliveries;
    
    // Override existing functions with duplicate-safe versions
    if (window.safeInsertDelivery) {
        window.originalSafeInsertDelivery = window.safeInsertDelivery;
        window.safeInsertDelivery = safeDeliveryInsertNoDuplicates;
    }
    
    if (window.safeUpsertDelivery) {
        window.originalSafeUpsertDelivery = window.safeUpsertDelivery;
        window.safeUpsertDelivery = safeDeliveryUpsertNoDuplicates;
    }
    
    if (window.safeDeliveryInsert) {
        window.originalSafeDeliveryInsert = window.safeDeliveryInsert;
        window.safeDeliveryInsert = safeDeliveryInsertNoDuplicates;
    }
    
    if (window.safeDeliveryUpsert) {
        window.originalSafeDeliveryUpsert = window.safeDeliveryUpsert;
        window.safeDeliveryUpsert = safeDeliveryUpsertNoDuplicates;
    }
    
    console.log('✅ Duplicate ID Fix initialized successfully');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('duplicateIdFixReady', {
        detail: { 
            functions: [
                'safeDeliveryInsertNoDuplicates',
                'safeDeliveryUpsertNoDuplicates',
                'cleanupDuplicateDeliveries'
            ]
        }
    }));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDuplicateIdFix);
} else {
    initializeDuplicateIdFix();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
    if (!window.duplicateIdFixInitialized) {
        console.log('🔄 Backup Duplicate ID Fix initialization...');
        initializeDuplicateIdFix();
        window.duplicateIdFixInitialized = true;
    }
});

console.log('✅ Supabase Duplicate ID Fix loaded');