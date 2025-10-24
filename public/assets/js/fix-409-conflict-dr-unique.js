/**
 * Fix 409 Conflict Error - DR Unique Constraint Issue
 * Addresses the conflict between multi-item DR functionality and unique constraints
 * 
 * This module handles:
 * - 409 Conflict errors when saving deliveries with duplicate DR numbers
 * - Multi-item DR support where same DR can have multiple items
 * - Proper error handling and retry mechanisms
 * - Database constraint conflict resolution
 */

console.log('🔧 Loading 409 Conflict DR Unique Fix...');

// Track retry attempts to prevent infinite loops
const retryAttempts = new Map();
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Handle 409 conflict errors when saving deliveries
 * @param {Object} delivery - The delivery object that caused the conflict
 * @param {Error} error - The 409 error object
 * @param {Function} originalSaveFunction - The original save function to retry
 * @returns {Promise} - Resolved delivery or rejected error
 */
async function handle409ConflictError(delivery, error, originalSaveFunction) {
    console.log('🚨 Handling 409 Conflict Error for DR:', delivery.dr_number || delivery.drNumber);

    const drNumber = delivery.dr_number || delivery.drNumber;
    const retryKey = `${drNumber}_${Date.now()}`;

    // Check retry attempts
    const currentAttempts = retryAttempts.get(drNumber) || 0;
    if (currentAttempts >= MAX_RETRY_ATTEMPTS) {
        console.error('❌ Max retry attempts reached for DR:', drNumber);
        retryAttempts.delete(drNumber);
        throw new Error(`Failed to save delivery ${drNumber} after ${MAX_RETRY_ATTEMPTS} attempts`);
    }

    // Increment retry counter
    retryAttempts.set(drNumber, currentAttempts + 1);

    try {
        // Strategy 1: Try to update existing record instead of insert
        const updatedDelivery = await tryUpdateExistingDelivery(delivery);
        if (updatedDelivery) {
            console.log('✅ Successfully updated existing delivery:', drNumber);
            retryAttempts.delete(drNumber);
            return updatedDelivery;
        }

        // Strategy 2: Add unique identifier to make record unique
        const uniqueDelivery = await addUniqueIdentifier(delivery);
        const savedDelivery = await originalSaveFunction(uniqueDelivery);

        console.log('✅ Successfully saved delivery with unique identifier:', drNumber);
        retryAttempts.delete(drNumber);
        return savedDelivery;

    } catch (retryError) {
        console.error('❌ Retry failed for DR:', drNumber, retryError);

        // If still failing, try one more strategy
        if (currentAttempts < MAX_RETRY_ATTEMPTS - 1) {
            // Strategy 3: Use composite key approach
            return await handleCompositeKeyStrategy(delivery, originalSaveFunction);
        }

        retryAttempts.delete(drNumber);
        throw retryError;
    }
}

/**
 * Try to update existing delivery record instead of creating new one
 * @param {Object} delivery - The delivery object
 * @returns {Promise<Object|null>} - Updated delivery or null if not found
 */
async function tryUpdateExistingDelivery(delivery) {
    try {
        if (!window.supabase) {
            console.log('⚠️ Supabase not available for update strategy');
            return null;
        }

        const drNumber = delivery.dr_number || delivery.drNumber;

        // First, check if record exists
        const { data: existingRecords, error: selectError } = await window.supabase
            .from('deliveries')
            .select('*')
            .eq('dr_number', drNumber)
            .limit(1);

        if (selectError) {
            console.error('Error checking existing record:', selectError);
            return null;
        }

        if (existingRecords && existingRecords.length > 0) {
            const existingRecord = existingRecords[0];

            // Update the existing record with new data
            const { data: updatedRecord, error: updateError } = await window.supabase
                .from('deliveries')
                .update({
                    ...delivery,
                    updated_at: new Date().toISOString(),
                    last_modified: new Date().toISOString()
                })
                .eq('id', existingRecord.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating existing record:', updateError);
                return null;
            }

            return updatedRecord;
        }

        return null;

    } catch (error) {
        console.error('Error in tryUpdateExistingDelivery:', error);
        return null;
    }
}

/**
 * Add unique identifier to delivery to avoid conflicts
 * @param {Object} delivery - The delivery object
 * @returns {Object} - Delivery with unique identifier
 */
function addUniqueIdentifier(delivery) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return {
        ...delivery,
        unique_id: `${delivery.dr_number || delivery.drNumber}_${timestamp}_${randomSuffix}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

/**
 * Handle composite key strategy for multi-item DRs
 * @param {Object} delivery - The delivery object
 * @param {Function} originalSaveFunction - The original save function
 * @returns {Promise<Object>} - Saved delivery
 */
async function handleCompositeKeyStrategy(delivery, originalSaveFunction) {
    try {
        // Create composite key using DR number + item details
        const itemIdentifier = delivery.serial_number ||
            delivery.serialNumber ||
            delivery.item_number ||
            delivery.itemNumber ||
            `item_${Date.now()}`;

        const compositeDelivery = {
            ...delivery,
            composite_key: `${delivery.dr_number || delivery.drNumber}_${itemIdentifier}`,
            item_sequence: await getNextItemSequence(delivery.dr_number || delivery.drNumber)
        };

        return await originalSaveFunction(compositeDelivery);

    } catch (error) {
        console.error('Composite key strategy failed:', error);
        throw error;
    }
}

/**
 * Get next item sequence number for a DR
 * @param {string} drNumber - The DR number
 * @returns {Promise<number>} - Next sequence number
 */
async function getNextItemSequence(drNumber) {
    try {
        if (!window.supabase) {
            return Math.floor(Math.random() * 1000) + 1;
        }

        const { data: existingItems, error } = await window.supabase
            .from('deliveries')
            .select('item_sequence')
            .eq('dr_number', drNumber)
            .order('item_sequence', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error getting item sequence:', error);
            return 1;
        }

        if (existingItems && existingItems.length > 0) {
            return (existingItems[0].item_sequence || 0) + 1;
        }

        return 1;

    } catch (error) {
        console.error('Error in getNextItemSequence:', error);
        return Math.floor(Math.random() * 1000) + 1;
    }
}

/**
 * Wrap the original dataService save function with 409 conflict handling
 */
function wrapDataServiceWithConflictHandling() {
    if (typeof window.dataService === 'undefined') {
        console.log('⚠️ DataService not available yet, will wrap when available');
        return;
    }

    const originalSaveDelivery = window.dataService.saveDelivery;

    if (typeof originalSaveDelivery !== 'function') {
        console.log('⚠️ saveDelivery function not found in dataService');
        return;
    }

    // Wrap the save function
    window.dataService.saveDelivery = async function (delivery) {
        try {
            return await originalSaveDelivery.call(this, delivery);
        } catch (error) {
            // Check if it's a 409 conflict error
            if (error.code === '23505' || // PostgreSQL unique violation
                error.message?.includes('duplicate key') ||
                error.message?.includes('unique constraint') ||
                error.status === 409) {

                console.log('🔄 Detected 409 conflict, attempting resolution...');
                return await handle409ConflictError(delivery, error, originalSaveDelivery.bind(this));
            }

            // Re-throw other errors
            throw error;
        }
    };

    console.log('✅ DataService wrapped with 409 conflict handling');
}

/**
 * Wrap Supabase operations with conflict handling
 */
function wrapSupabaseWithConflictHandling() {
    if (typeof window.supabase === 'undefined') {
        console.log('⚠️ Supabase not available yet, will wrap when available');
        return;
    }

    // Store original insert method
    const originalInsert = window.supabase.from('deliveries').insert;

    // Override the insert method for deliveries table
    const originalFrom = window.supabase.from;
    window.supabase.from = function (tableName) {
        const table = originalFrom.call(this, tableName);

        if (tableName === 'deliveries') {
            const originalTableInsert = table.insert;
            table.insert = async function (data) {
                try {
                    return await originalTableInsert.call(this, data);
                } catch (error) {
                    if (error.code === '23505' || error.message?.includes('duplicate key')) {
                        console.log('🔄 Supabase insert conflict detected, handling...');

                        // If it's an array, handle each item
                        if (Array.isArray(data)) {
                            const results = [];
                            for (const item of data) {
                                try {
                                    const result = await handle409ConflictError(item, error,
                                        async (delivery) => await originalTableInsert.call(this, delivery));
                                    results.push(result);
                                } catch (itemError) {
                                    console.error('Failed to handle conflict for item:', item, itemError);
                                    throw itemError;
                                }
                            }
                            return { data: results, error: null };
                        } else {
                            const result = await handle409ConflictError(data, error,
                                async (delivery) => await originalTableInsert.call(this, delivery));
                            return { data: [result], error: null };
                        }
                    }
                    throw error;
                }
            };
        }

        return table;
    };

    console.log('✅ Supabase wrapped with 409 conflict handling');
}

/**
 * Initialize conflict handling when dependencies are ready
 */
function initializeConflictHandling() {
    // Wrap dataService if available
    wrapDataServiceWithConflictHandling();

    // Wrap Supabase if available
    wrapSupabaseWithConflictHandling();

    // Set up periodic check for dependencies
    const checkInterval = setInterval(() => {
        let allReady = true;

        if (typeof window.dataService !== 'undefined' &&
            typeof window.dataService.saveDelivery === 'function' &&
            !window.dataService.saveDelivery.toString().includes('409 conflict')) {
            wrapDataServiceWithConflictHandling();
        }

        if (typeof window.supabase !== 'undefined' &&
            !window.supabase.from.toString().includes('conflict detected')) {
            wrapSupabaseWithConflictHandling();
        }

        // Clear interval after 30 seconds
        if (Date.now() - startTime > 30000) {
            clearInterval(checkInterval);
        }
    }, 1000);

    const startTime = Date.now();
}

/**
 * Clean up retry attempts periodically
 */
function cleanupRetryAttempts() {
    setInterval(() => {
        const now = Date.now();
        for (const [key, attempts] of retryAttempts.entries()) {
            // Clean up entries older than 5 minutes
            if (now - attempts.timestamp > 5 * 60 * 1000) {
                retryAttempts.delete(key);
            }
        }
    }, 60000); // Run every minute
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initializing 409 Conflict DR Unique Fix...');
    initializeConflictHandling();
    cleanupRetryAttempts();
});

// Also initialize immediately in case DOM is already ready
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already ready
    initializeConflictHandling();
    cleanupRetryAttempts();
}

// Make functions globally available for debugging
window.handle409ConflictError = handle409ConflictError;
window.tryUpdateExistingDelivery = tryUpdateExistingDelivery;
window.addUniqueIdentifier = addUniqueIdentifier;

console.log('✅ 409 Conflict DR Unique Fix loaded successfully');